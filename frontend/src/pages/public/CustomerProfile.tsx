import { useCustomerAuth } from "../../contexts/CustomerAuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

interface OrderItem {
  name: string;
  quantity: number;
  priceAtSale: number;
  size?: string;
  color?: string;
}

interface Order {
  _id: string;
  date: string;
  status: string;
  totalAmount: number;
  items: OrderItem[];
}

export default function CustomerProfile() {
  const { customer, logoutCustomer, token } = useCustomerAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  if (!customer) {
    navigate("/ingresar");
    return null;
  }

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/public/auth/orders", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setOrders(data);
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchOrders();
  }, [token]);

  const handleLogout = () => {
    logoutCustomer();
    navigate("/");
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-2">Mi Cuenta</h1>
        <p className="text-gray-500 dark:text-slate-400">Gestioná tus datos y compras</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-800">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center text-2xl font-bold mb-4">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{customer.name}</h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">{customer.email}</p>
            
            <button 
              onClick={handleLogout}
              className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-xl font-medium transition-colors text-sm"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-slate-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Mis Pedidos</h2>
            
            {loading ? (
              <div className="text-center py-12 text-gray-500">Cargando...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
                <span className="text-4xl mb-3 block">🛍️</span>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Aún no hiciste pedidos</h3>
                <p className="text-gray-500 dark:text-slate-400 text-sm mb-4">Tus próximas compras aparecerán acá.</p>
                <button 
                  onClick={() => navigate("/")}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium transition-colors shadow-md shadow-indigo-500/20"
                >
                  Ir a la Tienda
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order._id} className="border border-gray-100 dark:border-slate-700 rounded-xl p-4 sm:p-5">
                    <div className="flex justify-between items-start border-b border-gray-100 dark:border-slate-700 pb-3 mb-3">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-slate-400">
                          {new Date(order.date).toLocaleDateString()}
                        </p>
                        <p className="font-bold text-gray-900 dark:text-white mt-1">
                          Total: ${order.totalAmount}
                        </p>
                      </div>
                      <div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          order.status === "web_pending" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" :
                          order.status === "approved" || order.status === "pending" || order.status === "delivered" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                          "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}>
                          {order.status === "web_pending" ? "⏳ Pendiente" : 
                           order.status === "cancelled" ? "❌ Cancelado" : "✅ Confirmado"}
                        </span>
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="text-sm flex justify-between text-gray-700 dark:text-slate-300">
                          <span>{item.quantity}x {item.name} {item.size ? `(${item.size})` : ""}</span>
                          <span>${item.priceAtSale * item.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
