---
layout: post
title: "Android Uri에서 colon의 Encoding & Escape 처리 (Custom Method)"
date: 2025-09-12 12:00:00 +0900
categories: [Android]
tags: [Android, Android Uri, android.net.uri, Encode, Colon]
---

# Android `Uri` colon(":") Encoding & Escape 처리

##### `"book/user:point"` 문자열을 `android.net.Uri`로 파싱하다가 `path`가 `null`이 되는 현상을 만났음
디버깅 및 로그 확인, 그리고 스펙/문서 재검토 끝에 **원인은 Android `Uri` 파서가 문자열의 첫 `:`를 스킴 구분자로 인식**한 것임을 확인하여 해당 과정과 해결법을 정리함

---
## 0) 문제 상황
갑자기 Android 개발 중 Uri 의 Path가 변경된었을 때 Uri parse 로직에서 에러가 발생한 상황

## 1) 에러 상황

[커스텀 메소드](https://cloud.google.com/apis/design/custom_methods?hl=ko)라는 Google Api Design 을 채택
아래 예시와 같이 ":" 이 URL Path 에 포함되게 되는 구조를 통해 API에서 하고자 하는 동작의 표현을 좀 더 세부적으로 나타낼 수 있는 기법 이라고 한다.

```kotlin
val u = Uri.parse("book/user:point")
println("path = ${u.path}")     // path = null
```

- 하지만 Android에서 위와 같이 ":" Colon이 포함된 경로를 Uri.parse 를 통해 Uri 객체로 만든 이후 path 를 추출시 null 이 반환되어 기존 동작에 예외 상황이 발생하게 됨.


## 2) 스펙과 구현의 간극 정리함
<img width="911" height="530" alt="스크린샷 2025-09-12 오전 1 46 41" src="https://github.com/user-attachments/assets/71b5282c-a964-4d1f-b317-7020ea21af93" />

[Android Uri](https://developer.android.com/reference/android/net/Uri) 클래스 각주를 보면 [RFC2396](http://www.faqs.org/rfcs/rfc2396.html) 문서를 준수한다고 쓰여있음

- **RFC 3986** 기준: *상대 경로 참조*에서만 **첫 번째 경로 세그먼트에 `:` 금지**(스킴 오인 방지)임. **중간 세그먼트의 `:` 자체는 금지 아님**. 즉, `user:point` 세그먼트는 맥락에 따라 허용될 수 있음.
- **Android `Uri` 구현**: 문서상 **RFC 2396**을 기준으로 하며, 입력 유효성 검증을 거의 하지 않는다고 명시되어 있음. 이로 인해 **첫 `:`가 등장하면 스킴으로 인식**되어 쉽게 opaque로 떨어질 수 있음.
- 따라서 Android `Uri`는 문자열의 **첫 `:`** 를 스킴 경계로 간주함. `:` 뒤가 `/`로 시작하지 않으면 opaque로 분류됨 → `path == null`이 됨.

요약하면, `"book/user:point"`가 **스킴처럼 보이는 구간 + `/`로 시작하지 않는 scheme-specific part** 조합으로 해석되면서 **opaque**가 되었고, 그 결과 `path`가 `null`이 되었음.

---

## 3) 적용한 해결책

###rawUri를 인코딩

```kotlin
val raw  = "book/user:point"
val safe = Uri.encode(raw)

val parsed = Uri.parse(safe)
println(parsed.isOpaque) // false (계층형)
println(parsed.path)     // "book/user:point"
```
- `:`가 `%3A`로 바뀌어 더 이상 스킴 구분자로 오인되지 않음 → 계층형으로 파싱됨 → `path` 접근 가능해짐.
---

## Before → After 비교함

```kotlin
// Before
val p0 = Uri.parse("book/user:point").path   // null

// After 1: encode
val p1 = Uri.parse(Uri.encode("book/user:point", "/")).path
// "book/user:point"
```

---

## 추가 이슈
만약 Uri에 쿼리가 붙어있다면?
-> book/user:point?id=1 을 Encoding 한 후 Uri 로 parse 한다면 쿼리가 포함된 문자열 전체가 path로 인식됨
[예제]
```kotlin
val p0 = Uri.parse(Uri.encode("book/user:point?id=1")).path   
// 출력결과: book/user:point?id=1
```
  
따라서 쿼리가 포함된 경우 ?의 before string만 인코딩 해야하는 것을 잊지 말기!

## 참고 문서

- Android Developers — [`android.net.Uri` 문서](https://developer.android.com/reference/android/net/Uri)  
  - RFC 2396 기준 표기, 유효하지 않은 입력에 대한 동작 미보장, opaque/hierarchical 및 `getPath()` 동작 기술 포함됨.
- IETF — [RFC 3986 Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986)  
  - 상대 경로 첫 세그먼트의 `:` 금지 규정(스킴 혼동 방지) 명시됨.
- (비교 참고) Oracle — [`URLEncoder` 문서](https://docs.oracle.com/javase/8/docs/api/java/net/URLEncoder.html)  
  - HTML 폼 인코딩 규칙 설명(URI 경로 인코딩과 목적 다름) 확인 가능함.
