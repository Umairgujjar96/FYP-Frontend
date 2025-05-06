import { create } from "zustand";
import axios from "axios";
import { useAuthStore } from "./stores";
const BaseUrl = "http://localhost:5000";

const useCustomerStore = create((set, get) => ({
  // State
  customers: [],
  customer: null,
  loading: false,
  prescriptionData: null,
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

  downloadPrescription: async (customerId, prescriptionId) => {
    try {
      set({ loading: true, error: null });
      const token = useAuthStore.getState().token;

      // Make an API call to the backend to get the prescription file
      const response = await axios.get(
        `/customer/customers/${customerId}/prescriptions/${prescriptionId}/view`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob", // Treat the response as a binary Blob
        }
      );
      console.log(response.data);
      // Create a URL for the blob
      const blob = new Blob([response.data]);
      const objectUrl = window.URL.createObjectURL(blob);
      console.log(objectUrl);
      // Get the content type to determine how to display it
      const contentType = response.headers["content-type"] || "";

      const getFilenameFromHeader = (contentDisposition) => {
        if (!contentDisposition) return null;
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        return filenameMatch && filenameMatch[1] ? filenameMatch[1] : null;
      };

      // Store the prescription data in the store state
      set({
        loading: false,
        prescriptionData: {
          url: objectUrl,
          contentType: contentType,
          filename:
            getFilenameFromHeader(response.headers["content-disposition"]) ||
            "prescription",
          customerId: customerId,
          prescriptionId: prescriptionId,
        },
      });

      return objectUrl;
    } catch (error) {
      set({
        loading: false,
        error: error.response?.data?.message || "Failed to view prescription",
      });
      throw error;
    }
  },

  // Prepare prescription for viewing on a separate page
  getPrescriptionViewUrl: (customerId, prescriptionId) => {
    return `/prescriptions/view/${customerId}/${prescriptionId}`;
  },

  // Helper function to extract filename from content-disposition header

  // downloadPrescription: async (customerId, prescriptionId) => {
  //   try {
  //     set({ loading: true, error: null });
  //     const token = useAuthStore.getState().token;
  //     console.log("-------------------Calling---------------");
  //     // Make an API call to the backend to download the prescription
  //     const response = await axios.get(
  //       `/customer/customers/${customerId}/prescriptions/${prescriptionId}/download`,
  //       {
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization: `Bearer ${token}`,
  //         },
  //         responseType: "blob", // Ensures the response is treated as a binary Blob
  //       }
  //     );
  //     console.log("----------------------Called---------------");
  //     console.log(response);
  //     // Create a URL for the blob
  //     const blob = new Blob([response.data]);
  //     const url = window.URL.createObjectURL(blob);
  //     console.log(blob);
  //     console.log(url);
  //     // Create a temporary anchor element to trigger download
  //     const a = document.createElement("a");
  //     a.style.display = "none";
  //     a.href = url;

  //     // Get the filename from the content-disposition header, or use a default name
  //     const contentDisposition = response.headers["content-disposition"];
  //     let filename = "prescription.pdf";

  //     if (contentDisposition) {
  //       const filenameMatch = contentDisposition.match(/filename="(.+)"/);
  //       if (filenameMatch && filenameMatch[1]) {
  //         filename = filenameMatch[1];
  //       }
  //     }

  //     a.download = filename;
  //     document.body.appendChild(a);
  //     a.click();

  //     // Clean up
  //     window.URL.revokeObjectURL(url);
  //     document.body.removeChild(a);

  //     set({ loading: false });
  //     return true;
  //   } catch (error) {
  //     set({
  //       loading: false,
  //       error:
  //         error.response?.data?.message || "Failed to download prescription",
  //     });
  //     throw error;
  //   }
  // },

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
