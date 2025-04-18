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

const { Title, Text } = Typography;
const { Content } = Layout;

// Dummy product data
const dummyProducts = [
  {
    id: 1,
    name: "Panadol",
    price: 5.99,
    stock: 50,
    description: "Pain reliever and fever reducer",
  },
  {
    id: 2,
    name: "Xarelto",
    price: 25.99,
    stock: 20,
    description: "Blood thinner medication",
  },
  {
    id: 3,
    name: "Aspirin",
    price: 4.5,
    stock: 100,
    description: "Pain reliever and blood thinner",
  },
  {
    id: 4,
    name: "Ibuprofen",
    price: 6.75,
    stock: 75,
    description: "Non-steroidal anti-inflammatory drug",
  },
  {
    id: 5,
    name: "Zoloft",
    price: 15.25,
    stock: 30,
    description: "Antidepressant medication",
  },
  {
    id: 6,
    name: "Lipitor",
    price: 18.99,
    stock: 25,
    description: "Cholesterol-lowering medication",
  },
  {
    id: 7,
    name: "Metformin",
    price: 8.5,
    stock: 60,
    description: "Type 2 diabetes medication",
  },
  {
    id: 8,
    name: "Amoxicillin",
    price: 12.35,
    stock: 40,
    description: "Antibiotic",
  },
  {
    id: 9,
    name: "Ventolin",
    price: 22.99,
    stock: 15,
    description: "Asthma inhaler",
  },
  {
    id: 10,
    name: "Loratadine",
    price: 7.25,
    stock: 80,
    description: "Antihistamine for allergies",
  },
];

