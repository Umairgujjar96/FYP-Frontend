// SalesReportDisplay.jsx
import React from "react";
import { Card, Typography, Table, Divider, Row, Col, Statistic } from "antd";
import {
  DollarOutlined,
  ShoppingOutlined,
  PercentageOutlined,
  WalletOutlined,
  CreditCardOutlined,
  BankOutlined,
} from "@ant-design/icons";
import useSaleStore from "../../Store/useSaleStore";

const { Title, Text } = Typography;

const SalesReportDisplay = () => {
  const { salesReport, loading } = useSaleStore();

  if (!salesReport) {
    return null;
  }

  // Format date display
  const formatDateDisplay = (dateRange) => {
    return `${dateRange.start} to ${dateRange.end}`;
  };

  // Define columns for detailed sales table
  const detailColumns = [
    {
      title: "Date",
      key: "date",
      render: (_, record) => {
        const month = String(record.month).padStart(2, "0");
        const day = record.day ? String(record.day).padStart(2, "0") : "";
        const hour =
          record.hour !== undefined
            ? ` ${String(record.hour).padStart(2, "0")}:00`
            : "";

        if (day) {
          return `${record.year}-${month}-${day}${hour}`;
        }
        return `${record.year}-${month}`;
      },
    },
    {
      title: "Store",
      dataIndex: "storeName",
      key: "storeName",
    },
    {
      title: "Sales",
      dataIndex: "salesCount",
      key: "salesCount",
      sorter: (a, b) => a.salesCount - b.salesCount,
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      render: (total) => `$${total.toFixed(2)}`,
      sorter: (a, b) => a.total - b.total,
    },
    {
      title: "Returns",
      dataIndex: "returns",
      key: "returns",
      render: (returns) => `$${returns.toFixed(2)}`,
    },
    {
      title: "Net Sales",
      dataIndex: "finalTotal",
      key: "finalTotal",
      render: (finalTotal) => `$${finalTotal.toFixed(2)}`,
      sorter: (a, b) => a.finalTotal - b.finalTotal,
    },
  ];

  // Product analytics columns
  const productColumns = [
    {
      title: "Product",
      dataIndex: "productName",
      key: "productName",
      ellipsis: true,
    },
    {
      title: "Generic Name",
      dataIndex: "genericName",
      key: "genericName",
      ellipsis: true,
    },
    {
      title: "Qty Sold",
      dataIndex: "quantitySold",
      key: "quantitySold",
      sorter: (a, b) => a.quantitySold - b.quantitySold,
    },
    {
      title: "Net Qty",
      dataIndex: "netQuantity",
      key: "netQuantity",
    },
    {
      title: "Revenue",
      dataIndex: "revenue",
      key: "revenue",
      render: (revenue) => `$${revenue.toFixed(2)}`,
      sorter: (a, b) => a.revenue - b.revenue,
    },
    {
      title: "Net Revenue",
      dataIndex: "netRevenue",
      key: "netRevenue",
      render: (netRevenue) => `$${netRevenue.toFixed(2)}`,
      sorter: (a, b) => a.netRevenue - b.netRevenue,
    },
  ];

  return (
    <div className="mt-6">
      <Card className="shadow-md">
        <div className="mb-4">
          <Title level={4}>{salesReport.title}</Title>
          <Text type="secondary">
            {formatDateDisplay(salesReport.dateRange)}
          </Text>
        </div>

        <Divider>Summary</Divider>

        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="Total Sales"
              value={salesReport.summary.totalSales}
              prefix={<ShoppingOutlined />}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="Total Revenue"
              value={salesReport.summary.totalRevenue}
              precision={2}
              prefix={<DollarOutlined />}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="Returns"
              value={salesReport.summary.totalReturns}
              precision={2}
              prefix={<DollarOutlined />}
              className="text-red-500"
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="Net Revenue"
              value={salesReport.summary.netRevenue}
              precision={2}
              prefix={<DollarOutlined />}
              className="text-green-600 font-semibold"
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="Discount"
              value={salesReport.summary.totalDiscount}
              precision={2}
              prefix={<PercentageOutlined />}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="Avg Sale Value"
              value={salesReport.summary.averageSaleValue}
              precision={2}
              prefix={<DollarOutlined />}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="Cash Payments"
              value={`${salesReport.summary.paymentMethods.cash} (${salesReport.summary.paymentMethodPercentages.cash}%)`}
              prefix={<WalletOutlined />}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="Card Payments"
              value={`${salesReport.summary.paymentMethods.card} (${salesReport.summary.paymentMethodPercentages.card}%)`}
              prefix={<CreditCardOutlined />}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="Mobile Banking"
              value={`${salesReport.summary.paymentMethods.mobileBanking} (${salesReport.summary.paymentMethodPercentages.mobileBanking}%)`}
              prefix={<BankOutlined />}
            />
          </Col>
        </Row>

        <Divider>Details</Divider>
        <Table
          columns={detailColumns}
          dataSource={salesReport.detail}
          rowKey={(record) => `${record.store}-${record.date}`}
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: true }}
          size="middle"
        />

        {salesReport.productAnalytics &&
          salesReport.productAnalytics.length > 0 && (
            <>
              <Divider>Product Analytics</Divider>
              <Table
                columns={productColumns}
                dataSource={salesReport.productAnalytics}
                rowKey="productId"
                loading={loading}
                pagination={{ pageSize: 10 }}
                scroll={{ x: true }}
                size="middle"
              />
            </>
          )}
      </Card>
    </div>
  );
};

export default SalesReportDisplay;
