import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

interface Customer {
  _id: string;
  name: string;
  phone: string;
  createdAt?: string;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [error, setError] = useState("");

  const { token } = useAuth();

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredCustomers(customers);
    } else {
      const term = search.toLowerCase();
      setFilteredCustomers(
        customers.filter(
          (c) =>
            c.name.toLowerCase().includes(term) ||
            c.phone.includes(term)
        )
      );
    }
  }, [search, customers]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/customers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setCustomers(data);
      setFilteredCustomers(data);
    } catch (err) {
      console.error("Error al cargar clientes:", err);
      setError("Error al cargar la lista de clientes");
    } finally {
      setLoading(false);
    }
  };

  const cleanPhoneNumber = (phone: string) => {
    let clean = phone.replace(/\D/g, ""); // Eliminar no dígitos
    if (clean.length === 10) {
      clean = "549" + clean;
    } else if (clean.length === 11 && clean.startsWith("15")) {
      clean = "549" + clean.substring(2);
    } else if (clean.length === 11 && clean.startsWith("9")) {
      clean = "54" + clean;
    }
    return clean;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const normalizedPhone = cleanPhoneNumber(formData.phone);
    if (!normalizedPhone) {
      setError("Por favor ingresa un número de teléfono válido.");
      return;
    }

    try {
      const url = editingCustomer
        ? `http://localhost:5000/api/customers/${editingCustomer._id}`
        : "http://localhost:5000/api/customers";
      const method = editingCustomer ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: normalizedPhone,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al guardar cliente");
      }

      fetchCustomers();
      setShowModal(false);
      resetForm();
    } catch (err: any) {
      setError(err.message || "Error al guardar cliente");
    }
  };

  const handleDelete = (id: string) => {
    setCustomerToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;
    try {
      const response = await fetch(`http://localhost:5000/api/customers/${customerToDelete}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Error al eliminar cliente");
      }

      fetchCustomers();
      setShowDeleteModal(false);
      setCustomerToDelete(null);
    } catch (err: any) {
      setError(err.message || "Error al eliminar cliente");
    }
  };

  const openModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        phone: customer.phone,
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingCustomer(null);
    setFormData({
      name: "",
      phone: "",
    });
    setError("");
  };

  const getWhatsAppLink = (phone: string) => {
    const message = "¡Hola! Te agendamos desde BairesYa para enviarte novedades de tus pedidos. 😊";
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 dark:text-slate-400">
          Cargando clientes...
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Clientes
          </h1>
          <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
            {filteredCustomers.length}{" "}
            {filteredCustomers.length === 1 ? "cliente registrado" : "clientes registrados"}
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base font-semibold shadow-md"
        >
          + Agregar Cliente
        </button>
      </div>

      {/* Buscador */}
      <div className="mb-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 p-4">
        <input
          type="text"
          placeholder="Buscar por nombre o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 sm:py-3 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
        />
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Listado de Clientes */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="p-8 sm:p-12 text-center text-gray-500 dark:text-slate-400">
            No se encontraron clientes registrados.
          </div>
        ) : (
          <>
            {/* Vista Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      WhatsApp / Teléfono
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {filteredCustomers.map((customer) => (
                    <tr
                      key={customer._id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                        {customer.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-slate-300">
                        <span className="font-mono">+{customer.phone}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex justify-center items-center gap-3">
                          <a
                            href={getWhatsAppLink(customer.phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors font-semibold flex items-center gap-1.5 text-xs"
                          >
                            💬 Probar WA
                          </a>
                          <button
                            onClick={() => openModal(customer)}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-950 dark:hover:text-indigo-300 font-semibold"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(customer._id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-950 dark:hover:text-red-300 font-semibold"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vista Móvil */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-slate-700">
              {filteredCustomers.map((customer) => (
                <div key={customer._id} className="p-4 flex justify-between items-center">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">
                      {customer.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400 font-mono mt-0.5">
                      +{customer.phone}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <a
                      href={getWhatsAppLink(customer.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-lg hover:bg-green-200 transition-colors"
                      title="Probar WhatsApp"
                    >
                      💬
                    </a>
                    <button
                      onClick={() => openModal(customer)}
                      className="p-2 bg-indigo-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 transition-colors"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(customer._id)}
                      className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 transition-colors"
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal Agregar/Editar Cliente */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full border border-gray-200 dark:border-slate-700 animate-scale-in">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              {editingCustomer ? "Editar Cliente" : "Nuevo Cliente"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">
                  NOMBRE COMPLETO
                </label>
                <input
                  type="text"
                  placeholder="Nombre del cliente"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">
                  NÚMERO DE TELÉFONO / WHATSAPP
                </label>
                <input
                  type="text"
                  placeholder="Ej: 11 2233 4455 o 5491122334455"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                  required
                />
                <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-1">
                  💡 Se autocompleta con el prefijo correcto de Argentina si ingresas 10 dígitos.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
                >
                  {editingCustomer ? "Guardar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmación Borrado */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-sm w-full border border-gray-200 dark:border-slate-700 animate-scale-in text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full mb-4 text-2xl">
              ⚠️
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              ¿Eliminar cliente?
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-6">
              El cliente será quitado de la lista, pero las órdenes históricas se mantendrán intactas.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
