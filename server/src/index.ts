import express from "express";
import session from "express-session";
import type { Request, Response } from "express";
import roomRoutes from "./routes/room.js";

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

app.use("/room", roomRoutes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
