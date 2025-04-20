import React, { useState, useEffect } from "react";
import {
  Table,
  Input,
  Button,
  Card,
  Tag,
  Space,
  Select,
  Tooltip,
  Badge,
  Typography,
  notification,
  Image,
  Empty,
  Modal,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  ExclamationCircleOutlined,
  MedicineBoxOutlined,
  FileImageOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useProductStore } from "../../Store/productStore";
import { useAuthStore } from "../../Store/stores";
import { useSupplierStore } from "../../Store/useSupplierStore";

const { Title, Text } = Typography;
const { Option } = Select;

const ProductsPage = () => {
  const navigate = useNavigate();
  const {
    products,
    categories,
    isLoading,
    error,
    fetchProducts,
    fetchCategories,
    deleteProduct,
  } = useProductStore();
  const { suppliers, fetchSuppliers } = useSupplierStore();
  const { currentStore } = useAuthStore();

  // Local state for filters
  const [searchText, setSearchText] = useState("");
  const [filterCategory, setFilterCategory] = useState(null);
  const [filterPrescription, setFilterPrescription] = useState(null);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchProducts();
        await fetchCategories();
        await fetchSuppliers();
      } catch (err) {
        notification.error({
          message: "Failed to load data",
          description: err.message,
        });
      }
    };

    if (currentStore?.id) {
      loadData();
    }
  }, [fetchProducts, fetchCategories, fetchSuppliers, currentStore]);

  // Apply filters whenever filters or products change
  useEffect(() => {
    if (!products || !products.length) {
      setFilteredProducts([]);
      return;
    }

    let filtered = [...products];

    // Apply search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          (product.name && product.name.toLowerCase().includes(searchLower)) ||
          (product.genericName &&
            product.genericName.toLowerCase().includes(searchLower)) ||
          (product.description &&
            product.description.toLowerCase().includes(searchLower))
      );
    }

    // Apply category filter
    if (filterCategory) {
      filtered = filtered.filter(
        (product) =>
          product.category === filterCategory ||
          (product.categoryInfo && product.categoryInfo._id === filterCategory)
      );
    }

    // Apply prescription filter
    if (filterPrescription !== null) {
      const requiresPrescription = filterPrescription === "true";
      filtered = filtered.filter(
        (product) => product.requiresPrescription === requiresPrescription
      );
    }

    setFilteredProducts(filtered);
  }, [products, searchText, filterCategory, filterPrescription]);

  // Handle delete confirmation
  const showDeleteConfirm = (product) => {
    setProductToDelete(product);
    setDeleteModalVisible(true);
  };

  // Handle delete product
  const handleDelete = async () => {
    try {
      if (!productToDelete) return;

      await deleteProduct(productToDelete._id);

      notification.success({
        message: "Product deleted successfully",
        description: `${productToDelete.name} has been removed from inventory.`,
      });

      // Refresh products after deletion
      await fetchProducts();
      setDeleteModalVisible(false);
      setProductToDelete(null);
    } catch (error) {
      notification.error({
        message: "Failed to delete product",
        description: error?.message || "Unknown error occurred",
      });
    }
  };

  // Handle edit product
  const handleEdit = (id) => {
    navigate(`/add-product?productId=${id}`);
  };

  // Handle add new product
  const handleAddProduct = () => {
    navigate("/add-product");
  };

  // Reset filters
  const resetFilters = () => {
    setSearchText("");
    setFilterCategory(null);
    setFilterPrescription(null);
  };

  // Table columns
  const columns = [
    {
      title: "Product",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Space>
          {record.image ? (
            <Image
              src={record.image}
              alt={text}
              width={40}
              height={40}
              className="object-cover rounded"
              fallback="data:image/png;base64,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"
            />
          ) : (
            <div className="w-10 h-10 flex items-center justify-center bg-gray-200 rounded">
              <FileImageOutlined />
            </div>
          )}
          <div>
            <Text strong>{text || "No Name"}</Text>
            {record.genericName && (
              <div>
                <Text type="secondary" className="text-xs">
                  {record.genericName}
                </Text>
              </div>
            )}
          </div>
        </Space>
      ),
      ellipsis: true,
    },
    {
      title: "Dosage",
      key: "dosage",
      render: (_, record) => (
        <Space direction="vertical" size="small">
          {record.dosageForm && <Tag color="blue">{record.dosageForm}</Tag>}
          {record.strength && (
            <Text className="text-xs">{record.strength}</Text>
          )}
        </Space>
      ),
      responsive: ["md"],
    },
    {
      title: "Manufacturer",
      dataIndex: "manufacturer",
      key: "manufacturer",
      responsive: ["lg"],
    },
    {
      title: "Stock",
      key: "stock",
      render: (_, record) => {
        const totalStock = record.totalStock || 0;
        const minStockLevel = record.minStockLevel || 10;
        const isLowStock = record.isLowStock || totalStock < minStockLevel;

        return (
          <Tooltip
            title={
              isLowStock ? `Low stock! Minimum required: ${minStockLevel}` : ""
            }
          >
            <Badge
              status={
                isLowStock ? "error" : totalStock > 0 ? "success" : "warning"
              }
              text={totalStock}
            />
          </Tooltip>
        );
      },
      sorter: (a, b) => (a.totalStock || 0) - (b.totalStock || 0),
    },
    {
      title: "Price",
      key: "price",
      render: (_, record) => {
        const lowestPrice = record.lowestPrice || 0;
        const highestPrice = record.highestPrice || 0;

        if (lowestPrice === highestPrice) {
          return <Text>Rs. {lowestPrice.toFixed(2)}</Text>;
        }
        return (
          <Text>
            ${lowestPrice.toFixed(2)} - ${highestPrice.toFixed(2)}
          </Text>
        );
      },
      sorter: (a, b) => (a.lowestPrice || 0) - (b.lowestPrice || 0),
      responsive: ["md"],
    },
    {
      title: "Expiry",
      key: "expiry",
      render: (_, record) => {
        if (!record.nearestExpiryDate) return <Text>-</Text>;

        try {
          const expiryDate = new Date(record.nearestExpiryDate);
          if (isNaN(expiryDate.getTime())) return <Text>Invalid date</Text>;

          const today = new Date();
          const daysDiff = Math.floor(
            (expiryDate - today) / (1000 * 60 * 60 * 24)
          );

          let color = "green";
          if (daysDiff < 30) color = "red";
          else if (daysDiff < 90) color = "orange";

          return <Tag color={color}>{expiryDate.toLocaleDateString()}</Tag>;
        } catch (error) {
          return <Text>Invalid date</Text>;
        }
      },
      responsive: ["lg"],
    },
    {
      title: "Rx",
      dataIndex: "requiresPrescription",
      key: "requiresPrescription",
      render: (requiresPrescription) =>
        requiresPrescription ? (
          <Tag color="blue" icon={<MedicineBoxOutlined />}>
            Required
          </Tag>
        ) : (
          <Tag color="green">No</Tag>
        ),
      responsive: ["md"],
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit product">
            <Button
              type="primary"
              shape="circle"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record._id)}
              className="bg-blue-500"
            />
          </Tooltip>
          <Tooltip title="Delete product">
            <Button
              danger
              shape="circle"
              icon={<DeleteOutlined />}
              onClick={() => showDeleteConfirm(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Get categories from the store's state
  const categoryOptions =
    categories?.map((category) => (
      <Option key={category._id} value={category._id}>
        {category.name}
      </Option>
    )) || [];

  // Loading or error state
  if (error) {
    return (
      <div className="p-4">
        <Card>
          <Empty
            description={
              <span>
                Error loading products: {error}
                <br />
                <Button
                  onClick={() => fetchProducts()}
                  type="primary"
                  className="mt-4"
                >
                  Retry
                </Button>
              </span>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <Card bordered={false} className="shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <Title level={3} className="m-0">
              Pharmacy Inventory
            </Title>
            <Text type="secondary">
              {filteredProducts.length || products?.length || 0} products in{" "}
              {currentStore?.name || "your store"}
            </Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddProduct}
            className="mt-4 sm:mt-0 bg-blue-500"
          >
            Add Product
          </Button>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search products"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />

            <Select
              placeholder="Filter by category"
              allowClear
              onChange={(value) => setFilterCategory(value)}
              className="w-full"
            >
              {categoryOptions.length > 0 ? (
                categoryOptions
              ) : (
                <>
                  <Option value="pain-relief">Pain Relief</Option>
                  <Option value="antibiotics">Antibiotics</Option>
                  <Option value="cough-cold">Cough & Cold</Option>
                </>
              )}
            </Select>

            <Select
              placeholder="Prescription required"
              allowClear
              value={filterPrescription}
              onChange={setFilterPrescription}
              className="w-full"
            >
              <Option value="true">Prescription Required</Option>
              <Option value="false">No Prescription</Option>
            </Select>
          </div>

          <div className="mt-4 flex justify-end">
            <Button icon={<FilterOutlined />} onClick={resetFilters}>
              Reset Filters
            </Button>
          </div>
        </div>

        <Table
          dataSource={
            filteredProducts.length > 0 ? filteredProducts : products || []
          }
          columns={columns}
          rowKey={(record) =>
            record._id || Math.random().toString(36).substr(2, 9)
          }
          loading={isLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} products`,
          }}
          scroll={{ x: true }}
          locale={{
            emptyText: !isLoading && (
              <Empty
                description="No products found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
        />
      </Card>

      {/* Delete confirmation modal */}
      <Modal
        title="Delete Product"
        open={deleteModalVisible}
        onOk={handleDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setProductToDelete(null);
        }}
        okText="Delete"
        okButtonProps={{ danger: true }}
        cancelText="Cancel"
      >
        <div className="py-4">
          <ExclamationCircleOutlined className="text-red-500 text-xl mr-2" />
          <Text>
            Are you sure you want to delete{" "}
            <Text strong>{productToDelete?.name}</Text>? This action cannot be
            undone.
          </Text>
        </div>
      </Modal>
    </div>
  );
};

export default ProductsPage;
