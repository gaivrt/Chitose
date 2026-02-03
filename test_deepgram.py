"""直接测试 Deepgram API (不通过 LiveKit)"""
import asyncio
import os
import aiohttp
from dotenv import load_dotenv

load_dotenv()

async def test_deepgram():
    api_key = os.getenv("DEEPGRAM_API_KEY")
    
    if not api_key:
        print("❌ DEEPGRAM_API_KEY 未设置！")
        return
    
    print(f"API Key: {api_key[:8]}...{api_key[-4:]}")
    
    # 测试获取项目信息 (验证 API key)
    url = "https://api.deepgram.com/v1/projects"
    
    headers = {
        "Authorization": f"Token {api_key}",
        "Content-Type": "application/json",
    }
    
    print(f"\n测试 Deepgram API 连接...")
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as resp:
            print(f"Status: {resp.status}")
            if resp.status == 200:
                data = await resp.json()
                print(f"✅ Success! API Key 有效")
                print(f"Projects: {len(data.get('projects', []))}")
            else:
                error = await resp.text()
                print(f"❌ Error: {error}")

if __name__ == "__main__":
    asyncio.run(test_deepgram())
