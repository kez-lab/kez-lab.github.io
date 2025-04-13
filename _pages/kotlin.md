---
layout: post
title: "Kotlin"
author: "KEZ"
permalink: /kotlin/
---

# Kotlin 개발

Kotlin 언어 특성, 효율적인 활용 방법, 코틀린 인 액션 책 정리, 코루틴, 함수형 프로그래밍, 최신 기능 등을 다루는 게시물들을 모아놓은 공간입니다.

## 최신 게시물

{% for post in site.posts %}
  {% if post.categories contains "Kotlin" %}
  * [{{ post.title }}]({{ site.baseurl }}{{ post.url }}) <small>{{ post.date | date: "%Y-%m-%d" }}</small>
  {% endif %}
{% endfor %} 