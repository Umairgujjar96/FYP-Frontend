import React from "react";
import {
  Modal,
  Button,
  Typography,
  Divider,
  List,
  Space,
  Row,
  Col,
  Card,
} from "antd";
import {
  PrinterOutlined,
  FilePdfOutlined,
  CloseOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const VoiceReceiptModal = ({ visible, onClose, saleData, invoiceNumber }) => {
  if (!saleData) return null;
  console.log(saleData);
  console.log(invoiceNumber);
  // Helper function to format date
  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  // Helper function to format currency
  const formatCurrency = (amount) => {
    return `Rs. ${parseFloat(amount).toFixed(2)}`;
  };

  const handlePrint = () => {
    // Prepare a printable version of the receipt
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .invoice-details { margin-bottom: 20px; }
            .items-table { width: 100%; border-collapse: collapse; }
            .items-table th, .items-table td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
            .total-section { margin-top: 20px; text-align: right; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Pharmacy Receipt</h1>
            <h2>${invoiceNumber}</h2>
            <p>${formatDate(new Date())}</p>
          </div>

          <div class="invoice-details">
            <p><strong>Payment Method:</strong> ${
              saleData.payment?.method || "Cash"
            }</p>
            <p><strong>Staff:</strong> ${
              saleData.staffMember?.name || "Staff"
            }</p>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${saleData.items
                .map(
                  (item) => `
                <tr>
                  <td>${item.productName}</td>
                  <td>${item.quantity}</td>
                  <td>${formatCurrency(item.unitPrice)}</td>
                  <td>${formatCurrency(item.unitPrice * item.quantity)}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <div class="total-section">
            <p><strong>Subtotal:</strong> ${formatCurrency(
              saleData.subtotal
            )}</p>
            <p><strong>Tax (10%):</strong> ${formatCurrency(saleData.tax)}</p>
            <p><strong>Total:</strong> ${formatCurrency(saleData.total)}</p>
          </div>

          <div class="footer">
            <p>Thank you for your purchase!</p>
            <p>For returns or exchanges, please bring this receipt within 7 days.</p>
          </div>

          <div style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()">Print</button>
            <button onclick="window.close()">Close</button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
  };

  const handleSavePDF = () => {
    // This would normally connect to a PDF generation service
    // For now, we'll just show a message
    message.info("PDF download functionality would be implemented here");
  };

  return (
    <Modal
      title={
        <div style={{ textAlign: "center" }}>
          <Title level={3}>Receipt</Title>
          <Text type="secondary">Transaction Completed Successfully</Text>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={650}
      centered
    >
      <Card
        bordered={false}
        style={{
          boxShadow: "0 2px 8px rgba(0,0,0,0.09)",
          background: "#fff",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <Title level={4}>Invoice #{invoiceNumber}</Title>
          <Text type="secondary">{formatDate(new Date())}</Text>
        </div>

        <Divider />

        <Row style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Text strong>Payment Method:</Text>
            <Text style={{ marginLeft: 8 }}>
              {saleData.payment?.method || "Cash"}
            </Text>
          </Col>
          <Col span={12} style={{ textAlign: "right" }}>
            <Text strong>Staff:</Text>
            <Text style={{ marginLeft: 8 }}>
              {saleData.staffMember?.name || "Staff"}
            </Text>
          </Col>
        </Row>

        <List
          header={
            <Row style={{ fontWeight: "bold" }}>
              <Col span={10}>Item</Col>
              <Col span={4} style={{ textAlign: "center" }}>
                Qty
              </Col>
              <Col span={5} style={{ textAlign: "right" }}>
                Unit Price
              </Col>
              <Col span={5} style={{ textAlign: "right" }}>
                Amount
              </Col>
            </Row>
          }
          dataSource={saleData.items}
          renderItem={(item) => (
            <List.Item style={{ padding: "8px 0" }}>
              <Row style={{ width: "100%" }}>
                <Col span={10}>{item.productName}</Col>
                <Col span={4} style={{ textAlign: "center" }}>
                  {item.quantity}
                </Col>
                <Col span={5} style={{ textAlign: "right" }}>
                  {formatCurrency(item.unitPrice)}
                </Col>
                <Col span={5} style={{ textAlign: "right" }}>
                  {formatCurrency(item.unitPrice * item.quantity)}
                </Col>
              </Row>
            </List.Item>
          )}
          style={{ marginBottom: 16 }}
        />

        <Divider />

        <Row>
          <Col span={16}></Col>
          <Col span={8}>
            <div style={{ textAlign: "right" }}>
              <div style={{ marginBottom: 8 }}>
                <Text>Subtotal:</Text>
                <Text
                  style={{
                    marginLeft: 8,
                    display: "inline-block",
                    width: 100,
                    textAlign: "right",
                  }}
                >
                  {formatCurrency(saleData.subtotal)}
                </Text>
              </div>
              <div style={{ marginBottom: 8 }}>
                <Text>Tax (10%):</Text>
                <Text
                  style={{
                    marginLeft: 8,
                    display: "inline-block",
                    width: 100,
                    textAlign: "right",
                  }}
                >
                  {formatCurrency(saleData.tax)}
                </Text>
              </div>
              <div style={{ marginTop: 8 }}>
                <Text strong>Total:</Text>
                <Text
                  strong
                  style={{
                    marginLeft: 8,
                    display: "inline-block",
                    width: 100,
                    textAlign: "right",
                  }}
                >
                  {formatCurrency(saleData.total)}
                </Text>
              </div>
            </div>
          </Col>
        </Row>

        <Divider />

        <div style={{ textAlign: "center", marginTop: 24, marginBottom: 16 }}>
          <Text>Thank you for your purchase!</Text>
          <br />
          <Text type="secondary">
            For returns or exchanges, please bring this receipt within 7 days.
          </Text>
        </div>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Space size="middle">
            <Button
              type="primary"
              icon={<PrinterOutlined />}
              onClick={handlePrint}
            >
              Print Receipt
            </Button>
            <Button icon={<FilePdfOutlined />} onClick={handleSavePDF}>
              Save as PDF
            </Button>
            <Button icon={<CloseOutlined />} onClick={onClose}>
              Close
            </Button>
          </Space>
        </div>
      </Card>
    </Modal>
  );
};

export default VoiceReceiptModal;
