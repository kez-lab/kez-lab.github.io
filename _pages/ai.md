---
layout: post
title: "AI"
author: "KEZ"
permalink: /ai/
---

# 인공지능 (AI)

인공지능 기술, 모바일 앱과의 연동, 머신러닝, 딥러닝, 자연어 처리, 컴퓨터 비전 등 AI 관련 기술과 프로젝트를 다루는 게시물들을 모아놓은 공간입니다.

## 최신 게시물

{% for post in site.posts %}
  {% if post.categories contains "AI" %}
  * [{{ post.title }}]({{ site.baseurl }}{{ post.url }}) <small>{{ post.date | date: "%Y-%m-%d" }}</small>
  {% endif %}
{% endfor %} 