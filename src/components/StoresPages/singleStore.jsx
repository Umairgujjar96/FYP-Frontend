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
  TimePicker,
  Select,
} from "antd";
import {
  EditOutlined,
  ShopOutlined,
  PhoneOutlined,
  MailOutlined,
  ArrowRightOutlined,
  IdcardOutlined,
  NumberOutlined,
  HomeOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useStoreStore, useAuthStore } from "../../Store/stores";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

const StoresPage = () => {
  const navigate = useNavigate();
  const { user, currentStore } = useAuthStore();
  const { isLoading, error, fetchStores, updateStore } = useStoreStore();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  // current store looks like this
  console.log(currentStore);
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
        phoneNumber: currentStore.phoneNumber,
        email: currentStore.storeEmail || currentStore.email, // Handle different property names
        licenseNumber: currentStore.licenseNumber,
        registrationNumber: currentStore.registrationNumber,
        "address.street": currentStore.address?.street || "",
        "address.city": currentStore.address?.city || "",
        "address.state": currentStore.address?.state || "",
        "address.postalCode": currentStore.address?.postalCode || "",
        open: currentStore.operatingHours?.open
          ? dayjs(currentStore.operatingHours.open, "HH:mm")
          : null,
        close: currentStore.operatingHours?.close
          ? dayjs(currentStore.operatingHours.close, "HH:mm")
          : null,
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

      // Format the data to match the API expectations
      const formattedValues = {
        name: values.name,
        phoneNumber: values.phoneNumber,
        email: values.email,
        licenseNumber: values.licenseNumber,
        registrationNumber: values.registrationNumber,
        address: {
          street: values["address.street"],
          city: values["address.city"],
          state: values["address.state"],
          postalCode: values["address.postalCode"],
        },
      };

      // Add operating hours if provided
      if (values.open || values.close) {
        formattedValues.operatingHours = {};
        if (values.open) {
          formattedValues.operatingHours.open = values.open.format("HH:mm");
        }
        if (values.close) {
          formattedValues.operatingHours.close = values.close.format("HH:mm");
        }
      }

      await updateStore(currentStore._id || currentStore.id, formattedValues);
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

  // if (error) {
  //   return (
  //     <div className="flex flex-col items-center justify-center h-64">
  //       <Text type="danger" className="text-lg mb-4">
  //         {error}
  //       </Text>
  //       <Button type="primary" onClick={fetchStores}>
  //         Try Again
  //       </Button>
  //     </div>
  //   );
  // }

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
          {currentStore.isActive === false && (
            <Text type="danger" className="ml-4">
              (Inactive)
            </Text>
          )}
        </div>
        <Divider />

        <Descriptions
          layout="vertical"
          bordered
          column={{ xs: 1, sm: 2, md: 3 }}
        >
          <Descriptions.Item label="License Number" span={1}>
            <div className="flex items-center">
              <IdcardOutlined className="text-gray-500 mr-2" />
              <Text>{currentStore.licenseNumber || "N/A"}</Text>
            </div>
          </Descriptions.Item>

          <Descriptions.Item label="Registration Number" span={1}>
            <div className="flex items-center">
              <NumberOutlined className="text-gray-500 mr-2" />
              <Text>{currentStore.registrationNumber || "N/A"}</Text>
            </div>
          </Descriptions.Item>

          <Descriptions.Item label="Staff Count" span={1}>
            <Text>{currentStore.staff?.length || 0} members</Text>
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
              <Text>
                {currentStore.email || currentStore.storeEmail || "N/A"}
              </Text>
            </div>
          </Descriptions.Item>

          <Descriptions.Item label="Status">
            <Text type={currentStore.isActive !== false ? "success" : "danger"}>
              {currentStore.isActive !== false ? "Active" : "Inactive"}
            </Text>
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        <Descriptions layout="vertical" bordered column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="Address" span={1}>
            <div className="flex items-start">
              <EnvironmentOutlined className="text-gray-500 mr-2 mt-1" />
              <div>
                <div>{currentStore.address?.street || "N/A"}</div>
                <div>
                  {currentStore.address?.city || ""}
                  {currentStore.address?.city && currentStore.address?.state
                    ? ", "
                    : ""}
                  {currentStore.address?.state || ""}
                </div>
                <div>{currentStore.address?.postalCode || ""}</div>
              </div>
            </div>
          </Descriptions.Item>

          <Descriptions.Item label="Operating Hours" span={1}>
            <div className="flex items-center">
              <ClockCircleOutlined className="text-gray-500 mr-2" />
              <div>
                {currentStore.operatingHours?.open &&
                currentStore.operatingHours?.close ? (
                  <div>
                    {currentStore.operatingHours.open} -{" "}
                    {currentStore.operatingHours.close}
                  </div>
                ) : (
                  <Text type="secondary">Not specified</Text>
                )}
              </div>
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
        width={700}
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
              name="licenseNumber"
              label="License Number"
              rules={[
                { required: true, message: "Please enter license number" },
              ]}
            >
              <Input
                prefix={<IdcardOutlined className="text-gray-400" />}
                placeholder="License Number"
              />
            </Form.Item>

            <Form.Item
              name="registrationNumber"
              label="Registration Number"
              rules={[
                { required: true, message: "Please enter registration number" },
              ]}
            >
              <Input
                prefix={<NumberOutlined className="text-gray-400" />}
                placeholder="Registration Number"
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="phoneNumber"
              label="Phone"
              rules={[{ required: true, message: "Please enter phone number" }]}
            >
              <Input
                prefix={<PhoneOutlined className="text-gray-400" />}
                placeholder="Phone Number"
              />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Please enter email" },
                { type: "email", message: "Please enter a valid email" },
              ]}
            >
              <Input
                prefix={<MailOutlined className="text-gray-400" />}
                placeholder="Email Address"
              />
            </Form.Item>
          </div>

          <Divider>Address Information</Divider>

          <div className="grid grid-cols-1 gap-4">
            <Form.Item
              name="address.street"
              label="Street Address"
              rules={[
                { required: true, message: "Please enter street address" },
              ]}
            >
              <Input
                prefix={<HomeOutlined className="text-gray-400" />}
                placeholder="Street Address"
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Form.Item
              name="address.city"
              label="City"
              rules={[{ required: true, message: "Please enter city" }]}
            >
              <Input placeholder="City" />
            </Form.Item>

            <Form.Item
              name="address.state"
              label="State"
              rules={[{ required: true, message: "Please enter state" }]}
            >
              <Input placeholder="State" />
            </Form.Item>

            <Form.Item
              name="address.postalCode"
              label="Postal Code"
              rules={[{ required: true, message: "Please enter postal code" }]}
            >
              <Input placeholder="Postal Code" />
            </Form.Item>
          </div>

          <Divider>Operating Hours</Divider>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item name="open" label="Opening Time">
              <TimePicker
                format="HH:mm"
                placeholder="Select opening time"
                style={{ width: "100%" }}
              />
            </Form.Item>

            <Form.Item name="close" label="Closing Time">
              <TimePicker
                format="HH:mm"
                placeholder="Select closing time"
                style={{ width: "100%" }}
              />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default StoresPage;
