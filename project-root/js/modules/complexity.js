/**
 * 演算法複雜度視覺化模組
 * 展示不同演算法複雜度的視覺化比較
 */

class ComplexityModule extends ModuleBase {
    constructor(container) {
      super(container);
      
      // 模組設定
      this.config = {
        complexityType: "time",
        algorithmType: "linear",
        maxN: 10,
        showComparison: false
      };
      
      // 複雜度顏色映射
      this.complexityColors = {
        constant: 0x4CAF50,     // 綠色
        logarithmic: 0x2196F3,  // 藍色
        linear: 0xFFC107,       // 黃色
        linearithmic: 0x9C27B0, // 紫色
        quadratic: 0xFF5722,    // 橙色
        cubic: 0xF44336,        // 紅色
        exponential: 0xE91E63   // 粉色
      };
      
      // 複雜度名稱對應
      this.complexityNames = {
        constant: "常數時間 O(1)",
        logarithmic: "對數時間 O(log n)",
        linear: "線性時間 O(n)",
        linearithmic: "線性對數時間 O(n log n)",
        quadratic: "平方時間 O(n²)",
        cubic: "立方時間 O(n³)",
        exponential: "指數時間 O(2ⁿ)"
      };
      
      // 儲存繪圖元素
      this.points = [];
      this.lines = [];
      this.labels = [];
      this.grids = [];
      
      // 設置相機位置
      this.camera.position.set(0, 0, 20);
      this.camera.lookAt(5, 5, 0);
    }
    
    /**
     * 初始化模組
     */
    init() {
      super.init();
      this.createControls();
      this.visualizeSingleComplexity();
    }
    
    /**
     * 創建控制面板
     */
    createControls() {
      // 在模組容器中創建控制面板
      const controlsDiv = document.createElement('div');
      controlsDiv.className = 'module-controls';
      controlsDiv.style.position = 'absolute';
      controlsDiv.style.bottom = '80px';
      controlsDiv.style.left = '20px';
      controlsDiv.style.zIndex = '100';
      controlsDiv.style.backgroundColor = 'rgba(0,0,0,0.7)';
      controlsDiv.style.padding = '10px';
      controlsDiv.style.borderRadius = '8px';
      controlsDiv.style.border = '1px solid #4CAF50';
      
      // 複雜度類型選擇
      const typeDiv = document.createElement('div');
      typeDiv.style.marginBottom = '10px';
      
      const typeLabel = document.createElement('label');
      typeLabel.textContent = '複雜度類型: ';
      typeLabel.style.marginRight = '10px';
      typeLabel.style.color = 'white';
      
      const typeSelect = document.createElement('select');
      typeSelect.innerHTML = `
        <option value="time">時間複雜度</option>
        <option value="space">空間複雜度</option>
      `;
      typeSelect.value = this.config.complexityType;
      typeSelect.addEventListener('change', () => {
        this.config.complexityType = typeSelect.value;
        this.updateFormulaDisplay();
      });
      
      typeDiv.appendChild(typeLabel);
      typeDiv.appendChild(typeSelect);
      controlsDiv.appendChild(typeDiv);
      
      // 演算法類型選擇
      const algoDiv = document.createElement('div');
      algoDiv.style.marginBottom = '10px';
      
      const algoLabel = document.createElement('label');
      algoLabel.textContent = '演算法類型: ';
      algoLabel.style.marginRight = '10px';
      algoLabel.style.color = 'white';
      
      const algoSelect = document.createElement('select');
      algoSelect.innerHTML = `
        <option value="constant">常數時間 O(1)</option>
        <option value="logarithmic">對數時間 O(log n)</option>
        <option value="linear" selected>線性時間 O(n)</option>
        <option value="linearithmic">線性對數時間 O(n log n)</option>
        <option value="quadratic">平方時間 O(n²)</option>
        <option value="cubic">立方時間 O(n³)</option>
        <option value="exponential">指數時間 O(2ⁿ)</option>
      `;
      algoSelect.value = this.config.algorithmType;
      algoSelect.addEventListener('change', () => {
        this.config.algorithmType = algoSelect.value;
        this.updateFormulaDisplay();
        this.updateCodeDisplay();
        this.updateMemoryDisplay();
      });
      
      algoDiv.appendChild(algoLabel);
      algoDiv.appendChild(algoSelect);
      controlsDiv.appendChild(algoDiv);
      
      // 最大輸入規模
      const nDiv = document.createElement('div');
      nDiv.style.marginBottom = '10px';
      
      const nLabel = document.createElement('label');
      nLabel.textContent = '最大輸入規模 (n): ';
      nLabel.style.marginRight = '10px';
      nLabel.style.color = 'white';
      
      const nInput = document.createElement('input');
      nInput.type = 'number';
      nInput.min = '5';
      nInput.max = '50';
      nInput.value = this.config.maxN;
      nInput.addEventListener('change', () => {
        const n = parseInt(nInput.value);
        if (n < 5) {
          nInput.value = '5';
          this.config.maxN = 5;
        } else if (n > 50) {
          nInput.value = '50';
          this.config.maxN = 50;
        } else {
          this.config.maxN = n;
        }
      });
      
      nDiv.appendChild(nLabel);
      nDiv.appendChild(nInput);
      controlsDiv.appendChild(nDiv);
      
      // 按鈕組
      const btnGroup = document.createElement('div');
      btnGroup.style.display = 'flex';
      btnGroup.style.gap = '10px';
      btnGroup.style.marginTop = '10px';
      
      const singleBtn = document.createElement('button');
      singleBtn.textContent = '視覺化單一複雜度';
      singleBtn.addEventListener('click', () => this.visualizeSingleComplexity());
      
      const compareBtn = document.createElement('button');
      compareBtn.textContent = '比較所有複雜度';
      compareBtn.addEventListener('click', () => this.compareAllComplexities());
      
      const resetBtn = document.createElement('button');
      resetBtn.textContent = '重置';
      resetBtn.addEventListener('click', () => {
        this.clearScene();
        this.updateCurrentOperation('演算法複雜度視覺化 - 請選擇分析類型');
      });
      
      btnGroup.appendChild(singleBtn);
      btnGroup.appendChild(compareBtn);
      btnGroup.appendChild(resetBtn);
      controlsDiv.appendChild(btnGroup);
      
      // 添加到容器
      this.container.appendChild(controlsDiv);
      
      // 存儲DOM引用
      this.typeSelect = typeSelect;
      this.algoSelect = algoSelect;
      this.nInput = nInput;
    }
    
