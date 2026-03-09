import mongoose from "mongoose";
import { plants } from "./data.js";
import Plant from "../models/plant.model.js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

// ✅ This finds your .env no matter where you run the file from
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") }); // goes up to backend root

const MONGO_URL = process.env.MONGO_URL;
console.log("MONGO_URL:", MONGO_URL); //  add this to verify it's being read

main()
  .then(() => console.log("✅ Connected to DB"))
  .catch((err) => console.log(err));

async function main() {
  await mongoose.connect(MONGO_URL);
}

const initDb = async () => {
  await Plant.deleteMany({});
  await Plant.insertMany(plants);
  console.log(`DB initialised,  ${plants.length} plants inserted`);

};

initDb();