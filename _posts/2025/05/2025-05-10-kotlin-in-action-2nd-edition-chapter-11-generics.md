---
layout: post
title: "Kotlin in Action 2판 11장 Generics"
description: "Kotlin 제네릭의 모든 것: 타입 파라미터, 변성(공변성/반공변성), 타입 소거, 실체화된 타입 파라미터"
date: 2025-05-10 12:00:00 +0900
categories:
    - Kotlin
tags:
    - Kotlin
    - Kotlin in Action
    - Generics
    - Variance
    - Reified
---

# Kotlin In Action 2판 정리 - 11장 Generics

Kotlin 제네릭은 “타입을 파라미터화”해 코드 중복을 줄이고 컴파일 시점에 타입 안전을 보장하는 기능

---

## 11.1 타입 인자를 받는 타입 만들기: 제네릭 타입 파라미터

### 11.1.1 제네릭 타입과 함께 동작하는 함수와 프로퍼티  
- **핵심 개념**  
  - 함수나 확장 프로퍼티도 `<T>`를 선언해 특정 타입에 한정되지 않고 여러 타입에 동작하도록 만들 수 있음  
  - 타입 파라미터 `T`는 함수의 매개변수 타입, 반환 타입, 확장 대상을 가리지 않고 사용할 수 있음  
- **왜 중요한가?**  
  - `List<String>`, `List<Int>` 각각에 대해 별도로 `slice`나 `filter`를 구현할 필요 없이 한 번에 처리  
- **동작 원리**  
  1. 선언부에서 `<T>`를 명시  
  2. 컴파일러는 호출 시점에 실제 타입으로 치환  
- **예시: `slice` 함수**  
  ```kotlin
  // List<T> 전체에서 indices 범위의 요소만 골라 새 List<T> 반환
  fun <T> List<T>.slice(indices: IntRange): List<T> {
      val result = mutableListOf<T>()
      for (i in indices) {
          result.add(this[i])
      }
      return result
  }

  // 호출 시
  val letters = ('a'..'z').toList()       // List<Char>
  println(letters.slice(0..2))            // ['a','b','c']
  println(letters.slice<Char>(10..13))    // ['k','l','m','n']
  ```
  - 호출 시 타입 인자는 컴파일러의 추론으로 인해 생략이 가능하다.

- **예시: 제네릭 확장 프로퍼티**  
  ```kotlin
  // List<T>에서 끝에서 두 번째 요소를 꺼내는 penultimate
  val <T> List<T>.penultimate: T
    get() = this[size - 2]

  println(listOf(1,2,3,4).penultimate) // 3
  ```
  - 일반 프로퍼티는 여러 타입의 값을 저장할 수 없기에 확장프로퍼티만 제네릭하게 만들 수 있다

---

### 11.1.2 제네릭 클래스를 홑화살괄호(꺽쇠) 구문으로 선언하기  
- **문법**  
  ```kotlin
  interface List<T> { 
      operator fun get(index: Int): T 
  }
  class Box<T>(var value: T)
  ```
  - 클래스나 인터페이스 뒤에 꺽쇠괄호를 붙이면 제네릭하게 만들기 가능

- **하위 클래스 구현**  
  1. **구체 타입 지정**  
      ```kotlin
      class StringList: List<String> {
          override fun get(index: Int): String = TODO()
      }
      ```
  2. **타입 파라미터 전달**  
      ```kotlin
      class ArrayList<T>: List<T> {
          override fun get(index: Int): T = TODO()
      }
      ```
      - 책에서는 ArrayList의 T와 List의 T는 다르다고 설명하는데 잘 이해가 가지 않음.
- “자신과 같은 타입”을 제약으로 사용  
    ```kotlin
    interface Comparable<T> { fun compareTo(other: T): Int }
    class String: Comparable<String> { override fun compareTo(o)= TODO() }
    ```
  - 이렇게 T에 자기 자신의 타입을 지정하면, 해당 타입끼리만 비교 연산이 가능

