import React, { useState } from 'react';

const RouteSearch = ({ 
  startPoint, 
  endPoint, 
  onStartChange, 
  onEndChange, 
  onSearch, 
  isSearching,
  onInputTypeSelect
}) => {
  const [startInput, setStartInput] = useState('');
  const [endInput, setEndInput] = useState('');
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [endSuggestions, setEndSuggestions] = useState([]);
  const [showStartSuggestions, setShowStartSuggestions] = useState(false);
  const [showEndSuggestions, setShowEndSuggestions] = useState(false);

  // 주소 검색 함수 (Naver Geocoder)
  const searchAddress = (query, callback) => {
    if (!query || query.length < 2) {
      callback([]);
      return;
    }

    if (!window.naver || !window.naver.maps || !window.naver.maps.Service) {
      console.warn('네이버 지도 Geocoder가 로드되지 않았습니다.');
      callback([]);
      return;
    }

    window.naver.maps.Service.geocode({
      query
    }, (status, response) => {
      if (status === window.naver.maps.Service.Status.ERROR || !response || !response.v2 || !response.v2.addresses) {
        callback([]);
        return;
      }

      const suggestions = response.v2.addresses.slice(0, 5).map(addr => ({
        address: addr.roadAddress || addr.jibunAddress || query,
        lat: parseFloat(addr.y),
        lng: parseFloat(addr.x)
      }));
      callback(suggestions);
    });
  };

  const handleStartChange = (e) => {
    const value = e.target.value;
    setStartInput(value);
    
    if (value.length >= 2) {
      searchAddress(value, (suggestions) => {
        setStartSuggestions(suggestions);
        setShowStartSuggestions(true);
      });
    } else {
      setStartSuggestions([]);
      setShowStartSuggestions(false);
    }
  };

  const handleEndChange = (e) => {
    const value = e.target.value;
    setEndInput(value);
    
    if (value.length >= 2) {
      searchAddress(value, (suggestions) => {
        setEndSuggestions(suggestions);
        setShowEndSuggestions(true);
      });
    } else {
      setEndSuggestions([]);
      setShowEndSuggestions(false);
    }
  };

  const handleStartSelect = (suggestion) => {
    setStartInput(suggestion.address);
    onStartChange({ lat: suggestion.lat, lng: suggestion.lng });
    setShowStartSuggestions(false);
  };

  const handleEndSelect = (suggestion) => {
    setEndInput(suggestion.address);
    onEndChange({ lat: suggestion.lat, lng: suggestion.lng });
    setShowEndSuggestions(false);
  };

  const handleStartFocus = () => {
    console.log('🎯 출발지 입력창 포커스');
    if (onInputTypeSelect) {
      onInputTypeSelect('start');
      console.log('✅ 입력 타입을 start로 설정');
    }
    setShowStartSuggestions(startSuggestions.length > 0);
  };

  const handleEndFocus = () => {
    console.log('🎯 도착지 입력창 포커스');
    if (onInputTypeSelect) {
      onInputTypeSelect('end');
      console.log('✅ 입력 타입을 end로 설정');
    }
    setShowEndSuggestions(endSuggestions.length > 0);
  };

  const handleSearch = () => {
    if (!startPoint || !endPoint) {
      alert('출발지와 도착지를 모두 선택해주세요.');
      return;
    }
    onSearch();
  };

  const formatCoordinate = (point) => {
    if (!point) return '';
    return `위도: ${point.lat.toFixed(6)}, 경도: ${point.lng.toFixed(6)}`;
  };

  return (
    <div className="route-search">
      <h3>길찾기</h3>
      
      <div className="input-group">
        <label htmlFor="start-point">출발지 (A)</label>
        <div style={{ position: 'relative' }}>
          <input
            id="start-point"
            type="text"
            placeholder="지도를 클릭하거나 주소를 입력하세요"
            value={startInput}
            onChange={handleStartChange}
            onFocus={handleStartFocus}
            onBlur={() => setTimeout(() => setShowStartSuggestions(false), 200)}
          />
          {showStartSuggestions && startSuggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {startSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="suggestion-item"
                  onClick={() => handleStartSelect(suggestion)}
                >
                  {suggestion.address}
                </div>
              ))}
            </div>
          )}
        </div>
        {startPoint && (
          <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
            {formatCoordinate(startPoint)}
          </div>
        )}
      </div>

      <div className="input-group">
        <label htmlFor="end-point">도착지 (B)</label>
        <div style={{ position: 'relative' }}>
          <input
            id="end-point"
            type="text"
            placeholder="지도를 클릭하거나 주소를 입력하세요"
            value={endInput}
            onChange={handleEndChange}
            onFocus={handleEndFocus}
            onBlur={() => setTimeout(() => setShowEndSuggestions(false), 200)}
          />
          {showEndSuggestions && endSuggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {endSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="suggestion-item"
                  onClick={() => handleEndSelect(suggestion)}
                >
                  {suggestion.address}
                </div>
              ))}
            </div>
          )}
        </div>
        {endPoint && (
          <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
            {formatCoordinate(endPoint)}
          </div>
        )}
      </div>

      <button
        className="search-button"
        onClick={handleSearch}
        disabled={!startPoint || !endPoint || isSearching}
      >
        {isSearching ? '경로 탐색 중...' : '경로 찾기'}
      </button>

      <div style={{ fontSize: '12px', color: '#666', marginTop: '10px', textAlign: 'center' }}>
        💡 지도를 클릭하여 출발지와 도착지를 설정할 수 있습니다
      </div>
    </div>
  );
};

export default RouteSearch;

