---
layout: post
title: "Kotlin in Action 2판 12장 어노테이션과 리플렉션"
date: 2025-05-10 12:00:00 +0900
categories: [Kotlin, Kotlin In Action 2, 코틀린 인 액션 2판]
tags: Kotlin in Action 2판 12장 어노테이션과 리플렉션
author: admin
---

# 12장 어노테이션과 리플렉션

- **이 장에서 다루는 주제**
    - 어노테이션을 선언하고 적용하는 방법
    - 커스텀 어노테이션과 메타어노테이션의 구조와 활용
    - 선언에 메타데이터를 추가해 런타임/컴파일러/IDE/외부 도구에서 정보로 활용하는 방법
    - 리플렉션(reflection)을 통해 런타임에 클래스·프로퍼티·함수·어노테이션 정보를 동적으로 조회 및 조작하는 방법
    - 어노테이션과 리플렉션을 활용한 실전 프로젝트 예시(직렬화/역직렬화)

# 12.1 어노테이션(Annotation)

### 개요  
- 어노테이션은 클래스, 함수, 프로퍼티 선언에 붙여서 컴파일러, IDE, 빌드 도구, 런타임에서 활용할 수 있는 부가 정보를 추가하는 기능
- 실제 코드의 동작을 바꾸지 않지만, 다양한 메타데이터를 코드에 심을 수 있어서 API 정책, 코드 사용 방법, 도구와의 연동, 런타임 동작 등을 세밀하게 조절하는 데 쓰임.

---

### 12.1.1 어노테이션 적용하기  
- 코틀린에서 어노테이션은 선언 앞에 `@어노테이션명` 형태로 붙임.  
- 클래스, 함수, 변수, 프로퍼티 등 모든 선언에 사용할 수 있음.  
- 예를 들어, `@Test`를 붙이면 테스트 함수로 인식됨.  
- 자주 쓰는 `@Deprecated` 어노테이션은 함수나 클래스가 더 이상 사용되지 않거나, 다른 대체 API로 바뀌었음을 알릴 때 사용하며,  아래와 같은 옵션을 지정할 수 있음.  
    - `message`: 사용 중단 이유  
    - `replaceWith`: 대체 함수(IDE에서 자동 치환)  
    - `level`: 경고/오류/숨김

```kotlin
@Deprecated("Use removeAt(index) instead.", ReplaceWith("removeAt(index)"))
fun remove(index: Int) { /* ... */ }
```
- IDE는 @Deprecated가 붙은 함수 사용 시 자동으로 대체 API로 바꿔주는 퀵픽스를 제공하는 것 처럼 어노테이션을 통해 유지보수의 용이성을 높일 수 있음을 알 수 있음.

#### 어노테이션 문법을 지정하는 문법은 자바와 약간 다름
- 클래스 지정: 클래스명 뒤에 ::class 붙임
    → @MyAnnotation(MyClass::class)

- 다른 애노테이션 인자: @ 기호 생략
    → @Deprecated(..., ReplaceWith("..."))에서 ReplaceWith는 @ 없이 사용

- 배열 인자: 대괄호([]) 사용 또는 arrayOf() 함수
    → @RequestMapping(path = ["/foo", "/bar"])

#### 어노테이션 인자는 컴파일 타임에 알아야한다
```kotlin
const val TEST_TIMEOUT = 10L
@Test
@Timeout(TEST_TIMEOUT)
fun testMethod() { /* ... */ }
```
- 어노테이션 인자는 반드시 컴파일 타임에 알 수 있는 상수이어야 하며, 따라서 const val만 허용됨.  

---

