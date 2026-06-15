import mongoose, { Schema, Document } from "mongoose";

export interface UserDoc extends Document {
  username: string;
  passwordHash: string;
  createdAt?: Date;
}

const UserSchema = new Schema<UserDoc>({
  username: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const UserModel = mongoose.model<UserDoc>("User", UserSchema);
