import React from 'react';

interface Props {
  total: number;
  correct: number;
  accuracy: number; // 0-1
  cpm: number;
  elapsedMs: number;
  remainingMs: number;
  running: boolean;
}

const formatMs = (ms: number) => {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

export const StatsPanel: React.FC<Props> = ({ total, correct, accuracy, cpm, elapsedMs, remainingMs, running }) => {
  return (
    <div className="stats-panel stats-inline" title="统计：本局实时更新">
      <span><strong>耗时</strong>: {formatMs(elapsedMs)} {running ? '' : '(暂停/未开始)'}</span>
      <span><strong>剩余</strong>: {formatMs(remainingMs)}</span>
      <span><strong>总数</strong>: {total}</span>
      <span><strong>正确</strong>: {correct}</span>
      <span><strong>准确率</strong>: {(accuracy * 100).toFixed(1)}%</span>
      <span title="CPM = Correct Characters Per Minute (每分钟正确击键数)"><strong>CPM</strong>: {cpm.toFixed(1)}</span>
      <span><strong>速度</strong>: {cpm.toFixed(1)} 字/分钟</span>
    </div>
  );
};
