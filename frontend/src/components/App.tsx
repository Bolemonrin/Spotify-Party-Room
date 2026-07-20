/** @format */

import React, { useState, useEffect } from "react";
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
import { Button, Grid, ButtonGroup, Typography } from "@mui/material";

function App() {
  // const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/user-in-room")
      .then((res) => res.json())
      .then((data) => setRoomCode(data.code));
  }, [roomCode]);

  const renderHomePage = () => {
    return (
      <Grid
        container
        spacing={3}
        sx={{
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Grid>
          <Typography variant="h3" component="h3">
            House Party
          </Typography>
        </Grid>
        <Grid>
          <ButtonGroup disableElevation variant="contained" color="primary">
            <Button color="primary" to="/join" component={Link}>
              Join a Room
            </Button>
            <Button color="secondary" to="/create" component={Link}>
              Create a Room
            </Button>
          </ButtonGroup>
        </Grid>
      </Grid>
    );
  };

  const clearRoomCode = () => {
    setRoomCode(null);
  };
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            roomCode ? <Navigate to={`/room/${roomCode}`} /> : renderHomePage()
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
  );
}

export default App;
