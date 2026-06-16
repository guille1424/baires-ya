import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "../../contexts/CartContext";

interface PublicProduct {
  _id: string;
  barcode: string;
  name: string;
  category: string;
  size: string;
  color: string;
  priceNormal: number;
  availableStock: number;
  publicDescription?: string;
  images?: string[];
}

export default function ProductDetail() {
  const { barcode } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mainImage, setMainImage] = useState<string | null>(null);

  useEffect(() => {
    fetch(`http://localhost:5000/api/public/products/${barcode}`)
      .then((res) => {
        if (!res.ok) throw new Error("Producto no encontrado");
        return res.json();
      })
      .then((data) => {
        setProduct(data);
        if (data.images && data.images.length > 0) {
          setMainImage(data.images[0]);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [barcode]);

  const handleAddToCart = () => {
    if (!product || product.availableStock <= 0) return;
    
    addToCart({
      productId: product._id,
      barcode: product.barcode,
      name: product.name,
      price: product.priceNormal,
      quantity: 1,
      imageUrl: product.images?.[0],
      size: product.size,
      color: product.color,
      stock: product.availableStock,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-20">
        <span className="text-6xl mb-4 block">😕</span>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Producto no encontrado</h2>
        <button 
          onClick={() => navigate("/")}
          className="px-6 py-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"
        >
          Volver al catálogo
        </button>
      </div>
    );
  }

  const hasStock = product.availableStock > 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-slate-800">
      <div className="flex flex-col md:flex-row">
        
        {/* Galería de imágenes */}
        <div className="md:w-1/2 p-4 sm:p-8">
          <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100 dark:bg-slate-800 mb-4 relative">
            {mainImage ? (
              <img 
                src={mainImage} 
                alt={product.name} 
                className={`w-full h-full object-cover transition-opacity duration-300 ${!hasStock ? 'grayscale opacity-80' : ''}`}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <span className="text-6xl mb-4">👕</span>
                <span className="font-semibold tracking-wider">SIN FOTO</span>
              </div>
            )}
            {!hasStock && (
              <div className="absolute top-4 right-4 px-4 py-2 bg-red-600 text-white rounded-full font-bold shadow-lg">
                AGOTADO
              </div>
            )}
          </div>
          
          {/* Miniaturas */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
              {product.images.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => setMainImage(img)}
                  className={`w-20 h-24 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${mainImage === img ? 'border-indigo-600 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detalles del producto */}
        <div className="md:w-1/2 p-6 sm:p-12 flex flex-col">
          <div className="mb-8">
            <span className="text-sm font-bold tracking-widest text-indigo-600 dark:text-indigo-400 uppercase mb-2 block">
              {product.category}
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white leading-tight mb-4">
              {product.name}
            </h1>
            <p className="text-4xl font-black text-gray-900 dark:text-white">
              ${product.priceNormal}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-slate-700">
              <span className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Talle</span>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">{product.size}</span>
            </div>
            <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-slate-700">
              <span className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Color</span>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">{product.color}</span>
            </div>
          </div>

          {product.publicDescription && (
            <div className="mb-10 prose dark:prose-invert prose-p:text-gray-600 dark:prose-p:text-slate-300">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Acerca de la prenda</h3>
              <p className="whitespace-pre-line leading-relaxed">{product.publicDescription}</p>
            </div>
          )}

          <div className="mt-auto pt-8 border-t border-gray-100 dark:border-slate-800">
            {hasStock ? (
              <button 
                onClick={handleAddToCart}
                className="w-full py-5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-indigo-600 dark:hover:bg-indigo-500 rounded-2xl font-black text-lg transition-colors shadow-xl shadow-gray-900/20 dark:shadow-white/10 flex justify-center items-center gap-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                AGREGAR AL CARRITO
              </button>
            ) : (
              <button 
                disabled
                className="w-full py-5 bg-gray-200 dark:bg-slate-800 text-gray-500 dark:text-slate-500 rounded-2xl font-black text-lg cursor-not-allowed flex justify-center items-center gap-3"
              >
                ⚠️ A CONFIRMAR DISPONIBILIDAD
              </button>
            )}
            
            <button 
              onClick={() => navigate("/")}
              className="w-full py-4 mt-4 text-gray-600 dark:text-slate-400 font-semibold hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              ← Seguir mirando
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
