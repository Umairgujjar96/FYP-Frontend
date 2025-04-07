import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Table,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Divider,
  Typography,
  notification,
  Empty,
  Spin,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  ShopOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useStoreStore } from "../../Store/stores.js";

const { Title, Text } = Typography;
const { Option } = Select;

const StoresPage = () => {
  const navigate = useNavigate();
  const {
    stores,
    currentStore,
    isLoading,
    error,
    fetchStores,
    createStore,
    updateStore,
    setCurrentStore,
  } = useStoreStore();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchStores().catch((err) => {
      notification.error({
        message: "Error fetching stores",
        description: err.message,
      });
    });
  }, [fetchStores]);

  useEffect(() => {
    if (selectedStore && isEditMode) {
      form.setFieldsValue({
        name: selectedStore.name,
        address: selectedStore.address,
        city: selectedStore.city,
        state: selectedStore.state,
        zipCode: selectedStore.zipCode,
        phone: selectedStore.phone,
        email: selectedStore.email,
        type: selectedStore.type || "retail",
      });
    }
  }, [selectedStore, isEditMode, form]);

  const showCreateModal = () => {
    setIsEditMode(false);
    setSelectedStore(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const showEditModal = (store) => {
    setIsEditMode(true);
    setSelectedStore(store);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleSelectStore = (storeId) => {
    setCurrentStore(storeId);
    navigate("/store/dashboard");
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (isEditMode && selectedStore) {
        await updateStore(selectedStore._id, values);
        notification.success({
          message: "Store Updated",
          description: `${values.name} has been successfully updated.`,
        });
      } else {
        await createStore(values);
        notification.success({
          message: "Store Created",
          description: `${values.name} has been successfully created.`,
        });
      }

      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      notification.error({
        message: "Error",
        description:
          error.message || "There was an error processing your request.",
      });
    }
  };

  const columns = [
    {
      title: "Store Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div className="flex items-center">
          <ShopOutlined className="mr-2 text-blue-500" />
          <Text strong>{text}</Text>
          {currentStore && currentStore._id === record._id && (
            <Text type="success" className="ml-2">
              (Current)
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "Location",
      dataIndex: "address",
      key: "address",
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <div className="flex items-center">
            <EnvironmentOutlined className="mr-2 text-gray-500" />
            <Text>{record.address}</Text>
          </div>
          <Text type="secondary">
            {record.city}, {record.state} {record.zipCode}
          </Text>
        </Space>
      ),
    },
    {
      title: "Contact",
      key: "contact",
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <div className="flex items-center">
            <PhoneOutlined className="mr-2 text-gray-500" />
            <Text>{record.phone || "N/A"}</Text>
          </div>
          <div className="flex items-center">
            <MailOutlined className="mr-2 text-gray-500" />
            <Text>{record.email || "N/A"}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (text) => <Text capitalize>{text || "Retail"}</Text>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<ShopOutlined />}
            onClick={() => handleSelectStore(record._id)}
            className={
              currentStore && currentStore._id === record._id
                ? "opacity-50 cursor-not-allowed"
                : ""
            }
            disabled={currentStore && currentStore._id === record._id}
          >
            {currentStore && currentStore._id === record._id
              ? "Selected"
              : "Select"}
          </Button>
          <Button icon={<EditOutlined />} onClick={() => showEditModal(record)}>
            Edit
          </Button>
        </Space>
      ),
    },
  ];

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Text type="danger" className="text-lg mb-4">
          {error}
        </Text>
        <Button type="primary" onClick={fetchStores}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="stores-page">
      <div className="flex justify-between items-center mb-6">
        <Title level={2} className="mb-0">
          My Stores
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={showCreateModal}
          size="large"
        >
          Add New Store
        </Button>
      </div>

      <Card className="stores-list-card">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Spin size="large" />
          </div>
        ) : stores?.length > 0 ? (
          <Table
            dataSource={stores}
            columns={columns}
            rowKey="_id"
            pagination={{ pageSize: 5 }}
            className="stores-table"
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span className="text-gray-500">
                You don't have any stores yet. Click "Add New Store" to create
                your first store.
              </span>
            }
          >
            <Button
              type="primary"
              onClick={showCreateModal}
              icon={<PlusOutlined />}
            >
              Add New Store
            </Button>
          </Empty>
        )}
      </Card>

      <Modal
        title={isEditMode ? "Edit Store" : "Create New Store"}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="back" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleSubmit}
            loading={isLoading}
          >
            {isEditMode ? "Update" : "Create"}
          </Button>,
        ]}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          name="storeForm"
          initialValues={{ type: "retail" }}
        >
          <Form.Item
            name="name"
            label="Store Name"
            rules={[{ required: true, message: "Please enter the store name" }]}
          >
            <Input
              prefix={<ShopOutlined className="text-gray-400" />}
              placeholder="Store Name"
            />
          </Form.Item>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="address"
              label="Address"
              rules={[{ required: true, message: "Please enter the address" }]}
            >
              <Input
                prefix={<EnvironmentOutlined className="text-gray-400" />}
                placeholder="Street Address"
              />
            </Form.Item>

            <Form.Item
              name="city"
              label="City"
              rules={[{ required: true, message: "Please enter the city" }]}
            >
              <Input placeholder="City" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="state"
              label="State/Province"
              rules={[{ required: true, message: "Please enter the state" }]}
            >
              <Input placeholder="State/Province" />
            </Form.Item>

            <Form.Item
              name="zipCode"
              label="Zip/Postal Code"
              rules={[{ required: true, message: "Please enter the zip code" }]}
            >
              <Input placeholder="Zip/Postal Code" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item name="phone" label="Phone">
              <Input
                prefix={<PhoneOutlined className="text-gray-400" />}
                placeholder="Phone Number"
              />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[{ type: "email", message: "Please enter a valid email" }]}
            >
              <Input
                prefix={<MailOutlined className="text-gray-400" />}
                placeholder="Email Address"
              />
            </Form.Item>
          </div>

          <Form.Item name="type" label="Store Type">
            <Select placeholder="Select store type">
              <Option value="retail">Retail</Option>
              <Option value="online">Online</Option>
              <Option value="warehouse">Warehouse</Option>
              <Option value="restaurant">Restaurant</Option>
              <Option value="service">Service</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StoresPage;
