import express from "express";
import session from "express-session";
import type { Request, Response } from "express";
import roomRoutes from "./routes/room.js";
import spotifyRoutes from "./routes/spotify.js";
import * as spotifyController from "./controllers/spotifyController.js";

const app = express();

app.use(express.json());

// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({
//     success: false,
//     error: "Something went wrong",
//   });
// });

app.use(
  session({
    secret: process.env.SESSION_SECRET ?? "dev-only-change-me",
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
    },
  }),
);

const port = process.env.PORT || 3000;

// Namespaced under /api so it cannot collide with the client-side /room/:code route
app.use("/api/room", roomRoutes);
app.use("/spotify", spotifyRoutes);

// Mounted at the root because it must match REDIRECT_URI exactly, and Spotify
// compares the value byte-for-byte against the registered redirect URI.
app.get("/callback", spotifyController.spotifyCallback);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
