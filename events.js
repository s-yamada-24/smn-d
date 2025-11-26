// ===== Mouse Event Handlers =====
function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function getWorldPos(screenX, screenY) {
    return {
        x: (screenX - state.offset.x) / state.scale,
        y: (screenY - state.offset.y) / state.scale
    };
}

canvas.addEventListener('mousedown', (e) => {
    const mousePos = getMousePos(e);
    state.mousePos = mousePos;
    const worldPos = getWorldPos(mousePos.x, mousePos.y);
    state.lastWorldPos = worldPos; // Initialize last position for drag deltas

    // Middle click (wheel button) always pans the canvas
    if (e.button === 1) {
        e.preventDefault();
        state.isPanning = true;
        state.panStart = { x: mousePos.x - state.offset.x, y: mousePos.y - state.offset.y };
        canvas.style.cursor = 'grabbing';
        return;
    }

    // Shift+Drag for Area Selection
    if (e.shiftKey) {
        state.isSelecting = true;
        state.selectionStart = worldPos;
        state.selectionEnd = worldPos;
        return;
    }

    // Check for port clicks first
    for (const node of state.nodes) {
        const port = node.getPortAtPosition(worldPos.x, worldPos.y);
        if (port) {
            state.isConnecting = true;
            state.connectionStart = { nodeId: node.id, portId: port.id };
            return;
        }
    }

    // Check for connection clicks
    let clickedConnection = null;
    for (let i = state.connections.length - 1; i >= 0; i--) {
        if (state.connections[i].isNearPoint(worldPos.x, worldPos.y)) {
            clickedConnection = state.connections[i];
            break;
        }
    }

    if (clickedConnection) {
        if (e.ctrlKey) {
            // Toggle connection selection (if we supported multiple connections, but for now just select)
            state.selectedConnection = clickedConnection;
        } else {
            state.selectedConnection = clickedConnection;
            state.selectedNodes = [];
            state.selectedGroups = [];
            state.selectedNode = null;
            state.selectedGroup = null;
        }
        updatePropertiesPanel();
        render();
        return;
    }

    // Check for node resize handle clicks
    if (state.selectedNode) {
        const resizeHandle = state.selectedNode.getWidthResizeHandleAtPosition(worldPos.x, worldPos.y);
        if (resizeHandle) {
            state.isResizingNode = true;
            state.resizeTarget = state.selectedNode;
            return;
        }
    }

    // Check for group resize handle clicks
    if (state.selectedGroup) {
        const resizeHandle = state.selectedGroup.getResizeHandleAtPosition(worldPos.x, worldPos.y);
        if (resizeHandle) {
            state.isResizingGroup = true;
            state.resizeTarget = state.selectedGroup;
            return;
        }
    }

    // Check for node clicks
    let clickedNode = null;
    for (let i = state.nodes.length - 1; i >= 0; i--) {
        if (state.nodes[i].containsPoint(worldPos.x, worldPos.y)) {
            clickedNode = state.nodes[i];
            break;
        }
    }

    // Check for group clicks (deepest)
    let clickedGroup = null;
    if (!clickedNode) {
        let maxDepth = -1;
        function getGroupDepth(group) {
            let depth = 0;
            let current = group;
            while (current.parentId) {
                depth++;
                current = state.groups.find(g => g.id === current.parentId);
                if (!current) break;
            }
            return depth;
        }

        for (let i = state.groups.length - 1; i >= 0; i--) {
            if (state.groups[i].containsPoint(worldPos.x, worldPos.y)) {
                const depth = getGroupDepth(state.groups[i]);
                if (depth > maxDepth) {
                    maxDepth = depth;
                    clickedGroup = state.groups[i];
                }
            }
        }
    }

    const target = clickedNode || clickedGroup;

    if (target) {
        const isNode = !!clickedNode;
        const selectedList = isNode ? state.selectedNodes : state.selectedGroups;

        if (e.ctrlKey) {
            // Toggle selection
            const index = selectedList.indexOf(target);
            if (index > -1) {
                selectedList.splice(index, 1);
                // If we deselected the primary selected item, clear it
                if (isNode && state.selectedNode === target) state.selectedNode = null;
                if (!isNode && state.selectedGroup === target) state.selectedGroup = null;
            } else {
                selectedList.push(target);
                // Update primary selection
                if (isNode) state.selectedNode = target;
                else state.selectedGroup = target;
            }
        } else {
            // Normal click
            // If target is NOT already selected, clear others and select this
            if (!selectedList.includes(target)) {
                state.selectedNodes = [];
                state.selectedGroups = [];
                if (isNode) {
                    state.selectedNodes.push(target);
                    state.selectedNode = target;
                    state.selectedGroup = null;
                } else {
                    state.selectedGroups.push(target);
                    state.selectedGroup = target;
                    state.selectedNode = null;
                }
            } else {
                // If target IS already selected, update primary selection but keep others
                if (isNode) state.selectedNode = target;
                else state.selectedGroup = target;
            }
        }

        state.selectedConnection = null;
        state.isDragging = true;
        state.draggedNode = isNode ? target : null; // Keep for compatibility
        state.draggedGroup = !isNode ? target : null; // Keep for compatibility

        updatePropertiesPanel();
    } else {
        // Clicked on empty space
        if (!e.ctrlKey) {
            state.selectedNodes = [];
            state.selectedGroups = [];
            state.selectedNode = null;
            state.selectedGroup = null;
            state.selectedConnection = null;
        }

        state.isPanning = true;
        state.panStart = { x: mousePos.x - state.offset.x, y: mousePos.y - state.offset.y };
        canvas.style.cursor = 'grabbing';
        updatePropertiesPanel();
    }
    render();
});