---

### 11.1.3 타입 파라미터 제약(Upper Bounds)  
- 확장 함수를 만들었을 때 특정 타입에서만 활용하도록 제한을 걸 필요성을 느끼는 경우가 있음 -> 대표적으로 sum() 함수
- 이러한 경우 타입 파라미터의 상계(upoer bound)로 지정하면 그 상계 타입이거나 상계타입의 하위 타입인 경ㅇ우에만 활용하도록 제약을 거는 것이 가능
- **Upper Bounds 지정**  
  - `<T : Number>` → `Number`나 하위 타입만 허용  
  - `<T : Comparable<T>>` → 비교 가능한 타입만 허용  
- **예시**  
  ```kotlin
  fun <T : Number> List<T>.sum(): T
  fun <T : Comparable<T>> max(a: T, b: T): T = if (a > b) a else b
  ```
  - 이 경우 sum과 max는 Number, Comparable 상계로 제약이 가능해짐
- **여러개의 제약(where 절)**  
  - 한 타입 파라미터에 둘 이상의 제약을 걸 때  
    ```kotlin
    fun <T> ensureTrailingPeriod(seq: T)
      where T : CharSequence, T : Appendable {
        if (!seq.endsWith('.')) {
          seq.append('.')
        } 
    }
    ```
  - `CharSequence`로 읽기, `Appendable`로 쓰기 모두 필요할 때 사용  
---

### 11.1.4 명시적으로 타입파라미터에 널 허용성을 명시해 nullable 타입 인자 제외시키기
- **문제**  
  - `<T>` 선언만 하면 Any? 를 상계로 정한다.
  - 따라서 nullable한 타입도 활용될 수 있으며 이는 곧 nullable 안전 체크 필요해짐

- **해결: 널 불가능 상한**  
  - `<T : Any>` → `T`는 non-nullable 타입만 허용  
    ```kotlin
    class Processor<T : Any> {
      fun process(value: T) { println(value.hashCode()) }
    }
    // Processor<String?> 은 컴파일 에러
    ```
- **자바와의 상호 운용**  
  - Java 에서 Nonull 한 파라미터와 Nullable한 파라미터를 동시에 다뤄야하는 경우도 있음
  - 사용 지점에서 `T & Any`로 nullable 제외 가능
    ```kotlin
    class KBox<T> : JBox<T> {
      override fun put(t: T & Any) { /* ... */ }
      override fun putIfNonNull(t: T) { /* ... */ }
    }
    ```
---

## 11.2 실행 시점 제네릭스 동작: 소거된 타입 파라미터와 실체화된 타입 파라미터

### 11.2.1 실행 시점 제네릭 클래스의 타입 정보를 찾을 때 한계  
  - JVM은 런타임에 제네릭 타입 인자정보가 지워짐 (Java, Kotlin 동일)
  - `List<String>`과 `List<Int>` 모두 내부적으로 `List` 하나로 동작  
- **타입 검사와 캐스팅 시**  
  - `is List<String>` 같은 실행 시 검사는 불가능 (`Cannot check for instance of erased type`)  
  - `as List<String>` 캐스트는 컴파일 시 “unchecked cast” 경고만 발생  

---

### 11.2.2 실체화된(reified) 타입 파라미터를 사용하는 함수 는 타입인자를 실행 전에 언급 가능
- **`inline` + `reified`**  
  - `inline` 함수로 만들고 `reified` 타입 파라미터를 활용 시 타입 파라미터의 타입 검사를 허용  
- **예시**  
  ```kotlin
  inline fun <reified T> isA(value: Any): Boolean = value is T
  println(isA<String>("abc")) // true
  println(isA<Int>("abc"))    // false
  ```
