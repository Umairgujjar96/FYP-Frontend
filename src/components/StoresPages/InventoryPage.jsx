import React, { useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Progress,
  Badge,
  Space,
  Tabs,
  Tag,
  Alert,
  Typography,
  Divider,
} from "antd";
import {
  BarChartOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
  MedicineBoxOutlined,
  ShoppingOutlined,
  PercentageOutlined,
  StockOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useProductStore } from "../../Store/productStore";

const { Title, Text } = Typography;

// Format date to display in a readable format
const formatDate = (dateString) => {
  const options = { year: "numeric", month: "short", day: "numeric" };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Calculate days left until expiry
const calculateDaysLeft = (expiryDate) => {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Colors for charts
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

const InventoryDashboard = () => {
  const { inventory, fetchInventory } = useProductStore();

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Early return if inventory is not loaded yet
  if (!inventory) {
    return <div>Loading...</div>;
  }

  const inventoryData = inventory;

  // Prepare data for Recharts
  const stockTurnoverData = inventoryData.stockTurnover.map((item) => ({
    name: item.productName,
    turnover: parseFloat((item.avgTurnoverRate * 100).toFixed(2)),
    dailyRate: parseFloat((item.avgDailyTurnoverRate * 100).toFixed(2)),
  }));

  const categoryData = inventoryData.categoryBreakdown.map((item) => ({
    name: item.categoryName,
    value: item.totalStock,
    count: item.productCount,
    totalValue: item.totalValue,
  }));

  // Create data for supplier pie chart
  const supplierData = inventoryData.supplierPerformance.map((supplier) => ({
    name: supplier.supplierName,
    value: supplier.totalStockProvided,
    totalValue: supplier.totalStockValue,
  }));

  // Configure columns for tables
  const lowStockColumns = [
    {
      title: "Product",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary">
            {record.strength}, {record.dosageForm}
          </Text>
        </Space>
      ),
    },
    {
      title: "Current Stock",
      dataIndex: "totalStock",
      key: "totalStock",
      render: (text) => <Tag color="error">{text} units</Tag>,
    },
    {
      title: "Min Level",
      dataIndex: "minStockLevel",
      key: "minStockLevel",
    },
    {
      title: "Deficit",
      dataIndex: "stockDeficit",
      key: "stockDeficit",
      render: (text) => <Text type="danger">-{text} units</Text>,
    },
  ];

  const expiringColumns = [
    {
      title: "Product",
      dataIndex: "productName",
      key: "productName",
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary">
            {record.strength}, {record.dosageForm}
          </Text>
        </Space>
      ),
    },
    {
      title: "Batch",
      dataIndex: "batchNumber",
      key: "batchNumber",
    },
    {
      title: "Expiry",
      dataIndex: "expiryDate",
      key: "expiryDate",
      render: (text) => formatDate(text),
    },
    {
      title: "Days Left",
      dataIndex: "daysToExpiry",
      key: "daysToExpiry",
      render: (text) => <Badge status="warning" text={`${text} days`} />,
    },
    {
      title: "Stock",
      dataIndex: "currentStock",
      key: "currentStock",
    },
    {
      title: "Potential Loss",
      dataIndex: "potentialLoss",
      key: "potentialLoss",
      render: (text) => <Text type="danger">${text}</Text>,
    },
  ];

  const recentProductsColumns = [
    {
      title: "Product",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Generic Name",
      dataIndex: "genericName",
      key: "genericName",
    },
    {
      title: "Category",
      dataIndex: "categoryName",
      key: "categoryName",
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Added On",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => formatDate(text),
    },
  ];

  return (
    <div className="p-6 bg-gray-50">
      <div className="mb-6">
        <Title level={2} className="mb-4">
          Inventory Dashboard
        </Title>

        {/* Summary Statistics */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} className="h-full">
              <Statistic
                title="Total Products"
                value={inventoryData.summary.totalProducts}
                prefix={<MedicineBoxOutlined />}
                valueStyle={{ color: "#3f8600" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} className="h-full">
              <Statistic
                title="Total Stock Units"
                value={inventoryData.summary.totalStockUnits}
                prefix={<StockOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} className="h-full">
              <Statistic
                title="Total Value"
                value={inventoryData.summary.totalCostValue}
                prefix={<DollarOutlined />}
                precision={2}
                valueStyle={{ color: "#1890ff" }}
                suffix="$"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} className="h-full">
              <Statistic
                title="Potential Profit"
                value={inventoryData.summary.totalPotentialProfit}
                prefix={<PercentageOutlined />}
                precision={2}
                valueStyle={{ color: "#3f8600" }}
                suffix="$"
              />
            </Card>
          </Col>
        </Row>

        {/* Alerts Section */}
        {inventoryData.lowStock.length > 0 ||
        inventoryData.expiring.length > 0 ? (
          <div className="mb-6">
            <Title level={4}>Alerts</Title>
            <Row gutter={[16, 16]}>
              {inventoryData.lowStock.length > 0 && (
                <Col xs={24} md={12}>
                  <Alert
                    type="warning"
                    message={`${inventoryData.lowStock.length} products below minimum stock level`}
                    description="Products need to be restocked soon"
                    showIcon
                    icon={<WarningOutlined />}
                    className="mb-4"
                  />
                </Col>
              )}
              {inventoryData.expiring.length > 0 && (
                <Col xs={24} md={12}>
                  <Alert
                    type="error"
                    message={`${inventoryData.expiring.length} batches expiring soon`}
                    description={`Potential loss: $${inventoryData.expiring.reduce(
                      (sum, item) => sum + item.potentialLoss,
                      0
                    )}`}
                    showIcon
                    icon={<ExclamationCircleOutlined />}
                    className="mb-4"
                  />
                </Col>
              )}
            </Row>
          </div>
        ) : null}

        {/* Main Content Tabs */}
        <Tabs defaultActiveKey="1" className="bg-white rounded shadow-sm p-4">
          <Tabs.TabPane tab="Overview" key="1">
            <Row gutter={[16, 16]}>
              {/* Stock Movement Chart */}
              <Col xs={24} lg={12}>
                <Card
                  title="Stock Turnover Rate"
                  bordered={false}
                  className="h-full"
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={stockTurnoverData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis
                        label={{
                          value: "Turnover Rate (%)",
                          angle: -90,
                          position: "insideLeft",
                        }}
                      />
                      <Tooltip
                        formatter={(value) => [`${value}%`, "Turnover Rate"]}
                      />
                      <Legend />
                      <Bar
                        dataKey="turnover"
                        name="Turnover Rate (%)"
                        fill="#8884d8"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </Col>

              {/* Category Distribution */}
              <Col xs={24} lg={12}>
                <Card
                  title="Category Distribution"
                  bordered={false}
                  className="h-full"
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {categoryData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name, props) => [
                          `${value} units`,
                          props.payload.name,
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
            </Row>

            {/* Recent Products */}
            <Card
              title="Recently Added Products"
              bordered={false}
              className="mt-6"
            >
              <Table
                dataSource={inventoryData.recentProducts}
                columns={recentProductsColumns}
                rowKey="_id"
                pagination={false}
              />
            </Card>
          </Tabs.TabPane>

          <Tabs.TabPane tab="Alerts & Warnings" key="2">
            <Row gutter={[16, 16]}>
              {/* Low Stock Table */}
              <Col xs={24}>
                <Card
                  title={
                    <Space>
                      <WarningOutlined style={{ color: "#faad14" }} />
                      <span>Low Stock Products</span>
                    </Space>
                  }
                  bordered={false}
                >
                  <Table
                    dataSource={inventoryData.lowStock}
                    columns={lowStockColumns}
                    rowKey="_id"
                    pagination={false}
                  />
                </Card>
              </Col>

              {/* Expiring Items */}
              <Col xs={24}>
                <Card
                  title={
                    <Space>
                      <CalendarOutlined style={{ color: "#ff4d4f" }} />
                      <span>Expiring Soon</span>
                    </Space>
                  }
                  bordered={false}
                >
                  <Table
                    dataSource={inventoryData.expiring}
                    columns={expiringColumns}
                    rowKey="_id"
                    pagination={false}
                  />
                </Card>
              </Col>
            </Row>
          </Tabs.TabPane>

          <Tabs.TabPane tab="Sales & Performance" key="3">
            <Row gutter={[16, 16]}>
              {/* Top Selling Products */}
              <Col xs={24} lg={12}>
                <Card
                  title="Top Selling Products"
                  bordered={false}
                  className="h-full"
                >
                  {inventoryData.topSellingProducts &&
                  inventoryData.topSellingProducts.length > 0 ? (
                    <div>
                      {inventoryData.topSellingProducts.map(
                        (product, index) => (
                          <div key={product._id || index} className="mb-4">
                            <div className="flex justify-between mb-1">
                              <Text strong>{product.productName}</Text>
                              <Text>{product.netQuantitySold} units sold</Text>
                            </div>
                            <Progress
                              percent={Math.min(
                                100,
                                (product.netQuantitySold / 20) * 100
                              )}
                              status="active"
                              strokeColor={COLORS[index % COLORS.length]}
                            />
                            <div className="text-right">
                              <Text type="secondary">
                                Revenue: ${product.totalRevenue}
                              </Text>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Text type="secondary">No sales data available</Text>
                    </div>
                  )}
                </Card>
              </Col>

              {/* Supplier Performance */}
              <Col xs={24} lg={12}>
                <Card
                  title="Supplier Performance"
                  bordered={false}
                  className="h-full"
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={supplierData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {supplierData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name, props) => [
                          `${value} units`,
                          props.payload.name,
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  <Divider />
                  <Space direction="vertical" className="w-full">
                    {inventoryData.supplierPerformance.map((supplier) => (
                      <div
                        key={supplier._id || supplier.supplierName}
                        className="flex justify-between"
                      >
                        <Text>{supplier.supplierName}</Text>
                        <Space>
                          <Tag color="blue">{supplier.batchCount} batches</Tag>
                          <Tag color="green">${supplier.totalStockValue}</Tag>
                        </Space>
                      </div>
                    ))}
                  </Space>
                </Card>
              </Col>

              {/* Sales Summary */}
              <Col xs={24}>
                <Card title="Sales Summary" bordered={false}>
                  <Row gutter={16}>
                    <Col xs={24} sm={8}>
                      <Statistic
                        title="Period Sales"
                        value={inventoryData.summary.periodSales}
                        precision={2}
                        valueStyle={{ color: "#3f8600" }}
                        prefix={<DollarOutlined />}
                        suffix="$"
                      />
                    </Col>
                    <Col xs={24} sm={8}>
                      <Statistic
                        title="Period Returns"
                        value={inventoryData.summary.periodReturns}
                        precision={2}
                        valueStyle={{ color: "#cf1322" }}
                        prefix={<ShoppingOutlined />}
                        suffix="$"
                      />
                    </Col>
                    <Col xs={24} sm={8}>
                      <Statistic
                        title="Avg Sale Value"
                        value={inventoryData.summary.periodAvgSaleValue}
                        precision={2}
                        valueStyle={{ color: "#1890ff" }}
                        prefix={<BarChartOutlined />}
                        suffix="$"
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          </Tabs.TabPane>
        </Tabs>
      </div>
    </div>
  );
};

export default InventoryDashboard;
