import { randomInt } from "node:crypto";
import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../prisma.js";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const ROOM_CODE_LENGTH = 6;
const MAX_ATTEMPTS = 5;

function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }

  return code;
}

export async function getRoomByCode(code: string) {
  const capCode = code.toUpperCase();
  return prisma.room.findUnique({ where: { code: capCode } });
}

export async function findAllRoom({ take = 50 }: { take?: number } = {}) {
  return prisma.room.findMany({
    select: {
      code: true,
      host: true,
      guestCanPause: true,
      votesToSkip: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function hostLeft(code: string, hostId: string) {
  return prisma.room.deleteMany({ where: { code, host: hostId } });
}

export async function updateRoomByCode({
  code,
  guestCanPause,
  votesToSkip,
}: {
  code: string;
  guestCanPause: boolean;
  votesToSkip: number;
}) {
  try {
    return await prisma.room.update({
      where: { code },
      data: { guestCanPause, votesToSkip },
    });
  } catch (e) {
    const roomGone =
      e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025";
    if (!roomGone) throw e;

    return null;
  }
}

export async function upsertRoomForHost({
  host,
  guestCanPause,
  votesToSkip,
}: {
  host: string;
  guestCanPause: boolean;
  votesToSkip: number;
}) {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      return await prisma.room.upsert({
        where: { host },
        update: { guestCanPause, votesToSkip },
        create: { host, guestCanPause, votesToSkip, code: generateRoomCode() },
      });
    } catch (e) {
      const isCodeCollision =
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002" &&
        (e.meta?.target as string[] | undefined)?.includes("code");
      if (!isCodeCollision) throw e;
    }
  }

  throw new Error("Could not allocate a unique room code");
}
