---
layout: post
title: "코틀린 인 액션 2판: 6장 - 컬렉션과 시퀀스"
description: "Kotlin 컬렉션 API와 시퀀스의 지연 연산: filter, map, flatMap, 시퀀스 성능 최적화"
date: 2025-03-23 12:00:00 +0900
categories:
    - Kotlin
tags:
    - Kotlin
    - Kotlin in Action
    - Collection
    - Sequence
    - Functional Programming
---

# 6장 코틀린 인 액션 2판: 6장 - 컬렉션과 시퀀스

> 이 글에서는 Kotlin 컬렉션 처리의 핵심인 함수형 API들과 시퀀스(Sequence)의 개념을 정리하고, 실제 개발에서 어떻게 응용할 수 있는지를 설명한다. 필자는 안드로이드 개발 관점에서 일부 실용 예시도 함께 소개하며, 보다 실용적이고 표현력 있는 Kotlin 코드를 작성하는 방법을 전달하고자 한다.

### 알아볼 내용
- 일반적인 컬렉션 접근 패턴을 표준 라이브러리 함수를 통해 더 효율적이고 간결하게 조합 가능
- 시퀀스를 통해 여러가지 컬렉션 연산을 효율적으로 적용하는 방법

---

## 6.1 컬렉션에 대한 함수형 API

### 함수형 프로그래밍 스타일이란?

Kotlin은 함수형 프로그래밍의 요소를 적극적으로 수용하고 있으며, 컬렉션을 처리할 때 for-loop 대신 `map`, `filter`, `groupBy` 등 고차 함수를 사용하는 방식을 권장한다.

이러한 방식은 다음과 같은 장점을 제공한다.

- **표현력 있는 코드**: 의도를 명확하게 드러낸다.
- **재사용성과 테스트 용이성**: 부수 효과가 적어 유지보수가 수월하다.
- **개발자 간 공통된 어휘 사용**: 코드 이해 및 협업이 용이하다.

