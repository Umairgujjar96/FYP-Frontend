// src/stores/returnStore.js
import { create } from "zustand";
import axios from "axios";
import { useAuthStore } from "./stores";
const BaseUrl = "http://localhost:5000";

export const useReturnStore = create((set, get) => ({
  // State
  invoiceNumber: null,
  sale: null,
  returnItems: [],
  totalRefundAmount: 0,
  apiError: null,
  isLoading: false,

  // Actions
  searchInvoice: async (invoiceNumber) => {
    try {
      set({ isLoading: true, apiError: null });
      const token = useAuthStore.getState().token;
      const storeId = useAuthStore.getState().currentStore?.id;

      const url = storeId
        ? `${BaseUrl}/api/sales/sales/invoice/${invoiceNumber}?storeId=${storeId}`
        : `${BaseUrl}/api/sales/sales/invoice/${invoiceNumber}`;

      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        set({
          invoiceNumber,
          sale: response.data.data,
          returnItems: [],
          totalRefundAmount: 0,
          apiError: null,
          isLoading: false,
        });
        return response.data.data;
      } else {
        throw new Error(response.data.message || "Failed to fetch invoice");
      }
    } catch (error) {
      set({
        apiError: error.response?.data?.message || error.message,
        isLoading: false,
      });
      throw error;
    }
  },

  addReturnItem: (item) => {
    const { returnItems, sale } = get();

    // Find the original sale item to get correct pricing info
    const originalItem = sale.items.find(
      (saleItem) =>
        saleItem.product._id === item.productId &&
        saleItem.batch._id === item.batchId
    );

    if (!originalItem) return;

    // Calculate discount per unit as the backend does
    const discountPerUnit = originalItem.discount
      ? originalItem.discount / originalItem.quantity
      : 0;

    // Calculate effective unit price
    const effectiveUnitPrice = originalItem.unitPrice - discountPerUnit;

    // Check if item already exists
    const existingItemIndex = returnItems.findIndex(
      (i) => i.productId === item.productId && i.batchId === item.batchId
    );

    let newItems;
    if (existingItemIndex >= 0) {
      // Update existing item
      newItems = [...returnItems];
      newItems[existingItemIndex] = {
        ...newItems[existingItemIndex],
        quantity: Math.min(item.quantity, originalItem.remainingQuantity),
      };
    } else {
      // Add new item with proper price info from original sale
      const newItem = {
        productId: item.productId,
        batchId: item.batchId,
        name: originalItem.product.name,
        batchNumber: originalItem.batch.batchNumber || "N/A",
        quantity: Math.min(item.quantity, originalItem.remainingQuantity),
        unitPrice: originalItem.unitPrice,
        discountPerUnit: discountPerUnit,
        effectiveUnitPrice: effectiveUnitPrice,
        maxQuantity: originalItem.remainingQuantity,
      };

      newItems = [...returnItems, newItem];
    }

    set({
      returnItems: newItems,
      totalRefundAmount: calculateTotalRefund(newItems),
    });
  },

  removeReturnItem: (productId, batchId) => {
    const { returnItems } = get();
    const newItems = returnItems.filter(
      (item) => !(item.productId === productId && item.batchId === batchId)
    );

    set({
      returnItems: newItems,
      totalRefundAmount: calculateTotalRefund(newItems),
    });
  },

  updateReturnItem: (productId, batchId, quantity) => {
    const { returnItems, sale } = get();

    // Find the original sale item to get max quantity
    const originalItem = sale.items.find(
      (saleItem) =>
        saleItem.product._id === productId && saleItem.batch._id === batchId
    );

    if (!originalItem) return;

    // Ensure quantity doesn't exceed what's available to return
    const maxQuantity = originalItem.remainingQuantity;
    const validQuantity = Math.min(quantity, maxQuantity);

    const newItems = returnItems.map((item) => {
      if (item.productId === productId && item.batchId === batchId) {
        return {
          ...item,
          quantity: validQuantity,
        };
      }
      return item;
    });

    set({
      returnItems: newItems,
      totalRefundAmount: calculateTotalRefund(newItems),
    });
  },

  submitReturn: async (saleId, reason) => {
    try {
      set({ isLoading: true, apiError: null });
      const { returnItems } = get();
      const token = useAuthStore.getState().token;
      const storeId = useAuthStore.getState().currentStore?.id;

      if (returnItems.length === 0) {
        throw new Error("At least one item must be selected for return");
      }

      // Format items for API request to match backend expectations
      const formattedItems = returnItems.map((item) => ({
        productId: item.productId,
        batchId: item.batchId,
        quantity: item.quantity,
      }));

      const payload = {
        saleId: saleId,
        returnedItems: formattedItems,
        reason,
      };

      // Add storeId if available
      if (storeId) {
        payload.storeId = storeId;
      }

      const response = await axios.post(
        `${BaseUrl}/api/sales/sales/return`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        set({ isLoading: false });
        return response.data.data;
      } else {
        throw new Error(response.data.message || "Failed to process return");
      }
    } catch (error) {
      set({
        apiError: error.response?.data?.message || error.message,
        isLoading: false,
      });
      throw error;
    }
  },

  resetReturn: () => {
    set({
      invoiceNumber: null,
      sale: null,
      returnItems: [],
      totalRefundAmount: 0,
      apiError: null,
      isLoading: false,
    });
  },

  clearError: () => {
    set({ apiError: null });
  },
}));

// Helper function to calculate total refund amount
// Using the effective unit price that includes discounts
function calculateTotalRefund(items) {
  return items.reduce((total, item) => {
    const itemRefundAmount = item.effectiveUnitPrice * item.quantity;
    return total + itemRefundAmount;
  }, 0);
}
