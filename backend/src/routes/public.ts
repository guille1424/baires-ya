import express from "express";
import { ProductModel } from "../models/product";

const router = express.Router();

// Campos privados que NUNCA se exponen al público
const PRIVATE_FIELDS =
  "-price -supplierName -supplierAddress -priceTransfer -imagePublicIds -reservedQty -reservedUntil -deletedAt";

/**
 * GET /api/public/filters
 * Filtros disponibles del catálogo público (sin auth)
 */
router.get("/filters", async (_req, res) => {
  try {
    const baseFilter = { deletedAt: null, isPublic: true };
    const [categories, colors, sizes] = await Promise.all([
      ProductModel.distinct("category", baseFilter),
      ProductModel.distinct("color", baseFilter),
      ProductModel.distinct("size", baseFilter),
    ]);
    res.json({
      categories: categories.filter(Boolean).sort(),
      colors: colors.filter(Boolean).sort(),
      sizes: sizes.filter(Boolean).sort(),
    });
  } catch {
    res.status(500).json({ error: "internal" });
  }
});

/**
 * GET /api/public/products
 * Catálogo paginado — solo productos marcados como públicos.
 * Stock disponible = stock - reservedQty (si reserva no venció)
 * Productos sin stock se devuelven con availableStock: 0
 */
router.get("/products", async (req, res) => {
  try {
    const { search, category, color, size, page, limit } = req.query as any;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 24;

    const filter: any = { deletedAt: null, isPublic: true };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }
    if (category) filter.category = category;
    if (color) filter.color = color;
    if (size) filter.size = size;

    const total = await ProductModel.countDocuments(filter);
    const products = await ProductModel.find(filter)
      .select(PRIVATE_FIELDS)
      .sort({ name: 1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    const now = new Date();
    const enriched = (products as any[]).map((p) => {
      const reservedActive =
        p.reservedUntil && new Date(p.reservedUntil) > now
          ? (p.reservedQty ?? 0)
          : 0;
      return {
        ...p,
        availableStock: Math.max(0, (p.stock ?? 0) - reservedActive),
      };
    });

    res.json({
      products: enriched,
      total,
      pages: Math.ceil(total / limitNum),
      page: pageNum,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal" });
  }
});

/**
 * GET /api/public/products/:barcode
 * Detalle de un producto público
 */
router.get("/products/:barcode", async (req, res) => {
  try {
    const { barcode } = req.params;
    const product = await ProductModel.findOne({
      barcode,
      deletedAt: null,
      isPublic: true,
    })
      .select(PRIVATE_FIELDS)
      .lean() as any;

    if (!product) return res.status(404).json({ error: "not found" });

    const now = new Date();
    const reservedActive =
      product.reservedUntil && new Date(product.reservedUntil) > now
        ? (product.reservedQty ?? 0)
        : 0;

    res.json({
      ...product,
      availableStock: Math.max(0, (product.stock ?? 0) - reservedActive),
    });
  } catch {
    res.status(500).json({ error: "internal" });
  }
});

export default router;
