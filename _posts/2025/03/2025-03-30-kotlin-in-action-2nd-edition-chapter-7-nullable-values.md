---
layout: post
title: "Kotlin in Action 2판 7장 널이 될 수 있는 값"
description: "Kotlin의 null 안전성: nullable 타입, 안전한 호출, 엘비스 연산자, let 함수로 NullPointerException 방지"
date: 2025-03-30 12:00:00 +0900
categories:
    - Kotlin
tags:
    - Kotlin
    - Kotlin in Action
    - Nullable
    - Null Safety
---

# Kotlin in Action 2판 정리 - 7장: 널이 될 수 있는 값

---

## 7장에서 다루는 내용

- 널이 될 수 있는 타입
- 널이 될 가능성이 있는 값을 다루는 구문의 문법
- 널이 될 수 있는 타입과 널이 될 수 없는 타입의 변환
- 코틀린의 널 가능성 개념과 자바 코드 사이의 상호운용성

---

## 7.1 NullPointerException을 피하고 값이 없는 경우 처리: 널 가능성

- 널 가능성(nullable)은 NullPointerException(NPE)을 줄이기 위한 코틀린 타입 시스템의 특성임
- 자바는 null을 허용하면서도 명시적으로 표현하지 않기 때문에 NPE가 자주 발생함
- 예외 메시지 예시:
    
    ```
    java.lang.NullPointerException
    Unfortunately, the application X has stopped
    ```
    
- 이런 예외는 사용자와 개발자 모두를 당황하게 함
- 코틀린은 타입 시스템에서 null 가능성을 표현하고 컴파일 시점에 오류를 감지함
- null 여부를 타입에 포함시켜 오류 가능성을 줄이고 프로그램의 안정성을 높일 수 있음

---

## 7.2 널이 될 수 있는 타입으로 널이 될 수 있는 변수 명시

- 코틀린과 자바의 가장 큰 차이점 중 하나는 코틀린이 널이 될 수 있는 타입을 명시적으로 지원한다는 점임
- 말 그대로 널이 될 수 있는 변수는 타입 선언에 명시적으로 null 허용 여부를 표기해야 함
- 변수에 null이 허용된다면, 해당 변수에 대해 컴파일러는 안전하지 않은 접근을 금지함

### 자바 코드 예시

```java
int strLen(String s) {
    return s.length();
}
```

- 위 함수에 null을 전달하면 NPE 발생함

### 코틀린 코드 예시

```kotlin
fun strLen(s: String): Int = s.length
```

- null을 허용하지 않는 String 타입임

```kotlin
fun main() {
    strLen(null)
    // ERROR: Null can not be a value of a non-null type String
}
```

- String은 non-null 타입으로 null 인자를 허용하지 않음

---

### 널이 될 수 있는 타입 사용 예시

```kotlin
fun strLen(s: String?) = s.length()
// ERROR: only safe (?.) or non-null asserted (!!) calls are allowed
// on a nullable receiver of type kotlin.String?
```

- String?은 널이 될 수 있는 타입이며, 직접 호출 불가
- 안전 호출(?.) 또는 비강제 호출(!!) 연산자 사용 필요

---

### 타입 간 대입 예시

```kotlin
fun main() {
    val x: String? = null
    var y: String = x
    // ERROR: Type mismatch
    // inferred type is String? but String was expected
}
```

- String? 타입은 null을 포함할 수 있으므로 String 타입 변수에 직접 대입 불가
- 컴파일러가 타입 불일치 오류 발생시킴
- null과 비교하여 null이 아님이 확실한 영역에서 해당 값을 사용할 수 있음

### if 검사를 통해 null 값 다루기

```kotlin
fun strLenSafe(s: String?): Int =
    if (s != null) s.length else 0

fun main() {
    val x: String? = null
    println(strLenSafe(x))      // 0
    println(strLenSafe("abc"))  // 3
}
```

- 널 가능성을 다룰 때 if 검사는 가장 기본적인 도구임
- 코틀린은 널이 될 수 있는 값을 다룰 수 있도록 여러 도구를 제공한다고 함

---

## 7.3 타입의 의미 자세히 살펴보기

