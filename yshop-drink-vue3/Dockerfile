# 构建阶段
FROM node:16 AS build-stage

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
# RUN npm install
# 使用 pnpm 安装依赖，先卸载再安装，避免版本问题，忽略RUN报错
RUN npm config set registry https://registry.npmmirror.com
RUN npm uninstall -g pnpm || true
RUN npm install -g pnpm@8  || true
RUN pnpm install

# 复制源代码
COPY . .

# 构建应用
RUN npm run build:dev
# RUN npm run build

# 生产阶段
FROM nginx:alpine AS production-stage

# 复制构建好的文件到nginx
COPY --from=build-stage /app/dist /usr/share/nginx/html

# 复制nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]