canvas.addEventListener('mousemove', (e) => {
    const mousePos = getMousePos(e);
    state.mousePos = mousePos;
    const worldPos = getWorldPos(mousePos.x, mousePos.y);

    const dx = worldPos.x - (state.lastWorldPos ? state.lastWorldPos.x : worldPos.x);
    const dy = worldPos.y - (state.lastWorldPos ? state.lastWorldPos.y : worldPos.y);
    state.lastWorldPos = worldPos;

    if (state.isSelecting) {
        state.selectionEnd = worldPos;
        render();
        return;
    }

    if (state.isResizingNode && state.resizeTarget) {
        const newWidth = Math.max(100, worldPos.x - state.resizeTarget.x);
        state.resizeTarget.width = newWidth;
        render();
    } else if (state.isResizingGroup && state.resizeTarget) {
        const newWidth = Math.max(100, worldPos.x - state.resizeTarget.x);
        const newHeight = Math.max(100, worldPos.y - state.resizeTarget.y);
        state.resizeTarget.width = newWidth;
        state.resizeTarget.height = newHeight;
        render();
    } else if (state.isDragging) {
        // Move all selected nodes
        state.selectedNodes.forEach(node => {
            node.x += dx;
            node.y += dy;
        });

        // Move all selected groups
        state.selectedGroups.forEach(group => {
            group.x += dx;
            group.y += dy;
            moveGroupChildren(group, dx, dy);
        });

        render();
    } else if (state.isPanning) {
        state.offset.x = mousePos.x - state.panStart.x;
        state.offset.y = mousePos.y - state.panStart.y;
        render();
    } else if (state.isConnecting) {
        render();
    }
});

// Helper function to recursively move group children
function moveGroupChildren(group, dx, dy) {
    group.children.forEach(childId => {
        const node = state.nodes.find(n => n.id === childId);
        if (node && node.parentId === group.id) {
            node.x += dx;
            node.y += dy;
        }
        const childGroup = state.groups.find(g => g.id === childId);
        if (childGroup && childGroup.parentId === group.id) {
            childGroup.x += dx;
            childGroup.y += dy;
            moveGroupChildren(childGroup, dx, dy); // Recursive for nested groups
        }
    });
}

