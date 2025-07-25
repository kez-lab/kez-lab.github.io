# KEZ Lab 기술 블로그

Android, Kotlin, AI, Web 개발 기술을 공유하는 기술 블로그입니다.

🌐 **사이트**: [https://kez-lab.github.io](https://kez-lab.github.io)

## 주요 콘텐츠

- **Kotlin**: Kotlin in Action 2판 정리 시리즈
- **Android**: 안드로이드 개발 관련 기술 포스팅
- **AI**: 인공지능 개발 및 활용 방법
- **Web**: 웹 개발 기술 및 프레임워크

## 기술 스택

- **Jekyll**: 정적 사이트 생성기
- **GitHub Pages**: 무료 호스팅
- **Tale Theme**: 미니멀한 Jekyll 테마 기반
- **Disqus**: 댓글 시스템
- **Google Analytics**: 방문자 분석

## 개발 환경 설정

### 로컬 실행

```bash
# 의존성 설치
bundle install

# 로컬 서버 실행
bundle exec jekyll serve

# 브라우저에서 확인
# http://127.0.0.1:4000
```

### 주요 설정

- **댓글**: Disqus 활성화됨 (`_config.yml`에서 설정)
- **SEO**: jekyll-seo-tag 플러그인 사용
- **사이트맵**: 자동 생성 (jekyll-sitemap)
- **RSS 피드**: 자동 생성 (jekyll-feed)

## 포스팅 가이드

새 포스트는 `_posts/` 디렉토리에 다음 형식으로 작성:

```markdown
---
layout: post
title: "포스트 제목"
date: YYYY-MM-DD HH:MM:SS +0900
categories: [카테고리1, 카테고리2]
tags: [태그1, 태그2]
author: admin
excerpt: "포스트 요약 (SEO용)"
---

포스트 내용
```

## 기여하기

이슈나 개선 제안이 있으시면 GitHub Issue를 생성해주세요.

## 라이선스

이 블로그는 [Tale Jekyll Theme](https://github.com/chesterhow/tale)를 기반으로 제작되었습니다.

---

**Built with ❤️ using Jekyll and Tale Theme**