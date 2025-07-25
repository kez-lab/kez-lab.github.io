// 이미지 Lazy Loading 구현
document.addEventListener('DOMContentLoaded', function() {
  // Intersection Observer API를 사용한 Lazy Loading
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    });

    // lazy 클래스를 가진 모든 이미지를 관찰
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  } else {
    // Intersection Observer를 지원하지 않는 브라우저를 위한 폴백
    document.querySelectorAll('img[data-src]').forEach(img => {
      img.src = img.dataset.src;
      img.classList.remove('lazy');
      img.classList.add('loaded');
    });
  }
});