---
layout: post
title: "Kotlin in Action 2판 13장 DSL 만들기"
date: 2025-06-08 12:00:00 +0900
categories: [Kotlin, Kotlin In Action 2, 코틀린 인 액션 2판]
tags: Kotlin in Action 2판 13장 DSL 만들기
author: admin
---

# 13장 DSL 구축

## 이 장에서 다루는 내용
- 도메인 특화 언어(DSL) 만들기
- 수신 객체 지정 람다 사용
- invoke 관례 사용
- 기존 코틀린 DSL 예시

---

## 13.1 API에서 DSL로: 표현력 좋은 커스텀 코드 구조 만들기

- 모든 개발자에게는 API를 훌륭하게 만들 책임이 있음
- 지금까지는 깔끔한 API를 돕는 코틀린의 특성을 알아봄 -> "깔끔한 API"란, 독자가 명확히 코드의 동작을 잘 이해할 수 있어야 하며 최소한의 문법 사용을 통해 간결성을 갖춘 것을 의미
- Kotlin의 확장 함수, 중위 호출, 연산자 오버로딩, 람다 등으로 불필요한 문법을 줄일 수 있음을 배워왔음

이번 장에서는 더 나아가 Kotlin의 DSL 구축에 도움을 주는 코틀린 기능을 알아볼 예정

### 13.1.1 도메인 특화 언어(Domain-specific languages)

- 프로그래밍 언어에는 크게 2가지로 분류가 가능함
    - 범용 프로그래밍 언어: 컴퓨터로 모든 문제를 충분히 풀 수 있음
    - 도메인 특화 언어: 특정 영역에 최적화 된 언어
- 예를 들어 SQL은 클래스나 함수의 선언 필요 없이 수행하려는 연산(SELECT, DELETE)을 지정하면 해당 작업의 처리가 가능
    - 즉 DSL은 결과를 선언하고 실행 엔진에게 세부 연산을 맡기기에 선언적이라는 특징을 가짐
    - 다만 DSL은 범용언어로 만든 애플리케이션과의 조합이 어려움 -> 문자열이나 별도의 파일로 상호작용해야함

---

### 13.1.2 내부 DSL(Internal DSL)은 프로그램 전체와 매끄럽게 통합됨

- Kotlin DSL은 정적 타입으로 IDE 지원, 타입 검증이 가능함
- 외부 DSL(SQL 등)은 문자열/별도 파일로 통합이 어렵고 IDE 지원도 제한적임
- 내부 DSL은 코드 자체가 Kotlin 문법 안에 자연스럽게 녹아듦

아래는 가장 많은 고객이 살고 있는 나라를 알아내는 쿼리문 예제이다.

#### SQL 예제
```sql
SELECT Country.name, COUNT(Customer.id)
     FROM Country
INNER JOIN Customer
       ON Country.id = Customer.country_id
 GROUP BY Country.name
 ORDER BY COUNT(Customer.id) DESC
  LIMIT 1
```

#### Kotlin DSL 예제(Exposed 라이브러리)
``` kotlin
(Country innerJoin Customer)
   .slice(Country.name, Count(Customer.id))
   .selectAll()
   .groupBy(Country.name)
   .orderBy(Count(Customer.id), order = SortOrder.DESC)
   .limit(1)
```

- 위 예제들은 모두 동일한 프로그램이 생성 및 실행된다.
- 하지만 Exposed 예제는 코틀린의 기본적인 API 를 활용 가능함 -> 이를 내부 DSL 
- 따라서 Kotlin 예제는 결과를 Kotlin 객체로 바꾸거나 하는 노력이 필요 없다.

---

### 13.1.3 DSL의 구조

- 보편적인 라이브러리는 여러 메서드로 이루어져있고 이를 호출함을 통해서 라이브러리를 사용함 -> 명령-질의 API라고 부름
- 반대로 DSL은 람다를 내포시키거나 메서드 호출을 연쇄시키는 방식으로 구조를 만듬
- DSL 의 장점으로 같은 맥락을 매 함수 호출 시 마다 반복하지 않고도 재사용이 가능하다는 점

