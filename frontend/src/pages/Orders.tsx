import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

interface OrderItem {
  barcode: string;
  name: string;
  priceAtSale: number;
  priceType: string;
  quantity: number;
  isPreOrder?: boolean;
}

interface Order {
  _id: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  date: string;
  totalAmount: number;
  items: OrderItem[];
  status: "pending" | "delivered";
  deliveredAt?: string;
}

interface ConfirmModal {
  show: boolean;
  title: string;
  message: string;
  type: "deliver" | "cancel";
  orderId: string;
}

interface AlertModal {
  show: boolean;
  message: string;
  type: "success" | "error";
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "delivered">(
    "pending"
  );
  const [confirmModal, setConfirmModal] = useState<ConfirmModal>({
    show: false,
    title: "",
    message: "",
    type: "deliver",
    orderId: "",
  });
  const [alertModal, setAlertModal] = useState<AlertModal>({
    show: false,
    message: "",
    type: "success",
  });
  const { token } = useAuth();

  // Estados para consolidación de compras
  const [showConsolidationModal, setShowConsolidationModal] = useState(false);
  const [consolidationList, setConsolidationList] = useState<any[]>([]);
  const [consolidationLoading, setConsolidationLoading] = useState(false);

  const fetchConsolidation = async () => {
    setConsolidationLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/sales/consolidation", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setConsolidationList(data);
      setShowConsolidationModal(true);
    } catch {
      setAlertModal({
        show: true,
        message: "Error al cargar consolidación de compras",
        type: "error",
      });
    } finally {
      setConsolidationLoading(false);
    }
  };

  const handlePrintConsolidation = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Por favor permite las ventanas emergentes para poder imprimir la lista de compras.");
      return;
    }

    const grouped = consolidationList.reduce((groups: { [key: string]: any[] }, item) => {
      const supplier = item.supplierName || "Sin Proveedor";
      if (!groups[supplier]) {
        groups[supplier] = [];
      }
      groups[supplier].push(item);
      return groups;
    }, {});

    let contentHtml = "";
    Object.keys(grouped).forEach((supplier) => {
      const address = grouped[supplier][0].supplierAddress;
      let tableRows = "";
      grouped[supplier].forEach((item) => {
        tableRows += `
          <tr>
            <td><strong>${item.name}</strong><br/><small>${item.barcode}</small></td>
            <td>${item.size}</td>
            <td>${item.color}</td>
            <td class="qty">${item.quantity}</td>
          </tr>
        `;
      });

      contentHtml += `
        <div class="supplier-section">
          <div class="supplier-header">
            <div class="supplier-name">${supplier.toUpperCase()}</div>
            ${address ? `<div class="supplier-address">📍 ${address}</div>` : ""}
          </div>
          <table>
            <thead>
              <tr>
                <th>Prenda</th>
                <th>Talle</th>
                <th>Color</th>
                <th>Cant.</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
      `;
    });

    const dateStr = new Date().toLocaleDateString();
    const timeStr = new Date().toLocaleTimeString();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Lista de Compras Consolidada - BairesYa</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              margin: 20px;
              color: #000;
              background-color: #fff;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px double #000;
              padding-bottom: 10px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              letter-spacing: 2px;
            }
            .header p {
              margin: 5px 0 0 0;
              font-size: 12px;
              color: #555;
            }
            .supplier-section {
              margin-bottom: 30px;
              page-break-inside: avoid;
            }
            .supplier-header {
              background-color: #f2f2f2;
              padding: 10px;
              border: 1px solid #000;
              margin-bottom: 10px;
            }
            .supplier-name {
              font-size: 16px;
              font-weight: 800;
            }
            .supplier-address {
              font-size: 12px;
              margin-top: 3px;
              color: #444;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 10px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
              font-size: 13px;
            }
            th {
              background-color: #fafafa;
              font-weight: 700;
            }
            td.qty {
              font-weight: 800;
              text-align: center;
              font-size: 14px;
            }
            @media print {
              body {
                margin: 10px;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>BAIRESYA - LISTA DE COMPRAS</h1>
            <p>Generado el ${dateStr} a las ${timeStr}</p>
          </div>
          ${contentHtml}
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
  };

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      const url =
        filter === "all"
          ? "http://localhost:5000/api/sales"
          : `http://localhost:5000/api/sales?status=${filter}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      console.error("Error al cargar pedidos:", err);
      setError("Error al cargar pedidos");
    } finally {
      setLoading(false);
    }
  };

  const deliverOrder = async (orderId: string) => {
    setConfirmModal({
      show: true,
      title: "Confirmar Entrega",
      message: "¿Marcar este pedido como entregado?",
      type: "deliver",
      orderId,
    });
  };

  const confirmDeliverOrder = async () => {
    const orderId = confirmModal.orderId;
    setConfirmModal({ ...confirmModal, show: false });

    try {
      const response = await fetch(
        `http://localhost:5000/api/sales/${orderId}/deliver`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al entregar pedido");
      }

      setAlertModal({
        show: true,
        message: "✅ Pedido marcado como entregado exitosamente",
        type: "success",
      });
      fetchOrders();
    } catch (err: any) {
      setAlertModal({
        show: true,
        message: err.message || "Error al entregar pedido",
        type: "error",
      });
    }
  };

  const cancelOrder = async (orderId: string) => {
    setConfirmModal({
      show: true,
      title: "Cancelar Pedido",
      message: "¿Cancelar este pedido y liberar los productos reservados?",
      type: "cancel",
      orderId,
    });
  };

  const confirmCancelOrder = async () => {
    const orderId = confirmModal.orderId;
    setConfirmModal({ ...confirmModal, show: false });

    try {
      const response = await fetch(
        `http://localhost:5000/api/sales/${orderId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al cancelar pedido");
      }

      setAlertModal({
        show: true,
        message: "✅ Pedido cancelado y productos liberados",
        type: "success",
      });
      fetchOrders();
    } catch (err: any) {
      setAlertModal({
        show: true,
        message: err.message || "Error al cancelar pedido",
        type: "error",
      });
    }
  };

  const formatPrice = (price: number) => {
    return price % 1 === 0 ? price.toFixed(0) : price.toFixed(2);
  };

  const getPriceTypeLabel = (type: string) => {
    switch (type) {
      case "normal":
        return "💵 Normal";
      case "transfer":
        return "💳 Transferencia";
      case "custom":
        return "✏️ Custom";
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 dark:text-slate-400">
          Cargando pedidos...
        </div>
      </div>
    );
  }

  const getWhatsAppMessage = (order: Order) => {
    const itemsText = order.items
      .map((item) => `- ${item.name} (${item.quantity} prenda${item.quantity > 1 ? "s" : ""})`)
      .join("\n");
    const total = order.totalAmount % 1 === 0 ? order.totalAmount.toFixed(0) : order.totalAmount.toFixed(2);
    return `¡Hola ${order.customerName}! Tu pedido de BairesYa está listo para retirar/entregar. 😊\n\nDetalle:\n${itemsText}\n\nTotal: $${total}\n¡Muchas gracias!`;
  };

  return (
    <div>
      {/* Modal de Confirmación */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-slate-700 animate-scale-in">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`text-4xl ${
                    confirmModal.type === "deliver"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {confirmModal.type === "deliver" ? "✅" : "⚠️"}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {confirmModal.title}
                </h3>
              </div>
              <p className="text-gray-600 dark:text-slate-400 mb-6">
                {confirmModal.message}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    setConfirmModal({ ...confirmModal, show: false })
                  }
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={
                    confirmModal.type === "deliver"
                      ? confirmDeliverOrder
                      : confirmCancelOrder
                  }
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors font-semibold text-white ${
                    confirmModal.type === "deliver"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {confirmModal.type === "deliver"
                    ? "Confirmar"
                    : "Sí, Cancelar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Alerta */}
      {alertModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-slate-700 animate-scale-in">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`text-4xl ${
                    alertModal.type === "success"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {alertModal.type === "success" ? "✅" : "❌"}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {alertModal.type === "success" ? "Éxito" : "Error"}
                </h3>
              </div>
              <p className="text-gray-600 dark:text-slate-400 mb-6">
                {alertModal.message}
              </p>
              <button
                onClick={() => setAlertModal({ ...alertModal, show: false })}
                className={`w-full px-4 py-2 rounded-lg transition-colors font-semibold text-white ${
                  alertModal.type === "success"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Gestión de Pedidos
        </h1>
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Administra los pedidos pendientes y entregados
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === "pending"
                ? "bg-yellow-600 text-white"
                : "bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-600"
            }`}
          >
            📦 Pendientes
          </button>
          <button
            onClick={() => setFilter("delivered")}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === "delivered"
                ? "bg-green-600 text-white"
                : "bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-600"
            }`}
          >
            ✅ Entregados
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === "all"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-600"
            }`}
          >
            📋 Todos
          </button>
          <button
            onClick={fetchConsolidation}
            disabled={consolidationLoading}
            className="sm:ml-auto w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {consolidationLoading ? "⏳ Cargando..." : "🛍️ Lista de Compras"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Lista de pedidos */}
      {orders.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 p-12 text-center">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-gray-500 dark:text-slate-400">
            No hay pedidos{" "}
            {filter === "all"
              ? ""
              : filter === "pending"
              ? "pendientes"
              : "entregados"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden"
            >
              <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {order.customerName}
                      </h3>
                      {order.customerPhone && (
                        <a
                          href={`https://wa.me/${order.customerPhone}?text=${encodeURIComponent(getWhatsAppMessage(order))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-bold text-xs flex items-center gap-1 shadow-sm"
                          title="Enviar Mensaje por WhatsApp"
                        >
                          💬 WhatsApp (+{order.customerPhone})
                        </a>
                      )}
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          order.status === "pending"
                            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400"
                            : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                        }`}
                      >
                        {order.status === "pending"
                          ? "📦 Pendiente"
                          : "✅ Entregado"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-slate-400">
                      Pedido: {new Date(order.date).toLocaleString("es-AR")}
                    </p>
                    {order.deliveredAt && (
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Entregado:{" "}
                        {new Date(order.deliveredAt).toLocaleString("es-AR")}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-slate-400">
                      Total
                    </p>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      ${formatPrice(order.totalAmount)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Productos del pedido */}
              <div className="p-4 sm:p-6">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">
                  Productos ({order.items.reduce((sum, item) => sum + item.quantity, 0)} prendas)
                </h4>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                          <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full font-semibold">
                            Cant: {item.quantity}
                          </span>
                          {item.isPreOrder && (
                            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-full font-bold">
                              ⚠️ Venta a Pedido (Sin Stock)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                          {item.barcode} • {getPriceTypeLabel(item.priceType)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-white">
                          ${formatPrice(item.priceAtSale * item.quantity)}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-xs text-gray-500 dark:text-slate-400">
                            (${formatPrice(item.priceAtSale)} c/u)
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Acciones */}
              {order.status === "pending" && (
                <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => deliverOrder(order._id)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                  >
                    ✅ Marcar como Entregado
                  </button>
                  <button
                    onClick={() => cancelOrder(order._id)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                  >
                    ❌ Cancelar Pedido
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de Consolidación de Compras */}
      {showConsolidationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-lg w-full border border-gray-200 dark:border-slate-700 animate-scale-in p-6">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-slate-700 pb-3">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                🛍️ Lista de Compras
              </h3>
              <button
                onClick={() => handlePrintConsolidation()}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm transition-colors flex items-center gap-1"
              >
                🖨️ Imprimir
              </button>
            </div>

            {(() => {
              const grouped = consolidationList.reduce((groups: { [key: string]: any[] }, item) => {
                const supplier = item.supplierName || "Sin Proveedor";
                if (!groups[supplier]) {
                  groups[supplier] = [];
                }
                groups[supplier].push(item);
                return groups;
              }, {});

              const supplierKeys = Object.keys(grouped);

              if (supplierKeys.length === 0) {
                return (
                  <p className="text-gray-500 dark:text-slate-400 py-8 text-center font-medium">
                    No hay productos en pre-venta pendientes de compra.
                  </p>
                );
              }

              return (
                <div className="space-y-4 text-left max-h-[60vh] overflow-y-auto pr-1">
                  {supplierKeys.map((supplier) => (
                    <div
                      key={supplier}
                      className="border border-gray-200 dark:border-slate-700 rounded-xl p-4 bg-gray-50 dark:bg-slate-900/40"
                    >
                      <div className="mb-2 border-b border-gray-200 dark:border-slate-700 pb-1 flex justify-between items-start gap-3">
                        <div>
                          <h4 className="font-extrabold text-sm text-indigo-600 dark:text-indigo-400">
                            {supplier.toUpperCase()}
                          </h4>
                          {grouped[supplier][0].supplierAddress && (
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                              📍 {grouped[supplier][0].supplierAddress}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        {grouped[supplier].map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center text-sm border-b border-gray-100 dark:border-slate-800/40 pb-2 last:border-none last:pb-0"
                          >
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {item.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-slate-400">
                                Talle: <span className="font-semibold text-gray-700 dark:text-slate-300">{item.size}</span> | Color: <span className="font-semibold text-gray-700 dark:text-slate-300">{item.color}</span>
                              </p>
                            </div>
                            <span className="px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 rounded-full font-bold text-xs">
                              Cant: {item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            <div className="mt-6 pt-3 border-t border-gray-200 dark:border-slate-700">
              <button
                onClick={() => {
                  setShowConsolidationModal(false);
                  setConsolidationList([]);
                }}
                className="w-full px-4 py-2 bg-gray-300 dark:bg-slate-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-slate-500 transition-colors font-semibold"
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
