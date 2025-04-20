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

      // Add this new function for restocking products
      restockProduct: async (productId, restockData) => {
        set({ isLoading: true, error: null });
        try {
          const token = useAuthStore.getState().token;
          const storeId = useAuthStore.getState().currentStore?.id;

          if (!storeId) throw new Error("No store selected");

          // Include store ID in the request if user is not owner
          if (useAuthStore.getState().user?.role !== "owner") {
            restockData.store = storeId;
          }

          const response = await fetch(
            `${BaseUrl}/api/product/products/${productId}/restock`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(restockData),
            }
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || "Failed to restock product");
          }

          // Update the product in the local state if it exists
          const updatedProducts = get().products.map((product) =>
            product._id === productId
              ? {
                  ...product,
                  totalStock: (product.totalStock || 0) + restockData.quantity,
                }
              : product
          );

          set({
            products: updatedProducts,
            isLoading: false,
          });

          return data;
        } catch (error) {
          console.error("Restock Error:", error);
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // Another useful function for fetching a single product
      fetchProductDetails: async (productId) => {
        set({ isLoading: true, error: null });
        try {
          const token = useAuthStore.getState().token;
          const storeId = useAuthStore.getState().currentStore?.id;

          if (!storeId) throw new Error("No store selected");

          const response = await fetch(`${BaseUrl}/api/product/${productId}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || "Failed to fetch product details");
          }

          set({ isLoading: false });
          return data.data;
        } catch (error) {
          console.error("Fetch Product Details Error:", error);
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // Function to fetch low stock products
      fetchLowStockProducts: async () => {
        set({ isLoading: true, error: null });
        try {
          const token = useAuthStore.getState().token;
          const storeId = useAuthStore.getState().currentStore?.id;

          if (!storeId) throw new Error("No store selected");

          const response = await fetch(`${BaseUrl}/api/product/low-stock`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(
              data.message || "Failed to fetch low stock products"
            );
          }

          set({ isLoading: false });
          return data.data;
        } catch (error) {
          console.error("Fetch Low Stock Products Error:", error);
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
