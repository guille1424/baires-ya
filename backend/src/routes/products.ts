import express from "express";
import { ProductModel } from "../models/product";

const router = express.Router();

// Obtener filtros únicos de productos (categorías, colores, talles)
router.get("/filters", async (req, res) => {
  try {
    const categories = await ProductModel.distinct("category", { deletedAt: null });
    const colors = await ProductModel.distinct("color", { deletedAt: null });
    const sizes = await ProductModel.distinct("size", { deletedAt: null });
    res.json({
      categories: categories.filter(Boolean).sort(),
      colors: colors.filter(Boolean).sort(),
      sizes: sizes.filter(Boolean).sort(),
    });
  } catch (err) {
    res.status(500).json({ error: "internal" });
  }
});

router.get("/", async (req, res) => {
  try {
    const { search, category, color, size, status, page, limit } = req.query as any;
    const filter: any = { deletedAt: null };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { barcode: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }
    if (category) filter.category = category;
    if (color) filter.color = color;
    if (size) filter.size = size;

    if (status === "in_stock") {
      filter.stock = { $gt: 0 };
    } else if (status === "out_of_stock") {
      filter.stock = { $lte: 0 };
    }

    if (page) {
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 50;
      const total = await ProductModel.countDocuments(filter);
      const products = await ProductModel.find(filter)
        .sort({ name: 1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum);
      res.json({
        products,
        total,
        pages: Math.ceil(total / limitNum),
        page: pageNum,
        limit: limitNum,
      });
    } else {
      const products = await ProductModel.find(filter).sort({ name: 1 });
      res.json(products);
    }
  } catch (err) {
    res.status(500).json({ error: "internal" });
  }
});

router.get("/:barcode", async (req, res) => {
  try {
    const { barcode } = req.params;
    const product = await ProductModel.findOne({ barcode, deletedAt: null });
    if (!product) return res.status(404).json({ error: "not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "internal" });
  }
});

router.post("/", async (req, res) => {
  try {
    const payload = req.body;
    const product = await ProductModel.create(payload);
    res.status(201).json(product);
  } catch (err: any) {
    if (err.code === 11000)
      return res.status(409).json({ error: "barcode must be unique" });
    res.status(500).json({ error: "internal" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    update.updatedAt = new Date();
    const product = await ProductModel.findByIdAndUpdate(id, update, {
      new: true,
    });
    if (!product) return res.status(404).json({ error: "not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "internal" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const product = await ProductModel.findByIdAndUpdate(
      id,
      { deletedAt: new Date() },
      { new: true }
    );
    if (!product) return res.status(404).json({ error: "not found" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "internal" });
  }
});

export default router;
