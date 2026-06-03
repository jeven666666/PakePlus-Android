#!/bin/bash
# ==============================================
# Agnes AI Studio - 数据库备份脚本
# ==============================================

set -e

# 配置
DB_PATH="./agnes.db"
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
KEEP_DAYS=7

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=============================================="
echo "  Agnes AI Studio - 数据库备份"
echo "=============================================="
echo ""

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 检查数据库文件是否存在
if [ ! -f "$DB_PATH" ]; then
    echo -e "${RED}错误: 数据库文件不存在: $DB_PATH${NC}"
    exit 1
fi

# 备份数据库
BACKUP_FILE="$BACKUP_DIR/agnes_$DATE.db"
echo "正在备份数据库到: $BACKUP_FILE"
cp "$DB_PATH" "$BACKUP_FILE"

# 压缩备份
if command -v gzip &> /dev/null; then
    gzip -f "$BACKUP_FILE"
    BACKUP_FILE="$BACKUP_FILE.gz"
    echo -e "${GREEN}备份已压缩: $BACKUP_FILE${NC}"
fi

# 删除旧备份
echo ""
echo "清理 $KEEP_DAYS 天前的旧备份..."
find "$BACKUP_DIR" -name "agnes_*.db*" -type f -mtime +$KEEP_DAYS -delete

# 显示备份信息
echo ""
echo "=============================================="
echo -e "${GREEN}备份完成！${NC}"
echo "  备份文件: $BACKUP_FILE"
echo "  文件大小: $(du -h "$BACKUP_FILE" | cut -f1)"
echo "  备份目录: $BACKUP_DIR"
echo "  保留天数: $KEEP_DAYS 天"
echo ""
ls -lh "$BACKUP_DIR"
echo "=============================================="
