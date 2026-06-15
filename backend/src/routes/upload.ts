import express from "express";
import { v2 as cloudinary } from "cloudinary";
import { ProductModel } from "../models/product";

const router = express.Router();

// Configurar Cloudinary con las variables de entorno
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * POST /api/upload/signature
 * Genera una firma para que el browser suba directamente a Cloudinary.
 * El archivo NUNCA pasa por nuestro servidor.
 * Body: { folder?: string }
 */
router.post("/signature", async (req, res) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = req.body.folder || "bairesya/products";

    const paramsToSign = {
      timestamp,
      folder,
      transformation: "q_auto,f_auto,w_1200,c_limit", // Optimización automática
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
 * DELETE /api/upload/:publicId
 * Borra una imagen de Cloudinary y la quita del producto.
 * Body: { productId: string }
 */
router.delete("/:publicId(*)", async (req, res) => {
  try {
    const { publicId } = req.params;
    const { productId } = req.body;

    // Borrar de Cloudinary
    await cloudinary.uploader.destroy(publicId);

    // Si se pasó productId, actualizar el producto en MongoDB
    if (productId) {
      const product = await ProductModel.findById(productId);
      if (product) {
        const idx = product.imagePublicIds?.indexOf(publicId) ?? -1;
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
