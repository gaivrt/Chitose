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
 * 显示 LiveKit 连接状态（调试用）
 */
function showLiveKitStatus() {
    if (typeof window.getLiveKitStatus === 'function') {
        const status = window.getLiveKitStatus();
        console.log('📡 LiveKit 状态:', status);
        return status;
    }
    return null;
}

// 每 5 秒显示一次状态
setInterval(() => {
    const status = showLiveKitStatus();
    if (status && status.connected) {
        // 在控制台显示音量（可选）
        // console.log(`🔊 音量: ${status.smoothedVolume}`);
    }
}, 5000);

// 暴露状态函数
window.showLiveKitStatus = showLiveKitStatus;