canvas.addEventListener('mouseup', (e) => {
    const mousePos = getMousePos(e);
    const worldPos = getWorldPos(mousePos.x, mousePos.y);

    if (state.isSelecting) {
        // Finalize selection
        const x = Math.min(state.selectionStart.x, state.selectionEnd.x);
        const y = Math.min(state.selectionStart.y, state.selectionEnd.y);
        const w = Math.abs(state.selectionEnd.x - state.selectionStart.x);
        const h = Math.abs(state.selectionEnd.y - state.selectionStart.y);

        // Find nodes in rect
        state.nodes.forEach(node => {
            if (node.x >= x && node.x + node.width <= x + w &&
                node.y >= y && node.y + node.height <= y + h) {
                if (!state.selectedNodes.includes(node)) {
                    state.selectedNodes.push(node);
                }
            }
        });

        // Find groups in rect
        state.groups.forEach(group => {
            if (group.x >= x && group.x + group.width <= x + w &&
                group.y >= y && group.y + group.height <= y + h) {
                if (!state.selectedGroups.includes(group)) {
                    state.selectedGroups.push(group);
                }
            }
        });

        // Update primary selection if needed
        if (state.selectedNodes.length > 0) state.selectedNode = state.selectedNodes[state.selectedNodes.length - 1];
        if (state.selectedGroups.length > 0) state.selectedGroup = state.selectedGroups[state.selectedGroups.length - 1];

        state.isSelecting = false;
        state.selectionStart = null;
        state.selectionEnd = null;
        updatePropertiesPanel();
        render();
        return;
    }

    if (state.isConnecting && state.connectionStart) {
        for (const node of state.nodes) {
            const port = node.getPortAtPosition(worldPos.x, worldPos.y);
            if (port && node.id !== state.connectionStart.nodeId) {
                if (state.connectionStart.reconnecting) {
                    const oldConn = state.connectionStart.oldConnection;
                    const index = state.connections.indexOf(oldConn);
                    if (index > -1) state.connections.splice(index, 1);
                }
                const connection = new Connection(
                    state.connectionStart.nodeId,
                    state.connectionStart.portId,
                    node.id,
                    port.id
                );
                state.connections.push(connection);
                break;
            }
        }
        state.isConnecting = false;
        state.connectionStart = null;
    }

    // Drop logic (simplified: only check for the primarily dragged item)
    if (state.isDragging && state.draggedNode) {
        // Find new parent group (deepest group containing the node)
        let droppedGroup = null;
        let maxDepth = -1;

        function getGroupDepth(group) {
            let depth = 0;
            let current = group;
            while (current.parentId) {
                depth++;
                current = state.groups.find(g => g.id === current.parentId);
                if (!current) break;
            }
            return depth;
        }

        for (let i = state.groups.length - 1; i >= 0; i--) {
            if (state.groups[i].containsPoint(
                state.draggedNode.x + state.draggedNode.width / 2,
                state.draggedNode.y + state.draggedNode.height / 2
            )) {
                const depth = getGroupDepth(state.groups[i]);
                if (depth > maxDepth) {
                    maxDepth = depth;
                    droppedGroup = state.groups[i];
                }
            }
        }

        const currentParentId = state.draggedNode.parentId;
        const newParentId = droppedGroup ? droppedGroup.id : null;

        // Only update if the parent has actually changed
        if (currentParentId !== newParentId) {
            // Remove from old parent (specific removal, not global scan)
            if (currentParentId !== null) {
                const oldParent = state.groups.find(g => g.id === currentParentId);
                if (oldParent) {
                    oldParent.children = oldParent.children.filter(id => id !== state.draggedNode.id);
                }
            }
            state.draggedNode.parentId = null;

            // Add to new parent
            if (droppedGroup) {
                if (!droppedGroup.children.includes(state.draggedNode.id)) {
                    droppedGroup.children.push(state.draggedNode.id);
                }
                state.draggedNode.parentId = droppedGroup.id;
            }
        }
    }

    if (state.draggedGroup) {
        let droppedGroup = null;
        for (let i = state.groups.length - 1; i >= 0; i--) {
            if (state.groups[i] !== state.draggedGroup &&
                state.groups[i].containsPoint(state.draggedGroup.x + state.draggedGroup.width / 2, state.draggedGroup.y + state.draggedGroup.height / 2)) {
                droppedGroup = state.groups[i];
                break;
            }
        }

        // Remove from ANY old parent (robust cleanup)
        state.groups.forEach(group => {
            if (group.children.includes(state.draggedGroup.id)) {
                // Check for ID collision: Is this child actually a Node with the same ID?
                const conflictingNode = state.nodes.find(n => n.id === state.draggedGroup.id);
                if (conflictingNode && conflictingNode.parentId === group.id) {
                    // The child is a Node, not our Group. Do not remove.
                    return;
                }
                group.children = group.children.filter(id => id !== state.draggedGroup.id);
            }
        });
        state.draggedGroup.parentId = null;

        if (droppedGroup) {
            let current = droppedGroup;
            let isCircular = false;
            while (current) {
                if (current.id === state.draggedGroup.id) {
                    isCircular = true;
                    break;
                }
                current = state.groups.find(g => g.id === current.parentId);
            }

            if (!isCircular) {
                if (!droppedGroup.children.includes(state.draggedGroup.id)) {
                    droppedGroup.children.push(state.draggedGroup.id);
                }
                state.draggedGroup.parentId = droppedGroup.id;
            }
        }
    }

    state.isDragging = false;
    state.draggedNode = null;
    state.draggedGroup = null;
    state.isPanning = false;
    state.isResizingNode = false;
    state.isResizingGroup = false;
    state.resizeTarget = null;
    canvas.style.cursor = 'grab';
    render();
});

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const mousePos = getMousePos(e);
    const worldPosBefore = getWorldPos(mousePos.x, mousePos.y);

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    state.scale *= zoomFactor;
    state.scale = Math.max(0.1, Math.min(3, state.scale));

    const worldPosAfter = getWorldPos(mousePos.x, mousePos.y);
    state.offset.x += (worldPosAfter.x - worldPosBefore.x) * state.scale;
    state.offset.y += (worldPosAfter.y - worldPosBefore.y) * state.scale;

    render();
});

