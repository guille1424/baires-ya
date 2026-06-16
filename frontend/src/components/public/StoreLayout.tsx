import React from "react";
import StoreNavbar from "./StoreNavbar";
import CartDrawer from "./CartDrawer";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 font-sans selection:bg-indigo-500/30">
      <StoreNavbar />
      <CartDrawer />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {children}
      </main>
      
      {/* Simple footer for public store */}
      <footer className="bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 dark:text-slate-400">
          <p className="font-semibold text-lg text-gray-900 dark:text-white mb-2">BAIRESYA</p>
          <p className="text-sm">Ropa con estilo. Todos los derechos reservados &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
