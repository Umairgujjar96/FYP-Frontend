import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useAuthStore } from "./stores";
import axios from "axios";
const BaseUrl = "http://localhost:5000";
// Product Store
export const useProductStore = create(
  persist(
    (set, get) => ({
      products: [],
      categories: [],
      isLoading: false,
      error: null,

      fetchProducts: async () => {
        set({ isLoading: true, error: null });

        try {
          const token = useAuthStore.getState().token;
          const storeId = useAuthStore.getState().currentStore?.id;

          if (!storeId) throw new Error("No store selected");

          const response = await axios.get(`${BaseUrl}/api/product/create`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          const data = response.data.data; // Axios auto-resolves .data

          set({ products: data, isLoading: false }); // Update state correctly
          return data;
        } catch (error) {
          console.error(error);
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },
      fetchCategories: async () => {
        set({ isLoading: true, error: null });

        try {
          const token = useAuthStore.getState().token;
          const storeId = useAuthStore.getState().currentStore?.id; // Ensure correct ID

          if (!storeId) throw new Error("No store selected");

          const response = await axios.get(
            `${BaseUrl}/api/category/stores/${storeId}/categories`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          const data = Array.isArray(response.data.data)
            ? response.data.data
            : []; // Ensure it's an array

          set((state) => ({
            ...state,
            categories: [...data], // Ensure the entire array is set
            isLoading: false,
          }));

          return data;
        } catch (error) {
          console.error("Fetch Categories Error:", error);
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      createProduct: async (productData) => {
        set({ isLoading: true, error: null });
        try {
          const token = useAuthStore.getState().token;
          const storeId = useAuthStore.getState().currentStore?.id;

          if (!storeId) throw new Error("No store selected");

          productData.store = storeId;

          const response = await fetch(`${BaseUrl}/api/product`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(productData),
          });

          const data = await response.json();

          if (!response.ok)
            throw new Error(data.message || "Failed to create product");

          set({
            products: [...get().products, data],
            isLoading: false,
          });

          return data;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },
      deleteProduct: async (Id) => {
        set({ isLoading: true, error: null });
        try {
          const token = useAuthStore.getState().token;
          const storeId = useAuthStore.getState().currentStore?.id;

          const response = await fetch(`${BaseUrl}/api/product/${Id}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      createCategory: async (categoryData) => {
        set({ isLoading: true, error: null });
        try {
          const token = useAuthStore.getState().token;
          const storeId = useAuthStore.getState().currentStore?.id;
          if (!storeId) throw new Error("No store selected");

          categoryData.store = storeId;

          const response = await fetch(`${BaseUrl}/api/category/categories`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(categoryData),
          });

          const data = await response.json();

          if (!response.ok)
            throw new Error(data.message || "Failed to create category");

          set({
            categories: [...get().categories, data],
            isLoading: false,
          });

          return data;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },
    }),
    {
      name: "category-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
