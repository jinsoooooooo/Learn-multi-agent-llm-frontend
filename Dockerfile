# --- 1단계: 빌드 환경 (Builder) ---
# Node.js 18의 가벼운 alpine 버전을 'builder'라는 이름의 스테이지로 지정합니다.
FROM node:18-alpine AS builder

# 작업 디렉토리를 /app으로 설정
WORKDIR /app

# 1. 의존성 파일만 먼저 복사 - 패키지 캐싱을 위해 
# frontend-react 폴더 안의 package.json과 lock 파일을 먼저 복사합니다.
# (빌드 캐시 최적화를 위함)
COPY ./frontend-react/package.json ./
COPY ./frontend-react/package-lock.json ./

# 2. npm install 실행
# 의존성을 설치합니다.
# npn install 명령어는 package.json 파일을 보고 프로젝트에 필요한 모든 라이브러리를 node_modules 폴더에 설치합니다. 
# 가장 먼저 실행해야 하는 명령어입니다.
RUN npm install

# 3. 나머지 소스 코드를 복사
COPY ./frontend-react ./

# API 호출 url 이 로컬에서는 .env 파일로 fastapi를 지정하지만
# docker에서는 절대경로/상대경로를 사용해야한다 즉 VITE_API_URL에 "" 빈 값이 엇어야만 한다 -> 변수선언 필수
# local : .env 파일에서 강제로 http://127.0.0.1:8000 지정
# prd,stg,dev : "" 빈 문자열에 뒤에 경로만 호출하면 브라우저가 현재 URL을 자동으로 붙여준다.
ARG VITE_API_URL = "" 
ENV VITE_API_URL=$VITE_API_URL

# 4. npm run build 실행
# React 앱을 빌드합니다. 결과물은 /app/dist 폴더에 생성됩니다.
RUN npm run build


 # --- 2단계: 프로덕션 환경 (Final Stage) ---
# Nginx의 안정적인 alpine 버전을 최종 베이스 이미지로 사용합니다.
FROM nginx:stable-alpine

# 'builder' 스테이지의 /app/dist 폴더에 있는 빌드 결과물 전체를
# Nginx의 기본 HTML 서비스 폴더로 복사합니다. 이것이 핵심입니다! # 절대 경로 사용
COPY --from=builder /app/dist /usr/share/nginx/html 

# React Router와 같은 SPA(Single Page Application) 라우팅을 위해 커스텀 Nginx 설정을 복사합니다. 
# 요청 url을 inex.html로 귀결 시킴
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# 80번 포트를 외부에 노출합니다.
EXPOSE 80

# Nginx 서버를 실행합니다. (Nginx 공식 이미지의 기본 CMD)
CMD ["nginx", "-g", "daemon off;"]