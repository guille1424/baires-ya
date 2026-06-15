import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import QRCode from "qrcode";

interface Product {
  _id: string;
  barcode: string;
  name: string;
  category: string;
  size: string;
  color: string;
  price: number; // Costo
  priceNormal: number; // Venta normal
  priceTransfer: number; // Precio con transferencia
  stock: number; // Cantidad de stock
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "in_stock" | "out_of_stock"
  >("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [colorFilter, setColorFilter] = useState("");
  const [sizeFilter, setSizeFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    barcode: "",
    name: "",
    category: "",
    size: "",
    color: "",
    price: 0,
    priceNormal: 0,
    priceTransfer: 0,
    stock: 0,
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  
  // Estados para el modal del Código QR
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [qrProduct, setQrProduct] = useState<Product | null>(null);

  const { token } = useAuth();

  const uniqueCategories = Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort();
  const uniqueColors = Array.from(new Set(products.map((p) => p.color).filter(Boolean))).sort();


  const formatPrice = (price: number) => {
    return price % 1 === 0 ? price.toFixed(0) : price.toFixed(2);
  };

  const handleShowQr = async (product: Product) => {
    try {
      const url = await QRCode.toDataURL(product.barcode, { width: 250, margin: 2 });
      setQrCodeUrl(url);
      setQrProduct(product);
      setShowQrModal(true);
    } catch (err) {
      console.error("Error al generar QR:", err);
    }
  };

  const handlePrintQr = (product: Product) => {
    QRCode.toDataURL(product.barcode, { width: 200, margin: 1 }, (err, url) => {
      if (err) {
        console.error("Error al generar QR para impresión:", err);
        return;
      }
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Por favor permite las ventanas emergentes para poder imprimir la etiqueta.");
        return;
      }
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Imprimir Etiqueta - ${product.name}</title>
            <style>
              @page {
                size: 80mm 80mm;
                margin: 0;
              }
              body {
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                margin: 0;
                padding: 10px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                box-sizing: border-box;
                width: 80mm;
                height: 80mm;
                background-color: white;
                color: black;
              }
              .store-name {
                font-size: 16px;
                font-weight: 800;
                margin-bottom: 4px;
                letter-spacing: 2px;
                border-bottom: 2px solid black;
                padding-bottom: 2px;
                width: 90%;
              }
              .product-name {
                font-size: 14px;
                font-weight: 700;
                margin: 4px 0 2px 0;
                text-transform: uppercase;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                width: 100%;
              }
              .details {
                font-size: 11px;
                font-weight: 500;
                margin-bottom: 4px;
                text-transform: uppercase;
              }
              .qr-code {
                width: 120px;
                height: 120px;
                margin: 2px 0;
              }
              .barcode-text {
                font-size: 10px;
                font-weight: 700;
                font-family: monospace;
                letter-spacing: 1px;
              }
              .prices {
                font-size: 11px;
                margin-top: 6px;
                font-weight: 700;
                line-height: 1.3;
              }
            </style>
          </head>
          <body>
            <div class="store-name">BAIRESYA</div>
            <div class="product-name">${product.name}</div>
            <div class="details">TALLE: ${product.size} | COLOR: ${product.color}</div>
            <img class="qr-code" src="${url}" />
            <div class="barcode-text">${product.barcode}</div>
            <div class="prices">
              EFECTIVO/CASH: $${formatPrice(product.priceNormal)}<br/>
              TRANSFERENCIA: $${formatPrice(product.priceTransfer)}
            </div>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    });
  };


  useEffect(() => {
    fetchProducts();
  }, []);

  // Calcular opciones disponibles para cada filtro basándose en los filtros activos
  const getAvailableOptions = () => {
    let baseProducts = products;

    // Aplicar filtro de búsqueda
    if (search) {
      baseProducts = baseProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.barcode.includes(search) ||
          p.category.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Aplicar filtro de estado
    if (statusFilter === "in_stock") {
      baseProducts = baseProducts.filter((p) => p.stock > 0);
    } else if (statusFilter === "out_of_stock") {
      baseProducts = baseProducts.filter((p) => p.stock <= 0);
    }

    // Para categorías: aplicar filtros de color y talle si existen
    let productsForCategories = baseProducts;
    if (colorFilter) {
      productsForCategories = productsForCategories.filter(
        (p) => p.color === colorFilter
      );
    }
    if (sizeFilter) {
      productsForCategories = productsForCategories.filter(
        (p) => p.size === sizeFilter
      );
    }
    const availableCategories = [
      ...new Set(productsForCategories.map((p) => p.category).filter(Boolean)),
    ].sort();

    // Para colores: aplicar filtros de categoría y talle si existen
    let productsForColors = baseProducts;
    if (categoryFilter) {
      productsForColors = productsForColors.filter(
        (p) => p.category === categoryFilter
      );
    }
    if (sizeFilter) {
      productsForColors = productsForColors.filter(
        (p) => p.size === sizeFilter
      );
    }
    const availableColors = [
      ...new Set(productsForColors.map((p) => p.color).filter(Boolean)),
    ].sort();

    // Para talles: aplicar filtros de categoría y color si existen
    let productsForSizes = baseProducts;
    if (categoryFilter) {
      productsForSizes = productsForSizes.filter(
        (p) => p.category === categoryFilter
      );
    }
    if (colorFilter) {
      productsForSizes = productsForSizes.filter(
        (p) => p.color === colorFilter
      );
    }
    const availableSizes = [
      ...new Set(productsForSizes.map((p) => p.size).filter(Boolean)),
    ].sort();

    return { availableCategories, availableColors, availableSizes };
  };

  const { availableCategories, availableColors, availableSizes } =
    getAvailableOptions();

  // Filtrar productos según todos los filtros activos
  useEffect(() => {
    let filtered = products;

    // Filtrar por búsqueda
    if (search) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.barcode.includes(search) ||
          p.category.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filtrar por estado
    if (statusFilter === "in_stock") {
      filtered = filtered.filter((p) => p.stock > 0);
    } else if (statusFilter === "out_of_stock") {
      filtered = filtered.filter((p) => p.stock <= 0);
    }

    // Filtrar por categoría
    if (categoryFilter) {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }

    // Filtrar por color
    if (colorFilter) {
      filtered = filtered.filter((p) => p.color === colorFilter);
    }

    // Filtrar por talle
    if (sizeFilter) {
      filtered = filtered.filter((p) => p.size === sizeFilter);
    }

    setFilteredProducts(filtered);
  }, [search, statusFilter, categoryFilter, colorFilter, sizeFilter, products]);

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    // Si el color actual no existe en la nueva categoría, limpiarlo
    // (Se manejará automáticamente por las opciones disponibles)
  };

  const handleColorChange = (value: string) => {
    setColorFilter(value);
    // Si el talle actual no existe con este color, se limpiará automáticamente
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setProducts(data);
      setFilteredProducts(data);


    } catch (err) {
      console.error("Error al cargar productos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingProduct
        ? `http://localhost:5000/api/products/${editingProduct._id}`
        : "http://localhost:5000/api/products";
      const method = editingProduct ? "PUT" : "POST";

      await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      fetchProducts();
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error("Error al guardar producto:", err);
    }
  };

  const handleDelete = (id: string) => {
    setProductToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await fetch(`http://localhost:5000/api/products/${productToDelete}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProducts();
      setShowDeleteModal(false);
      setProductToDelete(null);
    } catch (err) {
      console.error("Error al eliminar producto:", err);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setProductToDelete(null);
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        barcode: product.barcode,
        name: product.name,
        category: product.category,
        size: product.size,
        color: product.color,
        price: product.price,
        priceNormal: product.priceNormal,
        priceTransfer: product.priceTransfer,
        stock: product.stock,
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      barcode: "",
      name: "",
      category: "",
      size: "",
      color: "",
      price: 0,
      priceNormal: 0,
      priceTransfer: 0,
      stock: 0,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 dark:text-slate-400">
          Cargando inventario...
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Inventario
          </h1>
          <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
            {filteredProducts.length}{" "}
            {filteredProducts.length === 1 ? "producto" : "productos"}
            {(categoryFilter ||
              colorFilter ||
              sizeFilter ||
              statusFilter !== "all" ||
              search) && <span className="font-semibold"> filtrados</span>}
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base"
        >
          + Agregar Producto
        </button>
      </div>

      {/* Filtros */}
      <div className="mb-4 sm:mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Buscar por nombre, código o categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 sm:py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
          />
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as "all" | "in_stock" | "out_of_stock"
              )
            }
            className="px-4 py-2 sm:py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
          >
            <option value="all">Todos los estados</option>
            <option value="in_stock">✅ Con Stock</option>
            <option value="out_of_stock">⚠️ Sin Stock</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="px-4 py-2 sm:py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
          >
            <option value="">Todas las categorías</option>
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={colorFilter}
            onChange={(e) => handleColorChange(e.target.value)}
            className="px-4 py-2 sm:py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
          >
            <option value="">Todos los colores</option>
            {availableColors.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>

          <select
            value={sizeFilter}
            onChange={(e) => setSizeFilter(e.target.value)}
            className="px-4 py-2 sm:py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
          >
            <option value="">Todos los talles</option>
            {availableSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        {(categoryFilter ||
          colorFilter ||
          sizeFilter ||
          statusFilter !== "all" ||
          search) && (
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setCategoryFilter("");
              setColorFilter("");
              setSizeFilter("");
            }}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold"
          >
            🔄 Limpiar filtros
          </button>
        )}
      </div>

      {/* Vista de grid/cards para todas las pantallas */}
      <div className="hidden md:block">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 p-8 text-center text-gray-500 dark:text-slate-400">
              No hay productos en el inventario
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div
                key={product._id}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 p-5 hover:shadow-xl transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400 truncate">
                      {product.barcode}
                    </p>
                  </div>
                  <span
                    className={`ml-2 px-2 py-1 text-xs rounded-full font-semibold whitespace-nowrap ${
                      product.stock <= 0
                        ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    }`}
                  >
                    {product.stock <= 0 ? "⚠️ Sin Stock" : `Stock: ${product.stock}`}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-slate-400">
                      Categoría:
                    </span>
                    <p className="text-gray-900 dark:text-white font-medium truncate">
                      {product.category}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-slate-400">
                      Talle:
                    </span>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {product.size}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-slate-400">
                      Color:
                    </span>
                    <p className="text-gray-900 dark:text-white font-medium truncate">
                      {product.color}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-slate-400">
                      Costo:
                    </span>
                    <p className="text-gray-900 dark:text-white font-medium">
                      ${formatPrice(product.price)}
                    </p>
                  </div>
                </div>
                <div className="border-t border-gray-200 dark:border-slate-700 pt-3 mb-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500 dark:text-slate-400 block">
                        💵 Normal
                      </span>
                      <p className="text-indigo-600 dark:text-indigo-400 font-bold">
                        ${formatPrice(product.priceNormal)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-slate-400 block">
                        💳 Transferencia
                      </span>
                      <p className="text-blue-600 dark:text-blue-400 font-bold">
                        ${formatPrice(product.priceTransfer)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-slate-700">
                  <button
                    onClick={() => handleShowQr(product)}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    title="Ver Código QR"
                  >
                    📷 QR
                  </button>
                  <button
                    onClick={() => openModal(product)}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(product._id)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Vista de tarjetas para móvil */}
      <div className="md:hidden space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 p-8 text-center text-gray-500 dark:text-slate-400">
            No hay productos en el inventario
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div
              key={product._id}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 p-4"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400 truncate">
                    {product.barcode}
                  </p>
                </div>
                <span
                  className={`ml-2 px-2 py-1 text-xs rounded-full font-semibold whitespace-nowrap ${
                    product.stock <= 0
                      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  }`}
                >
                  {product.stock <= 0 ? "⚠️ Sin Stock" : `Stock: ${product.stock}`}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-slate-400">
                    Categoría:
                  </span>
                  <p className="text-gray-900 dark:text-white font-medium truncate">
                    {product.category}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-slate-400">
                    Precio:
                  </span>
                  <p className="text-gray-900 dark:text-white font-medium">
                    ${product.price}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-slate-400">
                    Talle:
                  </span>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {product.size}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-slate-400">
                    Color:
                  </span>
                  <p className="text-gray-900 dark:text-white font-medium truncate">
                    {product.color}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-slate-700">
                <button
                  onClick={() => handleShowQr(product)}
                  className="px-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  title="Ver Código QR"
                >
                  📷 QR
                </button>
                <button
                  onClick={() => openModal(product)}
                  className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => handleDelete(product._id)}
                  className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              {editingProduct ? "Editar Producto" : "Nuevo Producto"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">
                  CÓDIGO DE BARRAS
                </label>
                <input
                  type="text"
                  placeholder="Código de barras"
                  value={formData.barcode}
                  onChange={(e) =>
                    setFormData({ ...formData, barcode: e.target.value })
                  }
                  className="w-full px-3 sm:px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white text-sm sm:text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">
                  NOMBRE DE LA PRENDA
                </label>
                <input
                  type="text"
                  placeholder="Nombre"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 sm:px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white text-sm sm:text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">
                  CATEGORÍA
                </label>
                <input
                  type="text"
                  list="categories-form-list"
                  placeholder="Categoría"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-3 sm:px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white text-sm sm:text-base"
                  required
                />
                <datalist id="categories-form-list">
                  {uniqueCategories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>


              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">
                    TALLE
                  </label>
                  <input
                    type="text"
                    placeholder="Talle"
                    value={formData.size}
                    onChange={(e) =>
                      setFormData({ ...formData, size: e.target.value })
                    }
                    className="w-full px-3 sm:px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white text-sm sm:text-base"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">
                    COLOR
                  </label>
                  <input
                    type="text"
                    list="colors-form-list"
                    placeholder="Color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="w-full px-3 sm:px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white text-sm sm:text-base"
                    required
                  />
                  <datalist id="colors-form-list">
                    {uniqueColors.map((color) => (
                      <option key={color} value={color} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">
                    PRECIO COSTO ($)
                  </label>
                  <input
                    type="number"
                    placeholder="Precio Costo"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: Number(e.target.value) })
                    }
                    className="w-full px-3 sm:px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white text-sm sm:text-base"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">
                    STOCK DISPONIBLE
                  </label>
                  <input
                    type="number"
                    placeholder="Stock disponible"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 sm:px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white text-sm sm:text-base"
                    required
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">
                    PRECIO NORMAL ($)
                  </label>
                  <input
                    type="number"
                    placeholder="Precio Normal"
                    value={formData.priceNormal}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priceNormal: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 sm:px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white text-sm sm:text-base"
                    required
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">
                    PRECIO TRANSFERENCIA ($)
                  </label>
                  <input
                    type="number"
                    placeholder="Precio Transferencia"
                    value={formData.priceTransfer}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priceTransfer: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 sm:px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white text-sm sm:text-base"
                    required
                    step="0.01"
                  />
                </div>
              </div>
              <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-3 sm:px-4 py-2 bg-gray-300 dark:bg-slate-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-slate-500 transition-colors text-sm sm:text-base"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base"
                >
                  {editingProduct ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
              ¿Eliminar producto?
            </h3>
            <p className="text-gray-600 dark:text-slate-400 text-center mb-6">
              Esta acción no se puede deshacer. El producto será eliminado
              permanentemente del inventario.
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para mostrar el Código QR */}
      {showQrModal && qrProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-sm w-full border border-gray-200 dark:border-slate-700 text-center animate-scale-in">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 truncate">
              Código QR: {qrProduct.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4 font-mono">
              {qrProduct.barcode}
            </p>
            <div className="flex justify-center bg-white p-4 rounded-lg border border-gray-200 mb-4 max-w-[200px] mx-auto">
              {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" className="w-full h-auto" />}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <a
                  href={qrCodeUrl || ""}
                  download={`qr_${qrProduct.barcode}.png`}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold flex items-center justify-center gap-1"
                >
                  <span>📥</span> Descargar
                </a>
                <button
                  onClick={() => handlePrintQr(qrProduct)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold flex items-center justify-center gap-1"
                >
                  <span>🖨️</span> Imprimir
                </button>
              </div>
              <button
                onClick={() => {
                  setShowQrModal(false);
                  setQrCodeUrl(null);
                  setQrProduct(null);
                }}
                className="w-full px-4 py-2 bg-gray-300 dark:bg-slate-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-slate-500 transition-colors text-sm font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
