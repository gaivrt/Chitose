# 快速解决指南

## 问题 1: 模型文件 404 错误

### 原因

项目中**没有包含** Live2D 模型文件。因为：
1. 模型文件体积很大（几十 MB）
2. 可能涉及版权问题
3. 每个人可能想用不同的模型

### 解决方法

#### 步骤 1: 获取 Live2D 模型

**免费样例模型（推荐新手）**：

1. 访问 Live2D 官网：https://www.live2d.com/en/download/sample-data/
2. 下载任意一个样例模型，例如：
   - **Hiyori**（女生，推荐）
   - **Haru**（男生）
   - **Mark**（男生）
3. 下载后会得到一个压缩包（.zip 或 .7z）

#### 步骤 2: 放置模型文件

1. 在项目根目录创建 `models` 文件夹：
   ```bash
   cd ~/programs/python/Chitose
   mkdir -p models
   ```

2. 解压下载的模型到 `models` 目录：
   ```bash
   # 假设你下载了 Hiyori
   cd models
   # 解压你下载的文件
   unzip ~/Downloads/Hiyori.zip
   # 或
   7z x ~/Downloads/Hiyori.7z
   ```

3. 确认目录结构：
   ```
   Chitose/
   ├── models/
   │   └── Hiyori/              ← 模型文件夹
   │       ├── Hiyori.model3.json  ← 模型描述文件
   │       ├── Hiyori.moc3         ← 模型数据
   │       ├── *.physics3.json     ← 物理效果
   │       └── textures/           ← 贴图文件夹
   └── web/
       └── ...
   ```

#### 步骤 3: 修改模型路径

打开 `web/app.js`，找到第 12 行：

```javascript
modelPath: '../models/芊芊/芊芊.model3.json',
```

修改为你的模型路径：

```javascript
modelPath: '../models/Hiyori/Hiyori.model3.json',
```

或者，**不修改代码**，直接在 URL 中指定：

```
http://localhost:8080?model=../models/Hiyori/Hiyori.model3.json
```

#### 步骤 4: 刷新网页

重新加载网页，应该就能看到模型了！

---

## 问题 2: 不知道 Token 是什么

### Token 是什么？

LiveKit Token 是一个临时的"通行证"，用来连接 LiveKit 房间。就像你去参加一个活动需要门票一样。

**重要**: Token 有时效性，通常几小时后会过期，需要重新生成。

### 如何获取 Token？

#### 方法 1: 使用 LiveKit Playground（最简单）

1. **启动 Agent**：
   ```bash
   cd ~/programs/python/Chitose
   conda activate Chitose_env
   python main.py dev
   ```

2. **访问 Playground**：
   - 打开浏览器，访问：https://agents-playground.livekit.io
   - 填写你的 LiveKit URL（.env 文件中的 `LIVEKIT_URL`）
   - 点击 Connect

3. **获取 Token**：
   - 连接成功后，浏览器地址栏会变成：
     ```
     https://agents-playground.livekit.io/?...&token=eyJhbGc...很长的字符串...
     ```
   - 复制 `token=` 后面的整个字符串

4. **在网页中使用**：
   ```
   http://localhost:8080?token=eyJhbGc...你复制的token...
   ```

#### 方法 2: 使用 LiveKit CLI（需要安装 CLI）

如果你安装了 `livekit-cli`：

```bash
livekit-cli token create \
  --api-key <你的LIVEKIT_API_KEY> \
  --api-secret <你的LIVEKIT_API_SECRET> \
  --room-name test-room \
  --identity web-client
```

这会输出一个 token，复制它。

**提示**: `LIVEKIT_API_KEY` 和 `LIVEKIT_API_SECRET` 在你的 `.env` 文件中。

#### 方法 3: 暂时不用 LiveKit（仅测试）

如果你只想先看看 Live2D 效果，暂时不需要语音和口型同步：

1. 正常打开网页：
   ```
   http://localhost:8080
   ```

2. 按 F12 打开控制台，运行：
   ```javascript
   window.testLipSync()
   ```

这会让模型的嘴巴自动张合，用于测试。

---

## 完整的启动流程

### 第一次使用（需要配置模型）：

```bash
# 1. 下载并放置 Live2D 模型（见上文）

# 2. 修改 web/app.js 中的模型路径（或使用 URL 参数）

# 3. 启动网页服务器
cd ~/programs/python/Chitose/web
python -m http.server 8080

# 4. 打开浏览器
# 仅查看模型:
http://localhost:8080?model=../models/Hiyori/Hiyori.model3.json

# 或带口型同步（需要先启动 Agent）:
http://localhost:8080?model=../models/Hiyori/Hiyori.model3.json&token=YOUR_TOKEN
```

### 日常使用（已配置好模型）：

```bash
# 终端 1: 启动 Agent
cd ~/programs/python/Chitose
conda activate Chitose_env
python main.py dev

# 终端 2: 启动网页
cd ~/programs/python/Chitose/web
python -m http.server 8080

# 浏览器: 打开网页
http://localhost:8080?token=YOUR_TOKEN
```

---

## 常见问题

### Q: 模型加载失败怎么办？

打开浏览器控制台（F12），查看错误信息：

- **404 错误**: 模型文件路径不对，检查路径是否正确
- **CORS 错误**: 需要通过 HTTP 服务器访问，不能直接打开 HTML 文件
- **格式错误**: 确保是 Live2D Cubism 4 模型（.model3.json）

### Q: Token 过期了怎么办？

Token 有时效性（通常几小时），过期后重新生成一个即可。

### Q: 能不能永久保存 Token？

不建议。Token 应该是临时的，每次使用时重新生成更安全。

### Q: 没有 Live2D 模型怎么办？

必须要有模型才能显示。可以：
1. 使用官方免费样例
2. 购买商用模型（https://nizima.com/）
3. 学习 Live2D Cubism Editor 自己制作

---

## 需要帮助？

- 查看完整文档: `web/README.md`
- 详细使用指南: `docs/LIP_SYNC_GUIDE.md`
- 开发日志: `docs/DEV_LOG.md`
