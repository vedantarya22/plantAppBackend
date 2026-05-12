
import mongoose, { Schema } from "mongoose";


const userSchema = new mongoose.Schema({
  name:               { type: String, required: true },
  username:           { type: String, required: true, unique: true },
  profileImageString: { type: String, default: null },
  email: { type: String, unique: true, sparse: true },  // sparse allows multiple nulls 
  phoneNumber:        { type: String, default: null },
  dateOfBirth:        { type: String, default: null },

  password:           { type: String, default: null },
  authProvider:       { type: String, enum: ['local', 'google', 'apple'], default: 'local' },
  isVerified:         { type: Boolean, default: false },
   verifyToken:        { type: String,  default: null },      
    verifyTokenExpiry:  { type: Date,    default: null },       

  savedPosts : [{type:mongoose.Schema.Types.ObjectId,ref : "Post"}],
  
  // E2EE: Base64-encoded Curve25519 (X25519) public key.
    // Generated on iOS via CryptoKit on first launch.
    // Private key stays in device Keychain and never leaves.
    // Fetched by senders to derive shared AES-256-GCM secret via ECDH.
    publicKey: { type: String, default: null },

}, { timestamps: true });

//  Virtual: plantCount calculated on the fly, never stored
userSchema.virtual('plantCount', {
  ref:          'UserPlant',
  localField:   '_id',
  foreignField: 'userId',
  count: true          // returns a number instead of documents
});

export default mongoose.model('User', userSchema);