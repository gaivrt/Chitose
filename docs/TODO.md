# TODO / 待办事项

> 本文件是 GitHub Issues 的人类可读索引。实际跟踪以 Issues + Projects 看板为准。

## P0 — 立即

- [ ] **中文 STT 替换** — Deepgram nova-3 中文识别差，替换为 FunASR 或 Whisper `feature`
- [ ] **记忆系统** — hybrid search 跨会话记忆，参考 OpenClaw 研究 `feature`

## P1 — 近期

- [ ] **B站弹幕集成** — 读取弹幕作为文字输入，支持过滤和优先级 `feature`
- [ ] **TTS/STT Adapter 抽象层** — 定义接口，新增 provider 不改核心代码 `enhancement`
- [ ] **表情 + 动作系统** — 表情驱动、idle 动作、说话动作、道具切换 `feature`

## P2 — 中期

- [ ] **Lip Sync Phoneme→Viseme** — 引入 phoneme 识别，映射到 viseme 口型 `enhancement`
- [ ] **测试覆盖** — 核心模块单元测试 + CI 自动运行 `infra`
- [ ] **Plugin 系统** — 基于钩子机制，第三方可开发插件 `feature`

## P3 — 远期

- [ ] **3D / VRM 支持** — 覆盖 3D VTuber 场景，视社区需求 `feature`
- [ ] **多直播平台** — B站验证后扩展 YouTube、Twitch 等 `feature`
- [ ] **WebUI 配置面板** — Web 界面方便非技术用户配置 `feature`
- [ ] **配置热更新** — 运行时修改配置无需重启 `infra`
- [ ] **日志持久化** — 日志落盘 + 查询 `infra`
- [ ] **监控告警** — 服务健康监控和异常告警 `infra`
