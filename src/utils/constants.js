/**
 * 프로젝트 전역 상수 정의
 * 범례, 필터, 마커 등에서 사용하는 등급 표현, 색상 코드, 기준값을 일원화
 */

// ============================================================================
// 위험도 등급 정의
// ============================================================================
export const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium', 
  HIGH: 'high',
  CRITICAL: 'critical'
};

export const RISK_LEVEL_CONFIG = {
  [RISK_LEVELS.LOW]: {
    label: '낮음',
    color: '#2E7D32', // 진한 초록색
    icon: '🟢',
    description: '안전한 수준',
    shortLabel: 'L',
    weight: 1,
    size: 16,
    opacity: 0.9,
    borderColor: '#1B5E20',
    borderWidth: 2
  },
  [RISK_LEVELS.MEDIUM]: {
    label: '중간',
    color: '#E65100', // 진한 주황색
    icon: '🟠',
    description: '주의 필요',
    shortLabel: 'M',
    weight: 2,
    size: 20,
    opacity: 0.95,
    borderColor: '#BF360C',
    borderWidth: 2
  },
  [RISK_LEVELS.HIGH]: {
    label: '높음',
    color: '#C62828', // 진한 빨간색
    icon: '🔴',
    description: '위험한 수준',
    shortLabel: 'H',
    weight: 5,
    size: 24,
    opacity: 1.0,
    borderColor: '#B71C1C',
    borderWidth: 3
  },
  [RISK_LEVELS.CRITICAL]: {
    label: '치명적',
    color: '#6A1B9A', // 진한 보라색
    icon: '💥',
    description: '매우 위험',
    shortLabel: 'C',
    weight: 10,
    size: 28,
    opacity: 1.0,
    borderColor: '#4A148C',
    borderWidth: 3
  }
};

// ============================================================================
// 지하철 영향도 등급 정의
// ============================================================================
export const SUBWAY_INFLUENCE_LEVELS = {
  LEVEL1: 'level1',
  LEVEL2: 'level2',
  LEVEL3: 'level3',
  NONE: 'none'
};

export const SUBWAY_INFLUENCE_CONFIG = {
  [SUBWAY_INFLUENCE_LEVELS.LEVEL1]: {
    label: '1단계',
    color: '#DC143C', // 진한 빨간색
    icon: '1',
    description: '노선 0~100m',
    zone: '1차 영향권',
    zoneDescription: '역사 주변 즉시 지반, 상하수도·전력 등 매설물 영향이 집중되는 구간',
    weight: 1.0,
    distance: { min: 0, max: 100 },
    opacity: 0.8
  },
  [SUBWAY_INFLUENCE_LEVELS.LEVEL2]: {
    label: '2단계',
    color: '#FF6B35', // 진한 주황색
    icon: '2',
    description: '노선 100~300m',
    zone: '2차 영향권',
    zoneDescription: '굴착공사나 공동 형성 가능성이 높아 위험 중간 정도',
    weight: 0.7,
    distance: { min: 100, max: 300 },
    opacity: 0.7
  },
  [SUBWAY_INFLUENCE_LEVELS.LEVEL3]: {
    label: '3단계',
    color: '#FFD700', // 진한 금색
    icon: '3',
    description: '노선 300m~500m',
    zone: '3차 영향권',
    zoneDescription: '직접 영향은 낮지만 누적 침하 가능성이 있음',
    weight: 0.3,
    distance: { min: 300, max: 500 },
    opacity: 0.6
  },
  [SUBWAY_INFLUENCE_LEVELS.NONE]: {
    label: '영향권 밖',
    color: '#4CAF50', // 초록색
    icon: '○',
    description: '노선 500m 초과',
    zone: '영향권 밖',
    zoneDescription: '지하철 노선의 직접적인 영향 없음',
    weight: 0.0,
    distance: { min: 500, max: Infinity },
    opacity: 0.5
  }
};

