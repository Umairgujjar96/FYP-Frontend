import React from "react";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

const LoadingSpinner = ({
  size = "large",
  tip = "Loading...",
  fullScreen = false,
}) => {
  const antIcon = (
    <LoadingOutlined style={{ fontSize: size === "large" ? 40 : 24 }} spin />
  );

  const spinnerStyles = fullScreen
    ? {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        zIndex: 1000,
      }
    : {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px 0",
        width: "100%",
      };

  return (
    <div style={spinnerStyles}>
      <Spin indicator={antIcon} size={size} tip={tip} />
    </div>
  );
};

export default LoadingSpinner;
