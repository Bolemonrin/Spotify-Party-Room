import { describe, it, expect } from "vitest";
import { generateRoomCode } from "../services/roomService.js";

describe("generateRoomCode", () => {
  it("returns six uppercase letters", () => {
    for (let i = 0; i < 100; i++) {
      expect(generateRoomCode()).toMatch(/^[A-Z]{6}$/);
    }
  });

  it("excludes digits and lowercase, which are ambiguous when read aloud", () => {
    const codes = Array.from({ length: 200 }, generateRoomCode).join("");
    expect(codes).not.toMatch(/[0-9a-z]/);
  });

  it("does not return a constant value", () => {
    const codes = new Set(Array.from({ length: 50 }, generateRoomCode));
    // 26^6 possibilities, so 50 draws colliding into <10 buckets means the
    // randomness is broken, not bad luck.
    expect(codes.size).toBeGreaterThan(10);
  });

  it("draws from the whole alphabet rather than a narrow slice", () => {
    const seen = new Set(
      Array.from({ length: 500 }, generateRoomCode).join("").split(""),
    );
    expect(seen.size).toBeGreaterThan(20);
  });
});
