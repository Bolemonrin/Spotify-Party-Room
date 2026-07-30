import {
  Grid,
  Typography,
  Card,
  IconButton,
  LinearProgress,
  Box,
} from "@mui/material";
import { PlayArrow, Pause, SkipNext } from "@mui/icons-material";
import type { MusicPlayerProps } from "../types";

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
    if (is_playing) pauseSong();
    else playSong();
  };

  // progress = elapsed / total (both in ms), clamped to 0–100
  const songProgress = duration ? Math.min(100, (time / duration) * 100) : 0;

  return (
    <Card
      elevation={0}
      sx={{
        width: "100%",
        borderRadius: "20px",
        p: 2,
        background: "rgba(255,255,255,0.55)",
        border: "1px solid rgba(255,255,255,0.7)",
      }}
    >
      <Grid container spacing={2} sx={{ alignItems: "center" }}>
        <Grid size={4}>
          <Box
            component="img"
            src={image_url}
            alt={title}
            sx={{ width: "100%", borderRadius: "14px", display: "block" }}
          />
        </Grid>
        <Grid size={8} sx={{ textAlign: "left" }}>
          <Typography component="h5" variant="h6" noWrap>
            {title}
          </Typography>
          <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
            {artist}
          </Typography>
          <Box>
            <IconButton onClick={btnControl} color="primary">
              {is_playing ? <Pause /> : <PlayArrow />}
            </IconButton>
            <IconButton onClick={skipSong} color="secondary">
              <SkipNext />
            </IconButton>
          </Box>
        </Grid>
      </Grid>
      <LinearProgress
        variant="determinate"
        value={songProgress}
        sx={{ mt: 1.5, height: 6, borderRadius: 999 }}
      />
    </Card>
  );
}

export default MusicPlayer;
