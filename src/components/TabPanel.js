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
