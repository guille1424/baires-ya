import mongoose, { Schema, Document, Types } from "mongoose";

export interface SaleItem {
  productId?: Types.ObjectId;
  barcode?: string;
  name?: string;
  quantity: number;
  priceAtSale: number;
  priceType?: string; // 'normal' | 'transfer' | 'custom'
  isPreOrder?: boolean; // Flag para indicar venta bajo pedido sin stock
}

export interface SaleDoc extends Document {
  customerId?: Types.ObjectId; // Referencia al cliente real
  customerName: string; // Nombre del comprador (para compatibilidad)
  customerPhone?: string; // Teléfono del comprador (para contacto directo)
  date: Date;
  totalAmount: number;
  items: SaleItem[];
  status: "pending" | "delivered"; // Estado del pedido
  deliveredAt?: Date; // Fecha de entrega
}

const SaleItemSchema = new Schema<SaleItem>({
  productId: { type: Schema.Types.ObjectId, ref: "Product" },
  barcode: String,
  name: String,
  quantity: { type: Number, required: true },
  priceAtSale: { type: Number, required: true },
  priceType: {
    type: String,
    enum: ["normal", "transfer", "custom"],
    default: "normal",
  },
  isPreOrder: { type: Boolean, default: false },
});

const SaleSchema = new Schema<SaleDoc>({
  customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
  customerName: { type: String, required: true },
  customerPhone: { type: String },
  date: { type: Date, default: Date.now },
  totalAmount: { type: Number, required: true },
  items: [SaleItemSchema],
  status: { type: String, enum: ["pending", "delivered"], default: "pending" },
  deliveredAt: { type: Date },
});

export const SaleModel = mongoose.model<SaleDoc>("Sale", SaleSchema);