    /**
     * 更新記憶體表顯示
     */
    updateMemoryDisplay() {
      let html = '<table style="width:100%; border-collapse:collapse; color:white;">';
      html += '<tr><th style="text-align:left; padding:5px; border-bottom:1px solid #444;">複雜度</th>';
      html += '<th style="text-align:left; padding:5px; border-bottom:1px solid #444;">n=10</th>';
      html += '<th style="text-align:left; padding:5px; border-bottom:1px solid #444;">n=100</th>';
      html += '<th style="text-align:left; padding:5px; border-bottom:1px solid #444;">n=1000</th></tr>';
      
      const complexities = [
        { name: "O(1)", fn: n => 1, type: "constant" },
        { name: "O(log n)", fn: n => Math.log2(n), type: "logarithmic" },
        { name: "O(n)", fn: n => n, type: "linear" },
        { name: "O(n log n)", fn: n => n * Math.log2(n), type: "linearithmic" },
        { name: "O(n²)", fn: n => n * n, type: "quadratic" },
        { name: "O(n³)", fn: n => n * n * n, type: "cubic" },
        { name: "O(2ⁿ)", fn: n => Math.pow(2, n), type: "exponential" }
      ];
      
      complexities.forEach(complexity => {
        const isActive = complexity.type === this.config.algorithmType;
        const colorHex = this.complexityColors[complexity.type].toString(16).padStart(6, '0');
        
        html += `<tr style="${isActive ? 'background-color:#333;' : ''}">`;
        html += `<td style="padding:5px; border-bottom:1px solid #444;"><span style="display:inline-block; width:12px; height:12px; background-color:#${colorHex}; margin-right:5px; border-radius:2px;"></span>${complexity.name}</td>`;
        html += `<td style="padding:5px; border-bottom:1px solid #444;">${complexity.fn(10).toFixed(2)}</td>`;
        html += `<td style="padding:5px; border-bottom:1px solid #444;">${complexity.fn(100) >= 1e6 ? '∞' : complexity.fn(100).toFixed(2)}</td>`;
        html += `<td style="padding:5px; border-bottom:1px solid #444;">${complexity.fn(1000) >= 1e6 ? '∞' : complexity.fn(1000).toFixed(2)}</td>`;
        html += '</tr>';
      });
      
      html += '</table>';
      
      // 如果記憶體視窗已開啟，更新內容
      if (FloatingWindow.isOpen('memory')) {
        FloatingWindow.update('memory', html);
      }
    }
    
