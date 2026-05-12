import mongoose from "mongoose";

// NOTE ON E2EE:
// The `text` field stores base64-encoded AES-GCM ciphertext produced entirely on the sender's device.
// The server never sees plaintext. Decryption happens only on the recipient's device using
// a shared secret derived via ECDH (Curve25519) from the two users' key pairs.
// Combined AES-GCM output layout: [12-byte IV | ciphertext | 16-byte auth tag] → base64.

const messageSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatRoom",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Ciphertext only — never plaintext
    text: { type: String, required: true },

    // isDelivered → socket push reached the receiver's active session
    // isRead      → receiver opened the conversation (set by client)
    isDelivered: { type: Boolean, default: false },
    isRead: { type: Boolean, default: false },

    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

// Fast paginated room history
messageSchema.index({ roomId: 1, timestamp: 1 });

// Fast offline-flush query on register
messageSchema.index({ receiverId: 1, isDelivered: false });

export default mongoose.model("Message", messageSchema);
