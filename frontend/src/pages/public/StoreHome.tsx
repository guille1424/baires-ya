import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

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

export default function StoreHome() {
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  
  const [categories, setCategories] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/public/filters")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data.categories || []);
        setColors(data.colors || []);
        setSizes(data.sizes || []);
      })
      .catch((err) => console.error("Error al cargar filtros públicos:", err));
  }, []);

  useEffect(() => {
    setLoading(true);
    const queryParams = new URLSearchParams({
      limit: "50",
      search,
      category,
      color,
      size,
    });
    fetch(`http://localhost:5000/api/public/products?${queryParams.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.products || []);
      })
      .catch((err) => console.error("Error al cargar productos públicos:", err))
      .finally(() => setLoading(false));
  }, [search, category, color, size]);

  return (
    <div>
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-900 to-purple-900 mb-12 shadow-2xl">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative px-8 py-20 sm:px-12 sm:py-24 flex flex-col items-center text-center">
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight mb-4 drop-shadow-md">
            Nueva Colección
          </h1>
          <p className="text-lg sm:text-xl text-indigo-100 max-w-2xl drop-shadow">
            Descubrí las últimas tendencias en moda urbana. Calidad premium y diseños exclusivos.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-800 mb-8 sticky top-20 z-30">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Buscar prendas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border-none rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-medium transition-shadow"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-3 bg-gray-50 dark:bg-slate-800 border-none rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-medium min-w-[140px] cursor-pointer"
            >
              <option value="">Categoría</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="px-4 py-3 bg-gray-50 dark:bg-slate-800 border-none rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-medium min-w-[120px] cursor-pointer"
            >
              <option value="">Talle</option>
              {sizes.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white dark:bg-slate-800 rounded-3xl p-4 aspect-[3/4] shadow-sm" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-6xl mb-4 block">😔</span>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No encontramos resultados</h2>
          <p className="text-gray-500 dark:text-slate-400">Probá usando otros filtros de búsqueda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {products.map((product) => {
            const hasStock = product.availableStock > 0;
            const mainImage = product.images?.[0] || null;

            return (
              <Link 
                to={`/producto/${product.barcode}`} 
                key={product._id}
                className="group flex flex-col bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-slate-800"
              >
                <div className="relative aspect-[4/5] bg-gray-100 dark:bg-slate-800 overflow-hidden">
                  {mainImage ? (
                    <img 
                      src={mainImage} 
                      alt={product.name} 
                      className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${!hasStock ? 'grayscale opacity-70' : ''}`}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-slate-500">
                      <span className="text-4xl mb-2">👕</span>
                      <span className="text-xs uppercase tracking-wider font-semibold">Sin Foto</span>
                    </div>
                  )}
                  
                  {/* Badge de Categoría/Stock */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    <span className="px-3 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-full text-xs font-bold text-gray-900 dark:text-white shadow-sm">
                      {product.category}
                    </span>
                    {!hasStock && (
                      <span className="px-3 py-1 bg-red-500/90 backdrop-blur-sm rounded-full text-xs font-bold text-white shadow-sm">
                        AGOTADO
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="p-4 sm:p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight mb-1 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">
                    Talle: {product.size} &bull; Color: {product.color}
                  </p>
                  
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-xl font-black text-gray-900 dark:text-white">
                      ${product.priceNormal}
                    </span>
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors text-gray-900 dark:text-white">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
