import express from "express";
import mongoose from "mongoose";

import dotenv from "dotenv";
import { createServer } from "http";         
import { Server } from "socket.io";

import userPlantRouter from './routes/userPlant.routes.js';
import siteRouter from './routes/site.routes.js';
import plantRouter from './routes/plant.routes.js';
import userRouter from './routes/user.routes.js';
import uploadRouter from "./routes/upload.routes.js"
import authRouter from './routes/auth.routes.js';
import protect from './middlewares/auth.middleware.js';
import postRouter from "./routes/post.routes.js";

dotenv.config();
const app = express();
const server = createServer(app);  

const io = new Server(server, {
    cors: {
        origin: "*",          // tighten this in production
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 8000;



app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use('/api/auth', authRouter);
app.use('/api/plants', plantRouter);

// MARK: Protected — JWT required
app.use('/api/userplants', protect, userPlantRouter);
app.use('/api/sites',      protect, siteRouter);
app.use('/api/upload',     protect, uploadRouter);
app.use('/api/users',      protect, userRouter);
app.use('/api/posts', protect,postRouter);

app.get("/health", (req, res) => {
    res.status(200).json({message: "OK"});
})

app.get("/",(req,res)=>{
    console.log("Plant api running");
    res.send("Plant api running");
})

// ── Socket.io ────────────────────────────────────────────────
// Maps userId → socketId so we can find a user's socket
const onlineUsers = new Map();   // userId → socketId
 
io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);
 
    // Client emits this right after connecting, passing their userId
    socket.on("register", (userId) => {
        onlineUsers.set(userId, socket.id);
        console.log(`✅ User registered: ${userId} → ${socket.id}`);
        console.log(`👥 Online users: ${onlineUsers.size}`);
    });
 
    // Client emits this to send a message
    // payload: { senderId, receiverId, text, messageId, timestamp }
    socket.on("sendMessage", (payload) => {
        console.log(`💬 Message from ${payload.senderId} to ${payload.receiverId}: ${payload.text}`);
 
        const receiverSocketId = onlineUsers.get(payload.receiverId);
        if (receiverSocketId) {
            // Receiver is online — forward immediately
            io.to(receiverSocketId).emit("receiveMessage", payload);
            console.log(`📨 Delivered to socket ${receiverSocketId}`);
        } else {
            // Receiver is offline — message is lost (by design for now)
            console.log(`⚠️ User ${payload.receiverId} is offline — message not delivered`);
        }
    });
 
    socket.on("disconnect", () => {
        // Remove from online map
        for (const [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                onlineUsers.delete(userId);
                console.log(`❌ User disconnected: ${userId}`);
                break;
            }
        }
        console.log(`👥 Online users: ${onlineUsers.size}`);
    });
});


const start = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("mongodb connected");
        // ✅ Use server.listen NOT app.listen — required for Socket.io
        server.listen(PORT, () => {
            console.log(`App is listening on port ${PORT}`);
        });
    } catch (err) {
        console.error("db connection failed");
        console.error(err);
    }
};
 
start();