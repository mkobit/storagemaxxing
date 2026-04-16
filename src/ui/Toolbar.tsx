import React from 'react';
import { useStore } from '../store/useStore';

export const Toolbar: React.FC = () => {
  const mode = useStore((state) => state.mode);
  const setMode = useStore((state) => state.setMode);

  return (
    <div style={{ padding: '1rem', display: 'flex', gap: '1rem', background: '#eee' }}>
      <button
        style={{ fontWeight: mode === 'select' ? 'bold' : 'normal' }}
        onClick={() => setMode('select')}
      >
        Select
      </button>
      <button
        style={{ fontWeight: mode === 'two_point_rect' ? 'bold' : 'normal' }}
        onClick={() => setMode('two_point_rect')}
      >
        2-Point Rectangle
      </button>
      <button
        style={{ fontWeight: mode === 'center_rect' ? 'bold' : 'normal' }}
        onClick={() => setMode('center_rect')}
      >
        Center Rectangle
      </button>
    </div>
  );
};
