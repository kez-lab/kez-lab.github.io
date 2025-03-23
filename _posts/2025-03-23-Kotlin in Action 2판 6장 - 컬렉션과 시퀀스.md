---
layout: post
title: "코틀린 인 액션 2판: 6장 - 컬렉션과 시퀀스"
date: 2025-03-23 12:00:00 +0900
categories: [Kotlin]
tags: welcome introduction
author: admin
---

# 6장 코틀린 인 액션 2판: 6장 - 컬렉션과 시퀀스

> 이 글에서는 Kotlin 컬렉션 처리의 핵심인 함수형 API들과 시퀀스(Sequence)의 개념을 정리하고, 실제 개발에서 어떻게 응용할 수 있는지를 설명한다. 필자는 안드로이드 개발 관점에서 일부 실용 예시도 함께 소개하며, 보다 실용적이고 표현력 있는 Kotlin 코드를 작성하는 방법을 전달하고자 한다.

---

## 6.1 컬렉션에 대한 함수형 API

### 함수형 프로그래밍 스타일이란?

Kotlin은 함수형 프로그래밍의 요소를 적극적으로 수용하고 있으며, 컬렉션을 처리할 때 for-loop 대신 `map`, `filter`, `groupBy` 등 고차 함수를 사용하는 방식을 권장한다.

이러한 방식은 다음과 같은 장점을 제공한다.

- **표현력 있는 코드**: 의도를 명확하게 드러낸다.
- **재사용성과 테스트 용이성**: 부수 효과가 적어 유지보수가 수월하다.
- **개발자 간 공통된 어휘 사용**: 코드 이해 및 협업이 용이하다.

---

### 6.1.1 `filter`와 `map` – 원소 제거와 변환

#### `filter`

- **역할**: 주어진 조건(Predicate)을 만족하는 원소만 필터링하여 새로운 컬렉션을 반환한다.
- **특징**: 원소의 구조나 형태는 그대로 유지된다.

```kotlin
val list = listOf(1, 2, 3, 4)
println(list.filter { it % 2 == 0 }) // [2, 4]
```

```kotlin
val people = listOf(Person("Alice", 29), Person("Bob", 31))
println(people.filter { it.age >= 30 }) // [Person(name=Bob, age=31)]
```

#### `map`

- **역할**: 컬렉션의 각 원소를 변환하여 새로운 컬렉션을 생성한다.
- **특징**: 원소 개수는 유지되지만, 내용은 변경된다.

```kotlin
val list = listOf(1, 2, 3, 4)
println(list.map { it * it }) // [1, 4, 9, 16]

val people = listOf(Person("Alice", 29), Person("Bob", 31))
println(people.map { it.name }) // [Alice, Bob]
```

---

### 6.1.2 `reduce`와 `fold` – 컬렉션 값 누적

#### `reduce`

- **역할**: 컬렉션의 원소를 순차적으로 누적하여 하나의 결과를 생성한다.
- **특징**: 첫 번째 원소가 초기값으로 사용된다.

```kotlin
val list = listOf(1, 2, 3, 4)
println(list.reduce { acc, element -> acc + element }) // 10
```

#### `fold`

- **역할**: `reduce`와 비슷하지만, 누적의 시작값을 직접 지정할 수 있다.
- **특징**: 초기값을 명시할 수 있어 보다 유연한 누적 처리가 가능하다.

```kotlin
val people = listOf(Person("Aleksei", 29), Person("Natalia", 28))
val result = people.fold("") { acc, person -> acc + person.name }
println(result) // AlekseiNatalia
```

---

### 6.1.3 `all`, `any`, `none`, `count`, `find` – 술어 적용

- `all`: 모든 원소가 조건을 만족하면 true
- `any`: 하나라도 만족하면 true
- `none`: 모두 조건을 만족하지 않으면 true
- `count`: 조건을 만족하는 원소의 개수
- `find`: 조건을 만족하는 첫 번째 원소 반환 (없으면 null)

```kotlin
val people = listOf(Person("Alice", 27), Person("Bob", 31))
val canBeInClub27 = { p: Person -> p.age <= 27 }

println(people.all(canBeInClub27)) // false
println(people.any(canBeInClub27)) // true
println(people.none(canBeInClub27)) // false
println(people.count(canBeInClub27)) // 1
println(people.find(canBeInClub27)) // Person(name=Alice, age=27)
```

> **빈 컬렉션에서는**
> - `all` → true  
> - `any` → false  
> - `none` → true

---

### 6.1.4 `partition` – 리스트를 두 그룹으로 분할

- **역할**: 조건을 기준으로 컬렉션을 두 그룹으로 나눈다.
- **결과**: 조건을 만족하는 리스트, 만족하지 않는 리스트로 구성된 `Pair`를 반환한다.

```kotlin
val people = listOf(
    Person("Alice", 26),
    Person("Bob", 29),
    Person("Carol", 31)
)

val (young, old) = people.partition { it.age <= 27 }

println(young) // [Person(name=Alice, age=26)]
println(old)   // [Person(name=Bob, age=29), Person(name=Carol, age=31)]
```

