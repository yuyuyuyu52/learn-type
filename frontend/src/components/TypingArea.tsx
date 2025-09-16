import React, { useEffect } from 'react';

interface Props {
  letter: string;
  disabled: boolean;
  finished: boolean;
  wrong: boolean; // 当前字母是否处于错误状态
  onKey: (key: string) => void;
}

export const TypingArea: React.FC<Props> = ({ letter, disabled, onKey, finished, wrong }) => {

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (disabled) return;
      const key = e.key.toLowerCase();
      if (!/^[a-z]$/.test(key)) return;
      onKey(key);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [disabled, letter, onKey]);

  return (
    <div className="typing-wrapper">
      <div className={`letter-display ${wrong ? 'wrong' : ''} ${finished ? 'finished' : ''}`}>
        {letter}
      </div>
      {disabled && !finished && <p className="hint">点击 “开始 / 重开” 开始练习</p>}
      {finished && <p className="hint">已结束，可重开</p>}
    </div>
  );
};
