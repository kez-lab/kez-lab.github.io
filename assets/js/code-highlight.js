document.addEventListener('DOMContentLoaded', () => {
  // Add line numbers to code blocks
  document.querySelectorAll('pre code').forEach(codeBlock => {
    // Only add if it doesn't already have line numbers
    if (!codeBlock.classList.contains('line-numbers')) {
      codeBlock.classList.add('line-numbers');
      
      // Get code content
      const content = codeBlock.textContent;
      
      // Count the number of lines
      const lineCount = content.split('\n').length;
      
      // Create line numbers element
      const lineNumbers = document.createElement('div');
      lineNumbers.classList.add('line-numbers-rows');
      
      // Generate line numbers
      for (let i = 0; i < lineCount; i++) {
        const lineNumber = document.createElement('span');
        lineNumbers.appendChild(lineNumber);
      }
      
      // Add line numbers to code block
      codeBlock.parentNode.classList.add('line-numbers-container');
      codeBlock.parentNode.appendChild(lineNumbers);
      
      // Add copy button
      const copyButton = document.createElement('button');
      copyButton.classList.add('copy-button');
      copyButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
      copyButton.title = 'Copy code';
      
      copyButton.addEventListener('click', () => {
        const textarea = document.createElement('textarea');
        textarea.value = content;
        textarea.style.position = 'fixed';
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
          document.execCommand('copy');
          copyButton.classList.add('copied');
          copyButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
          
          setTimeout(() => {
            copyButton.classList.remove('copied');
            copyButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
          }, 2000);
        } catch (err) {
          console.error('Failed to copy code: ', err);
        }
        
        document.body.removeChild(textarea);
      });
      
      codeBlock.parentNode.appendChild(copyButton);
    }
  });
});
