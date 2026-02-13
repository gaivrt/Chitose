# TODO / 待办事项

> 本文件是 GitHub Issues 的人类可读索引。实际跟踪以 Issues + Projects 看板为准。

## P0 — 立即

- [ ] **B站弹幕集成** #6 — 读取弹幕作为文字输入，直播核心输入通道 `feature`
- [ ] **表情 + 动作系统** #8 — LLM 情感标签驱动 31 表情预设 + idle 动作 `feature`
- [ ] **记忆系统** #5 — hybrid search 跨会话记忆，参考 OpenClaw 研究 `feature`

## P1 — 近期

- [ ] **弹幕智能选择 + 优先级队列** #18 — 过滤 + LLM 选择最值得回的弹幕 `feature`
- [ ] **观众欢迎/识别** #19 — 新观众欢迎、老观众个性化打招呼 `feature`
- [ ] **SC/礼物反应** #20 — 监听礼物事件，触发感谢语 + 特殊表情 `feature`
- [ ] **场景感知 + 主动话题** #21 — 冷场检测，主动发起话题 `feature`

## P2 — 中期

- [ ] **TTS/STT Adapter 抽象层** #7 — 定义接口，新增 provider 不改核心代码 `enhancement`
- [ ] **Lip Sync Phoneme→Viseme** #9 — 引入 phoneme 识别，映射到 viseme 口型 `enhancement`
- [ ] **测试覆盖** #10 — 核心模块单元测试 + CI 自动运行 `infra`
- [ ] **Plugin 系统** #11 — 基于钩子机制，第三方可开发插件 `feature`

## P3 — 远期

- [ ] **中文 STT 替换** #4 — 直播场景不需要，推迟到语音陪伴场景 `feature`
- [ ] **多直播平台** #13 — B站验证后扩展 YouTube、Twitch 等 `feature`
- [ ] **3D / VRM 支持** #12 — 覆盖 3D VTuber 场景，视社区需求 `feature`
- [ ] **WebUI 配置面板** #14 — Web 界面方便非技术用户配置 `feature`
- [ ] **配置热更新** #15 — 运行时修改配置无需重启 `infra`
- [ ] **日志持久化** #16 — 日志落盘 + 查询 `infra`
- [ ] **监控告警** #17 — 服务健康监控和异常告警 `infra`
