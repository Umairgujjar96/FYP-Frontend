import React, { useState, useEffect, useRef } from "react";
import {
  Input,
  Button,
  List,
  Card,
  Badge,
  Modal,
  message,
  Spin,
  Divider,
  Tag,
  Typography,
  Switch,
  Layout,
  Empty,
  InputNumber,
  Space,
  Tooltip,
  Select,
} from "antd";
import {
  SearchOutlined,
  ShoppingCartOutlined,
  AudioOutlined,
  PrinterOutlined,
  PlusOutlined,
  MinusOutlined,
  DeleteOutlined,
  SoundOutlined,
} from "@ant-design/icons";
import { useProductStore } from "../../Store/productStore";
import useSaleStore from "../../Store/useSaleStore";
import { useAuthStore } from "../../Store/stores";
import VoiceReceiptModal from "./VoicePrintReciept";

const { Title, Text } = Typography;
const { Content } = Layout;
const { Option } = Select;

const PharmacyPOSModal = ({ visible, onClose }) => {
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [cart, setCart] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [printModalVisible, setPrintModalVisible] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [commandLog, setCommandLog] = useState([]);
  const [autoRestart, setAutoRestart] = useState(true);
  const [quantities, setQuantities] = useState({});
  const [selectedBatches, setSelectedBatches] = useState({});
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  // Add these state variables at the top of your component
  const [ActualprintModalVisible, setActualPrintModalVisible] = useState(false);
  const [completedSaleData, setCompletedSaleData] = useState(null);

  // Add this function to handle closing the receipt modal
  const handleCloseReceiptModal = () => {
    setPrintModalVisible(false);
  };
  // Fetch from Zustand stores
  const { products, fetchProducts } = useProductStore();
  const { createSale } = useSaleStore();
  const { user } = useAuthStore();

  // Refs for speech recognition and state management
  const recognitionRef = useRef(null);
  const commandProcessingRef = useRef(false);
  const lastCommandRef = useRef("");
  const timeoutRef = useRef(null);
  const mountedRef = useRef(true);
  const voiceEnabledRef = useRef(false);
  const autoRestartRef = useRef(true);
  const searchResultsRef = useRef([]);
  const cartRef = useRef([]);
  const quantitiesRef = useRef({});
  const printModalVisibleRef = useRef(false);

  // OpenAI API key - should be loaded from environment or secure storage
  const openAiKey =
    "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";

  // Calculate cart total
  const cartTotal = cart.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const taxAmount = 0;
  const totalWithTax = cartTotal + taxAmount;

  // Generate invoice number on component mount
  useEffect(() => {
    // Generate a random invoice number
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(
      date.getMonth() + 1
    ).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setInvoiceNumber(`INV-${dateStr}-${randomNum}`);

    // Fetch products if needed
    if (!products || products.length === 0) {
      fetchProducts();
    }
  }, [fetchProducts, products]);

  // Update refs when state changes
  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
    autoRestartRef.current = autoRestart;
    searchResultsRef.current = searchResults;
    cartRef.current = cart;
    quantitiesRef.current = quantities;
    printModalVisibleRef.current = printModalVisible;
  }, [
    voiceEnabled,
    autoRestart,
    searchResults,
    cart,
    quantities,
    printModalVisible,
  ]);

  // Mount/unmount effect
  useEffect(() => {
    mountedRef.current = true;

    if (!visible) return;

    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      cleanupSpeechRecognition();
    };
  }, [visible]);

  // Speech recognition setup effect
  useEffect(() => {
    if (!visible) return;

    setupSpeechRecognition();
    return cleanupSpeechRecognition;
  }, [visible, voiceEnabled]);

  // Initialize quantity state for search results
  useEffect(() => {
    const newQuantities = {};
    const newSelectedBatches = {};

    searchResults.forEach((item) => {
      newQuantities[item._id] = quantities[item._id] || 1;

      // Select the first batch by default if there are batches
      if (item.batches && item.batches.length > 0) {
        newSelectedBatches[item._id] =
          selectedBatches[item._id] || item.batches[0]._id;
      }
    });

    setQuantities(newQuantities);
    setSelectedBatches(newSelectedBatches);
  }, [searchResults]);

  // Function to setup speech recognition
  const setupSpeechRecognition = () => {
    cleanupSpeechRecognition();

    try {
      if (
        typeof window !== "undefined" &&
        ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
      ) {
        const SpeechRecognition =
          window.SpeechRecognition || window.webkitSpeechRecognition;

        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = "en-US";

        recognitionRef.current.onstart = () => {
          if (!mountedRef.current) return;
          setIsListening(true);
          setTranscript("Listening...");
        };

        recognitionRef.current.onresult = (event) => {
          if (!mountedRef.current) return;
          const speechResult = event.results[0][0].transcript;
          setTranscript(speechResult);
          processVoiceCommand(speechResult);
        };

        recognitionRef.current.onerror = (event) => {
          if (!mountedRef.current) return;

          console.log("Speech recognition error", event.error);
          setIsListening(false);

          if (event.error === "aborted") return;

          if (event.error !== "no-speech") {
            setTranscript(`Error: ${event.error}`);
            message.error(`Speech recognition error: ${event.error}`, 1);
          } else {
            setTranscript("No speech detected. Ready for commands...");
          }

          restartListeningIfNeeded();
        };

        recognitionRef.current.onend = () => {
          if (!mountedRef.current) return;
          setIsListening(false);
          restartListeningIfNeeded();
        };

        if (voiceEnabled && autoRestart) {
          startListening();
        }
      } else {
        console.warn("Speech recognition not supported in this browser.");
        message.error("Speech recognition not supported in this browser.");
      }
    } catch (error) {
      console.error("Error initializing speech recognition:", error);
      message.error("Failed to initialize speech recognition.");
    }
  };

  // Helper for restarting listening
  const restartListeningIfNeeded = () => {
    if (
      mountedRef.current &&
      voiceEnabledRef.current &&
      autoRestartRef.current &&
      !commandProcessingRef.current
    ) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        if (mountedRef.current && voiceEnabledRef.current) {
          startListening();
        }
      }, 1000);
    }
  };

  // Clean up function for speech recognition
  const cleanupSpeechRecognition = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (error) {
        console.log("Could not abort speech recognition:", error);
      } finally {
        recognitionRef.current = null;
      }
    }
  };

  const processVoiceCommand = async (rawCommand) => {
    if (!rawCommand || rawCommand.trim() === "" || !mountedRef.current) return;

    // Prevent duplicate command processing
    if (rawCommand === lastCommandRef.current) return;

    lastCommandRef.current = rawCommand;
    commandProcessingRef.current = true;
    setProcessing(true);

    try {
      // Always use OpenAI for command correction
      const correctedCommand = await correctWithOpenAI(rawCommand);

      if (mountedRef.current) {
        setCommandLog((prev) => [
          ...prev,
          {
            raw: rawCommand,
            corrected: correctedCommand,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);

        await executeCommand(correctedCommand);
      }
    } catch (error) {
      console.error("Error processing command:", error);
      if (mountedRef.current) {
        message.error("Error processing voice command");
      }
    } finally {
      if (mountedRef.current) {
        setProcessing(false);
      }
      commandProcessingRef.current = false;

      setTimeout(() => {
        lastCommandRef.current = "";
      }, 1000);

      restartListeningIfNeeded();
    }
  };

  const correctWithOpenAI = async (rawCommand) => {
    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openAiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: `You are a voice command processor for a pharmacy POS system. 
        Correct any misheard commands and return ONLY the corrected command 
        with no additional text or explanation. 
        Common commands include: "search for [medicine name]", "add to cart", 
        "add [quantity] to cart", "add [quantity] [medicine name]",
        "remove from cart", "select [number]", "print bill", "clear cart", "complete sale", "close".
        Common medicines include: panadol, xarelto, aspirin, puldol, carisef, etc.
                      Hey one more common error is treadmill treate it as print bill
                      `,
              },
              {
                role: "user",
                content: `Correct this voice command: "${rawCommand}"`,
              },
            ],
            temperature: 0.3,
            max_tokens: 50,
          }),
        }
      );

      const data = await response.json();

      if (data.choices && data.choices[0]?.message?.content) {
        return data.choices[0].message.content.trim().toLowerCase();
      } else {
        console.error("Unexpected API response:", data);
        return rawCommand.toLowerCase().trim();
      }
    } catch (error) {
      console.error("OpenAI API error:", error);
      return rawCommand.toLowerCase().trim();
    }
  };

  const executeCommand = async (command) => {
    const lowerCommand = command.toLowerCase().trim();

    // Search command
    if (lowerCommand.includes("search")) {
      const searchTerm = lowerCommand.replace(/search( for)?/i, "").trim();
      if (searchTerm) {
        setSearchQuery(searchTerm);
        handleSearch(searchTerm);
        message.success(`Searching for: ${searchTerm}`);
      } else {
        message.info("Please specify what to search for");
      }
      return;
    }

    // Select command
    if (lowerCommand.startsWith("select")) {
      const match = lowerCommand.match(/select (\d+|one)/i);
      if (match && match[1]) {
        const indexStr = match[1].toLowerCase() === "one" ? "1" : match[1];
        const index = parseInt(indexStr) - 1;
        const currentSearchResults = searchResultsRef.current;

        if (index >= 0 && index < currentSearchResults.length) {
          const product = currentSearchResults[index];
          const quantity = quantitiesRef.current[product._id] || 1;
          const batchId = selectedBatches[product._id];

          if (product.batches && product.batches.length > 0) {
            const selectedBatch =
              product.batches.find((b) => b._id === batchId) ||
              product.batches[0];
            addToCart(product, selectedBatch, quantity);
            message.success(`Added ${quantity} ${product.name} to cart`);
          } else {
            message.error("No valid batch found for this product");
          }
        } else {
          message.error(`Item #${indexStr} not found in search results`);
        }
      }
      return;
    }

    // Add with quantity commands
    const addWithQuantityMatch = lowerCommand.match(
      /add (\d+)( items?| pieces?)?( to cart)?/
    );
    if (addWithQuantityMatch) {
      const quantity = parseInt(addWithQuantityMatch[1]);
      const currentSearchResults = searchResultsRef.current;

      if (currentSearchResults.length > 0) {
        const product = currentSearchResults[0];
        const batchId = selectedBatches[product._id];

        if (product.batches && product.batches.length > 0) {
          const selectedBatch =
            product.batches.find((b) => b._id === batchId) ||
            product.batches[0];
          addToCart(product, selectedBatch, quantity);
          message.success(`Added ${quantity} ${product.name} to cart`);
        } else {
          message.error("No valid batch found for this product");
        }
      } else {
        message.error("Please search for a product first");
      }
      return;
    }

    // Add to cart command
    if (lowerCommand.includes("add to cart") || lowerCommand === "add item") {
      const currentSearchResults = searchResultsRef.current;
      if (currentSearchResults.length > 0) {
        const product = currentSearchResults[0];
        const batchId = selectedBatches[product._id];

        if (product.batches && product.batches.length > 0) {
          const selectedBatch =
            product.batches.find((b) => b._id === batchId) ||
            product.batches[0];
          addToCart(product, selectedBatch, 1);
          message.success(`Added ${product.name} to cart`);
        } else {
          message.error("No valid batch found for this product");
        }
      } else {
        message.error("Please search for a product first");
      }
      return;
    }

    // Remove from cart command
    if (lowerCommand.includes("remove")) {
      const currentCart = cartRef.current;
      if (currentCart.length > 0) {
        // Handle removing specific items if mentioned
        const itemWords = lowerCommand.split(" ");
        let itemFound = false;

        for (const word of itemWords) {
          if (word.length < 3) continue;

          const matchedItem = currentCart.find((item) =>
            item.productName.toLowerCase().includes(word.toLowerCase())
          );

          if (matchedItem) {
            removeFromCart(matchedItem.productId, matchedItem.batchId);
            message.success(`Removed ${matchedItem.productName} from cart`);
            itemFound = true;
            break;
          }
        }

        // Default: remove last item if no specific item was found
        if (!itemFound) {
          const lastItem = currentCart[currentCart.length - 1];
          removeFromCart(lastItem.productId, lastItem.batchId);
          message.success(`Removed ${lastItem.productName} from cart`);
        }
      } else {
        message.error("Cart is empty");
      }
      return;
    }

    // Clear cart command
    if (
      lowerCommand.includes("clear cart") ||
      lowerCommand.includes("empty cart")
    ) {
      const currentCart = cartRef.current;
      if (currentCart.length > 0) {
        setCart([]);
        message.success("Cart cleared");
      } else {
        message.info("Cart is already empty");
      }
      return;
    }

    // Print bill command
    if (
      lowerCommand.includes("print bill") ||
      lowerCommand.includes("checkout")
    ) {
      const currentCart = cartRef.current;
      if (currentCart.length > 0) {
        setPrintModalVisible(true);
        message.success("Preparing bill for printing");
      } else {
        message.error("Cart is empty. Nothing to print.");
      }
      return;
    }

    // Complete sale command - FIXED: Use ref instead of state for check
    if (lowerCommand.includes("complete sale") || lowerCommand === "complete") {
      if (printModalVisibleRef.current) {
        handleCompleteSale();
        message.success("Sale completed");
      } else {
        message.error(
          "Please open the checkout first with 'print bill' command"
        );
      }
      return;
    }

    // Close command
    if (
      lowerCommand.includes("close") ||
      lowerCommand.includes("exit") ||
      lowerCommand.includes("quit")
    ) {
      setVoiceEnabled(false);
      cleanupSpeechRecognition();
      message.info("Voice assistant disabled");
      return;
    }

    message.info(`Command "${command}" not recognized or not implemented`);
  };

  const startListening = () => {
    if (
      isListening ||
      commandProcessingRef.current ||
      !voiceEnabledRef.current
    ) {
      return;
    }

    if (!recognitionRef.current) {
      setupSpeechRecognition();
      setTimeout(() => {
        if (
          recognitionRef.current &&
          mountedRef.current &&
          voiceEnabledRef.current
        ) {
          startListeningInternal();
        }
      }, 300);
      return;
    }

    startListeningInternal();
  };

  const startListeningInternal = () => {
    try {
      recognitionRef.current.start();
    } catch (error) {
      console.log("Error starting recognition:", error);

      if (error.name === "InvalidStateError") {
        try {
          recognitionRef.current.abort();
          setTimeout(() => {
            if (mountedRef.current && voiceEnabledRef.current) {
              setupSpeechRecognition();
              setTimeout(() => {
                if (
                  mountedRef.current &&
                  voiceEnabledRef.current &&
                  recognitionRef.current
                ) {
                  try {
                    recognitionRef.current.start();
                  } catch (finalError) {
                    console.error("Could not restart recognition:", finalError);
                  }
                }
              }, 500);
            }
          }, 500);
        } catch (abortError) {
          console.error("Error during recovery:", abortError);
        }
      }
    }
  };

  const toggleVoiceRecognition = (enabled) => {
    setVoiceEnabled(enabled);

    if (enabled) {
      setTimeout(() => {
        if (
          autoRestartRef.current &&
          !isListening &&
          !commandProcessingRef.current
        ) {
          setupSpeechRecognition();
        }
      }, 300);
    } else {
      cleanupSpeechRecognition();
      setIsListening(false);
    }
  };

  const toggleContinuousListening = (checked) => {
    setAutoRestart(checked);

    if (
      checked &&
      voiceEnabledRef.current &&
      !isListening &&
      !commandProcessingRef.current
    ) {
      setTimeout(() => {
        if (mountedRef.current) {
          startListening();
        }
      }, 300);
    }
  };

  // Optimized search function using memoization
  const handleSearch = (query) => {
    if (!query || !query.trim()) {
      setSearchResults([]);
      return;
    }

    const queryLower = query.toLowerCase();
    const filtered = products?.filter(
      (product) =>
        product.name.toLowerCase().includes(queryLower) ||
        product.description?.toLowerCase().includes(queryLower) ||
        product.genericName?.toLowerCase().includes(queryLower)
    );

    setSearchResults(filtered || []);
  };

  const updateQuantity = (productId, value) => {
    const product = searchResults.find((p) => p._id === productId);
    const batchId = selectedBatches[productId];
    const selectedBatch = product?.batches?.find((b) => b._id === batchId);

    // Find max available stock from selected batch
    const maxStock = selectedBatch ? selectedBatch.currentStock : 100;

    // Ensure value is within valid range
    const safeValue = Math.max(1, Math.min(maxStock, value || 1));

    setQuantities((prev) => ({
      ...prev,
      [productId]: safeValue,
    }));
  };

  const handleBatchChange = (productId, batchId) => {
    setSelectedBatches((prev) => ({
      ...prev,
      [productId]: batchId,
    }));
  };

  const addToCart = (product, batch, quantityToAdd = 1) => {
    if (!product || !batch) return;

    // Ensure quantity is valid
    const safeQuantity = Math.max(1, parseInt(quantityToAdd) || 1);

    // Check if the requested quantity exceeds available stock
    if (safeQuantity > batch.currentStock) {
      message.error(
        `Cannot add ${safeQuantity} items. Only ${batch.currentStock} in stock.`
      );
      return;
    }

    setCart((prevCart) => {
      // Check if this exact product+batch combination already exists in cart
      const existingItemIndex = prevCart.findIndex(
        (item) => item.productId === product._id && item.batchId === batch._id
      );

      if (existingItemIndex >= 0) {
        // Update existing item
        const updatedCart = [...prevCart];
        const existingItem = updatedCart[existingItemIndex];

        // Check if the new total quantity exceeds available stock
        const newQuantity = existingItem.quantity + safeQuantity;
        if (newQuantity > batch.currentStock) {
          message.error(`Cannot add more. Total would exceed available stock.`);
          return prevCart;
        }

        updatedCart[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          subtotal: existingItem.unitPrice * newQuantity,
        };

        return updatedCart;
      } else {
        // Add new item to cart
        return [
          ...prevCart,
          {
            productId: product._id,
            productName: product.name,
            batchId: batch._id,
            batchNumber: batch.batchNumber,
            expiryDate: batch.expiryDate,
            unitPrice: batch.sellingPrice,
            quantity: safeQuantity,
            subtotal: batch.sellingPrice * safeQuantity,
            discount: 0,
          },
        ];
      }
    });
  };

  const removeFromCart = (productId, batchId) => {
    if (!productId || !batchId) return;

    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex(
        (item) => item.productId === productId && item.batchId === batchId
      );

      if (existingItemIndex === -1) return prevCart;

      const existingItem = prevCart[existingItemIndex];

      if (existingItem.quantity > 1) {
        // Reduce quantity by 1
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex] = {
          ...existingItem,
          quantity: existingItem.quantity - 1,
          subtotal: existingItem.unitPrice * (existingItem.quantity - 1),
        };
        return updatedCart;
      } else {
        // Remove item completely
        return prevCart.filter((_, index) => index !== existingItemIndex);
      }
    });
  };

  const handleCompleteSale = async () => {
    try {
      if (!user?.id) {
        message.error("Staff member information missing");
        return;
      }

      // Prepare sale data according to schema
      const saleData = {
        invoiceNumber,
        items: cart.map((item) => ({
          product: item.productId,
          batch: item.batchId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          subtotal: item.subtotal,
        })),
        subtotal: cartTotal,
        tax: taxAmount,
        total: totalWithTax,
        payment: {
          method: paymentMethod,
          status: "completed",
        },
        staffMember: user._id,
      };

      await createSale(saleData);
      message.success("Sale completed successfully!");
      setPrintModalVisible(false);

      setCompletedSaleData(saleData);
      setActualPrintModalVisible(true);

      setCart([]);
    } catch (error) {
      console.error("Error completing sale:", error);
      message.error("Failed to complete sale");
    }
  };

  const handleModalClose = () => {
    cleanupSpeechRecognition();
    setIsListening(false);
    setVoiceEnabled(false);
    onClose();
  };

  // Memoized rendering components for better performance
  const renderSearchResultItem = (item, index) => (
    <List.Item style={index % 2 === 0 ? { backgroundColor: "#f9f9f9" } : {}}>
      <div style={{ width: "100%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Text strong>{item.name}</Text>{" "}
            {item.batches && item.batches.length > 0 && (
              <>
                <Tag color="blue">
                  Rs.
                  {item.batches
                    .find((b) => b._id === selectedBatches[item._id])
                    ?.sellingPrice.toFixed(2) ||
                    item.batches[0]?.sellingPrice.toFixed(2)}
                </Tag>{" "}
                <Badge
                  count={item.totalStock}
                  style={{
                    backgroundColor:
                      item.totalStock > 30 ? "#52c41a" : "#faad14",
                  }}
                />
              </>
            )}
            <div>
              <Text type="secondary">{item.description}</Text>
            </div>
            {item.batches && item.batches.length > 0 && (
              <div style={{ marginTop: "4px" }}>
                <Select
                  size="small"
                  style={{ width: "180px" }}
                  value={selectedBatches[item._id] || item.batches[0]?._id}
                  onChange={(value) => handleBatchChange(item._id, value)}
                >
                  {item.batches.map((batch) => (
                    <Option key={batch._id} value={batch._id}>
                      Batch #{batch.batchNumber} - Exp:{" "}
                      {new Date(batch.expiryDate).toLocaleDateString()} - Stock:{" "}
                      {batch.currentStock}
                    </Option>
                  ))}
                </Select>
              </div>
            )}
          </div>
          <Space>
            <InputNumber
              min={1}
              max={
                item.batches?.find((b) => b._id === selectedBatches[item._id])
                  ?.currentStock || 100
              }
              value={quantities[item._id] || 1}
              onChange={(value) => updateQuantity(item._id, value)}
              style={{ width: "60px" }}
            />
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => {
                const batch =
                  item.batches?.find(
                    (b) => b._id === selectedBatches[item._id]
                  ) || item.batches?.[0];
                if (batch) {
                  addToCart(item, batch, quantities[item._id] || 1);
                } else {
                  message.error("No valid batch found for this product");
                }
              }}
            >
              Add
            </Button>
          </Space>
        </div>
      </div>
    </List.Item>
  );

  const renderCartItem = (item, index) => (
    <List.Item style={index % 2 === 0 ? { backgroundColor: "#f9f9f9" } : {}}>
      <div style={{ width: "100%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Text strong>{item.productName}</Text>
            <div>
              <Text type="secondary">Batch: {item.batchNumber}</Text>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Text>
              Rs. {item.unitPrice.toFixed(2)} × {item.quantity}
            </Text>
            <Text strong>Rs. {item.subtotal.toFixed(2)}</Text>
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => removeFromCart(item.productId, item.batchId)}
            />
          </div>
        </div>
      </div>
    </List.Item>
  );

  return (
    <Modal
      title={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>Audica Voice POS System</span>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Text type="secondary">Voice Assistant</Text>
            <Tooltip
              title={
                voiceEnabled
                  ? "Disable Voice Assistant"
                  : "Enable Voice Assistant"
              }
            >
              <Switch
                checked={voiceEnabled}
                onChange={toggleVoiceRecognition}
                checkedChildren={<AudioOutlined />}
                unCheckedChildren={<AudioOutlined />}
              />
            </Tooltip>
            <Tooltip title="Auto-restart listening">
              <Switch
                disabled={!voiceEnabled}
                checked={autoRestart}
                onChange={toggleContinuousListening}
                checkedChildren="Auto"
                unCheckedChildren="Auto"
                size="small"
              />
            </Tooltip>
          </div>
        </div>
      }
      open={visible}
      onCancel={handleModalClose}
      width="90%"
      footer={null}
      style={{ top: 20 }}
      destroyOnClose
    >
      <Layout style={{ background: "white" }}>
        <Content>
          <div style={{ display: "flex", height: "calc(100vh - 200px)" }}>
            {/* Left Column - Search and Results */}
            <div
              style={{
                flex: "1 1 60%",
                padding: "0 12px",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ marginBottom: "16px" }}>
                <Input.Search
                  placeholder="Search products by name, description or generic name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onSearch={handleSearch}
                  enterButton={<SearchOutlined />}
                  size="large"
                />
              </div>

              {/* Voice Assistant Status */}
              {voiceEnabled && (
                <Card
                  size="small"
                  style={{ marginBottom: "16px" }}
                  title={
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {isListening ? (
                        <SoundOutlined style={{ color: "#52c41a" }} />
                      ) : (
                        <AudioOutlined
                          style={{ color: processing ? "#faad14" : "#bfbfbf" }}
                        />
                      )}
                      <span>
                        {isListening
                          ? "Listening..."
                          : processing
                          ? "Processing..."
                          : "Ready for commands"}
                      </span>
                    </div>
                  }
                >
                  <div>
                    <Text strong>Last heard:</Text> {transcript}
                  </div>
                  {commandLog.length > 0 && (
                    <div
                      style={{
                        marginTop: "8px",
                        maxHeight: "60px",
                        overflowY: "auto",
                      }}
                    >
                      <Text type="secondary">
                        Last command:{" "}
                        {commandLog[commandLog.length - 1].corrected}
                      </Text>
                    </div>
                  )}
                </Card>
              )}

              {/* Search Results */}
              <Card
                size="small"
                title={`Search Results (${searchResults.length})`}
                style={{
                  flex: 1,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
                bodyStyle={{ padding: 0, overflow: "hidden", flex: 1 }}
              >
                {searchResults.length > 0 ? (
                  <List
                    dataSource={searchResults}
                    renderItem={(item, index) =>
                      renderSearchResultItem(item, index)
                    }
                    style={{ overflowY: "auto", height: "100%" }}
                  />
                ) : (
                  <Empty
                    description="No products found"
                    style={{ padding: "40px 0" }}
                  />
                )}
              </Card>
            </div>

            {/* Right Column - Cart */}
            <div
              style={{
                flex: "1 1 40%",
                padding: "0 12px",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Card
                title={
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>Shopping Cart ({cart.length} items)</span>
                    <div>
                      <Button
                        type="default"
                        icon={<DeleteOutlined />}
                        onClick={() => setCart([])}
                        disabled={cart.length === 0}
                        danger
                      >
                        Clear
                      </Button>
                      <Button
                        type="primary"
                        icon={<PrinterOutlined />}
                        onClick={() => setPrintModalVisible(true)}
                        disabled={cart.length === 0}
                        style={{ marginLeft: "8px" }}
                      >
                        Checkout
                      </Button>
                    </div>
                  </div>
                }
                style={{
                  flex: 1,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
                bodyStyle={{
                  padding: 0,
                  overflow: "hidden",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {cart.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                    }}
                  >
                    <List
                      dataSource={cart}
                      renderItem={(item, index) => renderCartItem(item, index)}
                      style={{ overflowY: "auto", flex: 1 }}
                    />
                    <div
                      style={{
                        padding: "16px",
                        borderTop: "1px solid #f0f0f0",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text>Subtotal:</Text>
                        <Text>Rs. {cartTotal.toFixed(2)}</Text>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          margin: "8px 0",
                        }}
                      >
                        <Text>Tax (0%):</Text>
                        <Text>Rs. {taxAmount.toFixed(2)}</Text>
                      </div>
                      <Divider style={{ margin: "8px 0" }} />
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Title level={4} style={{ margin: 0 }}>
                          Total:
                        </Title>
                        <Title level={4} style={{ margin: 0 }}>
                          Rs. {totalWithTax.toFixed(2)}
                        </Title>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Empty
                    description="Your cart is empty"
                    image={
                      <ShoppingCartOutlined
                        style={{ fontSize: "64px", color: "#d9d9d9" }}
                      />
                    }
                    style={{ padding: "40px 0", margin: "auto" }}
                  />
                )}
              </Card>
            </div>
          </div>
        </Content>
      </Layout>

      {/* Print Bill Modal */}
      <Modal
        title="Complete Sale"
        open={printModalVisible}
        onCancel={() => setPrintModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setPrintModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleCompleteSale}
            loading={processing}
          >
            Complete Sale
          </Button>,
        ]}
      >
        <div style={{ marginBottom: "20px" }}>
          <Title level={4}>Invoice #{invoiceNumber}</Title>
          <Divider style={{ margin: "12px 0" }} />

          <List
            size="small"
            dataSource={cart}
            renderItem={(item) => (
              <List.Item>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  <div>
                    <Text>
                      {item.productName} × {item.quantity}
                    </Text>
                  </div>
                  <Text>Rs. {item.subtotal.toFixed(2)}</Text>
                </div>
              </List.Item>
            )}
            footer={
              <div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <Text>Subtotal:</Text>
                  <Text>Rs. {cartTotal.toFixed(2)}</Text>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    margin: "8px 0",
                  }}
                >
                  <Text>Tax (10%):</Text>
                  <Text>Rs. {taxAmount.toFixed(2)}</Text>
                </div>
                <Divider style={{ margin: "8px 0" }} />
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <Text strong>Total:</Text>
                  <Text strong>Rs. {totalWithTax.toFixed(2)}</Text>
                </div>
              </div>
            }
          />

          <Divider style={{ margin: "16px 0" }} />

          <div style={{ marginTop: "16px" }}>
            <Text strong>Payment Method:</Text>
            <Select
              style={{ width: "100%", marginTop: "8px" }}
              value={paymentMethod}
              onChange={setPaymentMethod}
            >
              <Option value="cash">Cash</Option>
              <Option value="card">Credit/Debit Card</Option>
              <Option value="insurance">Insurance</Option>
              <Option value="mobile">Mobile Payment</Option>
            </Select>
          </div>
        </div>
      </Modal>
      <VoiceReceiptModal
        visible={ActualprintModalVisible}
        onClose={() => setActualPrintModalVisible(false)}
        saleData={completedSaleData}
        invoiceNumber={invoiceNumber}
      />
    </Modal>
  );
};

export default PharmacyPOSModal;
