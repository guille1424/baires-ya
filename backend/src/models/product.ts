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
  priceEcommerce?: number; // Precio para la tienda pública (se activa en fase posterior)
  stock: number; // Cantidad de stock disponible
  supplierName?: string; // Nombre del proveedor/tienda
  supplierAddress?: string; // Dirección del proveedor/tienda
  // --- E-commerce: imágenes ---
  images?: string[]; // URLs de Cloudinary (máx 5, [0] = imagen principal)
  imagePublicIds?: string[]; // IDs internos de Cloudinary para poder borrarlas
  // --- E-commerce: visibilidad pública ---
  isPublic?: boolean; // ¿Aparece en la tienda pública?
  publicDescription?: string; // Descripción para la tienda pública
  // --- E-commerce: reserva de stock (cart locking) ---
  reservedQty?: number; // Unidades reservadas temporalmente en proceso de pago
  reservedUntil?: Date; // Hasta cuándo vale la reserva (se libera si vence)
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
  priceEcommerce: { type: Number, default: 0 }, // Precio web (activar en fase posterior)
  stock: { type: Number, default: 0 }, // Cantidad de stock
  supplierName: { type: String, default: "" }, // Nombre del proveedor/tienda
  supplierAddress: { type: String, default: "" }, // Dirección del proveedor/tienda
  // E-commerce: imágenes
  images: { type: [String], default: [] },
  imagePublicIds: { type: [String], default: [] },
  // E-commerce: visibilidad
  isPublic: { type: Boolean, default: false },
  publicDescription: { type: String, default: "" },
  // E-commerce: reserva de stock
  reservedQty: { type: Number, default: 0 },
  reservedUntil: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  deletedAt: { type: Date, default: null },
});

export const ProductModel = mongoose.model<ProductDoc>(
  "Product",
  ProductSchema
);
