---
layout: post
title: "[Kotlin] Data Class의 구조와 핵심 기능 완벽 정리"
description: "data class 의 핵심 기능들을 정리"
date: 2026-01-11T18:00:04.066Z
categories:
    - Kotlin
tags:
    - Kotlin
    - Data Class
---


# [Kotlin] Data Class의 구조와 핵심 기능 완벽 정리

안드로이드 개발에서 API 응답을 받거나 화면 간 데이터를 전달할 때 DTO 구조의 클래스를 활용합니다. Java에서는 `equals()`, `hashCode()`, `toString()` 같은 메서드를 직접 오버라이드하거나 Lombok에 의존했지만, Kotlin에서는 `data class`로 이 모든 것을 해결할 수 있습니다.

이 글에서는 실무에서 자주 사용하는 `data class`의 핵심 기능들을 정리합니다.

## 기본 선언
```kotlin
data class User(val name: String, val age: Int)
```

클래스 선언 시 `data` 키워드를 사용하면, 컴파일러가 주 생성자에 정의된 프로퍼티를 기반으로 필요한 함수들을 자동으로 생성해줍니다.
[자동 생성되는 함수 목록]
- `equals()`
- `hashCode()`
- `toString()`
- `copy()`

오늘은 `data class` 에서 자동 생성되는 함수를 기반으로 특징을 설명하며, 더 나아가 componentN() 함수를 통해 구조분해 선언을 할 수 있다는 점을 설명해보겠습니다.

---

## 1. 값으로 비교하는 `equals()` - 참조가 아닌 내용으로

일반 클래스에서 `==` 연산자를 사용하면 객체의 참조값(메모리 주소)을 비교하지만, `data class`는 실제 데이터 내용을 비교합니다.
```kotlin
val user1 = User("Tom", 20)
val user2 = User("Tom", 20)

// 다른 객체지만 값이 같으므로 true
println(user1 == user2) // true
```

리스트에서 특정 아이템을 찾거나 제거할 때, 상태 변경을 감지할 때 유용합니다.
즉 data class 는 직접 객체를 새로 생성해서 주입하더라도, 내부 field 의 value 가 동일하다면 상태 변경 시 기존과 동일하다고 판단합니다.

따라서 Android의 `DiffUtil이나` Jetpack Compose의 `Recomposition` 판단 시, 객체의 내용이 같다면 불필요한 UI 갱신을 건너뛸 수 있어 렌더링 성능 최적화에 유리합니다.

---

## 2. 컬렉션에서의 안전성과 성능 최적화: `hashCode()`와 `equals()`

`Data Class`는 `equals()`와 `hashCode()`를 자동으로, 그리고 올바르게 쌍으로 생성해 줍니다. 이 두 메서드는 `HashSet`이나 `HashMap` 같은 해시 기반 컬렉션에서 **데이터를 빠르고 정확하게 찾기 위해** 필수적입니다.

### 동작 원리: 2단계 검색
해시 컬렉션은 데이터를 찾을 때 효율을 위해 다음 두 단계를 거칩니다.

1.  **1단계 (빠른 탐색):** `hashCode()`로 객체가 저장된 **'버킷(방)'의 위치**를 먼저 찾습니다. (검색 범위 대폭 축소)
2.  **2단계 (정밀 비교):** 그 위치에 있는 객체들 중에서만 `equals()`로 **실제 내용이 같은지** 비교합니다.

일반 클래스는 메모리 주소를 기반으로 해시코드를 생성하기 때문에 내용이 같아도 다른 방(버킷)을 찾아가게 되어 검색에 실패합니다. 반면, `data class`는 **프로퍼티의 값을 기반으로 해시코드를 생성**하므로, 객체가 달라도 내용이 같다면 같은 위치를 찾아내어 올바르게 동작합니다.

```kotlin
val user1 = User("Tom", 20)
val user2 = User("Tom", 20) // user1과 내용은 같지만 다른 객체

val set = hashSetOf(user1)

// 동작 순서:
// 1. user2.hashCode()로 저장된 위치를 찾음 (성공)
// 2. 그 위치에 있는 user1과 equals() 비교 (true)
println(set.contains(user2)) // true 출력
```