    /**
     * 更新公式視窗內容
     */
    updateFormulaDisplay() {
      let html = `<div><span class="highlight">${this.config.complexityType === 'time' ? '時間' : '空間'}複雜度分析：</span></div><br>`;
      
      // 根據選擇的演算法類型更新公式
      switch(this.config.algorithmType) {
        case 'constant':
          html += `<div class="formula">O(1) - 常數${this.config.complexityType === 'time' ? '時間' : '空間'}</div>
                   <div>特點：執行時間與輸入規模無關</div>
                   <div>常見操作：陣列的索引存取、堆疊的push/pop</div>
                   <div>例如：訪問陣列中特定位置的元素</div>`;
          break;
        case 'logarithmic':
          html += `<div class="formula">O(log n) - 對數${this.config.complexityType === 'time' ? '時間' : '空間'}</div>
                   <div>特點：當輸入規模增加n倍時，運行時間只增加一個常數</div>
                   <div>常見操作：二分搜尋、平衡二元搜尋樹的操作</div>
                   <div>例如：在排序好的陣列中搜尋元素</div>`;
          break;
        case 'linear':
          html += `<div class="formula">O(n) - 線性${this.config.complexityType === 'time' ? '時間' : '空間'}</div>
                   <div>特點：執行時間與輸入規模成正比</div>
                   <div>常見操作：線性搜尋、陣列遍歷</div>
                   <div>例如：在未排序的陣列中搜尋元素</div>`;
          break;
        case 'linearithmic':
          html += `<div class="formula">O(n log n) - 線性對數${this.config.complexityType === 'time' ? '時間' : '空間'}</div>
                   <div>特點：比線性稍慢，但比平方快得多</div>
                   <div>常見操作：高效排序算法（如合併排序、快速排序）</div>
                   <div>例如：對 n 個元素進行合併排序</div>`;
          break;
        case 'quadratic':
          html += `<div class="formula">O(n²) - 平方${this.config.complexityType === 'time' ? '時間' : '空間'}</div>
                   <div>特點：當輸入規模增加n倍時，執行時間增加n²倍</div>
                   <div>常見操作：嵌套迴圈、簡單排序算法（如氣泡排序）</div>
                   <div>例如：對 n 個元素進行選擇排序</div>`;
          break;
        case 'cubic':
          html += `<div class="formula">O(n³) - 立方${this.config.complexityType === 'time' ? '時間' : '空間'}</div>
                   <div>特點：增長非常快，通常只適用於小規模輸入</div>
                   <div>常見操作：三層嵌套迴圈、某些矩陣運算</div>
                   <div>例如：標準矩陣乘法</div>`;
          break;
        case 'exponential':
          html += `<div class="formula">O(2ⁿ) - 指數${this.config.complexityType === 'time' ? '時間' : '空間'}</div>
                   <div>特點：增長極快，僅適用於非常小的輸入</div>
                   <div>常見操作：窮舉所有子集、遞迴費波那契數列</div>
                   <div>例如：計算費波那契數列的樸素遞迴演算法</div>`;
          break;
      }
      
      if (this.config.complexityType === 'space') {
        html += `<br><div>空間複雜度衡量演算法執行過程中所需的額外記憶體空間，並不包括輸入資料本身佔用的空間。</div>`;
      } else {
        html += `<br><div>時間複雜度衡量演算法執行所需的操作次數，而不是實際的執行時間，因此不受硬體速度的影響。</div>`;
      }
      
      // 如果公式視窗已開啟，更新內容
      if (FloatingWindow.isOpen('formula')) {
        FloatingWindow.update('formula', html);
      }
    }
    
