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

# Install openssl for cert generation and gettext for envsubst
RUN apk add --no-cache openssl gettext

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/nginx.conf.template
COPY entrypoint.sh /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh

# Add mjs support to mime.types
RUN sed -i 's/application\/javascript\s\+js;/application\/javascript js mjs;/g' /etc/nginx/mime.types

EXPOSE 80 443

ENTRYPOINT ["/docker-entrypoint.sh"]
