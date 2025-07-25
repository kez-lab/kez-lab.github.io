// 다크 모드 테마 토글 기능
(function() {
  // 사용자의 색상 테마 환경설정 확인
  const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
  
  // 로컬 스토리지에서 테마 설정 가져오기
  const currentTheme = localStorage.getItem("theme");
  
  // 사용자가 다크 모드를 선호하거나 이전에 다크 모드를 선택했다면
  if (currentTheme === "dark" || (currentTheme === null && prefersDarkScheme.matches)) {
    document.body.classList.add("dark-theme");
  } else {
    document.body.classList.remove("dark-theme");
  }
})();