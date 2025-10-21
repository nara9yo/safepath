/**
 * 지하철 노선 반경별 위험도 가중치 계산 유틸리티
 */
import { 
  SUBWAY_CALCULATION_THRESHOLDS, 
  getSubwayInfluenceLevel, 
  getSubwayInfluenceStyle 
} from './constants';

/**
 * 두 지점 간의 거리를 계산 (Haversine 공식)
 * @param {number} lat1 - 첫 번째 지점의 위도
 * @param {number} lng1 - 첫 번째 지점의 경도
 * @param {number} lat2 - 두 번째 지점의 위도
 * @param {number} lng2 - 두 번째 지점의 경도
 * @returns {number} 거리 (미터)
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000; // 지구 반지름 (미터)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * 지하철 노선에서 가장 가까운 지점까지의 거리 계산
 * @param {number} lat - 대상 지점의 위도
 * @param {number} lng - 대상 지점의 경도
 * @param {Array} subwayStations - 지하철 역 배열
 * @returns {number} 최단 거리 (미터)
 */
export const getDistanceToSubwayLine = (lat, lng, subwayStations) => {
  if (!subwayStations || subwayStations.length === 0) {
    return Infinity;
  }

  let minDistance = Infinity;

  // 각 역에서의 거리 계산
  subwayStations.forEach(station => {
    const distance = calculateDistance(lat, lng, station.lat, station.lng);
    minDistance = Math.min(minDistance, distance);
  });

  // 노선 구간에서의 최단 거리 계산 (연속된 역들 사이의 선분에서)
  for (let i = 0; i < subwayStations.length - 1; i++) {
    const station1 = subwayStations[i];
    const station2 = subwayStations[i + 1];
    
    // 선분에서 점까지의 최단 거리 계산
    const distance = getDistanceToLineSegment(
      lat, lng,
      station1.lat, station1.lng,
      station2.lat, station2.lng
    );
    
    minDistance = Math.min(minDistance, distance);
  }

  return minDistance;
};

/**
 * 선분에서 점까지의 최단 거리 계산
 * @param {number} px - 대상 점의 위도
 * @param {number} py - 대상 점의 경도
 * @param {number} x1 - 선분 시작점의 위도
 * @param {number} y1 - 선분 시작점의 경도
 * @param {number} x2 - 선분 끝점의 위도
 * @param {number} y2 - 선분 끝점의 경도
 * @returns {number} 최단 거리 (미터)
 */
const getDistanceToLineSegment = (px, py, x1, y1, x2, y2) => {
  // 선분의 벡터
  const dx = x2 - x1;
  const dy = y2 - y1;
  
  // 선분의 길이 제곱 (좌표 단위)
  const lengthSquared = dx * dx + dy * dy;
  
  if (lengthSquared === 0) {
    return calculateDistance(px, py, x1, y1);
  }

  // 선분 위의 점에서 대상 점까지의 최단 거리를 위한 t 값 계산
  // t는 0~1 사이의 값으로, 선분 위의 위치를 나타냄
  const t = Math.max(0, Math.min(1, 
    ((px - x1) * dx + (py - y1) * dy) / lengthSquared
  ));

  // 선분 위의 가장 가까운 점
  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;

  return calculateDistance(px, py, closestX, closestY);
};

/**
 * 지하철 노선 반경별 위험도 가중치 계산
 * @param {number} distance - 지하철 노선까지의 거리 (미터)
 * @returns {number} 가중치 (0.0 ~ 1.0)
 */
export const calculateSubwayRiskWeight = (distance) => {
  const thresholds = SUBWAY_CALCULATION_THRESHOLDS.DISTANCE_THRESHOLDS;
  const weightCalc = SUBWAY_CALCULATION_THRESHOLDS.WEIGHT_CALCULATION;
  
  if (distance <= thresholds.LEVEL1_MAX) {
    // 1차 영향권 (반경 100m): 가장 높은 가중치
    return weightCalc.LEVEL1_WEIGHT;
  } else if (distance <= thresholds.LEVEL2_MAX) {
    // 2차 영향권 (반경 100~300m): 중간 가중치
    const ratio = (distance - thresholds.LEVEL1_MAX) / (thresholds.LEVEL2_MAX - thresholds.LEVEL1_MAX);
    const [minWeight, maxWeight] = weightCalc.LEVEL2_WEIGHT_RANGE;
    return maxWeight - (ratio * (maxWeight - minWeight));
  } else if (distance <= thresholds.LEVEL3_MAX) {
    // 3차 영향권 (반경 300~500m): 낮은 가중치
    const ratio = (distance - thresholds.LEVEL2_MAX) / (thresholds.LEVEL3_MAX - thresholds.LEVEL2_MAX);
    const [minWeight, maxWeight] = weightCalc.LEVEL3_WEIGHT_RANGE;
    return maxWeight - (ratio * (maxWeight - minWeight));
  } else {
    // 영향권 밖: 가중치 없음
    return weightCalc.OUTSIDE_WEIGHT;
  }
};

/**
 * 싱크홀 데이터에 지하철 노선 가중치 적용
 * @param {Array} sinkholes - 싱크홀 배열
 * @param {Array} subwayStations - 지하철 역 배열
 * @returns {Array} 지하철 가중치가 적용된 싱크홀 배열
 */
export const applySubwayRiskWeights = (sinkholes, subwayStations) => {
  if (!sinkholes || !subwayStations || subwayStations.length === 0) {
    return sinkholes;
  }

  return sinkholes.map(sinkhole => {
    const distance = getDistanceToSubwayLine(sinkhole.lat, sinkhole.lng, subwayStations);
    const subwayWeight = calculateSubwayRiskWeight(distance);
    
    // baseRisk에 지하철 가중치를 곱하여 finalRisk 계산
    const baseRisk = Number(sinkhole.baseRisk) || 0;
    const finalRisk = baseRisk * (1 + subwayWeight);
    
    // 지하철 영향도 레벨 결정 (통합 상수 사용)
    const subwayInfluenceLevel = getSubwayInfluenceLevel(distance);
    
    return {
      ...sinkhole,
      baseRisk, // originalWeight -> baseRisk
      subwayWeight,
      subwayDistance: distance,
      finalRisk: finalRisk, // weight -> finalRisk
      hasSubwayRisk: subwayWeight > 0,
      subwayInfluenceLevel
    };
  });
};

/**
 * 지하철 노선 영향권 정보 반환
 * @param {number} distance - 지하철 노선까지의 거리 (미터)
 * @returns {Object} 영향권 정보
 */
export const getSubwayInfluenceZone = (distance) => {
  const influenceLevel = getSubwayInfluenceLevel(distance);
  const config = getSubwayInfluenceStyle(influenceLevel);
  
  return {
    zone: config.zone,
    description: config.zoneDescription,
    weight: config.weight,
    color: config.color
  };
};
