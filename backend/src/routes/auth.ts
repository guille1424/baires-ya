import express from "express";
import { UserModel } from "../models/user";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: "username and password required" });
    const existing = await UserModel.findOne({ username });
    if (existing) return res.status(409).json({ error: "username taken" });
    const hash = await bcrypt.hash(password, 10);
    const role = req.body.role === "employee" ? "employee" : "admin";
    const user = await UserModel.create({ username, passwordHash: hash, role });
    res.json({ id: user._id, username: user.username, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: "username and password required" });
    const user = await UserModel.findOne({ username });
    if (!user) return res.status(401).json({ error: "invalid credentials" });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "invalid credentials" });
    const token = jwt.sign(
      { sub: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ token, user: { _id: user._id, username: user.username, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal" });
  }
});

export default router;
