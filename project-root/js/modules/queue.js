/**
 * 佇列視覺化模組
 * 展示佇列的基本操作以及線性佇列和循環佇列的區別
 */

// 確保 ModuleClass 只在全局範圍中定義一次
window.ModuleClass = class QueueModule extends ModuleBase {
    constructor(container) {
        super(container);
        
        // 模組配置
        this.config = {
            queueType: "linear",     // 佇列類型："linear"或"circular"
            queueSize: 8,            // 佇列大小
            animationDuration: 0.5,  // 動畫持續時間
            speed: "medium",         // 動畫速度
            baseColor: 0x4CAF50,     // 基本顏色
            frontColor: 0xFF5722,    // 前端（front）顏色
            rearColor: 0x2196F3,     // 尾端（rear）顏色
            activeColor: 0xFFC107,   // 當前操作元素顏色
            cellSize: 1.2,           // 單元格大小
            cellGap: 0.3,            // 單元格間距
            cubeOpacity: 0.7         // 方塊不透明度
        };
        this.speedMap = { slow: 1.0, medium: 0.5, fast: 0.2 };
        
        // 佇列狀態
        this.queue = [];          // 實際儲存的元素
        this.front = 0;           // 前端指標
        this.rear = -1;           // 尾端指標
        this.count = 0;           // 元素數量
        this.nextValue = 1;       // 下一個要添加的值
        
        // 元素追蹤
        this.cubes = [];          // 方塊物件
        this.textSprites = [];    // 文字標籤
        this.pointers = {         // 指標物件
            front: null,
            frontText: null,
            rear: null,
            rearText: null
        };
        this.animationQueue = []; // 動畫佇列
        this.isAnimating = false; // 是否正在動畫中
        this.highlightedIndices = new Set(); // 高亮單元格
        this.numberLabels = [];   // 操作數字標籤
        
        // 創建控制面板
        this.controlsPanel = null;
        this.controlButton = null;
        this.panelPosition = { x: 0, y: 0 };
        this.isControlsVisible = true;
    }
    
    /**
     * 初始化模組
     */
    init() {
        super.init();
        
        // 調整相機位置
        this.camera.position.set(0, 10, 15);
        this.camera.lookAt(0, 0, 0);
        
        if (this.controls) {
            this.controls.target.set(0, 0, 0);
            this.controls.update();
        }
        
        // 創建控制面板
        this.createControlPanel();
        
        // 創建佇列視覺化
        this.createQueue();
        
        // 更新當前操作
        this.updateCurrentOperation("佇列視覺化 - 使用入列和出列按鈕操作佇列");
    }
    
    /**
     * 創建控制面板
     */
    createControlPanel() {
        // 創建控制面板容器
        const panel = document.createElement('div');
        panel.className = 'queue-controls';
        panel.style.position = 'absolute';
        panel.style.bottom = '200px';
        panel.style.left = '50%';
        panel.style.transform = 'translateX(-50%)';
        panel.style.backgroundColor = 'rgba(0,0,0,0.8)';
        panel.style.padding = '15px';
        panel.style.borderRadius = '8px';
        panel.style.display = 'flex';
        panel.style.flexWrap = 'wrap';
        panel.style.maxWidth = '800px';
        panel.style.gap = '10px';
        panel.style.justifyContent = 'center';
        panel.style.zIndex = '100';
        panel.style.border = '1px solid #4CAF50';
        panel.style.cursor = 'move';
        
        // 添加控制選項
        panel.innerHTML = `
            <div class="panel-header" style="width:100%;text-align:center;margin-bottom:10px;cursor:move;padding:5px 0;background-color:#4CAF50;border-radius:4px;">
                <span style="font-weight:bold;">佇列控制面板</span>
            </div>
            <div class="form-group">
                <label for="queueType">佇列類型</label>
                <select id="queueType">
                    <option value="linear">線性佇列</option>
                    <option value="circular">循環佇列</option>
                </select>
            </div>
            <div class="form-group">
                <label for="queueSize">佇列大小</label>
                <input type="number" id="queueSize" value="${this.config.queueSize}" min="4" max="12">
            </div>
            <div class="form-group">
                <label for="queueSpeed">動畫速度</label>
                <select id="queueSpeed">
                    <option value="slow">慢速</option>
                    <option value="medium" selected>中速</option>
                    <option value="fast">快速</option>
                </select>
            </div>
            <div class="form-group">
                <label for="queueOpacitySlider">方塊不透明度</label>
                <input type="range" min="20" max="100" value="${this.config.cubeOpacity * 100}" id="queueOpacitySlider">
                <div id="queueOpacityValue" style="text-align:center">${Math.round(this.config.cubeOpacity * 100)}%</div>
            </div>
            <div class="button-group" style="width:100%;display:flex;justify-content:center;margin-top:10px">
                <button id="enqueueBtn">入列 (Enqueue)</button>
                <button id="dequeueBtn">出列 (Dequeue)</button>
                <button id="resetQueueBtn">重置佇列</button>
            </div>
            <div style="width:100%;text-align:center;margin-top:10px">
                <div style="margin-bottom:10px;">
                    <span id="queueStatusText">佇列狀態: 空</span>
                </div>
                <button id="toggleQueueControls">隱藏控制面板</button>
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
        controlButton.id = 'queueControlButton';
        
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
        // 佇列類型選擇
        const queueTypeSelect = document.getElementById('queueType');
        queueTypeSelect.addEventListener('change', () => {
            if (this.isAnimating) return;
            
            this.config.queueType = queueTypeSelect.value;
            this.resetQueue();
        });
        
        // 佇列大小設置
        const queueSizeInput = document.getElementById('queueSize');
        queueSizeInput.addEventListener('change', () => {
            if (this.isAnimating) return;
            
            const newSize = parseInt(queueSizeInput.value);
            if (newSize >= 4 && newSize <= 12) {
                this.config.queueSize = newSize;
                this.resetQueue();
            } else {
                queueSizeInput.value = this.config.queueSize;
            }
        });
        
        // 動畫速度設置
        const queueSpeedSelect = document.getElementById('queueSpeed');
        queueSpeedSelect.addEventListener('change', () => {
            this.config.speed = queueSpeedSelect.value;
            this.config.animationDuration = this.speedMap[this.config.speed];
        });
        
        // 不透明度滑桿
        const opacitySlider = document.getElementById('queueOpacitySlider');
        opacitySlider.addEventListener('input', () => {
            const opacity = parseInt(opacitySlider.value) / 100;
            this.updateObjectsOpacity(opacity);
        });
        
        // 入列按鈕
        const enqueueBtn = document.getElementById('enqueueBtn');
        enqueueBtn.addEventListener('click', () => {
            if (!this.isAnimating) {
                this.enqueue();
            }
        });
        
        // 出列按鈕
        const dequeueBtn = document.getElementById('dequeueBtn');
        dequeueBtn.addEventListener('click', () => {
            if (!this.isAnimating) {
                this.dequeue();
            }
        });
        
        // 重置按鈕
        const resetQueueBtn = document.getElementById('resetQueueBtn');
        resetQueueBtn.addEventListener('click', () => {
            if (!this.isAnimating) {
                this.resetQueue();
            }
        });
        
        // 顯示/隱藏控制面板按鈕
        const toggleQueueControls = document.getElementById('toggleQueueControls');
        toggleQueueControls.addEventListener('click', () => {
            this.toggleControlPanel();
        });
        
        this.controlButton.addEventListener('click', () => {
            this.toggleControlPanel();
        });
    }
    
    /**
     * 更新物體不透明度
     */
    updateObjectsOpacity(opacity) {
        this.config.cubeOpacity = opacity;
        document.getElementById('queueOpacityValue').textContent = Math.round(opacity * 100) + '%';
        
        // 更新所有方塊的不透明度
        this.cubes.forEach(cube => {
            if (cube && cube.material) {
                cube.material.opacity = opacity;
            }
        });
        
        // 更新指標的不透明度
        if (this.pointers.front && this.pointers.front.material) {
            this.pointers.front.material.opacity = Math.min(1, opacity * 1.5);
        }
        if (this.pointers.rear && this.pointers.rear.material) {
            this.pointers.rear.material.opacity = Math.min(1, opacity * 1.5);
        }
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
     * 創建佇列視覺化
     */
    createQueue() {
        this.clearScene();
        
        // 初始化佇列狀態
        this.queue = Array(this.config.queueSize).fill(null);
        this.front = 0;
        this.rear = -1;
        this.count = 0;
        this.nextValue = 1;
        
        // 創建佇列方塊
        this.createQueueCubes();
        
        // 創建指標
        this.createPointers();
        
        // 添加標題
        const titleText = this.config.queueType === 'linear' ? 
            '線性佇列 (Linear Queue)' : 
            '循環佇列 (Circular Queue)';
        
        const title = this.createTextSprite(titleText, 150);
        title.position.set(0, 5, 0);
        this.scene.add(title);
        this.textSprites.push(title);
        
        // 更新狀態文字
        this.updateQueueStatus();
        
        // 更新公式和程式碼顯示
        this.updateFormulaDisplay();
        this.updateCodeDisplay();
        this.updateMemoryDisplay();
    }
    
    /**
     * 創建佇列方塊
     */
    createQueueCubes() {
        const size = this.config.queueSize;
        const cellSize = this.config.cellSize;
        const cellGap = this.config.cellGap;
        
        // 計算總寬度和偏移
        const totalWidth = size * (cellSize + cellGap);
        const offsetX = -totalWidth / 2 + cellSize / 2;
        
        // 創建方塊和索引標籤
        for (let i = 0; i < size; i++) {
            // 創建方塊
            const geometry = new THREE.BoxGeometry(cellSize, cellSize, cellSize);
            const material = new THREE.MeshPhongMaterial({
                color: this.config.baseColor,
                transparent: true,
                opacity: this.config.cubeOpacity
            });
            
            const cube = new THREE.Mesh(geometry, material);
            cube.position.set(offsetX + i * (cellSize + cellGap), 0, 0);
            this.scene.add(cube);
            this.cubes.push(cube);
            
            // 創建索引標籤
            const indexLabel = this.createTextSprite(i.toString(), 80, "#FFFFFF");
            indexLabel.position.set(cube.position.x, -1.5, 0);
            this.scene.add(indexLabel);
            this.textSprites.push(indexLabel);
            
            // 如果是循環佇列，添加循環箭頭
            if (this.config.queueType === 'circular' && i === size - 1) {
                this.createCircularArrow(offsetX, totalWidth, cellSize);
            }
        }
    }
    
    /**
     * 創建循環箭頭 (用於循環佇列)
     */
    createCircularArrow(offsetX, totalWidth, cellSize) {
        // 圓弧路徑
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(offsetX + totalWidth + cellSize/2, 0, 0),
            new THREE.Vector3(offsetX + totalWidth + cellSize, 1, 1),
            new THREE.Vector3(offsetX + totalWidth/2, 2, 1.5),
            new THREE.Vector3(offsetX - cellSize, 1, 1),
            new THREE.Vector3(offsetX - cellSize/2, 0, 0)
        ]);
        
        // 創建路徑幾何體
        const points = curve.getPoints(50);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        // 創建路徑材質
        const material = new THREE.LineBasicMaterial({
            color: 0x00FFFF,
            linewidth: 3
        });
        
        // 創建路徑線條
        const curveObject = new THREE.Line(geometry, material);
        this.scene.add(curveObject);
        
        // 創建箭頭
        const arrowSize = 0.3;
        const arrowGeometry = new THREE.ConeGeometry(arrowSize, arrowSize * 2, 8);
        const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0x00FFFF });
        const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
        
        // 設置箭頭位置和旋轉
        arrow.position.copy(points[0]);
        arrow.lookAt(points[1]);
        arrow.rotateX(Math.PI / 2);
        
        this.scene.add(arrow);
        
        // 將箭頭添加到追蹤數組
        this.cubes.push(curveObject, arrow);
    }
    
    /**
     * 創建前端和尾端指標
     */
    createPointers() {
        const cellSize = this.config.cellSize;
        const cellGap = this.config.cellGap;
        const totalWidth = this.config.queueSize * (cellSize + cellGap);
        const offsetX = -totalWidth / 2 + cellSize / 2;
        
        // 創建前端指標
        const frontGeometry = new THREE.ConeGeometry(0.3, 0.6, 16);
        const frontMaterial = new THREE.MeshPhongMaterial({
            color: this.config.frontColor,
            transparent: true,
            opacity: this.config.cubeOpacity * 1.5
        });
        
        const frontPointer = new THREE.Mesh(frontGeometry, frontMaterial);
        const frontX = offsetX + this.front * (cellSize + cellGap);
        frontPointer.position.set(frontX, cellSize / 2 + 1, 0);
        frontPointer.rotation.z = -Math.PI / 2; // 旋轉箭頭向下
        this.scene.add(frontPointer);
        this.pointers.front = frontPointer;
        
        // 創建前端文字標籤
        const frontText = this.createTextSprite("Front", 80, "#FF5722");
        frontText.position.set(frontX, cellSize / 2 + 1.8, 0);
        this.scene.add(frontText);
        this.textSprites.push(frontText);
        this.pointers.frontText = frontText;
        
        // 創建尾端指標 (如果有元素)
        if (this.rear >= 0) {
            const rearGeometry = new THREE.ConeGeometry(0.3, 0.6, 16);
            const rearMaterial = new THREE.MeshPhongMaterial({
                color: this.config.rearColor,
                transparent: true,
                opacity: this.config.cubeOpacity * 1.5
            });
            
            const rearPointer = new THREE.Mesh(rearGeometry, rearMaterial);
            const rearX = offsetX + this.rear * (cellSize + cellGap);
            rearPointer.position.set(rearX, -cellSize / 2 - 1, 0);
            rearPointer.rotation.z = Math.PI / 2; // 旋轉箭頭向上
            this.scene.add(rearPointer);
            this.pointers.rear = rearPointer;
            
            // 創建尾端文字標籤
            const rearText = this.createTextSprite("Rear", 80, "#2196F3");
            rearText.position.set(rearX, -cellSize / 2 - 1.8, 0);
            this.scene.add(rearText);
            this.textSprites.push(rearText);
            this.pointers.rearText = rearText;
        }
    }
    
    /**
     * 更新佇列狀態文字
     */
    updateQueueStatus() {
        const statusText = document.getElementById('queueStatusText');
        
        if (this.count === 0) {
            statusText.textContent = '佇列狀態: 空 (Empty)';
        } else if (this.count === this.config.queueSize) {
            statusText.textContent = '佇列狀態: 滿 (Full)';
        } else {
            statusText.textContent = `佇列狀態: ${this.count}/${this.config.queueSize} 元素`;
        }
    }
    
    /**
     * 入列操作
     */
    enqueue() {
        // 檢查佇列是否已滿
        if (this.isFull()) {
            this.updateCurrentOperation("佇列已滿，無法入列 (Queue Full)");
            return;
        }
        
        // 獲取下一個要入列的值
        const value = this.nextValue++;
        
        // 更新尾端指標
        if (this.config.queueType === 'linear') {
            this.rear++;
        } else {
            // 循環佇列
            this.rear = (this.rear + 1) % this.config.queueSize;
        }
        
        // 更新佇列
        this.queue[this.rear] = value;
        this.count++;
        
        // 執行入列動畫
        this.animateEnqueue(value, this.rear);
        
        // 更新狀態顯示
        this.updateQueueStatus();
        this.updateMemoryDisplay();
    }
    
    /**
     * 出列操作
     */
    dequeue() {
        // 檢查佇列是否為空
        if (this.isEmpty()) {
            this.updateCurrentOperation("佇列為空，無法出列 (Queue Empty)");
            return;
        }
        
        // 獲取出列的值
        const value = this.queue[this.front];
        
        // 標記單元格為空
        this.queue[this.front] = null;
        
        // 執行出列動畫
        this.animateDequeue(value, this.front);
        
        // 更新前端指標
        if (this.config.queueType === 'linear') {
            this.front++;
        } else {
            // 循環佇列
            this.front = (this.front + 1) % this.config.queueSize;
        }
        
        // 更新計數
        this.count--;
        
        // 如果佇列變空，重置指標
        if (this.count === 0 && this.config.queueType === 'linear') {
            this.front = 0;
            this.rear = -1;
        }
        
        // 更新狀態顯示
        this.updateQueueStatus();
        this.updateMemoryDisplay();
    }
    
    /**
     * 檢查佇列是否為空
     */
    isEmpty() {
        return this.count === 0;
    }
    
    /**
     * 檢查佇列是否已滿
     */
    isFull() {
        // 線性佇列: rear 達到最大索引
        if (this.config.queueType === 'linear') {
            return this.rear === this.config.queueSize - 1;
        }
        // 循環佇列: 元素數量等於佇列大小
        return this.count === this.config.queueSize;
    }
    
    /**
     * 入列操作動畫
     */
    animateEnqueue(value, rearIndex) {
        this.isAnimating = true;
        
        const cellSize = this.config.cellSize;
        const cellGap = this.config.cellGap;
        const totalWidth = this.config.queueSize * (cellSize + cellGap);
        const offsetX = -totalWidth / 2 + cellSize / 2;
        const targetX = offsetX + rearIndex * (cellSize + cellGap);
        
        // 創建入列的元素
        const geometry = new THREE.BoxGeometry(cellSize, cellSize, cellSize);
        const material = new THREE.MeshPhongMaterial({
            color: this.config.activeColor,
            transparent: true,
            opacity: this.config.cubeOpacity
        });
        
        const newCube = new THREE.Mesh(geometry, material);
        
        // 設置起始位置 (從頂部進入)
        newCube.position.set(targetX, cellSize * 4, 0);
        this.scene.add(newCube);
        
        // 創建數字標籤
        const valueText = this.createTextSprite(value.toString(), 90);
        valueText.position.copy(newCube.position);
        this.scene.add(valueText);
        
        // 創建操作數字標籤
        const operationLabel = this.createTextSprite("↓ " + value.toString(), 100, "#FFEB3B");
        operationLabel.position.set(targetX, cellSize * 5, 0);
        this.scene.add(operationLabel);
        this.numberLabels.push(operationLabel);
        
        this.updateCurrentOperation(`入列 (Enqueue): ${value}`);
        
        // 動畫: 移動到佇列位置
        gsap.to(newCube.position, {
            y: 0,
            duration: this.config.animationDuration,
            ease: "power2.out"
        });
        
        gsap.to(valueText.position, {
            y: 0,
            duration: this.config.animationDuration,
            ease: "power2.out",
            onComplete: () => {
                // 更新佇列中的方塊顏色
                this.cubes[rearIndex].material.color.set(this.config.activeColor);
                
                // 在方塊上顯示數字
                const existingLabel = this.textSprites.find(sprite => 
                    sprite.position.x === this.cubes[rearIndex].position.x && 
                    sprite.position.y === this.cubes[rearIndex].position.y);
                
                if (existingLabel) {
                    this.scene.remove(existingLabel);
                    const index = this.textSprites.indexOf(existingLabel);
                    if (index > -1) this.textSprites.splice(index, 1);
                }
                
                // 添加新的數字標籤
                const newLabel = this.createTextSprite(value.toString(), 90);
                newLabel.position.copy(this.cubes[rearIndex].position);
                this.scene.add(newLabel);
                this.textSprites.push(newLabel);
                
                // 移除臨時方塊和標籤
                this.scene.remove(newCube);
                this.scene.remove(valueText);
                
                // 更新尾端指標位置
                this.updatePointers();
                
                // 短暫高亮顯示後恢復顏色
                setTimeout(() => {
                    this.cubes[rearIndex].material.color.set(this.config.baseColor);
                    
                    // 淡出操作標籤
                    this.fadeOutNumberLabel(operationLabel);
                    
                    this.isAnimating = false;
                }, 1000);
            }
        });
    }
    
    /**
     * 出列操作動畫
     */
    animateDequeue(value, frontIndex) {
        this.isAnimating = true;
        
        // 高亮顯示出列的元素
        this.cubes[frontIndex].material.color.set(this.config.activeColor);
        
        // 創建操作數字標籤
        const cellSize = this.config.cellSize;
        const cellGap = this.config.cellGap;
        const totalWidth = this.config.queueSize * (cellSize + cellGap);
        const offsetX = -totalWidth / 2 + cellSize / 2;
        const targetX = offsetX + frontIndex * (cellSize + cellGap);
        
        const operationLabel = this.createTextSprite(value + " ↓", 100, "#FFEB3B");
        operationLabel.position.set(targetX, -cellSize * 2, 0);
        this.scene.add(operationLabel);
        this.numberLabels.push(operationLabel);
        
        this.updateCurrentOperation(`出列 (Dequeue): ${value}`);
        
        // 創建臨時方塊和標籤用於動畫
        const tempCube = this.cubes[frontIndex].clone();
        this.scene.add(tempCube);
        
        const tempLabel = this.createTextSprite(value.toString(), 90);
        tempLabel.position.copy(tempCube.position);
        this.scene.add(tempLabel);
        
        // 尋找並移除原元素標籤
        const existingLabel = this.textSprites.find(sprite => 
            sprite.position.x === this.cubes[frontIndex].position.x && 
            sprite.position.y === this.cubes[frontIndex].position.y);
        
        if (existingLabel) {
            this.scene.remove(existingLabel);
            const index = this.textSprites.indexOf(existingLabel);
            if (index > -1) this.textSprites.splice(index, 1);
        }
        
        // 將原方塊重置為空
        this.cubes[frontIndex].material.color.set(this.config.baseColor);
        
        // 動畫: 移動元素離開佇列
        gsap.to(tempCube.position, {
            y: -cellSize * 4,
            duration: this.config.animationDuration,
            ease: "power2.in"
        });
        
        gsap.to(tempLabel.position, {
            y: -cellSize * 4,
            duration: this.config.animationDuration,
            ease: "power2.in",
            onComplete: () => {
                // 移除臨時元素
                this.scene.remove(tempCube);
                this.scene.remove(tempLabel);
                
                // 更新指標位置
                this.updatePointers();
                
                // 淡出操作標籤
                this.fadeOutNumberLabel(operationLabel);
                
                this.isAnimating = false;
            }
        });
    }
    
    /**
     * 淡出數字標籤
     */
    fadeOutNumberLabel(label) {
        if (!label || !label.material) return;
        
        gsap.to(label.material, {
            opacity: 0,
            duration: 0.8,
            onComplete: () => {
                this.scene.remove(label);
                const index = this.numberLabels.indexOf(label);
                if (index > -1) {
                    this.numberLabels.splice(index, 1);
                }
            }
        });
    }
    
    /**
     * 更新指標位置
     */
    updatePointers() {
        const cellSize = this.config.cellSize;
        const cellGap = this.config.cellGap;
        const totalWidth = this.config.queueSize * (cellSize + cellGap);
        const offsetX = -totalWidth / 2 + cellSize / 2;
        
        // 移除現有指標
        if (this.pointers.front) this.scene.remove(this.pointers.front);
        if (this.pointers.frontText) this.scene.remove(this.pointers.frontText);
        if (this.pointers.rear) this.scene.remove(this.pointers.rear);
        if (this.pointers.rearText) this.scene.remove(this.pointers.rearText);
        
        // 從文字標籤中移除指標標籤
        this.textSprites = this.textSprites.filter(sprite => 
            sprite !== this.pointers.frontText && sprite !== this.pointers.rearText);
        
        // 重置指標對象
        this.pointers = {
            front: null,
            frontText: null,
            rear: null,
            rearText: null
        };
        
        // 創建前端指標
        const frontGeometry = new THREE.ConeGeometry(0.3, 0.6, 16);
        const frontMaterial = new THREE.MeshPhongMaterial({
            color: this.config.frontColor,
            transparent: true,
            opacity: this.config.cubeOpacity * 1.5
        });
        
        const frontPointer = new THREE.Mesh(frontGeometry, frontMaterial);
        const frontX = offsetX + this.front * (cellSize + cellGap);
        frontPointer.position.set(frontX, cellSize / 2 + 1, 0);
        frontPointer.rotation.z = -Math.PI / 2; // 旋轉箭頭向下
        this.scene.add(frontPointer);
        this.pointers.front = frontPointer;
        
        // 創建前端文字標籤
        const frontText = this.createTextSprite("Front", 80, "#FF5722");
        frontText.position.set(frontX, cellSize / 2 + 1.8, 0);
        this.scene.add(frontText);
        this.textSprites.push(frontText);
        this.pointers.frontText = frontText;
        
        // 創建尾端指標 (如果佇列非空)
        if (this.rear >= 0 && this.count > 0) {
            const rearGeometry = new THREE.ConeGeometry(0.3, 0.6, 16);
            const rearMaterial = new THREE.MeshPhongMaterial({
                color: this.config.rearColor,
                transparent: true,
                opacity: this.config.cubeOpacity * 1.5
            });
            
            const rearPointer = new THREE.Mesh(rearGeometry, rearMaterial);
            const rearX = offsetX + this.rear * (cellSize + cellGap);
            rearPointer.position.set(rearX, -cellSize / 2 - 1, 0);
            rearPointer.rotation.z = Math.PI / 2; // 旋轉箭頭向上
            this.scene.add(rearPointer);
            this.pointers.rear = rearPointer;
            
            // 創建尾端文字標籤
            const rearText = this.createTextSprite("Rear", 80, "#2196F3");
            rearText.position.set(rearX, -cellSize / 2 - 1.8, 0);
            this.scene.add(rearText);
            this.textSprites.push(rearText);
            this.pointers.rearText = rearText;
        }
    }
    
    /**
     * 重置佇列
     */
    resetQueue() {
        // 停止所有動畫
        gsap.killTweensOf(this.scene.children);
        this.isAnimating = false;
        
        // 重置佇列狀態
        this.queue = Array(this.config.queueSize).fill(null);
        this.front = 0;
        this.rear = -1;
        this.count = 0;
        this.nextValue = 1;
        
        // 重新創建視覺化
        this.createQueue();
        
        this.updateCurrentOperation(`佇列已重置 - ${this.config.queueType === 'linear' ? '線性佇列' : '循環佇列'}`);
    }
    
    /**
     * 清除場景
     */
    clearScene() {
        // 移除所有方塊和標籤
        this.cubes.forEach(cube => this.scene.remove(cube));
        this.textSprites.forEach(sprite => this.scene.remove(sprite));
        this.numberLabels.forEach(label => this.scene.remove(label));
        
        // 移除指標
        if (this.pointers.front) this.scene.remove(this.pointers.front);
        if (this.pointers.rear) this.scene.remove(this.pointers.rear);
        
        // 清空追蹤數組
        this.cubes = [];
        this.textSprites = [];
        this.numberLabels = [];
        
        // 清空指標對象
        this.pointers = {
            front: null,
            frontText: null,
            rear: null,
            rearText: null
        };
        
        // 移除所有其他場景物件
        const toRemove = [];
        this.scene.traverse(child => {
            if (!(child instanceof THREE.Camera) && !(child instanceof THREE.Light))
                toRemove.push(child);
        });
        toRemove.forEach(obj => this.scene.remove(obj));
    }
    
    /**
     * 更新公式顯示
     */
    updateFormulaDisplay() {
        // 線性佇列和循環佇列的公式和說明
        let content;
        
        if (this.config.queueType === 'linear') {
            content = `<h3>線性佇列 (Linear Queue)</h3>
                      <div class="formula"><span class="highlight">定義：</span></div>
                      <div>佇列是一種先進先出 (FIFO) 的資料結構。元素從尾端進入，從前端移除。</div><br>
                      
                      <div class="formula"><span class="highlight">線性佇列操作：</span></div>
                      <div>初始狀態：front = 0, rear = -1</div>
                      <div>入列 (Enqueue)：rear++, queue[rear] = element</div>
                      <div>出列 (Dequeue)：element = queue[front], front++</div>
                      <div>佇列為空條件：count == 0</div>
                      <div>佇列已滿條件：rear == size - 1</div><br>
                      
                      <div class="formula"><span class="highlight">線性佇列特點：</span></div>
                      <div>優點：實作簡單、容易理解</div>
                      <div>缺點：假溢位問題，前端元素出列後無法重新利用該空間</div>`;
        } else {
            content = `<h3>循環佇列 (Circular Queue)</h3>
                      <div class="formula"><span class="highlight">定義：</span></div>
                      <div>循環佇列是對線性佇列的改進，通過將隊列的首尾相連，解決了假溢位問題。</div><br>
                      
                      <div class="formula"><span class="highlight">循環佇列操作：</span></div>
                      <div>初始狀態：front = 0, rear = -1, count = 0</div>
                      <div>入列 (Enqueue)：rear = (rear + 1) % size, queue[rear] = element, count++</div>
                      <div>出列 (Dequeue)：element = queue[front], front = (front + 1) % size, count--</div>
                      <div>佇列為空條件：count == 0</div>
                      <div>佇列已滿條件：count == size</div><br>
                      
                      <div class="formula"><span class="highlight">循環佇列特點：</span></div>
                      <div>優點：解決假溢位問題，更有效利用記憶體空間</div>
                      <div>缺點：實作稍複雜，需要額外的計數器或特殊標記判斷佇列空滿狀態</div>`;
        }
        
        if (FloatingWindow.isOpen('formula')) {
            FloatingWindow.update('formula', content);
        }
    }
    
    /**
     * 更新程式碼顯示
     */
    updateCodeDisplay() {
        // 根據佇列類型顯示不同的程式碼
        let code;
        
        if (this.config.queueType === 'linear') {
            code = `// 線性佇列實作
class LinearQueue {
    constructor(size) {
        this.maxSize = size;
        this.queue = new Array(size);
        this.front = 0;      // 前端指標，指向隊首元素
        this.rear = -1;      // 尾端指標，指向隊尾元素
        this.count = 0;      // 元素數量計數器
    }
    
    // 入列操作
    enqueue(element) {
        // 檢查佇列是否已滿
        if (this.rear === this.maxSize - 1) {
            console.log("佇列已滿 (Queue Overflow)");
            return false;
        }
        
        // 將新元素添加到尾端
        this.rear++;
        this.queue[this.rear] = element;
        this.count++;
        return true;
    }
    
    // 出列操作
    dequeue() {
        // 檢查佇列是否為空
        if (this.isEmpty()) {
            console.log("佇列為空 (Queue Underflow)");
            return null;
        }
        
        // 取出前端元素
        const element = this.queue[this.front];
        this.queue[this.front] = null; // 可選：清除引用
        this.front++;
        this.count--;
        
        // 如果佇列變為空，可以重置指標
        if (this.isEmpty()) {
            this.front = 0;
            this.rear = -1;
        }
        
        return element;
    }
    
    // 獲取佇列前端元素但不移除
    peek() {
        if (this.isEmpty()) {
            console.log("佇列為空");
            return null;
        }
        return this.queue[this.front];
    }
    
    // 檢查佇列是否為空
    isEmpty() {
        return this.count === 0;
    }
    
    // 檢查佇列是否已滿
    isFull() {
        return this.rear === this.maxSize - 1;
    }
    
    // 獲取佇列中的元素數量
    size() {
        return this.count;
    }
}`;
        } else {
            code = `// 循環佇列實作
class CircularQueue {
    constructor(size) {
        this.maxSize = size;
        this.queue = new Array(size);
        this.front = 0;      // 前端指標，指向隊首元素
        this.rear = -1;      // 尾端指標，指向隊尾元素
        this.count = 0;      // 元素數量計數器
    }
    
    // 入列操作
    enqueue(element) {
        // 檢查佇列是否已滿
        if (this.isFull()) {
            console.log("佇列已滿 (Queue Overflow)");
            return false;
        }
        
        // 計算新的尾端位置（循環）
        this.rear = (this.rear + 1) % this.maxSize;
        this.queue[this.rear] = element;
        this.count++;
        return true;
    }
    
    // 出列操作
    dequeue() {
        // 檢查佇列是否為空
        if (this.isEmpty()) {
            console.log("佇列為空 (Queue Underflow)");
            return null;
        }
        
        // 取出前端元素
        const element = this.queue[this.front];
        this.queue[this.front] = null; // 可選：清除引用
        
        // 更新前端指標（循環）
        this.front = (this.front + 1) % this.maxSize;
        this.count--;
        
        return element;
    }
    
    // 獲取佇列前端元素但不移除
    peek() {
        if (this.isEmpty()) {
            console.log("佇列為空");
            return null;
        }
        return this.queue[this.front];
    }
    
    // 檢查佇列是否為空
    isEmpty() {
        return this.count === 0;
    }
    
    // 檢查佇列是否已滿
    isFull() {
        return this.count === this.maxSize;
    }
    
    // 獲取佇列中的元素數量
    size() {
        return this.count;
    }
}`;
        }
        
        if (FloatingWindow.isOpen('code')) {
            FloatingWindow.update('code', code);
        }
    }
    
    /**
     * 更新記憶體顯示
     */
    updateMemoryDisplay() {
        // 生成記憶體表格
        let html = `<div class="memory-row">
                      <div class="memory-address">索引</div>
                      <div class="memory-value">值</div>
                      <div class="memory-value">說明</div>
                    </div>`;
        
        // 添加佇列資訊
        html += `<div class="memory-row">
                   <div class="memory-address">front</div>
                   <div class="memory-value">${this.front}</div>
                   <div class="memory-value">前端指標</div>
                 </div>
                 <div class="memory-row">
                   <div class="memory-address">rear</div>
                   <div class="memory-value">${this.rear}</div>
                   <div class="memory-value">尾端指標</div>
                 </div>
                 <div class="memory-row">
                   <div class="memory-address">count</div>
                   <div class="memory-value">${this.count}</div>
                   <div class="memory-value">元素數量</div>
                 </div>
                 <div class="memory-row">
                   <div class="memory-address">maxSize</div>
                   <div class="memory-value">${this.config.queueSize}</div>
                   <div class="memory-value">佇列容量</div>
                 </div>`;
        
        // 添加佇列元素
        html += `<div class="memory-row" style="background-color:#333;font-weight:bold">
                   <div class="memory-address">陣列索引</div>
                   <div class="memory-value">元素值</div>
                   <div class="memory-value">狀態</div>
                 </div>`;
        
        for (let i = 0; i < this.config.queueSize; i++) {
            const value = this.queue[i];
            let status = "";
            
            if (this.count > 0) {
                if (i === this.front) {
                    status = "Front (前端)";
                } else if (i === this.rear) {
                    status = "Rear (尾端)";
                } else if (this.config.queueType === 'linear') {
                    if (i < this.front) {
                        status = "已出列";
                    } else if (i > this.front && i < this.rear && value !== null) {
                        status = "佇列中";
                    } else if (i > this.rear) {
                        status = "未使用";
                    }
                } else { // 循環佇列
                    if (value !== null) {
                        if (this.front <= this.rear) {
                            if (i > this.front && i < this.rear) {
                                status = "佇列中";
                            }
                        } else {
                            if (i > this.front || i < this.rear) {
                                status = "佇列中";
                            }
                        }
                    } else {
                        status = "未使用";
                    }
                }
            } else {
                status = "佇列為空";
            }
            
            // 決定行樣式
            let rowStyle = "";
            if (i === this.front && this.count > 0) {
                rowStyle = "background-color:#552211"; // 前端
            } else if (i === this.rear && this.count > 0) {
                rowStyle = "background-color:#112255"; // 尾端
            }
            
            html += `<div class="memory-row" style="${rowStyle}">
                       <div class="memory-address">${i}</div>
                       <div class="memory-value">${value !== null ? value : '-'}</div>
                       <div class="memory-value">${status}</div>
                     </div>`;
        }
        
        if (FloatingWindow.isOpen('memory')) {
            FloatingWindow.update('memory', html);
        }
    }
    
    /**
     * 切換程式碼視窗顯示
     */
    toggleCode() {
        const code = this.config.queueType === 'linear' ? 
        `// 線性佇列實作
class LinearQueue {
    constructor(size) {
        this.maxSize = size;
        this.queue = new Array(size);
        this.front = 0;      // 前端指標，指向隊首元素
        this.rear = -1;      // 尾端指標，指向隊尾元素
        this.count = 0;      // 元素數量計數器
    }
    
    // 入列操作
    enqueue(element) {
        // 檢查佇列是否已滿
        if (this.rear === this.maxSize - 1) {
            console.log("佇列已滿 (Queue Overflow)");
            return false;
        }
        
        // 將新元素添加到尾端
        this.rear++;
        this.queue[this.rear] = element;
        this.count++;
        return true;
    }
    
    // 出列操作
    dequeue() {
        // 檢查佇列是否為空
        if (this.isEmpty()) {
            console.log("佇列為空 (Queue Underflow)");
            return null;
        }
        
        // 取出前端元素
        const element = this.queue[this.front];
        this.queue[this.front] = null; // 可選：清除引用
        this.front++;
        this.count--;
        
        // 如果佇列變為空，可以重置指標
        if (this.isEmpty()) {
            this.front = 0;
            this.rear = -1;
        }
        
        return element;
    }
    
    // 獲取佇列前端元素但不移除
    peek() {
        if (this.isEmpty()) {
            console.log("佇列為空");
            return null;
        }
        return this.queue[this.front];
    }
    
    // 檢查佇列是否為空
    isEmpty() {
        return this.count === 0;
    }
    
    // 檢查佇列是否已滿
    isFull() {
        return this.rear === this.maxSize - 1;
    }
    
    // 獲取佇列中的元素數量
    size() {
        return this.count;
    }
}` : 
        `// 循環佇列實作
class CircularQueue {
    constructor(size) {
        this.maxSize = size;
        this.queue = new Array(size);
        this.front = 0;      // 前端指標，指向隊首元素
        this.rear = -1;      // 尾端指標，指向隊尾元素
        this.count = 0;      // 元素數量計數器
    }
    
    // 入列操作
    enqueue(element) {
        // 檢查佇列是否已滿
        if (this.isFull()) {
            console.log("佇列已滿 (Queue Overflow)");
            return false;
        }
        
        // 計算新的尾端位置（循環）
        this.rear = (this.rear + 1) % this.maxSize;
        this.queue[this.rear] = element;
        this.count++;
        return true;
    }
    
    // 出列操作
    dequeue() {
        // 檢查佇列是否為空
        if (this.isEmpty()) {
            console.log("佇列為空 (Queue Underflow)");
            return null;
        }
        
        // 取出前端元素
        const element = this.queue[this.front];
        this.queue[this.front] = null; // 可選：清除引用
        
        // 更新前端指標（循環）
        this.front = (this.front + 1) % this.maxSize;
        this.count--;
        
        return element;
    }
    
    // 獲取佇列前端元素但不移除
    peek() {
        if (this.isEmpty()) {
            console.log("佇列為空");
            return null;
        }
        return this.queue[this.front];
    }
    
    // 檢查佇列是否為空
    isEmpty() {
        return this.count === 0;
    }
    
    // 檢查佇列是否已滿
    isFull() {
        return this.count === this.maxSize;
    }
    
    // 獲取佇列中的元素數量
    size() {
        return this.count;
    }
}`;
        
        FloatingWindow.toggle('code', () => code, this.config.queueType === 'linear' ? '線性佇列實作代碼' : '循環佇列實作代碼');
    }
    
    /**
     * 切換記憶體視窗顯示
     */
    toggleMemory() {
        this.updateMemoryDisplay();
        FloatingWindow.toggle('memory', () => document.querySelector('.floating-window-content').innerHTML, '佇列記憶體結構');
    }
    
    /**
     * 切換公式視窗顯示
     */
    toggleFormula() {
        let content;
        
        if (this.config.queueType === 'linear') {
            content = `<h3>線性佇列 (Linear Queue)</h3>
                      <div class="formula"><span class="highlight">定義：</span></div>
                      <div>佇列是一種先進先出 (FIFO) 的資料結構。元素從尾端進入，從前端移除。</div><br>
                      
                      <div class="formula"><span class="highlight">線性佇列操作：</span></div>
                      <div>初始狀態：front = 0, rear = -1</div>
                      <div>入列 (Enqueue)：rear++, queue[rear] = element</div>
                      <div>出列 (Dequeue)：element = queue[front], front++</div>
                      <div>佇列為空條件：count == 0</div>
                      <div>佇列已滿條件：rear == size - 1</div><br>
                      
                      <div class="formula"><span class="highlight">線性佇列特點：</span></div>
                      <div>優點：實作簡單、容易理解</div>
                      <div>缺點：假溢位問題，前端元素出列後無法重新利用該空間</div>`;
        } else {
            content = `<h3>循環佇列 (Circular Queue)</h3>
                      <div class="formula"><span class="highlight">定義：</span></div>
                      <div>循環佇列是對線性佇列的改進，通過將隊列的首尾相連，解決了假溢位問題。</div><br>
                      
                      <div class="formula"><span class="highlight">循環佇列操作：</span></div>
                      <div>初始狀態：front = 0, rear = -1, count = 0</div>
                      <div>入列 (Enqueue)：rear = (rear + 1) % size, queue[rear] = element, count++</div>
                      <div>出列 (Dequeue)：element = queue[front], front = (front + 1) % size, count--</div>
                      <div>佇列為空條件：count == 0</div>
                      <div>佇列已滿條件：count == size</div><br>
                      
                      <div class="formula"><span class="highlight">循環佇列特點：</span></div>
                      <div>優點：解決假溢位問題，更有效利用記憶體空間</div>
                      <div>缺點：實作稍複雜，需要額外的計數器或特殊標記判斷佇列空滿狀態</div>`;
        }
        
        FloatingWindow.toggle('formula', () => content, '佇列理論與公式');
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
     */
    stepForward() {
        if (this.isAnimating) return;
        
        // 執行一個操作
        const randomAction = Math.random() > 0.5;
        if (randomAction && !this.isFull()) {
            this.enqueue();
        } else if (!this.isEmpty()) {
            this.dequeue();
        } else {
            this.updateCurrentOperation("佇列為空，無法出列。嘗試入列操作.");
            this.enqueue();
        }
    }
    
    /**
     * 重置模組
     */
    reset() {
        this.resetQueue();
    }
    
    /**
     * 銷毀模組
     */
    destroy() {
        // 停止所有動畫
        gsap.killTweensOf(this.scene.children);
        
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
    }
};