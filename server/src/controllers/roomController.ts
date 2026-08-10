import type { Request, Response } from "express";
import * as roomService from "../services/roomService.js";

type RoomFields = {
  code: string;
  votesToSkip: number;
  guestCanPause: boolean;
  createdAt: Date;
};

function toRoomResponse(room: RoomFields, isHost: boolean) {
  return {
    code: room.code,
    votes_to_skip: room.votesToSkip,
    guest_can_pause: room.guestCanPause,
    is_host: isHost,
    created_at: room.createdAt.toISOString(),
  };
}

export async function listRooms(req: Request, res: Response) {
  const rooms = await roomService.findAllRoom();
  res.json(
    rooms.map((room) => toRoomResponse(room, room.host === req.session.id)),
  );
}

export async function getRoom(req: Request, res: Response) {
  const roomCode = req.query.code;

  if (typeof roomCode !== "string" || roomCode.length === 0) {
    return res.status(400).json({ message: "Room code required" });
  }

  const room = await roomService.getRoomByCode(roomCode);

  if (!room) {
    return res.status(404).json({ message: "Room not found" });
  }

  res.json(toRoomResponse(room, room.host === req.session.id));
}

export async function createRoom(req: Request, res: Response) {
  const { votes_to_skip, guest_can_pause } = req.body ?? {};

  if (
    typeof guest_can_pause !== "boolean" ||
    !Number.isInteger(votes_to_skip) ||
    votes_to_skip < 1 ||
    votes_to_skip > 50
  ) {
    return res.status(400).json({ message: "Invalid Data" });
  }

  const room = await roomService.upsertRoomForHost({
    host: req.session.id,
    guestCanPause: guest_can_pause,
    votesToSkip: votes_to_skip,
  });

  req.session.roomCode = room.code;
  res.status(201).json(toRoomResponse(room, true));
}

export async function updateRoom(req: Request, res: Response) {
  const { guest_can_pause, votes_to_skip, code } = req.body ?? {};

  if (
    typeof guest_can_pause !== "boolean" ||
    !Number.isInteger(votes_to_skip) ||
    votes_to_skip < 1 ||
    votes_to_skip > 50 ||
    typeof code != "string" ||
    code.length === 0
  ) {
    return res.status(400).json({ message: "Invalid Data" });
  }

  // if () return res.status(400).json({error: "Room code not valid"})

  const room = await roomService.getRoomByCode(code);
  if (!room) {
    return res.status(404).json({ message: "Room not found" });
  }

  if (room.host !== req.session.id) {
    return res
      .status(403)
      .json({ message: "You are not the host of this room" });
  }

  const updated = await roomService.updateRoomByCode({
    code: room.code,
    guestCanPause: guest_can_pause,
    votesToSkip: votes_to_skip,
  });

  if (!updated) {
    return res.status(404).json({ message: "Room not found" });
  }

  res.json(toRoomResponse(updated, true));
}

export async function joinRoom(req: Request, res: Response) {
  const { code } = req.body ?? {};
  if (typeof code !== "string" || code.length === 0)
    return res.status(400).json({ error: "Room code required" });

  const room = await roomService.getRoomByCode(code);
  if (!room) {
    return res.status(404).json({ message: "Room not found" });
  }

  req.session.roomCode = room.code;
  res.json({
    message: "Room joined",
  });
}

export async function userInRoom(req: Request, res: Response) {
  res.json({ code: req.session.roomCode ?? null });
}

export async function leaveRoom(req: Request, res: Response) {
  const code = req.session.roomCode;
  delete req.session.roomCode;

  if (code) {
    const hostId = req.session.id;
    await roomService.hostLeft(code, hostId);
  }

  res.json({ message: "Success" });
}
