import React, { useState } from 'react';

const MapTypeControl = ({ mapType, onMapTypeChange, isVisible = true }) => {
  const [isOpen, setIsOpen] = useState(false);

  const mapTypes = [
    { id: 'normal', name: '일반', icon: '🗺️' },
    { id: 'satellite', name: '위성', icon: '🛰️' },
    { id: 'hybrid', name: '하이브리드', icon: '🌍' },
    { id: 'terrain', name: '지형', icon: '🏔️' }
  ];

  const currentMapType = mapTypes.find(type => type.id === mapType) || mapTypes[0];

  const handleMapTypeSelect = (selectedType) => {
    onMapTypeChange(selectedType);
    setIsOpen(false);
  };

  if (!isVisible) return null;

  return (
    <div className="map-type-control" style={{
      position: 'absolute',
      top: '12px',
      left: '12px',
      zIndex: 1000,
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      overflow: 'hidden',
      minWidth: '120px'
    }}>
      {/* 현재 선택된 지도 유형 표시 */}
      <div 
        className="map-type-current"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '12px 16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: isOpen ? '1px solid #e0e0e0' : 'none',
          transition: 'background-color 0.2s ease',
          backgroundColor: isOpen ? '#f5f5f5' : 'transparent'
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
        onMouseLeave={(e) => e.target.style.backgroundColor = isOpen ? '#f5f5f5' : 'transparent'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>{currentMapType.icon}</span>
          <span style={{ fontWeight: '500', color: '#333' }}>{currentMapType.name}</span>
        </div>
        <span style={{ 
          fontSize: '12px', 
          color: '#666',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease'
        }}>
          ▼
        </span>
      </div>

      {/* 지도 유형 선택 드롭다운 */}
      {isOpen && (
        <div className="map-type-options" style={{
          background: 'white',
          borderTop: '1px solid #e0e0e0'
        }}>
          {mapTypes.map((type) => (
            <div
              key={type.id}
              className="map-type-option"
              onClick={() => handleMapTypeSelect(type.id)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s ease',
                backgroundColor: mapType === type.id ? '#e3f2fd' : 'transparent',
                borderLeft: mapType === type.id ? '3px solid #2196f3' : '3px solid transparent'
              }}
              onMouseEnter={(e) => {
                if (mapType !== type.id) {
                  e.target.style.backgroundColor = '#f5f5f5';
                }
              }}
              onMouseLeave={(e) => {
                if (mapType !== type.id) {
                  e.target.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span style={{ fontSize: '16px' }}>{type.icon}</span>
              <span style={{ 
                fontWeight: mapType === type.id ? '600' : '400',
                color: mapType === type.id ? '#1976d2' : '#333'
              }}>
                {type.name}
              </span>
              {mapType === type.id && (
                <span style={{ 
                  marginLeft: 'auto', 
                  color: '#1976d2',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  ✓
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MapTypeControl;
