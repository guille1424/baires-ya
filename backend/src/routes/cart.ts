import express from "express";
import { ProductModel } from "../models/product";

const router = express.Router();

/**
 * POST /api/public/cart/reserve
 * Bloquea temporalmente el stock de las prendas elegidas (Cart Locking).
 * Body: { items: { productId: string, quantity: number }[] }
 */
router.post("/reserve", async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "No items provided" });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60000); // 15 minutos

    // Check stock for all items first
    for (const item of items) {
      const p = await ProductModel.findById(item.productId);
      if (!p) return res.status(404).json({ error: `Producto no encontrado: ${item.productId}` });
      
      const reservedActive = (p.reservedUntil && p.reservedUntil > now) ? (p.reservedQty ?? 0) : 0;
      const available = Math.max(0, (p.stock ?? 0) - reservedActive);
      
      if (available < item.quantity) {
        return res.status(400).json({ 
          error: `Stock insuficiente para ${p.name}`, 
          available 
        });
      }
    }

    // Apply reservations
    for (const item of items) {
      const p = await ProductModel.findById(item.productId);
      if (p) {
        const reservedActive = (p.reservedUntil && p.reservedUntil > now) ? (p.reservedQty ?? 0) : 0;
        await ProductModel.findByIdAndUpdate(item.productId, {
          reservedQty: reservedActive + item.quantity,
          reservedUntil: expiresAt
        });
      }
    }

    res.json({ ok: true, expiresAt });
  } catch (err) {
    console.error("Error reservando carrito:", err);
    res.status(500).json({ error: "Error interno al reservar carrito" });
  }
});

export default router;
