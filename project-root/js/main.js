/**
 * 資料結構視覺化教學系統的主控制腳本
 * 處理模組載入、視窗切換和基本交互
 */

// 確保THREE是已定義的
if (typeof THREE === 'undefined') {
  console.error('THREE is not defined! 請確保已正確載入 Three.js 函式庫');
  alert('載入Three.js函式庫失敗，請檢查網路連接或重新整理頁面。');
}

// 模組配置
const modules = {
  array: {
    name: "多維陣列",
    description: "多維陣列模組展示了二維和三維陣列在記憶體中的儲存方式，包括行優先和列優先的排列方式。",
    jsPath: "js/modules/array.js"
  },
  polynomial: {
    name: "多項式",
    description: "多項式模組展示了多項式的稠密表示法和稀疏表示法，以及它們在記憶體中的儲存結構。",
    jsPath: "js/modules/polynomial.js"
  },
  recursion: {
    name: "遞迴",
    description: "遞迴模組可視化展示了遞迴算法的執行過程，包括費氏數列和階乘的遞迴樹結構。",
    jsPath: "js/modules/recursion.js"
  },
  complexity: {
    name: "演算法複雜度",
    description: "演算法複雜度模組展示了不同時間和空間複雜度的可視化比較，幫助理解複雜度分析。",
    jsPath: "js/modules/complexity.js"
  },
  hanoi: {
    name: "河內塔",
    description: "河內塔模組展示了經典的河內塔問題的遞迴解法，以及解決過程的視覺化演示。",
    jsPath: "js/modules/hanoi.js"
  },
  linkedlist: {
    name: "鏈結串列",
    description: "鏈結串列模組展示了單向、雙向和循環鏈結串列的結構，以及基本操作的視覺化過程。",
    jsPath: "js/modules/linkedlist.js"
  },
  stack: {
    name: "堆疊",
    description: "堆疊模組展示了堆疊的基本操作以及實際應用，包括括號匹配檢查和中序轉後序表達式。",
    jsPath: "js/modules/stack.js"
  },
  queue: {
    name: "佇列",
    description: "佇列模組展示了線性佇列和循環佇列的基本操作，以及它們在記憶體中的實現方式。",
    jsPath: "js/modules/queue.js"
  }
};

// 全局變量
let currentModule = null;
let currentModuleInstance = null;
let isModuleLoaded = false;
let isAnimationRunning = false;

// DOM元素
const currentOperationEl = document.getElementById('currentOperation');
const moduleDescriptionEl = document.getElementById('moduleDescription');
const tabElements = document.querySelectorAll('.tab');
const loadModuleBtn = document.getElementById('loadModuleBtn');
const resetModuleBtn = document.getElementById('resetModuleBtn');
const pauseResumeBtn = document.getElementById('pauseResumeBtn');
const stepForwardBtn = document.getElementById('stepForwardBtn');
const toggleControlsBtn = document.getElementById('toggleControlsBtn');
const controlsPanel = document.getElementById('controlsPanel');
const toggleCodeBtn = document.getElementById('toggleCodeBtn');
const toggleMemoryBtn = document.getElementById('toggleMemoryBtn');
const toggleFormulaBtn = document.getElementById('toggleFormulaBtn');
const loadingScreen = document.getElementById('loadingScreen');
const moduleContainer = document.getElementById('moduleContainer');

// 初始化加載畫面狀態
loadingScreen.style.display = 'none';

// 標籤點擊事件
tabElements.forEach(tab => {
  tab.addEventListener('click', function() {
    // 更新選中狀態
    tabElements.forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    
    // 更新當前模組
    currentModule = this.getAttribute('data-module');
    
    // 更新模組描述
    moduleDescriptionEl.textContent = modules[currentModule].description;
    
    // 更新頂部信息
    currentOperationEl.textContent = `已選擇: ${modules[currentModule].name} - 點擊下方載入按鈕開始視覺化`;
  });
});

