import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  DatePicker,
  InputNumber,
  Select,
  Switch,
  Upload,
  message,
  Divider,
  Spin,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  InboxOutlined,
  SaveOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import { useAuthStore } from "../../Store/stores";
import { useSupplierStore } from "../../Store/useSupplierStore";
import { useProductStore } from "../../Store/productStore";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Dragger } = Upload;

const ProductPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetchingProduct, setFetchingProduct] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("productId"); // Extract productId from query string

  const { token } = useAuthStore();
  const { categories } = useProductStore();
  const { suppliers } = useSupplierStore();
  const isEditMode = !!productId;

  // Fetch product data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      fetchProductData();
    }
  }, [productId]);

  const fetchProductData = async () => {
    setFetchingProduct(true);
    try {
      const response = await axios.get(
        `http://localhost:5000/api/product/${productId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const productData = response.data.data;
        const latestBatch =
          productData.batches && productData.batches.length > 0
            ? productData.batches[0]
            : null;

        // Set image URL if available
        if (productData.image) {
          setImageUrl(productData.image);
        }

        // Prepare form data from product and the latest batch
        const formData = {
          // Product details
          name: productData.name,
          genericName: productData.genericName,
          description: productData.description,
          manufacturer: productData.manufacturer,
          requiresPrescription: productData.requiresPrescription,
          dosageForm: productData.dosageForm,
          strength: productData.strength,
          barcode: productData.barcode,
          minStockLevel: productData.minStockLevel,
          category: productData.category || undefined,
        };

        // Add batch details if available
        if (latestBatch) {
          formData.batchNumber = latestBatch.batchNumber;
          formData.manufacturingDate = latestBatch.manufacturingDate
            ? dayjs(latestBatch.manufacturingDate)
            : null;
          formData.expiryDate = latestBatch.expiryDate
            ? dayjs(latestBatch.expiryDate)
            : null;
          formData.costPrice = latestBatch.costPrice;
          formData.sellingPrice = latestBatch.sellingPrice;
          formData.currentStock = latestBatch.currentStock;
          formData.supplier = latestBatch.supplier || undefined;
        }

        // Set form values
        form.setFieldsValue(formData);
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || "Failed to fetch product";
      message.error(errorMsg);
      console.error("Error fetching product:", error);
    } finally {
      setFetchingProduct(false);
    }
  };

  const onFinish = async (values) => {
    setLoading(true);

    // Format dates for backend
    const formattedValues = {
      ...values,
      manufacturingDate: values.manufacturingDate?.format("YYYY-MM-DD"),
      expiryDate: values.expiryDate?.format("YYYY-MM-DD"),
      image: imageUrl,
    };

    try {
      let response;

      if (isEditMode) {
        // Update existing product
        response = await axios.put(
          `http://localhost:5000/api/product/${productId}`,
          formattedValues,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.data.success) {
          message.success("Product updated successfully!");
        }
      } else {
        // Create new product
        response = await axios.post(
          "http://localhost:5000/api/product/create",
          formattedValues,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.data.success) {
          message.success("Product created successfully!");
          form.resetFields();
        }
      }

      navigate("/store/products");
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        `Failed to ${isEditMode ? "update" : "create"} product`;
      message.error(errorMsg);
      console.error(
        `Error ${isEditMode ? "updating" : "creating"} product:`,
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = {
    name: "file",
    multiple: false,
    maxCount: 1,
    action: "/api/upload", // Replace with your upload endpoint
    onChange(info) {
      const { status, response } = info.file;

      if (status === "done") {
        setImageUrl(response.url);
        message.success(`${info.file.name} file uploaded successfully.`);
      } else if (status === "error") {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
    onRemove() {
      setImageUrl("");
    },
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6">
      <Card className="shadow-md rounded-lg" bordered={false}>
        <div className="mb-6">
          <Title level={2} className="text-primary font-semibold">
            {isEditMode ? "Edit Product" : "Add New Product"}
          </Title>
          <Text className="text-gray-500">
            {isEditMode
              ? "Update product and batch information"
              : "Create a new product with initial batch information"}
          </Text>
        </div>

        <Spin
          spinning={loading || fetchingProduct}
          tip={
            fetchingProduct ? "Loading product data..." : "Saving product..."
          }
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
              requiresPrescription: false,
            }}
            className="mt-4"
          >
            <Row gutter={24}>
              <Col xs={24} lg={16}>
                <Card
                  title={<Title level={4}>Product Information</Title>}
                  className="mb-6"
                  bordered={false}
                  headStyle={{
                    borderBottom: "1px solid #f0f0f0",
                    paddingLeft: 0,
                  }}
                  bodyStyle={{ paddingLeft: 0, paddingRight: 0 }}
                >
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="name"
                        label="Product Name"
                        rules={[
                          {
                            required: true,
                            message: "Product name is required",
                          },
                        ]}
                      >
                        <Input placeholder="Enter product name" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item
                        name="genericName"
                        label="Generic Name"
                        rules={[
                          {
                            required: true,
                            message: "Generic name is required",
                          },
                        ]}
                      >
                        <Input placeholder="Enter generic name" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item name="description" label="Description">
                    <TextArea
                      placeholder="Enter product description"
                      rows={3}
                    />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item name="manufacturer" label="Manufacturer">
                        <Input placeholder="Enter manufacturer" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item name="barcode" label="Barcode">
                        <Input placeholder="Enter barcode" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col xs={24} md={8}>
                      <Form.Item
                        name="dosageForm"
                        label="Dosage Form"
                        rules={[
                          {
                            required: true,
                            message: "Dosage form is required",
                          },
                        ]}
                      >
                        <Select placeholder="Select dosage form">
                          <Option value="tablet">Tablet</Option>
                          <Option value="capsule">Capsule</Option>
                          <Option value="syrup">Syrup</Option>
                          <Option value="injection">Injection</Option>
                          <Option value="cream">Cream</Option>
                          <Option value="ointment">Ointment</Option>
                          <Option value="other">Other</Option>
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={8}>
                      <Form.Item
                        name="strength"
                        label="Strength"
                        rules={[
                          { required: true, message: "Strength is required" },
                        ]}
                      >
                        <Input placeholder="e.g. 500mg, 10ml" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={8}>
                      <Form.Item
                        name="category"
                        label="Category"
                        rules={[
                          {
                            required: false,
                            message: "Please select a category",
                          },
                        ]}
                      >
                        <Select
                          placeholder="Select category"
                          showSearch
                          optionFilterProp="children"
                          allowClear
                        >
                          {categories?.map((category) => (
                            <Select.Option
                              key={category._id}
                              value={category._id}
                            >
                              {category.name}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="minStockLevel"
                        label="Minimum Stock Level"
                        rules={[
                          {
                            required: true,
                            message: "Minimum stock level is required",
                          },
                        ]}
                      >
                        <InputNumber
                          placeholder="Enter minimum stock"
                          min={0}
                          className="w-full"
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item
                        name="requiresPrescription"
                        label="Requires Prescription"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>

                <Card
                  title={
                    <Title level={4}>
                      {isEditMode
                        ? "New Batch Information"
                        : "Batch Information"}
                    </Title>
                  }
                  bordered={false}
                  headStyle={{
                    borderBottom: "1px solid #f0f0f0",
                    paddingLeft: 0,
                  }}
                  bodyStyle={{ paddingLeft: 0, paddingRight: 0 }}
                >
                  {isEditMode && (
                    <div className="mb-4 px-1">
                      <Text type="secondary">
                        {`Current Total Stock: ${
                          form.getFieldValue("currentStock") || "0"
                        } units. Adding a new batch will increase the total stock.`}
                      </Text>
                    </div>
                  )}

                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="batchNumber"
                        label="Batch Number"
                        rules={[
                          {
                            required: true,
                            message: "Batch number is required",
                          },
                        ]}
                      >
                        <Input placeholder="Enter batch number" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item
                        name="supplier"
                        label="Supplier"
                        rules={[
                          {
                            required: false,
                            message: "Please select a supplier",
                          },
                        ]}
                      >
                        <Select
                          placeholder="Select supplier"
                          showSearch
                          optionFilterProp="children"
                        >
                          {suppliers && suppliers.length > 0 ? (
                            suppliers.map((supplier) => (
                              <Option key={supplier._id} value={supplier._id}>
                                {supplier.name}
                              </Option>
                            ))
                          ) : (
                            <Option value="default">Default Supplier</Option>
                          )}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="manufacturingDate"
                        label="Manufacturing Date"
                        rules={[
                          {
                            required: true,
                            message: "Manufacturing date is required",
                          },
                        ]}
                      >
                        <DatePicker
                          className="w-full"
                          format="YYYY-MM-DD"
                          disabledDate={(d) => !d || d.isAfter(dayjs())}
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item
                        name="expiryDate"
                        label="Expiry Date"
                        rules={[
                          {
                            required: true,
                            message: "Expiry date is required",
                          },
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              const manufDate =
                                getFieldValue("manufacturingDate");
                              if (
                                !value ||
                                !manufDate ||
                                value.isAfter(manufDate)
                              ) {
                                return Promise.resolve();
                              }
                              return Promise.reject(
                                new Error(
                                  "Expiry date must be after manufacturing date"
                                )
                              );
                            },
                          }),
                        ]}
                      >
                        <DatePicker className="w-full" format="YYYY-MM-DD" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col xs={24} md={8}>
                      <Form.Item
                        name="costPrice"
                        label="Cost Price"
                        rules={[
                          { required: true, message: "Cost price is required" },
                        ]}
                      >
                        <InputNumber
                          placeholder="Enter cost price"
                          min={0}
                          step={0.01}
                          formatter={(value) =>
                            `Rs. ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                          }
                          parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                          className="w-full"
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={8}>
                      <Form.Item
                        name="sellingPrice"
                        label="Selling Price"
                        rules={[
                          {
                            required: true,
                            message: "Selling price is required",
                          },
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              const costPrice = getFieldValue("costPrice");
                              if (!value || !costPrice || value >= costPrice) {
                                return Promise.resolve();
                              }
                              return Promise.reject(
                                new Error(
                                  "Selling price should be at least equal to cost price"
                                )
                              );
                            },
                          }),
                        ]}
                      >
                        <InputNumber
                          placeholder="Enter selling price"
                          min={0}
                          step={0.01}
                          formatter={(value) =>
                            `Rs. ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                          }
                          parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                          className="w-full"
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={8}>
                      <Form.Item
                        name="currentStock"
                        label={
                          isEditMode
                            ? "New Batch Quantity"
                            : "Initial Stock Quantity"
                        }
                        rules={[
                          {
                            required: true,
                            message: "Stock quantity is required",
                          },
                        ]}
                      >
                        <InputNumber
                          placeholder="Enter quantity"
                          min={1}
                          className="w-full"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              </Col>

              <Col xs={24} lg={8}>
                <Card
                  title={<Title level={4}>Product Image</Title>}
                  bordered={false}
                  className="mb-6 h-full"
                  headStyle={{ borderBottom: "1px solid #f0f0f0" }}
                >
                  <Form.Item
                    name="image"
                    valuePropName="fileList"
                    getValueFromEvent={(e) => {
                      if (Array.isArray(e)) {
                        return e;
                      }
                      return e && e.fileList;
                    }}
                  >
                    <Dragger {...uploadProps} className="h-64">
                      <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                      </p>
                      <p className="ant-upload-text">
                        Click or drag file to this area to upload
                      </p>
                      <p className="ant-upload-hint">
                        Support for a single image upload. Please upload a clear
                        image of the product.
                      </p>
                    </Dragger>
                  </Form.Item>

                  {imageUrl && (
                    <div className="mt-4">
                      <img
                        src={imageUrl}
                        alt="Product preview"
                        className="max-w-full h-auto rounded-md"
                      />
                    </div>
                  )}
                </Card>
              </Col>
            </Row>

            <Divider />

            <div className="flex justify-end gap-4 mt-6">
              <Button
                onClick={() => navigate("/store/products")}
                icon={<CloseOutlined />}
                size="large"
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                size="large"
                className="bg-blue-600 hover:bg-blue-700"
                loading={loading}
              >
                {isEditMode ? "Update Product" : "Save Product"}
              </Button>
            </div>
          </Form>
        </Spin>
      </Card>
    </div>
  );
};

export default ProductPage;
