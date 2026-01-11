---
layout: post
title: "Kotlin in Action 2판 8장 기본 타입, 컬렉션, 배열"
description: "Kotlin의 기본 타입 시스템: 원시 타입, 컬렉션의 가변성과 불변성, 배열 처리"
date: 2025-04-06 12:00:00 +0900
categories:
    - Kotlin
tags:
    - Kotlin
    - Kotlin in Action
    - Type System
    - Collection
    - Array
---

# 8장 코틀린 인 액션 2판: 8장 - 기본 타입, 컬렉션, 배열

# Kotlin in Action 2판 정리 - 8장: 기본 타입, 컬렉션, 배열

---

## 8장에서 다루는 내용

- 원시 타입과 다른 기본 타입 및 자바 타입과의 관계
- 코틀린 컬렉션과 배열 및 이들의 널 가능성과 상호운용성

---

### 8.1 원시 타입과 기본 타입

코틀린은 Int, Boolean, Any 등의 **기본 타입**을 제공함.

자바와는 달리 원시 타입과 래퍼 타입을 구분하지 않으며, **원시 타입처럼 동작하면서도 객체처럼 다룰 수 있음**.

자바의 `int`, `boolean` 같은 원시 타입과 `Integer`, `Boolean` 같은 래퍼 타입의 구분 없이 사용 가능함.

코틀린은 내부적으로 필요에 따라 원시 타입 또는 래퍼 타입을 자동으로 선택함.

### 8.1.1 정수, 부동소수점 수, 문자, Boolean 값을 원시 타입으로 표현

```kotlin
val i: Int = 1
val list: List<Int> = listOf(1, 2, 3)
```

- `Int`는 정수 타입 중 하나이며, 컬렉션에 넣으면 필요한 경우 자동으로 래퍼 타입으로 처리됨
- `List<Int>`는 자바에서는 `Collection<Integer>`와 같음. 하지만 코틀린에서는 원시 타입과 래퍼 타입의 구분 없이 사용 가능함

```kotlin
fun showProgress(progress: Int) {
    val percent = progress.coerceIn(0, 100)
    println("We're $percent % done!")
}

fun main() {
    showProgress(146)
    // 출력: We're 100 % done!
}
```

- `coerceIn` 함수는 값이 특정 범위를 넘지 않도록 제한하는 표준 라이브러리 함수임.
- 자바에서는 `int`는 원시타입으로 메서드가 없지만 코틀린에서는 **원시 타입과 래퍼타입의 구분이 없기에 메서드를 호출할 수 있음**.

> 자바의 관점에서 보면 원시 타입은 메모리 효율성을 위해 별도로 구분되지만, 코틀린은 항상 객체처럼 다룰 수 있음.
> 

자바 원시타입에 해당하는 코틀린 타입 목록은 다음과 같음:

- **정수 타입**: Byte, Short, Int, Long
- **부동소수점 숫자 타입**: Float, Double
- **문자 타입**: Char
- **Boolean 타입**: Boolean

### 8.1.2 양수를 표현하기 위해 모든 비트 범위 사용: 부호 없는 숫자 타입

비트나 바이트 단위의 연산, 파일 I/O, 네트워크 등에서 **양수만 표현할 수 있는 부호 없는 타입이 필요**할 수 있음.

이런 경우를 위해 코틀린은 **JVM의 일반 원시 타입을 확장한 부호 없는 타입**을 제공함.

| 타입 | 크기 | 값 범위 |
| --- | --- | --- |
| UByte | 8비트 | 0 ~ 255 |
| UShort | 16비트 | 0 ~ 65535 |
| UInt | 32비트 | 0 ~ 2³² - 1 |
| ULong | 64비트 | 0 ~ 2⁶⁴ - 1 |
- 예를 들어 일반 `Int`는 약 -20억 ~ 20억 사이 값 표현 가능
- `UInt`는 0 ~ 약 40억 사이 값 표현 가능
- **부호 없는 숫자 타입**은 동일한 메모리를 사용하면서 **더 큰 양수 범위를 표현**할 수 있음.
- 필요할 때만 명시적으로 사용하고, 일반적인 경우에는 부호 있는 타입을 사용하는 것이 좋음.
- 함수의 인자가 양수 범위로 제한되어야 할 때, 부호 없는 정수를 사용하는 것도 고려할 수 있음.

