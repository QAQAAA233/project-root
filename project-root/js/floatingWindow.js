/**
 * 浮動視窗系統
 * 提供可拖動、可縮放、可關閉的浮動視窗，用於顯示程式碼、記憶體與公式等內容
 * 使用 Monaco Editor 實現代碼高亮
 */

// 實例計數器，用於生成唯一ID
let windowCounter = 0;

// 已開啟的視窗列表
const openWindows = {
  code: null,
  memory: null,
  formula: null
};

// 代碼編輯器實例
const editorInstances = {};

/**
 * 初始化 Monaco Editor
 * 加載 Monaco 編輯器的必要腳本和樣式
 */
function loadMonacoEditor() {
  if (window.monaco) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    // 檢查是否已載入相關腳本
    if (document.getElementById('monaco-loader')) {
      // 等待 monaco 全局物件可用
      const checkMonaco = setInterval(() => {
        if (window.monaco) {
          clearInterval(checkMonaco);
          resolve();
        }
      }, 100);
      return;
    }

    // 添加 Monaco 環境腳本
    const script = document.createElement('script');
    script.id = 'monaco-loader';
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs/loader.min.js';
    script.async = true;
    script.onload = () => {
      // 配置 Monaco 加載器
      window.require.config({
        paths: {
          'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs'
        }
      });

      // 加載 Monaco 編輯器
      window.require(['vs/editor/editor.main'], () => {
        // 定義常用的語言主題
        monaco.editor.defineTheme('vscode-dark', {
          base: 'vs-dark',
          inherit: true,
          rules: [
            { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
            { token: 'keyword', foreground: '569CD6' },
            { token: 'string', foreground: 'CE9178' },
            { token: 'number', foreground: 'B5CEA8' },
            { token: 'operator', foreground: 'D4D4D4' },
            { token: 'delimiter', foreground: 'D4D4D4' }
          ],
          colors: {
            'editor.background': '#1E1E1E',
            'editor.foreground': '#D4D4D4',
            'editorLineNumber.foreground': '#858585',
            'editor.lineHighlightBackground': '#2D2D30',
            'editorCursor.foreground': '#A7A7A7',
            'editor.selectionBackground': '#264F78',
            'editor.inactiveSelectionBackground': '#3A3D41'
          }
        });

        resolve();
      });
    };
    script.onerror = reject;
    document.head.appendChild(script);

    // 添加 Monaco 編輯器樣式
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs/editor/editor.main.min.css';
    document.head.appendChild(link);
  });
}

/**
 * 創建一個浮動視窗
 * @param {string} title - 視窗標題
 * @param {string} content - 視窗內容（HTML字符串）
 * @param {string} type - 視窗類型（code, memory, formula）
 * @param {Object} options - 額外選項（寬度、高度、位置等）
 * @returns {HTMLElement} 創建的視窗元素
 */
