// 엔트리(부트스트랩): React DOM 루트 마운트
// 역할:
//  - 스타일 로드 및 App 컴포넌트 StrictMode 마운트
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.js';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