- 런타임에 타입 인자를 확인해야 할 때  
- 일반 함수에선 불가능, 반드시 `inline`이어야 함  
- inline에서만 가능한 이윤ㄴ 본문을 구현한 바이트 코드를 그 함수가 호출되는 모든 지접에 삽입하며, 이 때 reified를 통해 구체적인 클래스를 참조하는 바이트코드를 생성해 삽입할 수 있기 때문이다. 따라서 타입소거에 영향을 받지 않는다.

---

### 11.2.3 클래스 참조를 reified 타입으로 대신하여 java.lang.Class 파라미터 피하기 
- Java API(예: ServiceLoader.load, Android의 Intent 생성자)처럼 Class<T> 타입 인자를 요구할 때, 일반 함수 본문에선 T::class.java가 허용되지 않음.
- 따라서 `reified` 를 활용하여 T::class.java를 직접 넘길 수 있


1. **ServiceLoader 예제**  
   ```kotlin
   inline fun <reified T> loadService(): ServiceLoader<T> =
     ServiceLoader.load(T::class.java)

   // 사용
   val providers = loadService<MyService>()
   ```

2. **Android startActivity 간소화**  
   ```kotlin
   inline fun <reified T: Activity> Context.startActivity() {
     val intent = Intent(this, T::class.java)
     startActivity(intent)
   }

   // 호출
   startActivity<DetailActivity>()
   ```
- 근데 안드 개발자로서 실제로 이렇게 쓰면 Intent에 대한 커스텀 확장이 불가능하기에 저렇게 쓰지 않음.
---

### 11.2.4 reified 타입 파라미터가 있는 접근자 정의
- **확장 프로퍼티**에도 `inline`과 `reified`를 사용할 수 있음  
- **예제**: 객체 타입의 정규 이름(canonical name) 조회  
  ```kotlin
  inline val <reified T> T.canonicalName: String
    get() = T::class.java.canonicalName

  // 결과 출력
  println(1.canonicalName)            // "java.lang.Integer"
  ```

---


## 11.3 변성(Variance)은 제네릭과 타입 인자 사이 하위 타입 관계를 기술
- 변성이란 `List<String>` 과 `List<Any>` 같이 원래 타입이 같고 타입 인자가 다른 여러 타입이 어떤 관계가 있는지 설명하는 개념
- 좀 더 쉽게 말해 “`List<String>`이 `List<Any>`가 될 수 있을까?” 같은 물음에 답을 주는 개념

### 11.3.1 Variance 는 인자를 함수에 넘겨도 안전한지 판단하게 해준다  
- **문제 상황**  
  ```kotlin
  fun printContents(list: List<Any>) {
    println(list.joinToString())
  }
  printContents(listOf("a", "b"))    // OK
  ```
  - 읽기만 할 때는 `List<String>`을 `List<Any>`로 전달해도 안전  
  ```kotlin
  fun addAnswer(list: MutableList<Any>) {
    list.add(42)
  }
  addAnswer(mutableListOf("a","b"))  // 컴파일러 금지
  ```
  - 변경(쓰기)이 개입되면 `MutableList<String>`에 `Int`를 넣을 수 있어서는 안 됨  
- 즉 함수가 받는 제네릭 타입은 “읽기/쓰기 가능성”에 따라 하위 타입 관계를 허용하거나 차단해야 함  

---

### 11.3.2 클래스·타입·하위 타입 기본 개념  
- **타입 vs 클래스**  
  - 클래스(`String`)는 이름 그대로 타입을 선언할 수 있지만 하나로도 `String` vs `String?` 두 가지 타입이 존재한다는 점에서 타입과는 
- **하위 타입(subtype)**  
  - 제네릭에서 타입 사이의 관계를 노하기 위해서는 하위 타입이라는 개념을 잘 알아야 함
  - B가 A가 필요한 곳에 문제 없이 쓰이면 B는 A의 하위 타입  
  - 예: `Int` <: `Number`, `String` <: `Any`  
  - `MutableList<A>`와 `MutableList<B>`는 A와 B의 관계와 무관하게 별개의 타입인데 이를 무공변(`invariant`) 이라고 함
  - `List<A>`, `List<B>`가 있을 때 A가 B의 하위 타입이면 List도 이 관계를 따라감 이를 공변적(`covariant`) 이라고 함

