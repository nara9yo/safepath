// 경로상 싱크홀 감지 함수
export const detectSinkholesOnRoute = (route, sinkholes, radius = 0.05) => { // 50m = 0.05km
  const detectedSinkholes = [];
  
  console.log('🔍 싱크홀 감지 시작:', { 
    routePoints: route.length, 
    totalSinkholes: sinkholes.length, 
    radius: radius + 'km' 
  });
  
  // 각 경로 구간에 대해 싱크홀과의 거리 확인
  for (let i = 0; i < route.length - 1; i++) {
    const start = route[i];
    const end = route[i + 1];
    
    sinkholes.forEach(sinkhole => {
      // 싱크홀이 경로 구간 근처에 있는지 확인
      const distance = calculateDistanceToLine(start, end, sinkhole);
      
      if (distance <= radius) {
        // 중복 제거
        if (!detectedSinkholes.find(s => s.id === sinkhole.id)) {
          console.log('⚠️ 싱크홀 감지:', { 
            id: sinkhole.id, 
            name: sinkhole.name, 
            distance: (distance * 1000).toFixed(1) + 'm' 
          });
          detectedSinkholes.push(sinkhole);
        }
      }
    });
  }
  
  console.log('✅ 싱크홀 감지 완료:', detectedSinkholes.length + '개');
  return detectedSinkholes;
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

