/** @format */

import { useState, useEffect } from "react";
import CreateRoom from "./CreateRoom";
import JoinRoom from "./JoinRoom";
import Room from "./Room";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  Navigate,
} from "react-router-dom";
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Paper,
  Stack,
  Button,
  Typography,
} from "@mui/material";
import theme, { glassCard } from "../theme";

function App() {
  const [roomCode, setRoomCode] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/room/user-in-room")
      .then((res) => res.json())
      .then((data) => setRoomCode(data.code));
  }, [roomCode]);

  const renderHomePage = () => (
    <Paper
      elevation={0}
      sx={{ ...glassCard, maxWidth: 440, width: "100%", textAlign: "center" }}
    >
      <Typography
        variant="h3"
        component="h1"
        sx={{
          mb: 1,
          backgroundImage: "linear-gradient(120deg, #ec4899, #a78bfa)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        House Party
      </Typography>
      <Typography sx={{ color: "text.secondary", mb: 4 }}>
        Queue up, vote, and listen together in real time.
      </Typography>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ justifyContent: "center" }}
      >
        <Button
          variant="contained"
          color="primary"
          component={Link}
          to="/join"
          size="large"
        >
          Join a Room
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          component={Link}
          to="/create"
          size="large"
        >
          Create a Room
        </Button>
      </Stack>
    </Paper>
  );

  const clearRoomCode = () => setRoomCode(null);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
          backgroundColor: "#f4ecfa",
          backgroundImage:
            "radial-gradient(at 18% 22%, #ffcfe3 0%, transparent 60%)," +
            "radial-gradient(at 82% 18%, #dcd0ff 0%, transparent 60%)," +
            "radial-gradient(at 78% 82%, #ffe0c8 0%, transparent 60%)," +
            "radial-gradient(at 22% 80%, #c8e3ff 0%, transparent 60%)",
        }}
      >
        <Router>
          <Routes>
            <Route
              path="/"
              element={
                roomCode ? (
                  <Navigate to={`/room/${roomCode}`} />
                ) : (
                  renderHomePage()
                )
              }
            />
            <Route path="/join" element={<JoinRoom />} />
            <Route path="/create" element={<CreateRoom />} />
            <Route
              path="/room/:roomCode"
              element={<Room leaveRoomCallback={clearRoomCode} />}
            />
          </Routes>
        </Router>
      </Box>
    </ThemeProvider>
  );
}

export default App;
