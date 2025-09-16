# AI Coding Instructions for learn-type

Purpose: Enable AI agents to quickly scaffold and evolve a typing practice web应用 (React 前端 + Flask 后端) ，聚焦打字速度与准确率的训练体验。当前仓库尚未有源码，仅有意图说明文件 `./github/instructions/inti.instructions.md`；以下内容以“已证实信息 + 推荐落地结构”形式呈现，避免虚构现存代码。

## 1. 已知目标与核心功能
- 从 26 个字母中随机展示字母，用户键盘输入
- 正确：进入下一个字母；错误：即时错误提示
- 统计一次游戏中的：
  - 准确率 (correct / total)
  - 速度 (每分钟正确字母数 WPM-like / CPM)
- 可配置时长：1m / 5m (默认) / 10m
- UI 关键词：清新、现代、简洁、专注、低干扰

## 2. 建议目录结构 (尚未创建，AI 可按需生成)
```
frontend/
  src/
    components/TypingArea.tsx
    components/StatsPanel.tsx
    hooks/useTimer.ts
    hooks/useKeyListener.ts
    utils/letters.ts
    styles/theme.css (或 tailwind.config)
    App.tsx / main.tsx
  package.json
backend/
  app/
    api.py (Flask 路由)
    services/game_logic.py
    models/session_stats.py (纯数据结构，不必引 ORM 初期)
  requirements.txt
  wsgi.py
.github/
  copilot-instructions.md
```

## 3. 预期前后端交互 (首版最小集合)
- GET /api/next-letter -> { letter: "a" }
  - 服务端负责随机；可接受 query 参数 `exclude` 以避免连续重复（可选）
- POST /api/submit -> body: { letter, correct: bool, tsClient } -> 200 { ok: true }
  - 服务端可累积统计（内存字典 keyed by session_id）
- GET /api/stats?session_id=... -> { elapsedMs, total, correct, accuracy, cpm }
- 若初期想完全前端无状态：可先不实现这些 API；逻辑放前端，后续再“API 化”。请在提交说明里标记取舍。

## 4. 前端实现要点
- 状态切分：
  - gameState: { startedAt, durationMs, total, correct, currentLetter }
  - derived metrics: accuracy = correct/total; cpm = correct / (elapsedMs/60000)
- 事件：window keydown 监听；忽略非字母；统一转小写
- 随机字母：`const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('')`
- 防止闪烁：当前字母区用大号 monospace，错误时短暂红色动画 (CSS transition)
- 计时：`useTimer` hook + requestAnimationFrame 或 setInterval(250ms)；倒计时归零触发结束

## 5. 后端模式
- Flask 轻量：`Flask(__name__)` + Blueprint / 单文件起步均可
- 纯内存 session 暂存：`sessions: dict[str, SessionStats]`（开发期；后续可换 Redis）
- 随机字母：`random.choice(string.ascii_lowercase)`
- 计算派生字段在返回时实时计算，避免重复存储

## 6. 统计模型 (示例)
```
SessionStats = {
  'session_id': str,
  'started_at': datetime,
  'duration_ms': int,
  'events': [ { 'letter': 'a', 'correct': True, 'ts': int } ]
}
```
- correct = sum(e.correct)
- total = len(events)
- accuracy = correct / total (保护除零)

## 7. 样式与 UX 指南 (仓库无现成 CSS，需要时创建)
- 配色：浅背景 (#f5f7fa) / 主色(#4a6cf7) / 成功(#30b27a) / 错误(#e65245)
- 字体：UI Sans + 打字区 Monospace
- 错误反馈：轻量动画 (e.g., shake + color) 不遮挡下一次输入
- 结束界面：展示统计 + “再来一局”按钮 + 下拉切换时长

## 8. 开发工作流建议 (需生成脚本时保持一致)
Frontend:
- 初始化建议：`npm create vite@latest frontend -- --template react-ts`
- 启动：`npm run dev`
Backend:
- 建议文件：`backend/requirements.txt` 包含 flask==3.*
- 启动（dev）：`FLASK_APP=app/api.py flask run --reload`
Cross:
- 可添加根级 `Makefile` 目标：`dev-frontend`, `dev-backend`

## 9. 代码风格与约定
- TypeScript：启用 strict；组件使用函数式 + hooks；避免全局 mutable 单例
- 命名：React 组件 PascalCase；hooks 以 use 前缀；后端函数 snake_case
- 不引入重型状态库（Redux）直至需求证明必要
- 单元测试（可选首批）：
  - 前端：utils/letters.ts 随机函数可测试不超出集合
  - 后端：/api/next-letter 200 & 字母范围

## 10. 迭代策略 (AI 提交 PR 时说明)
- 明确：本次变更属于 (scaffold | feature | refactor | ui | docs)
- 若新增依赖：简述用途与替代方案比较
- 保持最小可用增量：先本地前端自包含 → 再接入 Flask API → 再持久化

## 11. Do / Don’t 针对本项目
Do:
- 保持增量、小步提交
- 解释结构性决策理由（注释或 PR 描述）
- 优先无状态 + 纯函数（letters 生成 / metrics 计算）
Don’t:
- 引入数据库或复杂认证（初期阶段）
- 过早抽象 (e.g., 提前做 plugin 架构)

---
如果仓库实际结构更新，请同步修订本文件：移除不再适用的建议，替换为“当前已落地”的说明。欢迎指出需要进一步澄清的部分。