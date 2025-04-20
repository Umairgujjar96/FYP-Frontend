import React, { useRef } from "react";

const ReceiptPrinter = ({ saleData, storeInfo, onClose }) => {
  // Create a ref for the printable content
  const receiptRef = useRef(null);

  // Handle printing using the browser's native print functionality
  const handlePrint = () => {
    const content = receiptRef.current;

    if (!content) {
      console.error("Print content not found");
      return;
    }

    // Create a new window for printing
    const printWindow = window.open("", "_blank", "height=600,width=800");

    if (!printWindow) {
      alert("Please allow pop-ups to print receipts");
      return;
    }

    // Create the print document
    printWindow.document.write("<html><head><title>Print Receipt</title>");

    // Add styles specifically for 80mm thermal receipt printer
    printWindow.document.write(`
      <style>
        @page {
          size: 80mm auto; /* 80mm wide, dynamic height */
          margin: 0; /* No margin */
        }
        
        body {
          font-family: Arial, sans-serif;
          width: 80mm; /* Total width */
          margin: 0;
          padding: 8px;
          box-sizing: border-box;
          /* Actual print area after padding is ~72mm */
        }
        
        .receipt-header {
          text-align: center;
          margin-bottom: 10px;
        }
        
        .receipt-header h1 {
          font-size: 16px;
          margin: 0 0 4px 0;
          font-weight: bold;
        }
        
        .receipt-header p {
          margin: 2px 0;
          font-size: 12px;
        }
        
        .receipt-info {
          border-top: 1px dashed #000;
          border-bottom: 1px dashed #000;
          padding: 5px 0;
          margin-bottom: 10px;
          font-size: 12px;
        }
        
        .receipt-info div {
          display: flex;
          justify-content: space-between;
          margin: 2px 0;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
          font-size: 12px;
        }
        
        th {
          text-align: left;
          border-bottom: 1px solid #000;
          padding: 2px 0;
        }
        
        td {
          padding: 2px 0;
        }
        
        .text-center {
          text-align: center;
        }
        
        .text-right {
          text-align: right;
        }
        
        .total-section {
          margin: 10px 0;
          font-size: 12px;
        }
        
        .total-section div {
          display: flex;
          justify-content: space-between;
          margin: 2px 0;
        }
        
        .total-line {
          border-top: 1px solid #000;
          font-weight: bold;
          padding-top: 2px;
        }
        
        .footer {
          text-align: center;
          margin-top: 15px;
          font-size: 11px;
          border-top: 1px dashed #000;
          padding-top: 5px;
        }
        
        .footer p {
          margin: 2px 0;
        }
        
        /* Ensure no scaling occurs during print */
        @media print {
          html, body {
            width: 80mm;
            height: auto;
            overflow: hidden;
          }
          
          /* Prevent browser scaling */
          * {
            transform-origin: top left;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      </style>
    `);

    printWindow.document.write("</head><body>");

    // Copy the content from the ref
    printWindow.document.write(`
      <div class="receipt-header">
        <h1>${storeInfo?.name || "Pharmacy"}</h1>
        <p>${storeInfo?.email || ""}</p>
        <p>${storeInfo?.phoneNumber || ""}</p>
        <p>Reg# ${storeInfo?.registrationNumber || ""}</p>
        <p>License# ${storeInfo?.licenseNumber || ""}</p>
      </div>

      <div class="receipt-info">
        <div>
          <span>Invoice #: ${
            saleData?.invoiceNumber || saleData?._id?.slice(0, 8) || "N/A"
          }</span>
          <span>Date: ${formatDate(saleData?.createdAt)}</span>
        </div>
        <div>
          <span>Cashier: ${
            saleData?.cashierName ||
            saleData?.staffMember?.firstName ||
            storeInfo?.owner?.firstName ||
            "Cashier"
          }</span>
          <span>Customer: ${saleData?.customer?.name || "N/A"}</span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th width="40%">Item</th>
            <th class="text-center" width="15%">Qty</th>
            <th class="text-right" width="20%">Price</th>
            <th class="text-right" width="25%">Total</th>
          </tr>
        </thead>
        <tbody>
          ${(saleData?.items || [])
            .map(
              (item) => `
                <tr>
                  <td>${item.productName || "Unknown Product"}</td>
                  <td class="text-center">${item.quantity || 0}</td>
                  <td class="text-right">${formatCurrency(item.price)}</td>
                  <td class="text-right">${formatCurrency(item.subtotal)}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>

      <div class="total-section">
        <div>
          <span>Subtotal:</span>
          <span>${formatCurrency(saleData?.subtotal || 0)}</span>
        </div>
        <div>
          <span>Discount:</span>
          <span>${formatCurrency(saleData?.discount || 0)}</span>
        </div>
        <div class="total-line">
          <span>Total:</span>
          <span>${formatCurrency(saleData?.total || 0)}</span>
        </div>
        <div>
          <span>Payment Method:</span>
          <span>${saleData?.payment?.method || "N/A"}</span>
        </div>
        ${
          saleData?.amountPaid !== undefined
            ? `
          <div>
            <span>Amount Paid:</span>
            <span>${formatCurrency(saleData.amountPaid)}</span>
          </div>
          <div>
            <span>Change:</span>
            <span>${formatCurrency(
              (saleData.amountPaid || 0) - (saleData.total || 0)
            )}</span>
          </div>
        `
            : ""
        }
      </div>

      <div class="footer">
        <p>Thank you for your purchase!</p>
        <p>For returns, please bring this receipt within 7 days.</p>
        <p>For inquiries: ${storeInfo?.email || ""}</p>
        <p>${storeInfo?.phoneNumber || ""}</p>
      </div>
    `);

    printWindow.document.write("</body></html>");
    printWindow.document.close();

    // Wait for content to load, then print
    printWindow.onload = function () {
      printWindow.focus();
      printWindow.print();
      // Close the window after printing (or if printing is canceled)
      printWindow.onafterprint = function () {
        printWindow.close();
        if (onClose) onClose();
      };
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      console.error("Date formatting error:", e);
      return "N/A";
    }
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return "Rs. 0.00";
    try {
      return new Intl.NumberFormat("en-PK", {
        style: "currency",
        currency: "PKR",
        minimumFractionDigits: 2,
      })
        .format(amount)
        .replace("PKR", "Rs.");
    } catch (e) {
      console.error("Currency formatting error:", e);
      return "Rs. 0.00";
    }
  };

  // Check if we have items to print
  const hasItems = saleData?.items && saleData.items.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Sale Receipt</h2>
          <div className="flex gap-2">
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              onClick={handlePrint}
              disabled={!hasItems}
            >
              Print Receipt
            </button>
            <button
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>

        {/* The preview content */}
        <div
          ref={receiptRef}
          className="border p-4 mb-4 receipt-content overflow-auto"
          style={{
            minHeight: "200px",
            maxHeight: "400px",
            width: "100%",
          }}
        >
          {hasItems ? (
            <>
              <div className="text-center mb-4">
                <h1 className="text-xl font-bold">
                  {storeInfo?.name || "Pharmacy"}
                </h1>
                <p>{storeInfo?.email || ""}</p>
                <p>{storeInfo?.phoneNumber || ""}</p>
                <p>Reg# {storeInfo?.registrationNumber || ""}</p>
                <p>License# {storeInfo?.licenseNumber || ""}</p>
              </div>

              <div className="border-t border-b border-black py-2 mb-4">
                <div className="flex justify-between">
                  <span>
                    Invoice #:{" "}
                    {saleData?.invoiceNumber ||
                      saleData?._id?.slice(0, 8) ||
                      "N/A"}
                  </span>
                  <span>Date: {formatDate(saleData?.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>
                    Cashier:{" "}
                    {saleData?.cashierName ||
                      saleData?.staffMember?.firstName ||
                      storeInfo?.owner?.firstName ||
                      "Cashier"}
                  </span>
                  <span>Customer: {saleData?.customer?.name || "N/A"}</span>
                </div>
              </div>

              <table className="w-full mb-4">
                <thead className="border-b border-black">
                  <tr className="text-left">
                    <th className="py-1 w-1/2">Item</th>
                    <th className="py-1 text-center">Qty</th>
                    <th className="py-1 text-right">Price</th>
                    <th className="py-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="border-b border-black">
                  {(saleData?.items || []).map((item, i) => (
                    <tr key={i}>
                      <td className="py-1">
                        {item.productName || "Unknown Product"}
                      </td>
                      <td className="py-1 text-center">{item.quantity || 0}</td>
                      <td className="py-1 text-right">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="py-1 text-right">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mb-6">
                <div className="flex justify-between py-1">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(saleData?.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Discount:</span>
                  <span>{formatCurrency(saleData?.discount || 0)}</span>
                </div>
                <div className="flex justify-between py-1 font-bold border-t border-black">
                  <span>Total:</span>
                  <span>{formatCurrency(saleData?.total || 0)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Payment Method:</span>
                  <span>{saleData?.payment?.method || "N/A"}</span>
                </div>
                {saleData?.amountPaid !== undefined && (
                  <>
                    <div className="flex justify-between py-1">
                      <span>Amount Paid:</span>
                      <span>{formatCurrency(saleData.amountPaid)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Change:</span>
                      <span>
                        {formatCurrency(
                          (saleData.amountPaid || 0) - (saleData.total || 0)
                        )}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="text-center text-sm mt-8">
                <p>Thank you for your purchase!</p>
                <p>For returns, please bring this receipt within 7 days.</p>
                <p>For inquiries: {storeInfo?.email || ""}</p>
                <p>{storeInfo?.phoneNumber || ""}</p>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No items to print</p>
            </div>
          )}
        </div>

        <div className="text-sm text-gray-500 mt-2">
          <p>Note: Please ensure your printer is connected before printing.</p>
          <p>
            For thermal receipt printers (80mm), set paper size to "80 x 297mm"
            and margins to "None".
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPrinter;
