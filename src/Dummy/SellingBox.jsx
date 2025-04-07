import React, { useState, useEffect } from "react";
import useCartStore from "../Store/useCartStore";
import useCustomerStore from "../Store/useCustomerStore";
import { useAuthStore } from "../Store/stores";

const SellingBox = () => {
  const { customer, setCustomer, paymentMethod, setPaymentMethod } =
    useCartStore();
  const { customers, getCustomersByStore } = useCustomerStore(); // Get customers from store
  const { currentStore } = useAuthStore();
  console.log(customers);
  const storeId = currentStore?.id;

  useEffect(() => {
    getCustomersByStore(storeId);
  }, []);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "" });
  const [invoiceNumber, setInvoiceNumber] = useState("");

  // Add walk-in customer to the list
  const allCustomers = [{ _id: null, name: "Walk-in Customer" }, ...customers];

  useEffect(() => {
    // Generate invoice number based on current date
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");

    setInvoiceNumber(`INV-${year}${month}${day}-${random}`);

    // Set default customer to walk-in if no customer is selected
    if (!customer) {
      setCustomer({ _id: null, name: "Walk-in Customer" });
    }
  }, []);

  const handleCustomerChange = (e) => {
    const selectedId = e.target.value;
    const selectedCustomer =
      allCustomers.find((c) => c._id === selectedId) || null;
    setCustomer(selectedCustomer);
  };

  const handleAddCustomer = () => {
    if (newCustomer.name.trim()) {
      const customerId = `temp-${Date.now()}`;
      const customerToAdd = {
        _id: customerId,
        name: newCustomer.name,
        phone: newCustomer.phone,
      };

      // Here you would typically add the customer to your customer store
      // For example: useCustomerStore.getState().addCustomer(customerToAdd);

      setCustomer(customerToAdd);
      setNewCustomer({ name: "", phone: "" });
      setShowNewCustomer(false);
    }
  };

  return (
    <div className="bg-white p-4 shadow-md mb-4 rounded">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="w-full md:w-1/3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Customer
          </label>
          {!showNewCustomer ? (
            <div className="flex">
              <select
                className="w-full border rounded p-2 bg-white"
                value={customer?._id || ""}
                onChange={handleCustomerChange}
              >
                <option value="">Select Customer</option>
                {allCustomers.map((c) => (
                  <option key={c._id || "walk-in"} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                className="ml-2 bg-blue-500 text-white p-2 rounded"
                onClick={() => setShowNewCustomer(true)}
              >
                +
              </button>
            </div>
          ) : (
            <div className="flex flex-col space-y-2">
              <input
                type="text"
                placeholder="Customer Name"
                className="w-full border rounded p-2"
                value={newCustomer.name}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, name: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Phone Number"
                className="w-full border rounded p-2"
                value={newCustomer.phone}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, phone: e.target.value })
                }
              />
              <div className="flex space-x-2">
                <button
                  className="bg-green-500 text-white p-2 rounded"
                  onClick={handleAddCustomer}
                >
                  Save
                </button>
                <button
                  className="bg-gray-300 text-gray-700 p-2 rounded"
                  onClick={() => {
                    setShowNewCustomer(false);
                    setNewCustomer({ name: "", phone: "" });
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="w-full md:w-1/3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Method
          </label>
          <select
            className="w-full border rounded p-2 bg-white"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="">Select Payment Method</option>
            <option value="cash">Cash</option>
            <option value="card">Credit/Debit Card</option>
            <option value="mobileBanking">MobileBank Transfer</option>
          </select>
        </div>

        <div className="w-full md:w-1/3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Invoice #
          </label>
          <input
            type="text"
            className="w-full border rounded p-2 bg-gray-100"
            value={invoiceNumber}
            readOnly
          />
        </div>
      </div>
    </div>
  );
};

export default SellingBox;
