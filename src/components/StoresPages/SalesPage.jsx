import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Space,
  Popconfirm,
  message,
  Input,
  DatePicker,
  Form,
  Modal,
  Select,
  Tooltip,
  Tag,
  Pagination,
  Card,
  Typography,
  Spin,
  Avatar,
  Divider,
  Result,
} from "antd";

import {
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
  ReloadOutlined,
  FileExcelOutlined,
  EyeOutlined,
  FileTextOutlined,
  CloseOutlined,
  PrinterOutlined,
  ShopOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
  CreditCardOutlined,
  TeamOutlined,
  ShoppingOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

import dayjs from "dayjs";
import useSaleStore from "../../Store/useSaleStore";
import { useAuthStore } from "../../Store/stores";

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const SalesPage = () => {
  // Store state
  const {
    sales,
    loading,
    error,
    pagination,
    currentSale,
    fetchSales,
    cancelSale,
    updatePaymentStatus,
    fetchSaleById,
    clearError,
    resetCurrentSale,
  } = useSaleStore();

  // Local state
  const [selectedSaleId, setSelectedSaleId] = useState(null);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({
    invoiceNumber: "",
    dateRange: null,
    paymentStatus: "",
    paymentMethod: "",
  });
  const [form] = Form.useForm();
  const handlePrintInvoice = (id) => {
    if (!id) return;

    // Show loading notification
    message.loading({
      content: "Preparing invoice for printing...",
      key: "printLoading",
      duration: 0,
    });
    const token = useAuthStore.getState().token;

    // Fetch the latest sale data
    fetch(`http://localhost:5000/api/sales/getById/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch sale data");
        }
        return response.json();
      })
      .then((response) => {
        // Extract sale data from the response
        const saleData = response.data;

        // Open a new window for the print view
        console.log(saleData);
        const printWindow = window.open("", "_blank", "height=600,width=800");

        // Ensure dayjs is defined
        if (typeof dayjs === "undefined") {
          throw new Error(
            "dayjs is not defined. Please import it at the top of your file."
          );
        }

        // Ensure payment status exists, else default to "Unknown"
        const paymentStatus = saleData.payment?.status || "Unknown";
        const paymentMethod =
          saleData.payment?.method === "mobileBanking"
            ? "Mobile Banking"
            : saleData.payment?.method?.charAt(0).toUpperCase() +
                saleData.payment?.method?.slice(1) || "N/A";

        // Generate the invoice HTML with classic professional styling
        const printContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice #${saleData.invoiceNumber || "N/A"}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Merriweather:wght@400;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', sans-serif;
      color: #222;
      background-color: #f5f5f5;
      line-height: 1.6;
      padding: 30px;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 5px 25px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      border: 1px solid #e0e0e0;
    }
    
    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 40px;
      background-color: #222;
      color: white;
      position: relative;
    }
    
    .invoice-header::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 40px;
      right: 40px;
      height: 3px;
      background: repeating-linear-gradient(to right, #fff, #fff 8px, transparent 8px, transparent 16px);
    }
    
    .store-name {
      font-family: 'Merriweather', serif;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    
    .store-info {
      font-size: 14px;
      font-weight: 300;
      opacity: 0.9;
    }
    
    .invoice-info {
      text-align: right;
    }
    
    .invoice-title {
      font-family: 'Merriweather', serif;
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    
    .invoice-details {
      font-size: 14px;
      font-weight: 300;
      opacity: 0.9;
    }
    
    .invoice-status {
      display: inline-block;
      padding: 6px 14px;
      margin-bottom: 15px;
      border-radius: 30px;
      font-weight: 500;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .status-paid {
      background-color: #e8f5e9;
      color: #2e7d32;
      border: 1px solid #a5d6a7;
    }
    
    .status-pending {
      background-color: #fff8e1;
      color: #f57f17;
      border: 1px solid #ffe082;
    }
    
    .status-failed {
      background-color: #ffebee;
      color: #c62828;
      border: 1px solid #ef9a9a;
    }
    
    .status-unknown {
      background-color: #f5f5f5;
      color: #616161;
      border: 1px solid #e0e0e0;
    }
    
    .invoice-body {
      padding: 40px;
    }
    
    .section-title {
      font-family: 'Merriweather', serif;
      font-size: 18px;
      font-weight: 600;
      margin: 30px 0 20px;
      position: relative;
      padding-bottom: 10px;
      border-bottom: 2px solid #222;
    }
    
    .section-title:first-of-type {
      margin-top: 0;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      font-size: 14px;
    }
    
    th {
      background-color: #f3f3f3;
      font-weight: 600;
      text-align: left;
      padding: 15px;
      border-bottom: 2px solid #ddd;
    }
    
    td {
      padding: 15px;
      border-bottom: 1px solid #eee;
      vertical-align: top;
    }
    
    tr:last-child td {
      border-bottom: none;
    }
    
    tr:nth-child(odd) {
      background-color: #f9f9f9;
    }
    
    .text-right {
      text-align: right;
    }
    
    .summary-container {
      display: flex;
      justify-content: flex-end;
    }
    
    .summary-table {
      width: 350px;
      font-size: 14px;
      border: 2px solid #222;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .summary-table td {
      padding: 12px 20px;
      border-bottom: 1px solid #eee;
    }
    
    .summary-table tr:last-child td {
      border-bottom: none;
    }
    
    .summary-table .label {
      color: #555;
      font-weight: 500;
    }
    
    .summary-table .value {
      font-weight: 600;
      text-align: right;
    }
    
    .total-row td {
      padding: 18px 20px;
      font-weight: 700;
      font-size: 16px;
      background-color: #222;
      color: white;
    }
    
    .total-row .label {
      color: #fff;
    }
    
    .footer {
      margin-top: 60px;
      padding-top: 30px;
      border-top: 1px dashed #ccc;
      text-align: center;
      font-size: 14px;
      color: #555;
    }
    
    .footer p {
      margin-bottom: 10px;
    }
    
    .footer strong {
      color: #333;
    }
    
    .no-print {
      text-align: right;
      margin-bottom: 20px;
    }
    
    .print-button {
      padding: 10px 24px;
      background: #222;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    
    .print-button:hover {
      background: #000;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    .print-button svg {
      margin-right: 8px;
    }
    
    .item-details {
      font-size: 12px;
      color: #777;
      margin-top: 5px;
    }
    
    .product-name {
      font-weight: 600;
    }
    
    .logo-placeholder {
      width: 60px;
      height: 60px;
      border-radius: 8px;
      background: rgba(255,255,255,0.2);
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 24px;
      border: 2px solid rgba(255,255,255,0.5);
    }
    
    .customer-info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 30px;
    }
    
    .info-block {
      background-color: #f9f9f9;
      border-radius: 4px;
      padding: 20px;
      border: 1px solid #eee;
      position: relative;
    }
    
    .info-block::before {
      content: '';
      position: absolute;
      top: -1px;
      left: -1px;
      right: -1px;
      height: 6px;
      background-color: #222;
    }
    
    .info-label {
      font-size: 12px;
      text-transform: uppercase;
      color: #777;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      font-weight: 600;
    }
    
    .info-value {
      font-weight: 600;
      color: #222;
    }

    .invoice-watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 120px;
      color: rgba(0,0,0,0.03);
      font-weight: 900;
      pointer-events: none;
      text-transform: uppercase;
      white-space: nowrap;
      z-index: 0;
    }
    
    .pharmacy-details {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px dashed #ddd;
      display: flex;
      justify-content: space-between;
    }
    
    .signature-block {
      width: 200px;
      margin-top: 20px;
    }
    
    .signature-line {
      height: 1px;
      background: #222;
      margin-bottom: 5px;
    }
    
    .signature-label {
      font-size: 12px;
      color: #555;
      text-align: center;
    }
    
    .receipt-barcode {
      text-align: center;
      margin-top: 30px;
      font-size: 10px;
      color: #777;
    }
    
    .barcode-placeholder {
      height: 40px;
      background: repeating-linear-gradient(to right, #000, #000 1px, #fff 1px, #fff 3px);
      margin: 5px 0;
      position: relative;
    }
    
    .barcode-placeholder::after {
      content: '${saleData.invoiceNumber || "N/A"}';
      position: absolute;
      bottom: -18px;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 12px;
      color: #222;
      font-weight: 500;
    }
    
    @media print {
      @page {
        margin: 10mm;
        size: A4;
      }
      
      body {
        padding: 0;
        background: none;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .container {
        box-shadow: none;
        border: none;
        border-radius: 0;
      }
      
      .no-print {
        display: none;
      }
      
      .invoice-header, .total-row td {
        background-color: #222 !important;
        color: white !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      tr:nth-child(odd) {
        background-color: #f9f9f9 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button class="print-button" onclick="window.print();">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 6 2 18 2 18 9"></polyline>
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
        <rect x="6" y="14" width="12" height="8"></rect>
      </svg>
      Print Invoice
    </button>
  </div>
  
  <div class="container">
    <div class="invoice-watermark">RECEIPT</div>
    <div class="invoice-header">
      <div>
        <div class="logo-placeholder">${
          saleData.store?.name?.charAt(0) || "P"
        }</div>
        <div class="store-name">${saleData.store?.name || "Pharmacy"}</div>
        <div class="store-info">
          ${saleData.store?.email ? `${saleData.store.email}<br>` : ""}
          ${saleData.store?.phoneNumber ? `${saleData.store.phoneNumber}` : ""}
        </div>
      </div>
      <div class="invoice-info">
        <div class="invoice-status status-${paymentStatus.toLowerCase()}">
          ${paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
        </div>
        <div class="invoice-title">Invoice #${
          saleData.invoiceNumber || "N/A"
        }</div>
        <div class="invoice-details">
          Date: ${dayjs(saleData.createdAt).format("MMMM DD, YYYY")}<br>
          Time: ${dayjs(saleData.createdAt).format("HH:mm")}
        </div>
      </div>
    </div>
    
    <div class="invoice-body">
      <div class="customer-info-grid">
        <div class="info-block">
          <div class="info-label">Customer</div>
          <div class="info-value">${
            saleData.customer?.name || "Walk-in Customer"
          }</div>
          ${
            saleData.customer?.email
              ? `<div class="item-details">${saleData.customer.email}</div>`
              : ""
          }
          ${
            saleData.customer?.phoneNumber
              ? `<div class="item-details">${saleData.customer.phoneNumber}</div>`
              : ""
          }
        </div>
        <div class="info-block">
          <div class="info-label">Payment Details</div>
          <div class="info-value">${
            paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)
          }</div>
          <div class="item-details">Transaction ID: ${
            saleData.payment?.transactionId || "N/A"
          }</div>
        </div>
      </div>
      
      <div class="section-title">Order Items</div>
      <table>
        <thead>
          <tr>
            <th width="30%">Product</th>
            <th width="20%">Batch</th>
            <th width="10%">Quantity</th>
            <th class="text-right" width="15%">Unit Price</th>
            <th class="text-right" width="10%">Discount</th>
            <th class="text-right" width="15%">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${
            saleData.items && Array.isArray(saleData.items)
              ? saleData.items
                  .map(
                    (item) => `
          <tr>
            <td>
              <div class="product-name">${item?.product?.name || "N/A"}</div>
              ${
                item?.product?.genericName
                  ? `<div class="item-details">Generic: ${item.product.genericName}</div>`
                  : ""
              }
              ${
                item?.product?.description
                  ? `<div class="item-details">${item.product.description}</div>`
                  : ""
              }
            </td>
            <td>
              ${item?.batch?.batchNumber || "N/A"}
              ${
                item?.batch?.expiryDate
                  ? `<div class="item-details">Exp: ${dayjs(
                      item.batch.expiryDate
                    ).format("MMM DD, YYYY")}</div>`
                  : ""
              }
            </td>
            <td>${item?.quantity || 0}</td>
            <td class="text-right">Rs. ${(item.unitPrice || 0).toFixed(2)}</td>
            <td class="text-right">Rs. ${(item.discount || 0).toFixed(2)}</td>
            <td class="text-right">Rs. ${(
              (item.quantity || 0) * (item.unitPrice || 0) -
              (item.discount || 0)
            ).toFixed(2)}</td>
          </tr>`
                  )
                  .join("")
              : '<tr><td colspan="6" style="text-align: center;">No items found</td></tr>'
          }
        </tbody>
      </table>
      
      <div class="summary-container">
        <table class="summary-table">
          <tbody>
            <tr>
              <td class="label">Subtotal:</td>
              <td class="value">Rs. ${(saleData.subtotal || 0).toFixed(2)}</td>
            </tr>
            <tr>
              <td class="label">Discount:</td>
              <td class="value">Rs. ${(saleData.discount || 0).toFixed(2)}</td>
            </tr>
            <tr>
              <td class="label">Tax:</td>
              <td class="value">Rs. ${(saleData.tax || 0).toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td class="label">Total:</td>
              <td class="value">Rs. ${(saleData.total || 0).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="pharmacy-details">
        <div class="signature-block">
          <div class="signature-line"></div>
          <div class="signature-label">Pharmacist Signature</div>
        </div>
        <div class="signature-block">
          <div class="signature-line"></div>
          <div class="signature-label">Customer Signature</div>
        </div>
      </div>
      
      <div class="receipt-barcode">
        <p>Invoice Verification</p>
        <div class="barcode-placeholder"></div>
      </div>
      
      <div class="footer">
        <p><strong>Served by:</strong> ${
          saleData.staffMember?.firstName || ""
        } ${saleData.staffMember?.lastName || ""}</p>
        <p>Generated on ${dayjs().format("MMMM DD, YYYY")} at ${dayjs().format(
          "HH:mm"
        )}</p>
        <p>Thank you for choosing ${
          saleData.store?.name || "our pharmacy"
        }. We appreciate your business!</p>
      </div>
    </div>
  </div>
</body>
</html>

`;

        // Write to the new window and trigger print
        printWindow.document.write(printContent);
        printWindow.document.close();

        // Close loading notification
        message.success({
          content: "Invoice ready for printing!",
          key: "printLoading",
          duration: 2,
        });

        // Ensure styles load before printing
        printWindow.onload = function () {
          setTimeout(() => {
            printWindow.focus();
            printWindow.print();
          }, 500); // Increased timeout to ensure proper loading
        };
      })
      .catch((error) => {
        console.error("Error preparing invoice for print:", error);
        message.error({
          content: "Failed to prepare invoice. Please try again.",
          key: "printLoading",
          duration: 3,
        });
      });
  };

  // Fetch sales on component mount
  useEffect(() => {
    fetchSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle error from store
  useEffect(() => {
    if (error) {
      message.error(error);
      clearError();
    }
  }, [error, clearError]);

  // Search handler
  const handleSearch = () => {
    const filters = {
      invoiceNumber: searchParams.invoiceNumber || undefined,
      paymentStatus: searchParams.paymentStatus || undefined,
      paymentMethod: searchParams.paymentMethod || undefined,
      page: 1, // Reset to first page on new search
    };

    if (
      searchParams.dateRange &&
      searchParams.dateRange[0] &&
      searchParams.dateRange[1]
    ) {
      filters.startDate = searchParams.dateRange[0].format("YYYY-MM-DD");
      filters.endDate = searchParams.dateRange[1].format("YYYY-MM-DD");
    }

    fetchSales(filters);
  };

  // Reset search filters
  const handleReset = () => {
    setSearchParams({
      invoiceNumber: "",
      dateRange: null,
      paymentStatus: "",
      paymentMethod: "",
    });
    fetchSales({ page: 1 });
  };

  // Pagination handler
  const handlePageChange = (page, pageSize) => {
    const currentSearchParams = { ...searchParams, page, limit: pageSize };
    fetchSales(currentSearchParams);
  };

  // Delete sale handler
  const handleDeleteSale = async (id) => {
    try {
      await cancelSale(id);
      message.success("Sale deleted successfully");
    } catch (err) {
      // Error is already handled in the store
    }
  };

  // View sale details - now properly using fetchSaleById
  const handleViewSale = async (saleId) => {
    setSelectedSaleId(saleId);
    setIsDetailLoading(true);
    try {
      await fetchSaleById(saleId);
      setIsViewModalVisible(true);
    } catch (err) {
      message.error("Failed to fetch sale details");
    } finally {
      setIsDetailLoading(false);
    }
  };

  // Close view modal and reset current sale
  const handleCloseViewModal = () => {
    setIsViewModalVisible(false);
    resetCurrentSale();
  };
  console.log(currentSale);
  // Edit sale - now properly using currentSale from store
  const handleEditSale = (saleId) => {
    if (currentSale && currentSale._id === saleId) {
      // If we already have the details loaded, use them
      initializeEditForm(currentSale);
    } else {
      // Otherwise fetch the sale details first
      setIsDetailLoading(true);
      fetchSaleById(saleId)
        .then(() => {
          initializeEditForm(useSaleStore.getState().currentSale);
        })
        .catch(() => {
          message.error("Failed to fetch sale details for editing");
        })
        .finally(() => {
          setIsDetailLoading(false);
        });
    }
  };

  // Initialize edit form with sale data
  const initializeEditForm = (sale) => {
    if (!sale) return;

    form.setFieldsValue({
      paymentStatus: sale.payment.status,
      paymentMethod: sale.payment.method,
      transactionId: sale.payment.transactionId || "",
    });
    setSelectedSaleId(sale._id);
    setIsEditModalVisible(true);
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    try {
      const values = await form.validateFields();

      await updatePaymentStatus(selectedSaleId, {
        status: values.paymentStatus,
        method: values.paymentMethod,
        transactionId: values.transactionId,
      });

      setIsEditModalVisible(false);
      message.success("Sale updated successfully");

      // Refresh the sales list
      fetchSales(searchParams);
    } catch (error) {
      // Form validation error or API error
      console.error("Failed to update sale:", error);
    }
  };

  // Close edit modal and reset current sale
  const handleCloseEditModal = () => {
    setIsEditModalVisible(false);
    resetCurrentSale();
  };

  // Table columns
  const columns = [
    {
      title: "Invoice #",
      dataIndex: "invoiceNumber",
      key: "invoiceNumber",
      render: (text, record) => (
        <a onClick={() => handleViewSale(record._id)}>{text}</a>
      ),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => dayjs(date).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Customer",
      dataIndex: "customer",
      key: "customer",
      render: (customer) => customer?.name || "Walk-in Customer",
    },
    {
      title: "Total Amount",
      dataIndex: "total",
      key: "total",
      render: (total) => `Rs. ${total.toFixed(2)}`,
      sorter: (a, b) => a.total - b.total,
    },
    {
      title: "Payment Method",
      dataIndex: ["payment", "method"],
      key: "paymentMethod",
      render: (method) => {
        const methodMap = {
          cash: { color: "green", label: "Cash" },
          card: { color: "blue", label: "Card" },
          mobileBanking: { color: "purple", label: "Mobile Banking" },
        };

        return (
          <Tag color={methodMap[method]?.color || "default"}>
            {methodMap[method]?.label || method}
          </Tag>
        );
      },
    },
    {
      title: "Payment Status",
      dataIndex: ["payment", "status"],
      key: "paymentStatus",
      render: (status) => {
        const statusMap = {
          completed: { color: "success", label: "Completed" },
          pending: { color: "warning", label: "Pending" },
          failed: { color: "error", label: "Failed" },
        };

        return (
          <Tag color={statusMap[status]?.color || "default"}>
            {statusMap[status]?.label || status}
          </Tag>
        );
      },
    },
    {
      title: "Staff Member",
      dataIndex: "staffMember",
      key: "staffMember",
      render: (staffMember) =>
        staffMember
          ? `${staffMember.firstName} ${staffMember.lastName}`
          : "Staff Member",
    },

    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              icon={<EyeOutlined />}
              onClick={() => handleViewSale(record._id)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              icon={<EditOutlined />}
              onClick={() => handleEditSale(record._id)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Popconfirm
              title="Are you sure you want to delete this sale?"
              onConfirm={() => handleDeleteSale(record._id)}
              okText="Yes"
              cancelText="No"
            >
              <Button icon={<DeleteOutlined />} danger size="small" />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Render sale details modal
  const renderSaleDetailsModal = () => {
    // Get payment status color
    const getPaymentStatusColor = (status) => {
      switch (status) {
        case "paid":
          return "#52c41a"; // Green
        case "pending":
          return "#faad14"; // Orange
        case "failed":
          return "#f5222d"; // Red
        default:
          return "#1890ff"; // Blue
      }
    };

    return (
      <Modal
        title={
          <div className="flex items-center">
            <FileTextOutlined className="text-primary mr-2" />
            <span className="text-lg font-semibold">
              {`Sale Details${
                currentSale ? ` - Invoice #${currentSale.invoiceNumber}` : ""
              }`}
            </span>
          </div>
        }
        visible={isViewModalVisible}
        onCancel={handleCloseViewModal}
        footer={[
          <Button
            key="back"
            onClick={handleCloseViewModal}
            icon={<CloseOutlined />}
          >
            Close
          </Button>,
          <Button
            key="print"
            icon={<PrinterOutlined />}
            onClick={() => handlePrintInvoice(currentSale?._id)}
            disabled={!currentSale}
          >
            Print Invoice
          </Button>,
          <Button
            key="edit"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              handleCloseViewModal();
              if (currentSale) {
                handleEditSale(currentSale._id);
              }
            }}
            disabled={!currentSale}
          >
            Edit
          </Button>,
        ]}
        width={900}
        className="sales-detail-modal"
        bodyStyle={{ padding: "24px" }}
      >
        {isDetailLoading ? (
          <div className="text-center py-10">
            <Spin size="large" />
            <p className="mt-3">Loading sale details...</p>
          </div>
        ) : currentSale ? (
          <>
            {/* Header Card */}
            <Card className="mb-6 shadow-sm">
              <div className="flex justify-between items-start flex-wrap">
                {/* Store Info */}
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <ShopOutlined className="text-primary mr-2" />
                    <span className="text-lg font-semibold">
                      {currentSale.store?.name}
                    </span>
                  </div>
                  <div className="text-gray-600 ml-6">
                    <div>
                      <MailOutlined className="mr-2" />
                      {currentSale.store?.email}
                    </div>
                    <div>
                      <PhoneOutlined className="mr-2" />
                      {currentSale.store?.phoneNumber}
                    </div>
                  </div>
                </div>

                {/* Invoice Status */}
                <div className="text-right">
                  <div className="mb-2">
                    <Tag
                      color={getPaymentStatusColor(currentSale.payment.status)}
                      className="text-sm py-1 px-3"
                    >
                      {currentSale.payment.status.charAt(0).toUpperCase() +
                        currentSale.payment.status.slice(1)}
                    </Tag>
                  </div>
                  <div className="text-lg font-semibold">
                    {currentSale.invoiceNumber}
                  </div>
                  <div className="text-gray-500 text-sm">
                    {dayjs(currentSale.createdAt).format("DD MMM YYYY, HH:mm")}
                  </div>
                </div>
              </div>
            </Card>

            {/* Customer and Payment Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Customer Card */}
              <Card
                title={
                  <div className="flex items-center">
                    <UserOutlined className="mr-2" />
                    Customer Details
                  </div>
                }
                className="shadow-sm h-full"
              >
                <div className="flex items-center mb-3">
                  <Avatar
                    style={{ backgroundColor: "#1890ff" }}
                    className="mr-3"
                  >
                    {currentSale.customer?.name?.charAt(0) || "C"}
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {currentSale.customer?.name || "Walk-in Customer"}
                    </div>
                    <div className="text-gray-500 text-sm">
                      Customer ID:{" "}
                      {currentSale.customer?._id?.substring(0, 8) || "N/A"}
                    </div>
                  </div>
                </div>
                <Divider className="my-3" />
                <div className="text-gray-600">
                  <div className="flex items-center mb-2">
                    <MailOutlined className="mr-2 text-gray-400" />
                    <span>{currentSale.customer?.email || "N/A"}</span>
                  </div>
                  <div className="flex items-center">
                    <PhoneOutlined className="mr-2 text-gray-400" />
                    <span>{currentSale.customer?.phoneNumber || "N/A"}</span>
                  </div>
                </div>
              </Card>

              {/* Payment and Staff Card */}
              <Card
                title={
                  <div className="flex items-center">
                    <CreditCardOutlined className="mr-2" />
                    Payment Information
                  </div>
                }
                className="shadow-sm h-full"
              >
                <div className="mb-3">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium">
                      {currentSale.payment.method === "mobileBanking"
                        ? "Mobile Banking"
                        : currentSale.payment.method.charAt(0).toUpperCase() +
                          currentSale.payment.method.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Payment Status:</span>
                    <Tag
                      color={getPaymentStatusColor(currentSale.payment.status)}
                    >
                      {currentSale.payment.status.charAt(0).toUpperCase() +
                        currentSale.payment.status.slice(1)}
                    </Tag>
                  </div>
                  {currentSale.payment.transactionId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transaction ID:</span>
                      <span className="font-medium">
                        {currentSale.payment.transactionId}
                      </span>
                    </div>
                  )}
                </div>
                <Divider className="my-3" />
                <div className="flex items-center">
                  <Avatar
                    style={{ backgroundColor: "#52c41a" }}
                    className="mr-3"
                    icon={<TeamOutlined />}
                  />
                  <div>
                    <div className="font-medium">
                      {`${currentSale.staffMember?.firstName || ""} ${
                        currentSale.staffMember?.lastName || ""
                      }`}
                    </div>
                    <div className="text-gray-500 text-sm">
                      Staff ID:{" "}
                      {currentSale.staffMember?._id?.substring(0, 8) || "N/A"}
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Products Table */}
            <Card
              title={
                <div className="flex items-center">
                  <ShoppingOutlined className="mr-2" />
                  Order Items
                </div>
              }
              className="shadow-sm mb-6"
            >
              <Table
                dataSource={currentSale.items}
                rowKey={(item, index) =>
                  `${item.product?._id || item._id}-${index}`
                }
                pagination={false}
                className="product-table"
                bordered
                columns={[
                  {
                    title: "Product",
                    dataIndex: "product",
                    key: "product",
                    render: (product) => (
                      <div>
                        <div className="font-medium">
                          {product?.name || product}
                        </div>
                        <div className="text-gray-500 text-sm">
                          {product?.genericName || "N/A"}
                        </div>
                      </div>
                    ),
                  },
                  {
                    title: "Batch Details",
                    dataIndex: "batch",
                    key: "batch",
                    render: (batch) => (
                      <div>
                        <div>{batch?.batchNumber || batch || "N/A"}</div>
                        <div className="text-gray-500 text-sm">
                          {batch?.expiryDate
                            ? `Expires: ${dayjs(batch.expiryDate).format(
                                "DD/MM/YYYY"
                              )}`
                            : ""}
                        </div>
                      </div>
                    ),
                  },
                  {
                    title: "Quantity",
                    dataIndex: "quantity",
                    key: "quantity",
                    align: "center",
                    render: (qty) => (
                      <Tag color="blue" className="px-3 py-1">
                        {qty}
                      </Tag>
                    ),
                  },
                  {
                    title: "Unit Price",
                    dataIndex: "unitPrice",
                    key: "unitPrice",
                    align: "right",
                    render: (price) => (
                      <span className="font-medium">
                        Rs. {price.toFixed(2)}
                      </span>
                    ),
                  },
                  {
                    title: "Discount",
                    dataIndex: "discount",
                    key: "discount",
                    align: "right",
                    render: (discount) => (
                      <span className="text-success font-medium">
                        Rs. {discount.toFixed(2)}
                      </span>
                    ),
                  },
                  {
                    title: "Subtotal",
                    dataIndex: "subtotal",
                    key: "subtotal",
                    align: "right",
                    render: (subtotal, record) => (
                      <span className="font-semibold">
                        Rs.
                        {(
                          record.quantity * record.unitPrice -
                          record.discount
                        ).toFixed(2)}
                      </span>
                    ),
                  },
                ]}
                summary={() => (
                  <Table.Summary>
                    <Table.Summary.Row>
                      <Table.Summary.Cell
                        index={0}
                        colSpan={5}
                        className="text-right"
                      >
                        <span className="text-gray-600">Subtotal:</span>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        Rs. {currentSale.subtotal.toFixed(2)}
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                    <Table.Summary.Row>
                      <Table.Summary.Cell
                        index={0}
                        colSpan={5}
                        className="text-right"
                      >
                        <span className="text-gray-600">Discount:</span>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <span className="text-success">
                          Rs. {currentSale.discount.toFixed(2)}
                        </span>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                    <Table.Summary.Row>
                      <Table.Summary.Cell
                        index={0}
                        colSpan={5}
                        className="text-right"
                      >
                        <span className="text-gray-600">Tax:</span>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        Rs. {currentSale.tax.toFixed(2)}
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                    <Table.Summary.Row className="bg-gray-50">
                      <Table.Summary.Cell
                        index={0}
                        colSpan={5}
                        className="text-right"
                      >
                        <span className="text-lg font-semibold">Total:</span>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <span className="text-lg font-bold text-primary">
                          Rs. {currentSale.total.toFixed(2)}
                        </span>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            </Card>

            {/* Additional Notes */}
            <Card
              size="small"
              className="bg-gray-50 border-dashed"
              title={
                <div className="flex items-center">
                  <InfoCircleOutlined className="mr-2" />
                  Additional Information
                </div>
              }
            >
              <p className="text-gray-600 text-sm mb-0">
                This invoice was created on{" "}
                {dayjs(currentSale.createdAt).format("MMMM DD, YYYY")} and last
                updated on{" "}
                {dayjs(currentSale.updatedAt).format("MMMM DD, YYYY")}. For any
                questions regarding this invoice, please contact our support
                team.
              </p>
            </Card>
          </>
        ) : (
          <Result
            status="warning"
            title="No Sale Data Available"
            subTitle="The requested sale information could not be found"
            extra={
              <Button type="primary" onClick={handleCloseViewModal}>
                Go Back
              </Button>
            }
          />
        )}
      </Modal>
    );
  };

  // Render edit modal
  const renderEditModal = () => {
    return (
      <Modal
        title="Update Payment Information"
        visible={isEditModalVisible}
        onCancel={handleCloseEditModal}
        onOk={handleSaveEdit}
        confirmLoading={loading}
      >
        {isDetailLoading ? (
          <div className="text-center py-6">
            <Spin />
            <p className="mt-2">Loading payment details...</p>
          </div>
        ) : (
          <Form form={form} layout="vertical">
            <Form.Item
              name="paymentMethod"
              label="Payment Method"
              rules={[
                { required: true, message: "Please select payment method" },
              ]}
            >
              <Select>
                <Option value="cash">Cash</Option>
                <Option value="card">Card</Option>
                <Option value="mobileBanking">Mobile Banking</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="paymentStatus"
              label="Payment Status"
              rules={[
                { required: true, message: "Please select payment status" },
              ]}
            >
              <Select>
                <Option value="pending">Pending</Option>
                <Option value="completed">Completed</Option>
                <Option value="failed">Failed</Option>
              </Select>
            </Form.Item>
            <Form.Item name="transactionId" label="Transaction ID">
              <Input placeholder="Enter transaction ID if applicable" />
            </Form.Item>
          </Form>
        )}
      </Modal>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>Sales Management</Title>
        <Button
          type="primary"
          icon={<FileExcelOutlined />}
          onClick={() =>
            message.info("Export feature will be implemented soon")
          }
        >
          Export
        </Button>
      </div>

      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Form.Item label="Invoice Number">
            <Input
              placeholder="Search by invoice"
              value={searchParams.invoiceNumber}
              onChange={(e) =>
                setSearchParams({
                  ...searchParams,
                  invoiceNumber: e.target.value,
                })
              }
              prefix={<SearchOutlined />}
            />
          </Form.Item>

          <Form.Item label="Date Range">
            <RangePicker
              value={searchParams.dateRange}
              onChange={(dates) =>
                setSearchParams({ ...searchParams, dateRange: dates })
              }
              className="w-full"
            />
          </Form.Item>

          <Form.Item label="Payment Status">
            <Select
              placeholder="Select status"
              value={searchParams.paymentStatus}
              onChange={(value) =>
                setSearchParams({ ...searchParams, paymentStatus: value })
              }
              allowClear
              className="w-full"
            >
              <Option value="completed">Completed</Option>
              <Option value="pending">Pending</Option>
              <Option value="failed">Failed</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Payment Method">
            <Select
              placeholder="Select method"
              value={searchParams.paymentMethod}
              onChange={(value) =>
                setSearchParams({ ...searchParams, paymentMethod: value })
              }
              allowClear
              className="w-full"
            >
              <Option value="cash">Cash</Option>
              <Option value="card">Card</Option>
              <Option value="mobileBanking">Mobile Banking</Option>
            </Select>
          </Form.Item>
        </div>

        <div className="flex justify-end gap-2">
          <Button onClick={handleReset} icon={<ReloadOutlined />}>
            Reset
          </Button>
          <Button
            type="primary"
            onClick={handleSearch}
            icon={<SearchOutlined />}
          >
            Search
          </Button>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={sales}
          rowKey="_id"
          loading={loading}
          pagination={false}
          scroll={{ x: "max-content" }}
        />

        <div className="mt-4 flex justify-end">
          <Pagination
            current={pagination.page}
            pageSize={pagination.limit}
            total={pagination.total}
            showSizeChanger
            onChange={handlePageChange}
            showTotal={(total, range) =>
              `${range[0]}-${range[1]} of ${total} items`
            }
          />
        </div>
      </Card>

      {renderSaleDetailsModal()}
      {renderEditModal()}
    </div>
  );
};

export default SalesPage;
