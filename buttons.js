// ===== Button Event Handlers =====
document.getElementById('addNodeBtn').addEventListener('click', () => {
    let x, y;
    if (state.selectedGroup) {
        x = state.selectedGroup.x + 20;
        y = state.selectedGroup.y + 40;
    } else {
        x = (canvas.width / 2 - state.offset.x) / state.scale - 100;
        y = (canvas.height / 2 - state.offset.y) / state.scale - 75;
    }

    const node = new NetworkNode(x, y);
    state.nodes.push(node);

    if (state.selectedGroup) {
        state.selectedGroup.children.push(node.id);
        node.parentId = state.selectedGroup.id;
    }

    state.selectedNode = node;
    updatePropertiesPanel();
    render();
});

document.getElementById('addGroupBtn').addEventListener('click', () => {
    let x, y;
    if (state.selectedGroup) {
        x = state.selectedGroup.x + 20;
        y = state.selectedGroup.y + 40;
    } else {
        x = (canvas.width / 2 - state.offset.x) / state.scale - 150;
        y = (canvas.height / 2 - state.offset.y) / state.scale - 100;
    }

    const group = new Group(x, y);
    state.groups.push(group);

    if (state.selectedGroup) {
        state.selectedGroup.children.push(group.id);
        group.parentId = state.selectedGroup.id;
    }

    state.selectedGroup = group;
    state.selectedNode = null;
    state.selectedConnection = null;
    updatePropertiesPanel();
    render();
});

// Helper function to get timestamp
function getTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

