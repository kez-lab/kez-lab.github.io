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

<br/>
<br/>

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
<br/>
<br/>
<br/>