### 8.1.3 널이 될 수 있는 기본 타입: Int?, Boolean? 등

코틀린의 기본 타입은 널 값을 허용하지 않음.

**널이 될 수 있는 타입**을 만들기 위해서는 **래퍼 타입**으로 처리해야 함.

따라서 `Int?`, `Boolean?` 등은 자바의 참조 타입으로 컴파일됨.

```kotlin
data class Person(val name: String, val age: Int? = null) {
    fun isOlderThan(other: Person): Boolean? {
        if (age == null || other.age == null)
            return null
        return age > other.age
    }
}

fun main() {
    println(Person("Sam", 35).isOlderThan(Person("Amy", 42)))
    // false
    println(Person("Sam", 35).isOlderThan(Person("Jane")))
    // null
}
```

- 코틀린에서 널 허용 타입을 사용하면 컴파일 시점에 **null 체크를 강제**할 수 있음.
- 자바의 primitive type인 `int`는 null을 가질 수 없기 때문에 `Int?`는 자바의 `Integer`로 컴파일되어 **널을 가질 수 있는 타입**으로 동작함.

> 제네릭 컬렉션의 타입 인자로 넘길 때는 래퍼 타입으로 처리되며, List<Int>는 자바에서 List<Integer>로 대응됨.
> 

### 8.1.4 수 변환

자바와 달리 코틀린은 **숫자 타입 간의 자동 변환을 허용하지 않음**.

따라서 타입이 다른 수를 대입하려면 **명시적으로 변환 함수 호출이 필요**함.

```kotlin
val i = 1
val l: Long = i  // Error: type mismatch
val l: Long = i.toLong()
```

- `toLong()` 함수를 사용해 명시적 변환을 수행해야 함.

> toByte(), toShort(), toChar() 등 모든 원시 타입(Int, Long 등)에 대해 쌍방향 변환 함수가 존재함
> 
> 
> (단, `Boolean`은 예외)
> 
- **더 넓은 범위로 변환**: `Int.toLong()`, `Short.toInt()` 등
- **더 좁은 범위로 변환**: `Long.toInt()` 등 일부 값이 잘릴 수 있음

코틀린은 **개발자의 혼란을 방지하기 위해 타입 변환은 항상 명시적으로** 수행하게 설계됨

**박스된 숫자 타입**을 비교할 때는 **참조값이 아닌 실제 값**을 비교해야 함

자바에서는 박스 타입을 비교할 때 `.equals()`를 사용해야 정확하며, 코틀린도 이를 따름

```kotlin
val x = 1
val list = listOf(1L, 2L, 3L)
x in list  // false

println(x.toLong() in listOf(1L, 2L, 3L))
// true
```

- `x`는 `Int`, 리스트는 `Long` 타입이므로 타입 불일치로 `false`
- 명시적으로 `toLong()`으로 변환하면 동일한 타입으로 비교되어 `true`

### 8.1.5 Any와 Any?: 코틀린 타입 계층의 뿌리

**Any**는 코틀린 타입 계층의 최상위 타입임.

자바의 `Object`와 유사하지만, `Any`는 **널 값을 포함하지 않음**.

널을 포함하는 값까지 담으려면 **Any?** 타입을 사용해야 함.

```kotlin
val answer: Any = 42
```

- `Any` 타입은 모든 원시 타입을 포함할 수 있으며, 원시 타입도 박싱(boxing)되어 저장됨.

