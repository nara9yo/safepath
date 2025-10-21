import React, { useEffect, useRef, useState, useCallback } from 'react';
import HeatmapLegend from './HeatmapLegend';
import SubwayInfluenceLegend from './SubwayInfluenceLegend';
import { getSinkholeVisualStyle } from '../utils/sinkholeAnalyzer';

const Map = ({ sinkholes, selectedSinkhole, onMapReady, showMarkers = true, markerRiskFilter = 'all', showHeatmap, heatmapGradient, legendMin, legendMax, mapType: externalMapType = 'terrain', showSubway = false, showSubwayInfluence = false, subwayStations = [] }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const infoWindowsRef = useRef([]);
  const heatmapRef = useRef(null);
  const subwayLineRef = useRef(null);
  const subwayMarkersRef = useRef([]);
  const isMovingRef = useRef(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapType, setMapType] = useState(externalMapType);


  // 지도 유형 변경 핸들러
  const handleMapTypeChange = useCallback((newMapType) => {
    console.log('🗺️ 지도 유형 변경:', newMapType);
    setMapType(newMapType);
    
    if (mapInstance.current && window.naver && window.naver.maps) {
      try {
        // 네이버 지도 API의 MapTypeId 사용
        const mapTypeId = window.naver.maps.MapTypeId[newMapType.toUpperCase()];
        if (mapTypeId) {
          mapInstance.current.setMapTypeId(mapTypeId);
          console.log('✅ 지도 유형 변경 완료:', mapTypeId);
        } else {
          console.warn('⚠️ 지원하지 않는 지도 유형:', newMapType);
        }
      } catch (error) {
        console.error('❌ 지도 유형 변경 실패:', error);
      }
    }
  }, []);

  // 외부에서 전달받은 mapType이 변경될 때 지도 유형 업데이트
  useEffect(() => {
    if (externalMapType && externalMapType !== mapType) {
      setMapType(externalMapType);
      handleMapTypeChange(externalMapType);
    }
  }, [externalMapType, mapType, handleMapTypeChange]);

  // 지도 초기화
  useEffect(() => {
    // Naver Maps API 동적 로드
    const loadNaverMap = () => {
      if (window.naver && window.naver.maps && window.naver.maps.Map) {
        console.log('✅ 네이버 지도 API 이미 로드됨');
        initializeMap();
        return;
      }

      const clientId = process.env.REACT_APP_NAVER_MAPS_CLIENT_ID || 'YOUR_CLIENT_ID';

      if (clientId === 'YOUR_CLIENT_ID') {
        console.warn('⚠️ 네이버 지도 API 키가 설정되지 않았습니다. .env.local 파일에 REACT_APP_NAVER_MAPS_CLIENT_ID를 설정해주세요.');
        alert('⚠️ 네이버 지도 API 키가 설정되지 않았습니다.\n\n.env.local 파일을 생성하고 다음을 추가해주세요:\nREACT_APP_NAVER_MAPS_CLIENT_ID=your_actual_client_id_here');
        return;
      }

      const existingScript = document.querySelector('script[src*="oapi.map.naver.com/openapi/v3/maps.js"]');
      if (existingScript) {
        console.log('✅ 기존 네이버 지도 API 스크립트 발견, 재사용');
        existingScript.addEventListener('load', () => initializeMap());
        if (window.naver && window.naver.maps && window.naver.maps.Map) {
          initializeMap();
        }
        return;
      }

      const script = document.createElement('script');
      script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder,visualization`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('✅ 네이버 지도 API 스크립트 로드 완료');
        initializeMap();
      };
      script.onerror = (e) => {
        console.error('❌ 네이버 지도 API 로드 실패:', e);
        alert('네이버 지도 API 로드에 실패했습니다. 도메인/키 설정을 확인해주세요.');
      };
      document.head.appendChild(script);
    };



    const initializeMap = () => {
      if (!window.naver || !window.naver.maps || !window.naver.maps.Map) {
        console.error('❌ 네이버 지도 API가 완전히 로드되지 않았습니다.');
        return;
      }

      try {
        const gwangjuCenter = new window.naver.maps.LatLng(35.1595, 126.8526);
        const options = {
          center: gwangjuCenter,
          zoom: 10,
          zoomControl: true,
          zoomControlOptions: { position: window.naver.maps.Position.TOP_RIGHT },
          mapTypeId: window.naver.maps.MapTypeId.TERRAIN, // 기본 지도 유형을 지형으로 설정
        };

        mapInstance.current = new window.naver.maps.Map(mapRef.current, options);

        if (onMapReady) {
          console.log('지도 인스턴스 전달:', mapInstance.current);
          onMapReady(mapInstance.current);
        }



        // 지도가 완전히 준비되면 isMapReady를 true로 설정
        let isReadySet = false;
        
        const setMapAsReady = () => {
          if (!isReadySet) {
            isReadySet = true;
            console.log('🗺️ 지도 준비 완료');
            setIsMapReady(true);
          }
        };

        // idle 이벤트로 준비 완료 감지
        const idleListener = window.naver.maps.Event.addListener(mapInstance.current, 'idle', () => {
          console.log('📍 idle 이벤트 발생 - 지도 준비 완료');
          setMapAsReady();
          window.naver.maps.Event.removeListener(idleListener);
        });

        // 폴백: idle 이벤트가 발생하지 않을 경우를 대비해 500ms 후 강제 설정
        setTimeout(() => {
          if (!isReadySet) {
            console.log('⏱️ 타임아웃으로 지도 준비 완료 처리');
            setMapAsReady();
          }
        }, 500);

        console.log('✅ 네이버 지도 초기화 완료');
      } catch (error) {
        console.error('❌ 네이버 지도 초기화 실패:', error);
      }
    };

    loadNaverMap();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 지도 이동 중 성능 최적화: 히트맵 임시 숨김
  useEffect(() => {
    if (!isMapReady || !mapInstance.current || !window.naver || !window.naver.maps) return;
    const startHandler = window.naver.maps.Event.addListener(mapInstance.current, 'dragstart', () => {
      isMovingRef.current = true;
      if (heatmapRef.current) { try { heatmapRef.current.setMap(null); } catch (e) {} }
    });
    const zoomHandler = window.naver.maps.Event.addListener(mapInstance.current, 'zoomstart', () => {
      isMovingRef.current = true;
      if (heatmapRef.current) { try { heatmapRef.current.setMap(null); } catch (e) {} }
    });
    return () => {
      window.naver.maps.Event.removeListener(startHandler);
      window.naver.maps.Event.removeListener(zoomHandler);
    };
  }, [isMapReady]);

  // 히트맵 데이터 변환 (weight 기준)
  const toWeightedLocations = useCallback((items) => {
    if (!items || !window.naver || !window.naver.maps) return [];
    return items.map(s => ({
      location: new window.naver.maps.LatLng(s.lat, s.lng),
      weight: Math.max(0, Number(s.weight) || 0)
    }));
  }, []);

  // 히트맵 레이어 생성/업데이트
  useEffect(() => {
    if (!isMapReady || !mapInstance.current || !window.naver || !window.naver.maps || !window.naver.maps.visualization) return;

    // 생성 또는 옵션 업데이트
    if (showHeatmap) {
      const data = toWeightedLocations(sinkholes || []);
      if (!heatmapRef.current) {
        try {
          heatmapRef.current = new window.naver.maps.visualization.HeatMap({
            map: mapInstance.current,
            data,
            radius: 18,
            opacity: 0.75,
            gradient: heatmapGradient || undefined
          });
        } catch (e) {
          console.error('❌ HeatMap 생성 실패:', e);
        }
      } else {
        try {
          heatmapRef.current.setData(data);
          heatmapRef.current.setOptions({ gradient: heatmapGradient || undefined });
          // 지도 이동 중이 아닐 때만 히트맵을 지도에 표시
          if (!isMovingRef.current) {
            heatmapRef.current.setMap(mapInstance.current);
          }
        } catch (e) {
          console.error('❌ HeatMap 업데이트 실패:', e);
        }
      }
    } else {
      if (heatmapRef.current) {
        try { heatmapRef.current.setMap(null); } catch (e) {}
      }
    }

    return () => {
      // 언마운트 시 정리(맵 해제만 수행)
      if (heatmapRef.current) {
        try { heatmapRef.current.setMap(null); } catch (e) {}
      }
    };
  }, [isMapReady, sinkholes, showHeatmap, heatmapGradient, toWeightedLocations]);

  // 지도 이동 종료 시 히트맵 복원
  useEffect(() => {
    if (!isMapReady || !mapInstance.current || !window.naver || !window.naver.maps) return;

    const idleListener = window.naver.maps.Event.addListener(mapInstance.current, 'idle', () => {
      console.log('📍 idle 이벤트 발생 - 히트맵 복원 체크');
      isMovingRef.current = false;
      if (heatmapRef.current && showHeatmap) {
        try { 
          heatmapRef.current.setMap(mapInstance.current);
          console.log('✅ 히트맵 복원 완료');
        } catch (e) {
          console.error('❌ 히트맵 복원 실패:', e);
        }
      }
    });

    return () => {
      window.naver.maps.Event.removeListener(idleListener);
    };
  }, [isMapReady, showHeatmap]);

  // 싱크홀 마커 표시
  useEffect(() => {
    if (!isMapReady || !mapInstance.current || !window.naver || !window.naver.maps) {
      console.log('⚠️ 지도 인스턴스가 준비되지 않음', { isMapReady, hasMapInstance: !!mapInstance.current });
      return;
    }

    // 기존 마커 제거
    markersRef.current.forEach(marker => {
      try {
        marker.setMap(null);
      } catch (e) {
        console.error('마커 제거 오류:', e);
      }
    });
    infoWindowsRef.current.forEach(infoWindow => {
      try {
        infoWindow.close();
      } catch (e) {
        console.error('인포윈도우 제거 오류:', e);
      }
    });
    markersRef.current = [];
    infoWindowsRef.current = [];

    // 마커 표시가 비활성화된 경우 마커를 생성하지 않음
    if (!showMarkers) {
      console.log('ℹ️ 마커 표시 비활성화됨');
      return;
    }

    if (!sinkholes || sinkholes.length === 0) {
      console.log('ℹ️ 표시할 싱크홀 없음');
      return;
    }

    // 이미 필터링된 데이터를 받으므로 추가 필터링 불필요
    // 위험도 순으로 정렬 (낮은 위험도부터 높은 위험도 순)
    const sortedSinkholes = [...sinkholes].sort((a, b) => {
      const weightA = Number(a.weight) || 0;
      const weightB = Number(b.weight) || 0;
      return weightA - weightB; // 오름차순 정렬 (낮은 위험도가 먼저)
    });
    
    console.log(`📍 ${sortedSinkholes.length}개 싱크홀 마커 생성 중... (이미 필터링된 데이터)`);
    let createdCount = 0;

    sortedSinkholes.forEach((sinkhole) => {
      if (!Number.isFinite(sinkhole.lat) || !Number.isFinite(sinkhole.lng)) {
        console.warn('⚠️ 유효하지 않은 좌표:', sinkhole);
        return;
      }

      try {
        const position = new window.naver.maps.LatLng(sinkhole.lat, sinkhole.lng);
        
        // 가중치에 따른 시각적 스타일 가져오기
        const visualStyle = getSinkholeVisualStyle(sinkhole);
        
        // 펄스 애니메이션을 위한 CSS 스타일 (더 강한 효과)
        const pulseAnimation = visualStyle.pulse ? `
          @keyframes pulse {
            0% { 
              transform: scale(1); 
              opacity: ${visualStyle.opacity}; 
              box-shadow: ${visualStyle.shadow || '0 2px 6px rgba(0,0,0,0.3)'};
            }
            50% { 
              transform: scale(1.2); 
              opacity: 1; 
              box-shadow: 0 0 20px rgba(255,0,0,0.6), ${visualStyle.shadow || '0 2px 6px rgba(0,0,0,0.3)'};
            }
            100% { 
              transform: scale(1); 
              opacity: ${visualStyle.opacity}; 
              box-shadow: ${visualStyle.shadow || '0 2px 6px rgba(0,0,0,0.3)'};
            }
          }
          animation: pulse 1.5s infinite;
        ` : '';
        
        // 고위험 마커를 위한 추가 효과
        const criticalEffect = visualStyle.riskLevel === 'critical' ? `
          @keyframes criticalPulse {
            0% { 
              transform: scale(1) rotate(0deg); 
              filter: drop-shadow(${visualStyle.glow || 'none'});
            }
            25% { 
              transform: scale(1.1) rotate(5deg); 
              filter: drop-shadow(0 0 15px rgba(106,27,154,1));
            }
            50% { 
              transform: scale(1.3) rotate(0deg); 
              filter: drop-shadow(0 0 20px rgba(106,27,154,1));
            }
            75% { 
              transform: scale(1.1) rotate(-5deg); 
              filter: drop-shadow(0 0 15px rgba(106,27,154,1));
            }
            100% { 
              transform: scale(1) rotate(0deg); 
              filter: drop-shadow(${visualStyle.glow || 'none'});
            }
          }
          animation: criticalPulse 2s infinite;
        ` : '';

        // 히트맵 위험도에 따른 마커 색상 계산
        const getHeatmapColor = (weight) => {
          // weight 값에 따라 0-1 사이의 정규화된 값 계산
          const normalizedWeight = Math.min(Math.max((weight || 0) / 10, 0), 1);
          
          // 히트맵과 동일한 색상 그라데이션 적용
          if (normalizedWeight < 0.25) {
            // 낮음: 녹색 계열
            const intensity = normalizedWeight / 0.25;
            return `rgba(${76 + (255-76) * intensity}, ${175 + (255-175) * intensity}, ${80 + (255-80) * intensity}, 0.7)`;
          } else if (normalizedWeight < 0.5) {
            // 중간: 노란색 계열
            const intensity = (normalizedWeight - 0.25) / 0.25;
            return `rgba(255, ${152 + (255-152) * intensity}, 0, 0.7)`;
          } else if (normalizedWeight < 0.75) {
            // 높음: 주황색 계열
            const intensity = (normalizedWeight - 0.5) / 0.25;
            return `rgba(255, ${152 - 152 * intensity}, 0, 0.7)`;
          } else {
            // 치명적: 빨간색 계열
            const intensity = (normalizedWeight - 0.75) / 0.25;
            return `rgba(255, ${0 - 0 * intensity}, ${0 - 0 * intensity}, 0.7)`;
          }
        };


        const markerColor = getHeatmapColor(sinkhole.weight);
        const markerSize = 24; // 마커 크기 추가 증가 (20px → 24px)

        const marker = new window.naver.maps.Marker({
          position,
          map: mapInstance.current,
          title: sinkhole.name,
          icon: {
            content: `
              <div style="
                width: ${markerSize}px;
                height: ${markerSize}px;
                border-radius: 50%;
                background: ${markerColor};
                border: 1px solid black;
                box-shadow: 0 3px 12px rgba(0,0,0,0.3);
                opacity: 1.0;
                transition: all 0.3s ease;
                cursor: pointer;
                ${pulseAnimation}
                ${criticalEffect}
              ">
              </div>
            `,
            anchor: new window.naver.maps.Point(markerSize / 2, markerSize / 2)
          },
          zIndex: visualStyle.riskLevel === 'critical' ? 300 : 
                 visualStyle.riskLevel === 'high' ? 250 : 
                 visualStyle.riskLevel === 'medium' ? 200 : 150
        });

        // 위험도 레벨 확인
        const effectiveRiskLevel = sinkhole.riskLevel || visualStyle.riskLevel || 'low';

        const sizeLabel = (() => {
          const w = Number(sinkhole.sinkWidth) || 0;
          const e = Number(sinkhole.sinkExtend) || 0;
          const d = Number(sinkhole.sinkDepth) || 0;
          if (w === 0 && e === 0 && d === 0) return '';
          return `최대규모: ${w}×${e}×${d}`;
        })();


        // 위험도별 색상 정의
        const getRiskColor = (riskLevel) => {
          const colors = {
            low: '#4CAF50',
            medium: '#FF9800', 
            high: '#F44336',
            critical: '#9C27B0'
          };
          return colors[riskLevel] || '#4CAF50';
        };

        const getRiskLabel = (riskLevel) => {
          const labels = {
            low: '낮음',
            medium: '중간',
            high: '높음',
            critical: '치명적'
          };
          return labels[riskLevel] || '낮음';
        };

        const riskColor = getRiskColor(effectiveRiskLevel);
        const riskLabel = getRiskLabel(effectiveRiskLevel);

        const infoWindow = new window.naver.maps.InfoWindow({
          content: `
            <div style="
              padding: 20px; 
              min-width: 300px; 
              background: white; 
              border-radius: 12px; 
              box-shadow: 0 8px 24px rgba(0,0,0,0.12);
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              border: 1px solid #f0f0f0;
            ">
              <!-- 싱크홀 이름 -->
              <h3 style="
                margin: 0 0 16px 0; 
                font-size: 18px; 
                font-weight: 700; 
                color: #333;
                text-align: center;
                padding-bottom: 12px;
                border-bottom: 2px solid #e0e0e0;
              ">
                ${sinkhole.name}
              </h3>
              
              <!-- 정보 목록 -->
              <div style="display: flex; flex-direction: column; gap: 12px;">
                <!-- 주소 -->
                <div style="display: flex; align-items: flex-start; gap: 8px;">
                  <span style="
                    font-size: 13px; 
                    font-weight: 600; 
                    color: #666; 
                    min-width: 60px;
                    flex-shrink: 0;
                  ">주소</span>
                  <span style="
                    font-size: 13px; 
                    color: #333; 
                    line-height: 1.4;
                    flex: 1;
                  ">${sinkhole.address || '정보 없음'}</span>
                </div>
                
                <!-- 위치 -->
                <div style="display: flex; align-items: flex-start; gap: 8px;">
                  <span style="
                    font-size: 13px; 
                    font-weight: 600; 
                    color: #666; 
                    min-width: 60px;
                    flex-shrink: 0;
                  ">위치</span>
                  <span style="
                    font-size: 13px; 
                    color: #333; 
                    font-family: 'Monaco', 'Menlo', monospace;
                  ">${sinkhole.lat?.toFixed(6) || 'N/A'}, ${sinkhole.lng?.toFixed(6) || 'N/A'}</span>
                </div>
                
                <!-- 위험도 -->
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="
                    font-size: 13px; 
                    font-weight: 600; 
                    color: #666; 
                    min-width: 60px;
                    flex-shrink: 0;
                  ">위험도</span>
                  <div style="
                    display: flex; 
                    align-items: center; 
                    gap: 6px;
                    padding: 4px 8px;
                    background: ${riskColor}15;
                    border-radius: 6px;
                    border: 1px solid ${riskColor}30;
                  ">
                    <span style="
                      font-size: 13px; 
                      color: #333;
                      font-weight: 600;
                    ">${sinkhole.weight?.toFixed(2) || 'N/A'}</span>
                    <span style="
                      font-size: 12px; 
                      color: ${riskColor};
                      font-weight: 700;
                      text-transform: uppercase;
                    ">${riskLabel}</span>
                  </div>
                </div>
                
                <!-- 발생횟수 -->
                <div style="display: flex; align-items: flex-start; gap: 8px;">
                  <span style="
                    font-size: 13px; 
                    font-weight: 600; 
                    color: #666; 
                    min-width: 60px;
                    flex-shrink: 0;
                  ">발생횟수</span>
                  <span style="
                    font-size: 13px; 
                    color: #333;
                  ">${sinkhole.totalOccurrences || 1}회</span>
                </div>
                
                <!-- 최대규모 -->
                <div style="display: flex; align-items: flex-start; gap: 8px;">
                  <span style="
                    font-size: 13px; 
                    font-weight: 600; 
                    color: #666; 
                    min-width: 60px;
                    flex-shrink: 0;
                  ">최대규모</span>
                  <span style="
                    font-size: 13px; 
                    color: #333;
                    font-family: 'Monaco', 'Menlo', monospace;
                  ">${sizeLabel || '정보 없음'}</span>
                </div>
                
                <!-- 지하철 노선 가중치 -->
                ${sinkhole.hasSubwayRisk ? `
                <div style="display: flex; align-items: flex-start; gap: 8px;">
                  <span style="
                    font-size: 13px; 
                    font-weight: 600; 
                    color: #666; 
                    min-width: 60px;
                    flex-shrink: 0;
                  ">지하철영향</span>
                  <div style="
                    display: flex; 
                    flex-direction: column; 
                    gap: 4px;
                    flex: 1;
                  ">
                    <div style="
                      display: flex; 
                      align-items: center; 
                      gap: 6px;
                    ">
                      <span style="
                        font-size: 13px; 
                        color: #333;
                        font-weight: 600;
                      ">거리: ${Math.round(sinkhole.subwayDistance || 0)}m</span>
                      <span style="
                        font-size: 12px; 
                        color: #4CAF50;
                        font-weight: 700;
                        background: #4CAF5015;
                        padding: 2px 6px;
                        border-radius: 4px;
                        border: 1px solid #4CAF5030;
                      ">가중치: +${((sinkhole.subwayWeight || 0) * 100).toFixed(1)}%</span>
                    </div>
                    <div style="
                      font-size: 12px; 
                      color: #666;
                      line-height: 1.3;
                    ">
                      ${sinkhole.subwayDistance <= 100 ? '1차 영향권 (100m 이내) - 즉시 지반 영향' :
                        sinkhole.subwayDistance <= 300 ? '2차 영향권 (100~300m) - 굴착공사 영향' :
                        sinkhole.subwayDistance <= 500 ? '3차 영향권 (300~500m) - 누적 침하 가능성' :
                        '영향권 밖 - 지하철 영향 없음'}
                    </div>
                    <div style="
                      font-size: 11px; 
                      color: #999;
                      font-style: italic;
                    ">
                      기존 위험도: ${(sinkhole.originalWeight || 0).toFixed(2)} → 최종 위험도: ${(sinkhole.weight || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
                ` : `
                <div style="display: flex; align-items: flex-start; gap: 8px;">
                  <span style="
                    font-size: 13px; 
                    font-weight: 600; 
                    color: #666; 
                    min-width: 60px;
                    flex-shrink: 0;
                  ">지하철영향</span>
                  <span style="
                    font-size: 13px; 
                    color: #999;
                    font-style: italic;
                  ">지하철 노선 영향권 밖</span>
                </div>
                `}
              </div>
            </div>
          `
        });

        window.naver.maps.Event.addListener(marker, 'click', () => {
          infoWindowsRef.current.forEach(iw => iw.close());
          infoWindow.open(mapInstance.current, marker);
        });

        markersRef.current.push(marker);
        infoWindowsRef.current.push(infoWindow);
        createdCount++;
      } catch (error) {
        console.error('❌ 마커 생성 오류:', sinkhole, error);
      }
    });

    console.log(`✅ ${createdCount}개 싱크홀 마커 생성 완료`);
  }, [sinkholes, isMapReady, showMarkers]);

  // 선택된 싱크홀 표시 (인포윈도우 열기 및 지도 중심 이동)
  useEffect(() => {
    if (!isMapReady || !mapInstance.current || !selectedSinkhole || !window.naver || !window.naver.maps) {
      return;
    }

    console.log('📌 선택된 싱크홀:', selectedSinkhole.name, {
      coords: { lat: selectedSinkhole.lat, lng: selectedSinkhole.lng },
      markersCount: markersRef.current.length
    });

    // 모든 인포윈도우 닫기
    infoWindowsRef.current.forEach(iw => {
      try {
        iw.close();
      } catch (e) {
        console.error('인포윈도우 닫기 오류:', e);
      }
    });

    // 선택된 싱크홀의 마커 찾기
    const targetMarker = markersRef.current.find((marker, index) => {
      try {
        const markerPosition = marker.getPosition();
        if (!markerPosition) return false;
        
        // 좌표 비교 정밀도를 낮춤 (약 1m 오차 허용)
        const latDiff = Math.abs(markerPosition.y - selectedSinkhole.lat);
        const lngDiff = Math.abs(markerPosition.x - selectedSinkhole.lng);
        return latDiff < 0.0001 && lngDiff < 0.0001;
      } catch (e) {
        console.error('마커 위치 확인 오류:', e);
        return false;
      }
    });

    if (targetMarker) {
      // 해당 마커의 인포윈도우 찾기
      const markerIndex = markersRef.current.indexOf(targetMarker);
      const targetInfoWindow = infoWindowsRef.current[markerIndex];
      
      if (targetInfoWindow) {
        targetInfoWindow.open(mapInstance.current, targetMarker);
        console.log('✅ 인포윈도우 열림');
      }

      // 지도 중심을 선택된 싱크홀로 이동
      const position = new window.naver.maps.LatLng(selectedSinkhole.lat, selectedSinkhole.lng);
      mapInstance.current.setCenter(position);
      mapInstance.current.setZoom(15);
    } else {
      console.warn('⚠️ 선택된 싱크홀의 마커를 찾을 수 없음', {
        selectedSinkhole: selectedSinkhole.name,
        markersCount: markersRef.current.length,
        sinkholeCoords: { lat: selectedSinkhole.lat, lng: selectedSinkhole.lng }
      });
      
      // 마커를 찾지 못해도 지도 중심은 이동
      const position = new window.naver.maps.LatLng(selectedSinkhole.lat, selectedSinkhole.lng);
      mapInstance.current.setCenter(position);
      mapInstance.current.setZoom(15);
    }
  }, [selectedSinkhole, isMapReady]);


  // 지하철 노선 표시
  useEffect(() => {
    if (!isMapReady || !mapInstance.current || !window.naver || !window.naver.maps) {
      console.log('⚠️ 지도 인스턴스가 준비되지 않음', { isMapReady, hasMapInstance: !!mapInstance.current });
      return;
    }


    // 기존 지하철 관련 요소들 제거
    if (subwayLineRef.current) {
      try {
        // 배열인 경우 (여러 개의 선분)
        if (Array.isArray(subwayLineRef.current)) {
          subwayLineRef.current.forEach(line => {
            if (line && line.setMap) {
              line.setMap(null);
            }
          });
        } else {
          // 단일 노선인 경우
          subwayLineRef.current.setMap(null);
        }
      } catch (e) {
        console.error('지하철 노선 제거 오류:', e);
      }
    }
    subwayMarkersRef.current.forEach(marker => {
      try {
        marker.setMap(null);
      } catch (e) {
        console.error('지하철 역 마커 제거 오류:', e);
      }
    });
    subwayMarkersRef.current = [];

    // 영향권은 이제 노선과 함께 관리되므로 별도 제거 불필요

    // 지하철 노선 표시가 비활성화된 경우
    if (!showSubway) {
      console.log('ℹ️ 지하철 노선 표시 비활성화됨');
      return;
    }

    if (!subwayStations || subwayStations.length === 0) {
      console.log('ℹ️ 표시할 지하철 역 없음');
      return;
    }

    console.log(`🚇 ${subwayStations.length}개 지하철 역 표시 중...`);

    try {
      // 지하철 노선을 저장할 배열
      const subwayLines = [];
      let previousPosition = null;

      // 지하철 역 마커 표시 및 노선 연결
      subwayStations.forEach((station, index) => {
        const position = new window.naver.maps.LatLng(station.lat, station.lng);
        
        const markerSize = 12; // 노선보다 조금 더 큰 크기 (노선 두께 6px보다 큰 12px)

        // 모든 역을 흰색 원으로 표시
        const markerContent = `
          <div style="
            width: ${markerSize}px;
            height: ${markerSize}px;
            border-radius: 50%;
            background: white;
            border: 2px solid #4CAF50;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            cursor: pointer;
            transition: all 0.3s ease;
          " onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
          </div>
        `;

        const marker = new window.naver.maps.Marker({
          position,
          map: mapInstance.current,
          title: station.name,
          icon: {
            content: markerContent,
            anchor: new window.naver.maps.Point(markerSize / 2, markerSize / 2)
          },
          zIndex: 200
        });

        subwayMarkersRef.current.push(marker);

        // 영향권 표시가 활성화된 경우 각 역 주위에 원형 영향권 생성
        if (showSubwayInfluence) {
          // 원형 영향권 반지름 계산 (미터 단위 - Circle은 미터 단위 사용)
          const radius500m = 500; // 500m
          const radius300m = 300; // 300m
          const radius100m = 100; // 100m

          // 3차 영향권 (300~500m) - 진한 금색 (더 진한 색상, 높은 대비)
          const circle500m = new window.naver.maps.Circle({
            center: position,
            radius: radius500m, // 500m 반지름
            fillColor: '#FFD700', // 더 진한 금색
            fillOpacity: 0.25, // 투명도 증가
            strokeColor: '#FF8C00', // 진한 주황색 테두리
            strokeWeight: 2,
            strokeOpacity: 0.8,
            zIndex: 45
          });
          subwayLines.push(circle500m);

          // 2차 영향권 (100~300m) - 진한 주황색 (3차 위에 겹쳐서)
          const circle300m = new window.naver.maps.Circle({
            center: position,
            radius: radius300m, // 300m 반지름 (3차 영향권 위에 겹쳐짐)
            fillColor: '#FF6B35', // 더 진한 주황색
            fillOpacity: 0.35, // 투명도 증가
            strokeColor: '#FF4500', // 진한 빨간색 테두리
            strokeWeight: 2,
            strokeOpacity: 0.9,
            zIndex: 46
          });
          subwayLines.push(circle300m);

          // 1차 영향권 (0~100m) - 진한 빨간색 (2차 위에 겹쳐서)
          const circle100m = new window.naver.maps.Circle({
            center: position,
            radius: radius100m, // 100m 반지름 (2차 영향권 위에 겹쳐짐)
            fillColor: '#DC143C', // 진한 빨간색
            fillOpacity: 0.45, // 가장 높은 투명도
            strokeColor: '#8B0000', // 진한 마론색 테두리
            strokeWeight: 3,
            strokeOpacity: 1.0,
            zIndex: 47
          });
          subwayLines.push(circle100m);
        }

        // 이전 역과 현재 역을 연결하는 선 그리기
        if (previousPosition) {
          const path = [previousPosition, position];
          
          // 영향권 표시가 활성화된 경우 여러 굵기로 노선 그리기
          if (showSubwayInfluence) {
            // 현재 줌 레벨에 따른 픽셀당 미터 계산
            const currentZoom = mapInstance.current.getZoom();
            const metersPerPixel = 156543.03392 * Math.cos(35.1595 * Math.PI / 180) / Math.pow(2, currentZoom);
            
            // 실제 거리에 맞는 굵기 계산 (픽셀 단위)
            // Polyline은 중앙을 기준으로 양쪽으로 굵기가 적용되므로 2배로 계산
            // 3차 영향권: 500m 반지름 = 1000m 직경
            // 2차 영향권: 300m 반지름 = 600m 직경  
            // 1차 영향권: 100m 반지름 = 200m 직경
            const strokeWeight500m = Math.max(2, Math.round((500 * 2) / metersPerPixel));
            const strokeWeight300m = Math.max(2, Math.round((300 * 2) / metersPerPixel));
            const strokeWeight100m = Math.max(2, Math.round((100 * 2) / metersPerPixel));
            
            // 3차 영향권 (300~500m) - 가장 큰 굵기, 진한 금색
            const zone500mLine = new window.naver.maps.Polyline({
            map: mapInstance.current,
              path,
              strokeColor: '#FFD700', // 진한 금색
              strokeWeight: strokeWeight500m, // 500m 전체 굵기
              strokeOpacity: 0.3,
              strokeStyle: 'solid',
              zIndex: 45
            });
            subwayLines.push(zone500mLine);

            // 2차 영향권 (100~300m) - 중간 굵기, 진한 주황색 (3차 위에 겹쳐서)
            const zone300mLine = new window.naver.maps.Polyline({
              map: mapInstance.current,
              path,
              strokeColor: '#FF6B35', // 진한 주황색
              strokeWeight: strokeWeight300m, // 300m 굵기 (3차 영향권 위에 겹쳐짐)
              strokeOpacity: 0.4,
              strokeStyle: 'solid',
              zIndex: 46
            });
            subwayLines.push(zone300mLine);

            // 1차 영향권 (0~100m) - 작은 굵기, 진한 빨간색 (2차 위에 겹쳐서)
            const zone100mLine = new window.naver.maps.Polyline({
              map: mapInstance.current,
              path,
              strokeColor: '#DC143C', // 진한 빨간색
              strokeWeight: strokeWeight100m, // 100m 굵기 (2차 영향권 위에 겹쳐짐)
              strokeOpacity: 0.5,
              strokeStyle: 'solid',
              zIndex: 47
            });
            subwayLines.push(zone100mLine);
          }

          // 원래 지하철 노선 (가장 위에)
          const mainLine = new window.naver.maps.Polyline({
            map: mapInstance.current,
            path,
            strokeColor: '#4CAF50', // 녹색
            strokeWeight: 6,
            strokeOpacity: 0.8,
            strokeStyle: 'solid',
            zIndex: 100
          });
          subwayLines.push(mainLine);
        }

        // 현재 위치를 다음 반복을 위해 저장
        previousPosition = position;
      });

      // 생성된 모든 노선을 저장
      subwayLineRef.current = subwayLines;

      // 영향권은 이제 노선 그리기 로직에서 처리됨
      console.log(`✅ 지하철 노선 표시 완료 (영향권: ${showSubwayInfluence ? '활성화' : '비활성화'})`);

      console.log(`✅ ${subwayStations.length}개 지하철 역 표시 완료`);
    } catch (error) {
      console.error('❌ 지하철 노선 표시 오류:', error);
    }
  }, [isMapReady, showSubway, showSubwayInfluence, subwayStations]);

  // 줌 레벨 변경 시 지하철 영향권 다시 그리기
  useEffect(() => {
    if (!isMapReady || !mapInstance.current || !showSubway || !showSubwayInfluence || !subwayStations || subwayStations.length === 0) {
      return;
    }

    const handleZoomChange = () => {
      
      // 기존 지하철 관련 요소들 제거
      if (subwayLineRef.current) {
        try {
          if (Array.isArray(subwayLineRef.current)) {
            subwayLineRef.current.forEach(line => {
              if (line && line.setMap) {
                line.setMap(null);
              }
            });
          } else {
            subwayLineRef.current.setMap(null);
          }
        } catch (e) {
          console.error('지하철 노선 제거 오류:', e);
        }
      }
      subwayMarkersRef.current.forEach(marker => {
        try {
          marker.setMap(null);
        } catch (e) {
          console.error('지하철 역 마커 제거 오류:', e);
        }
      });
      subwayMarkersRef.current = [];

      // 지하철 노선과 영향권 다시 그리기
      try {
        const subwayLines = [];
        let previousPosition = null;

        subwayStations.forEach((station, index) => {
          const position = new window.naver.maps.LatLng(station.lat, station.lng);
          
          const markerSize = 12;
          const markerContent = `
            <div style="
              width: ${markerSize}px;
              height: ${markerSize}px;
              border-radius: 50%;
              background: white;
              border: 2px solid #4CAF50;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              cursor: pointer;
              transition: all 0.3s ease;
            " onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
            </div>
          `;

          const marker = new window.naver.maps.Marker({
            position,
            map: mapInstance.current,
            title: station.name,
            icon: {
              content: markerContent,
              anchor: new window.naver.maps.Point(markerSize / 2, markerSize / 2)
            },
            zIndex: 200
          });

          subwayMarkersRef.current.push(marker);

          // 영향권 표시가 활성화된 경우 각 역 주위에 원형 영향권 생성
          if (showSubwayInfluence) {
            // 원형 영향권 반지름 계산 (미터 단위 - Circle은 미터 단위 사용)
            const radius500m = 500; // 500m
            const radius300m = 300; // 300m
            const radius100m = 100; // 100m

            // 3차 영향권 (500m) - 노란색 (더 진한 색상, 높은 대비)
            const circle500m = new window.naver.maps.Circle({
              center: position,
              radius: radius500m,
              fillColor: '#FFD700', // 더 진한 금색
              fillOpacity: 0.25, // 투명도 증가
              strokeColor: '#FF8C00', // 진한 주황색 테두리
              strokeWeight: 2,
              strokeOpacity: 0.8,
              zIndex: 45
            });
            subwayLines.push(circle500m);

            // 2차 영향권 (300m) - 주황색 (더 진한 색상, 높은 대비)
            const circle300m = new window.naver.maps.Circle({
              center: position,
              radius: radius300m,
              fillColor: '#FF6B35', // 더 진한 주황색
              fillOpacity: 0.35, // 투명도 증가
              strokeColor: '#FF4500', // 진한 빨간색 테두리
              strokeWeight: 2,
              strokeOpacity: 0.9,
              zIndex: 46
            });
            subwayLines.push(circle300m);

            // 1차 영향권 (100m) - 빨간색 (가장 진한 색상, 최고 대비)
            const circle100m = new window.naver.maps.Circle({
              center: position,
              radius: radius100m,
              fillColor: '#DC143C', // 진한 빨간색
              fillOpacity: 0.45, // 가장 높은 투명도
              strokeColor: '#8B0000', // 진한 마론색 테두리
              strokeWeight: 3,
              strokeOpacity: 1.0,
              zIndex: 47
            });
            subwayLines.push(circle100m);
          }

          // 이전 역과 현재 역을 연결하는 선 그리기
          if (previousPosition) {
            const path = [previousPosition, position];
            
            // 영향권 표시가 활성화된 경우 여러 굵기로 노선 그리기
            if (showSubwayInfluence) {
              const currentZoom = mapInstance.current.getZoom();
              const metersPerPixel = 156543.03392 * Math.cos(35.1595 * Math.PI / 180) / Math.pow(2, currentZoom);
              
              // 실제 거리에 맞는 굵기 계산 (픽셀 단위)
              // Polyline은 중앙을 기준으로 양쪽으로 굵기가 적용되므로 2배로 계산
              const strokeWeight500m = Math.max(2, Math.round((500 * 2) / metersPerPixel));
              const strokeWeight300m = Math.max(2, Math.round((300 * 2) / metersPerPixel));
              const strokeWeight100m = Math.max(2, Math.round((100 * 2) / metersPerPixel));

            // 3차 영향권 (300~500m) - 가장 큰 굵기, 진한 금색
            const zone500mLine = new window.naver.maps.Polyline({
              map: mapInstance.current,
              path,
              strokeColor: '#FFD700', // 진한 금색
              strokeWeight: strokeWeight500m, // 500m 전체 굵기
              strokeOpacity: 0.3,
              strokeStyle: 'solid',
              zIndex: 45
            });
            subwayLines.push(zone500mLine);

            // 2차 영향권 (100~300m) - 중간 굵기, 진한 주황색 (3차 위에 겹쳐서)
            const zone300mLine = new window.naver.maps.Polyline({
              map: mapInstance.current,
              path,
              strokeColor: '#FF6B35', // 진한 주황색
              strokeWeight: strokeWeight300m, // 300m 굵기 (3차 영향권 위에 겹쳐짐)
              strokeOpacity: 0.4,
              strokeStyle: 'solid',
              zIndex: 46
            });
            subwayLines.push(zone300mLine);

            // 1차 영향권 (0~100m) - 작은 굵기, 진한 빨간색 (2차 위에 겹쳐서)
            const zone100mLine = new window.naver.maps.Polyline({
              map: mapInstance.current,
              path,
              strokeColor: '#DC143C', // 진한 빨간색
              strokeWeight: strokeWeight100m, // 100m 굵기 (2차 영향권 위에 겹쳐짐)
              strokeOpacity: 0.5,
              strokeStyle: 'solid',
              zIndex: 47
            });
            subwayLines.push(zone100mLine);
            }

            // 원래 지하철 노선 (가장 위에)
            const mainLine = new window.naver.maps.Polyline({
              map: mapInstance.current,
              path,
              strokeColor: '#4CAF50', // 녹색
              strokeWeight: 6,
              strokeOpacity: 0.8,
              strokeStyle: 'solid',
              zIndex: 100
            });
            subwayLines.push(mainLine);
          }

          // 현재 위치를 다음 반복을 위해 저장
          previousPosition = position;
        });

        // 생성된 모든 노선을 저장
        subwayLineRef.current = subwayLines;
      } catch (error) {
        console.error('❌ 줌 레벨 변경 시 지하철 영향권 다시 그리기 오류:', error);
      }
    };

    // 줌 변경 이벤트 리스너 등록
    const zoomListener = window.naver.maps.Event.addListener(mapInstance.current, 'zoom_changed', handleZoomChange);

    return () => {
      window.naver.maps.Event.removeListener(zoomListener);
    };
  }, [isMapReady, showSubway, showSubwayInfluence, subwayStations]);

  return (
    <div 
      ref={mapRef} 
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      {/* 히트맵 범례 */}
      {showHeatmap && Array.isArray(heatmapGradient) && heatmapGradient.length > 0 && (
        <div
          style={{
            position: 'absolute',
            right: 12,
            bottom: 12,
            background: 'rgba(255,255,255,0.95)',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 10000,
            pointerEvents: 'auto'
          }}
        >
          <HeatmapLegend
            gradient={heatmapGradient}
            min={Number(legendMin ?? 0)}
            max={Number(legendMax ?? 10)}
            title="위험도"
            barWidth={200}
          />
        </div>
      )}

      {/* 지하철 영향권 범례 */}
      {showSubway && showSubwayInfluence && (
        <div
          style={{
            position: 'absolute',
            right: 12,
            bottom: showHeatmap && Array.isArray(heatmapGradient) && heatmapGradient.length > 0 ? '108px' : '12px',
            background: 'rgba(255,255,255,0.95)',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 10001,
            pointerEvents: 'auto'
          }}
        >
          <SubwayInfluenceLegend
            title="지하철 영향권"
            barWidth={200}
          />
        </div>
      )}
    </div>
  );
};

export default Map;




