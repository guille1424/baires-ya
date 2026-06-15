import mongoose, { Schema, Document } from "mongoose";

export interface AttributeDoc extends Document {
  type: string; // category, size, color, design
  value: string;
}

const AttributeSchema = new Schema<AttributeDoc>({
  type: { type: String, required: true },
  value: { type: String, required: true },
});

export const AttributeModel = mongoose.model<AttributeDoc>(
  "Attribute",
  AttributeSchema
);
