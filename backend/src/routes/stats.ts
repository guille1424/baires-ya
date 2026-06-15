import express from "express";
import { ProductModel } from "../models/product";
import { SaleModel } from "../models/sale";

const router = express.Router();

router.get("/summary", async (req, res) => {
  try {
    // Productos activos (no eliminados)
    const allProducts = await ProductModel.find({ deletedAt: null });

    // Calcular valores totales del inventario disponible
    const totalCost = allProducts.reduce(
      (sum, p) => sum + (p.price || 0) * (p.stock || 0),
      0
    );
    const totalNormal = allProducts.reduce(
      (sum, p) => sum + (p.priceNormal || 0) * (p.stock || 0),
      0
    );
    const totalTransfer = allProducts.reduce(
      (sum, p) => sum + (p.priceTransfer || 0) * (p.stock || 0),
      0
    );
    const totalItems = allProducts.reduce((sum, p) => sum + (p.stock || 0), 0);

    // Calcular valores de productos vendidos REALES por tipo de precio
    // Consultamos todas las ventas entregadas (delivered) para las estadísticas históricas
    const allSales = await SaleModel.find({ status: "delivered" });

    let soldCostNormal = 0;
    let soldCostTransfer = 0;
    let soldCostCustom = 0;
    let soldNormal = 0;
    let soldTransfer = 0;
    let soldCustom = 0;
    let soldItemsNormal = 0;
    let soldItemsTransfer = 0;
    let soldItemsCustom = 0;
    let totalSoldItems = 0;

    for (const sale of allSales) {
      for (const item of sale.items) {
        const product = await ProductModel.findOne({ barcode: item.barcode });
        const cost = product ? (product.price || 0) : 0;
        const qty = item.quantity || 1;

        totalSoldItems += qty;

        // Sumar según el tipo de precio REAL de la venta
        if (item.priceType === "normal") {
          soldNormal += item.priceAtSale * qty;
          soldCostNormal += cost * qty;
          soldItemsNormal += qty;
        } else if (item.priceType === "transfer") {
          soldTransfer += item.priceAtSale * qty;
          soldCostTransfer += cost * qty;
          soldItemsTransfer += qty;
        } else if (item.priceType === "custom") {
          soldCustom += item.priceAtSale * qty;
          soldCostCustom += cost * qty;
          soldItemsCustom += qty;
        }
      }
    }

    // Ventas del mes actual (monto total de ventas entregadas creadas este mes)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const salesThisMonth = await SaleModel.find({
      status: "delivered",
      date: { $gte: startOfMonth },
    });

    const monthlySales = salesThisMonth.reduce(
      (sum, s) => sum + s.totalAmount,
      0
    );

    res.json({
      // Inventario disponible
      available: {
        totalItems,
        totalCost,
        totalNormal,
        totalTransfer,
        marginNormal: totalNormal - totalCost,
        marginTransfer: totalTransfer - totalCost,
      },
      // Productos vendidos (valores reales según tipo de venta)
      sold: {
        totalItems: totalSoldItems,
        totalItemsNormal: soldItemsNormal,
        totalItemsTransfer: soldItemsTransfer,
        totalItemsCustom: soldItemsCustom,
        totalCost: soldCostNormal + soldCostTransfer + soldCostCustom,
        totalNormal: soldNormal,
        totalTransfer: soldTransfer,
        totalCustom: soldCustom,
        marginNormal: soldNormal - soldCostNormal,
        marginTransfer: soldTransfer - soldCostTransfer,
        marginCustom: soldCustom - soldCostCustom,
      },
      monthlySales,
      totalProducts: allProducts.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal" });
  }
});

