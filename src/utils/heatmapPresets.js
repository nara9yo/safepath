// 히트맵 스펙트럼 프리셋 정의
// 네이버 지도 HeatMap의 gradient는 [0..1] 구간의 색상 배열로 지정됩니다.
import { HEATMAP_GRADIENTS, getHeatmapGradient } from './constants';

// 기존 호환성을 위한 별칭 (deprecated)
export const gradients = {
  default: HEATMAP_GRADIENTS.DEFAULT,
  severity: HEATMAP_GRADIENTS.SEVERITY,
  recentness: HEATMAP_GRADIENTS.RECENTNESS,
  colorBlind: HEATMAP_GRADIENTS.COLOR_BLIND,
  highContrast: HEATMAP_GRADIENTS.HIGH_CONTRAST
};

export const getGradientByName = (name) => {
  return getHeatmapGradient(name);
};



