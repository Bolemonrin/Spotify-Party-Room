/** @format */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Typography,
  Button,
  CircularProgress,
  Stack,
  Paper,
  Box,
} from "@mui/material";
import CreateRoom from "./CreateRoom";
import MusicPlayer from "./MusicPlayer";
import type { RoomProps, MusicPlayerProps } from "../types";
import { glassCard, gradientText } from "../theme";

function Room({ leaveRoomCallback }: RoomProps) {
  const navigate = useNavigate();

  const [votesToSkip, setVotesToSkip] = useState(2);
  const [guestControl, setGuestControl] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [spotifyAuth, setSpotifyAuth] = useState(false);
  const [song, setSong] = useState<MusicPlayerProps | null>(null);

  const { roomCode } = useParams();

  const getRoomDetails = () => {
    if (!roomCode || roomCode === "undefined") {
      console.error("Room Code is undefined or invalid!");
      return;
    }
    setIsLoading(true);

    fetch(`/api/room/get-room?code=${roomCode}`)
      .then((res) => {
        if (!res.ok) {
          console.error("Room not found, redirecting...");
          if (leaveRoomCallback) leaveRoomCallback();
          navigate("/");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        setGuestControl(data.guest_can_pause);
        setVotesToSkip(data.votes_to_skip);
        setIsHost(data.is_host);
        if (data.is_host) authSpotify();
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching room details:", error);
        setIsLoading(false);
      });
  };

  const authSpotify = () => {
    fetch("/spotify/is-authenticated")
      .then((res) => res.json())
      .then((data) => {
        setSpotifyAuth(data.status);
        if (!data.status) {
          fetch("/spotify/get-auth-url")
            .then((res) => res.json())
            .then((data) => {
              window.location.replace(data.url);
            });
        }
      });
  };

  const leaveBtnPressed = () => {
    const request = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    };
    fetch("/api/room/leave-room", request).then(() => {
      leaveRoomCallback();
      navigate("/");
    });
  };

  const updateShowSettings = (value: boolean) => {
    setShowSettings(value);
  };

  const getCurrSong = () => {
    fetch("/spotify/current-song")
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        setSong(data);
      });
  };

  useEffect(() => {
    if (roomCode) getRoomDetails();
    else console.log("roomCode is undefined, not fetching");

    let interval: ReturnType<typeof setInterval> | null = null;
    if (spotifyAuth) {
      getCurrSong();
      interval = setInterval(getCurrSong, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [roomCode, navigate, leaveRoomCallback, spotifyAuth]);

  // Settings view: CreateRoom brings its own card, so no extra wrapper here
  if (showSettings) {
    return (
      <Stack spacing={2} sx={{ alignItems: "center", width: "100%" }}>
        <CreateRoom
          update={true}
          updateCallback={getRoomDetails}
          roomCode={roomCode}
          guestCont={guestControl}
          skipVotes={votesToSkip}
        />
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => updateShowSettings(false)}
        >
          Close
        </Button>
      </Stack>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{ ...glassCard, maxWidth: 480, width: "100%", textAlign: "center" }}
    >
      {isLoading ? (
        <Stack spacing={2} sx={{ alignItems: "center" }}>
          <CircularProgress color="primary" />
          <Typography variant="body1">Loading room details…</Typography>
        </Stack>
      ) : (
        <Stack spacing={2.5} sx={{ alignItems: "center" }}>
          <Typography variant="h4" component="h1" sx={gradientText}>
            Room {roomCode}
          </Typography>

          <Box sx={{ width: "100%" }}>
            {song ? (
              <MusicPlayer {...song} />
            ) : (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Nothing playing yet — start a track in Spotify.
              </Typography>
            )}
          </Box>

          <Stack direction="row" spacing={1.5}>
            {isHost && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => updateShowSettings(true)}
              >
                Settings
              </Button>
            )}
            <Button
              variant="outlined"
              color="secondary"
              onClick={leaveBtnPressed}
            >
              Leave Room
            </Button>
          </Stack>
        </Stack>
      )}
    </Paper>
  );
}

export default Room;
