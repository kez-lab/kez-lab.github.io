---
layout: post
title: "Web"
author: "KEZ"
permalink: /web/
---

# 웹 개발

웹 개발 기술, 프레임워크, 서버, 백엔드, 프론트엔드, RESTful API, GraphQL, 배포 전략 등 웹 관련 기술을 다루는 게시물들을 모아놓은 공간입니다.

## 최신 게시물

{% for post in site.posts %}
  {% if post.categories contains "Web" %}
  * [{{ post.title }}]({{ site.baseurl }}{{ post.url }}) <small>{{ post.date | date: "%Y-%m-%d" }}</small>
  {% endif %}
{% endfor %} 