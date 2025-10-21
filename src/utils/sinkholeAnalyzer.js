// 싱크홀 분석 및 가중치 계산 유틸리티
import { 
  RISK_CALCULATION_THRESHOLDS, 
  getRiskLevelFromWeight, 
  getRiskLevelStyle 
} from './constants';

/**
 * 두 좌표 간의 거리를 계산 (Haversine 공식)
 * @param {number} lat1 - 첫 번째 지점의 위도
 * @param {number} lng1 - 첫 번째 지점의 경도
 * @param {number} lat2 - 두 번째 지점의 위도
 * @param {number} lng2 - 두 번째 지점의 경도
 * @returns {number} 거리 (km)
 */
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
 * 같은 지점에서 발생한 싱크홀들을 그룹화
 * @param {Array} sinkholes - 싱크홀 데이터 배열
 * @param {number} clusterRadius - 클러스터링 반경 (km, 기본값: 0.01km = 10m)
 * @returns {Array} 그룹화된 싱크홀 데이터
 */
export const clusterSinkholes = (sinkholes, clusterRadius = 0.01) => {
  if (!sinkholes || sinkholes.length === 0) return [];
  
  const clusters = [];
  const processed = new Set();
  
  sinkholes.forEach((sinkhole, index) => {
    if (processed.has(index)) return;
    
    const cluster = {
      id: `${sinkhole.id || index}`,
      occurrences: [sinkhole],
      centerLat: sinkhole.lat,
      centerLng: sinkhole.lng,
      totalOccurrences: 1,
      firstOccurrence: sinkhole.sagoDate || sinkhole.date,
      lastOccurrence: sinkhole.sagoDate || sinkhole.date,
      maxSize: {
        width: sinkhole.sinkWidth || 0,
        extend: sinkhole.sinkExtend || 0,
        depth: sinkhole.sinkDepth || 0
      },
      totalDamage: {
        deaths: sinkhole.deathCnt || 0,
        injuries: sinkhole.injuryCnt || 0,
        vehicles: sinkhole.vehicleCnt || 0
      },
      addresses: [sinkhole.address].filter(Boolean),
      details: [sinkhole.sagoDetail].filter(Boolean)
    };
    
    // 같은 클러스터에 속할 수 있는 다른 싱크홀들 찾기
    sinkholes.forEach((otherSinkhole, otherIndex) => {
      if (otherIndex === index || processed.has(otherIndex)) return;
      
      const distance = calculateDistance(
        sinkhole.lat, sinkhole.lng,
        otherSinkhole.lat, otherSinkhole.lng
      );
      
      if (distance <= clusterRadius) {
        cluster.occurrences.push(otherSinkhole);
        cluster.totalOccurrences++;
        processed.add(otherIndex);
        
        // 중심점 재계산 (가중평균)
        cluster.centerLat = (cluster.centerLat * (cluster.totalOccurrences - 1) + otherSinkhole.lat) / cluster.totalOccurrences;
        cluster.centerLng = (cluster.centerLng * (cluster.totalOccurrences - 1) + otherSinkhole.lng) / cluster.totalOccurrences;
        
        // 최대 크기 업데이트
        if (otherSinkhole.sinkWidth > cluster.maxSize.width) cluster.maxSize.width = otherSinkhole.sinkWidth;
        if (otherSinkhole.sinkExtend > cluster.maxSize.extend) cluster.maxSize.extend = otherSinkhole.sinkExtend;
        if (otherSinkhole.sinkDepth > cluster.maxSize.depth) cluster.maxSize.depth = otherSinkhole.sinkDepth;
        
        // 피해 누적
        cluster.totalDamage.deaths += otherSinkhole.deathCnt || 0;
        cluster.totalDamage.injuries += otherSinkhole.injuryCnt || 0;
        cluster.totalDamage.vehicles += otherSinkhole.vehicleCnt || 0;
        
        // 주소 및 상세정보 수집
        if (otherSinkhole.address && !cluster.addresses.includes(otherSinkhole.address)) {
          cluster.addresses.push(otherSinkhole.address);
        }
        if (otherSinkhole.sagoDetail && !cluster.details.includes(otherSinkhole.sagoDetail)) {
          cluster.details.push(otherSinkhole.sagoDetail);
        }
        
        // 발생일자 범위 업데이트
        const otherDate = otherSinkhole.sagoDate || otherSinkhole.date;
        if (otherDate) {
          if (!cluster.firstOccurrence || otherDate < cluster.firstOccurrence) {
            cluster.firstOccurrence = otherDate;
          }
          if (!cluster.lastOccurrence || otherDate > cluster.lastOccurrence) {
            cluster.lastOccurrence = otherDate;
          }
        }
      }
    });
    
    processed.add(index);
    clusters.push(cluster);
  });
  
  return clusters;
};

/**
 * 싱크홀 클러스터의 위험도 가중치를 계산
 * @param {Object} cluster - 싱크홀 클러스터 객체
 * @returns {Object} 가중치 정보
 */
