import mongoose from "mongoose";
import ChatRoom from "../models/chatroom.model.js";
import Message  from "../models/message.model.js";

const onlineUsers = new Map();

const emitToUser = (io, userId, event, payload) => {
    const socketId = onlineUsers.get(userId.toString());
    if (socketId) {
        io.to(socketId).emit(event, payload);
        return true;
    }
    return false;
};

const initSocket = (io) => {
    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        socket.on("register", async (userId) => {
            if (!userId) return;

            onlineUsers.set(userId.toString(), socket.id);
            console.log(`User registered: ${userId} → ${socket.id} | online: ${onlineUsers.size}`);

            try {
                const pending = await Message.find({ receiverId: userId, isDelivered: false })
                    .sort({ timestamp: 1 })
                    .lean();

                if (pending.length > 0) {
                    socket.emit("pendingMessages", pending);
                    await Message.updateMany(
                        { _id: { $in: pending.map((m) => m._id) } },
                        { $set: { isDelivered: true } }
                    );
                    console.log(`Flushed ${pending.length} pending messages to ${userId}`);
                }
            } catch (err) {
                console.error("Offline flush error:", err);
            }
        });

        socket.on("sendMessage", async (payload) => {
            const { senderId, receiverId, text, roomId: clientRoomId } = payload;

            if (!senderId || !receiverId || !text?.trim()) {
                socket.emit("messageError", { error: "Invalid payload" });
                return;
            }

            try {
                let room;
                if (clientRoomId && mongoose.isValidObjectId(clientRoomId)) {
                    room = await ChatRoom.findById(clientRoomId);
                }
                if (!room) room = await ChatRoom.findOrCreate(senderId, receiverId);

                const receiverOnline = onlineUsers.has(receiverId.toString());

                const message = await Message.create({
                    roomId:      room._id,
                    senderId,
                    receiverId,
                    text,
                    isDelivered: receiverOnline,
                    isRead:      false,
                    timestamp:   new Date(),
                });

                await ChatRoom.findByIdAndUpdate(room._id, {
                    lastMessage:   message._id,
                    lastMessageAt: message.timestamp,
                });

                const msgObj = message.toObject();

                socket.emit("messageSent", msgObj);

                if (receiverOnline) {
                    emitToUser(io, receiverId, "receiveMessage", msgObj);
                    console.log(`Delivered message ${message._id} to ${receiverId}`);
                } else {
                    console.log(`User ${receiverId} offline — message ${message._id} queued`);
                }
            } catch (err) {
                console.error("sendMessage error:", err);
                socket.emit("messageError", { error: "Failed to send message" });
            }
        });

        socket.on("markRead", async ({ roomId, userId }) => {
            if (!roomId || !userId) return;

            try {
                await Message.updateMany(
                    { roomId, receiverId: userId, isRead: false },
                    { $set: { isRead: true } }
                );

                const room = await ChatRoom.findById(roomId);
                if (room) {
                    room.participants
                        .filter((p) => p.toString() !== userId.toString())
                        .forEach((pid) => emitToUser(io, pid, "messagesRead", { roomId, readBy: userId }));
                }
            } catch (err) {
                console.error("markRead error:", err);
            }
        });

        socket.on("typing",     (p) => emitToUser(io, p.receiverId, "userTyping",     p));
        socket.on("stopTyping", (p) => emitToUser(io, p.receiverId, "userStopTyping", p));

        socket.on("disconnect", () => {
            for (const [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    onlineUsers.delete(userId);
                    console.log(`User disconnected: ${userId} | online: ${onlineUsers.size}`);
                    break;
                }
            }
        });
    });
};

export default initSocket;