// 加載模組按鈕點擊事件
loadModuleBtn.addEventListener('click', function() {
  if (!currentModule) {
    alert('請先選擇一個模組');
    return;
  }
  
  // 顯示加載畫面
  loadingScreen.style.display = 'flex';
  
  // 更新當前操作信息
  currentOperationEl.textContent = `正在載入 ${modules[currentModule].name}...`;
  
  // 如果已加載模組，先卸載
  if (isModuleLoaded && currentModuleInstance && typeof currentModuleInstance.destroy === 'function') {
    currentModuleInstance.destroy();
  }
  
  // 清空模組容器
  moduleContainer.innerHTML = '';
  
  // 清除任何留下的浮動視窗
  document.getElementById('floatingWindowsContainer').innerHTML = '';
  
  // 啟用控制按鈕
  resetModuleBtn.disabled = false;
  pauseResumeBtn.disabled = false;
  stepForwardBtn.disabled = false;
  pauseResumeBtn.textContent = '暫停動畫';
  isAnimationRunning = true;
  
  // 移除之前可能存在的模組腳本
  const oldScript = document.querySelector(`script[src="${modules[currentModule].jsPath}"]`);
  if (oldScript) {
    document.body.removeChild(oldScript);
  }
  
  // 確保全局類名已清除
  window.ModuleClass = undefined;
  
  // 加載模組腳本
  const script = document.createElement('script');
  script.src = modules[currentModule].jsPath;
  script.onload = function() {
    // 腳本加載完成後，檢查是否有對應的模組類
    if (window.ModuleClass) {
      try {
        // 創建模組實例
        currentModuleInstance = new window.ModuleClass(moduleContainer);
        
        // 初始化模組
        if (typeof currentModuleInstance.init === 'function') {
          currentModuleInstance.init();
        }
        
        isModuleLoaded = true;
        
        // 隱藏加載畫面
        loadingScreen.style.display = 'none';
        
        // 更新當前操作信息
        currentOperationEl.textContent = `${modules[currentModule].name} 模組已載入`;
      } catch (error) {
        console.error('模組初始化失敗', error);
        loadingScreen.style.display = 'none';
        alert(`模組初始化失敗: ${error.message}`);
        disableModuleControls();
      }
    } else {
      console.error('找不到模組類別');
      loadingScreen.style.display = 'none';
      alert('找不到模組類別，請確認模組檔案是否正確');
      disableModuleControls();
    }
    
    // 清除全局模組類，避免衝突
    window.ModuleClass = undefined;
  };
  
  script.onerror = function() {
    console.error('模組腳本載入失敗');
    loadingScreen.style.display = 'none';
    alert('模組腳本載入失敗，請確認檔案路徑是否正確');
    disableModuleControls();
  };
  
  document.body.appendChild(script);
});

// 重置模組按鈕點擊事件
resetModuleBtn.addEventListener('click', function() {
  if (!isModuleLoaded || !currentModuleInstance) {
    alert('請先載入一個模組');
    return;
  }
  
  if (typeof currentModuleInstance.reset === 'function') {
    currentModuleInstance.reset();
    currentOperationEl.textContent = `${modules[currentModule].name} 模組已重置`;
    
    // 重置控制狀態
    pauseResumeBtn.textContent = '暫停動畫';
    isAnimationRunning = true;
  } else {
    alert('該模組不支援重置功能');
  }
});

// 暫停/繼續按鈕點擊事件
pauseResumeBtn.addEventListener('click', function() {
  if (!isModuleLoaded || !currentModuleInstance) {
    alert('請先載入一個模組');
    return;
  }
  
  if (isAnimationRunning) {
    // 暫停動畫
    if (typeof currentModuleInstance.pauseAnimation === 'function') {
      currentModuleInstance.pauseAnimation();
      pauseResumeBtn.textContent = '繼續動畫';
      isAnimationRunning = false;
    } else {
      alert('該模組不支援暫停動畫功能');
    }
  } else {
    // 繼續動畫
    if (typeof currentModuleInstance.resumeAnimation === 'function') {
      currentModuleInstance.resumeAnimation();
      pauseResumeBtn.textContent = '暫停動畫';
      isAnimationRunning = true;
    } else {
      alert('該模組不支援繼續動畫功能');
    }
  }
});

