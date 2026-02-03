"""Token server for LiveKit web client."""

import os
from dotenv import load_dotenv
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from livekit import api

load_dotenv()

app = FastAPI(title="Chitose Token Server")

# CORS - 允许本地开发
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/token")
async def get_token(
    identity: str = Query(default="web-viewer", description="用户身份标识"),
    room: str = Query(default="chitose", description="房间名"),
):
    """生成 LiveKit 访问令牌并请求 Agent 加入."""
    # 创建 LiveKit API client
    async with api.LiveKitAPI(
        os.getenv("LIVEKIT_URL"),
        os.getenv("LIVEKIT_API_KEY"),
        os.getenv("LIVEKIT_API_SECRET"),
    ) as livekit_api:
        # 创建 Room (如果不存在)
        try:
            await livekit_api.room.create_room(api.CreateRoomRequest(name=room))
        except Exception:
            pass  # Room 可能已存在

        # 请求 Agent 加入 Room
        try:
            await livekit_api.agent_dispatch.create_dispatch(
                api.CreateAgentDispatchRequest(room=room)
            )
        except Exception as e:
            print(f"Agent dispatch: {e}")

    # 生成 token
    token = api.AccessToken(
        os.getenv("LIVEKIT_API_KEY"),
        os.getenv("LIVEKIT_API_SECRET"),
    )
    token.with_identity(identity)
    token.with_grants(api.VideoGrants(
        room_join=True,
        room=room,
    ))

    return {
        "token": token.to_jwt(),
        "url": os.getenv("LIVEKIT_URL"),
    }


# 静态文件服务
app.mount("/models", StaticFiles(directory="models"), name="models")
app.mount("/", StaticFiles(directory="web", html=True), name="web")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