export const calculateSinkholeWeight = (cluster) => {
  const {
    totalOccurrences,
    maxSize,
    totalDamage,
    firstOccurrence,
    lastOccurrence
  } = cluster;
  
  // 기본 가중치 (발생 횟수 기반)
  let baseWeight = totalOccurrences;
  
  // 크기 가중치 (가장 큰 싱크홀의 크기)
  const sizeScore = (maxSize.width * maxSize.extend * maxSize.depth) || 0;
  const sizeWeight = Math.min(sizeScore * 0.1, 3); // 최대 3배 가중치
  
  // 피해 가중치 (데이터 명세 반영)
  // - 사망: 12점, 부상: 3점, 차량피해: 1점으로 스코어링
  // - 점수의 루트를 취해 대형 사고에 편향되지 않도록 안정화, 상한 강화(최대 3배)
  const damageWeights = RISK_CALCULATION_THRESHOLDS.DAMAGE_WEIGHTS;
  const rawDamageScore = (totalDamage.deaths * damageWeights.DEATH) + 
                        (totalDamage.injuries * damageWeights.INJURY) + 
                        (totalDamage.vehicles * damageWeights.VEHICLE);
  const damageScore = Math.sqrt(rawDamageScore);
  const maxWeightMultiplier = RISK_CALCULATION_THRESHOLDS.CLUSTERING.MAX_WEIGHT_MULTIPLIER;
  const damageWeight = Math.min(damageScore * 0.6, maxWeightMultiplier);
  
  // 시간 가중치 (최근 발생일수록 높은 가중치)
  const timeWeights = RISK_CALCULATION_THRESHOLDS.TIME_WEIGHTS;
  let timeWeight = timeWeights.DEFAULT;
  if (lastOccurrence) {
    const lastDate = new Date(lastOccurrence);
    const now = new Date();
    const daysDiff = (now - lastDate) / (1000 * 60 * 60 * 24);
    
    if (daysDiff < 30) timeWeight = timeWeights.RECENT_30_DAYS;
    else if (daysDiff < 90) timeWeight = timeWeights.RECENT_90_DAYS;
    else if (daysDiff < 365) timeWeight = timeWeights.RECENT_365_DAYS;
  }
  
  // 반복 발생 가중치 (짧은 기간에 여러 번 발생하면 높은 가중치)
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
  
  // 최종 가중치 계산
  const finalWeight = baseWeight * (1 + sizeWeight + damageWeight) * timeWeight * frequencyWeight;
  
  // 위험도 등급 결정 (통합 상수 사용)
  const riskLevel = getRiskLevelFromWeight(finalWeight);
  
  return {
    weight: Math.round(finalWeight * 100) / 100,
    baseWeight,
    sizeWeight: Math.round(sizeWeight * 100) / 100,
    damageWeight: Math.round(damageWeight * 100) / 100,
    timeWeight: Math.round(timeWeight * 100) / 100,
    frequencyWeight: Math.round(frequencyWeight * 100) / 100,
    riskLevel,
    priority: Math.min(Math.max(finalWeight, 1), 10) // 1-10 범위로 정규화
  };
};

/**
 * 싱크홀 데이터에 가중치 정보를 추가하여 반환
 * @param {Array} sinkholes - 원본 싱크홀 데이터
 * @param {number} clusterRadius - 클러스터링 반경
 * @returns {Array} 가중치가 추가된 싱크홀 데이터
 */
export const enhanceSinkholesWithWeight = (sinkholes, clusterRadius = 0.01) => {
  if (!sinkholes || sinkholes.length === 0) return [];
  
  // 싱크홀 클러스터링
  const clusters = clusterSinkholes(sinkholes, clusterRadius);
  
  // 각 클러스터에 가중치 정보 추가
  const enhancedSinkholes = clusters.map(cluster => {
    const weightInfo = calculateSinkholeWeight(cluster);
    
    // 클러스터 정보를 단일 싱크홀 형태로 변환
    const enhancedSinkhole = {
      ...cluster.occurrences[0], // 첫 번째 발생 정보를 기본으로 사용
      lat: cluster.centerLat,
      lng: cluster.centerLng,
      id: cluster.id,
      name: cluster.totalOccurrences > 1 
        ? `#${cluster.id} 싱크홀 (${cluster.totalOccurrences}회 발생)`
        : `#${cluster.id} 싱크홀`,
      address: cluster.addresses[0] || cluster.occurrences[0].address,
      description: [
        `발생횟수: ${cluster.totalOccurrences}회`,
        cluster.firstOccurrence && cluster.lastOccurrence 
          ? `기간: ${cluster.firstOccurrence} ~ ${cluster.lastOccurrence}`
          : '',
        `최대규모: ${cluster.maxSize.width}×${cluster.maxSize.extend}×${cluster.maxSize.depth}`,
        cluster.totalDamage.deaths > 0 || cluster.totalDamage.injuries > 0 || cluster.totalDamage.vehicles > 0
          ? `총피해: 사망${cluster.totalDamage.deaths} 부상${cluster.totalDamage.injuries} 차량${cluster.totalDamage.vehicles}`
          : '',
        `위험도: ${weightInfo.riskLevel} (가중치: ${weightInfo.weight})`
      ].filter(Boolean).join(' | '),
      
      // 가중치 정보 추가
      weight: weightInfo.weight,
      riskLevel: weightInfo.riskLevel,
      priority: weightInfo.priority,
      totalOccurrences: cluster.totalOccurrences,
      occurrences: cluster.occurrences,
      
      // 기존 필드들 유지
      sido: cluster.occurrences[0].sido,
      sigungu: cluster.occurrences[0].sigungu,
      dong: cluster.occurrences[0].dong
    };
    
    return enhancedSinkhole;
  });
  
  // 위험도 순으로 정렬 (높은 위험도가 먼저)
  return enhancedSinkholes.sort((a, b) => b.weight - a.weight);
};

/**
 * 위험도에 따른 시각적 스타일 정보 반환
 * @param {Object} sinkhole - 가중치가 포함된 싱크홀 객체
 * @returns {Object} 시각적 스타일 정보
 */
export const getSinkholeVisualStyle = (sinkhole) => {
  const { riskLevel, totalOccurrences } = sinkhole;
  
  // 통합 상수를 사용하여 시각적 스타일 반환
  return getRiskLevelStyle(riskLevel, totalOccurrences);
};
