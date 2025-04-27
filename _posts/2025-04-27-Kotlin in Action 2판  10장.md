---
layout: post
title: "Kotlin in Action 2판 10장 고차 함수 람다를 파라미터와 반환값으로 사용"
date: 2025-04-27 12:00:00 +0900
categories: [Kotlin, Kotlin In Action 2, 코틀린 인 액션 2판]
tags: Kotlin in Action 2판 10장 고차 함수 람다를 파라미터와 반환값으로 사용
author: admin
---

# Kotlin In Action 2판 정리 - 10장 고차 함수

## 10 고차 함수: 람다를 파라미터와 반환값으로 사용

- 함수 타입
- 고차 함수로 코드 구조화
- 인라인 함수
- 비로컬 return과 레이블
- 익명 함수

10장은 고차 함수 만들기와 인라인 함수 최적화 설명함.

---

## 10.1 고차 함수: 다른 함수를 인자로 받거나 반환하는 함수

### 고차 함수란

- 다른 함수를 인자로 받거나 반환하는 함수임.
- 람다나 함수 참조를 인자로 넘기거나 반환함.
- filter, map 등이 대표적 고차 함수.

**예시:**
```kotlin
list.filter { it > 0 }
```
- `filter`는 술어 함수 `(T) -> Boolean`을 인자로 받음.

### 함수 타입은 람다의 파라미터 타입과 반환 타입을 지정한다

```kotlin
val sum = { x: Int, y: Int -> x + y }
val action = { println(42) }
```

컴파일러가 함수 타입 추론함.

실제 타입을 명시했을 때 예시

```kotlin
val sum: (Int, Int) -> Int = { x, y -> x + y }
val action: () -> Unit = { println(42) }
```

- Unit 반환 시에도 명시해야 함.
- 람다 내부에서는 타입 생략 가능.

### Nullable 처리
![image](https://github.com/user-attachments/assets/bb8238b6-c27b-49b6-a92c-6a58742b66c1)

```kotlin
var canReturnNull: (Int, Int) -> Int? = { x, y -> null }
var funOrNull: ((Int, Int) -> Int)? = null
```

- 괄호 위치에 따라 의미 달라짐.  
- 반환 타입이 널인지, 함수 전체가 널인지 구분함.

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

- 함수 타입을 인자로 받아 호출함.
- 일반 함수처럼 괄호로 호출.
- 파라미터 이름은 타입 검사에 영향 없음.

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
- 각 문자를 predicate로 검사하여 true면 결과 문자열에 추가

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

- transform 기본값 지정을 통해서 T 객체의 toString() 지원이 불확실할 경우에 대비할 수 있음

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

아니 그래서 뭘 얘기하고 싶은건지 도저히 모르겠음 ㅡㅡ 맥락 파악이 안되네

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

fun main() {
    val calculator = getShippingCostCalculator(Delivery.EXPEDITED)
    println("Shipping costs ${calculator(Order(3))}")
    // Shipping costs 12.3
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

- predicate 함수를 파람으로 넘김으로 OS 뿐만 아니라 다양한 조건에 대해 재사용 가능함.

---

## 10.1 장 요약

- 고차 함수는 코드 구조 개선, 중복 제거에 효과적임.
- 함수 타입과 람다를 적극적으로 활용할 수 있음.
- 전략 패턴 등 객체지향 디자인 패턴도 단순화 가능함.

> 10.2~ 장 요약 준비 중
