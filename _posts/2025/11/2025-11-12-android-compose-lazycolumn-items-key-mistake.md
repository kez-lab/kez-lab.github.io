---
layout: post
title: "[Android/Compose] LazyColumn의 items 에 key 설정 실수"
description: "Jetpack Compose LazyColumn key 설정 실수: hashCode() 사용 문제, 상태 보존, Recomposition 최적화"
date: 2025-11-12T15:12:15.509Z
categories:
    - Compose
tags:
    - Android
    - Jetpack Compose
    - LazyColumn
    - Performance
    - Recomposition
---

## 개요
안녕하세요, 오늘은 Android Jetpack Compose 개발을 하면서 LazyColumn의 items에 key 를 셋팅할 때 가장 많이 헷갈리는 부분들에는 어떤게 있는지 그리고 이러한 경우 우리는 어떻게 대처하는 것이 가장 최선의 방법일지를 고민하게 된 과정들을 적어보고자 포스팅을 하게 되었습니다.

## Compose에서 key 의 역할
기본적으로 각 Composable 의 상태는 Composable의 Call Site(위치)를 ​​기준으로 키가 지정됩니다. 
하지만 리스트 데이터가 변경되면서 컴포저블의 위치가 변경되는 경우 기억된 상태가 사실상 사라지기 때문에 문제가 발생할 수 있습니다. 

예를 들어 아래 예시와 같이 목록에 새 요소가 하단에 추가될 때는 컴포저블의 위치가 변경되지 않기 때문에 Column내의 1,2 번의 MovieOverview 가 유지되는 것을 볼 수 있습니다.

<img src="/assets/img/11/2025-11-12-lifecycle-newelement-bottom-all-recompose.png" alt="Recomposition when new element added to bottom" width="600"/>


하지만 상단에 새로운 요소가 추가된다면 컴포저블의 위치가 전부 변경되기 때문에 컴포지션 내 MoviesScreen의 MovieOverview 컴포저블은 재사용할 수 없으며 모든 SideEffect 또한 다시 시작되게 되는 것이죠.

<img src="/assets/img/11/2025-11-12-lifecycle-newelement-top-all-recompose.png" alt="Recomposition when new element added to top" width="600"/>

사진속에서 MovieOverview의 색상이 다르면 컴포저블이 재구성되었음을 의미합니다.

이와 동일하게 LazyColumn, LazyRow 에서도 데이터 리스트의 변경으로 컴포저블의 순서변경이 발생하는 경우에 기존 컴포저블의 재사용 및 상태유지가 불가능해지며, 이는 곧 리컴포지션 최적화 장점을 저버리게 되는 구조인 것이죠!

이를 유지하기 위해서 Compose에서는 key 를 사용해서 런타임에 트리의 특정 영역을 식별하는 데 사용할 값을 지정할 수 있습니다.

``` kotlin

@Composable
fun MoviesScreenWithKey(movies: List<Movie>) {
    Column {
        for (movie in movies) {
            key(movie.id) { // Unique ID for this movie
                MovieOverview(movie)
            }
        }
    }
}

// LazyColumn, LazyRow 같은 일부 컴포저블에는 key 컴포저블 지원 기능이 내장되어 있습니다.
@Composable
fun MoviesScreenLazy(movies: List<Movie>) {
    LazyColumn {
        items(movies, key = { movie -> movie.id }) { movie ->
            MovieOverview(movie)
        }
    }
}
```
이렇게 된다면 call site 가 변경되어도 기존 data 의 식별자를 통해서 기존 컴포저블을 인식하고 재구성하지 않게 되는 것이죠.


