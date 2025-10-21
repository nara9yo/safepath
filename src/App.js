import React, { useState, useCallback, useEffect, useMemo } from 'react';
import MapView from './components/Map';
import TabPanel from './components/TabPanel';
import MapSettings from './components/MapSettings';
import SinkholeList from './components/SinkholeList';
import { getGradientByName } from './utils/heatmapPresets';
import { enhanceSinkholesWithWeight } from './utils/sinkholeAnalyzer';
import Papa from 'papaparse';

function App() {
  const [mapRef, setMapRef] = useState(null);
  const [selectedSinkhole, setSelectedSinkhole] = useState(null);
  const [sinkholes, setSinkholes] = useState([]);
  
  // 탭 상태
  const [activeTab, setActiveTab] = useState('map-settings');
  
  // 지도 유형 상태 (기본값: 지형)
  const [mapType, setMapType] = useState('terrain');
  
  // 히트맵 설정 상태
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [heatmapPreset, setHeatmapPreset] = useState('severity');
  
  // 싱크홀 마커 표시 상태
  const [showMarkers, setShowMarkers] = useState(true);
  
  // 마커 위험도 필터 상태 (지도 설정용)
  const [markerRiskFilter, setMarkerRiskFilter] = useState('all');
  
  // 지역 필터 상태
  const [selectedSido, setSelectedSido] = useState('');
  const [selectedSigungu, setSelectedSigungu] = useState('');
  const [selectedDong, setSelectedDong] = useState('');
  
  // 위험도 필터 상태 (싱크홀 목록용)
  const [selectedRiskLevels, setSelectedRiskLevels] = useState(['low', 'medium', 'high', 'critical']);

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

  // 지역 필터 및 위험도 필터 적용
  const filteredSinkholes = useMemo(() => {
    if (!sinkholes) return [];
    
    let result = sinkholes;
    
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
    
    return result;
  }, [sinkholes, selectedSido, selectedSigungu, selectedDong, selectedRiskLevels]);


  // 지도에 표시할 싱크홀
  const displayedSinkholes = useMemo(() => {
    return filteredSinkholes;
  }, [filteredSinkholes]);

  // 히트맵 범례용 min/max (weight 기준)
  const legendDomain = useMemo(() => {
    const arr = (displayedSinkholes || []).map(s => Number(s.weight) || 0).filter(Number.isFinite);
    if (!arr.length) return { min: 0, max: 10 };
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    return { min: Math.floor(min), max: Math.ceil(max) };
  }, [displayedSinkholes]);

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
            dong: dong || '',
            // 원시 크기 값 보존 (클러스터 가중치/표시에 활용)
            sinkWidth: Number(sizeW) || 0,
            sinkExtend: Number(sizeE) || 0,
            sinkDepth: Number(sizeD) || 0,
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
        console.log('🔍 싱크홀 분석 완료:', {
          원본: mapped.length,
          클러스터: enhancedSinkholes.length,
          고위험: enhancedSinkholes.filter(s => s.riskLevel === 'critical' || s.riskLevel === 'high').length
        });
        
        setSinkholes(enhancedSinkholes);
      } catch (e) {
        console.error('CSV 로드 실패:', e);
        console.error('싱크홀 데이터를 불러오는 중 오류가 발생했습니다.');
      }
    };

    loadCsv();
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


  // 탭 정의
  const tabs = [
    { id: 'map-settings', label: '지도 설정', icon: '⚙️' },
    { id: 'sinkhole-list', label: '싱크홀 목록', icon: '📋' }
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
              sinkholes={sinkholes}
            />
          )}
          
          {activeTab === 'sinkhole-list' && (
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
              selectedRiskLevels={selectedRiskLevels}
              onRiskLevelChange={handleRiskLevelChange}
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
        />
      </div>
    </div>
  );
}

export default App;
