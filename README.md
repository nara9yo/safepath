# 🚧 싱크홀 안전지도 (SafePath)

싱크홀 위험도를 시각화하고, 영향 요인을 분석하며, 도시 안전 판단을 돕는
웹 애플리케이션입니다. [MOYAK README 형식](https://github.com/nara9yo/moyak)
을 참고해 문서를 구성했습니다.

## ✨ 주요 기능

- 위험도 히트맵: 프리셋(위험도/최근성/색각이상/고대비) 지원
- 싱크홀 마커: 위험도 기반 색/아이콘/애니메이션, 상세 팝업
- 지하철 영향권: 1·2·3차 권역(100/300/500m) 시각화 및 가중 반영
- 시뮬레이션: 가중치 파라미터 조정, 통계/분포/Top5 요약
- 필터: 지역(시·군·구/읍·면·동), 위험도, 지하철 영향도

## 🖼️ 목업 스크린샷

<p align="center">
  <img src="https://github.com/user-attachments/assets/a4f53089-c604-4002-bff2-152d6312bcd9" alt="일반 모드 화면" width="48%" />
  <img src="https://github.com/user-attachments/assets/d2907593-da1c-43fb-9c79-1a87dbdeb190" alt="히트맵 화면" width="48%" />
</p>
<p align="center">
  <img src="https://github.com/user-attachments/assets/4b6cd6de-213d-41ca-bd5c-ade1d2010cb8" alt="싱크홀 필터 화면" width="48%" />
  <img src="https://github.com/user-attachments/assets/00078520-b2ab-41d4-baa6-0e6756ecad63" alt="시뮬레이션 화면" width="48%" />
</p>

## 🧱 아키텍처 개요

- Frontend: React 18, 네이버 지도 Web API v3
- Server: 없음 (정적 호스팅, 클라이언트 단독)
- Data: `public/sago.csv`(사고), `public/subway.csv`(지하철)
- 배포: GitHub Pages (정적 빌드 배포)

## 📢 운영 공지: 공공데이터 API 일시 중단 및 전환 계획

- 현재: 국가정보자원관리원 화재로 공공데이터 API가 정상 제공되지 않아
  정적 CSV(`public/sago.csv`, `public/subway.csv`) 기반으로 서비스를 운영합니다.
- 복구 후 계획: 공공데이터 API 연계를 통해 정기(또는 준실시간) 동기화로
  최신 자료를 반영할 예정입니다.
- 안전장치(계획): API 장애 시 자동 정적 CSV 폴백, 지수 백오프 재시도,
  호출 제한 준수, 기본 캐시 활용.
- 환경변수(계획):
  - `REACT_APP_USE_REALTIME` = `true|false` (실시간 모드 토글)
  - `REACT_APP_PUBLIC_API_BASE_URL` = 공공데이터 API Base URL
  - `REACT_APP_PUBLIC_API_KEY` = 발급받은 API 키
- 로드맵: v0.1 정적 데이터 → v0.3 실시간(가능 시) 전환

## 📦 프로젝트 구조

```
src/
  components/     # 지도/필터/범례/시뮬레이션/도움말 UI
  utils/          # 상수/팔레트/분석기(싱크홀/지하철/시뮬)
  App.js          # CSV 로드→가중치→필터→표시 파이프라인
  index.js        # React DOM 부트스트랩
public/
  sago.csv        # 싱크홀 데이터
  subway.csv      # 지하철 노선/역 데이터
```

## 🔑 환경 변수

- `REACT_APP_NAVER_MAPS_CLIENT_ID`: 네이버 지도 API 키
- 설정 예시: `.env.example` → `.env.local` 복사 후 값 채움

## 🛠 실행 방법 (Windows)

1) 의존성 설치
```
npm install
```

2) 환경변수 설정
```
cp env.example .env.local
# .env.local 내 키 설정
REACT_APP_NAVER_MAPS_CLIENT_ID=your_ncp_key_id
```

3) 프로덕션 빌드/배포
```
npm run build
npm run deploy
```

## 🧮 분석 로직 하이라이트

- 클러스터링: 10m 반경 근접 점 통합, 발생횟수/규모/피해/최근성/반복 반영
- 지하철 가중치: 거리권역별 선형보간(100/300/500m)
- 등급/스타일: 전역 상수 기반 일관성 유지(색/아이콘/크기/펄스)

## 🧩 브랜치 전략

- main: 배포 브랜치
- dev: 개발 브랜치
- feature/*: 기능 개발
- hotfix/*: 긴급 수정

## 🧰 문제 해결

1) 지도 API 키 경고
- 증상: "네이버 지도 API 키가 설정되지 않았습니다" 알림
- 조치: `.env.local`에 키 설정 후 재실행

2) CSV 한글 깨짐
- 조치: UTF-8 실패 시 EUC-KR 디코딩 폴백 적용(내장됨)

3) 포트 충돌
- 개발 서버(CRA): 3000
- 사용 중 프로세스 종료 후 재시작

## 🔒 보안

- 환경변수로 API 키 관리(.env.local, Git 미추적)
- 사용자 입력 미사용(지도 UI 중심), XSS 방지 기본 원칙 준수

## ⚡ 성능 최적화

- 지도 이동/줌 중 히트맵 임시 해제로 렌더 최적화
- 등급/팔레트/색상 계산 유틸 재사용으로 중복 최소화

