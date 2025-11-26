// ===== Properties Panel & Tabs =====
let activeTab = 'basic';

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        activeTab = btn.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`tab-${activeTab}`).classList.add('active');
    });
});

function updatePropertiesPanel() {
    const basicTab = document.getElementById('tab-basic');
    const elementsTab = document.getElementById('tab-elements');
    const portsTab = document.getElementById('tab-ports');

    if (state.selectedConnection) {
        renderConnectionProperties(basicTab, elementsTab, portsTab);
        return;
    }

    if (state.selectedGroup) {
        renderGroupProperties(basicTab, elementsTab, portsTab);
        return;
    }

    if (!state.selectedNode) {
        basicTab.innerHTML = '<p class="empty-state">ノード、接続、またはグループを選択してください</p>';
        elementsTab.innerHTML = '<p class="empty-state">ノードを選択してください</p>';
        portsTab.innerHTML = '<p class="empty-state">ノードを選択してください</p>';
        return;
    }

    const node = state.selectedNode;

    basicTab.innerHTML = `
        <table class="properties-table">
            <tr><th>状態</th><td><select id="nodeStatus">
                <option value="Active" ${node.status === 'Active' ? 'selected' : ''}>Active</option>
                <option value="Inactive" ${node.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
            </select></td></tr>
            <tr><th>名称</th><td><input type="text" id="nodeName" value="${node.label}"></td></tr>
            <tr><th>分類</th><td><input type="text" id="nodeClassification" value="${node.classification || ''}"></td></tr>
            <tr><th>管理番号</th><td><input type="text" id="nodeManagementId" value="${node.managementId || ''}"></td></tr>
            <tr><th>型番</th><td><input type="text" id="nodeModelNumber" value="${node.modelNumber || ''}"></td></tr>
            <tr><th>ロケーション</th><td><input type="text" id="nodeLocation" value="${node.location || ''}"></td></tr>
            <tr><th>導入日</th><td><input type="date" id="nodeInstallDate" value="${node.installDate || ''}"></td></tr>
            <tr><th>廃棄日</th><td><input type="date" id="nodeDisposalDate" value="${node.disposalDate || ''}"></td></tr>
            <tr><th>リンク</th><td><input type="text" id="nodeLink" value="${node.link || ''}"></td></tr>
            <tr><th>メモ</th><td><textarea id="nodeMemo" rows="1" style="overflow:hidden; resize:none;">${node.memo}</textarea></td></tr>
            <tr><th>色</th><td><div class="color-picker-wrapper">
                <input type="color" class="color-picker" id="nodeColor" value="${node.color}">
                <input type="text" class="color-value" id="nodeColorValue" value="${node.color}" readonly>
            </div></td></tr>
            <tr><th>幅 (px)</th><td><input type="number" id="nodeWidth" value="${node.width}" min="50"></td></tr>
        </table>
    `;

    elementsTab.innerHTML = `
        <div class="section-header">
            <span class="section-title">要素一覧</span>
            <button class="btn btn-secondary btn-sm" id="addElement">+ 追加</button>
        </div>
        <div id="elementsList"></div>
    `;

    portsTab.innerHTML = `
        <div class="section-header">
            <span class="section-title">上側ポート</span>
            <button class="btn btn-secondary btn-sm" id="addTopPort">+ 追加</button>
        </div>
        <div id="topPortsList"></div>
        <div class="section-header" style="margin-top: 20px;">
            <span class="section-title">左側ポート</span>
            <button class="btn btn-secondary btn-sm" id="addLeftPort">+ 追加</button>
        </div>
        <div id="leftPortsList"></div>
        <div class="section-header" style="margin-top: 20px;">
            <span class="section-title">右側ポート</span>
            <button class="btn btn-secondary btn-sm" id="addRightPort">+ 追加</button>
        </div>
        <div id="rightPortsList"></div>
        <div class="section-header" style="margin-top: 20px;">
            <span class="section-title">下側ポート</span>
            <button class="btn btn-secondary btn-sm" id="addBottomPort">+ 追加</button>
        </div>
        <div id="bottomPortsList"></div>
    `;

    attachNodeListeners(node);
    updateElementList();
    updatePortList('top');
    updatePortList('left');
    updatePortList('right');
    updatePortList('bottom');

    document.getElementById('addElement').addEventListener('click', () => {
        node.addElement();
        updateElementList();
        render();
    });

    document.getElementById('addTopPort').addEventListener('click', () => { addPort(node, 'top'); });
    document.getElementById('addLeftPort').addEventListener('click', () => { addPort(node, 'left'); });
    document.getElementById('addRightPort').addEventListener('click', () => { addPort(node, 'right'); });
    document.getElementById('addBottomPort').addEventListener('click', () => { addPort(node, 'bottom'); });
}