// ===== Keyboard Event Handlers =====
window.addEventListener('keydown', (e) => {
    // Check if user is typing in an input field
    const isTyping = document.activeElement && (
        document.activeElement.tagName === 'INPUT' ||
        document.activeElement.tagName === 'TEXTAREA' ||
        document.activeElement.isContentEditable
    );

    // Copy: Ctrl+C
    if (e.ctrlKey && e.key === 'c') {
        // Don't copy nodes/groups if user is typing
        if (isTyping) return;

        if (state.selectedNodes.length > 0 || state.selectedGroups.length > 0) {
            // Multiple selection copy
            const nodesToCopy = state.selectedNodes.map(node => JSON.parse(JSON.stringify(node)));
            const groupsToCopy = state.selectedGroups.map(group => copyGroupWithChildren(group));

            state.clipboard = {
                type: 'multi',
                data: {
                    nodes: nodesToCopy,
                    groups: groupsToCopy
                }
            };
        } else if (state.selectedNode) {
            // Deep copy the node data (excluding methods)
            state.clipboard = {
                type: 'node',
                data: JSON.parse(JSON.stringify(state.selectedNode))
            };
        } else if (state.selectedGroup) {
            // Deep copy the group and all its children
            state.clipboard = {
                type: 'group',
                data: copyGroupWithChildren(state.selectedGroup)
            };
        }
    }

    // Paste: Ctrl+V
    if (e.ctrlKey && e.key === 'v') {
        // Don't paste nodes/groups if user is typing
        if (isTyping) return;

        if (state.clipboard) {
            if (state.clipboard.type === 'multi') {
                const { nodes, groups } = state.clipboard.data;

                // Deselect current selection
                state.selectedNodes = [];
                state.selectedGroups = [];
                state.selectedNode = null;
                state.selectedGroup = null;

                // Paste nodes
                nodes.forEach(nodeData => {
                    const newNode = pasteNode(nodeData, true); // true = return node instead of selecting
                    if (newNode) state.selectedNodes.push(newNode);
                });

                // Paste groups
                groups.forEach(groupData => {
                    const newGroup = pasteGroup(groupData, true); // true = return group instead of selecting
                    if (newGroup) state.selectedGroups.push(newGroup);
                });

                // Update primary selection
                if (state.selectedNodes.length > 0) state.selectedNode = state.selectedNodes[state.selectedNodes.length - 1];
                if (state.selectedGroups.length > 0) state.selectedGroup = state.selectedGroups[state.selectedGroups.length - 1];

                updatePropertiesPanel();
                render();

            } else if (state.clipboard.type === 'node') {
                pasteNode(state.clipboard.data);
            } else if (state.clipboard.type === 'group') {
                pasteGroup(state.clipboard.data);
            }
        }
    }
});

