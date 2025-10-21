import React, { useEffect, useRef, useState, useCallback } from 'react';
import HeatmapLegend from './HeatmapLegend';
import MapTypeControl from './MapTypeControl';
import { getSinkholeVisualStyle } from '../utils/sinkholeAnalyzer';

const Map = ({ sinkholes, selectedSinkhole, onMapReady, showHeatmap, heatmapGradient, rescaleMethod, legendMin, legendMax }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const infoWindowsRef = useRef([]);
  const circlesRef = useRef([]);
  const heatmapRef = useRef(null);
  const isMovingRef = useRef(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapType, setMapType] = useState('normal');


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
          console.log('📍 idle 이벤트 발생');
          // 이동 종료 시 히트맵 복원
          isMovingRef.current = false;
          if (heatmapRef.current && showHeatmap) {
            try { heatmapRef.current.setMap(mapInstance.current); } catch (e) {}
          }
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
    const weights = items.map(s => Number(s.weight) || 0).filter(w => Number.isFinite(w) && w >= 0).sort((a,b) => a-b);
    let cap = 1;
    if (weights.length) {
      if (rescaleMethod === 'iqr') {
        const q1 = weights[Math.floor(weights.length * 0.25)];
        const q3 = weights[Math.floor(weights.length * 0.75)];
        const iqr = Math.max(1, q3 - q1);
        cap = Math.ceil(q3 + 1.5 * iqr);
      } else if (rescaleMethod === 'none') {
        cap = Math.ceil(weights[weights.length - 1]);
      } else {
        // p90
        const p = 0.9;
        const idx = Math.min(weights.length - 1, Math.max(0, Math.floor(weights.length * p)));
        const p90 = weights[idx];
        cap = Math.max(1, Math.ceil(p90 || 1));
      }
    }
    return items.map(s => ({
      location: new window.naver.maps.LatLng(s.lat, s.lng),
      weight: Math.max(0, Math.min(cap, Number(s.weight) || 0))
    }));
  }, [rescaleMethod]);

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
          heatmapRef.current.setMap(mapInstance.current);
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
  }, [isMapReady, sinkholes, showHeatmap, heatmapGradient, rescaleMethod, toWeightedLocations]);


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

    if (!sinkholes || sinkholes.length === 0) {
      console.log('ℹ️ 표시할 싱크홀 없음');
      return;
    }

    console.log(`📍 ${sinkholes.length}개 싱크홀 마커 생성 중...`);
    let createdCount = 0;

    sinkholes.forEach((sinkhole) => {
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

        const marker = new window.naver.maps.Marker({
          position,
          map: mapInstance.current,
          title: sinkhole.name,
          icon: {
            content: `
              <div style="
                width: ${visualStyle.size}px;
                height: ${visualStyle.size}px;
                border-radius: 50%;
                background: ${visualStyle.color};
                border: ${visualStyle.borderWidth}px solid ${visualStyle.borderColor};
                color: #fff;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: ${Math.max(12, visualStyle.size * 0.5)}px;
                box-shadow: ${visualStyle.shadow || '0 2px 6px rgba(0,0,0,0.3)'};
                opacity: ${visualStyle.opacity};
                text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
                ${visualStyle.glow && visualStyle.glow !== 'none' ? `filter: drop-shadow(${visualStyle.glow});` : ''}
                ${pulseAnimation}
                ${criticalEffect}
              ">
                ${visualStyle.icon}
              </div>
            `,
            anchor: new window.naver.maps.Point(visualStyle.size / 2, visualStyle.size / 2)
          },
          zIndex: visualStyle.riskLevel === 'critical' ? 300 : 
                 visualStyle.riskLevel === 'high' ? 250 : 
                 visualStyle.riskLevel === 'medium' ? 200 : 150
        });

        // 위험도에 따른 인포윈도우 색상
        const riskColorMap = {
          low: '#4CAF50',
          medium: '#FF9800', 
          high: '#F44336',
          critical: '#9C27B0'
        };
        const effectiveRiskLevel = sinkhole.riskLevel || visualStyle.riskLevel || 'low';
        const riskColor = riskColorMap[effectiveRiskLevel] || '#e74c3c';

        const sizeLabel = (() => {
          const w = Number(sinkhole.sinkWidth) || 0;
          const e = Number(sinkhole.sinkExtend) || 0;
          const d = Number(sinkhole.sinkDepth) || 0;
          if (w === 0 && e === 0 && d === 0) return '';
          return `최대규모: ${w}×${e}×${d}`;
        })();

        const damageLabel = (() => {
          const death = Number(sinkhole.deathCnt) || 0;
          const injury = Number(sinkhole.injuryCnt) || 0;
          const vehicle = Number(sinkhole.vehicleCnt) || 0;
          if (death + injury + vehicle === 0) return '';
          return `피해: 사망 ${death} · 부상 ${injury} · 차량 ${vehicle}`;
        })();

        const infoWindow = new window.naver.maps.InfoWindow({
          content: `
            <div style="padding: 10px; min-width: 250px;">
              <h4 style="margin: 0 0 5px 0; color: ${riskColor};">
                ${visualStyle.icon} 싱크홀 (${String(effectiveRiskLevel).toUpperCase()})
              </h4>
              <p style="margin: 0 0 5px 0; font-weight: bold;">${sinkhole.name}</p>
              <p style="margin: 0 0 5px 0; font-size: 12px; color: #666;">${sinkhole.address || ''}</p>
              ${sinkhole.totalOccurrences > 1 ? `
                <p style="margin: 0 0 5px 0; font-size: 12px; color: #d32f2f; font-weight: bold;">
                  🔄 ${sinkhole.totalOccurrences}회 반복 발생
                </p>
              ` : ''}
              ${sizeLabel ? `<p style="margin: 0 0 5px 0; font-size: 12px; color: #555;">${sizeLabel}</p>` : ''}
              ${damageLabel ? `<p style="margin: 0 0 5px 0; font-size: 12px; color: #b71c1c;">${damageLabel}</p>` : ''}
              <p style="margin: 0 0 5px 0; font-size: 12px; color: #1976d2; font-weight: bold;">
                위험도: ${sinkhole.weight?.toFixed(1) || 'N/A'} (우선순위: ${sinkhole.priority || 'N/A'})
              </p>
              ${sinkhole.description ? `<p style="margin: 0; font-size: 12px; color: #888;">${sinkhole.description}</p>` : ''}
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
  }, [sinkholes, isMapReady]);

  // 선택된 싱크홀 표시 (인포윈도우 열기 및 지도 중심 이동)
  useEffect(() => {
    if (!isMapReady || !mapInstance.current || !selectedSinkhole || !window.naver || !window.naver.maps) {
      return;
    }

    console.log('📌 선택된 싱크홀:', selectedSinkhole.name);

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
      const markerPosition = marker.getPosition();
      return markerPosition && 
             Math.abs(markerPosition.y - selectedSinkhole.lat) < 0.00001 && 
             Math.abs(markerPosition.x - selectedSinkhole.lng) < 0.00001;
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
      console.warn('⚠️ 선택된 싱크홀의 마커를 찾을 수 없음');
    }
  }, [selectedSinkhole, isMapReady]);




  return (
    <div 
      ref={mapRef} 
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      {/* 지도 유형 컨트롤 */}
      <MapTypeControl
        mapType={mapType}
        onMapTypeChange={handleMapTypeChange}
        isVisible={isMapReady}
      />
      
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
            barWidth={320}
          />
        </div>
      )}
    </div>
  );
};

export default Map;




