import express from "express";
import { ProductModel } from "../models/product";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { search, category } = req.query as any;
    const filter: any = { deletedAt: null };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { barcode: { $regex: search, $options: "i" } },
      ];
    }
    if (category) filter.category = category;
    const products = await ProductModel.find(filter).sort({ name: 1 });
    res.json(products);
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
