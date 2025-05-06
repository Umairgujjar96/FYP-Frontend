// Thermal Printer Service using Web Serial API
class ThermalPrinterService {
  constructor() {
    this.port = null;
    this.writer = null;
    this.reader = null;
    this.readableStreamClosed = null;
    this.writableStreamClosed = null;
    this.isConnected = false;
  }

  // Connect to the printer
  async connect() {
    try {
      // Check if Web Serial API is supported
      if (!navigator.serial) {
        throw new Error(
          "Web Serial API not supported in this browser. Try Chrome or Edge."
        );
      }

      // Request port access
      this.port = await navigator.serial.requestPort();

      // Open the port with common settings for thermal printers
      // Note: You may need to adjust these settings based on your specific printer model
      await this.port.open({
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: "none",
        bufferSize: 4096,
        flowControl: "none",
      });

      // Create reader and writer
      const textEncoder = new TextEncoder();
      const textDecoder = new TextDecoder();

      this.writer = this.port.writable.getWriter();
      this.reader = this.port.readable.getReader();

      this.isConnected = true;
      console.log("Connected to thermal printer");
      return true;
    } catch (error) {
      console.error("Failed to connect to printer:", error);
      this.isConnected = false;
      throw error;
    }
  }

  // Disconnect from the printer
  async disconnect() {
    if (!this.isConnected) return;

    try {
      // Release the writer
      if (this.writer) {
        this.writer.releaseLock();
        this.writer = null;
      }

      // Release the reader
      if (this.reader) {
        this.reader.releaseLock();
        this.reader = null;
      }

      // Close the port
      if (this.port) {
        await this.port.close();
        this.port = null;
      }

      this.isConnected = false;
      console.log("Disconnected from thermal printer");
    } catch (error) {
      console.error("Error disconnecting from printer:", error);
      throw error;
    }
  }

  // Send raw commands to the printer
  async sendCommand(command) {
    if (!this.isConnected || !this.writer) {
      throw new Error("Printer not connected. Call connect() first.");
    }

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(command);
      await this.writer.write(data);
      return true;
    } catch (error) {
      console.error("Error sending command to printer:", error);
      throw error;
    }
  }

  // Initialize printer
  async initialize() {
    // ESC @ command initializes the printer
    return this.sendCommand("\x1B@");
  }

  // Feed lines
  async feedLines(lines = 1) {
    // ESC d n command feeds n lines
    return this.sendCommand(`\x1Bd${String.fromCharCode(lines)}`);
  }

  // Cut paper (if printer supports it)
  async cutPaper() {
    // GS V command cuts the paper
    return this.sendCommand("\x1DV\x41\x03");
  }

  // Set text size (1-8)
  async setTextSize(size = 1) {
    if (size < 1 || size > 8) size = 1;
    const sizeCommand = String.fromCharCode(
      ((size - 1) & 0x07) | (((size - 1) & 0x07) << 4)
    );
    return this.sendCommand(`\x1D!${sizeCommand}`);
  }

  // Print text
  async printText(text) {
    return this.sendCommand(text);
  }

  // Print and feed one line
  async printLine(text) {
    await this.printText(text);
    return this.sendCommand("\n");
  }

  // Center text
  async centerText() {
    // ESC a 1 centers text
    return this.sendCommand("\x1Ba\x01");
  }

  // Left align text
  async leftAlign() {
    // ESC a 0 left aligns text
    return this.sendCommand("\x1Ba\x00");
  }

  // Right align text
  async rightAlign() {
    // ESC a 2 right aligns text
    return this.sendCommand("\x1Ba\x02");
  }

  // Bold text on
  async boldOn() {
    return this.sendCommand("\x1BE\x01");
  }

  // Bold text off
  async boldOff() {
    return this.sendCommand("\x1BE\x00");
  }

  // Double height on
  async doubleHeightOn() {
    return this.sendCommand("\x1B!\x10");
  }

  // Double height off
  async doubleHeightOff() {
    return this.sendCommand("\x1B!\x00");
  }
}

// Function to print receipt directly to thermal printer
async function printReceiptThermal(saleData, invoiceNumber) {
  // Create printer service instance
  const printer = new ThermalPrinterService();

  try {
    // Format currency helper
    const formatCurrency = (amount) => {
      return `Rs. ${parseFloat(amount).toFixed(2)}`;
    };

    // Connect to printer
    await printer.connect();

    // Initialize printer
    await printer.initialize();

    // Print header
    await printer.centerText();
    await printer.boldOn();
    await printer.doubleHeightOn();
    await printer.printLine("Pharmacy Receipt");
    await printer.doubleHeightOff();
    await printer.printLine(invoiceNumber);
    await printer.boldOff();
    await printer.printLine(new Date().toLocaleString());
    await printer.feedLines(1);

    // Print invoice details
    await printer.leftAlign();
    await printer.printLine(
      `Payment Method: ${saleData.payment?.method || "Cash"}`
    );
    await printer.printLine(`Staff: ${saleData.staffMember?.name || "Staff"}`);
    await printer.feedLines(1);

    // Print table header
    await printer.boldOn();
    await printer.printText("Item                  ");
    await printer.printText("Qty ");
    await printer.printText("Price    ");
    await printer.printLine("Amount   ");
    await printer.boldOff();

    // Print dashed line
    await printer.printLine("--------------------------------");

    // Print items
    for (const item of saleData.items) {
      // Truncate product name if too long
      let productName = item.productName;
      if (productName.length > 18) {
        productName = productName.substring(0, 15) + "...";
      } else {
        // Pad with spaces to align columns
        productName = productName.padEnd(20, " ");
      }

      const quantity = String(item.quantity).padEnd(3, " ");
      const unitPrice = formatCurrency(item.unitPrice).padEnd(8, " ");
      const amount = formatCurrency(item.unitPrice * item.quantity);

      await printer.printText(productName);
      await printer.printText(quantity);
      await printer.printText(unitPrice);
      await printer.printLine(amount);
    }

    // Print dashed line
    await printer.printLine("--------------------------------");

    // Print totals
    await printer.rightAlign();
    await printer.printLine(`Subtotal: ${formatCurrency(saleData.subtotal)}`);
    await printer.printLine(`Tax: ${formatCurrency(saleData.tax)}`);
    await printer.boldOn();
    await printer.printLine(`Total: ${formatCurrency(saleData.total)}`);
    await printer.boldOff();
    await printer.feedLines(1);

    // Print footer
    await printer.centerText();
    await printer.printLine("Thank you for your purchase!");
    await printer.printLine("For returns or exchanges,");
    await printer.printLine("please bring this receipt within 7 days.");

    // Feed paper and cut
    await printer.feedLines(3);
    await printer.cutPaper();

    // Disconnect from printer
    await printer.disconnect();

    return true;
  } catch (error) {
    console.error("Error printing to thermal printer:", error);

    // Try to disconnect if connection was established
    try {
      if (printer.isConnected) {
        await printer.disconnect();
      }
    } catch (disconnectError) {
      console.error("Error disconnecting:", disconnectError);
    }

    // Show error to user
    alert(
      `Printer error: ${error.message}. Please check your printer connection.`
    );
    return false;
  }
}

export { ThermalPrinterService, printReceiptThermal };
