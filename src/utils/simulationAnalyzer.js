import { getRiskLevelFromWeight, RISK_CALCULATION_THRESHOLDS } from './constants';

// 시뮬레이션 파라미터 기본값 (기본 상태에서는 기존 로직과 동일한 결과를 위해 1.0으로 설정)
export const SIMULATION_DEFAULTS = {
  SINKHOLE: {
    SIZE_WEIGHT_MULTIPLIER: 1.0,
    DAMAGE_WEIGHT_MULTIPLIER: 1.0,
    TIME_WEIGHT_MULTIPLIER: 1.0,
    FREQUENCY_WEIGHT_MULTIPLIER: 1.0
  },
  SUBWAY: {
    LEVEL1_WEIGHT: 0.8,
    LEVEL2_WEIGHT: 0.4,
    LEVEL3_WEIGHT: 0.1,
    LEVEL1_DISTANCE: 100,
    LEVEL2_DISTANCE: 300,
    LEVEL3_DISTANCE: 500
  }
};

const getSubwayInfluenceLevel = (distance, params) => {
  if (distance <= params.LEVEL1_DISTANCE) return 'level1';
  if (distance <= params.LEVEL2_DISTANCE) return 'level2';
  if (distance <= params.LEVEL3_DISTANCE) return 'level3';
  return 'none';
};

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const pointToLineSegmentDistance = (px, py, x1, y1, x2, y2) => {
  const l2 = (x1 - x2) ** 2 + (y1 - y2) ** 2;
  if (l2 === 0) return haversineDistance(px, py, x1, y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  const projectionX = x1 + t * (x2 - x1);
  const projectionY = y1 + t * (y2 - y1);
  return haversineDistance(px, py, projectionX, projectionY);
};

const findNearestSubwayLine = (lat, lng, subwayStations) => {
  let minDistance = Infinity;
  if (!subwayStations || subwayStations.length === 0) {
    return { minDistance: 5000 };
  }
  
  // 각 역에서의 거리 계산
  subwayStations.forEach((station) => {
    const stationLat = parseFloat(station.lat);
    const stationLng = parseFloat(station.lng);
    const distance = haversineDistance(lat, lng, stationLat, stationLng);
    if (distance < minDistance) minDistance = distance;
  });
  
  // 노선 구간에서의 최단 거리 계산
  for (let i = 0; i < subwayStations.length - 1; i++) {
    const start = subwayStations[i];
    const end = subwayStations[i + 1];
    if (start.line === end.line) {
      const distance = pointToLineSegmentDistance(lat, lng, parseFloat(start.lat), parseFloat(start.lng), parseFloat(end.lat), parseFloat(end.lng));
      if (distance < minDistance) minDistance = distance;
    }
  }
  
  return { minDistance: minDistance === Infinity ? 5000 : minDistance };
};

export const calculateSizeWeight = (sinkhole) => {
  const width = parseFloat(sinkhole.sinkWidth) || 0;
  const length = parseFloat(sinkhole.sinkExtend) || 0;
  const depth = parseFloat(sinkhole.sinkDepth) || 0;
  const sizeScore = width * length * depth;
  return Math.min(sizeScore * 0.1, 3);
};

export const calculateDamageWeight = (sinkhole) => {
  const damageWeights = RISK_CALCULATION_THRESHOLDS.DAMAGE_WEIGHTS;
  const rawDamageScore = (parseFloat(sinkhole.deathCnt) || 0) * damageWeights.DEATH + 
                        (parseFloat(sinkhole.injuryCnt) || 0) * damageWeights.INJURY + 
                        (parseFloat(sinkhole.vehicleCnt) || 0) * damageWeights.VEHICLE;
  const damageScore = Math.sqrt(rawDamageScore);
  const maxWeightMultiplier = RISK_CALCULATION_THRESHOLDS.CLUSTERING.MAX_WEIGHT_MULTIPLIER;
  return Math.min(damageScore * 0.6, maxWeightMultiplier);
};

export const calculateTimeWeight = (sinkhole) => {
  const dateStr = sinkhole.sagoDate || sinkhole.date;
  const timeWeights = RISK_CALCULATION_THRESHOLDS.TIME_WEIGHTS;
  let timeWeight = timeWeights.DEFAULT;
  
  if (dateStr) {
    const lastDate = new Date(dateStr);
    const now = new Date();
    const daysDiff = (now - lastDate) / (1000 * 60 * 60 * 24);
    
    if (daysDiff < 30) timeWeight = timeWeights.RECENT_30_DAYS;
    else if (daysDiff < 90) timeWeight = timeWeights.RECENT_90_DAYS;
    else if (daysDiff < 365) timeWeight = timeWeights.RECENT_365_DAYS;
  }
  
  return timeWeight;
};

export const calculateFrequencyWeight = (sinkhole) => {
  const { totalOccurrences, firstOccurrence, lastOccurrence } = sinkhole;
  let frequencyWeight = 1;

  if (firstOccurrence && lastOccurrence && totalOccurrences > 1) {
    const firstDate = new Date(firstOccurrence);
    const lastDate = new Date(lastOccurrence);
    const periodDays = (lastDate - firstDate) / (1000 * 60 * 60 * 24);

    if (periodDays > 0) {
      const frequency = totalOccurrences / (periodDays / 30); // 월당 발생률
      const maxWeightMultiplier = RISK_CALCULATION_THRESHOLDS.CLUSTERING.MAX_WEIGHT_MULTIPLIER;
      frequencyWeight = Math.min(1 + (frequency * 0.5), maxWeightMultiplier);
    }
  }
  return frequencyWeight;
};

export const calculateSimulationSubwayWeight = (distance, params) => {
  const { LEVEL1_DISTANCE, LEVEL2_DISTANCE, LEVEL3_DISTANCE, LEVEL1_WEIGHT, LEVEL2_WEIGHT, LEVEL3_WEIGHT } = params;
  if (distance <= LEVEL1_DISTANCE) return LEVEL1_WEIGHT;
  if (distance <= LEVEL2_DISTANCE) {
    const ratio = (distance - LEVEL1_DISTANCE) / (LEVEL2_DISTANCE - LEVEL1_DISTANCE);
    return LEVEL1_WEIGHT - (ratio * (LEVEL1_WEIGHT - LEVEL2_WEIGHT));
  }
  if (distance <= LEVEL3_DISTANCE) {
    const ratio = (distance - LEVEL2_DISTANCE) / (LEVEL3_DISTANCE - LEVEL2_DISTANCE);
    return LEVEL2_WEIGHT - (ratio * (LEVEL2_WEIGHT - LEVEL3_WEIGHT));
  }
  return 0.0;
};

export const generateSimulationData = (sinkholes, subwayStations, sinkholeParams, subwayParams) => {
  if (!sinkholes || !Array.isArray(sinkholes) || sinkholes.length === 0) return [];
  
  
  return sinkholes.map(sinkhole => {
    // 지하철 영향권 계산 (항상 수행)
    const lat = parseFloat(sinkhole.lat) || 0;
    const lng = parseFloat(sinkhole.lng) || 0;
    const { minDistance } = findNearestSubwayLine(lat, lng, subwayStations);
    const subwayInfluenceWeight = calculateSimulationSubwayWeight(minDistance, subwayParams);
    const subwayInfluenceLevel = getSubwayInfluenceLevel(minDistance, subwayParams);
    
    // 항상 재계산을 수행하여 일관성을 보장
    const sizeWeight = calculateSizeWeight(sinkhole);
    const damageWeight = calculateDamageWeight(sinkhole);
    const timeWeight = calculateTimeWeight(sinkhole);
    // frequencyWeight는 totalOccurrences를 기반으로 해야 하므로 아래에서 직접 계산
    
    // 클러스터링된 데이터의 발생 횟수를 baseWeight로 사용
    let baseWeight = sinkhole.totalOccurrences || 1;
    
    // frequencyWeight도 totalOccurrences를 반영해야 하지만, 
    // sinkholeAnalyzer와 동일한 로직을 적용하기 복잡하므로
    // 우선 baseWeight만 반영하여 핵심 불일치 문제 해결
    const frequencyWeight = calculateFrequencyWeight(sinkhole);

    // sinkholeAnalyzer.js의 로직과 유사하게 수정
    // (1 + sizeWeight + damageWeight) 구조를 유지하고, 여기에 사용자 파라미터를 곱함
    const sinkholeRisk = baseWeight * 
      (1 + sizeWeight * sinkholeParams.SIZE_WEIGHT_MULTIPLIER + 
       damageWeight * sinkholeParams.DAMAGE_WEIGHT_MULTIPLIER) * 
      timeWeight * sinkholeParams.TIME_WEIGHT_MULTIPLIER * 
      frequencyWeight * sinkholeParams.FREQUENCY_WEIGHT_MULTIPLIER;

    const finalWeight = sinkholeRisk * (1 + subwayInfluenceWeight);
    
    const riskLevel = getRiskLevelFromWeight(finalWeight);
    
    return {
      ...sinkhole,
      시군구: sinkhole.sigungu || '알수없음',
      읍면동: sinkhole.dong || '알수없음',
      finalWeight,
      riskLevel,
      priority: Math.min(Math.max(finalWeight, 1), 10),
      subwayInfluenceLevel,
      subwayDistance: minDistance,
      // 싱크홀 목록과 동일한 표시를 위한 정보 추가
      sinkholeRisk: sinkholeRisk, // 순수 싱크홀 위험도 추가
      subwayWeight: subwayInfluenceWeight
    };
  }).filter(s => s.finalWeight !== undefined && !isNaN(s.finalWeight) && isFinite(s.finalWeight));
};

export const calculateTopRiskSinkholes = (simulationData) => {
  if (!simulationData || simulationData.length === 0) return [];
  
  return simulationData
    .map(sinkhole => {
      // 싱크홀 크기 정보 계산
      const width = parseFloat(sinkhole.sinkWidth) || 0;
      const length = parseFloat(sinkhole.sinkExtend) || 0;
      const depth = parseFloat(sinkhole.sinkDepth) || 0;
      
      // 최대 규모를 "폭 x 연장 x 깊이" 형식으로 표시
      const maxSizeText = (width > 0 || length > 0 || depth > 0) 
        ? `${width.toFixed(1)}m x ${length.toFixed(1)}m x ${depth.toFixed(1)}m`
        : 'N/A';
      
      return {
        id: sinkhole.id || `${sinkhole.lat}_${sinkhole.lng}`,
        name: sinkhole.name || sinkhole.사고명 || '알수없음',
        location: sinkhole.address || `${sinkhole.sigungu || '알수없음'} ${sinkhole.dong || '알수없음'}`,
        lat: sinkhole.lat, // 좌표 정보 추가
        lng: sinkhole.lng, // 좌표 정보 추가
        address: sinkhole.address, // 주소 정보 추가
        finalWeight: sinkhole.finalWeight, // finalWeight 추가
        sinkholeRisk: sinkhole.sinkholeRisk, // sinkholeRisk 추가
        riskLevel: sinkhole.riskLevel,
        subwayInfluenceLevel: sinkhole.subwayInfluenceLevel,
        subwayDistance: sinkhole.subwayDistance,
        maxSize: maxSizeText,
        date: sinkhole.sagoDate || sinkhole.사고일시 || '알수없음',
        subwayWeight: sinkhole.subwayWeight || 0
      };
    })
    .sort((a, b) => b.finalWeight - a.finalWeight) // risk -> finalWeight
    .slice(0, 5);
};

export const calculateSimulationStats = (simulationData) => {
  if (!simulationData || simulationData.length === 0) {
    return { totalCount: 0, weightStats: { avg: 0, max: 0, min: 0 }, riskDistribution: { low: 0, medium: 0, high: 0, critical: 0 }, subwayInfluenceDistribution: { level1: 0, level2: 0, level3: 0, none: 0 }, topRiskSinkholes: [] };
  }
  const weights = simulationData.map(s => s.finalWeight);
  const totalCount = simulationData.length;
  const riskDistribution = { low: 0, medium: 0, high: 0, critical: 0 };
  const subwayInfluenceDistribution = { level1: 0, level2: 0, level3: 0, none: 0 };
  simulationData.forEach(sinkhole => {
    riskDistribution[sinkhole.riskLevel]++;
    subwayInfluenceDistribution[sinkhole.subwayInfluenceLevel]++;
  });
  const weightStats = {
    avg: weights.reduce((sum, val) => sum + val, 0) / totalCount,
    max: Math.max(...weights),
    min: Math.min(...weights)
  };
  return { totalCount, riskDistribution, weightStats, subwayInfluenceDistribution, topRiskSinkholes: calculateTopRiskSinkholes(simulationData) };
};
