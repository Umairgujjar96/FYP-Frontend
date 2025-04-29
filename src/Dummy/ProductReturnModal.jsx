// ReturnProductsModal.jsx
import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Select,
  InputNumber,
  Table,
  Spin,
  notification,
  Divider,
  Typography,
  Space,
  Tooltip,
} from "antd";
import {
  ExclamationCircleOutlined,
  SearchOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useReturnStore } from "../Store/useReturnStore";
// import { useReturnStore } from '../stores/returnStore';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ReturnProductsModal = ({ visible, onCancel }) => {
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Search, 2: Select Items, 3: Confirm

  // Get state and actions from Zustand store
  const {
    invoiceNumber,
    sale,
    returnItems,
    totalRefundAmount,
    searchInvoice,
    setSale,
    addReturnItem,
    removeReturnItem,
    updateReturnItem,
    resetReturn,
    submitReturn,
  } = useReturnStore();

  // Reset the form and state when modal opens/closes
  useEffect(() => {
    if (visible) {
      searchForm.resetFields();
      form.resetFields();
    } else {
      resetReturn();
      setCurrentStep(1);
    }
  }, [visible, resetReturn, searchForm, form]);

  // Handle invoice search
  const handleSearch = async (values) => {
    try {
      setSearchLoading(true);
      await searchInvoice(values.invoiceNumber);
      setCurrentStep(2);
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Failed to find the invoice",
      });
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle adding an item to return list
  const handleAddItem = (item) => {
    if (item.remainingQuantity > 0) {
      // Calculate the discounted unit price that the customer actually paid
      const discountPerUnit =
        item.discountPerUnit ||
        (item.discount ? item.discount / item.quantity : 0);
      const effectiveUnitPrice =
        item.effectiveUnitPrice || item.unitPrice - discountPerUnit;

      addReturnItem({
        productId: item.product._id,
        batchId: item.batch._id,
        name: item.product.name,
        batchNumber: item.batch.batchNumber,
        unitPrice: item.unitPrice,
        discountPerUnit: discountPerUnit,
        effectiveUnitPrice: effectiveUnitPrice,
        maxQuantity: item.remainingQuantity,
        quantity: 1, // Default to 1
        subtotal: effectiveUnitPrice, // Use the effective price for subtotal
      });
    }
  };

  // Handle quantity change
  const handleQuantityChange = (productId, batchId, quantity) => {
    updateReturnItem(productId, batchId, quantity);
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const result = await submitReturn(sale._id, values.reason);

      notification.success({
        message: "Return Successful",
        description: `Products returned successfully. Refund amount: $${result.totalRefundAmount.toFixed(
          2
        )}`,
      });

      setCurrentStep(3); // Move to confirmation screen
    } catch (error) {
      notification.error({
        message: "Return Failed",
        description: error.message || "Failed to process return",
      });
    } finally {
      setLoading(false);
    }
  };

  // Column definitions for the sale items table
  const saleItemColumns = [
    {
      title: "Product",
      key: "product",
      render: (_, item) => (
        <div>
          <div className="font-medium">{item.product.name}</div>
          {item.product.genericName && (
            <div className="text-gray-500 text-xs">
              {item.product.genericName}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Batch",
      dataIndex: ["batch", "batchNumber"],
      key: "batch",
    },
    {
      title: "Price",
      key: "price",
      render: (_, item) => {
        const discountPerUnit =
          item.discountPerUnit ||
          (item.discount ? item.discount / item.quantity : 0);
        const effectiveUnitPrice =
          item.effectiveUnitPrice || item.unitPrice - discountPerUnit;

        return (
          <Tooltip
            title={
              discountPerUnit > 0
                ? `Original: $${item.unitPrice.toFixed(
                    2
                  )}, Discount: $${discountPerUnit.toFixed(2)} per unit`
                : null
            }
          >
            <div className="cursor-help">
              <div>${effectiveUnitPrice.toFixed(2)}</div>
              {discountPerUnit > 0 && (
                <div className="text-green-600 text-xs flex items-center">
                  <span>After discount</span>
                  <InfoCircleOutlined className="ml-1" />
                </div>
              )}
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: "Qty",
      key: "quantity",
      render: (_, item) => (
        <span>
          {item.remainingQuantity} of {item.quantity}
        </span>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, item) => {
        const isItemSelected = returnItems.some(
          (returnItem) =>
            returnItem.productId === item.product._id &&
            returnItem.batchId === item.batch._id
        );
        const isReturnAvailable = item.remainingQuantity > 0;

        return (
          <Button
            type={isItemSelected ? "default" : "primary"}
            size="small"
            disabled={!isReturnAvailable}
            onClick={() =>
              isItemSelected
                ? removeReturnItem(item.product._id, item.batch._id)
                : handleAddItem(item)
            }
          >
            {isItemSelected ? "Remove" : "Return"}
          </Button>
        );
      },
    },
  ];

  // Column definitions for the return items table
  const returnItemColumns = [
    {
      title: "Product",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Batch",
      dataIndex: "batchNumber",
      key: "batchNumber",
    },
    {
      title: "Price",
      key: "price",
      render: (_, item) => {
        const hasDiscount = item.discountPerUnit > 0;

        return (
          <Tooltip
            title={
              hasDiscount
                ? `Original: $${item.unitPrice.toFixed(
                    2
                  )}, Discount: $${item.discountPerUnit.toFixed(2)} per unit`
                : null
            }
          >
            <div className="cursor-help">
              <div>${item.effectiveUnitPrice.toFixed(2)}</div>
              {hasDiscount && (
                <div className="text-green-600 text-xs flex items-center">
                  <span>After discount</span>
                  <InfoCircleOutlined className="ml-1" />
                </div>
              )}
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: "Quantity",
      key: "quantity",
      render: (_, item) => (
        <InputNumber
          min={1}
          max={item.maxQuantity}
          value={item.quantity}
          onChange={(value) =>
            handleQuantityChange(item.productId, item.batchId, value)
          }
          className="w-16"
        />
      ),
    },
    {
      title: "Refund Amount",
      key: "refundAmount",
      render: (_, item) =>
        `$${(item.quantity * item.effectiveUnitPrice).toFixed(2)}`,
    },
    {
      title: "Action",
      key: "action",
      render: (_, item) => (
        <Button
          type="text"
          danger
          size="small"
          onClick={() => removeReturnItem(item.productId, item.batchId)}
        >
          Remove
        </Button>
      ),
    },
  ];

  // Content for step 1: Invoice Search
  const renderSearchStep = () => (
    <div className="py-6">
      <div className="text-center mb-6">
        <Title level={4}>Search for Sale</Title>
        <Text type="secondary">Enter the invoice number to find the sale</Text>
      </div>

      <Form form={searchForm} onFinish={handleSearch} layout="vertical">
        <Form.Item
          name="invoiceNumber"
          rules={[
            { required: true, message: "Please enter an invoice number" },
          ]}
        >
          <Input
            prefix={<SearchOutlined />}
            placeholder="Enter Invoice Number"
            size="large"
            autoFocus
          />
        </Form.Item>

        <Form.Item className="text-center">
          <Button
            type="primary"
            icon={<SearchOutlined />}
            htmlType="submit"
            loading={searchLoading}
            size="large"
          >
            Search Invoice
          </Button>
        </Form.Item>
      </Form>
    </div>
  );

  // Content for step 2: Select Items to Return
  const renderSelectItemsStep = () => (
    <div>
      {sale && (
        <div className="mb-4">
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="flex justify-between mb-2">
              <Text strong>Invoice: </Text>
              <Text>{sale.invoiceNumber}</Text>
            </div>
            <div className="flex justify-between mb-2">
              <Text strong>Date: </Text>
              <Text>{new Date(sale.createdAt).toLocaleDateString()}</Text>
            </div>
            <div className="flex justify-between mb-2">
              <Text strong>Customer: </Text>
              <Text>
                {sale.customer ? sale.customer.name : "Walk-in Customer"}
              </Text>
            </div>
            <div className="flex justify-between mb-2">
              <Text strong>Total: </Text>
              <Text>${sale.total.toFixed(2)}</Text>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between">
                <Text strong>Discount Applied: </Text>
                <Text className="text-green-600">
                  ${sale.discount.toFixed(2)}
                </Text>
              </div>
            )}
          </div>

          <Divider orientation="left">Sale Items</Divider>
          <Table
            dataSource={sale.items}
            columns={saleItemColumns}
            rowKey={(record) => `${record.product._id}-${record.batch._id}`}
            pagination={false}
            size="small"
          />

          {returnItems.length > 0 && (
            <>
              <Divider orientation="left">Items to Return</Divider>
              <Table
                dataSource={returnItems}
                columns={returnItemColumns}
                rowKey={(record) => `${record.productId}-${record.batchId}`}
                pagination={false}
                size="small"
                footer={() => (
                  <div className="flex justify-end">
                    <Text strong>
                      Total Refund: ${totalRefundAmount.toFixed(2)}
                    </Text>
                  </div>
                )}
              />

              <Form
                form={form}
                onFinish={handleSubmit}
                layout="vertical"
                className="mt-4"
              >
                <Form.Item
                  name="reason"
                  label="Return Reason"
                  rules={[
                    {
                      required: true,
                      message: "Please provide a reason for return",
                    },
                  ]}
                >
                  <TextArea rows={3} placeholder="Enter reason for return" />
                </Form.Item>

                <div className="flex justify-between mt-4">
                  <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => {
                      setCurrentStep(1);
                      resetReturn();
                    }}
                  >
                    Back to Search
                  </Button>

                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    disabled={returnItems.length === 0}
                  >
                    Process Return
                  </Button>
                </div>
              </Form>
            </>
          )}
        </div>
      )}
    </div>
  );

  // Content for step 3: Confirmation
  const renderConfirmationStep = () => (
    <div className="text-center py-8">
      <div className="mb-6">
        <CheckCircleOutlined className="text-green-500 text-6xl" />
      </div>
      <Title level={3}>Return Processed Successfully</Title>
      <Text>
        The products have been returned and the inventory has been updated.
      </Text>
      <div className="mt-8">
        <Button type="primary" onClick={onCancel}>
          Close
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      title={
        <div className="flex items-center">
          {currentStep > 1 && currentStep < 3 && (
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => setCurrentStep(currentStep - 1)}
              className="mr-2"
            />
          )}
          <span>Process Product Return</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      maskClosable={false}
      destroyOnClose
    >
      <Spin spinning={loading || searchLoading}>
        {currentStep === 1 && renderSearchStep()}
        {currentStep === 2 && renderSelectItemsStep()}
        {currentStep === 3 && renderConfirmationStep()}
      </Spin>
    </Modal>
  );
};

export default ReturnProductsModal;
