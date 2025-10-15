// 경로상 싱크홀 감지 함수 (가중치 고려)
export const detectSinkholesOnRoute = (route, sinkholes, radius = 0.05) => { // 50m = 0.05km
  const detectedSinkholes = [];
  let totalRiskScore = 0;
  
  console.log('🔍 싱크홀 감지 시작:', { 
    routePoints: route.length, 
    totalSinkholes: sinkholes.length, 
    radius: radius + 'km' 
  });
  
  // 각 경로 구간에 대해 싱크홀과의 거리 확인
  for (let i = 0; i < route.length - 1; i++) {
    const start = route[i];
    const end = route[i + 1];

    for (let j = 0; j < sinkholes.length; j++) {
      const sinkhole = sinkholes[j];
      // 싱크홀이 경로 구간 근처에 있는지 확인
      const distance = calculateDistanceToLine(start, end, sinkhole);

      if (distance <= radius) {
        // 중복 제거
        if (!detectedSinkholes.find(s => s.id === sinkhole.id)) {
          // 가중치를 고려한 위험도 점수 계산
          const riskScore = calculateSinkholeRiskScore(sinkhole, distance, radius);
          totalRiskScore += riskScore;

          console.log('⚠️ 싱크홀 감지:', {
            id: sinkhole.id,
            name: sinkhole.name,
            distance: (distance * 1000).toFixed(1) + 'm',
            weight: sinkhole.weight || 1,
            riskScore: riskScore.toFixed(2),
            riskLevel: sinkhole.riskLevel || 'low'
          });

          detectedSinkholes.push({
            ...sinkhole,
            riskScore,
            distanceFromRoute: distance
          });
        }
      }
    }
  }
  
  // 경로 전체의 위험도 평가
  const routeRiskLevel = evaluateRouteRiskLevel(totalRiskScore, detectedSinkholes.length);
  
  console.log('✅ 싱크홀 감지 완료:', {
    count: detectedSinkholes.length,
    totalRiskScore: totalRiskScore.toFixed(2),
    routeRiskLevel
  });
  
  return {
    sinkholes: detectedSinkholes,
    totalRiskScore,
    routeRiskLevel,
    riskSummary: generateRiskSummary(detectedSinkholes, totalRiskScore)
  };
};

// 점과 선분 사이의 최단 거리 계산
const calculateDistanceToLine = (lineStart, lineEnd, point) => {
  const A = point.lat - lineStart.lat;
  const B = point.lng - lineStart.lng;
  const C = lineEnd.lat - lineStart.lat;
  const D = lineEnd.lng - lineStart.lng;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  
  if (lenSq === 0) {
    // 선분이 점인 경우
    return calculateDistance(lineStart.lat, lineStart.lng, point.lat, point.lng);
  }
  
  const param = dot / lenSq;
  
  let xx, yy;
  
  if (param < 0) {
    xx = lineStart.lat;
    yy = lineStart.lng;
  } else if (param > 1) {
    xx = lineEnd.lat;
    yy = lineEnd.lng;
  } else {
    xx = lineStart.lat + param * C;
    yy = lineStart.lng + param * D;
  }
  
  return calculateDistance(point.lat, point.lng, xx, yy);
};

// 두 좌표 간 거리 계산 (Haversine 공식)
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // 지구 반지름 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * 싱크홀의 위험도 점수를 계산 (거리와 가중치 고려)
 * @param {Object} sinkhole - 싱크홀 객체
 * @param {number} distance - 경로로부터의 거리 (km)
 * @param {number} maxRadius - 최대 감지 반경 (km)
 * @returns {number} 위험도 점수
 */
const calculateSinkholeRiskScore = (sinkhole, distance, maxRadius) => {
  // 기본 가중치 (발생 횟수, 크기, 피해 등이 반영된 값)
  const baseWeight = sinkhole.weight || 1;
  
  // 거리 가중치 (가까울수록 높은 점수)
  const distanceWeight = Math.max(0, 1 - (distance / maxRadius));
  
  // 위험도 등급별 추가 가중치
  const riskLevelMultiplier = {
    'low': 1,
    'medium': 1.5,
    'high': 2.5,
    'critical': 4
  };
  
  const levelMultiplier = riskLevelMultiplier[sinkhole.riskLevel] || 1;
  
  // 반복 발생 가중치
  const occurrenceMultiplier = sinkhole.totalOccurrences > 1 ? 
    Math.min(1 + (sinkhole.totalOccurrences - 1) * 0.3, 2) : 1;
  
  // 최종 위험도 점수
  const riskScore = baseWeight * distanceWeight * levelMultiplier * occurrenceMultiplier;
  
  return Math.round(riskScore * 100) / 100;
};

