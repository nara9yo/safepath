import React, { useEffect, useRef } from 'react';

const Map = ({ sinkholes, selectedSinkhole, route, onLocationSelect, onMapReady, selectedInputType }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const polylinesRef = useRef([]);
  const infoWindowsRef = useRef([]);
  const onLocationSelectRef = useRef(onLocationSelect);
  const selectedInputTypeRef = useRef(selectedInputType);

  // onLocationSelect가 변경될 때마다 ref 업데이트
  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  // selectedInputType 변경 감지 및 ref 업데이트
  useEffect(() => {
    console.log('🔄 selectedInputType 변경됨:', selectedInputType);
    selectedInputTypeRef.current = selectedInputType;
  }, [selectedInputType]);

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
      script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder`;
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
          zoomControlOptions: { position: window.naver.maps.Position.TOP_RIGHT }
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
        });

        console.log('✅ 네이버 지도 초기화 완료');
      } catch (error) {
        console.error('❌ 네이버 지도 초기화 실패:', error);
      }
    };

    loadNaverMap();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 싱크홀 마커 표시
  useEffect(() => {
    if (!mapInstance.current || !window.naver || !window.naver.maps) {
      return;
    }

    markersRef.current.forEach(marker => marker.setMap(null));
    infoWindowsRef.current.forEach(infoWindow => infoWindow.close());
    markersRef.current = [];
    infoWindowsRef.current = [];

    if (!sinkholes || sinkholes.length === 0) {
      return;
    }

    sinkholes.forEach((sinkhole) => {
      if (!Number.isFinite(sinkhole.lat) || !Number.isFinite(sinkhole.lng)) return;
      const position = new window.naver.maps.LatLng(sinkhole.lat, sinkhole.lng);

      const marker = new window.naver.maps.Marker({
        position,
        map: mapInstance.current,
        title: sinkhole.name,
        icon: {
          content: `
            <div style="width:24px;height:24px;border-radius:50%;background:#e74c3c;border:2px solid #c0392b;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:bold;">!</div>
          `,
          anchor: new window.naver.maps.Point(12, 12)
        }
      });

      const infoWindow = new window.naver.maps.InfoWindow({
        content: `
          <div style="padding: 10px; min-width: 200px;">
            <h4 style="margin: 0 0 5px 0; color: #e74c3c;">⚠️ 싱크홀</h4>
            <p style="margin: 0 0 5px 0; font-weight: bold;">${sinkhole.name}</p>
            <p style="margin: 0 0 5px 0; font-size: 12px; color: #666;">${sinkhole.address || ''}</p>
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
    });
  }, [sinkholes]);

  // 선택된 싱크홀 마커 표시 (모든 모드)
  useEffect(() => {
    if (!mapInstance.current || !selectedSinkhole || !window.naver || !window.naver.maps) {
      return;
    }

    if (!(sinkholes && sinkholes.length > 0)) {
      markersRef.current.forEach(marker => marker.setMap(null));
      infoWindowsRef.current.forEach(infoWindow => infoWindow.close());
      markersRef.current = [];
      infoWindowsRef.current = [];
    }

    const position = new window.naver.maps.LatLng(selectedSinkhole.lat, selectedSinkhole.lng);
    const marker = new window.naver.maps.Marker({
      position,
      map: mapInstance.current,
      title: selectedSinkhole.name,
      icon: {
        content: `
          <div style="width:24px;height:24px;border-radius:50%;background:#e74c3c;border:2px solid #c0392b;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:bold;">!</div>
        `,
        anchor: new window.naver.maps.Point(12, 12)
      }
    });

    const infoWindow = new window.naver.maps.InfoWindow({
      content: `
        <div style="padding: 10px; min-width: 200px;">
          <h4 style="margin: 0 0 5px 0; color: #e74c3c;">⚠️ 싱크홀</h4>
          <p style="margin: 0 0 5px 0; font-weight: bold;">${selectedSinkhole.name}</p>
          <p style="margin: 0 0 5px 0; font-size: 12px; color: #666;">${selectedSinkhole.address || ''}</p>
          ${selectedSinkhole.description ? `<p style="margin: 0; font-size: 12px; color: #888;">${selectedSinkhole.description}</p>` : ''}
        </div>
      `
    });

    window.naver.maps.Event.addListener(marker, 'click', () => {
      infoWindowsRef.current.forEach(iw => iw.close());
      infoWindow.open(mapInstance.current, marker);
    });

    markersRef.current.push(marker);
    infoWindowsRef.current.push(infoWindow);
    infoWindow.open(mapInstance.current, marker);
  }, [selectedSinkhole, sinkholes]);

  // 경로 표시
  useEffect(() => {
    if (!mapInstance.current || !route || !window.naver || !window.naver.maps) return;

    polylinesRef.current.forEach(polyline => polyline.setMap(null));
    polylinesRef.current = [];

    const path = route.path.map(point => new window.naver.maps.LatLng(point.lat, point.lng));

    let strokeColor = '#2196F3';
    let strokeWeight = 5;
    let strokeStyle = 'solid';

    if (route.hasSinkholes) {
      if (route.originalRoute) {
        strokeColor = '#4CAF50';
      } else {
        strokeColor = '#FF9800';
      }
    }

    const polyline = new window.naver.maps.Polyline({
      path,
      map: mapInstance.current,
      strokeColor,
      strokeWeight,
      strokeOpacity: 0.8,
      strokeStyle
    });

    polylinesRef.current.push(polyline);

    if (route.originalRoute) {
      const originalPath = route.originalRoute.path.map(point => new window.naver.maps.LatLng(point.lat, point.lng));
      const originalPolyline = new window.naver.maps.Polyline({
        path: originalPath,
        map: mapInstance.current,
        strokeColor: '#FF5722',
        strokeWeight: 3,
        strokeOpacity: 0.6,
        strokeStyle: 'shortdash'
      });
      polylinesRef.current.push(originalPolyline);
    }

    const bounds = new window.naver.maps.LatLngBounds();
    path.forEach(latlng => bounds.extend(latlng));
    mapInstance.current.fitBounds(bounds);

  }, [route]);

  return (
    <div 
      ref={mapRef} 
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default Map;

