---
layout: post
title: "Android"
author: "KEZ"
permalink: /android/
---

# Android 개발

Android 개발과 관련된 기술 정보, 문제 해결 방법, 아키텍처 패턴, 최신 트렌드 등을 다루는 게시물들을 모아놓은 공간입니다.

## 최신 게시물

{% for post in site.posts %}
  {% if post.categories contains "Android" %}
  * [{{ post.title }}]({{ site.baseurl }}{{ post.url }}) <small>{{ post.date | date: "%Y-%m-%d" }}</small>
  {% endif %}
{% endfor %} 