"""直接测试 ElevenLabs API (不通过 LiveKit)"""
import asyncio
import os
import aiohttp
from dotenv import load_dotenv

load_dotenv()

async def test_elevenlabs_direct():
    api_key = os.getenv("ELEVEN_API_KEY")
    voice_id = os.getenv("ELEVENLABS_VOICE_ID", "kGjJqO6wdwRN9iJsoeIC")
    
    print(f"API Key: {api_key[:10]}...{api_key[-5:]}")
    print(f"Voice ID: {voice_id}")
    
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
    }
    
    data = {
        "text": "Hello, this is a voice test.",
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.5,
        }
    }
    
    print(f"\nCalling ElevenLabs API...")
    
    async with aiohttp.ClientSession() as session:
        async with session.post(url, headers=headers, json=data) as resp:
            print(f"Status: {resp.status}")
            if resp.status == 200:
                audio = await resp.read()
                print(f"✅ Success! Got {len(audio)} bytes of audio")
                
                # 保存到文件测试
                with open("test_output.mp3", "wb") as f:
                    f.write(audio)
                print("Saved to test_output.mp3")
            else:
                error = await resp.text()
                print(f"❌ Error: {error}")

if __name__ == "__main__":
    asyncio.run(test_elevenlabs_direct())
