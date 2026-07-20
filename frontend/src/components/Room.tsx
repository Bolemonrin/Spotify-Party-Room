/** @format */

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Grid, Typography, Button, CircularProgress } from "@mui/material";
import CreateRoom from "./CreateRoom";
import MusicPlayer from "./MusicPlayer";
import type { RoomProps, MusicPlayerProps } from "../types";

function Room({ leaveRoomCallback }: RoomProps) {
  const navigate = useNavigate();

  const [votesToSkip, setVotesToSkip] = useState(2);
  const [guestControl, setGuestControl] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  // const [update, setUpdate] = useState(false);
  const [spotifyAuth, setSpotifyAuth] = useState(false);
  const [song, setSong] = useState<MusicPlayerProps | null>(null);

  const { roomCode } = useParams();
  // console.log("Room mounted with roomcode:", roomCode);

  const getRoomDetails = () => {
    if (!roomCode || roomCode === "undefined") {
      console.error("Room Code is undefined or invalid!");
      return;
    }

    // console.log("Fetching room details for code:", roomCode); // Debug log
    setIsLoading(true);

    fetch(`/api/get-room?code=${roomCode}`)
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
        // console.log("Room data received:", data);
        setGuestControl(data.guest_can_pause);
        setVotesToSkip(data.votes_to_skip);
        setIsHost(data.is_host);
        if (data.is_host) authSpotify();
        setIsLoading(false);

        // console.log("inside .then data");
        // console.log(isLoading);
        // console.log(data.guest_can_control);
      })
      .catch((error) => {
        console.error("Error fetching room details:", error);
        setIsLoading(false);
        // Keep default state values on error
      });
  };

  const authSpotify = () => {
    // console.log("Authenticating Spotify...");
    fetch("/spotify/is-authenticated")
      .then((res) => res.json())
      .then((data) => {
        setSpotifyAuth(data.status);
        // console.log("Spotify auth status:", data.status);
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

    fetch("/api/leave-room", request).then((res) => {
      leaveRoomCallback();
      navigate("/");
    });
  };

  const updateShowSettings = (e: boolean) => {
    setShowSettings(e);
  };

  // const handleUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const val = e.target.value === "true" ? true : false;
  //   setUpdate(val);
  // };

  const getCurrSong = () => {
    fetch("/spotify/current-song")
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        setSong(data);
        // console.log("Current song:", data);
      });
  };

  useEffect(() => {
    // console.log("useEffect triggered with roomCode:", roomCode); // Debug log

    if (roomCode) getRoomDetails();
    else console.log("roomCode is undefined, not fetching");

    let interval = null;
    if (spotifyAuth) {
      getCurrSong();
      interval = setInterval(getCurrSong, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [roomCode, navigate, leaveRoomCallback, spotifyAuth]);

  // Only try to convert to string if not loading and values exist
  const guestControlString =
    guestControl !== undefined ? guestControl.toString() : "loading...";
  const isHostString = isHost !== undefined ? isHost.toString() : "loading...";

  const renderSettings = () => {
    return (
      <>
        <Grid>
          <CreateRoom
            update={true}
            // handleUpdate={handleUpdate}
            updateCallback={getRoomDetails}
            roomCode={roomCode}
            guestCont={guestControl}
            skipVotes={votesToSkip}
          />
        </Grid>
        <Grid>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => updateShowSettings(false)}
          >
            Close
          </Button>
        </Grid>
      </>
    );
  };

  const renderSettingsBtn = () => {
    return (
      <Grid>
        <Button
          variant="contained"
          color="primary"
          onClick={() => updateShowSettings(true)}
        >
          Settings
        </Button>
      </Grid>
    );
  };

  return (
    <Grid
      container
      spacing={1}
      sx={{
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {showSettings ? (
        renderSettings()
      ) : (
        <>
          <Grid
            container
            spacing={1}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isLoading ? (
              <Grid>
                <CircularProgress />
                <Typography variant="body1" sx={{ mt: 2 }}>
                  Loading room details...
                </Typography>
              </Grid>
            ) : (
              <>
                <Grid>
                  <Typography variant="h4" component="h4">
                    Code: {roomCode}
                  </Typography>
                  {song && <MusicPlayer {...song} />}
                </Grid>
                {isHost ? renderSettingsBtn() : null}
                <Grid>
                  <Button
                    variant="contained"
                    onClick={leaveBtnPressed}
                    color="secondary"
                  >
                    Leave Room
                  </Button>
                </Grid>
              </>
            )}
          </Grid>
        </>
      )}
    </Grid>
  );
}

export default Room;
