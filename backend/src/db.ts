import mongoose from "mongoose";

export async function initDb() {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/stockmanager";
  await mongoose.connect(uri, {
    dbName: "stockmanager",
  });
  console.log("MongoDB connected:", uri);
}
