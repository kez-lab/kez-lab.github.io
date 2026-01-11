---
layout: post
title: "Kotlin in Action 2판 12장 어노테이션과 리플렉션"
description: "Kotlin 어노테이션과 리플렉션: 커스텀 어노테이션 선언, 메타어노테이션, 런타임 리플렉션 API"
date: 2025-05-17 12:00:00 +0900
categories:
    - Kotlin
tags:
    - Kotlin
    - Kotlin in Action
    - Annotation
    - Reflection
    - Meta-Annotation
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

# 12.2 리플렉션: 런타임에서 코틀린 객체 내부 들여다보기

- 리플렉션은 객체의 프로퍼티와 메서드가 무엇인지 런타임에 동적으로 접근할 수 있는 방법
- 컴파일 시점에 어떤 타입의 객체를 다룰지 알 수 없는 경우(예: JSON 직렬화 라이브러리가 모든 타입의 객체를 처리해야 할 때)에 필요
- 대표적 활용은 직렬화/역직렬화, 의존성 주입(DI) 프레임워크, ORM, 테스트 라이브러리 등

> **중요**: 코틀린 리플렉션 API는 기본 의존성에 포함되어 있지 않음. 사용하려면 별도로 `kotlin-reflect` 라이브러리를 의존성에 추가해야 함.
> ```kotlin
> // Gradle에 추가
> implementation("org.jetbrains.kotlin:kotlin-reflect")
> ```

---

## 12.2.1 코틀린 리플렉션 API: KClass, KCallable, KFunction, KProperty

### KClass: 클래스 정보 동적 접근

- KClass는 코틀린 클래스의 메타정보(이름, 프로퍼티 목록, 생성자 등)에 접근할 수 있는 인터페이스
- 객체에서 클래스 정보는 `obj::class`로, 클래스 자체는 `MyClass::class`로 얻을 수 있음

```kotlin
import kotlin.reflect.full.*

class Person(val name: String, val age: Int)

val person = Person("Alice", 29)
val kClass = person::class
println(kClass.simpleName)                // Person
kClass.memberProperties.forEach { println(it.name) } // name, age
```

- `person::class`로 런타임 타입의 KClass를 얻음
- `simpleName`은 클래스 이름을 반환함
- `memberProperties`는 클래스와 상위 클래스의 확장 프로퍼티를 제외한 모든 프로퍼티를 포함함

> **참고**: `simpleName`과 `qualifiedName` 프로퍼티는 익명 객체의 경우 null이 될 수 있음

---

### KFunction, KCallable: 함수/메서드 동적 참조와 호출

- 클래스의 모든 멤버 목록인 members가 KCallable 인스
턴스의 컬렉션
- KCallable은 KFunction 및 KProperty의 공통 상위 타입으로, `call()` 메서드 제공

```kotlin
fun foo(x: Int) = println(x)
val kFunction = ::foo
kFunction.call(42)    // 42
```

- `::foo`는 foo 함수의 참조인 KFunction 객체
- `call(42)`로 foo 함수에 42를 전달해 호출함
- 파라미터 개수가 맞지 않으면 런타임 예외 발생함

```kotlin
fun sum(x: Int, y: Int) = x + y
val kFunction = ::sum
kFunction.call(1, 2)      // 3 반환
println(kFunction.invoke(1, 2)) // 3 반환
println(kFunction(3, 4))  // 7 반환
```

- **KFunctionN 인터페이스**: 
    - 코틀린은 함수가 가지는 파라미터의 개수에 따라 특별한 인터페이스들을 제공(KFunction1, KFunction2, KFunctionN  등 N이 파라미터 숫자임)
    - 인터페이스는 컴파일러가 생성하는 합성 타입(synthetic compiler-generated types)임
    - 이를 통해 정해진 개수의 파라미터와 정확한 타입을 갖는 invoke 메서드를 제공 가능
- **call vs invoke**: call은 타입 안전하지 않고, invoke는 컴파일 타임에 타입 체크가 이루어져 더 안전함

---

### KProperty: 프로퍼티 동적 접근

