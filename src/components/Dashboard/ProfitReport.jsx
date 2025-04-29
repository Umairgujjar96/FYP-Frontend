import React, { useState, useEffect } from "react";
import {
  Card,
  Spin,
  Form,
  Select,
  DatePicker,
  Button,
  Table,
  Statistic,
  Alert,
  Tabs,
  Space,
  Typography,
  Divider,
  Row,
  Col,
  Badge,
  Switch,
  Tooltip,
} from "antd";
import {
  FileExcelOutlined,
  FileTextOutlined,
  PieChartOutlined,
  ReloadOutlined,
  DownloadOutlined,
  DollarOutlined,
  LineChartOutlined,
  CreditCardOutlined,
  ShoppingOutlined,
  SwapOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { Line, Bar, Pie } from "@ant-design/plots";
import dayjs from "dayjs";
import useProfitGenerateStore from "../../Store/useProfitGenerate";

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Option } = Select;

const ProfitReportComponent = ({ stores = [] }) => {
  const [form] = Form.useForm();
  const [reportType, setReportType] = useState("monthly");
  const [storeId, setStoreId] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [initialized, setInitialized] = useState(false);
  const [includeProductDetails, setIncludeProductDetails] = useState(true);

  // Connect to store
  const {
    isLoading,
    error,
    report,
    exportLoading,
    generateProfitReport,
    exportProfitReport,
    resetState,
  } = useProfitGenerateStore();

  // Initialize with current month report when component loads
  useEffect(() => {
    if (!initialized && !isLoading && !report) {
      const defaultParams = {
        reportType: "monthly",
        includeProductDetails: true,
      };
      generateProfitReport(defaultParams);
      setInitialized(true);
    }
  }, [initialized, isLoading, report, generateProfitReport]);

  // Handle form submission
  const handleSubmit = (values) => {
    const params = {
      reportType: values.reportType,
      includeProductDetails,
    };

    // Add store filter if selected
    if (values.storeId) {
      params.storeId = values.storeId;
    }

    // Add custom date range if provided
    if (values.dateRange && values.dateRange.length === 2) {
      params.startDate = values.dateRange[0].format("YYYY-MM-DD");
      params.endDate = values.dateRange[1].format("YYYY-MM-DD");
    }

    generateProfitReport(params);
  };

  // Handle export
  const handleExport = (format) => {
    const params = form.getFieldsValue();

    const exportParams = {
      reportType: params.reportType,
      includeProductDetails: true, // Always include product details for exports
      format,
    };

    // Add store filter if selected
    if (params.storeId) {
      exportParams.storeId = params.storeId;
    }

    // Add custom date range if provided
    if (params.dateRange && params.dateRange.length === 2) {
      exportParams.startDate = params.dateRange[0].format("YYYY-MM-DD");
      exportParams.endDate = params.dateRange[1].format("YYYY-MM-DD");
    }

    exportProfitReport(exportParams, format);
  };

  // Columns for main data table
  const getColumns = () => {
    const baseColumns = [
      {
        title: "Date",
        dataIndex: "dateLabel",
        key: "date",
      },
    ];

    // Add hour column for daily reports if not in dateLabel
    if (
      report?.dateRange?.reportType === "daily" &&
      report.detail?.[0]?.dateLabel &&
      !report.detail[0].dateLabel.includes(":")
    ) {
      baseColumns.push({
        title: "Hour",
        dataIndex: "hour",
        key: "hour",
        render: (value) => `${String(value || 0).padStart(2, "0")}:00`,
      });
    }

    const additionalColumns = [
      {
        title: "Store",
        dataIndex: "storeName",
        key: "store",
      },
      {
        title: "Revenue",
        dataIndex: "revenue",
        key: "revenue",
        render: (value) => `$${value.toFixed(2)}`,
        sorter: (a, b) => a.revenue - b.revenue,
      },
      {
        title: "Cost",
        dataIndex: "cost",
        key: "cost",
        render: (value) => `$${value.toFixed(2)}`,
        sorter: (a, b) => a.cost - b.cost,
      },
      {
        title: "Profit",
        dataIndex: "profit",
        key: "profit",
        render: (value) => (
          <span className={value >= 0 ? "text-green-600" : "text-red-600"}>
            ${value.toFixed(2)}
          </span>
        ),
        sorter: (a, b) => a.profit - b.profit,
      },
      {
        title: "Profit Margin",
        dataIndex: "profitMargin",
        key: "profitMargin",
        render: (value) => `${value.toFixed(2)}%`,
        sorter: (a, b) => a.profitMargin - b.profitMargin,
      },
      {
        title: "Items Sold",
        dataIndex: "totalQuantity",
        key: "totalQuantity",
        sorter: (a, b) => a.totalQuantity - b.totalQuantity,
      },
      {
        title: "Returns",
        dataIndex: "returnedQuantity",
        key: "returnedQuantity",
        sorter: (a, b) => a.returnedQuantity - b.returnedQuantity,
      },
      {
        title: "Net Quantity",
        dataIndex: "netQuantity",
        key: "netQuantity",
        render: (_, record) => record.totalQuantity - record.returnedQuantity,
        sorter: (a, b) =>
          a.totalQuantity -
          a.returnedQuantity -
          (b.totalQuantity - b.returnedQuantity),
      },
      {
        title: "Return Rate",
        dataIndex: "returnRate",
        key: "returnRate",
        render: (value) => `${value.toFixed(2)}%`,
        sorter: (a, b) => a.returnRate - b.returnRate,
      },
    ];

    return [...baseColumns, ...additionalColumns];
  };

  // Columns for products table
  const getProductColumns = () => {
    return [
      {
        title: "Product",
        dataIndex: "productName",
        key: "productName",
      },
      {
        title: "Generic Name",
        dataIndex: "genericName",
        key: "genericName",
      },
      {
        title: "Quantity Sold",
        dataIndex: "totalQuantity",
        key: "totalQuantity",
        sorter: (a, b) => a.totalQuantity - b.totalQuantity,
      },
      {
        title: "Returns",
        dataIndex: "returnedQuantity",
        key: "returnedQuantity",
        sorter: (a, b) => a.returnedQuantity - b.returnedQuantity,
      },
      {
        title: "Net Quantity",
        dataIndex: "netQuantity",
        key: "netQuantity",
        sorter: (a, b) => a.netQuantity - b.netQuantity,
      },
      {
        title: "Revenue",
        dataIndex: "revenue",
        key: "revenue",
        render: (value) => `$${value.toFixed(2)}`,
        sorter: (a, b) => a.revenue - b.revenue,
      },
      {
        title: "Cost",
        dataIndex: "cost",
        key: "cost",
        render: (value) => `$${value.toFixed(2)}`,
        sorter: (a, b) => a.cost - b.cost,
      },
      {
        title: "Profit",
        dataIndex: "profit",
        key: "profit",
        render: (value) => (
          <span className={value >= 0 ? "text-green-600" : "text-red-600"}>
            ${value.toFixed(2)}
          </span>
        ),
        sorter: (a, b) => a.profit - b.profit,
      },
      {
        title: "Profit Margin",
        dataIndex: "profitMargin",
        key: "profitMargin",
        render: (value) => `${value.toFixed(2)}%`,
        sorter: (a, b) => a.profitMargin - b.profitMargin,
      },
      {
        title: "Return Rate",
        dataIndex: "returnRate",
        key: "returnRate",
        render: (value) => `${value.toFixed(2)}%`,
        sorter: (a, b) => a.returnRate - b.returnRate,
      },
    ];
  };

  // Payment method columns
  const getPaymentMethodColumns = () => {
    return [
      {
        title: "Payment Method",
        dataIndex: "method",
        key: "method",
        render: (value) => value.charAt(0).toUpperCase() + value.slice(1),
      },
      {
        title: "Transaction Count",
        dataIndex: "count",
        key: "count",
        sorter: (a, b) => a.count - b.count,
      },
      {
        title: "Items Sold",
        dataIndex: "items",
        key: "items",
        sorter: (a, b) => a.items - b.items,
      },
      {
        title: "Revenue",
        dataIndex: "revenue",
        key: "revenue",
        render: (value) => `$${value.toFixed(2)}`,
        sorter: (a, b) => a.revenue - b.revenue,
      },
      {
        title: "Profit",
        dataIndex: "profit",
        key: "profit",
        render: (value) => (
          <span className={value >= 0 ? "text-green-600" : "text-red-600"}>
            ${value.toFixed(2)}
          </span>
        ),
        sorter: (a, b) => a.profit - b.profit,
      },
      {
        title: "Profit Margin",
        dataIndex: "profitMargin",
        key: "profitMargin",
        render: (value) => `${value.toFixed(2)}%`,
        sorter: (a, b) => a.profitMargin - b.profitMargin,
      },
      {
        title: "% of Total Revenue",
        dataIndex: "percentOfTotal",
        key: "percentOfTotal",
        render: (value) => `${value.toFixed(2)}%`,
        sorter: (a, b) => a.percentOfTotal - b.percentOfTotal,
      },
    ];
  };

  // Profit Trend Chart
  const renderProfitTrendChart = () => {
    if (!report || !report.detail || report.detail.length === 0) {
      return (
        <Alert
          message="No data available for chart visualization"
          type="info"
        />
      );
    }

    const data = report.detail
      .map((item) => ({
        date: item.dateLabel,
        value: item.profit,
        category: "Profit",
      }))
      .concat(
        report.detail.map((item) => ({
          date: item.dateLabel,
          value: item.revenue,
          category: "Revenue",
        }))
      )
      .concat(
        report.detail.map((item) => ({
          date: item.dateLabel,
          value: item.cost,
          category: "Cost",
        }))
      );

    const config = {
      data,
      xField: "date",
      yField: "value",
      seriesField: "category",
      yAxis: {
        label: {
          formatter: (v) => `$${v}`,
        },
      },
      legend: {
        position: "top",
      },
      smooth: true,
      animation: {
        appear: {
          animation: "wave-in",
          duration: 1500,
        },
      },
      lineStyle: ({ category }) => {
        if (category === "Profit") {
          return { stroke: "#52c41a", lineWidth: 3 };
        }
        if (category === "Revenue") {
          return { stroke: "#1890ff", lineWidth: 2 };
        }
        return { stroke: "#f5222d", lineWidth: 2 };
      },
      point: {
        size: 5,
        shape: "diamond",
        style: ({ category }) => {
          if (category === "Profit") {
            return { fill: "#52c41a", stroke: "#52c41a" };
          }
          if (category === "Revenue") {
            return { fill: "#1890ff", stroke: "#1890ff" };
          }
          return { fill: "#f5222d", stroke: "#f5222d" };
        },
      },
    };

    return <Line {...config} height={400} />;
  };

  // Product Performance Chart
  const renderProductPerformanceChart = () => {
    if (
      !report ||
      !report.productAnalytics ||
      report.productAnalytics.length === 0
    ) {
      return (
        <Alert
          message="No product data available for visualization"
          type="info"
        />
      );
    }

    // Get top 10 products by profit
    const data = report.productAnalytics
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10)
      .map((product) => ({
        product: product.productName,
        profit: product.profit,
      }));

    const config = {
      data,
      xField: "profit",
      yField: "product",
      seriesField: "product",
      legend: false,
      meta: {
        profit: {
          formatter: (v) => `$${v.toFixed(2)}`,
        },
      },
      yAxis: {
        label: {
          formatter: (v) => {
            return v.length > 20 ? `${v.slice(0, 18)}...` : v;
          },
        },
      },
      tooltip: {
        formatter: (datum) => {
          return { name: datum.product, value: `$${datum.profit.toFixed(2)}` };
        },
      },
      barStyle: {
        fill: "l(0) 0:#1890ff 1:#52c41a",
      },
      interactions: [{ type: "element-active" }],
    };

    return <Bar {...config} height={400} />;
  };

  // Payment Method Chart
  const renderPaymentMethodChart = () => {
    if (
      !report ||
      !report.paymentMethodAnalytics ||
      report.paymentMethodAnalytics.length === 0
    ) {
      return (
        <Alert
          message="No payment method data available for visualization"
          type="info"
        />
      );
    }

    const data = report.paymentMethodAnalytics.map((item) => ({
      type: item.method.charAt(0).toUpperCase() + item.method.slice(1),
      value: item.revenue,
      percentage: item.percentOfTotal,
    }));

    const config = {
      appendPadding: 10,
      data,
      angleField: "value",
      colorField: "type",
      radius: 0.8,
      label: {
        type: "outer",
        content: "{name}: {percentage}%",
      },
      interactions: [{ type: "element-active" }],
      tooltip: {
        formatter: (datum) => {
          return {
            name: datum.type,
            value: `$${datum.value.toFixed(2)} (${datum.percentage.toFixed(
              2
            )}%)`,
          };
        },
      },
    };

    return <Pie {...config} height={400} />;
  };

  // Summary Cards
  const renderSummaryCards = () => {
    if (!report || !report.summary) {
      return <Spin tip="Loading summary data..." />;
    }

    const { summary } = report;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="shadow-md">
          <Statistic
            title="Total Revenue"
            value={summary.totalRevenue}
            precision={2}
            prefix={<DollarOutlined />}
            valueStyle={{ color: "#1890ff" }}
            suffix=""
          />
        </Card>
        <Card className="shadow-md">
          <Statistic
            title="Total Cost"
            value={summary.totalCost}
            precision={2}
            prefix={<DollarOutlined />}
            valueStyle={{ color: "#ff4d4f" }}
            suffix=""
          />
        </Card>
        <Card className="shadow-md">
          <Statistic
            title="Total Profit"
            value={summary.totalProfit}
            precision={2}
            prefix={<DollarOutlined />}
            valueStyle={{ color: "#52c41a" }}
            suffix=""
          />
        </Card>
        <Card className="shadow-md">
          <Statistic
            title="Profit Margin"
            value={summary.grossProfitMargin}
            precision={2}
            prefix={<LineChartOutlined />}
            valueStyle={{ color: "#722ed1" }}
            suffix="%"
          />
        </Card>
      </div>
    );
  };

  // Additional Summary Cards
  const renderAdditionalSummaryCards = () => {
    if (!report || !report.summary) {
      return null;
    }

    const { summary } = report;

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="shadow-md">
          <Statistic
            title={
              <span>
                Items Sold{" "}
                <Tooltip title="Total number of items sold during this period">
                  <InfoCircleOutlined style={{ fontSize: "14px" }} />
                </Tooltip>
              </span>
            }
            value={summary.totalItems}
            prefix={<ShoppingOutlined />}
            valueStyle={{ color: "#1890ff" }}
          />
        </Card>
        <Card className="shadow-md">
          <Statistic
            title={
              <span>
                Return Rate{" "}
                <Tooltip title="Percentage of items returned out of total sold">
                  <InfoCircleOutlined style={{ fontSize: "14px" }} />
                </Tooltip>
              </span>
            }
            value={summary.returnRate}
            precision={2}
            prefix={<SwapOutlined />}
            valueStyle={{
              color: summary.returnRate > 10 ? "#ff4d4f" : "#faad14",
            }}
            suffix="%"
          />
        </Card>
        <Card className="shadow-md">
          <Statistic
            title="Net Items (After Returns)"
            value={summary.netItems}
            prefix={<ShoppingOutlined />}
            valueStyle={{ color: "#52c41a" }}
          />
        </Card>
      </div>
    );
  };

  return (
    <div className="profit-report-container p-4">
      <Card className="mb-6 shadow-lg">
        <Title level={3} className="mb-6">
          <PieChartOutlined className="mr-2" /> Profit & Revenue Report
        </Title>

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            reportType: "monthly",
          }}
          onFinish={handleSubmit}
          className="mb-4"
        >
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="reportType"
                label="Report Type"
                rules={[
                  { required: true, message: "Please select report type" },
                ]}
              >
                <Select
                  onChange={(value) => setReportType(value)}
                  placeholder="Select report type"
                >
                  <Option value="daily">Daily</Option>
                  <Option value="weekly">Weekly</Option>
                  <Option value="monthly">Monthly</Option>
                  <Option value="yearly">Yearly</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item name="storeId" label="Store">
                <Select
                  onChange={(value) => setStoreId(value)}
                  placeholder="All Stores"
                  allowClear
                >
                  {stores.map((store) => (
                    <Option key={store._id} value={store._id}>
                      {store.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item name="dateRange" label="Custom Date Range">
                <RangePicker
                  onChange={(dates) => setDateRange(dates)}
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6} className="flex items-end">
              <Form.Item label="Include Product Details">
                <Space>
                  <Switch
                    checked={includeProductDetails}
                    onChange={(checked) => setIncludeProductDetails(checked)}
                  />
                  <Tooltip title="Enable to view detailed product analytics and payment methods">
                    <InfoCircleOutlined />
                  </Tooltip>
                </Space>
              </Form.Item>
            </Col>

            <Col xs={24} className="flex mt-4">
              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<LineChartOutlined />}
                    loading={isLoading}
                  >
                    Generate Report
                  </Button>
                  <Button
                    onClick={() => {
                      form.resetFields();
                      resetState();
                      setInitialized(false);
                    }}
                    icon={<ReloadOutlined />}
                  >
                    Reset
                  </Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>

        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            closable
            className="mb-4"
          />
        )}

        {report && report.dateRange && (
          <div className="bg-gray-50 p-3 rounded-md mb-4">
            <Space direction="vertical" size="small">
              <Text strong>{report.title}</Text>
              <Text type="secondary">
                Period: {dayjs(report.dateRange.start).format("MMM D, YYYY")} -{" "}
                {dayjs(report.dateRange.end).format("MMM D, YYYY")}
              </Text>
            </Space>
          </div>
        )}

        <div className="flex justify-end mb-4">
          <Space>
            <Badge count={exportLoading ? <Spin size="small" /> : 0}>
              <Button
                onClick={() => handleExport("csv")}
                icon={<FileTextOutlined />}
                disabled={!report || isLoading || exportLoading}
              >
                Export CSV
              </Button>
            </Badge>
            <Badge count={exportLoading ? <Spin size="small" /> : 0}>
              <Button
                onClick={() => handleExport("excel")}
                icon={<FileExcelOutlined />}
                disabled={!report || isLoading || exportLoading || true}
              >
                Export Excel
              </Button>
            </Badge>
          </Space>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" tip="Generating report..." />
        </div>
      ) : report ? (
        <div>
          {renderSummaryCards()}
          {renderAdditionalSummaryCards()}

          <Card className="shadow-md mb-6">
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              type="card"
              size="large"
              className="mb-4"
            >
              <TabPane tab="Summary" key="summary">
                <div className="mb-6">
                  <Title level={4} className="mb-4">
                    Profit Trend
                  </Title>
                  {renderProfitTrendChart()}
                </div>

                <Divider />

                <div>
                  <Title level={4} className="mb-4">
                    Detailed Data
                  </Title>
                  <Table
                    columns={getColumns()}
                    dataSource={report.detail.map((item, index) => ({
                      ...item,
                      key: index,
                    }))}
                    scroll={{ x: "max-content" }}
                    pagination={{ pageSize: 10 }}
                    bordered
                    summary={() => (
                      <Table.Summary fixed>
                        <Table.Summary.Row>
                          <Table.Summary.Cell
                            index={0}
                            colSpan={
                              report?.dateRange?.reportType === "daily" &&
                              report.detail?.[0]?.dateLabel &&
                              !report.detail[0].dateLabel.includes(":")
                                ? 3
                                : 2
                            }
                          >
                            <strong>Totals</strong>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={2}>
                            <strong>
                              ${report.summary.totalRevenue.toFixed(2)}
                            </strong>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={3}>
                            <strong>
                              ${report.summary.totalCost.toFixed(2)}
                            </strong>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={4}>
                            <strong
                              className={
                                report.summary.totalProfit >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              ${report.summary.totalProfit.toFixed(2)}
                            </strong>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={5}>
                            <strong>
                              {report.summary.grossProfitMargin.toFixed(2)}%
                            </strong>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={6}>
                            <strong>{report.summary.totalItems}</strong>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={7}>
                            <strong>{report.summary.totalReturns}</strong>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={8}>
                            <strong>{report.summary.netItems}</strong>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={9}>
                            <strong>
                              {report.summary.returnRate.toFixed(2)}%
                            </strong>
                          </Table.Summary.Cell>
                        </Table.Summary.Row>
                      </Table.Summary>
                    )}
                  />
                </div>
              </TabPane>

              <TabPane
                tab="Product Analytics"
                key="products"
                disabled={
                  !report.productAnalytics ||
                  report.productAnalytics.length === 0
                }
              >
                <div className="mb-6">
                  <Title level={4} className="mb-4">
                    Top Products by Profit
                  </Title>
                  {renderProductPerformanceChart()}
                </div>

                <Divider />

                <div>
                  <Title level={4} className="mb-4">
                    Product Details
                  </Title>
                  <Table
                    columns={getProductColumns()}
                    dataSource={
                      report.productAnalytics
                        ? report.productAnalytics.map((item, index) => ({
                            ...item,
                            key: item.productId || index,
                          }))
                        : []
                    }
                    scroll={{ x: "max-content" }}
                    pagination={{ pageSize: 10 }}
                    bordered
                    expandable={{
                      expandedRowRender: (record) => (
                        <div className="p-4">
                          <Title level={5} className="mb-3">
                            Batch Details
                          </Title>
                          <Table
                            columns={[
                              {
                                title: "Batch Number",
                                dataIndex: "batchNumber",
                                key: "batchNumber",
                              },
                              {
                                title: "Purchase Price",
                                dataIndex: "purchasePrice",
                                key: "purchasePrice",
                                render: (value) => `$${value.toFixed(2)}`,
                              },
                              {
                                title: "Selling Price",
                                dataIndex: "sellingPrice",
                                key: "sellingPrice",
                                render: (value) => `$${value.toFixed(2)}`,
                              },
                              {
                                title: "Quantity",
                                dataIndex: "quantity",
                                key: "quantity",
                              },
                              {
                                title: "Returns",
                                dataIndex: "returnedQuantity",
                                key: "returnedQuantity",
                              },
                              {
                                title: "Net Quantity",
                                dataIndex: "netQuantity",
                                key: "netQuantity",
                              },
                              {
                                title: "Revenue",
                                dataIndex: "revenue",
                                key: "revenue",
                                render: (value) => `$${value.toFixed(2)}`,
                              },
                              {
                                title: "Cost",
                                dataIndex: "cost",
                                key: "cost",
                                render: (value) => `$${value.toFixed(2)}`,
                              },
                              {
                                title: "Profit",
                                dataIndex: "profit",
                                key: "profit",
                                render: (value) => (
                                  <span
                                    className={
                                      value >= 0
                                        ? "text-green-600"
                                        : "text-red-600"
                                    }
                                  >
                                    ${value.toFixed(2)}
                                  </span>
                                ),
                              },
                            ]}
                            dataSource={
                              record.batches
                                ? record.batches.map((batch, i) => ({
                                    ...batch,
                                    key: i,
                                  }))
                                : []
                            }
                            pagination={false}
                            size="small"
                          />
                        </div>
                      ),
                      rowExpandable: (record) =>
                        record.batches && record.batches.length > 0,
                    }}
                  />
                </div>
              </TabPane>

              <TabPane
                tab="Payment Methods"
                key="payments"
                disabled={
                  !report.paymentMethodAnalytics ||
                  report.paymentMethodAnalytics.length === 0
                }
              >
                <div className="mb-6">
                  <Title level={4} className="mb-4">
                    Revenue by Payment Method
                  </Title>
                  {renderPaymentMethodChart()}
                </div>

                <Divider />

                <div>
                  <Title level={4} className="mb-4">
                    Payment Method Details
                  </Title>
                  <Table
                    columns={getPaymentMethodColumns()}
                    dataSource={
                      report.paymentMethodAnalytics
                        ? report.paymentMethodAnalytics.map((item, index) => ({
                            ...item,
                            key: item.method || index,
                          }))
                        : []
                    }
                    pagination={false}
                    bordered
                  />
                </div>
              </TabPane>
            </Tabs>
          </Card>

          {report.summary && (
            <Card className="shadow-md mb-6">
              <div className="mb-4">
                <Title level={4}>Report Summary</Title>
                <Text type="secondary">
                  Key performance indicators and metrics
                </Text>
              </div>

              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Card className="bg-gray-50">
                    <Title level={5}>Financial Summary</Title>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>
                        <Text strong>Total Revenue:</Text> $
                        {report.summary.totalRevenue.toFixed(2)}
                      </li>
                      <li>
                        <Text strong>Total Cost:</Text> $
                        {report.summary.totalCost.toFixed(2)}
                      </li>
                      <li>
                        <Text strong>Gross Profit:</Text>{" "}
                        <Text
                          className={
                            report.summary.totalProfit >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          ${report.summary.totalProfit.toFixed(2)}
                        </Text>
                      </li>
                      <li>
                        <Text strong>Profit Margin:</Text>{" "}
                        <Text
                          className={
                            report.summary.grossProfitMargin >= 20
                              ? "text-green-600"
                              : report.summary.grossProfitMargin >= 10
                              ? "text-yellow-600"
                              : "text-red-600"
                          }
                        >
                          {report.summary.grossProfitMargin.toFixed(2)}%
                        </Text>
                      </li>
                    </ul>
                  </Card>
                </Col>

                <Col xs={24} md={12}>
                  <Card className="bg-gray-50">
                    <Title level={5}>Inventory Summary</Title>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>
                        <Text strong>Items Sold:</Text>{" "}
                        {report.summary.totalItems}
                      </li>
                      <li>
                        <Text strong>Items Returned:</Text>{" "}
                        {report.summary.totalReturns}
                      </li>
                      <li>
                        <Text strong>Net Items:</Text> {report.summary.netItems}
                      </li>
                      <li>
                        <Text strong>Return Rate:</Text>{" "}
                        <Text
                          className={
                            report.summary.returnRate >= 10
                              ? "text-red-600"
                              : report.summary.returnRate >= 5
                              ? "text-yellow-600"
                              : "text-green-600"
                          }
                        >
                          {report.summary.returnRate.toFixed(2)}%
                        </Text>
                      </li>
                    </ul>
                  </Card>
                </Col>
              </Row>

              {report.topPerformers && (
                <Row className="mt-4">
                  <Col xs={24}>
                    <Card className="bg-gray-50">
                      <Title level={5}>Top Performing Products</Title>
                      <ul className="list-disc pl-5 space-y-2">
                        {report.topPerformers.products.map((product, index) => (
                          <li key={index}>
                            <Text strong>{product.productName}</Text>: $
                            {product.profit.toFixed(2)} profit (
                            {product.profitMargin.toFixed(2)}% margin)
                          </li>
                        ))}
                      </ul>
                    </Card>
                  </Col>
                </Row>
              )}
            </Card>
          )}
        </div>
      ) : (
        <Alert
          message="No report data"
          description="Please select report parameters and generate a report to view data."
          type="info"
          showIcon
        />
      )}
    </div>
  );
};

export default ProfitReportComponent;
