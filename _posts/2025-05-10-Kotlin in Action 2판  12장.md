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


### 12.1.1 어노테이션 적용

- 어노테이션은 선언 앞에 @기호와 함께 이름을 붙여 사용함  
- 함수, 클래스 등 다양한 선언에 적용 가능함
- 예시:
```kotlin
import kotlin.test.*
class MyTest {
    @Test
    fun testTrue() {
        assertTrue(1 + 1 == 2)
    }
}
```
- 대표적인 예시로 @Deprecated가 있으며,  
  더 이상 사용하지 않아야 하는 선언에 붙임  
- message, replaceWith, level 파라미터로 점진적 사용중단 가능함
```kotlin
@Deprecated("Use removeAt(index) instead.", ReplaceWith("removeAt(index)"))
fun remove(index: Int) { /* ... */ }
```
- 어노테이션의 인자는 원시 타입, 문자열, enum, 클래스 참조, 다른 어노테이션, 배열만 사용 가능함

### 12.1.2 어노테이션 타깃과 use-site target

- 코틀린 선언은 여러 Java 선언으로 변환되므로,  
  어노테이션이 어느 부분에 적용될지 명시해야 할 때가 있음
- use-site target을 @와 어노테이션명 사이에 target:을 붙여 지정함
- 대표적인 예: getter, setter, field, property, param 등
  
