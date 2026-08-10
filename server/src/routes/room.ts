import express from "express";
import * as roomController from "../controllers/roomController.js";

const router = express.Router();

router.get("/", roomController.listRooms);
router.get("/get-room", roomController.getRoom);
router.get("/user-in-room", roomController.userInRoom);

router.post("/create", roomController.createRoom);
router.post("/join", roomController.joinRoom);
router.post("/leave-room", roomController.leaveRoom);

router.patch("/update-room", roomController.updateRoom);

export default router;
