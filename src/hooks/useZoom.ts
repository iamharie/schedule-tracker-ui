import { useState } from 'react';

const ZOOM_LEVELS = [30, 60, 90, 120] as const;
type ZoomLevel = (typeof ZOOM_LEVELS)[number];

function clampToLevel(n: number): ZoomLevel {
  return (ZOOM_LEVELS.find((z) => z === n) ?? 60) as ZoomLevel;
}

export function useZoom() {
  const [hourPx, setHourPx] = useState<ZoomLevel>(() =>
    clampToLevel(Number(localStorage.getItem('st-zoom'))),
  );

  function setZoom(px: ZoomLevel) {
    setHourPx(px);
    localStorage.setItem('st-zoom', String(px));
  }

  const idx = ZOOM_LEVELS.indexOf(hourPx);

  return {
    hourPx,
    stepDown: idx > 0 ? () => setZoom(ZOOM_LEVELS[idx - 1]) : null,
    stepUp: idx < ZOOM_LEVELS.length - 1 ? () => setZoom(ZOOM_LEVELS[idx + 1]) : null,
    atMin: idx === 0,
    atMax: idx === ZOOM_LEVELS.length - 1,
  };
}
