/** @format */

import React, { useState } from "react";
import { Button, TextField, Typography, Stack, Paper } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { glassCard, gradientText } from "../theme";

function JoinRoom() {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");

  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomCode(e.target.value);
  };

  const roomButtonPressed = () => {
    const request = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: roomCode }),
    };

    fetch("/api/room/join", request)
      .then((res) => {
        if (res.ok) {
          navigate(`/room/${roomCode}`);
        } else {
          setError("Room not found");
        }
      })
      .catch((err) => console.log(err));
  };

  return (
    <Paper
      elevation={0}
      sx={{ ...glassCard, maxWidth: 440, width: "100%", textAlign: "center" }}
    >
      <Stack spacing={3} sx={{ alignItems: "center" }}>
        <Typography variant="h4" component="h1" sx={gradientText}>
          Join a Room
        </Typography>
        <TextField
          error={error !== ""}
          label="Room Code"
          placeholder="Enter room code"
          value={roomCode}
          helperText={error}
          variant="outlined"
          onChange={handleTextFieldChange}
          sx={{ width: "100%", maxWidth: 260 }}
        />
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="contained"
            color="primary"
            onClick={roomButtonPressed}
          >
            Enter Room
          </Button>
          <Button variant="outlined" color="secondary" to="/" component={Link}>
            Back
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

export default JoinRoom;
