import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import MapView from './components/Map';
import RouteSearch from './components/RouteSearch';
import ModeToggle from './components/ModeToggle';
import RouteDisplay from './components/RouteDisplay';
import SinkholeList from './components/SinkholeList';
import { detectSinkholesOnRoute, calculateDetourRoute, injectSinkholesIntoPath, computePathDistance } from './utils/routeCalculator';
import Papa from 'papaparse';

function App() {
  const [mode, setMode] = useState('normal'); // 'normal' 또는 'inspection'
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [route, setRoute] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [mapRef, setMapRef] = useState(null);
  const [selectedSinkhole, setSelectedSinkhole] = useState(null);
  const [selectedInputType, setSelectedInputType] = useState(null); // 'start' 또는 'end'
  const [sinkholes, setSinkholes] = useState([]);
  const [inspectionRadiusKm, setInspectionRadiusKm] = useState(0.05); // 기본 50m
  const [activeTab, setActiveTab] = useState('route'); // 'route' or 'sinkhole'
  const [baseDirectionsRoute, setBaseDirectionsRoute] = useState(null); // Directions 원본 캐시
  const forcedSinkholeIdsRef = useRef(new Set()); // 반경 축소 시에도 유지할 싱크홀 캐시
  const radiusCacheRef = useRef(new Map()); // 반경별 경로 캐시
  
  // 지역 필터 상태
  const [selectedSido, setSelectedSido] = useState('');
  const [selectedSigungu, setSelectedSigungu] = useState('');
  const [selectedDong, setSelectedDong] = useState('');

  // 지역 필터 적용
  const filteredSinkholes = useMemo(() => {
    if (!sinkholes) return [];
    
    let result = sinkholes;
    
    if (selectedSido) {
      result = result.filter(s => s.sido === selectedSido);
    }
    if (selectedSigungu) {
      result = result.filter(s => s.sigungu === selectedSigungu);
    }
    if (selectedDong) {
      result = result.filter(s => s.dong === selectedDong);
    }
    
    return result;
  }, [sinkholes, selectedSido, selectedSigungu, selectedDong]);

  // 필터 변경 시 캐시 초기화
  useEffect(() => {
    radiusCacheRef.current = new Map();
  }, [selectedSido, selectedSigungu, selectedDong]);

  // 지도에 표시할 싱크홀 (탭에 따라 다르게)
  const displayedSinkholes = useMemo(() => {
    // 경로 검색 탭에서는 모든 싱크홀 표시
    if (activeTab === 'route') {
      return sinkholes;
    }
    // 싱크홀 목록 탭에서는 필터링된 싱크홀만 표시
    return filteredSinkholes;
  }, [activeTab, sinkholes, filteredSinkholes]);

  // 지도 인스턴스 설정
  const handleMapReady = useCallback((mapInstance) => {
    console.log('지도 인스턴스 설정:', mapInstance);
    setMapRef(mapInstance);
  }, []);

  // CSV 로드 및 파싱
  useEffect(() => {
    const loadCsv = async () => {
      try {
        const res = await fetch((process.env.PUBLIC_URL || '') + '/sago.csv', { cache: 'no-store' });
        const buffer = await res.arrayBuffer();
        let csvText = '';
        try {
          csvText = new TextDecoder('euc-kr').decode(buffer);
        } catch (e) {
          csvText = new TextDecoder('utf-8').decode(buffer);
        }

        const parsed = Papa.parse(csvText, {
          header: false,
          skipEmptyLines: true,
          dynamicTyping: true
        });

        const rows = parsed.data || [];
        if (!rows.length) {
          setSinkholes([]);
          return;
        }

        const headerRow = rows[0].map(h => (h || '').toString().trim());
        const dataRows = rows.slice(1);

        const findIndex = (candidates) => {
          const lowered = headerRow.map(h => h.toLowerCase());
          for (const name of candidates) {
            const idx = lowered.indexOf(name.toLowerCase());
            if (idx !== -1) return idx;
          }
          return -1;
        };

        const IDX = {
          sagoNo: findIndex(['sagoNo']),
          siDo: findIndex(['siDo', 'sido']),
          siGunGu: findIndex(['siGunGu', 'sigungu']),
          sagoDetail: findIndex(['sagoDetail']),
          sagoDate: findIndex(['sagoDate']),
          no: findIndex(['no']),
          dong: findIndex(['dong']),
          addr: findIndex(['addr']),
          sagoLat: findIndex(['sagoLat']),
          sagoLon: findIndex(['sagoLon']),
          sinkWidth: findIndex(['sinkWidth']),
          sinkExtend: findIndex(['sinkExtend']),
          sinkDepth: findIndex(['sinkDepth']),
          grdKind: findIndex(['grdKind']),
          deathCnt: findIndex(['deathCnt']),
          injuryCnt: findIndex(['injuryCnt']),
          vehicleCnt: findIndex(['vehicleCnt']),
          trStatus: findIndex(['trStatus']),
          trMethod: findIndex(['trMethod']),
          trAmt: findIndex(['trAmt', 'trAmount']),
          trFnDate: findIndex(['trFnDate']),
          daStDate: findIndex(['daStDate'])
        };

        const valueAt = (row, i) => (i >= 0 ? row[i] : undefined);

        const normalizedRows = dataRows.map((r) => ({
          sagoNo: valueAt(r, IDX.sagoNo),
          siDo: valueAt(r, IDX.siDo),
          siGunGu: valueAt(r, IDX.siGunGu),
          sagoDetail: valueAt(r, IDX.sagoDetail),
          sagoDate: valueAt(r, IDX.sagoDate),
          no: valueAt(r, IDX.no),
          dong: valueAt(r, IDX.dong),
          addr: valueAt(r, IDX.addr),
          sagoLat: valueAt(r, IDX.sagoLat),
          sagoLon: valueAt(r, IDX.sagoLon),
          sinkWidth: valueAt(r, IDX.sinkWidth),
          sinkExtend: valueAt(r, IDX.sinkExtend),
          sinkDepth: valueAt(r, IDX.sinkDepth),
          grdKind: valueAt(r, IDX.grdKind),
          deathCnt: valueAt(r, IDX.deathCnt),
          injuryCnt: valueAt(r, IDX.injuryCnt),
          vehicleCnt: valueAt(r, IDX.vehicleCnt),
          trStatus: valueAt(r, IDX.trStatus),
          trMethod: valueAt(r, IDX.trMethod),
          trAmt: valueAt(r, IDX.trAmt),
          trFnDate: valueAt(r, IDX.trFnDate),
          daStDate: valueAt(r, IDX.daStDate)
        }));

        const toSinkhole = (row, index) => {
          const sagoNo = row.sagoNo || row.sagono || row.SAGONO || row['sagoNo'] || row['SAGONO'];
          const latRaw = row.sagoLat ?? row.SAGOLAT ?? row['sagoLat'];
          const lngRaw = row.sagoLon ?? row.SAGOLON ?? row['sagoLon'];
          const lat = typeof latRaw === 'string' ? parseFloat(latRaw) : Number(latRaw);
          const lng = typeof lngRaw === 'string' ? parseFloat(lngRaw) : Number(lngRaw);
          const name = `#${sagoNo || index + 1} 싱크홀`;
          const siDo = row.siDo || row.sido || row.SIDO;
          const siGunGu = row.siGunGu || row.sigungu || row.SIGUNGU;
          const dong = row.dong || row.DONG;
          const addressParts = [siDo, siGunGu, dong, row.addr].filter(Boolean);
          const address = addressParts.join(' ');
          const sizeW = row.sinkWidth ?? row.SINKWIDTH;
          const sizeE = row.sinkExtend ?? row.SINKEXTEND;
          const sizeD = row.sinkDepth ?? row.SINKDEPTH;
          const sizeParts = [sizeW, sizeE, sizeD].filter(v => v !== undefined && v !== null && v !== '');
          const sizeText = sizeParts.length ? `규모 ${sizeParts.join('×')}` : '';
          const dateVal = row.sagoDate ?? row.SAGODATE;
          const dateText = dateVal ? `발생일자 ${dateVal}` : '';
          const grdVal = row.grdKind ?? row.GRDKIND;
          const grdText = grdVal ? `지질 ${grdVal}` : '';
          const death = row.deathCnt ?? row.DEATHCNT;
          const injury = row.injuryCnt ?? row.INJURYCNT;
          const vehicle = row.vehicleCnt ?? row.VEHICLECNT;
          const dmgText = (death || injury || vehicle) ? `피해 사망:${death || 0} 부상:${injury || 0} 차량:${vehicle || 0}` : '';
          const detailText = row.sagoDetail ? String(row.sagoDetail).trim() : '';
          const description = [dateText, sizeText, grdText, dmgText, detailText].filter(Boolean).join(' | ');

          return {
            id: sagoNo || `${row.no || index + 1}`,
            lat: Number.isFinite(lat) ? lat : 0,
            lng: Number.isFinite(lng) ? lng : 0,
            name,
            description,
            address,
            sido: siDo || '',
            sigungu: siGunGu || '',
            dong: dong || ''
          };
        };

        const mapped = normalizedRows
          .map(toSinkhole)
          .filter(item => item.lat !== 0 && item.lng !== 0);

        setSinkholes(mapped);
      } catch (e) {
        console.error('CSV 로드 실패:', e);
        setError('싱크홀 데이터를 불러오는 중 오류가 발생했습니다.');
      }
    };

    loadCsv();
  }, []);

  // 지도에서 위치 선택 시 호출되는 함수
  const handleLocationSelect = useCallback((location, type) => {
    console.log('📍 지도 클릭으로 위치 선택:', { location, type });
    if (type === 'start') {
      setStartPoint(location);
      console.log('✅ 출발지 설정됨:', location);
    } else {
      setEndPoint(location);
      console.log('✅ 도착지 설정됨:', location);
    }
  }, []);

  // 입력 타입 선택 함수
  const handleInputTypeSelect = useCallback((type) => {
    setSelectedInputType(type);
    console.log('입력 타입 선택:', type);
  }, []);

  // 반경 변경 등 재계산 시 강제 포함 집합에 id들을 추가
  const addForcedSinkholes = useCallback((sinkholes) => {
    const setRef = forcedSinkholeIdsRef.current;
    for (const s of sinkholes || []) {
      if (s && s.id != null) setRef.add(s.id);
    }
    // 포함 집합이 바뀌면 반경 캐시 무효화
    radiusCacheRef.current = new Map();
  }, []);

  // 싱크홀 클릭 시 처리 (모든 모드에서 동일하게 작동)
  const handleSinkholeClick = useCallback((sinkhole) => {
    console.log('싱크홀 클릭:', sinkhole);
    
    if (mapRef && window.naver && window.naver.maps) {
      try {
        const position = new window.naver.maps.LatLng(sinkhole.lat, sinkhole.lng);
        mapRef.setCenter(position);
        mapRef.setZoom(15, true);
        setSelectedSinkhole(sinkhole);
      } catch (error) {
        console.error('싱크홀 처리 실패:', error);
      }
    } else {
      console.error('지도 인스턴스 또는 네이버 API를 찾을 수 없습니다:', {
        mapRef: !!mapRef,
        naver: !!window.naver,
        maps: !!(window.naver && window.naver.maps)
      });
    }
  }, [mapRef]);

  // 경로 검색 함수
  const handleRouteSearch = async (start, end) => {
    if (!start || !end) {
      setError('출발지와 도착지를 모두 입력해주세요.');
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      let route;
      
      // 네이버 Directions 5 API (프록시)로 실제 경로 조회
      try {
        route = await findRouteWithNaverDirections(start, end);
      } catch (e) {
        console.warn('네이버 Directions 실패, 백업 경로 사용:', e);
        route = generateBasicRoute(start, end);
      }

      console.log('route', route);
      setBaseDirectionsRoute(route);
      forcedSinkholeIdsRef.current = new Set(); // 새 출발/도착 시 강제 포함 캐시 초기화
      radiusCacheRef.current = new Map(); // 반경 캐시 초기화
      
      if (mode === 'normal') {
        // 일반 모드: 싱크홀 감지 후 우회 경로 제공 (전체 싱크홀 대상)
        const detectedSinkholes = detectSinkholesOnRoute(route.path, sinkholes, 0.05); // 50m = 0.05km
        
        if (detectedSinkholes.length > 0) {
          // 싱크홀이 발견되면 우회 경로 계산
          const detourRoute = calculateDetourRoute(start, end, detectedSinkholes);
          setRoute({
            ...detourRoute,
            originalRoute: route,
            detectedSinkholes: detectedSinkholes,
            hasSinkholes: true
          });
        } else {
          // 싱크홀이 없으면 기본 경로 사용
          setRoute({
            ...route,
            hasSinkholes: false
          });
        }
      } else {
        // 안전점검 모드: Directions 경로를 유지하되, 근접 싱크홀을 path 중간에 삽입하여 부드러움을 유지 (전체 싱크홀 대상)
        const radius = Number.isFinite(inspectionRadiusKm) ? inspectionRadiusKm : 0.05;
        const { path: injectedPath, detectedSinkholes } = injectSinkholesIntoPath(
          route.path,
          sinkholes,
          radius,
          forcedSinkholeIdsRef.current
        );
        const newDistance = computePathDistance(injectedPath);
        setRoute({
          path: injectedPath,
          distance: newDistance || route.distance,
          duration: route.duration,
          hasSinkholes: detectedSinkholes.length > 0,
          detectedSinkholes,
          originalRoute: route
        });
        addForcedSinkholes(detectedSinkholes);
        // 현재 반경 결과 캐시
        radiusCacheRef.current.set(Number(radius.toFixed(2)), {
          path: injectedPath,
          distance: newDistance || route.distance,
          duration: route.duration,
          hasSinkholes: detectedSinkholes.length > 0,
          detectedSinkholes
        });
      }
    } catch (err) {
      setError('경로를 찾는 중 오류가 발생했습니다.');
      console.error('Route search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // 반경 변경 시 API 재호출 없이 캐시 기반으로 재계산 (전체 싱크홀 대상)
  useEffect(() => {
    if (mode !== 'inspection') return;
    if (!baseDirectionsRoute) return;

    const radius = Number.isFinite(inspectionRadiusKm) ? inspectionRadiusKm : 0.05;
    const key = Number(radius.toFixed(2));
    const cached = radiusCacheRef.current.get(key);
    if (cached) {
      setRoute({ ...cached, originalRoute: baseDirectionsRoute });
      return;
    }

    const { path: injectedPath, detectedSinkholes } = injectSinkholesIntoPath(
      baseDirectionsRoute.path,
      sinkholes,
      radius,
      forcedSinkholeIdsRef.current
    );
    const newDistance = computePathDistance(injectedPath);
    const computed = {
      path: injectedPath,
      distance: newDistance || baseDirectionsRoute.distance,
      duration: baseDirectionsRoute.duration,
      hasSinkholes: detectedSinkholes.length > 0,
      detectedSinkholes
    };
    setRoute({ ...computed, originalRoute: baseDirectionsRoute });
    addForcedSinkholes(detectedSinkholes);
    radiusCacheRef.current.set(key, computed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inspectionRadiusKm, mode, baseDirectionsRoute, sinkholes]);

  // (임시) 외부 길찾기 제거: 백업 경로 생성 함수만 사용
  const findRouteWithNaverDirections = async (start, end) => {
    const params = new URLSearchParams();
    params.set('startLng', String(start.lng));
    params.set('startLat', String(start.lat));
    params.set('endLng', String(end.lng));
    params.set('endLat', String(end.lat));
    params.set('option', 'traoptimal');

    const resp = await fetch(`/api/directions?${params.toString()}`, { cache: 'no-store' });
    let payload;
    try { payload = await resp.json(); } catch (e) { payload = { parseError: true }; }
    if (!resp.ok) {
      console.error('Directions error payload:', payload);
      throw new Error('Directions proxy error');
    }
    const data = payload;

    if (!data || data.code !== 0 || !data.route || !data.route.traoptimal || !data.route.traoptimal[0]) {
      throw new Error('Invalid directions response');
    }

    const best = data.route.traoptimal[0];
    const path = (best.path || []).map(([lng, lat]) => ({ lat, lng }));
    const distanceKm = (best.summary && typeof best.summary.distance === 'number') ? best.summary.distance / 1000 : undefined;
    const durationSec = (best.summary && typeof best.summary.duration === 'number') ? Math.round(best.summary.duration / 1000) : undefined;

    return {
      path,
      distance: distanceKm,
      duration: durationSec,
      hasSinkholes: false
    };
  };

  // POC용 기본 경로 생성 (직선 + 중간 waypoint) - 백업용
  const generateBasicRoute = (start, end) => {
    const midLat = (start.lat + end.lat) / 2;
    const midLng = (start.lng + end.lng) / 2;
    
    // 약간의 편차를 주어 실제 도로와 유사하게
    const offsetLat = (Math.random() - 0.5) * 0.01;
    const offsetLng = (Math.random() - 0.5) * 0.01;
    
    const waypoint = {
      lat: midLat + offsetLat,
      lng: midLng + offsetLng
    };

    return {
      path: [start, waypoint, end],
      distance: calculateDistance(start.lat, start.lng, end.lat, end.lng),
      hasSinkholes: false
    };
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

  return (
    <div className="app">
      <div className="control-panel">
        <h1>🚧 싱크홀 안전 지도</h1>
        <div className="tab-nav">
          <button
            className={`tab-btn ${activeTab === 'route' ? 'active' : ''}`}
            onClick={() => setActiveTab('route')}
          >
            경로 검색
          </button>
          <button
            className={`tab-btn ${activeTab === 'sinkhole' ? 'active' : ''}`}
            onClick={() => setActiveTab('sinkhole')}
          >
            싱크홀 목록
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'route' && (
            <>
              <ModeToggle
                mode={mode}
                onModeChange={setMode}
                inspectionRadiusKm={inspectionRadiusKm}
                onInspectionRadiusChange={setInspectionRadiusKm}
              />
              <RouteSearch
                startPoint={startPoint}
                endPoint={endPoint}
                onStartChange={setStartPoint}
                onEndChange={setEndPoint}
                onSearch={() => handleRouteSearch(startPoint, endPoint)}
                isSearching={isSearching}
                onInputTypeSelect={handleInputTypeSelect}
              />
              <RouteDisplay
                route={route}
                mode={mode}
                error={error}
              />
            </>
          )}
          {activeTab === 'sinkhole' && (
            <SinkholeList
              sinkholes={sinkholes}
              selectedSinkhole={selectedSinkhole}
              onSinkholeClick={handleSinkholeClick}
              selectedSido={selectedSido}
              selectedSigungu={selectedSigungu}
              selectedDong={selectedDong}
              onSidoChange={setSelectedSido}
              onSigunguChange={setSelectedSigungu}
              onDongChange={setSelectedDong}
            />
          )}
        </div>
      </div>

      <div className="map-container">
        <MapView
          sinkholes={displayedSinkholes}
          selectedSinkhole={selectedSinkhole}
          route={route}
          onLocationSelect={handleLocationSelect}
          onMapReady={handleMapReady}
          selectedInputType={selectedInputType}
          inspectionRadiusKm={inspectionRadiusKm}
        />
      </div>
    </div>
  );
}

export default App;

