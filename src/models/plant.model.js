
import mongoose from "mongoose";

const careFrequencySchema = new mongoose.Schema(
  {
    display: { type: String, required: true },
    days:    { type: Number, required: true },
    method:  { type: String, default: null },
    steps:   { type: [String], default: [] },
  },
  { _id: false },
);

const careCycleSchema = new mongoose.Schema(
  {
    watering:    careFrequencySchema,
    repotting:   careFrequencySchema,
    fertilizing: careFrequencySchema,
    pruning:     careFrequencySchema,
  },
  { _id: false },
);

const soilTypeSchema = new mongoose.Schema(
  {
    characteristics: { type: String },
    soil_used:       { type: String },  //  matches data.js
  },
  { _id: false },
);

const plantSchema = new mongoose.Schema(
  {
    plant_id:        { type: String, required: true, unique: true }, // 
    plant_name:      { type: String, required: true },               // 
    scientific_name: { type: String },                               // 
    description:     { type: String },
    category:        { type: [String], default: [] },
    tags:            { type: [String], default: [] },
    image_name:      { type: String },                               // 
    care_cycle:      careCycleSchema,                                // 
    soil_type:       soilTypeSchema,                                 // 
    benefits:        { type: [String], default: [] },
    pet_friendly:    { type: Boolean, default: false },              // 
    toxic:           { type: Boolean, default: false },
    light_required:  {                                               // 
      type: String,
      enum: [
        "low_light",
        "low_to_medium",
        "low_to_bright_indirect",
        "medium_light",
        "bright_indirect",
        "partial_sunlight",
        "full_sunlight",
      ],
    },
    care_difficulty: {                                               // 
      type: String,
      enum: ["easy", "moderate", "advanced"],
    },
    common_issues: { type: [String], default: [] },                  // 
  },
  { timestamps: true },
);

export default mongoose.model("Plant", plantSchema);