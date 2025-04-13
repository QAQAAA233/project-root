/**
 * 河內塔視覺化模組
 * 展示河內塔問題的遞迴解法，並提供互動式操作
 */

// 確保 ModuleClass 只在全局範圍中定義一次
window.ModuleClass = class HanoiModule extends ModuleBase {
    constructor(container) {
        super(container);
        
        // 模組配置
        this.config = {
            diskCount: 3,                 // 初始圓盤數量
            speed: "medium",              // 動畫速度
            animationDuration: 0.5,       // 動畫持續時間
            rodHeight: 8,                 // 柱子高度
            rodRadius: 0.4,               // 柱子半徑
            diskHeight: 0.6,              // 圓盤高度
            maxDiskRadius: 3,             // 最大圓盤半徑
            baseWidth: 20,                // 底座寬度
            baseHeight: 1,                // 底座高度
            baseDepth: 6,                 // 底座深度
            rodSpacing: 7,                // 柱子間距
            snapDistance: 2,              // 吸附距離
            colors: {                     // 顏色配置
                rod: 0x8B4513,            // 柱子顏色
                rodHighlighted: 0xA67D3D, // 柱子高亮顏色
                base: 0x654321,           // 底座顏色
                disk: [                   // 圓盤顏色
                    0xFF5252, 0xFFD740, 0x69F0AE, 0x448AFF, 
                    0xAB47BC, 0xFFA726, 0x66BB6A, 0x42A5F5, 
                    0xEC407A, 0xFF7043
                ],
                diskHighlighted: 0xFFC107 // 高亮圓盤顏色
            },
            cubeOpacity: 0.7              // 物體不透明度
        };
        
        this.speedMap = { slow: 1.0, medium: 0.5, fast: 0.2 };
        
        // 元素追蹤
        this.rods = [];          // 柱子物件
        this.disks = [];         // 圓盤物件
        this.base = null;        // 底座物件
        this.textLabels = [];    // 文字標籤
        this.numberLabels = [];  // 數字標籤特別追蹤
        
        // 遊戲狀態
        this.towers = [[], [], []];   // 三個塔的圓盤狀態
        this.moveQueue = [];          // 移動佇列
        this.moveHistory = [];        // 移動歷史
        this.isAnimating = false;     // 是否正在動畫中
        this.isAutoSolving = false;   // 是否自動解題中
        this.currentStep = 0;         // 當前步驟
        this.totalSteps = 0;          // 總步驟數
        
        // 拖拽相關
        this.isDragging = false;      // 是否正在拖動
        this.dragDisk = null;         // 正在拖動的圓盤
        this.dragStartPosition = null; // 拖動開始位置
        this.dragSourceTower = null;   // 拖動來源塔
        this.hoveredRod = null;        // 當前懸停的柱子
        this.validTargetRods = [];     // 有效的目標柱子
        this.hoverDisk = null;         // 當前懸停的圓盤
        this.controlsEnabled = true;   // 控制器是否啟用
        this.lastMousePosition = { x: 0, y: 0 }; // 上一次鼠標位置
        
        // 創建控制面板相關
        this.controlsPanel = null;
        this.controlButton = null;
        this.panelPosition = { x: 0, y: 0 };
        this.isControlsVisible = true;
        
        // 狀態追蹤
        this.stepping = false;
        this.isProcessingStep = false;
        
        // 射線檢測器
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // 事件處理綁定
        this.onMouseMoveBound = this.onMouseMove.bind(this);
        this.onMouseDownBound = this.onMouseDown.bind(this);
        this.onMouseUpBound = this.onMouseUp.bind(this);
    }
    
    /**
     * 初始化模組
     */
    init() {
        super.init();
        
        // 創建控制面板
        this.createControlPanel();
        
        // 調整相機位置
        this.camera.position.set(0, 12, 18);
        this.camera.lookAt(0, 5, 0);
        
        if (this.controls) {
            this.controls.target.set(0, 5, 0);
            this.controls.update();
        }
        
        // 創建場景物件
        this.createBase();    // 建立底座
        this.createRods();    // 建立柱子
        this.createDisks();   // 建立圓盤
        
        // 設置射線檢測
        this.setupRaycaster();
        
        // 創建柱子半透明的範圍指示器
        this.createRodTargetZones();
        
        // 更新當前操作
        this.updateCurrentOperation("河內塔遊戲 - 使用滑鼠拖動圓盤進行操作");
    }
    
    /**
     * 創建柱子的目標區域視覺指示
     */
    createRodTargetZones() {
        this.targetZones = [];
        const rodPositions = this.getRodPositions();
        
        rodPositions.forEach((pos, index) => {
            // 創建一個較大的圓柱體作為目標區域
            const zoneGeometry = new THREE.CylinderGeometry(
                this.config.rodRadius * 5,  // 更大的半徑
                this.config.rodRadius * 5,
                0.1,  // 非常薄
                32
            );
            
            const zoneMaterial = new THREE.MeshBasicMaterial({
                color: 0x4CAF50,
                transparent: true,
                opacity: 0.0,  // 初始設為完全透明
                depthWrite: false  // 不寫入深度緩衝區
            });
            
            const zone = new THREE.Mesh(zoneGeometry, zoneMaterial);
            zone.position.set(
                pos.x,
                this.config.baseHeight + 0.1,  // 剛好在底座上方
                pos.z
            );
            zone.userData = { rodIndex: index };
            
            this.scene.add(zone);
            this.targetZones.push(zone);
        });
    }
    
    /**
     * 顯示或隱藏目標區域
     */
    showTargetZones(visible) {
        this.targetZones.forEach(zone => {
            zone.material.opacity = visible ? 0.15 : 0.0;
        });
    }
    
    /**
     * 創建控制面板
     */
    createControlPanel() {
        // 創建控制面板容器
        const panel = document.createElement('div');
        panel.className = 'hanoi-controls';
        panel.style.position = 'absolute';
        panel.style.bottom = '80px';
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
                <span style="font-weight:bold;">河內塔控制面板</span>
            </div>
            <div class="form-group">
                <label for="diskCount">圓盤數量</label>
                <input type="number" id="diskCount" value="${this.config.diskCount}" min="1" max="10">
            </div>
            <div class="form-group">
                <label for="hanoiSpeed">動畫速度</label>
                <select id="hanoiSpeed">
                    <option value="slow">慢速</option>
                    <option value="medium" selected>中速</option>
                    <option value="fast">快速</option>
                </select>
            </div>
            <div class="form-group">
                <label for="hanoiOpacitySlider">物體不透明度</label>
                <input type="range" min="20" max="100" value="${this.config.cubeOpacity * 100}" id="hanoiOpacitySlider">
                <div id="hanoiOpacityValue" style="text-align:center">${Math.round(this.config.cubeOpacity * 100)}%</div>
            </div>
            <div style="width:100%;display:flex;justify-content:center;margin-top:10px;">
                <div id="moveCounter" style="margin-bottom:10px;">移動次數: 0 / 最少步數: 0</div>
            </div>
            <div class="button-group" style="width:100%;display:flex;justify-content:center;flex-wrap:wrap;margin-top:10px;">
                <div style="width:100%;display:flex;justify-content:center;margin-bottom:10px;">
                    <button id="solveBtnHanoi">自動解題</button>
                    <button id="stopBtnHanoi">停止</button>
                    <button id="resetBtnHanoi">重置</button>
                </div>
            </div>
            <div style="width:100%;text-align:center;margin-top:10px;">
                <div style="margin-bottom:10px;">操作提示: 滑鼠懸停於柱子上方，點擊後可拖動圓盤</div>
                <button id="toggleHanoiControls">隱藏控制面板</button>
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
        controlButton.id = 'hanoiControlButton';
        
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
        // 圓盤數量變更事件
        const diskCountInput = document.getElementById('diskCount');
        diskCountInput.addEventListener('change', () => {
            const newCount = parseInt(diskCountInput.value);
            if (newCount !== this.config.diskCount && newCount >= 1 && newCount <= 10) {
                this.config.diskCount = newCount;
                this.reset();
            }
        });
        
        // 速度變更事件
        const speedSelect = document.getElementById('hanoiSpeed');
        speedSelect.addEventListener('change', () => {
            this.config.speed = speedSelect.value;
            this.config.animationDuration = this.speedMap[this.config.speed];
        });
        
        // 不透明度滑桿事件
        const opacitySlider = document.getElementById('hanoiOpacitySlider');
        opacitySlider.addEventListener('input', () => {
            const opacity = parseInt(opacitySlider.value) / 100;
            this.updateObjectsOpacity(opacity);
        });
        
        // 解題按鈕事件
        const solveBtn = document.getElementById('solveBtnHanoi');
        solveBtn.addEventListener('click', () => {
            if (!this.isAutoSolving && !this.isAnimating) {
                this.solveTowers();
            }
        });
        
        // 停止按鈕事件
        const stopBtn = document.getElementById('stopBtnHanoi');
        stopBtn.addEventListener('click', () => {
            this.stopAnimation();
        });
        
        // 重置按鈕事件
        const resetBtn = document.getElementById('resetBtnHanoi');
        resetBtn.addEventListener('click', () => {
            this.reset();
        });
        
        // 顯示/隱藏控制面板按鈕事件
        const toggleControlsBtn = document.getElementById('toggleHanoiControls');
        toggleControlsBtn.addEventListener('click', () => {
            this.toggleControlPanel();
        });
        
        this.controlButton.addEventListener('click', () => {
            this.toggleControlPanel();
        });
        
        // 移除舊的事件監聽器，防止重複綁定
        this.renderer.domElement.removeEventListener('mousemove', this.onMouseMoveBound);
        this.renderer.domElement.removeEventListener('mousedown', this.onMouseDownBound);
        this.renderer.domElement.removeEventListener('mouseup', this.onMouseUpBound);
        document.removeEventListener('mouseup', this.onMouseUpBound);
        
        // 綁定滑鼠事件到容器
        this.renderer.domElement.addEventListener('mousemove', this.onMouseMoveBound);
        this.renderer.domElement.addEventListener('mousedown', this.onMouseDownBound);
        // 為了確保拖動後即使滑鼠在畫布外放開也能捕獲事件
        document.addEventListener('mouseup', this.onMouseUpBound);
    }
    
    /**
     * 設置射線檢測
     */
    setupRaycaster() {
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
    }
    
    /**
     * 啟用或禁用軌道控制器
     */
    setControlsEnabled(enabled) {
        if (this.controls) {
            this.controls.enabled = enabled;
            this.controlsEnabled = enabled;
        }
    }
    
    /**
     * 滑鼠移動事件處理
     */
    onMouseMove(event) {
        // 保存上一次鼠標位置
        this.lastMousePosition = { 
            x: event.clientX, 
            y: event.clientY
        };
        
        // 計算鼠標在標準化設備坐標中的位置
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // 更新射線的方向
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // 如果正在拖動，移動圓盤
        if (this.isDragging && this.dragDisk) {
            // 顯示目標區域
            this.showTargetZones(true);
            
            // 計算拖動位置
            const intersects = this.raycaster.intersectObject(this.base);
            
            if (intersects.length > 0) {
                // 獲取交點位置
                const point = intersects[0].point;
                
                // 檢查目標區域
                const targetZoneIntersects = this.raycaster.intersectObjects(this.targetZones);
                if (targetZoneIntersects.length > 0) {
                    // 如果射線與目標區域相交，使用目標區域的位置
                    const zone = targetZoneIntersects[0].object;
                    const rodIndex = zone.userData.rodIndex;
                    const targetX = this.getRodPositions()[rodIndex].x;
                    
                    // 使用更順暢的移動過渡
                    gsap.to(this.dragDisk.position, {
                        x: targetX,
                        duration: 0.1, // 短暫過渡
                        ease: "power1.out"
                    });
                    
                    // 更新懸停狀態
                    this.resetRodHighlights();
                    
                    // 檢查是否可以放置
                    if (this.canPlaceDisk(this.dragSourceTower, rodIndex)) {
                        this.highlightRod(this.rods[rodIndex]);
                        this.hoveredRod = rodIndex;
                    } else {
                        this.hoveredRod = null;
                    }
                } else {
                    // 如果不在目標區域內，允許自由移動
                    // 限制 X 坐標在棋盤範圍內
                    const x = Math.max(
                        Math.min(
                            point.x,
                            this.config.rodSpacing + 2
                        ),
                        -this.config.rodSpacing - 2
                    );
                    
                    // 使用GSAP實現更平滑的跟隨
                    gsap.to(this.dragDisk.position, {
                        x: x,
                        duration: 0.1, // 短暫過渡
                        ease: "power1.out"
                    });
                    
                    // 重置柱子高亮
                    this.resetRodHighlights();
                    this.hoveredRod = null;
                }
            }
        } else {
            // 隱藏目標區域
            this.showTargetZones(false);
            
            // 如果不是拖動，檢查圓盤高亮
            this.checkDiskHover();
        }
    }
    
    /**
     * 檢查圓盤懸停
     */
    checkDiskHover() {
        // 先檢測到圓盤對象
        const diskIntersects = this.raycaster.intersectObjects(this.disks);
        
        // 重置之前的高亮
        if (this.hoverDisk && this.hoverDisk !== this.dragDisk) {
            const originalColor = this.config.colors.disk[this.hoverDisk.userData.size % this.config.colors.disk.length];
            this.hoverDisk.material.color.setHex(originalColor);
            this.hoverDisk.scale.set(1, 1, 1);
            this.hoverDisk = null;
        }
        
        this.resetRodHighlights();
        this.hoveredRod = null;
        
        // 如果點到了圓盤，先檢查是否是頂部圓盤
        if (diskIntersects.length > 0) {
            const hitDisk = diskIntersects[0].object;
            let towerIndex = -1;
            let isTopDisk = false;
            
            // 確定圓盤所在的塔和是否是頂部圓盤
            for (let i = 0; i < this.towers.length; i++) {
                const topIndex = this.towers[i].length - 1;
                if (topIndex >= 0 && this.towers[i][topIndex] === hitDisk) {
                    towerIndex = i;
                    isTopDisk = true;
                    break;
                }
            }
            
            // 如果是頂部圓盤，高亮它
            if (isTopDisk) {
                this.hoveredRod = towerIndex;
                this.hoverDisk = hitDisk;
                
                // 高亮頂部圓盤
                this.highlightDisk(hitDisk);
                
                // 高亮對應的柱子
                this.highlightRod(this.rods[towerIndex]);
                
                // 禁用控制器
                this.setControlsEnabled(false);
                
                return;
            }
        }
        
        // 如果沒有點到頂部圓盤，檢查是否點到了目標區域
        const targetZoneIntersects = this.raycaster.intersectObjects(this.targetZones);
        if (targetZoneIntersects.length > 0) {
            const zone = targetZoneIntersects[0].object;
            const rodIndex = zone.userData.rodIndex;
            
            // 如果該柱子有圓盤
            if (this.towers[rodIndex].length > 0) {
                // 獲取頂部圓盤
                const topDiskIndex = this.towers[rodIndex].length - 1;
                const topDisk = this.towers[rodIndex][topDiskIndex];
                
                // 高亮頂部圓盤
                this.highlightDisk(topDisk);
                this.hoverDisk = topDisk;
                
                // 高亮柱子
                this.highlightRod(this.rods[rodIndex]);
                
                // 記錄懸停柱子
                this.hoveredRod = rodIndex;
                
                // 禁用控制器
                this.setControlsEnabled(false);
            } else {
                // 僅高亮柱子
                this.highlightRod(this.rods[rodIndex]);
                this.hoveredRod = rodIndex;
                
                // 禁用控制器
                this.setControlsEnabled(false);
            }
            return;
        }
        
        // 如果沒有點到目標區域，檢查是否點到了柱子
        const rodIntersects = this.raycaster.intersectObjects(this.rods);
        
        if (rodIntersects.length > 0) {
            const rodIndex = this.rods.indexOf(rodIntersects[0].object);
            
            // 如果該柱子有圓盤
            if (this.towers[rodIndex].length > 0) {
                // 獲取頂部圓盤
                const topDiskIndex = this.towers[rodIndex].length - 1;
                const topDisk = this.towers[rodIndex][topDiskIndex];
                
                // 高亮頂部圓盤
                this.highlightDisk(topDisk);
                this.hoverDisk = topDisk;
                
                // 高亮柱子
                this.highlightRod(this.rods[rodIndex]);
                
                // 記錄懸停柱子
                this.hoveredRod = rodIndex;
                
                // 禁用控制器
                this.setControlsEnabled(false);
            } else {
                // 僅高亮柱子
                this.highlightRod(this.rods[rodIndex]);
                this.hoveredRod = rodIndex;
                
                // 禁用控制器
                this.setControlsEnabled(false);
            }
        } else {
            // 如果沒有點到任何對象，啟用控制器
            this.setControlsEnabled(true);
        }
    }
    
    /**
     * 重置所有高亮效果
     */
    resetAllHighlights() {
        // 重置圓盤高亮
        this.disks.forEach(disk => {
            if (disk.material && disk !== this.dragDisk) {
                const originalColor = this.config.colors.disk[disk.userData.size % this.config.colors.disk.length];
                disk.material.color.setHex(originalColor);
                disk.scale.set(1, 1, 1);
            }
        });
        
        // 重置柱子高亮
        this.resetRodHighlights();
        
        // 清除懸停圓盤引用
        this.hoverDisk = null;
    }
    
    /**
     * 重置柱子高亮效果
     */
    resetRodHighlights() {
        this.rods.forEach(rod => {
            if (rod.material) {
                rod.material.color.setHex(this.config.colors.rod);
                rod.material.opacity = this.config.cubeOpacity;
            }
        });
    }
    
    /**
     * 高亮圓盤
     */
    highlightDisk(disk) {
        if (disk && disk.material) {
            disk.material.color.setHex(this.config.colors.diskHighlighted);
            disk.scale.set(1.1, 1.1, 1.1);
        }
    }
    
    /**
     * 高亮柱子
     */
    highlightRod(rod) {
        if (rod && rod.material) {
            rod.material.color.setHex(this.config.colors.rodHighlighted);
            rod.material.opacity = Math.min(1.0, this.config.cubeOpacity * 1.5);
        }
    }
    
    /**
     * 滑鼠按下事件處理
     */
    onMouseDown(event) {
        // 如果正在動畫或自動解題過程中，忽略點擊
        if (this.isAnimating || this.isAutoSolving) return;
        
        // 如果已經在拖動，也忽略
        if (this.isDragging) return;
        
        // 檢查是否點擊了頂部圓盤
        if (this.hoveredRod !== null && !this.controlsEnabled) {
            // 阻止事件傳播，防止 OrbitControls 接收到事件
            event.stopPropagation();
            
            const towerIndex = this.hoveredRod;
            
            // 如果該柱子有圓盤
            if (this.towers[towerIndex].length > 0) {
                // 獲取頂部圓盤
                const topDiskIndex = this.towers[towerIndex].length - 1;
                this.dragDisk = this.towers[towerIndex][topDiskIndex];
                
                // 儲存開始位置和來源塔
                this.dragStartPosition = this.dragDisk.position.clone();
                this.dragSourceTower = towerIndex;
                
                // 設置拖動狀態
                this.isDragging = true;
                
                // 高亮拖動的圓盤
                this.highlightDisk(this.dragDisk);
                
                // 提高拖動圓盤的位置
                gsap.to(this.dragDisk.position, {
                    y: this.dragDisk.position.y + 3,
                    duration: 0.2,
                    ease: "power1.out"
                });
                
                // 更新提示信息
                this.updateCurrentOperation(`拖動圓盤 ${this.dragDisk.userData.size + 1} 從塔 ${String.fromCharCode(65 + towerIndex)}`);
                
                // 顯示目標區域
                this.showTargetZones(true);
                
                return false; // 阻止默認行為
            }
        }
    }
    
    /**
     * 滑鼠放開事件處理
     */
    onMouseUp(event) {
        // 如果沒有在拖動則忽略
        if (!this.isDragging || !this.dragDisk) {
            // 重新啟用控制器
            this.setControlsEnabled(true);
            return;
        }
        
        const sourceTower = this.dragSourceTower;
        const targetTower = this.hoveredRod;
        
        // 隱藏目標區域
        this.showTargetZones(false);
        
        // 檢查是否放置在有效的目標塔上
        if (targetTower !== null && targetTower !== sourceTower && this.canPlaceDisk(sourceTower, targetTower)) {
            // 移動圓盤到目標塔
            this.moveDiskToTower(sourceTower, targetTower);
        } else {
            // 返回圓盤到原位
            gsap.to(this.dragDisk.position, {
                x: this.dragStartPosition.x,
                y: this.dragStartPosition.y,
                duration: 0.3,
                ease: "power1.out"
            });
            
            // 恢復圓盤顏色和大小
            const originalColor = this.config.colors.disk[this.dragDisk.userData.size % this.config.colors.disk.length];
            gsap.to(this.dragDisk.material.color, {
                r: (originalColor >> 16 & 255) / 255,
                g: (originalColor >> 8 & 255) / 255,
                b: (originalColor & 255) / 255,
                duration: 0.3
            });
            
            gsap.to(this.dragDisk.scale, {
                x: 1, y: 1, z: 1,
                duration: 0.3
            });
            
            // 更新提示信息
            this.updateCurrentOperation(`無法放置圓盤，已返回原位`);
        }
        
        // 重置拖動狀態
        this.isDragging = false;
        this.dragDisk = null;
        this.dragStartPosition = null;
        this.dragSourceTower = null;
        
        // 重置所有高亮
        this.resetAllHighlights();
        
        // 重新啟用控制器
        this.setControlsEnabled(true);
    }
    
    /**
     * 檢查是否可以將圓盤從源塔移動到目標塔
     */
    canPlaceDisk(sourceTower, targetTower) {
        // 如果來源塔為空，則不能移動
        if (this.towers[sourceTower].length === 0) return false;
        
        // 如果目標塔為空，則可以移動
        if (this.towers[targetTower].length === 0) return true;
        
        // 獲取來源塔的頂部圓盤
        const sourceDisk = this.towers[sourceTower][this.towers[sourceTower].length - 1];
        
        // 獲取目標塔的頂部圓盤
        const targetDisk = this.towers[targetTower][this.towers[targetTower].length - 1];
        
        // 如果來源圓盤大小小於目標圓盤大小，則可以移動
        return sourceDisk.userData.size < targetDisk.userData.size;
    }
    
/**
 * 修改 moveDiskToTower 函數，添加淡出並移除舊標籤的功能
 */
moveDiskToTower(sourceTower, targetTower) {
    // 獲取頂部圓盤
    const disk = this.towers[sourceTower].pop();
    
    // 新增到目標塔
    this.towers[targetTower].push(disk);
    
    // 計算目標位置
    const positions = this.getRodPositions();
    const diskHeight = this.config.diskHeight;
    const baseHeight = this.config.baseHeight;
    
    const targetX = positions[targetTower].x;
    const targetY = baseHeight + diskHeight / 2 + (this.towers[targetTower].length - 1) * diskHeight;
    
    // 恢復圓盤顏色和大小
    const originalColor = this.config.colors.disk[disk.userData.size % this.config.colors.disk.length];
    gsap.to(disk.material.color, {
        r: (originalColor >> 16 & 255) / 255,
        g: (originalColor >> 8 & 255) / 255,
        b: (originalColor & 255) / 255,
        duration: 0.3
    });
    
    gsap.to(disk.scale, {
        x: 1, y: 1, z: 1,
        duration: 0.3
    });
    
    // 動畫移動到目標位置
    gsap.to(disk.position, {
        x: targetX,
        y: targetY,
        duration: 0.3,
        ease: "power1.out"
    });
    
    // 記錄移動
    this.moveHistory.push({ from: sourceTower, to: targetTower });
    
    // 將舊標籤淡出並移除
    this.fadeOutOldLabels();
    
    // 添加數字標籤
    const stepNumber = this.moveHistory.length;
    const moveLabel = this.createNumberLabel(stepNumber, disk.position.clone());
    moveLabel.position.y += 1.5; // 稍微提高位置
    
    // 記錄數字標籤
    this.numberLabels.push(moveLabel);
    
    // 設置自動淡出和移除
    this.scheduleRemoveLabel(moveLabel);
    
    // 更新移動計數器
    this.updateMoveCounter();
    
    // 更新提示信息
    this.updateCurrentOperation(`將圓盤 ${disk.userData.size + 1} 從塔 ${String.fromCharCode(65 + sourceTower)} 移到塔 ${String.fromCharCode(65 + targetTower)}`);
    
    // 檢查是否完成
    this.checkCompletion();
}
    
    /**
     * 創建數字標籤（特別追蹤）
     */
    createNumberLabel(number, position) {
        const label = this.createTextSprite(number.toString(), 70, "#FFFF00");
        label.position.copy(position);
        this.scene.add(label);
        return label;
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
     * 更新物體不透明度
     */
    updateObjectsOpacity(opacity) {
        this.config.cubeOpacity = opacity;
        document.getElementById('hanoiOpacityValue').textContent = Math.round(opacity * 100) + '%';
        
        // 更新柱子不透明度
        this.rods.forEach(rod => {
            if (rod.material) {
                rod.material.opacity = Math.min(0.8, opacity);
            }
        });
        
        // 更新圓盤不透明度
        this.disks.forEach(disk => {
            if (disk.material) {
                disk.material.opacity = opacity;
            }
        });
        
        // 更新底座不透明度
        if (this.base && this.base.material) {
            this.base.material.opacity = opacity;
        }
    }
    
    /**
     * 創建底座
     */
    createBase() {
        const baseGeometry = new THREE.BoxGeometry(
            this.config.baseWidth, 
            this.config.baseHeight, 
            this.config.baseDepth
        );
        
        const baseMaterial = new THREE.MeshPhongMaterial({
            color: this.config.colors.base,
            transparent: true,
            opacity: this.config.cubeOpacity
        });
        
        this.base = new THREE.Mesh(baseGeometry, baseMaterial);
        this.base.position.y = this.config.baseHeight / 2;
        
        this.scene.add(this.base);
        
        // 添加底座名稱標籤
        const rodNames = ['A', 'B', 'C'];
        const rodPositions = this.getRodPositions();
        
        rodNames.forEach((name, index) => {
            const textSprite = this.createTextSprite(name, 80, "#FFFFFF");
            textSprite.position.set(
                rodPositions[index].x,
                this.config.baseHeight + 0.1,
                rodPositions[index].z + 2
            );
            
            this.scene.add(textSprite);
            this.textLabels.push(textSprite);
        });
    }
    
    /**
     * 獲取柱子位置
     */
    getRodPositions() {
        const spacing = this.config.rodSpacing;
        return [
            { x: -spacing, z: 0 },  // 左柱
            { x: 0, z: 0 },         // 中柱
            { x: spacing, z: 0 }    // 右柱
        ];
    }
    
    /**
     * 創建柱子
     */
    createRods() {
        const rodPositions = this.getRodPositions();
        
        rodPositions.forEach(pos => {
            const rodGeometry = new THREE.CylinderGeometry(
                this.config.rodRadius,
                this.config.rodRadius,
                this.config.rodHeight,
                32
            );
            
            const rodMaterial = new THREE.MeshPhongMaterial({
                color: this.config.colors.rod,
                transparent: true,
                opacity: Math.min(0.8, this.config.cubeOpacity)
            });
            
            const rod = new THREE.Mesh(rodGeometry, rodMaterial);
            rod.position.set(
                pos.x,
                this.config.rodHeight / 2 + this.config.baseHeight,
                pos.z
            );
            
            this.scene.add(rod);
            this.rods.push(rod);
        });
    }
    
    /**
     * 創建圓盤
     */
    createDisks() {
        // 清除現有圓盤
        this.disks.forEach(disk => {
            this.scene.remove(disk);
        });
        this.disks = [];
        
        // 重置塔狀態
        this.towers = [[], [], []];
        
        // 清除現有數字標籤
        this.clearNumberLabels();
        
        // 獲取最小和最大圓盤半徑
        const minDiskRadius = this.config.maxDiskRadius / this.config.diskCount;
        const diskHeight = this.config.diskHeight;
        
        // 創建圓盤
        for (let i = this.config.diskCount - 1; i >= 0; i--) {
            const diskRadius = minDiskRadius + (this.config.maxDiskRadius - minDiskRadius) * (i / (this.config.diskCount - 1));
            
            const diskGeometry = new THREE.CylinderGeometry(
                diskRadius,
                diskRadius,
                diskHeight,
                32
            );
            
            const diskMaterial = new THREE.MeshPhongMaterial({
                color: this.config.colors.disk[i % this.config.colors.disk.length],
                transparent: true,
                opacity: this.config.cubeOpacity
            });
            
            const disk = new THREE.Mesh(diskGeometry, diskMaterial);
            disk.userData = { size: i };
            
            // 將圓盤添加到場景和第一個塔
            this.scene.add(disk);
            this.disks.push(disk);
            this.towers[0].push(disk);
        }
        
        // 更新圓盤位置
        this.updateDiskPositions();
        
        // 更新移動計數器
        this.updateMoveCounter();
    }
    
    /**
     * 清除數字標籤
     */
    clearNumberLabels() {
        // 從場景中移除所有數字標籤
        this.numberLabels.forEach(label => {
            this.scene.remove(label);
        });
        
        // 清空數組
        this.numberLabels = [];
    }
    
    /**
     * 更新圓盤位置
     */
    updateDiskPositions() {
        const positions = this.getRodPositions();
        const diskHeight = this.config.diskHeight;
        const baseHeight = this.config.baseHeight;
        
        // 遍歷每個塔
        this.towers.forEach((tower, towerIndex) => {
            // 遍歷塔上的每個圓盤
            tower.forEach((disk, diskIndex) => {
                // 設置圓盤位置
                disk.position.x = positions[towerIndex].x;
                disk.position.y = baseHeight + diskHeight / 2 + diskIndex * diskHeight;
                disk.position.z = positions[towerIndex].z;
            });
        });
    }
    
    /**
     * 更新移動計數器
     */
    updateMoveCounter() {
        const minMoves = Math.pow(2, this.config.diskCount) - 1;
        document.getElementById('moveCounter').textContent = `移動次數: ${this.moveHistory.length} / 最少步數: ${minMoves}`;
    }
    
    /**
     * 解決河內塔問題
     */
    solveTowers() {
        // 如果正在動畫中或已經在解題
        if (this.isAnimating || this.isAutoSolving) return;
        
        // 重置遊戲狀態
        this.reset();
        
        // 設置自動解題狀態
        this.isAutoSolving = true;
        
        // 計算移動序列
        this.moveQueue = [];
        this.calculateMoves(this.config.diskCount, 0, 2, 1);
        this.totalSteps = this.moveQueue.length;
        
        // 更新狀態
        this.updateCurrentOperation("開始自動解題...");
        
        // 開始第一步移動
        setTimeout(() => {
            this.processNextMove();
        }, 500);
    }
    
    /**
     * 計算河內塔移動序列 (遞迴算法)
     */
    calculateMoves(n, source, target, auxiliary) {
        if (n === 1) {
            // 移動一個圓盤
            this.moveQueue.push({ from: source, to: target });
            return;
        }
        
        // 將 n-1 個圓盤從 source 移到 auxiliary
        this.calculateMoves(n - 1, source, auxiliary, target);
        
        // 將第 n 個圓盤從 source 移到 target
        this.moveQueue.push({ from: source, to: target });
        
        // 將 n-1 個圓盤從 auxiliary 移到 target
        this.calculateMoves(n - 1, auxiliary, target, source);
    }
    
    /**
     * 處理下一步移動
     */
    processNextMove() {
        if (this.moveQueue.length === 0 || this.isAnimating) return;
        
        // 獲取下一步移動
        const move = this.moveQueue.shift();
        this.currentStep++;
        
        // 執行移動
        this.animateMove(move.from, move.to);
    }
    
/**
 * 修改 animateMove 函數，包含標籤淡出和移除功能
 */
animateMove(fromTower, toTower) {
    this.isAnimating = true;
    
    // 獲取要移動的圓盤
    const disk = this.towers[fromTower].pop();
    this.towers[toTower].push(disk);
    
    // 添加到移動歷史
    this.moveHistory.push({ from: fromTower, to: toTower });
    
    // 記錄目標位置
    const positions = this.getRodPositions();
    const baseHeight = this.config.baseHeight;
    const diskHeight = this.config.diskHeight;
    
    const targetX = positions[toTower].x;
    const targetY = baseHeight + diskHeight / 2 + (this.towers[toTower].length - 1) * diskHeight;
    const targetZ = positions[toTower].z;
    
    // 創建一個高的中間點用於動畫
    const midHeight = Math.max(
        this.config.rodHeight + baseHeight,
        Math.max(
            disk.position.y + 3,
            targetY + 3
        )
    );
    
    // 淡出舊標籤
    this.fadeOutOldLabels();
    
    // 添加數字標籤
    const stepNumber = this.moveHistory.length;
    const moveLabel = this.createNumberLabel(stepNumber, disk.position.clone());
    moveLabel.position.y += 1;
    
    // 保存數字標籤以便追蹤
    this.numberLabels.push(moveLabel);
    
    // 設置自動淡出和移除
    this.scheduleRemoveLabel(moveLabel);
    
    // 更新操作說明
    const towerLabels = ['A', 'B', 'C'];
    this.updateCurrentOperation(`移動 #${stepNumber}: 將圓盤從 ${towerLabels[fromTower]} 移到 ${towerLabels[toTower]}`);
    
    // 更新移動計數器
    this.updateMoveCounter();
    
    // 圓盤突出動畫
    gsap.to(disk.scale, {
        x: 1.2, y: 1.2, z: 1.2,
        duration: this.config.animationDuration * 0.3,
        ease: "power1.out",
        onComplete: () => {
            // 移動到中間高點
            gsap.to(disk.position, {
                y: midHeight,
                duration: this.config.animationDuration * 0.5,
                ease: "power1.inOut",
                onComplete: () => {
                    // 水平移動
                    gsap.to(disk.position, {
                        x: targetX,
                        duration: this.config.animationDuration * 0.5,
                        ease: "power1.inOut",
                        onComplete: () => {
                            // 移動到目標高度
                            gsap.to(disk.position, {
                                y: targetY,
                                duration: this.config.animationDuration * 0.5,
                                ease: "power1.inOut",
                                onComplete: () => {
                                    // 恢復原始大小
                                    gsap.to(disk.scale, {
                                        x: 1, y: 1, z: 1,
                                        duration: this.config.animationDuration * 0.3,
                                        ease: "power1.in",
                                        onComplete: () => {
                                            // 結束動畫
                                            setTimeout(() => {
                                                this.isAnimating = false;
                                                this.isProcessingStep = false;
                                                
                                                // 檢查是否完成解題
                                                this.checkCompletion();
                                                
                                                // 如果在自動解題中，繼續下一步
                                                if (this.isAutoSolving && this.moveQueue.length > 0 && !this.stepping) {
                                                    this.processNextMove();
                                                }
                                            }, 300);
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
    
    // 更新數字標籤位置
    gsap.to(moveLabel.position, {
        y: midHeight + 1,
        duration: this.config.animationDuration * 0.5,
        ease: "power1.inOut",
        onComplete: () => {
            gsap.to(moveLabel.position, {
                x: targetX,
                duration: this.config.animationDuration * 0.5,
                ease: "power1.inOut",
                onComplete: () => {
                    gsap.to(moveLabel.position, {
                        y: targetY + 1,
                        duration: this.config.animationDuration * 0.5,
                        ease: "power1.inOut"
                    });
                }
            });
        }
    });
}

/**
 * 添加新函數：淡出舊標籤
 */
fadeOutOldLabels() {
    // 最多保留最新的一個標籤
    const labelsToFade = this.numberLabels.slice(0, -1);
    
    labelsToFade.forEach(label => {
        // 使用 GSAP 淡出效果
        gsap.to(label.material, {
            opacity: 0,
            duration: 0.5,
            onComplete: () => {
                // 從場景和陣列中移除
                this.scene.remove(label);
                const index = this.numberLabels.indexOf(label);
                if (index > -1) {
                    this.numberLabels.splice(index, 1);
                }
            }
        });
    });
}

/**
 * 添加新函數：設置標籤自動淡出和移除
 */
scheduleRemoveLabel(label) {
    // 設置延時，讓標籤在出現後一段時間自動淡出
    const fadeDelay = this.isAutoSolving ? 1 : 3; // 自動解題時更快淡出
    
    setTimeout(() => {
        // 確保標籤仍然在場景中
        if (this.numberLabels.includes(label)) {
            // 淡出效果
            gsap.to(label.material, {
                opacity: 0,
                duration: 0.8,
                onComplete: () => {
                    // 從場景和陣列中移除
                    this.scene.remove(label);
                    const index = this.numberLabels.indexOf(label);
                    if (index > -1) {
                        this.numberLabels.splice(index, 1);
                    }
                }
            });
        }
    }, fadeDelay * 1000);
}
    
    /**
     * 檢查是否完成解題
     */
    checkCompletion() {
        // 檢查是否所有圓盤都移到了第三個塔
        if (this.towers[2].length === this.config.diskCount) {
            // 檢查順序是否正確
            const isOrdered = this.towers[2].every((disk, index) => {
                return disk.userData.size === this.config.diskCount - 1 - index;
            });
            
            if (isOrdered) {
                this.isAutoSolving = false;
                this.updateCurrentOperation("恭喜！河內塔問題解決成功！");
                
                // 勝利動畫效果
                this.celebrateVictory();
            }
        }
    }
    
    /**
     * 勝利慶祝動畫
     */
    celebrateVictory() {
        // 閃爍圓盤
        this.disks.forEach((disk, index) => {
            gsap.to(disk.material, {
                opacity: 1,
                duration: 0.3,
                delay: index * 0.1,
                yoyo: true,
                repeat: 3
            });
            
            gsap.to(disk.scale, {
                x: 1.1, y: 1.1, z: 1.1,
                duration: 0.3,
                delay: index * 0.1,
                yoyo: true,
                repeat: 3
            });
        });
        
        // 添加勝利文字
        const victoryText = this.createTextSprite("勝利！", 200, "#FFFF00");
        victoryText.position.set(0, 10, 2);
        this.scene.add(victoryText);
        
        // 淡出勝利文字
        gsap.from(victoryText.scale, {
            x: 0, y: 0, z: 0,
            duration: 1,
            ease: "elastic.out(1, 0.3)"
        });
        
        // 一段時間後移除
        setTimeout(() => {
            this.scene.remove(victoryText);
        }, 3000);
    }
    
    /**
     * 停止動畫
     */
    stopAnimation() {
        // 停止自動解題
        this.isAutoSolving = false;
        
        // 清空移動佇列
        this.moveQueue = [];
        
        // 停止 GSAP 動畫
        gsap.globalTimeline.clear();
        
        // 更新圓盤位置
        this.updateDiskPositions();
        
        // 更新狀態
        this.isAnimating = false;
        this.isProcessingStep = false;
        this.isDragging = false;
        this.dragDisk = null;
        
        // 重置所有高亮
        this.resetAllHighlights();
        
        // 重新啟用控制器
        this.setControlsEnabled(true);
        
        // 隱藏目標區域
        this.showTargetZones(false);
        
        this.updateCurrentOperation("動畫已停止");
    }
    
    /**
     * 手動逐步執行
     */
    stepForward() {
        if (this.isProcessingStep || this.isAnimating) return;
        
        // 如果沒有在自動解題中，則開始解題
        if (!this.isAutoSolving || this.moveQueue.length === 0) {
            // 先重置遊戲
            this.reset();
            
            // 計算移動序列
            this.moveQueue = [];
            this.calculateMoves(this.config.diskCount, 0, 2, 1);
            this.totalSteps = this.moveQueue.length;
            
            this.isAutoSolving = true;
            this.stepping = true;
        }
        
        // 處理下一步
        this.isProcessingStep = true;
        this.processNextMove();
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
     * 重置模組
     */
    reset() {
        // 停止動畫和解題
        this.stopAnimation();
        
        // 清除歷史
        this.moveHistory = [];
        this.currentStep = 0;
        
        // 清除數字標籤
        this.clearNumberLabels();
        
        // 重新創建圓盤
        this.createDisks();
        
        // 更新狀態
        this.isAutoSolving = false;
        this.stepping = false;
        this.isDragging = false;
        this.dragDisk = null;
        this.hoveredRod = null;
        
        // 重置所有高亮
        this.resetAllHighlights();
        
        // 重新啟用控制器
        this.setControlsEnabled(true);
        
        // 隱藏目標區域
        this.showTargetZones(false);
        
        this.updateCurrentOperation("河內塔已重置 - 使用滑鼠拖動圓盤進行操作");
    }
    
    /**
     * 切換代碼視窗顯示
     */
    toggleCode() {
        const code = `/**
 * 河內塔問題的遞迴解法
 * 
 * 河內塔是一個經典的遞迴問題：
 * 1. 有三根柱子和N個大小不同的圓盤
 * 2. 初始時所有圓盤都按從大到小的順序排在第一根柱子上
 * 3. 目標是將所有圓盤移動到第三根柱子上，保持從大到小的順序
 * 4. 每次只能移動一個圓盤，且大圓盤不能放在小圓盤上
 */

// 河內塔移動函數
function hanoiTower(n, source, target, auxiliary) {
    // 基本情況：只有一個圓盤時，直接從source移動到target
    if (n === 1) {
        console.log(\`移動圓盤 1 從 \${source} 到 \${target}\`);
        return;
    }
    
    // 遞迴情況：
    // 1. 將n-1個圓盤從source移到auxiliary
    hanoiTower(n - 1, source, auxiliary, target);
    
    // 2. 將第n個圓盤從source移到target
    console.log(\`移動圓盤 \${n} 從 \${source} 到 \${target}\`);
    
    // 3. 將n-1個圓盤從auxiliary移到target
    hanoiTower(n - 1, auxiliary, target, source);
}

// 執行函數 - 將${this.config.diskCount}個圓盤從A柱移動到C柱
hanoiTower(${this.config.diskCount}, 'A', 'C', 'B');

/**
 * 河內塔問題的實際應用：
 * 
 * 1. 演算法教學：遞迴算法的經典案例
 * 2. 問題抽象化：將複雜問題分解為更簡單的子問題
 * 3. 移動策略：最適合解決類似的"整體移動"問題
 * 
 * 時間複雜度：O(2^n)，其中n是圓盤數量
 * 最少移動次數：2^n - 1
 * 
 * ${this.config.diskCount}個圓盤的最少移動次數：${Math.pow(2, this.config.diskCount) - 1}
 */`;

        FloatingWindow.toggle('code', () => code, '河內塔問題的遞迴解法');
    }
    
    /**
     * 切換記憶體視窗顯示
     */
    toggleMemory() {
        // 創建記憶體表示
        const diskStates = this.towers.map((tower, towerIndex) => {
            return tower.map(disk => ({
                size: disk.userData.size + 1,
                originalIndex: disk.userData.size + 1
            }));
        });
        
        let html = `<div class="memory-row">
                      <div class="memory-address">塔柱</div>
                      <div class="memory-value" style="width:auto;">圓盤狀態 (由下至上)</div>
                    </div>`;
                    
        const towerLabels = ['A (左)', 'B (中)', 'C (右)'];
        diskStates.forEach((tower, index) => {
            const disksInfo = tower.length > 0 ? 
                tower.map(disk => `圓盤 ${disk.originalIndex} (大小: ${disk.size})`).join(' → ') :
                '空';
                
            html += `<div class="memory-row">
                       <div class="memory-address">${towerLabels[index]}</div>
                       <div class="memory-value" style="width:auto;">${disksInfo}</div>
                     </div>`;
        });
        
        // 添加遞迴調用堆疊
        if (this.isAutoSolving && this.moveHistory.length > 0) {
            html += `<div style="margin-top:20px;"><h3>遞迴呼叫堆疊</h3></div>`;
            
            // 分析目前執行到的步驟
            const n = this.config.diskCount;
            const step = this.moveHistory.length;
            const totalSteps = Math.pow(2, n) - 1;
            
            // 為每個遞迴層級創建一個呼叫行
            let remaining = totalSteps - step;
            
            for (let i = n; i >= 1; i--) {
                const subProblemSize = Math.pow(2, i) - 1;
                const active = (remaining < subProblemSize);
                
                html += `<div class="memory-row">
                           <div class="memory-address">調用 #${n-i+1}</div>
                           <div class="memory-value ${active ? 'active' : ''}" style="width:auto;">
                             hanoiTower(${i}, ${i === n ? "'A'" : '...'}, ${i === n ? "'C'" : '...'}, ${i === n ? "'B'" : '...'})
                           </div>
                         </div>`;
                
                if (active) break;
                remaining -= subProblemSize;
            }
        }
        
        // 添加移動歷史
        if (this.moveHistory.length > 0) {
            html += `<div style="margin-top:20px;"><h3>移動歷史</h3></div>`;
            
            this.moveHistory.forEach((move, index) => {
                const fromTower = ['A', 'B', 'C'][move.from];
                const toTower = ['A', 'B', 'C'][move.to];
                
                html += `<div class="memory-row">
                           <div class="memory-address">步驟 #${index+1}</div>
                           <div class="memory-value" style="width:auto;">
                             從 ${fromTower} 移到 ${toTower}
                           </div>
                         </div>`;
            });
            
            // 添加剩餘移動佇列
            if (this.moveQueue.length > 0) {
                html += `<div style="margin-top:10px;"><h4>待執行移動</h4></div>`;
                
                this.moveQueue.slice(0, 5).forEach((move, index) => {
                    const fromTower = ['A', 'B', 'C'][move.from];
                    const toTower = ['A', 'B', 'C'][move.to];
                    
                    html += `<div class="memory-row">
                               <div class="memory-address">佇列 #${index+1}</div>
                               <div class="memory-value" style="width:auto;">
                                 從 ${fromTower} 移到 ${toTower}
                               </div>
                             </div>`;
                });
                
                if (this.moveQueue.length > 5) {
                    html += `<div class="memory-row">
                               <div class="memory-address">...</div>
                               <div class="memory-value" style="width:auto;">
                                 還有 ${this.moveQueue.length - 5} 步待執行
                               </div>
                             </div>`;
                }
            }
        }
        
        FloatingWindow.toggle('memory', () => html, '河內塔狀態');
    }
    
    /**
     * 切換公式視窗顯示
     */
    toggleFormula() {
        const n = this.config.diskCount;
        const minMoves = Math.pow(2, n) - 1;
        
        const content = `<h3>河內塔問題</h3>
                         <div>河內塔是一個經典的遞迴問題，三個塔柱分別標記為 A、B、C。</div>
                         <div>初始時所有圓盤都按從大到小順序在柱子 A 上。</div>
                         <div>目標：將所有圓盤移到柱子 C 上，保持相同順序。</div>
                         <div>規則：每次只能移動一個圓盤，且大圓盤不能放在小圓盤上。</div>
                         <br>
                         <div class="formula"><span class="highlight">河內塔問題的數學公式：</span></div>
                         <div class="formula">最少移動次數 = 2<sup>n</sup> - 1</div>
                         <div>其中 n 是圓盤數量</div>
                         <br>
                         <div>當前圓盤數量：${n}</div>
                         <div>當前最少移動次數：${minMoves}</div>
                         <br>
                         <div class="formula"><span class="highlight">遞迴解法：</span></div>
                         <div>把河內塔問題分解為三個子問題：</div>
                         <div>1. 將 n-1 個圓盤從 A 移到 B</div>
                         <div>2. 將第 n 個圓盤從 A 移到 C</div>
                         <div>3. 將 n-1 個圓盤從 B 移到 C</div>
                         <br>
                         <div class="formula"><span class="highlight">時間複雜度：</span></div>
                         <div>T(n) = 2T(n-1) + 1</div>
                         <div>T(1) = 1</div>
                         <div>解得：T(n) = 2<sup>n</sup> - 1 = O(2<sup>n</sup>)</div>
                         <br>
                         <div class="formula"><span class="highlight">有趣的事實：</span></div>
                         <div>傳說中，當所有 64 個圓盤都移動完成，世界就會終結。</div>
                         <div>以每秒移動一個圓盤計算，需要 2<sup>64</sup> - 1 秒，</div>
                         <div>約為 5,850 億年，遠超宇宙目前的年齡！</div>`;
                         
        FloatingWindow.toggle('formula', () => content, '河內塔問題公式與原理');
    }
    
    /**
     * 銷毀模組
     */
    destroy() {
        // 停止解題和動畫
        this.stopAnimation();
        
        // 移除事件監聽器
        this.renderer.domElement.removeEventListener('mousemove', this.onMouseMoveBound);
        this.renderer.domElement.removeEventListener('mousedown', this.onMouseDownBound);
        document.removeEventListener('mouseup', this.onMouseUpBound);
        
        // 移除控制面板
        if (this.controlsPanel && this.controlsPanel.parentNode) {
            this.controlsPanel.parentNode.removeChild(this.controlsPanel);
        }
        
        // 移除控制按鈕
        if (this.controlButton && this.controlButton.parentNode) {
            this.controlButton.parentNode.removeChild(this.controlButton);
        }
        
        // 清除數字標籤
        this.clearNumberLabels();
        
        // 調用父類的銷毀方法
        super.destroy();
    }
};