// Helper function to recursively copy a group and all its children
function copyGroupWithChildren(group) {
    const groupData = JSON.parse(JSON.stringify(group));

    // Collect all child nodes and groups
    const childNodes = [];
    const childGroups = [];
    const nodeIds = new Set(); // Track all node IDs in this group

    function collectChildren(parentGroup) {
        parentGroup.children.forEach(childId => {
            const node = state.nodes.find(n => n.id === childId);
            if (node && node.parentId === parentGroup.id) {
                childNodes.push(JSON.parse(JSON.stringify(node)));
                nodeIds.add(node.id);
            }

            const childGroup = state.groups.find(g => g.id === childId);
            if (childGroup && childGroup.parentId === parentGroup.id) {
                childGroups.push(JSON.parse(JSON.stringify(childGroup)));
                collectChildren(childGroup);
            }
        });
    }

    collectChildren(group);

    // Collect connections between nodes in this group
    const connections = [];
    state.connections.forEach(conn => {
        // Only copy connections where both nodes are in this group
        if (nodeIds.has(conn.fromNodeId) && nodeIds.has(conn.toNodeId)) {
            connections.push(JSON.parse(JSON.stringify(conn)));
        }
    });

    return {
        group: groupData,
        childNodes: childNodes,
        childGroups: childGroups,
        connections: connections
    };
}

// Helper function to paste a node
function pasteNode(data, returnOnly = false) {
    // Create a new NetworkNode instance
    // Offset by 20px from the copied position
    const newNode = new NetworkNode(data.x + 20, data.y + 20);

    // Copy properties
    newNode.label = data.label;
    newNode.color = data.color;
    newNode.memo = data.memo;
    newNode.status = data.status;
    newNode.classification = data.classification;
    newNode.managementId = data.managementId;
    newNode.modelNumber = data.modelNumber;
    newNode.location = data.location;
    newNode.installDate = data.installDate;
    newNode.disposalDate = data.disposalDate;
    newNode.link = data.link;
    newNode.width = data.width;

    // Copy elements with NEW IDs
    newNode.elements = data.elements.map(el => ({
        ...el,
        id: `${newNode.id}-e${state.nextElementId++}`
    }));

    // Helper to regenerate port IDs
    const regeneratePortIds = (ports) => {
        return ports.map(p => ({
            ...p,
            id: `${newNode.id}-${p.name}`
        }));
    };

    // Copy ports with NEW IDs
    newNode.leftPorts = regeneratePortIds(data.leftPorts);
    newNode.rightPorts = regeneratePortIds(data.rightPorts);
    newNode.topPorts = regeneratePortIds(data.topPorts);
    newNode.bottomPorts = regeneratePortIds(data.bottomPorts);

    // Update height based on content
    newNode.updateHeight();

    // Add to state
    state.nodes.push(newNode);

    if (returnOnly) {
        return newNode;
    }

    // Select the new node
    state.selectedNode = newNode;
    state.selectedGroup = null;
    state.selectedConnection = null;
    state.selectedNodes = [newNode];
    state.selectedGroups = [];

    updatePropertiesPanel();
    render();
}

