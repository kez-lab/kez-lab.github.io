document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('theme-toggle');
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
  
  // Check for saved theme preference or use the system preference
  const currentTheme = localStorage.getItem('theme') || 
                      (prefersDarkScheme.matches ? 'dark' : 'light');
  
  // Set initial theme
  if (currentTheme === 'dark') {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }
  
  // Handle theme toggle
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      let theme = 'light';
      
      // Toggle theme
      if (document.body.classList.contains('dark-theme')) {
        document.body.classList.remove('dark-theme');
      } else {
        document.body.classList.add('dark-theme');
        theme = 'dark';
      }
      
      // Save preference
      localStorage.setItem('theme', theme);
    });
  }
  
  // Handle system preference changes
  prefersDarkScheme.addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      if (e.matches) {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
    }
  });
});
