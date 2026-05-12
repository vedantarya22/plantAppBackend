import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import { createServer } from "http";
import { Server } from "socket.io";

import userPlantRouter from "./routes/userPlant.routes.js";
import siteRouter      from "./routes/site.routes.js";
import plantRouter     from "./routes/plant.routes.js";
import userRouter      from "./routes/user.routes.js";
import uploadRouter    from "./routes/upload.routes.js";
import authRouter      from "./routes/auth.routes.js";
import protect         from "./middlewares/auth.middleware.js";
import postRouter      from "./routes/post.routes.js";
import messageRouter   from "./routes/message.routes.js";  

import initSocket from "./services/socket.js";

const app    = express();
const server = createServer(app);

const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }, // tighten in production
});

const PORT = process.env.PORT || 8000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/auth",       authRouter);
app.use("/api/plants",     plantRouter);
app.use("/api/userplants", protect, userPlantRouter);
app.use("/api/sites",      protect, siteRouter);
app.use("/api/upload",     protect, uploadRouter);
app.use("/api/users",      protect, userRouter);
app.use("/api/posts",      protect, postRouter);
app.use("/api/messages",   protect, messageRouter);  

app.get("/health", (_req, res) => res.status(200).json({ message: "OK" }));
app.get("/",       (_req, res) => res.send("Leafora API running"));


initSocket(io);


// ─── Start ────────────────────────────────────────────────────────────────────
const start = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("MongoDB connected");
        server.listen(PORT, () => console.log(`App listening on port ${PORT}`));
    } catch (err) {
        console.error("DB connection failed:", err);
        process.exit(1);
    }
};

start();