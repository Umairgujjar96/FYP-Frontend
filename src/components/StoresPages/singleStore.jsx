import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Descriptions,
  Spin,
  Modal,
  Form,
  Input,
  Typography,
  notification,
  Empty,
  Divider,
  Space,
} from "antd";
import {
  EditOutlined,
  ShopOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { useStoreStore, useAuthStore } from "../../Store/stores";

const { Title, Text, Paragraph } = Typography;

const StoresPage = () => {
  const navigate = useNavigate();
  const { user, currentStore } = useAuthStore();
  const { isLoading, error, fetchStores, updateStore } = useStoreStore();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Fetch the store on page load
  useEffect(() => {
    fetchStores().catch((err) => {
      notification.error({
        message: "Error fetching store",
        description: err.message,
      });
    });
  }, [fetchStores]);

  // Pre-populate form when editing
  useEffect(() => {
    if (currentStore && isModalVisible) {
      form.setFieldsValue({
        name: currentStore.name,
        address: currentStore?.address,
        city: currentStore.city,
        state: currentStore.state,
        zipCode: currentStore.zipCode,
        phone: currentStore.phoneNumber,
        email: currentStore.storeEmail,
        type: currentStore.type || "retail",
      });
    }
  }, [currentStore, isModalVisible, form]);

  const showEditModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      console.log(currentStore);
      await updateStore(currentStore.id, values);
      notification.success({
        message: "Store Updated",
        description: `${values.name} has been successfully updated.`,
      });

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

  const navigateToStoreDashboard = () => {
    navigate("/store/dashboard");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

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

  if (!currentStore) {
    return (
      <div className="stores-page">
        <Card className="w-full">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span className="text-gray-500">
                No store is associated with your account. Please contact support
                for assistance.
              </span>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="stores-page">
      <div className="flex justify-between items-center mb-6">
        <Title level={2} className="mb-0">
          My Store
        </Title>
        <Space>
          <Button icon={<EditOutlined />} onClick={showEditModal}>
            Edit Store
          </Button>
          <Button
            type="primary"
            icon={<ArrowRightOutlined />}
            onClick={navigateToStoreDashboard}
          >
            Go to Dashboard
          </Button>
        </Space>
      </div>

      <Card className="store-details-card mb-6">
        <div className="flex items-center mb-4">
          <ShopOutlined className="text-2xl text-blue-500 mr-3" />
          <Title level={3} className="mb-0">
            {currentStore.name}
          </Title>
        </div>
        <Divider />

        <Descriptions
          layout="vertical"
          bordered
          column={{ xs: 1, sm: 2, md: 3 }}
        >
          <Descriptions.Item label="Address" span={2}>
            <div className="flex items-start">
              <EnvironmentOutlined className="text-gray-500 mr-2 mt-1" />
              <div>
                <div>{currentStore.address}</div>
                <div>
                  {currentStore.city}, {currentStore.state}{" "}
                  {currentStore.zipCode}
                </div>
              </div>
            </div>
          </Descriptions.Item>

          <Descriptions.Item label="Store Type">
            <Text capitalize>{currentStore.type || "Retail"}</Text>
          </Descriptions.Item>

          <Descriptions.Item label="Phone">
            <div className="flex items-center">
              <PhoneOutlined className="text-gray-500 mr-2" />
              <Text>{currentStore.phoneNumber || "N/A"}</Text>
            </div>
          </Descriptions.Item>

          <Descriptions.Item label="Email">
            <div className="flex items-center">
              <MailOutlined className="text-gray-500 mr-2" />
              <Text>{currentStore.storeEmail || "N/A"}</Text>
            </div>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Quick Access" className="quick-access-card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            type="default"
            size="large"
            block
            onClick={() => navigate("/store/products")}
          >
            Products
          </Button>
          <Button
            type="default"
            size="large"
            block
            onClick={() => navigate("/store/inventory")}
          >
            Inventory
          </Button>
          <Button
            type="default"
            size="large"
            block
            onClick={() => navigate("/store/sales")}
          >
            Sales
          </Button>
          <Button
            type="default"
            size="large"
            block
            onClick={() => navigate("/store/customers")}
          >
            Customers
          </Button>
          <Button
            type="default"
            size="large"
            block
            onClick={() => navigate("/store/suppliers")}
          >
            Suppliers
          </Button>
          <Button
            type="primary"
            size="large"
            block
            onClick={() => navigate("/store/pos")}
          >
            POS System
          </Button>
        </div>
      </Card>

      <Modal
        title="Edit Store"
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
            Update
          </Button>,
        ]}
        width={600}
      >
        <Form form={form} layout="vertical" name="storeForm">
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
        </Form>
      </Modal>
    </div>
  );
};

export default StoresPage;
