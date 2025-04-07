import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Popconfirm,
  message,
  Divider,
  Switch,
  Card,
  Typography,
  Pagination,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useSupplierStore } from "../../Store/useSupplierStore";
import debounce from "lodash/debounce";
import { useAuthStore } from "../../Store/stores";

const { Title } = Typography;
const { Option } = Select;
const { Search } = Input;

const SupplierList = () => {
  const [form] = Form.useForm();
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [filterForm] = Form.useForm();

  // Access store data
  const {
    suppliers,
    isLoading,
    pagination,
    filters,
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    setFilters,
    setPagination,
  } = useSupplierStore();

  const { currentStore } = useAuthStore();

  useEffect(() => {
    fetchSuppliers();
  }, [pagination.page, pagination.limit, filters, fetchSuppliers]);

  // Handle search with debounce
  const handleSearch = debounce((value) => {
    setFilters({ ...filters, name: value });
  }, 500);

  // Handle city search with debounce
  const handleCitySearch = debounce((value) => {
    setFilters({ ...filters, city: value });
  }, 500);

  // Handle pagination change
  const handlePageChange = (page, pageSize) => {
    setPagination({ page, limit: pageSize });
  };

  // Handle filter form submit
  const handleFilterSubmit = (values) => {
    setFilters({
      ...filters,
      isActive: values.isActive,
      name: values.name || "",
      city: values.city || "",
    });
    setIsFilterVisible(false);
  };

  // Reset filters
  const resetFilters = () => {
    filterForm.resetFields();
    setFilters({
      isActive: true,
      name: "",
      city: "",
    });
    setIsFilterVisible(false);
  };

  // Add new supplier
  const handleAddSupplier = async (values) => {
    try {
      const formattedValues = {
        ...values,
        address: {
          street: values.address?.street || "",
          city: values.address?.city || "",
          state: values.address?.state || "",
          country: values.address?.country || "",
          postalCode: values.address?.postalCode || "",
        },
        store: currentStore._id,
      };

      await createSupplier(formattedValues);
      message.success("Supplier added successfully");
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error(error.message || "Failed to add supplier");
    }
  };

  // Update supplier
  const handleUpdateSupplier = async (values) => {
    try {
      const formattedValues = {
        ...values,
        address: {
          street: values.address?.street || "",
          city: values.address?.city || "",
          state: values.address?.state || "",
          country: values.address?.country || "",
          postalCode: values.address?.postalCode || "",
        },
      };

      await updateSupplier(editingSupplier._id, formattedValues);
      message.success("Supplier updated successfully");
      setIsModalVisible(false);
      setEditingSupplier(null);
      form.resetFields();
    } catch (error) {
      message.error(error.message || "Failed to update supplier");
    }
  };

  // Handle form submission
  const handleSubmit = (values) => {
    if (editingSupplier) {
      handleUpdateSupplier(values);
    } else {
      handleAddSupplier(values);
    }
  };

  // Open modal for adding
  const showAddModal = () => {
    setEditingSupplier(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setIsModalVisible(true);
  };

  // Open modal for editing
  const showEditModal = (record) => {
    setEditingSupplier(record);
    form.setFieldsValue({
      name: record.name,
      contactPerson: record.contactPerson,
      email: record.email,
      phoneNumber: record.phoneNumber,
      address: {
        street: record.address?.street,
        city: record.address?.city,
        state: record.address?.state,
        postalCode: record.address?.postalCode,
        country: record.address?.country,
      },
      isActive: record.isActive,
    });
    setIsModalVisible(true);
  };

  // Handle delete
  const handleDeleteSupplier = async (id) => {
    try {
      await deleteSupplier(id);
      message.success("Supplier deleted successfully");
    } catch (error) {
      message.error(error.message || "Failed to delete supplier");
    }
  };

  // Table columns
  const columns = [
    {
      title: "Supplier Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Store",
      dataIndex: ["store", "name"],
      key: "store",
    },
    {
      title: "Contact Person",
      dataIndex: "contactPerson",
      key: "contactPerson",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Phone",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
    },
    {
      title: "Location",
      key: "location",
      render: (_, record) => (
        <span>
          {record.address?.city && record.address?.country
            ? `${record.address.city}, ${record.address.country}`
            : "N/A"}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive) => (
        <span
          className={`px-2 py-1 rounded ${
            isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button
            icon={<EditOutlined />}
            onClick={() => showEditModal(record)}
            className="text-blue-600 hover:text-blue-800"
          />
          <Popconfirm
            title="Are you sure you want to delete this supplier?"
            onConfirm={() => handleDeleteSupplier(record._id)}
            okText="Yes"
            cancelText="No"
            icon={<ExclamationCircleOutlined style={{ color: "red" }} />}
          >
            <Button
              icon={<DeleteOutlined />}
              className="text-red-600 hover:text-red-800"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card className="shadow-md">
        <div className="flex justify-between items-center mb-4">
          <Title level={2}>Suppliers</Title>
          <div className="flex gap-2">
            <Button
              icon={<FilterOutlined />}
              onClick={() => setIsFilterVisible(!isFilterVisible)}
              className={isFilterVisible ? "bg-blue-100" : ""}
            >
              Filters
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={showAddModal}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add Supplier
            </Button>
          </div>
        </div>

        {isFilterVisible && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <Form
              form={filterForm}
              layout="vertical"
              onFinish={handleFilterSubmit}
              initialValues={{
                isActive: filters.isActive,
                name: filters.name,
                city: filters.city,
              }}
            >
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="name" label="Supplier Name">
                    <Input
                      placeholder="Search by name"
                      prefix={<SearchOutlined />}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="city" label="City">
                    <Input
                      placeholder="Search by city"
                      prefix={<SearchOutlined />}
                    />
                  </Form.Item>
                </Col>
                <Col span={4}>
                  <Form.Item
                    name="isActive"
                    label="Status"
                    valuePropName="checked"
                  >
                    <Switch
                      checkedChildren="Active"
                      unCheckedChildren="Inactive"
                    />
                  </Form.Item>
                </Col>
                <Col span={4} className="flex items-end">
                  <Space>
                    <Button
                      type="primary"
                      htmlType="submit"
                      className="bg-blue-600"
                    >
                      Apply
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={resetFilters}>
                      Reset
                    </Button>
                  </Space>
                </Col>
              </Row>
            </Form>
          </div>
        )}

        <div className="mb-4">
          <Row gutter={16}>
            <Col span={8}>
              <Search
                placeholder="Search supplier by name"
                allowClear
                onSearch={handleSearch}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </Col>
            <Col span={8}>
              <Search
                placeholder="Search by city"
                allowClear
                onSearch={handleCitySearch}
                onChange={(e) => handleCitySearch(e.target.value)}
              />
            </Col>
          </Row>
        </div>

        <Table
          dataSource={suppliers}
          columns={columns}
          rowKey="_id"
          loading={isLoading}
          pagination={false}
          className="w-full"
        />

        <div className="mt-4 flex justify-end">
          <Pagination
            current={pagination.page}
            pageSize={pagination.limit}
            total={pagination.total}
            showSizeChanger
            showQuickJumper
            showTotal={(total) => `Total ${total} suppliers`}
            onChange={handlePageChange}
            onShowSizeChange={(current, size) =>
              setPagination({ page: current, limit: size })
            }
          />
        </div>
      </Card>

      {/* Add/Edit Supplier Modal */}
      <Modal
        title={editingSupplier ? "Edit Supplier" : "Add New Supplier"}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingSupplier(null);
          form.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ isActive: true }}
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="name"
              label="Supplier Name"
              rules={[
                { required: true, message: "Please enter supplier name" },
              ]}
              className="col-span-2"
            >
              <Input placeholder="Enter supplier name" />
            </Form.Item>

            <Form.Item name="contactPerson" label="Contact Person">
              <Input placeholder="Enter contact person name" />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                {
                  type: "email",
                  message: "Please enter a valid email address",
                },
              ]}
            >
              <Input placeholder="Enter email address" />
            </Form.Item>

            <Form.Item name="phoneNumber" label="Phone Number">
              <Input placeholder="Enter phone number" />
            </Form.Item>

            <Form.Item name="isActive" label="Status" valuePropName="checked">
              <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
            </Form.Item>

            <Divider orientation="left" className="col-span-2">
              Address Information
            </Divider>

            <Form.Item name={["address", "street"]} label="Street Address">
              <Input placeholder="Enter street address" />
            </Form.Item>

            <Form.Item name={["address", "city"]} label="City">
              <Input placeholder="Enter city" />
            </Form.Item>

            <Form.Item name={["address", "state"]} label="State/Province">
              <Input placeholder="Enter state or province" />
            </Form.Item>

            <Form.Item name={["address", "postalCode"]} label="Zip/Postal Code">
              <Input placeholder="Enter zip or postal code" />
            </Form.Item>

            <Form.Item name={["address", "country"]} label="Country">
              <Input placeholder="Enter country" />
            </Form.Item>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              onClick={() => {
                setIsModalVisible(false);
                setEditingSupplier(null);
                form.resetFields();
              }}
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" className="bg-blue-600">
              {editingSupplier ? "Update" : "Add"} Supplier
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default SupplierList;
