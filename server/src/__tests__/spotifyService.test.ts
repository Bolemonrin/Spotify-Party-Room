import { describe, it, expect } from "vitest";
import { isAction } from "../services/spotifyService.js";

describe("isAction", () => {
  it("accepts the three player commands", () => {
    expect(isAction("play")).toBe(true);
    expect(isAction("pause")).toBe(true);
    expect(isAction("skip")).toBe(true);
  });

  it("rejects a missing body field", () => {
    expect(isAction(undefined)).toBe(false);
    expect(isAction(null)).toBe(false);
  });

  it("rejects non-strings that could arrive from a JSON body", () => {
    expect(isAction(1)).toBe(false);
    expect(isAction(["play"])).toBe(false);
    expect(isAction({ action: "play" })).toBe(false);
  });

  it("rejects Object.prototype keys, which `in` would otherwise match", () => {
    expect(isAction("toString")).toBe(false);
    expect(isAction("constructor")).toBe(false);
  });

  it("is case sensitive", () => {
    expect(isAction("Play")).toBe(false);
    expect(isAction("PAUSE")).toBe(false);
  });
});
