import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import * as XLSX from "xlsx";

interface Stats {
  available: {
    totalItems: number;
    totalCost: number;
    totalNormal: number;
    totalTransfer: number;
    marginNormal: number;
    marginTransfer: number;
  };
  sold: {
    totalItems: number;
    totalItemsNormal: number;
    totalItemsTransfer: number;
    totalItemsCustom: number;
    totalCost: number;
    totalNormal: number;
    totalTransfer: number;
    totalCustom: number;
    marginNormal: number;
    marginTransfer: number;
    marginCustom: number;
  };
  monthlySales: number;
  totalProducts: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [downloadingFullReport, setDownloadingFullReport] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { token } = useAuth();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/stats/summary", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Error al cargar estadísticas:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return price % 1 === 0 ? price.toFixed(0) : price.toFixed(2);
  };

  const downloadMonthlyReport = async () => {
    setDownloadingReport(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/stats/monthly-report?month=${selectedMonth}&year=${selectedYear}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();

      // Crear hoja de Excel con detalle de productos vendidos línea por línea
      const detailSheet = XLSX.utils.json_to_sheet(
        data.detailedSales.map((sale: any) => ({
          Fecha: new Date(sale.date).toLocaleDateString("es-AR"),
          Código: sale.barcode,
          Nombre: sale.name,
          Categoría: sale.category,
          Talle: sale.size,
          Color: sale.color,
          Costo: sale.cost,
          "Tipo de Venta": sale.priceType,
          "Precio de Venta": sale.salePrice,
          Ganancia: sale.profit,
        }))
      );

      // Crear resumen
      const summaryData = [
        ["RESUMEN DEL MES", ""],
        ["Período", `${data.period.month}/${data.period.year}`],
        ["", ""],
        ["Total Pedidos", data.summary.totalSales],
        ["Total Prendas Vendidas", data.summary.totalItems],
        ["", ""],
        ["Costo Total", `$${data.summary.totalCost.toFixed(2)}`],
        ["Ingresos Totales", `$${data.summary.totalRevenue.toFixed(2)}`],
        ["Ganancia Total", `$${data.summary.totalProfit.toFixed(2)}`],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumen");
      XLSX.utils.book_append_sheet(workbook, detailSheet, "Detalle de Ventas");

      const fileName = `reporte_${data.period.month}_${data.period.year}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (err) {
      console.error("Error al descargar reporte:", err);
      alert("Error al generar el reporte");
    } finally {
      setDownloadingReport(false);
    }
  };

  const downloadFullReport = async () => {
    setDownloadingFullReport(true);
    try {
      const response = await fetch(
        "http://localhost:5000/api/stats/full-report",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();

      // Hoja 1: Estadísticas Históricas
      const statsData = [
        ["ESTADÍSTICAS HISTÓRICAS COMPLETAS"],
        [""],
        ["Total de Productos", data.statistics.totalProductos],
        ["Disponibles", data.statistics.disponibles],
        ["Vendidos", data.statistics.vendidos],
        [""],
        ["VENTAS POR TIPO DE PRECIO"],
        [""],
        ["Precio Normal:"],
        ["  Cantidad vendida", data.statistics.ventasPorTipo.normal.cantidad],
        [
          "  Ingresos",
          `$${data.statistics.ventasPorTipo.normal.ingresos.toFixed(2)}`,
        ],
        [
          "  Costo",
          `$${data.statistics.ventasPorTipo.normal.costo.toFixed(2)}`,
        ],
        [
          "  Ganancia",
          `$${data.statistics.ventasPorTipo.normal.ganancia.toFixed(2)}`,
        ],
        [""],
        ["Transferencia:"],
        [
          "  Cantidad vendida",
          data.statistics.ventasPorTipo.transferencia.cantidad,
        ],
        [
          "  Ingresos",
          `$${data.statistics.ventasPorTipo.transferencia.ingresos.toFixed(2)}`,
        ],
        [
          "  Costo",
          `$${data.statistics.ventasPorTipo.transferencia.costo.toFixed(2)}`,
        ],
        [
          "  Ganancia",
          `$${data.statistics.ventasPorTipo.transferencia.ganancia.toFixed(2)}`,
        ],
        [""],
        ["Personalizado:"],
        [
          "  Cantidad vendida",
          data.statistics.ventasPorTipo.personalizado.cantidad,
        ],
        [
          "  Ingresos",
          `$${data.statistics.ventasPorTipo.personalizado.ingresos.toFixed(2)}`,
        ],
        [
          "  Costo",
          `$${data.statistics.ventasPorTipo.personalizado.costo.toFixed(2)}`,
        ],
        [
          "  Ganancia",
          `$${data.statistics.ventasPorTipo.personalizado.ganancia.toFixed(2)}`,
        ],
        [""],
        ["TOTALES GENERALES"],
        [
          "  Ingresos Totales",
          `$${data.statistics.totales.ingresos.toFixed(2)}`,
        ],
        ["  Costos Totales", `$${data.statistics.totales.costos.toFixed(2)}`],
        ["  Ganancia Total", `$${data.statistics.totales.ganancia.toFixed(2)}`],
      ];
      const statsSheet = XLSX.utils.aoa_to_sheet(statsData);

      // Hoja 2: Stock Disponible
      const availableSheet = XLSX.utils.json_to_sheet(
        data.availableProducts.map((p: any) => ({
          Código: p.barcode,
          Nombre: p.nombre,
          Categoría: p.categoria,
          Talle: p.talle,
          Color: p.color,
          Estado: p.estado,
          Costo: p.costo,
          "Precio Normal": p.precioNormal,
          "Precio Transferencia": p.precioTransferencia,
          "Margen Normal": p.margenNormal,
          "Margen Transferencia": p.margenTransferencia,
        }))
      );

      // Hoja 3: Productos Vendidos
      const soldSheet = XLSX.utils.json_to_sheet(
        data.soldProducts.map((p: any) => ({
          Fecha: p.fecha,
          Código: p.barcode,
          Nombre: p.nombre,
          Categoría: p.categoria,
          Talle: p.talle,
          Color: p.color,
          Costo: p.costo,
          "Tipo Venta": p.tipoVenta,
          "Precio Venta": p.precioVenta,
          Ganancia: p.ganancia,
        }))
      );

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, statsSheet, "Estadísticas");
      XLSX.utils.book_append_sheet(
        workbook,
        availableSheet,
        "Stock Disponible"
      );
      XLSX.utils.book_append_sheet(workbook, soldSheet, "Productos Vendidos");

      const fileName = `stock_completo_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (err) {
      console.error("Error al descargar reporte completo:", err);
      alert("Error al generar el reporte completo");
    } finally {
      setDownloadingFullReport(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 dark:text-slate-400">
          Cargando estadísticas...
        </div>
      </div>
    );
  }

  return (
    <div className="pb-16">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Dashboard
        </h1>

        {/* Controles de reportes */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 p-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">
            Descargar Reportes
          </h2>

          <div className="flex flex-col gap-3">
            {/* Reporte completo histórico */}
            <button
              onClick={downloadFullReport}
              disabled={downloadingFullReport}
              className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 justify-center font-semibold"
            >
              <span>📊</span>
              {downloadingFullReport
                ? "Generando..."
                : "Reporte Completo Histórico"}
            </button>

            {/* Filtros para reporte mensual */}
            <div className="border-t border-gray-200 dark:border-slate-700 pt-3">
              <p className="text-xs text-gray-600 dark:text-slate-400 mb-2">
                Reporte mensual específico:
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="flex-1 px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500"
                >
                  <option value={1}>Enero</option>
                  <option value={2}>Febrero</option>
                  <option value={3}>Marzo</option>
                  <option value={4}>Abril</option>
                  <option value={5}>Mayo</option>
                  <option value={6}>Junio</option>
                  <option value={7}>Julio</option>
                  <option value={8}>Agosto</option>
                  <option value={9}>Septiembre</option>
                  <option value={10}>Octubre</option>
                  <option value={11}>Noviembre</option>
                  <option value={12}>Diciembre</option>
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="flex-1 px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500"
                >
                  {Array.from(
                    { length: 5 },
                    (_, i) => new Date().getFullYear() - i + 1
                  )
                    .sort((a, b) => b - a)
                    .map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                </select>
                <button
                  onClick={downloadMonthlyReport}
                  disabled={downloadingReport}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 justify-center whitespace-nowrap font-semibold"
                >
                  <span>📥</span>
                  {downloadingReport ? "Generando..." : "Descargar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inventario Disponible */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          📦 Inventario Disponible
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700">
            <h3 className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-2">
              Prendas Disponibles
            </h3>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats?.available.totalItems || 0}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700">
            <h3 className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-2">
              Valor Costo
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${formatPrice(stats?.available.totalCost || 0)}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700">
            <h3 className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-2">
              Valor Normal
            </h3>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              ${formatPrice(stats?.available.totalNormal || 0)}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              +${formatPrice(stats?.available.marginNormal || 0)} margen
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700">
            <h3 className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-2">
              Valor Transferencia
            </h3>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              ${formatPrice(stats?.available.totalTransfer || 0)}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              +${formatPrice(stats?.available.marginTransfer || 0)} margen
            </p>
          </div>
        </div>
      </div>

      {/* Gráfico de Ventas Históricas */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 p-4 sm:p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          📊 Historial de Ventas por Tipo de Pago
        </h2>
        
        {stats ? (
          <div className="space-y-4">
            {[
              {
                label: "💵 Efectivo / Normal",
                revenue: stats.sold.totalNormal || 0,
                profit: stats.sold.marginNormal || 0,
                color: "bg-indigo-600 dark:bg-indigo-500",
                profitColor: "bg-indigo-400 dark:bg-indigo-300",
              },
              {
                label: "💳 Transferencia",
                revenue: stats.sold.totalTransfer || 0,
                profit: stats.sold.marginTransfer || 0,
                color: "bg-blue-600 dark:bg-blue-500",
                profitColor: "bg-blue-400 dark:bg-blue-300",
              },
              {
                label: "✏️ Personalizado (Custom)",
                revenue: stats.sold.totalCustom || 0,
                profit: stats.sold.marginCustom || 0,
                color: "bg-purple-600 dark:bg-purple-500",
                profitColor: "bg-purple-400 dark:bg-purple-300",
              },
            ].map((item, index) => {
              // Calcular porcentajes relativos para el ancho de las barras
              const maxVal = Math.max(
                stats.sold.totalNormal || 0,
                stats.sold.totalTransfer || 0,
                stats.sold.totalCustom || 0,
                1 // Evitar división por cero
              );
              const revenueWidth = (item.revenue / maxVal) * 100;
              const profitWidth = (item.profit / maxVal) * 100;

              return (
                <div key={index} className="space-y-1">
                  <div className="flex flex-col sm:flex-row sm:justify-between text-sm gap-1">
                    <span className="font-semibold text-gray-700 dark:text-slate-300">
                      {item.label}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-slate-400 font-mono">
                      Ingresos: ${formatPrice(item.revenue)} | Ganancia: ${formatPrice(item.profit)}
                    </span>
                  </div>
                  {/* Barra de Ingresos */}
                  <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-4 overflow-hidden relative" title={`Ingresos: $${formatPrice(item.revenue)}`}>
                    <div
                      className={`${item.color} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${revenueWidth}%` }}
                    />
                  </div>
                  {/* Barra de Ganancia */}
                  <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden relative" title={`Ganancia: $${formatPrice(item.profit)}`}>
                    <div
                      className={`${item.profitColor} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${profitWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="flex justify-between text-xs text-gray-400 dark:text-slate-500 pt-2 border-t border-gray-100 dark:border-slate-700">
              <span>Barra gruesa = Ingresos</span>
              <span>Barra fina = Ganancia neta</span>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-slate-400 text-center py-4">Cargando gráfico...</p>
        )}
      </div>

      {/* Productos Vendidos */}
      <div>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          ✅ Productos Vendidos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700">
            <h3 className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-2">
              Prendas Vendidas
            </h3>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats?.sold.totalItems || 0}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700">
            <h3 className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-2">
              Costo Total
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${formatPrice(stats?.sold.totalCost || 0)}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700">
            <h3 className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-2">
              Ingresos Normal
            </h3>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              ${formatPrice(stats?.sold.totalNormal || 0)}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              +${formatPrice(stats?.sold.marginNormal || 0)} ganancia
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700">
            <h3 className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-2">
              Ingresos Transferencia
            </h3>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              ${formatPrice(stats?.sold.totalTransfer || 0)}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              +${formatPrice(stats?.sold.marginTransfer || 0)} ganancia
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700">
            <h3 className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-2">
              Ingresos Personalizado
            </h3>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              ${formatPrice(stats?.sold.totalCustom || 0)}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              +${formatPrice(stats?.sold.marginCustom || 0)} ganancia
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
