---
title: Kez 개발 블로그
feature_text: |
  ## Kez Development Lab
  소프트웨어 개발자를 위한 기술 블로그
feature_image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=1352&q=80"
excerpt: "소프트웨어 개발 지식과 경험을 공유하는 기술 블로그입니다. 프론트엔드, 백엔드 개발부터 데이터베이스, 인프라, 그리고 개발자 생산성에 관한 다양한 주제를 다룹니다."
---

## 개발 블로그에 오신 것을 환영합니다

이 블로그는 소프트웨어 개발 과정에서 얻은 지식과 경험을 공유하기 위한 공간입니다. 
웹 개발, 모바일 앱 개발, 데이터 엔지니어링 등 다양한 분야의 기술적 내용을 다룹니다.

{% include button.html text="GitHub" icon="github" link="https://github.com/kez-lab" color="#0366d6" %} {% include button.html text="블로그 구독" icon="rss" link="/feed.xml" color="#f68140" %}

## 주요 카테고리

- **웹 개발** - 프론트엔드 및 백엔드 기술에 관한 글
- **모바일 앱** - Flutter, React Native를 이용한 앱 개발 경험
- **데이터베이스** - SQL, NoSQL 데이터베이스 설계 및 성능 최적화
- **개발자 도구** - 생산성을 높이는 유용한 도구와 팁
- **튜토리얼** - 단계별 학습 가이드와 실용적인 예제

## 최근 글

<div class="recent-posts">
  {% for post in site.posts limit:3 %}
    <div class="recent-post">
      <h3><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
      <p class="post-meta">{{ post.date | date: "%Y년 %m월 %d일" }}</p>
      <p>{{ post.excerpt | strip_html | truncatewords: 30 }}</p>
      <a href="{{ post.url | relative_url }}" class="read-more">더 읽기 →</a>
    </div>
  {% endfor %}
</div>

<div class="cta-container">
  <a href="/blog/" class="cta-button">모든 글 보기</a>
</div>

## 소개

저는 웹, 모바일 애플리케이션을 개발하는 소프트웨어 개발자입니다. 새로운 기술을 배우고 적용하는 과정에서 얻은 인사이트를 이 블로그를 통해 공유합니다. 개발자로서의 성장 여정과 함께 해주세요.

<div class="cta-container">
  <a href="/about/" class="cta-button">더 알아보기</a>
</div>