참고로 이러한 컬렉션 함수는 코틀린 개발자들이 만든 것이 아님을 참고하자 (C#, Groovy, 스칼라에 이미 존재)
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

간혹 필자는 map 메서드를 반복문을 위해서 쓰는 경우가 있었는데, 그런 경우 반환된 객체의 사용을 하지 않기에 forEach를 활용하는 것이 효율적일 것 같다는 개인적인 의견을 남김.

> 참고: 이러한 반복되는 컬렉션 메서드 사용 시 람다 내에서 연산이 존재할 경우 불합리한 계산식이 된다.

#### Map의 key, value
Map Type의 경우 key, value 를 처리하는 함수는 따로 존재함.
- filterKeys, mapKeys : 키를 걸러내거나 변환
- filterValues, mapValues: 값을 걸러내거나 변환
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

> runningReduce, runningFold 사용 시 중간 누적 값도 구하기 가능
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

> 만약 키가 같은 값이 여러번 추가되면 마지막 결과가 그 이전에 들어간 결과를 덮어쓰게 됨
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

### 6.1.10 컬렉션 합치기: `zip`

- **역할**: 서로 관련 있는 데이터를 별도의 리스트로 나눠 저장한 경우, 이를 인덱스 기준으로 하나로 묶어주는 함수.
- **설명**: 두 컬렉션을 인덱스 순서대로 결합하여 `Pair`의 리스트를 생성한다. 두 리스트 중 더 짧은 길이에 맞춰 결과가 생성되며, 나머지 원소는 무시된다.

예를 들어 `Person` 객체를 따로 만들지 않고, 이름과 나이를 각각 리스트에 저장한 경우 다음과 같이 결합할 수 있다:

```kotlin
val names = listOf("Joe", "Mary", "Jamie")
val ages = listOf(22, 31, 44, 0)

println(names.zip(ages))
// [(Joe, 22), (Mary, 31), (Jamie, 44)]
```

> 인덱스가 일치하는 원소끼리 쌍을 이루며, 인덱스를 초과하는 `ages` 리스트의 마지막 요소는 무시된다.

`zip`은 람다를 함께 사용하여 원하는 형태로 변형할 수 있다:

```kotlin
data class Person(val name: String, val age: Int)

val result = names.zip(ages) { name, age -> Person(name, age) }
println(result)
// [Person(name=Joe, age=22), Person(name=Mary, age=31), Person(name=Jamie, age=44)]
```

> name과 age를 묶어서 `Person` 객체로 변환하는 예제이다.

---

#### 중위 표기법으로도 사용 가능

`zip`은 중위 함수이므로 다음처럼 연산자처럼 쓸 수도 있다:

```kotlin
println(names zip ages)
// [(Joe, 22), (Mary, 31), (Jamie, 44)]
```

---

#### `zip`을 연쇄 호출할 경우

`zip`은 두 컬렉션만 매핑할 수 있기 때문에, 여러 개의 리스트를 연쇄적으로 `zip`할 경우 결과는 `Pair`의 중첩 형태가 된다:

```kotlin
val countries = listOf("DE", "NL", "US")
println(names zip ages zip countries)
// [((Joe, 22), DE), ((Mary, 31), NL), ((Jamie, 44), US)]
```

> 위 결과는 `Pair<Pair<String, Int>, String>` 구조가 되므로, 단순한 리스트로 처리하고자 할 경우 가공이 필요하다.

---

### 6.1.11 내포된 컬렉션의 원소 처리: `flatMap`과 `flatten`

- **flatMap**과 **flatten**은 내부에 또 다른 컬렉션이 있는 컬렉션(예: `List<List<String>>`)을 다룰 때 사용한다.
- 주로 2단계 이상의 리스트를 평평하게(pending) 만들어 하나의 리스트로 합치고자 할 때 유용하다.

---

#### 예제 배경

여기서 `Book` 클래스는 여러 저자(author)를 가질 수 있으며, 이 `Book` 객체들을 담은 컬렉션 `library`가 존재한다.

```kotlin
class Book(val title: String, val authors: List<String>)

val library = listOf(
    Book("Kotlin in Action", listOf("Isakova", "Elizarov", "Aigner", "Jemerov")),
    Book("Atomic Kotlin", listOf("Eckel", "Isakova")),
    Book("The Three-Body Problem", listOf("Liu"))
)
```

---

#### 일반적인 `map` 사용 결과

`Book.authors`는 리스트이기 때문에, 단순히 `map`을 사용할 경우 `List<List<String>>` 형태가 된다.

```kotlin
val authors = library.map { it.authors }
println(authors)
// [[Isakova, Elizarov, Aigner, Jemerov], [Eckel, Isakova], [Liu]]
```

> 중첩 리스트 구조로 되어 있어, 단일한 저자 리스트가 필요한 상황에서는 적합하지 않다.

---

#### `flatMap` 사용

`flatMap`은 각 원소를 변환한 후 평평하게(flatten) 합쳐준다.

```kotlin
val authors = library.flatMap { it.authors }
println(authors)
// [Isakova, Elizarov, Aigner, Jemerov, Eckel, Isakova, Liu]
```

> 모든 저자 리스트를 하나로 합쳐 반환한다.  
> 중복이 제거되지 않기 때문에 필요시 `toSet()` 등을 사용한다.

```kotlin
println(authors.toSet())
// [Isakova, Elizarov, Aigner, Jemerov, Eckel, Liu]
```

> `Isakova`는 두 번 등장했으나 `Set`으로 중복을 제거했다.

---

#### `flatten` 사용

`flatten`은 이미 `List<List<T>>` 구조인 경우 사용할 수 있으며, 중간에 변환이 필요 없는 경우 유용하다.

```kotlin
val nested = listOf(
    listOf("A", "B"),
    listOf("C", "D")
)

val flat = nested.flatten()
println(flat)
// [A, B, C, D]
```

> `flatMap`은 `map + flatten`의 조합이라고 이해하면 된다.

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

- 위 코드에서 먼저 `map`으로 이름만 추출한 후, 이름의 길이를 기준으로 필터링한다.
- 하지만 **`filter` → `map` 순으로 바꾸면**, 문자열 길이를 먼저 판단한 뒤 `name`만 추출하므로, 객체 전체에 접근하지 않아도 되고 불필요한 `map` 연산을 줄일 수 있다.

---

### `generateSequence` – 시퀀스 직접 생성

- **역할**: 초기값과 다음 값을 계산하는 람다를 기반으로 시퀀스를 생성
- **이점**: 최종 연산(sum())을 수행하기 전까지 시퀀스의 연산은 지연됨

```kotlin
val naturalNumbers = generateSequence(0) { it + 1 }
val numbersTo100 = naturalNumbers.takeWhile { it <= 100 }
println(numbersTo100.sum()) // 5050
```

- 지연계산을 통해 takeWhile는 조건을 넘는 순간 연산을 멈춤 (이게 이점인지 책에서는 따로 얘기는 없음)

### 디렉터리 구조 탐색 예제

```kotlin
import java.io.File

fun File.isInsideHiddenDirectory(): Boolean =
    generateSequence(this) { it.parentFile }.any { it.isHidden }

val file = File("/Users/svtk/.HiddenDir/a.txt")
println(file.isInsideHiddenDirectory()) // true
```
- `generateSequence(this) { it.parentFile }`는 현재 파일에서 시작해 부모 디렉터리를 따라 위로 이동하는 시퀀스를 생성한다.
- `any { it.isHidden }`은 해당 경로 중 하나라도 숨김 처리되어 있으면 `true`를 반환한다.

> 이렇게 시퀀스를 사용하여 조건을 만족하는 디렉터리를 찾은 후 더이상 상위 디렉터리를 뒤지지 않아도 되는 효율적인 연산이 가능