// ============================================================================
// 히트맵 그라디언트 정의
// ============================================================================
export const HEATMAP_GRADIENTS = {
  // 균형 잡힌 기본 팔레트 (저위험: 청록 → 고위험: 적보라)
  DEFAULT: [
    'rgba(0, 255, 255, 0)',
    'rgba(0, 255, 255, 1)',
    'rgba(0, 191, 255, 1)',
    'rgba(0, 127, 255, 1)',
    'rgba(0, 63, 255, 1)',
    'rgba(0, 0, 255, 1)',
    'rgba(127, 0, 255, 1)',
    'rgba(191, 0, 255, 1)',
    'rgba(255, 0, 191, 1)',
    'rgba(255, 0, 127, 1)',
    'rgba(255, 0, 63, 1)',
    'rgba(255, 0, 0, 1)'
  ],

  // 위험도 중심(가독성 높은 고대비) 팔레트
  SEVERITY: [
    'rgba(0, 0, 0, 0)',
    'rgba(0, 255, 170, 0.9)',
    'rgba(255, 230, 0, 0.95)',
    'rgba(255, 145, 0, 1)',
    'rgba(244, 67, 54, 1)',
    'rgba(156, 39, 176, 1)'
  ],

  // 최근성 중심(최근일수록 따뜻한 색)
  RECENTNESS: [
    'rgba(0, 0, 0, 0)',
    'rgba(120, 144, 156, 0.9)',
    'rgba(3, 169, 244, 0.95)',
    'rgba(0, 188, 212, 1)',
    'rgba(255, 193, 7, 1)',
    'rgba(244, 67, 54, 1)'
  ],

  // 색각 이상 친화 팔레트(Deuteranopia-friendly)
  COLOR_BLIND: [
    'rgba(0, 0, 0, 0)',
    'rgba(102, 194, 165, 1)',
    'rgba(252, 141, 98, 1)',
    'rgba(141, 160, 203, 1)',
    'rgba(231, 138, 195, 1)',
    'rgba(166, 216, 84, 1)'
  ],

  // 고대비(저사양 모드 권장): 단계 수 축소
  HIGH_CONTRAST: [
    'rgba(0, 0, 0, 0)',
    'rgba(0, 200, 255, 1)',
    'rgba(255, 220, 0, 1)',
    'rgba(255, 0, 0, 1)'
  ]
};

// ============================================================================
// 위험도 계산 기준값
// ============================================================================
export const RISK_CALCULATION_THRESHOLDS = {
  // 위험도 등급별 가중치 임계값
  WEIGHT_THRESHOLDS: {
    [RISK_LEVELS.LOW]: 0,
    [RISK_LEVELS.MEDIUM]: 2,
    [RISK_LEVELS.HIGH]: 5,
    [RISK_LEVELS.CRITICAL]: 10
  },
  
  // 피해 가중치 점수
  DAMAGE_WEIGHTS: {
    DEATH: 12,
    INJURY: 3,
    VEHICLE: 1
  },
  
  // 시간 가중치 (일 단위)
  TIME_WEIGHTS: {
    RECENT_30_DAYS: 1.5,
    RECENT_90_DAYS: 1.3,
    RECENT_365_DAYS: 1.1,
    DEFAULT: 1.0
  },
  
  // 클러스터링 설정
  CLUSTERING: {
    RADIUS_KM: 0.01, // 10m
    MAX_WEIGHT_MULTIPLIER: 3
  }
};

// ============================================================================
// 지하철 영향도 계산 기준값
// ============================================================================
export const SUBWAY_CALCULATION_THRESHOLDS = {
  // 거리별 영향권 임계값 (미터)
  DISTANCE_THRESHOLDS: {
    LEVEL1_MAX: 100,
    LEVEL2_MAX: 300,
    LEVEL3_MAX: 500
  },
  
  // 가중치 계산 공식
  WEIGHT_CALCULATION: {
    LEVEL1_WEIGHT: 1.0,
    LEVEL2_WEIGHT_RANGE: [0.4, 1.0], // 100m~300m에서 0.4~1.0으로 선형 감소
    LEVEL3_WEIGHT_RANGE: [0.1, 0.4], // 300m~500m에서 0.1~0.4로 선형 감소
    OUTSIDE_WEIGHT: 0.0
  }
};

// ============================================================================
// 시각적 스타일 상수
// ============================================================================
export const VISUAL_STYLES = {
  // 마커 기본 스타일
  MARKER: {
    BASE_SIZE: 16,
    SIZE_MULTIPLIER: {
      LOW: 1.0,
      MEDIUM: 1.25,
      HIGH: 1.5,
      CRITICAL: 1.75
    },
    OCCURRENCE_MULTIPLIER: 0.3, // 반복 발생 시 크기 증가율
    MAX_OCCURRENCE_MULTIPLIER: 2.5
  },
  
  // 애니메이션 효과
  ANIMATION: {
    PULSE_DURATION: 2000, // 2초
    GLOW_INTENSITY: {
      HIGH: '0 0 10px rgba(198,40,40,0.6)',
      CRITICAL: '0 0 12px rgba(106,27,154,0.8)'
    }
  },
  
  // 범례 스타일
  LEGEND: {
    BAR_WIDTH: 280,
    BAR_HEIGHT: 10,
    FONT_SIZE: {
      TITLE: 12,
      LABEL: 11,
      DESCRIPTION: 10
    }
  }
};

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * 위험도 등급에 따른 시각적 스타일 반환
 * @param {string} riskLevel - 위험도 등급
 * @param {number} totalOccurrences - 총 발생 횟수
 * @returns {Object} 시각적 스타일 정보
 */
