import express from "express";
import { ProductModel } from "../models/product";
import { SaleModel } from "../models/sale";

const router = express.Router();

/**
 * POST /api/public/cart/reserve
 * Bloquea temporalmente el stock de las prendas elegidas (Cart Locking).
 * Body: { items: { productId: string, quantity: number }[] }
 */
router.post("/reserve", async (req, res) => {
  try {
    const { items, customerId, customerName, totalAmount } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "No items provided" });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60000); // 15 minutos de reserva (opcional)

    const saleItems = [];
    let calculatedTotal = 0;

    // Procesar cada item
    for (const item of items) {
      const p = await ProductModel.findById(item.productId);
      if (!p) return res.status(404).json({ error: `Producto no encontrado: ${item.productId}` });
      
      const reservedActive = (p.reservedUntil && p.reservedUntil > now) ? (p.reservedQty ?? 0) : 0;
      const available = Math.max(0, (p.stock ?? 0) - reservedActive);
      
      const isPreOrder = available < item.quantity;

      // Calcular precio
      const priceAtSale = p.priceNormal || 0;
      calculatedTotal += priceAtSale * item.quantity;

      saleItems.push({
        productId: p._id,
        barcode: p.barcode,
        name: p.name,
        quantity: item.quantity,
        priceAtSale,
        priceType: "normal",
        isPreOrder
      });

      // Reservar stock temporalmente (opcional si es pre-order, pero lo hacemos igual)
      await ProductModel.findByIdAndUpdate(item.productId, {
        reservedQty: reservedActive + item.quantity,
        reservedUntil: expiresAt
      });
    }

    // Crear el Pedido Web
    const newSale = await SaleModel.create({
      customerId: customerId || null,
      customerName: customerName || "Invitado Web",
      date: new Date(),
      totalAmount: totalAmount || calculatedTotal,
      items: saleItems,
      orderSource: "web",
      status: "web_pending"
    });

    res.json({ ok: true, expiresAt, orderId: newSale._id });
  } catch (err) {
    console.error("Error reservando carrito:", err);
    res.status(500).json({ error: "Error interno al reservar carrito" });
  }
});

export default router;
