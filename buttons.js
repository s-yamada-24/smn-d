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

document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importInput').click();
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

document.getElementById('importInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);

            // Import logic: Append nodes, groups, and connections with new IDs
            // Do NOT update title

            // ID Mapping
            const idMap = new Map();
            const nodeIdMap = new Map();

            // Import Groups
            if (data.groups) {
                data.groups.forEach(groupData => {
                    const group = new Group(groupData.x + 20, groupData.y + 20, groupData.width, groupData.height);
                    group.label = groupData.label;
                    group.color = groupData.color;
                    group.backgroundColor = groupData.backgroundColor || 'rgba(22, 27, 34, 0.5)';

                    idMap.set(groupData.id, group.id);
                    state.groups.push(group);
                });

                // Restore group hierarchy
                data.groups.forEach(groupData => {
                    const newGroupId = idMap.get(groupData.id);
                    const newGroup = state.groups.find(g => g.id === newGroupId);

                    if (newGroup) {
                        if (groupData.parentId) {
                            newGroup.parentId = idMap.get(groupData.parentId) || null;
                        }

                        if (groupData.children) {
                            // Children will be populated as we process nodes and other groups, 
                            // but we can pre-fill group children here if we want, 
                            // OR we can rely on the fact that we'll update children when we process nodes/groups.
                            // Actually, it's safer to rebuild children array based on parentId.
                            // But let's follow the pattern: map old children IDs to new IDs.
                            newGroup.children = groupData.children.map(childId => idMap.get(childId)).filter(id => id !== undefined);
                        }
                    }
                });
            }

            // Import Nodes
            if (data.nodes) {
                data.nodes.forEach(nodeData => {
                    const node = new NetworkNode(nodeData.x + 20, nodeData.y + 20);
                    // Generate new ID automatically in constructor

                    node.width = nodeData.width;
                    node.height = nodeData.height;
                    node.label = nodeData.label;
                    node.color = nodeData.color;
                    node.memo = nodeData.memo;
                    node.link = nodeData.link || '';
                    node.status = nodeData.status || 'Active';
                    node.classification = nodeData.classification || 'PC';
                    node.managementId = nodeData.managementId || '';
                    node.modelNumber = nodeData.modelNumber || '';
                    node.location = nodeData.location || '';
                    node.installDate = nodeData.installDate || '';
                    node.disposalDate = nodeData.disposalDate || '';

                    // Map old ID to new ID
                    idMap.set(nodeData.id, node.id);
                    nodeIdMap.set(nodeData.id, node.id);

                    // Handle parent
                    if (nodeData.parentId) {
                        node.parentId = idMap.get(nodeData.parentId) || null;
                        // Add to parent group's children if not already there (though we handled children array above)
                        if (node.parentId) {
                            const parentGroup = state.groups.find(g => g.id === node.parentId);
                            if (parentGroup && !parentGroup.children.includes(node.id)) {
                                parentGroup.children.push(node.id);
                            }
                        }
                    }

                    // Handle elements with new IDs
                    node.elements = (nodeData.elements || []).map(el => ({
                        ...el,
                        id: `${node.id}-e${state.nextElementId++}`
                    }));

                    // Handle ports with new IDs
                    const regeneratePortIds = (ports) => {
                        return (ports || []).map(p => ({
                            ...p,
                            id: `${node.id}-${p.name}`
                        }));
                    };

                    node.leftPorts = regeneratePortIds(nodeData.leftPorts);
                    node.rightPorts = regeneratePortIds(nodeData.rightPorts);
                    node.topPorts = regeneratePortIds(nodeData.topPorts);
                    node.bottomPorts = regeneratePortIds(nodeData.bottomPorts);

                    state.nodes.push(node);
                });
            }

            // Import Connections
            if (data.connections) {
                data.connections.forEach(connData => {
                    const newFromNodeId = nodeIdMap.get(connData.fromNodeId);
                    const newToNodeId = nodeIdMap.get(connData.toNodeId);

                    if (newFromNodeId && newToNodeId) {
                        // Reconstruct port IDs
                        const fromPortName = connData.fromPortId.split('-').slice(1).join('-');
                        const toPortName = connData.toPortId.split('-').slice(1).join('-');

                        const newFromPortId = `${newFromNodeId}-${fromPortName}`;
                        const newToPortId = `${newToNodeId}-${toPortName}`;

                        const conn = new Connection(newFromNodeId, newFromPortId, newToNodeId, newToPortId);
                        conn.name = connData.name || '';
                        conn.color = connData.color || '#58a6ff';
                        conn.lineStyle = connData.lineStyle || 'solid';

                        state.connections.push(conn);
                    }
                });
            }

            updatePropertiesPanel();
            render();
            alert('インポートが完了しました');
        } catch (error) {
            alert('ファイルのインポートに失敗しました: ' + error.message);
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
    // Check if user is typing in an input field
    const isTyping = document.activeElement && (
        document.activeElement.tagName === 'INPUT' ||
        document.activeElement.tagName === 'TEXTAREA' ||
        document.activeElement.isContentEditable
    );

    if (e.key === 'Delete') {
        // Don't delete nodes/connections/groups if user is typing
        if (isTyping) return;

        let changed = false;

        // Delete multiple nodes
        if (state.selectedNodes.length > 0) {
            state.selectedNodes.forEach(node => {
                const index = state.nodes.indexOf(node);
                if (index > -1) {
                    state.nodes.splice(index, 1);
                    // Remove connections
                    state.connections = state.connections.filter(c => c.fromNodeId !== node.id && c.toNodeId !== node.id);
                }
            });
            state.selectedNodes = [];
            state.selectedNode = null;
            changed = true;
        }

        // Delete multiple groups
        if (state.selectedGroups.length > 0) {
            state.selectedGroups.forEach(group => {
                const index = state.groups.indexOf(group);
                if (index > -1) {
                    state.groups.splice(index, 1);
                }
            });
            state.selectedGroups = [];
            state.selectedGroup = null;
            changed = true;
        }

        // Delete single connection
        if (state.selectedConnection) {
            const index = state.connections.indexOf(state.selectedConnection);
            if (index > -1) {
                state.connections.splice(index, 1);
                state.selectedConnection = null;
                changed = true;
            }
        }

        if (changed) {
            updatePropertiesPanel();
            render();
        }
    }
});

// ===== Resize Logic =====
const leftPanel = document.getElementById('leftPanel');
const resizeHandle = document.getElementById('resizeHandle');
let isResizing = false;
let lastX = 0;

resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    lastX = e.clientX;
    resizeHandle.classList.add('active');
    document.body.style.cursor = 'ew-resize';
    e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const deltaX = e.clientX - lastX;
    const currentWidth = leftPanel.offsetWidth;
    const newWidth = currentWidth + deltaX;
    if (newWidth >= 200 && newWidth <= 800) {
        leftPanel.style.width = `${newWidth}px`;
        lastX = e.clientX;
        resizeCanvas();
    }
});

document.addEventListener('mouseup', () => {
    if (isResizing) {
        isResizing = false;
        resizeHandle.classList.remove('active');
        document.body.style.cursor = 'default';
        resizeCanvas();
    }
});