---

### 11.3.3 공변성(Covariance)  
- A가 B의 하위 타입이면 `Container<A>`와 `Container<B>`에서도 동일한 관계가 유지되는 것을 공변성이라고 함
- 공변적이라는 것을 표현하기 위해 타입 파라미터 앞에 `out` 키워드를 추가함
  ```kotlin
  interface Producer<out T> {
    fun produce(): T
  }

  interface List<out T> : Collection<T> {
    operator fun get(index: Int): T
    // 쓰기 메서드(add) 없음 → 안전하게 out-only
  }
  ```
- **예시**  
  ```kotlin
  fun feedAll(animals: Producer<Animal>) {
    for (i in 0 until /*...*/) {
      animals.produce().feed()
    }
  }
  val cats: Producer<Cat> = /*...*/
  feedAll(cats)  // Producer<Cat> <: Producer<Animal>
  ```

- 공변적 파라미터는 항상 out에 위치해야함을 유의
- 즉 클래스가 T타입 값의 생성은 가능하나 소비는 불가능
- private 생성자는 in, out 어디에도 포함되지 않는다
---

### 11.3.4 반공변성(Contravariance)  
- **정의**: A가 B의 하위타입이면 `Consumer<B>`는 `Consumer<A>`의 하위 타입으로 관계 뒤집힘  
- 반공변적이라는 것은 타입 파라미터 앞에 `in` 키워드를 통해 표시 
  ```kotlin
  interface Consumer<in T> {
    fun consume(item: T)
  }

  interface Comparator<in T> {
    fun compare(a: T, b: T): Int
  }
  ```
- **예시**  
  ```kotlin
  val animalComparator: Comparator<Animal> = Comparator { a,b -> a.weight - b.weight }
  val apples = listOf(Apple(...))
  println(apples.sortedWith(animalComparator))
  // Comparator<Animal> <: Comparator<Apple>
  ```
- 공변과 반대로 소비 시점에서만 T 타입 값을 활용
---

### 11.3.5 사용 지점 변성(Use-site Variance)  
- 클래스를 선언하면서 변성을 지정하는 것을 선언 지점 변성이라고 함
- 자바에서는 타입 파라미터가 있는 타입을 사용 시 그 파라미터를 어떤 타입으로 대치할 수 있는지 명시해야 하는 것을  **사용 지점 변성** 이라고 함.

이러한 사용 지점 변성 코틀린에서는 주로 Java의 와일드카드(`? extends`, `? super`)에 대응할 때 쓰임

### out 프로젝션: 읽기 전용

```kotlin
fun <T> copyReadOnly(
  source: MutableList<out T>,  // 읽기 전용
  dest: MutableList<T>         // 쓰기 가능
) {
  for (item in source) {
    dest.add(item)             // OK
  }
  // source.add(...) 컴파일 오류
}
```

- `MutableList<out T>`: 이 자리에서는 **꺼내기(get)**만 허용  
- `source`가 `MutableList<Int>`여도 `T`를 `Int`→`Any`처럼 안전하게 다룰 수 있음

---

### in 프로젝션: 쓰기 전용

```kotlin
fun <T> copyWriteOnly(
  source: MutableList<T>,      // 읽기·쓰기 모두 가능
  dest: MutableList<in T>      // 쓰기 전용
) {
  for (item in source) {
    dest.add(item)             // OK
  }
  // val x: T = dest[0] set은 불가, 반환 타입은 Any?
}
```

- `MutableList<in T>`: 이 자리에서는 **넣기(add)**만 허용  
- `dest`가 `MutableList<Any>`여도 `String`→`Any` 안전하게 저장 가능
