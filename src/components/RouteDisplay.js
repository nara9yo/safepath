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
        // 위험도에 따른 메시지 조정
        const riskLevel = route.routeRiskLevel || 'low';
        const riskMessages = {
          'low': '싱크홀을 피하는 안전한 경로로 안내합니다.',
          'medium': '일부 싱크홀이 있지만 우회 경로로 안전하게 안내합니다.',
          'high': '여러 싱크홀이 있어 주의가 필요하지만 우회 경로로 안내합니다.',
          'critical': '매우 위험한 지역이므로 각별한 주의가 필요합니다.'
        };
        
        const riskIcons = {
          'low': '⚠️',
          'medium': '⚠️',
          'high': '🚨',
          'critical': '💥'
        };
        
        return {
          title: `${riskIcons[riskLevel]} 싱크홀 우회 경로 (${riskLevel.toUpperCase()})`,
          message: riskMessages[riskLevel] || riskMessages['low'],
          className: `route-info warning risk-${riskLevel}`
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
        
        {/* 위험도 정보 표시 */}
        {route.riskSummary && (
          <div style={{ marginTop: '10px', padding: '8px', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '4px' }}>
            <h6 style={{ margin: '0 0 5px 0', color: '#333' }}>📊 위험도 분석</h6>
            <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
              <p style={{ margin: '2px 0' }}>
                <strong>총 위험도 점수:</strong> {route.riskSummary.totalRiskScore}
                {route.routeRiskLevel && (
                  <span style={{ 
                    marginLeft: '8px', 
                    padding: '2px 6px', 
                    borderRadius: '3px', 
                    backgroundColor: route.routeRiskLevel === 'critical' ? '#f44336' : 
                                   route.routeRiskLevel === 'high' ? '#ff9800' : 
                                   route.routeRiskLevel === 'medium' ? '#ffc107' : '#4caf50',
                    color: 'white',
                    fontSize: '10px'
                  }}>
                    {route.routeRiskLevel.toUpperCase()}
                  </span>
                )}
              </p>
              <p style={{ margin: '2px 0' }}>
                <strong>감지된 싱크홀:</strong> {route.riskSummary.totalSinkholes}개 
                ({route.riskSummary.totalOccurrences}회 발생)
              </p>
              {route.riskSummary.closestDistance && (
                <p style={{ margin: '2px 0' }}>
                  <strong>가장 가까운 거리:</strong> {route.riskSummary.closestDistance}m
                </p>
              )}
              <p style={{ margin: '2px 0' }}>
                <strong>평균 위험도:</strong> {route.riskSummary.averageRiskScore}
              </p>
            </div>
          </div>
        )}
      </div>

      {route.detectedSinkholes && route.detectedSinkholes.length > 0 && (
        <div className="sinkhole-list">
          <h5 style={{ marginBottom: '10px', color: '#e74c3c' }}>
            발견된 싱크홀 ({route.detectedSinkholes.length}개)
          </h5>
          {route.detectedSinkholes.map(sinkhole => (
            <div key={sinkhole.id} className="sinkhole-item" style={{ 
              padding: '8px', 
              marginBottom: '5px', 
              backgroundColor: 'rgba(0,0,0,0.02)', 
              borderRadius: '3px',
              borderLeft: `3px solid ${
                sinkhole.riskLevel === 'critical' ? '#9c27b0' :
                sinkhole.riskLevel === 'high' ? '#f44336' :
                sinkhole.riskLevel === 'medium' ? '#ff9800' : '#4caf50'
              }`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>#{sinkhole.id}</strong> {sinkhole.name}
                  {sinkhole.totalOccurrences > 1 && (
                    <span style={{ 
                      marginLeft: '5px', 
                      padding: '1px 4px', 
                      backgroundColor: '#d32f2f', 
                      color: 'white', 
                      borderRadius: '2px', 
                      fontSize: '10px' 
                    }}>
                      {sinkhole.totalOccurrences}회 발생
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: '#666' }}>
                  위험도: {sinkhole.weight?.toFixed(1) || 'N/A'}
                  {typeof sinkhole.deathCnt === 'number' || typeof sinkhole.injuryCnt === 'number' || typeof sinkhole.vehicleCnt === 'number' ? (
                    <span style={{ marginLeft: 8, color: '#b71c1c' }}>
                      피해: 사망 {sinkhole.deathCnt || 0} · 부상 {sinkhole.injuryCnt || 0} · 차량 {sinkhole.vehicleCnt || 0}
                    </span>
                  ) : null}
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                {sinkhole.address}
                {sinkhole.distanceFromRoute && (
                  <span style={{ marginLeft: '8px' }}>
                    (거리: {Math.round(sinkhole.distanceFromRoute * 1000)}m)
                  </span>
                )}
              </div>
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

