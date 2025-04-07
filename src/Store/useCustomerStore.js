import { create } from "zustand";
import axios from "axios";
import { useAuthStore } from "./stores";
const BaseUrl = "http://localhost:5000";

const useCustomerStore = create((set, get) => ({
  // State
  customers: [],
  customer: null,
  loading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    pages: 1,
    limit: 10,
  },

  // Get all customers with optional filtering and pagination
  getAllCustomers: async (params = {}) => {
    try {
      const token = useAuthStore.getState().token;

      set({ loading: true, error: null });

      const response = await axios.get(`${BaseUrl}/api/customer/`, {
        params,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      set({
        customers: response.data.data,
        pagination: response.data.pagination,
        loading: false,
      });

      return response.data;
    } catch (error) {
      set({
        loading: false,
        error: error.response?.data?.message || "Failed to fetch customers",
      });
      throw error;
    }
  },

  // Get customer by ID
  getCustomerById: async (id) => {
    try {
      set({ loading: true, error: null });
      const token = useAuthStore.getState().token;

      const response = await axios.get(
        `${BaseUrl}/api/customer/customers/${id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      set({
        customer: response.data.data,
        loading: false,
      });

      return response.data.data;
    } catch (error) {
      set({
        loading: false,
        error:
          error.response?.data?.message || "Failed to fetch customer details",
      });
      throw error;
    }
  },

  // Create a new customer
  createCustomer: async (customerData) => {
    try {
      const token = useAuthStore.getState().token;
      const storeId = useAuthStore.getState().currentStore?.id;
      customerData.storeId = storeId;
      set({ loading: true, error: null });

      const response = await axios.post(
        `${BaseUrl}/api/customer/customers`,
        customerData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update the customers list if we already have customers loaded
      if (get().customers.length > 0) {
        set((state) => ({
          customers: [response.data.data, ...state.customers],
        }));
      }

      set({ loading: false });
      return response.data.data;
    } catch (error) {
      set({
        loading: false,
        error: error.response?.data?.message || "Failed to create customer",
      });
      throw error;
    }
  },

  // Update customer
  updateCustomer: async (id, customerData) => {
    try {
      const token = useAuthStore.getState().token;
      const storeId = useAuthStore.getState().currentStore?.id;
      customerData.storeId = storeId;

      set({ loading: true, error: null });

      const response = await axios.put(
        `${BaseUrl}/api/customer/customers/${id}`,
        customerData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update the customer in the list if we already have customers loaded
      set((state) => ({
        customers: state.customers.map((c) =>
          c._id === id ? response.data.data : c
        ),
        customer:
          state.customer?._id === id ? response.data.data : state.customer,
        loading: false,
      }));

      return response.data.data;
    } catch (error) {
      set({
        loading: false,
        error: error.response?.data?.message || "Failed to update customer",
      });
      throw error;
    }
  },

  // Delete customer
  deleteCustomer: async (id) => {
    try {
      const token = useAuthStore.getState().token;

      set({ loading: true, error: null });

      await axios.delete(`${BaseUrl}/api/customer/customers/${id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      // Remove the customer from the list if we already have customers loaded
      set((state) => ({
        customers: state.customers.filter((c) => c._id !== id),
        customer: state.customer?._id === id ? null : state.customer,
        loading: false,
      }));

      return true;
    } catch (error) {
      set({
        loading: false,
        error: error.response?.data?.message || "Failed to delete customer",
      });
      throw error;
    }
  },

  // Get customers by store
  getCustomersByStore: async (storeId, params = {}) => {
    try {
      const token = useAuthStore.getState().token;

      set({ loading: true, error: null });

      const response = await axios.get(
        `${BaseUrl}/api/customer/stores/${storeId}/customers`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          params, // Moved params here
        }
      );

      set({
        customers: response.data.data,
        pagination: {
          total: response.data.total,
          page: parseInt(params.page) || 1,
          pages: Math.ceil(
            response.data.total / (parseInt(params.limit) || 10)
          ),
          limit: parseInt(params.limit) || 10,
        },
        loading: false,
      });

      return response.data;
    } catch (error) {
      set({
        loading: false,
        error:
          error.response?.data?.message || "Failed to fetch customers by store",
      });
      throw error;
    }
  },

  // Search customers
  searchCustomers: async (query, params = {}) => {
    try {
      const token = useAuthStore.getState().token;
      const storeId = useAuthStore.getState().currentStore?.id;

      set({ loading: true, error: null });

      const searchParams = {
        storeId,
        query,
        ...params,
      };

      const response = await axios.get(
        `${BaseUrl}/api/customer/customers/search`,
        {
          params: searchParams,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      set({
        customers: response.data.data,
        pagination: response.data.pagination,
        loading: false,
      });

      return response.data;
    } catch (error) {
      set({
        loading: false,
        error: error.response?.data?.message || "Failed to search customers",
      });
      throw error;
    }
  },

  // Upload prescription
  uploadPrescription: async (customerId, formData) => {
    try {
      const token = useAuthStore.getState().token;
      const storeId = useAuthStore.getState().currentStore?.id;
      formData.storeId = storeId;

      set({ loading: true, error: null });

      const response = await axios.post(
        `${BaseUrl}/api/customer/customers/${customerId}/prescriptions`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update customer data with new prescription
      set((state) => ({
        customer: response.data.data,
        customers: state.customers.map((c) =>
          c._id === customerId ? response.data.data : c
        ),
        loading: false,
      }));

      return response.data.data;
    } catch (error) {
      set({
        loading: false,
        error: error.response?.data?.message || "Failed to upload prescription",
      });
      throw error;
    }
  },

  // Delete prescription
  deletePrescription: async (customerId, prescriptionId) => {
    try {
      const token = useAuthStore.getState().token;

      set({ loading: true, error: null });

      await axios.delete(
        `${BaseUrl}/api/customer/customers/${customerId}/prescriptions/${prescriptionId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update customer data by removing the prescription
      set((state) => {
        // Only update if we have the current customer loaded
        if (state.customer && state.customer._id === customerId) {
          const updatedCustomer = {
            ...state.customer,
            prescriptions: state.customer.prescriptions.filter(
              (p) => p._id !== prescriptionId
            ),
          };

          return {
            customer: updatedCustomer,
            customers: state.customers.map((c) =>
              c._id === customerId ? updatedCustomer : c
            ),
            loading: false,
          };
        }

        return { loading: false };
      });

      return true;
    } catch (error) {
      set({
        loading: false,
        error: error.response?.data?.message || "Failed to delete prescription",
      });
      throw error;
    }
  },

  // Reset state
  resetCustomerState: () => {
    set({
      customers: [],
      customer: null,
      loading: false,
      error: null,
      pagination: {
        total: 0,
        page: 1,
        pages: 1,
        limit: 10,
      },
    });
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useCustomerStore;
