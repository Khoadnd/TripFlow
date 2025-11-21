# Build Stage
FROM node:24-alpine as build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Accept API URL as build argument
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Production Stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Add mjs support to mime.types
RUN sed -i 's/application\/javascript\s\+js;/application\/javascript js mjs;/g' /etc/nginx/mime.types

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
