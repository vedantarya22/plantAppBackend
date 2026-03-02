// models/UserPlant.js
import mongoose, { Schema } from "mongoose";


const userPlantSchema = new mongoose.Schema({
  plantId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Plant', required: true },
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  siteName: { type: String },
   siteId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Site' },
  imageData:        { type: String, default: null },
  lightRequirement: {
    type: String,
    enum: [
      'low_light',
      'low_to_medium',
      'low_to_bright_indirect',
      'medium_light',
      'bright_indirect',
      'partial_sunlight',
      'full_sunlight'
    ],
    default: null
  },
  watering:        { type: String, default: null },
  repotting:       { type: String, default: null },
  quantity:        { type: Number, default: 1 },
  isAddedToGarden: { type: Boolean, default: true },

  lastWatered:    { type: Date, default: null },
  lastPruned:     { type: Date, default: null },
  lastFertilized: { type: Date, default: null },
  lastRepotted:   { type: Date, default: null },

}, { timestamps: true });

export default mongoose.model('UserPlant', userPlantSchema);