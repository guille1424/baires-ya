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
  customerName: string;
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
        <div className="flex flex-wrap gap-2">
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
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {order.customerName}
                      </h3>
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
    </div>
  );
}
