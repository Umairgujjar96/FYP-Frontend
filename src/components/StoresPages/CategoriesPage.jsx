import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Switch,
  message,
  Popconfirm,
  Typography,
  Spin,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
// import { useCategoryStore } from "../stores/categoryStore"; // Adjust import path to match your project
// import { useAuthStore } from "../stores/authStore"; // Adjust import path to match your project
import { useProductStore } from "../../Store/productStore";
import { useAuthStore } from "../../Store/stores";

const { Title } = Typography;
const { TextArea } = Input;

const CategoryManagement = () => {
  // Get state and actions from stores
  const { categories, isLoading, error, fetchCategories, createCategory } =
    useProductStore();

  const { token, currentStore } = useAuthStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingCategory, setEditingCategory] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);

  const BaseUrl = "http://localhost:5000"; // Adjust to match your BaseUrl

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories().catch((err) => {
      console.error("Failed to fetch categories:", err);
    });
  }, [fetchCategories]);

  // Show error message if fetch fails
  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  // Add new category
  const handleAddCategory = () => {
    setEditingCategory(null);
    form.resetFields();
    form.setFieldsValue({
      isActive: true,
    });
    setModalVisible(true);
  };

  // Edit category
  const handleEditCategory = (category) => {
    setEditingCategory(category);
    form.setFieldsValue({
      name: category.name,
      description: category.description || "",
      isActive: category.isActive,
    });
    setModalVisible(true);
  };

  // Submit form
  const handleSubmit = async (values) => {
    setSubmitLoading(true);
    try {
      if (editingCategory) {
        // Update existing category
        await updateCategoryFn(editingCategory._id, values);
        message.success("Category updated successfully");
      } else {
        // Create new category
        await createCategory(values);
        message.success("Category added successfully");
      }
      setModalVisible(false);
    } catch (error) {
      console.error("Error saving category:", error);
      message.error(error.message || "Failed to save category");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Update category function
  const updateCategoryFn = async (categoryId, categoryData) => {
    try {
      const response = await fetch(
        `${BaseUrl}/api/category/categories/${categoryId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(categoryData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update category");
      }

      // Update local state
      const updatedCategories = categories.map((cat) =>
        cat._id === categoryId ? { ...cat, ...categoryData } : cat
      );

      useProductStore.setState({ categories: updatedCategories });

      return data;
    } catch (error) {
      throw error;
    }
  };

  // Delete category
  const handleDeleteCategory = async (categoryId) => {
    setDeleteLoading(categoryId);
    try {
      await deleteCategoryFn(categoryId);
      message.success("Category deleted successfully");
    } catch (error) {
      console.error("Error deleting category:", error);
      message.error(error.message || "Failed to delete category");
    } finally {
      setDeleteLoading(null);
    }
  };

  // Delete category function
  const deleteCategoryFn = async (categoryId) => {
    try {
      const response = await fetch(
        `${BaseUrl}/api/category/categories/${categoryId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete category");
      }

      // Update local state
      const updatedCategories = categories.filter(
        (cat) => cat._id !== categoryId
      );
      useProductStore.setState({ categories: updatedCategories });
    } catch (error) {
      throw error;
    }
  };

  // Refresh categories
  const handleRefresh = () => {
    fetchCategories().catch((err) => {
      console.error("Failed to refresh categories:", err);
    });
  };

  // Table columns
  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (text) => text || "No description",
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "status",
      render: (isActive) => (
        <span
          className={`px-2 py-1 rounded text-xs ${
            isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            className="bg-blue-500"
            onClick={() => handleEditCategory(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure to delete this category?"
            onConfirm={() => handleDeleteCategory(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
              loading={deleteLoading === record._id}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-10 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <Title level={3}>Categories</Title>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={isLoading}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddCategory}
            className="bg-blue-500"
          >
            Add Category
          </Button>
        </Space>
      </div>

      {isLoading && categories.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={categories.map((cat) => ({ ...cat, key: cat._id }))}
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          bordered
          className="w-full"
          locale={{
            emptyText: error
              ? "Failed to load categories"
              : 'No categories found. Click "Add Category" to create one.',
          }}
        />
      )}

      {/* Add/Edit Category Modal */}
      <Modal
        title={editingCategory ? "Edit Category" : "Add New Category"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ isActive: true }}
        >
          <Form.Item
            name="name"
            label="Category Name"
            rules={[{ required: true, message: "Please enter category name" }]}
          >
            <Input placeholder="Enter category name" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea
              rows={4}
              placeholder="Enter category description (optional)"
            />
          </Form.Item>

          <Form.Item name="isActive" label="Status" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>

          <Form.Item className="mb-0 flex justify-end">
            <Space>
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                className="bg-blue-500"
                loading={submitLoading}
              >
                {editingCategory ? "Update" : "Create"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CategoryManagement;