### 이 둘의 관계 (계약 조건)
안전한 사용을 위해 다음 규칙이 보장됩니다.
- `equals()`가 `true`인 두 객체는 반드시 같은 `hashCode()`를 가집니다.
- **주의:** `hashCode()`가 같다고 해서 반드시 `equals()`가 `true`인 것은 아닙니다. (해시 충돌 가능성)
    - *따라서 해시코드만으로 비교를 끝내지 않고, 반드시 `equals`로 최종 확인을 하는 것입니다.*

### 실무 활용 예시

**1. 리스트 중복 제거**
서버에서 받은 리스트에 중복된 데이터가 있을 때, `toSet()`이나 `distinct()`를 사용하면 `data class`의 내용 비교를 통해 깔끔하게 중복을 제거할 수 있습니다.
```kotlin
val uniqueUsers = userList.toSet() // 내용이 같은 객체는 하나만 남음
```

**2. Map의 Key로 객체 사용**
복합적인 상태를 Key로 사용해야 할 때 유용합니다.
```kotlin
val userCache = mutableMapOf<User, CacheData>()
userCache[user1] = data1

// user2가 user1과 값이 같다면, 같은 Key로 인식하여 데이터를 찾아냄
val cachedData = userCache[user2] // data1 반환
```
---

## 3. 직관적인 문자열 표현: `toString()`

디버깅이나 로깅 시 객체의 상태를 쉽게 확인할 수 있도록 `ClassName(propertyName=value)` 형태의 문자열을 반환합니다.
```kotlin
println(user1)
// 출력: User(name=Tom, age=20)
```

일반 클래스는 `User@a4c7b6e` 같은 해시코드만 출력하지만, data class는 내부 프로퍼티의 value 를 표시하여 Logcat에서 객체 내용을 바로 확인할 수 있습니다.

---

## 4. 불변성을 유지하는 `copy()` - 안전한 수정

`val`로 선언한 불변 객체의 일부 값만 변경하고 싶을 때 `copy()`를 사용합니다. 원본 객체는 유지하고 지정한 프로퍼티만 변경된 새 객체를 생성하여 예상치 못한 사이드 이펙트를 방지할 수 있습니다.

만약 `var` 를 사용하여 가변 객체로 만든다면, 데이터가 어디서 변경되었는지 추적하기 어려워집니다. 이는 `data class`의 장점인 '데이터의 안정성'을 해치고 디버깅을 어렵게 만들므로 가급적 `val` 을 사용하는 것이 좋습니다.

```kotlin
val user1 = User("Tom", 20)
val olderTom = user1.copy(age = 21)

println(user1)      // User(name=Tom, age=20) - 원본 유지
println(olderTom)   // User(name=Tom, age=21) - 새 객체
```

### 여러 프로퍼티 동시 변경
```kotlin
data class User(val name: String, val age: Int, val email: String)

val updated = user.copy(
    email = "new@email.com",
    age = 25
    // name은 생략하여 원본 값 유지
)
```

### Compose/ViewModel에서의 실전 활용

불변 상태 관리의 핵심입니다.
```kotlin
// ViewModel
data class UiState(
    val isLoading: Boolean = false,
    val data: List<Item> = emptyList(),
    val error: String? = null
)

// 상태 업데이트 - 기존 상태를 유지하면서 필요한 부분만 변경
_uiState.update { it.copy(isLoading = true) }

// 성공 시
_uiState.update { it.copy(
    isLoading = false,
    data = newData
)}
```

---

## 5. 구조 분해 선언 지원: `componentN()`

객체의 프로퍼티를 선언된 순서대로 반환하는 `component1()`, `component2()` 등의 함수가 자동으로 생성됩니다. 이를 통해 구조 분해 선언(Destructuring Declaration)으로 객체 내부의 값을 개별 변수로 추출할 수 있습니다.
```kotlin
val (name, age) = user1
println("이름: $name, 나이: $age")
```

