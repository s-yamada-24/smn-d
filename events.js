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
        state.selectedConnection = clickedConnection;
        state.selectedNode = null;
        state.selectedGroup = null;
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

    if (clickedNode) {
        state.selectedNode = clickedNode;
        state.selectedConnection = null;
        state.selectedGroup = null;
        state.isDragging = true;
        state.draggedNode = clickedNode;
        state.dragStart = { x: worldPos.x - clickedNode.x, y: worldPos.y - clickedNode.y };
        updatePropertiesPanel();
    } else {
        // Check for group clicks - select the DEEPEST (most nested) group at the click position
        // This ensures child groups are selected over parent groups
        let clickedGroup = null;
        let maxDepth = -1;

        // Helper function to calculate nesting depth
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

        // Find all groups containing the click point
        // Iterate backwards to prioritize groups drawn on top (if depth is equal)
        for (let i = state.groups.length - 1; i >= 0; i--) {
            if (state.groups[i].containsPoint(worldPos.x, worldPos.y)) {
                const depth = getGroupDepth(state.groups[i]);
                // Use > to ensure if we have nested groups, the deepest one wins.
                // If depths are equal, the one later in the array (drawn later/on top) wins (because we iterate backwards and only update if STRICTLY greater).
                // Wait, if we iterate backwards, the first one we find is the top-most.
                // So if we find Top (Depth 0) then Bottom (Depth 0).
                // Top sets maxDepth=0. Bottom has depth=0. 0 > 0 is False. Top stays. Correct.
                // If we find Child (Depth 1) then Parent (Depth 0).
                // Child sets maxDepth=1. Parent has depth=0. 0 > 1 is False. Child stays. Correct.
                // If we find Parent (Depth 0) then Child (Depth 1).
                // Parent sets maxDepth=0. Child has depth=1. 1 > 0 is True. Child wins. Correct.
                if (depth > maxDepth) {
                    maxDepth = depth;
                    clickedGroup = state.groups[i];
                }
            }
        }

        if (clickedGroup) {
            state.selectedGroup = clickedGroup;
            state.selectedNode = null;
            state.selectedConnection = null;
            state.draggedGroup = clickedGroup;
            state.dragStart = { x: worldPos.x - clickedGroup.x, y: worldPos.y - clickedGroup.y };
            updatePropertiesPanel();
        } else {
            state.selectedNode = null;
            state.selectedConnection = null;
            state.selectedGroup = null;
            state.isPanning = true;
            state.panStart = { x: mousePos.x - state.offset.x, y: mousePos.y - state.offset.y };
            updatePropertiesPanel();
        }
    }
    render();
});

canvas.addEventListener('mousemove', (e) => {
    const mousePos = getMousePos(e);
    state.mousePos = mousePos;
    const worldPos = getWorldPos(mousePos.x, mousePos.y);

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
    } else if (state.isDragging && state.draggedNode) {
        state.draggedNode.x = worldPos.x - state.dragStart.x;
        state.draggedNode.y = worldPos.y - state.dragStart.y;
        render();
    } else if (state.draggedGroup) {
        const newX = worldPos.x - state.dragStart.x;
        const newY = worldPos.y - state.dragStart.y;
        const dx = newX - state.draggedGroup.x;
        const dy = newY - state.draggedGroup.y;

        state.draggedGroup.x = newX;
        state.draggedGroup.y = newY;

        // Move all children with the group
        moveGroupChildren(state.draggedGroup, dx, dy);

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
    // Copy: Ctrl+C
    if (e.ctrlKey && e.key === 'c') {
        if (state.selectedNode) {
            // Deep copy the node data (excluding methods)
            state.clipboard = JSON.parse(JSON.stringify(state.selectedNode));
        }
    }

    // Paste: Ctrl+V
    if (e.ctrlKey && e.key === 'v') {
        if (state.clipboard) {
            const data = state.clipboard;
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

            // Select the new node
            state.selectedNode = newNode;
            state.selectedGroup = null;
            state.selectedConnection = null;

            updatePropertiesPanel();
            render();
        }
    }
});
