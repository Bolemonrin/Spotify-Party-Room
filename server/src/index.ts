import "dotenv/config";
import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
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

// Sessions live in Postgres, not in memory. The default MemoryStore is wiped on
// every restart, which silently demotes a host to a guest (room.host stops
// matching req.session.id) and drops each guest's roomCode.
const PgStore = connectPgSimple(session);
const sessionPool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

app.use(
  session({
    store: new PgStore({ pool: sessionPool, createTableIfMissing: true }),
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

// Debug tooling — uncomment both blocks when a client needs tracing. Prints the
// session identity behind each call, and receives button presses forwarded by
// src/debug.ts, which is how we see activity on a phone with no devtools.
//
// app.post("/api/debug/press", (req, res) => {
//   const { action, detail } = req.body ?? {};
//   const sid = req.sessionID ? req.sessionID.slice(0, 8) : "none";
//   console.log(
//     `[press] ${action} sid=${sid} room=${req.session?.roomCode ?? "-"}`,
//     detail ?? "",
//   );
//   res.status(204).end();
// });
//
// app.use((req, res, next) => {
//   res.on("finish", () => {
//     if (req.path === "/favicon.ico") return;
//     const sid = req.sessionID ? req.sessionID.slice(0, 8) : "none";
//     const room = req.session?.roomCode ?? "-";
//     console.log(
//       `${req.method} ${req.originalUrl} -> ${res.statusCode}  sid=${sid} room=${room} ua=${
//         /iPhone|iPad/.test(req.get("user-agent") ?? "") ? "ios" : "other"
//       }`,
//     );
//   });
//   next();
// });

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