### 주의: 이름이 아닌 순서로 매칭

구조 분해는 프로퍼티 **이름**이 아닌 **선언 순서**로 값을 할당합니다.
```kotlin
data class User(val name: String, val age: Int)

val (name, age) = user1  // OK
val (age, name) = user1  // 주의: age 변수에 "Tom", name 변수에 20이 할당
```

타입이 같은 프로퍼티가 여러 개 있을 때는 특히 주의가 필요합니다.

### 반복문과 람다에서의 활용
```kotlin
val users = listOf(User("Tom", 20), User("Jane", 25))

// for문에서
for ((name, age) in users) {
    println("$name is $age years old")
}

// forEach에서
users.forEach { (name, age) -> 
    println("User: $name, Age: $age")
}
```

---

## 6. 생성 규칙 및 제약 사항

### 기본 규칙

- 주 생성자에 최소 1개 이상의 프로퍼티가 있어야 하며, 반드시 `val` 또는 `var`로 선언되어야 함
- `abstract`, `open`, `sealed`, `inner`로 선언 불가 (기본적으로 final 클래스)
- 다른 클래스가 data class를 상속받을 수 없음

### 상속 관련

data class는 **다른 클래스를 상속받을 수 있습니다**.
```kotlin
// 가능: data class가 일반/abstract 클래스를 상속
open class Person(val id: String)
data class User(val name: String, val age: Int, val userId: String) : Person(userId)

// 가능: sealed class와 함께 사용 (흔한 패턴)
sealed class Result
data class Success(val data: String) : Result()
data class Error(val message: String) : Result()

// 불가능: 다른 클래스가 data class를 상속
data class User(val name: String)
class Admin : User("admin")  // 컴파일 에러
```

### 주의: 주 생성자 프로퍼티만 자동 생성 함수에 포함

실무에서 자주 발생하는 실수입니다. **클래스 바디에 선언한 프로퍼티는 자동 생성 함수에 포함되지 않습니다**.
```kotlin
data class User(val name: String) {
    var age: Int = 0  // 클래스 바디의 프로퍼티
}

val user1 = User("Tom").apply { age = 20 }
val user2 = User("Tom").apply { age = 30 }

println(user1 == user2)  // true - age는 equals()에 포함되지 않음
println(user1)           // User(name=Tom) - age는 toString()에 표시되지 않음
println(user1.copy())    // User(name=Tom) - age는 복사되지 않음 (0으로 초기화)

val (name) = user1       // age는 구조 분해 불가
```

모든 프로퍼티를 자동 생성 함수에 포함시키려면 **주 생성자에 선언**해야 합니다.

### val 사용 권장

data class의 핵심은 불변성입니다. `var`를 사용하면 `copy()`의 장점이 사라지고 예측하기 어려운 코드가 됩니다.
```kotlin
// 권장: 불변 객체
data class User(val name: String, val age: Int)

// 비권장: 가변 객체
data class User(var name: String, var age: Int)
```

상태를 변경해야 한다면 `copy()`로 새 객체를 만드는 것이 안전합니다.

---

## 정리

| 기능 | 일반 Class | Data Class |
|------|-----------|------------|
| **용도** | 로직 및 상태 관리 | 데이터 보유 및 전달 |
| **equals() / hashCode()** | 참조값 비교 | 값 비교 (자동 생성) |
| **toString()** | 해시코드만 표시 | 프로퍼티까지 표시 |
| **copy()** | 직접 구현 필요 | 자동 생성 |
| **구조 분해** | 직접 구현 필요 | 자동 지원 |
| **상속** | 가능 (`open` 필요) | 상속받기 가능 / 상속 주기 불가 |

Kotlin의 `data class`는 단순히 보일러플레이트 코드를 줄이는 것을 넘어서, 불변성과 값 기반 비교라는 함수형 프로그래밍의 핵심 개념을 자연스럽게 구현한 기능입니다.

긴 글 읽어주셔서 감사합니다.