- 타입은 변수에 어떤 값을 저장할 수 있는지와, 그 값에 어떤 연산을 적용할 수 있는지를 정의함
- 1976년 데이비드 파나스는 타입을 "가능한 값의 집합과, 그 값에 수행할 수 있는 연산의 집합"으로 정의함

예:

- Double 타입
    
    → 표현할 수 있는 값: 64비트 부동소수점 수
    
    → 수행 가능한 연산: 덧셈, 곱셈 등의 수학 함수
    
- Double 타입의 변수에 수학 연산을 적용할 수 있음
- 이 변수에 대해 어떤 연산이 가능한지는 컴파일러가 타입 정보를 기준으로 판단함

자바에서의 String 예시:

- `String?`과 `String`은 모두 `instanceof String` 검사에서 true 반환함
- 하지만 실제로 사용할 수 있는 연산은 다름

| 변수 값 상태 | 호출 가능 여부 |
| --- | --- |
| null 아님 | String 클래스의 모든 메서드 사용 가능 |
| null | 어떤 메서드도 호출 불가 |
- 자바의 타입 시스템은 null을 타입 수준에서 제대로 구분하지 않음
- 변수에 null이 들어갈 가능성이 있어도, 별도 표시 없이 메서드 호출 가능
- null 검사 없이 메서드를 호출하면 실행 시점에 NullPointerException 발생

결론:

- null이 들어갈 수 있는 변수에 대해선 사전에 null 검사를 하지 않으면 안전하지 않음
- 자바 코드 작성 시 null 검사 누락으로 인해 발생하는 NPE가 빈번함

---

### (참고) NullPointerException 오류를 다루는 다른 방법

- 자바의 애너테이션:
    - `@Nullable`, `@NotNull` 등으로 null 가능성 표현 가능
    - 정적 분석 도구가 보완 역할 수행
- 단점:
    - 표준 자바 컴파일 절차의 일부가 아니기에 신뢰할 수 없음
    - 라이브러리 등의 모든 경로를 커버하지 못함
- Optional<T> 사용:
    - null을 감싸는 컨테이너 형태
    - 불편함과 성능 이슈 존재

---

### 실행 시점에서의 차이 (이해가 잘 안가는 부분)

- 널이 될 수 있는 타입과 널이 아닌 타입의 객체는 같음
- 널이 될 수 있는 타입은 감싼 래퍼 타입이 아님
- 성능에 영향 없음

근데 이 얘기가 중간에 왜 나온건지 맥락을 잘 이해하지 못하겠습니다…

---

## 7.4 안전한 호출 연산자로 null 검사와 메서드 호출 합치기: `?.`

보통 이런 문법을 safe call 이라고 한다고 알고있습니다

```kotlin
str?.uppercase()
// if (str != null) str.uppercase() else null 과 동일
```

- str이 null이 아니면 메서드 호출
- null이면 호출 생략 후 결과 null 반환

```kotlin
fun printAllCaps(str: String?) {
    val allCaps: String? = str?.uppercase()
    println(allCaps)
}

fun main() {
    printAllCaps("abc")   // ABC
    printAllCaps(null)    // null
}
```

- 메서드 호출뿐 아니라 프로퍼티 읽기/쓰기에도 safe call 연산자 사용 가능

### 널이 될 수 있는 프로퍼티를 다루기 위해 safe call 사용하기

다음 예제는 `manager`라는 프로퍼티가 있는 Employee 클래스에서 안전한 호출을 사용하는 방법을 보여줌

```kotlin
class Employee(val name: String, val manager: Employee?)

fun managerName(employee: Employee): String? =
    employee.manager?.name

fun main() {
    val ceo = Employee("Da Boss", null)
    val developer = Employee("Bob Smith", ceo)

    println(managerName(developer)) // Da Boss
    println(managerName(ceo))       // null
}
```

- 여러 객체를 연쇄적으로 접근할 때 ?. 연산자를 사용하면 중간 객체가 null이어도 안전하게 접근 가능
- 자바에서는 중첩된 null 검사 코드가 많아지는 반면, 코틀린에서는 ?. 연산자로 간결하게 표현 가능

---

