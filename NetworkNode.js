// ===== NetworkNode Class =====
class NetworkNode {
    constructor(x, y) {
        this.id = generateId();
        this.x = x;
        this.y = y;
        this.width = 200;
        this.height = 100;
        this.label = 'ノード';
        this.color = '#21262d';
        this.memo = '';
        this.status = 'Active';
        this.classification = 'PC';
        this.managementId = '';
        this.modelNumber = '';
        this.location = '';
        this.installDate = '';
        this.disposalDate = '';
        this.link = '';
        this.elements = [];
        this.leftPorts = [];
        this.rightPorts = [];
        this.topPorts = [];
        this.bottomPorts = [];
        this.parentId = null;
        this.updateHeight();
    }

    addElement(name) {
        this.elements.push({
            id: generateId(),
            name: name || `要素 ${this.elements.length + 1}`,
            description: '',
            status: 'Active',
            memo1: '',
            memo2: '',
            url: '',
            color: '#c9d1d9'
        });
        this.updateHeight();
    }

    removeElement(index) {
        this.elements.splice(index, 1);
        this.updateHeight();
    }

    updateHeight() {
        const headerHeight = 40;
        const padding = 15;
        const elementHeight = 25;
        const bottomPadding = 10;

        let contentHeight;
        if (this.elements.length === 0) {
            contentHeight = headerHeight;
        } else {
            contentHeight = headerHeight + padding + (this.elements.length * elementHeight) + bottomPadding;
        }

        const maxPorts = Math.max(this.leftPorts.length, this.rightPorts.length);
        const minPortHeight = (maxPorts + 1) * 20;
        const minHeight = this.elements.length === 0 ? headerHeight : 100;

        this.height = Math.max(contentHeight, minPortHeight, minHeight);
    }

    getPortPosition(portId) {
        const allPorts = [...this.leftPorts, ...this.rightPorts, ...this.topPorts, ...this.bottomPorts];
        const port = allPorts.find(p => p.id === portId);
        if (!port) return null;

        if (this.leftPorts.includes(port)) {
            const index = this.leftPorts.indexOf(port);
            const spacing = this.height / (this.leftPorts.length + 1);
            return { x: this.x, y: this.y + spacing * (index + 1), side: 'left' };
        } else if (this.rightPorts.includes(port)) {
            const index = this.rightPorts.indexOf(port);
            const spacing = this.height / (this.rightPorts.length + 1);
            return { x: this.x + this.width, y: this.y + spacing * (index + 1), side: 'right' };
        } else if (this.topPorts.includes(port)) {
            const index = this.topPorts.indexOf(port);
            const spacing = this.width / (this.topPorts.length + 1);
            return { x: this.x + spacing * (index + 1), y: this.y, side: 'top' };
        } else if (this.bottomPorts.includes(port)) {
            const index = this.bottomPorts.indexOf(port);
            const spacing = this.width / (this.bottomPorts.length + 1);
            return { x: this.x + spacing * (index + 1), y: this.y + this.height, side: 'bottom' };
        }
        return null;
    }

    getPortAtPosition(x, y) {
        const allPorts = [
            ...this.leftPorts.map(p => ({ ...p, side: 'left' })),
            ...this.rightPorts.map(p => ({ ...p, side: 'right' })),
            ...this.topPorts.map(p => ({ ...p, side: 'top' })),
            ...this.bottomPorts.map(p => ({ ...p, side: 'bottom' }))
        ];

        for (const port of allPorts) {
            const pos = this.getPortPosition(port.id);
            const dx = x - pos.x;
            const dy = y - pos.y;
            if (Math.sqrt(dx * dx + dy * dy) < 8) {
                return port;
            }
        }
        return null;
    }

    containsPoint(x, y) {
        return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height;
    }

