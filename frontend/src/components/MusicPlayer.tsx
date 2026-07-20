import React from "react";
import {
  Grid,
  Typography,
  Card,
  IconButton,
  LinearProgress,
} from "@mui/material";
import { PlayArrow, Pause, SkipNext } from "@mui/icons-material";
import { MusicPlayerProps } from "../types";

function MusicPlayer({
  artist,
  title,
  duration,
  time,
  image_url,
  is_playing,
}: MusicPlayerProps) {
  const pauseSong = () => {
    const req = {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "pause" }),
    };
    fetch("/spotify/song_control", req);
  };

  const playSong = () => {
    const req = {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "play" }),
    };
    fetch("/spotify/song_control", req);
  };

  const skipSong = () => {
    const req = {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    };
    fetch("/spotify/song_control", req).then((res) => res.json());
  };

  const btnControl = () => {
    if (is_playing) {
      pauseSong();
    } else {
      playSong();
    }
  };

  const songProgress = time * duration * 100;
  return (
    <Card>
      <Grid
        container
        spacing={4}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Grid size={4}>
          <img src={image_url} height="100%" width="100%" />
        </Grid>
        <Grid size={8}>
          <Typography component="h5" variant="h5">
            {title}
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            {artist}
          </Typography>
          <div>
            <IconButton onClick={btnControl}>
              {is_playing ? <Pause /> : <PlayArrow />}
            </IconButton>
            <IconButton onClick={skipSong}>
              <SkipNext />
            </IconButton>
          </div>
        </Grid>
      </Grid>
      <LinearProgress variant="determinate" value={songProgress} />
    </Card>
  );
}

export default MusicPlayer;
