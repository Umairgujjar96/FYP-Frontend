import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Select,
  DatePicker,
  Button,
  Table,
  Spin,
  Statistic,
  Tabs,
  Checkbox,
  message,
  Row,
  Col,
  Divider,
} from "antd";
import {
  DownloadOutlined,
  ReloadOutlined,
  PieChartOutlined,
  BarChartOutlined,
  TableOutlined,
  LineChartOutlined,
} from "@ant-design/icons";
import moment from "moment";
// import useSaleStore from '../stores/useSaleStore';
// import { useAuthStore } from '../stores/stores';
import {
  LineChart,
  PieChart,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  Pie,
  Bar,
  Cell,
} from "recharts";
import useSaleStore from "../../Store/useSaleStore";
import { useAuthStore } from "../../Store/stores";

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { Option } = Select;

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

const SalesReportComponent = () => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState("1");
  const [reportData, setReportData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [reportConfig, setReportConfig] = useState({
    reportType: "daily",
    dateRange: null,
    includeItemDetails: false,
  });

  const { currentStore } = useAuthStore();
  const {
    fetchSalesReport,
    exportSalesReport,
    salesReport,
    loading,
    error,
    clearReport,
    clearError,
  } = useSaleStore();

  // Effect to handle report data when it changes
  useEffect(() => {
    if (salesReport) {
      setReportData(salesReport);
      prepareChartData(salesReport);
    }
  }, [salesReport]);

  // Handle errors with message notification
  useEffect(() => {
    if (error) {
      message.error(error);
      clearError();
    }
  }, [error, clearError]);

  // Prepare data for charts
  const prepareChartData = (report) => {
    if (!report || !report.detail || report.detail.length === 0) return;

    // Format data for charts
    const formattedData = report.detail.map((item) => {
      let dateLabel;
      if (report.dateRange.reportType === "daily") {
        dateLabel = `${item.hour}:00`;
      } else if (
        report.dateRange.reportType === "weekly" ||
        report.dateRange.reportType === "monthly"
      ) {
        dateLabel = `${item.year}-${String(item.month).padStart(
          2,
          "0"
        )}-${String(item.day).padStart(2, "0")}`;
      } else {
        // yearly
        dateLabel = `${item.year}-${String(item.month).padStart(2, "0")}`;
      }

      return {
        name: dateLabel,
        sales: item.salesCount,
        total: item.total,
        returns: item.returns,
        netSales: item.finalTotal,
        storeName: item.storeName || "Unknown",
      };
    });

    setChartData(formattedData);
  };

  // Handle form submission to generate report
  const handleGenerateReport = async (values) => {
    try {
      const params = {
        reportType: values.reportType,
        storeId: currentStore?.id,
        includeItemDetails: values.includeItemDetails || false,
      };

      // Add date range if provided
      if (values.dateRange && values.dateRange.length === 2) {
        params.startDate = values.dateRange[0].format("YYYY-MM-DD");
        params.endDate = values.dateRange[1].format("YYYY-MM-DD");
      }

      setReportConfig({
        reportType: values.reportType,
        dateRange: values.dateRange,
        includeItemDetails: values.includeItemDetails || false,
      });

      await fetchSalesReport(params);
    } catch (err) {
      message.error(
        "Failed to generate report: " + (err.message || "Unknown error")
      );
    }
  };

  // Handle exporting the report
  const handleExportReport = async () => {
    try {
      if (!reportData) {
        message.warning("Please generate a report first before exporting");
        return;
      }

      const params = {
        reportType: reportConfig.reportType,
        storeId: currentStore?.id,
        includeItemDetails: true,
        format: "csv",
      };

      // Add date range if provided
      if (reportConfig.dateRange && reportConfig.dateRange.length === 2) {
        params.startDate = reportConfig.dateRange[0].format("YYYY-MM-DD");
        params.endDate = reportConfig.dateRange[1].format("YYYY-MM-DD");
      }

      await exportSalesReport(params);
      message.success("Report exported successfully");
    } catch (err) {
      message.error(
        "Failed to export report: " + (err.message || "Unknown error")
      );
    }
  };

  // Column definitions for main sales report table
  const reportColumns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (_, record) => {
        if (reportData?.dateRange.reportType === "daily") {
          return `${record.year}-${String(record.month).padStart(
            2,
            "0"
          )}-${String(record.day).padStart(2, "0")} ${String(
            record.hour
          ).padStart(2, "0")}:00`;
        } else if (reportData?.dateRange.reportType === "yearly") {
          return `${record.year}-${String(record.month).padStart(2, "0")}`;
        } else {
          return `${record.year}-${String(record.month).padStart(
            2,
            "0"
          )}-${String(record.day).padStart(2, "0")}`;
        }
      },
    },
    {
      title: "Store",
      dataIndex: "storeName",
      key: "storeName",
      render: (storeName) => storeName || "Unknown",
    },
    {
      title: "Sales Count",
      dataIndex: "salesCount",
      key: "salesCount",
      sorter: (a, b) => a.salesCount - b.salesCount,
    },
    {
      title: "Subtotal",
      dataIndex: "subtotal",
      key: "subtotal",
      render: (value) => `Rs. ${value.toFixed(2)}`,
      sorter: (a, b) => a.subtotal - b.subtotal,
    },
    {
      title: "Discount",
      dataIndex: "discount",
      key: "discount",
      render: (value) => `Rs. ${value.toFixed(2)}`,
      sorter: (a, b) => a.discount - b.discount,
    },
    {
      title: "Tax",
      dataIndex: "tax",
      key: "tax",
      render: (value) => `Rs. ${value.toFixed(2)}`,
      sorter: (a, b) => a.tax - b.tax,
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      render: (value) => `Rs. ${value.toFixed(2)}`,
      sorter: (a, b) => a.total - b.total,
    },
    {
      title: "Returns",
      dataIndex: "returns",
      key: "returns",
      render: (value) => `Rs. ${value.toFixed(2)}`,
      sorter: (a, b) => a.returns - b.returns,
    },
    {
      title: "Net Sales",
      dataIndex: "finalTotal",
      key: "finalTotal",
      render: (value) => `Rs. ${value.toFixed(2)}`,
      sorter: (a, b) => a.finalTotal - b.finalTotal,
    },
    {
      title: "Payment Methods",
      key: "paymentMethods",
      render: (_, record) => (
        <div>
          Cash: {record.paymentMethodStats.cash}
          <br />
          Card: {record.paymentMethodStats.card}
          <br />
          Mobile: {record.paymentMethodStats.mobileBanking}
        </div>
      ),
    },
  ];

  // Column definitions for product analytics table
  const productColumns = [
    {
      title: "Product Name",
      dataIndex: "productName",
      key: "productName",
      width: 200,
    },
    {
      title: "Generic Name",
      dataIndex: "genericName",
      key: "genericName",
      width: 150,
    },
    {
      title: "Qty Sold",
      dataIndex: "quantitySold",
      key: "quantitySold",
      sorter: (a, b) => a.quantitySold - b.quantitySold,
    },
    {
      title: "Qty Returned",
      dataIndex: "quantityReturned",
      key: "quantityReturned",
      sorter: (a, b) => a.quantityReturned - b.quantityReturned,
    },
    {
      title: "Net Qty",
      dataIndex: "netQuantity",
      key: "netQuantity",
      sorter: (a, b) => a.netQuantity - b.netQuantity,
    },
    {
      title: "Revenue",
      dataIndex: "revenue",
      key: "revenue",
      render: (value) => `Rs. ${value.toFixed(2)}`,
      sorter: (a, b) => a.revenue - b.revenue,
    },
    {
      title: "Discount",
      dataIndex: "discount",
      key: "discount",
      render: (value) => `Rs. ${value.toFixed(2)}`,
      sorter: (a, b) => a.discount - b.discount,
    },
    {
      title: "Net Revenue",
      dataIndex: "netRevenue",
      key: "netRevenue",
      render: (value) => `Rs. ${value.toFixed(2)}`,
      sorter: (a, b) => a.netRevenue - b.netRevenue,
    },
    {
      title: "Avg Price",
      dataIndex: "averagePrice",
      key: "averagePrice",
      render: (value) => `Rs. ${value.toFixed(2)}`,
      sorter: (a, b) => a.averagePrice - b.averagePrice,
    },
  ];

  // Reset form and clear report data
  const handleReset = () => {
    form.resetFields();
    clearReport();
    setReportData(null);
    setChartData([]);
  };

  // Render the payment methods pie chart
  const renderPaymentMethodsChart = () => {
    if (!reportData || !reportData.summary) return null;

    const paymentData = [
      { name: "Cash", value: reportData.summary.paymentMethods.cash },
      { name: "Card", value: reportData.summary.paymentMethods.card },
      {
        name: "Mobile Banking",
        value: reportData.summary.paymentMethods.mobileBanking,
      },
    ];

    return (
      <div className="mt-4">
        <h3 className="text-lg font-medium mb-4">Payment Methods</h3>
        <div className="flex justify-center">
          <PieChart width={300} height={300}>
            <Pie
              data={paymentData}
              cx={150}
              cy={150}
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
            >
              {paymentData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value} sales`, "Count"]} />
            <Legend />
          </PieChart>
        </div>
      </div>
    );
  };

  // Render the sales trend chart
  const renderSalesTrendChart = () => {
    if (!chartData || chartData.length === 0) return null;

    return (
      <div className="mt-4">
        <h3 className="text-lg font-medium mb-4">Sales Trend</h3>
        <div style={{ width: "100%", overflowX: "auto" }}>
          <LineChart
            width={Math.max(600, chartData.length * 60)}
            height={300}
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#8884d8"
              name="Total Sales"
            />
            <Line
              type="monotone"
              dataKey="returns"
              stroke="#82ca9d"
              name="Returns"
            />
            <Line
              type="monotone"
              dataKey="netSales"
              stroke="#ff7300"
              name="Net Sales"
            />
          </LineChart>
        </div>
      </div>
    );
  };

  // Render sales count bar chart
  const renderSalesCountChart = () => {
    if (!chartData || chartData.length === 0) return null;

    return (
      <div className="mt-4">
        <h3 className="text-lg font-medium mb-4">Sales Count</h3>
        <div style={{ width: "100%", overflowX: "auto" }}>
          <BarChart
            width={Math.max(600, chartData.length * 60)}
            height={300}
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="sales" fill="#8884d8" name="Sales Count" />
          </BarChart>
        </div>
      </div>
    );
  };

  // Render summary statistics cards
  const renderSummaryCards = () => {
    if (!reportData || !reportData.summary) return null;

    const { summary } = reportData;
    return (
      <div className="mt-4">
        <h3 className="text-lg font-medium mb-4">Summary</h3>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card>
              <Statistic
                title="Total Sales"
                value={summary.totalSales}
                precision={0}
                valueStyle={{ color: "#3f8600" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card>
              <Statistic
                title="Total Revenue"
                value={summary.totalRevenue}
                precision={2}
                valueStyle={{ color: "#3f8600" }}
                prefix="Rs. "
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card>
              <Statistic
                title="Total Returns"
                value={summary.totalReturns}
                precision={2}
                valueStyle={{ color: "#cf1322" }}
                prefix="Rs."
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card>
              <Statistic
                title="Net Revenue"
                value={summary.netRevenue}
                precision={2}
                valueStyle={{ color: "#3f8600" }}
                prefix="Rs."
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card>
              <Statistic
                title="Average Sale Value"
                value={summary.averageSaleValue}
                precision={2}
                valueStyle={{ color: "#1890ff" }}
                prefix="Rs."
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card>
              <Statistic
                title="Total Discount"
                value={summary.totalDiscount}
                precision={2}
                valueStyle={{ color: "#faad14" }}
                prefix="Rs."
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card>
              <Statistic
                title="Total Tax"
                value={summary.totalTax}
                precision={2}
                valueStyle={{ color: "#1890ff" }}
                prefix="Rs"
              />
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  return (
    <div className="p-4">
      <Card title="Sales Report" className="shadow-md">
        <Form
          form={form}
          name="report_form"
          layout="vertical"
          onFinish={handleGenerateReport}
          initialValues={{ reportType: "daily" }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Form.Item
              name="reportType"
              label="Report Type"
              rules={[
                { required: true, message: "Please select a report type" },
              ]}
            >
              <Select>
                <Option value="daily">Daily</Option>
                <Option value="weekly">Weekly</Option>
                <Option value="monthly">Monthly</Option>
                <Option value="yearly">Yearly</Option>
              </Select>
            </Form.Item>

            <Form.Item name="dateRange" label="Custom Date Range (Optional)">
              <RangePicker style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="includeItemDetails"
              valuePropName="checked"
              wrapperCol={{ offset: 0 }}
            >
              <Checkbox>Include Product Details</Checkbox>
            </Form.Item>
          </div>

          <Form.Item>
            <div className="flex flex-wrap gap-2">
              <Button type="primary" htmlType="submit" loading={loading}>
                Generate Report
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                Reset
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleExportReport}
                disabled={!reportData}
              >
                Export as CSV
              </Button>
            </div>
          </Form.Item>
        </Form>

        {loading && (
          <div className="flex justify-center my-8">
            <Spin size="large" tip="Generating report..." />
          </div>
        )}

        {reportData && !loading && (
          <div className="mt-6">
            <Divider orientation="left">
              <span className="text-xl font-semibold">
                {reportData.title} ({reportData.dateRange.start} to{" "}
                {reportData.dateRange.end})
              </span>
            </Divider>

            {renderSummaryCards()}

            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              className="mt-6"
              type="card"
            >
              <TabPane
                tab={
                  <span>
                    <TableOutlined /> Data Table
                  </span>
                }
                key="1"
              >
                <div className="overflow-x-auto">
                  <Table
                    dataSource={reportData.detail}
                    columns={reportColumns}
                    rowKey={(record) =>
                      `${record.year}-${record.month}-${record.day}-${
                        record.hour || 0
                      }-${record.store}`
                    }
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: "max-content" }}
                  />
                </div>
              </TabPane>

              <TabPane
                tab={
                  <span>
                    <LineChartOutlined /> Trends
                  </span>
                }
                key="2"
              >
                {renderSalesTrendChart()}
                {renderSalesCountChart()}
              </TabPane>

              <TabPane
                tab={
                  <span>
                    <PieChartOutlined /> Payment Methods
                  </span>
                }
                key="3"
              >
                {renderPaymentMethodsChart()}
              </TabPane>

              {reportData.productAnalytics && (
                <TabPane
                  tab={
                    <span>
                      <BarChartOutlined /> Product Analytics
                    </span>
                  }
                  key="4"
                >
                  <div className="overflow-x-auto mt-4">
                    <Table
                      dataSource={reportData.productAnalytics}
                      columns={productColumns}
                      rowKey="productId"
                      pagination={{ pageSize: 10 }}
                      scroll={{ x: "max-content" }}
                    />
                  </div>
                </TabPane>
              )}
            </Tabs>
          </div>
        )}
      </Card>
    </div>
  );
};

export default SalesReportComponent;

// // SalesReportPage.jsx
// import React, { useState } from "react";
// import { Button, Card, Typography, Empty } from "antd";
// import { LineChartOutlined, FileTextOutlined } from "@ant-design/icons";
// import useSaleStore from "../../Store/useSaleStore";
// import SalesReportDisplay from "./saleReportDisplay";
// import SalesReportModal from "./reportModal";

// const { Title } = Typography;

// const SalesReportPage = () => {
//   const [modalVisible, setModalVisible] = useState(false);
//   const { salesReport, loading, clearReport } = useSaleStore();

//   const showModal = () => {
//     setModalVisible(true);
//   };

//   const handleCancel = () => {
//     setModalVisible(false);
//   };

//   const handleCreateNewReport = () => {
//     clearReport();
//     showModal();
//   };

//   return (
//     <div className="p-6">
//       <div className="flex justify-between items-center mb-6">
//         <Title level={2}>Sales Reports</Title>
//         <div className="space-x-4">
//           {salesReport && (
//             <Button
//               type="default"
//               icon={<FileTextOutlined />}
//               onClick={handleCreateNewReport}
//             >
//               New Report
//             </Button>
//           )}
//           <Button
//             type="primary"
//             icon={<LineChartOutlined />}
//             onClick={showModal}
//           >
//             {salesReport ? "Modify Report" : "Generate Report"}
//           </Button>
//         </div>
//       </div>

//       {!salesReport && !loading && (
//         <Card className="text-center p-12">
//           <Empty
//             image={
//               <FileTextOutlined style={{ fontSize: 64, color: "#d9d9d9" }} />
//             }
//             description="No reports generated yet"
//           >
//             <Button type="primary" onClick={showModal}>
//               Generate Report
//             </Button>
//           </Empty>
//         </Card>
//       )}

//       <SalesReportDisplay />

//       <SalesReportModal visible={modalVisible} onCancel={handleCancel} />
//     </div>
//   );
// };

// export default SalesReportPage;
