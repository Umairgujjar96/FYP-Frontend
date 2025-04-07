import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Layout,
  Menu,
  Dropdown,
  Button,
  Avatar,
  Badge,
  Typography,
  Space,
} from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  ShopOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "../Store/stores.js";

const { Header } = Layout;
const { Text } = Typography;

const AppHeader = () => {
  const { user, logout, currentStore } = useAuthStore();
  //   const { currentStore, stores } = useStoreStore();
  const navigate = useNavigate();
  const [notifications] = useState([]); // You can implement real notifications later

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  //   const handleStoreChange = (storeId) => {
  //     useStoreStore.getState().setCurrentStore(storeId);
  //     navigate("/store/dashboard");
  //   };

  const userMenu = (
    <Menu className="absolute">
      <Menu.Item key="profile" icon={<UserOutlined />}>
        <Link to="/profile">My Profile</Link>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        Logout
      </Menu.Item>
    </Menu>
  );

  const notificationMenu = (
    <Menu>
      {notifications.length > 0 ? (
        notifications.map((notification, index) => (
          <Menu.Item key={index}>{notification.message}</Menu.Item>
        ))
      ) : (
        <Menu.Item>No new notifications</Menu.Item>
      )}
    </Menu>
  );

  //   const storeMenu = (
  //     <Menu>
  //       {stores &&
  //         stores?.map((store) => (
  //           <Menu.Item
  //             key={store._id}
  //             onClick={() => handleStoreChange(store._id)}
  //           >
  //             {store.name}
  //           </Menu.Item>
  //         ))}
  //       <Menu.Divider />
  //       <Menu.Item key="all-stores">
  //         <Link to="/stores">Manage Stores</Link>
  //       </Menu.Item>
  //     </Menu>
  //   );

  return (
    <Header
      style={{
        background: "#fff",
        padding: "0 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
      }}
    >
      <div className="logo" style={{ marginRight: 24 }}>
        <Link to="/dashboard">
          <h2 style={{ margin: 0, color: "#1890ff" }}>
            {currentStore.name.toUpperCase()}
          </h2>
        </Link>
      </div>

      {/* <div style={{ flex: 1 }}>
        {currentStore && (
          <Dropdown overlay={storeMenu} trigger={["click"]}>
            <Button>
              <Space>
                <ShopOutlined />
                {currentStore.name}
                <DownOutlined />
              </Space>
            </Button>
          </Dropdown>
        )}
      </div> */}

      <Space size="large">
        <Dropdown overlay={notificationMenu} trigger={["click"]}>
          <Badge count={notifications.length} overflowCount={9}>
            <Button
              type="text"
              icon={<BellOutlined style={{ fontSize: "18px" }} />}
            />
          </Badge>
        </Dropdown>

        <Dropdown className="relative" overlay={userMenu} trigger={["click"]}>
          <Space className="user-dropdown">
            <Avatar icon={<UserOutlined />} src={user?.profileImage} />
            <Text strong>{user?.name || "User"}</Text>
            <DownOutlined />
          </Space>
        </Dropdown>
      </Space>
    </Header>
  );
};

export default AppHeader;