---

### 6.1.5 `groupBy` – 그룹화된 맵 생성

- **역할**: 컬렉션의 원소를 특정 기준에 따라 그룹화하고, `Map<Key, List<Value>>` 형태로 반환한다.

```kotlin
val people = listOf(
    Person("Alice", 31),
    Person("Bob", 29),
    Person("Carol", 31)
)

val groupedByAge = people.groupBy { it.age }

println(groupedByAge)
// {31=[Person(name=Alice, age=31), Person(name=Carol, age=31)], 29=[Person(name=Bob, age=29)]}
```

```kotlin
val list = listOf("apple", "apricot", "banana", "cantaloupe")
val groupedByFirstChar = list.groupBy { it.first() }

println(groupedByFirstChar)
// {a=[apple, apricot], b=[banana], c=[cantaloupe]}
```

---

### 6.1.6 `associate`, `associateWith`, `associateBy` – 컬렉션을 맵으로 변환

#### `associate`

- **역할**: 각 원소를 `(key to value)` 쌍으로 매핑하여 맵 생성

```kotlin
val people = listOf(Person("Joe", 22), Person("Mary", 31))
val nameToAge = people.associate { it.name to it.age }
println(nameToAge) // {Joe=22, Mary=31}
```

#### `associateWith`

- **역할**: 원소 자체를 키로 사용하고, 람다를 통해 값을 생성

```kotlin
val personToAge = people.associateWith { it.age }
println(personToAge)
// {Person(name=Joe, age=22)=22, Person(name=Mary, age=31)=31}
```

#### `associateBy`

- **역할**: 람다의 반환값을 키로 사용하고, 원소를 값으로 저장

```kotlin
val ageToPerson = people.associateBy { it.age }
println(ageToPerson)
// {22=Person(name=Joe, age=22), 31=Person(name=Mary, age=31)}
```

---

### 6.1.7 `replaceAll`, `fill` – 컬렉션 원소 변경

#### `replaceAll`

- **역할**: 각 원소에 람다를 적용하여 값 변경

```kotlin
val names = mutableListOf("Martin", "Samuel")
names.replaceAll { it.uppercase() }
println(names) // [MARTIN, SAMUEL]
```

#### `fill`

- **역할**: 리스트의 모든 원소를 하나의 값으로 설정

```kotlin
names.fill("redacted")
println(names) // [redacted, redacted]
```

---

### 6.1.8 `ifEmpty` – 빈 컬렉션에 기본값 지정

- **역할**: 컬렉션이 비어 있을 경우 대체 값을 반환

```kotlin
val empty = emptyList<String>()
val full = listOf("apple", "orange", "banana")

println(empty.ifEmpty { listOf("no", "values", "here") }) // [no, values, here]
println(full.ifEmpty { listOf("no", "values", "here") })  // [apple, orange, banana]
```

---

### 6.1.9 `chunked`, `windowed` – 컬렉션 분할

#### `chunked`

- **역할**: 컬렉션을 고정 크기로 나누어 리스트로 반환

```kotlin
val numbers = (1..10).toList()
println(numbers.chunked(3))
// [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]
```

#### `windowed`

- **역할**: 슬라이딩 윈도우 방식으로 부분 리스트 생성

```kotlin
println(numbers.windowed(3))
// [[1, 2, 3], [2, 3, 4], [3, 4, 5], ...]
```

---

## 6.2 시퀀스(Sequence)를 활용한 지연 계산

### 즉시 계산 vs 지연 계산

- **컬렉션**: 연산이 즉시 실행되고 중간 결과가 모두 생성된다.
- **시퀀스**: 연산이 지연되고, 최종 결과가 필요할 때까지 중간 연산은 보류된다.

```kotlin
val result = listOf(1, 2, 3, 4)
    .asSequence()
    .map { it * it }
    .find { it > 3 }

println(result) // 4
```

---

### 연산 순서와 성능 최적화

```kotlin
val people = listOf(
    Person("Alice", 29),
    Person("Bob", 31),
    Person("Charles", 31),
    Person("Dan", 21)
)

val result = people.asSequence()
    .map(Person::name)
    .filter { it.length < 4 }
    .toList()

println(result) // [Bob, Dan]
```

> `map`보다 `filter`를 먼저 실행하면 불필요한 연산을 줄일 수 있어 성능이 개선된다.

---

### `generateSequence` – 시퀀스 직접 생성

- **역할**: 초기값과 다음 값을 계산하는 람다를 기반으로 시퀀스를 생성

```kotlin
val naturalNumbers = generateSequence(0) { it + 1 }
val numbersTo100 = naturalNumbers.takeWhile { it <= 100 }
println(numbersTo100.sum()) // 5050
```

```kotlin
import java.io.File

fun File.isInsideHiddenDirectory(): Boolean =
    generateSequence(this) { it.parentFile }.any { it.isHidden }

val file = File("/Users/svtk/.HiddenDir/a.txt")
println(file.isInsideHiddenDirectory()) // true
```
