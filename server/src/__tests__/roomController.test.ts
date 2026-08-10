import { describe, it, expect } from "vitest";
import { toRoomResponse } from "../controllers/roomController.js";

const room = {
  code: "ABCDEF",
  votesToSkip: 3,
  guestCanPause: true,
  createdAt: new Date("2026-01-02T03:04:05.000Z"),
};

describe("toRoomResponse", () => {
  it("converts camelCase columns to the snake_case the client reads", () => {
    expect(toRoomResponse(room, false)).toEqual({
      code: "ABCDEF",
      votes_to_skip: 3,
      guest_can_pause: true,
      is_host: false,
      created_at: "2026-01-02T03:04:05.000Z",
    });
  });

  it("never leaks host, which is a session id", () => {
    const withHost = { ...room, host: "secret-session-id" };
    expect(Object.values(toRoomResponse(withHost, true))).not.toContain(
      "secret-session-id",
    );
    expect(toRoomResponse(withHost, true)).not.toHaveProperty("host");
  });

  it("takes is_host from the argument, not from the row", () => {
    expect(toRoomResponse(room, true).is_host).toBe(true);
    expect(toRoomResponse(room, false).is_host).toBe(false);
  });

  it("serialises created_at as an ISO string, not a Date", () => {
    expect(typeof toRoomResponse(room, false).created_at).toBe("string");
  });
});
