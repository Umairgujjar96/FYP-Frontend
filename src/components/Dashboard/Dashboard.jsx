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
  Space,
} from "antd";
import {
  ShopOutlined,
  DollarOutlined,
  ShoppingOutlined,
  LineChartOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  WarningOutlined,
  CalendarOutlined,
} from "@ant-design/icons";

import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useAuthStore, useStoreStore } from "../../Store/stores";
import useSaleStore from "../../Store/useSaleStore";
import { useProductStore } from "../../Store/productStore";
import RestockMedicineModal from "./RestockMed";

const { Title, Text } = Typography;

const Dashboard = () => {
  const { user } = useAuthStore();
  const { stores, fetchStores, isLoading: storesLoading } = useStoreStore();
  const { sales, fetchSales, isLoading: salesLoading } = useSaleStore();
  const [restockModalVisible, setRestockModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [restockLoading, setRestockLoading] = useState(false);

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
    totalStores: 1, // Default to 1 since there's only one store
    totalProducts: 0,
    salesComparison: 0,
  });
  const [loadingError, setLoadingError] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoadingError(null);
        await fetchStores();
      } catch (error) {
        console.error("Failed to load stores:", error);
        setLoadingError(
          "Failed to load dashboard data. Please try again later."
        );
      }
    };

    loadDashboardData();
  }, [fetchStores]);

  // Load other data only after stores are loaded
  useEffect(() => {
    const loadAdditionalData = async () => {
      if (!stores || stores.length === 0) return;

      try {
        // Get sales for the past 30 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        // Use Promise.all for parallel fetching
        await Promise.all([
          fetchSales({ startDate, endDate }),
          fetchProducts(),
        ]);
      } catch (error) {
        console.error("Failed to load additional dashboard data:", error);
        setLoadingError(
          "Failed to load dashboard data. Please try again later."
        );
      }
    };

    loadAdditionalData();
  }, [fetchSales, fetchProducts, stores]);

  // Process data for dashboard after data is loaded
  useEffect(() => {
    if (salesLoading || productsLoading) return;
    if (!sales || !products) return;

    try {
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

      // Get only the last 7 days (or pad with zeros if less than 7 days of data)
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString();
        const existingData = salesDataArray.find(
          (item) => item.date === dateStr
        );
        if (existingData) {
          last7Days.push(existingData);
        } else {
          last7Days.push({ date: dateStr, amount: 0, count: 0 });
        }
      }

      // Calculate sales comparison (today vs yesterday)
      let salesComparison = 0;
      const today = last7Days[6].amount;
      const yesterday = last7Days[5].amount;
      if (yesterday > 0) {
        salesComparison = ((today - yesterday) / yesterday) * 100;
      }

      setSalesData(last7Days);

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
            productSales[item.product].revenue +=
              item.unitPrice * item.quantity;
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

      // Find low stock items from products directly (not using batches)
      const lowStock = products
        .filter((product) => product.isLowStock)
        .map((product) => ({
          key: product._id,
          productName: product.name,
          productId: product._id,
          currentStock: product.totalStock,
          threshold: product.minStockLevel,
          expiryDate: product.nearestExpiryDate
            ? new Date(product.nearestExpiryDate).toLocaleDateString()
            : "N/A",
          stockPercentage: Math.round(
            (product.totalStock / product.minStockLevel) * 100
          ),
        }));

      setLowStockItems(lowStock);

      // Update stats
      setStats({
        totalSales: sales.length,
        totalRevenue,
        totalStores: 1, // Always 1 store as per requirement
        totalProducts: products?.length || 0,
        salesComparison,
      });
    } catch (error) {
      console.error("Error processing dashboard data:", error);
      setLoadingError("Error processing dashboard data");
    }
  }, [sales, products, salesLoading, productsLoading]);

  const lowStockColumns = [
    {
      title: "Product",
      dataIndex: "productName",
      key: "productName",
      render: (text) => <Text strong>{text}</Text>,
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
        <Button
          type="link"
          size="small"
          onClick={() => {
            setSelectedProduct(record);
            setRestockModalVisible(true);
          }}
        >
          Restock
        </Button>
      ),
    },
  ];

  const isLoading = storesLoading || salesLoading || productsLoading;

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

  const handleRestock = async (restockData) => {
    try {
      setRestockLoading(true);

      // Call your API to update the stock
      // Example:
      // await updateProductStock(restockData);

      console.log("Restocking with data:", restockData);

      // Show success message
      message.success(`Successfully restocked ${restockData.productName}`);

      // Close modal and refresh data
      setRestockModalVisible(false);
      fetchProducts(); // Refresh product data
    } catch (error) {
      console.error("Failed to restock:", error);
      message.error("Failed to restock product. Please try again.");
    } finally {
      setRestockLoading(false);
    }
  };

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
                      Store
                    </Text>
                  }
                  value={stores && stores.length > 0 ? stores[0].name : "Store"}
                  valueStyle={{ color: "#722ed1", fontSize: 24 }}
                  prefix={<ShopOutlined />}
                />
                <Link to="/stores" style={{ display: "block", marginTop: 10 }}>
                  <Text type="secondary">View store details →</Text>
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
                {salesData && salesData.length > 0 ? (
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
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getMonth() + 1}/${date.getDate()}`;
                        }}
                      />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => [
                          `$${value.toFixed(2)}`,
                          "Revenue",
                        ]}
                        labelFormatter={(label) => `Date: ${label}`}
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
                {topSellingProducts && topSellingProducts.length > 0 ? (
                  <div>
                    {topSellingProducts.map((product, index) => (
                      <div
                        key={product.id}
                        style={{
                          marginBottom: 12,
                          padding: "8px 0",
                          borderBottom:
                            index < topSellingProducts.length - 1
                              ? "1px solid #f0f0f0"
                              : "none",
                        }}
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
                                  index === 0
                                    ? "#f5222d"
                                    : index === 1
                                    ? "#fa8c16"
                                    : index === 2
                                    ? "#52c41a"
                                    : "#d9d9d9",
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
                                (topSellingProducts[0]?.quantity || 1)) *
                                100
                            )}
                            showInfo={false}
                            size="small"
                            strokeColor={
                              index === 0
                                ? "#f5222d"
                                : index === 1
                                ? "#fa8c16"
                                : index === 2
                                ? "#52c41a"
                                : "#1890ff"
                            }
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
            {lowStockItems && lowStockItems.length > 0 ? (
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
      <RestockMedicineModal
        visible={restockModalVisible}
        onCancel={() => setRestockModalVisible(false)}
        onRestock={handleRestock}
        product={selectedProduct}
        loading={restockLoading}
      />
    </div>
  );
};

export default Dashboard;
