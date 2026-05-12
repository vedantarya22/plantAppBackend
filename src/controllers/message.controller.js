import ChatRoom from "../models/chatRoom.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC KEY MANAGEMENT
// E2EE requires each client to upload its Curve25519 public key once (on first
// launch / after key generation). Other users fetch this key before encrypting.
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/messages/keys/register
// Body: { publicKey: "<base64 X25519 public key>" }
// Called once when the iOS app generates its Curve25519 key pair on first launch.
export const registerPublicKey = async (req, res) => {
  try {
    const { publicKey } = req.body;

    if (!publicKey || typeof publicKey !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "publicKey is required" });
    }

    await User.findByIdAndUpdate(req.userId, { publicKey });

    res.status(200).json({ success: true, message: "Public key registered" });
  } catch (err) {
    console.error("registerPublicKey error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/messages/keys/:userId
// Fetch another user's public key before encrypting a message to them.
// The sender uses this + their own private key to derive the shared AES secret via ECDH.
export const getPublicKey = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("publicKey");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (!user.publicKey) {
      return res.status(404).json({
        success: false,
        message: "This user has not registered a public key yet",
      });
    }

    res.status(200).json({ success: true, publicKey: user.publicKey });
  } catch (err) {
    console.error("getPublicKey error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CHAT ROOMS
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/messages/rooms
// All rooms the current user participates in, sorted by latest activity.
export const getUserRooms = async (req, res) => {
  try {
    const userId = req.userId;

    const rooms = await ChatRoom.find({ participants: userId })
      .populate("participants", "name username profileImageString publicKey")
      .populate({
        path: "lastMessage",
        select: "text timestamp isRead senderId",
      })
      .sort({ lastMessageAt: -1 });

    // Attach unread count per room so the inbox badge renders correctly
    const roomsWithUnread = await Promise.all(
      rooms.map(async (room) => {
        const unreadCount = await Message.countDocuments({
          roomId: room._id,
          receiverId: userId,
          isRead: false,
        });
        return { ...room.toObject(), unreadCount };
      }),
    );

    res.status(200).json({ success: true, rooms: roomsWithUnread });
  } catch (err) {
    console.error("getUserRooms error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/messages/rooms/:receiverId
// Find or create a DM room. iOS calls this before opening a conversation.
export const findOrCreateRoom = async (req, res) => {
  try {
    const senderId = req.userId;
    const receiverId = req.params.receiverId;

    if (senderId.toString() === receiverId) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot chat with yourself" });
    }

    const room = await ChatRoom.findOrCreate(senderId, receiverId);
    await room.populate(
      "participants",
      "name username profileImageString publicKey",
    );

    res.status(200).json({ success: true, room });
  } catch (err) {
    console.error("findOrCreateRoom error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGES
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/messages/rooms/:roomId/messages?before=<ISO date>&limit=<n>
// Cursor-based paginated history. Returns ciphertext — client decrypts.
// Also marks fetched messages as read for the current user.
export const getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { before, limit = 40 } = req.query;
    const userId = req.userId;

    const room = await ChatRoom.findOne({ _id: roomId, participants: userId });
    if (!room) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const query = { roomId };
    if (before) query.timestamp = { $lt: new Date(before) };

    const messages = await Message.find(query)
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .lean();

    // Mark as read — client opened the conversation
    await Message.updateMany(
      { roomId, receiverId: userId, isRead: false },
      { $set: { isRead: true } },
    );

    res.status(200).json({
      success: true,
      messages: messages.reverse(), // oldest → newest for UI
    });
  } catch (err) {
    console.error("getRoomMessages error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// PATCH /api/messages/rooms/:roomId/read
// Explicit read-receipt from client (e.g. on viewDidAppear).
export const markRoomRead = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.userId;

    await Message.updateMany(
      { roomId, receiverId: userId, isRead: false },
      { $set: { isRead: true } },
    );

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("markRoomRead error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
