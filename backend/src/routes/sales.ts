import express from "express";
import { SaleModel } from "../models/sale";
import { ProductModel } from "../models/product";
import mongoose from "mongoose";

const router = express.Router();

// Crear pedido (reserva productos, estado pending)
router.post("/", async (req, res) => {
  try {
    const { customerId, customerName, customerPhone, items } = req.body;

    if (!customerName || !customerName.trim()) {
      return res.status(400).json({ error: "customerName required" });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "items required" });
    }

    let totalAmount = 0;
    const saleItems = [];

    // Procesar cada item (cada item tiene su propio quantity, priceType y customPrice si aplica)
    for (const item of items) {
      const { barcode, quantity = 1, priceType = "normal", customPrice } = item;

      // Buscar producto específico
      const product = await ProductModel.findOne({
        barcode,
        deletedAt: null,
      });

      if (!product) {
        throw new Error(`Producto con código ${barcode} no encontrado`);
      }

      // Determinar precio según tipo seleccionado para este item
      let priceAtSale = product.priceNormal || 0;
      if (priceType === "transfer") {
        priceAtSale = product.priceTransfer || 0;
      } else if (priceType === "custom") {
        if (customPrice === undefined || customPrice === null) {
          throw new Error(
            `Precio custom requerido para producto ${product.name}`
          );
        }
        priceAtSale = customPrice;
      }

      // Lógica de stock por cantidad:
      // Dividir el ítem en stock real y pre-pedido si hay stock insuficiente
      const currentStock = product.stock || 0;
      const inStockQty = Math.min(currentStock, quantity);
      const preOrderQty = quantity - inStockQty;

      if (inStockQty > 0) {
        totalAmount += priceAtSale * inStockQty;
        saleItems.push({
          productId: product._id,
          barcode: product.barcode,
          name: product.name,
          quantity: inStockQty,
          priceAtSale,
          priceType,
          isPreOrder: false,
        });
        product.stock -= inStockQty;
      }

      if (preOrderQty > 0) {
        totalAmount += priceAtSale * preOrderQty;
        saleItems.push({
          productId: product._id,
          barcode: product.barcode,
          name: product.name,
          quantity: preOrderQty,
          priceAtSale,
          priceType,
          isPreOrder: true,
        });
      }

      product.updatedAt = new Date();
      await product.save();
    }

    // Crear pedido con estado "pending"
    const sale = await SaleModel.create({
      customerId: customerId || undefined,
      customerName,
      customerPhone: customerPhone || undefined,
      date: new Date(),
      totalAmount,
      items: saleItems,
      status: "pending",
    });

    res.status(201).json(sale);
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message || "Error al procesar pedido" });
  }
});

// Agregar items a un pedido existente (solo si está pending)
router.post("/:id/add-items", async (req, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "items required" });
    }

    const sale = await SaleModel.findById(id);
    if (!sale) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    if (sale.status !== "pending") {
      return res
        .status(400)
        .json({ error: "Solo se pueden agregar items a pedidos pendientes" });
    }

    let additionalAmount = 0;
    const newSaleItems = [];

    // Procesar cada item nuevo
    for (const item of items) {
      const { barcode, quantity = 1, priceType = "normal", customPrice } = item;

      const product = await ProductModel.findOne({
        barcode,
        deletedAt: null,
      });

      if (!product) {
        throw new Error(`Producto con código ${barcode} no encontrado`);
      }

      // Determinar precio
      let priceAtSale = product.priceNormal || 0;
      if (priceType === "transfer") {
        priceAtSale = product.priceTransfer || 0;
      } else if (priceType === "custom") {
        if (customPrice === undefined || customPrice === null) {
          throw new Error(
            `Precio custom requerido para producto ${product.name}`
          );
        }
        priceAtSale = customPrice;
      }

      // Dividir el ítem en stock real y pre-pedido si hay stock insuficiente
      const currentStock = product.stock || 0;
      const inStockQty = Math.min(currentStock, quantity);
      const preOrderQty = quantity - inStockQty;

      if (inStockQty > 0) {
        additionalAmount += priceAtSale * inStockQty;
        newSaleItems.push({
          productId: product._id,
          barcode: product.barcode,
          name: product.name,
          quantity: inStockQty,
          priceAtSale,
          priceType,
          isPreOrder: false,
        });
        product.stock -= inStockQty;
      }

      if (preOrderQty > 0) {
        additionalAmount += priceAtSale * preOrderQty;
        newSaleItems.push({
          productId: product._id,
          barcode: product.barcode,
          name: product.name,
          quantity: preOrderQty,
          priceAtSale,
          priceType,
          isPreOrder: true,
        });
      }

      product.updatedAt = new Date();
      await product.save();
    }

    // Actualizar pedido agregando los nuevos items
    sale.items.push(...newSaleItems);
    sale.totalAmount += additionalAmount;
    await sale.save();

    res.json(sale);
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message || "Error al agregar items" });
  }
});

