import React, { useEffect, useRef, useState, useCallback } from 'react';
import HeatmapLegend from './HeatmapLegend';
import MapTypeControl from './MapTypeControl';
import { getSinkholeVisualStyle } from '../utils/sinkholeAnalyzer';

const Map = ({ sinkholes, selectedSinkhole, route, onLocationSelect, onMapReady, selectedInputType, inspectionRadiusKm, activeTab, startPoint, endPoint, showHeatmap, heatmapGradient, showRouteHeatband, rescaleMethod, legendMin, legendMax }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const polylinesRef = useRef([]);
  const infoWindowsRef = useRef([]);
  const circlesRef = useRef([]);
  const heatmapRef = useRef(null);
  const routeHeatbandRef = useRef(null);
  const isMovingRef = useRef(false);
  const onLocationSelectRef = useRef(onLocationSelect);
  const selectedInputTypeRef = useRef(selectedInputType);
  const contextMenuRef = useRef(null);
  const startMarkerRef = useRef(null);
  const endMarkerRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapType, setMapType] = useState('normal');

  // onLocationSelect가 변경될 때마다 ref 업데이트
  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  // selectedInputType 변경 감지 및 ref 업데이트
  useEffect(() => {
    console.log('🔄 selectedInputType 변경됨:', selectedInputType);
    selectedInputTypeRef.current = selectedInputType;
  }, [selectedInputType]);

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

    // 컨텍스트 메뉴 표시 함수
    const showContextMenu = (e) => {
      // 경로 검색 탭이 아니면 메뉴를 표시하지 않음
      if (activeTab !== 'route') return;

      hideContextMenu(); // 기존 메뉴 제거

      const latlng = e.coord;
      const position = e.offset;

      // 컨텍스트 메뉴 생성
      const menu = document.createElement('div');
      menu.className = 'map-context-menu';
      menu.style.left = position.x + 'px';
      menu.style.top = position.y + 'px';

      // 출발 버튼
      const startBtn = document.createElement('div');
      startBtn.className = 'map-context-menu-item';
      startBtn.innerHTML = '<span class="menu-icon">🟢</span> 출발';
      startBtn.onclick = () => {
        const location = { lat: latlng.y, lng: latlng.x };
        if (onLocationSelectRef.current) {
          onLocationSelectRef.current(location, 'start');
        }
        hideContextMenu();
      };

      // 도착 버튼
      const endBtn = document.createElement('div');
      endBtn.className = 'map-context-menu-item';
      endBtn.innerHTML = '<span class="menu-icon">🔴</span> 도착';
      endBtn.onclick = () => {
        const location = { lat: latlng.y, lng: latlng.x };
        if (onLocationSelectRef.current) {
          onLocationSelectRef.current(location, 'end');
        }
        hideContextMenu();
      };

      menu.appendChild(startBtn);
      menu.appendChild(endBtn);
      
      mapRef.current.appendChild(menu);
      contextMenuRef.current = menu;
    };

    // 컨텍스트 메뉴 숨기기 함수
    const hideContextMenu = () => {
      if (contextMenuRef.current) {
        contextMenuRef.current.remove();
        contextMenuRef.current = null;
      }
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

        window.naver.maps.Event.addListener(mapInstance.current, 'click', (e) => {
          const latlng = e.coord;
          const location = { lat: latlng.y, lng: latlng.x };
          const inputType = selectedInputTypeRef.current || 'start';
          if (onLocationSelectRef.current) {
            onLocationSelectRef.current(location, inputType);
          }
          // 컨텍스트 메뉴 숨기기
          hideContextMenu();
        });

        // 우클릭 이벤트 리스너 추가
        window.naver.maps.Event.addListener(mapInstance.current, 'rightclick', (e) => {
          e.domEvent.preventDefault();
          showContextMenu(e);
        });

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
          if (routeHeatbandRef.current && showRouteHeatband) {
            try { routeHeatbandRef.current.setMap(mapInstance.current); } catch (e) {}
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
      if (routeHeatbandRef.current) { try { routeHeatbandRef.current.setMap(null); } catch (e) {} }
    });
    const zoomHandler = window.naver.maps.Event.addListener(mapInstance.current, 'zoomstart', () => {
      isMovingRef.current = true;
      if (heatmapRef.current) { try { heatmapRef.current.setMap(null); } catch (e) {} }
      if (routeHeatbandRef.current) { try { routeHeatbandRef.current.setMap(null); } catch (e) {} }
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

  // 경로 히트밴드(경로 주변 위험 밀도)를 위한 보조 HeatMap
  useEffect(() => {
    if (!isMapReady || !mapInstance.current || !window.naver || !window.naver.maps || !window.naver.maps.visualization) return;

    if (!showRouteHeatband || !route || !route.path || route.path.length === 0) {
      if (routeHeatbandRef.current) {
        try { routeHeatbandRef.current.setMap(null); } catch (e) {}
      }
      return;
    }

    // 경로 샘플 포인트 생성 및 주변 싱크홀 밀도로 weight 부여
    const sampleEveryMeters = 80; // 대략 샘플 간격(튜닝 가능)
    const radiusKm = Number.isFinite(inspectionRadiusKm) ? inspectionRadiusKm : 0.05;
    const routePoints = route.path;
    const samples = [];
    const toKm = (a, b) => {
      const R = 6371;
      const dLat = (b.lat - a.lat) * Math.PI / 180;
      const dLng = (b.lng - a.lng) * Math.PI / 180;
      const x = Math.sin(dLat/2) ** 2 + Math.cos(a.lat*Math.PI/180) * Math.cos(b.lat*Math.PI/180) * Math.sin(dLng/2) ** 2;
      return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
    };
    const interpolate = (a, b, t) => ({ lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t });

    for (let i = 0; i < routePoints.length - 1; i++) {
      const a = routePoints[i];
      const b = routePoints[i + 1];
      const distKm = toKm(a, b);
      const steps = Math.max(1, Math.floor((distKm * 1000) / sampleEveryMeters));
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        samples.push(interpolate(a, b, t));
      }
    }

    const densityAt = (p) => {
      let sum = 0;
      for (const sh of sinkholes || []) {
        const d = toKm(p, { lat: sh.lat, lng: sh.lng });
        if (d <= radiusKm) {
          const w = Number(sh.weight) || 0;
          // 거리 기반 감쇠 (선형)
          const atten = Math.max(0, 1 - (d / radiusKm));
          sum += w * atten;
        }
      }
      return sum;
    };

    const densities = samples.map(p => ({ p, val: densityAt(p) }));
    const maxVal = densities.reduce((m, x) => Math.max(m, x.val), 0) || 1;
    const data = densities.map(({ p, val }) => ({
      location: new window.naver.maps.LatLng(p.lat, p.lng),
      weight: Math.max(0, Math.min(maxVal, Math.round(val)))
    }));

    if (!routeHeatbandRef.current) {
      try {
        routeHeatbandRef.current = new window.naver.maps.visualization.HeatMap({
          map: mapInstance.current,
          data,
          radius: 12,
          opacity: 0.55,
          gradient: heatmapGradient || undefined
        });
      } catch (e) {
        console.error('❌ Route Heatband 생성 실패:', e);
      }
    } else {
      try {
        routeHeatbandRef.current.setData(data);
        routeHeatbandRef.current.setOptions({ gradient: heatmapGradient || undefined });
        routeHeatbandRef.current.setMap(mapInstance.current);
      } catch (e) {
        console.error('❌ Route Heatband 업데이트 실패:', e);
      }
    }

    return () => {
      if (routeHeatbandRef.current && !showRouteHeatband) {
        try { routeHeatbandRef.current.setMap(null); } catch (e) {}
      }
    };
  }, [isMapReady, route, sinkholes, showRouteHeatband, heatmapGradient, inspectionRadiusKm]);

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

  // 경로 표시
  useEffect(() => {
    if (!isMapReady || !mapInstance.current || !route || !window.naver || !window.naver.maps) {
      console.log('⚠️ 경로 표시: 지도 또는 경로 없음', { isMapReady, hasRoute: !!route });
      return;
    }

    console.log('🛣️ 경로 그리기 시작:', route);

    // 기존 경로 제거
    polylinesRef.current.forEach(polyline => {
      try {
        polyline.setMap(null);
      } catch (e) {
        console.error('폴리라인 제거 오류:', e);
      }
    });
    polylinesRef.current = [];

    try {
      const path = route.path.map(point => new window.naver.maps.LatLng(point.lat, point.lng));

      // originalRoute가 있으면: 현재 경로는 우회/포함 경로 (파란색 실선)
      // originalRoute가 없으면: 현재 경로는 원래 경로 (빨간색 점선)
      if (route.originalRoute) {
        // 1. 먼저 우회/포함 경로 그리기 (파란색 실선)
        const mainPolyline = new window.naver.maps.Polyline({
          path,
          map: mapInstance.current,
          strokeColor: '#2196F3',
          strokeWeight: 5,
          strokeOpacity: 0.8,
          strokeStyle: 'solid'
        });
        polylinesRef.current.push(mainPolyline);
        console.log('✅ 우회/포함 경로 그리기 완료 (파란색)');

        // 2. 나중에 원래 경로 그리기 (빨간색 점선) - 위에 표시됨
        const originalPath = route.originalRoute.path.map(point => new window.naver.maps.LatLng(point.lat, point.lng));
        const originalPolyline = new window.naver.maps.Polyline({
          path: originalPath,
          map: mapInstance.current,
          strokeColor: '#FF0000',
          strokeWeight: 5,
          strokeOpacity: 0.8,
          strokeStyle: 'shortdash'
        });
        polylinesRef.current.push(originalPolyline);
        console.log('✅ 원래 경로 그리기 완료 (빨간색 점선)');
      } else {
        // 원래 경로만 있는 경우 (빨간색 점선)
        const polyline = new window.naver.maps.Polyline({
          path,
          map: mapInstance.current,
          strokeColor: '#FF0000',
          strokeWeight: 5,
          strokeOpacity: 0.8,
          strokeStyle: 'shortdash'
        });
        polylinesRef.current.push(polyline);
        console.log('✅ 기본 경로 그리기 완료 (빨간색 점선)');
      }

      const bounds = new window.naver.maps.LatLngBounds();
      path.forEach(latlng => bounds.extend(latlng));
      mapInstance.current.fitBounds(bounds);
      console.log('✅ 지도 범위 조정 완료');
    } catch (error) {
      console.error('❌ 경로 그리기 오류:', error);
    }

  }, [route, isMapReady]);

  // 경로에 포함된 싱크홀 반경 그라데이션 표시
  useEffect(() => {
    if (!isMapReady || !mapInstance.current || !window.naver || !window.naver.maps) return;

    // 기존 원형 제거
    circlesRef.current.forEach(c => c.setMap(null));
    circlesRef.current = [];

    if (!route || !route.detectedSinkholes || route.detectedSinkholes.length === 0) return;

    const radiusKm = Number.isFinite(inspectionRadiusKm) ? inspectionRadiusKm : 0.05; // 기본 50m
    const radiusMeters = Math.max(1, Math.round(radiusKm * 1000));

    const levels = [
      { factor: 1.0, opacity: 0.25 },
      { factor: 0.66, opacity: 0.15 },
      { factor: 0.33, opacity: 0.08 }
    ];

    route.detectedSinkholes.forEach(s => {
      if (!Number.isFinite(s.lat) || !Number.isFinite(s.lng)) return;
      const center = new window.naver.maps.LatLng(s.lat, s.lng);
      levels.forEach((lv) => {
        const circle = new window.naver.maps.Circle({
          map: mapInstance.current,
          center,
          radius: Math.max(1, Math.round(radiusMeters * lv.factor)),
          strokeWeight: 0,
          strokeOpacity: 0,
          fillColor: '#FF9800',
          fillOpacity: lv.opacity,
          clickable: false
        });
        circlesRef.current.push(circle);
      });
    });
  }, [route, inspectionRadiusKm, isMapReady]);

  // 출발/도착 마커 업데이트
  useEffect(() => {
    if (!isMapReady || !mapInstance.current || !window.naver || !window.naver.maps) {
      console.log('⚠️ 출발/도착 마커: 지도 인스턴스가 준비되지 않음', { isMapReady });
      return;
    }

    // 기존 출발 마커 제거
    if (startMarkerRef.current) {
      try {
        startMarkerRef.current.setMap(null);
        console.log('🗑️ 기존 출발 마커 제거');
      } catch (e) {
        console.error('출발 마커 제거 오류:', e);
      }
      startMarkerRef.current = null;
    }

    // 기존 도착 마커 제거
    if (endMarkerRef.current) {
      try {
        endMarkerRef.current.setMap(null);
        console.log('🗑️ 기존 도착 마커 제거');
      } catch (e) {
        console.error('도착 마커 제거 오류:', e);
      }
      endMarkerRef.current = null;
    }

    // 출발 마커 추가
    if (startPoint && Number.isFinite(startPoint.lat) && Number.isFinite(startPoint.lng)) {
      try {
        const startMarker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(startPoint.lat, startPoint.lng),
          map: mapInstance.current,
          icon: {
            content: '<div style="background: #4CAF50; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 18px;">🏁</div>',
            anchor: new window.naver.maps.Point(16, 16)
          },
          zIndex: 1000
        });
        startMarkerRef.current = startMarker;
        console.log('✅ 출발 마커 생성:', startPoint);
      } catch (error) {
        console.error('❌ 출발 마커 생성 오류:', error);
      }
    }

    // 도착 마커 추가
    if (endPoint && Number.isFinite(endPoint.lat) && Number.isFinite(endPoint.lng)) {
      try {
        const endMarker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(endPoint.lat, endPoint.lng),
          map: mapInstance.current,
          icon: {
            content: '<div style="background: #F44336; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 18px;">🏁</div>',
            anchor: new window.naver.maps.Point(16, 16)
          },
          zIndex: 1000
        });
        endMarkerRef.current = endMarker;
        console.log('✅ 도착 마커 생성:', endPoint);
      } catch (error) {
        console.error('❌ 도착 마커 생성 오류:', error);
      }
    }
  }, [startPoint, endPoint, isMapReady]);

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