// 下一步按鈕點擊事件
stepForwardBtn.addEventListener('click', function() {
  if (!isModuleLoaded || !currentModuleInstance) {
    alert('請先載入一個模組');
    return;
  }
  
  if (typeof currentModuleInstance.stepForward === 'function') {
    currentModuleInstance.stepForward();
  } else {
    alert('該模組不支援逐步執行功能');
  }
});

// 控制面板切換按鈕
toggleControlsBtn.addEventListener('click', function() {
  controlsPanel.classList.toggle('collapsed');
  this.textContent = controlsPanel.classList.contains('collapsed') ? '顯示控制面板' : '隱藏控制面板';
});

// 程式碼切換按鈕
toggleCodeBtn.addEventListener('click', function() {
  if (!isModuleLoaded) {
    // 如果未加載模組，創建一個默認的程式碼視窗
    FloatingWindow.createCode('// 尚未選擇具體模組，請先載入模組後查看程式碼示範');
    return;
  }
  
  // 如果已加載模組，調用模組的toggleCode方法
  if (currentModuleInstance && typeof currentModuleInstance.toggleCode === 'function') {
    currentModuleInstance.toggleCode();
  } else {
    alert('該模組不支援程式碼視窗功能');
  }
});

// 記憶體佈局切換按鈕
toggleMemoryBtn.addEventListener('click', function() {
  if (!isModuleLoaded) {
    // 如果未加載模組，創建一個默認的記憶體視窗
    FloatingWindow.createMemory([]);
    return;
  }
  
  // 如果已加載模組，調用模組的toggleMemory方法
  if (currentModuleInstance && typeof currentModuleInstance.toggleMemory === 'function') {
    currentModuleInstance.toggleMemory();
  } else {
    alert('該模組不支援記憶體佈局視窗功能');
  }
});

// 公式說明切換按鈕
toggleFormulaBtn.addEventListener('click', function() {
  if (!isModuleLoaded) {
    // 如果未加載模組，創建一個默認的公式視窗
    FloatingWindow.createFormula('<div>尚未選擇具體模組，請先載入模組後查看公式與說明</div>');
    return;
  }
  
  // 如果已加載模組，調用模組的toggleFormula方法
  if (currentModuleInstance && typeof currentModuleInstance.toggleFormula === 'function') {
    currentModuleInstance.toggleFormula();
  } else {
    alert('該模組不支援公式視窗功能');
  }
});

// 視窗大小調整事件
window.addEventListener('resize', function() {
  if (isModuleLoaded && currentModuleInstance && typeof currentModuleInstance.onResize === 'function') {
    currentModuleInstance.onResize(window.innerWidth, window.innerHeight);
  }
});

// 監聽模組消息
window.addEventListener('message', function(event) {
  // 處理從模組接收的消息
  console.log('接收到來自模組的消息', event.data);
  
  // 如果模組更新了當前操作信息
  if (event.data && event.data.type === 'updateOperation') {
    currentOperationEl.textContent = event.data.content;
  }
});

// 禁用模組控制按鈕
function disableModuleControls() {
  resetModuleBtn.disabled = true;
  pauseResumeBtn.disabled = true;
  stepForwardBtn.disabled = true;
  isModuleLoaded = false;
  currentModuleInstance = null;
}

/**
 * 模組基礎類別 - 所有模組都應繼承此類別
 */
class ModuleBase {
  /**
   * @param {HTMLElement} container - 模組容器元素
   */
  constructor(container) {
    // 首先檢查THREE是否已定義
    if (typeof THREE === 'undefined') {
      throw new Error('THREE is not defined! 請確保已正確載入 Three.js 函式庫');
    }
    
    this.container = container;
    this.isInitialized = false;
    this.isAnimationRunning = true;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.clock = new THREE.Clock();
    
    // 創建必要的元素
    this.createRenderer();
    this.createScene();
    this.createCamera();
    this.createLights();
    this.setupControls();
    
    // 綁定方法的this作用域
    this.animate = this.animate.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);
    
    // 添加事件監聽器
    window.addEventListener('resize', this.onWindowResize);
    
