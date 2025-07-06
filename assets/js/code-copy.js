// 코드블럭 향상 기능 - 완전히 새로운 방식
(function() {
  'use strict';
  
  // 전역 초기화 방지
  if (window.codeEnhanced) return;
  window.codeEnhanced = true;
  
  // DOM 로드 완료 후 실행
  function init() {
    enhanceCodeBlocks();
  }
  
  function enhanceCodeBlocks() {
    // 모든 .highlight 요소 선택 (이미 처리된 것 제외)
        const highlights = document.querySelectorAll('div.highlight:not([data-code-enhanced])');
    
    highlights.forEach(processCodeBlock);
  }
  
  function processCodeBlock(highlight) {
    // 처리 완료 마킹
    highlight.setAttribute('data-code-enhanced', 'true');
    
    // 상대 위치 설정
    if (getComputedStyle(highlight).position === 'static') {
      highlight.style.position = 'relative';
    }
    
    // 기능 추가
    addCopyButton(highlight);
    addLanguageLabel(highlight);
    adjustPadding(highlight);
  }
  
  function addCopyButton(highlight) {
    const button = document.createElement('button');
    button.className = 'code-copy-btn';
    button.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
      </svg>
      <span>복사</span>
    `;
    button.setAttribute('aria-label', '코드 복사');
    button.setAttribute('title', '클립보드에 복사');
    
    button.addEventListener('click', () => handleCopy(highlight, button));
    
    highlight.appendChild(button);
  }
  
  function addLanguageLabel(highlight) {
    const pre = highlight.querySelector('pre');
    if (!pre) return;
    
    const code = pre.querySelector('code');
    if (!code) return;
    
    const language = extractLanguage(code.className);
    if (!language) return;
    
    const label = document.createElement('span');
    label.className = 'code-language-label';
    label.textContent = language;
    
    highlight.appendChild(label);
  }
  
  function adjustPadding(highlight) {
    const pre = highlight.querySelector('pre');
    if (pre) {
      pre.style.paddingTop = '2.5rem';
    }
  }
  
  function handleCopy(highlight, button) {
    const code = extractCodeText(highlight);
    const originalHTML = button.innerHTML;
    
    copyToClipboard(code)
      .then(() => {
        button.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
          <span>복사됨!</span>
        `;
        button.classList.add('copied');
        
        setTimeout(() => {
          button.innerHTML = originalHTML;
          button.classList.remove('copied');
        }, 2000);
      })
      .catch(() => {
        button.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <span>실패</span>
        `;
        setTimeout(() => {
          button.innerHTML = originalHTML;
        }, 2000);
      });
  }
  
  function extractCodeText(highlight) {
    const pre = highlight.querySelector('pre');
    if (!pre) return '';
    
    const code = pre.querySelector('code');
    if (!code) return pre.textContent || '';
    
    // 복사본 생성하여 줄 번호 제거
    const clone = code.cloneNode(true);
    const lineNumbers = clone.querySelectorAll('.lineno, .gutter');
    lineNumbers.forEach(el => el.remove());
    
    return clone.textContent || '';
  }
  
  function extractLanguage(className) {
    const match = className.match(/language-(\w+)/);
    if (!match) return null;
    
    const lang = match[1].toLowerCase();
    const languageNames = {
      js: 'JavaScript',
      javascript: 'JavaScript',
      ts: 'TypeScript',
      typescript: 'TypeScript',
      jsx: 'React JSX',
      tsx: 'React TSX',
      html: 'HTML',
      css: 'CSS',
      scss: 'SCSS',
      sass: 'Sass',
      python: 'Python',
      py: 'Python',
      java: 'Java',
      kotlin: 'Kotlin',
      kt: 'Kotlin',
      swift: 'Swift',
      php: 'PHP',
      ruby: 'Ruby',
      rb: 'Ruby',
      go: 'Go',
      rust: 'Rust',
      rs: 'Rust',
      c: 'C',
      cpp: 'C++',
      cxx: 'C++',
      cs: 'C#',
      csharp: 'C#',
      bash: 'Bash',
      sh: 'Shell',
      shell: 'Shell',
      zsh: 'Zsh',
      sql: 'SQL',
      mysql: 'MySQL',
      postgresql: 'PostgreSQL',
      json: 'JSON',
      xml: 'XML',
      yaml: 'YAML',
      yml: 'YAML',
      toml: 'TOML',
      ini: 'INI',
      dockerfile: 'Dockerfile',
      docker: 'Docker',
      nginx: 'Nginx',
      apache: 'Apache',
      markdown: 'Markdown',
      md: 'Markdown'
    };
    
    return languageNames[lang] || lang.toUpperCase();
  }
  
  function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    } else {
      return new Promise((resolve, reject) => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.cssText = 'position:fixed;left:-9999px;opacity:0;';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        
        try {
          const successful = document.execCommand('copy');
          document.body.removeChild(textarea);
          if (successful) {
            resolve();
          } else {
            reject(new Error('Copy command failed'));
          }
        } catch (err) {
          document.body.removeChild(textarea);
          reject(err);
        }
      });
    }
  }
  
  // 초기화
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();