``` kotlin
dependencies {
    testImplementation(kotlin("test"))
    implementation("org.jetbrains.exposed:exposed-core:0.40.1")
    implementation("org.jetbrains.exposed:exposed-dao:0.40.1")
}

// 내부 API
fun DependencyHandler.`implementation`(dependencyNotation: Any): Dependency? =
    add("implementation", dependencyNotation)
```
vs
``` kotlin
project.dependencies.add("testImplementation", kotlin("test"))
project.dependencies.add("implementation",
   "org.jetbrains.exposed:exposed-core:0.40.1")
project.dependencies.add("implementation",
   "org.jetbrains.exposed:exposed-dao:0.40.1")
```

---

### 13.1.4 내부 DSL로 HTML 빌드하기
- 내부 DSL을 사용하면 HTML의 중첩 구조를 Kotlin 코드로 자연스럽게 표현할 수 있음

- 대표 예시:
``` kotlin
fun createSimpleTable() = createHTML().
    table {
        tr {
            td { +"cell" }
        }
    }
```
- 위 코드는 다음 HTML을 생성함
``` html
<table>
  <tr>
    <td>cell</td>
  </tr>
</table>
```

- 반복 구조도 자연스럽게 표현 가능함
``` kotlin
fun createAnotherTable() = createHTML().table {
    val numbers = mapOf(1 to "one", 2 to "two")
    for ((num, string) in numbers) {
        tr {
            td { +"$num" }
            td { +string }
        }
    }
}
```

- Kotlin 으로 HTML DSL을 만들었을 때의 장점은 다음과 같음
    - 타입 안정성을 보장: td를 tr에서만 사용할 수 있도록 강제하여 HTML 문법을 준수하도록 할 수 있음
    - Kotlin API를 활용할 수 있음: 반복문 등

## 13.2 구조화된 API 구축: DSL의 수신 객체 지정 람다 사용

### 13.2.1 수신 객체 지정 람다와 확장 함수 타입

