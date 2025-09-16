# learn-type

React + Flask 打字练习应用（早期脚手架阶段）。

## 结构
```
frontend/  # React + TypeScript + Vite
backend/   # Flask API (内存 session)
```

## 前端开发
```bash
make install-frontend
make dev-frontend
```
默认启动 http://localhost:5173

## 后端开发
```bash
make install-backend
make dev-backend
```
默认启动 http://localhost:5001

## API (初版)
- GET /api/next-letter -> { letter }
- POST /api/submit { session_id, letter, correct, tsClient, durationMs? }
- GET /api/stats?session_id=dev
- GET /api/health

## Session 统计模型
见 `backend/app/models/session_stats.py`。

## 前端关键文件
- `src/App.tsx` 游戏状态管理 + 计时/统计
- `src/components/TypingArea.tsx` 输入区与错误闪烁
- `src/components/StatsPanel.tsx` 指标展示
- `src/hooks/useTimer.ts` requestAnimationFrame 计时
- `src/utils/letters.ts` 字母与随机函数



## 许可
MIT
