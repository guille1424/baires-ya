import { Link } from "react-router-dom";
import { useCart } from "../../contexts/CartContext";
import { useCustomerAuth } from "../../contexts/CustomerAuthContext";

export default function StoreNavbar() {
  const { itemCount, setIsCartOpen } = useCart();
  const { customer, isCustomerAuthenticated } = useCustomerAuth();

  return (
    <nav className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tighter bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
                BAIRESYA
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {isCustomerAuthenticated ? (
              <Link 
                to="/mi-cuenta" 
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-full text-sm font-semibold transition-colors"
              >
                <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs">
                  {customer?.name.charAt(0).toUpperCase()}
                </div>
                Mi Cuenta
              </Link>
            ) : (
              <Link 
                to="/ingresar" 
                className="hidden sm:flex items-center px-4 py-2 text-sm font-semibold text-gray-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                Ingresar
              </Link>
            )}

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full animate-pulse-short">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
