import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Button,
  Typography,
  Spin,
  Empty,
  Alert,
  Progress,
  Badge,
  Tag,
  Divider,
  Space,
} from "antd";
import {
  ShopOutlined,
  DollarOutlined,
  ShoppingOutlined,
  UserOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  WarningOutlined,
  CalendarOutlined,
  LineChartOutlined,
} from "@ant-design/icons";

import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import {
  useAuthStore,
  useInventoryStore,
  useStoreStore,
} from "../../Store/stores";
import useSaleStore from "../../Store/useSaleStore";
import { useProductStore } from "../../Store/productStore";
// import { useAuthStore } from "../../Store/stores";
// import useSaleStore from "../../Store/useSaleStore";
// import useStoreStore from "../../Store/useStoreStore"; // Fixed import
// import useInventoryStore from "../../Store/useInventoryStore"; // Fixed import
// import useProductStore from "../../Store/useProductStore"; // Fixed import

const { Title, Text } = Typography;

const Dashboard = () => {
  const { user } = useAuthStore();
  const { stores, fetchStores, isLoading: storesLoading } = useStoreStore();
  const { sales, fetchSales, isLoading: salesLoading } = useSaleStore();
  const {
    batches,
    fetchBatches,
    isLoading: inventoryLoading,
  } = useInventoryStore();
  const {
    products,
    fetchProducts,
    isLoading: productsLoading,
  } = useProductStore();

  const [salesData, setSalesData] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [topSellingProducts, setTopSellingProducts] = useState([]);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalStores: 0,
    totalProducts: 0,
    salesComparison: 0,
  });
  const [loadingError, setLoadingError] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoadingError(null);
        await fetchStores();

        // Only fetch other data if we have at least one store
        if (stores && stores.length > 0) {
          // Get sales for the past 30 days
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 30);

          // Use Promise.all for parallel fetching
          await Promise.all([
            fetchSales({ startDate, endDate }),
            fetchProducts(),
            fetchBatches(),
          ]);
        }
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
        setLoadingError(
          "Failed to load dashboard data. Please try again later."
        );
      }
    };

    loadDashboardData();
  }, [fetchStores, fetchSales, fetchProducts, fetchBatches, stores?.length]);

  // Process data for dashboard after data is loaded
  useEffect(() => {
    if (!sales || !products || !batches) return;

    try {
      if (sales.length > 0) {
        // Calculate total revenue from all sales
        const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);

        // Create daily sales data for chart
        const dailySales = {};
        sales.forEach((sale) => {
          const date = new Date(sale.createdAt).toLocaleDateString();
          if (!dailySales[date]) {
            dailySales[date] = { date, amount: 0, count: 0 };
          }
          dailySales[date].amount += sale.total;
          dailySales[date].count += 1;
        });

        // Convert to array and sort by date
        const salesDataArray = Object.values(dailySales).sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        );

        // Get only the last 7 days
        const last7DaysSales = salesDataArray.slice(-7);

        // Calculate sales comparison (today vs yesterday)
        let salesComparison = 0;
        if (salesDataArray.length >= 2) {
          const today = salesDataArray[salesDataArray.length - 1].amount || 0;
          const yesterday =
            salesDataArray[salesDataArray.length - 2].amount || 0;
          if (yesterday > 0) {
            salesComparison = ((today - yesterday) / yesterday) * 100;
          }
        }

        setSalesData(last7DaysSales);

        // Calculate top selling products
        const productSales = {};
        sales.forEach((sale) => {
          if (sale.items && Array.isArray(sale.items)) {
            sale.items.forEach((item) => {
              if (!productSales[item.product]) {
                productSales[item.product] = {
                  id: item.product,
                  quantity: 0,
                  revenue: 0,
                  name: "Unknown Product",
                };
              }
              productSales[item.product].quantity += item.quantity;
              productSales[item.product].revenue += item.price * item.quantity;
            });
          }
        });

        // Add product names
        for (const productId in productSales) {
          const product = products.find((p) => p._id === productId);
          if (product) {
            productSales[productId].name = product.name;
          }
        }

        const topProducts = Object.values(productSales)
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5);

        setTopSellingProducts(topProducts);

        // Find low stock items
        if (batches && batches.length > 0) {
          const lowStock = batches
            .filter(
              (batch) =>
                batch.currentStock <= batch.lowStockThreshold &&
                batch.currentStock > 0
            )
            .map((batch) => {
              const product = products.find((p) => p._id === batch.product);
              return {
                key: batch._id,
                productName: product ? product.name : "Unknown Product",
                batchNumber: batch.batchNumber,
                currentStock: batch.currentStock,
                threshold: batch.lowStockThreshold,
                expiryDate: new Date(batch.expiryDate).toLocaleDateString(),
                stockPercentage: Math.round(
                  (batch.currentStock / batch.lowStockThreshold) * 100
                ),
              };
            });

          setLowStockItems(lowStock);
        }

        // Update stats
        setStats({
          totalSales: sales.length,
          totalRevenue,
          totalStores: stores?.length || 0,
          totalProducts: products?.length || 0,
          salesComparison,
        });
      }
    } catch (error) {
      console.error("Error processing dashboard data:", error);
      setLoadingError("Error processing dashboard data");
    }
  }, [sales, batches, products, stores]);

  const lowStockColumns = [
    {
      title: "Product",
      dataIndex: "productName",
      key: "productName",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Batch",
      dataIndex: "batchNumber",
      key: "batchNumber",
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Stock Level",
      dataIndex: "stockPercentage",
      key: "stockPercentage",
      render: (percent, record) => (
        <Space>
          <Progress
            percent={percent}
            size="small"
            status={percent < 30 ? "exception" : "active"}
            strokeColor={
              percent < 30 ? "#f5222d" : percent < 50 ? "#faad14" : "#52c41a"
            }
          />
          <Text type={percent < 30 ? "danger" : "secondary"}>
            {record.currentStock}/{record.threshold}
          </Text>
        </Space>
      ),
    },
    {
      title: "Expiry Date",
      dataIndex: "expiryDate",
      key: "expiryDate",
      render: (text) => (
        <Space>
          <CalendarOutlined />
          {text}
        </Space>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button type="link" size="small">
          Restock
        </Button>
      ),
    },
  ];

  const isLoading =
    storesLoading || salesLoading || inventoryLoading || productsLoading;

  // Show a welcome message if user has no stores yet
  if (!isLoading && (!stores || stores.length === 0)) {
    return (
      <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
        <Card
          bordered={false}
          className="welcome-card"
          style={{
            textAlign: "center",
            padding: 32,
            backgroundColor: "#f7f7f7",
            borderRadius: 12,
          }}
        >
          <div style={{ marginBottom: 24 }}>
            <ShopOutlined style={{ fontSize: 64, color: "#1890ff" }} />
          </div>
          <Title level={2}>Welcome to your Inventory Management System</Title>
          <Text style={{ fontSize: 16, display: "block", marginBottom: 32 }}>
            Get started by creating your first store to manage inventory, track
            sales, and grow your business
          </Text>
          <Link to="/stores">
            <Button type="primary" size="large" icon={<ShopOutlined />}>
              Create Your First Store
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (loadingError) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="Error Loading Dashboard"
          description={loadingError}
          type="error"
          showIcon
          action={
            <Button
              size="small"
              danger
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div
      className="dashboard-container"
      style={{ padding: "12px 24px", maxWidth: 1400, margin: "0 auto" }}
    >
      <div style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              Dashboard
            </Title>
          </Col>
          <Col flex="auto">
            <Text type="secondary" style={{ fontSize: 16 }}>
              Welcome back, {user?.name || "User"}
            </Text>
          </Col>
          <Col>
            <Button type="primary" icon={<LineChartOutlined />}>
              Generate Report
            </Button>
          </Col>
        </Row>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", marginTop: 100, marginBottom: 100 }}>
          <Spin size="large" />
          <p style={{ marginTop: 16 }}>Loading dashboard data...</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card
                hoverable
                className="stat-card"
                bordered={false}
                style={{
                  borderRadius: 8,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.09)",
                }}
              >
                <Statistic
                  title={
                    <Text strong style={{ fontSize: 16 }}>
                      Total Revenue
                    </Text>
                  }
                  value={stats.totalRevenue}
                  precision={2}
                  valueStyle={{ color: "#3f8600", fontSize: 24 }}
                  prefix={<DollarOutlined />}
                  suffix=""
                />
                <div style={{ marginTop: 10 }}>
                  {stats.salesComparison > 0 ? (
                    <Text type="success">
                      <ArrowUpOutlined /> {stats.salesComparison.toFixed(1)}%
                      <Text type="secondary" style={{ marginLeft: 5 }}>
                        vs yesterday
                      </Text>
                    </Text>
                  ) : (
                    <Text type="danger">
                      <ArrowDownOutlined />{" "}
                      {Math.abs(stats.salesComparison).toFixed(1)}%
                      <Text type="secondary" style={{ marginLeft: 5 }}>
                        vs yesterday
                      </Text>
                    </Text>
                  )}
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                hoverable
                className="stat-card"
                bordered={false}
                style={{
                  borderRadius: 8,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.09)",
                }}
              >
                <Statistic
                  title={
                    <Text strong style={{ fontSize: 16 }}>
                      Total Sales
                    </Text>
                  }
                  value={stats.totalSales}
                  valueStyle={{ color: "#1890ff", fontSize: 24 }}
                  prefix={<ShoppingOutlined />}
                />
                <Link
                  to="/store/sales"
                  style={{ display: "block", marginTop: 10 }}
                >
                  <Text type="secondary">View all sales →</Text>
                </Link>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                hoverable
                className="stat-card"
                bordered={false}
                style={{
                  borderRadius: 8,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.09)",
                }}
              >
                <Statistic
                  title={
                    <Text strong style={{ fontSize: 16 }}>
                      Stores
                    </Text>
                  }
                  value={stats.totalStores}
                  valueStyle={{ color: "#722ed1", fontSize: 24 }}
                  prefix={<ShopOutlined />}
                />
                <Link to="/stores" style={{ display: "block", marginTop: 10 }}>
                  <Text type="secondary">Manage stores →</Text>
                </Link>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                hoverable
                className="stat-card"
                bordered={false}
                style={{
                  borderRadius: 8,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.09)",
                }}
              >
                <Statistic
                  title={
                    <Text strong style={{ fontSize: 16 }}>
                      Products
                    </Text>
                  }
                  value={stats.totalProducts}
                  valueStyle={{ color: "#fa8c16", fontSize: 24 }}
                  prefix={<ShoppingOutlined />}
                />
                <Link
                  to="/store/products"
                  style={{ display: "block", marginTop: 10 }}
                >
                  <Text type="secondary">Manage products →</Text>
                </Link>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            {/* Sales Chart */}
            <Col xs={24} lg={16}>
              <Card
                title={
                  <Space>
                    <LineChartOutlined style={{ color: "#1890ff" }} />
                    <Text strong>Sales Last 7 Days</Text>
                  </Space>
                }
                bordered={false}
                style={{
                  marginBottom: 24,
                  borderRadius: 8,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.09)",
                }}
                extra={<Button type="link">View Details</Button>}
              >
                {salesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart
                      data={salesData}
                      margin={{
                        top: 10,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => [
                          `$${value.toFixed(2)}`,
                          "Revenue",
                        ]}
                        contentStyle={{ borderRadius: 4 }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        name="Revenue"
                        stroke="#1890ff"
                        fill="url(#colorUv)"
                        activeDot={{ r: 6 }}
                      />
                      <defs>
                        <linearGradient
                          id="colorUv"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#1890ff"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#1890ff"
                            stopOpacity={0.1}
                          />
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No sales data available for the past week"
                    style={{ margin: "40px 0" }}
                  />
                )}
              </Card>
            </Col>

            {/* Top Selling Products */}
            <Col xs={24} lg={8}>
              <Card
                title={
                  <Space>
                    <ShoppingOutlined style={{ color: "#fa8c16" }} />
                    <Text strong>Top Selling Products</Text>
                  </Space>
                }
                bordered={false}
                style={{
                  marginBottom: 24,
                  borderRadius: 8,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.09)",
                }}
              >
                {topSellingProducts.length > 0 ? (
                  <div>
                    {topSellingProducts.map((product, index) => (
                      <div
                        key={product.id}
                        style={{ marginBottom: 12, padding: "8px 0" }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <Space>
                            <Badge
                              count={index + 1}
                              style={{
                                backgroundColor:
                                  index < 3 ? "#1890ff" : "#d9d9d9",
                              }}
                            />
                            <Text ellipsis style={{ maxWidth: 150 }}>
                              {product.name}
                            </Text>
                          </Space>
                          <Text strong>${product.revenue.toFixed(2)}</Text>
                        </div>
                        <div style={{ marginTop: 5 }}>
                          <Progress
                            percent={Math.round(
                              (product.quantity /
                                topSellingProducts[0].quantity) *
                                100
                            )}
                            showInfo={false}
                            size="small"
                            strokeColor="#1890ff"
                          />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {product.quantity} units sold
                          </Text>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No product sales data available"
                    style={{ margin: "40px 0" }}
                  />
                )}
              </Card>
            </Col>
          </Row>

          {/* Low Stock Items */}
          <Card
            title={
              <Space>
                <WarningOutlined style={{ color: "#faad14" }} />
                <Text strong>Low Stock Items</Text>
              </Space>
            }
            extra={<Link to="/store/inventory">View All Inventory</Link>}
            bordered={false}
            style={{ borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.09)" }}
          >
            {lowStockItems.length > 0 ? (
              <>
                {lowStockItems.length > 5 && (
                  <Alert
                    message={`You have ${lowStockItems.length} items with low stock that need attention`}
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16, borderRadius: 4 }}
                    action={<Button size="small">Order Now</Button>}
                  />
                )}
                <Table
                  columns={lowStockColumns}
                  dataSource={lowStockItems}
                  pagination={{ pageSize: 5 }}
                  size="middle"
                  bordered={false}
                  rowClassName={(record) =>
                    record.stockPercentage < 30 ? "low-stock-warning" : ""
                  }
                  style={{ marginTop: 16 }}
                />
              </>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No items with low stock"
                style={{ margin: "40px 0" }}
              />
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default Dashboard;
