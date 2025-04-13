document.addEventListener('DOMContentLoaded', function() {
  // 코드 블록 스타일링 및 기능 추가
  const codeBlocks = document.querySelectorAll('pre.highlight, .highlight pre');
  
  codeBlocks.forEach(function(codeBlock) {
    // 코드 블록 바로 앞의 문단이 파일명을 포함하는지 확인
    const prevParagraph = codeBlock.previousElementSibling;
    let filenamePart = '';
    let languageClass = '';
    
    // 언어 클래스 확인
    const classNames = codeBlock.className.split(' ');
    for (let i = 0; i < classNames.length; i++) {
      if (classNames[i].startsWith('language-')) {
        languageClass = classNames[i].replace('language-', '');
        break;
      }
    }
    
    if (!languageClass) {
      const parentHighlight = codeBlock.closest('.highlight');
      if (parentHighlight) {
        const parentClasses = parentHighlight.className.split(' ');
        for (let i = 0; i < parentClasses.length; i++) {
          if (parentClasses[i] !== 'highlight') {
            languageClass = parentClasses[i];
            break;
          }
        }
      }
    }
    
    if (prevParagraph && prevParagraph.tagName === 'P' && 
        (prevParagraph.textContent.includes('.') || prevParagraph.textContent.includes('파일') || 
         prevParagraph.textContent.includes('file'))) {
      
      // 파일명으로 보이는 텍스트 추출
      filenamePart = prevParagraph.textContent.trim();
      if (filenamePart.includes(':')) {
        filenamePart = filenamePart.split(':')[0];
      }
      
      // 원래 문단 숨기기
      prevParagraph.style.display = 'none';
      
      // 파일 확장자에서 언어 추론
      if (!languageClass && filenamePart.includes('.')) {
        const extension = filenamePart.split('.').pop().toLowerCase();
        const extensionToLang = {
          'kt': 'kotlin',
          'kts': 'kotlin',
          'java': 'java',
          'js': 'javascript',
          'ts': 'typescript',
          'html': 'html',
          'xml': 'xml',
          'json': 'json',
          'css': 'css',
          'scss': 'scss',
          'py': 'python',
          'rb': 'ruby',
          'md': 'markdown',
          'sh': 'bash',
          'yml': 'yaml',
          'yaml': 'yaml',
          'gradle': 'gradle'
        };
        
        if (extensionToLang[extension]) {
          languageClass = extensionToLang[extension];
          
          // 언어 클래스 추가
          if (codeBlock.classList) {
            codeBlock.classList.add('language-' + languageClass);
          } else {
            codeBlock.className += ' language-' + languageClass;
          }
        }
      }
    }
    
    // 코드 헤더 생성
    const codeHeader = document.createElement('div');
    codeHeader.className = 'code-header';
    
    // 파일명 부분 추가
    const filenameDiv = document.createElement('div');
    filenameDiv.className = 'filename';
    
    if (filenamePart) {
      filenameDiv.textContent = filenamePart;
    } else if (languageClass) {
      filenameDiv.textContent = languageClass.charAt(0).toUpperCase() + languageClass.slice(1);
    } else {
      filenameDiv.textContent = 'Code';
    }
    
    codeHeader.appendChild(filenameDiv);
    
    // 버튼 그룹 생성
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'button-group';
    
    // 테마 토글 버튼 추가 (안드로이드 스튜디오 스타일)
    if (languageClass && ['kotlin', 'java', 'xml', 'gradle'].includes(languageClass)) {
      const themeToggle = document.createElement('button');
      themeToggle.className = 'theme-toggle-button';
      themeToggle.textContent = 'IDE 테마';
      themeToggle.title = '안드로이드 스튜디오 테마로 전환';
      
      themeToggle.addEventListener('click', function() {
        const codeBlockParent = codeBlock.parentNode;
        if (codeBlockParent.classList.contains('android-studio-theme')) {
          codeBlockParent.classList.remove('android-studio-theme');
          themeToggle.textContent = 'IDE 테마';
        } else {
          codeBlockParent.classList.add('android-studio-theme');
          themeToggle.textContent = '밝은 테마';
        }
      });
      
      buttonGroup.appendChild(themeToggle);
    }
    
    // 복사 버튼 추가
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-code-button';
    copyButton.textContent = '복사';
    copyButton.addEventListener('click', function() {
      const code = codeBlock.querySelector('code');
      if (code) {
        // 코드의 모든 텍스트 내용을 가져옴 (HTML 태그 제외)
        const codeText = code.innerText || code.textContent;
        
        // 클립보드에 복사
        navigator.clipboard.writeText(codeText).then(function() {
          // 복사 성공 표시
          copyButton.textContent = '복사됨!';
          copyButton.classList.add('copied');
          
          // 2초 후 원래 상태로 복원
          setTimeout(function() {
            copyButton.textContent = '복사';
            copyButton.classList.remove('copied');
          }, 2000);
        }, function(err) {
          console.error('복사 실패: ', err);
        });
      }
    });
    
    buttonGroup.appendChild(copyButton);
    codeHeader.appendChild(buttonGroup);
    
    // 코드 블록 앞에 헤더 삽입
    codeBlock.parentNode.insertBefore(codeHeader, codeBlock);
    
    // 코드 블록에 라인 번호 추가
    const codeLines = codeBlock.querySelectorAll('code .line');
    if (codeLines.length === 0) {
      const code = codeBlock.querySelector('code');
      if (code) {
        const content = code.innerHTML;
        const lines = content.split('\n');
        
        // 라인 번호와 함께 새 내용 생성
        let numberedContent = '';
        lines.forEach(function(line, index) {
          if (index < lines.length - 1 || lines[lines.length - 1].trim() !== '') {
            numberedContent += `<span class="line-number">${index + 1}</span>${line}\n`;
          }
        });
        
        code.innerHTML = numberedContent;
        codeBlock.classList.add('numbered');
      }
    }
  });
  
  // 참고 노트 스타일 적용
  const blockquotes = document.querySelectorAll('blockquote');
  blockquotes.forEach(function(blockquote) {
    const firstParagraph = blockquote.querySelector('p:first-child');
    if (firstParagraph) {
      const text = firstParagraph.textContent.toLowerCase();
      
      if (text.startsWith('참고:') || text.startsWith('note:')) {
        blockquote.classList.add('note', 'info');
      } else if (text.startsWith('주의:') || text.startsWith('warning:')) {
        blockquote.classList.add('note', 'warning');
      } else if (text.startsWith('팁:') || text.startsWith('tip:')) {
        blockquote.classList.add('note', 'tip');
      }
    }
  });
}); 