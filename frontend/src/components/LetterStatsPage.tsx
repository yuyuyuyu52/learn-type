import React from 'react';
import { LETTERS } from '../utils/letters';

export interface LetterStat {
  letter: string;
  total: number;
  correct: number;
  accuracy: number; // 0..1
}

interface Props {
  stats: Record<string, { total: number; correct: number }>; // 传入 App 的 letterStats
  onReset?: () => void; // 重置回调
}

export const LetterStatsPage: React.FC<Props> = ({ stats, onReset }) => {
  const rows: LetterStat[] = LETTERS.map(l => {
    const s = stats[l];
    const total = s.total;
    const correct = s.correct;
    const accuracy = total === 0 ? 0 : correct / total;
    return { letter: l, total, correct, accuracy };
  });

  // 排序：按 accuracy 升序，再按 total 升序（最需要练的排前）
  rows.sort((a, b) => {
    if (a.accuracy === b.accuracy) return a.total - b.total;
    return a.accuracy - b.accuracy;
  });

  const focus = rows.filter(r => r.total > 0).slice(0, 3); // 已排序后前3

  return (
    <div className="letter-stats-page">
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem'}}>
        <h2 style={{margin:'0'}}>字母练习统计</h2>
        {onReset && (
          <button style={{background:'#b03a2f'}} onClick={onReset} title="清空所有累积统计（不可撤销）">
            重置统计
          </button>
        )}
      </div>
      <p style={{marginTop: '-4px', color:'#555', fontSize:'0.85rem'}}>按“低准确率优先，其次低出现次数”排序</p>
      {focus.length > 0 && (
        <div className="weak-top3">
          <span className="weak-label">最需关注:</span>
          {focus.map(f => (
            <span key={f.letter} className="weak-chip" title={`准确率 ${(f.accuracy*100).toFixed(1)}% / 次数 ${f.total}`}>
              {f.letter}
            </span>
          ))}
        </div>
      )}
      <div className="letter-stats-table-wrapper">
        <table className="letter-stats-table">
          <thead>
            <tr>
              <th>字母</th>
              <th>正确</th>
              <th>总数</th>
              <th>准确率</th>
              <th>建议等级</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              let level: string;
              if (r.total === 0) level = '未练';
              else if (r.accuracy < 0.5) level = '紧急';
              else if (r.accuracy < 0.7) level = '加强';
              else if (r.accuracy < 0.9) level = '巩固';
              else level = '良好';
              return (
                <tr key={r.letter} className={r.accuracy < 0.5 ? 'need-focus' : ''}>
                  <td>{r.letter}</td>
                  <td>{r.correct}</td>
                  <td>{r.total}</td>
                  <td>{(r.accuracy * 100).toFixed(1)}%</td>
                  <td>{level}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{marginTop:'0.75rem', fontSize:'0.8rem', color:'#666'}}>
        <p>A=0.7 B=0.3 权重策略：低准确率与低出现次数字母将更常出现。</p>
      </div>
    </div>
  );
};
