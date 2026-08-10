import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MusicPlayer from "../MusicPlayer";

const song = {
  title: "Song Title",
  artist: "An Artist",
  duration: 200_000,
  time: 50_000,
  image_url: "https://example.test/cover.jpg",
  is_playing: true,
  vote_count: 0,
  votes_required: 2,
  song_id: "7bbpg7SShcWLj1C8ABApb0",
};

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(new Response("{}", { status: 200 }))),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("MusicPlayer", () => {
  it("renders the track title and artist", () => {
    render(<MusicPlayer {...song} />);

    expect(screen.getByText("Song Title")).toBeInTheDocument();
    expect(screen.getByText("An Artist")).toBeInTheDocument();
  });

  it("skips via POST /spotify/skip, not the play/pause endpoint", async () => {
    render(<MusicPlayer {...song} />);

    await userEvent.click(screen.getAllByRole("button")[1]!);

    const [url, options] = vi.mocked(fetch).mock.calls[0]!;
    expect(url).toBe("/spotify/skip");
    expect(options).toMatchObject({ method: "POST" });
  });

  it("sends pause while playing", async () => {
    render(<MusicPlayer {...song} />);

    await userEvent.click(screen.getAllByRole("button")[0]!);

    const [url, options] = vi.mocked(fetch).mock.calls[0]!;
    expect(url).toBe("/spotify/song_control");
    expect(JSON.parse(String((options as RequestInit).body))).toEqual({
      action: "pause",
    });
  });

  it("sends play while paused", async () => {
    render(<MusicPlayer {...song} is_playing={false} />);

    await userEvent.click(screen.getAllByRole("button")[0]!);

    const [, options] = vi.mocked(fetch).mock.calls[0]!;
    expect(JSON.parse(String((options as RequestInit).body))).toEqual({
      action: "play",
    });
  });

  it("clamps progress to 100% when elapsed exceeds duration", () => {
    render(<MusicPlayer {...song} time={999_999} duration={1000} />);

    const bar = screen.getByRole("progressbar");
    expect(Number(bar.getAttribute("aria-valuenow"))).toBeLessThanOrEqual(100);
  });

  it("does not divide by zero when duration is missing", () => {
    render(<MusicPlayer {...song} time={0} duration={0} />);

    const bar = screen.getByRole("progressbar");
    expect(Number(bar.getAttribute("aria-valuenow"))).toBe(0);
  });
});
