/**
 * 鏈結串列視覺化模組
 * 展示單向、雙向鏈結串列的結構與操作
 */

// 確保 ModuleClass 只在全局範圍中定義一次
window.ModuleClass = class LinkedListModule extends ModuleBase {
    constructor(container) {
        super(container);
        
        // 模組配置
        this.config = {
            listType: "singly", // singly, doubly
            initialLength: 5,
            animationDuration: 0.5,
            nodeSize: 1.0,
            nodeSeparation: 3,
            nodeColor: 0x4CAF50,
            headColor: 0x2196F3,
            tailColor: 0xFF5722,
            arrowColor: 0xFFD700,
            selectedColor: 0xFF5722,
            cubeOpacity: 0.7,
            speed: "medium"
        };
        this.speedMap = { slow: 1.0, medium: 0.5, fast: 0.2 };
        
        // 元素追蹤
        this.nodes = [];
        this.arrows = [];
        this.labels = [];
        this.numberLabels = [];
        
        // 串列屬性
        this.head = null;
        this.tail = null;
        this.currentSize = 0;
        
        // 動畫佇列
        this.animationQueue = [];
        this.isAnimating = false;
        
        // 控制面板
        this.controlsPanel = null;
        this.controlButton = null;
        this.panelPosition = { x: 0, y: 0 };
        this.isControlsVisible = true;
        
        // 狀態追蹤
        this.stepping = false;
        this.isProcessingStep = false;
        this.selectedNode = null;
        
        // 操作過程訊息
        this.operationMessages = [];
    }
    
    /**
     * 初始化模組
     */
    init() {
        super.init();
        
        // 創建控制面板
        this.createControlPanel();
        
        // 調整相機位置
        this.camera.position.set(0, 8, 15);
        this.camera.lookAt(0, 0, 0);
        
        if (this.controls) {
            this.controls.target.set(0, 0, 0);
            this.controls.update();
        }
        
        // 創建初始串列
        this.createInitialLinkedList();
        
        // 更新當前操作
        this.updateCurrentOperation("鏈結串列視覺化 - 使用控制面板進行操作");
    }
    
    /**
     * 創建控制面板
     */
    createControlPanel() {
        // 創建控制面板容器
        const panel = document.createElement('div');
        panel.className = 'linkedlist-controls';
        panel.style.position = 'absolute';
        panel.style.bottom = '80px';
        panel.style.left = '50%';
        panel.style.transform = 'translateX(-50%)';
        panel.style.backgroundColor = 'rgba(0,0,0,0.8)';
        panel.style.padding = '15px';
        panel.style.borderRadius = '8px';
        panel.style.display = 'flex';
        panel.style.flexWrap = 'wrap';
        panel.style.maxWidth = '900px';
        panel.style.gap = '10px';
        panel.style.justifyContent = 'center';
        panel.style.zIndex = '100';
        panel.style.border = '1px solid #4CAF50';
        panel.style.cursor = 'move';
        
        // 添加控制選項
        panel.innerHTML = `
            <div class="panel-header" style="width:100%;text-align:center;margin-bottom:10px;cursor:move;padding:5px 0;background-color:#4CAF50;border-radius:4px;">
                <span style="font-weight:bold;">鏈結串列控制面板</span>
            </div>
            <div class="form-group">
                <label for="listType">串列類型</label>
                <select id="listType">
                    <option value="singly">單向鏈結串列</option>
                    <option value="doubly">雙向鏈結串列</option>
                </select>
            </div>
            <div class="form-group">
                <label for="initialLength">初始長度</label>
                <input type="number" id="initialLength" value="${this.config.initialLength}" min="0" max="10">
            </div>
            <div class="form-group">
                <label for="linkedListSpeed">動畫速度</label>
                <select id="linkedListSpeed">
                    <option value="slow">慢速</option>
                    <option value="medium" selected>中速</option>
                    <option value="fast">快速</option>
                </select>
            </div>
            <div class="form-group">
                <label for="nodeOpacitySlider">節點不透明度</label>
                <input type="range" min="20" max="100" value="${this.config.cubeOpacity * 100}" id="nodeOpacitySlider">
                <div id="nodeOpacityValue" style="text-align:center">${Math.round(this.config.cubeOpacity * 100)}%</div>
            </div>
            <div class="form-group" style="width:100%;display:flex;flex-direction:row;justify-content:center;align-items:center;gap:10px;">
                <div>
                    <label for="nodeValueInput">節點值</label>
                    <input type="number" id="nodeValueInput" value="0" min="0" max="99" style="width:60px;">
                </div>
                <div>
                    <label for="nodePositionInput">插入位置</label>
                    <input type="number" id="nodePositionInput" value="0" min="0" max="10" style="width:60px;">
                </div>
            </div>
            <div class="button-group" style="width:100%;display:flex;justify-content:center;flex-wrap:wrap;margin-top:10px;">
                <button id="insertHeadBtn">插入頭部</button>
                <button id="insertTailBtn">插入尾部</button>
                <button id="insertPositionBtn">指定位置插入</button>
                <button id="randomInsertBtn">隨機值插入</button>
            </div>
            <div class="button-group" style="width:100%;display:flex;justify-content:center;flex-wrap:wrap;margin-top:10px;">
                <button id="deleteHeadBtn">刪除頭部</button>
                <button id="deleteTailBtn">刪除尾部</button>
                <button id="deletePositionBtn">指定位置刪除</button>
                <button id="searchValueBtn">搜尋節點值</button>
            </div>
            <div class="button-group" style="width:100%;display:flex;justify-content:center;margin-top:10px;">
                <button id="resetListBtn">重置</button>
            </div>
            <div style="width:100%;text-align:center;margin-top:10px;">
                <button id="toggleLinkedListControls">隱藏控制面板</button>
            </div>
        `;
        
        this.container.appendChild(panel);
        this.controlsPanel = panel;
        
        // 創建控制按鈕（初始隱藏）
        const controlButton = document.createElement('button');
        controlButton.textContent = '顯示控制面板';
        controlButton.style.position = 'absolute';
        controlButton.style.bottom = '20px';
        controlButton.style.left = '50%';
        controlButton.style.transform = 'translateX(-50%)';
        controlButton.style.backgroundColor = '#4CAF50';
        controlButton.style.color = 'white';
        controlButton.style.border = 'none';
        controlButton.style.borderRadius = '4px';
        controlButton.style.padding = '10px 15px';
        controlButton.style.cursor = 'pointer';
        controlButton.style.zIndex = '101';
        controlButton.style.display = 'none';
        controlButton.id = 'linkedListControlButton';
        
        this.container.appendChild(controlButton);
        this.controlButton = controlButton;
        
        // 綁定事件
        this.bindEvents();
        
        // 設置面板可拖動
        this.makePanelDraggable();
    }
    
    /**
     * 綁定控制面板事件
     */
    bindEvents() {
        // 串列類型選擇
        const listTypeSelect = document.getElementById('listType');
        listTypeSelect.addEventListener('change', () => {
            const newType = listTypeSelect.value;
            if (newType !== this.config.listType) {
                this.config.listType = newType;
                this.reset();
            }
        });
        
        // 初始長度變更
        const initialLengthInput = document.getElementById('initialLength');
        initialLengthInput.addEventListener('change', () => {
            const newLength = parseInt(initialLengthInput.value);
            if (newLength !== this.config.initialLength) {
                this.config.initialLength = newLength;
                this.reset();
            }
        });
        
        // 速度變更
        const speedSelect = document.getElementById('linkedListSpeed');
        speedSelect.addEventListener('change', () => {
            this.config.speed = speedSelect.value;
            this.config.animationDuration = this.speedMap[this.config.speed];
        });
        
        // 不透明度滑桿
        const opacitySlider = document.getElementById('nodeOpacitySlider');
        opacitySlider.addEventListener('input', () => {
            const opacity = parseInt(opacitySlider.value) / 100;
            this.updateNodesOpacity(opacity);
        });
        
        // 插入頭部按鈕
        const insertHeadBtn = document.getElementById('insertHeadBtn');
        insertHeadBtn.addEventListener('click', () => {
            const value = parseInt(document.getElementById('nodeValueInput').value);
            this.insertAtHead(value);
        });
        
        // 插入尾部按鈕
        const insertTailBtn = document.getElementById('insertTailBtn');
        insertTailBtn.addEventListener('click', () => {
            const value = parseInt(document.getElementById('nodeValueInput').value);
            this.insertAtTail(value);
        });
        
        // 指定位置插入按鈕
        const insertPositionBtn = document.getElementById('insertPositionBtn');
        insertPositionBtn.addEventListener('click', () => {
            const value = parseInt(document.getElementById('nodeValueInput').value);
            const position = parseInt(document.getElementById('nodePositionInput').value);
            this.insertAtPosition(value, position);
        });
        
        // 隨機值插入按鈕
        const randomInsertBtn = document.getElementById('randomInsertBtn');
        randomInsertBtn.addEventListener('click', () => {
            const randomValue = Math.floor(Math.random() * 100);
            document.getElementById('nodeValueInput').value = randomValue;
            
            // 隨機選擇插入位置：頭部、尾部或隨機位置
            const insertType = Math.floor(Math.random() * 3);
            if (insertType === 0) {
                this.insertAtHead(randomValue);
            } else if (insertType === 1) {
                this.insertAtTail(randomValue);
            } else {
                const randomPosition = Math.floor(Math.random() * (this.currentSize + 1));
                document.getElementById('nodePositionInput').value = randomPosition;
                this.insertAtPosition(randomValue, randomPosition);
            }
        });
        
        // 刪除頭部按鈕
        const deleteHeadBtn = document.getElementById('deleteHeadBtn');
        deleteHeadBtn.addEventListener('click', () => {
            this.deleteFromHead();
        });
        
        // 刪除尾部按鈕
        const deleteTailBtn = document.getElementById('deleteTailBtn');
        deleteTailBtn.addEventListener('click', () => {
            this.deleteFromTail();
        });
        
        // 指定位置刪除按鈕
        const deletePositionBtn = document.getElementById('deletePositionBtn');
        deletePositionBtn.addEventListener('click', () => {
            const position = parseInt(document.getElementById('nodePositionInput').value);
            this.deleteFromPosition(position);
        });
        
        // 搜尋節點值按鈕
        const searchValueBtn = document.getElementById('searchValueBtn');
        searchValueBtn.addEventListener('click', () => {
            const value = parseInt(document.getElementById('nodeValueInput').value);
            this.searchByValue(value);
        });
        
        // 重置按鈕
        const resetListBtn = document.getElementById('resetListBtn');
        resetListBtn.addEventListener('click', () => {
            this.reset();
        });
        
        // 切換控制面板按鈕
        const toggleControlsBtn = document.getElementById('toggleLinkedListControls');
        toggleControlsBtn.addEventListener('click', () => {
            this.toggleControlPanel();
        });
        
        this.controlButton.addEventListener('click', () => {
            this.toggleControlPanel();
        });
    }
    
    /**
     * 切換控制面板顯示/隱藏
     */
    toggleControlPanel() {
        if (this.isControlsVisible) {
            // 保存當前位置
            const rect = this.controlsPanel.getBoundingClientRect();
            this.panelPosition = {
                x: rect.left,
                y: rect.top
            };
            
            // 隱藏面板
            this.controlsPanel.style.display = 'none';
            
            // 顯示控制按鈕
            this.controlButton.style.display = 'block';
            
            this.isControlsVisible = false;
        } else {
            // 根據保存的位置顯示面板
            this.controlsPanel.style.position = 'absolute';
            this.controlsPanel.style.left = `${this.panelPosition.x}px`;
            this.controlsPanel.style.top = `${this.panelPosition.y}px`;
            this.controlsPanel.style.bottom = 'auto';
            this.controlsPanel.style.transform = 'none';
            this.controlsPanel.style.display = 'flex';
            
            // 隱藏控制按鈕
            this.controlButton.style.display = 'none';
            
            this.isControlsVisible = true;
        }
    }
    
    /**
     * 使控制面板可拖動
     */
    makePanelDraggable() {
        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;
        
        // 使用面板標題作為拖動控制柄
        const handle = this.controlsPanel.querySelector('.panel-header');
        
        handle.addEventListener('mousedown', (e) => {
            isDragging = true;
            
            // 計算滑鼠相對於面板的偏移
            const rect = this.controlsPanel.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            
            // 防止文本選擇
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            // 更新面板位置
            this.controlsPanel.style.left = `${e.clientX - offsetX}px`;
            this.controlsPanel.style.top = `${e.clientY - offsetY}px`;
            this.controlsPanel.style.bottom = 'auto';
            this.controlsPanel.style.transform = 'none';
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
            
            // 更新保存的位置
            if (this.isControlsVisible) {
                const rect = this.controlsPanel.getBoundingClientRect();
                this.panelPosition = {
                    x: rect.left,
                    y: rect.top
                };
            }
        });
    }
    
    /**
     * 更新節點不透明度
     */
    updateNodesOpacity(opacity) {
        this.config.cubeOpacity = opacity;
        document.getElementById('nodeOpacityValue').textContent = Math.round(opacity * 100) + '%';
        
        // 更新所有節點的不透明度
        this.nodes.forEach(node => {
            if (node.nodeMesh && node.nodeMesh.material) {
                node.nodeMesh.material.opacity = opacity;
            }
            if (node.dataBox && node.dataBox.material) {
                node.dataBox.material.opacity = Math.min(opacity + 0.1, 1.0);
            }
        });
    }
    
    /**
     * 創建初始鏈結串列
     */
    createInitialLinkedList() {
        this.clearScene();
        
        // 重置串列屬性
        this.head = null;
        this.tail = null;
        this.currentSize = 0;
        this.nodes = [];
        this.arrows = [];
        this.labels = [];
        this.numberLabels = [];
        
        // 建立初始長度的串列
        for (let i = 0; i < this.config.initialLength; i++) {
            const value = Math.floor(Math.random() * 100);
            this.appendNode(value, false);
        }
        
        // 重新排列節點位置
        this.repositionNodes();
        
        // 更新記憶體視窗
        this.updateMemoryDisplay();
    }
    
    createNodeVisual(value, index) {
        const nodeSize = this.config.nodeSize;
        // 決定區隔數量：雙向為 3 個 (PREV, DATA, NEXT)，單向為 2 個 (DATA, NEXT)
        const totalCompartments = (this.config.listType === "doubly") ? 3 : 2;
        const margin = 0.2 * nodeSize;  // 區隔間的間隙
        // 計算容器寬度：每個區隔寬度為 nodeSize，加上 (總區隔數-1) 的間隙
        const containerWidth = totalCompartments * nodeSize + (totalCompartments - 1) * margin;
        const containerHeight = nodeSize;
        const containerDepth = nodeSize * 1.5;  // 可依需求調整深度
    
        const nodeGroup = new THREE.Group();
    
        // 建立大方塊(改為長方體) – 變數名稱仍為 nodeMesh
        const nodeGeometry = new THREE.BoxGeometry(containerWidth, containerHeight, containerDepth);
        const nodeMaterial = new THREE.MeshPhongMaterial({
            color: this.config.nodeColor,
            transparent: true,
            opacity: this.config.cubeOpacity
        });
        const nodeMesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
        nodeGroup.add(nodeMesh);
    
        // 以容器左端為起點計算各區隔中心位置（局部 x 軸座標）
        const startX = -containerWidth / 2 + nodeSize / 2;
        const compartments = [];
        for (let i = 0; i < totalCompartments; i++) {
            compartments.push(startX + i * (nodeSize + margin));
        }
    
        // ── 建立各區隔的小方塊 ──
        // (1) 若是雙向串列，建立第一個區隔的 prevBox
        let prevBox = null;
        if (this.config.listType === "doubly") {
            const prevBoxGeometry = new THREE.BoxGeometry(nodeSize * 0.8, nodeSize * 0.8, nodeSize * 0.8);
            const prevBoxMaterial = new THREE.MeshPhongMaterial({
                color: 0x9C27B0,
                transparent: true,
                opacity: Math.min(this.config.cubeOpacity + 0.1, 1.0)
            });
            prevBox = new THREE.Mesh(prevBoxGeometry, prevBoxMaterial);
            // 放置於第一個區隔中心
            prevBox.position.set(compartments[0], 0, 0);
            nodeGroup.add(prevBox);
        }
    
        // (2) 建立資料區：DATA（單向時位於第一區，雙向則在中間）
        const dataBoxGeometry = new THREE.BoxGeometry(nodeSize * 0.8, nodeSize * 0.8, nodeSize * 0.8);
        const dataBoxMaterial = new THREE.MeshPhongMaterial({
            color: 0x2196F3,
            transparent: true,
            opacity: Math.min(this.config.cubeOpacity + 0.1, 1.0)
        });
        const dataBox = new THREE.Mesh(dataBoxGeometry, dataBoxMaterial);
        const dataIndex = (this.config.listType === "doubly") ? 1 : 0;
        dataBox.position.set(compartments[dataIndex], 0, 0);
        nodeGroup.add(dataBox);
    
        // (3) 建立指針區：NEXT（單向時位於第二區，雙向則在第三區）
        const pointerBoxGeometry = new THREE.BoxGeometry(nodeSize * 0.8, nodeSize * 0.8, nodeSize * 0.8);
        const pointerBoxMaterial = new THREE.MeshPhongMaterial({
            color: 0xFF5722,
            transparent: true,
            opacity: Math.min(this.config.cubeOpacity + 0.1, 1.0)
        });
        const pointerBox = new THREE.Mesh(pointerBoxGeometry, pointerBoxMaterial);
        const pointerIndex = (this.config.listType === "doubly") ? 2 : 1;
        pointerBox.position.set(compartments[pointerIndex], 0, 0);
        nodeGroup.add(pointerBox);
    
        // ── 加入文字標籤 ──
        // DATA 標籤（放在資料區下方）
        const dataLabel = this.createTextSprite("DATA", 40, "#AADDFF");
        dataLabel.position.set(compartments[dataIndex], -nodeSize * 0.7, 0);
        nodeGroup.add(dataLabel);
    
        // NEXT 標籤
        const nextLabel = this.createTextSprite("NEXT", 40, "#FFAA88");
        nextLabel.position.set(compartments[pointerIndex], -nodeSize * 0.7, 0);
        nodeGroup.add(nextLabel);
    
        // 若為雙向，則加入 PREV 標籤
        if (this.config.listType === "doubly") {
            const prevLabel = this.createTextSprite("PREV", 40, "#DDAAFF");
            prevLabel.position.set(compartments[0], -nodeSize * 0.7, 0);
            nodeGroup.add(prevLabel);
        }
    
        // 節點數值文字 – 放在資料區正上方 (置於大方塊前表面)
        const valueText = this.createTextSprite(value.toString(), 120, "#FFFFFF");
        valueText.position.set(compartments[dataIndex], 0, containerDepth / 2 + 0.1);
        nodeGroup.add(valueText);
    
        // 初始指針參考文字，後續由 updatePointerLabels() 更新顯示為記憶體位址
        const nextRefLabel = this.createTextSprite("NULL→", 40, "#FFAA88");
        nextRefLabel.position.set(compartments[pointerIndex], 0, containerDepth / 2 + 0.1);
        nextRefLabel.userData = { isNextRef: true };
        nodeGroup.add(nextRefLabel);
    
        if (this.config.listType === "doubly") {
            const prevRefLabel = this.createTextSprite("NULL←", 40, "#DDAAFF");
            prevRefLabel.position.set(compartments[0], 0, containerDepth / 2 + 0.1);
            prevRefLabel.userData = { isPrevRef: true };
            nodeGroup.add(prevRefLabel);
        }
    
        // 建立索引標籤 (稍後由 updateAllNodeIndices() 更新)
        const indexLabel = this.createTextSprite(index.toString(), 50, "#FFFFFF");
        indexLabel.position.set(0, -nodeSize * 1.5, 0);
        nodeGroup.add(indexLabel);
    
        // 加入場景
        this.scene.add(nodeGroup);
    
        const node = {
            value: value,
            group: nodeGroup,
            nodeMesh: nodeMesh,
            dataBox: dataBox,
            pointerBox: pointerBox,
            prevBox: (this.config.listType === "doubly") ? prevBox : null,
            valueText: valueText,
            indexLabel: indexLabel,
            next: null,
            prev: null,
            position: index,
            visual: {
                arrow: null,
                prevArrow: null
            }
        };
    
        return node;
    }
    
    
    
    /**
     * 創建箭頭物件
     * @param {THREE.Vector3} start - 起點位置
     * @param {THREE.Vector3} end - 終點位置
     * @param {number} color - 箭頭顏色
     * @param {boolean} isPrev - 是否為前向指針
     * @returns {THREE.Group} 箭頭組
     */
    createArrow(start, end, color = this.config.arrowColor, isPrev = false) {
        const arrowGroup = new THREE.Group();
        
        // 計算方向和長度
        const direction = new THREE.Vector3().subVectors(end, start);
        const length = direction.length() - this.config.nodeSize * 0.6;
        direction.normalize();
        
        // 調整起點和終點，避免箭頭穿透節點
        const adjustedStart = new THREE.Vector3().copy(start).addScaledVector(direction, this.config.nodeSize * 0.4);
        const adjustedEnd = new THREE.Vector3().copy(end).addScaledVector(direction, -this.config.nodeSize * 0.4);
        
        // 創建箭桿
        const shaftGeometry = new THREE.CylinderGeometry(0.05, 0.05, length, 8);
        const shaftMaterial = new THREE.MeshPhongMaterial({ color: color });
        const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
        
        // 將箭桿調整到起點和終點之間
        shaft.position.copy(adjustedStart).add(adjustedEnd).multiplyScalar(0.5);
        
        // 旋轉箭桿使其指向終點
        const arrow = new THREE.Vector3().subVectors(adjustedEnd, adjustedStart);
        const axis = new THREE.Vector3(0, 1, 0);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, arrow.normalize());
        shaft.setRotationFromQuaternion(quaternion);
        
        // 箭頭
        const headGeometry = new THREE.ConeGeometry(0.15, 0.3, 8);
        const headMaterial = new THREE.MeshPhongMaterial({ color: color });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        
        // 設置箭頭位置和方向
        head.position.copy(adjustedEnd);
        head.setRotationFromQuaternion(quaternion);
        
        // 將箭桿和箭頭添加到組中
        arrowGroup.add(shaft);
        arrowGroup.add(head);
        
        // 如果是雙向鏈結串列的前向指針，使箭頭稍微彎曲
        if (isPrev) {
            // 將整個箭頭群組向下移動以區分方向
            arrowGroup.position.y -= 0.3;
        }
        
        this.scene.add(arrowGroup);
        this.arrows.push(arrowGroup);
        
        return arrowGroup;
    }
    
    /**
     * 更新箭頭位置
     * @param {Object} node - 起始節點
     * @param {Object} nextNode - 目標節點
     * @param {boolean} isPrev - 是否為前向指針
     */
    updateArrow(node, nextNode, isPrev = false) {
        if (!node || !nextNode) return;
        
        // 獲取節點位置
        const startPos = new THREE.Vector3();
        const endPos = new THREE.Vector3();
        
        // 根據是前向還是後向指針確定箭頭起點和終點
        if (isPrev) {
            node.group.getWorldPosition(startPos);
            nextNode.group.getWorldPosition(endPos);
            startPos.z -= this.config.nodeSize * 0.5; // 調整前向指針位置
            endPos.z += this.config.nodeSize * 0.5;
        } else {
            node.group.getWorldPosition(startPos);
            nextNode.group.getWorldPosition(endPos);
            startPos.x += this.config.nodeSize * 0.5; // 調整位置從指針盒子出發
            endPos.x -= this.config.nodeSize * 0.5; // 調整位置到數據盒子
        }
        
        // 刪除舊箭頭
        if (isPrev) {
            if (node.visual.prevArrow) {
                this.scene.remove(node.visual.prevArrow);
                this.arrows = this.arrows.filter(a => a !== node.visual.prevArrow);
                node.visual.prevArrow = null;
            }
        } else {
            if (node.visual.arrow) {
                this.scene.remove(node.visual.arrow);
                this.arrows = this.arrows.filter(a => a !== node.visual.arrow);
                node.visual.arrow = null;
            }
        }
        
        // 創建新箭頭
        const arrowColor = isPrev ? 0x9C27B0 : this.config.arrowColor;
        const arrow = this.createArrow(startPos, endPos, arrowColor, isPrev);
        
        // 保存箭頭引用
        if (isPrev) {
            node.visual.prevArrow = arrow;
        } else {
            node.visual.arrow = arrow;
        }
    }
    
    /**
     * 添加節點到串列末尾
     * @param {number} value - 節點值
     * @param {boolean} animate - 是否顯示動畫
     */
    appendNode(value, animate = true) {
        const newNode = this.createNodeVisual(value, this.currentSize);
        
        if (this.head === null) {
            // 如果是空串列，設置頭尾指針
            this.head = newNode;
            this.tail = newNode;
        } else {
            // 連接新節點
            this.tail.next = newNode;
            
            // 如果是雙向鏈結串列，設置前向指針
            if (this.config.listType === "doubly") {
                newNode.prev = this.tail;
            }
            
            // 更新尾指針
            this.tail = newNode;
        }
        
        // 添加到節點陣列
        this.nodes.push(newNode);
        this.currentSize++;
        
        // 定位新節點
        this.repositionNodes();
        
        // 更新記憶體顯示
        this.updateMemoryDisplay();
        
        // 更新操作訊息
        if (animate) {
            this.updateCurrentOperation(`已新增節點 ${value} 到鏈結串列末尾，當前大小: ${this.currentSize}`);
            this.showStepLabel(`+${value}`, newNode.group.position.clone().add(new THREE.Vector3(0, 1.5, 0)));
        }
    }
    
    /**
     * 重新排列所有節點位置
     */
    repositionNodes() {
        if (!this.nodes.length) return;
        
    // 單向節點以預設間距排列，雙向節點拉寬間隔以避免重疊
    let separation = this.config.nodeSeparation;
    if (this.config.listType === "doubly") {
        separation *= 1.5;  // 根據需求可調整，例如 2.0 ~ 2.5
    }
        const totalWidth = (this.nodes.length - 1) * separation;
        const startX = -totalWidth / 2;
        
        // 從頭節點開始遍歷並移動
        let currentNode = this.head;
        let index = 0;
        
        while (currentNode) {
            const x = startX + index * separation;
            
            // 設置節點位置
            gsap.to(currentNode.group.position, {
                x: x,
                y: 0,
                z: 0,
                duration: this.config.animationDuration,
                ease: "power1.inOut"
            });
            
            // 高亮頭尾節點（維持原邏輯）
            if (currentNode === this.head) {
                gsap.to(currentNode.nodeMesh.material.color, {
                    r: ((this.config.headColor >> 16) & 255) / 255,
                    g: ((this.config.headColor >> 8) & 255) / 255,
                    b: (this.config.headColor & 255) / 255,
                    duration: this.config.animationDuration
                });
            } else if (currentNode === this.tail) {
                gsap.to(currentNode.nodeMesh.material.color, {
                    r: ((this.config.tailColor >> 16) & 255) / 255,
                    g: ((this.config.tailColor >> 8) & 255) / 255,
                    b: (this.config.tailColor & 255) / 255,
                    duration: this.config.animationDuration
                });
            } else {
                gsap.to(currentNode.nodeMesh.material.color, {
                    r: ((this.config.nodeColor >> 16) & 255) / 255,
                    g: ((this.config.nodeColor >> 8) & 255) / 255,
                    b: (this.config.nodeColor & 255) / 255,
                    duration: this.config.animationDuration
                });
            }
            
            // 更新箭頭（保持原有邏輯）
            if (currentNode.next) {
                setTimeout(() => {
                    this.updateArrow(currentNode, currentNode.next);
                }, this.config.animationDuration * 500);
            }
            if (this.config.listType === "doubly" && currentNode.prev) {
                setTimeout(() => {
                    this.updateArrow(currentNode, currentNode.prev, true);
                }, this.config.animationDuration * 500);
            }
            
            currentNode = currentNode.next;
            index++;
        }
        
        if (this.nodes.length > 0) {
            const cameraZ = Math.max(15, totalWidth * 0.8);
            gsap.to(this.camera.position, {
                z: cameraZ,
                duration: this.config.animationDuration,
                ease: "power1.inOut"
            });
        }
        
        // 為確保所有動畫結束後更新索引與指標標籤，延遲呼叫更新函數
        setTimeout(() => {
            this.updateAllNodeIndices();
            this.updatePointerLabels();
        }, this.config.animationDuration * 1000);
    }
    
    updatePointerLabels() {
        const baseAddress = 1000;  // 記憶體位址起始值，每個間隔 100
        let currentNode = this.head;
    
        while (currentNode) {
            const nodeGroup = currentNode.group;
            // 取得大方塊（容器）的幾何資訊
            const containerWidth = currentNode.nodeMesh.geometry.parameters.width;
            const containerDepth = currentNode.nodeMesh.geometry.parameters.depth;
            const nodeSize = this.config.nodeSize;
            const margin = 0.2 * nodeSize;
            const totalCompartments = (this.config.listType === "doubly") ? 3 : 2;
            const startX = -containerWidth / 2 + nodeSize / 2;
            const compartments = [];
            for (let i = 0; i < totalCompartments; i++) {
                compartments.push(startX + i * (nodeSize + margin));
            }
            // 決定對應區隔：單向情況下 NEXT 在 index 1，雙向情況下 NEXT 在 index 2，PREV 在 index 0
            const nextIndex = (this.config.listType === "doubly") ? 2 : 1;
            const prevIndex = 0;
            // 增加左右偏移，避免文字重疊
            const arrowOffset = nodeSize * 0.0;
    
            // ---- 更新 next 參考文字 ----
            nodeGroup.children.forEach(child => {
                if (child.userData && child.userData.isNextRef) {
                    nodeGroup.remove(child);
                    // 如果該節點的 next 為 null，則顯示 "→NULL"，否則顯示下一個節點的記憶體位址
                    const newNextLabelText = currentNode.next
                        ?  (baseAddress + currentNode.next.position * 100)+ "→" 
                        : "NULL→";
                    const newNextLabel = this.createTextSprite(newNextLabelText, 50, "#FFAA88");
                    newNextLabel.position.set(
                        compartments[nextIndex] + arrowOffset, // 向右偏移
                        0,
                        containerDepth / 2 + 0.1
                    );
                    newNextLabel.userData = { isNextRef: true };
                    nodeGroup.add(newNextLabel);
                }
            });
    
            // ---- 更新 prev 參考文字（僅雙向）----
            if (this.config.listType === "doubly") {
                nodeGroup.children.forEach(child => {
                    if (child.userData && child.userData.isPrevRef) {
                        nodeGroup.remove(child);
                        const newPrevLabelText = currentNode.prev
                            ? "←" + (baseAddress + currentNode.prev.position * 100)
                            : "←NULL";
                        const newPrevLabel = this.createTextSprite(newPrevLabelText, 50, "#DDAAFF");
                        newPrevLabel.position.set(
                            compartments[prevIndex] - arrowOffset, // 向左偏移
                            0,
                            containerDepth / 2 + 0.1
                        );
                        newPrevLabel.userData = { isPrevRef: true };
                        nodeGroup.add(newPrevLabel);
                    }
                });
            }
    
            currentNode = currentNode.next;
        }
    }
    
    
    
    
    
    /**
     * 在頭部插入節點
     * @param {number} value - 節點值
     */
    insertAtHead(value) {
        if (this.isAnimating) return;
        this.isAnimating = true;
        
        // 建立新節點
        const newNode = this.createNodeVisual(value, 0);
        
        // 將新節點的下一個指向當前頭節點
        newNode.next = this.head;
        
        // 如果是雙向鏈結串列，更新前後指針
        if (this.config.listType === "doubly" && this.head) {
            this.head.prev = newNode;
        }
        
        // 新節點成為頭節點
        this.head = newNode;
        
        // 如果是空串列，同時更新尾節點
        if (this.tail === null) {
            this.tail = newNode;
        }
        
        // 添加到節點陣列
        this.nodes.unshift(newNode);
        this.currentSize++;
        
        // 更新所有節點索引
        this.updateAllNodeIndices();
        
        // 定位新節點到起始位置的上方並創建動畫
        const separation = this.config.nodeSeparation;
        const totalWidth = (this.nodes.length - 1) * separation;
        const startX = -totalWidth / 2;
        
        newNode.group.position.set(startX, 3, 0);
        
        // 創建動畫：新節點進入和所有節點重新排列
        gsap.to(newNode.group.position, {
            y: 0,
            duration: this.config.animationDuration,
            ease: "bounce.out",
            onComplete: () => {
                this.repositionNodes();
                this.updateMemoryDisplay();
                this.isAnimating = false;
                
                // 更新當前操作
                this.updateCurrentOperation(`已在頭部插入節點 ${value}，當前大小: ${this.currentSize}`);
                this.showStepLabel(`+${value}`, newNode.group.position.clone().add(new THREE.Vector3(0, 1.5, 0)));
            }
        });
    }
    
    /**
     * 在尾部插入節點
     * @param {number} value - 節點值
     */
    insertAtTail(value) {
        if (this.isAnimating) return;
        this.isAnimating = true;
        
        // 建立新節點
        const newNode = this.createNodeVisual(value, this.currentSize);
        
        // 如果是空串列，設置頭尾指針
        if (this.head === null) {
            this.head = newNode;
            this.tail = newNode;
        } else {
            // 連接新節點
            this.tail.next = newNode;
            
            // 如果是雙向鏈結串列，設置前向指針
            if (this.config.listType === "doubly") {
                newNode.prev = this.tail;
            }
            
            // 更新尾指針
            this.tail = newNode;
        }
        
        // 添加到節點陣列
        this.nodes.push(newNode);
        this.currentSize++;
        
        // 定位新節點到末尾位置的上方並創建動畫
        const separation = this.config.nodeSeparation;
        const totalWidth = (this.nodes.length - 1) * separation;
        const startX = -totalWidth / 2;
        const endX = startX + (this.nodes.length - 1) * separation;
        
        newNode.group.position.set(endX, 3, 0);
        
        // 創建動畫：新節點進入
        gsap.to(newNode.group.position, {
            y: 0,
            duration: this.config.animationDuration,
            ease: "bounce.out",
            onComplete: () => {
                this.repositionNodes();
                this.updateMemoryDisplay();
                this.isAnimating = false;
                
                // 更新當前操作
                this.updateCurrentOperation(`已在尾部插入節點 ${value}，當前大小: ${this.currentSize}`);
                this.showStepLabel(`+${value}`, newNode.group.position.clone().add(new THREE.Vector3(0, 1.5, 0)));
            }
        });
    }
    
    /**
     * 在指定位置插入節點
     * @param {number} value - 節點值
     * @param {number} position - 插入位置
     */
    insertAtPosition(value, position) {
        if (this.isAnimating) return;
        
        // 檢查位置是否有效
        if (position < 0 || position > this.currentSize) {
            this.updateCurrentOperation(`無效位置: ${position}，有效範圍為 0-${this.currentSize}`);
            return;
        }
        
        // 如果在頭部插入，直接調用insertAtHead
        if (position === 0) {
            this.insertAtHead(value);
            return;
        }
        
        // 如果在尾部插入，直接調用insertAtTail
        if (position === this.currentSize) {
            this.insertAtTail(value);
            return;
        }
        
        this.isAnimating = true;
        
        // 找到目標位置的前一個節點
        let currentNode = this.head;
        let index = 0;
        
        while (index < position - 1) {
            currentNode = currentNode.next;
            index++;
        }
        
        // 建立新節點
        const newNode = this.createNodeVisual(value, position);
        
        // 將新節點插入到目標位置
        newNode.next = currentNode.next;
        currentNode.next = newNode;
        
        // 如果是雙向鏈結串列，更新前後指針
        if (this.config.listType === "doubly") {
            newNode.prev = currentNode;
            if (newNode.next) {
                newNode.next.prev = newNode;
            }
        }
        
        // 添加到節點陣列並更新索引
        this.nodes.splice(position, 0, newNode);
        this.currentSize++;
        this.updateAllNodeIndices();
        
        // 定位新節點到目標位置的上方
        const separation = this.config.nodeSeparation;
        const totalWidth = (this.nodes.length - 1) * separation;
        const startX = -totalWidth / 2;
        const insertX = startX + position * separation;
        
        newNode.group.position.set(insertX, 3, 0);
        
        // 創建動畫：新節點進入
        gsap.to(newNode.group.position, {
            y: 0,
            duration: this.config.animationDuration,
            ease: "bounce.out",
            onComplete: () => {
                this.repositionNodes();
                this.updateMemoryDisplay();
                this.isAnimating = false;
                
                // 更新當前操作
                this.updateCurrentOperation(`已在位置 ${position} 插入節點 ${value}，當前大小: ${this.currentSize}`);
                this.showStepLabel(`+${value}`, newNode.group.position.clone().add(new THREE.Vector3(0, 1.5, 0)));
            }
        });
    }
    
    /**
     * 從頭部刪除節點
     */
    deleteFromHead() {
        if (this.isAnimating || this.currentSize === 0) {
            if (this.currentSize === 0) {
                this.updateCurrentOperation("串列為空，無法刪除");
            }
            return;
        }
        
        this.isAnimating = true;
        
        // 暫存頭節點值用於顯示
        const deletedValue = this.head.value;
        
        // 如果只有一個節點
        if (this.head === this.tail) {
            this.animateNodeRemoval(this.head, () => {
                this.head = null;
                this.tail = null;
                this.nodes = [];
                this.currentSize = 0;
                this.updateMemoryDisplay();
                this.isAnimating = false;
                this.updateCurrentOperation(`已從頭部刪除節點 ${deletedValue}，當前大小: 0`);
            });
            return;
        }
        
        // 移動頭指針到下一個節點
        const newHead = this.head.next;
        
        // 如果是雙向鏈結串列，更新前向指針
        if (this.config.listType === "doubly") {
            newHead.prev = null;
        }
        
        // 動畫顯示節點被移除
        this.animateNodeRemoval(this.head, () => {
            this.head = newHead;
            this.nodes.shift();
            this.currentSize--;
            
            // 更新所有節點索引
            this.updateAllNodeIndices();
            this.repositionNodes();
            this.updateMemoryDisplay();
            this.isAnimating = false;
            
            // 更新當前操作
            this.updateCurrentOperation(`已從頭部刪除節點 ${deletedValue}，當前大小: ${this.currentSize}`);
        });
    }
    
    /**
     * 從尾部刪除節點
     */
    deleteFromTail() {
        if (this.isAnimating || this.currentSize === 0) {
            if (this.currentSize === 0) {
                this.updateCurrentOperation("串列為空，無法刪除");
            }
            return;
        }
        
        this.isAnimating = true;
        
        // 暫存尾節點值用於顯示
        const deletedValue = this.tail.value;
        
        // 如果只有一個節點
        if (this.head === this.tail) {
            this.animateNodeRemoval(this.tail, () => {
                this.head = null;
                this.tail = null;
                this.nodes = [];
                this.currentSize = 0;
                this.updateMemoryDisplay();
                this.isAnimating = false;
                this.updateCurrentOperation(`已從尾部刪除節點 ${deletedValue}，當前大小: 0`);
            });
            return;
        }
        
        // 找到倒數第二個節點
        let currentNode = this.head;
        while (currentNode.next !== this.tail) {
            currentNode = currentNode.next;
        }
        
        // 動畫顯示節點被移除
        this.animateNodeRemoval(this.tail, () => {
            // 更新尾指針
            this.tail = currentNode;
            this.tail.next = null;
            
            this.nodes.pop();
            this.currentSize--;
            
            this.repositionNodes();
            this.updateMemoryDisplay();
            this.isAnimating = false;
            
            // 更新當前操作
            this.updateCurrentOperation(`已從尾部刪除節點 ${deletedValue}，當前大小: ${this.currentSize}`);
        });
    }
    
    /**
     * 從指定位置刪除節點
     * @param {number} position - 刪除位置
     */
    deleteFromPosition(position) {
        if (this.isAnimating || this.currentSize === 0) {
            if (this.currentSize === 0) {
                this.updateCurrentOperation("串列為空，無法刪除");
            }
            return;
        }
        
        // 檢查位置是否有效
        if (position < 0 || position >= this.currentSize) {
            this.updateCurrentOperation(`無效位置: ${position}，有效範圍為 0-${this.currentSize - 1}`);
            return;
        }
        
        // 如果刪除頭節點，調用deleteFromHead
        if (position === 0) {
            this.deleteFromHead();
            return;
        }
        
        // 如果刪除尾節點，調用deleteFromTail
        if (position === this.currentSize - 1) {
            this.deleteFromTail();
            return;
        }
        
        this.isAnimating = true;
        
        // 找到目標位置的前一個節點
        let currentNode = this.head;
        let index = 0;
        
        while (index < position - 1) {
            currentNode = currentNode.next;
            index++;
        }
        
        // 要刪除的節點
        const nodeToDelete = currentNode.next;
        const deletedValue = nodeToDelete.value;
        
        // 動畫顯示節點被移除
        this.animateNodeRemoval(nodeToDelete, () => {
            // 更新指針
            currentNode.next = nodeToDelete.next;
            
            // 如果是雙向鏈結串列，更新前後指針
            if (this.config.listType === "doubly" && nodeToDelete.next) {
                nodeToDelete.next.prev = currentNode;
            }
            
            // 從陣列中移除節點
            this.nodes.splice(position, 1);
            this.currentSize--;
            
            // 更新所有節點索引
            this.updateAllNodeIndices();
            this.repositionNodes();
            this.updateMemoryDisplay();
            this.isAnimating = false;
            
            // 更新當前操作
            this.updateCurrentOperation(`已從位置 ${position} 刪除節點 ${deletedValue}，當前大小: ${this.currentSize}`);
        });
    }
    
    /**
     * 搜尋指定值的節點
     * @param {number} value - 要搜尋的值
     */
    searchByValue(value) {
        if (this.isAnimating) return;
        if (this.currentSize === 0) {
            this.updateCurrentOperation("串列為空，無法搜尋");
            return;
        }
        
        this.isAnimating = true;
        
        // 重置所有節點顏色
        this.resetNodesAppearance();
        
        // 清除之前的操作消息和標籤
        this.clearNumberLabels();
        
        // 更新操作信息 - 只顯示當前狀態，不累積
        this.updateCurrentOperation(`開始搜尋值 ${value}`);
        
        // 顯示搜尋方向選擇（僅雙向鏈結串列）
        if (this.config.listType === "doubly" && this.currentSize > 1) {
            // 提供向前或向後搜尋的選項
            this.showSearchDirectionDialog(value);
        } else {
            // 單向鏈結串列只能向前搜尋
            this.searchForward(value);
        }
    }
    
    /**
     * 顯示搜尋方向選擇對話框（僅雙向鏈結串列）
     * @param {number} value - 要搜尋的值
     */
    showSearchDirectionDialog(value) {
        // 建立方向選擇對話框
        const dialog = document.createElement('div');
        dialog.style.position = 'absolute';
        dialog.style.top = '50%';
        dialog.style.left = '50%';
        dialog.style.transform = 'translate(-50%, -50%)';
        dialog.style.backgroundColor = 'rgba(0,0,0,0.8)';
        dialog.style.padding = '20px';
        dialog.style.borderRadius = '8px';
        dialog.style.border = '1px solid #4CAF50';
        dialog.style.zIndex = '1000';
        dialog.style.color = 'white';
        dialog.style.textAlign = 'center';
        dialog.style.minWidth = '300px';
        
        dialog.innerHTML = `
            <h3>選擇搜尋方向</h3>
            <p>雙向鏈結串列可以從頭部或尾部開始搜尋</p>
            <div style="display:flex;justify-content:center;gap:10px;margin-top:15px;">
                <button id="forwardSearchBtn" style="padding:8px 15px;background:#4CAF50;border:none;color:white;border-radius:4px;cursor:pointer;">
                    從頭部開始搜尋 (前向)
                </button>
                <button id="backwardSearchBtn" style="padding:8px 15px;background:#FF5722;border:none;color:white;border-radius:4px;cursor:pointer;">
                    從尾部開始搜尋 (後向)
                </button>
            </div>
            <button id="cancelSearchBtn" style="margin-top:15px;padding:5px 10px;background:#666;border:none;color:white;border-radius:4px;cursor:pointer;">
                取消
            </button>
        `;
        
        this.container.appendChild(dialog);
        
        // 設置按鈕事件
        document.getElementById('forwardSearchBtn').addEventListener('click', () => {
            this.container.removeChild(dialog);
            this.searchForward(value);
        });
        
        document.getElementById('backwardSearchBtn').addEventListener('click', () => {
            this.container.removeChild(dialog);
            this.searchBackward(value);
        });
        
        document.getElementById('cancelSearchBtn').addEventListener('click', () => {
            this.container.removeChild(dialog);
            this.isAnimating = false;
            this.updateCurrentOperation('搜尋已取消');
        });
    }
    
    /**
     * 從頭部開始向後搜尋（順向）
     * @param {number} value - 要搜尋的值
     */
    searchForward(value) {
        this.updateCurrentOperation(`開始從頭部搜尋值 ${value}`);
        this.searchNodeStep(this.head, value, 0, true);
    }
    
    /**
     * 從尾部開始向前搜尋（逆向）- 雙向鏈結串列專用
     * @param {number} value - 要搜尋的值
     */
    searchBackward(value) {
        if (this.config.listType !== "doubly") {
            this.updateCurrentOperation("只有雙向鏈結串列支援後向搜尋");
            this.isAnimating = false;
            return;
        }
        
        this.updateCurrentOperation(`開始從尾部搜尋值 ${value}`);
        
        // 從尾節點開始，使用prev指針向前搜尋
        this.searchNodeStep(this.tail, value, this.currentSize - 1, false);
    }
    
    /**
     * 逐步搜尋節點
     * @param {Object} node - 當前節點
     * @param {number} value - 搜尋值
     * @param {number} index - 當前索引
     * @param {boolean} forward - 是否為向前搜尋
     */
    searchNodeStep(node, value, index, forward) {
        if (!node) {
            this.updateCurrentOperation(`未找到值 ${value}`);
            this.isAnimating = false;
            return;
        }
        
        // 高亮當前檢查的節點
        gsap.to(node.nodeMesh.material.color, {
            r: ((this.config.selectedColor >> 16) & 255) / 255,
            g: ((this.config.selectedColor >> 8) & 255) / 255,
            b: (this.config.selectedColor & 255) / 255,
            duration: this.config.animationDuration
        });
        
        // 放大當前節點
        gsap.to(node.group.scale, {
            x: 1.2, y: 1.2, z: 1.2,
            duration: this.config.animationDuration,
            onComplete: () => {
                // 更新操作信息 - 只顯示當前步驟
                this.updateCurrentOperation(`檢查位置 ${index} 的節點值 ${node.value}`);
                
                // 添加查找標籤 - 顯示在節點上方
                const labelText = `檢查位置 ${index}`;
                this.showStepLabel(labelText, node.group.position.clone().add(new THREE.Vector3(0, 1.5, 0)));
                
                // 高亮使用中的指針（對於雙向鏈結串列）
                if (this.config.listType === "doubly") {
                    // 根據搜尋方向高亮適當的指針部分
                    if (forward && node.next) {
                        // 高亮next指針
                        if (node.pointerBox) {
                            gsap.to(node.pointerBox.material.color, {
                                r: 1, g: 1, b: 0, // 黃色高亮
                                duration: this.config.animationDuration / 2
                            });
                        }
                    } else if (!forward && node.prev) {
                        // 高亮prev指針（雙向鏈結串列的前向指針）
                        node.group.children.forEach(child => {
                            if (child.position.z < -0.1) { // prev box 在z軸負方向
                                gsap.to(child.material.color, {
                                    r: 1, g: 1, b: 0, // 黃色高亮
                                    duration: this.config.animationDuration / 2
                                });
                            }
                        });
                    }
                }
                
                // 檢查是否找到目標值
                if (node.value === value) {
                    // 找到值 - 綠色高亮
                    gsap.to(node.nodeMesh.material.color, {
                        r: 0, g: 1, b: 0, // 綠色
                        duration: this.config.animationDuration
                    });
                    
                    // 放大節點並彈跳效果
                    gsap.to(node.group.scale, {
                        x: 1.5, y: 1.5, z: 1.5,
                        duration: this.config.animationDuration,
                        yoyo: true,
                        repeat: 1,
                        onComplete: () => {
                            this.updateCurrentOperation(`找到值 ${value} 於位置 ${index}`);
                            this.showStepLabel(`找到值 ${value}!`, node.group.position.clone().add(new THREE.Vector3(0, 2, 0)));
                            
                            setTimeout(() => {
                                this.resetNodesAppearance();
                                this.isAnimating = false;
                            }, 1500);
                        }
                    });
                } else {
                    // 未找到，繼續搜尋
                    setTimeout(() => {
                        // 恢復當前節點顏色
                        gsap.to(node.nodeMesh.material.color, {
                            r: ((node === this.head ? this.config.headColor : 
                                (node === this.tail ? this.config.tailColor : this.config.nodeColor)) >> 16 & 255) / 255,
                            g: ((node === this.head ? this.config.headColor : 
                                (node === this.tail ? this.config.tailColor : this.config.nodeColor)) >> 8 & 255) / 255,
                            b: ((node === this.head ? this.config.headColor : 
                                (node === this.tail ? this.config.tailColor : this.config.nodeColor)) & 255) / 255,
                            duration: this.config.animationDuration / 2
                        });
                        
                        // 恢復指針顏色
                        if (this.config.listType === "doubly") {
                            if (forward && node.pointerBox) {
                                gsap.to(node.pointerBox.material.color, {
                                    r: ((0xFF5722 >> 16) & 255) / 255,
                                    g: ((0xFF5722 >> 8) & 255) / 255,
                                    b: (0xFF5722 & 255) / 255,
                                    duration: this.config.animationDuration / 2
                                });
                            } else if (!forward) {
                                node.group.children.forEach(child => {
                                    if (child.position.z < -0.1) {
                                        gsap.to(child.material.color, {
                                            r: ((0x9C27B0 >> 16) & 255) / 255,
                                            g: ((0x9C27B0 >> 8) & 255) / 255,
                                            b: (0x9C27B0 & 255) / 255,
                                            duration: this.config.animationDuration / 2
                                        });
                                    }
                                });
                            }
                        }
                        
                        // 恢復大小
                        gsap.to(node.group.scale, {
                            x: 1, y: 1, z: 1,
                            duration: this.config.animationDuration / 2,
                            onComplete: () => {
                                // 移動到下一個節點 - 根據搜尋方向決定
                                if (forward) {
                                    // 前向搜尋 - 使用next指針
                                    this.searchNodeStep(node.next, value, index + 1, forward);
                                } else {
                                    // 後向搜尋 - 使用prev指針
                                    this.searchNodeStep(node.prev, value, index - 1, forward);
                                }
                            }
                        });
                    }, this.config.animationDuration * 1000);
                }
            }
        });
    }
    
    /**
     * 清除步驟數字標籤
     */
    clearNumberLabels() {
        this.numberLabels.forEach(label => {
            this.scene.remove(label);
        });
        this.numberLabels = [];
    }
    
    /**
     * 顯示操作步驟標籤
     * @param {string} text - 標籤文字
     * @param {THREE.Vector3} position - 標籤位置
     */
    showStepLabel(text, position) {
        const label = this.createTextSprite(text, 70, "#FFFF00");
        label.position.copy(position);
        this.scene.add(label);
        this.numberLabels.push(label);
        
        // 動畫效果
        gsap.from(label.scale, {
            x: 0, y: 0, z: 0,
            duration: 0.5,
            ease: "back.out"
        });
        
        // 設置自動消失
        setTimeout(() => {
            gsap.to(label.material, {
                opacity: 0,
                duration: 0.5,
                onComplete: () => {
                    this.scene.remove(label);
                    this.numberLabels = this.numberLabels.filter(l => l !== label);
                }
            });
        }, 2000);
    }
    
    /**
     * 重置所有節點外觀
     */
    resetNodesAppearance() {
        this.nodes.forEach(node => {
            const color = node === this.head ? this.config.headColor : 
                        (node === this.tail ? this.config.tailColor : this.config.nodeColor);
            
            gsap.to(node.nodeMesh.material.color, {
                r: ((color >> 16) & 255) / 255,
                g: ((color >> 8) & 255) / 255,
                b: (color & 255) / 255,
                duration: this.config.animationDuration / 2
            });
            
            gsap.to(node.group.scale, {
                x: 1, y: 1, z: 1,
                duration: this.config.animationDuration / 2
            });
        });
    }
    
    /**
     * 動畫顯示節點被移除
     * @param {Object} node - 要刪除的節點
     * @param {Function} callback - 動畫完成後的回調函數
     */
    animateNodeRemoval(node, callback) {
        // 高亮節點
        gsap.to(node.nodeMesh.material.color, {
            r: 1, g: 0, b: 0, // 紅色
            duration: this.config.animationDuration / 2
        });
        
        gsap.to(node.group.scale, {
            x: 1.2, y: 1.2, z: 1.2,
            duration: this.config.animationDuration / 2,
            onComplete: () => {
                // 顯示刪除標籤
                this.showStepLabel(`-${node.value}`, node.group.position.clone().add(new THREE.Vector3(0, 1.5, 0)));
                
                // 上移淡出動畫
                gsap.to(node.group.position, {
                    y: 3,
                    duration: this.config.animationDuration,
                    ease: "power1.in"
                });
                
                gsap.to(node.group.scale, {
                    x: 0.1, y: 0.1, z: 0.1,
                    duration: this.config.animationDuration,
                    ease: "power1.in"
                });
                
                // 移除箭頭
                if (node.visual.arrow) {
                    gsap.to(node.visual.arrow.scale, {
                        x: 0, y: 0, z: 0,
                        duration: this.config.animationDuration / 2,
                        onComplete: () => {
                            this.scene.remove(node.visual.arrow);
                            this.arrows = this.arrows.filter(a => a !== node.visual.arrow);
                            node.visual.arrow = null;
                        }
                    });
                }
                
                // 移除前向箭頭
                if (node.visual.prevArrow) {
                    gsap.to(node.visual.prevArrow.scale, {
                        x: 0, y: 0, z: 0,
                        duration: this.config.animationDuration / 2,
                        onComplete: () => {
                            this.scene.remove(node.visual.prevArrow);
                            this.arrows = this.arrows.filter(a => a !== node.visual.prevArrow);
                            node.visual.prevArrow = null;
                        }
                    });
                }
                
                // 完成後從場景移除節點
                setTimeout(() => {
                    this.scene.remove(node.group);
                    callback();
                }, this.config.animationDuration * 1000);
            }
        });
    }
    
    /**
     * 更新所有節點的索引
     */
    updateAllNodeIndices() {
        let index = 0;
        let currentNode = this.head;
        
        while (currentNode) {
            currentNode.position = index;
            
            // 先移除原本的索引標籤（因為 text sprite 不能直接修改文字）
            if (currentNode.indexLabel) {
                currentNode.group.remove(currentNode.indexLabel);
            }
            // 重新建立正確的索引標籤並加入節點組內
            currentNode.indexLabel = this.createTextSprite(index.toString(), 50, "#FFFFFF");
            currentNode.indexLabel.position.set(0, -this.config.nodeSize * 1.5, 0);
            currentNode.group.add(currentNode.indexLabel);
            
            currentNode = currentNode.next;
            index++;
        }
    }
    
    
    /**
     * 更新記憶體顯示
     */
    updateMemoryDisplay() {
        if (!this.nodes.length) {
            if (FloatingWindow.isOpen('memory')) {
                FloatingWindow.update('memory', '<div>鏈結串列為空</div>');
            }
            return;
        }
        
        let html = `<div class="memory-row">
                      <div class="memory-address">節點位址</div>
                      <div class="memory-value" style="width:auto;">資料值</div>
                      <div class="memory-value" style="width:auto;">下一個節點</div>
                    </div>`;
        
        // 假設記憶體位址從 1000 開始，每個節點間隔 100
        const baseAddress = 1000;
        let currentNode = this.head;
        let index = 0;
        
        while (currentNode) {
            const nodeAddress = baseAddress + index * 100;
            const nextAddress = currentNode.next ? baseAddress + (index + 1) * 100 : 'NULL';
            const isHead = currentNode === this.head;
            const isTail = currentNode === this.tail;
            
            html += `<div class="memory-row">
                       <div class="memory-address">${nodeAddress} ${isHead ? '(head)' : ''} ${isTail ? '(tail)' : ''}</div>
                       <div class="memory-value" style="width:auto;">${currentNode.value}</div>
                       <div class="memory-value" style="width:auto;">${nextAddress}</div>
                     </div>`;
            
            // 如果是雙向鏈結串列，顯示前向指針
            if (this.config.listType === "doubly") {
                const prevAddress = currentNode.prev ? baseAddress + (index - 1) * 100 : 'NULL';
                html += `<div class="memory-row">
                           <div class="memory-address"></div>
                           <div class="memory-value" style="width:auto;">prev</div>
                           <div class="memory-value" style="width:auto;">${prevAddress}</div>
                         </div>`;
            }
            
            currentNode = currentNode.next;
            index++;
        }
        
        if (FloatingWindow.isOpen('memory')) {
            FloatingWindow.update('memory', html);
        }
    }
    
    /**
     * 切換代碼視窗顯示
     */
    toggleCode() {
        let code = '';
        
        if (this.config.listType === "singly") {
            code = `/**
 * 單向鏈結串列的實作
 */

// 節點定義
class Node {
    constructor(value) {
        this.value = value;  // 節點儲存的資料
        this.next = null;   // 指向下一個節點的參考
    }
}

// 單向鏈結串列
class SinglyLinkedList {
    constructor() {
        this.head = null;  // 指向串列第一個節點
        this.tail = null;  // 指向串列最後一個節點
        this.size = 0;     // 當前串列大小
    }
    
    // 在串列頭部插入節點
    insertAtHead(value) {
        const newNode = new Node(value);
        
        if (this.head === null) {
            // 如果串列為空
            this.head = newNode;
            this.tail = newNode;
        } else {
            // 如果串列不為空
            newNode.next = this.head;  // 將新節點的next指向舊的head
            this.head = newNode;       // 更新head為新節點
        }
        
        this.size++;
        return newNode;
    }
    
    // 在串列尾部插入節點
    insertAtTail(value) {
        const newNode = new Node(value);
        
        if (this.head === null) {
            // 如果串列為空
            this.head = newNode;
            this.tail = newNode;
        } else {
            // 如果串列不為空
            this.tail.next = newNode;  // 將舊的tail的next指向新節點
            this.tail = newNode;       // 更新tail為新節點
        }
        
        this.size++;
        return newNode;
    }
    
    // 在指定位置插入節點
    insertAt(value, position) {
        // 檢查位置有效性
        if (position < 0 || position > this.size) {
            return null; // 無效位置
        }
        
        if (position === 0) {
            return this.insertAtHead(value);
        }
        
        if (position === this.size) {
            return this.insertAtTail(value);
        }
        
        const newNode = new Node(value);
        
        // 找到插入位置前一個節點
        let current = this.head;
        for (let i = 0; i < position - 1; i++) {
            current = current.next;
        }
        
        // 插入新節點
        newNode.next = current.next;
        current.next = newNode;
        
        this.size++;
        return newNode;
    }
    
    // 從頭部刪除節點
    deleteFromHead() {
        if (!this.head) {
            return null; // 串列為空
        }
        
        const removedNode = this.head;
        
        if (this.head === this.tail) {
            // 只有一個節點
            this.head = null;
            this.tail = null;
        } else {
            // 多個節點
            this.head = this.head.next;
        }
        
        this.size--;
        return removedNode.value;
    }
    
    // 從尾部刪除節點（需要遍歷到倒數第二個節點）
    deleteFromTail() {
        if (!this.head) {
            return null; // 串列為空
        }
        
        const removedNode = this.tail;
        
        if (this.head === this.tail) {
            // 只有一個節點
            this.head = null;
            this.tail = null;
        } else {
            // 找到倒數第二個節點
            let current = this.head;
            while (current.next !== this.tail) {
                current = current.next;
            }
            
            current.next = null; // 設置新的尾節點的next為null
            this.tail = current; // 更新尾節點
        }
        
        this.size--;
        return removedNode.value;
    }
    
    // 搜尋特定值的節點
    search(value) {
        let current = this.head;
        let position = 0;
        
        while (current) {
            if (current.value === value) {
                return position; // 返回找到的位置
            }
            current = current.next;
            position++;
        }
        
        return -1; // 未找到
    }
    
    // 遍歷串列所有節點
    traverse() {
        const values = [];
        let current = this.head;
        
        while (current) {
            values.push(current.value);
            current = current.next;
        }
        
        return values;
    }
}`;
        } else {
            code = `/**
 * 雙向鏈結串列的實作
 */

// 節點定義
class Node {
    constructor(value) {
        this.value = value;  // 節點儲存的資料
        this.next = null;   // 指向下一個節點的參考
        this.prev = null;   // 指向前一個節點的參考
    }
}

// 雙向鏈結串列
class DoublyLinkedList {
    constructor() {
        this.head = null;  // 指向串列第一個節點
        this.tail = null;  // 指向串列最後一個節點
        this.size = 0;     // 當前串列大小
    }
    
    // 在串列頭部插入節點
    insertAtHead(value) {
        const newNode = new Node(value);
        
        if (this.head === null) {
            // 如果串列為空
            this.head = newNode;
            this.tail = newNode;
        } else {
            // 如果串列不為空
            newNode.next = this.head;  // 將新節點的next指向舊的head
            this.head.prev = newNode;  // 將舊head的prev指向新節點
            this.head = newNode;       // 更新head為新節點
        }
        
        this.size++;
        return newNode;
    }
    
    // 在串列尾部插入節點
    insertAtTail(value) {
        const newNode = new Node(value);
        
        if (this.head === null) {
            // 如果串列為空
            this.head = newNode;
            this.tail = newNode;
        } else {
            // 如果串列不為空
            this.tail.next = newNode;  // 將舊的tail的next指向新節點
            newNode.prev = this.tail;  // 將新節點的prev指向舊的tail
            this.tail = newNode;       // 更新tail為新節點
        }
        
        this.size++;
        return newNode;
    }
    
    // 在指定位置插入節點
    insertAt(value, position) {
        // 檢查位置有效性
        if (position < 0 || position > this.size) {
            return null; // 無效位置
        }
        
        if (position === 0) {
            return this.insertAtHead(value);
        }
        
        if (position === this.size) {
            return this.insertAtTail(value);
        }
        
        const newNode = new Node(value);
        
        // 找到插入位置的節點
        let current = this.head;
        for (let i = 0; i < position; i++) {
            current = current.next;
        }
        
        // 插入新節點
        newNode.prev = current.prev;  // 新節點的prev指向當前節點的prev
        newNode.next = current;       // 新節點的next指向當前節點
        current.prev.next = newNode;  // 當前節點的前一個節點的next指向新節點
        current.prev = newNode;       // 當前節點的prev指向新節點
        
        this.size++;
        return newNode;
    }
    
    // 從頭部刪除節點
    deleteFromHead() {
        if (!this.head) {
            return null; // 串列為空
        }
        
        const removedNode = this.head;
        
        if (this.head === this.tail) {
            // 只有一個節點
            this.head = null;
            this.tail = null;
        } else {
            // 多個節點
            this.head = this.head.next;
            this.head.prev = null;
        }
        
        this.size--;
        return removedNode.value;
    }
    
    // 從尾部刪除節點
    deleteFromTail() {
        if (!this.head) {
            return null; // 串列為空
        }
        
        const removedNode = this.tail;
        
        if (this.head === this.tail) {
            // 只有一個節點
            this.head = null;
            this.tail = null;
        } else {
            // 有多個節點
            this.tail = this.tail.prev;  // 將tail設為原tail的前一個節點
            this.tail.next = null;       // 將新tail的next設為null
        }
        
        this.size--;
        return removedNode.value;
    }
    
    // 搜尋特定值的節點
    search(value) {
        let current = this.head;
        let position = 0;
        
        while (current) {
            if (current.value === value) {
                return position; // 返回找到的位置
            }
            current = current.next;
            position++;
        }
        
        return -1; // 未找到
    }
    
    // 從前向後遍歷
    traverseForward() {
        const values = [];
        let current = this.head;
        
        while (current) {
            values.push(current.value);
            current = current.next;
        }
        
        return values;
    }
    
    // 從後向前遍歷
    traverseBackward() {
        const values = [];
        let current = this.tail;
        
        while (current) {
            values.push(current.value);
            current = current.prev;
        }
        
        return values;
    }
}`;
        }
        
        FloatingWindow.toggle('code', () => code, this.config.listType === "singly" ? '單向鏈結串列實作' : '雙向鏈結串列實作');
    }
    
    /**
     * 切換記憶體視窗顯示
     */
    toggleMemory() {
        if (!this.nodes.length) {
            FloatingWindow.toggle('memory', () => '<div>鏈結串列為空</div>', '鏈結串列記憶體佈局');
            return;
        }
        
        let html = `<div class="memory-row">
                      <div class="memory-address">節點位址</div>
                      <div class="memory-value" style="width:auto;">資料值</div>
                      <div class="memory-value" style="width:auto;">下一個節點</div>
                    </div>`;
        
        // 假設記憶體位址從 1000 開始，每個節點間隔 100
        const baseAddress = 1000;
        let currentNode = this.head;
        let index = 0;
        
        while (currentNode) {
            const nodeAddress = baseAddress + index * 100;
            const nextAddress = currentNode.next ? baseAddress + (index + 1) * 100 : 'NULL';
            const isHead = currentNode === this.head;
            const isTail = currentNode === this.tail;
            
            html += `<div class="memory-row">
                       <div class="memory-address">${nodeAddress} ${isHead ? '(head)' : ''} ${isTail ? '(tail)' : ''}</div>
                       <div class="memory-value" style="width:auto;">${currentNode.value}</div>
                       <div class="memory-value" style="width:auto;">${nextAddress}</div>
                     </div>`;
            
            // 如果是雙向鏈結串列，顯示前向指針
            if (this.config.listType === "doubly") {
                const prevAddress = currentNode.prev ? baseAddress + (index - 1) * 100 : 'NULL';
                html += `<div class="memory-row">
                           <div class="memory-address"></div>
                           <div class="memory-value" style="width:auto;">prev</div>
                           <div class="memory-value" style="width:auto;">${prevAddress}</div>
                         </div>`;
            }
            
            currentNode = currentNode.next;
            index++;
        }
        
        FloatingWindow.toggle('memory', () => html, '鏈結串列記憶體佈局');
    }
    
    /**
     * 切換公式視窗顯示
     */
    toggleFormula() {
        let content = '';
        
        if (this.config.listType === "singly") {
            content = `<h3>單向鏈結串列</h3>
                      <div>單向鏈結串列(Singly Linked List)是一種線性資料結構。每個節點包含兩個部分：</div>
                      <div>1. 資料欄位 - 儲存實際資料</div>
                      <div>2. 指標(next) - 指向序列中下一個節點的參考</div>
                      <br>
                      <div class="formula"><span class="highlight">特點與優勢：</span></div>
                      <div>• 動態大小：能夠動態增長和縮減</div>
                      <div>• 插入和刪除操作：無需移動其他元素，時間複雜度為 O(1)</div>
                      <div>• 記憶體利用率：對比陣列，只在需要時分配記憶體</div>
                      <br>
                      <div class="formula"><span class="highlight">基本操作時間複雜度：</span></div>
                      <div>• 插入頭部節點：O(1)</div>
                      <div>• 插入尾部節點(有tail指針)：O(1)</div>
                      <div>• 插入中間節點：O(n)</div>
                      <div>• 刪除頭部節點：O(1)</div>
                      <div>• 刪除尾部節點：O(n)</div>
                      <div>• 搜尋節點：O(n)</div>
                      <br>
                      <div class="formula"><span class="highlight">限制：</span></div>
                      <div>• 只能從一個方向遍歷</div>
                      <div>• 如果沒有tail指針，找到最後一個節點需要 O(n) 時間</div>
                      <div>• 無法有效實現從尾到頭的訪問</div>
                      <br>
                      <div class="formula"><span class="highlight">應用場景：</span></div>
                      <div>• 實作堆疊和佇列資料結構</div>
                      <div>• 需要頻繁頭部插入/刪除的情境</div>
                      <div>• 多個列表共享資料時（如多項式表示）</div>`;
        } else {
            content = `<h3>雙向鏈結串列</h3>
                      <div>雙向鏈結串列(Doubly Linked List)是一種能在兩個方向上遍歷的線性資料結構。每個節點包含：</div>
                      <div>1. 資料欄位 - 儲存實際資料</div>
                      <div>2. 前向指標(prev) - 指向前一個節點</div>
                      <div>3. 後向指標(next) - 指向後一個節點</div>
                      <br>
                      <div class="formula"><span class="highlight">特點與優勢：</span></div>
                      <div>• 雙向遍歷：能從頭到尾或從尾到頭遍歷</div>
                      <div>• 效率刪除：相比單向鏈結串列，可以更高效地刪除節點</div>
                      <div>• 反向查詢：能快速找到前一個節點，不需再次從頭遍歷</div>
                      <br>
                      <div class="formula"><span class="highlight">基本操作時間複雜度：</span></div>
                      <div>• 插入頭部節點：O(1)</div>
                      <div>• 插入尾部節點：O(1)</div>
                      <div>• 插入中間節點：O(n)</div>
                      <div>• 刪除頭部節點：O(1)</div>
                      <div>• 刪除尾部節點：O(1)</div>
                      <div>• 搜尋節點：O(n)</div>
                      <br>
                      <div class="formula"><span class="highlight">與單向鏈結串列比較：</span></div>
                      <div>• 優點：能雙向遍歷；更容易實作尾部操作；能追蹤前節點</div>
                      <div>• 缺點：每個節點需要額外的記憶體空間存儲前向指標</div>
                      <div>• 實作複雜度略高</div>
                      <br>
                      <div class="formula"><span class="highlight">應用場景：</span></div>
                      <div>• 需要雙向遍歷的場景（如文本編輯器）</div>
                      <div>• 實作LRU快取等需要快速移動元素的結構</div>
                      <div>• 需要從中間位置快速插入/刪除的情境</div>`;
        }
        
        FloatingWindow.toggle('formula', () => content, this.config.listType === 'singly' ? '單向鏈結串列原理' : '雙向鏈結串列原理');
    }
    
    /**
     * 暫停動畫
     */
    pauseAnimation() {
        // 暫停 GSAP 動畫
        gsap.globalTimeline.pause();
    }
    
    /**
     * 繼續動畫
     */
    resumeAnimation() {
        // 繼續 GSAP 動畫
        gsap.globalTimeline.play();
    }
    
    /**
     * 單步執行
     * 此模組目前未實現逐步執行功能
     */
    stepForward() {
        // 目前單步模式在鏈結串列動畫中較不適合
        this.updateCurrentOperation('鏈結串列模組不支援逐步執行，請使用提供的操作函數');
    }
    
    /**
     * 清理場景
     */
    clearScene() {
        // 移除節點
        this.nodes.forEach(node => {
            this.scene.remove(node.group);
        });
        
        // 移除箭頭
        this.arrows.forEach(arrow => {
            this.scene.remove(arrow);
        });
        
        // 移除標籤
        this.labels.forEach(label => {
            this.scene.remove(label);
        });
        
        // 移除數字標籤
        this.numberLabels.forEach(label => {
            this.scene.remove(label);
        });
        
        // 清空陣列
        this.nodes = [];
        this.arrows = [];
        this.labels = [];
        this.numberLabels = [];
        
        // 重置串列屬性
        this.head = null;
        this.tail = null;
        this.currentSize = 0;
        
        // 清除其他場景物件
        const toRemove = [];
        this.scene.traverse(child => {
            if (!(child instanceof THREE.Camera) && 
                !(child instanceof THREE.Light) && 
                !(child instanceof THREE.AxesHelper)) {
                toRemove.push(child);
            }
        });
        
        toRemove.forEach(obj => this.scene.remove(obj));
    }
    
    /**
     * 重置模組
     */
    reset() {
        this.clearScene();
        
        // 重置狀態
        this.isAnimating = false;
        this.isProcessingStep = false;
        this.stepping = false;
        this.selectedNode = null;
        
        // 更新控制面板
        document.getElementById('listType').value = this.config.listType;
        document.getElementById('initialLength').value = this.config.initialLength;
        document.getElementById('linkedListSpeed').value = this.config.speed;
        document.getElementById('nodeOpacitySlider').value = this.config.cubeOpacity * 100;
        document.getElementById('nodeOpacityValue').textContent = Math.round(this.config.cubeOpacity * 100) + '%';
        
        // 創建初始串列
        this.createInitialLinkedList();
        
        // 更新當前操作
        this.updateCurrentOperation(`鏈結串列已重置 - 節點數量: ${this.currentSize}`);
    }
    
    /**
     * 銷毀模組
     */
    destroy() {
        // 移除控制面板
        if (this.controlsPanel && this.controlsPanel.parentNode) {
            this.controlsPanel.parentNode.removeChild(this.controlsPanel);
        }
        
        // 移除控制按鈕
        if (this.controlButton && this.controlButton.parentNode) {
            this.controlButton.parentNode.removeChild(this.controlButton);
        }
        
        // 調用父類的銷毀方法
        super.destroy();
    }}