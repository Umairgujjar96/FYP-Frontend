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
              @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&family=Open+Sans:wght@400;600&display=swap');
              
              body {
                font-family: 'Open Sans', serif;
                margin: 0;
                padding: 30px;
                color: #333;
                background-color: #fff;
                line-height: 1.6;
              }
              
              .container {
                max-width: 800px;
                margin: 0 auto;
                border: 1px solid #e0e0e0;
                padding: 40px;
                box-shadow: 0 0 20px rgba(0,0,0,0.05);
              }
              
              .invoice-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 40px;
                padding-bottom: 20px;
                border-bottom: 2px solid #e0e0e0;
              }
              
              .store-name {
                font-family: 'Merriweather', serif;
                font-size: 28px;
                font-weight: 700;
                color: #2c3e50;
                letter-spacing: 0.5px;
              }
              
              .store-info {
                color: #555;
                font-size: 14px;
                margin-top: 8px;
              }
              
              .invoice-info {
                text-align: right;
              }
              
              .invoice-title {
                font-family: 'Merriweather', serif;
                font-size: 20px;
                font-weight: 700;
                margin-bottom: 8px;
                color: #2c3e50;
              }
              
              .invoice-details {
                font-size: 14px;
                color: #555;
              }
              
              .invoice-status {
                display: inline-block;
                padding: 6px 12px;
                margin-bottom: 15px;
                border-radius: 3px;
                font-weight: 600;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 1px;
              }
              
              .status-paid {
                background-color: #f0f9f0;
                color: #27ae60;
                border: 1px solid #a3e2b8;
              }
              
              .status-pending {
                background-color: #fffbeb;
                color: #f39c12;
                border: 1px solid #fde6a6;
              }
              
              .status-failed {
                background-color: #feeeee;
                color: #e74c3c;
                border: 1px solid #f5b4ae;
              }
              
              .status-unknown {
                background-color: #f5f5f5;
                color: #7f8c8d;
                border: 1px solid #e0e0e0;
              }
              
              .section-title {
                font-family: 'Merriweather', serif;
                font-size: 18px;
                font-weight: 700;
                color: #2c3e50;
                margin: 30px 0 15px;
                padding-bottom: 8px;
                border-bottom: 1px solid #eee;
              }
              
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
                font-size: 14px;
              }
              
              th {
                background-color: #f9f9f9;
                font-weight: 600;
                text-align: left;
                padding: 12px 15px;
                border-bottom: 2px solid #e0e0e0;
                color: #2c3e50;
              }
              
              td {
                padding: 12px 15px;
                border-bottom: 1px solid #f0f0f0;
                vertical-align: top;
              }
              
              .text-right {
                text-align: right;
              }
              
              .summary-table {
                width: 40%;
                margin-left: auto;
                margin-right: 0;
                font-size: 14px;
              }
              
              .summary-table td {
                padding: 8px 15px;
                border: none;
              }
              
              .summary-table .label {
                text-align: right;
                color: #555;
              }
              
              .summary-table .value {
                font-weight: 600;
                text-align: right;
              }
              
              .total-row td {
                padding-top: 15px;
                font-weight: 700;
                font-size: 16px;
                color: #2c3e50;
                border-top: 2px solid #e0e0e0;
              }
              
              .footer {
                margin-top: 60px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                text-align: center;
                font-size: 13px;
                color: #777;
              }
              
              .no-print {
                text-align: right;
                margin-bottom: 20px;
              }
              
              .print-button {
                padding: 10px 20px;
                background: #2c3e50;
                color: white;
                border: none;
                border-radius: 3px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
                transition: background 0.3s;
              }
              
              .print-button:hover {
                background: #34495e;
              }
              
              .item-details {
                font-size: 13px;
                color: #777;
                margin-top: 3px;
              }
              
              .customer-table {
                font-size: 14px;
              }
              
              .customer-table th {
                width: 150px;
                vertical-align: top;
              }
              
              @media print {
                @page {
                  margin: 15mm;
                }
                
                body {
                  padding: 0;
                  background: none;
                }
                
                .container {
                  box-shadow: none;
                  border: none;
                  padding: 0;
                }
                
                .no-print {
                  display: none;
                }
              }
            </style>
          </head>
          <body>
            <div class="no-print">
              <button class="print-button" onclick="window.print();">
                Print Invoice
              </button>
            </div>
            
            <div class="container">
              <div class="invoice-header">
                <div>
                  <div class="store-name">${
                    saleData.store?.name || "Store"
                  }</div>
                  <div class="store-info">
                    ${
                      saleData.store?.email
                        ? `Email: ${saleData.store.email}<br>`
                        : ""
                    }
                    ${
                      saleData.store?.phoneNumber
                        ? `Phone: ${saleData.store.phoneNumber}`
                        : ""
                    }
                  </div>
                </div>
                <div class="invoice-info">
                  <div class="invoice-status status-${paymentStatus.toLowerCase()}">
                    ${
                      paymentStatus.charAt(0).toUpperCase() +
                      paymentStatus.slice(1)
                    }
                  </div>
                  <div class="invoice-title">Invoice #${
                    saleData.invoiceNumber || "N/A"
                  }</div>
                  <div class="invoice-details">
                    Date: ${dayjs(saleData.createdAt).format(
                      "MMMM DD, YYYY"
                    )}<br>
                    Time: ${dayjs(saleData.createdAt).format("HH:mm")}
                  </div>
                </div>
              </div>
              
              <div class="section-title">Customer Information</div>
              <table class="customer-table">
                <tbody>
                  <tr>
                    <th>Customer Name:</th>
                    <td>${saleData.customer?.name || "N/A"}</td>
                  </tr>
                  ${
                    saleData.customer?.email
                      ? `
                  <tr>
                    <th>Email:</th>
                    <td>${saleData.customer.email}</td>
                  </tr>`
                      : ""
                  }
                  ${
                    saleData.customer?.phoneNumber
                      ? `
                  <tr>
                    <th>Phone:</th>
                    <td>${saleData.customer.phoneNumber}</td>
                  </tr>`
                      : ""
                  }
                  <tr>
                    <th>Payment Method:</th>
                    <td>${paymentMethod}</td>
                  </tr>
                </tbody>
              </table>
              
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
                        ${item?.product?.name || "N/A"}
                        ${
                          item?.product?.genericName
                            ? `
                        <div class="item-details">Generic: ${item.product.genericName}</div>`
                            : ""
                        }
                        ${
                          item?.product?.description
                            ? `
                        <div class="item-details">${item.product.description}</div>`
                            : ""
                        }
                      </td>
                      <td>
                        ${item?.batch?.batchNumber || "N/A"}
                        ${
                          item?.batch?.expiryDate
                            ? `
                        <div class="item-details">Exp: ${dayjs(
                          item.batch.expiryDate
                        ).format("MMM DD, YYYY")}</div>`
                            : ""
                        }
                      </td>
                      <td>${item?.quantity || 0}</td>
                      <td class="text-right">$${(item.unitPrice || 0).toFixed(
                        2
                      )}</td>
                      <td class="text-right">$${(item.discount || 0).toFixed(
                        2
                      )}</td>
                      <td class="text-right">$${(
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
              
              <table class="summary-table">
                <tbody>
                  <tr>
                    <td class="label">Subtotal:</td>
                    <td class="value">$${(saleData.subtotal || 0).toFixed(
                      2
                    )}</td>
                  </tr>
                  <tr>
                    <td class="label">Discount:</td>
                    <td class="value">$${(saleData.discount || 0).toFixed(
                      2
                    )}</td>
                  </tr>
                  <tr>
                    <td class="label">Tax:</td>
                    <td class="value">$${(saleData.tax || 0).toFixed(2)}</td>
                  </tr>
                  <tr class="total-row">
                    <td class="label">Total:</td>
                    <td class="value">$${(saleData.total || 0).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
              
              <div class="footer">
                <p>Served by: ${saleData.staffMember?.firstName || ""} ${
          saleData.staffMember?.lastName || ""
        }</p>
                <p>Generated on ${dayjs().format(
                  "MMMM DD, YYYY"
                )} at ${dayjs().format("HH:mm")}</p>
                <p>Thank you for choosing ${
                  saleData.store?.name || "us"
                }. We appreciate your business!</p>
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
      render: (total) => `$${total.toFixed(2)}`,
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
                      <span className="font-medium">${price.toFixed(2)}</span>
                    ),
                  },
                  {
                    title: "Discount",
                    dataIndex: "discount",
                    key: "discount",
                    align: "right",
                    render: (discount) => (
                      <span className="text-success font-medium">
                        ${discount.toFixed(2)}
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
                        $
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
                        ${currentSale.subtotal.toFixed(2)}
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
                          ${currentSale.discount.toFixed(2)}
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
                        ${currentSale.tax.toFixed(2)}
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
                          ${currentSale.total.toFixed(2)}
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