![image](https://github.com/user-attachments/assets/42292155-dc1c-42e6-8dd5-16db83f232c6)

```kotlin
@JvmName("performCalculation")
fun calculate(): Int = (2 + 2) - 1

class CertificateManager {
    @get:JvmName("obtainCertificate")
    @set:JvmName("putCertificate")
    var certificate: String = "-----BEGIN PRIVATE KEY-----"
}
```
- file target은 파일 최상단에 @file:JvmName 등으로 사용함
- 표현식에도 어노테이션 부여 가능함, 대표적으로 @Suppress 사용
```kotlin
fun test(list: List<*>) {
    @Suppress("UNCHECKED_CAST")
    val strings = list as List<String>
}
```


### 12.1.3 어노테이션을 이용한 JSON 직렬화 커스터마이징

- 어노테이션은 객체 직렬화 방식을 커스터마이징하는 데 자주 쓰임
- 대표적 예: @JsonExclude, @JsonName  
- @JsonExclude는 특정 프로퍼티를 직렬화/역직렬화에서 제외함  
- @JsonName은 JSON에서 사용할 키 이름을 바꿈
  
![image](https://github.com/user-attachments/assets/174b9406-22b2-4939-857c-998d0fb34d93)
  
```kotlin
data class Person(
    @JsonName("alias") val firstName: String,
    @JsonExclude val age: Int? = null
)
```


### 12.1.4 커스텀 어노테이션 선언

- 어노테이션 클래스는 annotation class 키워드로 선언함  
- 파라미터 없는 경우:
```kotlin
annotation class JsonExclude
```
- 파라미터 있는 경우(모두 val이어야 함):
```kotlin
annotation class JsonName(val name: String)
```
- 자바에서는 public @interface로 선언, 코틀린은 생성자 호출 방식임

### 12.1.5 메타어노테이션

- 어노테이션 클래스에도 또 다른 어노테이션을 붙일 수 있음  
- @Target은 적용 가능한 대상 지정
```kotlin
@Target(AnnotationTarget.PROPERTY)
annotation class JsonExclude
```
- 여러 대상 지정도 가능함
```kotlin
@Target(AnnotationTarget.CLASS, AnnotationTarget.METHOD)
```
- 커스텀 메타어노테이션은 AnnotationTarget.ANNOTATION_CLASS로 지정
- @Retention은 어노테이션 유지 범위 지정  
- 코틀린은 기본적으로 RUNTIME임

### 12.1.6 클래스 참조를 어노테이션 인자로 사용

- 클래스 타입을 어노테이션 파라미터로 받을 수 있음  
- 예: 인터페이스 프로퍼티의 실제 구현체를 지정할 때 사용
```kotlin
interface Company { val name: String }
data class CompanyImpl(override val name: String) : Company
data class Person(
    val name: String,
    @DeserializeInterface(CompanyImpl::class) val company: Company
)
annotation class DeserializeInterface(val targetClass: KClass<out Any>)
```
- out 키워드는 Any의 하위 클래스 참조를 허용함
  
![image](https://github.com/user-attachments/assets/db140db4-e1b1-4f87-887b-d9e28f6f6d1b)


### 12.1.7 제네릭 클래스를 어노테이션 인자로 사용

- 커스텀 직렬화기가 필요할 때 제네릭 타입의 클래스 참조를 어노테이션에 넘길 수 있음
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
- *를 사용해 제네릭 타입 전체를 허용함  


## 12.2 리플렉션(Reflection): 런타임에서 코틀린 객체 조사하기

### 12.2.1 코틀린 리플렉션 API: KClass, KCallable, KFunction, KProperty

- 리플렉션은 런타임에 객체의 속성/메서드에 동적으로 접근할 수 있게 해줌  
- 주로 kotlin.reflect, kotlin.reflect.full 패키지 API 사용함  
- 코틀린의 모든 개념(데이터 클래스, 널타입 등)에 접근 가능함  
- JVM의 모든 클래스(자바, 코틀린 등)에도 사용 가능함  
- 표준 Java 리플렉션(java.lang.reflect)도 같이 활용 가능함
- 안드로이드 등에서는 kotlin-reflect.jar를 별도 의존성에 추가해야 함

#### KClass 사용 예시

```kotlin
import kotlin.reflect.full.*

class Person(val name: String, val age: Int)

fun main() {
    val person = Person("Alice", 29)
    val kClass = person::class
    println(kClass.simpleName)  // Person
    kClass.memberProperties.forEach { println(it.name) }
    // age
    // name
}
```
- memberProperties는 클래스 및 슈퍼클래스의 모든 비확장 프로퍼티를 반환함

#### 주요 API
- KClass: 클래스 자체를 표현, ::class로 얻음
- members: 클래스의 모든 멤버를 KCallable 컬렉션으로 반환
- KCallable: 함수/프로퍼티의 슈퍼타입, call(vararg args: Any?) 메서드로 동적 호출 가능

#### KCallable, KFunction, KProperty 예시

```kotlin
fun foo(x: Int) = println(x)
fun main() {
    val kFunction = ::foo
    kFunction.call(42) // 42
}
```
- call은 인자 개수 맞지 않으면 런타임 예외 발생함

```kotlin
import kotlin.reflect.KFunction2
fun sum(x: Int, y: Int) = x + y
fun main() {
    val kFunction: KFunction2<Int, Int, Int> = ::sum
    println(kFunction.invoke(1, 2) + kFunction(3, 4)) // 10
}
```
- invoke는 타입 안전성이 보장됨, 인자 개수 불일치 시 컴파일 에러

#### 프로퍼티 리플렉션 예시

```kotlin
var counter = 0
fun main() {
    val kProperty = ::counter
    kProperty.setter.call(21)
    println(kProperty.get()) // 21
}
```
- KProperty0, KProperty1 등은 프로퍼티 참조용 타입임  
- 클래스 멤버 프로퍼티는 get 메서드에 객체를 인자로 받음

```kotlin
class Person(val name: String, val age: Int)
fun main() {
    val person = Person("Alice", 29)
    val memberProperty = Person::age
    println(memberProperty.get(person)) // 29
}
```
- KProperty1<Person, Int> 타입이므로, get(person) 형태임

- 로컬 변수에는 리플렉션 사용 불가함(::x 형태 지원 안 함)

- 그림 12.7: 리플렉션 인터페이스 계층 구조 참고

### 12.2.2 리플렉션을 이용한 객체 직렬화 구현

- 직렬화 함수는 객체를 받아 JSON 문자열을 반환함
```kotlin
fun serialize(obj: Any): String = buildString { serializeObject(obj) }
private fun StringBuilder.serializeObject(obj: Any) {
    val kClass = obj::class as KClass<Any>
    val properties = kClass.memberProperties
    properties.joinToStringBuilder(this, prefix = "{", postfix = "}") { prop ->
        serializeString(prop.name)
        append(": ")
        serializePropertyValue(prop.get(obj))
    }
}
```
- 각 프로퍼티를 반복문으로 순회하며 JSON 형태로 만듦  
- prop.get(obj)는 Any? 반환, 반복문이므로 타입 안전성은 보장 안 됨

#### 어노테이션 적용 예시 (JsonExclude, JsonName)

```kotlin
val properties = kClass.memberProperties
    .filter { it.findAnnotation<JsonExclude>() == null }
val jsonNameAnn = prop.findAnnotation<JsonName>()
val propName = jsonNameAnn?.name ?: prop.name
```
- @JsonExclude가 붙은 프로퍼티 제외  
- @JsonName이 있으면 해당 값, 없으면 원래 이름 사용

#### 단일 프로퍼티 직렬화

```kotlin
private fun StringBuilder.serializeProperty(
    prop: KProperty1<Any, *>, obj: Any
) {
    val jsonNameAnn = prop.findAnnotation<JsonName>()
    val propName = jsonNameAnn?.name ?: prop.name
    serializeString(propName)
    append(": ")
    serializePropertyValue(prop.get(obj))
}
```

#### 커스텀 serializer 지원

```kotlin
fun KProperty<*>.getSerializer(): ValueSerializer<Any?>? {
    val customSerializerAnn = findAnnotation<CustomSerializer>() ?: return null
    val serializerClass = customSerializerAnn.serializerClass
    val valueSerializer = serializerClass.objectInstance
        ?: serializerClass.createInstance()
    @Suppress("UNCHECKED_CAST")
    return valueSerializer as ValueSerializer<Any?>
}
```
- objectInstance: object(singleton)이면 인스턴스, 아니면 createInstance로 생성  
- getSerializer()?.toJsonValue(value)로 값 변환

### 12.2.4 JSON 파싱 및 객체 역직렬화

- 역직렬화는 JSON 문자열을 객체로 변환하는 과정임  
- 주요 단계: lexer(어휘 분석), parser(구문 분석), deserializer(객체 생성)
- 각 단계 역할  
    - lexer: 입력 문자열을 토큰 리스트로 변환  
    - parser: 토큰을 의미 단위(키-값, 객체, 배열 등)로 변환  
    - deserializer: 실제 코틀린 객체로 변환

#### JsonObject 인터페이스

```kotlin
interface JsonObject {
    fun setSimpleProperty(propertyName: String, value: Any?)
    fun createObject(propertyName: String): JsonObject
    fun createArray(propertyName: String): JsonObject
}
```
- parser가 객체/배열 발견 시 해당 메서드 호출함
- setSimpleProperty: 단순 값 할당  
- createObject/createArray: 중첩 객체/배열 생성 시 사용

- seed라는 빌더 역할의 객체가 실제 값들을 일시적으로 저장하며 생성함  
    - ObjectSeed: 단일 객체  
    - ObjectListSeed: 복합 객체 리스트  
    - ValueListSeed: 단순 값 리스트

#### Seed 인터페이스

```kotlin
interface Seed : JsonObject {
    fun spawn(): Any?
    fun createCompositeProperty(propertyName: String, isList: Boolean): JsonObject
    override fun createObject(propertyName: String) = createCompositeProperty(propertyName, false)
    override fun createArray(propertyName: String) = createCompositeProperty(propertyName, true)
}
```
- spawn: 빌더의 build와 유사, 최종 값 반환

#### 역직렬화 함수 예시

```kotlin
fun <T: Any> deserialize(json: Reader, targetClass: KClass<T>): T {
    val seed = ObjectSeed(targetClass, ClassInfoCache())
    Parser(json, seed).parse()
    return seed.spawn()
}
```
- ObjectSeed를 통해 객체의 상태와 값을 임시로 저장  
- 파싱이 끝나면 spawn으로 최종 객체 반환

#### ObjectSeed 구조

```kotlin
class ObjectSeed<out T: Any>(
    targetClass: KClass<T>,
    override val classInfoCache: ClassInfoCache
) : Seed {
    private val classInfo: ClassInfo<T> = classInfoCache[targetClass]
    private val valueArguments = mutableMapOf<KParameter, Any?>()
    private val seedArguments = mutableMapOf<KParameter, Seed>()
    private val arguments: Map<KParameter, Any?>
        get() = valueArguments + seedArguments.mapValues { it.value.spawn() }
    override fun setSimpleProperty(propertyName: String, value: Any?) {
        val param = classInfo.getConstructorParameter(propertyName)
        valueArguments[param] = classInfo.deserializeConstructorArgument(param, value)
    }
    override fun createCompositeProperty(propertyName: String, isList: Boolean): Seed {
        val param = classInfo.getConstructorParameter(propertyName)
        val deserializeAs = classInfo.getDeserializeClass(propertyName)?.starProjectedType
        val seed = createSeedForType(deserializeAs ?: param.type, isList)
        return seed.apply { seedArguments[param] = this }
    }
    override fun spawn(): T = classInfo.createInstance(arguments)
}
```
- valueArguments: 단순 값 매핑  
- seedArguments: 복합 값(객체/리스트) 매핑  
- arguments: 두 맵을 합쳐 최종 생성자 인자로 만듦

---

### 12.2.5 역직렬화의 마지막 단계: callBy와 객체 생성

- KCallable.callBy를 통해 생성자/함수 호출  
    - 인자가 누락된 경우, 기본값/nullable 타입이면 허용, 아니면 예외
    - Map<KParameter, Any?> 형태로 인자 전달

- 타입 변환은 ValueSerializer로 처리함

```kotlin
fun serializerForType(type: KType): ValueSerializer<out Any?>? =
    when (type) {
        typeOf<Byte>() -> ByteSerializer
        typeOf<Int>() -> IntSerializer
        typeOf<Boolean>() -> BooleanSerializer
        else -> null
    }
```
- BooleanSerializer 예시
```kotlin
object BooleanSerializer : ValueSerializer<Boolean> {
    override fun fromJsonValue(jsonValue: Any?): Boolean {
        if (jsonValue !is Boolean) throw JKidException("Boolean expected")
        return jsonValue
    }
    override fun toJsonValue(value: Boolean) = value
}
```

#### ClassInfoCache와 ClassInfo 구조

- ClassInfoCache는 클래스별로 리플렉션 결과(생성자, 파라미터, 어노테이션 등)를 캐싱함

```kotlin
class ClassInfoCache {
    private val cacheData = mutableMapOf<KClass<*>, ClassInfo<*>>()
    @Suppress("UNCHECKED_CAST")
    operator fun <T : Any> get(cls: KClass<T>): ClassInfo<T> =
        cacheData.getOrPut(cls) { ClassInfo(cls) } as ClassInfo<T>
}
```

- ClassInfo는 생성자, 파라미터-어노테이션 매핑, 커스텀 serializer 정보 등을 보관함

```kotlin
class ClassInfo<T : Any>(cls: KClass<T>) {
    private val constructor = cls.primaryConstructor!!
    private val jsonNameToParamMap = hashMapOf<String, KParameter>()
    private val paramToSerializerMap = hashMapOf<KParameter, ValueSerializer<out Any?>>()
    private val jsonNameToDeserializeClassMap = hashMapOf<String, KClass<out Any>?>()
    init { constructor.parameters.forEach { cacheDataForParameter(cls, it) } }
    fun getConstructorParameter(propertyName: String): KParameter = jsonNameToParam[propertyName]!!
    fun deserializeConstructorArgument(param: KParameter, value: Any?): Any? {
        val serializer = paramToSerializer[param]
        if (serializer != null) return serializer.fromJsonValue(value)
        validateArgumentType(param, value)
        return value
    }
    fun createInstance(arguments: Map<KParameter, Any?>): T {
        ensureAllParametersPresent(arguments)
        return constructor.callBy(arguments)
    }
}
```

- ensureAllParametersPresent로 필수 파라미터 누락시 예외 발생

---

## 12장 요약

- 어노테이션은 @MyAnnotation(params) 형태로 선언과 표현식 등 다양한 위치에 적용 가능함
- 어노테이션 인자는 원시값, 문자열, enum, 클래스 참조, 다른 어노테이션, 배열만 가능함
- use-site target(@get:JvmName 등)으로 적용 위치 제어 가능함
- annotation class로 어노테이션 선언, 파라미터는 모두 val
- 메타어노테이션(@Target, @Retention 등)으로 대상·유지 범위 등 지정
- 리플렉션 API로 객체의 메서드/프로퍼티를 런타임에 동적으로 조사, 호출 가능함
- ::class, ::foo 등으로 KClass/KFunction 인스턴스 획득
- KCallable.callBy로 기본값 지원 함수/생성자 호출 가능
- KProperty0/KProperty1 등은 get/set 메서드로 값 접근 및 변경 지원
- typeOf<T>()로 런타임 타입 정보(KType) 획득 가능함