    /**
     * 更新程式碼視窗內容
     */
    updateCodeDisplay() {
      let codeHtml = '';
      
      // 根據選擇的演算法類型更新代碼
      switch(this.config.algorithmType) {
        case 'constant':
          codeHtml = `<pre><span class="code-comment">// 常數時間複雜度: O(1)</span>
  <code>int getFirstElement(int arr[], int size) {
      return arr[0]; // 無論輸入大小，執行時間恆定
  }</code></pre>`;
          break;
        case 'logarithmic':
          codeHtml = `<pre><span class="code-comment">// 對數時間複雜度: O(log n)</span>
  <code>int binarySearch(int arr[], int left, int right, int x) {
      if (right >= left) {
          int mid = left + (right - left) / 2;
          
          if (arr[mid] == x)
              return mid;
              
          if (arr[mid] > x)
              return binarySearch(arr, left, mid - 1, x);
              
          return binarySearch(arr, mid + 1, right, x);
      }
      
      return -1;
  }</code></pre>`;
          break;
        case 'linear':
          codeHtml = `<pre><span class="code-comment">// 線性時間複雜度: O(n)</span>
  <code>int linearSearch(int arr[], int size, int x) {
      for (int i = 0; i < size; i++) {
          if (arr[i] == x)
              return i;
      }
      return -1;
  }</code></pre>`;
          break;
        case 'linearithmic':
          codeHtml = `<pre><span class="code-comment">// 線性對數時間複雜度: O(n log n)</span>
  <code>void mergeSort(int arr[], int left, int right) {
      if (left < right) {
          int mid = left + (right - left) / 2;
          
          mergeSort(arr, left, mid);
          mergeSort(arr, mid + 1, right);
          
          merge(arr, left, mid, right);
      }
  }</code></pre>`;
          break;
        case 'quadratic':
          codeHtml = `<pre><span class="code-comment">// 平方時間複雜度: O(n²)</span>
  <code>void bubbleSort(int arr[], int n) {
      for (int i = 0; i < n-1; i++) {
          for (int j = 0; j < n-i-1; j++) {
              if (arr[j] > arr[j+1]) {
                  // 交換 arr[j] 和 arr[j+1]
                  int temp = arr[j];
                  arr[j] = arr[j+1];
                  arr[j+1] = temp;
              }
          }
      }
  }</code></pre>`;
          break;
        case 'cubic':
          codeHtml = `<pre><span class="code-comment">// 立方時間複雜度: O(n³)</span>
  <code>void multiplyMatrix(int A[][N], int B[][N], int C[][N], int size) {
      for (int i = 0; i < size; i++) {
          for (int j = 0; j < size; j++) {
              C[i][j] = 0;
              for (int k = 0; k < size; k++) {
                  C[i][j] += A[i][k] * B[k][j];
              }
          }
      }
  }</code></pre>`;
          break;
        case 'exponential':
          codeHtml = `<pre><span class="code-comment">// 指數時間複雜度: O(2ⁿ)</span>
  <code>int fibonacci(int n) {
      if (n <= 1)
          return n;
      return fibonacci(n-1) + fibonacci(n-2);
  }</code></pre>`;
          break;
      }
      
      // 如果程式碼視窗已開啟，更新內容
      if (FloatingWindow.isOpen('code')) {
        FloatingWindow.update('code', codeHtml);
      }
    }
    
    /**
     * 計算複雜度
     * @param {string} type - 複雜度類型
     * @param {number} n - 輸入規模
     * @returns {number} 計算結果
     */
    calculateComplexity(type, n) {
      switch(type) {
        case 'constant': return 1;
        case 'logarithmic': return Math.log2(n);
        case 'linear': return n;
        case 'linearithmic': return n * Math.log2(n);
        case 'quadratic': return n * n;
        case 'cubic': return n * n * n;
        case 'exponential': return Math.pow(2, n);
        default: return n;
      }
    }
    
    /**
     * 生成複雜度數據
     * @param {string} type - 複雜度類型
     * @param {number} maxN - 最大輸入規模
     * @returns {Array} 數據點陣列
     */
    generateComplexityData(type, maxN) {
      const data = [];
      const maxValue = 10; // Y軸最大值
      
      for (let i = 1; i <= maxN; i++) {
        let value = this.calculateComplexity(type, i);
        
        // 如果值超出範圍，進行縮放
        value = Math.min(value, maxValue);
        
        data.push({ x: i, y: value });
      }
      
      return data;
    }
    
