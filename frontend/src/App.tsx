import React, { useCallback, useEffect, useState } from 'react';
import { TypingArea } from './components/TypingArea';
import { StatsPanel } from './components/StatsPanel';
import { useTimer } from './hooks/useTimer';
import { pickRandomLetter, LETTERS } from './utils/letters';
import { LetterStatsPage } from './components/LetterStatsPage';

export interface GameState {
  startedAt: number | null;
  durationMs: number; // configured total duration
  total: number;
  correct: number;
  currentLetter: string;
  finished: boolean;
}

const DEFAULT_DURATION = 5 * 60 * 1000; // 5m default

export const App: React.FC = () => {
  const [durationMs, setDurationMs] = useState<number>(DEFAULT_DURATION);
  const [game, setGame] = useState<GameState>(() => ({
    startedAt: null,
    durationMs,
    total: 0,
    correct: 0,
    currentLetter: pickRandomLetter(),
    finished: false,
  }));
  const [wrong, setWrong] = useState(false); // 当前字母是否处于错误反馈状态（直到输入正确）
  const [paused, setPaused] = useState(false);
  const [view, setView] = useState<'game' | 'stats'>('game');
  const [resultDismissed, setResultDismissed] = useState(false); // 结束结果弹窗是否已关闭
  const [letterStats, setLetterStats] = useState<Record<string, { total: number; correct: number }>>(() => {
    try {
      const raw = localStorage.getItem('letterStats.v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        // 验证结构完整性
        if (parsed && typeof parsed === 'object') {
          const full: Record<string, { total: number; correct: number }> = {};
            LETTERS.forEach(l => {
              const item = (parsed as any)[l];
              if (item && typeof item.total === 'number' && typeof item.correct === 'number') {
                full[l] = { total: item.total, correct: item.correct };
              } else {
                full[l] = { total: 0, correct: 0 };
              }
            });
          return full;
        }
      }
    } catch(err) {
      console.warn('读取本地统计失败，使用空白数据', err);
    }
    const base: Record<string, { total: number; correct: number }> = {};
    LETTERS.forEach(l => { base[l] = { total: 0, correct: 0 }; });
    return base;
  });

  // 持久化：防抖可选，此处简单直接写。
  useEffect(() => {
    try {
      localStorage.setItem('letterStats.v1', JSON.stringify(letterStats));
    } catch(err) {
      console.warn('保存本地统计失败', err);
    }
  }, [letterStats]);

  const resetLetterStats = useCallback(() => {
    setLetterStats(() => {
      const base: Record<string, { total: number; correct: number }> = {};
      LETTERS.forEach(l => { base[l] = { total: 0, correct: 0 }; });
      return base;
    });
    try { localStorage.removeItem('letterStats.v1'); } catch {}
  }, []);

  // 加权选字：低准确率优先，其次低出现次数
  const pickWeightedLetter = useCallback((exclude?: string) => {
    const A = 0.7; // 准确率缺失权重占比
    const B = 0.3; // 覆盖（出现次数）缺失权重占比
    let maxTotal = 0;
    for (const l of LETTERS) {
      const t = letterStats[l].total;
      if (t > maxTotal) maxTotal = t;
    }
    const weights: number[] = [];
    let sum = 0;
    for (const l of LETTERS) {
      if (exclude && l === exclude) { weights.push(0); continue; }
      const { total: t, correct: c } = letterStats[l];
      const accuracy = t === 0 ? 0 : c / t; // 初始为 0 → (1-0)=1 推高权重
      const coverage = maxTotal === 0 ? 0 : t / (maxTotal || 1);
      const w = (1 - accuracy) * A + (1 - coverage) * B + 0.0001; // epsilon 防止 sum 为 0
      weights.push(w);
      sum += w;
    }
    let r = Math.random() * sum;
    for (let i = 0; i < LETTERS.length; i++) {
      r -= weights[i];
      if (r <= 0) return LETTERS[i];
    }
    return pickRandomLetter(exclude);
  }, [letterStats]);

  const { elapsed, running, start, stop, reset } = useTimer({ interval: 250 });

  // 弱项字母展示组件（结束弹窗用）
  const WeakLetters: React.FC<{ letterStats: Record<string, { total: number; correct: number }> }> = ({ letterStats }) => {
    const items = Object.entries(letterStats).map(([letter, s]) => {
      const acc = s.total === 0 ? 0 : s.correct / s.total;
      return { letter, total: s.total, accuracy: acc };
    }).filter(i => i.total > 0);
    if (!items.length) return <div className="weak-letters"><p className="empty">本局数据较少，继续练习以产生统计。</p></div>;
    items.sort((a,b) => {
      if (a.accuracy === b.accuracy) return a.total - b.total;
      return a.accuracy - b.accuracy;
    });
    const top = items.slice(0,3);
    return (
      <div className="weak-letters" aria-label="最需关注字母">
        <div className="weak-title">最需关注</div>
        <div className="weak-chips">
          {top.map(t => (
            <span key={t.letter} className="weak-chip-lg" title={`准确率 ${(t.accuracy*100).toFixed(1)}% / 次数 ${t.total}`}>{t.letter}</span>
          ))}
        </div>
      </div>
    );
  };

  const accuracy = game.total === 0 ? 0 : game.correct / game.total;
  const cpm = elapsed === 0 ? 0 : game.correct / (elapsed / 60000);
  const remainingMs = game.startedAt ? Math.max(game.durationMs - elapsed, 0) : game.durationMs;

  const restart = useCallback((newDuration?: number) => {
    const dur = newDuration ?? durationMs;
    setDurationMs(dur);
    // 确保计时器完全停止后再重置再启动，避免 start 早退
    stop();
    reset();
    setGame({
      startedAt: Date.now(),
      durationMs: dur,
      total: 0,
      correct: 0,
      currentLetter: pickWeightedLetter(),
      finished: false,
    });
    setWrong(false);
    setPaused(false);
    setResultDismissed(false);
    // 直接强制重新启动计时器
    setTimeout(() => start(true), 0);
  }, [durationMs, reset, start, stop, pickWeightedLetter]);

  useEffect(() => {
    if (!game.startedAt) return;
    if (remainingMs <= 0 && !game.finished) {
      stop();
      setGame(g => ({ ...g, finished: true }));
      setResultDismissed(false);
    }
  }, [remainingMs, game.startedAt, game.finished, stop]);

  // 通过批量更新减少多次渲染引起的“闪”
  const handleKey = useCallback((key: string) => {
    setGame(g => {
      if (g.finished || paused) return g;
      const isLetter = LETTERS.includes(key);
      if (!isLetter) return g;
      const correctHit = key === g.currentLetter;
      const nextLetter = correctHit ? pickWeightedLetter(g.currentLetter) : g.currentLetter;
      if (correctHit) {
        setWrong(false);
      } else {
        setWrong(true);
      }
      setLetterStats(prev => {
        const cur = prev[g.currentLetter];
        return {
          ...prev,
          [g.currentLetter]: {
            total: cur.total + 1,
            correct: cur.correct + (correctHit ? 1 : 0),
          }
        };
      });
      return {
        ...g,
        total: g.total + 1,
        correct: g.correct + (correctHit ? 1 : 0),
        currentLetter: nextLetter,
      };
    });
  }, [paused, pickWeightedLetter]);

  const togglePause = useCallback(() => {
    if (!game.startedAt || game.finished) return;
    if (paused) {
      setPaused(false);
      start();
    } else {
      setPaused(true);
      stop();
    }
  }, [paused, start, stop, game.startedAt, game.finished]);

  return (
    <div className="app-container">
      <header>
        <h1>Learn Type</h1>
        <div className="controls">
          <select
            value={durationMs}
            disabled={running}
            title="选择练习总时长（需在开始前或重开时生效）"
            onChange={e => setDurationMs(Number(e.target.value))}
          >
            <option value={60_000}>1 分钟</option>
            <option value={300_000}>5 分钟</option>
            <option value={600_000}>10 分钟</option>
          </select>
          <button onClick={() => restart()}>开始 / 重开</button>
          <button onClick={() => { if (!game.finished && game.startedAt) { setGame(g => ({ ...g, finished: true })); stop(); } }} disabled={!game.startedAt || game.finished}>结束</button>
          <button onClick={togglePause} disabled={!game.startedAt || game.finished}>
            {paused ? '继续' : '暂停'}
          </button>
          <button onClick={() => setView(v => v === 'game' ? 'stats' : 'game')}>
            {view === 'game' ? '查看统计' : '返回练习'}
          </button>
        </div>
      </header>
      <main>
        {view === 'game' && (
          <div className="play-area">
            <div className="letter-center">
              <TypingArea
                letter={game.currentLetter}
                disabled={!game.startedAt || game.finished || paused}
                onKey={handleKey}
                finished={game.finished}
                wrong={wrong}
              />
            </div>
          </div>
        )}
        {view === 'stats' && (
          <LetterStatsPage stats={letterStats} onReset={resetLetterStats} />
        )}
      </main>
      {view === 'game' && (
        <footer className="stats-footer">
          <StatsPanel
            total={game.total}
            correct={game.correct}
            accuracy={accuracy}
            cpm={cpm}
            elapsedMs={elapsed}
            remainingMs={remainingMs}
            running={running}
          />
        </footer>
      )}
      {game.finished && !resultDismissed && (
        <div className="overlay">
          <div className="result-box enhanced">
            <div className="result-header">
              <h2>本局完成</h2>
              <p className="subtitle">做得不错，继续巩固弱项</p>
            </div>
            <div className="result-stats-row">
              <div className="stat-card">
                <span className="label">正确</span>
                <span className="value">{game.correct}</span>
              </div>
              <div className="stat-card">
                <span className="label">总数</span>
                <span className="value">{game.total}</span>
              </div>
              <div className="stat-card">
                <span className="label">准确率</span>
                <span className="value">{(accuracy * 100).toFixed(1)}%</span>
              </div>
              <div className="stat-card">
                <span className="label">CPM</span>
                <span className="value">{cpm.toFixed(1)}</span>
              </div>
            </div>
            <WeakLetters letterStats={letterStats} />
            <div className="actions">
              <button className="btn-primary" onClick={() => setResultDismissed(true)}>确定</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
