// models/User.js
import mongoose, { Schema } from "mongoose";


const userSchema = new mongoose.Schema({
  name:               { type: String, required: true },
  username:           { type: String, required: true, unique: true },
  profileImageString: { type: String, default: null },
  email:              { type: String, unique: true },  
  phoneNumber:        { type: String, default: null },
  dateOfBirth:        { type: String, default: null },

  // 🔐 Auth fields — defined now, not used yet
  password:           { type: String, default: null },
  authProvider:       { type: String, enum: ['local', 'google', 'apple'], default: 'local' },
  isVerified:         { type: Boolean, default: false },

}, { timestamps: true });

// ✅ Virtual: plantCount calculated on the fly, never stored
userSchema.virtual('plantCount', {
  ref:          'UserPlant',
  localField:   '_id',
  foreignField: 'userId',
  count: true          // returns a number instead of documents
});

export default mongoose.model('User', userSchema);