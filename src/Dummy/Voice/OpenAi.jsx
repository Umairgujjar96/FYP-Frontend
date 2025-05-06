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
  const [storeData, setStoreData] = useState(null);

  // Add this function to handle closing the receipt modal
  const handleCloseReceiptModal = () => {
    setPrintModalVisible(false);
  };
  // Fetch from Zustand stores
  const { products, fetchProducts } = useProductStore();
  const { createSale } = useSaleStore();
  const { user } = useAuthStore();
  console.log(user);
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
    cartRef.current = [...cart]; // Create a new copy to ensure ref is updated
    quantitiesRef.current = quantities;
    printModalVisibleRef.current = printModalVisible;

    console.log("Cart state updated - Length:", cart.length);
    console.log("CartRef updated - Length:", cartRef.current.length);
  }, [
    voiceEnabled,
    autoRestart,
    searchResults,
    cart, // This dependency is important
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

  useEffect(() => {
    cartRef.current = [...cart]; // Create a new copy to ensure ref is updated
    console.log("Cart state updated - Length:", cart.length);
    console.log("CartRef updated - Length:", cartRef.current.length);
  }, [cart]); // This dependency is crucial

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
    const productNames = products.map((p) => p.name.toLowerCase()).join(", ");
    console.log(productNames);
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
                content: `
  You are a voice command processor for a pharmacy POS system.
  
  Your job is to correct misheard voice commands and return ONLY the corrected command without any explanation or extra text.
  
  Correct for spelling, grammar, and recognition errors. Keep the structure and intent intact. Respond in lowercase.
  
  ### Available Commands:
  
  **Search Commands**
  - "search for [medicine name]"
  - "search [medicine name]"
  
  **Selection Commands**
  - "select [number]"
  - "select one"
  
  **Add to Cart Commands**
  - "add to cart"
  - "add item"
  - "add [quantity] to cart"
  - "add [quantity] items to cart"
  - "add [quantity] pieces to cart"
  - "add [quantity] [medicine name]"
  
  **Remove from Cart Commands**
  - "remove from cart"
  - "remove [medicine name]"
  
  **Cart Management Commands**
  - "clear cart"
  - "empty cart"
  
  **Checkout Commands**
  - "print bill"
  - "checkout"
  - "complete sale"
  - "complete"
  
  **System Commands**
  - "close"
  - "exit"
  - "quit"
  
  ### Common Medicine Names:
  - ${productNames}
  
  ### Common Mistakes to Correct:
  - "treadmill" → "print bill"
  - "xarel two" → "xarelto"
  - "zara dhol" → "xaradol"
  - "can i search for panadole" → "search for panadol"
  - "ad two panadol" → "add 2 panadol"
  
  Return only the corrected command (in lowercase), with no quotes or extra text.
              `.trim(),
              },
              {
                role: "user",
                content: `Correct this voice command: "${rawCommand}"`,
              },
            ],
            temperature: 0.3,
            max_tokens: 50,
            stop: ["\n"], // stops after first line
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

    console.log("Command received:", lowerCommand);
    console.log("Current cart state (length):", cart.length);
    console.log("Current cart ref state (length):", cartRef.current.length);

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
    // if (lowerCommand.includes("complete sale") || lowerCommand === "complete") {
    //   if (printModalVisibleRef.current) {
    //     handleCompleteSale();
    //     message.success("Sale completed");
    //   } else {
    //     message.error(
    //       "Please open the checkout first with 'print bill' command"
    //     );
    //   }
    //   return;
    // }

    // Replace the "complete sale" command handling in the executeCommand function
    // Find this section in the executeCommand function:

    // Complete sale command - FIXED: Use ref instead of state for check
    // Complete sale command
    if (lowerCommand.includes("complete sale") || lowerCommand === "complete") {
      // Always use the latest cart state
      if (!cart || cart.length === 0) {
        // Double check cartRef as a fallback
        if (!cartRef.current || cartRef.current.length === 0) {
          message.error("Cart is empty. Nothing to complete.");
          return;
        }
        // If cart state is empty but cartRef has items, sync them
        setCart([...cartRef.current]);
        setTimeout(() => {
          if (mountedRef.current) {
            handleCompleteSale();
            message.success("Sale completed");
          }
        }, 300);
        return;
      }

      if (!printModalVisibleRef.current) {
        // If print modal isn't visible, open it first
        setPrintModalVisible(true);
        // Wait for the modal to appear and state to update
        setTimeout(() => {
          if (mountedRef.current) {
            handleCompleteSale();
            message.success("Sale completed");
          }
        }, 500);
      } else {
        // If print modal is already visible, just complete the sale
        handleCompleteSale();
        message.success("Sale completed");
      }
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

    // Update with a functional state update that maintains state integrity
    setCart((prevCart) => {
      // Check if this exact product+batch combination already exists in cart
      const existingItemIndex = prevCart.findIndex(
        (item) => item.productId === product._id && item.batchId === batch._id
      );

      let updatedCart;
      if (existingItemIndex >= 0) {
        // Update existing item
        updatedCart = [...prevCart];
        const existingItem = updatedCart[existingItemIndex];

        // Check if the new total quantity exceeds available stock
        const newQuantity = existingItem.quantity + safeQuantity;
        if (newQuantity > batch.currentStock) {
          message.error(`Cannot add more. Total would exceed available stock.`);
          return prevCart; // Return unchanged cart
        }

        updatedCart[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          subtotal: existingItem.unitPrice * newQuantity,
        };
      } else {
        // Add new item to cart
        updatedCart = [
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

      // Also update cartRef for immediate access in voice commands
      cartRef.current = updatedCart;
      return updatedCart;
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
      let updatedCart;

      if (existingItem.quantity > 1) {
        // Reduce quantity by 1
        updatedCart = [...prevCart];
        updatedCart[existingItemIndex] = {
          ...existingItem,
          quantity: existingItem.quantity - 1,
          subtotal: existingItem.unitPrice * (existingItem.quantity - 1),
        };
      } else {
        // Remove item completely
        updatedCart = prevCart.filter(
          (_, index) => index !== existingItemIndex
        );
      }

      // Also update cartRef for immediate access
      cartRef.current = updatedCart;
      return updatedCart;
    });
  };

  useEffect(() => {
    const store = localStorage.getItem("store-storage");

    if (store) {
      try {
        const parsedStore = JSON.parse(store);
        setStoreData(parsedStore.state?.currentStore);
      } catch (error) {
        console.error("Failed to parse store-storage:", error);
      }
    } else {
      console.log("No store-storage found in localStorage.");
    }
  }, []);

  // Replace the handleCompleteSale function with this improved version:

  const handleCompleteSale = async () => {
    try {
      console.log(
        "handleCompleteSale called - Current cart state:",
        cart.length
      );
      console.log("Current cart ref state:", cartRef.current.length);

      if (!user?.id) {
        message.error("Staff member information missing");
        return;
      }

      // First check cart state
      let saleItems = [];
      if (cart && cart.length > 0) {
        saleItems = [...cart];
      }
      // If cart state is empty, check cartRef as fallback
      else if (cartRef.current && cartRef.current.length > 0) {
        saleItems = [...cartRef.current];
        // Also sync back to state for consistency
        setCart(saleItems);
      }
      // Both are empty, can't proceed
      else {
        console.error("Sale completion attempted with empty cart");
        message.error("Cannot complete sale with empty cart");
        return;
      }

      console.log(`Preparing sale with ${saleItems.length} items`);

      // Calculate totals based on the selected items
      const saleSubtotal = saleItems.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0
      );
      const saleTax = 0; // Or your tax calculation
      const saleTotal = saleSubtotal + saleTax;

      // Prepare sale data according to schema
      const saleData = {
        invoiceNumber,
        items: saleItems.map((item) => ({
          product: item.productId,
          batch: item.batchId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          subtotal: item.subtotal,
          productName: item.productName, // Add this for the receipt
        })),
        subtotal: saleSubtotal,
        tax: saleTax,
        total: saleTotal,
        payment: {
          method: paymentMethod,
          status: "completed",
        },
        staffMember: user.id,
        staffMemberName: user.firstName,
      };
      const store = localStorage.getItem("store-storage");

      if (store) {
        const parsedStore = JSON.parse(store);
        console.log(parsedStore.state?.currentStore);
        const storeData = parsedStore.state?.currentStore;
      } else {
        console.log("No store found in localStorage");
      }

      console.log(storeData);
      console.log("Submitting sale with items:", saleData.items.length);
      console.log(saleData);
      // Create the sale
      await createSale(saleData);

      message.success("Sale completed successfully!");
      setPrintModalVisible(false);
      console.log("----------------------------------------");
      console.log(completedSaleData);
      console.log("----------------------------------------");
      // DIRECT PRINT: Skip showing the receipt modal and directly print
      printReceipt(saleData, invoiceNumber, storeData);

      // Clear the cart after successful sale
      setCart([]);
      // Also clear cartRef to maintain sync
      cartRef.current = [];
    } catch (error) {
      console.error("Error completing sale:", error);
      message.error(
        `Failed to complete sale: ${error.message || "Unknown error"}`
      );
    }
  };

  // New function to handle direct printing
  const printReceipt = (saleData, invoiceNumber, storeData) => {
    try {
      // Create an invisible iframe for printing instead of opening a new window
      const printFrame = document.createElement("iframe");
      printFrame.style.position = "fixed";
      printFrame.style.right = "0";
      printFrame.style.bottom = "0";
      printFrame.style.width = "0";
      printFrame.style.height = "0";
      printFrame.style.border = "0";
      document.body.appendChild(printFrame);

      // Helper function to format currency
      const formatCurrency = (amount) => {
        return `Rs. ${parseFloat(amount).toFixed(2)}`;
      };

      // Helper function to format date in a more readable way
      const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      };

      // Current date and time
      const now = new Date();
      const dateString = now.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      const timeString = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });

      // Get document from iframe
      const doc = printFrame.contentWindow.document;

      // Get staff name from staffMemberName or find it in storeData
      let staffName = saleData.staffMemberName || "Staff";
      if (!staffName && storeData?.staff && saleData.staffMember) {
        const staffMember = storeData.staff.find(
          (s) => s._id === saleData.staffMember
        );
        if (staffMember) {
          staffName = `${staffMember.firstName} ${staffMember.lastName}`;
        }
      }

      // Write thermal printer optimized receipt with enhanced styling
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Receipt ${invoiceNumber}</title>
            <style>
              /* Enhanced thermal printer optimized styles for XP-C260K */
              body {
                font-family: 'Courier New', monospace;
                width: 80mm; /* Standard thermal paper width for XP-C260K */
                margin: 0;
                padding: 10px 5px;
                font-size: 12px;
                color: black;
                line-height: 1.2;
              }
              .header {
                text-align: center;
                margin-bottom: 10px;
              }
              .logo {
                font-size: 24px;
                font-weight: bold;
                margin: 0;
                letter-spacing: 2px;
                padding: 5px 0;
                border-bottom: 1px solid #000;
                border-top: 1px solid #000;
              }
              .store-name {
                font-size: 20px;
                font-weight: bold;
                margin: 5px 0;
              }
              .store-info {
                margin: 3px 0;
                font-size: 11px;
              }
              .divider {
                border-top: 1px dashed #000;
                margin: 8px 0;
              }
              .thick-divider {
                border-top: 2px solid #000;
                margin: 8px 0;
              }
              .receipt-title {
                text-align: center;
                font-size: 16px;
                font-weight: bold;
                margin: 8px 0;
                padding: 4px;
                border: 1px solid #000;
                border-left: none;
                border-right: none;
              }
              .invoice-details {
                margin: 10px 0;
              }
              .invoice-details .row {
                display: flex;
                justify-content: space-between;
                margin: 3px 0;
              }
              .invoice-details .label {
                font-weight: bold;
              }
              table {
                width: 100%;
                border-collapse: collapse;
              }
              table th {
                text-align: left;
                font-size: 12px;
                padding: 4px 0;
                font-weight: bold;
              }
              table td {
                font-size: 12px;
                padding: 3px 0;
              }
              .item-row td {
                vertical-align: top;
              }
              .total-section {
                margin-top: 8px;
                text-align: right;
              }
              .total-section .row {
                display: flex;
                justify-content: flex-end;
                margin: 3px 0;
              }
              .total-section .label {
                margin-right: 12px;
                font-weight: bold;
                min-width: 80px;
                text-align: right;
              }
              .total-section .value {
                min-width: 80px;
                text-align: right;
              }
              .total-line {
                font-weight: bold;
                font-size: 16px;
              }
              .total-box {
                border: 2px solid #000;
                padding: 5px;
                display: inline-block;
                margin-top: 5px;
              }
              .footer {
                margin-top: 15px;
                text-align: center;
                font-size: 11px;
              }
              .thank-you {
                font-size: 14px;
                font-weight: bold;
                margin: 8px 0;
              }
              .barcode {
                text-align: center;
                margin: 12px 0;
                font-family: 'Liberation Mono', monospace;
                letter-spacing: -1px;
                font-size: 14px;
                padding: 8px 0;
                border-top: 1px solid #000;
                border-bottom: 1px solid #000;
              }
              .item-name {
                font-weight: bold;
              }
              .header-decoration {
                font-size: 16px;
                letter-spacing: 5px;
                padding: 3px 0;
              }
              @media print {
                body {
                  width: 100%;
                }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="header-decoration">************</div>
              <div class="logo">
                ${storeData?.name?.toUpperCase() || "PHARMACY"}
              </div>
              <p class="store-info">${
                storeData?.licenseNumber
                  ? `License: ${storeData.licenseNumber}`
                  : ""
              }</p>
              <p class="store-info">${storeData?.phoneNumber || ""}</p>
              <p class="store-info">${storeData?.email || ""}</p>
              <div class="header-decoration">************</div>
            </div>
            
            <div class="receipt-title">SALES RECEIPT</div>
            
            <div class="invoice-details">
              <div class="row">
                <span class="label">Invoice #:</span>
                <span>${invoiceNumber}</span>
              </div>
              <div class="row">
                <span class="label">Date:</span>
                <span>${dateString} ${timeString}</span>
              </div>
              <div class="row">
                <span class="label">Staff:</span>
                <span>${staffName}</span>
              </div>
              <div class="row">
                <span class="label">Payment:</span>
                <span>${
                  saleData.payment?.method?.toUpperCase() || "CASH"
                }</span>
              </div>
            </div>
            
            <div class="thick-divider"></div>
            
            <table>
              <thead>
                <tr>
                  <th style="width: 50%">ITEM</th>
                  <th style="width: 10%">QTY</th>
                  <th style="width: 20%">PRICE</th>
                  <th style="width: 20%">AMOUNT</th>
                </tr>
              </thead>
            </table>
            
            <div class="divider"></div>
            
            <table>
              <tbody>
                ${saleData.items
                  .map(
                    (item) => `
                  <tr class="item-row">
                    <td style="width: 50%" class="item-name">${
                      item.productName
                    }</td>
                    <td style="width: 10%">${item.quantity}</td>
                    <td style="width: 20%">${formatCurrency(
                      item.unitPrice
                    )}</td>
                    <td style="width: 20%">${formatCurrency(
                      item.unitPrice * item.quantity
                    )}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
            
            <div class="thick-divider"></div>
            
            <div class="total-section">
              <div class="row">
                <span class="label">Subtotal:</span>
                <span class="value">${formatCurrency(saleData.subtotal)}</span>
              </div>
              ${
                saleData.tax > 0
                  ? `
              <div class="row">
                <span class="label">Tax:</span>
                <span class="value">${formatCurrency(saleData.tax)}</span>
              </div>
              `
                  : ""
              }
              <div class="divider"></div>
              <div class="row total-line">
                <span class="label">TOTAL:</span>
                <span class="value total-box">${formatCurrency(
                  saleData.total
                )}</span>
              </div>
            </div>
            
            <div class="thick-divider"></div>
            
            <!-- Enhanced barcode representation -->
            <div class="barcode">
              ||| || ||| | || |||
              ${invoiceNumber}
            </div>
            
            <div class="footer">
              <p class="thank-you">Thank you for your purchase!</p>
              <p>For returns or exchanges, please present</p>
              <p>this receipt within 7 days.</p>
              <div class="divider"></div>
              <p>${new Date().toISOString().split("T")[0]}</p>
            </div>
          </body>
        </html>
      `);

      // Close the document and focus on the frame
      doc.close();
      printFrame.contentWindow.focus();

      // Print after a short delay to ensure content is loaded
      setTimeout(() => {
        printFrame.contentWindow.print();

        // Remove the iframe after printing (delayed to ensure print completes)
        setTimeout(() => {
          document.body.removeChild(printFrame);
        }, 1000);
      }, 500);

      return true;
    } catch (error) {
      console.error("Error printing receipt:", error);
      alert("There was an error printing the receipt. Please try again.");
      return false;
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
              {/* <Option value="insurance">Insurance</Option> */}
              <Option value="mobileBanking">Mobile Payment</Option>
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
