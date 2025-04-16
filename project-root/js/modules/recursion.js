/**
 * 遞迴視覺化模組
 * 展示遞迴算法的執行過程，包括費氏數列和階乘的遞迴樹結構
 */
window.ModuleClass = class RecursionModule extends ModuleBase {
    constructor(container) {
        super(container);

        // 模組配置
        this.config = {
            recursionType: "fibonacci", // 遞迴類型: fibonacci, factorial
            startValue: 5,              // 起始值
            animationDuration: 0.5,     // 動畫持續時間
            speed: "medium",            // 動畫速度
            nodeRadius: 0.6,            // 節點半徑
            levelHeight: 2.0,           // 層級高度（Y 軸間距）
            nodeSpacing: 2.0,           // 後序排列時的固定間距（葉節點水平間隔）
            nodeColor: 0x4CAF50,        // 節點顏色
            activeColor: 0xFF5722,      // 活動節點顏色
            completedColor: 0x2196F3,   // 完成節點顏色
            lineColor: 0xCCCCCC,        // 連線顏色
            cubeOpacity: 0.7            // 節點不透明度
        };

        this.speedMap = { slow: 1.0, medium: 0.5, fast: 0.2 };

        // 元素追蹤
        this.nodes = [];               // 節點物件（THREE.Mesh）
        this.connections = [];         // 連線物件
        this.labels = [];              // 標籤物件（文字精靈）
        this.numberLabels = [];        // 數字標籤（計算結果的標籤）

        // 遞迴狀態
        this.callTree = null;          // 呼叫樹結構（含 x, y 布局資訊）
        this.callQueue = [];           // 呼叫佇列（後序遍歷序列）
        this.executionStack = [];      // 執行堆疊
        this.currentStep = null;       // 當前步驟索引
        this.isAnimating = false;      // 是否正在動畫中
        this.isAutoSolving = false;    // 是否自動執行中

        // 控制面板相關
        this.controlsPanel = null;
        this.controlButton = null;
        this.panelPosition = { x: 0, y: 0 };
        this.isControlsVisible = true;

        // 狀態追蹤
        this.stepping = false;
        this.isProcessingStep = false;

        // 布局計算用的全局計數器（用在後序排列 assignPositions 中）
        this.nextX = 0;
    }

    /**
     * 初始化模組
     */
    init() {
        super.init();

        // 創建控制面板
        this.createControlPanel();

        // 調整相機位置
        this.camera.position.set(0, 0, 14);
        this.camera.lookAt(0, 0, 0);
        if (this.controls) {
            this.controls.target.set(0, 0, 0);
            this.controls.update();
        }

        // 生成遞迴樹，並依照新佈局方法置中（以頂部節點為中心）
        this.generateRecursionTree();

        this.updateCurrentOperation("遞迴視覺化 - 請選擇遞迴類型和參數");
    }

    /****************************
     * 控制面板與事件（保持原有大部分邏輯）
     ****************************/
    createControlPanel() {
        const panel = document.createElement('div');
        panel.className = 'recursion-controls';
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
        panel.innerHTML = `
            <div class="panel-header" style="width:100%;text-align:center;margin-bottom:10px;cursor:move;padding:5px 0;background-color:#4CAF50;border-radius:4px;">
                <span style="font-weight:bold;">遞迴控制面板</span>
            </div>
            <div class="form-group">
                <label for="recursionType">遞迴類型</label>
                <select id="recursionType">
                    <option value="fibonacci">費氏數列 (Fibonacci)</option>
                    <option value="factorial">階乘 (Factorial)</option>
                </select>
            </div>
            <div class="form-group">
                <label for="startValue">起始值</label>
                <input type="number" id="startValue" value="${this.config.startValue}" min="1" max="10">
            </div>
            <div class="form-group">
                <label for="recursionSpeed">動畫速度</label>
                <select id="recursionSpeed">
                    <option value="slow">慢速</option>
                    <option value="medium" selected>中速</option>
                    <option value="fast">快速</option>
                </select>
            </div>
            <div class="form-group">
                <label for="recursionOpacitySlider">節點不透明度</label>
                <input type="range" min="20" max="100" value="${this.config.cubeOpacity * 100}" id="recursionOpacitySlider">
                <div id="recursionOpacityValue" style="text-align:center">${Math.round(this.config.cubeOpacity * 100)}%</div>
            </div>
            <div class="button-group" style="width:100%;display:flex;justify-content:center;flex-wrap:wrap;margin-top:10px;">
                <div style="width:100%;display:flex;justify-content:center;margin-bottom:10px;">
                    <button id="generateBtn">生成遞迴樹</button>
                    <button id="solveBtn">自動執行</button>
                    <button id="stopBtn">停止</button>
                    <button id="resetBtn">重置</button>
                </div>
            </div>
            <div style="width:100%;text-align:center;margin-top:10px;">
                <button id="toggleRecursionControls">隱藏控制面板</button>
            </div>
        `;
        this.container.appendChild(panel);
        this.controlsPanel = panel;

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
        controlButton.id = 'recursionControlButton';
        this.container.appendChild(controlButton);
        this.controlButton = controlButton;

        this.bindEvents();
        this.makePanelDraggable();
    }

    bindEvents() {
        const recursionTypeSelect = document.getElementById('recursionType');
        recursionTypeSelect.addEventListener('change', () => {
            this.config.recursionType = recursionTypeSelect.value;
            this.updateFormulaDisplay();
            this.updateCodeDisplay();
        });
        const startValueInput = document.getElementById('startValue');
        startValueInput.addEventListener('change', () => {
            const newValue = parseInt(startValueInput.value);
            if (newValue !== this.config.startValue && newValue >= 1 && newValue <= 10) {
                this.config.startValue = newValue;
            }
        });
        const speedSelect = document.getElementById('recursionSpeed');
        speedSelect.addEventListener('change', () => {
            this.config.speed = speedSelect.value;
            this.config.animationDuration = this.speedMap[this.config.speed];
        });
        const opacitySlider = document.getElementById('recursionOpacitySlider');
        opacitySlider.addEventListener('input', () => {
            const opacity = parseInt(opacitySlider.value) / 100;
            this.updateNodesOpacity(opacity);
        });
        document.getElementById('generateBtn').addEventListener('click', () => { this.generateRecursionTree(); });
        document.getElementById('solveBtn').addEventListener('click', () => {
            if (!this.isAutoSolving && !this.isAnimating) { this.startAutoExecution(); }
        });
        document.getElementById('stopBtn').addEventListener('click', () => { this.stopAnimation(); });
        document.getElementById('resetBtn').addEventListener('click', () => { this.reset(); });
        document.getElementById('toggleRecursionControls').addEventListener('click', () => { this.toggleControlPanel(); });
        this.controlButton.addEventListener('click', () => { this.toggleControlPanel(); });
    }

    toggleControlPanel() {
        if (this.isControlsVisible) {
            const rect = this.controlsPanel.getBoundingClientRect();
            this.panelPosition = { x: rect.left, y: rect.top };
            this.controlsPanel.style.display = 'none';
            this.controlButton.style.display = 'block';
            this.isControlsVisible = false;
        } else {
            this.controlsPanel.style.position = 'absolute';
            this.controlsPanel.style.left = `${this.panelPosition.x}px`;
            this.controlsPanel.style.top = `${this.panelPosition.y}px`;
            this.controlsPanel.style.bottom = 'auto';
            this.controlsPanel.style.transform = 'none';
            this.controlsPanel.style.display = 'flex';
            this.controlButton.style.display = 'none';
            this.isControlsVisible = true;
        }
    }

    makePanelDraggable() {
        let isDragging = false, offsetX = 0, offsetY = 0;
        const handle = this.controlsPanel.querySelector('.panel-header');
        handle.addEventListener('mousedown', (e) => {
            isDragging = true;
            const rect = this.controlsPanel.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            e.preventDefault();
        });
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            this.controlsPanel.style.left = `${e.clientX - offsetX}px`;
            this.controlsPanel.style.top = `${e.clientY - offsetY}px`;
            this.controlsPanel.style.bottom = 'auto';
            this.controlsPanel.style.transform = 'none';
        });
        document.addEventListener('mouseup', () => {
            isDragging = false;
            if (this.isControlsVisible) {
                const rect = this.controlsPanel.getBoundingClientRect();
                this.panelPosition = { x: rect.left, y: rect.top };
            }
        });
    }

    updateNodesOpacity(opacity) {
        this.config.cubeOpacity = opacity;
        document.getElementById('recursionOpacityValue').textContent = Math.round(opacity * 100) + '%';
        this.nodes.forEach(node => {
            if (node.material) { node.material.opacity = opacity; }
        });
    }

    clearScene() {
        this.nodes.forEach(node => this.scene.remove(node));
        this.nodes = [];
        this.connections.forEach(line => this.scene.remove(line));
        this.connections = [];
        this.labels.forEach(label => this.scene.remove(label));
        this.labels = [];
        this.numberLabels.forEach(label => this.scene.remove(label));
        this.numberLabels = [];
        this.callTree = null;
        this.callQueue = [];
        this.executionStack = [];
        this.currentStep = null;
    }

    /******************************************************************
     * 佈局部分：利用後序遍歷排列法分配 x, y 座標
     * 若節點為葉節點，x 為全域計數器 this.nextX，並增加固定間距（config.nodeSpacing）
     * 若有子節點，遞迴排列後，將父節點 x 設為最左與最右子節點 x 的平均值，
     * y 根據深度乘以 levelHeight 設定
     ******************************************************************/
    assignPositions(node, depth) {
        node.y = -depth * this.config.levelHeight;
        if (node.children.length === 0) {
            node.x = this.nextX;
            this.nextX += this.config.nodeSpacing;
        } else {
            for (let child of node.children) {
                this.assignPositions(child, depth + 1);
            }
            node.x = (node.children[0].x + node.children[node.children.length - 1].x) / 2;
        }
    }

    /******************************************************************
     * 將整棵樹平移，使得根節點的 x 為 0
     ******************************************************************/
    centerOnRoot(rootNode) {
        const dx = -rootNode.x; // 計算平移量，使得根節點 x 變為 0
        this.shiftTreeX(rootNode, dx);
    }

    /**
     * 遞迴將整棵樹的 x 坐標平移 dx
     */
    shiftTreeX(node, dx) {
        node.x += dx;
        for (const child of node.children) {
            this.shiftTreeX(child, dx);
        }
    }

    /******************************************************************
     * 建樹部分（費氏數列與階乘）
     ******************************************************************/
    buildFibonacciTree(n) {
        const node = {
            type: 'fibonacci',
            n: n,
            children: [],
            result: null,
            x: 0,
            y: 0,
            state: 'initial',
            visualNode: null,
            visualLabel: null
        };
        if (n <= 1) {
            node.result = n;
            return node;
        }
        const leftChild = this.buildFibonacciTree(n - 1);
        const rightChild = this.buildFibonacciTree(n - 2);
        node.children.push(leftChild, rightChild);
        return node;
    }

    buildFactorialTree(n) {
        const node = {
            type: 'factorial',
            n: n,
            children: [],
            result: null,
            x: 0,
            y: 0,
            state: 'initial',
            visualNode: null,
            visualLabel: null
        };
        if (n <= 1) {
            node.result = 1;
            return node;
        }
        const child = this.buildFactorialTree(n - 1);
        node.children.push(child);
        return node;
    }

    /******************************************************************
     * 視覺化樹：根據每個節點內含的 x, y 座標建立球體、標籤、連線
     ******************************************************************/
    visualizeTree(treeNode) {
        // 建立節點的球體
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(this.config.nodeRadius, 32, 32),
            new THREE.MeshPhongMaterial({
                color: this.config.nodeColor,
                transparent: true,
                opacity: this.config.cubeOpacity
            })
        );
        sphere.position.set(treeNode.x, treeNode.y, 0);
        this.scene.add(sphere);
        this.nodes.push(sphere);
        treeNode.visualNode = sphere;

        // 建立文字標籤（例如：fib(5) 或 5!）
        let labelText = treeNode.type === 'fibonacci' ? `fib(${treeNode.n})` : `${treeNode.n}!`;
        const label = this.createTextSprite(labelText, 70);
        label.position.set(treeNode.x, treeNode.y + 0.7, 0);
        this.scene.add(label);
        this.labels.push(label);
        treeNode.visualLabel = label;

        // 遞迴處理子節點及建立連線
        treeNode.children.forEach(child => {
            this.visualizeTree(child);
            const startPoint = new THREE.Vector3(treeNode.x, treeNode.y, 0);
            const endPoint = new THREE.Vector3(child.x, child.y, 0);
            const direction = new THREE.Vector3().subVectors(endPoint, startPoint);
            const length = direction.length();
            const lineGeometry = new THREE.CylinderGeometry(0.05, 0.05, length, 8);
            lineGeometry.translate(0, length / 2, 0);
            const lineMaterial = new THREE.MeshBasicMaterial({
                color: this.config.lineColor,
                transparent: true,
                opacity: 0.8
            });
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            line.position.copy(startPoint);
            const quaternion = new THREE.Quaternion();
            quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
            line.setRotationFromQuaternion(quaternion);
            this.scene.add(line);
            this.connections.push(line);
        });
    }

    /******************************************************************
     * 生成遞迴樹：建樹、佈局、置中，再建立視覺化與執行序列
     ******************************************************************/
    generateRecursionTree() {
        this.clearScene();
        this.stopAnimation();

        let tree;
        if (this.config.recursionType === 'fibonacci') {
            tree = this.buildFibonacciTree(this.config.startValue);
            this.updateCurrentOperation(`費氏數列 fib(${this.config.startValue}) 遞迴樹 - 準備就緒`);
        } else {
            tree = this.buildFactorialTree(this.config.startValue);
            this.updateCurrentOperation(`階乘 ${this.config.startValue}! 遞迴樹 - 準備就緒`);
        }

        // 先以後序排列分配座標
        this.nextX = 0; // 重置全域計數器
        this.assignPositions(tree, 0);

        // 以根節點為中心平移整棵樹，使得頂部的球 x == 0
        this.centerOnRoot(tree);

        // 設定 callTree 並視覺化樹、建立執行序列
        this.callTree = tree;
        this.visualizeTree(this.callTree);
        this.createExecutionSequence(this.callTree);

        // 添加說明標題（標題位置可視需求調整）
        const title = this.createTextSprite(
            this.config.recursionType === 'fibonacci' ?
              `費氏數列 fib(${this.config.startValue}) 遞迴視覺化` :
              `階乘 ${this.config.startValue}! 遞迴視覺化`,
            150
        );
        title.position.set(0, 5, 0);
        this.scene.add(title);
        this.labels.push(title);

        this.updateFormulaDisplay();
        this.updateCodeDisplay();
        this.updateMemoryDisplay();
    }

    /******************************************************************
     * 建立執行序列（後序遍歷）
     ******************************************************************/
    createExecutionSequence(treeNode) {
        this.callQueue = [];
        this.generateSequence(treeNode);
    }
    generateSequence(node) {
        this.callQueue.push({ type: 'call', node: node });
        node.children.forEach(child => this.generateSequence(child));
        this.callQueue.push({ type: 'return', node: node });
    }

    /******************************************************************
     * 自動執行動畫
     ******************************************************************/
    startAutoExecution() {
        if (this.isAutoSolving || this.isAnimating) return;
        this.resetNodesState();
        this.executionStack = [];
        this.isAutoSolving = true;
        this.isAnimating = false;
        this.currentStep = 0;
        this.updateCurrentOperation("開始執行遞迴過程...");
        this.processNextStep();
    }
    resetNodesState() {
        const resetNode = (node) => {
            node.state = 'initial';
            node.result = null;
            if (node.visualNode) {
                node.visualNode.material.color.setHex(this.config.nodeColor);
                node.visualNode.scale.set(1, 1, 1);
            }
            node.children.forEach(resetNode);
        };
        if (this.callTree) resetNode(this.callTree);
        this.numberLabels.forEach(label => this.scene.remove(label));
        this.numberLabels = [];
    }
    processNextStep() {
        if (this.currentStep >= this.callQueue.length || this.isAnimating) {
            if (this.currentStep >= this.callQueue.length) {
                this.isAutoSolving = false;
                this.updateCurrentOperation("遞迴過程執行完成！");
            }
            return;
        }
        const step = this.callQueue[this.currentStep];
        this.isAnimating = true;
        if (step.type === 'call') {
            this.animateCall(step.node);
        } else {
            this.animateReturn(step.node);
        }
        this.currentStep++;
    }

    /******************************************************************
     * 動畫：函數呼叫
     ******************************************************************/
    animateCall(node) {
        node.state = 'active';
        gsap.to(node.visualNode.material.color, {
            r: ((this.config.activeColor >> 16) & 255) / 255,
            g: ((this.config.activeColor >> 8) & 255) / 255,
            b: (this.config.activeColor & 255) / 255,
            duration: this.config.animationDuration
        });
        gsap.to(node.visualNode.scale, {
            x: 1.3, y: 1.3, z: 1.3,
            duration: this.config.animationDuration,
            ease: "power2.out"
        });
        const callLabel = this.createNumberLabel("呼叫", node.visualNode.position.clone());
        callLabel.position.z += 0.5;
        gsap.from(callLabel.scale, {
            x: 0, y: 0, z: 0,
            duration: this.config.animationDuration,
            ease: "back.out(1.7)"
        });
        this.executionStack.push(node);
        this.updateMemoryDisplay();
        if (node.type === 'fibonacci') {
            this.updateCurrentOperation(`呼叫 fib(${node.n})`);
        } else {
            this.updateCurrentOperation(`呼叫 ${node.n}!`);
        }
        setTimeout(() => {
            gsap.to(callLabel.material, {
                opacity: 0,
                duration: this.config.animationDuration,
                onComplete: () => {
                    this.scene.remove(callLabel);
                    const index = this.numberLabels.indexOf(callLabel);
                    if (index > -1) this.numberLabels.splice(index, 1);
                }
            });
        }, this.config.animationDuration * 1000);
        setTimeout(() => {
            this.isAnimating = false;
            if (node.children.length === 0) {
                if (node.type === 'fibonacci') {
                    node.result = node.n;
                } else {
                    node.result = 1;
                }
                if (this.isAutoSolving && !this.stepping) {
                    this.processNextStep();
                }
            } else {
                if (this.isAutoSolving && !this.stepping) {
                    this.processNextStep();
                }
            }
        }, this.config.animationDuration * 2000);
    }

    /******************************************************************
     * 動畫：函數返回
     ******************************************************************/
    animateReturn(node) {
        if (node.result === null) {
            if (node.type === 'fibonacci') {
                node.result = node.children[0].result + node.children[1].result;
            } else {
                node.result = node.n * node.children[0].result;
            }
        }
        node.state = 'completed';
        gsap.to(node.visualNode.material.color, {
            r: ((this.config.completedColor >> 16) & 255) / 255,
            g: ((this.config.completedColor >> 8) & 255) / 255,
            b: (this.config.completedColor & 255) / 255,
            duration: this.config.animationDuration
        });
        gsap.to(node.visualNode.scale, {
            x: 1.0, y: 1.0, z: 1.0,
            duration: this.config.animationDuration,
            ease: "power2.in"
        });
        const resultLabel = this.createNumberLabel(node.result.toString(), node.visualNode.position.clone());
        resultLabel.position.y -= 0.7;
        gsap.from(resultLabel.scale, {
            x: 0, y: 0, z: 0,
            duration: this.config.animationDuration,
            ease: "back.out(1.7)"
        });
        const stackIndex = this.executionStack.indexOf(node);
        if (stackIndex > -1) this.executionStack.splice(stackIndex, 1);
        this.updateMemoryDisplay();
        if (node.type === 'fibonacci') {
            this.updateCurrentOperation(`返回 fib(${node.n}) = ${node.result}`);
        } else {
            this.updateCurrentOperation(`返回 ${node.n}! = ${node.result}`);
        }
        setTimeout(() => {
            this.isAnimating = false;
            this.isProcessingStep = false;
            if (this.isAutoSolving && this.currentStep < this.callQueue.length && !this.stepping) {
                this.processNextStep();
            }
            if (node === this.callTree) {
                this.isAutoSolving = false;
                if (node.type === 'fibonacci') {
                    this.updateCurrentOperation(`費氏數列 fib(${node.n}) = ${node.result} 計算完成！`);
                } else {
                    this.updateCurrentOperation(`階乘 ${node.n}! = ${node.result} 計算完成！`);
                }
                const completeLabel = this.createTextSprite("計算完成！", 120, "#FFFF00");
                completeLabel.position.set(0, -5, 0);
                this.scene.add(completeLabel);
                this.labels.push(completeLabel);
                gsap.from(completeLabel.scale, {
                    x: 0, y: 0, z: 0,
                    duration: 0.5,
                    ease: "elastic.out(1, 0.3)"
                });
                setTimeout(() => {
                    gsap.to(completeLabel.material, {
                        opacity: 0,
                        duration: 1,
                        onComplete: () => {
                            this.scene.remove(completeLabel);
                            const idx = this.labels.indexOf(completeLabel);
                            if (idx > -1) this.labels.splice(idx, 1);
                        }
                    });
                }, 3000);
            }
        }, this.config.animationDuration * 1000);
    }

    createNumberLabel(text, position) {
        const label = this.createTextSprite(text, 80, "#FFFF00");
        label.position.copy(position);
        this.scene.add(label);
        this.numberLabels.push(label);
        return label;
    }

    stopAnimation() {
        this.isAutoSolving = false;
        this.isAnimating = false;
        this.isProcessingStep = false;
        gsap.globalTimeline.clear();
        this.updateCurrentOperation("遞迴執行已停止");
    }

    updateMemoryDisplay() {
        let html = `<div class="memory-row">
                      <div class="memory-address">層級</div>
                      <div class="memory-value" style="width:auto;">呼叫資訊</div>
                    </div>`;
        for (let i = this.executionStack.length - 1; i >= 0; i--) {
            const node = this.executionStack[i];
            const isActive = (i === this.executionStack.length - 1);
            let callInfo = node.type === 'fibonacci' ? `fib(${node.n})` : `${node.n}!`;
            html += `<div class="memory-row">
                       <div class="memory-address">${this.executionStack.length - i}</div>
                       <div class="memory-value ${isActive ? 'active' : ''}" style="width:auto;">${callInfo}</div>
                     </div>`;
        }
        if (this.executionStack.length === 0) {
            html += `<div class="memory-row">
                       <div class="memory-address">-</div>
                       <div class="memory-value" style="width:auto;">堆疊為空</div>
                     </div>`;
        }
        if (this.callTree) {
            html += `<div style="margin-top:20px;"><h3>遞迴計算狀態</h3></div>`;
            if (this.callTree.result !== null) {
                if (this.callTree.type === 'fibonacci') {
                    html += `<div>fib(${this.callTree.n}) = ${this.callTree.result}</div>`;
                } else {
                    html += `<div>${this.callTree.n}! = ${this.callTree.result}</div>`;
                }
            } else {
                html += `<div>計算尚未完成</div>`;
            }
            html += `<div style="margin-top:10px;">基本情況：`;
            if (this.callTree.type === 'fibonacci') {
                html += `fib(0) = 0, fib(1) = 1</div>`;
            } else {
                html += `0! = 1, 1! = 1</div>`;
            }
        }
        if (FloatingWindow.isOpen('memory')) {
            FloatingWindow.update('memory', html);
        }
    }

    updateFormulaDisplay() {
        let html = '';
        if (this.config.recursionType === 'fibonacci') {
            html = `<h3>費氏數列 (Fibonacci)</h3>
                    <div class="formula"><span class="highlight">遞迴定義：</span></div>
                    <div class="formula">fib(n) = fib(n-1) + fib(n-2)</div>
                    <div class="formula">fib(0) = 0, fib(1) = 1 （基本情況）</div>
                    <br>
                    <div>費氏數列是一個經典的遞迴問題，其中每個數字是前兩個數字的和。</div>
                    <div>序列：0, 1, 1, 2, 3, 5, 8, 13, 21, 34, ...</div>
                    <br>
                    <div class="formula"><span class="highlight">時間複雜度：</span></div>
                    <div>O(2^n) - 樸素遞迴實現</div>
                    <div>原因：許多子問題被重複計算，這導致了指數級增長。</div>
                    <br>
                    <div class="formula"><span class="highlight">空間複雜度：</span></div>
                    <div>O(n) - 遞迴呼叫堆疊的深度</div>`;
        } else {
            html = `<h3>階乘 (Factorial)</h3>
                    <div class="formula"><span class="highlight">遞迴定義：</span></div>
                    <div class="formula">n! = n × (n-1)!</div>
                    <div class="formula">0! = 1, 1! = 1 （基本情況）</div>
                    <br>
                    <div>階乘表示將一個正整數與所有小於它的正整數相乘的運算。</div>
                    <div>例如：5! = 5 × 4 × 3 × 2 × 1 = 120</div>
                    <br>
                    <div class="formula"><span class="highlight">時間複雜度：</span></div>
                    <div>O(n) - 每個數字只計算一次</div>
                    <br>
                    <div class="formula"><span class="highlight">空間複雜度：</span></div>
                    <div>O(n) - 遞迴呼叫堆疊的深度</div>`;
        }
        if (FloatingWindow.isOpen('formula')) {
            FloatingWindow.update('formula', html);
        }
    }

    updateCodeDisplay() {
        let code = '';
        if (this.config.recursionType === 'fibonacci') {
            code = `/**
 * 費氏數列遞迴計算
 * 定義：fib(n) = fib(n-1) + fib(n-2)，fib(0)=0, fib(1)=1
 */
function fibonacci(n) {
    if (n <= 0) return 0;
    if (n === 1) return 1;
    return fibonacci(n - 1) + fibonacci(n - 2);
}`;
        } else {
            code = `/**
 * 階乘遞迴計算
 * 定義：n! = n × (n-1)!，0! = 1
 */
function factorial(n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}`;
        }
        if (FloatingWindow.isOpen('code')) {
            FloatingWindow.update('code', code);
        }
    }

    stepForward() {
        if (this.isProcessingStep || this.isAnimating) return;
        if (!this.isAutoSolving || this.currentStep >= this.callQueue.length) {
            this.resetNodesState();
            this.executionStack = [];
            this.currentStep = 0;
            this.isAutoSolving = true;
        }
        this.stepping = true;
        this.isProcessingStep = true;
        this.processNextStep();
    }

    pauseAnimation() {
        gsap.globalTimeline.pause();
        this.isAnimating = true;
        this.isAutoSolving = false;
    }

    resumeAnimation() {
        gsap.globalTimeline.play();
        this.isAutoSolving = true;
        if (this.isAnimating) return;
        if (this.currentStep < this.callQueue.length) {
            this.processNextStep();
        }
    }

    toggleCode() {
        let code = '';
        if (this.config.recursionType === 'fibonacci') {
            code = `// 費氏數列範例程式碼
function fibonacci(n) { /* ... */ }`;
        } else {
            code = `// 階乘範例程式碼
function factorial(n) { /* ... */ }`;
        }
        FloatingWindow.toggle('code', () => code, '遞迴演算法代碼');
    }

    toggleMemory() {
        let html = `<div class="memory-row">
                      <div class="memory-address">層級</div>
                      <div class="memory-value" style="width:auto;">呼叫資訊</div>
                    </div>`;
        for (let i = this.executionStack.length - 1; i >= 0; i--) {
            const node = this.executionStack[i];
            const isActive = (i === this.executionStack.length - 1);
            let callInfo = node.type === 'fibonacci' ? `fib(${node.n})` : `${node.n}!`;
            html += `<div class="memory-row">
                       <div class="memory-address">${this.executionStack.length - i}</div>
                       <div class="memory-value ${isActive ? 'active' : ''}" style="width:auto;">${callInfo}</div>
                     </div>`;
        }
        if (this.executionStack.length === 0) {
            html += `<div class="memory-row">
                       <div class="memory-address">-</div>
                       <div class="memory-value" style="width:auto;">堆疊為空</div>
                     </div>`;
        }
        if (this.callTree) {
            html += `<div style="margin-top:20px;"><h3>遞迴計算狀態</h3></div>`;
            if (this.callTree.result !== null) {
                if (this.callTree.type === 'fibonacci') {
                    html += `<div>fib(${this.callTree.n}) = ${this.callTree.result}</div>`;
                } else {
                    html += `<div>${this.callTree.n}! = ${this.callTree.result}</div>`;
                }
            } else {
                html += `<div>計算尚未完成</div>`;
            }
            html += `<div style="margin-top:10px;">基本情況：`;
            if (this.callTree.type === 'fibonacci') {
                html += `fib(0) = 0, fib(1) = 1</div>`;
            } else {
                html += `0! = 1, 1! = 1</div>`;
            }
        }
        FloatingWindow.toggle('memory', () => html, '遞迴堆疊狀態');
    }

    toggleFormula() {
        let html = '';
        if (this.config.recursionType === 'fibonacci') {
            html = `<h3>費氏數列 (Fibonacci)</h3>
                    <div class="formula"><span class="highlight">遞迴定義：</span></div>
                    <div class="formula">fib(n) = fib(n-1) + fib(n-2)</div>
                    <div class="formula">fib(0) = 0, fib(1) = 1 （基本情況）</div>
                    <br>
                    <div>費氏數列是一個經典的遞迴問題，其中每個數字是前兩個數字的和。</div>
                    <div>序列：0, 1, 1, 2, 3, 5, 8, 13, 21, 34, ...</div>
                    <br>
                    <div class="formula"><span class="highlight">時間複雜度：</span></div>
                    <div>O(2^n) - 樸素遞迴實現</div>
                    <div>原因：許多子問題被重複計算，這導致了指數級增長。</div>
                    <br>
                    <div class="formula"><span class="highlight">空間複雜度：</span></div>
                    <div>O(n) - 遞迴呼叫堆疊的深度</div>`;
        } else {
            html = `<h3>階乘 (Factorial)</h3>
                    <div class="formula"><span class="highlight">遞迴定義：</span></div>
                    <div class="formula">n! = n × (n-1)!</div>
                    <div class="formula">0! = 1, 1! = 1 （基本情況）</div>
                    <br>
                    <div>階乘表示將一個正整數與所有小於它的正整數相乘的運算。</div>
                    <div>例如：5! = 5 × 4 × 3 × 2 × 1 = 120</div>
                    <br>
                    <div class="formula"><span class="highlight">時間複雜度：</span></div>
                    <div>O(n) - 每個數字只計算一次</div>
                    <br>
                    <div class="formula"><span class="highlight">空間複雜度：</span></div>
                    <div>O(n) - 遞迴呼叫堆疊的深度</div>`;
        }
        FloatingWindow.toggle('formula', () => html, '遞迴數學定義');
    }

    reset() {
        this.stopAnimation();
        this.generateRecursionTree();
        this.isAutoSolving = false;
        this.stepping = false;
        if (this.config.recursionType === 'fibonacci') {
            this.updateCurrentOperation(`費氏數列 fib(${this.config.startValue}) 遞迴樹已重置`);
        } else {
            this.updateCurrentOperation(`階乘 ${this.config.startValue}! 遞迴樹已重置`);
        }
    }

    destroy() {
        this.stopAnimation();
        if (this.controlsPanel && this.controlsPanel.parentNode) {
            this.controlsPanel.parentNode.removeChild(this.controlsPanel);
        }
        if (this.controlButton && this.controlButton.parentNode) {
            this.controlButton.parentNode.removeChild(this.controlButton);
        }
        super.destroy();
    }
};