- KProperty/KMutableProperty로 클래스 프로퍼티의 getter/setter에 동적으로 접근 가능함
- 프로퍼티 종류에 따라 다른 인터페이스 사용:
  - 최상위 프로퍼티: KProperty0(읽기), KMutableProperty0(읽기/쓰기)
  - 멤버 프로퍼티: KProperty1(읽기), KMutableProperty1(읽기/쓰기)

```kotlin
var counter = 0
val kProperty = ::counter  // KMutableProperty0<Int> 타입
kProperty.setter.call(21)
println(kProperty.get()) // 21
```

- `::counter`로 최상위 프로퍼티 참조를 얻음
- `setter.call(21)`로 counter 값을 21로 변경함
- `get()`으로 현재 값을 가져와 출력함

```kotlin
class Person(val name: String, val age: Int)
val memberProperty = Person::age
val person = Person("Alice", 29)
println(memberProperty.get(person)) // 29 출력
```

- Person::age는 Person 클래스 age 프로퍼티 참조임  

---

## 12.2.2 리플렉션을 이용한 객체 직렬화 구현

- 리플렉션을 사용하면 타입을 미리 알지 못해도 객체의 모든 프로퍼티를 순회하여 JSON 등으로 직렬화 가능함

```kotlin
private fun StringBuilder.serializeObject(obj: Any) {
    val kClass = obj::class as KClass<Any>
    val result = kClass.memberProperties.joinToString(
        separator = ", ", 
        prefix = "{", 
        postfix = "}"
    ) { prop ->
        "\"${prop.name}\": ${serializePropertyValue(prop.get(obj))}"
    }
}
```

- 객체의 런타임 타입에서 KClass를 얻음
- `memberProperties`로 프로퍼티를 순회함
- `joinToString`은 모든 프로퍼티를 JSON 형식으로 조합함
- 프로퍼티 타입이나 개수를 미리 알지 못해도 동적으로 변환 가능함

---

## 12.2.3 어노테이션을 통한 직렬화 커스터마이징

- 직렬화 정책을 클래스 내부 어노테이션으로 선언해 유연하게 커스터마이즈 가능함

```kotlin
annotation class JsonExclude
annotation class JsonName(val name: String)

data class Person(
    @JsonName("alias") val name: String,
    @JsonExclude val password: String
)
```

- `@JsonName("alias")`는 직렬화 시 key를 "alias"로 사용하도록 지정함
- `@JsonExclude`는 해당 프로퍼티를 직렬화 대상에서 제외함

```kotlin
val properties = kClass.memberProperties
    .filter { it.findAnnotation<JsonExclude>() == null }

val jsonNameAnn = prop.findAnnotation<JsonName>()
val propName = jsonNameAnn?.name ?: prop.name
```

- `findAnnotation<T>()`은 특정 타입의 어노테이션을 찾아 반환함
- jsonNameAnn이 없다면 기본 `prop.name` 반환
- 이러한 리플렉션 매커니즘으로 어노테이션 활용 극대화 가능

---

## 12.2.4 JSON 파싱과 객체 역직렬화

- 리플렉션은 JSON → 객체 역직렬화에도 활용됨
- JSON 문자열 처리 과정:
  1. **렉서(Lexer)**: 입력된 JSON 문자열을 의미 있는 최소 단위인 **토큰(Token)**으로 분리
  2. **파서(Parser)**: 렉서가 생성한 토큰 목록을 기반으로 JSON의 **구조(Syntax)**를 이해하고, 이를 트리와 같은 구조화된 데이터로 변환
  3. **역직렬화**: 구조화된 데이터를 기반으로 최종적으로 코틀린 객체를 생성

```kotlin
// 타입 파라미터를 런타임에 유지하기 위해 reified와 inline 사용
inline fun <reified T: Any> deserialize(json: String): T {
    val reader = StringReader(json)
    val seed = ObjectSeed(T::class, ClassInfoCache())
    Parser(reader, seed).parse()
    return seed.spawn() as T
}

// 사용 예시
data class Author(val name: String)
data class Book(val title: String, val author: Author)

val json = """{"title": "Kotlin in Action", "author": {"name": "Dmitry"}}"""
val book = deserialize<Book>(json)  // Book(title=Kotlin in Action, author=Author(name=Dmitry))

// ObjectSeed 코드는 생략
```