// Marcar pedido como entregado
router.patch("/:id/deliver", async (req, res) => {
  try {
    const { id } = req.params;

    const sale = await SaleModel.findById(id);
    if (!sale) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    if (sale.status === "delivered") {
      return res.status(400).json({ error: "Pedido ya fue entregado" });
    }

    // Actualizar estado del pedido (el stock ya se descontó al crear la reserva)
    sale.status = "delivered";
    sale.deliveredAt = new Date();
    await sale.save();

    res.json(sale);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Error al entregar pedido" });
  }
});

// Cancelar pedido (devuelve productos reservados)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const sale = await SaleModel.findById(id);
    if (!sale) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    if (sale.status === "delivered") {
      return res
        .status(400)
        .json({ error: "No se puede cancelar un pedido ya entregado" });
    }

    // Liberar productos reservados (solo los que NO eran pre-pedidos)
    for (const item of sale.items) {
      if (!item.isPreOrder) {
        await ProductModel.updateOne(
          { barcode: item.barcode, deletedAt: null },
          {
            $inc: { stock: item.quantity },
            updatedAt: new Date(),
          }
        );
      }
    }

    // Eliminar el pedido
    await SaleModel.findByIdAndDelete(id);

    res.json({ message: "Pedido cancelado y productos liberados" });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Error al cancelar pedido" });
  }
});

// Obtener consolidación de compras (artículos pre-order en pedidos pendientes)
router.get("/consolidation", async (req, res) => {
  try {
    // 1. Obtener todos los pedidos pendientes
    const pendingSales = await SaleModel.find({ status: "pending" });

    // 2. Extraer ítems con isPreOrder y acumular cantidades por código de barras
    const preOrderQuantities: { [barcode: string]: number } = {};
    for (const sale of pendingSales) {
      for (const item of sale.items) {
        if (item.isPreOrder && item.barcode) {
          preOrderQuantities[item.barcode] = (preOrderQuantities[item.barcode] || 0) + item.quantity;
        }
      }
    }

    const barcodes = Object.keys(preOrderQuantities);
    if (barcodes.length === 0) {
      return res.json([]);
    }

    // 3. Buscar la información actual de los productos
    const products = await ProductModel.find({
      barcode: { $in: barcodes },
      deletedAt: null,
    });

    // 4. Mapear y agrupar la información
    const consolidationList = products
      .map((product) => {
        const quantity = preOrderQuantities[product.barcode] || 0;
        return {
          barcode: product.barcode,
          name: product.name,
          category: product.category || "",
          size: product.size || "",
          color: product.color || "",
          supplierName: product.supplierName || "Sin Proveedor",
          supplierAddress: product.supplierAddress || "",
          quantity,
        };
      })
      .filter((item) => item.quantity > 0);

    res.json(consolidationList);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Error al generar consolidación" });
  }
});

// Listar ventas/pedidos
router.get("/", async (req, res) => {
  try {
    const { status } = req.query;
    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    const sales = await SaleModel.find(filter).sort({ date: -1 });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: "internal" });
  }
});

// Obtener venta por ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const sale = await SaleModel.findById(id);
    if (!sale) return res.status(404).json({ error: "not found" });
    res.json(sale);
  } catch (err) {
    res.status(500).json({ error: "internal" });
  }
});

export default router;
