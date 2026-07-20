/** @format */

import React, { Component, useState } from "react";
import { Button, TextField, Typography, Grid } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";

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

    fetch("/api/join", request)
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
    <Grid
      container
      spacing={1}
      sx={{
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Grid>
        <Typography variant="h4" component="h4">
          Join Room
        </Typography>
      </Grid>
      <Grid>
        <TextField
          error
          label="Room Code"
          placeholder="Enter Room Code"
          value={roomCode}
          helperText={error}
          variant="outlined"
          onChange={handleTextFieldChange}
        />
      </Grid>
      <Grid>
        <Button variant="contained" color="primary" onClick={roomButtonPressed}>
          Enter Room
        </Button>
        <Button variant="contained" color="secondary" to="/" component={Link}>
          Leave
        </Button>
      </Grid>
    </Grid>
  );
}

export default JoinRoom;
