// ===== Group Class =====
class Group {
    constructor(x, y, width, height) {
        this.id = generateId();
        this.x = x;
        this.y = y;
        this.width = width || 300;
        this.height = height || 200;
        this.label = 'グループ';
        this.color = '#30363d';
        this.backgroundColor = 'rgba(22, 27, 34, 0.5)';
        this.children = [];
        this.parentId = null;
    }

    containsPoint(x, y) {
        return x >= this.x && x <= this.x + this.width &&
            y >= this.y && y <= this.y + this.height;
    }

    getResizeHandleAtPosition(x, y) {
        const handleSize = 20;
        const offset = 10; // Extend hit area outside the rectangle
        const handleX = this.x + this.width;
        const handleY = this.y + this.height;

        if (x >= handleX - handleSize && x <= handleX + offset &&
            y >= handleY - handleSize && y <= handleY + offset) {
            return 'bottom-right';
        }
        return null;
    }

    autoResize() {
        if (this.children.length === 0) return;

        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        this.children.forEach(childId => {
            const node = state.nodes.find(n => n.id === childId);
            const childGroup = state.groups.find(g => g.id === childId);

            if (node) {
                minX = Math.min(minX, node.x);
                minY = Math.min(minY, node.y);
                maxX = Math.max(maxX, node.x + node.width);
                maxY = Math.max(maxY, node.y + node.height);
            } else if (childGroup) {
                minX = Math.min(minX, childGroup.x);
                minY = Math.min(minY, childGroup.y);
                maxX = Math.max(maxX, childGroup.x + childGroup.width);
                maxY = Math.max(maxY, childGroup.y + childGroup.height);
            }
        });

        if (minX !== Infinity) {
            const padding = 20;
            this.x = minX - padding;
            this.y = minY - padding;
            this.width = maxX - minX + padding * 2;
            this.height = maxY - minY + padding * 2;
        }
    }

    draw(ctx, isSelected) {
        ctx.fillStyle = this.backgroundColor;
        ctx.strokeStyle = isSelected ? '#58a6ff' : this.color;
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#c9d1d9';
        ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(this.label, this.x + 10, this.y + 10);

        if (isSelected) {
            const handleSize = 10; // Increased from 8 to 10 (2px larger)
            const offset = 4; // Increased from 2 to 4 (2px more offset)
            ctx.fillStyle = '#58a6ff';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(
                this.x + this.width + offset,
                this.y + this.height + offset,
                handleSize / 2,
                0,
                Math.PI * 2
            );
            ctx.fill();
            ctx.stroke();
        }
    }
}