// Reporte mensual de ventas
router.get("/monthly-report", async (req, res) => {
  try {
    const { month, year } = req.query;

    const now = new Date();
    const targetYear = year ? parseInt(year as string) : now.getFullYear();
    const targetMonth = month ? parseInt(month as string) - 1 : now.getMonth();

    const startOfMonth = new Date(targetYear, targetMonth, 1);
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

    // Obtener ventas entregadas del mes
    const sales = await SaleModel.find({
      status: "delivered",
      date: { $gte: startOfMonth, $lte: endOfMonth },
    });

    const detailedSales: any[] = [];
    let totalRevenue = 0;
    let totalCost = 0;

    for (const sale of sales) {
      for (const item of sale.items) {
        const product = await ProductModel.findOne({ barcode: item.barcode });
        const cost = product ? (product.price || 0) : 0;
        const qty = item.quantity || 1;
        const subtotal = item.priceAtSale * qty;
        const subcost = cost * qty;

        const priceTypeLabel =
          item.priceType === "transfer"
            ? "Transferencia"
            : item.priceType === "custom"
            ? "Personalizado"
            : "Normal";

        detailedSales.push({
          barcode: item.barcode,
          name: item.name,
          category: product ? product.category : "",
          size: product ? product.size : "",
          color: product ? product.color : "",
          quantity: qty,
          cost: cost,
          priceType: priceTypeLabel,
          salePrice: item.priceAtSale,
          totalRevenue: subtotal,
          profit: subtotal - subcost,
          date: sale.date,
        });

        totalRevenue += subtotal;
        totalCost += subcost;
      }
    }

    res.json({
      period: {
        month: targetMonth + 1,
        year: targetYear,
        startDate: startOfMonth,
        endDate: endOfMonth,
      },
      detailedSales,
      summary: {
        totalSales: sales.length,
        totalItems: detailedSales.reduce((sum, s) => sum + s.quantity, 0),
        totalRevenue,
        totalCost,
        totalProfit: totalRevenue - totalCost,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal" });
  }
});

// Reporte completo histórico
router.get("/full-report", async (req, res) => {
  try {
    const allProducts = await ProductModel.find({ deletedAt: null });

    // Obtener todas las ventas entregadas
    const allSales = await SaleModel.find({ status: "delivered" });

    let totalRevenueNormal = 0;
    let totalRevenueTransfer = 0;
    let totalRevenueCustom = 0;
    let totalCostNormal = 0;
    let totalCostTransfer = 0;
    let totalCostCustom = 0;
    let soldItemsNormal = 0;
    let soldItemsTransfer = 0;
    let soldItemsCustom = 0;

    const soldProductsDetails: any[] = [];

    for (const sale of allSales) {
      for (const item of sale.items) {
        const product = await ProductModel.findOne({ barcode: item.barcode });
        const cost = product ? (product.price || 0) : 0;
        const qty = item.quantity || 1;
        const subtotal = item.priceAtSale * qty;
        const subcost = cost * qty;

        const priceTypeLabel =
          item.priceType === "transfer"
            ? "Transferencia"
            : item.priceType === "custom"
            ? "Personalizado"
            : "Normal";

        if (item.priceType === "normal") {
          totalRevenueNormal += subtotal;
          totalCostNormal += subcost;
          soldItemsNormal += qty;
        } else if (item.priceType === "transfer") {
          totalRevenueTransfer += subtotal;
          totalCostTransfer += subcost;
          soldItemsTransfer += qty;
        } else if (item.priceType === "custom") {
          totalRevenueCustom += subtotal;
          totalCostCustom += subcost;
          soldItemsCustom += qty;
        }

        soldProductsDetails.push({
          fecha: new Date(sale.date).toLocaleDateString("es-AR"),
          barcode: item.barcode,
          nombre: item.name,
          categoria: product ? product.category : "",
          talle: product ? product.size : "",
          color: product ? product.color : "",
          quantity: qty,
          costo: cost,
          tipoVenta: priceTypeLabel,
          precioVenta: item.priceAtSale,
          totalRevenue: subtotal,
          ganancia: subtotal - subcost,
        });
      }
    }

    const availableProductsDetails = allProducts.map((p) => ({
      barcode: p.barcode,
      nombre: p.name,
      categoria: p.category,
      talle: p.size,
      color: p.color,
      stock: p.stock,
      costo: p.price,
      precioNormal: p.priceNormal,
      precioTransferencia: p.priceTransfer,
      margenNormal: (p.priceNormal || 0) - (p.price || 0),
      margenTransferencia: (p.priceTransfer || 0) - (p.price || 0),
    }));

    res.json({
      statistics: {
        totalProductos: allProducts.length,
        disponibles: allProducts.reduce((sum, p) => sum + (p.stock || 0), 0),
        vendidos: soldItemsNormal + soldItemsTransfer + soldItemsCustom,
        ventasPorTipo: {
          normal: {
            cantidad: soldItemsNormal,
            ingresos: totalRevenueNormal,
            costo: totalCostNormal,
            ganancia: totalRevenueNormal - totalCostNormal,
          },
          transferencia: {
            cantidad: soldItemsTransfer,
            ingresos: totalRevenueTransfer,
            costo: totalCostTransfer,
            ganancia: totalRevenueTransfer - totalCostTransfer,
          },
          personalizado: {
            cantidad: soldItemsCustom,
            ingresos: totalRevenueCustom,
            costo: totalCostCustom,
            ganancia: totalRevenueCustom - totalCostCustom,
          },
        },
        totales: {
          ingresos:
            totalRevenueNormal + totalRevenueTransfer + totalRevenueCustom,
          costos: totalCostNormal + totalCostTransfer + totalCostCustom,
          ganancia:
            totalRevenueNormal +
            totalRevenueTransfer +
            totalRevenueCustom -
            (totalCostNormal + totalCostTransfer + totalCostCustom),
        },
      },
      availableProducts: availableProductsDetails,
      soldProducts: soldProductsDetails,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal" });
  }
});

export default router;