> Any는 자바의 Object에 대응하며, 플랫폼에 따라 내부적으로 java.lang.Object로 컴파일됨.
> 
- `Any` 타입은 `toString()`, `equals()`, `hashCode()` 메서드를 기본 제공함.
- `wait()`, `notify()` 등 `java.lang.Object` 고유 메서드를 사용하려면 캐스팅이 필요함.

### 8.1.6 Unit 타입: 코틀린의 void

**Unit** 타입은 자바의 `void`와 유사한 기능을 하며, 반환값이 없는 함수를 표현할 때 사용됨.

```kotlin
fun f(): Unit {}

// 다음과 같이 반환 타입 생략 가능
fun f() { }
```

- 반환 타입을 명시하지 않으면 `Unit`으로 간주됨.
- `Unit`은 **단 하나의 인스턴스만 존재하는 객체**임.

제네릭 함수에서 반환 타입으로도 사용 가능함:

```kotlin
interface Processor<T> {
    fun process(): T
}

class NoResultProcessor : Processor {
    override fun process() { . . .}
}
```

- `process()`는 `Unit`을 반환하므로 `return` 없이도 OK
- `Unit`은 타입 인자로 사용할 수 있음

>자바에서는 반환값이 없는 함수에 void를 사용하지만, void는 타입이 아니므로 제네릭에서 사용할 수 없음. 
> 코틀린은 Unit을 정식 타입으로 정의하여 void보다 더 유연하게 사용할 수 있도록 설계됨.

### 8.1.7 Nothing 타입: 이 함수는 결코 반환되지 않는다

**Nothing** 타입은 값을 절대 반환하지 않는 함수에서 사용됨.

주로 **예외를 던지거나, 무한 루프처럼 끝나지 않는 함수**에 사용됨.

```kotlin
fun fail(message: String): Nothing {
    throw IllegalStateException(message)
}

fun main() {
    fail("Error occurred")
    // 예외 발생: IllegalStateException: Error occurred
}

```

- `Nothing`은 반환값이 없음을 명시적으로 표현하는 타입임.
- 어떤 값도 포함하지 않으며, **타입 파라미터로만 의미 있음**

```kotlin
val address = company.address ?: fail("No address")
println(address.city) // address는 여기서 NonNull Type
```

- `fail` 함수는 `Nothing`을 반환하므로 `?:` 엘비스 연산자에서 우측에 사용 가능
- 컴파일러는 `fail` 호출 시 그 이후 코드가 실행되지 않음을 알 수 있음

> Nothing 타입은 타입 시스템에서 분석 도구로도 유용하게 사용됨
> 

---

## 8.2 컬렉션과 배열

코틀린의 컬렉션은 자바 컬렉션을 기반으로 하되, **널 가능성과 읽기 전용 여부** 등을 명확하게 구분함.

### 8.2.1 널이 될 수 있는 값의 컬렉션과 널이 될 수 있는 컬렉션

- 컬렉션에 `null`을 넣을 수 있는지, 또는 컬렉션 자체가 `null`이 될 수 있는지를 구분해야 함.

```kotlin
fun readNumbers(text: String): List<Int?> {
    val result = mutableListOf<Int?>()
    for (line in text.lineSequence()) {
        val numberOrNull = line.toIntOrNull()
        result.add(numberOrNull)
    }
    return result
}
```

- `List<Int?>`는 널이 될 수 있는 값을 담는 리스트
- `toIntOrNull()`을 사용해 정수 변환에 실패하면 `null` 저장
- 입력 문자열이 정수로 변환 가능한 경우는 정수로 저장됨

> Int?를 요소로 가진 리스트는 각 요소가 널일 수 있음.
> 
> 
> 반면 `List<Int>?`는 컬렉션 전체가 널일 수 있음을 의미함.
> 

---

### 8.2.2 읽기 전용과 변경 가능한 컬렉션

코틀린에서는 **읽기 전용(read-only)** 컬렉션과 **변경 가능한(mutable)** 컬렉션을 명확히 구분함