const PharmacyPOSModal = ({ visible, onClose }) => {
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
  const openAiKey = "Key is here"; // Should be stored securely

  // Create stable refs to prevent cleanup issues
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

  // Update ref values when state changes
  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
    autoRestartRef.current = autoRestart;
    searchResultsRef.current = searchResults;
    cartRef.current = cart;
    quantitiesRef.current = quantities;
  }, [voiceEnabled, autoRestart, searchResults, cart, quantities]);

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Initialize Web Speech API
  useEffect(() => {
    // Set mounted ref to true when component mounts
    mountedRef.current = true;

    // Only setup speech recognition when visible and supported
    if (!visible) return;

    // Cleanup function to be called on unmount or when dependencies change
    return () => {
      // Mark component as unmounted
      mountedRef.current = false;

      // Clear any pending timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Stop speech recognition if it's running
      cleanupSpeechRecognition();
    };
  }, [visible]);

  // Setup effect for speech recognition
  useEffect(() => {
    // Skip if component isn't visible or speech recognition is already set up
    if (!visible) return;

    setupSpeechRecognition();

    // Return cleanup function
    return cleanupSpeechRecognition;
  }, [visible, voiceEnabled]);

  // Initialize quantity state for search results
  useEffect(() => {
    const newQuantities = {};
    searchResults.forEach((item) => {
      // Keep existing quantity if it exists, otherwise default to 1
      newQuantities[item.id] = quantities[item.id] || 1;
    });
    setQuantities(newQuantities);
  }, [searchResults]);

  // Function to setup speech recognition
  const setupSpeechRecognition = () => {
    // Clean up any existing instance first
    cleanupSpeechRecognition();

    try {
      // Only setup if browser supports it
      if (
        typeof window !== "undefined" &&
        ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
      ) {
        const SpeechRecognition =
          window.SpeechRecognition || window.webkitSpeechRecognition;

        // Create new recognition instance
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = "en-US";

        // Setup event handlers with proper error checking
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

          if (event.error === "aborted") {
            // This is an expected error when we intentionally abort
            return;
          } else if (event.error !== "no-speech") {
            setTranscript(`Error: ${event.error}`);
            message.error(
              `Speech recognition error: ${event.error}. Please try again.`,
              1
            );
          } else {
            setTranscript("No speech detected. Ready for commands...");
          }

          // Only restart if component is mounted and voice is enabled
          if (
            mountedRef.current &&
            voiceEnabledRef.current &&
            autoRestartRef.current &&
            !commandProcessingRef.current
          ) {
            // Use our timeout ref for better cleanup
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
              timeoutRef.current = null;
              if (mountedRef.current && voiceEnabledRef.current) {
                startListening();
              }
            }, 1000);
          }
        };

        recognitionRef.current.onend = () => {
          if (!mountedRef.current) return;

          setIsListening(false);

          // Only restart if component is mounted and voice is enabled
          if (
            mountedRef.current &&
            voiceEnabledRef.current &&
            autoRestartRef.current &&
            !commandProcessingRef.current
          ) {
            // Use our timeout ref for better cleanup
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
              timeoutRef.current = null;
              if (mountedRef.current && voiceEnabledRef.current) {
                startListening();
              }
            }, 1000);
          }
        };

        // Start listening if voice is enabled
        if (voiceEnabled && autoRestart) {
          startListening();
        }
      } else {
        console.warn("Speech recognition is not supported in this browser.");
        if (typeof window !== "undefined") {
          message.error("Speech recognition is not supported in this browser.");
        }
      }
    } catch (error) {
      console.error("Error initializing speech recognition:", error);
      message.error("Failed to initialize speech recognition.");
    }
  };

  // Clean up function for speech recognition
  const cleanupSpeechRecognition = () => {
    // Clear any pending timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Abort recognition if it exists
    if (recognitionRef.current) {
      try {
        // Try to abort the recognition
        recognitionRef.current.abort();
      } catch (error) {
        // Ignore errors during cleanup
        console.log("Could not abort speech recognition:", error);
      } finally {
        // Always clear the reference
        recognitionRef.current = null;
      }
    }
  };

  const processVoiceCommand = async (rawCommand) => {
    if (!rawCommand || rawCommand.trim() === "") return;
    if (!mountedRef.current) return;

    // Prevent duplicate command processing
    if (rawCommand === lastCommandRef.current) {
      return;
    }

    lastCommandRef.current = rawCommand;
    commandProcessingRef.current = true;
    setProcessing(true);

    try {
      // Simple command preprocessing - no need for API in many cases
      let commandToProcess = rawCommand.toLowerCase().trim();
      let needsAICorrection = true;

      // Direct command matching for common actions
      if (
        commandToProcess === "clear cart" ||
        commandToProcess === "clear the cart" ||
        commandToProcess === "empty cart"
      ) {
        commandToProcess = "clear cart";
        needsAICorrection = false;
      } else if (
        commandToProcess === "print bill" ||
        commandToProcess === "print the bill" ||
        commandToProcess === "checkout"
      ) {
        commandToProcess = "print bill";
        needsAICorrection = false;
      } else if (
        commandToProcess === "close" ||
        commandToProcess === "exit" ||
        commandToProcess === "quit"
      ) {
        commandToProcess = "close";
        needsAICorrection = false;
      } else if (
        commandToProcess === "add to cart" ||
        commandToProcess === "add item" ||
        commandToProcess === "add this item"
      ) {
        commandToProcess = "add to cart";
        needsAICorrection = false;
      } else if (
        /^add (\d+)( to cart)?$/.test(commandToProcess) ||
        /^add (\d+) (items?|pieces?)( to cart)?$/.test(commandToProcess)
      ) {
        // Handle quantity specifications like "add 3 to cart" or "add 5 items"
        needsAICorrection = false;
      } else if (
        commandToProcess === "select one" ||
        commandToProcess === "select 1" ||
        /^select (one|1)$/.test(commandToProcess)
      ) {
        // Explicitly handle "select one" or "select 1"
        commandToProcess = "select 1";
        needsAICorrection = false;
      } else if (
        commandToProcess.startsWith("select ") &&
        /\d+$/.test(commandToProcess)
      ) {
        needsAICorrection = false;
      } else if (
        commandToProcess.startsWith("search for ") ||
        commandToProcess.startsWith("search ")
      ) {
        needsAICorrection = false;
      }

      // Only use API for complex or ambiguous commands
      const correctedCommand =
        needsAICorrection && openAiKey && openAiKey !== "YOUR_API_KEY"
          ? await correctWithOpenAI(rawCommand)
          : commandToProcess;

      // Log the command if component is still mounted
      if (mountedRef.current) {
        setCommandLog((prev) => [
          ...prev,
          {
            raw: rawCommand,
            corrected: correctedCommand,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);

        // Execute the command
        await executeCommand(correctedCommand);
      }
    } catch (error) {
      console.error("Error processing command:", error);
      if (mountedRef.current) {
        message.error("Error processing voice command");
      }
    } finally {
      // Only update state if component is still mounted
      if (mountedRef.current) {
        setProcessing(false);
      }
      commandProcessingRef.current = false;

      // Reset last command after a delay
      setTimeout(() => {
        lastCommandRef.current = "";
      }, 1000);

      // Restart listening after command is processed if still mounted
      if (
        mountedRef.current &&
        voiceEnabledRef.current &&
        autoRestartRef.current
      ) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          timeoutRef.current = null;
          if (mountedRef.current && voiceEnabledRef.current) {
            startListening();
          }
        }, 1000);
      }
    }
  };

  const correctWithOpenAI = async (rawCommand) => {
    if (!openAiKey || openAiKey === "YOUR_API_KEY") {
      console.warn("OpenAI key not provided, using basic command processing");
      return rawCommand.toLowerCase().trim();
    }

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
                        "remove from cart", "select [number]", "print bill", "clear cart", "close".
                        Common medicines include: panadol, xarelto, aspirin, ibuprofen, etc.`,
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

  // Execute the command
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

    // Select command - Fixed to handle "select one" and "select 1" properly
    if (lowerCommand.startsWith("select")) {
      const match = lowerCommand.match(/select (\d+|one)/i);
      if (match && match[1]) {
        // Convert "one" to 1 if needed
        const indexStr = match[1].toLowerCase() === "one" ? "1" : match[1];
        const index = parseInt(indexStr) - 1;

        // Use the ref instead of the state to ensure we have the latest value
        const currentSearchResults = searchResultsRef.current;
        const currentQuantities = quantitiesRef.current;

        // Check if index is valid
        if (index >= 0 && index < currentSearchResults.length) {
          const productToAdd = currentSearchResults[index];
          const quantity = currentQuantities[productToAdd.id] || 1;

          addToCart(productToAdd, quantity);
          message.success(`Added ${quantity} ${productToAdd.name} to cart`);
        } else {
          message.error(`Item #${indexStr} not found in search results`);
        }
      }
      return;
    }

    // Handle add with quantity commands
    // Match patterns like "add 3 to cart", "add 5 items", etc.
    const addWithQuantityMatch = lowerCommand.match(
      /add (\d+)( items?| pieces?)?( to cart)?/
    );
    if (addWithQuantityMatch) {
      const quantity = parseInt(addWithQuantityMatch[1]);
      const currentSearchResults = searchResultsRef.current;

      if (currentSearchResults.length > 0) {
        const productToAdd = currentSearchResults[0];
        addToCart(productToAdd, quantity);
        message.success(`Added ${quantity} ${productToAdd.name} to cart`);
      } else {
        message.error("Please search for a product first");
      }
      return;
    }

    // Add to cart command (default quantity = 1)
    if (lowerCommand.includes("add to cart") || lowerCommand === "add item") {
      const currentSearchResults = searchResultsRef.current;
      if (currentSearchResults.length > 0) {
        addToCart(currentSearchResults[0], 1);
        message.success(`Added ${currentSearchResults[0].name} to cart`);
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

        for (let i = 0; i < itemWords.length; i++) {
          if (itemWords[i].length < 3) continue; // Skip short words

          const matchedItem = currentCart.find((item) =>
            item.name.toLowerCase().includes(itemWords[i].toLowerCase())
          );

          if (matchedItem) {
            removeFromCart(matchedItem.id);
            message.success(`Removed ${matchedItem.name} from cart`);
            itemFound = true;
            break;
          }
        }

        // Default: remove last item if no specific item was found
        if (!itemFound) {
          const lastItem = currentCart[currentCart.length - 1];
          removeFromCart(lastItem.id);
          message.success(`Removed ${lastItem.name} from cart`);
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

    // Print bill command - Fixed to use the ref instead of state
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

  // Start voice recognition with better error handling
  const startListening = () => {
    // Don't try to start if already listening or processing
    if (
      isListening ||
      commandProcessingRef.current ||
      !voiceEnabledRef.current
    ) {
      return;
    }

    // Don't try to start if recognition doesn't exist
    if (!recognitionRef.current) {
      setupSpeechRecognition();
      // Give time for setup to complete
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

  // Internal function to actually start listening
  const startListeningInternal = () => {
    try {
      recognitionRef.current.start();
    } catch (error) {
      console.log("Error starting recognition:", error);

      // If we get an error about already running
      if (error.name === "InvalidStateError") {
        // Try to abort and restart
        try {
          recognitionRef.current.abort();
          // Wait a bit before trying again
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

  // Toggle voice recognition
  const toggleVoiceRecognition = (enabled) => {
    setVoiceEnabled(enabled);

    if (enabled) {
      // Small delay to ensure state updates first
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

  // Toggle continuous listening
  const toggleContinuousListening = (checked) => {
    setAutoRestart(checked);

    // If turning on continuous listening and voice is enabled, start listening
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

  // Search for products
  const handleSearch = (query) => {
    if (!query || !query.trim()) {
      setSearchResults([]);
      return;
    }

    const filtered = dummyProducts.filter(
      (product) =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase())
    );

    setSearchResults(filtered);
  };

  // Update quantity for a product
  const updateQuantity = (productId, value) => {
    // Ensure value is within valid range
    const safeValue = Math.max(1, Math.min(100, value || 1));

    setQuantities((prev) => ({
      ...prev,
      [productId]: safeValue,
    }));
  };

  // Add product to cart with specified quantity
  const addToCart = (product, quantityToAdd = 1) => {
    if (!product) return; // Guard against null/undefined product

    // Ensure quantity is a valid number and greater than 0
    const safeQuantity = Math.max(1, parseInt(quantityToAdd) || 1);

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + safeQuantity }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: safeQuantity }];
      }
    });
  };

  // Remove product from cart
  const removeFromCart = (productId) => {
    if (!productId) return; // Guard against null/undefined productId

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === productId);

      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      } else {
        return prevCart.filter((item) => item.id !== productId);
      }
    });
  };

  // Handle printing the bill
  const handlePrint = () => {
    message.success("Bill printed successfully!");
    setPrintModalVisible(false);
    setCart([]);
  };

  // Handle modal close with proper cleanup
  const handleModalClose = () => {
    // Clean up speech recognition
    cleanupSpeechRecognition();
    setIsListening(false);
    setVoiceEnabled(false);
    onClose();
  };

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
            <Text type="secondary">Voice:</Text>
            <Switch
              checked={voiceEnabled}
              onChange={toggleVoiceRecognition}
              size="small"
            />
            {voiceEnabled && (
              <>
                <Text type="secondary" style={{ marginLeft: "8px" }}>
                  Continuous:
                </Text>
                <Switch
                  checked={autoRestart}
                  onChange={toggleContinuousListening}
                  size="small"
                />
              </>
            )}
          </div>
        </div>
      }
      open={visible}
      onCancel={handleModalClose}
      footer={null}
      width={800}
      bodyStyle={{ padding: "12px" }}
    >
      <Layout>
        <Content>
          {/* Voice Status Bar */}
          {voiceEnabled && (
            <div
              style={{
                padding: "8px",
                marginBottom: "16px",
                borderRadius: "8px",
                textAlign: "center",
                backgroundColor: isListening ? "#e6f7ff" : "#f5f5f5",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: isListening ? "#ff4d4f" : "#d9d9d9",
                    animation: isListening ? "pulse 2s infinite" : "none",
                  }}
                ></span>
                <Text strong style={{ marginLeft: "8px", marginRight: "8px" }}>
                  {isListening ? "Listening..." : "Ready"}
                </Text>
                {processing && <Spin size="small" />}
              </div>
              <div
                style={{
                  marginTop: "4px",
                  backgroundColor: "white",
                  borderRadius: "4px",
                  border: "1px solid #d9d9d9",
                  padding: "8px",
                }}
              >
                {transcript ? (
                  <Text>{transcript}</Text>
                ) : (
                  <Text type="secondary">
                    Say "search for panadol" or "add 3 to cart"
                  </Text>
                )}
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "16px",
            }}
          >
            <Input
              size="middle"
              placeholder="Search for medicines..."
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              style={{ flexGrow: 1 }}
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={() => handleSearch(searchQuery)}
            >
              Search
            </Button>
          </div>

          {/* Main Content Area */}
          <div style={{ display: "flex", gap: "16px" }}>
            {/* Search Results */}
            <div style={{ flex: 1 }}>
              <Card
                title="Search Results"
                size="small"
                style={{ maxHeight: "300px", overflow: "auto" }}
              >
                {searchResults.length === 0 ? (
                  <Empty
                    description="No products found"
                    style={{ margin: "16px 0" }}
                  />
                ) : (
                  <List
                    dataSource={searchResults}
                    renderItem={(item, index) => (
                      <List.Item
                        style={
                          index % 2 === 0 ? { backgroundColor: "#f9f9f9" } : {}
                        }
                      >
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
                              <Tag color="blue">${item.price.toFixed(2)}</Tag>{" "}
                              <Badge
                                count={item.stock}
                                style={{
                                  backgroundColor:
                                    item.stock > 30 ? "#52c41a" : "#faad14",
                                }}
                              />
                              <div>
                                <Text type="secondary">{item.description}</Text>
                              </div>
                            </div>
                            <div style={{ marginLeft: "8px" }}>
                              <Space>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                >
                                  <Button
                                    type="text"
                                    size="small"
                                    icon={<MinusOutlined />}
                                    onClick={() =>
                                      updateQuantity(
                                        item.id,
                                        (quantities[item.id] || 1) - 1
                                      )
                                    }
                                    disabled={(quantities[item.id] || 1) <= 1}
                                  />
                                  <InputNumber
                                    min={1}
                                    max={item.stock}
                                    size="small"
                                    value={quantities[item.id] || 1}
                                    onChange={(value) =>
                                      updateQuantity(item.id, value)
                                    }
                                    style={{ width: "50px" }}
                                  />
                                  <Button
                                    type="text"
                                    size="small"
                                    icon={<PlusOutlined />}
                                    onClick={() =>
                                      updateQuantity(
                                        item.id,
                                        (quantities[item.id] || 1) + 1
                                      )
                                    }
                                    disabled={
                                      (quantities[item.id] || 1) >= item.stock
                                    }
                                  />
                                </div>
                                <Tooltip title={`Select item #${index + 1}`}>
                                  <Button
                                    type="primary"
                                    size="small"
                                    icon={<ShoppingCartOutlined />}
                                    onClick={() =>
                                      addToCart(item, quantities[item.id] || 1)
                                    }
                                  >
                                    Add #{index + 1}
                                  </Button>
                                </Tooltip>
                              </Space>
                            </div>
                          </div>
                        </div>
                      </List.Item>
                    )}
                  />
                )}
              </Card>
            </div>

            {/* Shopping Cart */}
            <div style={{ flex: 1 }}>
              <Card
                title={
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>Cart</span>
                    <Text type="secondary">
                      {cart.length} {cart.length === 1 ? "item" : "items"}
                    </Text>
                  </div>
                }
                size="small"
                style={{ maxHeight: "300px", overflow: "auto" }}
                extra={
                  <Button
                    type="text"
                    danger
                    disabled={cart.length === 0}
                    icon={<DeleteOutlined />}
                    onClick={() => setCart([])}
                  >
                    Clear
                  </Button>
                }
              >
                {cart.length === 0 ? (
                  <Empty
                    description="Cart is empty"
                    style={{ margin: "16px 0" }}
                  />
                ) : (
                  <List
                    dataSource={cart}
                    renderItem={(item) => (
                      <List.Item>
                        <div style={{ width: "100%" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div>
                              <Text strong>{item.name}</Text>
                              <div>
                                <Text type="secondary">
                                  ${item.price.toFixed(2)} x {item.quantity} ={" "}
                                  <Text strong>
                                    ${(item.price * item.quantity).toFixed(2)}
                                  </Text>
                                </Text>
                              </div>
                            </div>
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => removeFromCart(item.id)}
                            />
                          </div>
                        </div>
                      </List.Item>
                    )}
                  />
                )}
              </Card>

              {/* Cart Total and Action Buttons */}
              <div
                style={{
                  textAlign: "right",
                  padding: "12px",
                  borderRadius: "8px",
                  backgroundColor: "#f5f5f5",
                  marginTop: "16px",
                }}
              >
                <div style={{ marginBottom: "8px" }}>
                  <Text strong style={{ fontSize: "16px" }}>
                    Total: ${cartTotal.toFixed(2)}
                  </Text>
                </div>
                <Space>
                  <Button
                    type="default"
                    icon={<AudioOutlined />}
                    onClick={startListening}
                    disabled={!voiceEnabled || isListening}
                  >
                    Listen
                  </Button>
                  <Button
                    type="primary"
                    icon={<PrinterOutlined />}
                    onClick={() => setPrintModalVisible(true)}
                    disabled={cart.length === 0}
                  >
                    Print Bill
                  </Button>
                </Space>
              </div>
            </div>
          </div>

          {/* Voice Command Logs */}
          {voiceEnabled && commandLog.length > 0 && (
            <div style={{ marginTop: "16px" }}>
              <Divider orientation="left">Voice Command Log</Divider>
              <List
                size="small"
                style={{
                  maxHeight: "100px",
                  overflow: "auto",
                  border: "1px solid #d9d9d9",
                  borderRadius: "8px",
                }}
                dataSource={commandLog.slice(-5).reverse()}
                renderItem={(log) => (
                  <List.Item>
                    <Text type="secondary">{log.timestamp}:</Text>{" "}
                    <Text>{log.raw}</Text>{" "}
                    {log.raw !== log.corrected && (
                      <>
                        <SoundOutlined style={{ color: "#1890ff" }} />
                        <Text type="secondary">→</Text>{" "}
                        <Text strong>{log.corrected}</Text>
                      </>
                    )}
                  </List.Item>
                )}
              />
            </div>
          )}

          {/* Print Receipt Modal */}
          <Modal
            title="Bill Receipt"
            open={printModalVisible}
            onCancel={() => setPrintModalVisible(false)}
            footer={[
              <Button key="back" onClick={() => setPrintModalVisible(false)}>
                Cancel
              </Button>,
              <Button
                key="submit"
                type="primary"
                icon={<PrinterOutlined />}
                onClick={handlePrint}
              >
                Print & Complete Sale
              </Button>,
            ]}
          >
            <div
              style={{
                padding: "16px",
                border: "1px dashed #d9d9d9",
                borderRadius: "8px",
              }}
            >
              <div style={{ textAlign: "center", marginBottom: "16px" }}>
                <Title level={4}>Audica Pharmacy</Title>
                <Text>123 Health Street, Medville</Text>
                <br />
                <Text>Receipt #{Math.floor(Math.random() * 10000)}</Text>
                <br />
                <Text>{new Date().toLocaleString()}</Text>
              </div>
              <Divider style={{ margin: "12px 0" }} />
              <List
                dataSource={cart}
                renderItem={(item) => (
                  <List.Item
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "4px 0",
                    }}
                  >
                    <div>
                      <Text>{item.name}</Text>
                      <Text type="secondary">
                        {" "}
                        x {item.quantity} @ ${item.price.toFixed(2)}
                      </Text>
                    </div>
                    <Text>${(item.price * item.quantity).toFixed(2)}</Text>
                  </List.Item>
                )}
              />
              <Divider style={{ margin: "12px 0" }} />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <Text strong>Subtotal:</Text>
                <Text>${cartTotal.toFixed(2)}</Text>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <Text>Tax (10%):</Text>
                <Text>${(cartTotal * 0.1).toFixed(2)}</Text>
              </div>
              <Divider style={{ margin: "12px 0" }} dashed />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "16px",
                }}
              >
                <Text strong>Total:</Text>
                <Text strong>${(cartTotal * 1.1).toFixed(2)}</Text>
              </div>
              <Divider style={{ margin: "12px 0" }} />
              <div style={{ textAlign: "center" }}>
                <Text type="secondary">Thank you for your purchase!</Text>
              </div>
            </div>
          </Modal>
        </Content>
      </Layout>
    </Modal>
  );
};

export default PharmacyPOSModal;
