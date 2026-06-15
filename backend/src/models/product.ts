import mongoose, { Schema, Document } from "mongoose";

export interface ProductDoc extends Document {
  barcode: string;
  name: string;
  category?: string;
  type?: string;
  design?: string;
  color?: string;
  size?: string;
  price?: number; // Precio de costo
  priceNormal?: number; // Precio de venta normal
  priceTransfer?: number; // Precio con transferencia
  stock: number; // Cantidad de stock disponible
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

const ProductSchema = new Schema<ProductDoc>({
  barcode: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  category: String,
  type: String,
  design: String,
  color: String,
  size: String,
  price: { type: Number, default: 0 }, // Costo
  priceNormal: { type: Number, default: 0 }, // Venta normal
  priceTransfer: { type: Number, default: 0 }, // Transferencia
  stock: { type: Number, default: 0 }, // Cantidad de stock
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  deletedAt: { type: Date, default: null },
});

export const ProductModel = mongoose.model<ProductDoc>(
  "Product",
  ProductSchema
);
