import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "../contexts/AuthContext";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: "📊" },
    { path: "/sales", label: "Nuevo Pedido", icon: "🛒" },
    { path: "/orders", label: "Gestión", icon: "📦" },
    { path: "/inventory", label: "Inventario", icon: "👕" },
    { path: "/customers", label: "Clientes", icon: "👥" },
    { path: "/import", label: "Importar", icon: "📥" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white transition-colors">
      {/* Header con navegación */}
      <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo y título */}
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-14 animate-spin-invert flex items-center justify-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <img
                    key={i}
                    src="/logo.webp"
                    alt="BairesYa"
                    className="absolute h-full w-full object-contain"
                    style={{
                      transform: `translateZ(${(i - 2) * 0.3}px)`,
                    }}
                  />
                ))}
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                BairesYa
              </h1>
            </div>

            {/* Navegación desktop */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium ${
                    location.pathname === item.path
                      ? "bg-indigo-600 text-white shadow-lg"
                      : "text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* Botón salir y hamburguesa */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                Salir
              </button>

              {/* Botón hamburguesa móvil */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              >
                {mobileMenuOpen ? "✕" : "☰"}
              </button>
            </div>
          </div>

          {/* Menú móvil */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 dark:border-slate-700 py-2">
              <nav className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      location.pathname === item.path
                        ? "bg-indigo-600 text-white shadow-lg"
                        : "text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main
        className="bg-gray-50 dark:bg-slate-900 min-h-screen pb-16"
        style={{ paddingTop: "80px" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">{children}</div>
      </main>
    </div>
  );
}
