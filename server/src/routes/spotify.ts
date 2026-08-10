import express from "express";
import * as spotifyController from "../controllers/spotifyController.js";

const router = express.Router();

router.get("/get-auth-url", spotifyController.authView);
router.get("/is-authenticated", spotifyController.isAuthenticated);
router.get("/current-song", spotifyController.currSong);

router.put("/song_control", spotifyController.songControl);
router.post("/skip", spotifyController.skipSong);

export default router;
