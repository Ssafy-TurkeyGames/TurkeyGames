# Node 20을 사용한 빌드 스테이지
FROM node:20 AS build

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .

RUN npm run build

# Nginx 프로덕션 이미지로 전환
FROM nginx:alpine AS production

# 각각 따로 복사 (🚨 중요)
COPY --from=build /app/dist/dashboard /usr/share/nginx/html/dashboard
COPY --from=build /app/dist/gameboard /usr/share/nginx/html/gameboard

# 기본 설정 제거 및 커스텀 설정 적용
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