    /**
     * 創建坐標軸和網格
     */
    createAxes() {
      const axisLength = 12;
      const gridSize = 10;
      
      // X軸 (水平)
      const xAxis = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, axisLength, 8),
        new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
      );
      xAxis.rotation.z = Math.PI / 2;
      xAxis.position.set(axisLength / 2 - 1, 0, 0);
      this.scene.add(xAxis);
      this.lines.push(xAxis);
      
      // Y軸 (垂直)
      const yAxis = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, axisLength, 8),
        new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
      );
      yAxis.position.set(0, axisLength / 2 - 1, 0);
      this.scene.add(yAxis);
      this.lines.push(yAxis);
      
      // 軸標籤 - 使用較大字體
      const xLabel = this.createTextSprite("輸入規模 (n)", 60);
      xLabel.position.set(axisLength - 1, -1, 0);
      this.scene.add(xLabel);
      this.labels.push(xLabel);
      
      const yLabel = this.createTextSprite(this.config.complexityType === 'time' ? "執行時間" : "記憶體使用", 60);
      yLabel.position.set(-2, axisLength - 1, 0);
      this.scene.add(yLabel);
      this.labels.push(yLabel);
      
      // 網格線
      for (let i = 1; i <= gridSize; i++) {
        const x = i;
        const gridLine = new THREE.Mesh(
          new THREE.CylinderGeometry(0.01, 0.01, axisLength - 2, 8),
          new THREE.MeshBasicMaterial({ color: 0x333333 })
        );
        gridLine.position.set(x, (axisLength - 2) / 2, -0.1);
        this.scene.add(gridLine);
        this.grids.push(gridLine);
        
        // X軸刻度標籤 - 使用較大字體
        if (i % 2 === 0 || i === 1) {
          const tickLabel = this.createTextSprite(i.toString(), 30);
          tickLabel.position.set(x, -0.6, 0);
          this.scene.add(tickLabel);
          this.labels.push(tickLabel);
        }
      }
      
      for (let i = 1; i <= gridSize; i++) {
        const y = i;
        const gridLine = new THREE.Mesh(
          new THREE.CylinderGeometry(0.01, 0.01, axisLength - 2, 8),
          new THREE.MeshBasicMaterial({ color: 0x333333 })
        );
        gridLine.rotation.z = Math.PI / 2;
        gridLine.position.set((axisLength - 2) / 2, y, -0.1);
        this.scene.add(gridLine);
        this.grids.push(gridLine);
        
        // Y軸刻度標籤 - 使用較大字體
        if (i % 2 === 0 || i === 1) {
          const tickLabel = this.createTextSprite(i.toString(), 30);
          tickLabel.position.set(-0.6, y, 0);
          this.scene.add(tickLabel);
          this.labels.push(tickLabel);
        }
      }
    }
    
    /**
     * 視覺化單一複雜度
     */
    visualizeSingleComplexity() {
      this.clearScene();
      
      this.config.showComparison = false;
      
      // 創建坐標軸
      this.createAxes();
      
      // 獲取數據點
      const points3D = this.generateComplexityData(this.config.algorithmType, this.config.maxN);
      
      // 繪製曲線
      this.drawComplexityCurve(points3D, this.complexityColors[this.config.algorithmType]);
      
      // 更新顯示
      this.updateFormulaDisplay();
      this.updateCodeDisplay();
      this.updateMemoryDisplay();
      
      // 添加標題
      const title = this.createTextSprite(`${this.config.complexityType === 'time' ? '時間' : '空間'}複雜度: ${this.complexityNames[this.config.algorithmType]}`, 110);
      title.position.set(6, 12, 0);
      this.scene.add(title);
      this.labels.push(title);
      
      // 更新當前操作描述
      this.updateCurrentOperation(`視覺化 ${this.config.complexityType === 'time' ? '時間' : '空間'}複雜度: ${this.complexityNames[this.config.algorithmType]}`);
    }
    
    /**
     * 比較所有複雜度
     */
    compareAllComplexities() {
      this.clearScene();
      
      this.config.showComparison = true;
      
      // 創建坐標軸
      this.createAxes();
      
      // 繪製所有複雜度曲線
      const complexityTypes = ['constant', 'logarithmic', 'linear', 'linearithmic', 'quadratic', 'cubic', 'exponential'];
      
      complexityTypes.forEach(type => {
        const points3D = this.generateComplexityData(type, this.config.maxN);
        this.drawComplexityCurve(points3D, this.complexityColors[type]);
      });
      
      // 添加圖例
      this.addLegend();
      
      // 更新顯示
      this.updateFormulaDisplay();
      this.updateCodeDisplay();
      this.updateMemoryDisplay();
      
      // 添加標題
      const title = this.createTextSprite(`所有${this.config.complexityType === 'time' ? '時間' : '空間'}複雜度比較`, 110);
      title.position.set(6, 12, 0);
      this.scene.add(title);
      this.labels.push(title);
      
      // 更新當前操作描述
      this.updateCurrentOperation(`比較所有${this.config.complexityType === 'time' ? '時間' : '空間'}複雜度`);
    }
    
    /**
     * 繪製複雜度曲線
     * @param {Array} data - 數據點陣列
     * @param {number} color - 曲線顏色
     */
    drawComplexityCurve(data, color) {
      // 添加點
      data.forEach(point => {
        const pointGeometry = new THREE.SphereGeometry(0.15, 16, 16);
        const pointMaterial = new THREE.MeshBasicMaterial({ color: color });
        const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);
        pointMesh.position.set(point.x, point.y, 0);
        this.scene.add(pointMesh);
        this.points.push(pointMesh);
      });
      
      // 連接點形成曲線 - 確保連線準確
      for (let i = 0; i < data.length - 1; i++) {
        const start = new THREE.Vector3(data[i].x, data[i].y, 0);
        const end = new THREE.Vector3(data[i+1].x, data[i+1].y, 0);
        
        // 計算線段的方向和長度
        const direction = new THREE.Vector3().subVectors(end, start);
        const length = direction.length();
        
        // 創建線段幾何體
        const lineGeometry = new THREE.CylinderGeometry(0.05, 0.05, length, 8);
        // 默認圓柱體是沿Y軸的，需要旋轉，先移動到正確位置
        lineGeometry.translate(0, length / 2, 0);
        
        const lineMaterial = new THREE.MeshBasicMaterial({ color: color });
        const line = new THREE.Mesh(lineGeometry, lineMaterial);
        
        // 設置線段的位置到起點
        line.position.copy(start);
        
        // 計算朝向終點的旋轉
        const quaternion = new THREE.Quaternion();
        // 創建一個向上的向量 (0,1,0)
        const up = new THREE.Vector3(0, 1, 0);
        // 計算所需旋轉角度
        quaternion.setFromUnitVectors(up, direction.clone().normalize());
        line.setRotationFromQuaternion(quaternion);
        
        this.scene.add(line);
        this.lines.push(line);
      }
    }
    
    /**
     * 添加複雜度圖例
     */
    addLegend() {
      const complexityTypes = [
        { type: 'constant', name: 'O(1)' },
        { type: 'logarithmic', name: 'O(log n)' },
        { type: 'linear', name: 'O(n)' },
        { type: 'linearithmic', name: 'O(n log n)' },
        { type: 'quadratic', name: 'O(n²)' },
        { type: 'cubic', name: 'O(n³)' },
        { type: 'exponential', name: 'O(2ⁿ)' }
      ];
      
      // 使用較大字體
      complexityTypes.forEach((complexity, index) => {
        const legendLabel = this.createTextSprite(complexity.name, 40);
        legendLabel.position.set(12, 8 - index * 1, 0);
        this.scene.add(legendLabel);
        this.labels.push(legendLabel);
        
        const legendBox = new THREE.Mesh(
          new THREE.BoxGeometry(0.5, 0.5, 0.5),
          new THREE.MeshBasicMaterial({ color: this.complexityColors[complexity.type] })
        );
        legendBox.position.set(11, 8 - index * 1, 0);
        this.scene.add(legendBox);
        this.points.push(legendBox);
      });
    }
    
    /**
     * 切換程式碼視窗顯示
     */
    toggleCode() {
      FloatingWindow.toggle('code', () => {
        // 獲取當前程式碼內容
        let codeHtml = '';
        
        // 根據選擇的演算法類型更新代碼
        switch(this.config.algorithmType) {
          case 'constant':
            codeHtml = `<pre><span class="code-comment">// 常數時間複雜度: O(1)</span>
  <code>int getFirstElement(int arr[], int size) {
      return arr[0]; // 無論輸入大小，執行時間恆定
  }</code></pre>`;
            break;
          case 'logarithmic':
            codeHtml = `<pre><span class="code-comment">// 對數時間複雜度: O(log n)</span>
  <code>int binarySearch(int arr[], int left, int right, int x) {
      if (right >= left) {
          int mid = left + (right - left) / 2;
          
          if (arr[mid] == x)
              return mid;
              
          if (arr[mid] > x)
              return binarySearch(arr, left, mid - 1, x);
              
          return binarySearch(arr, mid + 1, right, x);
      }
      
      return -1;
  }</code></pre>`;
            break;
          case 'linear':
            codeHtml = `<pre><span class="code-comment">// 線性時間複雜度: O(n)</span>
  <code>int linearSearch(int arr[], int size, int x) {
      for (int i = 0; i < size; i++) {
          if (arr[i] == x)
              return i;
      }
      return -1;
  }</code></pre>`;
            break;
          case 'linearithmic':
            codeHtml = `<pre><span class="code-comment">// 線性對數時間複雜度: O(n log n)</span>
  <code>void mergeSort(int arr[], int left, int right) {
      if (left < right) {
          int mid = left + (right - left) / 2;
          
          mergeSort(arr, left, mid);
          mergeSort(arr, mid + 1, right);
          
          merge(arr, left, mid, right);
      }
  }</code></pre>`;
            break;
          case 'quadratic':
            codeHtml = `<pre><span class="code-comment">// 平方時間複雜度: O(n²)</span>
  <code>void bubbleSort(int arr[], int n) {
      for (int i = 0; i < n-1; i++) {
          for (int j = 0; j < n-i-1; j++) {
              if (arr[j] > arr[j+1]) {
                  // 交換 arr[j] 和 arr[j+1]
                  int temp = arr[j];
                  arr[j] = arr[j+1];
                  arr[j+1] = temp;
              }
          }
      }
  }</code></pre>`;
            break;
          case 'cubic':
            codeHtml = `<pre><span class="code-comment">// 立方時間複雜度: O(n³)</span>
  <code>void multiplyMatrix(int A[][N], int B[][N], int C[][N], int size) {
      for (int i = 0; i < size; i++) {
          for (int j = 0; j < size; j++) {
              C[i][j] = 0;
              for (int k = 0; k < size; k++) {
                  C[i][j] += A[i][k] * B[k][j];
              }
          }
      }
  }</code></pre>`;
            break;
          case 'exponential':
            codeHtml = `<pre><span class="code-comment">// 指數時間複雜度: O(2ⁿ)</span>
  <code>int fibonacci(int n) {
      if (n <= 1)
          return n;
      return fibonacci(n-1) + fibonacci(n-2);
  }</code></pre>`;
            break;
        }
        
        return codeHtml;
      }, '程式碼示範');
    }
    
    /**
     * 切換記憶體視窗顯示
     */
    toggleMemory() {
      FloatingWindow.toggle('memory', () => {
        let html = '<table style="width:100%; border-collapse:collapse; color:white;">';
        html += '<tr><th style="text-align:left; padding:5px; border-bottom:1px solid #444;">複雜度</th>';
        html += '<th style="text-align:left; padding:5px; border-bottom:1px solid #444;">n=10</th>';
        html += '<th style="text-align:left; padding:5px; border-bottom:1px solid #444;">n=100</th>';
        html += '<th style="text-align:left; padding:5px; border-bottom:1px solid #444;">n=1000</th></tr>';
        
        const complexities = [
          { name: "O(1)", fn: n => 1, type: "constant" },
          { name: "O(log n)", fn: n => Math.log2(n), type: "logarithmic" },
          { name: "O(n)", fn: n => n, type: "linear" },
          { name: "O(n log n)", fn: n => n * Math.log2(n), type: "linearithmic" },
          { name: "O(n²)", fn: n => n * n, type: "quadratic" },
          { name: "O(n³)", fn: n => n * n * n, type: "cubic" },
          { name: "O(2ⁿ)", fn: n => Math.pow(2, n), type: "exponential" }
        ];
        
        complexities.forEach(complexity => {
          const isActive = complexity.type === this.config.algorithmType;
          const colorHex = this.complexityColors[complexity.type].toString(16).padStart(6, '0');
          
          html += `<tr style="${isActive ? 'background-color:#333;' : ''}">`;
          html += `<td style="padding:5px; border-bottom:1px solid #444;"><span style="display:inline-block; width:12px; height:12px; background-color:#${colorHex}; margin-right:5px; border-radius:2px;"></span>${complexity.name}</td>`;
          html += `<td style="padding:5px; border-bottom:1px solid #444;">${complexity.fn(10).toFixed(2)}</td>`;
          html += `<td style="padding:5px; border-bottom:1px solid #444;">${complexity.fn(100) >= 1e6 ? '∞' : complexity.fn(100).toFixed(2)}</td>`;
          html += `<td style="padding:5px; border-bottom:1px solid #444;">${complexity.fn(1000) >= 1e6 ? '∞' : complexity.fn(1000).toFixed(2)}</td>`;
          html += '</tr>';
        });
        
        html += '</table>';
        
        return html;
      }, '複雜度比較表');
    }
    
    /**
     * 切換公式視窗顯示
     */
    toggleFormula() {
      FloatingWindow.toggle('formula', () => {
        let html = `<div><span class="highlight">${this.config.complexityType === 'time' ? '時間' : '空間'}複雜度分析：</span></div><br>`;
        
        // 根據選擇的演算法類型更新公式
        switch(this.config.algorithmType) {
          case 'constant':
            html += `<div class="formula">O(1) - 常數${this.config.complexityType === 'time' ? '時間' : '空間'}</div>
                     <div>特點：執行時間與輸入規模無關</div>
                     <div>常見操作：陣列的索引存取、堆疊的push/pop</div>
                     <div>例如：訪問陣列中特定位置的元素</div>`;
            break;
          case 'logarithmic':
            html += `<div class="formula">O(log n) - 對數${this.config.complexityType === 'time' ? '時間' : '空間'}</div>
                     <div>特點：當輸入規模增加n倍時，運行時間只增加一個常數</div>
                     <div>常見操作：二分搜尋、平衡二元搜尋樹的操作</div>
                     <div>例如：在排序好的陣列中搜尋元素</div>`;
            break;
          case 'linear':
            html += `<div class="formula">O(n) - 線性${this.config.complexityType === 'time' ? '時間' : '空間'}</div>
                     <div>特點：執行時間與輸入規模成正比</div>
                     <div>常見操作：線性搜尋、陣列遍歷</div>
                     <div>例如：在未排序的陣列中搜尋元素</div>`;
            break;
          case 'linearithmic':
            html += `<div class="formula">O(n log n) - 線性對數${this.config.complexityType === 'time' ? '時間' : '空間'}</div>
                     <div>特點：比線性稍慢，但比平方快得多</div>
                     <div>常見操作：高效排序算法（如合併排序、快速排序）</div>
                     <div>例如：對 n 個元素進行合併排序</div>`;
            break;
          case 'quadratic':
            html += `<div class="formula">O(n²) - 平方${this.config.complexityType === 'time' ? '時間' : '空間'}</div>
                     <div>特點：當輸入規模增加n倍時，執行時間增加n²倍</div>
                     <div>常見操作：嵌套迴圈、簡單排序算法（如氣泡排序）</div>
                     <div>例如：對 n 個元素進行選擇排序</div>`;
            break;
          case 'cubic':
            html += `<div class="formula">O(n³) - 立方${this.config.complexityType === 'time' ? '時間' : '空間'}</div>
                     <div>特點：增長非常快，通常只適用於小規模輸入</div>
                     <div>常見操作：三層嵌套迴圈、某些矩陣運算</div>
                     <div>例如：標準矩陣乘法</div>`;
            break;
          case 'exponential':
            html += `<div class="formula">O(2ⁿ) - 指數${this.config.complexityType === 'time' ? '時間' : '空間'}</div>
                     <div>特點：增長極快，僅適用於非常小的輸入</div>
                     <div>常見操作：窮舉所有子集、遞迴費波那契數列</div>
                     <div>例如：計算費波那契數列的樸素遞迴演算法</div>`;
            break;
        }
        
        if (this.config.complexityType === 'space') {
          html += `<br><div>空間複雜度衡量演算法執行過程中所需的額外記憶體空間，並不包括輸入資料本身佔用的空間。</div>`;
        } else {
          html += `<br><div>時間複雜度衡量演算法執行所需的操作次數，而不是實際的執行時間，因此不受硬體速度的影響。</div>`;
        }
        
        return html;
      }, '複雜度分析');
    }
    
    /**
     * 重置模組
     */
    reset() {
      this.clearScene();
      this.visualizeSingleComplexity();
    }
    
    /**
     * 清除場景
     */
    clearScene() {
      // 移除所有線條和點
      this.lines.forEach(line => this.scene.remove(line));
      this.points.forEach(point => this.scene.remove(point));
      this.grids.forEach(grid => this.scene.remove(grid));
      this.labels.forEach(label => this.scene.remove(label));
      
      // 清空陣列
      this.lines = [];
      this.points = [];
      this.grids = [];
      this.labels = [];
      
      // 移除其他場景物件
      const toRemove = [];
      this.scene.traverse(child => {
        if (!(child instanceof THREE.Camera) && !(child instanceof THREE.Light))
          toRemove.push(child);
      });
      toRemove.forEach(obj => this.scene.remove(obj));
    }
    
    /**
     * 暫停動畫 - 此模組沒有連續動畫
     */
    pauseAnimation() {
      // 複雜度模組沒有連續動畫，無需實現
      return;
    }
    
    /**
     * 繼續動畫 - 此模組沒有連續動畫
     */
    resumeAnimation() {
      // 複雜度模組沒有連續動畫，無需實現
      return;
    }
    
    /**
     * 跳到下一步 - 此模組沒有分步動畫
     */
    stepForward() {
      // 複雜度模組沒有分步動畫，無需實現
      return;
    }
    
    /**
     * 銷毀模組
     */
    destroy() {
      // 清除Three.js場景
      super.destroy();
    }
  }
  
  // 導出模組類別
  window.ModuleClass = ComplexityModule;