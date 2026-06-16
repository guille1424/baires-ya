import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

interface SaleItem {
  productId?: string;
  barcode?: string;
  name?: string;
  quantity: number;
  priceAtSale: number;
  priceType?: string;
  isPreOrder?: boolean;
}

interface WebOrder {
  _id: string;
  customerName: string;
  customerPhone?: string;
  date: string;
  totalAmount: number;
  items: SaleItem[];
  status: "web_pending" | "approved" | "pending" | "delivered" | "cancelled";
}

export default function WebOrders() {
  const [orders, setOrders] = useState<WebOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  const fetchOrders = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/sales?status=web_pending", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      console.error("Error al cargar pedidos web:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const handleApprove = async (id: string) => {
    if (!confirm("¿Aprobar pedido? Esto descontará el stock de forma definitiva.")) return;
    try {
      await fetch(`http://localhost:5000/api/sales/${id}/approve-web`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert("Error al aprobar");
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("¿Rechazar pedido? Esto liberará la reserva temporal.")) return;
    try {
      await fetch(`http://localhost:5000/api/sales/${id}/reject-web`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert("Error al rechazar");
    }
  };

  if (loading) {
    return <div className="text-center p-8 text-slate-500">Cargando pedidos web...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pedidos Web Pendientes</h1>
        <div className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 px-3 py-1 rounded-full text-sm font-semibold">
          {orders.length} pedido(s)
        </div>
      </div>

      <div className="grid gap-6">
        {orders.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 p-8 text-center">
            <span className="text-4xl block mb-2">🌐</span>
            <p className="text-gray-500 dark:text-slate-400">No hay pedidos web pendientes en este momento.</p>
          </div>
        ) : (
          orders.map(order => (
            <div key={order._id} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden">
              <div className="p-5 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                    {order.customerName}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    {new Date(order.date).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-slate-400">Total a cobrar</p>
                  <p className="font-bold text-xl text-indigo-600 dark:text-indigo-400">
                    ${order.totalAmount}
                  </p>
                </div>
              </div>
              
              <div className="p-5">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Productos:</h4>
                <ul className="space-y-2 mb-6">
                  {order.items.map((item, i) => (
                    <li key={i} className="flex justify-between text-sm items-center bg-gray-50 dark:bg-slate-700/30 p-2 rounded">
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">{item.quantity}x</span> {item.name}
                        <p className="text-xs text-gray-500 dark:text-slate-400">{item.barcode}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-medium text-gray-900 dark:text-white">${item.priceAtSale} c/u</span>
                        {item.isPreOrder && (
                          <span className="ml-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs px-2 py-0.5 rounded border border-yellow-200 dark:border-yellow-800">Bajo Pedido</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="flex gap-3">
                  <button 
                    onClick={() => handleApprove(order._id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    ✅ Aprobar y Descontar Stock
                  </button>
                  <button 
                    onClick={() => handleReject(order._id)}
                    className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    ❌ Rechazar
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
