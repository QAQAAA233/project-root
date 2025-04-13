/**
 * 數學公式處理工具
 * 用於正確解析和顯示多項式等數學表達式
 */

// 全局命名空間
window.MathUtils = {
    /**
     * 將文本格式的多項式轉換為HTML顯示格式，正確處理次方顯示
     * @param {string} polynomialText - 普通文本格式的多項式，如 "9x^5 - 2x^4 + 8x^3"
     * @returns {string} HTML格式的多項式，正確顯示次方
     */
    formatPolynomial: function(polynomialText) {
      // 將 x^n 格式轉換為 x<sup>n</sup>
      return polynomialText.replace(/x\^(\d+)/g, 'x<sup>$1</sup>');
    },
    
    /**
     * 解析多項式字符串為係數陣列
     * @param {string} polyStr - 多項式字符串如 "9x^5 - 2x^4 + 8x^3"
     * @returns {Array} 係數陣列，索引對應次方
     */
    parsePolynomial: function(polyStr) {
      polyStr = polyStr.replace(/\s+/g, ''); // 移除空格
      const terms = polyStr.replace(/-/g, "+-").split("+").filter(Boolean); // 分割項
      
      let highestDegree = 0;
      
      // 找出最高次數
      terms.forEach(term => {
        if (term.includes("x^")) {
          const degMatch = term.match(/x\^(\d+)/);
          if (degMatch) {
            const degree = parseInt(degMatch[1]);
            highestDegree = Math.max(highestDegree, degree);
          }
        } else if (term.includes("x")) {
          highestDegree = Math.max(highestDegree, 1);
        }
      });
      
      // 初始化係數陣列
      const coefficients = Array(highestDegree + 1).fill(0);
      
      // 填入係數
      terms.forEach(term => {
        if (term.includes("x^")) {
          const parts = term.split("x^");
          const degree = parseInt(parts[1]);
          const coefPart = parts[0];
          const coef = coefPart === "-" ? -1 : (coefPart === "" ? 1 : parseInt(coefPart));
          coefficients[degree] = coef;
        } else if (term.includes("x")) {
          const parts = term.split("x");
          const coefPart = parts[0];
          const coef = coefPart === "-" ? -1 : (coefPart === "" ? 1 : parseInt(coefPart));
          coefficients[1] = coef;
        } else {
          coefficients[0] = parseInt(term);
        }
      });
      
      return coefficients;
    },
    
    /**
     * 將係數陣列轉換為標準多項式字符串
     * @param {Array} coefficients - 係數陣列
     * @returns {string} 格式化的多項式字符串
     */
    coefficientsToString: function(coefficients) {
      const terms = [];
      
      for (let i = coefficients.length - 1; i >= 0; i--) {
        if (coefficients[i] !== 0) {
          // 處理符號
          const sign = terms.length === 0 ? (coefficients[i] < 0 ? "-" : "") 
                                          : (coefficients[i] < 0 ? " - " : " + ");
          
          // 處理係數
          const absCoef = Math.abs(coefficients[i]);
          const coefStr = (absCoef === 1 && i > 0) ? "" : absCoef.toString();
          
          // 處理變量和次方
          let termStr;
          if (i === 0) {
            termStr = absCoef.toString();
          } else if (i === 1) {
            termStr = coefStr + "x";
          } else {
            termStr = coefStr + "x^" + i;
          }
          
          terms.push(sign + termStr);
        }
      }
      
      return terms.length > 0 ? terms.join("") : "0";
    },
    
    /**
     * 將多項式轉換為可顯示在HTML中的格式
     * @param {Array} coefficients - 係數陣列
     * @returns {string} HTML格式的多項式字符串
     */
    coefficientsToHTML: function(coefficients) {
      const polyString = this.coefficientsToString(coefficients);
      return this.formatPolynomial(polyString);
    }
  };