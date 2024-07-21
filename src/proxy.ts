import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

if (process.env.ENV !== "production") {
  const app = express();

  app.use("/api", createProxyMiddleware({ target: "http://localhost:3001", changeOrigin: true }));
  app.use(
    "/",
    createProxyMiddleware({
      target: "http://localhost:3002/",
      changeOrigin: true,
    })
  );

  app.listen(8000, () => {
    console.log("Reverse proxy server running at http://localhost:8000");
  });
}