    // 開始動畫循環
    this.animate();
  }
  
  /**
   * 創建渲染器
   */
  createRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x111111);
    this.container.appendChild(this.renderer.domElement);
  }
  
  /**
   * 創建場景
   */
  createScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111111);
  }
  
  /**
   * 創建相機
   */
  createCamera() {
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(10, 6, 10);
    this.camera.lookAt(0, 0, 0);
  }
  
  /**
   * 創建燈光
   */
  createLights() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    this.scene.add(directionalLight);
  }
  
  /**
   * 設置軌道控制器
   */
  setupControls() {
    // 確保OrbitControls已經加載
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
    } else {
      console.warn('THREE.OrbitControls 未定義，無法使用相機控制功能');
    }
  }
  
  /**
   * 動畫循環
   */
  animate() {
    requestAnimationFrame(this.animate);
    
    // 更新控制器
    if (this.controls) {
      this.controls.update();
    }
    
    // 自定義更新邏輯
    if (this.isAnimationRunning && typeof this.update === 'function') {
      this.update();
    }
    
    // 渲染場景
    this.renderer.render(this.scene, this.camera);
  }
  
  /**
   * 視窗大小變化處理
   */
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  /**
   * 創建文字精靈
   * @param {string} text - 要顯示的文字
   * @param {number} size - 文字大小，默認為90
   * @param {string} color - 文字顏色，默認為白色
   * @returns {THREE.Sprite} 文字精靈物件
   */
  createTextSprite(text, size = 90, color = 'white') {
    const textLength = text.length;
    let canvasWidth, canvasHeight;
    
    if (size >= 150) {
      canvasWidth = Math.max(3072, textLength * 180);
      canvasHeight = 1024;
    } else if (size >= 100) {
      canvasWidth = Math.max(2048, textLength * 120);
      canvasHeight = 768;
    } else {
      canvasWidth = Math.max(1024, textLength * 60);
      canvasHeight = 512;
    }
    
    const scaleFactor = 2;
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth * scaleFactor;
    canvas.height = canvasHeight * scaleFactor;
    
    const ctx = canvas.getContext('2d');
    ctx.scale(scaleFactor, scaleFactor);
    ctx.fillStyle = 'rgba(0,0,0,0.0)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    const fontSize = size * 2.0;
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width;
    
    if (textWidth > canvasWidth * 0.8) {
      const newWidth = textWidth * 1.25;
      canvas.width = newWidth * scaleFactor;
      canvasWidth = newWidth;
      ctx.scale(scaleFactor, scaleFactor);
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
    }
    
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = fontSize / 15;
    ctx.strokeText(text, canvasWidth / 2, canvasHeight / 2);
    ctx.fillStyle = color;
    ctx.fillText(text, canvasWidth / 2, canvasHeight / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false
    }));
    
    let spriteScale;
    if (size >= 150) spriteScale = 5.0;
    else if (size >= 100) spriteScale = 3.5;
    else if (size >= 70) spriteScale = 2.5;
    else spriteScale = 2.0;
    
    sprite.scale.set(spriteScale * (canvasWidth / canvasHeight), spriteScale, 1);
    
    return sprite;
  }
  
  /**
   * 初始化模組，子類別應實現此方法
   */
  init() {
    // 子類別實現
    this.isInitialized = true;
  }
  
  /**
   * 重置模組，子類別應實現此方法
   */
  reset() {
    // 子類別實現
  }
  
  /**
   * 銷毀模組，清理資源
   */
  destroy() {
    // 移除事件監聽器
    window.removeEventListener('resize', this.onWindowResize);
    
    // 停止動畫循環
    this.isAnimationRunning = false;
    
    // 清理Three.js場景
    this.clearScene();
    
    // 移除渲染器
    if (this.renderer && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
      this.renderer.dispose();
    }
    
    // 清空容器
    this.container.innerHTML = '';
    
    // 清理浮動視窗
    document.getElementById('floatingWindowsContainer').innerHTML = '';
    
    this.isInitialized = false;
  }
  
  /**
   * 清理Three.js場景
   */
  clearScene() {
    if (!this.scene) return;
    
    // 遞迴移除所有物件
    const clearObject = (obj) => {
      while (obj.children.length > 0) {
        clearObject(obj.children[0]);
        obj.remove(obj.children[0]);
      }
      
      if (obj.geometry) obj.geometry.dispose();
      
      if (obj.material) {
        if (obj.material.map) obj.material.map.dispose();
        obj.material.dispose();
      }
    };
    
    clearObject(this.scene);
  }
  
  /**
   * 暫停動畫
   */
  pauseAnimation() {
    this.isAnimationRunning = false;
  }
  
  /**
   * 繼續動畫
   */
  resumeAnimation() {
    this.isAnimationRunning = true;
  }
  
  /**
   * 逐步執行，子類別應實現此方法
   */
  stepForward() {
    // 子類別實現
  }
  
  /**
   * 切換程式碼視窗顯示
   */
  toggleCode() {
    FloatingWindow.toggle('code', () => '// 基本模組沒有提供程式碼示範', '程式碼示範');
  }
  
  /**
   * 切換記憶體視窗顯示
   */
  toggleMemory() {
    FloatingWindow.toggle('memory', () => [], '記憶體佈局');
  }
  
  /**
   * 切換公式視窗顯示
   */
  toggleFormula() {
    FloatingWindow.toggle('formula', () => '<div>基本模組沒有提供公式與說明</div>', '公式與說明');
  }
  
  /**
   * 視窗大小變化處理
   */
  onResize(width, height) {
    if (this.camera && this.renderer) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }
  }
  
  /**
   * 更新當前操作信息
   * @param {string} text - 操作信息文字
   */
  updateCurrentOperation(text) {
    currentOperationEl.textContent = text;
  }
}

