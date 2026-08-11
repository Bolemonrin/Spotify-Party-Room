import type { Request, Response } from "express";
import * as spotifyService from "../services/spotifyService.js";
import { getRoomByCode } from "../services/roomService.js";
import { randomBytes } from "node:crypto";
import { frontendUrl } from "../config.js";

type SpotifyTrack = {
  id: string;
  name: string;
  duration_ms: number;
  album: { images: { url: string }[] };
  artists: { name: string }[];
};

type CurrentlyPlaying = {
  item: SpotifyTrack | null;
  progress_ms: number | null;
  is_playing: boolean;
};

export async function authView(req: Request, res: Response) {
  const state = randomBytes(16).toString("hex");
  req.session.spotifyAuthState = state;
  const url = spotifyService.buildAuth(state);

  if (!url) return res.status(401).json({ message: "invalid url" });

  res.status(200).json({ url });
}

export async function spotifyCallback(req: Request, res: Response) {
  const expected = req.session.spotifyAuthState;
  delete req.session.spotifyAuthState;

  if (!expected || req.query.state !== expected)
    return res.status(400).json({ message: "Invalid state" });

  // Spotify sends ?error=access_denied rather than a code when the user declines
  if (typeof req.query.error === "string")
    return res
      .status(400)
      .json({ message: `Spotify authorization failed: ${req.query.error}` });

  const code = req.query.code;
  if (typeof code !== "string" || code.length === 0)
    return res.status(400).json({ message: "Missing authorization code" });

  const tokens = await spotifyService.requestAccessToken(req.session.id, code);
  if (!tokens)
    return res
      .status(502)
      .json({ message: "Could not exchange authorization code for tokens" });

  // In production the callback lands on the API host, so a relative redirect
  // would strand the user there instead of returning them to the app.
  res.redirect(frontendUrl);
}

export async function isAuthenticated(req: Request, res: Response) {
  const isAuth = await spotifyService.isSpotifyAuthenticated(req.session.id);

  res.status(200).json({ status: isAuth });
}

/**
 * GET /spotify/current-song - the track playing in the caller's room.
 *
 * Reads playback with the *host's* tokens, since guests never connect Spotify.
 * Also refreshes room.currentSong, which clears stale skip votes when the
 * track changes. The client polls this once a second.
 *
 * 400 no room in session   409 host has not connected Spotify
 * 404 room does not exist  502 Spotify unreachable
 * 200 the track, or { is_playing: false } when the host's player is idle
 */
export async function currSong(req: Request, res: Response) {
  const roomCode = req.session.roomCode;
  if (typeof roomCode !== "string" || roomCode.length === 0) {
    return res.status(400).json({ message: "Room code required" });
  }

  const room = await getRoomByCode(roomCode);
  if (!room) {
    return res.status(404).json({ message: "Room not found" });
  }

  const host = room.host;

  const data = (await spotifyService.executeSpotifyRequest({
    sessionId: host,
    endpoint: "player/currently-playing",
    method: "GET",
  })) as CurrentlyPlaying | { Error: string } | { noContent: true };

  if (!data) {
    return res.status(502).json({ Error: "No response from Spotify" });
  }

  if ("Error" in data) {
    // The host has never authorised, or their refresh token was revoked
    if (data.Error === "unauthenticated") {
      return res
        .status(409)
        .json({ Error: "Host has not connected Spotify", is_playing: false });
    }
    return res.status(502).json({ Error: "Could not reach Spotify" });
  }

  // Spotify answers 204 when the host's player is idle — not an error
  if ("noContent" in data || !data.item) {
    return res.status(200).json({ is_playing: false });
  }

  const item = data.item;
  const duration = item.duration_ms;
  const progress = data.progress_ms;
  const albumCover = item.album.images[0]?.url ?? null;
  const isPlaying = data.is_playing;
  const songId = item.id;
  const artist = item.artists.map((a) => a.name).join(", ");

  const votes = await spotifyService.getVoteCount(roomCode, songId);

  const song = {
    title: item.name,
    artist: artist,
    duration: duration,
    time: progress,
    image_url: albumCover,
    is_playing: isPlaying,
    vote_count: votes,
    votes_required: room.votesToSkip,
    song_id: songId,
  };

  await spotifyService.updateRoomSong(roomCode, songId);
  res.status(200).json(song);
}

export async function songControl(req: Request, res: Response) {
  const roomCode = req.session.roomCode;
  if (typeof roomCode !== "string" || roomCode.length === 0) {
    return res.status(400).json({ message: "Room code required" });
  }

  const room = await getRoomByCode(roomCode);
  if (!room) {
    return res.status(404).json({ message: "Room not found" });
  }

  // The client sends this in the JSON body, not the query string.
  // Skipping is not accepted here — it goes through skipSong so it can be voted on.
  const { action } = req.body ?? {};
  if (action !== "play" && action !== "pause") {
    return res.status(400).json({ Error: "Invalid action" });
  }

  if (req.session.id !== room.host && !room.guestCanPause) {
    return res.status(403).json({ Error: "You are not the host" });
  }

  // Commands run against the host's tokens — guests have none of their own
  const result = await spotifyService.spotifyAction(room.host, action);

  if (result && typeof result === "object" && "Error" in result) {
    return res.status(502).json(result);
  }

  res.status(200).json({ message: "Success" });
}

export async function skipSong(req: Request, res: Response) {
  const roomCode = req.session.roomCode;
  if (typeof roomCode !== "string" || roomCode.length === 0) {
    return res.status(400).json({ message: "Room code required" });
  }

  const room = await getRoomByCode(roomCode);
  if (!room) {
    return res.status(404).json({ message: "Room not found" });
  }

  const songId = room.currentSong;
  if (!songId) {
    return res.status(409).json({ Error: "No song is playing" });
  }

  if (req.session.id !== room.host) {
    // Record the vote before counting, so two simultaneous voters can't both
    // read a stale total and each decide the threshold has not been reached.
    const votes = await spotifyService.registerVote(
      room.id,
      req.session.id,
      songId,
    );

    if (votes < room.votesToSkip) {
      return res.status(200).json({
        message: "Vote registered",
        vote_count: votes,
        votes_required: room.votesToSkip,
      });
    }
  }

  await spotifyService.clearVotes(room.id, songId);
  const result = await spotifyService.spotifyAction(room.host, "skip");

  if (result && typeof result === "object" && "Error" in result) {
    return res.status(502).json(result);
  }

  res.status(200).json({ message: "Song skipped" });
}
