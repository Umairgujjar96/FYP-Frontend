import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Button,
  Typography,
  Space,
  Divider,
  message,
} from "antd";
import {
  MedicineBoxOutlined,
  PlusOutlined,
  CalendarOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { useProductStore } from "../../Store/productStore";
import { useSupplierStore } from "../../Store/useSupplierStore";

const { Text, Title } = Typography;
const { Option } = Select;

const RestockMedicineModal = ({
  visible,
  onCancel,
  product,
  onSuccess = () => {},
}) => {
  // Form instance
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const restockProduct = useProductStore((state) => state.restockProduct);
  const { suppliers, fetchSuppliers } = useSupplierStore();
  // Reset form when modal opens with new product
  useEffect(() => {
    if (visible && product) {
      form.resetFields();

      // Set default values for form
      form.setFieldsValue({
        quantity: 1,
        costPrice: product?.batches?.[0]?.costPrice || 0,
        sellingPrice: product?.batches?.[0]?.sellingPrice || 0,
      });
    }
  }, [visible, product, form]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // Handle form submission
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Format the data for new batch creation
      const restockData = {
        batchNumber: values.batchNumber,
        manufacturingDate: values.manufacturingDate
          ? values.manufacturingDate.format("YYYY-MM-DD")
          : null,
        expiryDate: values.expiryDate
          ? values.expiryDate.format("YYYY-MM-DD")
          : null,
        costPrice: values.costPrice,
        sellingPrice: values.sellingPrice,
        quantity: values.quantity,
        supplier: values.supplier,
        reason: values.reason || "New batch addition",
      };

      // Call the API through Zustand store
      console.log(product);
      await restockProduct(product.productId, restockData);

      message.success(`Successfully restocked ${product.name}`);
      onSuccess();
      onCancel();
    } catch (error) {
      console.error("Restock failed:", error);
      message.error(error.message || "Failed to restock product");
    } finally {
      setLoading(false);
    }
  };

  const disabledDate = (current) => {
    // Can't select days before today
    return current && current < moment().startOf("day");
  };

  return (
    <Modal
      title={
        <Space>
          <MedicineBoxOutlined style={{ color: "#1890ff" }} />
          <span>Restock Medicine: {product?.name}</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={700}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          Restock Inventory
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          quantity: 1,
          costPrice: 0,
          sellingPrice: 0,
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <Text>Current Stock: </Text>
          <Text strong>{product?.totalStock || 0}</Text>
          <Text type="secondary"> / Minimum Required: </Text>
          <Text strong>{product?.minStockLevel || 0}</Text>
          {product?.isLowStock && <Text type="danger"> (Low Stock)</Text>}
        </div>

        <Divider orientation="left">New Batch Details</Divider>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Form.Item
            name="quantity"
            label="Quantity to Add"
            rules={[{ required: true, message: "Please enter quantity" }]}
            style={{ minWidth: 200 }}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="batchNumber"
            label="Batch Number"
            // rules={[{ required: true, message: "Please enter batch number" }]}
            style={{ minWidth: 200 }}
          >
            <Input placeholder="Enter batch number" />
          </Form.Item>
        </div>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Form.Item
            name="manufacturingDate"
            label="Manufacturing Date"
            style={{ minWidth: 200 }}
          >
            <DatePicker format="YYYY-MM-DD" style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="expiryDate"
            label="Expiry Date"
            rules={[{ required: true, message: "Please select expiry date" }]}
            style={{ minWidth: 200 }}
          >
            <DatePicker
              disabledDate={disabledDate}
              format="YYYY-MM-DD"
              style={{ width: "100%" }}
            />
          </Form.Item>
        </div>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Form.Item
            name="costPrice"
            label="Cost Price ($)"
            rules={[{ required: true, message: "Please enter cost price" }]}
            style={{ minWidth: 200 }}
          >
            <InputNumber
              min={0}
              step={0.01}
              precision={2}
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            name="sellingPrice"
            label="Selling Price ($)"
            rules={[{ required: true, message: "Please enter selling price" }]}
            style={{ minWidth: 200 }}
          >
            <InputNumber
              min={0}
              step={0.01}
              precision={2}
              style={{ width: "100%" }}
            />
          </Form.Item>
        </div>

        <Form.Item
          name="supplier"
          label="Supplier"
          rules={[{ required: true, message: "Please select a supplier" }]}
        >
          <Select
            placeholder="Select supplier"
            style={{ width: "100%" }}
            showSearch
          >
            {suppliers.map((supplier) => (
              <Option key={supplier._id} value={supplier._id}>
                {supplier.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="reason" label="Restock Reason">
          <Input.TextArea
            rows={2}
            placeholder="Reason for restocking (optional)"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RestockMedicineModal;
