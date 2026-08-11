import "dotenv/config";
import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import cors from "cors";
import pg from "pg";
import type { Request, Response, NextFunction } from "express";
import roomRoutes from "./routes/room.js";
import spotifyRoutes from "./routes/spotify.js";
import * as spotifyController from "./controllers/spotifyController.js";
import { isProduction, frontendUrl, port } from "./config.js";

const app = express();

// Render terminates TLS at its edge and forwards plain HTTP. Without this,
// Express sees an insecure connection and express-session silently refuses to
// send a `secure` cookie — so sessions never stick in production.
if (isProduction) {
  app.set("trust proxy", 1);
}

// Credentialed CORS cannot use a wildcard origin: the browser rejects
// `Access-Control-Allow-Origin: *` when the request carries cookies.
app.use(cors({ origin: frontendUrl, credentials: true }));

app.use(express.json());

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
      // Cross-site XHR only carries cookies with SameSite=None, and browsers
      // only accept SameSite=None when Secure is also set — hence both, and
      // hence only in production, where the connection is actually HTTPS.
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
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

// Cheap liveness probe. Render pings this to tell a booting instance from a
// broken one, and it needs no database.
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

// Namespaced under /api so it cannot collide with the client-side /room/:code route
app.use("/api/room", roomRoutes);
app.use("/spotify", spotifyRoutes);

// Mounted at the root because it must match REDIRECT_URI exactly, and Spotify
// compares the value byte-for-byte against the registered redirect URI.
app.get("/callback", spotifyController.spotifyCallback);

// Unmatched routes: answer JSON rather than Express's default HTML, so a
// mistyped path does not hand the client an HTML page it tries to JSON.parse.
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
});

// Error handler. Must take four arguments and be registered last — Express
// identifies it by arity, and only consults it after every other layer.
// Express 5 forwards rejected promises from async handlers here automatically.
app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  console.error(err);

  // Headers already flushed: delegate to Express, which aborts the connection.
  // Writing again would throw ERR_HTTP_HEADERS_SENT and mask the real error.
  if (res.headersSent) {
    return next(err);
  }

  // body-parser and http-errors tag client mistakes with a status — a malformed
  // JSON body is the caller's fault, not ours, and should not read as a 500.
  const tagged = (err as { status?: unknown; statusCode?: unknown }) ?? {};
  const candidate = tagged.status ?? tagged.statusCode;
  const status =
    typeof candidate === "number" && candidate >= 400 && candidate <= 599
      ? candidate
      : 500;

  // Never leak internals in production; a 4xx message describes the caller's
  // own mistake, so it is safe to echo either way.
  const message =
    err instanceof Error ? err.message : "Something went wrong";

  res.status(status).json({
    error: isProduction && status >= 500 ? "Something went wrong" : message,
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