- 수신 객체 지정 람다(lambdas with receivers)는 DSL 문법 구현의 핵심임
- 함수 파라미터를 `StringBuilder.() -> Unit`처럼 확장 함수 타입으로 선언하면, 람다 내부에서 this를 암시적으로 사용할 수 있음
- 수신 객체 지정 람다는 확장 함수와 같은 방식으로 호출 가능함 따라서 일반 람다와 달리 it 없이 바로 append 메서드 호출이 가능함
- 예시:
``` kotlin
fun buildString(builderAction: StringBuilder.() -> Unit): String =
    StringBuilder().apply(builderAction).toString()
```
- 호출 예:
``` kotlin
val s = buildString {
    append("Hello, ")
    append("World!")
}
```
![koinaction13-1](https://github.com/user-attachments/assets/c25c1d60-76db-418b-87db-093a75f42f8c)

- 추가로 람다를 변수로 저장해서, 확장 함수처럼 사용할 수 있음
``` kotlin
val appendExcl: StringBuilder.() -> Unit = { append("!") }
val sb = StringBuilder("Hi")
sb.appendExcl()
```

- apply, with 같은 표준 라이브러리 함수도 수신 객체 지정 람다를 사용함
``` kotlin
inline fun <T> T.apply(block: T.() -> Unit): T {
    block()
    return this
}
inline fun <T, R> with(receiver: T, block: T.() -> R): R =
    receiver.block()
```
반환 값을 활용하지 않는 다면 두 메서드를 교환해서 사용도 가능

---

### 13.2.2 수신 객체 지정 람다를 HTML 빌더 안에서 사용

- HTML을 만들기 위한 Kotlin DSL 을 보통 HTML 빌더라고 함 -> 빌더 패턴 이라고 부름
- 빌더를 사용하게 되면 객체간의 계층 구조를 선언적으로 정의 할 수 있어 매우 유용함
    - table, tr, td 각각의 블록에서만 하위 태그 함수 호출 가능함

- 예시 Tag 구조:
``` kotlin
open class Tag

class TABLE : Tag {
    fun tr(init: TR.() -> Unit)
}

class TR : Tag {
    fun td(init: TD.() -> Unit)
}

class TD : Tag
```
- 예제:
``` kotlin
fun createSimpleTable() = createHTML().table {
    this@table.tr {
        this@tr.td {
            +"cell"
        }
    }
}

```
- 명시적 리시버 사용 시 this@table 등으로 블록별 객체 접근 가능함
- 일반 람다로 구현했다면 중복과 복잡도가 매우 증가함

다만 내포 깊이가 깊은 구조에서는 외부 프로퍼티를 참조하는 등의 계층구조의 혼동이 올 수 있음
- 예제
``` kotlin
createHTML().body {
    a {
        img {
            href = "https://..." // href는 a 태그의 프로퍼티
        }
    }
}
```

- 이 때 @DslMarker로 내포된 람다에서 외부 람다의 수신객체를 참조하는 스코프 충돌을 방지할 수 있음

``` kotlin
@DslMarker
annotation class HtmlTagMarker
```

``` kotlin
// HTML 태그의 경우 모두 Tag 클래스의 하위 클래스 이기에 해당 클래스에만 적용한다면 모든 HTML 빌더 람다에서 객체 접근 방지 기능이 적용 됨
@HtmlTagMarker
open class Tag
```

- 이제 img 람다 내에서 href 호출은 컴파일에 실패하게 됨.
- 만약 href 를 호출하고 싶다면 명시적으로 수신 객체를 지정한다면 내부에서 호출 가능

---

### 13.2.3 Kotlin 빌더: 추상화와 재사용을 가능하게 해준다

- 코틀린 내부 DSL 구조는 코드의 추상화와 재사용을 가능하게 함
- 특히 반복되는 코드를 새로운 함수로 묶어서 이해하기 쉬운 이름을 붙일 수 있음

#### HTML 예시
``` html
<body>
 <ul>
   <li><a href="#0">The Three-Body Problem</a></li>
   <li><a href="#1">The Dark Forest</a></li>
   <li><a href="#2">Death’s End</a></li>
 </ul>
 <h2 id="0">The Three-Body Problem</h2>
 <p>The first book tackles...</p>
 <h2 id="1">The Dark Forest</h2>
 <p>The second book starts with...</p>
 <h2 id="2">Death’s End</h2>
 <p>The third book contains...</p>
</body>
```

#### kotlinx.html을 사용하면 위 HTML 구문을 아래와 같이 간결하게 표현 가능
- 예시:
``` kotlin
@HtmlTagMarker
class LISTWITHTOC {
   val entries = mutableListOf<Pair<String, String>>()
   fun item(headline: String, body: String) {
       entries += headline to body
   }
}

fun BODY.listWithToc(block: LISTWITHTOC.() -> Unit) {
   val listWithToc = LISTWITHTOC()
   listWithToc.block()
   ul {
       for ((index, entry) in listWithToc.entries.withIndex()) {
           li { a("#$index") { +entry.first } }
       }
   }
   for ((index, entry) in listWithToc.entries.withIndex()) {
       h2 { id = "$index"; +entry.first }
       p { +entry.second }
   }
}

fun buildBookList() = createHTML().body {
   listWithToc {
       item("The Three-Body Problem", "The first book tackles...")
       item("The Dark Forest", "The second book starts with...")
       item("Death’s End", "The third book contains...")
   }
}
```

- 각 태그를 클래스로, 각 태그 생성 함수를 수신 객체 지정 람다를 받는 고차 함수로 정의함
- 계층적 구조와 중첩 로직을 클래스로 구현할 수 있음
- 복잡한 구조도 함수화/패턴화해 반복적으로 사용할 수 있음 -> 이를 통해 책 초반에 얘기한 깔끔한 API를 개발하는데에 도움을 줌


