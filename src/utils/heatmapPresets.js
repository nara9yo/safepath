// 모듈: 히트맵 스펙트럼 프리셋/별칭
// 역할:
//  - 프로젝트 공통의 히트맵 팔레트 프리셋 제공
//  - 네이버 지도 HeatMap gradient 포맷([0..1] 색상 배열) 호환
//  - 프리셋 조회 유틸 제공(getGradientByName)
// 주의:
//  - gradients 별칭은 하위호환을 위한 deprecated 키 유지
//  - 신규 코드는 constants의 HEATMAP_GRADIENTS 사용 권장
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



