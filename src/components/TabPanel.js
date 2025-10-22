// 컴포넌트: 탭 패널
// 역할:
//  - 탭 헤더/활성 탭 상태 제어 및 children 렌더링 컨테이너
// 입력 props: tabs[{id,label,icon}], activeTab, onTabChange, children
import React from 'react';

const TabPanel = ({ 
  tabs, 
  activeTab, 
  onTabChange, 
  children 
}) => {
  return (
    <div className="tab-panel">
      <div className="tab-header">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>
      <div className="tab-content" data-tab={activeTab}>
        {children}
      </div>
    </div>
  );
};

export default TabPanel;
