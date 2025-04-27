---
layout: post
title: "Kotlin in Action 2판 10장 고차 함수: 람다를 파라미터와 반환값으로 사용"
date: 2025-04-28 12:00:00 +0900
categories: [Kotlin, Kotlin In Action 2, 코틀린 인 액션 2판]
tags: Kotlin in Action 2판 10장 고차 함수: 람다를 파라미터와 반환값으로 사용
author: admin
---

# Kotlin In Action 2판 정리 - 10장 고차 함수

## 10 고차 함수: 람다를 파라미터와 반환값으로 사용

- 함수 타입
- 고차 함수로 코드 구조화
- 인라인 함수
- 비로컬 return과 레이블
- 익명 함수

5장에서 람다를 소개함.  
6장에서 표준 라이브러리 함수(map, with 등)를 살펴봄.  
10장은 고차 함수 만들기와 인라인 함수 최적화 설명함.

---

## 10.1 고차 함수: 다른 함수를 인자로 받거나 반환하는 함수

### 고차 함수란

- 다른 함수를 인자로 받거나 반환하는 함수임.
- 람다나 함수 참조를 인자로 넘기거나 반환함.
- 예: `list.filter { it > 0 }`

### 고차 함수 정의 방법

- 함수 타입 이해해야 함.

```kotlin
val sum = { x: Int, y: Int -> x + y }
val action = { println(42) }
```

컴파일러가 함수 타입 추론함.

```kotlin
val sum: (Int, Int) -> Int = { x, y -> x + y }
val action: () -> Unit = { println(42) }
```

- 함수 타입 문법: `(Int, String) -> Unit`
- Unit 반환 시에도 명시 필요함.

### 널 가능성과 함수 타입

```kotlin
var canReturnNull: (Int, Int) -> Int? = { x, y -> null }
var funOrNull: ((Int, Int) -> Int)? = null
```

괄호 위치에 따라 의미 달라짐.  
반환 타입이 널인지, 함수 전체가 널인지 구분함.

---

## 10.1.2 인자로 받은 함수 호출하기

### 고차 함수 작성 예

```kotlin
fun twoAndThree(operation: (Int, Int) -> Int) {
    val result = operation(2, 3)
    println("The result is $result")
}

fun main() {
    twoAndThree { a, b -> a + b }
    twoAndThree { a, b -> a * b }
}
```

- 호출 구문은 일반 함수와 같음.
- 파라미터 이름은 타입 검사에 영향 없음.
- IDE가 코드 완성에 도움 줌.

---

## filter 함수 직접 구현하기

### String.filter 구현 예(매개변수로 술어를 취하는 함수 선언)
![image](https://github.com/user-attachments/assets/0841861f-5357-40d6-8a33-3860f959edbc)

```kotlin
fun String.filter(predicate: (Char) -> Boolean): String {
    return buildString {
        for (char in this@filter) {
            if (predicate(char)) append(char)
        }
    }
}
```

- buildString과 이터레이터 사용.
- 각 문자에 대해 predicate 적용.

---

## 10.1.3 자바와 코틀린 함수 타입

- 코틀린 람다 → 자바 함수형 인터페이스로 넘길 수 있음.
- 코틀린 함수 타입 → 자바에서 호출 가능함.

자바 호출 예:

```java
processTheAnswer(number -> number + 1);
```

- 자바에서는 Unit.INSTANCE 반환 필요함.

함수 타입은 내부적으로 FunctionN 인터페이스임.

```kotlin
interface Function1<P1, out R> {
    operator fun invoke(p1: P1): R
}
```

- 함수 타입 변수는 FunctionN 인스턴스임.

---

## 10.1.4 함수 타입 기본값 & 널 처리

### 기본값 설정

```kotlin
fun <T> Collection<T>.joinToString(
    separator: String = ", ",
    prefix: String = "",
    postfix: String = "",
    transform: (T) -> String = { it.toString() }
): String
```

- transform 기본값 지정 가능.
- 호출 시 다양한 방식 지원.

### 널이 될 수 있는 함수 타입

```kotlin
fun foo(callback: (() -> Unit)?) {
    callback?.invoke()
}
```

- invoke 안전 호출 가능함.

joinToString 개선 버전:

```kotlin
fun <T> Collection<T>.joinToString(
    separator: String = ", ",
    prefix: String = "",
    postfix: String = "",
    transform: ((T) -> String)? = null
): String {
    val result = StringBuilder(prefix)
    for ((index, element) in this.withIndex()) {
        if (index > 0) result.append(separator)
        val str = transform?.invoke(element) ?: element.toString()
        result.append(str)
    }
    result.append(postfix)
    return result.toString()
}
```

---

## 10.1.5 함수를 반환하는 함수

### 예제: 배송비 계산기

```kotlin
enum class Delivery { STANDARD, EXPEDITED }
class Order(val itemCount: Int)

fun getShippingCostCalculator(delivery: Delivery): (Order) -> Double {
    if (delivery == Delivery.EXPEDITED) {
        return { order -> 6 + 2.1 * order.itemCount }
    }
    return { order -> 1.2 * order.itemCount }
}
```

- 상황에 따라 다른 람다 반환함.

### 예제: 연락처 필터

```kotlin
data class Person(val firstName: String, val lastName: String, val phoneNumber: String?)

class ContactListFilters {
    var prefix: String = ""
    var onlyWithPhoneNumber: Boolean = false

    fun getPredicate(): (Person) -> Boolean {
        val startsWithPrefix = { p: Person ->
            p.firstName.startsWith(prefix) || p.lastName.startsWith(prefix)
        }
        if (!onlyWithPhoneNumber) {
            return startsWithPrefix
        }
        return { startsWithPrefix(it) && it.phoneNumber != null }
    }
}
```

- ContactListFilters가 조건에 맞는 함수 반환함.

---

## 10.1.6 람다로 코드 중복 줄이기

### 예제: 사이트 방문 기록

```kotlin
data class SiteVisit(val path: String, val duration: Double, val os: OS)
enum class OS { WINDOWS, LINUX, MAC, IOS, ANDROID }
```

로그 리스트:

```kotlin
val log = listOf(
    SiteVisit("/", 34.0, OS.WINDOWS),
    SiteVisit("/", 22.0, OS.MAC),
    SiteVisit("/login", 12.0, OS.WINDOWS),
    SiteVisit("/signup", 8.0, OS.IOS),
    SiteVisit("/", 16.3, OS.ANDROID)
)
```

### 중복 제거 전

```kotlin
val averageWindowsDuration = log
    .filter { it.os == OS.WINDOWS }
    .map(SiteVisit::duration)
    .average()
```

### 중복 제거 후

```kotlin
fun List<SiteVisit>.averageDurationFor(os: OS) =
    filter { it.os == os }.map(SiteVisit::duration).average()
```

### 더 유연한 고차 함수 사용

```kotlin
fun List<SiteVisit>.averageDurationFor(predicate: (SiteVisit) -> Boolean) =
    filter(predicate).map(SiteVisit::duration).average()
```

- OS 뿐만 아니라 다양한 조건에 대해 재사용 가능함.

---

## 10.1 장 요약

- 고차 함수는 코드 구조 개선, 중복 제거에 효과적임.
- 함수 타입과 람다를 적극적으로 활용할 수 있음.
- 전략 패턴 등 객체지향 디자인 패턴도 단순화 가능함.

> 10.2~ 장 요약 준비 중