[참조 링크]
- [Android 컴포지션 내 컴포저블 분석 공식문서](https://developer.android.com/develop/ui/compose/lifecycle?hl=ko#composition-anatomy)
- [Android Items Key 공식문서](https://developer.android.com/develop/ui/compose/lists?hl=ko#item-keys)

## Lazy Composable에서 key를 잘못 사용하는 경우 - Key의 필수 요구사항

이제 key가 충족해야 하는 핵심 요건들을 살펴보겠습니다.

### 1. 고유성 (Uniqueness)

key는 **리스트 내에서 절대 중복되지 않는 고유한 값**이어야 합니다.

예를 들어, 사용자 이름 리스트에서 이름 자체를 key로 사용하면 중복된 key가 발생할 수 있습니다:
```kotlin
val names = listOf("Alice", "Alice", "Bob")

@Composable
private fun LazyNameScreen(innerPadding: PaddingValues) {
    LazyColumn(modifier = Modifier.padding(innerPadding)) {
        items(
            items = names,
            key = { name -> name }
        ) {
            Name(it)
        }
    }
}

// 💥 크래시 발생
java.lang.IllegalArgumentException: Key "Alice" was already used. 
If you are using LazyColumn/Row please make sure you provide a unique key for each item.
```

동일한 key를 사용하면 위와 같이 크래시가 발생합니다. LazyColumn/Row에서 중복 key가 문제가 되는 이유를 더 자세히 알고 싶다면 [pluu님의 블로그](https://pluu.github.io/blog/android/2024/11/30/LazyList/)를 참고해보세요.

#### hashCode()를 key로 사용하는 실수
고유성 측면에서 많은 분들이 실수하시는 부분이 바로 hashCode()를 key로 사용하는 것입니다.

아래 예시를 같이 보시죠

```kotlin
data class Person(
    val name: String,
    val age: Int
)

// data class는 데이터가 같으면 equals()가 true이고 hashCode()도 동일
val p1 = Person(name = "Alice", age = 20)
val p2 = Person(name = "Alice", age = 20)

println(p1 == p2)          // true
println(p1.hashCode())     // 예: 123456
println(p2.hashCode())     // 예: 123456 (동일)

// ⚠️ 하지만 equals()가 false여도 hashCode()가 같을 수 있음 (해시 충돌)
val p3 = Person(name = "Bob", age = 23)
println(p1 == p3)          // false
println(p3.hashCode())     // 예: 123456 (충돌 발생!)
```
위 예시처럼 p1 과 p3 는 서로 다른 이름과 나이를 가진 객체이지만 hashCode() 는 동일할 가능성이 있습니다.

즉 equals() 가 true 일 때 hashCode() 가 동일해야하지만, 반대로 equals()가 false일 때 hashCode()가 무조건 다르다는 논리는 성립되지 않습니다. 
그렇기에 hashCode()를 key로 사용하면 고유성 요구사항을 만족하지 못해 크래시가 발생할 수 있습니다.

### 2. 불변성 (Stability)

key는 **데이터가 업데이트되어도 동일한 항목에 대해서는 절대 바뀌지 않아야** 합니다.

목록 데이터가 변경되거나 순서가 바뀔 때, Compose는 key를 기준으로:
- 기존 컴포저블의 재사용 여부를 판단합니다
- 상태를 올바르게 유지합니다
- 적절한 리컴포지션을 수행합니다

만약 변하는 값을 key로 사용하면, 데이터 변경 시 key도 함께 변경되어 기존 컴포저블과 매칭되지 않습니다. 이는 **key를 사용하는 의미 자체가 사라지는 것**과 같습니다.

#### 잘못된 예시: Index를 key에 포함
```kotlin
@Composable
private fun LazyNameScreen(innerPadding: PaddingValues) {
    LazyColumn(modifier = Modifier.padding(innerPadding)) {
        itemsIndexed(
            items = names,
            key = { index, name -> "$name-$index" }
        ) { index, name ->
            Name(name)
        }
    }
}
```

리스트 순서가 변경되면 index도 변경되므로 key가 달라집니다. 결과적으로:
- 기존 컴포저블을 재사용할 수 없습니다
- 상태가 초기화됩니다
- **key를 아예 사용하지 않는 것과 동일한 상태**가 됩니다

### 3. 일관성 (Consistency)

key는 **리컴포지션이나 데이터 리프레시 등 모든 상황에서 동일한 아이템에 대해 항상 같은 값**을 반환해야 합니다.

#### 잘못된 예시: Key 람다 내부에서 UUID 생성
```kotlin
@Composable
private fun LazyNameScreen(innerPadding: PaddingValues) {
    LazyColumn(
        modifier = Modifier.padding(innerPadding)
    ) {
        itemsIndexed(
            items = names,
            key = { index, name -> UUID.randomUUID().toString() }
        ) { index, name ->
            Name(name)
        }
    }
}
```

이 코드는 key가 호출될 때마다 매번 **새로운 UUID를 생성**합니다. 그 결과:
- 상태가 보존되지 않습니다
- 스크롤 위치가 초기화됩니다
- 애니메이션이 깨집니다

**핵심**: key는 동일한 아이템에 대해 항상 같은 값을 유지해야 합니다. **생성은 1회, 이후 영구 재사용**이 원칙입니다.

---

### Key 사용 시 흔한 실수 정리(피해야 할 패턴)

1. **중복 가능한 값을 key로 사용**
```kotlin
   key = { name -> name }  // 이름이 중복될 수 있음
   key = { item -> item.hashCode() }  // 해시 충돌 가능성
```

2. **Index를 key에 포함**
```kotlin
   key = { index, item -> "$item-$index" }  // 순서 변경 시 key 변경
   key = { index, item -> index }  // 순서 변경 시 매칭 실패
```

3. **Key 람다 내부에서 랜덤 값 생성**
```kotlin
   key = { UUID.randomUUID().toString() }  // 매번 다른 값 생성
   key = { System.currentTimeMillis() }  // 매번 다른 값 생성
```

4. **변경 가능한 속성을 key로 사용**
```kotlin
   key = { user -> user.status }  // status가 변경될 수 있음
   key = { item -> item.updatedAt }  // 업데이트 시간이 변경됨
```

### 올바른 패턴

1. **서버/DB에서 제공하는 고유 ID 사용**
```kotlin
   key = { user -> user.id }
```

2. **데이터 초기화 시점에 UUID 생성**
```kotlin
   data class Item(
       val id: String = UUID.randomUUID().toString(),
       val name: String
   )
   
   key = { item -> item.id }
```

3. **복합 키 사용 (모든 요소가 불변일 때)**
```kotlin
   key = { user -> "${user.id}-${user.createdAt}" }
```

---

Key의 세 가지 요구사항 - **고유성, 불변성, 일관성** - 을 모두 만족해야만 Lazy Composable의 성능 최적화와 안정적인 UI 동작을 보장할 수 있습니다.


## Lazy Composable의 최적 Key 설정 방법

이제 key에 어떤 값을 사용해야 하는지 감이 오셨을 것 같습니다.

### 가장 이상적인 방법: 서버/DB의 고유 ID 사용

최선의 key 설정 방법은 **각 데이터 아이템마다 고유한 ID를 로컬 DB 또는 서버로부터 받아와서 사용하는 것**입니다.

이렇게 해야 하는 이유는:
- 데이터 재요청 시 원천 데이터와 UI 데이터 간의 정확한 매칭이 가능합니다
- 컴포저블의 재사용 및 상태 기억이 올바르게 작동합니다
- 스크롤 위치와 아이템 애니메이션이 안정적으로 보존됩니다

### 대안: UUID를 활용한 클라이언트 ID 생성

하지만 서버로부터 고유한 ID를 받아오는 것이 불가능한 경우가 있습니다. 이런 상황에서는 **데이터 초기화 시점에 UUID로 식별자를 생성**하는 방식을 사용할 수 있습니다.
```kotlin 
data class Person(
    val id: String = UUID.randomUUID().toString(),
    val name: String
)

val names = listOf(
    Person(name = "Alice"),
    Person(name = "Alice"),
    Person(name = "Bob"),
)

@Composable
private fun LazyNameScreen(innerPadding: PaddingValues) {
    LazyColumn(
        modifier = Modifier.padding(innerPadding)
    ) {
        itemsIndexed(
            items = names,
            key = { index, person -> person.id }
        ) { index, person ->
            Name(person.name)
        }
    }
}
```

위 코드처럼 초기화 시점에 생성된 UUID를 key로 사용하면, 데이터의 순서 변경이나 중간 삭제가 발생하더라도:
- 각 아이템의 ID가 고유하게 매칭됩니다
- 리컴포지션이 최적화됩니다
- 상태 기억과 스크롤 위치가 보존됩니다
- 애니메이션 오류를 예방할 수 있습니다

### UUID 방식의 한계와 보완

물론 **데이터 리프레시가 발생하면 리스트를 전체적으로 다시 그리기 때문에** 이 방식의 효과가 제한적인 것은 사실입니다.

하지만 name 외에 추가 필드가 있는 경우, 더 정교한 최적화가 가능합니다:
1. 같은 이름을 가진 아이템들을 먼저 그룹핑합니다
2. 이름이 동일한 경우 다른 필드들을 순차적으로 비교합니다
3. 이전 인덱스와의 거리를 최소화하여 중복을 최소한으로 줄입니다 (헝가리안 알고리즘)

### 결론

클라이언트에서 key를 반드시 사용해야 하는 상황, 특히 **리스트 순서가 변경되거나 중간에 추가/삭제가 발생할 수 있는 상황**에서 이 방법들이 최선의 선택입니다.

추가로 궁금하신 점은 댓글로 남겨주시면 답변드리겠습니다.

긴 글 읽어주셔서 감사합니다!