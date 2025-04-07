import React, { useEffect, useState, useCallback } from "react";
import useSaleStore from "../Store/useSaleStore";

const SellingExtra = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { fetchSales, sales } = useSaleStore();
  const [salesStats, setSalesStats] = useState({
    todaySales: 0,
    weeklySales: 0,
    monthlySales: 0,
    itemsSoldToday: 0,
    topItem: { id: "none", name: "None", quantity: 0 },
  });

  const calculateSalesStats = useCallback((salesData) => {
    if (!salesData || salesData.length === 0) {
      setSalesStats({
        todaySales: 0,
        weeklySales: 0,
        monthlySales: 0,
        itemsSoldToday: 0,
        topItem: { id: "none", name: "None", quantity: 0 },
      });
      return;
    }

    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Filter sales by time periods
    const todaySales = salesData.filter(
      (sale) => new Date(sale.createdAt) >= todayStart
    );
    const weeklySales = salesData.filter(
      (sale) => new Date(sale.createdAt) >= weekStart
    );
    const monthlySales = salesData.filter(
      (sale) => new Date(sale.createdAt) >= monthStart
    );

    // Calculate totals
    const todayTotal = todaySales.reduce(
      (sum, sale) => sum + (sale.total || 0),
      0
    );
    const weeklyTotal = weeklySales.reduce(
      (sum, sale) => sum + (sale.total || 0),
      0
    );
    const monthlyTotal = monthlySales.reduce(
      (sum, sale) => sum + (sale.total || 0),
      0
    );

    // Calculate items sold today
    const itemsSoldToday = todaySales.reduce((sum, sale) => {
      return (
        sum +
        (sale.items || []).reduce(
          (itemSum, item) => itemSum + (item.quantity || 0),
          0
        )
      );
    }, 0);

    // Find most sold item today
    const itemMap = new Map();
    todaySales.forEach((sale) => {
      (sale.items || []).forEach((item) => {
        if (!item || !item.product) return;

        const productId =
          typeof item.product === "object" ? item.product._id : item.product;
        if (!productId) return;

        if (!itemMap.has(productId)) {
          const productName =
            typeof item.product === "object" && item.product.name
              ? item.product.name
              : `Product ID: ${productId.substring(0, 8)}...`;

          itemMap.set(productId, {
            id: productId,
            name: productName,
            quantity: 0,
          });
        }
        itemMap.get(productId).quantity += item.quantity || 0;
      });
    });

    let topItem = { id: "none", name: "None", quantity: 0 };
    if (itemMap.size > 0) {
      const sortedItems = [...itemMap.entries()].sort(
        (a, b) => b[1].quantity - a[1].quantity
      );
      const topItemEntry = sortedItems[0];
      topItem = topItemEntry[1];
    }

    setSalesStats({
      todaySales: todayTotal,
      weeklySales: weeklyTotal,
      monthlySales: monthlyTotal,
      itemsSoldToday,
      topItem,
    });
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        await fetchSales();
      } catch (error) {
        console.error("Error fetching sales data:", error);
        setError(error?.message || "Failed to load sales data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [fetchSales]);

  useEffect(() => {
    if (sales && Array.isArray(sales)) {
      calculateSalesStats(sales);
    }
  }, [sales, calculateSalesStats]);

  // Loading spinner component
  const LoadingSpinner = () => (
    <div className="flex justify-center items-center p-6">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      <span className="ml-2 text-gray-600">Loading data...</span>
    </div>
  );

  // Error display component
  const ErrorDisplay = ({ message }) => (
    <div className="p-4 text-center">
      <div className="text-red-500 mb-2">⚠️ Error loading data</div>
      <div className="text-sm text-gray-600">{message}</div>
      <button
        onClick={() => window.location.reload()}
        className="mt-3 px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
      >
        Retry
      </button>
    </div>
  );

  // Empty state component
  const EmptyState = ({ message }) => (
    <div className="p-4 text-center text-gray-500">
      <div>📭</div>
      <div>{message || "No data available"}</div>
    </div>
  );

  if (error) {
    return (
      <div className="bg-white p-4 mt-4 rounded shadow-md">
        <ErrorDisplay message={error} />
      </div>
    );
  }

  return (
    <div className="bg-white p-4 mt-4 rounded shadow-md">
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="flex flex-col md:flex-row gap-4">
          {/* Recent Transactions */}
          <div className="md:w-1/3">
            <h3 className="text-lg font-bold mb-2">Recent Transactions</h3>
            <div className="border rounded overflow-hidden">
              {sales && sales.length > 0 ? (
                <table className="min-w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Invoice</th>
                      <th className="px-4 py-2 text-left">Customer</th>
                      <th className="px-4 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.slice(0, 5).map((sale, index) => (
                      <tr
                        key={sale?._id || index}
                        className={
                          index % 2 ? "bg-gray-50 border-t" : "border-t"
                        }
                      >
                        <td className="px-4 py-2">
                          {sale?.invoiceNumber
                            ? sale.invoiceNumber.length > 11
                              ? `${sale.invoiceNumber.slice(0, 11)}...`
                              : sale.invoiceNumber
                            : "N/A"}
                        </td>
                        <td className="px-4 py-2">
                          {sale?.customer?.name || "Walk-in"}
                        </td>
                        <td className="px-4 py-2 text-right">
                          Rs. {(sale?.total || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <EmptyState message="No recent transactions" />
              )}
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="md:w-1/3">
            <h3 className="text-lg font-bold mb-2">Keyboard Shortcuts</h3>
            <div className="border rounded p-3 space-y-2">
              {[
                { action: "Search Products", key: "F1" },
                { action: "Navigate Items", key: "↑ / ↓" },
                { action: "Edit Quantity", key: "Enter" },
                { action: "Delete Item", key: "Delete" },
                { action: "Cancel/Close", key: "Esc" },
              ].map((shortcut) => (
                <div key={shortcut.action} className="flex justify-between">
                  <span>{shortcut.action}:</span>
                  <kbd className="px-2 py-1 bg-gray-200 rounded">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Sale Statistics */}
          <div className="md:w-1/3">
            <h3 className="text-lg font-bold mb-2">Sale Statistics</h3>
            <div className="border rounded p-3 space-y-2">
              <div className="flex justify-between">
                <span>Today's Sales:</span>
                <span className="font-medium">
                  Rs. {salesStats.todaySales.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Weekly Sales:</span>
                <span className="font-medium">
                  Rs. {salesStats.weeklySales.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Monthly Sales:</span>
                <span className="font-medium">
                  Rs. {salesStats.monthlySales.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Items Sold Today:</span>
                <span className="font-medium">{salesStats.itemsSoldToday}</span>
              </div>
              <div className="mt-3 pt-3 border-t">
                <div className="text-sm text-gray-600 mb-1">
                  Most Sold Item Today
                </div>
                <div className="font-medium">
                  {salesStats.topItem.name} - {salesStats.topItem.quantity}{" "}
                  units
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t flex justify-between">
        <div className="text-sm text-gray-500">
          © 2025 Retail Management System
        </div>
        <div className="text-sm">
          <a href="#help" className="text-blue-500 hover:underline">
            Help
          </a>{" "}
          |
          <a href="#settings" className="text-blue-500 hover:underline ml-2">
            Settings
          </a>{" "}
          |
          <a href="#report" className="text-blue-500 hover:underline ml-2">
            Report Issue
          </a>
        </div>
      </div>
    </div>
  );
};

export default SellingExtra;
