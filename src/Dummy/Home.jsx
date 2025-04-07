import React, { useEffect, useState, useCallback, useRef } from "react";
import { RiCustomerService2Line } from "react-icons/ri";
import SellingBox from "./SellingBox";
import SellingExtra from "./SellingExtra";
import SellingTotal from "./SellingTotal";
import { useProductStore } from "../Store/productStore";
import useCartStore from "../Store/useCartStore";
import useSaleStore from "../Store/useSaleStore";
import toast from "react-hot-toast";
// import ProductReturnModal from "./ProductReturnModal";
// import RetailerReturnModal from "./ProductReturnModal";
import PharmacyReturnModal from "./ProductReturnModal";
import VoiceRecorder from "../components/Audio/VoiceRecorder";
import { processCommand } from "../components/Audio/processCommand";
import VoiceControlModal from "./VoiceModal";
// import useRecorder from "../components/Audio/useRecorder";
import { Button, message, Badge } from "antd";
import { AudioOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import VoiceCommandModal from "./VoiceModal";
import PassiveVoiceListener from "./Voice/VoiceWithWhisper";

const Home = () => {
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  // const { recording, startRecording, stopRecording } = useRecorder();
  const [transcription, setTranscription] = useState("");

  const handleTranscription = (text) => {
    setTranscription(text);
    processCommand(text); // Process voice command
  };

  const { fetchProducts, products } = useProductStore();
  const {
    addToCart,
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    prepareSaleData,
  } = useCartStore();
  const { createSale } = useSaleStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProductIndex, setSelectedProductIndex] = useState(-1);
  const [isEditingQuantity, setIsEditingQuantity] = useState(false);
  const [quantityInput, setQuantityInput] = useState("");
  const [cartSelectedIndex, setCartSelectedIndex] = useState(-1);
  const [isCartEditing, setIsCartEditing] = useState(false);
  const [cartQuantityInput, setCartQuantityInput] = useState("");
  const [isProcessingSale, setIsProcessingSale] = useState(false);

  // Refs for input focus management
  const searchInputRef = useRef(null);
  const quantityInputRef = useRef(null);
  const cartQuantityInputRef = useRef(null);

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Filter products based on the search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(
        (product) =>
          product?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (product?.categoryInfo?.name &&
            product?.categoryInfo.name
              .toLowerCase()
              .includes(searchQuery.toLowerCase())) ||
          (product?.genericName &&
            product?.genericName
              .toLowerCase()
              .includes(searchQuery.toLowerCase())) ||
          (product?.barcode &&
            product?.barcode.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredProducts(filtered);
    }
  }, [products, searchQuery]);

  // Reset modal state
  const resetModalState = useCallback(() => {
    setSelectedProductIndex(-1);
    setQuantityInput("");
    setIsEditingQuantity(false);
    setIsModalOpen(false);
  }, []);

  // Reset cart editing state
  const resetCartEditingState = useCallback(() => {
    setIsCartEditing(false);
    setCartQuantityInput("");
  }, []);

  // Open search modal
  const openSearchModal = useCallback(() => {
    setIsModalOpen(true);
    setSearchQuery("");
    setSelectedProductIndex(-1);
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 100);
  }, []);

  // Handle product selection and quantity input
  const handleSelectProduct = useCallback(() => {
    if (selectedProductIndex >= 0) {
      if (isEditingQuantity) {
        const selectedProduct = filteredProducts[selectedProductIndex];
        const quantity = parseInt(quantityInput, 10);

        if (quantity > 0) {
          // No batch ID needed as it will be handled in backend
          addToCart(selectedProduct, quantity);
          resetModalState();
        }
      } else {
        setIsEditingQuantity(true);
        setTimeout(() => {
          if (quantityInputRef.current) {
            quantityInputRef.current.focus();
          }
        }, 100);
      }
    }
  }, [
    selectedProductIndex,
    isEditingQuantity,
    filteredProducts,
    quantityInput,
    addToCart,
    resetModalState,
  ]);

  // Handle cart item selection and updating
  const handleCartItemUpdate = useCallback(() => {
    if (cartSelectedIndex >= 0) {
      if (isCartEditing) {
        const quantity = parseInt(cartQuantityInput, 10);
        if (quantity > 0) {
          const selectedItem = cartItems[cartSelectedIndex];
          // Pass both product ID and batch ID to updateQuantity
          updateQuantity(
            selectedItem.product._id,
            selectedItem.batchId, // Add the missing batchId parameter
            quantity
          );
        }
        console.log("Quantity:", quantity);
        resetCartEditingState();
        setCartSelectedIndex(cartSelectedIndex);
      } else {
        setIsCartEditing(true);
        setCartQuantityInput(
          cartItems[cartSelectedIndex]?.quantity.toString() || ""
        );
        setTimeout(() => {
          if (cartQuantityInputRef.current) {
            cartQuantityInputRef.current.focus();
          }
        }, 100);
      }
    }
  }, [
    cartSelectedIndex,
    isCartEditing,
    cartQuantityInput,
    cartItems,
    updateQuantity,
    resetCartEditingState,
  ]);

  const handleCompleteSale = useCallback(async () => {
    if (cartItems.length === 0) {
      toast.error("Cannot complete sale: Cart is empty");
      return;
    }

    setIsProcessingSale(true);
    try {
      // Prepare sale data from cart store
      const saleData = prepareSaleData();

      // Create sale through sale store
      const createdSale = await createSale(saleData);

      // Show success toast
      toast.success(`Sale completed. Invoice #${createdSale.invoiceNumber}`);

      // Clear cart after successful sale
      clearCart();
    } catch (error) {
      // Handle sale creation error
      toast.error(`Failed to complete sale: ${error.message}`);
    } finally {
      fetchProducts();
      setIsProcessingSale(false);
    }
  }, [cartItems.length, prepareSaleData, createSale, clearCart, fetchProducts]);

  const handleSaleKeyDown = useCallback(
    (e) => {
      // F4 to complete sale
      if (e.key === "F4" && !isModalOpen) {
        e.preventDefault();
        handleCompleteSale();
      }
    },
    [isModalOpen, handleCompleteSale]
  );

  // Keyboard navigation for product search modal
  const handleSearchKeyDown = useCallback(
    (e) => {
      if (e.key === "F1") {
        e.preventDefault();
        openSearchModal();
      }

      if (isModalOpen) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedProductIndex((prev) =>
            prev < filteredProducts.length - 1 ? prev + 1 : prev
          );
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedProductIndex((prev) => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === "Enter") {
          e.preventDefault();
          handleSelectProduct();
        } else if (e.key === "Escape") {
          e.preventDefault();
          if (isEditingQuantity) {
            setIsEditingQuantity(false);
            setQuantityInput("");
            if (searchInputRef.current) {
              searchInputRef.current.focus();
            }
          } else {
            resetModalState();
          }
        }
      }
    },
    [
      isModalOpen,
      filteredProducts.length,
      selectedProductIndex,
      isEditingQuantity,
      openSearchModal,
      handleSelectProduct,
      resetModalState,
    ]
  );

  // Keyboard navigation for the cart
  const handleCartKeyDown = useCallback(
    (e) => {
      if (!isModalOpen) {
        if (e.key === "F2") {
          e.preventDefault();
          setCartSelectedIndex(cartItems.length > 0 ? 0 : -1);
        }

        if (cartItems.length > 0) {
          if (!isCartEditing) {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setCartSelectedIndex((prev) =>
                prev < cartItems.length - 1 ? prev + 1 : prev
              );
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setCartSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
            } else if (e.key === "Enter" && cartSelectedIndex >= 0) {
              e.preventDefault();
              handleCartItemUpdate();
            } else if (e.key === "Delete" && cartSelectedIndex >= 0) {
              e.preventDefault();
              removeFromCart(cartItems[cartSelectedIndex].product._id);
              // Reset selection if the last item was deleted
              if (cartSelectedIndex >= cartItems.length - 1) {
                setCartSelectedIndex(Math.max(0, cartItems.length - 2));
              }
            } else if (e.key === "F3") {
              e.preventDefault();
              clearCart();
              setCartSelectedIndex(-1);
            }
          } else if (e.key === "Enter" && cartSelectedIndex >= 0) {
            e.preventDefault();
            handleCartItemUpdate();
          } else if (e.key === "Escape") {
            e.preventDefault();
            resetCartEditingState();
          }
        }
      }
    },
    [
      isModalOpen,
      cartItems.length,
      cartSelectedIndex,
      isCartEditing,
      handleCartItemUpdate,
      removeFromCart,
      resetCartEditingState,
      clearCart,
    ]
  );

  // Add event listeners for keyboard actions
  useEffect(() => {
    const handleKeyDown = (e) => {
      handleSearchKeyDown(e);
      handleCartKeyDown(e);
      handleSaleKeyDown(e);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleSearchKeyDown, handleCartKeyDown, handleSaleKeyDown]);

  // Handle adding to cart from modal
  const handleAddToCart = useCallback(() => {
    if (selectedProductIndex >= 0 && quantityInput) {
      const selectedProduct = filteredProducts[selectedProductIndex];
      const quantity = parseInt(quantityInput, 10);

      if (selectedProduct?.totalStock === 0) {
        toast.error("This product is out of stock!", { position: "top-right" });
        return;
      }
      if (quantity > 0) {
        // No batch ID needed as it will be handled in backend
        addToCart(selectedProduct, quantity);
        resetModalState();
      }
    }
  }, [
    selectedProductIndex,
    quantityInput,
    filteredProducts,
    addToCart,
    resetModalState,
  ]);

  // Get price for display (lowestPrice or a calculated price)
  const getProductPrice = useCallback((product) => {
    return product.lowestPrice || product.highestPrice || 0;
  }, []);

  const sampleMedicines = [
    { id: 1, name: "Panadol", price: 5.99, stock: 100 },
    { id: 2, name: "Panadol Extra", price: 7.99, stock: 75 },
    { id: 3, name: "Paracetamol 500mg", price: 4.5, stock: 150 },
    { id: 4, name: "Ibuprofen 200mg", price: 6.75, stock: 80 },
    { id: 5, name: "Aspirin", price: 3.99, stock: 120 },
    { id: 6, name: "Amoxicillin", price: 12.99, stock: 50 },
    { id: 7, name: "Azithromycin", price: 15.49, stock: 45 },
    { id: 8, name: "Calpol", price: 8.25, stock: 60 },
    { id: 9, name: "Vitamin C", price: 9.99, stock: 90 },
    { id: 10, name: "Vitamin D3", price: 11.5, stock: 70 },
  ];

  const [isVoiceModalVisible, setIsVoiceModalVisible] = useState(false);
  const [cart, setCart] = useState([]);
  const searchMedicine = async (term) => {
    // Simulate API call with a small delay
    return new Promise((resolve) => {
      setTimeout(() => {
        const results = sampleMedicines.filter((med) =>
          med.name.toLowerCase().includes(term.toLowerCase())
        );
        resolve(results);
      }, 500);
    });
  };

  // Add to cart function
  const handleAddToCart2 = (item) => {
    // Check if item already exists in cart
    const existingItemIndex = cart.findIndex(
      (cartItem) => cartItem.id === item.id
    );

    if (existingItemIndex !== -1) {
      // Update existing item
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += item.quantity;
      updatedCart[existingItemIndex].total =
        updatedCart[existingItemIndex].price *
        updatedCart[existingItemIndex].quantity;
      setCart(updatedCart);
    } else {
      // Add new item
      setCart([...cart, item]);
    }

    message.success(`Added ${item.quantity} ${item.name} to cart`);
  };

  // Print bill function
  const handlePrintBill = (cartItems) => {
    // In a real app, this would connect to a printer or generate a printable document
    message.success("Bill printed successfully!");
    console.log("Printing bill for items:", cartItems);
    // You might want to clear the cart after printing
    setCart([]);
  };
  return (
    <div className="min-h-screen bg-gray-50">
      {/* <div className="flex justify-between p-3 bg-white shadow-sm">
        <RiCustomerService2Line className="text-2xl mt-2 cursor-pointer text-blue-600" />
      </div> */}
      {/* <div>
        <h1>Audica - Voice Controlled Retail</h1>
        <VoiceRecorder onTranscribe={handleTranscription} />
        <p>Transcription: {transcription}</p>
      </div> */}

      {/* <div className="flex items-center">
        <Badge count={cart.length} showZero>
          <Button icon={<ShoppingCartOutlined />} size="large" className="mr-4">
            Cart
          </Button>
        </Badge>
        <Button
          type="primary"
          icon={<AudioOutlined />}
          size="large"
          onClick={() => setIsVoiceModalVisible(true)}
        >
          Voice Control
        </Button>
      </div> */}

      {/* <VoiceControlModal
        isVisible={isVoiceModalVisible}
        onClose={() => setIsVoiceModalVisible(false)}
        onAddToCart={handleAddToCart}
        onPrintBill={handlePrintBill}
        searchMedicine={searchMedicine}
        medicineList={sampleMedicines}
      /> */}

      {/* <VoiceCommandModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        voiceInput={"search zara dhol"} // this would come from Web Speech API
      /> */}

      <PassiveVoiceListener />

      <SellingBox />
      <div className="flex flex-col md:flex-row gap-4 p-4">
        <div className="md:w-3/4 bg-gray-50 rounded shadow-md">
          <h2 className="text-2xl font-bold text-center mb-4 p-2 bg-blue-600 text-white rounded-t">
            Retail Management - Selling Table
          </h2>
          <div className="p-4">
            <div className="mb-4 flex justify-between">
              <div className="flex gap-5">
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-2"
                  onClick={openSearchModal}
                >
                  <span>Search Products</span>
                  <span className="text-xs border border-white rounded px-1">
                    F1
                  </span>
                </button>
                <button
                  className="bg-red-500 text-white px-4 py-2 rounded flex items-center gap-2"
                  onClick={() => setReturnModalVisible(true)}
                >
                  <span>Return</span>
                </button>

                <PharmacyReturnModal
                  visible={returnModalVisible}
                  onClose={() => setReturnModalVisible(false)}
                  // product={productData}
                />
              </div>
              <div className="flex gap-2">
                {cartItems.length > 0 && (
                  <>
                    <button
                      className="bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-2"
                      onClick={() => setCartSelectedIndex(0)}
                    >
                      <span>Select Cart</span>
                      <span className="text-xs border border-white rounded px-1">
                        F2
                      </span>
                    </button>
                    <button
                      className="bg-red-500 text-white px-4 py-2 rounded flex items-center gap-2"
                      onClick={clearCart}
                    >
                      <span>Clear Cart</span>
                      <span className="text-xs border border-white rounded px-1">
                        F3
                      </span>
                    </button>
                    <button
                      className={`${
                        isProcessingSale
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-green-500 hover:bg-green-600"
                      } text-white px-4 py-2 rounded flex items-center gap-2`}
                      onClick={handleCompleteSale}
                      disabled={isProcessingSale}
                    >
                      <span>Complete Sale</span>
                      <span className="text-xs border border-white rounded px-1">
                        F4
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="table-auto border-collapse w-full bg-white shadow-md rounded">
                <thead>
                  <tr className="bg-gray-200 text-gray-800 font-medium">
                    <th className="border px-4 py-2">Sr#</th>
                    <th className="border px-4 py-2">Product Code</th>
                    <th className="border px-4 py-2">Product Name</th>
                    <th className="border px-4 py-2">Generic Name</th>
                    <th className="border px-4 py-2">Rate/Unit</th>
                    <th className="border px-4 py-2">Qty</th>
                    <th className="border px-4 py-2">Discount</th>
                    <th className="border px-4 py-2">Total</th>
                    <th className="border px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.length > 0 ? (
                    cartItems.map((item, index) => (
                      <tr
                        key={item.product._id}
                        className={`hover:bg-gray-100 ${
                          cartSelectedIndex === index ? "bg-blue-100" : ""
                        }`}
                        onClick={() => setCartSelectedIndex(index)}
                      >
                        <td className="border px-4 py-2 text-center">
                          {index + 1}
                        </td>
                        <td className="border px-4 py-2">
                          {item.product._id.slice(0, 8)}
                        </td>
                        <td className="border px-4 py-2">
                          {item.product.name}
                        </td>
                        <td className="border px-4 py-2">
                          {item.product.genericName || "-"}
                        </td>
                        <td className="border px-4 py-2 text-right">
                          Rs. {getProductPrice(item.product).toFixed(2)}
                        </td>
                        <td className="border px-4 py-2 text-center">
                          {cartSelectedIndex === index && isCartEditing ? (
                            <input
                              type="text"
                              value={cartQuantityInput}
                              className="border rounded px-2 py-1 w-16 text-center"
                              ref={cartQuantityInputRef}
                              onChange={(e) => {
                                const newValue = e.target.value.replace(
                                  /[^0-9]/g,
                                  ""
                                );
                                setCartQuantityInput(newValue);
                              }}
                              onBlur={() => {
                                const quantity = parseInt(
                                  cartQuantityInput,
                                  10
                                );
                                if (quantity > 0) {
                                  updateQuantity(
                                    cartItems[cartSelectedIndex].product._id,
                                    quantity
                                  );
                                }
                                resetCartEditingState();
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleCartItemUpdate();
                                } else if (e.key === "Escape") {
                                  e.preventDefault();
                                  resetCartEditingState();
                                }
                              }}
                            />
                          ) : (
                            <div
                              className="cursor-pointer"
                              onClick={() => {
                                setCartSelectedIndex(index);
                                setIsCartEditing(true);
                                setCartQuantityInput(item.quantity.toString());
                                setTimeout(() => {
                                  if (cartQuantityInputRef.current) {
                                    cartQuantityInputRef.current.focus();
                                  }
                                }, 100);
                              }}
                            >
                              {item.quantity}
                            </div>
                          )}
                        </td>
                        <td className="border px-4 py-2 text-center">
                          {item.discount || 0}%
                        </td>
                        <td className="border px-4 py-2 text-right">
                          Rs.
                          {(
                            getProductPrice(item.product) *
                            item.quantity *
                            (1 - (item.discount || 0) / 100)
                          ).toFixed(2)}
                        </td>
                        <td className="border px-4 py-2 text-center">
                          <button
                            className="text-red-600 hover:text-red-800 hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log("this runs");
                              removeFromCart(item.product._id);
                              console.log("this runs as well", item.product);
                              if (cartSelectedIndex >= cartItems.length - 1) {
                                setCartSelectedIndex(
                                  Math.max(0, cartItems.length - 2)
                                );
                              }
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="9"
                        className="border px-4 py-8 text-center text-gray-500"
                      >
                        No items in cart. Press F1 to search and add products.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <SellingTotal />
      </div>
      <SellingExtra />

      {/* Product Search Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Search Products</h2>
              <div className="text-sm text-gray-500">
                <span className="mr-2">Keyboard Shortcuts:</span>
                <kbd className="border px-1 rounded">↑</kbd>/
                <kbd className="border px-1 rounded">↓</kbd> navigate,
                <kbd className="border px-1 rounded ml-1">Enter</kbd> select,
                <kbd className="border px-1 rounded ml-1">Esc</kbd> close
              </div>
            </div>
            <input
              type="text"
              className="w-full p-2 border rounded mb-4"
              placeholder="Search by name, generic name, barcode or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              ref={searchInputRef}
            />
            <div className="overflow-y-auto max-h-96 mb-4">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 border">Name</th>
                    <th className="px-4 py-2 border">Generic Name</th>
                    <th className="px-4 py-2 border">Category</th>
                    <th className="px-4 py-2 border">Form</th>
                    <th className="px-4 py-2 border">Price</th>
                    <th className="px-4 py-2 border">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product, index) => (
                      <tr
                        key={product._id}
                        className={`cursor-pointer hover:bg-gray-100 ${
                          selectedProductIndex === index ? "bg-blue-100" : ""
                        }`}
                        onClick={() => setSelectedProductIndex(index)}
                      >
                        <td className="px-4 py-2 border">{product.name}</td>
                        <td className="px-4 py-2 border">
                          {product.genericName || "-"}
                        </td>
                        <td className="px-4 py-2 border">
                          {product.categoryInfo?.name || "-"}
                        </td>
                        <td className="px-4 py-2 border">
                          {product.dosageForm || "-"}
                        </td>
                        <td className="px-4 text-right py-2 border">
                          Rs. {getProductPrice(product).toFixed(2)}
                        </td>
                        <td className="px-4 text-center py-2 border">
                          {product.totalStock || 0}
                          {product.isLowStock && (
                            <span className="ml-2 text-red-500">Low</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-4 py-2 text-center text-gray-500"
                      >
                        No products found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Quantity Input (appears directly after selecting a product) */}

            {selectedProductIndex >= 0 && isEditingQuantity && (
              <div className="mb-4">
                <h3 className="text-lg font-bold mb-2">Enter Quantity</h3>
                <input
                  type="number"
                  className="w-full p-2 border rounded"
                  placeholder="Enter quantity"
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(e.target.value)}
                  min="1"
                  ref={quantityInputRef}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddToCart();
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      setIsEditingQuantity(false);
                      setQuantityInput("");
                      if (searchInputRef.current) {
                        searchInputRef.current.focus();
                      }
                    }
                  }}
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              {selectedProductIndex >= 0 && isEditingQuantity && (
                <button
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                  disabled={!quantityInput}
                  onClick={handleAddToCart}
                >
                  Add to Cart
                </button>
              )}
              <button
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                onClick={resetModalState}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
