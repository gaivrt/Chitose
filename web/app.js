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

/**
 * LiveKit 集成 - 口型同步
 */

// LiveKit 配置
const LIVEKIT_CONFIG = {
    url: 'ws://localhost:7880',  // 默认本地开发地址
    token: '',  // 需要从 URL 参数或环境变量获取
};

// 口型同步状态
let audioContext = null;
let analyser = null;
let audioDataArray = null;
let mouthValue = 0;
let mouthSmoothFactor = 0.3;  // 平滑系数 (0-1)

/**
 * 连接到 LiveKit 房间
 */
async function connectToLiveKit() {
    try {
        // 从 URL 参数获取配置
        const params = new URLSearchParams(window.location.search);
        const url = params.get('livekit_url') || LIVEKIT_CONFIG.url;
        const token = params.get('token') || LIVEKIT_CONFIG.token;

        if (!token) {
            console.warn('⚠️ 未提供 LiveKit token，跳过连接');
            console.info('💡 提示：在 URL 添加参数 ?token=YOUR_TOKEN');
            return;
        }

        console.log('🔗 连接到 LiveKit:', url);

        // 创建 LiveKit Room
        const room = new LivekitClient.Room({
            adaptiveStream: true,
            dynacast: true,
        });

        // 监听音频轨道
        room.on(LivekitClient.RoomEvent.TrackSubscribed, (track, publication, participant) => {
            console.log('📢 收到音频轨道:', {
                kind: track.kind,
                source: track.source,
                participant: participant.identity,
            });

            if (track.kind === LivekitClient.Track.Kind.Audio) {
                console.log('🎤 开始处理音频...');
                handleAudioTrack(track);
            }
        });

        // 连接到房间
        await room.connect(url, token);
        console.log('✅ LiveKit 连接成功!');

        // 保存房间引用
        window.livekitRoom = room;

    } catch (error) {
        console.error('❌ LiveKit 连接失败:', error);
    }
}

/**
 * 处理音频轨道 - 实现口型同步
 */
function handleAudioTrack(track) {
    // 获取 MediaStreamTrack
    const mediaStreamTrack = track.mediaStreamTrack;
    const mediaStream = new MediaStream([mediaStreamTrack]);

    // 创建 Web Audio 上下文
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // 创建音频源
    const source = audioContext.createMediaStreamSource(mediaStream);

    // 创建分析器
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;

    const bufferLength = analyser.frequencyBinCount;
    audioDataArray = new Uint8Array(bufferLength);

    // 连接音频节点
    source.connect(analyser);
    // 不连接到 destination，避免回声（音频由 LiveKit 自动播放）

    // 开始分析音频
    startLipSync();

    console.log('✅ 口型同步已启动!');
}

/**
 * 启动口型同步循环
 */
function startLipSync() {
    function updateMouth() {
        if (analyser && audioDataArray) {
            // 获取音频频域数据
            analyser.getByteFrequencyData(audioDataArray);

            // 计算平均音量 (0-255)
            let sum = 0;
            for (let i = 0; i < audioDataArray.length; i++) {
                sum += audioDataArray[i];
            }
            const average = sum / audioDataArray.length;

            // 映射到 0-1 范围
            const targetValue = Math.min(average / 100, 1.0);

            // 平滑过渡
            mouthValue = mouthValue * (1 - mouthSmoothFactor) + targetValue * mouthSmoothFactor;

            // 更新 Live2D 口型
            setMouthOpenY(mouthValue);
        }

        requestAnimationFrame(updateMouth);
    }

    updateMouth();
}

/**
 * 测试口型同步（不需要 LiveKit）
 */
function testLipSync() {
    console.log('🧪 测试口型同步...');
    
    let time = 0;
    function animate() {
        time += 0.1;
        const value = (Math.sin(time) + 1) / 2;  // 0-1 范围
        setMouthOpenY(value);
        requestAnimationFrame(animate);
    }
    
    animate();
    console.log('✅ 测试动画已启动（按 Ctrl+R 刷新停止）');
}

// 导出函数
window.connectToLiveKit = connectToLiveKit;
window.testLipSync = testLipSync;

// 页面加载完成后自动连接（如果有 token）
window.addEventListener('load', () => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('token') || params.has('livekit_url')) {
        console.log('🚀 自动连接 LiveKit...');
        connectToLiveKit();
    } else {
        console.info('💡 提示：');
        console.info('   1. 添加 ?token=YOUR_TOKEN 自动连接 LiveKit');
        console.info('   2. 或在控制台运行 connectToLiveKit() 手动连接');
        console.info('   3. 或运行 testLipSync() 测试口型动画');
    }
});

