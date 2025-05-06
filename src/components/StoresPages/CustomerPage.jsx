import React, { useState, useEffect, useRef } from "react";
import {
  Table,
  Input,
  Button,
  Space,
  Popconfirm,
  message,
  Card,
  Tag,
  Modal,
  Form,
  Select,
  Tooltip,
  Empty,
  Spin,
  Typography,
  List,
  Image,
} from "antd";
import {
  SearchOutlined,
  UserAddOutlined,
  EditOutlined,
  DeleteOutlined,
  FileAddOutlined,
  PhoneOutlined,
  MailOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "../../Store/stores";
import useCustomerStore from "../../Store/useCustomerStore";
// import useCustomerStore from "../stores/useCustomerStore";
// import useAuthStore from "../stores/useAuthStore"; // Assuming you have an auth store

const { Title, Text } = Typography;
const { Option } = Select;

const CustomerPage = () => {
  // Store state and functions
  const {
    customers,
    loading,
    error,
    pagination,
    getCustomersByStore,
    deleteCustomer,
    createCustomer,
    updateCustomer,
    uploadPrescription,
    downloadPrescription, // Add this function to your store if it doesn't exist
  } = useCustomerStore();

  // Get current user's store from auth store (assuming structure)
  const { currentStore } = useAuthStore();
  console.log(customers);
  const storeId = currentStore?.id;

  // Local state
  const [searchText, setSearchText] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [form] = Form.useForm();
  const [prescriptionModal, setPrescriptionModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const fileInputRef = useRef(null);

  // New state for viewing prescriptions
  const [viewPrescriptionModal, setViewPrescriptionModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState(false);

  // Load customers on mount
  useEffect(() => {
    if (storeId) {
      fetchCustomers();
    }
  }, [storeId]);

  // Handle errors
  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  // Fetch customers with optional search
  const fetchCustomers = (page = 1, limit = 10) => {
    if (!storeId) return;

    const params = {
      page,
      limit,
    };

    if (searchText) {
      params.name = searchText;
    }

    getCustomersByStore(storeId, params);
  };

  // Handle search
  const handleSearch = () => {
    fetchCustomers(1);
  };

  // Reset search
  const handleReset = () => {
    setSearchText("");
    fetchCustomers(1);
  };

  // Open modal for adding/editing customer
  const showModal = (customer = null) => {
    setEditingCustomer(customer);

    if (customer) {
      form.setFieldsValue({
        name: customer.name,
        email: customer.email,
        phoneNumber: customer.phoneNumber,
      });
    } else {
      form.resetFields();
    }

    setIsModalVisible(true);
  };

  // Handle modal cancel
  const handleCancel = () => {
    setIsModalVisible(false);
    setPrescriptionModal(false);
    setViewPrescriptionModal(false);
    form.resetFields();
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Add store ID to form data
      values.store = storeId;

      if (editingCustomer) {
        await updateCustomer(editingCustomer._id, values);
        message.success("Customer updated successfully");
      } else {
        await createCustomer(values);
        message.success("Customer created successfully");
      }

      setIsModalVisible(false);
      fetchCustomers(pagination.page);
    } catch (error) {
      console.error("Form validation failed:", error);
    }
  };

  // Confirm customer deletion
  const confirmDelete = async (id) => {
    try {
      await deleteCustomer(id);
      message.success("Customer deleted successfully");

      if (customers.length === 1 && pagination.page > 1) {
        fetchCustomers(pagination.page - 1);
      } else {
        fetchCustomers(pagination.page);
      }
    } catch (error) {
      message.error("Failed to delete customer");
    }
  };

  // Handle pagination change
  const handleTableChange = (pagination) => {
    fetchCustomers(pagination.current, pagination.pageSize);
  };

  // Show prescription modal
  const showPrescriptionModal = (customerId) => {
    setSelectedCustomerId(customerId);
    setPrescriptionModal(true);
  };

  // Handle file selection
  const handleFileChange = (e) => {
    setPrescriptionFile(e.target.files[0]);
  };

  // Upload prescription
  const handleUploadPrescription = async () => {
    if (!prescriptionFile || !selectedCustomerId) {
      message.warning("Please select a file");
      return;
    }

    const formData = new FormData();
    formData.append("prescription", prescriptionFile);

    try {
      await uploadPrescription(selectedCustomerId, formData);
      message.success("Prescription uploaded successfully");
      setPrescriptionModal(false);
      setPrescriptionFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      fetchCustomers(pagination.page);
    } catch (error) {
      message.error("Failed to upload prescription");
    }
  };

  // New function to show prescriptions view modal
  const showViewPrescriptionModal = (customer) => {
    setSelectedCustomer(customer);
    setViewPrescriptionModal(true);
    if (customer.prescriptions && customer.prescriptions.length > 0) {
      setSelectedPrescription(customer.prescriptions[0]);
    }
  };

  // New function to view a specific prescription
  const viewPrescription = (prescription) => {
    setSelectedPrescription(prescription);
  };

  // Handle prescription download
  // const handleDownloadPrescription = async (customerId, prescriptionId) => {
  //   if (!customerId || !prescriptionId) {
  //     message.error("Unable to identify prescription");
  //     return;
  //   }

  //   const prescriptionViewUrl = `/prescriptions/view/${customerId}/${prescriptionId}`;
  //   window.open(prescriptionViewUrl, "_blank"); // Open in new tab

  //   // setDownloadLoading(true);
  //   // try {
  //   //   await downloadPrescription(customerId, prescriptionId);
  //   //   message.success("Prescription downloaded successfully");
  //   //   setDownloadLoading(false);
  //   // } catch (error) {
  //   //   console.error("Download error:", error);
  //   //   message.error("Failed to download prescription");
  //   //   setDownloadLoading(false);
  //   // }
  // };

  const handleDownloadPrescription = async (prescription) => {
    if (!prescription || !prescription.file) {
      message.error("Prescription file not available");
      return;
    }

    try {
      // Extract filename from the full Windows path
      const fileName = prescription.file.split("\\").pop();

      // Construct the full URL
      const fileUrl = `http://localhost:5000/uploads/prescriptions/${fileName}`;

      // Open the file in a new browser tab
      window.open(fileUrl, "_blank");
    } catch (error) {
      console.error("Error opening prescription:", error);
      message.error("Failed to open prescription file");
    }
  };

  // Helper function to determine file type icon
  const getFileIcon = (prescription) => {
    if (!prescription) return <FileTextOutlined />;

    if (prescription.file) {
      const filePath = prescription.file;
      const extension = filePath.split(".").pop().toLowerCase();

      if (["pdf"].includes(extension)) {
        return <FilePdfOutlined />;
      } else if (["jpg", "jpeg", "png", "gif"].includes(extension)) {
        return <FileImageOutlined />;
      }
    }

    return <FileTextOutlined />;
  };

  // Helper function to get file name from path
  const getFileName = (filePath) => {
    if (!filePath) return "Unknown file";
    return (
      filePath.split("\\").pop() ||
      filePath.split("/").pop() ||
      "Prescription file"
    );
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Define columns for the table
  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white mr-2">
            {text.charAt(0).toUpperCase()}
          </div>
          <span>{text}</span>
        </div>
      ),
    },
    {
      title: "Contact",
      key: "contact",
      render: (_, record) => (
        <Space direction="vertical" size="small">
          {record.email && (
            <div className="flex items-center">
              <MailOutlined className="text-gray-500 mr-2" />
              <a href={`mailto:${record.email}`}>{record.email}</a>
            </div>
          )}
          {record.phoneNumber && (
            <div className="flex items-center">
              <PhoneOutlined className="text-gray-500 mr-2" />
              <a href={`tel:${record.phoneNumber}`}>{record.phoneNumber}</a>
            </div>
          )}
        </Space>
      ),
    },
    {
      title: "Prescriptions",
      dataIndex: "prescriptions",
      key: "prescriptions",
      render: (prescriptions, record) => (
        <Space>
          {prescriptions && prescriptions.length > 0 ? (
            <div className="flex items-center">
              <Tag color="green">{prescriptions.length} prescription(s)</Tag>
              <Tooltip title="View prescriptions">
                <Button
                  icon={<EyeOutlined />}
                  type="text"
                  onClick={() => showViewPrescriptionModal(record)}
                  className="text-blue-600 hover:text-blue-800 ml-2"
                />
              </Tooltip>
            </div>
          ) : (
            <Tag color="orange">No prescriptions</Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Edit customer">
            <Button
              icon={<EditOutlined />}
              type="text"
              onClick={() => showModal(record)}
              className="text-blue-600 hover:text-blue-800"
            />
          </Tooltip>
          <Tooltip title="Add prescription">
            <Button
              icon={<FileAddOutlined />}
              type="text"
              onClick={() => showPrescriptionModal(record._id)}
              className="text-green-600 hover:text-green-800"
            />
          </Tooltip>
          <Tooltip title="Delete customer">
            <Popconfirm
              title="Are you sure you want to delete this customer?"
              description="This action cannot be undone."
              icon={<ExclamationCircleOutlined style={{ color: "red" }} />}
              onConfirm={() => confirmDelete(record._id)}
              okText="Yes"
              cancelText="No"
              placement="left"
            >
              <Button
                icon={<DeleteOutlined />}
                type="text"
                className="text-red-600 hover:text-red-800"
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card className="w-full shadow-md rounded-lg">
        <div className="flex justify-between items-center mb-6">
          <Title level={4} className="m-0">
            Customer Management
          </Title>
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => showModal()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Add Customer
          </Button>
        </div>

        <div className="mb-4 flex items-center">
          <Input
            placeholder="Search customers by name..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={handleSearch}
            prefix={<SearchOutlined className="text-gray-400" />}
            className="mr-2"
          />
          <Button
            onClick={handleSearch}
            type="primary"
            className="bg-blue-600 hover:bg-blue-700 mr-2"
          >
            Search
          </Button>
          <Button onClick={handleReset}>Reset</Button>
        </div>

        <Spin spinning={loading}>
          {customers.length > 0 ? (
            <Table
              columns={columns}
              dataSource={customers}
              rowKey="_id"
              pagination={{
                current: pagination.page,
                pageSize: pagination.limit,
                total: pagination.total,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} customers`,
              }}
              onChange={handleTableChange}
              className="shadow-sm rounded-md overflow-hidden"
            />
          ) : (
            <Empty
              description={
                <span className="text-gray-500">
                  No customers found. Add a new customer to get started.
                </span>
              }
              className="my-8"
            />
          )}
        </Spin>
      </Card>

      {/* Customer Form Modal */}
      <Modal
        title={editingCustomer ? "Edit Customer" : "Add New Customer"}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {editingCustomer ? "Update" : "Create"}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Please enter customer name" }]}
          >
            <Input placeholder="Enter customer name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[{ type: "email", message: "Please enter a valid email" }]}
          >
            <Input placeholder="Enter customer email (optional)" />
          </Form.Item>

          <Form.Item name="phoneNumber" label="Phone Number">
            <Input placeholder="Enter customer phone number (optional)" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Prescription Upload Modal */}
      <Modal
        title="Upload Prescription"
        open={prescriptionModal}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button
            key="upload"
            type="primary"
            onClick={handleUploadPrescription}
            disabled={!prescriptionFile}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Upload
          </Button>,
        ]}
      >
        <div className="my-4">
          <Text type="secondary" className="block mb-2">
            Upload prescription document for this customer. Supported formats:
            JPEG, PNG, PDF.
          </Text>

          <input
            type="file"
            ref={fileInputRef}
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleFileChange}
            className="block w-full text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />

          {prescriptionFile && (
            <div className="mt-2">
              <Tag icon={<FileTextOutlined />} color="blue">
                {prescriptionFile.name}
              </Tag>
            </div>
          )}
        </div>
      </Modal>

      {/* View Prescriptions Modal */}
      <Modal
        title={`Prescriptions for ${selectedCustomer?.name || ""}`}
        open={viewPrescriptionModal}
        onCancel={handleCancel}
        footer={null}
        width={800}
      >
        {selectedCustomer && (
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/3 border-r pr-4">
              <Title level={5} className="mb-4">
                Prescription List
              </Title>
              {selectedCustomer.prescriptions &&
              selectedCustomer.prescriptions.length > 0 ? (
                <List
                  dataSource={selectedCustomer.prescriptions}
                  renderItem={(prescription) => (
                    <List.Item
                      className={`cursor-pointer transition-colors ${
                        selectedPrescription &&
                        selectedPrescription._id === prescription._id
                          ? "bg-blue-50"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => viewPrescription(prescription)}
                    >
                      <List.Item.Meta
                        avatar={getFileIcon(prescription)}
                        title={`Prescription ${
                          prescription._id
                            ? prescription._id.substring(0, 8) + "..."
                            : "Unknown"
                        }`}
                        description={formatDate(
                          prescription.uploadDate || prescription.createdAt
                        )}
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="No prescriptions found" />
              )}
            </div>

            <div className="md:w-2/3 md:pl-4 mt-4 md:mt-0">
              <Title level={5} className="mb-4">
                Prescription Details
              </Title>

              {selectedPrescription ? (
                <div className="border p-4 rounded-md">
                  <div className="mb-4">
                    <p>
                      <strong>Added on:</strong>{" "}
                      {formatDate(
                        selectedPrescription.uploadDate ||
                          selectedPrescription.createdAt
                      )}
                    </p>
                    <p>
                      <strong>Prescription ID:</strong>{" "}
                      {selectedPrescription._id || "Not available"}
                    </p>
                    {selectedPrescription.status && (
                      <p>
                        <strong>Status:</strong>{" "}
                        <Tag
                          color={
                            selectedPrescription.status === "active"
                              ? "green"
                              : "orange"
                          }
                        >
                          {selectedPrescription.status}
                        </Tag>
                      </p>
                    )}
                    {selectedPrescription.file && (
                      <p>
                        <strong>Filename:</strong>{" "}
                        {getFileName(selectedPrescription.file)}
                      </p>
                    )}
                  </div>

                  {selectedPrescription.file && (
                    <div className="mb-4 text-center">
                      {selectedPrescription.file.match(
                        /\.(jpg|jpeg|png|gif)$/i
                      ) ? (
                        <div className="flex justify-center">
                          <img
                            src="/api/placeholder/400/320"
                            alt="Prescription preview not available"
                            className="object-contain h-64"
                          />
                        </div>
                      ) : selectedPrescription.file.match(/\.pdf$/i) ? (
                        <div className="text-center">
                          <FilePdfOutlined
                            style={{ fontSize: "48px", color: "#ff4d4f" }}
                          />
                          <p className="mt-2">PDF Document</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <FileTextOutlined
                            style={{ fontSize: "48px", color: "#1890ff" }}
                          />
                          <p className="mt-2">Document</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-center mt-4">
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      onClick={() =>
                        handleDownloadPrescription(selectedPrescription)
                      }
                      loading={downloadLoading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      View Prescription
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 p-8 border border-dashed rounded-md">
                  <FileTextOutlined style={{ fontSize: "36px" }} />
                  <p className="mt-3">
                    Select a prescription from the list to view details
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CustomerPage;
