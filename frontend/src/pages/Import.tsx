import { useState, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import * as XLSX from "xlsx";

export default function Import() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    created: number;
    updated: number;
    errors?: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { token } = useAuth();

  const downloadTemplate = () => {
    // Crear datos de ejemplo
    const exampleData = [
      {
        barcode: "7501234567890",
        name: "Remera Básica",
        category: "Remera",
        size: "M",
        color: "Negro",
        price: 5000,
        priceNormal: 10000,
        priceTransfer: 9000,
        stock: 15,
        supplierName: "Proveedor Flores",
        supplierAddress: "Av. Avellaneda 2900, CABA",
      },
      {
        barcode: "7501234567891",
        name: "Jean Clásico",
        category: "Pantalón",
        size: "32",
        color: "Azul",
        price: 8500,
        priceNormal: 17000,
        priceTransfer: 15300,
        stock: 8,
        supplierName: "Distribuidores Once",
        supplierAddress: "Paso 420, CABA",
      },
      {
        barcode: "7501234567892",
        name: "Buzo Deportivo",
        category: "Buzo",
        size: "L",
        color: "Gris",
        price: 7200,
        priceNormal: 14400,
        priceTransfer: 12960,
        stock: 20,
        supplierName: "Proveedor Flores",
        supplierAddress: "Av. Avellaneda 2900, CABA",
      },
    ];

    // Crear libro de Excel
    const ws = XLSX.utils.json_to_sheet(exampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Productos");

    // Ajustar ancho de columnas
    const colWidths = [
      { wch: 15 }, // barcode
      { wch: 20 }, // name
      { wch: 15 }, // category
      { wch: 8 }, // size
      { wch: 12 }, // color
      { wch: 10 }, // price
      { wch: 12 }, // priceNormal
      { wch: 12 }, // priceTransfer
      { wch: 10 }, // stock
      { wch: 20 }, // supplierName
      { wch: 25 }, // supplierAddress
    ];
    ws["!cols"] = colWidths;

    // Descargar archivo
    XLSX.writeFile(wb, "plantilla_productos.xlsx");
  };

  const handleFileSelect = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      alert("Por favor selecciona un archivo Excel (.xlsx o .xls)");
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:5000/api/import", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error("Error al importar:", err);
      alert("Error al importar el archivo");
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Importar Productos
        </h1>
        <button
          onClick={downloadTemplate}
          className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-lg text-sm sm:text-base flex items-center justify-center gap-2"
        >
          <span>📥</span>
          <span>Descargar Plantilla Excel</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 p-4 sm:p-8">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          className={`border-2 border-dashed rounded-xl p-6 sm:p-12 text-center transition-all cursor-pointer ${
            isDragging
              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
              : "border-gray-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500"
          }`}
        >
          <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">📥</div>
          <p className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {uploading ? "Importando..." : "Arrastra un archivo Excel aquí"}
          </p>
          <p className="text-sm sm:text-base text-gray-600 dark:text-slate-400 mb-4 sm:mb-6">
            {uploading ? "Por favor espera..." : "o haz clic para seleccionar"}
          </p>
          {!uploading && (
            <button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 text-sm sm:text-base">
              Seleccionar Archivo
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleInputChange}
          className="hidden"
        />

        {result && (
          <div className="mt-4 sm:mt-6 p-4 sm:p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <h3 className="text-base sm:text-lg font-bold text-green-900 dark:text-green-400 mb-2 sm:mb-3">
              ✅ Importación Exitosa
            </h3>
            <div className="space-y-1 sm:space-y-2 text-sm sm:text-base text-green-800 dark:text-green-300">
              <p>• {result.created} productos creados</p>
              <p>• {result.updated} productos actualizados</p>
            </div>
            {result.errors && result.errors.length > 0 && (
              <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm sm:text-base font-semibold text-yellow-900 dark:text-yellow-400 mb-2">
                  Advertencias:
                </p>
                <ul className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-300 space-y-1">
                  {result.errors.map((error, i) => (
                    <li key={i}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-base sm:text-lg font-semibold text-blue-900 dark:text-blue-400 mb-3 sm:mb-4">
            📝 Formato del Archivo Excel
          </h3>
          <p className="text-sm sm:text-base text-blue-800 dark:text-blue-300 mb-3 sm:mb-4">
            El archivo debe tener las siguientes columnas en la primera fila:
          </p>
          <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded border border-blue-200 dark:border-blue-700 overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="text-blue-900 dark:text-blue-400">
                  <th className="text-left pb-2 pr-2">Columna</th>
                  <th className="text-left pb-2 pr-2 hidden sm:table-cell">
                    Descripción
                  </th>
                  <th className="text-left pb-2">Req.</th>
                </tr>
              </thead>
              <tbody className="text-blue-800 dark:text-blue-300 divide-y divide-blue-200 dark:divide-blue-700">
                <tr>
                  <td className="py-2 font-mono pr-2">barcode</td>
                  <td className="py-2 hidden sm:table-cell pr-2">
                    Código de barras único
                  </td>
                  <td className="py-2">Sí</td>
                </tr>
                <tr>
                  <td className="py-2 font-mono pr-2">name</td>
                  <td className="py-2 hidden sm:table-cell pr-2">
                    Nombre del producto
                  </td>
                  <td className="py-2">Sí</td>
                </tr>
                <tr>
                  <td className="py-2 font-mono pr-2">category</td>
                  <td className="py-2 hidden sm:table-cell pr-2">
                    Categoría (ej: Remera, Pantalón)
                  </td>
                  <td className="py-2">Sí</td>
                </tr>
                <tr>
                  <td className="py-2 font-mono pr-2">size</td>
                  <td className="py-2 hidden sm:table-cell pr-2">
                    Talle (ej: S, M, L, XL)
                  </td>
                  <td className="py-2">Sí</td>
                </tr>
                <tr>
                  <td className="py-2 font-mono pr-2">color</td>
                  <td className="py-2 hidden sm:table-cell pr-2">
                    Color (ej: Negro, Blanco)
                  </td>
                  <td className="py-2">Sí</td>
                </tr>
                <tr>
                  <td className="py-2 font-mono pr-2">price</td>
                  <td className="py-2 hidden sm:table-cell pr-2">
                    Precio de Costo (número)
                  </td>
                  <td className="py-2">Sí</td>
                </tr>
                <tr>
                  <td className="py-2 font-mono pr-2">priceNormal</td>
                  <td className="py-2 hidden sm:table-cell pr-2">
                    Precio Venta Normal (número)
                  </td>
                  <td className="py-2">Sí</td>
                </tr>
                <tr>
                  <td className="py-2 font-mono pr-2">priceTransfer</td>
                  <td className="py-2 hidden sm:table-cell pr-2">
                    Precio Venta Transferencia (número)
                  </td>
                  <td className="py-2">Sí</td>
                </tr>
                <tr>
                  <td className="py-2 font-mono pr-2">stock</td>
                  <td className="py-2 hidden sm:table-cell pr-2">
                    Cantidad inicial de stock (número)
                  </td>
                  <td className="py-2">Sí</td>
                </tr>
                <tr>
                  <td className="py-2 font-mono pr-2">supplierName</td>
                  <td className="py-2 hidden sm:table-cell pr-2">
                    Nombre del Proveedor o Tienda
                  </td>
                  <td className="py-2">No (Opcional)</td>
                </tr>
                <tr>
                  <td className="py-2 font-mono pr-2">supplierAddress</td>
                  <td className="py-2 hidden sm:table-cell pr-2">
                    Dirección del Proveedor o Local
                  </td>
                  <td className="py-2">No (Opcional)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-400 mt-3 sm:mt-4">
            💡 Si el código de barras ya existe, el producto será actualizado.
            Caso contrario, se creará uno nuevo.
          </p>
        </div>
      </div>
    </div>
  );
}
