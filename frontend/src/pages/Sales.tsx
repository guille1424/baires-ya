import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Html5QrcodeScanner } from "html5-qrcode";

interface Product {
  _id: string;
  barcode: string;
  name: string;
  category: string;
  size: string;
  color: string;
  price: number;
  priceNormal: number;
  priceTransfer: number;
  stock: number;
}

interface CartItem {
  barcode: string;
  name: string;
  priceNormal: number;
  priceTransfer: number;
  priceType: "normal" | "transfer" | "custom";
  customPrice?: number; // Precio manual para tipo custom
  quantity: number;
  stock: number;
}

interface PendingOrder {
  _id: string;
  customerName: string;
  totalAmount: number;
  items: any[];
  status: string;
  date: string;
}

export default function Sales() {
  const [barcode, setBarcode] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    // Cargar carrito desde localStorage al inicializar
    const savedCart = localStorage.getItem("pendingCart");
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const { token } = useAuth();

  const [lastRemovedItem, setLastRemovedItem] = useState<{
    item: CartItem;
    index: number;
  } | null>(null);
  const [showUndoToast, setShowUndoToast] = useState(false);
  const undoTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) {
        window.clearTimeout(undoTimeoutRef.current);
      }
    };
  }, []);


  // Cargar pedidos pendientes al iniciar
  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const fetchPendingOrders = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/sales?status=pending",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      setPendingOrders(data);
    } catch (err) {
      console.error("Error al cargar pedidos pendientes:", err);
    }
  };

  // Guardar carrito en localStorage cada vez que cambia
  useEffect(() => {
    localStorage.setItem("pendingCart", JSON.stringify(cart));
  }, [cart]);

  // Auto-focus en el input de código de barras
  useEffect(() => {
    const input = document.getElementById("barcode-input") as HTMLInputElement;
    // Solo hacer auto-focus si no hay otro input activo
    const activeElement = document.activeElement as HTMLElement;
    const isInputActive =
      activeElement?.tagName === "INPUT" ||
      activeElement?.tagName === "TEXTAREA";

    if (input && !showScanner && !isInputActive) {
      input.focus();
    }
  }, [cart, showScanner]);

  // Inicializar escáner de cámara
  useEffect(() => {
    if (showScanner && !scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        "reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        false
      );

      scannerRef.current.render(
        (decodedText) => {
          // Código escaneado exitosamente
          processBarcode(decodedText);
        },
        () => {
          // Ignorar errores de escaneo continuo
        }
      );
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [showScanner]);

  const processBarcode = async (code: string) => {
    if (!code.trim()) return;

    setError("");
    setLoading(true);

    try {
      // Buscar producto por código de barras
      const response = await fetch(
        `http://localhost:5000/api/products?search=${code}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const products = await response.json();

      // Buscar exactamente el código de barras
      const product = products.find((p: Product) => p.barcode === code);

      if (!product) {
        setError(`Producto con código ${code} no encontrado`);
        setLoading(false);
        return;
      }

      // Verificar si ya está en el carrito
      const existingItem = cart.find((item) => item.barcode === code);

      if (existingItem) {
        setCart(
          cart.map((item) =>
            item.barcode === code
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
        setSuccess(`✓ Cantidad de ${product.name} incrementada`);
      } else {
        setCart([
          ...cart,
          {
            barcode: product.barcode,
            name: product.name,
            priceNormal: product.priceNormal || 0,
            priceTransfer: product.priceTransfer || 0,
            priceType: "normal", // Por defecto Normal
            customPrice: undefined,
            quantity: 1,
            stock: product.stock || 0,
          },
        ]);
        setSuccess(`✓ ${product.name} agregado al carrito`);
      }

      setTimeout(() => setSuccess(""), 2000);
    } catch {
      setError("Error al buscar producto");
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    await processBarcode(barcode);
    setBarcode("");
  };

  const toggleScanner = () => {
    setShowScanner(!showScanner);
    setError("");
  };

  const removeItem = (barcode: string) => {
    const itemIndex = cart.findIndex((item) => item.barcode === barcode);
    if (itemIndex !== -1) {
      const item = cart[itemIndex];
      setLastRemovedItem({ item, index: itemIndex });
      setShowUndoToast(true);
      
      if (undoTimeoutRef.current) {
        window.clearTimeout(undoTimeoutRef.current);
      }
      undoTimeoutRef.current = window.setTimeout(() => {
        setShowUndoToast(false);
        setLastRemovedItem(null);
      }, 5000);
    }
    setCart(cart.filter((item) => item.barcode !== barcode));
  };

  const handleUndoRemove = () => {
    if (lastRemovedItem) {
      const newCart = [...cart];
      newCart.splice(lastRemovedItem.index, 0, lastRemovedItem.item);
      setCart(newCart);
      setShowUndoToast(false);
      setLastRemovedItem(null);
      if (undoTimeoutRef.current) {
        window.clearTimeout(undoTimeoutRef.current);
        undoTimeoutRef.current = null;
      }
    }
  };


  const updateQuantity = (barcode: string, qty: number) => {
    if (qty <= 0) {
      removeItem(barcode);
      return;
    }
    setCart(
      cart.map((item) =>
        item.barcode === barcode ? { ...item, quantity: qty } : item
      )
    );
  };

  const changePriceType = (
    barcode: string,
    newType: "normal" | "transfer" | "custom"
  ) => {
    setCart(
      cart.map((item) =>
        item.barcode === barcode
          ? {
              ...item,
              priceType: newType,
              customPrice: newType === "custom" ? 0 : undefined,
            }
          : item
      )
    );
  };

  const updateCustomPrice = (barcode: string, price: number) => {
    setCart(
      cart.map((item) =>
        item.barcode === barcode ? { ...item, customPrice: price } : item
      )
    );
  };

  const formatPrice = (price: number) => {
    return price % 1 === 0 ? price.toFixed(0) : price.toFixed(2);
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => {
      let price = item.priceNormal;
      if (item.priceType === "transfer") price = item.priceTransfer;
      if (item.priceType === "custom") price = item.customPrice || 0;
      return sum + price * item.quantity;
    }, 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError("El carrito está vacío");
      return;
    }

    // Si no hay pedido seleccionado, validar que tenga nombre de cliente
    if (!selectedOrderId && !customerName.trim()) {
      setError(
        "Debes ingresar el nombre del comprador o seleccionar un pedido existente"
      );
      return;
    }

    // Validar que todos los items con priceType custom tengan precio
    const invalidCustom = cart.find(
      (item) =>
        item.priceType === "custom" &&
        (!item.customPrice || item.customPrice <= 0)
    );
    if (invalidCustom) {
      setError(
        `El producto "${invalidCustom.name}" necesita un precio custom válido`
      );
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const items = cart.map((item) => ({
        barcode: item.barcode,
        quantity: item.quantity,
        priceType: item.priceType,
        customPrice: item.priceType === "custom" ? item.customPrice : undefined,
      }));

      let response;

      if (selectedOrderId) {
        // Agregar items a pedido existente
        response = await fetch(
          `http://localhost:5000/api/sales/${selectedOrderId}/add-items`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ items }),
          }
        );
      } else {
        // Crear nuevo pedido
        response = await fetch("http://localhost:5000/api/sales", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ customerName: customerName.trim(), items }),
        });
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al procesar el pedido");
      }

      const targetName = selectedOrderId
        ? pendingOrders.find((o) => o._id === selectedOrderId)?.customerName ||
          "el cliente"
        : customerName;

      const totalItemsQty = cart.reduce((sum, item) => sum + item.quantity, 0);

      setSuccess(
        selectedOrderId
          ? `¡Productos agregados al pedido de ${targetName}! ${totalItemsQty} ${
              totalItemsQty === 1 ? "prenda" : "prendas"
            } agregadas`
          : `¡Pedido creado para ${customerName}! ${totalItemsQty} ${
              totalItemsQty === 1 ? "prenda" : "prendas"
            } reservadas`
      );
      setCart([]);
      setCustomerName("");
      setSelectedOrderId("");
      localStorage.removeItem("pendingCart");

      // Recargar pedidos pendientes
      fetchPendingOrders();

      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Error al procesar el pedido");
    } finally {
      setLoading(false);
    }
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName("");
    setSelectedOrderId("");
    setError("");
    setSuccess("");
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Preparar Pedidos
          </h1>
          <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
            Crea un nuevo pedido o agrega prendas a uno existente
          </p>
        </div>
        <div className="flex gap-2">
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm sm:text-base"
            >
              🗑️ Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Selector: Nuevo pedido o Agregar a existente */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
              Nuevo Pedido
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => {
                setCustomerName(e.target.value);
                if (e.target.value) setSelectedOrderId("");
              }}
              placeholder="Nombre del cliente..."
              disabled={!!selectedOrderId}
              className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
              O Agregar a Pedido Existente
            </label>
            <select
              value={selectedOrderId}
              onChange={(e) => {
                setSelectedOrderId(e.target.value);
                if (e.target.value) setCustomerName("");
              }}
              disabled={!!customerName}
              className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Seleccionar pedido...</option>
              {pendingOrders.map((order) => (
                <option key={order._id} value={order._id}>
                  {order.customerName} - {order.items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0)} prendas - $
                  {order.totalAmount.toFixed(0)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Scanner de código de barras */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
            Agregar Prendas al Pedido
          </h2>
          <button
            onClick={toggleScanner}
            className={`px-4 py-2 rounded-lg transition-colors text-sm sm:text-base font-semibold ${
              showScanner
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {showScanner ? "✕ Cerrar Cámara" : "📷 Usar Cámara"}
          </button>
        </div>

        {showScanner ? (
          <div className="mb-4">
            <div id="reader" className="rounded-lg overflow-hidden"></div>
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-2 text-center">
              Apunta la cámara al código de barras
            </p>
          </div>
        ) : (
          <form onSubmit={handleBarcodeSubmit} className="flex gap-3">
            <input
              id="barcode-input"
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Ingresa o escanea código de barras..."
              className="flex-1 px-4 py-2 sm:py-3 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
              disabled={loading}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={loading || !barcode.trim()}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm sm:text-base"
            >
              {loading ? "⏳" : "➕ Agregar"}
            </button>
          </form>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm sm:text-base font-semibold">
            {success}
          </div>
        )}
      </div>

      {/* Carrito de compras */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              Carrito ({cart.length}{" "}
              {cart.length === 1 ? "producto" : "productos"})
            </h2>
          </div>
        </div>

        {cart.length === 0 ? (
          <div className="p-8 sm:p-16 text-center">
            <div className="text-5xl sm:text-6xl mb-4">🛒</div>
            <p className="text-gray-500 dark:text-slate-400 text-sm sm:text-base">
              Escanea productos para agregarlos al carrito
            </p>
          </div>
        ) : (
          <>
            {/* Vista desktop - tabla */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Tipo de Venta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Precio Unitario
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {cart.map((item) => (
                    <tr
                      key={item.barcode}
                      className="hover:bg-gray-50 dark:hover:bg-slate-700/50"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        <div>
                          <span>{item.name}</span>
                          {item.quantity > item.stock && (
                            <span className="block text-xs font-semibold text-amber-600 dark:text-amber-400 mt-1">
                              {item.stock <= 0
                                ? "⚠️ Sin Stock - Venta a Pedido"
                                : `⚠️ Stock insuficiente (${item.stock} disp.) - Venta a Pedido`}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">
                        {item.barcode}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={item.priceType}
                          onChange={(e) =>
                            changePriceType(
                              item.barcode,
                              e.target.value as "normal" | "transfer" | "custom"
                            )
                          }
                          className="px-2 py-1 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="normal">💵 Normal</option>
                          <option value="transfer">💳 Transferencia</option>
                          <option value="custom">✏️ Custom</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.barcode, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 rounded-lg text-gray-800 dark:text-white font-bold"
                          >
                            -
                          </button>
                          <span className="font-mono text-sm w-8 text-center text-gray-900 dark:text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.barcode, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 rounded-lg text-gray-800 dark:text-white font-bold"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {item.priceType === "custom" ? (
                          <input
                            type="number"
                            value={item.customPrice || ""}
                            onChange={(e) =>
                              updateCustomPrice(
                                item.barcode,
                                Number(e.target.value)
                              )
                            }
                            placeholder="Precio..."
                            className="w-24 px-2 py-1 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
                            min="0"
                            step="0.01"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            $
                            {formatPrice(
                              item.priceType === "transfer"
                                ? item.priceTransfer
                                : item.priceNormal
                            )}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => removeItem(item.barcode)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vista móvil - tarjetas */}
            <div className="lg:hidden p-4 space-y-3">
              {cart.map((item) => (
                <div
                  key={item.barcode}
                  className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 border border-gray-200 dark:border-slate-600"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-slate-400">
                        {item.barcode}
                      </p>
                      {item.quantity > item.stock && (
                        <span className="block text-xs font-semibold text-amber-600 dark:text-amber-400 mt-1">
                          {item.stock <= 0
                            ? "⚠️ Sin Stock - Venta a Pedido"
                            : `⚠️ Stock insuficiente (${item.stock} disp.) - A Pedido`}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(item.barcode)}
                      className="text-red-600 dark:text-red-400 ml-2"
                    >
                      🗑️
                    </button>
                  </div>
                  <div className="mt-3 space-y-3">
                    <select
                      value={item.priceType}
                      onChange={(e) =>
                        changePriceType(
                          item.barcode,
                          e.target.value as "normal" | "transfer" | "custom"
                        )
                      }
                      className="w-full px-2 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="normal">💵 Normal</option>
                      <option value="transfer">💳 Transferencia</option>
                      <option value="custom">✏️ Custom</option>
                    </select>

                    <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded-lg border border-gray-200 dark:border-slate-700">
                      <span className="text-xs text-gray-500 dark:text-slate-400 font-semibold">Cantidad:</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.barcode, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded text-gray-800 dark:text-white font-bold text-sm"
                        >
                          -
                        </button>
                        <span className="font-mono text-xs w-6 text-center text-gray-900 dark:text-white font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.barcode, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded text-gray-800 dark:text-white font-bold text-sm"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {item.priceType === "custom" ? (
                      <input
                        type="number"
                        value={item.customPrice || ""}
                        onChange={(e) =>
                          updateCustomPrice(
                            item.barcode,
                            Number(e.target.value)
                          )
                        }
                        placeholder="Precio custom..."
                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
                        min="0"
                        step="0.01"
                      />
                    ) : (
                      <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 text-center pt-1">
                        $
                        {formatPrice(
                          (item.priceType === "transfer"
                            ? item.priceTransfer
                            : item.priceNormal) * item.quantity
                        )}
                        <span className="text-xs text-gray-500 dark:text-slate-400 font-normal ml-1">
                          (${formatPrice(
                            item.priceType === "transfer"
                              ? item.priceTransfer
                              : item.priceNormal
                          )} c/u)
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 sm:p-6 border-t-2 border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-center sm:text-left">
                  <p className="text-sm text-gray-500 dark:text-slate-400 font-semibold">
                    Pedido preparado - {cart.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                    {cart.reduce((sum, item) => sum + item.quantity, 0) === 1 ? "prenda" : "prendas"}
                  </p>
                  <p className="text-3xl sm:text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                    ${formatPrice(calculateTotal())}
                  </p>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={
                    loading || (!customerName.trim() && !selectedOrderId)
                  }
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold text-base sm:text-lg shadow-lg"
                >
                  {loading
                    ? "Procesando..."
                    : selectedOrderId
                    ? "➕ Agregar al Pedido"
                    : "📦 Crear Pedido"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      {showUndoToast && lastRemovedItem && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 md:left-auto md:right-4 md:translate-x-0 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center justify-between gap-4 z-50 border border-slate-700 animate-scale-in text-sm font-medium">
          <span>Se eliminó "{lastRemovedItem.item.name}"</span>
          <button
            onClick={handleUndoRemove}
            className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors uppercase tracking-wider text-xs"
          >
            Deshacer
          </button>
        </div>
      )}
    </div>
  );
}

