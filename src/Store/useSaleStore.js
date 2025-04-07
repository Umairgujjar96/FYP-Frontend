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
        statusData, // ✅ Send statusData as the request body (Fix)
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

  // Generate Sales Report
  generateSalesReport: async (reportParams = {}) => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().token;
      const storeId = useAuthStore.getState().currentStore?.id;

      const response = await axios.get(`${BaseUrl}/api/sales/reports/sales`, {
        params: reportParams,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      set({
        salesReport: response.data.data,
        loading: false,
      });
      return response.data.data;
    } catch (error) {
      set({
        error:
          error.response?.data?.message || "Failed to generate sales report",
        loading: false,
      });
      throw error;
    }
  },

  // Utility Methods
  resetCurrentSale: () => {
    set({ currentSale: null });
  },

  clearError: () => {
    set({ error: null });
  },
}));

export default useSaleStore;
