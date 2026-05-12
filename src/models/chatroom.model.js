import mongoose from "mongoose";

const chatRoomSchema = new mongoose.Schema(
  {
    // Stored sorted so [A,B] and [B,A] always resolve to the same document
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ],

    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    lastMessageAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// One room per participant pair — enforce at DB level
chatRoomSchema.index({ participants: 1 }, { unique: true });

// Find an existing DM room or create one. Sorting ensures [A,B] === [B,A].
chatRoomSchema.statics.findOrCreate = async function (userIdA, userIdB) {
  const sorted = [userIdA.toString(), userIdB.toString()].sort();
  let room = await this.findOne({ participants: { $all: sorted, $size: 2 } });
  if (!room) room = await this.create({ participants: sorted });
  return room;
};

export default mongoose.model("ChatRoom", chatRoomSchema);