## 7.5 엘비스 연산자로 null에 대한 기본값 제공: `?:`

- 코틀린은 null 대신 사용할 기본값을 지정할 수 있는 `?:` 연산자를 제공함
- 이 연산자는 엘비스(Elvis) 연산자라고 불림

```kotlin
fun greet(name: String?) {
    val recipient: String = name ?: "unnamed"
    println("Hello, $recipient!")
}
```

- `name`이 null이 아니면 그대로 사용되고, null이면 "unnamed"가 사용됨
- 책에는 이 부분이 틀린 설명이여서 제보했습니다 ㅎ.ㅎ

### 엘비스 연산자를 활용해 null 값 다루기

```kotlin
fun strLenSafe(s: String?): Int = s?.length ?: 0

fun main() {
    println(strLenSafe("abc")) // 3
    println(strLenSafe(null))  // 0
}
```

- 엘비스 연산자는 안전한 호출 연산자와 함께 자주 사용되며, null일 경우 기본값 반환에 유용함

### 한 줄로 표현

```kotlin
fun Person.countryName() = company?.address?.country ?: "Unknown"
```

- 엘비스 연산자 오른쪽에는 return이나 throw도 사용할 수 있음
- 조건을 만족하지 않으면 즉시 함수 종료 또는 예외 발생 가능


## 7.6 예외를 발생시키지 않고 안전하게 타입을 캐스트하기: `as?`

- 안전한 캐스트 연산자인 `as?`는 캐스트가 실패할 경우 null을 반환함
- 자바의 `instanceof` 검사와 강제 캐스트 대신 사용할 수 있는 안전한 방법임
- `as` 연산자는 타입이 맞지 않으면 ClassCastException 발생
- 반면 `as?`는 타입이 맞지 않으면 null 반환

```kotlin
// 예시 흐름도
val otherPerson = o as? Person ?: return false
```

- 안전한 캐스트는 엘비스 연산자와 함께 자주 사용됨


---

## 7.7 널 아님 단언: `!!`

- 널 아님 단언(Non-null assertion) 연산자 `!!`는 값이 null이 아님을 개발자가 확신할 때 사용
- null이면 NPE를 발생시킴

```kotlin
str != null → str
str == null → NullPointerException

fun ignoreNulls(str: String?) {
    val strNotNull: String = str!!
    println(strNotNull.length)
}

fun main() {
    ignoreNulls(null)
    // kotlin.KotlinNullPointerException 발생
}
```

- `!!`는 컴파일러에게 "나는 null이 아님을 안다"는 소리를 지르는 도구임
- 발생하는 예외는 null을 다루는 위치를 명확히 함

> `!!`는 무책임한 느낌을 줄 수 있음
코틀린 설계자는 가능한 다른 해결책을 먼저 찾도록 유도하기 위해 이 기호를 선택함
> 

---

### 액션 클래스에서 널 아님 단언문 사용하기

대부분의 경우 `!!` 대신 null 체크 후 안전하게 처리하는 방법이 더 나은 경우도 있음

하지만 UI 프레임워크 등에서는 실제 값이 있는지 없는지를 확인 후 처리하는 일이 많음

아래 예시는 쉽게 설명하자면 한 줄을 복사하는 `executeCopyRow()` 함수의 내부에서 단언문을 사용 중

→ 해당 함수는 `isActionEnabled()`  가 true 일 때만 동작

```kotlin
class SelectableTextList(
    val contents: List<String>,
    var selectedIndex: Int? = null
)

class CopyRowAction(val list: SelectableTextList) {
    fun isActionEnabled(): Boolean =
        list.selectedIndex != null

    fun executeCopyRow() {
        val index = list.selectedIndex!!      // !! 사용
        val value = list.contents[index]
        // value를 클립보드에 복사
    }
}
```

- 이런 패턴은 `list.selectedValue`를 먼저 확인하고 `value`를 직접 사용할 수 있도록 함
- 단, 연쇄적으로 `!!`를 사용할 경우 예외 추적이 어려워짐

```kotlin
// 피해야 할 예
person.company!!.address!!.country
```

이런 경우 어디서 NPE 가 나는지 추적이 힘들기 때문