// 導出模組基礎類別
window.ModuleBase = ModuleBase;

// 初始化函數
function init() {
  console.log('資料結構視覺化教學系統初始化完成');
  
  // 默認選擇第一個模組
  const firstTab = document.querySelector('.tab');
  if (firstTab) {
    firstTab.classList.add('active');
    currentModule = firstTab.getAttribute('data-module');
    moduleDescriptionEl.textContent = modules[currentModule].description;
  }
  
  // 創建浮動視窗容器
  if (!document.getElementById('floatingWindowsContainer')) {
    const container = document.createElement('div');
    container.id = 'floatingWindowsContainer';
    document.body.appendChild(container);
  }
}

// 在main.js中添加以下代碼來處理數學公式顯示

/**
 * 更新頂部資訊區的操作說明，並正確處理數學公式
 * @param {string} text - 原始文本
 */
function updateCurrentOperationWithFormula(text) {
  // 處理文本中的數學公式 - 檢測和轉換 x^n 格式
  const formattedText = text.replace(/(\d+)?x\^(\d+)/g, function(match, coefficient, exponent) {
    coefficient = coefficient || ''; // 如果係數不存在，則為空字符串
    return `${coefficient}x<sup>${exponent}</sup>`;
  });
  
  // 更新顯示
  document.getElementById('currentOperation').innerHTML = formattedText;
}

// 封裝原始的更新函數，使其支持數學公式
const originalUpdateCurrentOperation = window.ModuleBase.prototype.updateCurrentOperation;
window.ModuleBase.prototype.updateCurrentOperation = function(text) {
  // 使用增強版的更新函數
  updateCurrentOperationWithFormula(text);
};

// 設置在頁面加載時載入數學工具
document.addEventListener('DOMContentLoaded', function() {
  // 創建腳本標籤
  const mathUtilsScript = document.createElement('script');
  mathUtilsScript.src = 'js/mathUtils.js';
  mathUtilsScript.async = true;
  
  // 添加到頁面
  document.head.appendChild(mathUtilsScript);
  
  // 檢查頂部信息欄中是否有數學公式，如果有則修正它
  const currentOperationEl = document.getElementById('currentOperation');
  if (currentOperationEl) {
    const text = currentOperationEl.innerHTML;
    updateCurrentOperationWithFormula(text);
  }
});

// 頁面加載完成後初始化
window.onload = init;