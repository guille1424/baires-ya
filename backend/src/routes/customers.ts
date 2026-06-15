import express from "express";
import { CustomerModel } from "../models/customer";

const router = express.Router();

// Obtener todos los clientes (no eliminados)
router.get("/", async (req, res) => {
  try {
    const customers = await CustomerModel.find({ deletedAt: null }).sort({ name: 1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: "internal" });
  }
});

// Obtener un cliente por ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await CustomerModel.findOne({ _id: id, deletedAt: null });
    if (!customer) return res.status(404).json({ error: "not found" });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: "internal" });
  }
});

// Crear cliente
router.post("/", async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: "name and phone are required" });
    }
    const customer = await CustomerModel.create({ name, phone });
    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ error: "internal" });
  }
});

// Actualizar cliente
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone } = req.body;
    const customer = await CustomerModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { name, phone, updatedAt: new Date() },
      { new: true }
    );
    if (!customer) return res.status(404).json({ error: "not found" });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: "internal" });
  }
});

// Eliminar cliente (borrado lógico)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await CustomerModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    );
    if (!customer) return res.status(404).json({ error: "not found" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "internal" });
  }
});

export default router;