---

## 7.8 `let` 함수

- `let`은 널이 될 수 있는 값을 널이 아닌 값으로 다룰 때 유용함
- 근데 예전에 안드로이드 면접 썰 같은거 듣다보면 let은 널체크 하는 함수가 아니라고 했던 시절도 있었던 읍읍… 물론 의도는 수신객체 람다의 이점과 개념에 집중하라는 뜻이였을 거라고 추측..?
- 돌아와서 안전한 호출 연산자와 함께 사용되어 null 검사 후 람다로 값을 전달

```kotlin
fun sendEmailTo(email: String) { /*...*/ }

// 이 함수는 String 타입만 받기 때문에 nullable 값 전달 불가
fun main() {
    val email: String? = "foo@bar.com"
    sendEmailTo(email) // 컴파일 오류
    // ERROR: Type mismatch
}
```

### 일반적인 null 검사

```kotlin
if (email != null) sendEmailTo(email)
```

### `let`을 사용한 코드

```kotlin
email?.let { sendEmailTo(it) }
```

- `let` 함수는 수신 객체가 null이 아닌 경우에만 호출되며, `it`을 통해 내부에서 사용할 수 있음
- email이 null을 반환하면 `sendEmailTo`는 호출되지 않음

---

### (참고)코틀린의 영역 함수 비교

**with, apply, let, run, also** 등의 영역 함수는 모두 코드 블록을 특정 객체의 맥락에서 실행하는 함수

- 각 함수는 수신 객체를 어떻게 접근하고, 반환값이 무엇인지에 따라 사용 목적이 다름
- 이후 장에서 각각의 차이점과 사용 시기를 다룸

| 함수 | x를 참조하는 방식 | 반환 값 |
| --- | --- | --- |
| `x.let(...)` | `it` | 람다의 결과 |
| `x.also{...}` | `it` | `x` |
| `x.apply{...}` | `this` | `x` |
| `x.run(...)` | `this` | 람다의 결과 |
| `with(x){...}` | `this` | 람다의 결과 |

**각 영역 함수의 적합한 사용 사례:**

- **`let`**:
    - 객체가 `null`이 아닌 경우에만 코드 블록을 실행할 때 (안전한 호출 `?.`과 함께 사용).
    - 어떤 식의 결과를 변수에 담되 그 영역(scope)을 한정시키고 싶을 때 단독 사용.
- **`apply`**:
    - 빌더 스타일 API(예: 인스턴스 생성)를 사용해 객체 프로퍼티를 설정할 때.
- **`also`**:
    - 객체에 어떤 동작(부가 작업, 로깅 등)을 실행한 후, *원래의 객체*를 다른 연산에 사용하고 싶을 때.
- **`with`**:
    - 하나의 객체에 대해 이름을 반복하지 않고 여러 함수 호출(메소드 실행, 프로퍼티 접근 등)을 그룹으로 묶고 싶을 때.
- **`run`**:
    - 객체를 설정(초기화, 구성)한 다음에 *별도의 결과*를 반환하고 싶을 때. (객체 자체를 반환하지 않음)

## 7.9 직접 초기화하지 않는 널이 아닌 타입: 지연 초기화 프로퍼티 상세 설명임

객체 생성 시점에 값을 지정할 수 없지만 null이 될 수 없는 프로퍼티가 필요한 경우가 있음. 

예를 들어 안드로이드의 `onCreate`나 JUnit의 `@BeforeAll`처럼 클래스의 생명주기에 따라서 나중에 초기화되는 구조가 이에 해당함. 하지만 코틀린에서는 널이 아닌 프로퍼티는 생성자에서 반드시 초기화해야 하므로, 보통은 nullable 타입으로 선언하고 null로 초기화하게 됨

<aside>
⚠️

이 경우 접근 시마다 `?.` 또는 `!!`을 사용해야 하고, `!!`은 NPE를 유발할 수 있어 코드가 번거롭고 위험함.

</aside>

아래는 이러한 상황에서의 예시

### **널이 될 수 있는 타입을 사용한 초기화**

