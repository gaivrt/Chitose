/**
 * Chitose Live2D Display
 *
 * 使用 pixi-live2d-display 渲染 Live2D 模型
 * 集成 LiveKit 音频实现口型同步
 */

// Polyfill for crypto.randomUUID (needed for HTTP localhost)
if (typeof crypto !== 'undefined' && !crypto.randomUUID) {
    crypto.randomUUID = function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };
}

// 暴露 PIXI 给插件
window.PIXI = PIXI;

// 配置
const CONFIG = {
    modelPath: '/models/芊芊/芊芊.model3.json',
    canvasId: 'canvas',
    backgroundColor: 0x000000,  // 黑色背景 (OBS 可抠)
    backgroundAlpha: 0,         // 透明背景
    modelScale: 0.14,           // 固定缩放比例
    // LiveKit 配置
    tokenEndpoint: '/token',
    roomName: 'chitose',
    identity: 'web-viewer',
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

// ============================================
// LiveKit 音频接收 + 口型同步
// ============================================

let audioContext = null;
let analyser = null;
let lipSyncActive = false;

/**
 * 连接 LiveKit Room
 */
async function connectLiveKit() {
    console.log('🔗 正在连接 LiveKit...');

    try {
        // 获取 token
        const response = await fetch(
            `${CONFIG.tokenEndpoint}?identity=${CONFIG.identity}&room=${CONFIG.roomName}`
        );
        const { token, url } = await response.json();
        console.log('🎫 Token 获取成功');

        // 创建并连接 Room
        const room = new LivekitClient.Room({
            adaptiveStream: true,
            dynacast: true,
        });

        // 监听音频轨道订阅
        room.on(LivekitClient.RoomEvent.TrackSubscribed, (track, publication, participant) => {
            console.log(`📡 收到轨道: ${track.kind} from ${participant.identity}`);

            if (track.kind === 'audio') {
                setupAudioAnalyser(track);
            }
        });

        // 监听轨道取消订阅
        room.on(LivekitClient.RoomEvent.TrackUnsubscribed, (track) => {
            if (track.kind === 'audio') {
                console.log('🔇 音频轨道断开');
                stopLipSync();
            }
        });

        // 连接状态
        room.on(LivekitClient.RoomEvent.Connected, () => {
            console.log('✅ LiveKit 连接成功!');
        });

        room.on(LivekitClient.RoomEvent.Disconnected, () => {
            console.log('❌ LiveKit 断开连接');
            stopLipSync();
        });

        // 连接
        await room.connect(url, token);
        window.livekitRoom = room;

    } catch (error) {
        console.error('❌ LiveKit 连接失败:', error);
        // 5秒后重试
        setTimeout(connectLiveKit, 5000);
    }
}

/**
 * 设置音频分析器
 */
function setupAudioAnalyser(track) {
    console.log('🎤 设置音频分析器...');

    // 创建 AudioContext 用于分析
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // 如果 AudioContext 被暂停，尝试恢复
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    // 用 LiveKit 的方式播放音频
    const audioElement = track.attach();
    audioElement.volume = 1.0;
    audioElement.autoplay = true;
    document.body.appendChild(audioElement);

    // 尝试播放
    audioElement.play().catch(err => {
        console.warn('⚠️ 自动播放被阻止，等待用户交互:', err);
    });

    // 从 audio element 创建音频源
    try {
        const source = audioContext.createMediaElementSource(audioElement);

        // 创建分析器
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.5;

        // 连接: source → analyser → destination
        source.connect(analyser);
        analyser.connect(audioContext.destination);

        // 启动口型同步
        startLipSync();
    } catch (err) {
        console.error('❌ 音频分析器设置失败:', err);
    }
}

/**
 * 启动口型同步循环
 */
function startLipSync() {
    if (lipSyncActive) return;
    lipSyncActive = true;
    console.log('👄 口型同步启动');

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    function update() {
        if (!lipSyncActive) return;

        // 获取频率数据
        analyser.getByteFrequencyData(dataArray);

        // 计算平均音量 (取低频部分，更适合人声)
        const voiceRange = Math.floor(dataArray.length * 0.3); // 低频 30%
        let sum = 0;
        for (let i = 0; i < voiceRange; i++) {
            sum += dataArray[i];
        }
        const average = sum / voiceRange;

        // 映射到 0~1 (调整灵敏度)
        const mouthValue = Math.min(1, average / 128);

        // 更新口型
        setMouthOpenY(mouthValue);

        requestAnimationFrame(update);
    }

    update();
}

/**
 * 停止口型同步
 */
function stopLipSync() {
    lipSyncActive = false;
    setMouthOpenY(0);
    console.log('👄 口型同步停止');
}

// 页面加载完成后连接 LiveKit
window.addEventListener('load', () => {
    // 延迟一点确保 Live2D 模型加载完成
    setTimeout(connectLiveKit, 1000);

    // 设置聊天输入
    setupChatInput();
});

/**
 * 设置聊天输入框
 */
function setupChatInput() {
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send');

    async function sendMessage() {
        const text = input.value.trim();
        if (!text || !window.livekitRoom) return;

        // 确保 AudioContext 已激活
        if (audioContext && audioContext.state === 'suspended') {
            await audioContext.resume();
            console.log('🔊 AudioContext 已激活');
        }

        // 尝试播放页面上的所有音频元素
        document.querySelectorAll('audio').forEach(audio => {
            audio.play().catch(() => {});
        });

        console.log('💬 发送消息:', text);

        try {
            // 使用 LiveKit Text Stream API 发送文字
            // topic: "lk.chat" 是 Agent 默认监听的 topic
            await window.livekitRoom.localParticipant.sendText(text, {
                topic: 'lk.chat',
            });
            console.log('✅ 消息已发送');
        } catch (error) {
            console.error('❌ 发送失败:', error);
        }

        input.value = '';
    }

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // 点击输入框时激活 AudioContext
    input.addEventListener('click', () => {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
            console.log('🔊 AudioContext 已激活');
        }
    });
}