- `Collection` 인터페이스는 읽기 전용
- `MutableCollection`은 `Collection`을 확장하며, **추가(add), 삭제(remove)** 등의 메서드를 포함

```kotlin
fun <T> copyElements(source: Collection<T>, target: MutableCollection<T>) {
    for (item in source) {
        target.add(item)
    }
}

fun main() {
    val source: Collection<Int> = arrayListOf(3, 5, 7)
    val target: MutableCollection<Int> = arrayListOf(1)
    copyElements(source, target)
    println(target) // [1, 3, 5, 7]
}

```

- 읽기 전용 컬렉션은 **크기 확인, 포함 여부 확인, 반복(iteration)** 만 가능
- 변경은 불가능하며, 변경이 필요한 경우 `MutableCollection` 사용

```kotlin
val source: Collection<Int> = arrayListOf(3, 5, 7) // 음 왜 listOf를 쓰지 않은건지??
val target: Collection<Int> = arrayListOf(1)
copyElements(source, target) // Error: target은 변경 가능한 타입이 아님
```

- 함수가 `MutableCollection`을 요구하므로 읽기 전용 타입은 전달 불가

> 읽기 전용 컬렉션을 기본으로 사용하고, 필요할 때만 변경 가능한 컬렉션을 사용하도록 권장됨

---

### 8.2.3 코틀린 컬렉션과 자바 컬렉션은 밀접히 연관됨

- 코틀린의 모든 컬렉션은 자바 컬렉션 인터페이스를 기반으로 구현됨
- 코틀린 컬렉션 타입을 자바로 넘기거나 받을 때 **변환 과정 없이 그대로 호환됨**

```
List<String> list = ...
MutableList<String> mutableList = ...
```

- 코틀린은 `List`, `MutableList` 등의 인터페이스를 통해 **읽기/쓰기 구분**
- 자바의 `ArrayList`, `HashSet` 등을 상속한 클래스들도 그대로 사용 가능함

```
Iterable
 └── Collection
      ├── List
      │    └── MutableList
      └── Set
           └── MutableSet
```

- `ArrayList`, `HashSet` 등의 자바 클래스는 `MutableList`, `MutableSet` 인터페이스를 구현함
- 코틀린은 이를 통해 자바와의 상호 운용성을 제공하면서도, **안전한 읽기/쓰기 구분**을 유지함

> 코틀린은 자바 컬렉션을 래핑하거나 복사하지 않고 직접 참조함
> 
> 
> 따라서 컬렉션 사용 시 어떤 인터페이스로 다루는지가 중요함
> 

---

### 8.2.4 자바에서 선언한 컬렉션은 코틀린에서 플랫폼 타입으로 보임

자바에서 정의한 타입은 **코틀린에서 플랫폼 타입**으로 인식되며, 해당 타입의 널 가능성이나 변경 가능성에 대한 정보가 없음.

따라서 코틀린 컴파일러는 그 타입을 **널이 될 수도 있고 아닐 수도 있는 타입**으로 취급함(양자 역학 느낌이 ㅋ.ㅋ)

코틀린에서는 다음과 같은 기준으로 자바 컬렉션의 처리 방식을 결정해야 함:

- 컬렉션이 **null이 될 수 있는가**
- 컬렉션의 **원소가 null이 될 수 있는가**
- 자바 메서드에서 **컬렉션을 변경할 수 있는가**

```java
// collectionUtils.java
public class CollectionUtils {
    public static List<String> uppercaseAll(List<String> items) {
        for (int i = 0; i < items.size(); i++) {
            items.set(i, items.get(i).toUpperCase());
        }
        return items;
    }
}

```

- 자바의 `List<String>`은 코틀린에서 **변경 가능한 리스트**로 인식될 수 있음
- `set` 호출을 통해 **리스트의 내용을 변경**함