```kotlin
class MyService {
    fun performAction(): String = "Action Done!"
}

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class MyTest {
    // 널이 될 수 있는 타입으로 선언하고 null로 초기화함
    private var myService: MyService? = null

    @BeforeAll fun setup() {
        // setup 메서드에서 실제 값으로 초기화함
        myService = MyService()
    }

    @Test fun testAction() {
        // 접근 시 !! 단언이 필요함
        assertEquals("Action Done!", myService!!.performAction())
    }
}

```

위 코드는 `myService` 접근 시 `!!`가 필수적이어서 불편함

### **`lateinit` 프로퍼티 사용**

**해결책: `lateinit` 변경자를 이용한 지연 초기화**

이런 문제를 해결하기 위해 코틀린은 `lateinit` 변경자를 제공함. 프로퍼티 선언 앞에 `lateinit`을 붙이면, 생성자에서 초기화하지 않아도 됨

대신 개발자가 해당 프로퍼티가 사용되기 전에 반드시 초기화될 것임을 컴파일러에게 약속하는 것

```kotlin
class MyService {
    fun performAction(): String = "Action Done!"
}

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class MyTest {
    // lateinit으로 선언하여 생성자에서 초기화하지 않음
    private lateinit var myService: MyService

    @BeforeAll fun setup() {
        // setup 메서드에서 프로퍼티를 초기화함
        myService = MyService()
    }

    @Test fun testAction() {
        // null 검사나 단언 없이 직접 프로퍼티를 사용함
        assertEquals("Action Done!", myService.performAction())
    }
}
```

**`lateinit` 프로퍼티의 특징 및 제약 조건:**

1. **`var`만 가능:** `lateinit` 프로퍼티는 값을 나중에 할당해야 하므로, 변경 불가능한 `val` 프로퍼티에는 사용할 수 없음 (`val`은 final 필드로 컴파일되며 생성 시 초기화되어야 함)
2. **Non-null 타입만 가능:** `lateinit`은 널이 될 수 없는 타입에만 사용 가능함 (애초에 널 가능성 문제를 해결하기 위함임)
3. **생성자 초기화 불필요:** `lateinit`으로 선언된 프로퍼티는 생성자에서 초기화할 필요가 없음
4. **초기화 전 접근 시 예외 발생:** 만약 `lateinit` 프로퍼티가 초기화되기 전에 접근하면, `kotlin.UninitializedPropertyAccessException` 예외가 발생함. 이 예외는 어떤 프로퍼티가 초기화되지 않았는지 명확히 알려주므로, 원인 파악이 어려운 `NullPointerException`보다 디버깅에 훨씬 유용함

결론적으로, 생성자 시점에서 초기화할 수 없지만 결코 `null`이 되어서는 안 되는 프로퍼티가 있다면 `lateinit` 변경자를 사용하는 것이 좋음

### 참고

`lateinit` 프로퍼티는 구글 `Guice`와 같은 자바 DI 프레임워크에서 의존성 주입과 함께 사용하는 경우가 많음.

외부에서 값이 지정되기 때문에 클래스 생성 시점에는 초기화하지 않아도 됨

`lateinit` 프로퍼티가 `public`일 경우 코틀린은 해당 필드를 `public`으로 생성함.

> lateinit은 반드시 클래스의 멤버일 필요는 없음. 함수 본문 안의 지역 변수나 최상위 프로퍼티도 지연 초기화 가능함
> 

## 7.10 안전한 호출 연산자 없이 타입 확장: 널이 될 수 있는 타입에 대한 확장

널이 될 수 있는 타입에 대한 확장 함수를 정의하면 `null`값을 다루는 도구로 활용할 수 있음

어떤 메서드를 호출하기 전에 수신 객체 역할을 하는 변수가 null이 될 수 없다고 보장하는 대신, 메서드 호출을 수신 객체로 받고 내부에서 null을 처리하게 할 수 있음 (이런 처리는 확장 함수에서만 가능함)

```kotlin
fun verifyUserInput(input: String?) {
    if (input.isNullOrBlank()) {
        println("Please fill in the required fields")
    }
}

fun main() {
    verifyUserInput(" ")
    // Please fill in the required fields

    verifyUserInput(null)
    // Please fill in the required fields
}

```

