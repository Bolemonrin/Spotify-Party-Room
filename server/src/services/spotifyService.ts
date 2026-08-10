import session from "express-session";
import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../prisma.js";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const CLIENT_ID = requireEnv("CLIENT_ID");
const CLIENT_SECRET = requireEnv("CLIENT_SECRET");
const SCOPES = requireEnv("SCOPES");
const REDIRECT_URI = requireEnv("REDIRECT_URI");

const BASE_URL = "https://api.spotify.com/v1/me/";
const BASE_REFRESH_URL = "https://accounts.spotify.com/api/token";

type Method = "GET" | "POST" | "PUT";

const ACTION_ENDPOINTS = {
  play: "player/play",
  pause: "player/pause",
  skip: "player/next",
} as const;

export type Action = keyof typeof ACTION_ENDPOINTS;

export function isAction(value: unknown): value is Action {
  // hasOwn, not `in` — `in` walks the prototype chain, so "toString" would pass
  return typeof value === "string" && Object.hasOwn(ACTION_ENDPOINTS, value);
}

type SpotifyTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
};

export function buildAuth(state: string) {
  const params = new URLSearchParams({
    scope: SCOPES,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    state,
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function getUserTokens(sessionId: string) {
  return await prisma.spotifyToken.findUnique({ where: { user: sessionId } });
}

export async function updateOrCreateToken({
  sessionId,
  accessToken,
  tokenType,
  expiresIn,
  refreshToken,
}: {
  sessionId: string;
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  refreshToken: string;
}) {
  const timeToExpire = new Date(Date.now() + expiresIn * 1000);

  return await prisma.spotifyToken.upsert({
    where: { user: sessionId },
    update: {
      accessToken: accessToken,
      refreshToken: refreshToken,
      expiresAt: timeToExpire,
      tokenType: tokenType,
    },
    create: {
      user: sessionId,
      accessToken: accessToken,
      refreshToken: refreshToken,
      expiresAt: timeToExpire,
      tokenType: tokenType,
    },
  });
}

export async function requestAccessToken(sessionId: string, code: string) {
  const res = await fetch(BASE_REFRESH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  if (!res.ok) return null;

  const data = (await res.json()) as SpotifyTokenResponse;

  // The authorization_code grant always returns a refresh_token; without one
  // the session could never be renewed, so treat it as a failed exchange.
  if (!data.refresh_token) return null;

  return await updateOrCreateToken({
    sessionId,
    accessToken: data.access_token,
    tokenType: data.token_type,
    expiresIn: data.expires_in,
    refreshToken: data.refresh_token,
  });
}

export async function refreshSpotifyToken(sessionId: string) {
  const token = await getUserTokens(sessionId);
  if (!token) return null;

  const refreshToken = token.refreshToken;

  const res = await fetch(BASE_REFRESH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  if (!res.ok) {
    // 400 invalid_grant means the refresh token is revoked and will never work
    // again. 429/5xx are transient, so keep the row and let the next call retry.
    if (res.status === 400) {
      await prisma.spotifyToken.deleteMany({ where: { user: sessionId } });
    }
    return null;
  }

  const data = (await res.json()) as SpotifyTokenResponse;

  return await updateOrCreateToken({
    sessionId,
    accessToken: data.access_token,
    tokenType: data.token_type,
    expiresIn: data.expires_in,
    refreshToken: data.refresh_token ?? refreshToken,
  });
}

export async function isSpotifyAuthenticated(sessionId: string) {
  const tokens = await getUserTokens(sessionId);
  if (!tokens) return false;

  if (tokens.expiresAt <= new Date(Date.now() + 60_000)) {
    const refreshed = await refreshSpotifyToken(sessionId);
    return refreshed !== null;
  }

  return true;
}

/**
 * Calls a Spotify Web API endpoint as the given session, refreshing the access
 * token first if it is within a minute of expiring.
 *
 * Returns one of three shapes so callers can tell the cases apart:
 *   { Error: "unauthenticated" } - no tokens stored, or the refresh failed
 *   { Error: "request-failed" }  - Spotify answered non-2xx, or sent unparseable JSON
 *   { noContent: true }          - HTTP 204: command succeeded, or nothing is playing
 * Anything else is the parsed JSON body.
 */
export async function executeSpotifyRequest({
  sessionId,
  endpoint,
  method,
}: {
  sessionId: string;
  endpoint: string;
  method: Method;
}) {
  let token = await getUserTokens(sessionId);
  if (!token) return { Error: "unauthenticated" as const };

  if (token.expiresAt <= new Date(Date.now() + 60_000)) {
    await refreshSpotifyToken(sessionId);
    token = await getUserTokens(sessionId);
    if (!token) return { Error: "unauthenticated" as const };
  }

  const res = await fetch(BASE_URL + endpoint, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token.accessToken}`,
    },
  });

  // 204 means the command succeeded with no body (play/pause/skip), or that
  // nothing is currently playing. Distinct from a failure — callers decide.
  if (res.status === 204) return { noContent: true as const };
  if (!res.ok) return { Error: "request-failed" as const };

  try {
    return await res.json();
  } catch {
    return { Error: "request-failed" as const };
  }
}

export async function spotifyAction(sessionId: string, action: Action) {
  const endpoint = ACTION_ENDPOINTS[action];
  const method: Method = action === "skip" ? "POST" : "PUT";
  return await executeSpotifyRequest({ sessionId, endpoint, method });
}

export async function updateRoomSong(roomCode: string, songId: string) {
  const room = await prisma.room.findUnique({ where: { code: roomCode } });
  if (!room) return null;

  // Still the same track: leave the votes alone. The client polls this once a
  // second, so returning early is what stops votes being wiped continuously.
  if (room.currentSong === songId) return room;

  // Nested writes run in one transaction, so the song never changes without
  // the stale votes going with it.
  return await prisma.room.update({
    where: { code: roomCode },
    data: {
      currentSong: songId,
      votes: { deleteMany: {} },
    },
  });
}

export async function registerVote(
  roomId: number,
  user: string,
  songId: string,
) {
  // Upsert on the compound unique so a user pressing skip twice counts once
  await prisma.vote.upsert({
    where: { roomId_user_songId: { roomId, user, songId } },
    update: {},
    create: { roomId, user, songId },
  });

  return await prisma.vote.count({ where: { roomId, songId } });
}

export async function clearVotes(roomId: number, songId: string) {
  return await prisma.vote.deleteMany({ where: { roomId, songId } });
}

export async function getVoteCount(roomCode: string, songId: string){
  const room = await prisma.room.findUnique({ where: { code: roomCode } });
  if (!room) return null;

  return await prisma.vote.count({
    where: {roomId: room.id, songId: songId}
  })
}
