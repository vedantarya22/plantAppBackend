import express from "express";
import {
    registerPublicKey,
    getPublicKey,
    getUserRooms,
    findOrCreateRoom,
    getRoomMessages,
    markRoomRead,
} from "../controllers/message.controller.js";

const messageRouter = express.Router();

// ── Public key exchange (required for E2EE) ───────────────────────────────────
messageRouter.post("/keys/register",    registerPublicKey); // upload own public key
messageRouter.get("/keys/:userId",      getPublicKey);      // fetch another user's public key

// ── Rooms ─────────────────────────────────────────────────────────────────────
messageRouter.get("/rooms",             getUserRooms);      // inbox
messageRouter.post("/rooms/:receiverId",findOrCreateRoom);  // open/create DM

// ── Messages ──────────────────────────────────────────────────────────────────
messageRouter.get("/rooms/:roomId/messages",  getRoomMessages); // paginated history
messageRouter.patch("/rooms/:roomId/read",    markRoomRead);    // mark conversation read

export default messageRouter;