안전한 호출 없이도 널이 될 수 있는 수신 객체 타입에 대해 선언된 확장 함수를 호출할 수 있음.

`isNullOrBlank` 함수는 수신 객체가 null이어도 예외가 발생하지 않음.

```kotlin
fun String?.isNullOrBlank(): Boolean =
    this == null || this.isBlank()
```

## 7.11 타입 파라미터의 널 가능성

코틀린에서 함수나 클래스의 모든 타입 파라미터는 기본적으로 null이 될 수 있으며 널이 될 수 없는 타입을 포함하는 어떤 타입이라도 타입 파라미터로 대체할 수 있음(? 잘 이해가 안감)

```kotlin
fun <T> printHashCode(t: T) {
    println(t?.hashCode())
}

fun main() {
    printHashCode(null)
    // null
}
```

위 예시에서 `T`는 `Any?`로 추론되며, `t`가 널이 될 수 있으므로 안전한 호출을 사용해야 함

> 솔직히 필자는 좀 부끄럽지만 T 가 Any? 인줄 몰라서 내용 보고 에이 거짓말 하고 테스트를 해봄 근데 진짜였음…
> 

![image.png](7%E1%84%8C%E1%85%A1%E1%86%BC%20%E1%84%8F%E1%85%A9%E1%84%90%E1%85%B3%E1%86%AF%E1%84%85%E1%85%B5%E1%86%AB%20%E1%84%8B%E1%85%B5%E1%86%AB%20%E1%84%8B%E1%85%A2%E1%86%A8%E1%84%89%E1%85%A7%E1%86%AB%202%E1%84%91%E1%85%A1%E1%86%AB%207%E1%84%8C%E1%85%A1%E1%86%BC%20-%20%E1%84%8F%E1%85%A5%E1%86%AF%E1%84%85%E1%85%A6%E1%86%A8%E1%84%89%E1%85%A7%E1%86%AB%E1%84%80%E1%85%AA%20%E1%84%89%201c6e94c78dc7803c8fa3f1a7572b661b/image.png)

### 타입 파라미터에 대해 널이 될 수 없는 상계를 사용하기

```kotlin
fun <T: Any> printHashCode(t: T) {
    println(t.hashCode())
}

fun main() {
    printHashCode(null) // 컴파일 오류 발생
    // Error: Type parameter bound for 'T' is not satisfied

    printHashCode(42)
    // 42의 해시코드 출력
}
```

타입 파라미터가 널이 아님을 확실히 하려면 널이 될 수 없는 타입 상계(upper bound)를 지정해야 함

이렇게 하면 컴파일 시점에 널이 될 수 있는 값을 거부하게 된다고함!

## 7.12 널 가능성과 자바

자바 코드에는 어노테이션으로 널이 될 수 있는지에 대한 정보가 포함될 수 있음. 예를 들어 `@Nullable String`, `@NotNull String`과 같은 어노테이션이 자바 쪽에 붙어 있으면, 코틀린은 이를 참고하여 `String?`, `String` 타입으로 인식함.

```
@Nullable + Type -> Type? (Kotlin)
@NotNull + Type -> Type (Kotlin)
```

이처럼 널 가능성 어노테이션이 있는 경우, 코틀린은 이를 통해 타입의 널 가능성을 명시적으로 추론할 수 있음. 하지만 어노테이션이 없는 경우, 코틀린은 해당 타입을 플랫폼 타입 (platform type)으로 간주함.

### 7.12.1 플랫폼 타입

플랫폼 타입은 코틀린이 자바 코드에서 널 관련 정보를 알 수 없어 널이 될 수 있는지 여부가 불명확한 타입임. 해당 타입은 널이 될 수 있는 타입이나 널이 될 수 없는 타입처럼 사용할 수 있으나, 실제로 널 값을 대입하면 런타임 예외가 발생할 수 있음.

자바에서 널 가능성을 명시하지 않은 클래스가 코틀린에 전달되면, 해당 타입은 플랫폼 타입으로 간주됨. 예를 들어 다음과 같은 자바 클래스가 있을 때:

```java
public class Person {
    private final String name;

    public Person(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }
}
```

