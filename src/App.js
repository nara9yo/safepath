import React, { useState, useCallback, useEffect, useMemo } from 'react';
import MapView from './components/Map';
import TabPanel from './components/TabPanel';
import MapSettings from './components/MapSettings';
import SinkholeList from './components/SinkholeList';
import SimulationPanel from './components/SimulationPanel';
import { getGradientByName } from './utils/heatmapPresets';
import { enhanceSinkholesWithWeight } from './utils/sinkholeAnalyzer';
import { applySubwayRiskWeights } from './utils/subwayAnalyzer';
import Papa from 'papaparse';

function App() {
  const [mapRef, setMapRef] = useState(null);
  const [selectedSinkhole, setSelectedSinkhole] = useState(null);
  const [sinkholes, setSinkholes] = useState([]);
  
  // 탭 상태
  const [activeTab, setActiveTab] = useState('map-settings');
  
  // 지도 유형 상태 (기본값: 일반)
  const [mapType, setMapType] = useState('normal');
  
  // 히트맵 설정 상태
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [heatmapPreset, setHeatmapPreset] = useState('severity');
  
  // 지하철 노선 설정 상태
  const [showSubway, setShowSubway] = useState(false);
  const [showSubwayInfluence, setShowSubwayInfluence] = useState(true); // 기본값 true
  const [subwayStations, setSubwayStations] = useState([]);

  // 지하철 노선 변경 핸들러 (노선 활성화 시 영향권도 함께 활성화)
  const handleShowSubwayChange = useCallback((checked) => {
    setShowSubway(checked);
    if (checked) {
      setShowSubwayInfluence(true);
    } else {
      setShowSubwayInfluence(false);
    }
  }, []);
  
  // 싱크홀 마커 표시 상태
  const [showMarkers, setShowMarkers] = useState(true);
  
  // 마커 위험도 필터 상태 (지도 설정용)
  const [markerRiskFilter, setMarkerRiskFilter] = useState('all');
  
  // 지역 필터 상태
  const [selectedSido, setSelectedSido] = useState('');
  const [selectedSigungu, setSelectedSigungu] = useState('');
  const [selectedDong, setSelectedDong] = useState('');
  
  // 위험도 필터 상태 (싱크홀 목록용)
  const [selectedRiskLevels, setSelectedRiskLevels] = useState([]);
  
  // 지하철 영향도 필터 상태 (싱크홀 목록용)
  const [selectedInfluenceLevels, setSelectedInfluenceLevels] = useState([]);
  
  // 시뮬레이션 상태
  const [simulationData, setSimulationData] = useState([]);

  // 마커 위험도 필터 변경 시 싱크홀 목록 필터 동기화
  const handleMarkerRiskFilterChange = useCallback((newFilter) => {
    setMarkerRiskFilter(newFilter);
    
    // 마커 필터를 싱크홀 목록 필터로 변환
    if (newFilter === 'all') {
      setSelectedRiskLevels(['low', 'medium', 'high', 'critical']);
    } else {
      setSelectedRiskLevels([newFilter]);
    }
  }, []);

  // 싱크홀 목록 위험도 필터 변경 시 마커 필터 동기화
  const handleRiskLevelChange = useCallback((newRiskLevels) => {
    setSelectedRiskLevels(newRiskLevels);
    
    // 싱크홀 목록 필터를 마커 필터로 변환
    if (newRiskLevels.length === 0 || newRiskLevels.length === 4) {
      setMarkerRiskFilter('all');
    } else if (newRiskLevels.length === 1) {
      setMarkerRiskFilter(newRiskLevels[0]);
    } else {
      // 여러 위험도가 선택된 경우 'all'로 설정
      setMarkerRiskFilter('all');
    }
  }, []);

  // 지하철 영향도 필터 변경 핸들러
  const handleInfluenceLevelChange = useCallback((newInfluenceLevels) => {
    setSelectedInfluenceLevels(newInfluenceLevels);
  }, []);

  // 지하철 노선 가중치가 적용된 싱크홀 데이터
  const sinkholesWithSubwayWeights = useMemo(() => {
    if (!sinkholes || !subwayStations || subwayStations.length === 0) {
      return sinkholes;
    }
    
    return applySubwayRiskWeights(sinkholes, subwayStations);
  }, [sinkholes, subwayStations]);

  // 지역 필터, 위험도 필터, 지하철 영향도 필터 적용
  const filteredSinkholes = useMemo(() => {
    if (!sinkholesWithSubwayWeights) return [];
    
    let result = sinkholesWithSubwayWeights;
    
    // 지역 필터 적용
    if (selectedSido) {
      result = result.filter(s => s.sido === selectedSido);
    }
    if (selectedSigungu) {
      result = result.filter(s => s.sigungu === selectedSigungu);
    }
    if (selectedDong) {
      result = result.filter(s => s.dong === selectedDong);
    }
    
    // 위험도 필터 적용
    if (selectedRiskLevels.length > 0) {
      result = result.filter(s => {
        const riskLevel = s.riskLevel || 'low';
        return selectedRiskLevels.includes(riskLevel);
      });
    }
    
    // 지하철 영향도 필터 적용
    if (selectedInfluenceLevels.length > 0) {
      result = result.filter(s => {
        const influenceLevel = s.subwayInfluenceLevel || 'level1';
        return selectedInfluenceLevels.includes(influenceLevel);
      });
    }
    
    return result;
  }, [sinkholesWithSubwayWeights, selectedSido, selectedSigungu, selectedDong, selectedRiskLevels, selectedInfluenceLevels]);


  // 지도에 표시할 싱크홀 (시뮬레이션 탭일 때는 시뮬레이션 데이터 사용)
  const displayedSinkholes = useMemo(() => {
    if (activeTab === 'simulation' && simulationData.length > 0) {
      return simulationData;
    }
    return filteredSinkholes;
  }, [activeTab, simulationData, filteredSinkholes]);

  // 히트맵 범례용 min/max (weight 기준)
  const legendDomain = useMemo(() => {
    const arr = (displayedSinkholes || []).map(s => {
      // 시뮬레이션 데이터는 finalWeight 사용, 일반 데이터는 weight 사용
      const weight = activeTab === 'simulation' ? s.finalWeight : s.weight;
      return Number(weight) || 0;
    }).filter(Number.isFinite);
    if (!arr.length) return { min: 0, max: 10 };
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    return { min: Math.floor(min), max: Math.ceil(max) };
  }, [displayedSinkholes, activeTab]);

  // 지도 인스턴스 설정
  const handleMapReady = useCallback((mapInstance) => {
    setMapRef(mapInstance);
  }, []);

  // 지하철 노선 데이터 로드
  useEffect(() => {
    const loadSubwayData = async () => {
      try {
        const res = await fetch((process.env.PUBLIC_URL || '') + '/subway.csv', { cache: 'no-store' });
        const buffer = await res.arrayBuffer();
        let csvText = '';
        try {
          csvText = new TextDecoder('utf-8').decode(buffer);
        } catch (e) {
          csvText = new TextDecoder('euc-kr').decode(buffer);
        }

        const parsed = Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true
        });

        const stations = parsed.data
          .filter(row => row.역명 && row.lat && row.lng)
          .map(row => ({
            name: row.역명,
            lat: Number(row.lat),
            lng: Number(row.lng),
            line: row.선명 || '1호선',
            address: row.도로명주소 || row.지번주소 || ''
          }))

        setSubwayStations(stations);
      } catch (e) {
        // 지하철 노선 데이터 로드 실패 시 무시
      }
    };

    loadSubwayData();
  }, []);

  // CSV 로드 및 파싱
  useEffect(() => {
    const loadCsv = async () => {
      try {
        const res = await fetch((process.env.PUBLIC_URL || '') + '/sago.csv', { cache: 'no-store' });
        const buffer = await res.arrayBuffer();
        let csvText = '';
        try {
          csvText = new TextDecoder('utf-8').decode(buffer);
        } catch (e) {
          csvText = new TextDecoder('euc-kr').decode(buffer);
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
            dong: dong || '',
            // 원시 크기 값 보존 (클러스터 가중치/표시에 활용)
            sinkWidth: Number(sizeW) || 0,
            sinkExtend: Number(sizeE) || 0,
            sinkDepth: Number(sizeD) || 0,
            // 최대규모 정보 추가 (폭 x 연장 x 깊이 형식)
            maxSize: (() => {
              const width = Number(sizeW) || 0;
              const length = Number(sizeE) || 0;
              const depth = Number(sizeD) || 0;
              return (width > 0 || length > 0 || depth > 0) 
                ? `${width.toFixed(1)}m x ${length.toFixed(1)}m x ${depth.toFixed(1)}m`
                : 'N/A';
            })(),
            // 피해 지표를 가중치 계산에 활용하기 위해 보존
            deathCnt: Number(death) || 0,
            injuryCnt: Number(injury) || 0,
            vehicleCnt: Number(vehicle) || 0
          };
        };

        const mapped = normalizedRows
          .map(toSinkhole)
          .filter(item => item.lat !== 0 && item.lng !== 0);

        // 싱크홀 가중치 분석 및 클러스터링 적용
        const enhancedSinkholes = enhanceSinkholesWithWeight(mapped, 0.01); // 10m 반경으로 클러스터링
        
        setSinkholes(enhancedSinkholes);
      } catch (e) {
        // CSV 로드 실패 시 무시
      }
    };

    loadCsv();
  }, []);


  // 싱크홀 클릭 시 처리 (모든 모드에서 동일하게 작동)
  const handleSinkholeClick = useCallback((sinkhole) => {
    
    if (mapRef && window.naver && window.naver.maps) {
      try {
        const position = new window.naver.maps.LatLng(sinkhole.lat, sinkhole.lng);
        mapRef.setCenter(position);
        mapRef.setZoom(15, true);
        setSelectedSinkhole(sinkhole);
      } catch (error) {
        // 싱크홀 처리 실패 시 무시
      }
    }
  }, [mapRef]);


  // 탭 정의
  const tabs = [
    { id: 'map-settings', label: '지도설정', icon: '⚙️' },
    { id: 'sinkhole-list', label: '싱크홀목록', icon: '📋' },
    { id: 'simulation', label: '시뮬레이션', icon: '🎛️' }
  ];

  return (
    <div className="app">
      <div className="control-panel">
        <h1>🚧 싱크홀 안전 지도</h1>
        
        <TabPanel
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        >
          {activeTab === 'map-settings' && (
            <MapSettings
              mapType={mapType}
              onMapTypeChange={setMapType}
              showMarkers={showMarkers}
              onShowMarkersChange={setShowMarkers}
              markerRiskFilter={markerRiskFilter}
              onMarkerRiskFilterChange={handleMarkerRiskFilterChange}
              showHeatmap={showHeatmap}
              onShowHeatmapChange={setShowHeatmap}
              heatmapPreset={heatmapPreset}
              onHeatmapPresetChange={setHeatmapPreset}
              showSubway={showSubway}
              onShowSubwayChange={handleShowSubwayChange}
              showSubwayInfluence={showSubwayInfluence}
              onShowSubwayInfluenceChange={setShowSubwayInfluence}
              sinkholes={sinkholes}
            />
          )}
          
          {activeTab === 'sinkhole-list' && (
            <SinkholeList
              sinkholes={filteredSinkholes}
              allSinkholes={sinkholesWithSubwayWeights}
              selectedSinkhole={selectedSinkhole}
              onSinkholeClick={handleSinkholeClick}
              selectedSido={selectedSido}
              selectedSigungu={selectedSigungu}
              selectedDong={selectedDong}
              onSidoChange={setSelectedSido}
              onSigunguChange={setSelectedSigungu}
              onDongChange={setSelectedDong}
              selectedRiskLevels={selectedRiskLevels}
              onRiskLevelChange={handleRiskLevelChange}
              selectedInfluenceLevels={selectedInfluenceLevels}
              onInfluenceLevelChange={handleInfluenceLevelChange}
            />
          )}
          
          {activeTab === 'simulation' && (
            <SimulationPanel
              sinkholes={sinkholes}
              subwayStations={subwayStations}
              onSimulationDataChange={setSimulationData}
            />
          )}
        </TabPanel>
      </div>

      <div className="map-container">
        <MapView
          sinkholes={displayedSinkholes}
          selectedSinkhole={selectedSinkhole}
          onMapReady={handleMapReady}
          showMarkers={showMarkers}
          markerRiskFilter={markerRiskFilter}
          showHeatmap={showHeatmap}
          heatmapGradient={getGradientByName(heatmapPreset)}
          legendMin={legendDomain.min}
          legendMax={legendDomain.max}
          mapType={mapType}
          showSubway={showSubway}
          showSubwayInfluence={showSubwayInfluence}
          subwayStations={subwayStations}
        />
      </div>
    </div>
  );
}

export default App;
