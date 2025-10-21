# 🚧 싱크홀 안전 지도

광주광역시 싱크홀 데이터를 활용한 안전 지도 및 길찾기 서비스입니다.

## 🌟 주요 기능

- **싱크홀 마커 표시**: 광주 지역의 싱크홀 위치를 지도에 시각적으로 표시
- **안전 길찾기**: 싱크홀을 피하는 우회 경로 제공 (일반 운전자 모드)
- **안전점검 길찾기**: 싱크홀을 포함한 최단 경로 제공 (안전점검 운전자 모드)
- **실시간 경로 분석**: 경로상 싱크홀 감지 및 자동 우회 경로 계산
- **반응형 디자인**: 모바일과 데스크톱 환경 모두 지원

## 🛠 기술 스택

- **Frontend**: React (JavaScript)
- **지도 API**: 네이버 지도 Web API (v3)
- **배포**: GitHub Pages
- **스타일링**: CSS3 (Flexbox, Grid)

## 🚀 설치 및 실행

### 1. 프로젝트 클론
```bash
git clone https://github.com/your-username/safepath.git
cd safepath
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 네이버 API 키 설정
1. 네이버 클라우드 플랫폼에서 지도 서비스 `ncpKeyId` 발급
2. 환경변수 파일 생성 및 API 키 설정

```bash
# .env.local 파일 생성
cp env.example .env.local

# .env.local 파일에서 네이버 키 설정
REACT_APP_NAVER_MAPS_CLIENT_ID=your_ncp_key_id
```

참고 문서: [네이버 지도 API 시작하기](https://navermaps.github.io/maps.js.ncp/docs/tutorial-2-Getting-Started.html)

### 4. 개발 서버 실행
```bash
npm start
```

브라우저에서 `http://localhost:3000`으로 접속

### 5. 프로덕션 빌드
```bash
npm run build
```

## 📱 사용 방법


## 🗂 프로젝트 구조

```
src/
├── components/
│   ├── Map.js              # 네이버 지도 컴포넌트
│   ├── ModeToggle.js       # 히트맵 설정
│   ├── SinkholeList.js     # 싱크홀 목록
│   └── RiskFilter.js       # 위험도 필터
├── utils/
│   └── sinkholeAnalyzer.js # 싱크홀 분석 로직
├── data/
│   └── sago.csv            # 싱크홀 데이터
├── App.js                  # 메인 앱 컴포넌트
└── index.js               # 앱 진입점
```

## 🔧 주요 기능 설명

### 싱크홀 분석 알고리즘
- Haversine 공식을 사용한 정확한 거리 계산
- 싱크홀 발생 빈도와 피해 규모를 기반으로 한 위험도 평가
- 클러스터링을 통한 중복 데이터 정리

### 히트맵 시각화
- 싱크홀 밀도와 위험도를 색상으로 표현
- 다양한 색상 스펙트럼 프리셋 제공
- 실시간 필터링 및 재스케일링 지원

### 지역별 필터링
- 시도, 시군구, 동 단위 필터링
- 위험도별 싱크홀 분류 및 표시
- 상세 정보 팝업 및 지도 연동

## 🎨 UI/UX 특징

- **직관적인 인터페이스**: 한눈에 파악할 수 있는 깔끔한 디자인
- **색상 코딩**: 
  - 🔴 고위험 싱크홀 (빨간색)
  - 🟠 중위험 싱크홀 (주황색)
  - 🟡 저위험 싱크홀 (노란색)
  - 🟢 안전 지역 (초록색)
- **반응형 디자인**: 모바일과 데스크톱 환경 최적화
- **실시간 필터링**: 지역 및 위험도별 즉시 필터링

## 🚀 배포

### GitHub Pages 배포
```bash
npm run deploy
```

배포 후 `https://your-username.github.io/safepath`에서 확인 가능

### 환경변수 설정
- `.env.local` 파일에 네이버 지도 `REACT_APP_NAVER_MAPS_CLIENT_ID` 설정
- `env.example` 파일을 참고하여 환경변수 구성

## 🔮 향후 개선 사항

- [ ] **실제 길찾기 API 연동**: 카카오 모빌리티 API로 실제 도로 기반 경로 제공
- [ ] **공공데이터포털 연동**: 국가정보자원관리원 복구 후 실시간 싱크홀 데이터 연동
- [ ] **사용자 제보 기능**: 시민이 직접 싱크홀 위치를 신고할 수 있는 기능
- [ ] **알림 기능**: 경로 변경 시 푸시 알림 제공
- [ ] **통계 대시보드**: 싱크홀 발생 현황 및 트렌드 분석
- [ ] **다국어 지원**: 영어, 중국어 등 다국어 인터페이스

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해 주세요.

---

**⚠️ 주의사항**: 이 서비스는 POC(Proof of Concept) 목적으로 제작되었습니다. 실제 운전 시에는 정확한 내비게이션 서비스를 사용하시기 바랍니다.

