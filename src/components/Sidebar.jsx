import React, { useState, useEffect, useMemo } from "react";
import {
  Layout,
  Menu,
  Typography,
  Avatar,
  Divider,
  Button,
  Tooltip,
  Badge,
  theme,
} from "antd";
import { Link, useLocation } from "react-router-dom";
import {
  DashboardOutlined,
  ShopOutlined,
  AppstoreOutlined,
  TeamOutlined,
  UserOutlined,
  BarcodeOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  BarChartOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "../Store/stores.js";

const { Sider } = Layout;
const { Title, Text } = Typography;

const Sidebar = () => {
  const location = useLocation();
  const { user, logout, currentStore } = useAuthStore();
  // Set collapsed to true by default
  const [collapsed, setCollapsed] = useState(true);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [openKeys, setOpenKeys] = useState([]);
  const { token } = theme.useToken();

  // Define menu items with memoization to prevent unnecessary re-renders
  const menuItems = useMemo(
    () =>
      [
        {
          key: "dashboard",
          icon: <DashboardOutlined />,
          label: "Dashboard",
          path: "/dashboard",
        },
        {
          key: "stores",
          icon: <ShopOutlined />,
          label: "My Store",
          path: "/stores",
        },
        currentStore && {
          key: "store",
          icon: <AppstoreOutlined />,
          label: "Store Management",
          children: [
            {
              key: "store-dashboard",
              icon: <BarChartOutlined />,
              label: "Dashboard",
              path: "/dashboard",
            },
            {
              key: "products",
              icon: <TagOutlined />,
              label: "Products",
              path: "/store/products",
            },
            {
              key: "inventory",
              icon: <BarcodeOutlined />,
              label: "Inventory",
              path: "/store/inventory",
            },
            {
              key: "sales",
              icon: <DollarOutlined />,
              label: "Sales",
              path: "/store/sales",
            },
            {
              key: "customers",
              icon: <TeamOutlined />,
              label: "Customers",
              path: "/store/customers",
            },
            {
              key: "categories",
              icon: <AppstoreOutlined />,
              label: "Categories",
              path: "/store/categories",
            },
            {
              key: "suppliers",
              icon: <TeamOutlined />,
              label: "Suppliers",
              path: "/store/suppliers",
            },
          ],
        },
        currentStore && {
          key: "pos",
          icon: <ShoppingCartOutlined />,
          label: "Point of Sale",
          path: "/store/pos",
        },
        {
          key: "account",
          icon: <UserOutlined />,
          label: "Account",
          children: [
            {
              key: "profile",
              icon: <UserOutlined />,
              label: "Profile",
              path: "/profile",
            },
            {
              key: "subscription",
              icon: <DollarOutlined />,
              label: "Subscription",
              path: "/subscription",
            },
          ],
        },
      ].filter(Boolean),
    [currentStore]
  ); // Only re-create when currentStore changes

  // Update selected keys when location changes
  useEffect(() => {
    const pathname = location.pathname;

    // Find parent key if we're on a child path
    const parentKey = menuItems.find((item) =>
      item.children?.some((child) => pathname === child.path)
    )?.key;

    // Find the matching key for current path
    let currentSelectedKeys = [];

    for (const item of menuItems) {
      if (item.children) {
        const matchingChild = item.children.find(
          (child) => pathname === child.path
        );
        if (matchingChild) {
          currentSelectedKeys = [matchingChild.key];
          if (parentKey && !collapsed) {
            setOpenKeys([parentKey]);
          }
          break;
        }
      } else if (pathname === item.path) {
        currentSelectedKeys = [item.key];
        break;
      }
    }

    setSelectedKeys(currentSelectedKeys);
  }, [location, menuItems, collapsed]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => !prev);
    if (!collapsed) {
      setOpenKeys([]);
    }
  };

  // Recursive menu renderer optimized
  const renderMenu = (items) => {
    return items.map((item) => {
      if (item.children) {
        return (
          <Menu.SubMenu key={item.key} icon={item.icon} title={item.label}>
            {renderMenu(item.children)}
          </Menu.SubMenu>
        );
      }
      return (
        <Menu.Item key={item.key} icon={item.icon}>
          <Link to={item.path}>{item.label}</Link>
        </Menu.Item>
      );
    });
  };

  return (
    <Sider
      width={240}
      collapsible
      collapsed={collapsed}
      trigger={null}
      breakpoint="lg"
      className="fixed h-screen left-0 top-16 bg-white shadow-md z-10"
      style={{
        height: "calc(100vh - 64px)", // Adjust to match your header height
        overflow: "hidden",
        transition: "all 0.2s",
      }}
    >
      <div
        className="sidebar-content"
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflowX: "hidden",
          overflowY: "auto",
          scrollbarWidth: "thin",
          msOverflowStyle: "none",
          "&::-webkit-scrollbar": {
            width: "4px",
          },
          "&::-webkit-scrollbar-track": {
            background: token.colorBgContainer,
          },
          "&::-webkit-scrollbar-thumb": {
            background: token.colorBorderSecondary,
            borderRadius: "4px",
          },
        }}
      >
        {/* User Profile Section */}
        <div className="px-4 text-center py-4">
          {!collapsed ? (
            <>
              <Avatar
                size={64}
                icon={<UserOutlined />}
                src={user?.avatar}
                className="border-2 border-blue-500 shadow-sm"
              />
              <Title level={5} className="mt-2 mb-0 truncate">
                {user?.name || "User"}
              </Title>
              <Text type="secondary" className="text-xs block truncate">
                {user?.email || "user@example.com"}
              </Text>
            </>
          ) : (
            <Tooltip title={user?.name || "User"} placement="right">
              <Avatar
                size={36}
                icon={<UserOutlined />}
                src={user?.avatar}
                className="border border-blue-400"
              />
            </Tooltip>
          )}
        </div>

        {/* Current Store Section */}
        {currentStore && (
          <div className="mx-4 mb-2 text-center">
            {!collapsed ? (
              <Badge.Ribbon text="Active Store" color="#52c41a">
                <div className="bg-gray-50 p-2 rounded-md border border-gray-100">
                  <Title level={5} className="m-0 truncate">
                    {currentStore.name}
                  </Title>
                </div>
              </Badge.Ribbon>
            ) : (
              <Tooltip title={currentStore.name} placement="right">
                <Badge dot color="#52c41a">
                  <ShopOutlined className="text-lg text-gray-600" />
                </Badge>
              </Tooltip>
            )}
          </div>
        )}

        <Divider className="my-2" />

        {/* Navigation Menu */}
        <div
          className="flex-grow overflow-y-auto"
          style={{ scrollbarWidth: "thin" }}
        >
          <Menu
            mode="inline"
            selectedKeys={selectedKeys}
            openKeys={openKeys}
            onOpenChange={setOpenKeys}
            className="border-0"
            inlineIndent={16}
          >
            {renderMenu(menuItems)}
          </Menu>
        </div>

        <Divider className="my-2 mb-0" />

        {/* Footer with Logout - Fixed at bottom */}
        <div className="px-4 py-3 bg-white">
          {!collapsed ? (
            <Button
              type="primary"
              icon={<LogoutOutlined />}
              onClick={logout}
              danger
              block
              className="mb-2"
            >
              Logout
            </Button>
          ) : (
            <Tooltip title="Logout" placement="right">
              <Button
                type="text"
                icon={<LogoutOutlined />}
                onClick={logout}
                danger
                className="mb-2 mx-auto block"
              />
            </Tooltip>
          )}

          <Button
            type="text"
            onClick={toggleCollapsed}
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            className="text-gray-500 hover:text-blue-500 mx-auto block"
          />
        </div>
      </div>
    </Sider>
  );
};

export default Sidebar;