    getWidthResizeHandleAtPosition(x, y) {
        const handleSize = 12;
        const offset = 5;
        const handleX = this.x + this.width + offset;
        const handleY = this.y + this.height + offset;

        if (x >= handleX - handleSize / 2 && x <= handleX + handleSize / 2 &&
            y >= handleY - handleSize / 2 && y <= handleY + handleSize / 2) {
            return 'bottom-right';
        }
        return null;
    }

    draw(ctx, isSelected) {
        ctx.save();

        // Draw background
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, 6);
        ctx.fill();

        // Draw stripes if Inactive
        if (this.status === 'Inactive') {
            ctx.clip();
            ctx.strokeStyle = '#30363d';
            ctx.lineWidth = 2;
            ctx.beginPath();
            const spacing = 10;
            for (let i = -this.height; i < this.width; i += spacing) {
                ctx.moveTo(this.x + i, this.y);
                ctx.lineTo(this.x + i + this.height, this.y + this.height);
            }
            ctx.stroke();
        }

        ctx.restore();

        // Draw border
        ctx.strokeStyle = isSelected ? '#58a6ff' : '#30363d';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, 6);
        ctx.stroke();

        if (this.elements.length > 0) {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + 40);
            ctx.lineTo(this.x + this.width, this.y + 40);
            ctx.strokeStyle = '#30363d';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        ctx.fillStyle = '#c9d1d9';
        ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.label, this.x + this.width / 2, this.y + 20);

        let currentY = this.y + 55;
        ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';
        ctx.textAlign = 'left';

        this.elements.forEach(el => {
            ctx.save();
            if (el.status === 'Inactive') {
                ctx.globalAlpha = 0.5;
            }
            ctx.fillStyle = el.color || '#8b949e';
            ctx.fillText(el.name, this.x + 15, currentY);
            if (el.status !== 'Active') {
                ctx.fillStyle = el.status === 'Error' ? '#da3633' : '#d29922';
                ctx.beginPath();
                ctx.arc(this.x + 8, currentY, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
            currentY += 25;
        });

        this.drawPorts(ctx);

        // Draw resize handle
        if (isSelected) {
            const handleSize = 10;
            const offset = 5;
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

    drawPorts(ctx) {
        ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';
        ctx.textBaseline = 'middle';

        const drawPort = (port, x, y, side) => {
            ctx.save();
            if (port.status === 'Inactive') {
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = '#da3633';
                ctx.strokeStyle = '#f85149';
            } else {
                ctx.fillStyle = '#161b22';
                ctx.strokeStyle = '#8b949e';
            }
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#8b949e';
            if (side === 'left') {
                ctx.textAlign = 'right';
                ctx.fillText(port.name, x - 8, y);
            } else if (side === 'right') {
                ctx.textAlign = 'left';
                ctx.fillText(port.name, x + 8, y);
            } else if (side === 'top') {
                ctx.textAlign = 'center';
                ctx.fillText(port.name, x, y - 10);
            } else if (side === 'bottom') {
                ctx.textAlign = 'center';
                ctx.fillText(port.name, x, y + 10);
            }
            ctx.restore();
        };

        const leftSpacing = this.height / (this.leftPorts.length + 1);
        this.leftPorts.forEach((port, index) => {
            drawPort(port, this.x, this.y + leftSpacing * (index + 1), 'left');
        });

        const rightSpacing = this.height / (this.rightPorts.length + 1);
        this.rightPorts.forEach((port, index) => {
            drawPort(port, this.x + this.width, this.y + rightSpacing * (index + 1), 'right');
        });

        const topSpacing = this.width / (this.topPorts.length + 1);
        this.topPorts.forEach((port, index) => {
            drawPort(port, this.x + topSpacing * (index + 1), this.y, 'top');
        });

        const bottomSpacing = this.width / (this.bottomPorts.length + 1);
        this.bottomPorts.forEach((port, index) => {
            drawPort(port, this.x + bottomSpacing * (index + 1), this.y + this.height, 'bottom');
        });
    }
}