function renderConnectionProperties(basicTab, elementsTab, portsTab) {
    const conn = state.selectedConnection;
    const fromNode = state.nodes.find(n => n.id === conn.fromNodeId);
    const toNode = state.nodes.find(n => n.id === conn.toNodeId);

    basicTab.innerHTML = `
        <table class="properties-table">
            <tr><th>接続元</th><td>${fromNode ? fromNode.label : '不明'}</td></tr>
            <tr><th>接続先</th><td>${toNode ? toNode.label : '不明'}</td></tr>
            <tr><th>名称</th><td><input type="text" id="connName" value="${conn.name || ''}" placeholder="ライン名"></td></tr>
            <tr><th>色</th><td><div class="color-picker-wrapper">
                <input type="color" class="color-picker" id="connColor" value="${conn.color}">
                <input type="text" class="color-value" id="connColorValue" value="${conn.color}" readonly>
            </div></td></tr>
            <tr><th>線種</th><td><select id="connLineStyle">
                <option value="solid" ${conn.lineStyle === 'solid' ? 'selected' : ''}>実線</option>
                <option value="dashed" ${conn.lineStyle === 'dashed' ? 'selected' : ''}>破線</option>
            </select></td></tr>
        </table>
        <div style="margin-top: 16px;">
            <button class="btn btn-secondary" id="deleteConnectionBtn" style="width: 100%; background: #da3633; border-color: #da3633;">接続を削除</button>
        </div>
    `;
    elementsTab.innerHTML = '<p class="empty-state">接続には要素がありません</p>';
    portsTab.innerHTML = '<p class="empty-state">接続にはポートがありません</p>';

    document.getElementById('connName').addEventListener('input', (e) => {
        conn.name = e.target.value;
        render();
    });

    document.getElementById('connColor').addEventListener('input', (e) => {
        conn.color = e.target.value;
        document.getElementById('connColorValue').value = e.target.value;
        render();
    });

    document.getElementById('connLineStyle').addEventListener('change', (e) => {
        conn.lineStyle = e.target.value;
        render();
    });

    document.getElementById('deleteConnectionBtn').addEventListener('click', () => {
        const index = state.connections.indexOf(state.selectedConnection);
        if (index > -1) {
            state.connections.splice(index, 1);
            state.selectedConnection = null;
            updatePropertiesPanel();
            render();
        }
    });
}

