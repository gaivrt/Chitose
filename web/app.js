/**
 * Chitose Live2D Display
 * 
 * 使用 pixi-live2d-display 渲染 Live2D 模型
 */

// 暴露 PIXI 给插件
window.PIXI = PIXI;

// 配置
const CONFIG = {
    modelPath: '../models/芊芊/芊芊.model3.json',
    canvasId: 'canvas',
    backgroundColor: 0x000000,  // 黑色背景 (OBS 可抠)
    backgroundAlpha: 0,         // 透明背景
    modelScale: 0.14,            // 固定缩放比例
};

// 全局变量
let app = null;
let initialModelSize = null;

// 主程序
(async function main() {
    console.log('🎭 Chitose Live2D 启动中...');

    // 创建 PixiJS 应用
    app = new PIXI.Application({
        view: document.getElementById(CONFIG.canvasId),
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: CONFIG.backgroundColor,
        backgroundAlpha: CONFIG.backgroundAlpha,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
    });

    // 响应窗口大小变化
    window.addEventListener('resize', onResize);

    // 交互控制状态
    let isDragging = false;
    let isSpacePressed = false;
    let lastMousePos = { x: 0, y: 0 };

    // 空格键控制
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !isSpacePressed) {
            isSpacePressed = true;
            document.body.style.cursor = 'grab';
            e.preventDefault();
        }
    });
    window.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
            isSpacePressed = false;
            isDragging = false;
            document.body.style.cursor = 'default';
        }
    });

    // 鼠标拖动
    app.view.addEventListener('mousedown', (e) => {
        if (isSpacePressed) {
            isDragging = true;
            lastMousePos = { x: e.clientX, y: e.clientY };
            document.body.style.cursor = 'grabbing';
        }
    });
    window.addEventListener('mouseup', () => {
        isDragging = false;
        if (isSpacePressed) {
            document.body.style.cursor = 'grab';
        }
    });
    window.addEventListener('mousemove', (e) => {
        if (isDragging && window.model) {
            const dx = e.clientX - lastMousePos.x;
            const dy = e.clientY - lastMousePos.y;
            window.model.x += dx;
            window.model.y += dy;
            lastMousePos = { x: e.clientX, y: e.clientY };
        }
    });

    // Ctrl + 滚轮缩放
    app.view.addEventListener('wheel', (e) => {
        if (e.ctrlKey && window.model) {
            e.preventDefault();
            const scaleFactor = e.deltaY > 0 ? 0.95 : 1.05;
            const currentScale = window.model.scale.x;
            const newScale = Math.max(0.05, Math.min(2, currentScale * scaleFactor));
            window.model.scale.set(newScale);
            CONFIG.modelScale = newScale;  // 保存当前缩放
        }
    }, { passive: false });

    try {
        // 加载 Live2D 模型
        console.log('📦 加载模型:', CONFIG.modelPath);
        const model = await PIXI.live2d.Live2DModel.from(CONFIG.modelPath);

        // 添加到舞台
        app.stage.addChild(model);

        // 居中并缩放
        centerModel(model, app);

        // 保存全局引用
        window.model = model;

        console.log('✅ 模型加载成功!');
        console.log('📊 模型信息:', {
            width: model.width,
            height: model.height,
        });

        // 启用交互
        model.on('hit', (hitAreas) => {
            console.log('👆 点击区域:', hitAreas);
            // 可以在这里触发表情或动作
        });

    } catch (error) {
        console.error('❌ 模型加载失败:', error);
    }
})();

/**
 * 居中显示模型 (使用固定缩放)
 */
function centerModel(model) {
    // 设置锚点到中心
    model.anchor.set(0.5, 0.5);

    // 保存初始尺寸
    if (!initialModelSize) {
        initialModelSize = { width: model.width, height: model.height };
    }

    // 使用固定缩放比例
    model.scale.set(CONFIG.modelScale);

    // 居中
    model.x = app.screen.width / 2;
    model.y = app.screen.height / 2;
}

/**
 * 窗口大小变化处理
 */
function onResize() {
    app.renderer.resize(window.innerWidth, window.innerHeight);
    if (window.model) {
        // 只更新位置，不改变缩放
        window.model.x = app.screen.width / 2;
        window.model.y = app.screen.height / 2;
    }
}

/**
 * 设置嘴巴张开程度 (用于口型同步)
 * @param {number} value - 0~1
 */
function setMouthOpenY(value) {
    if (window.model && window.model.internalModel) {
        const coreModel = window.model.internalModel.coreModel;
        // Cubism 4 参数名通常是 ParamMouthOpenY
        const paramIndex = coreModel.getParameterIndex('ParamMouthOpenY');
        if (paramIndex >= 0) {
            coreModel.setParameterValueByIndex(paramIndex, value);
        }
    }
}

