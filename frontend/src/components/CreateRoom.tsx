/** @format */

import React, { useEffect, useState } from "react";
import {
  Button,
  Grid,
  Typography,
  TextField,
  FormHelperText,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Input,
  Collapse,
  Alert,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import type { CreateRoomProps } from '../types';
// import Button from "@mui/material/Button";
// import Grid from "@mui/material/Grid2";
// import Typography from "@mui/material/Typography";
// import TextField from "@mui/material/TextField";
// import FormHelperText from "@mui/material/FormHelperText";
// import FormControl from "@mui/material/FormControl";
// import FormControlLabel from "@mui/material/FormControlLabel";
// import Radio from "@mui/material/Radio";
// import RadioGroup from "@mui/material/RadioGroup";
// import Input from "@mui/material/Input";

// import Collapse from "@mui/material/Collapse";
// import Alert from "@mui/material/Alert";

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
    localStorage.removeItem("roomCode");
    // console.log({ votesToSkip, guestControl });
    const request = {
      method: "Post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        votes_to_skip: votesToSkip,
        guest_can_pause: guestControl,
      }),
    };

    fetch("/api/create", request)
      .then((res) => res.json())
      .then((data) => {
        // console.log("Room creation response:", data); // Debugging
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
    // console.log({ votesToSkip, guestControl });
    const request = {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        votes_to_skip: votesToSkip,
        guest_can_pause: guestControl,
        code: roomCode,
      }),
    };

    fetch("/api/update-room", request)
      .then((res) => {
        if (res.ok) setSuccessMsg("Room updated successfully!");
        else setErrMsg("Error updating room!");
      })
      .catch((err) => console.error("Error creating room:", err))
      .finally(() => updateCallback?.());
  };

  const renderCreateBtn = () => {
    return (
      <>
        <Grid>
          <Button
            color="primary"
            variant="contained"
            onClick={handleRoomBtnPresses}
          >
            Create A Room
          </Button>
        </Grid>
        <Grid>
          <Button color="secondary" variant="contained" to="/" component={Link}>
            Back
          </Button>
        </Grid>
      </>
    );
  };

  const renderUpdateBtn = () => {
    return (
      <Grid>
        <Button
          color="primary"
          variant="contained"
          onClick={handleUpdateRoomBtnPress}
        >
          Update Room
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
      <Grid>
        <Collapse in={errMsg != "" || successMsg != ""}>
          {successMsg != "" ? (
            <Alert severity="success" onClose={() => setSuccessMsg("")}>
              {successMsg}
            </Alert>
          ) : (
            <Alert severity="error" onClose={() => setErrMsg("")}>
              {errMsg}
            </Alert>
          )}
        </Collapse>
      </Grid>
      <Grid>
        <Typography component="h4" variant="h4">
          {update ? "Update Room" : "Create A Room"}
        </Typography>
      </Grid>
      <Grid>
        <FormControl component="fieldset">
          <FormHelperText>
            <span style={{ alignItems: "center" }}>
              Guest Control of Playback State
            </span>
          </FormHelperText>
          <RadioGroup
            row
            value={guestControl.toString()}
            onChange={handleGuestControlChange}
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
      </Grid>
      <Grid>
        <FormControl>
          <Input
            required={true}
            type="number"
            value={votesToSkip}
            inputProps={{
              min: 1,
              style: { textAlign: "center" },
            }}
            onChange={handleVotesChange}
          />
          <FormHelperText>
            <span style={{ alignItems: "center" }}>
              Votes Required To Skip Song
            </span>
          </FormHelperText>
        </FormControl>
      </Grid>
      {update ? renderUpdateBtn() : renderCreateBtn()}
    </Grid>
  );
}

export default CreateRoom;