### 12.1.2 어노테이션 타깃과 use-site target  
- 코틀린 선언은 바이트코드로 변환될 때 여러 자바 요소로 쪼개짐(자바에서 필드, getter, setter 등 여러 요소로 만들어짐), 따라서 어노테이션이 실제로 어디에 적용되는지 명확히 지정할 필요가 있음. 
- 이 때 use-site target(@get:, @set:, @field: 등)을 명시해서 적용 대상을 지정할 수 있음.  
![image](https://github.com/user-attachments/assets/42292155-dc1c-42e6-8dd5-16db83f232c6)

```kotlin
@get:JvmName("obtainCertificate")
@set:JvmName("putCertificate")
var certificate: String = ""
```
- property, field, get, set, param, setparam, delegate, file 등 다양한 타깃이 있음.  
- 파일 전체에 적용하려면 @file: 어노테이션을 파일 최상단에 위치시킴.  
```kotlin
@file:JvmName("StringFunctions")
```
- 또, 표현식에도 어노테이션을 붙일 수 있어 특정 컴파일 경고만 억제할 수도 있음.  
```kotlin
@Suppress("UNCHECKED_CAST")
val strings = list as List<String>
```

#### 자바 API를 어노테이션으로 제어
- 코틀린은 자바 연동을 위해 @JvmName, @JvmStatic, @JvmOverloads, @JvmField 등 다양한 JVM 관련 어노테이션도 지원함.
- 관련 링크: https://kotlinlang.org/api/core/kotlin-stdlib/kotlin.jvm/#

---

### 12.1.3 어노테이션을 활용한 JSON 직렬화 커스터마이즈  
- 어노테이션을 적용한 고전적인 예제는 객체 직렬화 제어(직렬화란 객체를 텍스트나 이진형식으로 저장하고 이를 기반으로 다시 객체를 생성하는 과정)
- JSON 직렬화에서 객체의 특정 프로퍼티를 제외하거나, JSON의 key 이름을 변경하고 싶을 때 어노테이션을 활용함.
- 이 장에서는 Jkid 라는 라이브러리를 기반으로 설명함
![image](https://github.com/user-attachments/assets/174b9406-22b2-4939-857c-998d0fb34d93)

#### Jkid 라이브러리  예시
```kotlin
data class Person(
    @JsonName("alias") val firstName: String,
    @JsonExclude val age: Int? = null
)
```
- @JsonName("alias")는 firstName 프로퍼티가 JSON에 alias라는 키로 저장
- @JsonExclude는 age 프로퍼티를 직렬화/역직렬화에서 제외함.  
- 기본값이 없는 프로퍼티에 @JsonExclude를 쓰면 역직렬화 시 Person 인스턴스를 생성할 수 없으니 주의해야 함.

---

### 12.1.4 어노테이션 선언  
- Jkid를 예제로 어노테이션은 직접 선언하는 방법을 살펴본다.

#### 파라미터가 없는 경우(JsonExclude)
```kotlin
annotation class JsonExclude
```
- annotation 변경자를 class 앞에 붙여 어노테이션을 선언
- 어노테이션 클래스는 선언이나 식과 관련있는 메타데이터의 구조만 정의하기에 내부에 코드를 못넣게 막음
  
#### 파라미터가 있는 경우:  
```kotlin
annotation class JsonName(val name: String)
```
- 파라메터가 있는 경우 주 생성자 구문을 사용하며, 파라미터는 모두 val이어야 함. 

#### 자바 어노테이션과의 비교
자바의 value 메서드는 특별 취급되어, 어노테이션 적용 시 value 외의 속성만 이름을 명시하면 됨

- 다만 코틀린은 일반 생성자 호출처럼 애노테이션을 적용하므로, 이름을 명시할 수도 있고 생략할 수도 있음
- @JsonName(name = "first_name")과 @JsonName("first_name")은 동일
- 단, 자바에서 선언된 어노테이션을 코틀린에서 쓸 때는 value만 생략 가능, 나머지는 이름 명시 필요


---

### 12.1.5 메타어노테이션  
- 어노테이션 선언에 또 다른 어노테이션을 붙일 수 있는데, 이를 메타어노테이션이라 부름.  
- 가장 흔히 쓰이는 @Target은 어노테이션을 적용할 수 있는 대상을 지정함.  

```kotlin
@Target(AnnotationTarget.PROPERTY)
annotation class JsonExclude
```
- AnnotationTarget에는 클래스, 함수, 프로퍼티, 타입 등 다양한 값이 있음.  
- 여러 대상을 동시에 지정할 수도 있음.  
```kotlin
@Target(AnnotationTarget.CLASS, AnnotationTarget.FUNCTION)
```
- 어노테이션을 어노테이션 클래스에만 적용하려면 AnnotationTarget.ANNOTATION_CLASS를 쓸 수 있음.
- 필요하다면 여러개의 타깃을 한번에 선언 가능
- 타깃을 PROPERTY로 지정한 어노테이션의 경우 자바와 연동하려면 AnnotationTarget.FIELD 를 두 번째 타깃으로 추가해야 함

#### @Retention 어노테이션
@Retention은 어노테이션의 유지 범위를 지정하며, 코틀린은 기본적으로 RUNTIME이므로 별도 지정 없이 런타임에 리플렉션으로 어노테이션을 읽을 수 있음.

---

### 12.1.6 클래스 참조를 어노테이션 파라미터로 사용  
- 어노테이션 파라미터로 클래스 참조를 넘길 수 있음.  
- 예를 들어, 역직렬화(@Deserialization) 시 어떤 구현 클래스를 쓸지 지정하고 싶을 때  KClass<out Any> 타입 파라미터를 선언하고 ::class로 전달함.


```kotlin
interface Company { val name: String }
data class CompanyImpl(override val name: String) : Company

data class Person(
    val name: String,
    @DeserializeInterface(CompanyImpl::class) val company: Company
)
```

#### 클래스 참조 어노테이션 정의 방법

```
annotation class DeserializeInterface(val targetClass: KClass<out Any>)
```
- KClass를 통해 클래스 참조를 인자로 받기 가능
- out 키워드를 통해 해당 타입의 하위 타입 또한 참조 가능

![image](https://github.com/user-attachments/assets/db140db4-e1b1-4f87-887b-d9e28f6f6d1b)


---

### 12.1.7 제네릭 클래스를 어노테이션 파라미터로 사용  
- Jkid에서 타입별 커스텀 직렬화를 지원하기 위해 제네릭 클래스를 어노테이션 파라메터로 사용 

```kotlin
interface ValueSerializer<T> {
    fun toJsonValue(value: T): Any?
    fun fromJsonValue(jsonValue: Any?): T
}
annotation class CustomSerializer(
    val serializerClass: KClass<out ValueSerializer<*>>
)
data class Person(
    val name: String,
    @CustomSerializer(DateSerializer::class) val birthDate: Date
)
```
- 예제처럼 KClass<out ValueSerializer<*>> 타입을 선언하면 특정 타입의 직렬화 클래스를 ::class로 넘길 수 있음.
- 잘못된 타입을 넘기면 컴파일 타임에 에러가 발생함.

---
