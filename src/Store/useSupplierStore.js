import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./stores";
const BaseUrl = "http://localhost:5000";

// import { useAuthStore } from "./authStore";
// import { useAuthStore } from "./storeStore";

export const useSupplierStore = create(
  persist(
    (set, get) => ({
      suppliers: [],
      isLoading: false,
      error: null,
      pagination: {
        total: 0,
        page: 1,
        pages: 1,
        limit: 10,
      },
      filters: {
        isActive: true,
        name: "",
        city: "",
        store: null,
      },

      // Set filters
      setFilters: (filters) => {
        set((state) => ({
          filters: { ...state.filters, ...filters },
          pagination: { ...state.pagination, page: 1 }, // Reset to page 1 when filters change
        }));
      },

      // Set pagination
      setPagination: (pagination) => {
        set((state) => ({
          pagination: { ...state.pagination, ...pagination },
        }));
      },

      // Fetch suppliers
      fetchSuppliers: async () => {
        set({ isLoading: true, error: null });
        try {
          const token = useAuthStore.getState().token;
          const storeId = useAuthStore.getState().currentStore?.id;
          const { filters, pagination } = get();

          if (!storeId) throw new Error("No store selected");

          // Build query parameters
          const queryParams = new URLSearchParams({
            page: pagination.page,
            limit: pagination.limit,
            isActive: filters.isActive,
            store: storeId,
          });

          if (filters.name) queryParams.append("name", filters.name);
          if (filters.city) queryParams.append("city", filters.city);

          const response = await fetch(
            `${BaseUrl}/api/supplier?${queryParams}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          const result = await response.json();

          if (!response.ok)
            throw new Error(result.message || "Failed to fetch suppliers");

          set({
            suppliers: result.data,
            pagination: result.pagination,
            isLoading: false,
          });

          return result;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // Get a single supplier
      getSupplier: async (id) => {
        try {
          const token = useAuthStore.getState().token;

          const response = await fetch(`/api/suppliers/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const result = await response.json();

          if (!response.ok)
            throw new Error(result.message || "Failed to get supplier details");

          return result.data;
        } catch (error) {
          throw new Error(error.message || "Failed to get supplier details");
        }
      },

      // Create supplier
      createSupplier: async (supplierData) => {
        set({ isLoading: true, error: null });
        try {
          const token = useAuthStore.getState().token;
          const store = useAuthStore.getState().currentStore.id;
          supplierData.store = store;
          const response = await fetch(`${BaseUrl}/api/supplier`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(supplierData),
          });

          const result = await response.json();

          if (!response.ok)
            throw new Error(result.message || "Failed to create supplier");

          await get().fetchSuppliers();
          set({ isLoading: false });

          return result.data;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // Update supplier
      updateSupplier: async (id, supplierData) => {
        set({ isLoading: true, error: null });
        try {
          const token = useAuthStore.getState().token;

          const response = await fetch(`${BaseUrl}/api/supplier/${id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(supplierData),
          });

          const result = await response.json();

          if (!response.ok)
            throw new Error(result.message || "Failed to update supplier");

          await get().fetchSuppliers();
          set({ isLoading: false });

          return result.data;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // Delete supplier
      deleteSupplier: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const token = useAuthStore.getState().token;

          const response = await fetch(`${BaseUrl}/api/supplier/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });

          const result = await response.json();

          if (!response.ok)
            throw new Error(result.message || "Failed to delete supplier");

          await get().fetchSuppliers();
          set({ isLoading: false });

          return true;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // Reset store state
      reset: () => {
        set({
          suppliers: [],
          isLoading: false,
          error: null,
          pagination: {
            total: 0,
            page: 1,
            pages: 1,
            limit: 10,
          },
          filters: {
            isActive: true,
            name: "",
            city: "",
            store: null,
          },
        });
      },
    }),
    {
      name: "supplier-store", // Storage key
      getStorage: () => localStorage, // Use localStorage
    }
  )
);