코틀린에서는 `getName()`의 반환 타입이 `String`이지만, 이 타입이 널을 반환할 가능성이 있는지 알 수 없음. 따라서 컴파일러는 해당 값을 사용할 때 널 검사를 하지 않으며, 이로 인해 `NullPointerException`이 발생할 수 있음.

### null 검사 없이 자바 클래스 접근하기

```kotlin
fun yellAt(person: Person) {
    println(person.name.uppercase() + "!!!")
}

fun main() {
    yellAt(Person(null))
    // java.lang.NullPointerException: person.name must not be null
}

```

이러한 문제를 해결하기 위해 안전한 호출 연산자를 사용할 수 있음.

### null 검사를 통해 자바 클래스 접근하기

```kotlin
fun yellAtSafe(person: Person) {
    println((person.name ?: "Anyone").uppercase() + "!!!")
}

fun main() {
    yellAtSafe(Person(null))
    // ANYONE!!!
}
```

자바 API를 사용할 때는 널 가능성에 대한 어노테이션이 없기 때문에, 모든 반환값이 널이 아님을 보장할 수 없음. 따라서 문서나 구현 코드를 참고해 명시적으로 널 검사를 추가해야 함.

### 코틀린은 왜 플랫폼 타입을 도입했는가?

모든 자바 타입을 널이 될 수 있는 타입으로 간주하면 더 안전할 수 있으나, 실제로는 코드의 복잡성과 성능 저하가 발생함. 

예를 들어 `ArrayList<String>`을 코틀린에서 다룰 때, 내부 원소 접근 시마다 널 검사 및 캐스트를 수행하면 비용이 크고 코드가 복잡해짐.

코틀린 코드에서 플랫폼 타입을 명시적으로 선언할 수는 없음. 하지만 IDE나 컴파일러 오류 메시지를 통해 해당 타입이 플랫폼 타입임을 알 수 있음. 

예시) String!

```kotlin
val i: Int = person.name
// ERROR: Type mismatch: inferred type is String! but Int was expected
```

위와 같은 메시지를 통해 해당 타입이 플랫폼 타입임을 유추할 수 있음.

### 7.12.2 상속

자바 인터페이스나 클래스를 코틀린에서 구현할 때 널 가능성을 명확히 처리해야 함. 예를 들어 다음과 같은 자바 인터페이스가 있을 때

```java
interface StringProcessor {
    void process(String value);
}
```

코틀린에서는 다음 두 가지 방식 모두 허용함

```kotlin
class StringPrinter : StringProcessor {
    override fun process(value: String) {
        println(value)
    }
}

class NullableStringPrinter : StringProcessor {
    override fun process(value: String?) {
        if (value != null) {
            println(value)
        }
    }
}
```

자바 클래스나 인터페이스를 구현할 때 널 가능성을 신경 쓰지 않으면, 호출 시 `null`이 전달되었을 때 런타임 예외가 발생할 수 있음. 따라서 파라미터에 대해 널 허용 여부를 명확히 처리해야 함

한마디로 자바 → 코틀린 타입 사용 시 Null 처리는 개발자 역량이다. 라고 얘기함

## 요약

- 코틀린은 널이 될 수 있는 타입을 지원하며 `NullPointerException`을 컴파일 시점에 방지할 수 있음.
- 일반 타입은 물음표가 없으면 널이 될 수 없는 타입임.
- 플랫폼 타입은 자바에서 전달되며, 널 관련 정보가 없기 때문에 널이 될 수 있는지 알 수 없음.
- 안전한 호출(`?.`)을 사용하면 널 가능성이 있는 객체의 메서드를 호출하거나 프로퍼티에 접근할 수 있음.
- 엘비스 연산자(`?:`)를 사용하면 널일 경우 대체 값을 지정할 수 있음.
- 널 아님 단언(`!!`)은 해당 값이 널이 아님을 보장함.
- `let` 함수는 수신 객체가 널이 아닐 때만 블록을 실행하며, 안전한 호출과 함께 사용하면 널이 될 수 없는 타입처럼 다룰 수 있음.
- `as?` 연산자는 타입 캐스트 시 실패하면 `null`을 반환함.