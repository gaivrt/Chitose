/**
 * LiveKit Integration for Chitose
 * 
 * 连接 LiveKit 房间，接收 Agent 音频流，并驱动口型同步
 */

// LiveKit 配置
const LIVEKIT_CONFIG = {
    url: '',  // 从 URL 参数或配置获取
    token: '', // 从 URL 参数或配置获取
};

// 音频分析配置
const AUDIO_CONFIG = {
    smoothingFactor: 0.7,      // 音量平滑因子 (0-1)
    minVolume: 0.01,           // 最小音量阈值
    maxVolume: 0.3,            // 最大音量（用于归一化）
    mouthOpenScale: 0.8,       // 嘴巴张开缩放比例
    updateInterval: 50,        // 更新间隔 (ms)
};

// 全局状态
let livekitRoom = null;
let audioContext = null;
let analyser = null;
let currentVolume = 0;
let smoothedVolume = 0;

/**
 * 初始化 LiveKit 连接
 */
async function initLiveKit() {
    console.log('🔌 初始化 LiveKit 连接...');
    
    // 从 URL 参数获取配置
    const urlParams = new URLSearchParams(window.location.search);
    const url = urlParams.get('livekit_url') || LIVEKIT_CONFIG.url;
    const token = urlParams.get('livekit_token') || LIVEKIT_CONFIG.token;
    
    if (!url || !token) {
        console.warn('⚠️ 缺少 LiveKit 配置，请在 URL 中添加 ?livekit_url=xxx&livekit_token=xxx');
        console.warn('⚠️ 口型同步功能将无法使用');
        return false;
    }
    
    try {
        // 创建 LiveKit Room
        livekitRoom = new LivekitClient.Room({
            adaptiveStream: true,
            dynacast: true,
        });
        
        // 监听音频轨道
        livekitRoom.on(LivekitClient.RoomEvent.TrackSubscribed, handleTrackSubscribed);
        livekitRoom.on(LivekitClient.RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
        livekitRoom.on(LivekitClient.RoomEvent.Disconnected, handleDisconnected);
        
        // 连接到房间
        await livekitRoom.connect(url, token);
        console.log('✅ LiveKit 连接成功!');
        console.log('📊 房间信息:', {
            name: livekitRoom.name,
            participants: livekitRoom.numParticipants,
        });
        
        return true;
    } catch (error) {
        console.error('❌ LiveKit 连接失败:', error);
        return false;
    }
}

/**
 * 处理新订阅的音频轨道
 */
function handleTrackSubscribed(track, publication, participant) {
    console.log('🎵 收到音频轨道:', {
        participant: participant.identity,
        kind: track.kind,
    });
    
    // 只处理音频轨道
    if (track.kind !== LivekitClient.Track.Kind.Audio) {
        return;
    }
    
    // 获取 MediaStream
    const mediaStream = new MediaStream([track.mediaStreamTrack]);
    
    // 初始化音频分析
    initAudioAnalysis(mediaStream);
    
    // 播放音频（可选，如果需要听到声音）
    playAudioStream(mediaStream);
}

/**
 * 处理取消订阅的音频轨道
 */
function handleTrackUnsubscribed(track) {
    console.log('🔇 音频轨道已取消订阅');
    
    // 停止音频分析
    if (analyser) {
        analyser = null;
    }
}

/**
 * 处理断开连接
 */
function handleDisconnected() {
    console.log('🔌 LiveKit 连接已断开');
    livekitRoom = null;
    analyser = null;
}

/**
 * 初始化音频分析
 */
function initAudioAnalysis(mediaStream) {
    console.log('🎚️ 初始化音频分析...');
    
    try {
        // 创建 AudioContext
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // 创建音频源
        const source = audioContext.createMediaStreamSource(mediaStream);
        
        // 创建分析器
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        
        // 连接节点
        source.connect(analyser);
        
        // 开始分析循环
        startVolumeAnalysis();
        
        console.log('✅ 音频分析已启动');
    } catch (error) {
        console.error('❌ 音频分析初始化失败:', error);
    }
}

/**
 * 播放音频流（可选）
 */
function playAudioStream(mediaStream) {
    const audioElement = document.createElement('audio');
    audioElement.srcObject = mediaStream;
    audioElement.autoplay = true;
    audioElement.volume = 1.0;
    
    // 添加到 DOM（隐藏）
    audioElement.style.display = 'none';
    document.body.appendChild(audioElement);
    
    console.log('🔊 音频播放已启动');
}

/**
 * 开始音量分析循环
 */
function startVolumeAnalysis() {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    function analyze() {
        if (!analyser) {
            return; // 停止分析
        }
        
        // 获取音频数据
        analyser.getByteFrequencyData(dataArray);
        
        // 计算平均音量
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
        }
        currentVolume = sum / dataArray.length / 255; // 归一化到 0-1
        
        // 平滑处理
        smoothedVolume = smoothedVolume * AUDIO_CONFIG.smoothingFactor + 
                        currentVolume * (1 - AUDIO_CONFIG.smoothingFactor);
        
        // 应用阈值和缩放
        let mouthOpen = 0;
        if (smoothedVolume > AUDIO_CONFIG.minVolume) {
            mouthOpen = Math.min(
                (smoothedVolume / AUDIO_CONFIG.maxVolume) * AUDIO_CONFIG.mouthOpenScale,
                1.0
            );
        }
        
        // 更新口型
        updateMouthOpen(mouthOpen);
        
        // 继续分析
        setTimeout(analyze, AUDIO_CONFIG.updateInterval);
    }
    
    analyze();
}

/**
 * 更新嘴巴张开程度
 */
function updateMouthOpen(value) {
    if (typeof window.setMouthOpenY === 'function') {
        window.setMouthOpenY(value);
    }
}

/**
 * 获取 LiveKit 房间状态
 */
function getLiveKitStatus() {
    if (!livekitRoom) {
        return { connected: false };
    }
    
    return {
        connected: livekitRoom.state === LivekitClient.ConnectionState.Connected,
        room: livekitRoom.name,
        participants: livekitRoom.numParticipants,
        volume: currentVolume.toFixed(3),
        smoothedVolume: smoothedVolume.toFixed(3),
    };
}

// 暴露全局 API
window.initLiveKit = initLiveKit;
window.getLiveKitStatus = getLiveKitStatus;

// 自动初始化（如果 URL 中有参数）
window.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('livekit_url') && urlParams.has('livekit_token')) {
        console.log('🚀 检测到 LiveKit 参数，自动连接...');
        await initLiveKit();
    }
});
