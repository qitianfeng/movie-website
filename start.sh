#!/bin/bash

# MovieHub 项目启动脚本
# 使用方法: ./start.sh [service]
# service可选: all, backend, h5, admin

SERVICE=${1:-all}

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}  MovieHub 项目启动脚本${NC}"
echo -e "${GREEN}================================${NC}"
echo ""

# 检查服务是否已经在运行
check_service() {
    local port=$1
    local name=$2
    if lsof -i:$port > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  $name 已经在端口 $port 运行${NC}"
        return 1
    fi
    return 0
}

# 启动后端
start_backend() {
    echo -e "${GREEN}🚀 启动后端服务...${NC}"
    cd backend
    if check_service 3001 "后端"; then
        npm start &
        echo -e "${GREEN}✅ 后端服务启动成功: http://localhost:3001${NC}"
    fi
    cd ..
}

# 启动H5前端
start_h5() {
    echo -e "${GREEN}🚀 启动H5前端...${NC}"
    cd frontend-h5
    if check_service 5173 "H5前端"; then
        npm run dev &
        echo -e "${GREEN}✅ H5前端启动成功: http://localhost:5173${NC}"
    fi
    cd ..
}

# 启动后台管理
start_admin() {
    echo -e "${GREEN}🚀 启动后台管理...${NC}"
    cd frontend-admin
    if check_service 5174 "后台管理"; then
        npm run dev -- --port 5174 &
        echo -e "${GREEN}✅ 后台管理启动成功: http://localhost:5174${NC}"
    fi
    cd ..
}

# 根据参数启动服务
case $SERVICE in
    backend)
        start_backend
        ;;
    h5)
        start_h5
        ;;
    admin)
        start_admin
        ;;
    all)
        start_backend
        sleep 2
        start_h5
        sleep 1
        start_admin
        ;;
    *)
        echo -e "${RED}❌ 未知服务: $SERVICE${NC}"
        echo "使用方法: ./start.sh [all|backend|h5|admin]"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}  服务启动完成!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "访问地址:"
echo "  📱 H5前端:      http://localhost:5173"
echo "  💻 后台管理:    http://localhost:5174"
echo "  🔌 API文档:     http://localhost:3001/health"
echo ""
echo -e "${YELLOW}提示: 按 Ctrl+C 停止所有服务${NC}"
echo ""

# 等待用户输入
wait
