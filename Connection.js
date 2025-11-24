// ===== Connection Class =====
class Connection {
    constructor(fromNodeId, fromPortId, toNodeId, toPortId) {
        this.id = generateId();
        this.fromNodeId = fromNodeId;
        this.fromPortId = fromPortId;
        this.toNodeId = toNodeId;
        this.toPortId = toPortId;
        this.name = '';
        this.color = '#58a6ff';
        this.lineStyle = 'solid'; // 'solid' or 'dashed'
    }

    draw(ctx, isSelected) {
        const fromNode = state.nodes.find(n => n.id === this.fromNodeId);
        const toNode = state.nodes.find(n => n.id === this.toNodeId);
        if (!fromNode || !toNode) return;

        const fromPos = fromNode.getPortPosition(this.fromPortId);
        const toPos = toNode.getPortPosition(this.toPortId);
        if (!fromPos || !toPos) return;

        ctx.strokeStyle = isSelected ? '#79c0ff' : this.color;
        ctx.lineWidth = isSelected ? 3 : 2;

        if (this.lineStyle === 'dashed') {
            ctx.setLineDash([5, 5]);
        } else {
            ctx.setLineDash([]);
        }

        ctx.beginPath();
        ctx.moveTo(fromPos.x, fromPos.y);

        const dx = Math.abs(toPos.x - fromPos.x);
        const dy = Math.abs(toPos.y - fromPos.y);
        const offset = Math.min(Math.max(dx, dy) * 0.5, 100);

        let cp1x = fromPos.x, cp1y = fromPos.y, cp2x = toPos.x, cp2y = toPos.y;

        if (fromPos.side === 'right') {
            cp1x = fromPos.x + offset;
        } else if (fromPos.side === 'left') {
            cp1x = fromPos.x - offset;
        } else if (fromPos.side === 'top') {
            cp1y = fromPos.y - offset;
        } else if (fromPos.side === 'bottom') {
            cp1y = fromPos.y + offset;
        }

        if (toPos.side === 'right') {
            cp2x = toPos.x + offset;
        } else if (toPos.side === 'left') {
            cp2x = toPos.x - offset;
        } else if (toPos.side === 'top') {
            cp2y = toPos.y - offset;
        } else if (toPos.side === 'bottom') {
            cp2y = toPos.y + offset;
        }

        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, toPos.x, toPos.y);
        ctx.stroke();
        ctx.setLineDash([]);

        if (this.name) {
            // Calculate midpoint of bezier curve (t=0.5)
            const t = 0.5;
            const mt = 1 - t;
            const mt2 = mt * mt;
            const mt3 = mt2 * mt;
            const t2 = t * t;
            const t3 = t2 * t;

            const midX = mt3 * fromPos.x + 3 * mt2 * t * cp1x + 3 * mt * t2 * cp2x + t3 * toPos.x;
            const midY = mt3 * fromPos.y + 3 * mt2 * t * cp1y + 3 * mt * t2 * cp2y + t3 * toPos.y;

            // Measure text
            ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';
            const textMetrics = ctx.measureText(this.name);
            const textWidth = textMetrics.width;
            const textHeight = 10; // Reduced from 16 to 10 (6px reduction)
            const padding = 6;

            // Draw rounded rectangle background with line color
            ctx.fillStyle = this.color;
            ctx.globalAlpha = 0.9; // Slightly transparent
            ctx.beginPath();
            ctx.roundRect(
                midX - textWidth / 2 - padding,
                midY - textHeight / 2 - padding,
                textWidth + padding * 2,
                textHeight + padding * 2,
                15 // Increased border radius for softer look
            );
            ctx.fill();
            ctx.globalAlpha = 1.0; // Reset alpha

            // Draw text centered on the line with white color for contrast
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.name, midX, midY);
        }
    }

    isNearPoint(x, y, threshold = 10) {
        const fromNode = state.nodes.find(n => n.id === this.fromNodeId);
        const toNode = state.nodes.find(n => n.id === this.toNodeId);
        if (!fromNode || !toNode) return false;

        const fromPos = fromNode.getPortPosition(this.fromPortId);
        const toPos = toNode.getPortPosition(this.toPortId);
        if (!fromPos || !toPos) return false;

        const dx = Math.abs(toPos.x - fromPos.x);
        const dy = Math.abs(toPos.y - fromPos.y);
        const offset = Math.min(Math.max(dx, dy) * 0.5, 100);

        let cp1x = fromPos.x, cp1y = fromPos.y, cp2x = toPos.x, cp2y = toPos.y;

        if (fromPos.side === 'right') cp1x = fromPos.x + offset;
        else if (fromPos.side === 'left') cp1x = fromPos.x - offset;
        else if (fromPos.side === 'top') cp1y = fromPos.y - offset;
        else if (fromPos.side === 'bottom') cp1y = fromPos.y + offset;

        if (toPos.side === 'right') cp2x = toPos.x + offset;
        else if (toPos.side === 'left') cp2x = toPos.x - offset;
        else if (toPos.side === 'top') cp2y = toPos.y - offset;
        else if (toPos.side === 'bottom') cp2y = toPos.y + offset;

        const steps = 50;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const mt = 1 - t;
            const mt2 = mt * mt;
            const mt3 = mt2 * mt;
            const t2 = t * t;
            const t3 = t2 * t;

            const bx = mt3 * fromPos.x + 3 * mt2 * t * cp1x + 3 * mt * t2 * cp2x + t3 * toPos.x;
            const by = mt3 * fromPos.y + 3 * mt2 * t * cp1y + 3 * mt * t2 * cp2y + t3 * toPos.y;

            const dist = Math.sqrt((x - bx) ** 2 + (y - by) ** 2);
            if (dist < threshold) return true;
        }
        return false;
    }
}
