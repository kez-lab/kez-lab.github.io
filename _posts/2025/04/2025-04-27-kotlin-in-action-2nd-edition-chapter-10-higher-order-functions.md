---
layout: post
title: "Kotlin in Action 2판 10장 고차 함수 람다를 파라미터와 반환값으로 사용"
description: "Kotlin의 고차 함수: 함수 타입, 인라인 함수, 논로컬 반환, 람다를 파라미터와 반환값으로 활용"
date: 2025-04-27 12:00:00 +0900
categories:
    - Kotlin
tags:
    - Kotlin
    - Kotlin in Action
    - Higher-Order Functions
    - Lambda
    - Inline Functions
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

### 코틀린 람다를 자바에서 사용할 수 있는 이유

코틀린은 **SAM 변환(Single Abstract Method 변환)** 을 지원함.  
- **SAM 변환**: 추상 메서드가 하나만 있는 자바 인터페이스에 코틀린 람다를 전달할 수 있게 해줌.
- 즉, 자바 메서드가 함수형 인터페이스를 요구할 때, 코틀린 람다를 인자로 넘길 수 있음.

**예시:**

코틀린 고차 함수 선언:

```kotlin
fun processTheAnswer(f: (Int) -> Int) {
    println(f(42))
}
```

자바 호출:

```java
processTheAnswer(number -> number + 1);
```

- `number -> number + 1`은 `(Int) -> Int` 함수 타입을 만족하는 람다.
- 자바에서는 **람다 → 익명 클래스** 형태로 변환되어 전달됨.

---

### 코틀린의 함수 타입은 내부적으로 무엇인가?

코틀린 함수 타입은 내부적으로 **FunctionN 인터페이스**를 구현함.  

따라서, 코틀린에서는 함수 타입을 변수처럼 다루지만,  
**실제로는 FunctionN 인터페이스 인스턴스**로 처리됨.

**processTheAnswer 함수 내부 실제 모습:**

```kotlin
fun processTheAnswer(f: Function1<Int, Int>) {
    println(f.invoke(42))
}
```

---

### 자바에서 코틀린 함수 타입 호출 시 주의사항

- 자바에서는 코틀린의 함수 타입을 직접 표현할 방법이 없음.
- 대신, 코틀린 함수 타입을 **SAM 인터페이스처럼** 익명 클래스 형태로 전달함.

---

### 코틀린 확장 함수를 자바에서 호출할 때 주의할 점

코틀린의 확장 함수는 실제로 **정적 메서드(static method)** 로 변환됨.  
- 첫 번째 인자로 수신 객체(receiver)를 명시적으로 넘겨야 함.

**예시:**

코틀린 확장 함수:

```kotlin
fun List<String>.forEach(action: (String) -> Unit)
```

자바에서는 이렇게 호출해야 함:

```java
List<String> strings = new ArrayList<>();
strings.add("42");

// CollectionsKt 패키지에 위치함
CollectionsKt.forEach(strings, s -> {
    System.out.println(s);
    return Unit.INSTANCE;
});
```

- **첫 번째 인자**로 리스트 `strings`를 명시적으로 전달.
- 람다 내부에서 코틀린의 `Unit` 객체를 반환해야 함.


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

다른 접근 방식으로 기본 값 대신 Nullable한 형식을 사용할 수 있음

### 널이 될 수 있는 함수 타입

```kotlin
fun foo(callback: (() -> Unit)?) {
    callback?.invoke()
}
```

- nullable한 함수 타입의 경우 invoke 안전 호출 가능함.

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


## 10.1.5 함수를 반환하는 함수
함수를 반환하는 함수의 경우는 함수를 인자로 받는 경우보다는 적다, 다만 그럼에도 유용하게 쓰인다고 책은 얘기한다.

아래는 사용자가 선택한 요금제에 따라 결제 방법이 달라지는 경우에 대한 예제이다.

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

- Delivery 상태에 따라 다른 람다 반환함.
- Order 객체를 인자로 받아 코스트를 최종적으로 반환
- 근데 파람 두개를 받으면 똑같은 동작이 되는데 함수를 반환했을 때의 이점이 뭔지는 잘 모르겠음


## 10.1.6 람다로 코드 중복 줄이기

함수타입과 람다식은 재사용 가능한 코드를 만들기 위한 아주 좋은 도구다.

아래 예시는 이러한 재사용성의 이점을 보여주기 위한 예제로 방문한 사이트의 기록 작업을 수행하는 예제이다

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