function renderGroupProperties(basicTab, elementsTab, portsTab) {
    const group = state.selectedGroup;
    basicTab.innerHTML = `
        <table class="properties-table">
            <tr><th>グループ名</th><td><input type="text" id="groupName" value="${group.label}"></td></tr>
            <tr><th>幅 (px)</th><td><input type="number" id="groupWidth" value="${group.width}" min="50"></td></tr>
            <tr><th>高さ (px)</th><td><input type="number" id="groupHeight" value="${group.height}" min="50"></td></tr>
            <tr><th>背景色</th><td><div class="color-picker-wrapper">
                <input type="color" class="color-picker" id="groupBgColor" value="${rgbaToHex(group.backgroundColor)}">
                <input type="number" id="groupBgOpacity" value="${getOpacityFromRgba(group.backgroundColor)}" min="0" max="100" step="1" style="width: 60px; margin-left: 8px;">
                <span style="margin-left: 4px;">%</span>
            </div></td></tr>
        </table>
    `;
    if (group.children.length === 0) {
        elementsTab.innerHTML = '<p class="empty-state">子要素がありません</p>';
    } else {
        let html = `
            <div class="section-header"><span class="section-title">子要素一覧</span></div>
            <table class="data-table">
                <thead><tr><th>ID</th><th>種類</th><th>名称</th><th>分類</th><th>管理番号</th><th>型番</th><th>ロケーション</th></tr></thead>
                <tbody>
        `;
        group.children.forEach(childId => {
            const node = state.nodes.find(n => n.id === childId);
            const childGroup = state.groups.find(g => g.id === childId);
            if (node) {
                html += `<tr>
                    <td>${node.id}</td>
                    <td>ノード</td>
                    <td>${node.label}</td>
                    <td>${node.classification || ''}</td>
                    <td>${node.managementId || ''}</td>
                    <td>${node.modelNumber || ''}</td>
                    <td>${node.location || ''}</td>
                </tr>`;
            } else if (childGroup) {
                html += `<tr>
                    <td>${childGroup.id}</td>
                    <td>グループ</td>
                    <td>${childGroup.label}</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                </tr>`;
            }
        });
        html += '</tbody></table>';
        elementsTab.innerHTML = html;
    }

    portsTab.innerHTML = '<p class="empty-state">グループにはポートがありません</p>';

    document.getElementById('groupName').addEventListener('input', (e) => { group.label = e.target.value; render(); });
    document.getElementById('groupWidth').addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        if (!isNaN(val) && val > 0) { group.width = val; render(); }
    });
    document.getElementById('groupHeight').addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        if (!isNaN(val) && val > 0) { group.height = val; render(); }
    });
    document.getElementById('groupBgColor').addEventListener('input', (e) => {
        const hex = e.target.value;
        const opacity = parseInt(document.getElementById('groupBgOpacity').value) / 100;
        group.backgroundColor = hexToRgba(hex, opacity);
        render();
    });
    document.getElementById('groupBgOpacity').addEventListener('input', (e) => {
        const opacity = parseInt(e.target.value) / 100;
        const hex = document.getElementById('groupBgColor').value;
        group.backgroundColor = hexToRgba(hex, opacity);
        render();
    });
}

function rgbaToHex(rgba) {
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return '#161b22';
    const r = parseInt(match[1]).toString(16).padStart(2, '0');
    const g = parseInt(match[2]).toString(16).padStart(2, '0');
    const b = parseInt(match[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
}

function getOpacityFromRgba(rgba) {
    const match = rgba.match(/rgba?\([^,]+,[^,]+,[^,]+,?\s*([\d.]+)?\)/);
    if (!match || !match[1]) return 50;
    return Math.round(parseFloat(match[1]) * 100);
}

function hexToRgba(hex, opacity) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function attachNodeListeners(node) {
    const mapping = {
        'nodeStatus': 'status', 'nodeName': 'label', 'nodeClassification': 'classification',
        'nodeManagementId': 'managementId', 'nodeModelNumber': 'modelNumber',
        'nodeLocation': 'location', 'nodeInstallDate': 'installDate',
        'nodeDisposalDate': 'disposalDate', 'nodeLink': 'link', 'nodeMemo': 'memo'
    };

    for (const [id, prop] of Object.entries(mapping)) {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', (e) => {
                node[prop] = e.target.value;
                if (prop === 'label') render();
            });
        }
    }

    const memoEl = document.getElementById('nodeMemo');
    if (memoEl) {
        memoEl.addEventListener('input', () => window.autoResize(memoEl));
        // Initial resize
        requestAnimationFrame(() => window.autoResize(memoEl));
    }

    document.getElementById('nodeWidth').addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        if (!isNaN(val) && val > 0) {
            node.width = val;
            render();
        }
    });

    document.getElementById('nodeColor').addEventListener('input', (e) => {
        node.color = e.target.value;
        document.getElementById('nodeColorValue').value = e.target.value;
        render();
    });
}

