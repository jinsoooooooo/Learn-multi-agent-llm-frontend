# LLM Multi-Agent Chat Frontend 🚀

본 프로젝트는 다중 인공지능 에이전트(Multi-Agent)와 상호작용하기 위한 사용자 친화적인 웹 인터페이스(Frontend) 시스템입니다.

## 🎯 프로젝트 목적 및 의의
다양한 LLM 에이전트가 연계된 복잡한 챗봇 생태계를 사용자가 직관적이고 쾌적하게 사용할 수 있도록 설계되었습니다. 
빠른 번들링과 핫 리로딩(HMR)을 제공하는 **Vite + React** 환경으로 개발되었으며, 프로덕션 배포 시에는 **Nginx**를 활용한 경량화된 정적 파일 딜리버리와 **Kubernetes(Helm)**를 통한 스케일아웃 배포까지 완벽하게 지원하는 모던 프론트엔드 파이프라인의 모범 사례를 담고 있습니다.

---

## 📂 프로젝트 구조

```text
llm-multi-agent-frontend/
├── frontend-react/   # 메인 애플리케이션 소스 코드 (React + Vite)
│   ├── public/       # 정적 에셋 파일
│   ├── src/          # React 컴포넌트, Context, API 라우터 등
│   ├── .env          # 환경 변수 설정 (로컬 개발용)
│   └── package.json  # 프로젝트 의존성 및 스크립트 정의
├── frontend-html/    # 마크업 및 디자인 퍼블리싱 원본 레퍼런스
├── helm/             # Kubernetes 환경 배포를 위한 Helm Chart 
├── Dockerfile        # 멀티 스테이지 빌드 (Node Builder -> Nginx 서빙)
└── nginx.conf        # SPA 라우팅 지원을 위한 Nginx 커스텀 설정
```

---

## 🛠️ 실행 방법 (Local Development)

로컬에서 개발 서버를 띄워 실시간으로 수정 사항을 반영(HMR)하며 작업하는 방법입니다.

1. **디렉토리 이동**
   ```bash
   cd frontend-react
   ```
2. **환경 변수 설정**
   폴더 내에 `.env` 파일을 생성하거나 수정하여 백엔드 API 주소를 명시합니다.
   ```env
   VITE_API_URL=http://127.0.0.1:8000
   ```
3. **패키지 설치 및 실행**
   ```bash
   npm install
   npm run dev
   ```
4. **접속**
   브라우저에서 `http://localhost:5173` 으로 접속합니다.

---

## 🐳 Docker 및 Helm을 통한 프로덕션 배포

프로덕션 환경에서는 Docker 리눅스 컨테이너 안에서 빌드한 후 Nginx를 통해 서비스됩니다. 정적 빌드 방식이므로 브라우저는 완성된 `html`, `js`, `css` 파일들만 내려받게 됩니다.

- **Docker Build**
  빌드 진행 시 백엔드 API 엔드포인트를 주입해야 합니다.
  ```bash
  docker build --build-arg VITE_API_URL=https://내_백엔드_API_주소 -t my-frontend .
  ```

- **Kubernetes (Helm) 트래픽 연결**
  이미지 빌드가 완료되어 레지스트리에 푸시된 이후에는 Helm 차트를 이용해 배포합니다.
  ```bash
  cd helm
  # values.yaml 에서 이미지 태그 확인 후 클러스터에 배포
  helm upgrade --install multi-agent-frontend .
  ```