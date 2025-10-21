/**
 * 지하철 노선 반경별 위험도 가중치 계산 유틸리티
 */

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
  // 선분의 길이
  const lineLength = calculateDistance(x1, y1, x2, y2);
  
  if (lineLength === 0) {
    return calculateDistance(px, py, x1, y1);
  }

  // 선분 위의 점에서 대상 점까지의 거리 계산
  const t = Math.max(0, Math.min(1, 
    ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / (lineLength * lineLength)
  ));

  const closestX = x1 + t * (x2 - x1);
  const closestY = y1 + t * (y2 - y1);

  return calculateDistance(px, py, closestX, closestY);
};

/**
 * 지하철 노선 반경별 위험도 가중치 계산
 * @param {number} distance - 지하철 노선까지의 거리 (미터)
 * @returns {number} 가중치 (0.0 ~ 1.0)
 */
export const calculateSubwayRiskWeight = (distance) => {
  if (distance <= 100) {
    // 1차 영향권 (반경 100m): 가장 높은 가중치
    return 1.0;
  } else if (distance <= 300) {
    // 2차 영향권 (반경 100~300m): 중간 가중치
    const ratio = (distance - 100) / 200; // 0~1 사이의 비율
    return 1.0 - (ratio * 0.6); // 1.0에서 0.4까지 선형 감소
  } else if (distance <= 500) {
    // 3차 영향권 (반경 300~500m): 낮은 가중치
    const ratio = (distance - 300) / 200; // 0~1 사이의 비율
    return 0.4 - (ratio * 0.3); // 0.4에서 0.1까지 선형 감소
  } else {
    // 영향권 밖: 가중치 없음
    return 0.0;
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
    
    // 기존 가중치에 지하철 가중치를 곱하여 적용
    const originalWeight = Number(sinkhole.weight) || 0;
    const enhancedWeight = originalWeight * (1 + subwayWeight);
    
    return {
      ...sinkhole,
      originalWeight,
      subwayWeight,
      subwayDistance: distance,
      weight: enhancedWeight,
      hasSubwayRisk: subwayWeight > 0
    };
  });
};

/**
 * 지하철 노선 영향권 정보 반환
 * @param {number} distance - 지하철 노선까지의 거리 (미터)
 * @returns {Object} 영향권 정보
 */
export const getSubwayInfluenceZone = (distance) => {
  if (distance <= 100) {
    return {
      zone: '1차 영향권',
      description: '역사 주변 즉시 지반, 상하수도·전력 등 매설물 영향이 집중되는 구간',
      weight: 1.0,
      color: '#F44336'
    };
  } else if (distance <= 300) {
    return {
      zone: '2차 영향권',
      description: '굴착공사나 공동 형성 가능성이 높아 위험 중간 정도',
      weight: 0.7,
      color: '#FF9800'
    };
  } else if (distance <= 500) {
    return {
      zone: '3차 영향권',
      description: '직접 영향은 낮지만 누적 침하 가능성이 있음',
      weight: 0.3,
      color: '#FFC107'
    };
  } else {
    return {
      zone: '영향권 밖',
      description: '지하철 노선의 직접적인 영향 없음',
      weight: 0.0,
      color: '#4CAF50'
    };
  }
};
