import React, { useState, useEffect, useRef } from "react";
import {
  Table,
  Modal,
  Input,
  Button,
  Card,
  Row,
  Col,
  InputNumber,
  Divider,
  message,
  Tag,
  Typography,
  Space,
  Statistic,
  Select,
  Tooltip,
  Badge,
} from "antd";
import {
  ShoppingCartOutlined,
  SearchOutlined,
  DeleteOutlined,
  CreditCardOutlined,
  BarcodeOutlined,
  PrinterOutlined,
  DollarOutlined,
  UserOutlined,
  PercentageOutlined,
  KeyOutlined,
  TagOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
  CalculatorOutlined,
} from "@ant-design/icons";
import { debounce } from "lodash";

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

// Keyboard shortcut help configuration
const SHORTCUTS = {
  PRODUCT_SEARCH: { key: "F1", description: "Open Product Search" },
  CHECKOUT: { key: "F2", description: "Proceed to Checkout" },
  PAYMENT: { key: "F3", description: "Open Payment" },
  DISCOUNT: { key: "F4", description: "Apply Discount" },
  PRICE_ADJUST: { key: "F5", description: "Adjust Price" },
  CLEAR_CART: { key: "F6", description: "Clear Cart" },
  FOCUS_QUANTITY: { key: "F7", description: "Focus Quantity of Selected Item" },
  HELP: { key: "F8", description: "Show Keyboard Shortcuts Help" },
  CLOSE: { key: "Escape", description: "Close Modal / Cancel" },
  CONFIRM: { key: "Enter", description: "Confirm Selection" },
  NAV_UP: { key: "↑", description: "Navigate Up" },
  NAV_DOWN: { key: "↓", description: "Navigate Down" },
  NAV_TAB: { key: "Tab", description: "Navigate Between Fields" },
};