/**
 * 경로 전체의 위험도 등급을 평가
 * @param {number} totalRiskScore - 총 위험도 점수
 * @param {number} sinkholeCount - 감지된 싱크홀 수
 * @returns {string} 위험도 등급
 */
const evaluateRouteRiskLevel = (totalRiskScore, sinkholeCount) => {
  if (sinkholeCount === 0) return 'safe';
  
  // 싱크홀 수에 따른 기본 위험도
  let baseLevel = 'low';
  if (sinkholeCount >= 5) baseLevel = 'high';
  else if (sinkholeCount >= 3) baseLevel = 'medium';
  
  // 총 위험도 점수에 따른 조정
  if (totalRiskScore >= 20) return 'critical';
  if (totalRiskScore >= 10) return 'high';
  if (totalRiskScore >= 5) return 'medium';
  
  return baseLevel;
};

/**
 * 위험도 요약 정보 생성
 * @param {Array} detectedSinkholes - 감지된 싱크홀 배열
 * @param {number} totalRiskScore - 총 위험도 점수
 * @returns {Object} 위험도 요약 정보
 */
const generateRiskSummary = (detectedSinkholes, totalRiskScore) => {
  const riskLevelCounts = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0
  };
  
  let totalOccurrences = 0;
  let maxWeight = 0;
  let closestDistance = Infinity;
  
  detectedSinkholes.forEach(sinkhole => {
    riskLevelCounts[sinkhole.riskLevel] = (riskLevelCounts[sinkhole.riskLevel] || 0) + 1;
    totalOccurrences += sinkhole.totalOccurrences || 1;
    maxWeight = Math.max(maxWeight, sinkhole.weight || 1);
    closestDistance = Math.min(closestDistance, sinkhole.distanceFromRoute || Infinity);
  });
  
  return {
    totalSinkholes: detectedSinkholes.length,
    totalOccurrences,
    totalRiskScore: Math.round(totalRiskScore * 100) / 100,
    riskLevelCounts,
    maxWeight: Math.round(maxWeight * 100) / 100,
    closestDistance: closestDistance === Infinity ? null : Math.round(closestDistance * 1000), // 미터 단위
    averageRiskScore: detectedSinkholes.length > 0 ? 
      Math.round((totalRiskScore / detectedSinkholes.length) * 100) / 100 : 0
  };
};

// 우회 경로 계산 (POC용)
export const calculateDetourRoute = (start, end, sinkholes) => {
  // 싱크홀들을 피하는 중간 경유지 생성
  const waypoints = [];
  
  // 각 싱크홀에 대해 우회 경유지 생성
  sinkholes.forEach(sinkhole => {
    // 싱크홀에서 일정 거리 떨어진 위치에 경유지 생성
    const offset = 0.01; // 약 1km 정도
    const waypoint = {
      lat: sinkhole.lat + (Math.random() - 0.5) * offset,
      lng: sinkhole.lng + (Math.random() - 0.5) * offset
    };
    waypoints.push(waypoint);
  });
  
  // 시작점, 경유지들, 도착점을 순서대로 연결
  const path = [start, ...waypoints, end];
  
  // 총 거리 계산
  let totalDistance = 0;
  for (let i = 0; i < path.length - 1; i++) {
    totalDistance += calculateDistance(
      path[i].lat, path[i].lng,
      path[i + 1].lat, path[i + 1].lng
    );
  }
  
  return {
    path: path,
    distance: totalDistance,
    hasSinkholes: false,
    detectedSinkholes: sinkholes
  };
};

