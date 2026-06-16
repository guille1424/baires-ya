import { useCustomerAuth } from "../../contexts/CustomerAuthContext";
import { useNavigate } from "react-router-dom";

export default function CustomerProfile() {
  const { customer, logoutCustomer } = useCustomerAuth();
  const navigate = useNavigate();

  if (!customer) {
    navigate("/ingresar");
    return null;
  }

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
          </div>
        </div>
      </div>
    </div>
  );
}
