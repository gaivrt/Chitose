"""
Chitose Web Server
提供 LiveKit Token 生成和静态文件服务
"""

import os
import secrets
from pathlib import Path
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json

from livekit import api
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 配置
LIVEKIT_URL = os.getenv("LIVEKIT_URL", "")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY", "")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET", "")
PORT = int(os.getenv("WEB_SERVER_PORT", "8080"))

# Web 文件目录
WEB_DIR = Path(__file__).parent / "web"
# 项目根目录 (用于访问 models 等资源)
ROOT_DIR = Path(__file__).parent


class ChitoseRequestHandler(SimpleHTTPRequestHandler):
    """自定义请求处理器，支持 token 生成"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB_DIR), **kwargs)
    
    def do_GET(self):
        """处理 GET 请求"""
        parsed_path = urlparse(self.path)
        
        # Token 生成 API
        if parsed_path.path == "/api/token":
            self.handle_token_request(parsed_path)
        # 处理 models 目录的请求
        elif parsed_path.path.startswith("/models/"):
            self.serve_model_file(parsed_path)
        else:
            # 静态文件服务
            super().do_GET()
    
    def serve_model_file(self, parsed_path):
        """服务 models 目录下的文件"""
        try:
            # 移除 /models/ 前缀并构建完整路径
            relative_path = parsed_path.path[1:]  # 移除开头的 /
            file_path = ROOT_DIR / relative_path
            
            # 安全检查：确保路径在 models 目录内
            if not str(file_path.resolve()).startswith(str((ROOT_DIR / "models").resolve())):
                self.send_error(403, "Forbidden")
                return
            
            if not file_path.exists():
                self.send_error(404, "File not found")
                return
            
            # 根据文件扩展名确定 Content-Type
            content_type = "application/octet-stream"
            if file_path.suffix == ".json":
                content_type = "application/json"
            elif file_path.suffix == ".png":
                content_type = "image/png"
            # .moc3 文件使用默认的 octet-stream
            
            # 读取并发送文件
            with open(file_path, "rb") as f:
                content = f.read()
            
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", len(content))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(content)
            
        except Exception as e:
            print(f"❌ Error serving model file {parsed_path.path}: {e}")
            self.send_error(500, "Internal server error")
    
    def handle_token_request(self, parsed_path):
        """生成 LiveKit 访问 token"""
        try:
            # 解析查询参数
            params = parse_qs(parsed_path.query)
            room_name = params.get("room", ["test-room"])[0]
            participant_name = params.get("name", [f"user-{secrets.token_hex(8)}"])[0]
            
            # 生成 token
            token = api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
            token.with_identity(participant_name)
            token.with_name(participant_name)
            token.with_grants(api.VideoGrants(
                room_join=True,
                room=room_name,
                can_publish=True,
                can_subscribe=True,
            ))
            
            jwt_token = token.to_jwt()
            
            # 返回 JSON 响应
            response = {
                "token": jwt_token,
                "url": LIVEKIT_URL,
                "room": room_name,
                "identity": participant_name,
            }
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")  # CORS
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
            
            print(f"✅ Generated token for {participant_name} in room {room_name}")
            
        except Exception as e:
            print(f"❌ Token generation failed: {e}")
            self.send_error(500, f"Token generation failed: {e}")
    
    def log_message(self, format, *args):
        """自定义日志格式"""
        print(f"[{self.log_date_time_string()}] {format % args}")


def main():
    """启动服务器"""
    # 检查必要的环境变量
    if not LIVEKIT_URL or not LIVEKIT_API_KEY or not LIVEKIT_API_SECRET:
        print("❌ Error: Missing LiveKit credentials!")
        print("Please set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET in .env")
        return
    
    # 启动服务器
    server_address = ("", PORT)
    httpd = HTTPServer(server_address, ChitoseRequestHandler)
    
    print("=" * 50)
    print("🌸 Chitose Web Server Started")
    print("=" * 50)
    print(f"📍 URL: http://localhost:{PORT}")
    print(f"🔗 LiveKit: {LIVEKIT_URL}")
    print(f"📁 Web Root: {WEB_DIR}")
    print("=" * 50)
    print("🔑 API Endpoints:")
    print(f"  - GET /api/token?room=<room>&name=<name>")
    print("=" * 50)
    print("\nPress Ctrl+C to stop\n")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n👋 Server stopped")


if __name__ == "__main__":
    main()
