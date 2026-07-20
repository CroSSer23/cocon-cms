# ---- build (Angular 8 needs an older Node toolchain) ----
FROM node:14-buster AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund
COPY . .
RUN node --max_old_space_size=4096 node_modules/@angular/cli/bin/ng build --prod

# ---- serve ----
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
