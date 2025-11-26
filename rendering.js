// ===== Rendering =====
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(state.offset.x, state.offset.y);
    ctx.scale(state.scale, state.scale);

    drawGrid();

    // Draw groups in reverse depth-first order (children first, then parent)
    // This ensures nested groups are drawn on top of their parents
    const drawnGroups = new Set();

    function drawGroupAndChildren(group) {
        if (drawnGroups.has(group.id)) return;

        // Mark as drawn FIRST to prevent infinite recursion
        drawnGroups.add(group.id);

        // Draw this group FIRST (so it appears behind children)
        const isSelected = group === state.selectedGroup || state.selectedGroups.includes(group);
        group.draw(ctx, isSelected);

        // Then draw child groups (so they appear on top)
        // Only recurse on child GROUPS, not nodes
        group.children.forEach(childId => {
            const childGroup = state.groups.find(g => g.id === childId);
            if (childGroup && !drawnGroups.has(childGroup.id)) {
                drawGroupAndChildren(childGroup);
            }
        });
    }

    // Start with top-level groups (those without parents)
    state.groups.filter(g => g.parentId === null).forEach(group => {
        drawGroupAndChildren(group);
    });

    // Draw all connections
    state.connections.forEach(conn => conn.draw(ctx, conn === state.selectedConnection));

    // Draw connection preview when connecting
    if (state.isConnecting && state.connectionStart) {
        const startNode = state.nodes.find(n => n.id === state.connectionStart.nodeId);
        if (startNode) {
            const startPos = startNode.getPortPosition(state.connectionStart.portId);
            if (startPos) {
                ctx.strokeStyle = '#58a6ff';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(startPos.x, startPos.y);
                ctx.lineTo(
                    (state.mousePos.x - state.offset.x) / state.scale,
                    (state.mousePos.y - state.offset.y) / state.scale
                );
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }
    }

    // Draw ALL nodes (regardless of whether they have a parent or not)
    state.nodes.forEach(node => {
        const isSelected = node === state.selectedNode || state.selectedNodes.includes(node);
        node.draw(ctx, isSelected);
    });

    // Draw selection rectangle
    if (state.isSelecting && state.selectionStart && state.selectionEnd) {
        const x = Math.min(state.selectionStart.x, state.selectionEnd.x);
        const y = Math.min(state.selectionStart.y, state.selectionEnd.y);
        const w = Math.abs(state.selectionEnd.x - state.selectionStart.x);
        const h = Math.abs(state.selectionEnd.y - state.selectionStart.y);

        ctx.strokeStyle = '#58a6ff';
        ctx.lineWidth = 1;
        ctx.fillStyle = 'rgba(88, 166, 255, 0.1)';
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.fill();
        ctx.stroke();
    }

    ctx.restore();
}

function drawGrid() {
    const gridSize = state.gridSize;
    const startX = Math.floor((-state.offset.x / state.scale) / gridSize) * gridSize;
    const startY = Math.floor((-state.offset.y / state.scale) / gridSize) * gridSize;
    const endX = startX + (canvas.width / state.scale) + gridSize;
    const endY = startY + (canvas.height / state.scale) + gridSize;

    ctx.strokeStyle = '#161b22';
    ctx.lineWidth = 1;

    for (let x = startX; x < endX; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
        ctx.stroke();
    }

    for (let y = startY; y < endY; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();
    }
}