- 역질렬화 과정에서 리플렉션의 활용:
    - 클래스 정보 접근: T::class는 KClass<T> 인스턴스를 반환하여 Book이나 Author와 같은 클래스의 메타데이터에 접근할 수 있게 함.
    - 생성자 및 파라미터 정보 획득: KClass.primaryConstructor를 통해 클래스의 주 생성자를 얻고 KFunction.parameters로 해당 주 생성자의 모든 파라미터를 얻을 수 있음 -> 이를 통해 JSON 키와 코틀린 프로퍼티/생성자 파라미터 간의 매핑을 동적으로 찾아내는 데 사용
    - 프로퍼티 타입 동적 분석: KClass.memberProperties를 사용하여 클래스 프로퍼티의 타입(KType)을 분석하고 중첩 객체를 어떤 타입으로 역직렬화해야 할지 결정
    - 객체 인스턴스 동적 생성: KFunction.callBy(arguments)로 생성자의 파라미터와 그에 해당하는 값들을 맵 형태로 전달하여 코드에서 직접 생성자를 호출하는 대신 런타임에 동적으로 객체 인스턴스를 생성할 수 있게 함(12.2.5 추가 설명)

---

## 12.2.5 역직렬화의 마지막 단계: callBy()와 리플렉션을 이용한 객체 생성

- KFunction의 `callBy(Map<KParameter, Any?>)`는 생성자나 함수를 호출할 때, 인자들을 순서대로 나열하는 대신 KParameter와 그에 해당하는 값(Any?)의 맵 형태로 전달
- 따라서 `callBy(Map<KParameter, Any?>)` 는 아래와 같은 특징들로 JSON 파싱 과정에서 데이터를 유연하게 수집하는 데 큰 이점을 가짐
    - 기본값 지원: JSON 데이터에 특정 필드가 누락되어 있더라도 파라미터가 **기본값(default value)**을 가지고 있다면, 자동으로 그 기본값을 사용
    - nullability 지원 : nullable type으로 선언되어 있고 JSON에 해당 필드가 없다면 기본적으로 null을 해당 파라미터의 값으로 사용
    - 인자 순서 비의존성: 인자를 이름(파라미터 객체)으로 매핑하기 때문에 인자 순서와 상관없이 객체 생성 가능

```kotlin
data class User(val name: String, val age: Int = 0, val email: String? = null)

// KFunction<User> 타입의 생성자 참조 얻기
val constructor = User::class.primaryConstructor!!

// 필수 파라미터만 제공하기
val user1 = constructor.callBy(mapOf(
    constructor.parameters[0] to "Alice"
))  // User(name="Alice", age=0, email=null)

// 모든 파라미터 제공하기
val user2 = constructor.callBy(mapOf(
    constructor.parameters[0] to "Bob",
    constructor.parameters[1] to 25,
    constructor.parameters[2] to "bob@example.com"
))  // User(name="Bob", age=25, email="bob@example.com")
```

---

# 결론

- 코틀린 리플렉션은 런타임에 객체와 클래스 정보를 동적으로 탐색하고 조작하는 기능을 제공
- **KClass**를 통해 클래스 정보를 얻고, KProperty 및 KFunction 인터페이스를 통해 프로퍼티와 함수에 접근
- KFunction 및 KProperty 인터페이스는 모두 제네릭 call 메서드를 제공하는 KCallable을 확장
- get (프로퍼티 값 접근), call (일반적인 동적 호출), invoke (타입 안전한 함수 호출), callBy (기본값 지원 생성자/함수 호출) 등의 메서드를 사용하여 동적으로 값을 가져오거나 코드를 실행할 수 있음
- KAnnotatedElement 및 findAnnotation 함수를 통해 어노테이션 정보를 읽어 동적인 동작을 제어할 수 있음
- KType의 런타임 표현을 얻으려면 typeOf<>() 함수를 사용

