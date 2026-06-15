import express from "express";
import { v2 as cloudinary } from "cloudinary";
import { ProductModel } from "../models/product";

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * POST /api/upload/signature
 * Genera una firma para subir directamente desde el browser a Cloudinary.
 * El archivo NUNCA pasa por nuestro servidor.
 */
router.post("/signature", async (req, res) => {
  try {
    const timestamp = Math.round(Date.now() / 1000);
    const folder = (req.body.folder as string) || "bairesya/products";

    // Solo se firman los params que Cloudinary acepta para signed upload
    const paramsToSign: Record<string, string | number> = {
      timestamp,
      folder,
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET!
    );

    res.json({
      signature,
      timestamp,
      folder,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
    });
  } catch (err) {
    console.error("Error generando firma Cloudinary:", err);
    res.status(500).json({ error: "Error al generar firma de carga" });
  }
});

/**
 * DELETE /api/upload/image
 * Borra una imagen de Cloudinary y la quita del producto.
 * Body: { publicId: string, productId?: string }
 */
router.delete("/image", async (req, res) => {
  try {
    const { publicId, productId } = req.body;

    if (!publicId) {
      return res.status(400).json({ error: "publicId requerido" });
    }

    // Borrar de Cloudinary
    await cloudinary.uploader.destroy(publicId);

    // Si se pasó productId, actualizar el producto en MongoDB
    if (productId) {
      const product = await ProductModel.findById(productId);
      if (product) {
        const idx = (product.imagePublicIds ?? []).indexOf(publicId);
        if (idx !== -1) {
          const newImages = [...(product.images ?? [])];
          const newPublicIds = [...(product.imagePublicIds ?? [])];
          newImages.splice(idx, 1);
          newPublicIds.splice(idx, 1);
          await ProductModel.findByIdAndUpdate(productId, {
            images: newImages,
            imagePublicIds: newPublicIds,
            updatedAt: new Date(),
          });
        }
      }
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("Error borrando imagen:", err);
    res.status(500).json({ error: "Error al borrar imagen" });
  }
});

export default router;
