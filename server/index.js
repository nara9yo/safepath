// 싱크홀 안전지도 서버
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


