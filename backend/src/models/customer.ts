import mongoose, { Schema, Document } from "mongoose";

export interface CustomerDoc extends Document {
  name: string;
  phone: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

const CustomerSchema = new Schema<CustomerDoc>({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  deletedAt: { type: Date, default: null },
});

export const CustomerModel = mongoose.model<CustomerDoc>("Customer", CustomerSchema);
