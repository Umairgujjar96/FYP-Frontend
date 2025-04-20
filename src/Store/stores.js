import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
const BaseUrl = "http://localhost:5000/";

// Auth Store - handles user authentication
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      currentStore: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          // Replace with your actual API call
          const response = await fetch(`${BaseUrl}api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          const data = await response.json();

          if (!response.ok) throw new Error(data.message || "Login failed");
          set({
            user: data.user,
            currentStore: data.store,
            token: data.accessToken,
            isLoading: false,
          });
          return data;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          // Replace with your actual API call
          const response = await fetch(`${BaseUrl}api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
          });

          const data = await response.json();

          if (!response.ok)
            throw new Error(data.message || "Registration failed");

          set({ isLoading: false });
          return data;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true, error: null });
        try {
          const token = useAuthStore.getState().token;

          // Replace with your actual API call
          const response = await fetch(`${BaseUrl}api/auth/logout`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            // body: JSON.stringify(userData),
          });

          const data = await response.json();

          if (!response.ok)
            throw new Error(data.message || "Registration failed");
          set({ user: null, token: null });
          set({ isLoading: false });
          return data;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      updateProfile: async (userData) => {
        set({ isLoading: true, error: null });

        try {
          // Replace with your actual API call
          const response = await fetch(`${BaseUrl}api/auth/profile`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${get().token}`,
            },
            body: JSON.stringify(userData),
          });

          const data = await response.json();

          if (!response.ok)
            throw new Error(data.message || "Profile update failed");

          set({ user: { ...get().user, ...userData }, isLoading: false });
          return data;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Store Management Store
export const useStoreStore = create(
  persist(
    (set, get) => ({
      stores: [],
      currentStore: null,
      isLoading: false,
      error: null,

      fetchStores: async () => {
        set({ isLoading: true, error: null });
        try {
          const token = useAuthStore.getState().token;

          const response = await fetch(`${BaseUrl}api/store`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const logout = useAuthStore.getState().logout; // Access logout function

          const data = await response.json();
          console.log(data);
          if (data.message === "Token is invalid or expired") {
            logout();
          }
          if (!response.ok)
            throw new Error(data.message || "Failed to fetch stores");

          set({ stores: data, isLoading: false });

          // If there's no current store but stores exist, set the first one as current
          if (!get().currentStore && data.length > 0) {
            set({ currentStore: data[0] });
            console.log(data[0]);
          }
          // const thisStore = useStoreStore.getState().currentStore;
          // console.log(thisStore);
          return data;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      updateOperatingHours: async (storeId, operatingHoursData) => {
        set({ isLoading: true, error: null });
        try {
          const token = useAuthStore.getState().token;

          const response = await fetch(
            `/api/stores/${storeId}/operating-hours`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(operatingHoursData),
            }
          );

          const data = await response.json();

          if (!response.ok)
            throw new Error(data.message || "Failed to update operating hours");

          // Update the store in the stores array
          const updatedStores = get().stores.map((store) =>
            store._id === storeId
              ? { ...store, operatingHours: data.operatingHours }
              : store
          );

          // Update currentStore if it's the one being modified
          set({
            stores: updatedStores,
            currentStore:
              get().currentStore?._id === storeId
                ? { ...get().currentStore, operatingHours: data.operatingHours }
                : get().currentStore,
            isLoading: false,
          });

          return data;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      setCurrentStore: (storeId) => {
        const store = get().stores.find((s) => s._id === storeId);
        if (store) {
          set({ currentStore: store });
        }
      },

      createStore: async (storeData) => {
        set({ isLoading: true, error: null });
        try {
          const token = useAuthStore.getState().token;

          const response = await fetch("/api/stores", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(storeData),
          });

          const data = await response.json();

          if (!response.ok)
            throw new Error(data.message || "Failed to create store");

          set({
            stores: [...get().stores, data],
            currentStore: data,
            isLoading: false,
          });

          return data;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      updateStore: async (storeId, storeData) => {
        set({ isLoading: true, error: null });
        try {
          const token = useAuthStore.getState().token;
          const sh = useAuthStore.getState().token;

          const response = await fetch(`${BaseUrl}api/store/${storeId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(storeData),
          });

          const data = await response.json();

          if (!response.ok)
            throw new Error(data.message || "Failed to update store");

          const updatedStores = get().stores.map((store) =>
            store._id === storeId ? { ...store, ...data } : store
          );

          set({
            stores: updatedStores,
            currentStore:
              get().currentStore?._id === storeId
                ? { ...get().currentStore, ...data }
                : get().currentStore,
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
      name: "store-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

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
          const storeId = useStoreStore.getState().currentStore?._id;

          if (!storeId) throw new Error("No store selected");

          const response = await fetch(`/api/stores/${storeId}/products`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const data = await response.json();

          if (!response.ok)
            throw new Error(data.message || "Failed to fetch products");

          set({ products: data, isLoading: false });
          return data;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      fetchCategories: async () => {
        set({ isLoading: true, error: null });
        try {
          const token = useAuthStore.getState().token;
          const storeId = useStoreStore.getState().currentStore?._id;

          if (!storeId) throw new Error("No store selected");

          const response = await fetch(`/api/stores/${storeId}/categories`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const data = await response.json();

          if (!response.ok)
            throw new Error(data.message || "Failed to fetch categories");

          set({ categories: data, isLoading: false });
          return data;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      createProduct: async (productData) => {
        set({ isLoading: true, error: null });
        try {
          const token = useAuthStore.getState().token;
          const storeId = useStoreStore.getState().currentStore?._id;

          if (!storeId) throw new Error("No store selected");

          productData.store = storeId;

          const response = await fetch(`/api/products`, {
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

      createCategory: async (categoryData) => {
        set({ isLoading: true, error: null });
        try {
          const token = useAuthStore.getState().token;
          const storeId = useStoreStore.getState().currentStore?._id;

          if (!storeId) throw new Error("No store selected");

          categoryData.store = storeId;

          const response = await fetch(`/api/categories`, {
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
      name: "product-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Inventory/Batch Store
export const useInventoryStore = create(
  persist(
    (set, get) => ({
      batches: [],
      isLoading: false,
      error: null,

      fetchBatches: async (productId = null) => {
        set({ isLoading: true, error: null });
        try {
          const token = useAuthStore.getState().token;
          const storeId = useStoreStore.getState().currentStore?._id;

          if (!storeId) throw new Error("No store selected");

          let url = `/api/stores/${storeId}/batches`;
          if (productId) url += `?product=${productId}`;

          const response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const data = await response.json();
          console.log(data);
          if (!response.ok)
            throw new Error(data.message || "Failed to fetch batches");

          set({ batches: data, isLoading: false });
          return data;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      addBatch: async (batchData) => {
        set({ isLoading: true, error: null });
        try {
          const token = useAuthStore.getState().token;
          const storeId = useStoreStore.getState().currentStore?._id;

          if (!storeId) throw new Error("No store selected");

          batchData.store = storeId;

          const response = await fetch(`/api/batches`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(batchData),
          });

          const data = await response.json();

          if (!response.ok)
            throw new Error(data.message || "Failed to add batch");

          set({
            batches: [...get().batches, data],
            isLoading: false,
          });

          return data;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      updateBatchStock: async (batchId, newStock) => {
        set({ isLoading: true, error: null });
        try {
          const token = useAuthStore.getState().token;

          const response = await fetch(`/api/batches/${batchId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ currentStock: newStock }),
          });

          const data = await response.json();

          if (!response.ok)
            throw new Error(data.message || "Failed to update batch stock");

          const updatedBatches = get().batches.map((batch) =>
            batch._id === batchId ? { ...batch, currentStock: newStock } : batch
          );

          set({ batches: updatedBatches, isLoading: false });
          return data;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },
    }),
    {
      name: "inventory-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Customer Store
export const useCustomerStore = create(
  persist(
    (set, get) => ({
      customers: [],
      isLoading: false,
      error: null,

      fetchCustomers: async () => {
        set({ isLoading: true, error: null });
        try {
          const token = useAuthStore.getState().token;
          const storeId = useStoreStore.getState().currentStore?._id;

          if (!storeId) throw new Error("No store selected");

          const response = await fetch(`/api/stores/${storeId}/customers`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const data = await response.json();

          if (!response.ok)
            throw new Error(data.message || "Failed to fetch customers");

          set({ customers: data, isLoading: false });
          return data;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      addCustomer: async (customerData) => {
        set({ isLoading: true, error: null });
        try {
          const token = useAuthStore.getState().token;
          const storeId = useStoreStore.getState().currentStore?._id;

          if (!storeId) throw new Error("No store selected");

          customerData.store = storeId;

          const response = await fetch(`/api/customers`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(customerData),
          });

          const data = await response.json();

          if (!response.ok)
            throw new Error(data.message || "Failed to add customer");

          set({
            customers: [...get().customers, data],
            isLoading: false,
          });

          return data;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      addPrescription: async (customerId, prescriptionData) => {
        set({ isLoading: true, error: null });
        try {
          const token = useAuthStore.getState().token;

          const formData = new FormData();
          formData.append("file", prescriptionData.file);
          if (prescriptionData.expiryDate) {
            formData.append("expiryDate", prescriptionData.expiryDate);
          }

          const response = await fetch(
            `/api/customers/${customerId}/prescriptions`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: formData,
            }
          );

          const data = await response.json();

          if (!response.ok)
            throw new Error(data.message || "Failed to add prescription");

          const updatedCustomers = get().customers.map((customer) =>
            customer._id === customerId
              ? {
                  ...customer,
                  prescriptions: [...(customer.prescriptions || []), data],
                }
              : customer
          );

          set({ customers: updatedCustomers, isLoading: false });
          return data;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },
    }),
    {
      name: "customer-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Sales/Transaction Store
export const useSalesStore = create(
  persist(
    (set, get) => ({
      sales: [],
      cart: [],
      isLoading: false,
      error: null,

      fetchSales: async (startDate = null, endDate = null) => {
        set({ isLoading: true, error: null });
        try {
          const token = useAuthStore.getState().token;
          const storeId = useStoreStore.getState().currentStore?._id;

          if (!storeId) throw new Error("No store selected");

          let url = `/api/stores/${storeId}/sales`;

          if (startDate && endDate) {
            url += `?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
          }

          const response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const data = await response.json();

          if (!response.ok)
            throw new Error(data.message || "Failed to fetch sales");

          set({ sales: data, isLoading: false });
          return data;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // Cart operations
      addToCart: (product, batch, quantity = 1) => {
        const cart = [...get().cart];
        const existingItemIndex = cart.findIndex(
          (item) =>
            item.product._id === product._id && item.batch._id === batch._id
        );

        if (existingItemIndex >= 0) {
          // Update existing item
          cart[existingItemIndex].quantity += quantity;
          cart[existingItemIndex].subtotal =
            cart[existingItemIndex].quantity *
            cart[existingItemIndex].unitPrice;
        } else {
          // Add new item
          cart.push({
            product,
            batch,
            quantity,
            unitPrice: batch.sellingPrice,
            discount: 0,
            subtotal: batch.sellingPrice * quantity,
          });
        }

        set({ cart });
      },

      updateCartItem: (index, quantity) => {
        const cart = [...get().cart];
        if (cart[index]) {
          cart[index].quantity = quantity;
          cart[index].subtotal = cart[index].quantity * cart[index].unitPrice;
          set({ cart });
        }
      },

      removeFromCart: (index) => {
        const cart = [...get().cart];
        cart.splice(index, 1);
        set({ cart });
      },

      setItemDiscount: (index, discount) => {
        const cart = [...get().cart];
        if (cart[index]) {
          cart[index].discount = discount;
          cart[index].subtotal =
            cart[index].quantity * cart[index].unitPrice - discount;
          set({ cart });
        }
      },

      clearCart: () => {
        set({ cart: [] });
      },

      // Complete sale
      completeSale: async (saleData) => {
        set({ isLoading: true, error: null });
        try {
          const token = useAuthStore.getState().token;
          const storeId = useStoreStore.getState().currentStore?._id;
          const cart = get().cart;

          if (!storeId) throw new Error("No store selected");
          if (cart.length === 0) throw new Error("Cart is empty");

          // Prepare sale data
          const sale = {
            store: storeId,
            customer: saleData.customer,
            items: cart.map((item) => ({
              product: item.product._id,
              batch: item.batch._id,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              subtotal: item.subtotal,
            })),
            subtotal: cart.reduce((sum, item) => sum + item.subtotal, 0),
            discount: saleData.discount || 0,
            tax: saleData.tax || 0,
            total: saleData.total,
            payment: {
              method: saleData.paymentMethod,
              transactionId: saleData.transactionId,
            },
            staffMember: useAuthStore.getState().user._id,
          };

          const response = await fetch(`/api/sales`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(sale),
          });

          const data = await response.json();

          if (!response.ok)
            throw new Error(data.message || "Failed to complete sale");

          // Update sales list
          set({
            sales: [data, ...get().sales],
            cart: [], // Clear cart after successful sale
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
      name: "sales-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Subscription Store
export const useSubscriptionStore = create(
  persist(
    (set, get) => ({
      plans: [],
      isLoading: false,
      error: null,

      fetchPlans: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch("/api/subscription-plans");
          const data = await response.json();

          if (!response.ok)
            throw new Error(
              data.message || "Failed to fetch subscription plans"
            );

          set({ plans: data, isLoading: false });
          return data;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      subscribeToPlan: async (planId, paymentDetails) => {
        set({ isLoading: true, error: null });
        try {
          const token = useAuthStore.getState().token;

          const response = await fetch("/api/subscriptions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              plan: planId,
              ...paymentDetails,
            }),
          });

          const data = await response.json();

          if (!response.ok)
            throw new Error(data.message || "Failed to subscribe to plan");

          // Update user data in auth store with new subscription details
          const currentUser = useAuthStore.getState().user;
          useAuthStore.setState({
            user: {
              ...currentUser,
              subscription: data.subscription,
            },
          });

          set({ isLoading: false });
          return data;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },
    }),
    {
      name: "subscription-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