// 안전점검 경로 계산 (POC용)
export const calculateInspectionRoute = (start, end, allSinkholes) => {
  // 시작점과 도착점 사이의 싱크홀들만 필터링
  const relevantSinkholes = allSinkholes.filter(sinkhole => {
    const distanceFromStart = calculateDistance(start.lat, start.lng, sinkhole.lat, sinkhole.lng);
    const distanceFromEnd = calculateDistance(end.lat, end.lng, sinkhole.lat, sinkhole.lng);
    const directDistance = calculateDistance(start.lat, start.lng, end.lat, end.lng);
    
    // 시작점과 도착점 사이의 직선 거리보다 가까운 싱크홀들만 포함
    return distanceFromStart + distanceFromEnd <= directDistance * 1.5;
  });
  
  // 싱크홀들을 거리 순으로 정렬
  relevantSinkholes.sort((a, b) => {
    const distA = calculateDistance(start.lat, start.lng, a.lat, a.lng);
    const distB = calculateDistance(start.lat, start.lng, b.lat, b.lng);
    return distA - distB;
  });
  
  // 시작점, 싱크홀들, 도착점을 순서대로 연결
  const path = [start, ...relevantSinkholes.map(s => ({ lat: s.lat, lng: s.lng })), end];
  
  // 총 거리 계산
  let totalDistance = 0;
  for (let i = 0; i < path.length - 1; i++) {
    totalDistance += calculateDistance(
      path[i].lat, path[i].lng,
      path[i + 1].lat, path[i + 1].lng
    );
  }
  
  return {
    path: path,
    distance: totalDistance,
    hasSinkholes: true,
    detectedSinkholes: relevantSinkholes
  };
};

// 경로의 선분 근처(반경 km)에 있는 싱크홀 좌표를 해당 선분 구간 사이에 삽입
// 반환: { path: 새 경로, detectedSinkholes: 삽입된 싱크홀 배열 }
const getProjectionParam = (lineStart, lineEnd, point) => {
  const A = point.lat - lineStart.lat;
  const B = point.lng - lineStart.lng;
  const C = lineEnd.lat - lineStart.lat;
  const D = lineEnd.lng - lineStart.lng;
  const lenSq = C * C + D * D;
  if (lenSq === 0) return 0;
  const param = (A * C + B * D) / lenSq;
  if (param < 0) return 0;
  if (param > 1) return 1;
  return param;
};

export const injectSinkholesIntoPath = (path, sinkholes, radius = 0.05, forcedSinkholeIds) => {
  if (!Array.isArray(path) || path.length < 2) {
    return { path: Array.isArray(path) ? path.slice() : [], detectedSinkholes: [] };
  }

  // 1) 각 싱크홀에 대해 경로 전체에서 최근접 선분(인덱스 i)과 투영 위치(t) 계산
  //    그리고 그 최소 거리(minDist)가 반경 이내일 때만 채택
  const assignment = new Map(); // sinkhole.id -> { segIndex, t }
  const acceptedSinkholes = [];

  for (const s of sinkholes) {
    let best = { segIndex: -1, t: 0, minDist: Number.POSITIVE_INFINITY };
    for (let i = 0; i < path.length - 1; i++) {
      const start = path[i];
      const end = path[i + 1];
      const dist = calculateDistanceToLine(start, end, s);
      if (dist < best.minDist) {
        best.minDist = dist;
        best.segIndex = i;
        best.t = getProjectionParam(start, end, s);
      }
    }
    const mustInclude = !!(forcedSinkholeIds && forcedSinkholeIds.has && forcedSinkholeIds.has(s.id));
    if ((best.minDist <= radius || mustInclude) && best.segIndex >= 0) {
      assignment.set(s.id, { segIndex: best.segIndex, t: best.t, sinkhole: s });
      acceptedSinkholes.push(s);
    }
  }

  // 2) 세그먼트별로 삽입할 싱크홀을 그룹화하고 t 순으로 정렬
  const segmentToInsertions = new Map(); // i -> [{t, sinkhole}]
  for (const { segIndex, t, sinkhole } of assignment.values()) {
    if (!segmentToInsertions.has(segIndex)) segmentToInsertions.set(segIndex, []);
    segmentToInsertions.get(segIndex).push({ t, sinkhole });
  }
  for (const arr of segmentToInsertions.values()) {
    arr.sort((a, b) => a.t - b.t);
  }

  // 3) 경로 재구성: 각 선분 사이에 해당 선분에 배정된 싱크홀들을 순서대로 삽입
  const newPath = [path[0]];
  for (let i = 0; i < path.length - 1; i++) {
    const insertions = segmentToInsertions.get(i) || [];
    for (const ins of insertions) {
      const s = ins.sinkhole;
      const last = newPath[newPath.length - 1];
      if (!last || last.lat !== s.lat || last.lng !== s.lng) {
        newPath.push({ lat: s.lat, lng: s.lng });
      }
    }
    newPath.push(path[i + 1]);
  }

  return { path: newPath, detectedSinkholes: acceptedSinkholes };
};

// 경로 총 거리(km) 재계산
export const computePathDistance = (path) => {
  if (!Array.isArray(path) || path.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    total += calculateDistance(path[i].lat, path[i].lng, path[i + 1].lat, path[i + 1].lng);
  }
  return total;
};