function createFloatingWindow(title, content, type, options = {}) {
  // 如果已有同類型視窗打開，先關閉
  if (openWindows[type]) {
    openWindows[type].remove();
    if (editorInstances[type]) {
      editorInstances[type].dispose();
      delete editorInstances[type];
    }
    openWindows[type] = null;
  }
  
  const id = `floating-window-${++windowCounter}`;
  
  // 創建視窗容器
  const windowElement = document.createElement('div');
  windowElement.id = id;
  windowElement.className = `floating-window ${type}-window`;
  windowElement.style.width = options.width || (type === 'code' ? '600px' : '400px');
  windowElement.style.height = options.height || (type === 'code' ? '400px' : '300px');
  windowElement.style.top = options.top || '100px';
  windowElement.style.left = options.left || (type === 'formula' ? '100px' : 
                            type === 'code' ? '50%' : 'calc(100% - 500px)');
  
  if (type === 'code' && !options.left) {
    windowElement.style.transform = 'translateX(-50%)';
  }
  
  // 創建視窗標題欄
  const header = document.createElement('div');
  header.className = 'floating-window-header';
  
  const titleElement = document.createElement('h3');
  titleElement.className = 'floating-window-title';
  titleElement.textContent = title;
  
  const closeButton = document.createElement('button');
  closeButton.className = 'floating-window-close';
  closeButton.textContent = '×';
  closeButton.title = '關閉';
  closeButton.onclick = () => {
    windowElement.remove();
    if (editorInstances[type]) {
      editorInstances[type].dispose();
      delete editorInstances[type];
    }
    openWindows[type] = null;
  };
  
  header.appendChild(titleElement);
  header.appendChild(closeButton);
  
  // 創建視窗內容區
  const contentElement = document.createElement('div');
  contentElement.className = 'floating-window-content';
  
  // 修正滾動問題 - 設置明確的樣式
  contentElement.style.overflowY = 'auto';
  contentElement.style.maxHeight = 'calc(100% - 40px)'; // 減去標題欄高度
  contentElement.style.boxSizing = 'border-box';
  contentElement.style.position = 'relative';
  
  // 組裝視窗
  windowElement.appendChild(header);
  windowElement.appendChild(contentElement);
  
  // 添加到文檔
  const floatingContainer = document.getElementById('floatingWindowsContainer');
  if (!floatingContainer) {
    const container = document.createElement('div');
    container.id = 'floatingWindowsContainer';
    document.body.appendChild(container);
  }
  document.getElementById('floatingWindowsContainer').appendChild(windowElement);
  
  // 處理內容
  if (type === 'code') {
    // 先放一個占位符，等 Monaco 加載完成後替換
    const editorContainer = document.createElement('div');
    editorContainer.id = `editor-container-${id}`;
    editorContainer.style.width = '100%';
    editorContainer.style.height = 'calc(100% - 10px)';
    editorContainer.style.overflow = 'hidden';
    contentElement.appendChild(editorContainer);
    
    // 加載 Monaco 編輯器
    loadMonacoEditor().then(() => {
      // 創建代碼編輯器
      const editor = monaco.editor.create(editorContainer, {
        value: content,
        language: options.language || detectLanguage(content),
        theme: 'vscode-dark',
        readOnly: true,
        automaticLayout: true,
        minimap: {
          enabled: false
        },
        scrollBeyondLastLine: false,
        lineNumbers: 'on',
        scrollbar: {
          vertical: 'visible',
          horizontal: 'visible'
        },
        fontSize: 14,
        renderLineHighlight: 'all'
      });
      
      // 存儲編輯器實例
      editorInstances[type] = editor;
      
      // 讓編輯器在視窗大小變化時自動調整大小
      window.addEventListener('resize', () => {
        editor.layout();
      });
    }).catch(error => {
      console.error('Monaco Editor 加載失敗:', error);
      contentElement.innerHTML = `<pre style="white-space:pre-wrap;word-wrap:break-word;margin:0;">${content}</pre>`;
    });
  } else {
    contentElement.innerHTML = content;
  }
  
  // 實現拖動功能
  makeDraggable(windowElement, header);
  
  // 實現調整大小功能
  makeResizable(windowElement);
  
  // 儲存視窗引用
  openWindows[type] = windowElement;
  
  return windowElement;
}

/**
 * 根據代碼內容檢測程式語言
 * @param {string} code - 代碼內容
 * @returns {string} 檢測到的語言
 */
function detectLanguage(code) {
  // 簡單的語言檢測邏輯
  if (code.includes('int') && code.includes('return') && (code.includes('{') || code.includes('}'))) {
    return 'cpp'; // C/C++
  } else if (code.includes('function') || code.includes('const') || code.includes('let') || code.includes('var')) {
    return 'javascript';
  } else if (code.includes('def') && code.includes(':')) {
    return 'python';
  } else if (code.includes('class') && code.includes('public') && code.includes('private')) {
    return 'java';
  }
  return 'plaintext';
}

/**
 * 使元素可拖動
 * @param {HTMLElement} element - 要拖動的元素
 * @param {HTMLElement} handle - 拖動手柄元素（通常是標題欄）
 */
