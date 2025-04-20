import React, { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid"; // For generating unique IDs
import useCartStore from "../Store/useCartStore";

const SellingTotal = () => {
  const {
    subtotal,
    tax,
    discount,
    total,
    setGlobalDiscount,
    clearCart,
    cartItems,
    addToCart,
    updateQuantity,
    reset,
    removeFromCart,
  } = useCartStore();

  const [discountInput, setDiscountInput] = useState("0");
  const [adjustmentInput, setAdjustmentInput] = useState("0");
  const [taxInput, setTaxInput] = useState("7"); // Default tax rate matching the store's 7%
  const [adjustment, setAdjustment] = useState(0);
  const [activeInput, setActiveInput] = useState(null);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [heldOrders, setHeldOrders] = useState([]);
  const [showHeldOrders, setShowHeldOrders] = useState(false);

  const discountInputRef = useRef(null);
  const adjustmentInputRef = useRef(null);
  const taxInputRef = useRef(null);
  const completeButtonRef = useRef(null);

  // Calculate final total with adjustment
  const finalTotal = total + adjustment;

  // Load held orders from localStorage on component mount
  useEffect(() => {
    try {
      const savedOrders = localStorage.getItem("heldOrders");
      if (savedOrders) {
        setHeldOrders(JSON.parse(savedOrders));
      }
    } catch (error) {
      console.error("Failed to load held orders from localStorage:", error);
    }
  }, []);

  // Initialize discount input with the current discount value
  useEffect(() => {
    setDiscountInput(discount.toString());
  }, [discount]);

  const handleDiscountChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setDiscountInput(value);
  };

  const handleAdjustmentChange = (e) => {
    const value = e.target.value.replace(/[^0-9.-]/g, "");
    setAdjustmentInput(value);
  };

  const handleTaxChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    setTaxInput(value);
  };

  const applyDiscount = () => {
    const discountValue = parseInt(discountInput, 10) || 0;
    setGlobalDiscount(Math.min(discountValue, 100)); // Cap at 100%
    setActiveInput(null);
  };

  const applyAdjustment = () => {
    const adjustmentValue = parseFloat(adjustmentInput) || 0;
    setAdjustment(adjustmentValue);
    setActiveInput(null);
  };

  // Note: We don't have setTax in the store, so this will just update the UI value
  const applyTax = () => {
    const taxValue = parseFloat(taxInput) || 0;
    setTaxInput(Math.min(taxValue, 100).toString()); // Cap at 100%
    setActiveInput(null);
  };

  const completeSale = () => {
    // Check if cart is empty
    if (!cartItems || cartItems.length === 0) {
      alert("Cannot complete a sale with an empty cart");
      return;
    }

    // Implement the sale completion logic here
    alert(`Sale completed: $${finalTotal.toFixed(2)}`);
    // After successful completion, clear cart
    clearCart();
    setAdjustment(0);
    setAdjustmentInput("0");
    setDiscountInput("0");
  };

  const holdOrder = () => {
    // Check if cart is empty
    if (!cartItems || cartItems.length === 0) {
      alert("Cannot hold an empty order");
      return;
    }

    // Generate a unique reference ID for the held order
    const referenceId = uuidv4().substring(0, 8).toUpperCase();

    // Create the held order object
    const heldOrder = {
      id: referenceId,
      timestamp: new Date(),
      cartItems: JSON.parse(JSON.stringify(cartItems)), // Deep clone to avoid reference issues
      subtotal,
      tax,
      taxRate: parseFloat(taxInput) || 7, // Default to 7% if not specified
      discount,
      adjustment,
      total: finalTotal,
      createdAt: new Date().toISOString(),
    };

    // Add to held orders list
    const updatedHeldOrders = [...heldOrders, heldOrder];
    setHeldOrders(updatedHeldOrders);

    // Save to localStorage for persistence across sessions
    try {
      localStorage.setItem("heldOrders", JSON.stringify(updatedHeldOrders));
    } catch (error) {
      console.error("Failed to save held order to localStorage:", error);
    }

    // Clear the current cart
    clearCart();
    setAdjustment(0);
    setAdjustmentInput("0");
    setDiscountInput("0");

    // Show success message
    alert(
      `Order #${referenceId} has been placed on hold.\nYou can recall it from the "Held Orders" menu.`
    );
  };

  const recallHeldOrder = (order) => {
    if (
      window.confirm(
        `Recall held order #${order.id}? Any current items in cart will be discarded.`
      )
    ) {
      // First clear the current cart
      reset(); // Using reset instead of clearCart to ensure complete reset

      // Set global discount
      setGlobalDiscount(order.discount || 0);
      setDiscountInput((order.discount || 0).toString());

      // Set adjustment
      setAdjustment(order.adjustment || 0);
      setAdjustmentInput((order.adjustment || 0).toString());

      // Set tax input
      setTaxInput((order.taxRate || 7).toString());

      // Add each item to cart
      order.cartItems.forEach((item) => {
        if (item.product) {
          try {
            // If we're dealing with an item that has batches defined already
            if (item.product.batches && item.product.batches.length > 0) {
              // Find the correct batch if batchId is available
              if (item.batchId) {
                // Set the selected batch as the first in the batches array
                // This ensures addToCart will use this batch
                const batchIndex = item.product.batches.findIndex(
                  (batch) => batch._id === item.batchId
                );

                if (batchIndex !== -1) {
                  // Move the selected batch to be first in the array
                  const selectedBatch = item.product.batches[batchIndex];
                  const newBatches = [
                    selectedBatch,
                    ...item.product.batches.filter(
                      (b) => b._id !== item.batchId
                    ),
                  ];
                  item.product.batches = newBatches;
                }
              }

              // Add to cart using the product with batches
              addToCart(item.product, item.quantity || 1);
            }
            // If we need to reconstruct the batch structure
            else if (item.batchId && item.unitPrice) {
              const productWithBatch = {
                ...item.product,
                batches: [
                  {
                    _id: item.batchId,
                    sellingPrice: item.unitPrice,
                    expiryDate: new Date().toISOString(),
                  },
                ],
              };

              addToCart(productWithBatch, item.quantity || 1);
            }
            // Fallback for any other structure
            else {
              console.warn(
                "Incomplete batch information for recalled item:",
                item
              );
            }
          } catch (error) {
            console.error("Error adding item to cart:", error, item);
          }
        }
      });

      // Remove the order from held orders
      const updatedHeldOrders = heldOrders.filter((o) => o.id !== order.id);
      setHeldOrders(updatedHeldOrders);
      localStorage.setItem("heldOrders", JSON.stringify(updatedHeldOrders));

      // Close the held orders modal/list
      setShowHeldOrders(false);
    }
  };

  const deleteHeldOrder = (orderId) => {
    if (
      window.confirm(`Delete held order #${orderId}? This cannot be undone.`)
    ) {
      const updatedHeldOrders = heldOrders.filter((o) => o.id !== orderId);
      setHeldOrders(updatedHeldOrders);
      localStorage.setItem("heldOrders", JSON.stringify(updatedHeldOrders));
    }
  };

  const cancelOrder = () => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      clearCart();
      setAdjustment(0);
      setAdjustmentInput("0");
      setDiscountInput("0");
    }
  };

  // Focus event handlers
  const handleDiscountFocus = () => {
    setActiveInput("discount");
  };

  const handleAdjustmentFocus = () => {
    setActiveInput("adjustment");
  };

  const handleTaxFocus = () => {
    setActiveInput("tax");
  };

  // Fix for Enter key not applying input
  const handleInputKeyDown = (e, inputType) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (inputType === "discount") {
        applyDiscount();
      } else if (inputType === "adjustment") {
        applyAdjustment();
      } else if (inputType === "tax") {
        applyTax();
      }
      setActiveInput(null);
    }
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't handle global shortcuts if we're in an input field
      // except for Enter and Escape which we handle directly on the inputs
      if (activeInput && e.key !== "Escape") {
        return;
      }

      // Ctrl+D for discount
      if (e.ctrlKey && e.key === "d") {
        e.preventDefault();
        discountInputRef.current?.focus();
        setActiveInput("discount");
      }
      // Ctrl+A for adjustment
      else if (e.ctrlKey && e.key === "a") {
        e.preventDefault();
        adjustmentInputRef.current?.focus();
        setActiveInput("adjustment");
      }
      // Ctrl+T for tax
      else if (e.ctrlKey && e.key === "t") {
        e.preventDefault();
        taxInputRef.current?.focus();
        setActiveInput("tax");
      }
      // Ctrl+P to complete sale
      else if (e.ctrlKey && e.key === "p") {
        e.preventDefault();
        completeSale();
      }
      // Ctrl+H to hold order
      else if (e.ctrlKey && e.key === "h") {
        e.preventDefault();
        holdOrder();
      }
      // Ctrl+X to cancel order
      else if (e.ctrlKey && e.key === "x") {
        e.preventDefault();
        cancelOrder();
      }
      // Ctrl+K to toggle keyboard shortcuts help
      else if (e.ctrlKey && e.key === "k") {
        e.preventDefault();
        setShowKeyboardShortcuts((prev) => !prev);
      }
      // Escape to cancel input
      else if (e.key === "Escape") {
        setActiveInput(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeInput]);

  return (
    <div className="md:w-1/4 bg-white rounded shadow-md">
      <h2 className="text-xl font-bold text-center mb-4 p-2 bg-blue-600 text-white rounded-t flex justify-between items-center">
        <span>Order Summary</span>
        <button
          onClick={() => setShowKeyboardShortcuts((prev) => !prev)}
          className="text-xs bg-blue-700 px-2 py-1 rounded hover:bg-blue-800"
          title="Toggle Keyboard Shortcuts (Ctrl+K)"
        >
          ⌨️ Shortcuts
        </button>
      </h2>

      {showKeyboardShortcuts && (
        <div className="bg-blue-50 p-3 text-sm border-b">
          <h3 className="font-bold mb-1">Keyboard Shortcuts:</h3>
          <ul className="grid grid-cols-2 gap-1">
            <li>
              <kbd className="bg-gray-200 px-1 rounded">Ctrl+D</kbd> Discount
            </li>
            <li>
              <kbd className="bg-gray-200 px-1 rounded">Ctrl+A</kbd> Adjustment
            </li>
            <li>
              <kbd className="bg-gray-200 px-1 rounded">Ctrl+T</kbd> Tax
            </li>
            <li>
              <kbd className="bg-gray-200 px-1 rounded">Ctrl+P</kbd> Complete
              Sale
            </li>
            <li>
              <kbd className="bg-gray-200 px-1 rounded">Ctrl+H</kbd> Hold Order
            </li>
            <li>
              <kbd className="bg-gray-200 px-1 rounded">Ctrl+X</kbd> Cancel
              Order
            </li>
            <li>
              <kbd className="bg-gray-200 px-1 rounded">Enter</kbd> Apply
              Current Input
            </li>
            <li>
              <kbd className="bg-gray-200 px-1 rounded">Esc</kbd> Cancel Input
            </li>
          </ul>
        </div>
      )}

      <div className="p-4">
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="font-medium">Subtotal:</span>
            <span>Rs. {subtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between">
            <span className="font-medium">Tax amount:</span>
            <span>Rs. {tax.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between relative">
            <span className="font-medium">
              Discount:
              <kbd className="ml-1 text-xs bg-gray-100 px-1 rounded text-gray-600">
                Ctrl+D
              </kbd>
            </span>
            <div className="flex items-center">
              <input
                type="text"
                value={discountInput}
                onChange={handleDiscountChange}
                onFocus={handleDiscountFocus}
                onKeyDown={(e) => handleInputKeyDown(e, "discount")}
                ref={discountInputRef}
                className={`w-16 p-1 border rounded text-right mr-1 ${
                  activeInput === "discount" ? "ring-2 ring-blue-500" : ""
                }`}
                aria-label="Discount percentage"
              />
              <span className="mr-2">%</span>
              <button
                onClick={applyDiscount}
                className="bg-blue-500 text-white text-xs px-2 py-1 rounded hover:bg-blue-600"
              >
                Apply
              </button>
            </div>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-red-500">
              <span>Discount amount:</span>
              <span>-Rs. {((subtotal * discount) / 100).toFixed(2)}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="font-medium">
              Adjustment:
              <kbd className="ml-1 text-xs bg-gray-100 px-1 rounded text-gray-600">
                Ctrl+A
              </kbd>
            </span>
            <div className="flex items-center">
              <span className="mr-1">$</span>
              <input
                type="text"
                value={adjustmentInput}
                onChange={handleAdjustmentChange}
                onFocus={handleAdjustmentFocus}
                onKeyDown={(e) => handleInputKeyDown(e, "adjustment")}
                ref={adjustmentInputRef}
                className={`w-16 p-1 border rounded text-right mr-1 ${
                  activeInput === "adjustment" ? "ring-2 ring-blue-500" : ""
                }`}
                aria-label="Adjustment amount"
              />
              <button
                onClick={applyAdjustment}
                className="bg-blue-500 text-white text-xs px-2 py-1 rounded hover:bg-blue-600"
              >
                Apply
              </button>
            </div>
          </div>

          {adjustment !== 0 && (
            <div
              className={`flex justify-between ${
                adjustment < 0 ? "text-red-500" : "text-green-500"
              }`}
            >
              <span>Adjustment amount:</span>
              <span>
                {adjustment < 0 ? "-" : "+"}${Math.abs(adjustment).toFixed(2)}
              </span>
            </div>
          )}

          <div className="border-t pt-4 flex justify-between font-bold text-lg">
            <span>Total:</span>
            <span>Rs. {finalTotal.toFixed(2)}</span>
          </div>

          <button
            onClick={completeSale}
            ref={completeButtonRef}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-md font-medium mt-4 flex items-center justify-center"
          >
            Complete Sale
            <kbd className="ml-2 text-xs bg-green-700 px-1 rounded">Ctrl+P</kbd>
          </button>

          <div className="flex justify-between mt-4">
            <div className="flex space-x-2">
              <button
                onClick={holdOrder}
                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded flex items-center"
              >
                Hold Order
                <kbd className="ml-1 text-xs bg-gray-300 px-1 rounded">
                  Ctrl+H
                </kbd>
              </button>

              <button
                onClick={() => setShowHeldOrders(true)}
                className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded flex items-center"
              >
                Held Orders
                {heldOrders.length > 0 && (
                  <span className="ml-2 bg-blue-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                    {heldOrders.length}
                  </span>
                )}
              </button>
            </div>

            <button
              onClick={cancelOrder}
              className="bg-red-100 flex-col hover:bg-red-200 text-red-700 px-4 py-2 rounded flex items-center"
            >
              Cancel
              <kbd className="ml-1 text-xs bg-red-200 px-1 rounded">Ctrl+X</kbd>
            </button>
          </div>
        </div>
      </div>

      {/* Held Orders Modal */}
      {showHeldOrders && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Held Orders</h3>
              <button
                onClick={() => setShowHeldOrders(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {heldOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No held orders</p>
            ) : (
              <div className="space-y-4">
                {heldOrders.map((order) => (
                  <div
                    key={order.id}
                    className="border rounded p-4 hover:bg-gray-50"
                  >
                    <div className="flex justify-between mb-2">
                      <span className="font-bold">Order #{order.id}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span>Items: {order.cartItems.length}</span>
                      <span className="font-medium">
                        ${order.total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-end space-x-2 mt-2">
                      <button
                        onClick={() => deleteHeldOrder(order.id)}
                        className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => recallHeldOrder(order)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        Recall Order
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SellingTotal;
