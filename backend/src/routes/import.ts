import express from "express";
import multer from "multer";
import * as XLSX from "xlsx";
import { ProductModel } from "../models/product";
import { AttributeModel } from "../models/attribute";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/import", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Leer archivo Excel
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const row of data as any[]) {
      try {
        const {
          barcode,
          name,
          category,
          type,
          design,
          color,
          size,
          price,
          priceNormal,
          priceTransfer,
          stock,
          supplierName,
          supplierAddress,
        } = row;

        // Si no hay barcode ni name, probablemente es una fila vacía con fórmulas del Excel. La ignoramos en silencio.
        if (!barcode && !name) {
          continue;
        }

        if (!barcode || !name) {
          errors.push(`Fila incompleta (requiere barcode y name): ${JSON.stringify(row)}`);
          continue;
        }

        // Verificar si el código de barras ya existe
        const existing = await ProductModel.findOne({
          barcode,
          deletedAt: null,
        });

        if (existing) {
          // Actualizar producto existente
          existing.name = name;
          existing.category = category;
          existing.type = type;
          existing.design = design;
          existing.color = color;
          existing.size = size;
          existing.price = Number(price) || 0;
          existing.priceNormal = Number(priceNormal) || 0;
          existing.priceTransfer = Number(priceTransfer) || 0;
          existing.stock = Number(stock) || 0; // Actualizar cantidad de stock
          existing.supplierName = supplierName || "";
          existing.supplierAddress = supplierAddress || "";
          existing.updatedAt = new Date();
          await existing.save();
          updated++;
        } else {
          // Crear nuevo producto con el stock especificado
          await ProductModel.create({
            barcode,
            name,
            category,
            type,
            design,
            color,
            size,
            price: Number(price) || 0,
            priceNormal: Number(priceNormal) || 0,
            priceTransfer: Number(priceTransfer) || 0,
            stock: Number(stock) || 0, // Asignar cantidad inicial de stock
            supplierName: supplierName || "",
            supplierAddress: supplierAddress || "",
          });
          created++;
        }

        // Guardar atributos nuevos
        if (category) await saveAttribute("category", category);
        if (color) await saveAttribute("color", color);
        if (size) await saveAttribute("size", size);
        if (design) await saveAttribute("design", design);
      } catch (err: any) {
        errors.push(`Error procesando ${row.barcode}: ${err.message}`);
      }
    }

    res.json({
      success: true,
      created,
      updated,
      total: data.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Error al procesar archivo" });
  }
});

async function saveAttribute(type: string, value: string) {
  const existing = await AttributeModel.findOne({ type, value });
  if (!existing) {
    await AttributeModel.create({ type, value });
  }
}

export default router;
