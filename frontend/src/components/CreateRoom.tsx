/** @format */

import React, { useState } from "react";
import {
  Button,
  Typography,
  FormHelperText,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Input,
  Collapse,
  Alert,
  Stack,
  Paper,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import type { CreateRoomProps } from "../types";
import { glassCard, gradientText } from "../theme";
import { logPress } from "../debug";

function CreateRoom({
  update,
  updateCallback,
  roomCode,
  guestCont,
  skipVotes,
}: CreateRoomProps) {
  const navigate = useNavigate();
  const [votesToSkip, setVotesToSkip] = useState(skipVotes || 2);
  const [guestControl, setGuestControl] = useState(
    guestCont !== undefined ? guestCont : true,
  );
  const [errMsg, setErrMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleVotesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVotesToSkip(Number(e.target.value));
  };

  const handleGuestControlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGuestControl(e.target.value === "true" ? true : false);
  };

  const handleRoomBtnPresses = () => {
    logPress("create-room", { votesToSkip, guestControl });
    localStorage.removeItem("roomCode");
    const request = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        votes_to_skip: votesToSkip,
        guest_can_pause: guestControl,
      }),
    };

    fetch("/api/room/create", request)
      .then((res) => res.json())
      .then((data) => {
        if (data.code) {
          localStorage.setItem("roomCode", data.code);
          navigate("/room/" + data.code);
        } else {
          console.error("Error: Room code missing from response");
        }
      })
      .catch((err) => console.error("Error creating room:", err));
  };

  const handleUpdateRoomBtnPress = () => {
    logPress("update-room", { roomCode, votesToSkip, guestControl });
    const request = {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        votes_to_skip: votesToSkip,
        guest_can_pause: guestControl,
        code: roomCode,
      }),
    };

    fetch("/api/room/update-room", request)
      .then((res) => {
        if (res.ok) setSuccessMsg("Room updated successfully!");
        else setErrMsg("Error updating room!");
      })
      .catch((err) => console.error("Error updating room:", err))
      .finally(() => updateCallback?.());
  };

  const renderCreateBtn = () => (
    <Stack direction="row" spacing={1.5}>
      <Button
        color="primary"
        variant="contained"
        onClick={handleRoomBtnPresses}
      >
        Create a Room
      </Button>
      <Button color="secondary" variant="outlined" to="/" component={Link}>
        Back
      </Button>
    </Stack>
  );

  const renderUpdateBtn = () => (
    <Button
      color="primary"
      variant="contained"
      onClick={handleUpdateRoomBtnPress}
    >
      Update Room
    </Button>
  );

  return (
    <Paper
      elevation={0}
      sx={{ ...glassCard, maxWidth: 460, width: "100%", textAlign: "center" }}
    >
      <Stack spacing={3} sx={{ alignItems: "center" }}>
        <Collapse
          in={errMsg !== "" || successMsg !== ""}
          sx={{ width: "100%" }}
        >
          {successMsg !== "" ? (
            <Alert severity="success" onClose={() => setSuccessMsg("")}>
              {successMsg}
            </Alert>
          ) : (
            <Alert severity="error" onClose={() => setErrMsg("")}>
              {errMsg}
            </Alert>
          )}
        </Collapse>

        <Typography variant="h4" component="h1" sx={gradientText}>
          {update ? "Update Room" : "Create a Room"}
        </Typography>

        <FormControl component="fieldset">
          <FormHelperText sx={{ textAlign: "center", mb: 0.5 }}>
            Guest Control of Playback State
          </FormHelperText>
          <RadioGroup
            row
            value={guestControl.toString()}
            onChange={handleGuestControlChange}
            sx={{ justifyContent: "center" }}
          >
            <FormControlLabel
              value="true"
              control={<Radio color="primary" />}
              label="Play/Pause"
              labelPlacement="bottom"
            />
            <FormControlLabel
              value="false"
              control={<Radio color="secondary" />}
              label="No Control"
              labelPlacement="bottom"
            />
          </RadioGroup>
        </FormControl>

        <FormControl>
          <Input
            required
            type="number"
            value={votesToSkip}
            inputProps={{ min: 1, style: { textAlign: "center" } }}
            onChange={handleVotesChange}
          />
          <FormHelperText sx={{ textAlign: "center" }}>
            Votes Required To Skip Song
          </FormHelperText>
        </FormControl>

        {update ? renderUpdateBtn() : renderCreateBtn()}
      </Stack>
    </Paper>
  );
}

export default CreateRoom;