const POS = () => {
  // States
  const [cartItems, setCartItems] = useState([]);
  const [isProductModalVisible, setIsProductModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [amountPaid, setAmountPaid] = useState(0);
  const [isCheckoutModalVisible, setIsCheckoutModalVisible] = useState(false);
  const [isDiscountModalVisible, setIsDiscountModalVisible] = useState(false);
  const [isPriceAdjustModalVisible, setIsPriceAdjustModalVisible] =
    useState(false);
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState(0);
  const [selectedCartItemId, setSelectedCartItemId] = useState(null);
  const [adjustedPrice, setAdjustedPrice] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isHelpModalVisible, setIsHelpModalVisible] = useState(false);
  const [activeTableIndex, setActiveTableIndex] = useState(-1);

  // Refs
  const productSearchRef = useRef();
  const quantityInputRef = useRef();
  const cartTableRef = useRef();
  const productTableRef = useRef();
  const paymentInputRef = useRef();
  const discountInputRef = useRef();
  const priceAdjustInputRef = useRef();

  // Sample products data
  const products = [
    {
      id: 1,
      name: "T-Shirt",
      price: 19.99,
      barcode: "1001",
      stock: 100,
      category: "Clothing",
    },
    {
      id: 2,
      name: "Jeans",
      price: 39.99,
      barcode: "1002",
      stock: 50,
      category: "Clothing",
    },
    {
      id: 3,
      name: "Coffee Mug",
      price: 9.99,
      barcode: "1003",
      stock: 200,
      category: "Kitchenware",
    },
    {
      id: 4,
      name: "Smartphone",
      price: 499.99,
      barcode: "1004",
      stock: 30,
      category: "Electronics",
    },
    {
      id: 5,
      name: "Headphones",
      price: 89.99,
      barcode: "1005",
      stock: 45,
      category: "Electronics",
    },
    {
      id: 6,
      name: "Water Bottle",
      price: 12.99,
      barcode: "1006",
      stock: 150,
      category: "Kitchenware",
    },
    {
      id: 7,
      name: "Notebook",
      price: 4.99,
      barcode: "1007",
      stock: 300,
      category: "Stationery",
    },
    {
      id: 8,
      name: "Backpack",
      price: 29.99,
      barcode: "1008",
      stock: 40,
      category: "Accessories",
    },
    {
      id: 9,
      name: "Watch",
      price: 59.99,
      barcode: "1009",
      stock: 25,
      category: "Accessories",
    },
    {
      id: 10,
      name: "Sunglasses",
      price: 24.99,
      barcode: "1010",
      stock: 60,
      category: "Accessories",
    },
  ];

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle keyboard shortcuts if they're not in an input field
      const tagName = document.activeElement.tagName.toLowerCase();
      const isInputActive = tagName === "input" || tagName === "textarea";

      // F1 to open product modal
      if (e.key === "F1") {
        e.preventDefault();
        openProductModal();
      }
      // F2 to proceed to checkout
      else if (e.key === "F2" && !isInputActive) {
        e.preventDefault();
        if (cartItems.length > 0) {
          openPaymentModal();
        } else {
          message.warning("Cart is empty!");
        }
      }
      // F3 for payment options
      else if (e.key === "F3" && !isInputActive) {
        e.preventDefault();
        if (cartItems.length > 0) {
          openPaymentModal();
        } else {
          message.warning("Cart is empty!");
        }
      }
      // F4 to apply discount
      else if (e.key === "F4" && !isInputActive) {
        e.preventDefault();
        if (cartItems.length > 0) {
          openDiscountModal();
        } else {
          message.warning("Cart is empty!");
        }
      }
      // F5 to adjust price
      else if (e.key === "F5" && !isInputActive) {
        e.preventDefault();
        if (selectedCartItemId) {
          openPriceAdjustModal();
        } else if (cartItems.length > 0) {
          message.warning("Please select a cart item first!");
        } else {
          message.warning("Cart is empty!");
        }
      }
      // F6 to clear cart
      else if (e.key === "F6" && !isInputActive) {
        e.preventDefault();
        if (cartItems.length > 0) {
          clearCart();
        }
      }
      // F7 to focus on quantity of selected item
      else if (e.key === "F7" && !isInputActive) {
        e.preventDefault();
        if (selectedCartItemId && cartTableRef.current) {
          const row = Array.from(
            cartTableRef.current.querySelectorAll("tr")
          ).find((row) => row.dataset.rowKey === selectedCartItemId.toString());
          if (row) {
            const quantityInput = row.querySelector(".ant-input-number-input");
            if (quantityInput) quantityInput.focus();
          }
        } else if (cartItems.length > 0) {
          message.warning("Please select a cart item first!");
        }
      }
      // F8 to show keyboard shortcuts help
      else if (e.key === "F8") {
        e.preventDefault();
        setIsHelpModalVisible(true);
      }
      // Escape to close modals
      else if (e.key === "Escape") {
        closeAllModals();
      }
      // Up/Down arrows for table navigation when in a table
      else if (
        (e.key === "ArrowUp" || e.key === "ArrowDown") &&
        !isInputActive &&
        activeTableIndex !== -1
      ) {
        e.preventDefault();
        handleTableNavigation(e.key === "ArrowUp" ? -1 : 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [cartItems, selectedCartItemId, activeTableIndex]);

  // Handle table navigation
  const handleTableNavigation = (direction) => {
    const table =
      activeTableIndex === 0 ? cartTableRef.current : productTableRef.current;
    if (!table) return;

    const rows = table.querySelectorAll("tbody tr");
    if (!rows.length) return;

    let currentIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      if (
        rows[i] === document.activeElement ||
        rows[i].contains(document.activeElement)
      ) {
        currentIndex = i;
        break;
      }
    }

    // Calculate new index
    let newIndex;
    if (currentIndex === -1) {
      newIndex = direction > 0 ? 0 : rows.length - 1;
    } else {
      newIndex = (currentIndex + direction + rows.length) % rows.length;
    }

    // Focus the new row
    rows[newIndex].focus();

    // For cart table, also set the selected item
    if (activeTableIndex === 0) {
      const rowKey = rows[newIndex].dataset.rowKey;
      if (rowKey) {
        setSelectedCartItemId(parseInt(rowKey));
      }
    }
  };

  // Focus management for product modal
  useEffect(() => {
    if (isProductModalVisible && productSearchRef.current) {
      setTimeout(() => {
        productSearchRef.current.focus();
      }, 100);
    }
  }, [isProductModalVisible]);

  // Focus management for payment modal
  useEffect(() => {
    if (isPaymentModalVisible && paymentInputRef.current) {
      setTimeout(() => {
        paymentInputRef.current?.focus();
      }, 100);
    }
  }, [isPaymentModalVisible]);

  // Focus management for discount modal
  useEffect(() => {
    if (isDiscountModalVisible && discountInputRef.current) {
      setTimeout(() => {
        discountInputRef.current?.focus();
      }, 100);
    }
  }, [isDiscountModalVisible]);

  // Focus management for price adjust modal
  useEffect(() => {
    if (isPriceAdjustModalVisible && priceAdjustInputRef.current) {
      setTimeout(() => {
        priceAdjustInputRef.current?.focus();
      }, 100);
    }
  }, [isPriceAdjustModalVisible]);

  // Filtered products based on search query
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode.includes(searchQuery) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Modal control functions
  const openProductModal = () => {
    setIsProductModalVisible(true);
    setSearchQuery("");
    setSelectedProduct(null);
    setQuantity(1);
  };

  const closeProductModal = () => {
    setIsProductModalVisible(false);
    setSearchQuery("");
    setSelectedProduct(null);
  };

  const openPaymentModal = () => {
    setIsPaymentModalVisible(true);
    setAmountPaid(getCartTotal());
  };

  const closePaymentModal = () => {
    setIsPaymentModalVisible(false);
  };

  const openDiscountModal = () => {
    setIsDiscountModalVisible(true);
    setDiscountType("percentage");
    setDiscountValue(0);
  };

  const closeDiscountModal = () => {
    setIsDiscountModalVisible(false);
  };

  const openPriceAdjustModal = () => {
    if (!selectedCartItemId) return;

    const selectedItem = cartItems.find(
      (item) => item.id === selectedCartItemId
    );
    if (selectedItem) {
      setIsPriceAdjustModalVisible(true);
      setAdjustedPrice(selectedItem.price);
    }
  };

  const closePriceAdjustModal = () => {
    setIsPriceAdjustModalVisible(false);
  };

  const closeAllModals = () => {
    setIsProductModalVisible(false);
    setIsPaymentModalVisible(false);
    setIsCheckoutModalVisible(false);
    setIsDiscountModalVisible(false);
    setIsPriceAdjustModalVisible(false);
    setIsHelpModalVisible(false);
  };

  // Cart operations
  const addToCart = (product, qty) => {
    const existingItemIndex = cartItems.findIndex(
      (item) => item.id === product.id
    );

    if (existingItemIndex !== -1) {
      // Update existing item quantity
      const updatedItems = [...cartItems];
      updatedItems[existingItemIndex].quantity += qty;
      updatedItems[existingItemIndex].total = Number(
        (
          updatedItems[existingItemIndex].quantity *
          updatedItems[existingItemIndex].price
        ).toFixed(2)
      );
      setCartItems(updatedItems);
    } else {
      // Add new item
      setCartItems([
        ...cartItems,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          originalPrice: product.price, // Keep track of original price
          quantity: qty,
          total: Number((product.price * qty).toFixed(2)),
          discount: 0,
        },
      ]);
    }

    closeProductModal();
    message.success(`Added ${qty} ${product.name} to cart`);
  };

  const removeFromCart = (id) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
    if (selectedCartItemId === id) {
      setSelectedCartItemId(null);
    }
  };

  const updateCartItemQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return;

    const updatedItems = cartItems.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          quantity: newQuantity,
          total: Number((item.price * newQuantity).toFixed(2)),
        };
      }
      return item;
    });

    setCartItems(updatedItems);
  };

  const clearCart = () => {
    setCartItems([]);
    setSelectedCartItemId(null);
  };

  const getSubtotal = () => {
    return Number(
      cartItems
        .reduce((sum, item) => sum + item.originalPrice * item.quantity, 0)
        .toFixed(2)
    );
  };

  const getTotalDiscount = () => {
    return Number(
      cartItems
        .reduce((sum, item) => {
          const originalTotal = item.originalPrice * item.quantity;
          const discountedTotal = item.price * item.quantity;
          return sum + (originalTotal - discountedTotal);
        }, 0)
        .toFixed(2)
    );
  };

  const getCartTotal = () => {
    return Number(
      cartItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)
    );
  };

  const getCartItemCount = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  // Apply discount to whole cart
  const applyDiscount = () => {
    if (discountValue <= 0) {
      message.warning("Please enter a valid discount value");
      return;
    }

    const updatedItems = cartItems.map((item) => {
      let discountedPrice;

      if (discountType === "percentage") {
        discountedPrice = item.originalPrice * (1 - discountValue / 100);
      } else {
        // fixed
        discountedPrice = Math.max(item.originalPrice - discountValue, 0);
      }

      return {
        ...item,
        price: Number(discountedPrice.toFixed(2)),
        total: Number((discountedPrice * item.quantity).toFixed(2)),
        discount:
          discountType === "percentage"
            ? `${discountValue}%`
            : `$${discountValue}`,
      };
    });

    setCartItems(updatedItems);
    closeDiscountModal();

    const discountText =
      discountType === "percentage"
        ? `${discountValue}% discount`
        : `$${discountValue} discount`;
    message.success(`Applied ${discountText} to all items`);
  };

  // Apply price adjustment to selected item
  const applyPriceAdjustment = () => {
    if (!selectedCartItemId) return;

    const updatedItems = cartItems.map((item) => {
      if (item.id === selectedCartItemId) {
        const discountAmount = item.originalPrice - adjustedPrice;
        const discountPercentage = (discountAmount / item.originalPrice) * 100;

        return {
          ...item,
          price: Number(adjustedPrice),
          total: Number((adjustedPrice * item.quantity).toFixed(2)),
          discount:
            discountAmount > 0
              ? `$${discountAmount.toFixed(2)} (${discountPercentage.toFixed(
                  1
                )}%)`
              : discountAmount < 0
              ? `+$${Math.abs(discountAmount).toFixed(2)}`
              : 0,
        };
      }
      return item;
    });

    setCartItems(updatedItems);
    closePriceAdjustModal();
    message.success("Price adjusted successfully");
  };

  // Payment processing
  const processPayment = () => {
    if (paymentMethod === "cash" && amountPaid < getCartTotal()) {
      message.error("Insufficient payment amount");
      return;
    }

    setIsPaymentModalVisible(false);
    setIsCheckoutModalVisible(true);
  };

  const completeTransaction = () => {
    message.success("Transaction completed successfully!");
    setIsCheckoutModalVisible(false);
    clearCart();
  };

  // Handle product selection in modal
  const handleProductSelection = (product) => {
    setSelectedProduct(product);
    setQuantity(1);

    if (quantityInputRef.current) {
      setTimeout(() => {
        quantityInputRef.current.focus();
      }, 100);
    }
  };

  // Handle search input change with debounce
  const handleSearchChange = debounce((value) => {
    setSearchQuery(value);
  }, 300);

  // Product selection in modal with keyboard navigation
  const handleProductKeyDown = (e, product) => {
    if (e.key === "Enter") {
      handleProductSelection(product);
    }
  };

  // Handle cart item selection
  const handleCartItemSelection = (id) => {
    setSelectedCartItemId(id);
  };

  // Cart table columns
  const cartColumns = [
    {
      title: "Product",
      dataIndex: "name",
      key: "name",
      render: (name, record) => (
        <div className="flex items-start">
          <div>
            <div className="font-medium">{name}</div>
            {record.discount > 0 && (
              <Tag color="volcano">{record.discount}</Tag>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (price, record) => (
        <div>
          <div>${price.toFixed(2)}</div>
          {record.price !== record.originalPrice && (
            <div className="text-gray-400 line-through text-xs">
              ${record.originalPrice.toFixed(2)}
            </div>
          )}
        </div>
      ),
      width: 100,
    },
    {
      title: "Qty",
      dataIndex: "quantity",
      key: "quantity",
      width: 80,
      render: (_, record) => (
        <InputNumber
          min={1}
          value={record.quantity}
          onChange={(value) => updateCartItemQuantity(record.id, value)}
          className="w-16"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.target.blur();
            }
          }}
        />
      ),
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      render: (total) => (
        <span className="font-medium">${total.toFixed(2)}</span>
      ),
      width: 100,
    },
    {
      title: "",
      key: "action",
      width: 70,
      render: (_, record) => (
        <Space>
          <Tooltip title="Price Adjustment (F5)">
            <Button
              type="text"
              icon={<TagOutlined />}
              onClick={() => {
                setSelectedCartItemId(record.id);
                openPriceAdjustModal();
              }}
            />
          </Tooltip>
          <Tooltip title="Remove">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => removeFromCart(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Product table columns for modal
  const productColumns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (price) => `$${price.toFixed(2)}`,
      width: 100,
    },
    {
      title: "Stock",
      dataIndex: "stock",
      key: "stock",
      width: 80,
      render: (stock) => (
        <Tag color={stock > 20 ? "green" : stock > 5 ? "orange" : "red"}>
          {stock}
        </Tag>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (category) => <Tag color="blue">{category}</Tag>,
      width: 110,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-full mx-auto h-screen flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-md p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <ShoppingCartOutlined className="text-2xl text-blue-600 mr-3" />
              <Title level={3} className="m-0">
                POS System
              </Title>
            </div>
            <Space>
              <Tooltip
                title={`${SHORTCUTS.PRODUCT_SEARCH.description} (${SHORTCUTS.PRODUCT_SEARCH.key})`}
              >
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={openProductModal}
                >
                  Products
                </Button>
              </Tooltip>
              <Tooltip
                title={`${SHORTCUTS.DISCOUNT.description} (${SHORTCUTS.DISCOUNT.key})`}
              >
                <Button
                  icon={<PercentageOutlined />}
                  onClick={openDiscountModal}
                  disabled={cartItems.length === 0}
                >
                  Discount
                </Button>
              </Tooltip>
              <Tooltip
                title={`${SHORTCUTS.PAYMENT.description} (${SHORTCUTS.PAYMENT.key})`}
              >
                <Button
                  type="primary"
                  icon={<CreditCardOutlined />}
                  onClick={openPaymentModal}
                  disabled={cartItems.length === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Checkout
                </Button>
              </Tooltip>
              <Tooltip
                title={`${SHORTCUTS.HELP.description} (${SHORTCUTS.HELP.key})`}
              >
                <Button
                  icon={<KeyOutlined />}
                  onClick={() => setIsHelpModalVisible(true)}
                >
                  Shortcuts
                </Button>
              </Tooltip>
            </Space>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-grow overflow-hidden">
          {/* Cart Section */}
          <div className="w-2/3 p-4 overflow-hidden flex flex-col">
            <Card
              title={
                <div className="flex justify-between items-center">
                  <span>Shopping Cart</span>
                  <Badge count={getCartItemCount()} showZero>
                    <Tag color="blue" className="text-base px-2 py-1">
                      Items
                    </Tag>
                  </Badge>
                </div>
              }
              className="shadow-md flex-grow overflow-hidden flex flex-col"
              extra={
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={clearCart}
                  disabled={cartItems.length === 0}
                >
                  Clear
                </Button>
              }
              bodyStyle={{
                padding: "0px",
                display: "flex",
                flexDirection: "column",
                flexGrow: 1,
              }}
            >
              <div className="flex-grow overflow-auto">
                <Table
                  dataSource={cartItems}
                  columns={cartColumns}
                  pagination={false}
                  rowKey="id"
                  size="middle"
                  rowClassName={(record) =>
                    record.id === selectedCartItemId ? "bg-blue-50" : ""
                  }
                  onRow={(record) => ({
                    onClick: () => handleCartItemSelection(record.id),
                    onFocus: () => setActiveTableIndex(0),
                    onBlur: () => setActiveTableIndex(-1),
                    tabIndex: 0,
                    "data-row-key": record.id,
                  })}
                  ref={cartTableRef}
                />
              </div>
            </Card>
          </div>

          {/* Summary Section */}
          <div className="w-1/3 p-4 overflow-hidden flex flex-col">
            <Card
              title="Order Summary"
              className="shadow-md flex-grow overflow-hidden flex flex-col"
            >
              <div className="flex-grow overflow-auto">
                <div className="mb-4">
                  <Row gutter={[8, 16]}>
                    <Col span={12}>
                      <Statistic
                        title="Total Items"
                        value={getCartItemCount()}
                        prefix={<ShoppingCartOutlined />}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Subtotal"
                        value={getSubtotal()}
                        precision={2}
                        prefix="$"
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Discount"
                        value={getTotalDiscount()}
                        precision={2}
                        prefix="-$"
                        valueStyle={{
                          color: getTotalDiscount() > 0 ? "#cf1322" : "inherit",
                        }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Total"
                        value={getCartTotal()}
                        precision={2}
                        prefix="$"
                        valueStyle={{ color: "#3f8600", fontWeight: "bold" }}
                      />
                    </Col>
                  </Row>
                </div>

                <Divider />

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="primary"
                    size="large"
                    icon={<CreditCardOutlined />}
                    onClick={openPaymentModal}
                    disabled={cartItems.length === 0}
                    className="bg-green-600 hover:bg-green-700 col-span-2"
                  >
                    Checkout (F2)
                  </Button>

                  <Button
                    size="large"
                    icon={<SearchOutlined />}
                    onClick={openProductModal}
                  >
                    Add Product (F1)
                  </Button>

                  <Button
                    size="large"
                    icon={<PercentageOutlined />}
                    onClick={openDiscountModal}
                    disabled={cartItems.length === 0}
                  >
                    Discount (F4)
                  </Button>

                  <Button
                    size="large"
                    icon={<TagOutlined />}
                    onClick={openPriceAdjustModal}
                    disabled={!selectedCartItemId}
                  >
                    Price Adjust (F5)
                  </Button>

                  <Button
                    size="large"
                    icon={<KeyOutlined />}
                    onClick={() => setIsHelpModalVisible(true)}
                  >
                    Shortcuts (F8)
                  </Button>
                </div>

                <Divider />

                {/* Quick Actions */}
                <Title level={5}>Quick Actions</Title>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[10, 20, 30, 50].map((percent) => (
                    <Button
                      key={percent}
                      onClick={() => {
                        setDiscountType("percentage");
                        setDiscountValue(percent);
                        applyDiscount();
                      }}
                      disabled={cartItems.length === 0}
                      icon={<PercentageOutlined />}
                    >
                      {percent}% Off
                    </Button>
                  ))}
                </div>

                {/* Keyboard Shortcuts Card */}
                <Card size="small" title="Key Shortcuts" className="mt-2">
                  <ul className="list-none p-0 m-0 grid grid-cols-2 gap-x-2 gap-y-1">
                    {Object.entries(SHORTCUTS)
                      .slice(0, 6)
                      .map(([key, { key: shortcutKey, description }]) => (
                        <li key={key} className="flex justify-between text-xs">
                          <Text strong>{shortcutKey}</Text>
                          <Text>{description}</Text>
                        </li>
                      ))}
                  </ul>
                </Card>
              </div>
            </Card>
          </div>
        </div>
        {/* Product Search Modal */}
        <Modal
          title="Add Products"
          open={isProductModalVisible}
          onCancel={closeProductModal}
          footer={null}
          width={800}
          className="product-search-modal"
        >
          <div className="mb-4">
            <Search
              placeholder="Search products by name, barcode or category..."
              enterButton
              onChange={(e) => handleSearchChange(e.target.value)}
              ref={productSearchRef}
            />
          </div>

          {selectedProduct ? (
            <div className="p-4 border rounded mb-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <Title level={4} className="m-0">
                    {selectedProduct.name}
                  </Title>
                  <div className="flex gap-2 mt-1">
                    <Tag color="blue">{selectedProduct.category}</Tag>
                    <Tag icon={<BarcodeOutlined />}>
                      {selectedProduct.barcode}
                    </Tag>
                    <Tag
                      color={
                        selectedProduct.stock > 20
                          ? "green"
                          : selectedProduct.stock > 5
                          ? "orange"
                          : "red"
                      }
                    >
                      Stock: {selectedProduct.stock}
                    </Tag>
                  </div>
                </div>
                <Title level={3} className="text-green-600 m-0">
                  ${selectedProduct.price.toFixed(2)}
                </Title>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Text strong className="mr-2">
                    Quantity:
                  </Text>
                  <InputNumber
                    min={1}
                    max={selectedProduct.stock}
                    value={quantity}
                    onChange={setQuantity}
                    ref={quantityInputRef}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addToCart(selectedProduct, quantity);
                      }
                    }}
                  />
                </div>

                <div>
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => addToCart(selectedProduct, quantity)}
                  >
                    Add to Cart
                  </Button>
                  <Button
                    className="ml-2"
                    onClick={() => setSelectedProduct(null)}
                  >
                    Back to List
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <Table
              dataSource={filteredProducts}
              columns={productColumns}
              pagination={false}
              rowKey="id"
              onRow={(record) => ({
                onClick: () => handleProductSelection(record),
                onKeyDown: (e) => handleProductKeyDown(e, record),
                onFocus: () => setActiveTableIndex(1),
                onBlur: () => setActiveTableIndex(-1),
                tabIndex: 0,
              })}
              ref={productTableRef}
            />
          )}
        </Modal>

        {/* Payment Modal */}
        <Modal
          title="Payment"
          open={isPaymentModalVisible}
          onCancel={closePaymentModal}
          footer={null}
          width={500}
        >
          <div className="p-2">
            <div className="mb-4">
              <Statistic
                title="Total Amount"
                value={getCartTotal()}
                precision={2}
                prefix="$"
                valueStyle={{ color: "#3f8600", fontSize: "24px" }}
              />
            </div>

            <div className="mb-4">
              <Text strong>Payment Method:</Text>
              <Select
                className="w-full mt-1"
                value={paymentMethod}
                onChange={setPaymentMethod}
              >
                <Option value="cash">Cash</Option>
                <Option value="card">Credit/Debit Card</Option>
                <Option value="mobile">Mobile Payment</Option>
              </Select>
            </div>

            {paymentMethod === "cash" && (
              <div className="mb-4">
                <Text strong>Amount Paid:</Text>
                <InputNumber
                  className="w-full mt-1"
                  min={0}
                  step={0.01}
                  precision={2}
                  value={amountPaid}
                  onChange={setAmountPaid}
                  prefix="$"
                  ref={paymentInputRef}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      processPayment();
                    }
                  }}
                />

                {amountPaid > getCartTotal() && (
                  <div className="mt-2">
                    <Text>Change Due: </Text>
                    <Text strong className="text-red-500">
                      ${(amountPaid - getCartTotal()).toFixed(2)}
                    </Text>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end mt-4">
              <Button onClick={closePaymentModal} className="mr-2">
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={processPayment}
                disabled={
                  paymentMethod === "cash" && amountPaid < getCartTotal()
                }
              >
                Complete Payment
              </Button>
            </div>
          </div>
        </Modal>

        {/* Checkout Receipt Modal */}
        <Modal
          title="Transaction Complete"
          open={isCheckoutModalVisible}
          onCancel={() => setIsCheckoutModalVisible(false)}
          footer={[
            <Button
              key="print"
              icon={<PrinterOutlined />}
              onClick={completeTransaction}
            >
              Print Receipt
            </Button>,
            <Button key="done" type="primary" onClick={completeTransaction}>
              Done
            </Button>,
          ]}
          width={400}
        >
          <div className="p-2">
            <div className="text-center mb-4">
              <Title level={4}>Receipt</Title>
              <Text type="secondary">{new Date().toLocaleString()}</Text>
            </div>

            <Divider className="my-2" />

            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between mb-2">
                <Text>
                  {item.name} x{item.quantity}
                  {item.price !== item.originalPrice && (
                    <Tag color="volcano" className="ml-1">
                      {item.discount}
                    </Tag>
                  )}
                </Text>
                <Text strong>${item.total.toFixed(2)}</Text>
              </div>
            ))}

            <Divider className="my-2" />

            <div className="flex justify-between mb-1">
              <Text>Subtotal:</Text>
              <Text>${getSubtotal().toFixed(2)}</Text>
            </div>

            {getTotalDiscount() > 0 && (
              <div className="flex justify-between mb-1 text-red-500">
                <Text>Discount:</Text>
                <Text>-${getTotalDiscount().toFixed(2)}</Text>
              </div>
            )}

            <div className="flex justify-between mb-1 font-bold">
              <Text strong>Total:</Text>
              <Text strong>${getCartTotal().toFixed(2)}</Text>
            </div>

            <div className="flex justify-between mb-1">
              <Text>Payment Method:</Text>
              <Text>
                {paymentMethod === "cash"
                  ? "Cash"
                  : paymentMethod === "card"
                  ? "Card"
                  : "Mobile Payment"}
              </Text>
            </div>

            {paymentMethod === "cash" && (
              <>
                <div className="flex justify-between mb-1">
                  <Text>Amount Paid:</Text>
                  <Text>${amountPaid.toFixed(2)}</Text>
                </div>

                {amountPaid > getCartTotal() && (
                  <div className="flex justify-between mb-1">
                    <Text>Change:</Text>
                    <Text>${(amountPaid - getCartTotal()).toFixed(2)}</Text>
                  </div>
                )}
              </>
            )}

            <Divider className="my-2" />

            <div className="text-center">
              <Text type="secondary">Thank you for your purchase!</Text>
            </div>
          </div>
        </Modal>

        {/* Discount Modal */}
        <Modal
          title="Apply Discount"
          open={isDiscountModalVisible}
          onCancel={closeDiscountModal}
          footer={null}
          width={400}
        >
          <div className="p-2">
            <div className="mb-4">
              <Text strong>Discount Type:</Text>
              <Select
                className="w-full mt-1"
                value={discountType}
                onChange={setDiscountType}
              >
                <Option value="percentage">Percentage (%)</Option>
                <Option value="fixed">Fixed Amount ($)</Option>
              </Select>
            </div>

            <div className="mb-4">
              <Text strong>
                {discountType === "percentage"
                  ? "Discount Percentage:"
                  : "Discount Amount:"}
              </Text>
              <InputNumber
                className="w-full mt-1"
                min={0}
                max={discountType === "percentage" ? 100 : undefined}
                step={discountType === "percentage" ? 1 : 0.01}
                precision={discountType === "percentage" ? 0 : 2}
                value={discountValue}
                onChange={setDiscountValue}
                prefix={discountType === "fixed" ? "$" : ""}
                suffix={discountType === "percentage" ? "%" : ""}
                ref={discountInputRef}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    applyDiscount();
                  }
                }}
              />
            </div>

            {/* Quick buttons for common discounts */}
            {discountType === "percentage" && (
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[5, 10, 15, 20, 25, 30, 40, 50].map((percent) => (
                  <Button
                    key={percent}
                    onClick={() => setDiscountValue(percent)}
                  >
                    {percent}%
                  </Button>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-4">
              <Button onClick={closeDiscountModal} className="mr-2">
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={applyDiscount}
                disabled={discountValue <= 0}
              >
                Apply
              </Button>
            </div>
          </div>
        </Modal>

        {/* Price Adjustment Modal */}
        <Modal
          title="Adjust Price"
          open={isPriceAdjustModalVisible}
          onCancel={closePriceAdjustModal}
          footer={null}
          width={400}
        >
          {selectedCartItemId && (
            <div className="p-2">
              <div className="mb-4">
                <Text strong>
                  Product:{" "}
                  {
                    cartItems.find((item) => item.id === selectedCartItemId)
                      ?.name
                  }
                </Text>
              </div>

              <div className="mb-4">
                <Text strong>Original Price:</Text>
                <InputNumber
                  className="w-full mt-1"
                  value={
                    cartItems.find((item) => item.id === selectedCartItemId)
                      ?.originalPrice
                  }
                  disabled
                  prefix="$"
                />
              </div>

              <div className="mb-4">
                <Text strong>New Price:</Text>
                <InputNumber
                  className="w-full mt-1"
                  min={0}
                  step={0.01}
                  precision={2}
                  value={adjustedPrice}
                  onChange={setAdjustedPrice}
                  prefix="$"
                  ref={priceAdjustInputRef}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      applyPriceAdjustment();
                    }
                  }}
                />
              </div>

              <div className="flex justify-end mt-4">
                <Button onClick={closePriceAdjustModal} className="mr-2">
                  Cancel
                </Button>
                <Button type="primary" onClick={applyPriceAdjustment}>
                  Apply
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Keyboard Shortcuts Help Modal */}
        <Modal
          title="Keyboard Shortcuts"
          open={isHelpModalVisible}
          onCancel={() => setIsHelpModalVisible(false)}
          footer={[
            <Button
              key="close"
              type="primary"
              onClick={() => setIsHelpModalVisible(false)}
            >
              Close
            </Button>,
          ]}
          width={400}
        >
          <div className="p-2">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left border-b pb-2">Key</th>
                  <th className="text-left border-b pb-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(SHORTCUTS).map(
                  ([key, { key: shortcutKey, description }]) => (
                    <tr key={key}>
                      <td className="py-2 border-b">
                        <Tag color="blue">{shortcutKey}</Tag>
                      </td>
                      <td className="py-2 border-b">{description}</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default POS;
