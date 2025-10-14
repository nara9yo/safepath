// 네이버 Directions 5 API 프록시 서버
// 안전을 위해 클라이언트에서 직접 키를 사용하지 않고 서버에서 호출
import express from 'express';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// CORS 최소 허용 (CRA dev 서버 프록시를 기본 사용)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/api/directions', async (req, res) => {
  try {
    const { startLng, startLat, endLng, endLat, option } = req.query;
    const ncpClientId = process.env.NCP_CLIENT_ID || process.env.REACT_APP_NAVER_MAPS_CLIENT_ID;
    const ncpClientSecret = process.env.NCP_CLIENT_SECRET;

    if (!ncpClientId || !ncpClientSecret) {
      return res.status(500).json({ error: 'NCP_CLIENT_ID / NCP_CLIENT_SECRET 환경변수가 필요합니다.' });
    }

    if (!startLng || !startLat || !endLng || !endLat) {
      return res.status(400).json({ error: 'startLng, startLat, endLng, endLat 쿼리가 필요합니다.' });
    }

    const params = new URLSearchParams();
    params.set('start', `${startLng},${startLat}`); // 경도,위도
    params.set('goal', `${endLng},${endLat}`);      // 경도,위도
    if (option) params.set('option', option);       // traoptimal | trafast | ...

    const url = `https://maps.apigw.ntruss.com/map-direction/v1/driving?${params.toString()}`;

    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        'X-NCP-APIGW-API-KEY-ID': ncpClientId,
        'X-NCP-APIGW-API-KEY': ncpClientSecret
      }
    });

    const text = await resp.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    // 네이버는 논리 에러도 200을 반환할 수 있으므로, 원본 상태코드 그대로 전달
    return res.status(resp.status).json(data);
  } catch (e) {
    console.error('Directions proxy error:', e);
    return res.status(500).json({ error: 'Directions proxy failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Directions proxy listening on http://localhost:${PORT}`);
});