function makeDraggable(element, handle) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  
  handle.onmousedown = dragMouseDown;
  
  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    
    // 獲取鼠標位置
    pos3 = e.clientX;
    pos4 = e.clientY;
    
    // 當鼠標釋放或離開，停止移動
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
    
    // 提升拖動中視窗的z-index
    const allWindows = document.querySelectorAll('.floating-window');
    allWindows.forEach(win => {
      win.style.zIndex = '1000';
    });
    element.style.zIndex = '1001';
  }
  
  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    
    // 計算新位置
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    
    // 移動元素
    const newTop = element.offsetTop - pos2;
    const newLeft = element.offsetLeft - pos1;
    
    // 限制視窗不超出螢幕
    const maxTop = window.innerHeight - handle.offsetHeight;
    const maxLeft = window.innerWidth - handle.offsetWidth;
    
    element.style.top = Math.max(0, Math.min(newTop, maxTop)) + 'px';
    element.style.left = Math.max(0, Math.min(newLeft, maxLeft)) + 'px';
    
    // 如果是程式碼視窗被拖動，移除transform屬性
    if (element.classList.contains('code-window')) {
      element.style.transform = 'none';
    }
  }
  
  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

/**
 * 使元素可調整大小
 * @param {HTMLElement} element - 要調整大小的元素
 */
function makeResizable(element) {
  // 創建調整大小的控制點
  const resizer = document.createElement('div');
  resizer.className = 'resizer';
  resizer.style.width = '10px';
  resizer.style.height = '10px';
  resizer.style.background = '#4CAF50';
  resizer.style.position = 'absolute';
  resizer.style.right = '0';
  resizer.style.bottom = '0';
  resizer.style.cursor = 'nwse-resize';
  
  element.appendChild(resizer);
  
  let original_width = 0;
  let original_height = 0;
  let original_x = 0;
  let original_y = 0;
  let original_mouse_x = 0;
  let original_mouse_y = 0;
  
  resizer.addEventListener('mousedown', function(e) {
    e.preventDefault();
    original_width = parseFloat(getComputedStyle(element, null).getPropertyValue('width').replace('px', ''));
    original_height = parseFloat(getComputedStyle(element, null).getPropertyValue('height').replace('px', ''));
    original_x = element.getBoundingClientRect().left;
    original_y = element.getBoundingClientRect().top;
    original_mouse_x = e.pageX;
    original_mouse_y = e.pageY;
    
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResize);
  });
  
  function resize(e) {
    const width = original_width + (e.pageX - original_mouse_x);
    const height = original_height + (e.pageY - original_mouse_y);
    
    if (width > 200) {
      element.style.width = width + 'px';
    }
    
    if (height > 150) {
      element.style.height = height + 'px';
    }
    
    // 如果是代碼視窗，調整編輯器大小
    if (element.classList.contains('code-window')) {
      for (const type in editorInstances) {
        if (openWindows[type] === element && editorInstances[type]) {
          editorInstances[type].layout();
        }
      }
    }
  }
  
  function stopResize() {
    window.removeEventListener('mousemove', resize);
  }
}

/**
 * 更新浮動視窗內容
 * @param {string} type - 視窗類型（code, memory, formula）
 * @param {string} content - 新內容（HTML字符串）
 */
function updateFloatingWindowContent(type, content) {
  const window = openWindows[type];
  if (window) {
    if (type === 'code' && editorInstances[type]) {
      // 更新代碼編輯器內容
      editorInstances[type].setValue(content);
    } else {
      const contentElement = window.querySelector('.floating-window-content');
      if (contentElement) {
        contentElement.innerHTML = content;
      }
    }
  }
}

/**
 * 修復數學公式中的次方顯示
 * @param {string} text - 包含數學公式的文字
 * @returns {string} 修復後的文字
 */
function fixExponentDisplay(text) {
  // 將 <sup>n</sup> 標籤轉換為適當的 HTML
  return text.replace(/(\d+)?x\^(\d+)/g, function(match, coefficient, exponent) {
    coefficient = coefficient || ''; // 如果係數不存在，則為空字符串
    return `${coefficient}x<sup>${exponent}</sup>`;
  });
}