document.getElementById('saveBtn').addEventListener('click', () => {
    const data = {
        title: document.getElementById('appTitle').textContent,
        nodes: state.nodes.map(n => ({
            id: n.id, x: n.x, y: n.y, width: n.width, height: n.height,
            label: n.label, color: n.color, memo: n.memo, link: n.link, elements: n.elements,
            leftPorts: n.leftPorts, rightPorts: n.rightPorts,
            topPorts: n.topPorts, bottomPorts: n.bottomPorts, parentId: n.parentId,
            status: n.status, classification: n.classification, managementId: n.managementId,
            modelNumber: n.modelNumber, location: n.location, installDate: n.installDate,
            disposalDate: n.disposalDate
        })),
        groups: state.groups.map(g => ({
            id: g.id, x: g.x, y: g.y, width: g.width, height: g.height,
            label: g.label, color: g.color, backgroundColor: g.backgroundColor,
            children: g.children, parentId: g.parentId
        })),
        connections: state.connections.map(c => ({
            id: c.id, fromNodeId: c.fromNodeId, fromPortId: c.fromPortId,
            toNodeId: c.toNodeId, toPortId: c.toPortId,
            name: c.name, color: c.color, lineStyle: c.lineStyle
        }))
    };

    const timestamp = getTimestamp();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${timestamp}_diagram.json`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
});

document.getElementById('loadBtn').addEventListener('click', () => {
    document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            if (data.title) {
                document.getElementById('appTitle').textContent = data.title;
                state.diagramTitle = data.title;
            }

            state.nodes = [];
            state.connections = [];
            state.groups = [];
            state.selectedNode = null;
            state.selectedConnection = null;
            state.selectedGroup = null;

            data.nodes.forEach(nodeData => {
                const node = new NetworkNode(nodeData.x, nodeData.y);
                node.id = nodeData.id;
                node.width = nodeData.width;
                node.height = nodeData.height;
                node.label = nodeData.label;
                node.color = nodeData.color;
                node.memo = nodeData.memo;
                node.link = nodeData.link || '';
                node.elements = nodeData.elements || [];
                node.leftPorts = nodeData.leftPorts || [];
                node.rightPorts = nodeData.rightPorts || [];
                node.topPorts = nodeData.topPorts || [];
                node.bottomPorts = nodeData.bottomPorts || [];
                node.parentId = nodeData.parentId || null;
                node.status = nodeData.status || 'Active';
                node.classification = nodeData.classification || 'PC';
                node.managementId = nodeData.managementId || '';
                node.modelNumber = nodeData.modelNumber || '';
                node.location = nodeData.location || '';
                node.installDate = nodeData.installDate || '';
                node.disposalDate = nodeData.disposalDate || '';
                state.nodes.push(node);
            });

            if (data.groups) {
                data.groups.forEach(groupData => {
                    const group = new Group(groupData.x, groupData.y, groupData.width, groupData.height);
                    group.id = groupData.id;
                    group.label = groupData.label;
                    group.color = groupData.color;
                    group.backgroundColor = groupData.backgroundColor || 'rgba(22, 27, 34, 0.5)';
                    group.children = groupData.children || [];
                    group.parentId = groupData.parentId !== undefined ? groupData.parentId : null;
                    state.groups.push(group);
                });
            }

            data.connections.forEach(connData => {
                const conn = new Connection(connData.fromNodeId, connData.fromPortId, connData.toNodeId, connData.toPortId);
                conn.id = connData.id;
                conn.name = connData.name || '';
                conn.color = connData.color || '#58a6ff';
                conn.lineStyle = connData.lineStyle || 'solid';
                state.connections.push(conn);
            });

            updatePropertiesPanel();
            render();
        } catch (error) {
            alert('ファイルの読み込みに失敗しました: ' + error.message);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
});

document.getElementById('exportBtn').addEventListener('click', () => {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    // Calculate bounds including both nodes and groups
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    state.nodes.forEach(node => {
        minX = Math.min(minX, node.x - 50);
        minY = Math.min(minY, node.y - 50);
        maxX = Math.max(maxX, node.x + node.width + 50);
        maxY = Math.max(maxY, node.y + node.height + 50);
    });

    state.groups.forEach(group => {
        minX = Math.min(minX, group.x - 50);
        minY = Math.min(minY, group.y - 50);
        maxX = Math.max(maxX, group.x + group.width + 50);
        maxY = Math.max(maxY, group.y + group.height + 50);
    });

    if (state.nodes.length === 0 && state.groups.length === 0) {
        alert('エクスポートする要素がありません');
        return;
    }

    tempCanvas.width = maxX - minX;
    tempCanvas.height = maxY - minY;

    // Use transparent background
    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.translate(-minX, -minY);

    // Draw groups, connections, and nodes (no grid)
    state.groups.forEach(group => group.draw(tempCtx, false));
    state.connections.forEach(conn => conn.draw(tempCtx, false));
    state.nodes.forEach(node => node.draw(tempCtx, false));

    const timestamp = getTimestamp();
    tempCanvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${timestamp}_diagram.png`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }, 'image/png');
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Delete') {
        if (state.selectedNode) {
            const index = state.nodes.indexOf(state.selectedNode);
            if (index > -1) {
                const nodeId = state.selectedNode.id;
                state.nodes.splice(index, 1);
                state.connections = state.connections.filter(c => c.fromNodeId !== nodeId && c.toNodeId !== nodeId);
                state.selectedNode = null;
                updatePropertiesPanel();
                render();
            }
        } else if (state.selectedConnection) {
            const index = state.connections.indexOf(state.selectedConnection);
            if (index > -1) {
                state.connections.splice(index, 1);
                state.selectedConnection = null;
                updatePropertiesPanel();
                render();
            }
        } else if (state.selectedGroup) {
            const index = state.groups.indexOf(state.selectedGroup);
            if (index > -1) {
                state.groups.splice(index, 1);
                state.selectedGroup = null;
                updatePropertiesPanel();
                render();
            }
        }
    }
});

// ===== Resize Logic =====
const bottomPanel = document.getElementById('bottomPanel');
const resizeHandle = document.getElementById('resizeHandle');
let isResizing = false;
let lastY = 0;

resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    lastY = e.clientY;
    resizeHandle.classList.add('active');
    document.body.style.cursor = 'ns-resize';
    e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const deltaY = lastY - e.clientY;
    const currentHeight = bottomPanel.offsetHeight;
    const newHeight = currentHeight + deltaY;
    bottomPanel.style.height = `${newHeight}px`;
    lastY = e.clientY;
    resizeCanvas();
});

document.addEventListener('mouseup', () => {
    if (isResizing) {
        isResizing = false;
        resizeHandle.classList.remove('active');
        document.body.style.cursor = 'default';
        resizeCanvas();
    }
});
