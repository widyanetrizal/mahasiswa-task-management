# Stage 1 - Build React App
FROM node:18 AS build
WORKDIR /app

# Copy package.json & install dependencies
COPY package*.json ./

RUN npm install

# Copy semua file dan build
COPY . .
RUN npm run build

# Stage 2 - Serve dengan Nginx
FROM nginx:alpine
# copy hasil build React
COPY --from=build /app/build /usr/share/nginx/html

# pakai config SPA (tanpa proxy)
# COPY ../nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;" ]