/**
 * 創建程式碼視窗
 * @param {string} code - 程式碼內容
 * @param {string} title - 視窗標題，默認為"程式碼示範"
 * @param {Object} options - 額外選項
 * @returns {HTMLElement} 創建的視窗元素
 */
function createCodeWindow(code, title = "程式碼示範", options = {}) {
  // 檢測程式語言
  const language = options.language || detectLanguage(code);
  options.language = language;
  
  // 創建視窗
  return createFloatingWindow(title, code, 'code', options);
}

/**
 * 創建記憶體視窗
 * @param {Array} memoryData - 記憶體數據，每項包含address和value
 * @param {string} title - 視窗標題，默認為"記憶體佈局"
 * @param {Object} options - 額外選項
 * @returns {HTMLElement} 創建的視窗元素
 */
function createMemoryWindow(memoryData, title = "記憶體佈局", options = {}) {
  let memoryHtml = '';
  
  if (memoryData && memoryData.length > 0) {
    memoryHtml = `<div class="memory-row">
                    <div class="memory-address">記憶體位址</div>
                    <div class="memory-value" style="width:auto;">值 (儲存內容)</div>
                  </div>`;
    
    memoryData.forEach(item => {
      memoryHtml += `<div class="memory-row">
                       <div class="memory-address">${item.address}</div>
                       <div class="memory-value ${item.active ? 'active' : ''}" style="width:auto;">${item.value}</div>
                     </div>`;
    });
  } else {
    memoryHtml = '<div>無記憶體資料</div>';
  }
  
  return createFloatingWindow(title, memoryHtml, 'memory', options);
}

/**
 * 創建公式視窗
 * @param {string} formulaHtml - 公式HTML內容
 * @param {string} title - 視窗標題，默認為"公式與說明"
 * @param {Object} options - 額外選項
 * @returns {HTMLElement} 創建的視窗元素
 */
function createFormulaWindow(formulaHtml, title = "公式與說明", options = {}) {
  // 修復數學公式中的次方顯示
  formulaHtml = fixExponentDisplay(formulaHtml);
  
  return createFloatingWindow(title, formulaHtml, 'formula', options);
}

/**
 * 檢查視窗是否開啟
 * @param {string} type - 視窗類型（code, memory, formula）
 * @returns {boolean} 視窗是否開啟
 */
function isWindowOpen(type) {
  return openWindows[type] !== null;
}

/**
 * 切換視窗顯示狀態
 * @param {string} type - 視窗類型（code, memory, formula）
 * @param {Function} contentProvider - 內容提供函數，返回HTML字符串
 * @param {string} title - 視窗標題
 * @param {Object} options - 額外選項
 */
function toggleWindow(type, contentProvider, title, options = {}) {
  if (isWindowOpen(type)) {
    if (editorInstances[type]) {
      editorInstances[type].dispose();
      delete editorInstances[type];
    }
    openWindows[type].remove();
    openWindows[type] = null;
  } else {
    const content = contentProvider();
    if (type === 'formula') {
      // 修復數學公式中的次方顯示
      createFloatingWindow(title, fixExponentDisplay(content), type, options);
    } else if (type === 'code') {
      // 檢測程式語言
      options.language = options.language || detectLanguage(content);
      createFloatingWindow(title, content, type, options);
    } else {
      createFloatingWindow(title, content, type, options);
    }
  }
}

// 在頁面加載完成後預加載 Monaco Editor
if (document.readyState === 'complete') {
  loadMonacoEditor().catch(err => console.warn('Monaco 預加載失敗:', err));
} else {
  window.addEventListener('load', () => {
    loadMonacoEditor().catch(err => console.warn('Monaco 預加載失敗:', err));
  });
}

// 導出浮動視窗API
window.FloatingWindow = {
  create: createFloatingWindow,
  createCode: createCodeWindow,
  createMemory: createMemoryWindow,
  createFormula: createFormulaWindow,
  update: updateFloatingWindowContent,
  isOpen: isWindowOpen,
  toggle: toggleWindow,
  fixExponentDisplay: fixExponentDisplay
};