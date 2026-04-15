import React, { useEffect } from 'react';
import { Toolbar } from './Toolbar';
import { SketchCanvas } from './SketchCanvas';
import { SketchList } from './SketchList';
import { useStore } from '../store/useStore';
import { createSketch2D } from '../assembly/Sketch2D';
import { createSketchId } from '../assembly/SketchId';

export const App: React.FC = () => {
  const hasHydrated = useStore((state) => state._hasHydrated);
  const sketches = useStore((state) => state.sketches);
  const addSketch = useStore((state) => state.addSketch);

  useEffect(() => {
    if (hasHydrated && sketches.length === 0) {
      addSketch(createSketch2D(createSketchId(), 'Sketch 1', []));
    }
  }, [hasHydrated, sketches.length, addSketch]);

  if (!hasHydrated) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Toolbar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <SketchList />
        <div style={{ padding: '1rem', flex: 1, overflow: 'auto' }}>
          <SketchCanvas />
        </div>
      </div>
    </div>
  );
};
