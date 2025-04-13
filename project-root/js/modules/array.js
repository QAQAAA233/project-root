/**
 * 陣列視覺化模組
 * 展示 2D 和 3D 陣列在記憶體中的儲存方式，包括行優先和列優先模式
 */

// 確保 ModuleClass 只在全局範圍中定義一次
window.ModuleClass = class ArrayModule extends ModuleBase {
    constructor(container) {
        super(container);
        
        // 模組配置
        this.config = {
            dimension: 2,
            startX: 0,
            startY: 0,
            startZ: 0,
            numRows: 3,
            numCols: 4,
            numDepth: 5,
            baseAddress: 1000,
            elementSize: 4,
            animationDuration: 0.5,
            rowColor: 0x4CAF50,
            colColor: 0x2196F3,
            defaultColor: 0xCCCCCC,
            textColor: 0xFFFFFF,
            speed: "medium",
            accessMode: false,
            accessIndices: [],
            storageMode: "rowMajor",
            cubeOpacity: 0.5
        };
        this.speedMap = { slow: 1.0, medium: 0.5, fast: 0.2 };
        
        // 元素追蹤
        this.cubes = [];
        this.textSprites = [];
        this.grid = [];
        this.animationQueue = [];
        this.isAnimating = false;
        this.memoryLayout = [];
        
        // 創建控制面板
        this.controlsPanel = null;
        this.controlButton = null;
        this.panelPosition = { x: 0, y: 0 };
        this.isControlsVisible = true;
        
        // 狀態追蹤
        this.stepping = false;
        this.isProcessingStep = false;
    }
    
    /**
     * 初始化模組
     */
    init() {
        super.init();
        
        // 創建控制面板
        this.createControlPanel();
        
        // 創建陣列網格
        this.createGrid(true);
        
        // 更新公式顯示
        this.updateFormulaDisplay();
        
        // 更新當前操作
        this.updateCurrentOperation("請選擇填充方式：行優先(Row-Major)或列優先(Column-Major)");
    }
    
    /**
     * 創建控制面板
     */
    createControlPanel() {
        // 創建控制面板容器
        const panel = document.createElement('div');
        panel.className = 'array-controls';
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
                <span style="font-weight:bold;">陣列控制面板</span>
            </div>
            <div class="form-group">
                <label for="dimension">陣列維度</label>
                <select id="dimension">
                    <option value="2">二維陣列</option>
                    <option value="3">三維陣列</option>
                </select>
            </div>
            <div class="form-group">
                <label for="startX">起始點 X 座標</label>
                <input type="number" id="startX" value="0" min="-10" max="10">
            </div>
            <div class="form-group">
                <label for="startY">起始點 Y 座標</label>
                <input type="number" id="startY" value="0" min="-10" max="10">
            </div>
            <div class="form-group dim3-inputs" style="display:none">
                <label for="startZ">起始點 Z 座標</label>
                <input type="number" id="startZ" value="0" min="-10" max="10">
            </div>
            <div class="form-group">
                <label for="numRows">列數</label>
                <input type="number" id="numRows" value="3" min="1" max="10">
            </div>
            <div class="form-group">
                <label for="numCols">行數</label>
                <input type="number" id="numCols" value="4" min="1" max="10">
            </div>
            <div class="form-group dim3-inputs" style="display:none">
                <label for="numDepth">深度</label>
                <input type="number" id="numDepth" value="5" min="1" max="10">
            </div>
            <div class="form-group">
                <label for="baseAddress">基礎位址 (L₀)</label>
                <input type="number" id="baseAddress" value="1000" min="0" max="10000">
            </div>
            <div class="form-group">
                <label for="elementSize">元素大小 (d)</label>
                <input type="number" id="elementSize" value="4" min="1" max="8">
            </div>
            <div class="form-group">
                <label for="speed">動畫速度</label>
                <select id="speed">
                    <option value="slow">慢速</option>
                    <option value="medium" selected>中速</option>
                    <option value="fast">快速</option>
                </select>
            </div>
            <div class="button-group" style="width:100%;display:flex;justify-content:center;margin-top:10px">
                <button id="rowMajorBtn">行優先 (Row-Major)</button>
                <button id="colMajorBtn">列優先 (Column-Major)</button>
                <button id="resetBtn">重置</button>
            </div>
            <div class="form-group" style="width:100%;margin-top:10px">
                <label for="accessIndices">訪問指定元素：</label>
                <div id="indicesContainer" style="display:flex;margin-top:5px;justify-content:center;align-items:center">
                    <span>A(</span>
                    <div id="indexDropdowns" style="display:flex;gap:5px"></div>
                    <span>)</span>
                    <button id="accessBtn" style="margin-left:10px">計算位址</button>
                </div>
            </div>
            <div class="form-group" style="width:100%">
                <label for="opacitySlider">方塊不透明度</label>
                <input type="range" min="0" max="100" value="50" id="opacitySlider">
                <div id="opacityValue" style="text-align:center">50%</div>
            </div>
            <div style="width:100%;text-align:center;margin-top:10px">
                <button id="toggleArrayControls">隱藏控制面板</button>
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
        controlButton.id = 'arrayControlButton';
        
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
        const dimensionSelect = document.getElementById('dimension');
        dimensionSelect.addEventListener('change', () => {
            this.config.dimension = parseInt(dimensionSelect.value);
            this.updateDimension3DOptions();
            this.createGrid(false);
        });
        
        ['startX', 'startY', 'startZ', 'numRows', 'numCols', 'numDepth'].forEach(id => {
            const input = document.getElementById(id);
            input.addEventListener('change', () => {
                this.config[id] = parseInt(input.value);
                this.createGrid(false);
            });
        });
        
        const baseAddressInput = document.getElementById('baseAddress');
        baseAddressInput.addEventListener('change', () => {
            this.config.baseAddress = parseInt(baseAddressInput.value);
            this.updateFormulaDisplay();
            this.updateMemoryDisplay();
        });
        
        const elementSizeInput = document.getElementById('elementSize');
        elementSizeInput.addEventListener('change', () => {
            this.config.elementSize = parseInt(elementSizeInput.value);
            this.updateFormulaDisplay();
            this.updateMemoryDisplay();
        });
        
        const speedSelect = document.getElementById('speed');
        speedSelect.addEventListener('change', () => {
            this.config.speed = speedSelect.value;
            this.config.animationDuration = this.speedMap[this.config.speed];
        });
        
        const rowMajorBtn = document.getElementById('rowMajorBtn');
        rowMajorBtn.addEventListener('click', () => this.animateRowMajor());
        
        const colMajorBtn = document.getElementById('colMajorBtn');
        colMajorBtn.addEventListener('click', () => this.animateColMajor());
        
        const resetBtn = document.getElementById('resetBtn');
        resetBtn.addEventListener('click', () => this.resetAnimation());
        
        const accessBtn = document.getElementById('accessBtn');
        accessBtn.addEventListener('click', () => this.calculateAccessAddress());
        
        const opacitySlider = document.getElementById('opacitySlider');
        opacitySlider.addEventListener('input', () => {
            const opacity = parseInt(opacitySlider.value) / 100;
            this.updateCubesOpacity(opacity);
        });
        
        const toggleArrayControls = document.getElementById('toggleArrayControls');
        toggleArrayControls.addEventListener('click', () => {
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
     * 更新 3D 選項顯示
     */
    updateDimension3DOptions() {
        document.querySelectorAll('.dim3-inputs').forEach(option => {
            option.style.display = this.config.dimension === 3 ? 'flex' : 'none';
        });
    }
    
    /**
     * 更新方塊不透明度
     */
    updateCubesOpacity(opacity) {
        this.config.cubeOpacity = opacity;
        document.getElementById('opacityValue').textContent = Math.round(opacity * 100) + '%';
        this.cubes.forEach(cube => {
            if (cube.material) {
                cube.material.opacity = opacity;
            }
        });
    }
    
    /**
     * 清除場景
     */
    clearScene(preserveAxisLabels = true) {
        const axisLabels = this.textSprites.filter(spr => spr.userData && spr.userData.isAxisLabel);
        
        this.cubes.forEach(cube => this.scene.remove(cube));
        this.textSprites.forEach(sprite => {
            if (!preserveAxisLabels || !(sprite.userData && sprite.userData.isAxisLabel))
                this.scene.remove(sprite);
        });
        
        this.textSprites = preserveAxisLabels ? [...axisLabels] : [];
        this.cubes = [];
        this.grid = [];
        this.animationQueue = [];
        this.isAnimating = false;
        
        const toRemove = [];
        this.scene.traverse(child => {
            if (!(child instanceof THREE.Camera) && !(child instanceof THREE.Light) && 
                !(preserveAxisLabels && axisLabels.includes(child)))
                toRemove.push(child);
        });
        
        toRemove.forEach(obj => this.scene.remove(obj));
    }
    
    /**
     * 創建索引下拉選單
     */
    createIndexDropdowns() {
        const container = document.getElementById('indexDropdowns');
        container.innerHTML = '';
        
        const createSelect = (id, start, count) => {
            const select = document.createElement('select');
            select.id = id;
            for (let v = start; v < start + count; v++) {
                const option = document.createElement('option');
                option.value = v;
                option.textContent = v;
                select.appendChild(option);
            }
            return select;
        };
        
        const iSelect = createSelect('indexI', this.config.startX, this.config.numRows);
        container.appendChild(iSelect);
        
        const comma1 = document.createElement('span');
        comma1.textContent = ',';
        container.appendChild(comma1);
        
        const jSelect = createSelect('indexJ', this.config.startY, this.config.numCols);
        container.appendChild(jSelect);
        
        if (this.config.dimension === 3) {
            const comma2 = document.createElement('span');
            comma2.textContent = ',';
            container.appendChild(comma2);
            
            const kSelect = createSelect('indexK', this.config.startZ, this.config.numDepth);
            container.appendChild(kSelect);
        }
        
        container.querySelectorAll('select').forEach(select => {
            select.addEventListener('change', () => this.highlightSelectedCell());
        });
    }
    
    /**
     * 重設單元格外觀
     */
    resetCellsAppearance() {
        this.grid.forEach(layer => {
            layer.forEach(row => {
                row.forEach(cell => {
                    cell.cube.material.color.set(this.config.defaultColor);
                    cell.cube.material.opacity = this.config.cubeOpacity;
                    cell.cube.scale.set(1, 1, 1);
                });
            });
        });
    }
    
    /**
     * 高亮選中的單元格
     */
    highlightSelectedCell() {
        this.resetCellsAppearance();
        
        const i = parseInt(document.getElementById('indexI').value);
        const j = parseInt(document.getElementById('indexJ').value);
        const k = this.config.dimension === 3 ? parseInt(document.getElementById('indexK').value) : 0;
        
        const gridI = i - this.config.startX;
        const gridJ = j - this.config.startY;
        const gridK = this.config.dimension === 3 ? k - this.config.startZ : 0;
        
        if (gridK >= 0 && gridK < this.grid.length &&
            gridI >= 0 && gridI < this.grid[gridK].length &&
            gridJ >= 0 && gridJ < this.grid[gridK][gridI].length) {
            const cell = this.grid[gridK][gridI][gridJ];
            cell.cube.material.color.set(0xFF5722);
            cell.cube.material.opacity = 1.0;
            cell.cube.scale.set(1.2, 1.2, 1.2);
            
            this.updateCurrentOperation(`當前選中：A(${i}, ${j}${this.config.dimension === 3 ? `, ${k}` : ''})`);
        }
    }
    
    /**
     * 建立陣列網格與記憶體布局
     */
    createGrid(resetCamera = true) {
        const axisLabels = this.textSprites.filter(spr => spr.userData && spr.userData.isAxisLabel);
        this.clearScene(true);
        
        axisLabels.forEach(label => {
            this.scene.add(label);
            this.textSprites.push(label);
        });
        
        const rows = this.config.numRows, cols = this.config.numCols;
        const depth = this.config.dimension === 3 ? this.config.numDepth : 1;
        const cellSize = 1, cellGap = 0.2;
        const totalWidth = cols * (cellSize + cellGap);
        const totalHeight = rows * (cellSize + cellGap);
        const totalDepth = depth * (cellSize + cellGap);
        const offsetX = -totalWidth / 2 + cellSize / 2;
        const offsetY = totalHeight / 2 - cellSize / 2;
        const offsetZ = -totalDepth / 2 + cellSize / 2;
        
        this.memoryLayout = Array(rows * cols * depth).fill().map(() => ({ value: "A(?,?)", active: false }));
        this.grid = [];
        
        for (let z = 0; z < depth; z++) {
            this.grid[z] = [];
            for (let i = 0; i < rows; i++) {
                this.grid[z][i] = [];
                for (let j = 0; j < cols; j++) {
                    const cube = new THREE.Mesh(
                        new THREE.BoxGeometry(cellSize, cellSize, cellSize),
                        new THREE.MeshPhongMaterial({
                            color: this.config.defaultColor,
                            transparent: true,
                            opacity: this.config.cubeOpacity
                        })
                    );
                    
                    cube.position.set(
                        offsetX + j * (cellSize + cellGap),
                        offsetY - i * (cellSize + cellGap),
                        offsetZ + z * (cellSize + cellGap)
                    );
                    
                    this.scene.add(cube);
                    this.cubes.push(cube);
                    
                    const actualI = this.config.startX + i;
                    const actualJ = this.config.startY + j;
                    const actualK = this.config.dimension === 3 ? this.config.startZ + z : undefined;
                    const indexLabel = this.config.dimension === 3 ? 
                        `A(${actualI},${actualJ},${actualK})` : `A(${actualI},${actualJ})`;
                    
                    const indexSprite = this.createTextSprite(indexLabel, 18);
                    indexSprite.position.copy(cube.position);
                    indexSprite.position.y += 0.1;
                    this.scene.add(indexSprite);
                    this.textSprites.push(indexSprite);
                    
                    this.grid[z][i][j] = { 
                        cube, 
                        text: indexSprite, 
                        i: actualI, 
                        j: actualJ, 
                        k: actualK, 
                        memoryIndex: -1 
                    };
                }
            }
        }
        
        this.scene.add(new THREE.AxesHelper(Math.max(totalWidth, totalHeight, totalDepth) * 1.5));
        
        if (!axisLabels.some(l => l.userData.axisType === 'x')) {
            const xLabel = this.createTextSprite("行 (Row)", 70, "red");
            xLabel.position.set(totalWidth / 2 + 2.5, 0, 0);
            xLabel.userData = { isAxisLabel: true, axisType: 'x' };
            this.scene.add(xLabel);
            this.textSprites.push(xLabel);
        }
        
        if (!axisLabels.some(l => l.userData.axisType === 'y')) {
            const yLabel = this.createTextSprite("列 (Column)", 70, "yellow");
            yLabel.position.set(0, totalHeight / 2 + 1, 0);
            yLabel.userData = { isAxisLabel: true, axisType: 'y' };
            this.scene.add(yLabel);
            this.textSprites.push(yLabel);
        }
        
        if (this.config.dimension === 3 && !axisLabels.some(l => l.userData.axisType === 'z')) {
            const zLabel = this.createTextSprite("深度 (Depth)", 70, "cyan");
            zLabel.position.set(0, 0, totalDepth / 2 + 1.5);
            zLabel.userData = { isAxisLabel: true, axisType: 'z' };
            this.scene.add(zLabel);
            this.textSprites.push(zLabel);
        }
        
        axisLabels.forEach(label => {
            if (label.userData.axisType === 'x') label.position.set(totalWidth / 2 + 2.5, 0, 0);
            else if (label.userData.axisType === 'y') label.position.set(0, totalHeight / 2 + 1, 0);
            else if (label.userData.axisType === 'z' && this.config.dimension === 3) 
                label.position.set(0, 0, totalDepth / 2 + 1.5);
        });
        
        const titleText = this.config.dimension === 3
            ? `3D陣列 - ${this.config.numRows}行×${this.config.numCols}列×${this.config.numDepth}深度`
            : `2D陣列 - ${this.config.numRows}行×${this.config.numCols}列`;
            
        const title = this.createTextSprite(titleText, 180);
        title.position.set(0, totalHeight / 2 + 3, 0);
        this.scene.add(title);
        this.textSprites.push(title);
        
        if (resetCamera) {
            const maxDimension = Math.max(totalWidth, totalHeight, totalDepth) * 1.5;
            this.camera.position.set(maxDimension * 1.5, maxDimension, maxDimension * 1.5);
            this.camera.lookAt(0, 0, 0);
            
            if (this.controls) {
                this.controls.target.set(0, 0, 0);
                this.controls.update();
            }
        }
        
        this.updateMemoryDisplay();
        this.updateFormulaDisplay();
        this.config.accessMode = false;
        this.config.accessIndices = [];
        this.createIndexDropdowns();
    }
    
    /**
     * 處理動畫佇列
     */
    processAnimationQueue() {
        if (!this.animationQueue.length || this.isAnimating) return;
        
        this.isAnimating = true;
        const { z, i, j, index, memoryIndex, color } = this.animationQueue.shift();
        const cell = this.grid[z][i][j];
        
        gsap.to(cell.cube.material, { 
            opacity: 0.7, 
            duration: this.config.animationDuration, 
            ease: "power2.inOut" 
        });
        
        gsap.to(cell.cube.material.color, {
            r: ((color >> 16) & 255) / 255,
            g: ((color >> 8) & 255) / 255,
            b: (color & 255) / 255,
            duration: this.config.animationDuration,
            ease: "power2.inOut"
        });
        
        gsap.to(cell.cube.scale, {
            x: 1.2, y: 1.2, z: 1.2, 
            duration: this.config.animationDuration / 2, 
            ease: "power2.out",
            onComplete: () => {
                gsap.to(cell.cube.scale, { 
                    x: 1, y: 1, z: 1, 
                    duration: this.config.animationDuration / 2, 
                    ease: "power2.in" 
                });
            }
        });
        
        const orderSprite = this.createTextSprite((index + 1).toString(), 100, "#FFEB3B");
        orderSprite.userData = { isAnimationNumber: true };
        orderSprite.position.copy(cell.cube.position);
        
        const direction = new THREE.Vector3().subVectors(this.camera.position, cell.cube.position).normalize();
        orderSprite.position.add(direction.multiplyScalar(0.15));
        this.scene.add(orderSprite);
        this.textSprites.push(orderSprite);
        
        gsap.from(orderSprite.scale, { 
            x: 0, y: 0, 
            duration: this.config.animationDuration, 
            ease: "back.out" 
        });
        
        cell.memoryIndex = memoryIndex;
        
        if (memoryIndex !== undefined) {
            const elementId = this.config.dimension === 3 ? 
                `A(${cell.i},${cell.j},${cell.k})` : `A(${cell.i},${cell.j})`;
                
            this.memoryLayout[memoryIndex] = { value: elementId, active: true };
            this.updateMemoryDisplay();
            
            setTimeout(() => {
                this.memoryLayout[memoryIndex].active = false;
                this.updateMemoryDisplay();
            }, this.config.animationDuration * 800);
        }
        
        const positionInfo = this.config.dimension === 3 ? 
            `[${cell.i}, ${cell.j}, ${cell.k}]` : `[${cell.i}, ${cell.j}]`;
            
        this.updateCurrentOperation(`正在填充: ${positionInfo} - 順序: ${index + 1}` + 
            (memoryIndex !== undefined ? ` - 記憶體位置: ${this.config.baseAddress + memoryIndex * this.config.elementSize}` : ''));
        
        const animationDuration = this.stepping ? 0 : this.config.animationDuration * 1000;
        
        setTimeout(() => {
            this.isAnimating = false;
            this.isProcessingStep = false;
            
            if (!this.stepping || (this.stepping && this.animationQueue.length > 0)) {
                this.processAnimationQueue();
            }
            
            if (!this.animationQueue.length) {
                this.updateCurrentOperation('填充完成 - 可使用滑鼠旋轉查看或計算特定元素位址');
            }
        }, animationDuration);
    }
    
    /**
     * 更新記憶體顯示
     */
    updateMemoryDisplay() {
        if (!this.memoryLayout.length) return;
        
        let html = `<div class="memory-row">
                      <div class="memory-address">記憶體位址</div>
                      <div class="memory-value" style="width:auto;">值 (儲存內容)</div>
                    </div>`;
                    
        this.memoryLayout.forEach((mem, i) => {
            const memAddr = this.config.baseAddress + i * this.config.elementSize;
            html += `<div class="memory-row">
                       <div class="memory-address">${memAddr}</div>
                       <div class="memory-value ${mem.active ? 'active' : ''}" style="width:auto;">${mem.value}</div>
                     </div>`;
        });
        
        if (FloatingWindow.isOpen('memory')) {
            FloatingWindow.update('memory', html);
        }
    }
    
    /**
     * 更新公式顯示
     */
    updateFormulaDisplay() {
        let html = '';
        
        if (this.config.dimension === 2) {
            html += `<div>二維陣列: A[${this.config.startX}...${this.config.startX + this.config.numRows - 1}, ${this.config.startY}...${this.config.startY + this.config.numCols - 1}]</div>
                     <div>列數: ${this.config.numRows}, 行數: ${this.config.numCols}</div>
                     <div>基礎位址(L₀): ${this.config.baseAddress}</div>
                     <div>元素大小(d): ${this.config.elementSize} bytes</div><br>`;
                     
            if (this.config.storageMode === 'rowMajor') {
                html += `<div class="formula"><span class="highlight">行優先(Row-Major):</span></div>
                         <div class="formula">A(i, j) = L₀ + [(i - ${this.config.startX}) * ${this.config.numCols} + (j - ${this.config.startY})] * d</div>`;
            } else {
                html += `<div class="formula"><span class="highlight">列優先(Column-Major):</span></div>
                         <div class="formula">A(i, j) = L₀ + [(j - ${this.config.startY}) * ${this.config.numRows} + (i - ${this.config.startX})] * d</div>`;
            }
        } else {
            html += `<div>三維陣列: A[${this.config.startX}...${this.config.startX + this.config.numRows - 1}, ${this.config.startY}...${this.config.startY + this.config.numCols - 1}, ${this.config.startZ}...${this.config.startZ + this.config.numDepth - 1}]</div>
                     <div>列數: ${this.config.numRows}, 行數: ${this.config.numCols}, 深度: ${this.config.numDepth}</div>
                     <div>基礎位址(L₀): ${this.config.baseAddress}</div>
                     <div>元素大小(d): ${this.config.elementSize} bytes</div><br>`;
                     
            if (this.config.storageMode === 'rowMajor') {
                html += `<div class="formula"><span class="highlight">行優先(Row-Major):</span></div>
                         <div class="formula">A(i, j, k) = L₀ + [(i - ${this.config.startX}) * ${this.config.numCols} * ${this.config.numDepth} + (j - ${this.config.startY}) * ${this.config.numDepth} + (k - ${this.config.startZ})] * d</div>`;
            } else {
                html += `<div class="formula"><span class="highlight">列優先(Column-Major):</span></div>
                         <div class="formula">A(i, j, k) = L₀ + [(k - ${this.config.startZ}) * ${this.config.numRows} * ${this.config.numCols} + (j - ${this.config.startY}) * ${this.config.numRows} + (i - ${this.config.startX})] * d</div>`;
            }
        }
        
        if (FloatingWindow.isOpen('formula')) {
            FloatingWindow.update('formula', html);
        }
    }
    
    /**
     * 計算二維數組地址
     */
    computeAddress2D(i, j) {
        this.updateFormulaDisplay();
        let offset, address;
        let formulaHtml = '';
        
        if (this.config.storageMode === 'rowMajor') {
            offset = (i - this.config.startX) * this.config.numCols + (j - this.config.startY);
            address = this.config.baseAddress + offset * this.config.elementSize;
            formulaHtml = `<br><div class="formula"><span class="highlight">計算 A(${i}, ${j}):</span></div>
                           <div class="formula">= ${this.config.baseAddress} + [(${i} - ${this.config.startX}) * ${this.config.numCols} + (${j} - ${this.config.startY})] * ${this.config.elementSize}</div>
                           <div class="formula">= ${address}</div>`;
        } else {
            offset = (j - this.config.startY) * this.config.numRows + (i - this.config.startX);
            address = this.config.baseAddress + offset * this.config.elementSize;
            formulaHtml = `<br><div class="formula"><span class="highlight">計算 A(${i}, ${j}):</span></div>
                           <div class="formula">= ${this.config.baseAddress} + [(${j} - ${this.config.startY}) * ${this.config.numRows} + (${i} - ${this.config.startX})] * ${this.config.elementSize}</div>
                           <div class="formula">= ${address}</div>`;
        }
        
        this.memoryLayout = this.memoryLayout.map((item, idx) => ({
            value: item.value,
            active: this.config.baseAddress + idx * this.config.elementSize === address
        }));
        
        this.updateMemoryDisplay();
        
        if (FloatingWindow.isOpen('formula')) {
            const currentContent = document.querySelector('.formula-window .floating-window-content').innerHTML;
            FloatingWindow.update('formula', currentContent + formulaHtml);
        }
        
        return address;
    }
    
    /**
     * 計算三維數組地址
     */
    computeAddress3D(i, j, k) {
        this.updateFormulaDisplay();
        let offset, address;
        let formulaHtml = '';
        
        if (this.config.storageMode === 'rowMajor') {
            const depthSize = this.config.numDepth, rowSize = this.config.numCols * depthSize;
            offset = (i - this.config.startX) * rowSize + (j - this.config.startY) * depthSize + (k - this.config.startZ);
            address = this.config.baseAddress + offset * this.config.elementSize;
            formulaHtml = `<br><div class="formula"><span class="highlight">計算 A(${i}, ${j}, ${k}):</span></div>
                           <div class="formula">= ${this.config.baseAddress} + [(${i} - ${this.config.startX}) * ${rowSize} + (${j} - ${this.config.startY}) * ${depthSize} + (${k} - ${this.config.startZ})] * ${this.config.elementSize}</div>
                           <div class="formula">= ${address}</div>`;
        } else {
            const rowSize = this.config.numRows, depthSize = rowSize * this.config.numCols;
            offset = (k - this.config.startZ) * depthSize + (j - this.config.startY) * rowSize + (i - this.config.startX);
            address = this.config.baseAddress + offset * this.config.elementSize;
            formulaHtml = `<br><div class="formula"><span class="highlight">計算 A(${i}, ${j}, ${k}):</span></div>
                           <div class="formula">= ${this.config.baseAddress} + [(${k} - ${this.config.startZ}) * ${depthSize} + (${j} - ${this.config.startY}) * ${rowSize} + (${i} - ${this.config.startX})] * ${this.config.elementSize}</div>
                           <div class="formula">= ${address}</div>`;
        }
        
        this.memoryLayout = this.memoryLayout.map((item, idx) => ({
            value: item.value,
            active: this.config.baseAddress + idx * this.config.elementSize === address
        }));
        
        this.updateMemoryDisplay();
        
        if (FloatingWindow.isOpen('formula')) {
            const currentContent = document.querySelector('.formula-window .floating-window-content').innerHTML;
            FloatingWindow.update('formula', currentContent + formulaHtml);
        }
        
        return address;
    }
    
    /**
     * 行優先動畫
     */
    animateRowMajor() {
        this.createGrid(false);
        this.resetAnimation();
        this.config.storageMode = 'rowMajor';
        this.updateFormulaDisplay();
        
        const rows = this.config.numRows, cols = this.config.numCols;
        const depth = this.config.dimension === 3 ? this.config.numDepth : 1;
        let index = 0;
        
        for (let z = 0; z < depth; z++) {
            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    this.animationQueue.push({ 
                        z, i, j, 
                        index, 
                        memoryIndex: index, 
                        color: this.config.rowColor 
                    });
                    index++;
                }
            }
        }
        
        this.updateCurrentOperation('開始行優先(Row-Major)填充...');
        this.processAnimationQueue();
    }
    
    /**
     * 列優先動畫
     */
    animateColMajor() {
        this.createGrid(false);
        this.resetAnimation();
        this.config.storageMode = 'colMajor';
        this.updateFormulaDisplay();
        
        const rows = this.config.numRows, cols = this.config.numCols;
        const depth = this.config.dimension === 3 ? this.config.numDepth : 1;
        let index = 0;
        
        for (let z = 0; z < depth; z++) {
            for (let j = 0; j < cols; j++) {
                for (let i = 0; i < rows; i++) {
                    this.animationQueue.push({ 
                        z, i, j, 
                        index, 
                        memoryIndex: index, 
                        color: this.config.colColor 
                    });
                    index++;
                }
            }
        }
        
        this.updateCurrentOperation('開始列優先(Column-Major)填充...');
        this.processAnimationQueue();
    }
    
    /**
     * 重置動畫
     */
    resetAnimation() {
        gsap.killTweensOf(this.cubes);
        this.textSprites = this.textSprites.filter(sprite => sprite.userData && sprite.userData.isAxisLabel);
        this.animationQueue = [];
        this.isAnimating = false;
        
        this.grid.forEach(layer => {
            layer.forEach(row => {
                row.forEach(cell => {
                    gsap.to(cell.cube.material, { opacity: this.config.cubeOpacity, duration: 0.3 });
                    gsap.to(cell.cube.material.color, {
                        r: ((this.config.defaultColor >> 16) & 255) / 255,
                        g: ((this.config.defaultColor >> 8) & 255) / 255,
                        b: (this.config.defaultColor & 255) / 255,
                        duration: 0.3
                    });
                    gsap.to(cell.cube.scale, { x: 1, y: 1, z: 1, duration: 0.3 });
                    cell.memoryIndex = -1;
                });
            });
        });
        
        const totalElements = this.config.numRows * this.config.numCols * 
            (this.config.dimension === 3 ? this.config.numDepth : 1);
            
        this.memoryLayout = Array(totalElements).fill().map(() => ({ 
            value: "A(?,?)", 
            active: false 
        }));
        
        this.updateMemoryDisplay();
        this.updateCurrentOperation('請選擇填充方式');
    }
    
    /**
     * 計算訪問地址
     */
    calculateAccessAddress() {
        const i = parseInt(document.getElementById('indexI').value);
        const j = parseInt(document.getElementById('indexJ').value);
        const k = this.config.dimension === 3 ? parseInt(document.getElementById('indexK').value) : undefined;
        
        this.updateFormulaDisplay();
        
        if (this.config.dimension === 2) {
            this.config.accessMode = true;
            this.config.accessIndices = [i, j];
            this.computeAddress2D(i, j);
        } else {
            this.config.accessMode = true;
            this.config.accessIndices = [i, j, k];
            this.computeAddress3D(i, j, k);
        }
        
        this.highlightSelectedCell();
    }
    
    /**
     * 切換代碼視窗顯示
     */
    toggleCode() {
        const code = `// 陣列在記憶體中的儲存 (${this.config.dimension}D 陣列)
// 此代碼示範了陣列元素在記憶體中的位址計算

// 假設有一個 ${this.config.numRows}×${this.config.numCols}${this.config.dimension === 3 ? `×${this.config.numDepth}` : ''} 的陣列 A
// 基礎位址 (L₀) = ${this.config.baseAddress}
// 元素大小 (d) = ${this.config.elementSize} bytes

${this.config.storageMode === 'rowMajor' ? 
`// 行優先 (Row-Major) 位址計算:
// 對於二維陣列: A(i,j) = L₀ + [(i - ${this.config.startX}) * ${this.config.numCols} + (j - ${this.config.startY})] * d
// 對於三維陣列: A(i,j,k) = L₀ + [(i - ${this.config.startX}) * ${this.config.numCols} * ${this.config.numDepth} + (j - ${this.config.startY}) * ${this.config.numDepth} + (k - ${this.config.startZ})] * d` :
`// 列優先 (Column-Major) 位址計算:
// 對於二維陣列: A(i,j) = L₀ + [(j - ${this.config.startY}) * ${this.config.numRows} + (i - ${this.config.startX})] * d
// 對於三維陣列: A(i,j,k) = L₀ + [(k - ${this.config.startZ}) * ${this.config.numRows} * ${this.config.numCols} + (j - ${this.config.startY}) * ${this.config.numRows} + (i - ${this.config.startX})] * d`}

// 以下是一個簡單的實現:
int getArrayAddress(${this.config.dimension === 3 ? 'int i, int j, int k' : 'int i, int j'}) {
    int baseAddress = ${this.config.baseAddress};
    int elementSize = ${this.config.elementSize};
    ${this.config.dimension === 3 ? 
        `int numRows = ${this.config.numRows};
    int numCols = ${this.config.numCols};
    int numDepth = ${this.config.numDepth};
    int startX = ${this.config.startX};
    int startY = ${this.config.startY};
    int startZ = ${this.config.startZ};` :
        `int numRows = ${this.config.numRows};
    int numCols = ${this.config.numCols};
    int startX = ${this.config.startX};
    int startY = ${this.config.startY};`}
    
    int offset;
    ${this.config.dimension === 3 ? 
        (this.config.storageMode === 'rowMajor' ? 
            `// 行優先 (3D)
    offset = (i - startX) * numCols * numDepth + (j - startY) * numDepth + (k - startZ);` :
            `// 列優先 (3D)
    offset = (k - startZ) * numRows * numCols + (j - startY) * numRows + (i - startX);`) :
        (this.config.storageMode === 'rowMajor' ? 
            `// 行優先 (2D)
    offset = (i - startX) * numCols + (j - startY);` :
            `// 列優先 (2D)
    offset = (j - startY) * numRows + (i - startX);`)}
    
    return baseAddress + offset * elementSize;
}`;

        FloatingWindow.toggle('code', () => code, '陣列記憶體位址計算');
    }
    
    /**
     * 切換記憶體視窗顯示
     */
    toggleMemory() {
        if (!this.memoryLayout.length) {
            FloatingWindow.createMemory([]);
            return;
        }
        
        let html = `<div class="memory-row">
                      <div class="memory-address">記憶體位址</div>
                      <div class="memory-value" style="width:auto;">值 (儲存內容)</div>
                    </div>`;
                    
        this.memoryLayout.forEach((mem, i) => {
            const memAddr = this.config.baseAddress + i * this.config.elementSize;
            html += `<div class="memory-row">
                       <div class="memory-address">${memAddr}</div>
                       <div class="memory-value ${mem.active ? 'active' : ''}" style="width:auto;">${mem.value}</div>
                     </div>`;
        });
        
        FloatingWindow.toggle('memory', () => html, '記憶體佈局');
    }
    
    /**
     * 切換公式視窗顯示
     */
    toggleFormula() {
        let html = '';
        
        if (this.config.dimension === 2) {
            html += `<div>二維陣列: A[${this.config.startX}...${this.config.startX + this.config.numRows - 1}, ${this.config.startY}...${this.config.startY + this.config.numCols - 1}]</div>
                     <div>列數: ${this.config.numRows}, 行數: ${this.config.numCols}</div>
                     <div>基礎位址(L₀): ${this.config.baseAddress}</div>
                     <div>元素大小(d): ${this.config.elementSize} bytes</div><br>`;
                     
            if (this.config.storageMode === 'rowMajor') {
                html += `<div class="formula"><span class="highlight">行優先(Row-Major):</span></div>
                         <div class="formula">A(i, j) = L₀ + [(i - ${this.config.startX}) * ${this.config.numCols} + (j - ${this.config.startY})] * d</div>`;
            } else {
                html += `<div class="formula"><span class="highlight">列優先(Column-Major):</span></div>
                         <div class="formula">A(i, j) = L₀ + [(j - ${this.config.startY}) * ${this.config.numRows} + (i - ${this.config.startX})] * d</div>`;
            }
        } else {
            html += `<div>三維陣列: A[${this.config.startX}...${this.config.startX + this.config.numRows - 1}, ${this.config.startY}...${this.config.startY + this.config.numCols - 1}, ${this.config.startZ}...${this.config.startZ + this.config.numDepth - 1}]</div>
                     <div>列數: ${this.config.numRows}, 行數: ${this.config.numCols}, 深度: ${this.config.numDepth}</div>
                     <div>基礎位址(L₀): ${this.config.baseAddress}</div>
                     <div>元素大小(d): ${this.config.elementSize} bytes</div><br>`;
                     
            if (this.config.storageMode === 'rowMajor') {
                html += `<div class="formula"><span class="highlight">行優先(Row-Major):</span></div>
                         <div class="formula">A(i, j, k) = L₀ + [(i - ${this.config.startX}) * ${this.config.numCols} * ${this.config.numDepth} + (j - ${this.config.startY}) * ${this.config.numDepth} + (k - ${this.config.startZ})] * d</div>`;
            } else {
                html += `<div class="formula"><span class="highlight">列優先(Column-Major):</span></div>
                         <div class="formula">A(i, j, k) = L₀ + [(k - ${this.config.startZ}) * ${this.config.numRows} * ${this.config.numCols} + (j - ${this.config.startY}) * ${this.config.numRows} + (i - ${this.config.startX})] * d</div>`;
            }
        }
        
        FloatingWindow.toggle('formula', () => html, '記憶體位址計算公式');
    }
    
    /**
     * 暫停動畫
     */
    pauseAnimation() {
        this.isAnimationRunning = false;
        
        // 暫停 GSAP 動畫
        gsap.globalTimeline.pause();
    }
    
    /**
     * 繼續動畫
     */
    resumeAnimation() {
        this.isAnimationRunning = true;
        
        // 繼續 GSAP 動畫
        gsap.globalTimeline.play();
    }
    
    /**
     * 單步執行
     * 執行動畫隊列中的下一步
     */
    stepForward() {
        if (this.isProcessingStep) return;
        
        this.stepping = true;
        this.isAnimationRunning = true;
        
        if (!this.animationQueue.length) {
            this.updateCurrentOperation('動畫已完成，請重置或選擇新的填充方式');
            return;
        }
        
        this.isProcessingStep = true;
        this.processAnimationQueue();
    }
    
    /**
     * 重置模組
     */
    reset() {
        this.resetAnimation();
        this.createGrid(true);
        this.updateCurrentOperation('陣列已重置 - 請選擇填充方式');
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
    }
};