import React from 'react';

const RouteDisplay = ({ route, mode, error }) => {
  if (error) {
    return (
      <div className="route-info error">
        <h4>❌ 오류</h4>
        <p>{error}</p>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="route-info">
        <h4>📍 경로 정보</h4>
        <p>출발지와 도착지를 선택한 후 '경로 찾기' 버튼을 눌러주세요.</p>
      </div>
    );
  }

  const formatDistance = (distance) => {
    if (distance < 1) {
      return `${(distance * 1000).toFixed(0)}m`;
    }
    return `${distance.toFixed(2)}km`;
  };

  const formatDuration = (duration) => {
    if (!duration) return '';
    
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    }
    return `${minutes}분`;
  };

  const getRouteStatus = () => {
    if (mode === 'inspection') {
      return {
        title: '🔍 안전점검 경로',
        message: '싱크홀을 포함한 최단 경로입니다.',
        className: 'route-info'
      };
    }

    if (route.hasSinkholes) {
      if (route.originalRoute) {
        return {
          title: '⚠️ 싱크홀 우회 경로',
          message: '싱크홀을 피하는 안전한 경로로 안내합니다.',
          className: 'route-info warning'
        };
      } else {
        return {
          title: '⚠️ 싱크홀 경고',
          message: '경로상에 싱크홀이 있습니다. 주의하세요.',
          className: 'route-info error'
        };
      }
    }

    return {
      title: '✅ 안전한 경로',
      message: '경로상에 싱홀이 없습니다.',
      className: 'route-info success'
    };
  };

  const status = getRouteStatus();

  return (
    <div className={status.className}>
      <h4>{status.title}</h4>
      <p>{status.message}</p>
      
      <div style={{ marginTop: '10px' }}>
        <p><strong>총 거리:</strong> {formatDistance(route.distance)}</p>
        {route.duration && (
          <p><strong>예상 소요시간:</strong> {formatDuration(route.duration)}</p>
        )}
        <p><strong>경로 포인트:</strong> {route.path.length}개</p>
      </div>

      {route.detectedSinkholes && route.detectedSinkholes.length > 0 && (
        <div className="sinkhole-list">
          <h5 style={{ marginBottom: '10px', color: '#e74c3c' }}>
            발견된 싱크홀 ({route.detectedSinkholes.length}개)
          </h5>
          {route.detectedSinkholes.map(sinkhole => (
            <div key={sinkhole.id} className="sinkhole-item">
              <strong>#{sinkhole.id}</strong> {sinkhole.name}
              <br />
              <small>{sinkhole.address}</small>
            </div>
          ))}
        </div>
      )}

      {route.originalRoute && (
        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '3px' }}>
          <h5 style={{ marginBottom: '5px', color: '#666' }}>원래 경로 정보</h5>
          <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
            거리: {formatDistance(route.originalRoute.distance)} | 
            포인트: {route.originalRoute.path.length}개
          </p>
        </div>
      )}

      {mode === 'inspection' && route.detectedSinkholes && route.detectedSinkholes.length > 0 && (
        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '3px', border: '1px solid #ffeaa7' }}>
          <h5 style={{ marginBottom: '5px', color: '#856404' }}>안전점검 포인트</h5>
          <p style={{ fontSize: '12px', color: '#856404', margin: 0 }}>
            총 {route.detectedSinkholes.length}개의 싱크홀을 점검하세요.
          </p>
        </div>
      )}
    </div>
  );
};

export default RouteDisplay;

