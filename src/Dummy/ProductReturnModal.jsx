import React, { useState } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Table,
  InputNumber,
  Select,
  message,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

const { Option } = Select;

const PharmacyReturnModal = ({ visible, onClose }) => {
  const [form] = Form.useForm();
  const [returnItems, setReturnItems] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [returnSubmitted, setReturnSubmitted] = useState(false);

  // Mock return reasons specific to pharmacy
  const returnReasons = [
    "Expired medication",
    "Wrong medication dispensed",
    "Customer changed mind",
    "Adverse reaction",
    "Prescription changed",
    "Packaging damaged",
    "Other",
  ];

  const handleSearch = () => {
    const productName = form.getFieldValue("productSearch");
    if (!productName || productName.trim() === "") {
      message.error("Please enter a product name");
      return;
    }

    // Simulate API search
    setSearching(true);
    setTimeout(() => {
      // Mock search results
      const mockResults = [
        {
          id: 1,
          name: "Acetaminophen 500mg",
          sku: "MED-1001",
          price: 12.99,
          stock: 45,
        },
        {
          id: 2,
          name: "Acetaminophen Extra Strength",
          sku: "MED-1002",
          price: 15.99,
          stock: 32,
        },
        {
          id: 3,
          name: "Acetaminophen Children's",
          sku: "MED-1003",
          price: 9.99,
          stock: 28,
        },
      ].filter((item) =>
        item.name.toLowerCase().includes(productName.toLowerCase())
      );

      setSearchResults(mockResults);
      setSearching(false);

      if (mockResults.length === 0) {
        message.info("No products found");
      }
    }, 300);
  };

  const addToReturn = (product) => {
    if (returnItems.some((item) => item.id === product.id)) {
      message.warning("Product already added to return");
      return;
    }

    setReturnItems([
      ...returnItems,
      {
        ...product,
        returnQty: 1,
        reason: returnReasons[0],
        subtotal: product.price,
      },
    ]);

    // Clear search
    form.setFieldsValue({ productSearch: "" });
    setSearchResults([]);
  };

  const handleReturnQtyChange = (id, value) => {
    setReturnItems(
      returnItems.map((item) => {
        if (item.id === id) {
          return { ...item, returnQty: value, subtotal: value * item.price };
        }
        return item;
      })
    );
  };

  const handleReasonChange = (id, value) => {
    setReturnItems(
      returnItems.map((item) => {
        if (item.id === id) {
          return { ...item, reason: value };
        }
        return item;
      })
    );
  };

  const removeReturnItem = (id) => {
    setReturnItems(returnItems.filter((item) => item.id !== id));
  };

  const getReturnTotal = () => {
    return returnItems
      .reduce((total, item) => total + item.subtotal, 0)
      .toFixed(2);
  };

  const handleSubmit = () => {
    if (returnItems.length === 0) {
      message.error("Please add at least one product to return");
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setReturnSubmitted(true);
      message.success("Return processed successfully");
    }, 500);
  };

  const handleClose = () => {
    form.resetFields();
    setReturnItems([]);
    setSearchResults([]);
    setReturnSubmitted(false);
    onClose();
  };

  const searchResultColumns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "SKU",
      dataIndex: "sku",
      key: "sku",
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (price) => `$${price.toFixed(2)}`,
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => addToReturn(record)}
          icon={<PlusOutlined />}
          className="bg-blue-500"
        >
          Add
        </Button>
      ),
    },
  ];

  const returnItemColumns = [
    {
      title: "Product",
      dataIndex: "name",
      key: "name",
      width: "30%",
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (price) => `$${price.toFixed(2)}`,
    },
    {
      title: "Qty",
      key: "returnQty",
      width: "15%",
      render: (_, record) => (
        <InputNumber
          min={1}
          max={99}
          value={record.returnQty}
          onChange={(value) => handleReturnQtyChange(record.id, value)}
          size="small"
          className="w-16"
        />
      ),
    },
    {
      title: "Reason",
      key: "reason",
      width: "25%",
      render: (_, record) => (
        <Select
          value={record.reason}
          onChange={(value) => handleReasonChange(record.id, value)}
          size="small"
          style={{ width: "100%" }}
        >
          {returnReasons.map((reason) => (
            <Option key={reason} value={reason}>
              {reason}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: "Subtotal",
      key: "subtotal",
      render: (_, record) => `$${record.subtotal.toFixed(2)}`,
    },
    {
      title: "",
      key: "action",
      width: "10%",
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeReturnItem(record.id)}
          size="small"
        />
      ),
    },
  ];

  // The main return form
  const returnForm = (
    <div>
      <Form form={form} layout="vertical">
        <div className="flex gap-2 mb-4">
          <Form.Item name="productSearch" className="mb-0 flex-1">
            <Input
              placeholder="Search product by name"
              prefix={<SearchOutlined />}
              onPressEnter={handleSearch}
            />
          </Form.Item>
          <Button
            type="primary"
            onClick={handleSearch}
            loading={searching}
            className="bg-blue-500"
          >
            Search
          </Button>
        </div>
      </Form>

      {searchResults.length > 0 && (
        <div className="mb-6">
          <Table
            dataSource={searchResults}
            columns={searchResultColumns}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </div>
      )}

      <div className="mt-4">
        <h3 className="text-lg font-medium mb-2">Return Items</h3>
        {returnItems.length > 0 ? (
          <Table
            dataSource={returnItems}
            columns={returnItemColumns}
            rowKey="id"
            pagination={false}
            size="small"
            footer={() => (
              <div className="flex justify-between items-center">
                <span>Total Items: {returnItems.length}</span>
                <span className="font-medium text-lg">
                  Total Refund: ${getReturnTotal()}
                </span>
              </div>
            )}
          />
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded">
            <p className="text-gray-500">No products added to return</p>
          </div>
        )}
      </div>
    </div>
  );

  // Success content after return is processed
  const successContent = (
    <div className="text-center py-6">
      <div className="text-green-500 text-5xl mb-4">✓</div>
      <h3 className="text-xl font-medium mb-2">
        Return Processed Successfully
      </h3>
      <p>Return reference: RTN-{Math.floor(Math.random() * 10000)}</p>

      <div className="bg-gray-50 p-4 rounded-md max-w-sm mx-auto my-6">
        <div className="flex justify-between mb-2">
          <span>Items Returned:</span>
          <span>{returnItems.length}</span>
        </div>
        <div className="flex justify-between font-medium">
          <span>Total Refund:</span>
          <span>${getReturnTotal()}</span>
        </div>
      </div>
    </div>
  );

  return (
    <Modal
      title="Process Return"
      open={visible}
      onCancel={handleClose}
      width={800}
      footer={
        returnSubmitted
          ? [
              <Button key="close" onClick={handleClose} className="bg-white">
                Close
              </Button>,
            ]
          : [
              <Button key="cancel" onClick={handleClose} className="bg-white">
                Cancel
              </Button>,
              <Button
                key="submit"
                type="primary"
                onClick={handleSubmit}
                loading={loading}
                disabled={returnItems.length === 0}
                className="bg-blue-500"
              >
                Process Return
              </Button>,
            ]
      }
    >
      {returnSubmitted ? successContent : returnForm}
    </Modal>
  );
};

export default PharmacyReturnModal;
