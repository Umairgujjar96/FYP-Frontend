import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Button,
  Input,
  Badge,
  Tag,
  Tabs,
  Statistic,
  Space,
  Dropdown,
  Menu,
  Progress,
  Alert,
  DatePicker,
  Select,
  Tooltip,
  Modal,
  Form,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  SettingOutlined,
  ReloadOutlined,
  FilterOutlined,
  DollarOutlined,
  BarChartOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { TabPane } = Tabs;
const { Option } = Select;

const InventoryPage = () => {
  // State for all inventory data
  const [inventoryData, setInventoryData] = useState([]);
  // State for filtered data based on current tab
  const [filteredData, setFilteredData] = useState([]);
  // State for loading indicators
  const [loading, setLoading] = useState(true);
  // State for search term
  const [searchTerm, setSearchTerm] = useState("");
  // State for active tab
  const [activeTab, setActiveTab] = useState("all");
  // State for settings modal
  const [settingsVisible, setSettingsVisible] = useState(false);
  // State for add/edit item modal
  const [itemModalVisible, setItemModalVisible] = useState(false);
  // State for reorder thresholds
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  // State for expiry warning days
  const [expiryWarningDays, setExpiryWarningDays] = useState(30);
  // State for current item being edited
  const [currentItem, setCurrentItem] = useState(null);
  // Form instance for add/edit modal
  const [form] = Form.useForm();

  // Mock data for demonstration
  useEffect(() => {
    // Simulating API call to fetch inventory data
    setTimeout(() => {
      const mockData = generateMockData();
      setInventoryData(mockData);
      setFilteredData(mockData);
      setLoading(false);
    }, 1000);
  }, []);

  // Function to generate mock data
  const generateMockData = () => {
    const categories = [
      "Antibiotics",
      "Painkillers",
      "Cardiovascular",
      "Vitamins",
      "Antidiabetic",
    ];
    const products = [
      {
        name: "Amoxicillin",
        category: "Antibiotics",
        genericName: "Amoxicillin",
        desc: "Broad-spectrum antibiotic",
      },
      {
        name: "Paracetamol",
        category: "Painkillers",
        genericName: "Acetaminophen",
        desc: "Pain reliever and fever reducer",
      },
      {
        name: "Lisinopril",
        category: "Cardiovascular",
        genericName: "Lisinopril",
        desc: "ACE inhibitor",
      },
      {
        name: "Vitamin C",
        category: "Vitamins",
        genericName: "Ascorbic Acid",
        desc: "Essential vitamin",
      },
      {
        name: "Metformin",
        category: "Antidiabetic",
        genericName: "Metformin HCl",
        desc: "Oral diabetes medicine",
      },
      {
        name: "Ibuprofen",
        category: "Painkillers",
        genericName: "Ibuprofen",
        desc: "NSAID pain reliever",
      },
      {
        name: "Atorvastatin",
        category: "Cardiovascular",
        genericName: "Atorvastatin Calcium",
        desc: "Cholesterol-lowering medication",
      },
      {
        name: "Azithromycin",
        category: "Antibiotics",
        genericName: "Azithromycin",
        desc: "Macrolide antibiotic",
      },
    ];

    return Array.from({ length: 35 }, (_, i) => {
      const product = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 100);
      const daysToExpiry = Math.floor(Math.random() * 180);
      const expiryDate = dayjs().add(daysToExpiry, "day").format("YYYY-MM-DD");
      const batchNumber = `B-${Math.floor(1000 + Math.random() * 9000)}`;
      const costPrice = (Math.random() * 10 + 1).toFixed(2);
      const sellingPrice = (
        parseFloat(costPrice) *
        (1 + Math.random() * 0.5)
      ).toFixed(2);

      return {
        id: i + 1,
        name: product.name,
        genericName: product.genericName,
        description: product.desc,
        category: product.category,
        batchNumber,
        quantity,
        expiryDate,
        daysToExpiry,
        costPrice,
        sellingPrice,
        reorderLevel: Math.floor(Math.random() * 15 + 5),
        supplier: `Supplier ${Math.floor(Math.random() * 5) + 1}`,
        lastUpdated: dayjs()
          .subtract(Math.floor(Math.random() * 30), "day")
          .format("YYYY-MM-DD"),
      };
    });
  };

  // Handle tab change and filter data accordingly
  useEffect(() => {
    if (inventoryData.length === 0) return;

    const today = dayjs();
    let filtered = [...inventoryData];

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    switch (activeTab) {
      case "low-stock":
        filtered = filtered.filter(
          (item) => item.quantity <= lowStockThreshold
        );
        break;
      case "expiring-soon":
        filtered = filtered.filter(
          (item) => item.daysToExpiry <= expiryWarningDays
        );
        break;
      case "expired":
        filtered = filtered.filter((item) => item.daysToExpiry <= 0);
        break;
      default:
        // All items - no additional filtering needed
        break;
    }

    setFilteredData(filtered);
  }, [
    inventoryData,
    activeTab,
    searchTerm,
    lowStockThreshold,
    expiryWarningDays,
  ]);

  // Handle search input change
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Get status tag for inventory item
  const getStatusTag = (item) => {
    if (item.daysToExpiry <= 0) {
      return <Tag color="error">Expired</Tag>;
    }
    if (item.daysToExpiry <= expiryWarningDays) {
      return <Tag color="warning">Expiring Soon</Tag>;
    }
    if (item.quantity <= item.reorderLevel) {
      return <Tag color="volcano">Low Stock</Tag>;
    }
    if (item.quantity <= item.reorderLevel * 2) {
      return <Tag color="gold">Reorder Soon</Tag>;
    }
    return <Tag color="success">In Stock</Tag>;
  };

  // Get quantity badge color
  const getQuantityBadgeStatus = (item) => {
    if (item.quantity <= item.reorderLevel) {
      return "error";
    }
    if (item.quantity <= item.reorderLevel * 2) {
      return "warning";
    }
    return "success";
  };

  // Handle opening add/edit modal
  const handleOpenItemModal = (item = null) => {
    setCurrentItem(item);
    if (item) {
      form.setFieldsValue({
        ...item,
        expiryDate: dayjs(item.expiryDate),
      });
    } else {
      form.resetFields();
    }
    setItemModalVisible(true);
  };

  // Handle form submission
  const handleFormSubmit = (values) => {
    console.log("Form values:", values);
    // Here you would typically update your backend

    // For demo purposes, update local state
    const updatedValues = {
      ...values,
      expiryDate: values.expiryDate.format("YYYY-MM-DD"),
      daysToExpiry: values.expiryDate.diff(dayjs(), "day"),
    };

    if (currentItem) {
      // Edit existing item
      const updatedData = inventoryData.map((item) =>
        item.id === currentItem.id ? { ...item, ...updatedValues } : item
      );
      setInventoryData(updatedData);
    } else {
      // Add new item
      const newItem = {
        id: inventoryData.length + 1,
        ...updatedValues,
        lastUpdated: dayjs().format("YYYY-MM-DD"),
      };
      setInventoryData([...inventoryData, newItem]);
    }

    setItemModalVisible(false);
  };

  // Handle bulk operations
  const handleBulkAction = (action) => {
    console.log(`Bulk action: ${action}`);
    // Implementation would depend on your requirements
  };

  // Table columns configuration
  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">{record.genericName}</div>
        </div>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      filters: [...new Set(inventoryData.map((item) => item.category))].map(
        (category) => ({
          text: category,
          value: category,
        })
      ),
      onFilter: (value, record) => record.category === value,
    },
    {
      title: "Batch",
      dataIndex: "batchNumber",
      key: "batchNumber",
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      render: (text, record) => (
        <Badge
          count={text}
          showZero
          overflowCount={999}
          status={getQuantityBadgeStatus(record)}
          style={{ backgroundColor: "transparent" }}
          className="text-right"
        />
      ),
      sorter: (a, b) => a.quantity - b.quantity,
    },
    {
      title: "Expiry Date",
      dataIndex: "expiryDate",
      key: "expiryDate",
      render: (text, record) => (
        <div>
          <div>{text}</div>
          <div className="text-xs">
            {record.daysToExpiry <= 0 ? (
              <span className="text-red-500">Expired</span>
            ) : (
              <span
                className={
                  record.daysToExpiry <= expiryWarningDays
                    ? "text-orange-500"
                    : "text-gray-500"
                }
              >
                {record.daysToExpiry} days left
              </span>
            )}
          </div>
        </div>
      ),
      sorter: (a, b) => new Date(a.expiryDate) - new Date(b.expiryDate),
    },
    {
      title: "Price",
      dataIndex: "sellingPrice",
      key: "sellingPrice",
      render: (text, record) => (
        <div>
          <div>${text}</div>
          <div className="text-xs text-gray-500">Cost: ${record.costPrice}</div>
        </div>
      ),
      sorter: (a, b) => a.sellingPrice - b.sellingPrice,
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => getStatusTag(record),
      filters: [
        { text: "Expired", value: "expired" },
        { text: "Expiring Soon", value: "expiring" },
        { text: "Low Stock", value: "low" },
        { text: "In Stock", value: "in-stock" },
      ],
      onFilter: (value, record) => {
        switch (value) {
          case "expired":
            return record.daysToExpiry <= 0;
          case "expiring":
            return (
              record.daysToExpiry > 0 &&
              record.daysToExpiry <= expiryWarningDays
            );
          case "low":
            return record.quantity <= record.reorderLevel;
          case "in-stock":
            return (
              record.quantity > record.reorderLevel &&
              record.daysToExpiry > expiryWarningDays
            );
          default:
            return true;
        }
      },
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              onClick={() => handleOpenItemModal(record)}
              className="text-blue-500 hover:text-blue-700"
            >
              Edit
            </Button>
          </Tooltip>
          <Tooltip title="View Details">
            <Button
              type="text"
              size="small"
              className="text-gray-500 hover:text-gray-700"
            >
              Details
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Calculate inventory statistics
  const totalItems = inventoryData.length;
  const totalUnits = inventoryData.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const lowStockItems = inventoryData.filter(
    (item) => item.quantity <= lowStockThreshold
  ).length;
  const expiringItems = inventoryData.filter(
    (item) => item.daysToExpiry > 0 && item.daysToExpiry <= expiryWarningDays
  ).length;
  const expiredItems = inventoryData.filter(
    (item) => item.daysToExpiry <= 0
  ).length;
  const inventoryValue = inventoryData
    .reduce((sum, item) => sum + item.costPrice * item.quantity, 0)
    .toFixed(2);

  // Bulk action menu
  const bulkActionMenu = (
    <Menu onClick={({ key }) => handleBulkAction(key)}>
      <Menu.Item key="export">Export Data</Menu.Item>
      <Menu.Item key="print">Print Inventory Report</Menu.Item>
      <Menu.Item key="reorder">Generate Reorder List</Menu.Item>
      <Menu.Item key="expire">Generate Expiry Report</Menu.Item>
    </Menu>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Inventory Management
          </h1>
          <p className="text-gray-600">
            View and manage your product inventory
          </p>
        </div>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenItemModal()}
          >
            Add Product
          </Button>
          <Dropdown overlay={bulkActionMenu} trigger={["click"]}>
            <Button icon={<DownloadOutlined />}>Bulk Actions</Button>
          </Dropdown>
          <Button
            icon={<SettingOutlined />}
            onClick={() => setSettingsVisible(true)}
          >
            Settings
          </Button>
        </Space>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card className="shadow-md">
          <Statistic
            title="Total Products"
            value={totalItems}
            prefix={<BarChartOutlined />}
            valueStyle={{ color: "#1890ff" }}
          />
        </Card>
        <Card className="shadow-md">
          <Statistic
            title="Total Units"
            value={totalUnits}
            prefix={<BarChartOutlined />}
            valueStyle={{ color: "#52c41a" }}
          />
        </Card>
        <Card className="shadow-md">
          <Statistic
            title="Low Stock"
            value={lowStockItems}
            prefix={<WarningOutlined />}
            valueStyle={{ color: "#fa8c16" }}
            suffix={`/ ${totalItems}`}
          />
          <Progress
            percent={Math.round((lowStockItems / totalItems) * 100)}
            status="active"
            strokeColor="#fa8c16"
            size="small"
            className="mt-2"
          />
        </Card>
        <Card className="shadow-md">
          <Statistic
            title="Expiring Soon"
            value={expiringItems}
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: "#faad14" }}
            suffix={`/ ${totalItems}`}
          />
          <Progress
            percent={Math.round((expiringItems / totalItems) * 100)}
            status="active"
            strokeColor="#faad14"
            size="small"
            className="mt-2"
          />
        </Card>
        <Card className="shadow-md">
          <Statistic
            title="Inventory Value"
            value={inventoryValue}
            prefix={<DollarOutlined />}
            valueStyle={{ color: "#13c2c2" }}
            precision={2}
          />
        </Card>
      </div>

      {/* Alerts Section - Show only if there are issues */}
      {(lowStockItems > 0 || expiringItems > 0 || expiredItems > 0) && (
        <div className="mb-6 space-y-3">
          {lowStockItems > 0 && (
            <Alert
              message={`${lowStockItems} products are running low on stock`}
              type="warning"
              showIcon
              icon={<WarningOutlined />}
              action={
                <Button size="small" type="link">
                  View All
                </Button>
              }
            />
          )}
          {expiringItems > 0 && (
            <Alert
              message={`${expiringItems} products are expiring within ${expiryWarningDays} days`}
              type="warning"
              showIcon
              icon={<ClockCircleOutlined />}
              action={
                <Button size="small" type="link">
                  View All
                </Button>
              }
            />
          )}
          {expiredItems > 0 && (
            <Alert
              message={`${expiredItems} products have expired and should be removed`}
              type="error"
              showIcon
              icon={<ExclamationCircleOutlined />}
              action={
                <Button size="small" type="link">
                  View All
                </Button>
              }
            />
          )}
        </div>
      )}

      {/* Main Inventory Section */}
      <Card className="shadow-md">
        <div className="flex justify-between items-center mb-4">
          <Input
            placeholder="Search products..."
            prefix={<SearchOutlined />}
            className="max-w-md"
            value={searchTerm}
            onChange={handleSearch}
            allowClear
          />
          <Space>
            <Button icon={<FilterOutlined />} type="dashed">
              Filter
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setLoading(true);
                setTimeout(() => {
                  setInventoryData(generateMockData());
                  setLoading(false);
                }, 500);
              }}
            >
              Refresh
            </Button>
          </Space>
        </div>

        <Tabs activeKey={activeTab} onChange={setActiveTab} className="mb-4">
          <TabPane tab="All Inventory" key="all" />
          <TabPane
            tab={
              <Badge count={lowStockItems} offset={[10, 0]}>
                Low Stock
              </Badge>
            }
            key="low-stock"
          />
          <TabPane
            tab={
              <Badge count={expiringItems} offset={[10, 0]}>
                Expiring Soon
              </Badge>
            }
            key="expiring-soon"
          />
          <TabPane
            tab={
              <Badge count={expiredItems} offset={[10, 0]}>
                Expired
              </Badge>
            }
            key="expired"
          />
        </Tabs>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          pagination={{
            position: ["bottomRight"],
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`,
          }}
          size="middle"
          scroll={{ x: "max-content" }}
          className="border rounded-lg"
        />
      </Card>

      {/* Settings Modal */}
      <Modal
        title="Inventory Settings"
        open={settingsVisible}
        onCancel={() => setSettingsVisible(false)}
        onOk={() => setSettingsVisible(false)}
        width={600}
      >
        <div className="space-y-6 py-4">
          <div>
            <h3 className="text-base font-medium mb-2">Low Stock Threshold</h3>
            <div className="flex items-center">
              <span className="mr-4 text-gray-600">Below</span>
              <Input
                type="number"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(parseInt(e.target.value))}
                className="w-24"
                min={1}
              />
              <span className="ml-4 text-gray-600">
                units will trigger low stock warning
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-base font-medium mb-2">
              Expiry Warning Period
            </h3>
            <div className="flex items-center">
              <span className="mr-4 text-gray-600">
                Warn when products expire within
              </span>
              <Input
                type="number"
                value={expiryWarningDays}
                onChange={(e) => setExpiryWarningDays(parseInt(e.target.value))}
                className="w-24"
                min={1}
              />
              <span className="ml-4 text-gray-600">days</span>
            </div>
          </div>

          <div>
            <h3 className="text-base font-medium mb-2">Display Settings</h3>
            <div className="flex items-center mb-4">
              <span className="mr-4 text-gray-600 w-32">Default view</span>
              <Select defaultValue="all" className="w-40">
                <Option value="all">All Products</Option>
                <Option value="low-stock">Low Stock</Option>
                <Option value="expiring">Expiring Soon</Option>
              </Select>
            </div>

            <div className="flex items-center">
              <span className="mr-4 text-gray-600 w-32">Items per page</span>
              <Select defaultValue="10" className="w-40">
                <Option value="10">10</Option>
                <Option value="20">20</Option>
                <Option value="50">50</Option>
                <Option value="100">100</Option>
              </Select>
            </div>
          </div>
        </div>
      </Modal>

      {/* Add/Edit Item Modal */}
      <Modal
        title={currentItem ? "Edit Inventory Item" : "Add New Inventory Item"}
        open={itemModalVisible}
        onCancel={() => setItemModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          initialValues={{
            quantity: 0,
            reorderLevel: 10,
            expiryDate: dayjs().add(180, "day"),
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="name"
              label="Product Name"
              rules={[{ required: true, message: "Please enter product name" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item name="genericName" label="Generic Name">
              <Input />
            </Form.Item>

            <Form.Item
              name="category"
              label="Category"
              rules={[{ required: true, message: "Please select a category" }]}
            >
              <Select>
                <Option value="Antibiotics">Antibiotics</Option>
                <Option value="Painkillers">Painkillers</Option>
                <Option value="Cardiovascular">Cardiovascular</Option>
                <Option value="Vitamins">Vitamins</Option>
                <Option value="Antidiabetic">Antidiabetic</Option>
                <Option value="Other">Other</Option>
              </Select>
            </Form.Item>

            <Form.Item name="supplier" label="Supplier">
              <Select>
                <Option value="Supplier 1">Supplier 1</Option>
                <Option value="Supplier 2">Supplier 2</Option>
                <Option value="Supplier 3">Supplier 3</Option>
                <Option value="Supplier 4">Supplier 4</Option>
                <Option value="Supplier 5">Supplier 5</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="batchNumber"
              label="Batch Number"
              rules={[{ required: true, message: "Please enter batch number" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="expiryDate"
              label="Expiry Date"
              rules={[{ required: true, message: "Please select expiry date" }]}
            >
              <DatePicker className="w-full" />
            </Form.Item>

            <Form.Item
              name="quantity"
              label="Quantity"
              rules={[{ required: true, message: "Please enter quantity" }]}
            >
              <Input type="number" min={0} />
            </Form.Item>

            <Form.Item
              name="reorderLevel"
              label="Reorder Level"
              rules={[
                { required: true, message: "Please enter reorder level" },
              ]}
            >
              <Input type="number" min={0} />
            </Form.Item>

            <Form.Item
              name="costPrice"
              label="Cost Price"
              rules={[{ required: true, message: "Please enter cost price" }]}
            >
              <Input type="number" min={0} step={0.01} prefix="$" />
            </Form.Item>

            <Form.Item
              name="sellingPrice"
              label="Selling Price"
              rules={[
                { required: true, message: "Please enter selling price" },
              ]}
            >
              <Input type="number" min={0} step={0.01} prefix="$" />
            </Form.Item>
          </div>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => setItemModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                {currentItem ? "Update" : "Add"} Item
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default InventoryPage;
