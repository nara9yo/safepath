import React from 'react';

const HeatmapLegend = ({ gradient = [], min = 0, max = 10, title = '위험도', barWidth = 280 }) => {
  const steps = gradient.length;
  const labels = [min, (min + max) / 2, max];
  const background = `linear-gradient(to right, ${gradient.join(',')})`;

  return (
    <div className="heatmap-legend" style={{ padding: 8 }}>
      <div style={{ fontSize: 12, marginBottom: 4 }}>{title}</div>
      <div style={{ height: 10, width: barWidth, background, borderRadius: 4 }} />
      <div style={{ width: barWidth, display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: 4 }}>
        <span>{labels[0]}</span>
        <span>{labels[1]}</span>
        <span>{labels[2]}</span>
      </div>
      <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>
        스펙트럼 단계: {steps}
      </div>
    </div>
  );
};

export default HeatmapLegend;



