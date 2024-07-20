import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

if (process.env.NODE_ENV !== "production") {
  const app = express();

  app.use("/api", createProxyMiddleware({ target: "http://localhost:3001", changeOrigin: true }));
  app.use("/", createProxyMiddleware({ target: "http://localhost:3000", changeOrigin: true }));

  app.listen(8000, () => {
    console.log("Reverse proxy server running at http://localhost:8000");
  });
}
