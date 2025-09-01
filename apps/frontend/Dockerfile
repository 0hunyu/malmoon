# 1단계: 빌드
FROM node:20 AS build
WORKDIR /app

# 1) 의존성만 먼저 복사 → 캐시 레이어
COPY package.json package-lock.json ./
# npm 캐시 활용(속도 ↑)
RUN --mount=type=cache,target=/root/.npm npm ci

# 2) 실제 소스만 복사 (필요한 디렉터리 한정)
COPY public ./public
COPY src ./src
COPY .env.production .env.production

#COPY . .
#RUN npm install && npm run build

RUN npm run build

# 2단계: Nginx로 정적 파일 서빙
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
# nginx 설정은 컨텍스트 내 경로 기준
COPY ./nginx/frontend.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