// Helper function to paste a group with all its children
function pasteGroup(clipboardData, returnOnly = false) {
    const { group: groupData, childNodes, childGroups, connections } = clipboardData;

    // Create ID mapping for old IDs to new IDs
    const idMap = new Map();
    const nodeIdMap = new Map(); // Separate map for node IDs

    // Create new group
    const newGroup = new Group(groupData.x + 20, groupData.y + 20, groupData.width, groupData.height);
    newGroup.label = groupData.label;
    newGroup.color = groupData.color;
    newGroup.backgroundColor = groupData.backgroundColor;

    // Map old group ID to new group ID
    idMap.set(groupData.id, newGroup.id);

    // Create all child groups first (to establish ID mappings)
    const newChildGroups = [];
    childGroups.forEach(childGroupData => {
        const newChildGroup = new Group(
            childGroupData.x + 20,
            childGroupData.y + 20,
            childGroupData.width,
            childGroupData.height
        );
        newChildGroup.label = childGroupData.label;
        newChildGroup.color = childGroupData.color;
        newChildGroup.backgroundColor = childGroupData.backgroundColor;

        // Map old child group ID to new child group ID
        idMap.set(childGroupData.id, newChildGroup.id);

        newChildGroups.push({
            newGroup: newChildGroup,
            oldParentId: childGroupData.parentId
        });
    });

    // Create all child nodes
    const newChildNodes = [];
    childNodes.forEach(nodeData => {
        const newNode = new NetworkNode(nodeData.x + 20, nodeData.y + 20);

        // Copy properties
        newNode.label = nodeData.label;
        newNode.color = nodeData.color;
        newNode.memo = nodeData.memo;
        newNode.status = nodeData.status;
        newNode.classification = nodeData.classification;
        newNode.managementId = nodeData.managementId;
        newNode.modelNumber = nodeData.modelNumber;
        newNode.location = nodeData.location;
        newNode.installDate = nodeData.installDate;
        newNode.disposalDate = nodeData.disposalDate;
        newNode.link = nodeData.link;
        newNode.width = nodeData.width;

        // Copy elements with NEW IDs
        newNode.elements = nodeData.elements.map(el => ({
            ...el,
            id: `${newNode.id}-e${state.nextElementId++}`
        }));

        // Helper to regenerate port IDs
        const regeneratePortIds = (ports) => {
            return ports.map(p => ({
                ...p,
                id: `${newNode.id}-${p.name}`
            }));
        };

        // Copy ports with NEW IDs
        newNode.leftPorts = regeneratePortIds(nodeData.leftPorts);
        newNode.rightPorts = regeneratePortIds(nodeData.rightPorts);
        newNode.topPorts = regeneratePortIds(nodeData.topPorts);
        newNode.bottomPorts = regeneratePortIds(nodeData.bottomPorts);

        // Update height based on content
        newNode.updateHeight();

        // Map old node ID to new node ID
        nodeIdMap.set(nodeData.id, newNode.id);

        newChildNodes.push({
            newNode: newNode,
            oldParentId: nodeData.parentId,
            oldNodeId: nodeData.id
        });
    });

    // Set up parent-child relationships for groups
    newChildGroups.forEach(({ newGroup: childGroup, oldParentId }) => {
        const newParentId = idMap.get(oldParentId);
        if (newParentId) {
            childGroup.parentId = newParentId;
            const parentGroup = newParentId === newGroup.id ? newGroup : newChildGroups.find(g => g.newGroup.id === newParentId)?.newGroup;
            if (parentGroup) {
                parentGroup.children.push(childGroup.id);
            }
        }
    });

    // Set up parent-child relationships for nodes
    newChildNodes.forEach(({ newNode: node, oldParentId }) => {
        const newParentId = idMap.get(oldParentId);
        if (newParentId) {
            node.parentId = newParentId;
            const parentGroup = newParentId === newGroup.id ? newGroup : newChildGroups.find(g => g.newGroup.id === newParentId)?.newGroup;
            if (parentGroup) {
                parentGroup.children.push(node.id);
            }
        }
    });

    // Add all to state
    state.groups.push(newGroup);
    newChildGroups.forEach(({ newGroup: childGroup }) => {
        state.groups.push(childGroup);
    });
    newChildNodes.forEach(({ newNode: node }) => {
        state.nodes.push(node);
    });

    // Recreate connections with new node and port IDs
    if (connections && connections.length > 0) {
        connections.forEach(connData => {
            const newFromNodeId = nodeIdMap.get(connData.fromNodeId);
            const newToNodeId = nodeIdMap.get(connData.toNodeId);

            if (newFromNodeId && newToNodeId) {
                // Find the new nodes
                const fromNode = state.nodes.find(n => n.id === newFromNodeId);
                const toNode = state.nodes.find(n => n.id === newToNodeId);

                if (fromNode && toNode) {
                    // Generate new port IDs based on port names
                    const oldFromPort = connData.fromPortId;
                    const oldToPort = connData.toPortId;

                    // Extract port name from old port ID (format: nodeId-portName)
                    const fromPortName = oldFromPort.split('-').slice(1).join('-');
                    const toPortName = oldToPort.split('-').slice(1).join('-');

                    // Generate new port IDs
                    const newFromPortId = `${newFromNodeId}-${fromPortName}`;
                    const newToPortId = `${newToNodeId}-${toPortName}`;

                    // Create new connection
                    const newConnection = new Connection(
                        newFromNodeId,
                        newFromPortId,
                        newToNodeId,
                        newToPortId
                    );

                    // Copy connection properties
                    newConnection.name = connData.name || '';
                    newConnection.color = connData.color || '#58a6ff';
                    newConnection.lineStyle = connData.lineStyle || 'solid';

                    state.connections.push(newConnection);
                }
            }
        });
    }

    if (returnOnly) {
        return newGroup;
    }

    // Select the new group
    state.selectedGroup = newGroup;
    state.selectedNode = null;
    state.selectedConnection = null;
    state.selectedGroups = [newGroup];
    state.selectedNodes = [];

    updatePropertiesPanel();
    render();
}