// 导出口型同步函数
window.setMouthOpenY = setMouthOpenY;

// ============================================================
// LiveKit 集成 - 音频接收和口型同步
// ============================================================

/**
 * LiveKit 连接状态
 */
const livekitState = {
    room: null,
    connected: false,
    audioContext: null,
    analyser: null,
    dataArray: null,
};

/**
 * 连接到 LiveKit 房间
 */
async function connectToLiveKit() {
    try {
        console.log('🔗 正在连接 LiveKit...');
        
        // 从服务器获取 token
        const response = await fetch('/api/token?room=test-room&name=web-viewer');
        if (!response.ok) {
            throw new Error(`Token request failed: ${response.status}`);
        }
        
        const { token, url } = await response.json();
        console.log('✅ Token 获取成功:', { url });
        
        // 创建 LiveKit Room
        const { Room, RoomEvent } = LivekitClient;
        livekitState.room = new Room({
            adaptiveStream: true,
            dynacast: true,
        });
        
        // 监听音轨事件
        livekitState.room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
        livekitState.room.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
        livekitState.room.on(RoomEvent.Disconnected, handleDisconnected);
        livekitState.room.on(RoomEvent.Connected, () => {
            console.log('✅ 已连接到 LiveKit 房间');
            livekitState.connected = true;
        });
        
        // 连接到房间
        await livekitState.room.connect(url, token);
        
    } catch (error) {
        console.error('❌ LiveKit 连接失败:', error);
    }
}

/**
 * 处理新订阅的音轨
 */
function handleTrackSubscribed(track, publication, participant) {
    console.log('🎵 收到音轨:', {
        kind: track.kind,
        participant: participant.identity,
    });
    
    if (track.kind === 'audio') {
        console.log('🔊 开始播放音频并同步口型');
        
        // 播放音频
        const audioElement = track.attach();
        audioElement.play();
        
        // 初始化音频分析 (用于口型同步)
        initAudioAnalysis(audioElement);
    }
}

/**
 * 处理音轨取消订阅
 */
function handleTrackUnsubscribed(track) {
    console.log('🔇 音轨已断开:', track.kind);
    track.detach();
}

/**
 * 处理断开连接
 */
function handleDisconnected() {
    console.log('❌ 已断开 LiveKit 连接');
    livekitState.connected = false;
    
    // 重置口型
    if (window.model) {
        setMouthOpenY(0);
    }
}

/**
 * 初始化音频分析 (用于口型同步)
 */
function initAudioAnalysis(audioElement) {
    try {
        // 创建 AudioContext
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        livekitState.audioContext = new AudioContext();
        
        // 创建音频源
        const source = livekitState.audioContext.createMediaElementSource(audioElement);
        
        // 创建分析器
        livekitState.analyser = livekitState.audioContext.createAnalyser();
        livekitState.analyser.fftSize = 256;
        const bufferLength = livekitState.analyser.frequencyBinCount;
        livekitState.dataArray = new Uint8Array(bufferLength);
        
        // 连接节点: 源 -> 分析器 -> 输出
        source.connect(livekitState.analyser);
        livekitState.analyser.connect(livekitState.audioContext.destination);
        
        // 开始口型同步循环
        startLipSyncLoop();
        
        console.log('✅ 音频分析已初始化');
        
    } catch (error) {
        console.error('❌ 音频分析初始化失败:', error);
    }
}

/**
 * 口型同步循环
 */
function startLipSyncLoop() {
    function updateLipSync() {
        if (!livekitState.connected || !livekitState.analyser) {
            return;
        }
        
        // 获取音频数据
        livekitState.analyser.getByteFrequencyData(livekitState.dataArray);
        
        // 计算平均音量 (0-255)
        const average = livekitState.dataArray.reduce((a, b) => a + b, 0) / livekitState.dataArray.length;
        
        // 将音量映射到嘴巴张开度 (0-1)
        // 使用非线性映射，让嘴巴动作更自然
        const volume = average / 255;
        const mouthOpen = Math.pow(volume, 0.5) * 1.2; // 放大并开根号
        const clampedMouthOpen = Math.max(0, Math.min(1, mouthOpen));
        
        // 更新 Live2D 嘴巴
        setMouthOpenY(clampedMouthOpen);
        
        // 继续循环
        requestAnimationFrame(updateLipSync);
    }
    
    // 启动循环
    updateLipSync();
}

// 页面加载完成后自动连接 LiveKit
window.addEventListener('load', () => {
    // 延迟 2 秒等待模型加载完成
    setTimeout(() => {
        console.log('🎬 开始连接 LiveKit...');
        connectToLiveKit();
    }, 2000);
});

