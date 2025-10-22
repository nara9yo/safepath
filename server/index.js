// 엔트리(서버): 경량 API 서버
// 역할:
//  - CORS 허용, 상태 확인 기본 라우트 제공 (프론트 독립 실행 지원)
//  - Windows 기반 개발/운영 환경 고려한 최소 설정
import express from 'express';

const app = express();
const PORT = process.env.PORT || 4000;

// CORS 설정
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ message: '싱크홀 안전지도 서버가 실행 중입니다.' });
});

app.listen(PORT, () => {
});


