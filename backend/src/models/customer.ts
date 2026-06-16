import mongoose, { Schema, Document } from "mongoose";

export interface CustomerDoc extends Document {
  name: string;
  phone: string;
  email?: string;
  passwordHash?: string;
  address?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

const CustomerSchema = new Schema<CustomerDoc>({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, sparse: true, unique: true },
  passwordHash: { type: String },
  address: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  deletedAt: { type: Date, default: null },
});

export const CustomerModel = mongoose.model<CustomerDoc>("Customer", CustomerSchema);
