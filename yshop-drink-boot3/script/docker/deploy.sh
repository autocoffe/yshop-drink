#!/bin/bash

# 部署脚本
set -e

echo "开始部署点餐系统..."

# 切换到项目根目录
# cd "$(dirname "$0")"
cd ../../..

# 编译后端
echo "编译后端项目..."
cd yshop-drink-boot3/
mvn clean package -DskipTests
cd ..

# 编译前端
echo "编译前端项目..."
cd yshop-drink-vue3/
npm config set registry https://registry.npmmirror.com
npm config set registry https://registry.npmjs.org
pnpm install
# npm run build
npm run build:dev
cd ..

# # 创建必要的目录
# mkdir -p docker/mysql
# mkdir -p docker/yshop-server

# # 复制后端JAR文件
# cp yshop-drink-boot3/yshop-server/target/yshop-server.jar docker/yshop-server/

# 使用Docker Compose部署
echo "启动Docker容器..."
# cd docker
cp -f yshop-drink-boot3/script/docker/docker-compose.yml ./
docker-compose down
docker-compose up -d --build

echo "部署完成！"
echo "前端访问: http://服务器IP"
echo "后端API: http://服务器IP:8080"