export const getRiskLevelStyle = (riskLevel, totalOccurrences = 1) => {
  const config = RISK_LEVEL_CONFIG[riskLevel] || RISK_LEVEL_CONFIG[RISK_LEVELS.LOW];
  
  // 발생 횟수에 따른 크기 조정
  const occurrenceMultiplier = Math.min(
    1 + (totalOccurrences - 1) * VISUAL_STYLES.MARKER.OCCURRENCE_MULTIPLIER,
    VISUAL_STYLES.MARKER.MAX_OCCURRENCE_MULTIPLIER
  );
  
  return {
    ...config,
    size: Math.round(config.size * occurrenceMultiplier),
    borderWidth: totalOccurrences > 1 ? Math.max(config.borderWidth + 2, 4) : config.borderWidth,
    borderColor: totalOccurrences > 1 ? '#000000' : config.borderColor,
    pulse: riskLevel === RISK_LEVELS.CRITICAL || riskLevel === RISK_LEVELS.HIGH,
    shadow: totalOccurrences > 1 ? '0 0 8px rgba(0,0,0,0.6)' : '0 2px 6px rgba(0,0,0,0.3)',
    glow: riskLevel === RISK_LEVELS.CRITICAL ? VISUAL_STYLES.ANIMATION.GLOW_INTENSITY.CRITICAL :
          riskLevel === RISK_LEVELS.HIGH ? VISUAL_STYLES.ANIMATION.GLOW_INTENSITY.HIGH : 'none'
  };
};

/**
 * 지하철 영향도에 따른 시각적 스타일 반환
 * @param {string} influenceLevel - 지하철 영향도 등급
 * @returns {Object} 시각적 스타일 정보
 */
export const getSubwayInfluenceStyle = (influenceLevel) => {
  return SUBWAY_INFLUENCE_CONFIG[influenceLevel] || SUBWAY_INFLUENCE_CONFIG[SUBWAY_INFLUENCE_LEVELS.NONE];
};

/**
 * 거리에 따른 지하철 영향도 등급 결정
 * @param {number} distance - 지하철 노선까지의 거리 (미터)
 * @returns {string} 영향도 등급
 */
export const getSubwayInfluenceLevel = (distance) => {
  const thresholds = SUBWAY_CALCULATION_THRESHOLDS.DISTANCE_THRESHOLDS;
  
  if (distance <= thresholds.LEVEL1_MAX) {
    return SUBWAY_INFLUENCE_LEVELS.LEVEL1;
  } else if (distance <= thresholds.LEVEL2_MAX) {
    return SUBWAY_INFLUENCE_LEVELS.LEVEL2;
  } else if (distance <= thresholds.LEVEL3_MAX) {
    return SUBWAY_INFLUENCE_LEVELS.LEVEL3;
  } else {
    return SUBWAY_INFLUENCE_LEVELS.NONE;
  }
};

/**
 * 가중치에 따른 위험도 등급 결정
 * @param {number} weight - 계산된 가중치
 * @returns {string} 위험도 등급
 */
export const getRiskLevelFromWeight = (weight) => {
  const thresholds = RISK_CALCULATION_THRESHOLDS.WEIGHT_THRESHOLDS;
  
  if (weight >= thresholds[RISK_LEVELS.CRITICAL]) {
    return RISK_LEVELS.CRITICAL;
  } else if (weight >= thresholds[RISK_LEVELS.HIGH]) {
    return RISK_LEVELS.HIGH;
  } else if (weight >= thresholds[RISK_LEVELS.MEDIUM]) {
    return RISK_LEVELS.MEDIUM;
  } else {
    return RISK_LEVELS.LOW;
  }
};

/**
 * 히트맵 그라디언트 반환
 * @param {string} gradientName - 그라디언트 이름
 * @returns {Array} 그라디언트 색상 배열
 */
export const getHeatmapGradient = (gradientName = 'SEVERITY') => {
  return HEATMAP_GRADIENTS[gradientName] || HEATMAP_GRADIENTS.SEVERITY;
};

/**
 * 모든 위험도 등급 옵션 반환 (필터용)
 * @returns {Array} 위험도 등급 옵션 배열
 */
export const getRiskLevelOptions = () => {
  return Object.values(RISK_LEVELS).map(level => ({
    value: level,
    ...RISK_LEVEL_CONFIG[level]
  }));
};

/**
 * 모든 지하철 영향도 등급 옵션 반환 (필터용)
 * @returns {Array} 지하철 영향도 등급 옵션 배열
 */
export const getSubwayInfluenceOptions = () => {
  return Object.values(SUBWAY_INFLUENCE_LEVELS)
    .filter(level => level !== SUBWAY_INFLUENCE_LEVELS.NONE) // 영향권 밖은 필터에서 제외
    .map(level => ({
      value: level,
      ...SUBWAY_INFLUENCE_CONFIG[level]
    }));
};
