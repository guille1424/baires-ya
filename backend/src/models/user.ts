import mongoose, { Schema, Document } from "mongoose";

export interface UserDoc extends Document {
  username: string;
  passwordHash: string;
  role: "admin" | "employee";
  createdAt?: Date;
}

const UserSchema = new Schema<UserDoc>({
  username: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["admin", "employee"], default: "admin" },
  createdAt: { type: Date, default: Date.now },
});

export const UserModel = mongoose.model<UserDoc>("User", UserSchema);
