# Live2D 网页

## 快速开始

### 1. 下载 Cubism Core SDK

从 Live2D 官网下载 [Cubism SDK for Web](https://www.live2d.com/en/download/cubism-sdk/download-web/)

解压后找到 `Core/live2dcubismcore.min.js`，复制到 `web/lib/` 目录。

### 2. 启动本地服务器

由于浏览器安全限制，需要通过 HTTP 服务器访问：

```bash
# 方式1: Python
cd web
python -m http.server 8080

# 方式2: Node.js
npx serve web -p 8080
```

### 3. 打开浏览器

访问 http://localhost:8080

## 口型同步 API

```javascript
// 设置嘴巴张开程度 (0~1)
window.setMouthOpenY(0.5);
```

## 文件结构

```
web/
├── index.html      # 入口页面
├── app.js          # 主程序
└── lib/
    └── live2dcubismcore.min.js  # Cubism Core (需要手动下载)
```
