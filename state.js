// ===== State Management =====
// Helper function to generate random 14-character alphanumeric ID
function generateId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 14; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

const state = {
    nodes: [],
    connections: [],
    groups: [],
    selectedNode: null,
    selectedConnection: null,
    selectedGroup: null,
    isDragging: false,
    draggedNode: null,
    draggedGroup: null,
    dragStart: { x: 0, y: 0 },
    isPanning: false,
    panStart: { x: 0, y: 0 },
    offset: { x: 0, y: 0 },
    scale: 1,
    gridSize: 20,
    isConnecting: false,
    connectionStart: null,
    mousePos: { x: 0, y: 0 },
    diagramTitle: 'ネットワーク構成図',
    isResizingGroup: false,
    isResizingNode: false,
    resizeTarget: null,
    clipboard: null
};

// ===== Canvas Setup =====
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    render();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ===== Helper Functions =====
function snapToGrid(value) {
    return Math.round(value / state.gridSize) * state.gridSize;
}
