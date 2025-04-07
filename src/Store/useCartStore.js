import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useCartStore = create(
  persist(
    (set, get) => ({
      cartItems: [],
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
      customer: null,
      paymentMethod: "cash",

      // Set customer for the sale
      setCustomer: (customer) => {
        set({ customer });
      },

      // Set payment method
      setPaymentMethod: (method) => {
        set({ paymentMethod: method });
      },

      // Add product to cart, auto-selecting the nearest expiry batch
      addToCart: (product, quantity) => {
        const { cartItems } = get();

        // Find the batch with the nearest expiry date
        const selectedBatch = product.batches?.length
          ? product.batches.reduce((nearest, batch) =>
              new Date(batch.expiryDate) < new Date(nearest.expiryDate)
                ? batch
                : nearest
            )
          : null;

        if (!selectedBatch) {
          console.warn("No batch available for this product.");
          return;
        }

        const batchId = selectedBatch._id;
        const batchPrice = selectedBatch.sellingPrice;

        const existingItem = cartItems.find(
          (item) => item.product._id === product._id && item.batchId === batchId
        );

        if (existingItem) {
          // Update quantity if the same batch is already in cart
          const updatedItems = cartItems.map((item) =>
            item.product._id === product._id && item.batchId === batchId
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );

          set({ cartItems: updatedItems });
        } else {
          // Add new item with batch details
          set({
            cartItems: [
              ...cartItems,
              {
                product,
                quantity,
                discount: 0,
                batchId,
                unitPrice: batchPrice, // Get price from batch
              },
            ],
          });
        }

        get().updateTotals();
      },

      updateQuantity: (productId, batchId, quantity) => {
        const { cartItems } = get();
        const updatedItems = cartItems.map((item) =>
          item.product._id === productId && item.batchId === batchId
            ? { ...item, quantity }
            : item
        );

        set({ cartItems: updatedItems });
        get().updateTotals();
      },

      removeFromCart: (productId, batchId) => {
        // Add debugging to trace the input values
        console.log("Removing item:", { productId, batchId });

        const { cartItems } = get();

        // Debug current cart items to verify IDs
        console.log(
          "Current cart items:",
          cartItems.map((item) => ({
            productId: item.product._id,
            batchId: item.batchId,
          }))
        );

        // Convert values to strings for safer comparison
        const productIdStr = String(productId);
        const batchIdStr = String(batchId);

        // Filter items that don't match either productId or batchId
        const newCartItems = cartItems.filter((item) => {
          const itemProductId = String(item.product._id);
          const itemBatchId = String(item.batchId);

          // Keep the item in the array if it's NOT the one we want to remove
          return !(itemProductId === productIdStr);
        });

        console.log("After removal, items remaining:", newCartItems.length);

        set({ cartItems: newCartItems });
        get().updateTotals();
      },

      updateDiscount: (productId, batchId, discount) => {
        const { cartItems } = get();
        const updatedItems = cartItems.map((item) =>
          item.product._id === productId && item.batchId === batchId
            ? { ...item, discount }
            : item
        );

        set({ cartItems: updatedItems });
        get().updateTotals();
      },

      setGlobalDiscount: (discount) => {
        set({ discount });
        get().updateTotals();
      },

      // Update totals based on current cart state
      updateTotals: () => {
        const { cartItems, discount } = get();

        const subtotal = cartItems.reduce((total, item) => {
          const itemTotal = item.unitPrice * item.quantity;
          const itemDiscount = (itemTotal * (item.discount || 0)) / 100;
          return total + (itemTotal - itemDiscount);
        }, 0);

        const tax = subtotal * 0; // 7% tax
        const globalDiscount = (subtotal * discount) / 100;
        const total = subtotal + tax - globalDiscount;

        set({
          subtotal,
          tax,
          total,
        });
      },

      // Prepare sale data for submission
      prepareSaleData: () => {
        const {
          cartItems,
          subtotal,
          tax,
          discount,
          total,
          customer,
          paymentMethod,
        } = get();

        return {
          customer: customer?._id || null,
          items: cartItems.map((item) => ({
            product: item.product._id,
            batch: item.batchId, // ✅ Ensuring batch ID is sent
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            subtotal:
              item.unitPrice * item.quantity * (1 - item.discount / 100),
          })),
          subtotal,
          discount,
          tax,
          total,
          payment: {
            method: paymentMethod,
            status: "pending",
          },
        };
      },

      clearCart: () => {
        set({
          cartItems: [],
          customer: null,
          paymentMethod: "cash",
          subtotal: 0,
          tax: 0,
          discount: 0,
          total: 0,
        });
      },

      // Reset to initial state
      reset: () => {
        set({
          cartItems: [],
          subtotal: 0,
          tax: 0,
          discount: 0,
          total: 0,
          customer: null,
          paymentMethod: "cash",
        });
      },
    }),
    {
      name: "cart-storage", // unique name
      partialize: (state) => ({
        cartItems: state.cartItems,
        customer: state.customer,
        paymentMethod: state.paymentMethod,
      }),
    }
  )
);

export default useCartStore;
