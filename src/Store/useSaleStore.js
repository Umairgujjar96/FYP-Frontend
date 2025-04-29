// Updated useSaleStore.js with enhanced reporting capabilities
import { create } from "zustand";
import axios from "axios";
import { useAuthStore } from "./stores";
const BaseUrl = "http://localhost:5000";

const useSaleStore = create((set, get) => ({
  // State
  sales: [],
  currentSale: null,
  salesReport: null,
  loading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    pages: 0,
    limit: 10,
  },

  // Fetch Sales
  fetchSales: async (filters = {}) => {
    set({ loading: true, error: null });

    try {
      const token = useAuthStore.getState().token;
      const storeId = useAuthStore.getState().currentStore?.id;

      // Validate store ID
      if (!storeId) {
        throw new Error("No store selected");
      }

      const response = await axios.get(`${BaseUrl}/api/sales/getall`, {
        params: {
          storeId, // Include storeId in the request parameters
          page: filters.page || 1,
          limit: filters.limit || 10,
          ...filters,
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      // Check if response contains expected data structure
      if (!response.data || !response.data.data) {
        throw new Error("Invalid response format from server");
      }

      set({
        sales: response.data.data,
        pagination: {
          total: response.data.pagination?.total || 0,
          page: response.data.pagination?.page || 1,
          pages: response.data.pagination?.pages || 0,
          limit: response.data.pagination?.limit || 10,
        },
        loading: false,
      });

      return response.data.data;
    } catch (error) {
      console.error("Error fetching sales:", error);

      set({
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch sales",
        loading: false,
        // Maintain previous sales data on error
        // This prevents UI from emptying on fetch failure
      });

      return []; // Return empty array instead of undefined
    }
  },

  // Fetch Sale by ID
  fetchSaleById: async (saleId) => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().token;

      const response = await axios.get(
        `${BaseUrl}/api/sales/getById/${saleId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      set({
        currentSale: response.data.data,
        loading: false,
      });
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to fetch sale details",
        loading: false,
      });
    }
  },

  // Create Sale
  createSale: async (saleData) => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().token;
      const storeId = useAuthStore.getState().currentStore?.id;

      if (!storeId) throw new Error("No store selected");

      const response = await axios.post(
        `${BaseUrl}/api/sales/create`,
        saleData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(response);
      set((state) => ({
        sales: [response.data.data, ...state.sales],
        currentSale: response.data.data,
        loading: false,
      }));
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to create sale",
        loading: false,
      });
      throw error;
    }
  },

  // Update Payment Status
  updatePaymentStatus: async (saleId, statusData) => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().token;

      const response = await axios.patch(
        `${BaseUrl}/api/sales/${saleId}/payment-status`,
        statusData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      set((state) => ({
        sales: state.sales.map((sale) =>
          sale._id === saleId ? response.data.data : sale
        ),
        currentSale: response.data.data,
        loading: false,
      }));

      return response.data.data;
    } catch (error) {
      set({
        error:
          error.response?.data?.message || "Failed to update payment status",
        loading: false,
      });
      throw error;
    }
  },

  // Cancel Sale
  cancelSale: async (saleId) => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().token;

      await axios.delete(`${BaseUrl}/api/sales/${saleId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      set((state) => ({
        sales: state.sales.filter((sale) => sale._id !== saleId),
        currentSale: null,
        loading: false,
      }));
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to cancel sale",
        loading: false,
      });
      throw error;
    }
  },

  // ENHANCED REPORTING METHODS

  // Generate Sales Report - Updated with your API structure
  fetchSalesReport: async (reportParams = {}) => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().token;
      const storeId =
        reportParams.storeId || useAuthStore.getState().currentStore?.id;

      // If no store ID provided and not admin, use current store
      if (!reportParams.storeId && !storeId) {
        throw new Error("No store selected for report generation");
      }

      const payload = {
        ...reportParams,
        storeId: storeId,
      };

      const response = await axios.post(
        `${BaseUrl}/api/sales/reports/generate`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        set({
          salesReport: response.data.report,
          loading: false,
        });
        return response.data.report;
      } else {
        throw new Error(response.data.message || "Failed to generate report");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to generate sales report";
      set({
        error: errorMessage,
        loading: false,
      });
      throw error;
    }
  },

  // Export Sales Report as CSV
  exportSalesReport: async (reportParams = {}) => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().token;
      const storeId =
        reportParams.storeId || useAuthStore.getState().currentStore?.id;

      // If no store ID provided and not admin, use current store
      if (!reportParams.storeId && !storeId) {
        throw new Error("No store selected for report export");
      }

      const payload = {
        ...reportParams,
        storeId: storeId,
        includeItemDetails: true, // Always include for exports
        format: reportParams.format || "csv",
      };

      const response = await axios.post(
        `${BaseUrl}/api/sales/reports/export`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob", // Important for file download
        }
      );

      // Create file download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");

      // Generate filename based on report type and date
      const reportType =
        payload.reportType.charAt(0).toUpperCase() +
        payload.reportType.slice(1);
      const date = new Date().toISOString().split("T")[0];
      const filename = `${reportType}_Sales_Report_${date}.csv`;

      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();

      set({ loading: false });
      return true;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to export sales report";
      set({
        error: errorMessage,
        loading: false,
      });
      throw error;
    }
  },

  // Utility Methods
  resetCurrentSale: () => {
    set({ currentSale: null });
  },

  clearReport: () => {
    set({ salesReport: null });
  },

  clearError: () => {
    set({ error: null });
  },
}));

export default useSaleStore;
