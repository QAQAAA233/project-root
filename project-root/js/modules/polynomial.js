/**
 * 多項式視覺化模組
 * 展示多項式的稠密表示法和稀疏表示法，以及它們在記憶體中的儲存結構
 */

// 確保 ModuleClass 只在全局範圍中定義一次
window.ModuleClass = class PolynomialModule extends ModuleBase {
  constructor(container) {
      super(container);
      
      // 模組配置
      this.config = {
          polyType: "dense",
          polyDegree: 5,
          nonZeroTerms: 3,
          customPoly: "2x^5 + 3x^2 + 1",
          useCustomPoly: false,
          polynomialColor: 0xFF5722,
          zeroColor: 0x888888,
          nonZeroColor: 0xFF5722,
          cubeOpacity: 0.5,
          speed: "medium"
      };
      this.speedMap = { slow: 1.0, medium: 0.5, fast: 0.2 };
      
      // 元素追蹤
      this.cubes = [];
      this.textSprites = [];
      this.memoryLayout = [];
      
      // 創建控制面板
      this.controlsPanel = null;
      this.controlButton = null;
      this.panelPosition = { x: 0, y: 0 };
      this.isControlsVisible = true;
      
      // 當前多項式
      this.currentPolynomial = null;
      this.polynomialString = "";
  }
  
  /**
   * 初始化模組
   */
  init() {
      super.init();
      
      // 創建控制面板
      this.createControlPanel();
      
      // 創建多項式視覺化
      this.createPolynomialVisualization(true);
      
      // 更新當前操作
      this.updateCurrentOperation("多項式視覺化 - 可選擇稠密或稀疏表示法");
  }
  
  /**
   * 創建控制面板
   */
  createControlPanel() {
      // 創建控制面板容器
      const panel = document.createElement('div');
      panel.className = 'polynomial-controls';
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
              <span style="font-weight:bold;">多項式控制面板</span>
          </div>
          <div class="form-group">
              <label for="polyType">多項式表示方法</label>
              <select id="polyType">
                  <option value="dense">稠密表示法</option>
                  <option value="sparse">稀疏表示法</option>
              </select>
          </div>
          <div class="form-group">
              <label for="polyDegree">最高次數</label>
              <input type="number" id="polyDegree" value="5" min="3" max="10">
          </div>
          <div class="form-group" id="nonZeroGroup">
              <label for="nonZeroTerms">非零項數</label>
              <input type="number" id="nonZeroTerms" value="3" min="1" max="6">
          </div>
          <div class="form-group" id="customPolyGroup" style="width:100%;display:none">
              <label for="customPoly">自定義多項式 (如: 2x^5 + 3x^2 + 1)</label>
              <input type="text" id="customPoly" value="2x^5 + 3x^2 + 1" style="width:80%">
          </div>
          <div class="form-group">
              <label for="polyOpacitySlider">方塊不透明度</label>
              <input type="range" min="0" max="100" value="50" id="polyOpacitySlider">
              <div id="polyOpacityValue" style="text-align:center">50%</div>
          </div>
          <div class="button-group" style="width:100%;display:flex;justify-content:center;margin-top:10px">
              <button id="generatePolyBtn">生成多項式</button>
              <button id="customPolyBtn">使用自定義多項式</button>
              <button id="resetPolyBtn">重置</button>
          </div>
          <div style="width:100%;text-align:center;margin-top:10px">
              <button id="togglePolyControls">隱藏控制面板</button>
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
      controlButton.id = 'polyControlButton';
      
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
      const polyTypeSelect = document.getElementById('polyType');
      polyTypeSelect.addEventListener('change', () => {
          this.config.polyType = polyTypeSelect.value;
      });
      
      const polyDegreeInput = document.getElementById('polyDegree');
      polyDegreeInput.addEventListener('change', () => {
          this.config.polyDegree = parseInt(polyDegreeInput.value);
          const maxTerms = this.config.polyDegree + 1;
          if (this.config.nonZeroTerms > maxTerms) {
              this.config.nonZeroTerms = maxTerms;
              document.getElementById('nonZeroTerms').value = maxTerms;
          }
          document.getElementById('nonZeroTerms').max = maxTerms;
      });
      
      const nonZeroTermsInput = document.getElementById('nonZeroTerms');
      nonZeroTermsInput.addEventListener('change', () => {
          this.config.nonZeroTerms = parseInt(nonZeroTermsInput.value);
      });
      
      const customPolyInput = document.getElementById('customPoly');
      customPolyInput.addEventListener('change', () => {
          this.config.customPoly = customPolyInput.value;
      });
      
      const polyOpacitySlider = document.getElementById('polyOpacitySlider');
      polyOpacitySlider.addEventListener('input', () => {
          const opacity = parseInt(polyOpacitySlider.value) / 100;
          this.updateCubesOpacity(opacity);
      });
      
      const generatePolyBtn = document.getElementById('generatePolyBtn');
      generatePolyBtn.addEventListener('click', () => {
          this.config.useCustomPoly = false;
          this.createPolynomialVisualization(false);
      });
      
      const customPolyBtn = document.getElementById('customPolyBtn');
      customPolyBtn.addEventListener('click', () => {
          const nonZeroGroup = document.getElementById('nonZeroGroup');
          const customPolyGroup = document.getElementById('customPolyGroup');
          
          if (customPolyGroup.style.display === 'none') {
              nonZeroGroup.style.display = 'none';
              customPolyGroup.style.display = 'block';
              customPolyBtn.textContent = '生成自定義多項式';
          } else {
              this.config.useCustomPoly = true;
              this.createPolynomialVisualization(false);
          }
      });
      
      const resetPolyBtn = document.getElementById('resetPolyBtn');
      resetPolyBtn.addEventListener('click', () => {
          this.clearScene(false);
          this.memoryLayout = [];
          this.updateMemoryDisplay();
          
          document.getElementById('nonZeroGroup').style.display = 'flex';
          document.getElementById('customPolyGroup').style.display = 'none';
          document.getElementById('customPolyBtn').textContent = '使用自定義多項式';
          
          // 重置表單值
          document.getElementById('polyType').value = 'dense';
          document.getElementById('polyDegree').value = '5';
          document.getElementById('nonZeroTerms').value = '3';
          document.getElementById('customPoly').value = '2x^5 + 3x^2 + 1';
          document.getElementById('polyOpacitySlider').value = '50';
          
          // 更新配置
          this.config.polyType = 'dense';
          this.config.polyDegree = 5;
          this.config.nonZeroTerms = 3;
          this.config.customPoly = '2x^5 + 3x^2 + 1';
          this.config.useCustomPoly = false;
          this.config.cubeOpacity = 0.5;
          
          this.updateCurrentOperation('多項式視覺化已重置 - 請選擇表示方法');
      });
      
      const togglePolyControls = document.getElementById('togglePolyControls');
      togglePolyControls.addEventListener('click', () => {
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
   * 更新方塊不透明度
   */
  updateCubesOpacity(opacity) {
      this.config.cubeOpacity = opacity;
      document.getElementById('polyOpacityValue').textContent = Math.round(opacity * 100) + '%';
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
      
      const toRemove = [];
      this.scene.traverse(child => {
          if (!(child instanceof THREE.Camera) && !(child instanceof THREE.Light) && 
              !(preserveAxisLabels && axisLabels.includes(child)))
              toRemove.push(child);
      });
      
      toRemove.forEach(obj => this.scene.remove(obj));
  }
  
  /**
   * 創建多項式視覺化
   */
  createPolynomialVisualization(resetCamera = true) {
      this.clearScene(false);
      this.memoryLayout = [];
      
      let coefficients, polyString;
      
      if (this.config.useCustomPoly) {
          const result = this.parseCustomPolynomial(this.config.customPoly);
          coefficients = result.coefficients;
          polyString = result.polyString;
      } else {
          const degree = this.config.polyDegree;
          coefficients = Array(degree + 1).fill(0);
          const nonZeroTerms = Math.min(this.config.nonZeroTerms, degree + 1);
          const nonZeroIndices = new Set([degree]);
          
          while (nonZeroIndices.size < nonZeroTerms) {
              nonZeroIndices.add(Math.floor(Math.random() * degree));
          }
          
          nonZeroIndices.forEach(idx => {
              let coef;
              do { 
                  coef = Math.floor(Math.random() * 19) - 9; 
              } while (coef === 0);
              
              coefficients[idx] = coef;
          });
          
          polyString = this.formatPolynomial(coefficients);
      }
      
      this.currentPolynomial = coefficients;
      this.polynomialString = polyString;
      
      this.updateCurrentOperation(`多項式: ${polyString}`);
      
      if (this.config.polyType === 'dense') {
          const densePoly = [this.config.polyDegree];
          for (let d = this.config.polyDegree; d >= 0; d--) {
              densePoly.push(coefficients[d]);
          }
          this.visualizeDensePolynomial(densePoly, resetCamera);
      } else {
          this.visualizeSparsePolynomial(coefficients, resetCamera);
      }
  }
  
  /**
   * 解析自定義多項式 - 修改版，改進次方處理
   */
  parseCustomPolynomial(polyStr) {
      polyStr = polyStr.replace(/\s+/g, '');
      
      // 使用正則表達式找出最高次數
      let maxDegree = 0;
      let degreeRegex = /x\^(\d+)/g;
      let match;
      
      while ((match = degreeRegex.exec(polyStr)) !== null) {
          maxDegree = Math.max(maxDegree, parseInt(match[1]));
      }
      
      // 處理 x 一次項
      if (/[^x]x[^\^]/g.test(polyStr) || /[^x]x$/g.test(polyStr)) {
          maxDegree = Math.max(maxDegree, 1);
      }
      
      const coefficients = Array(maxDegree + 1).fill(0);
      
      // 分割項並解析係數
      const terms = polyStr.replace(/-/g, "+-").split("+").filter(term => term);
      
      terms.forEach(term => {
          if (term.includes("x^")) {
              const [coefPart, expPart] = term.split("x^");
              const deg = parseInt(expPart);
              let coef;
              
              // 處理不同格式的係數
              if (coefPart === "-") coef = -1;
              else if (coefPart === "") coef = 1;
              else coef = parseInt(coefPart);
              
              coefficients[deg] = coef;
          } else if (term.includes("x")) {
              const [coefPart] = term.split("x");
              let coef;
              
              // 處理不同格式的係數
              if (coefPart === "-") coef = -1;
              else if (coefPart === "") coef = 1;
              else coef = parseInt(coefPart);
              
              coefficients[1] = coef;
          } else if (term) {
              // 處理常數項
              coefficients[0] = parseInt(term);
          }
      });
      
      // 使用 HTML 格式的多項式字符串
      const polyString = this.formatPolynomial(coefficients);
      
      return { coefficients, polyString };
  }
  
  /**
   * 格式化多項式為易讀字符串 - 修改版
   */
  formatPolynomial(coefficients) {
      const parts = [];
      
      for (let i = coefficients.length - 1; i >= 0; i--) {
          if (coefficients[i] !== 0) {
              const sign = parts.length ? (coefficients[i] > 0 ? " + " : " - ") : (coefficients[i] < 0 ? "-" : "");
              const absCoef = Math.abs(coefficients[i]);
              const coefStr = (absCoef !== 1 || i === 0) ? absCoef : "";
              const term = i > 0 ? (i === 1 ? "x" : `x<sup>${i}</sup>`) : "";
              parts.push(sign + coefStr + term);
          }
      }
      
      return parts.length ? parts.join('') : "0";
  }
  
  /**
   * 可視化稠密多項式表示法
   */
  visualizeDensePolynomial(densePoly, resetCamera = true) {
      this.clearScene(false);
      
      const cellSize = 1, cellGap = 0.2, numElements = densePoly.length;
      const totalWidth = numElements * (cellSize + cellGap);
      const offsetX = -totalWidth / 2 + cellSize / 2;
      
      // 更新公式視窗
      this.updateFormulaDisplay(`<h3>多項式稠密表示法</h3>
                                <div class="formula">[最高次, 最高次係數, ..., 常數項]</div>
                                <div>例如 f(x)=${this.polynomialString} => [${densePoly.join(', ')}]</div>
                                <div>陣列大小: ${numElements}</div>`);
      
      this.memoryLayout = [];
      
      densePoly.forEach((value, i) => {
          const cube = new THREE.Mesh(
              new THREE.BoxGeometry(cellSize, cellSize, cellSize),
              new THREE.MeshPhongMaterial({
                  color: i === 0 ? 0xFFD700 : (value === 0 ? this.config.zeroColor : this.config.nonZeroColor),
                  transparent: true,
                  opacity: i === 0 ? this.config.cubeOpacity * 1.2 : (value === 0 ? this.config.cubeOpacity * 0.6 : this.config.cubeOpacity * 1.4)
              })
          );
          
          cube.position.set(offsetX + i * (cellSize + cellGap), 0, 0);
          this.scene.add(cube);
          this.cubes.push(cube);
          
          const textSprite = this.createTextSprite(value.toString(), 90);
          textSprite.position.copy(cube.position);
          this.scene.add(textSprite);
          this.textSprites.push(textSprite);
          
          let label = i === 0 ? "最高次" : `x^${densePoly[0] - (i - 1)}`;
          const labelSprite = this.createTextSprite(label, 65, "#00FFFF");
          labelSprite.position.copy(cube.position);
          labelSprite.position.y -= 1.5;
          this.scene.add(labelSprite);
          this.textSprites.push(labelSprite);
          
          this.memoryLayout.push({ 
              address: `index: ${i}`, 
              value: value.toString(), 
              active: false 
          });
      });
      
      const arrayLabel = this.createTextSprite("稠密表示法：第0格=最高次，其後為係數", 100);
      arrayLabel.position.set(0, 2.5, 0);
      this.scene.add(arrayLabel);
      this.textSprites.push(arrayLabel);
      
      this.scene.add(new THREE.AxesHelper(totalWidth / 2));
      
      if (resetCamera) {
          this.camera.position.set(0, 6, totalWidth * 1.8);
          this.camera.lookAt(0, 0, 0);
          
          if (this.controls) {
              this.controls.target.set(0, 0, 0);
              this.controls.update();
          }
      }
      
      this.updateMemoryDisplay();
  }
  
  /**
   * 可視化稀疏多項式表示法
   */
  visualizeSparsePolynomial(coefficients, resetCamera = true) {
      this.clearScene(false);
      
      const cellSize = 1, cellGap = 0.3;
      const nonZeroPairs = coefficients.map((coef, i) => coef !== 0 ? { exp: i, coef } : null).filter(Boolean);
      nonZeroPairs.sort((a, b) => b.exp - a.exp);
      
      // 更新公式視窗
      this.updateFormulaDisplay(`<h3>多項式稀疏表示法</h3>
                                <div class="formula">只存非零項: [k, 高次項指數, 高次項係數, 次高次項指數, 次高次項係數, ...]</div>
                                <div>f(x)=${this.polynomialString}</div>
                                <div>非零項數: ${nonZeroPairs.length}</div>`);
      
      const sparseArray = [nonZeroPairs.length];
      nonZeroPairs.forEach(pair => {
          sparseArray.push(pair.exp);
          sparseArray.push(pair.coef);
      });
      
      const totalWidth = sparseArray.length * (cellSize + cellGap);
      const offsetX = -totalWidth / 2 + cellSize / 2;
      
      this.memoryLayout = [];
      
      sparseArray.forEach((value, i) => {
          const cube = new THREE.Mesh(
              new THREE.BoxGeometry(cellSize, cellSize, cellSize),
              new THREE.MeshPhongMaterial({
                  color: i === 0 ? 0xFFD700 : (i % 2 === 1 ? 0x2196F3 : this.config.nonZeroColor),
                  transparent: true,
                  opacity: this.config.cubeOpacity * (i === 0 ? 1.2 : 1.0)
              })
          );
          
          cube.position.set(offsetX + i * (cellSize + cellGap), 0, 0);
          this.scene.add(cube);
          this.cubes.push(cube);
          
          const textSprite = this.createTextSprite(value.toString(), 90);
          textSprite.position.copy(cube.position);
          this.scene.add(textSprite);
          this.textSprites.push(textSprite);
          
          let label;
          if (i === 0) label = "k值";
          else if (i % 2 === 1) label = `x^${sparseArray[i]}`;
          else label = "係數";
          
          const indexLabel = this.createTextSprite(label, 65, "#00FFFF");
          indexLabel.position.copy(cube.position);
          indexLabel.position.y -= 1.2;
          this.scene.add(indexLabel);
          this.textSprites.push(indexLabel);
          
          let displayValue;
          if (i === 0) displayValue = `非零項數:${value}`;
          else if (i % 2 === 1) displayValue = `指數:${value}`;
          else displayValue = `係數:${value}`;
          
          this.memoryLayout.push({ 
              address: `index: ${i}`, 
              value: displayValue, 
              active: false 
          });
      });
      
      const titleLabel = this.createTextSprite("稀疏表示法：只存非零項", 100);
      titleLabel.position.set(0, 3.5, 0);
      this.scene.add(titleLabel);
      this.textSprites.push(titleLabel);
      
      this.scene.add(new THREE.AxesHelper(totalWidth / 2));
      
      if (resetCamera) {
          this.camera.position.set(0, 5, totalWidth * 1.8);
          this.camera.lookAt(0, 0, 0);
          
          if (this.controls) {
              this.controls.target.set(0, 0, 0);
              this.controls.update();
          }
      }
      
      this.updateMemoryDisplay();
  }
  
  /**
   * 更新記憶體顯示
   */
  updateMemoryDisplay() {
      if (!this.memoryLayout.length) return;
      
      let html = `<div class="memory-row">
                    <div class="memory-address">索引位置</div>
                    <div class="memory-value" style="width:auto;">值 (儲存內容)</div>
                  </div>`;
                  
      this.memoryLayout.forEach((mem, i) => {
          html += `<div class="memory-row">
                     <div class="memory-address">${mem.address}</div>
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
  updateFormulaDisplay(html) {
      if (FloatingWindow.isOpen('formula')) {
          FloatingWindow.update('formula', html);
      }
  }
  
  /**
   * 更新當前操作信息 - 覆蓋原方法
   */
  updateCurrentOperation(text) {
      // 如果是多項式字符串，先格式化它
      if (text.includes("多項式:") && text.includes("x^")) {
          const parts = text.split("多項式:");
          const prefix = parts[0] + "多項式: ";
          const polyText = parts[1].trim();
          
          // 替換多項式中的 x^n 為 HTML 標籤形式
          const formattedPoly = polyText.replace(/(\d+)?x\^(\d+)/g, (match, coef, exp) => {
              coef = coef || '';
              return `${coef}x<sup>${exp}</sup>`;
          });
          
          document.getElementById('currentOperation').innerHTML = prefix + formattedPoly;
      } else {
          // 否則使用普通更新方法
          document.getElementById('currentOperation').innerHTML = text;
      }
  }
  
  /**
   * 創建公式視窗內容
   */
  createFormulaContent() {
      let html = '';
      
      if (this.config.polyType === 'dense') {
          // 確保正確格式化多項式字符串，直接使用HTML格式
          const densePolyArray = [this.config.polyDegree];
          for (let d = this.config.polyDegree; d >= 0; d--) {
              densePolyArray.push(this.currentPolynomial[d]);
          }
          
          html = `<h3>多項式稠密表示法</h3>
                  <div class="formula">[最高次, 最高次係數, ..., 常數項]</div>
                  <div>例如 f(x)=${this.polynomialString} => [${densePolyArray.join(', ')}]</div>
                  <div>陣列大小: ${this.config.polyDegree + 2}</div>
                  <br>
                  <div class="formula"><span class="highlight">稠密表示法特點:</span></div>
                  <div>1. 按順序存儲多項式的所有係數，包括零係數</div>
                  <div>2. 陣列第一個元素儲存多項式的最高次數</div>
                  <div>3. 陣列大小恆為 (最高次數 + 2)</div>
                  <div>4. 適用於係數較多的低次多項式</div>`;
      } else {
          // 稀疏表示法，同樣確保正確格式
          const nonZeroPairs = this.currentPolynomial.map((coef, i) => 
              coef !== 0 ? { exp: i, coef } : null
          ).filter(Boolean);
          nonZeroPairs.sort((a, b) => b.exp - a.exp);
          
          // 創建稀疏表示形式的字符串
          let sparseDisplay = `[${nonZeroPairs.length}`;
          nonZeroPairs.forEach(pair => {
              sparseDisplay += `, ${pair.exp}, ${pair.coef}`;
          });
          sparseDisplay += ']';
          
          html = `<h3>多項式稀疏表示法</h3>
                  <div class="formula">只存非零項: [k, 高次項指數, 高次項係數, 次高次項指數, 次高次項係數, ...]</div>
                  <div>f(x)=${this.polynomialString}</div>
                  <div>非零項數: ${nonZeroPairs.length}</div>
                  <br>
                  <div class="formula"><span class="highlight">稀疏表示法特點:</span></div>
                  <div>1. 只存儲非零係數項及其對應的指數</div>
                  <div>2. 陣列第一個元素儲存非零項的個數</div>
                  <div>3. 後續元素按指數降序排列，每對元素表示一個項的指數和係數</div>
                  <div>4. 適用於有大量零係數的高次多項式</div>`;
      }
      
      return html;
  }
  
  /**
   * 切換代碼視窗顯示
   */
  toggleCode() {
      // 根據當前多項式類型生成代碼
      let code = '';
      if (this.config.polyType === 'dense') {
          const densePolyArray = [this.config.polyDegree];
          for (let d = this.config.polyDegree; d >= 0; d--) {
              densePolyArray.push(this.currentPolynomial[d]);
          }
          
          code = `// 多項式稠密表示法
// 示範如何在記憶體中以稠密陣列表示多項式

/**
* 稠密表示法結構:
* [最高次數, a_n, a_(n-1), ..., a_1, a_0]
* 其中 a_i 是 x^i 的係數
*
* 例如多項式 ${this.polynomialString} 表示為:
* [${densePolyArray.join(', ')}]
*/

// 多項式評估函數 - 計算 P(x) 的值
function evaluatePolynomial(poly, x) {
  const degree = poly[0];  // 最高次數
  let result = 0;
  
  for (let i = 0; i <= degree; i++) {
      // 係數在陣列中的位置為 (degree - i) + 1
      const coef = poly[(degree - i) + 1];
      result += coef * Math.pow(x, i);
  }
  
  return result;
}

// 多項式加法 (稠密表示法)
function addPolynomials(p1, p2) {
  const degree1 = p1[0];
  const degree2 = p2[0];
  const maxDegree = Math.max(degree1, degree2);
  
  // 創建結果多項式陣列
  const result = [maxDegree];
  
  for (let i = 0; i <= maxDegree; i++) {
      // 獲取兩個多項式的對應係數
      const coef1 = (i <= degree1) ? p1[(degree1 - i) + 1] : 0;
      const coef2 = (i <= degree2) ? p2[(degree2 - i) + 1] : 0;
      
      // 係數相加並存入結果
      result.push(coef1 + coef2);
  }
  
  return result;
}

// 稠密表示法的優點:
// 1. 簡單直觀，易於實現基本操作
// 2. 快速的隨機訪問，可以立即獲取任何次數的係數
// 3. 適合次數較低且大多數項非零的多項式

// 稠密表示法的缺點:
// 1. 對於高次且稀疏的多項式浪費大量空間
// 2. 需要預先知道最高次數`;
      } else {
          // 稀疏表示法
          const nonZeroPairs = this.currentPolynomial.map((coef, i) => 
              coef !== 0 ? { exp: i, coef } : null
          ).filter(Boolean);
          nonZeroPairs.sort((a, b) => b.exp - a.exp);
          
          // 創建稀疏表示形式的字符串
          let sparseDisplay = `[${nonZeroPairs.length}`;
          nonZeroPairs.forEach(pair => {
              sparseDisplay += `, ${pair.exp}, ${pair.coef}`;
          });
          sparseDisplay += ']';
          
          code = `// 多項式稀疏表示法
// 示範如何在記憶體中以稀疏結構表示多項式

/**
* 稀疏表示法結構:
* [項數k, 指數1, 係數1, 指數2, 係數2, ..., 指數k, 係數k]
* 只存儲非零項，每項包含一個指數和對應的係數
*
* 例如多項式 ${this.polynomialString} 稀疏表示:
* ${sparseDisplay}
*/

// 多項式評估函數 - 計算 P(x) 的值
function evaluatePolynomial(poly, x) {
  const termCount = poly[0];  // 非零項數量
  let result = 0;
  
  for (let i = 0; i < termCount; i++) {
      const exponent = poly[1 + i*2];     // 指數位置
      const coefficient = poly[1 + i*2 + 1]; // 係數位置
      result += coefficient * Math.pow(x, exponent);
  }
  
  return result;
}

// 多項式加法 (稀疏表示法)
function addPolynomials(p1, p2) {
  const termCount1 = p1[0];
  const termCount2 = p2[0];
  
  // 創建臨時字典來存儲合併後的項
  const resultTerms = {};
  
  // 處理第一個多項式的項
  for (let i = 0; i < termCount1; i++) {
      const exp = p1[1 + i*2];
      const coef = p1[1 + i*2 + 1];
      resultTerms[exp] = (resultTerms[exp] || 0) + coef;
  }
  
  // 處理第二個多項式的項
  for (let i = 0; i < termCount2; i++) {
      const exp = p2[1 + i*2];
      const coef = p2[1 + i*2 + 1];
      resultTerms[exp] = (resultTerms[exp] || 0) + coef;
  }
  
  // 過濾掉係數為零的項
  const filteredTerms = Object.entries(resultTerms)
      .filter(([_, coef]) => coef !== 0)
      .map(([exp, coef]) => [parseInt(exp), coef])
      .sort((a, b) => b[0] - a[0]); // 按指數降序排序
  
  // 構建結果陣列
  const result = [filteredTerms.length]; // 項數
  filteredTerms.forEach(([exp, coef]) => {
      result.push(exp);  // 指數
      result.push(coef); // 係數
  });
  
  return result;
}

// 稀疏表示法的優點:
// 1. 對於高次且只有少量非零項的多項式節省大量空間
// 2. 運算時只需處理非零項，提高效率

// 稀疏表示法的缺點:
// 1. 隨機訪問較慢，需要遍歷查找特定次數的係數
// 2. 實現某些操作（如乘法）較為複雜`;
      }
      
      FloatingWindow.toggle('code', () => code, '多項式表示法程式碼');
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
                    <div class="memory-address">索引位置</div>
                    <div class="memory-value" style="width:auto;">值 (儲存內容)</div>
                  </div>`;
                  
      this.memoryLayout.forEach((mem, i) => {
          html += `<div class="memory-row">
                     <div class="memory-address">${mem.address}</div>
                     <div class="memory-value ${mem.active ? 'active' : ''}" style="width:auto;">${mem.value}</div>
                   </div>`;
      });
      
      FloatingWindow.toggle('memory', () => html, '多項式儲存結構');
  }
  
  /**
   * 切換公式視窗顯示
   */
  toggleFormula() {
      const content = this.createFormulaContent();
      FloatingWindow.toggle('formula', () => content, '多項式表示法說明');
  }
  
  /**
   * 暫停動畫 (多項式模組沒有動畫，但需要實現此方法)
   */
  pauseAnimation() {
      // 無動畫，不需處理
  }
  
  /**
   * 繼續動畫 (多項式模組沒有動畫，但需要實現此方法)
   */
  resumeAnimation() {
      // 無動畫，不需處理
  }
  
  /**
   * 單步執行 (多項式模組沒有動畫步驟，但需要實現此方法)
   */
  stepForward() {
      // 提示用戶此模組不支持步進
      this.updateCurrentOperation('多項式模組不支持逐步執行功能');
  }
  
  /**
   * 重置模組
   */
  reset() {
      // 重置配置
      this.config.polyType = 'dense';
      this.config.polyDegree = 5;
      this.config.nonZeroTerms = 3;
      this.config.customPoly = '2x^5 + 3x^2 + 1';
      this.config.useCustomPoly = false;
      this.config.cubeOpacity = 0.5;
      
      // 重置表單值
      document.getElementById('polyType').value = 'dense';
      document.getElementById('polyDegree').value = '5';
      document.getElementById('nonZeroTerms').value = '3';
      document.getElementById('customPoly').value = '2x^5 + 3x^2 + 1';
      document.getElementById('polyOpacitySlider').value = '50';
      
      // 顯示/隱藏相關表單組
      document.getElementById('nonZeroGroup').style.display = 'flex';
      document.getElementById('customPolyGroup').style.display = 'none';
      document.getElementById('customPolyBtn').textContent = '使用自定義多項式';
      
      // 重新創建視覺化
      this.createPolynomialVisualization(true);
      
      this.updateCurrentOperation('多項式視覺化已重置 - 當前為稠密表示法');
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