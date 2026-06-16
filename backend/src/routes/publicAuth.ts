import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { CustomerModel } from "../models/customer";
import { SaleModel } from "../models/sale";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret";

/**
 * POST /api/public/auth/register
 * Registra un nuevo cliente para la tienda pública.
 */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Nombre, email y contraseña son obligatorios." });
    }

    const existingCustomer = await CustomerModel.findOne({ email });
    if (existingCustomer) {
      return res.status(400).json({ error: "Ya existe un usuario con ese email." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newCustomer = new CustomerModel({
      name,
      email,
      passwordHash,
      phone: phone || "00000000", // Phone is required in old schema, provide default if not sent
      address,
    });

    await newCustomer.save();

    const token = jwt.sign(
      { id: newCustomer._id, role: "customer", name: newCustomer.name, email: newCustomer.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, customer: { _id: newCustomer._id, name: newCustomer.name, email: newCustomer.email } });
  } catch (err) {
    console.error("Error en registro:", err);
    res.status(500).json({ error: "Error al registrar cliente." });
  }
});

/**
 * POST /api/public/auth/login
 * Inicia sesión de un cliente.
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña son obligatorios." });
    }

    const customer = await CustomerModel.findOne({ email });
    if (!customer || !customer.passwordHash) {
      return res.status(401).json({ error: "Credenciales inválidas." });
    }

    const isValid = await bcrypt.compare(password, customer.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Credenciales inválidas." });
    }

    const token = jwt.sign(
      { id: customer._id, role: "customer", name: customer.name, email: customer.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, customer: { _id: customer._id, name: customer.name, email: customer.email, phone: customer.phone, address: customer.address } });
  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({ error: "Error interno en login." });
  }
});

/**
 * GET /api/public/auth/me
 * Obtiene los datos del cliente logueado (requiere token).
 */
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (decoded.role !== "customer") {
      return res.status(403).json({ error: "Rol no válido." });
    }

    const customer = await CustomerModel.findById(decoded.id).select("-passwordHash");
    if (!customer) {
      return res.status(404).json({ error: "Cliente no encontrado." });
    }

    res.json(customer);
  } catch (err) {
    res.status(401).json({ error: "Token inválido o expirado." });
  }
});

/**
 * GET /api/public/auth/orders
 * Obtiene el historial de pedidos del cliente logueado
 */
router.get("/orders", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (decoded.role !== "customer") {
      return res.status(403).json({ error: "Rol no válido." });
    }

    const orders = await SaleModel.find({ customerId: decoded.id, orderSource: "web" })
      .sort({ date: -1 })
      .lean();

    res.json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ error: "Error interno al obtener pedidos." });
  }
});

export default router;