```kotlin
// collections.kt
fun printInUppercase(list: List<String>) {
    println(CollectionUtils.uppercaseAll(list)) // 자바 메서드 호출
    println(list.first()) // 변경 여부 확인
}

fun main() {
    val list = listOf("a", "b", "c")
    printInUppercase(list)
}
// 출력 결과: [A, B, C], A

```

- `listOf`는 **읽기 전용 리스트**지만 자바 메서드를 통해 **내부가 변경될 수 있음**
- 이처럼 자바 메서드를 호출할 경우, **코틀린 타입 시스템에서 보장하는 불변성이 깨질 수 있음**

### 8.2.5 성능과 상호운용을 위해 객체의 배열이나 원시 타입의 배열 만들기

코틀린에서는 자바와의 상호운용성과 성능 최적화를 위해 **객체 배열**과 **원시 타입 배열**을 구분해서 다룸.

---

### 배열 사용하기

```kotlin
fun main(args: Array<String>) {
    for (i in args.indices) {
        println("Argument $i is: ${args[i]}")
    }
}
```

- `array.indices`는 배열의 인덱스 범위를 나타냄
- 인덱스를 통해 배열 원소에 접근함

#### 코틀린 배열 생성 방식

- `arrayOf(...)`: 인자로 받은 원소들로 배열 생성
- `arrayOfNulls(size)`: `null`로 초기화된 고정 크기 배열 생성
- `Array(size) { index -> ... }`: 람다로 원소 정의

---

### 문자로 이루어진 배열

```kotlin
val letters = Array<String>(26) { i -> ('a' + i).toString() }
println(letters.joinToString(""))
```

- `Array(size) { index -> ... }` 형태의 생성자 사용
- 인덱스를 기반으로 a~z 까지의 문자 문자열을 배열로 생성함

---

### 컬렉션을 배열로 변환하여 vararg에 전달

```kotlin
fun main() {
    val strings = listOf("a", "b", "c")
    println("%s/%s/%s".format(*strings.toTypedArray()))
}
```

- `toTypedArray()`로 List를 배열로 변환함
- 스프레드 연산자(*)는 배열의 원소를 펼쳐서 vararg 인자로 전달함

---

### 원시 타입 배열

코틀린은 자바와의 성능 호환성을 위해 **원시 타입 배열 클래스** 제공:

- `IntArray`, `ByteArray`, `CharArray`, `BooleanArray` 등
- 각 배열 클래스는 내부적으로 `int[]`, `char[]` 등으로 컴파일됨
- 박싱하지 않은 원시 타입의 배열이 필요할 경우를 위해 제공(성능상 이점 때문인가?! 궁금하네요)

```kotlin
val fiveZeros = IntArray(5)
val fiveZerosToo = intArrayOf(0, 0, 0, 0, 0)
```

- `IntArray(size)`는 0으로 초기화된 배열 생성
- `intArrayOf(...)`는 지정된 값으로 배열 생성

---

### 람다로 초기값 지정

```kotlin
fun main() {
    val squares = IntArray(5) { i -> (i + 1) * (i + 1) }
    println(squares.joinToString())
}
// 1, 4, 9, 16, 25
```

- 람다로 각 인덱스에 들어갈 값을 계산하여 배열 초기화 가능

---

### 배열 확장 함수

- 배열에도 컬렉션과 동일한 확장 함수 제공됨: `filter`, `map`, `forEach`, `joinToString`, `sum`, `average` 등

```kotlin
fun main(args: Array<String>) {
    args.forEachIndexed { index, element ->
        println("Argument $index is: $element")
    }
}
```

---

## 요약

- 기본적인 수를 포함하는 타입은 자바 원시 타입으로 컴파일됨
- 널이 될 수 있는 원시 타입은 박싱된 타입(참조형 타입)으로 처리됨
- **Any**는 모든 타입의 상위 타입이며 자바의 Object에 대응됨
- **Unit**은 void에 대응함
- **Nothing**은 함수가 정상적으로 끝나지 않음을 나타냄