window.autoResize = function (el) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
};

function updateElementList() {
    const node = state.selectedNode;
    if (!node) return;

    const list = document.getElementById('elementsList');
    if (!list) return;

    if (node.elements.length === 0) {
        list.innerHTML = '<p class="empty-state" style="padding: 10px;">要素がありません</p>';
        return;
    }

    let html = `
        <table class="data-table">
            <thead><tr>
                <th style="width: 50px;">有効</th><th>名称</th><th>メモ1</th><th>メモ2</th><th>リンク</th>
                <th style="width: 60px;">色</th><th class="action-cell">順序</th><th class="action-cell"></th>
            </tr></thead>
            <tbody>
    `;

    node.elements.forEach((el, index) => {
        html += `
            <tr>
                <td style="text-align: center;"><input type="checkbox" ${el.status === 'Active' ? 'checked' : ''} onchange="updateElementField(${index}, 'status', this.checked ? 'Active' : 'Inactive')"></td>
                <td><input type="text" value="${el.name}" onchange="updateElementField(${index}, 'name', this.value)"></td>
                <td><textarea rows="1" style="overflow:hidden; resize:none;" oninput="window.autoResize(this); updateElementField(${index}, 'memo1', this.value)" onfocus="window.autoResize(this)">${el.memo1 || ''}</textarea></td>
                <td><textarea rows="1" style="overflow:hidden; resize:none;" oninput="window.autoResize(this); updateElementField(${index}, 'memo2', this.value)" onfocus="window.autoResize(this)">${el.memo2 || ''}</textarea></td>
                <td><input type="text" value="${el.url || ''}" onchange="updateElementField(${index}, 'url', this.value)"></td>
                <td><input type="color" value="${el.color || '#c9d1d9'}" onchange="updateElementField(${index}, 'color', this.value)" style="height: 30px; width: 30px;"></td>
                <td class="action-cell">
                    <button class="btn-icon" onclick="moveElement(${index}, -1)" ${index === 0 ? 'disabled' : ''}>▲</button>
                    <button class="btn-icon" onclick="moveElement(${index}, 1)" ${index === node.elements.length - 1 ? 'disabled' : ''}>▼</button>
                </td>
                <td class="action-cell"><button class="btn-icon" onclick="deleteElement(${index})">🗑️</button></td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    list.innerHTML = html;

    // Initialize auto-resize for all textareas
    list.querySelectorAll('textarea').forEach(textarea => {
        window.autoResize(textarea);
    });
}

function updatePortList(side) {
    const node = state.selectedNode;
    if (!node) return;

    let ports, listId;
    if (side === 'left') { ports = node.leftPorts; listId = 'leftPortsList'; }
    else if (side === 'right') { ports = node.rightPorts; listId = 'rightPortsList'; }
    else if (side === 'top') { ports = node.topPorts; listId = 'topPortsList'; }
    else if (side === 'bottom') { ports = node.bottomPorts; listId = 'bottomPortsList'; }

    const list = document.getElementById(listId);
    if (!list) return;

    if (ports.length === 0) {
        list.innerHTML = '<p class="empty-state" style="padding: 10px;">ポートがありません</p>';
        return;
    }

    let html = `
        <table class="data-table">
            <thead><tr>
                <th style="width: 50px;">有効</th><th>名称</th><th>分類</th><th>型番</th><th>メモ</th>
                <th class="action-cell">順序</th><th class="action-cell"></th>
            </tr></thead>
            <tbody>
    `;

    ports.forEach((port, index) => {
        html += `
            <tr>
                <td style="text-align: center;"><input type="checkbox" ${port.status === 'Active' ? 'checked' : ''} onchange="updatePortField('${side}', ${index}, 'status', this.checked ? 'Active' : 'Inactive')"></td>
                <td><input type="text" value="${port.name}" onchange="updatePortField('${side}', ${index}, 'name', this.value)"></td>
                <td><select onchange="updatePortField('${side}', ${index}, 'classification', this.value)">
                    <option value="LAN" ${port.classification === 'LAN' ? 'selected' : ''}>LAN</option>
                    <option value="USB" ${port.classification === 'USB' ? 'selected' : ''}>USB</option>
                    <option value="COM" ${port.classification === 'COM' ? 'selected' : ''}>COM</option>
                    <option value="HDMI" ${port.classification === 'HDMI' ? 'selected' : ''}>HDMI</option>
                    <option value="DisplayPort" ${port.classification === 'DisplayPort' ? 'selected' : ''}>DisplayPort</option>
                </select></td>
                <td><input type="text" value="${port.modelNumber || ''}" onchange="updatePortField('${side}', ${index}, 'modelNumber', this.value)"></td>
                <td><textarea rows="1" style="overflow:hidden; resize:none;" oninput="window.autoResize(this); updatePortField('${side}', ${index}, 'memo', this.value)" onfocus="window.autoResize(this)">${port.memo || ''}</textarea></td>
                <td class="action-cell">
                    <button class="btn-icon" onclick="movePort('${side}', ${index}, -1)" ${index === 0 ? 'disabled' : ''}>▲</button>
                    <button class="btn-icon" onclick="movePort('${side}', ${index}, 1)" ${index === ports.length - 1 ? 'disabled' : ''}>▼</button>
                </td>
                <td class="action-cell"><button class="btn-icon" onclick="deletePort('${side}', ${index})">🗑️</button></td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    list.innerHTML = html;

    // Initialize auto-resize for all textareas
    list.querySelectorAll('textarea').forEach(textarea => {
        window.autoResize(textarea);
    });
}

window.updateElementField = function (index, field, value) {
    const node = state.selectedNode;
    if (!node) return;
    node.elements[index][field] = value;
    if (field === 'name' || field === 'color') render();
};

window.deleteElement = function (index) {
    const node = state.selectedNode;
    if (!node) return;
    node.removeElement(index);
    updateElementList();
    render();
};

window.moveElement = function (index, direction) {
    const node = state.selectedNode;
    if (!node) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= node.elements.length) return;
    [node.elements[index], node.elements[newIndex]] = [node.elements[newIndex], node.elements[index]];
    updateElementList();
    render();
};

window.updatePortField = function (side, index, field, value) {
    const node = state.selectedNode;
    if (!node) return;
    const ports = side === 'left' ? node.leftPorts : side === 'right' ? node.rightPorts : side === 'top' ? node.topPorts : node.bottomPorts;
    ports[index][field] = value;
    render();
};

window.deletePort = function (side, index) {
    const node = state.selectedNode;
    if (!node) return;
    const ports = side === 'left' ? node.leftPorts : side === 'right' ? node.rightPorts : side === 'top' ? node.topPorts : node.bottomPorts;
    ports.splice(index, 1);
    updatePortList(side);
    render();
};

window.movePort = function (side, index, direction) {
    const node = state.selectedNode;
    if (!node) return;
    const ports = side === 'left' ? node.leftPorts : side === 'right' ? node.rightPorts : side === 'top' ? node.topPorts : node.bottomPorts;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= ports.length) return;
    [ports[index], ports[newIndex]] = [ports[newIndex], ports[index]];
    updatePortList(side);
    render();
};

function addPort(node, side) {
    const ports = side === 'left' ? node.leftPorts : side === 'right' ? node.rightPorts : side === 'top' ? node.topPorts : node.bottomPorts;
    const prefix = side === 'left' ? 'L' : side === 'right' ? 'R' : side === 'top' ? 'T' : 'B';
    const portNum = ports.length + 1;
    ports.push({
        name: `${prefix}${portNum}`,
        id: `${node.id}-${prefix}${portNum}`,
        description: '',
        status: 'Active',
        classification: 'LAN',
        modelNumber: '',
        memo: ''
    });
    updatePortList(side);
    render();
}

// Initialize title
document.getElementById('appTitle').addEventListener('blur', (e) => {
    state.diagramTitle = e.target.textContent;
});
