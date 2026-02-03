#!/usr/bin/env python
"""
Chitose 系统检查脚本
验证所有依赖和配置是否正确
"""

import os
import sys
from pathlib import Path

def check_package(package_name, import_name=None):
    """检查 Python 包是否已安装"""
    if import_name is None:
        import_name = package_name
    
    try:
        __import__(import_name)
        print(f"  ✅ {package_name}")
        return True
    except ImportError:
        print(f"  ❌ {package_name} - 未安装")
        return False

def check_env_var(var_name, required=True):
    """检查环境变量是否设置"""
    value = os.getenv(var_name)
    if value:
        # 隐藏敏感信息
        if "KEY" in var_name or "SECRET" in var_name:
            display_value = value[:8] + "..." if len(value) > 8 else "***"
        else:
            display_value = value
        print(f"  ✅ {var_name} = {display_value}")
        return True
    else:
        status = "❌" if required else "⚠️ "
        print(f"  {status} {var_name} - 未设置")
        return not required

def check_file(file_path, description):
    """检查文件是否存在"""
    if Path(file_path).exists():
        print(f"  ✅ {description}")
        return True
    else:
        print(f"  ❌ {description} - 不存在")
        return False

def main():
    """主检查流程"""
    print("=" * 60)
    print("🔍 Chitose 系统检查")
    print("=" * 60)
    
    all_ok = True
    
    # 1. Python 版本
    print("\n📌 Python 版本:")
    py_version = sys.version_info
    if py_version >= (3, 10):
        print(f"  ✅ Python {py_version.major}.{py_version.minor}.{py_version.micro}")
    else:
        print(f"  ❌ Python {py_version.major}.{py_version.minor}.{py_version.micro} (需要 >= 3.10)")
        all_ok = False
    
    # 2. 核心依赖
    print("\n📌 Python 依赖:")
    packages = [
        ("livekit", "livekit.api"),
        ("livekit-agents", "livekit.agents"),
        ("livekit-plugins-openai", "livekit.plugins.openai"),
        ("livekit-plugins-elevenlabs", "livekit.plugins.elevenlabs"),
        ("livekit-plugins-silero", "livekit.plugins.silero"),
        ("livekit-plugins-deepgram", "livekit.plugins.deepgram"),
        ("pyyaml", "yaml"),
        ("python-dotenv", "dotenv"),
    ]
    
    for pkg_name, import_name in packages:
        if not check_package(pkg_name, import_name):
            all_ok = False
    
    # 3. 环境变量
    print("\n📌 环境变量 (.env):")
    
    # 加载 .env
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except:
        pass
    
    required_vars = [
        "LIVEKIT_URL",
        "LIVEKIT_API_KEY",
        "LIVEKIT_API_SECRET",
        "OPENAI_API_KEY",
        "ELEVENLABS_API_KEY",
        "ELEVENLABS_VOICE_ID",
        "DEEPGRAM_API_KEY",
    ]
    
    for var in required_vars:
        if not check_env_var(var, required=True):
            all_ok = False
    
    # 可选环境变量
    print("\n📌 可选配置:")
    optional_vars = [
        "OPENAI_BASE_URL",
        "LLM_MODEL",
        "WEB_SERVER_PORT",
    ]
    
    for var in optional_vars:
        check_env_var(var, required=False)
    
    # 4. 文件检查
    print("\n📌 关键文件:")
    base_path = Path(__file__).parent
    
    files = [
        (base_path / "config" / "default.yaml", "配置文件 (config/default.yaml)"),
        (base_path / "web" / "index.html", "网页文件 (web/index.html)"),
        (base_path / "web" / "app.js", "网页脚本 (web/app.js)"),
        (base_path / "web" / "lib" / "live2dcubismcore.min.js", "Cubism Core SDK"),
        (base_path / "main.py", "Agent 入口 (main.py)"),
        (base_path / "server.py", "Web 服务器 (server.py)"),
    ]
    
    for file_path, desc in files:
        if not check_file(file_path, desc):
            if "Cubism" in desc:
                print("    ⚠️  需要手动下载: https://www.live2d.com/en/download/cubism-sdk/download-web/")
            all_ok = False
    
    # 5. Live2D 模型
    print("\n📌 Live2D 模型:")
    models_dir = base_path / "models"
    if models_dir.exists():
        model_files = list(models_dir.glob("**/*.model3.json"))
        if model_files:
            print(f"  ✅ 找到 {len(model_files)} 个模型:")
            for model in model_files[:3]:  # 只显示前 3 个
                print(f"     - {model.relative_to(base_path)}")
        else:
            print("  ⚠️  models/ 目录存在，但未找到 .model3.json 文件")
            all_ok = False
    else:
        print("  ⚠️  models/ 目录不存在")
        print("     提示: 将 Live2D 模型放到 models/ 目录")
        all_ok = False
    
    # 总结
    print("\n" + "=" * 60)
    if all_ok:
        print("✅ 所有检查通过！可以运行 Chitose 了")
        print("\n启动方式:")
        print("  1. python server.py        # 启动 Web 服务器")
        print("  2. python main.py dev      # 启动 Agent (新终端)")
        print("  3. 浏览器访问 http://localhost:8080")
    else:
        print("❌ 有一些问题需要解决")
        print("\n修复建议:")
        print("  1. 安装依赖: pip install -e .")
        print("  2. 配置环境变量: cp .env.example .env && vim .env")
        print("  3. 下载 Cubism Core SDK")
        print("  4. 准备 Live2D 模型")
        print("\n详细指南: docs/USAGE_GUIDE.md")
    print("=" * 60)
    
    return 0 if all_ok else 1

if __name__ == "__main__":
    sys.exit(main())
