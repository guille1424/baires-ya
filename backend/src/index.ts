import "dotenv/config";
import express from "express";
import cors from "cors";
import productsRouter from "./routes/products";
import authRouter from "./routes/auth";
import salesRouter from "./routes/sales";
import statsRouter from "./routes/stats";
import importRouter from "./routes/import";
import customersRouter from "./routes/customers";
import uploadRouter from "./routes/upload";
import publicRouter from "./routes/public";
import { initDb } from "./db";

const PORT = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());

// Rutas públicas — SIN autenticación JWT
app.use("/api/public", publicRouter);

// Rutas privadas
app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/sales", salesRouter);
app.use("/api/stats", statsRouter);
app.use("/api/customers", customersRouter);
app.use("/api/upload", uploadRouter);
app.use("/api", importRouter);

app.get("/", (_req, res) =>
  res.json({ ok: true, message: "StockManager API" })
);

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
});
