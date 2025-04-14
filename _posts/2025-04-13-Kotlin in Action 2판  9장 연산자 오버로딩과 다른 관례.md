---
layout: post
title: "Kotlin in Action 2판 9장 연산자 오버로딩과 다른 관례"
date: 2025-04-13 12:00:00 +0900
categories: [Kotlin, Kotlin In Action 2, 코틀린 인 액션 2판]
tags: Kotlin in Action 2판 9장 연산자 오버로딩과 다른 관례
author: admin

---
## 9장 연산자 오버로딩과 다른 관례

코틀린에는 **사용자가 정의한 함수**를 언어 기능이 호출하는 **관례(convention)** 가 있는데 이를 통해 특정 이름을 가진 함수의 존재만으로 언어 기능을 사용할 수 있음

9 장에서 다루는 내용

- **연산자 오버로딩**  
- **관례 함수 이름과 동작 원리**  
- **위임 프로퍼티(Delegated Property)**  

---

## 9.1 산술 연산자를 오버로드해서 임의의 클래스에 대한 연산을 더 편리하게 만들기

코틀린에서는 **관례(convention)** 에 따라 특정 이름의 함수를 정의하면, 해당 함수를 연산자처럼 사용할 수 있음. 자바에서는 기본 타입에 대해서만 산술 연산이 가능하지만, 코틀린은 **사용자 정의 클래스에도 산술 연산자를 오버로드**할 수 있음.

대표적인 예제로 `Point` 클래스를 사용하여 `+`, `*` 연산을 구현함.

---

### 9.1.1 plus, times, div 등: 이항 산술 연산 오버로딩

#### 리스트 9.1 `plus` 연산자 구현하기

```kotlin
data class Point(val x: Int, val y: Int) {
    operator fun plus(other: Point): Point {
        return Point(x + other.x, y + other.y)
    }
}
```

- `+` 연산자를 `plus` 함수로 오버로딩한 예제임  
- 반드시 **`operator` 키워드**를 붙여야 관례에 따른 연산자 오버로딩이 가능함  
- 내부적으로 `a + b` 는 `a.plus(b)` 로 변환되어 호출됨

```kotlin
fun main() {
    val p1 = Point(10, 20)
    val p2 = Point(30, 40)
    println(p1 + p2) // Point(x=40, y=60)
}
```

---

#### `plus` 연산자 확장 함수로 정의하기

```kotlin
operator fun Point.plus(other: Point): Point {
    return Point(x + other.x, y + other.y)
}
```

- 클래스 내부가 아닌 **외부 확장 함수**로도 연산자 오버로딩이 가능함  
- 관례에 따라 메서드 이름을 정의하면, 해당 연산자 문법을 사용할 수 있음  
- **직접 작성한 클래스에도 확장 함수 방식으로 연산자 오버로딩을 적용**할 수 있음

---

#### 두 피연산자의 타입이 다른 연산자 정의하기

```kotlin
operator fun Point.times(scale: Double): Point {
    return Point((x * scale).toInt(), (y * scale).toInt())
}
```

```kotlin
fun main() {
    val p = Point(10, 20)
    println(p * 1.5) // Point(x=15, y=30)
}
```

- `Point` 와 `Double` 간의 곱셈을 오버로딩한 예제임  
- **두 피연산자의 타입이 달라도 연산자 오버로딩 가능**함  
- 단, `1.5 * p` 같은 **교환법칙은 자동으로 지원되지 않음**, 별도로 정의해야 함

---
### 9.1.2 연산을 적용한 다음에 그 결과를 바로 대입: 복합 대입 연산자 오버로딩

`plus`와 같은 연산자를 오버로딩하면, 코틀린은 `+`뿐 아니라 **복합 대입 연산자 `+=`도 자동 지원**함. 이를 **복합 대입(compound assignment)** 연산자라고 함.

```kotlin
fun main() {
    var point = Point(1, 2)
    point += Point(3, 4)
    println(point) // Point(x=4, y=6)
}
```

- `plusAssign` 함수를 오버로딩하면 `+=` 연산자가 해당 함수로 번역됨  

---

`+=` 연산은 `plus` 또는 `plusAssign` 중 하나로 컴파일됨  
두 함수 모두 정의되어 있는 경우 **컴파일 오류 발생**

```kotlin
a += b  
// → a = a + b  또는  
// → a.plusAssign(b)
```

> 불변 객체에는 `plus`, 변경 가능한 객체에는 `plusAssign`을 사용하는 것이 일관된 설계임

---

### 9.1.3 피연산자가 1개뿐인 연산자: 단항 연산자 오버로딩

**단항 연산자(unary operator)** 도 이항 연산자와 마찬가지로  
`operator` 키워드와 미리 정해진 함수 이름을 사용하여 오버로딩 가능함

#### 단항 산술 연산자 정의하기

```kotlin
operator fun Point.unaryMinus(): Point {
    return Point(-x, -y)
}

fun main() {
    val p = Point(10, 20)
    println(-p) // Point(x=-10, y=-20)
}
```
- `-p` → `p.unaryMinus()` 로 변환됨  


#### 표 9.2 오버로딩할 수 있는 단항 연산자

| 식          | 함수 이름      |
|-------------|----------------|
| `+a`        | `unaryPlus()`  |
| `-a`        | `unaryMinus()` |
| `!a`        | `not()`        |
| `++a`, `a++`| `inc()`        |
| `--a`, `a--`| `dec()`        |

---

#### 증가 연산자 정의하기

```kotlin
import java.math.BigDecimal

operator fun BigDecimal.inc() = this + BigDecimal.ONE

fun main() {
    var bd = BigDecimal.ZERO
    println(bd++) // 0
    println(bd)   // 1
    println(++bd) // 2
}
```

- `++` 연산자도 `inc()` 함수로 오버로딩 가능  
- 후위, 전위 증가 매커니즘 제공
- 자바와 동일한 의미를 제공함
---

## 9.2 비교 연산자를 오버로딩해서 객체들 사이의 관계를 쉽게 검사

코틀린에서는 `==`, `!=`, `<`, `>`, `<=`, `>=` 등 **비교 연산자도 오버로딩이 가능**함.  
내부적으로는 `equals`, `compareTo` 함수를 호출하며, **관례 기반 오버로딩 원칙이 동일하게 적용**됨.

---

### 9.2.1 동등성 연산자: equals

`==` 연산자는 내부적으로 `equals` 호출로 컴파일됨.  
`!=` 연산자도 마찬가지로 `equals` 호출 후 결과를 반전시켜 사용함.

```kotlin
a == b  →  a?.equals(b) ?: (b == null)
```

> 🔍 **두 피연산자 중 하나가 null일 경우에도 안전하게 동작**하도록 변환됨

---

#### equals 메서드 구현하기

```kotlin
class Point(val x: Int, val y: Int) {
    override fun equals(obj: Any?): Boolean {
        if (obj === this) return true
        if (obj !is Point) return false
        return obj.x == x && obj.y == y
    }
}

fun main() {
    println(Point(10, 20) == Point(10, 20)) // true
    println(Point(10, 20) != Point(5, 5))   // true
    println(null == Point(1, 2))            // false
}
```

- `===` 는 **참조 동등성**, `==` 는 **구조 동등성** 비교임  
- `equals`는 `Any`에 정의된 함수이므로 `override` 키워드가 필요함  
- `operator` 키워드는 생략 가능 (상위 클래스에 정의되어 있으므로 자동 상속됨)  
- **확장 함수로 equals를 정의할 수 없음** — 항상 멤버 함수여야 함 (Any로 상속받은 equals가 우선순위가 높기 떄뮨)

---

### 9.2.2 순서 연산자: compareTo (<, >, <=, >=)

코틀린은 자바의 `Comparable` 인터페이스를 그대로 사용함
`<`, `>`, `<=`, `>=` 연산자는 내부적으로 `compareTo` 호출로 변환됨

#### compareTo 메서드 구현하기

```kotlin
class Person(
    val firstName: String,
    val lastName: String
) : Comparable<Person> {
    override fun compareTo(other: Person): Int {
        return compareValuesBy(this, other, Person::lastName, Person::firstName)
    }
}

fun main() {
    val p1 = Person("Alice", "Smith")
    val p2 = Person("Bob", "Johnson")
    println(p1 < p2) // false
}
```

- `compareValuesBy` 함수는 **여러 기준을 순서대로 비교**할 수 있도록 도와줌  
- 0과 비교하는 코드로 컴파일됨 -> `a >= b | a.compareTo(b) >= b`

---

## 9.3 컬렉션과 범위에 대해 쓸 수 있는 관례

컬렉션이나 범위에 대해 사용하는 여러 연산자도 **특정 함수 이름의 관례를 따름**.  
대표적으로 `[]`, `in`, `..`, `for` 루프 등이 있으며, 이 연산자들을 사용할 수 있도록  
**get, set, contains, rangeTo, iterator** 등의 함수를 오버로딩할 수 있음.

---

### 9.3.1 인덱스로 원소 접근: get과 set

`[]` 연산자를 사용해 값을 읽거나 쓸 수 있음.  
`get` 함수는 값을 읽을 때, `set` 함수는 값을 쓸 때 호출됨.

#### get 구현하기

```kotlin
operator fun Point.get(index: Int): Int {
    return when (index) {
        0 -> x
        1 -> y
        else -> throw IndexOutOfBoundsException("Invalid coordinate $index")
    }
}

fun main() {
    val p = Point(10, 20)
    println(p[1]) // 20
}
```

- `get(index)` 함수 정의로 `p[1]` 같은 인덱스 접근이 가능해짐  
- 즉 대충 코드 봤을 때 알다시피 이런 느낌으로 get 구현 가능

---

#### set 구현하기

```kotlin
data class MutablePoint(var x: Int, var y: Int)

operator fun MutablePoint.set(index: Int, value: Int) {
    when (index) {
        0 -> x = value
        1 -> y = value
        else -> throw IndexOutOfBoundsException("Invalid coordinate $index")
    }
}

fun main() {
    val p = MutablePoint(10, 20)
    p[1] = 42
    println(p) // MutablePoint(x=10, y=42)
}
```

- `set(index, value)` 함수 정의로 `p[1] = 42` 처럼 대입 가능함  
- 대입식 `x[a] = b`는 내부적으로 `x.set(a, b)`로 변환됨

---

### 9.3.2 어떤 객체가 컬렉션에 들어있는지 검사: in 관례

`in` 연산자를 사용해 **객체가 컬렉션이나 범위에 포함되는지 검사**할 수 있음.  
이는 내부적으로 `contains` 함수 호출로 변환됨.

#### contains 구현하기

```kotlin
data class Rectangle(val upperLeft: Point, val lowerRight: Point)

operator fun Rectangle.contains(p: Point): Boolean {
    return p.x in upperLeft.x..<lowerRight.x &&
           p.y in upperLeft.y..<lowerRight.y
}

fun main() {
    val rect = Rectangle(Point(10, 20), Point(50, 50))
    println(Point(20, 30) in rect) // true
    println(Point(5, 5) in rect)   // false
}
```

---

### 9.3.3 객체로부터 범위 만들기: rangeTo와 rangeUntil 관례

`..` 연산자를 사용하면 내부적으로 `rangeTo` 함수 호출로 변환됨.  
이는 `Comparable` 인터페이스를 기반으로 동작함.

```kotlin
val start = LocalDate.now()
val end = start.plusDays(10)
val vacation = start..end  // start.rangeTo(end)
println(LocalDate.now().plusWeeks(1) in vacation) // true

```

- `rangeTo`는 `ClosedRange<T>` 타입의 범위를 반환함  
- `rangeTo`는 다른 연산자보다 우선순위가 낮기 때문에 괄호 사용 권장임

---

## 9.4 component 함수를 사용해 구조 분해 선언 제공

구조 분해 선언은 여러 값을 한 번에 변수로 분해해 할당하는 문법임.  
코틀린에서는 이 기능도 **관례에 기반**하며, `componentN()` 함수를 호출하는 방식으로 동작함.

```kotlin
val p = Point(10, 20)
val (x, y) = p
println(x) // 10
println(y) // 20
```

위 코드는 다음과 같이 컴파일됨:

```kotlin
val x = p.component1()
val y = p.component2()
```

---

### 구조 분해 선언을 위한 componentN 함수

- **data class** 는 `component1`, `component2` 등의 함수를 자동으로 생성함  
- 일반 클래스에서는 직접 정의해야 함

```kotlin
class Point(val x: Int, val y: Int) {
    operator fun component1() = x
    operator fun component2() = y
}
```

- 함수 앞에는 반드시 **`operator` 키워드**가 필요함

---

### 리스트 9.14 구조 분해 선언을 사용해 여러 값 반환하기

```kotlin
data class NameComponents(val name: String, val extension: String)

fun splitFilename(fullName: String): NameComponents {
    val result = fullName.split('.', limit = 2)
    return NameComponents(result[0], result[1])
}

fun main() {
    val (name, ext) = splitFilename("example.kt")
    println(name) // example
    println(ext)  // kt
}
```

- 구조 분해 선언은 **함수 반환값을 명확하게 분리해서 처리**할 때 유용함  
- `Pair`, `Triple` 등을 사용해도 되지만, **의미 있는 데이터 클래스를 사용하는 것이 더 표현력이 좋음**

---

### 컬렉션에 대해 구조 분해 선언 사용하기

```kotlin
fun splitFilename(fullName: String): NameComponents {
    val (name, extension) = fullName.split('.', limit = 2)
    return NameComponents(name, extension)
}
```

- **List**, **Array** 등에도 `componentN` 함수가 정의되어 있어 구조 분해 선언 사용 가능함  
- 코틀린 표준 라이브러리는 **최대 5개까지의 component 함수**를 제공함 (필자는 처음 안 사실)

---

## 9.4.1 구조 분해 선언과 루프
### 구조 분해 선언을 사용해 맵 이터레이션하기

```kotlin
fun printEntries(map: Map<String, String>) {
    for ((key, value) in map) {
        println("$key -> $value")
    }
}

fun main() {
    val map = mapOf("Oracle" to "Java", "JetBrains" to "Kotlin")
    printEntries(map)
    // Oracle -> Java
    // JetBrains -> Kotlin
}
```

---

## 9.4.2 문자를 사용해 구조 분해 값 무시

구조 분해 선언에서 **일부 값이 필요 없을 때는 `_`(언더스코어)** 를 사용하여 무시할 수 있음.

```kotlin
data class Person(
    val firstName: String,
    val lastName: String,
    val age: Int,
    val city: String,
)

fun introducePerson(p: Person) {
    val (firstName, _, age) = p
    println("This is $firstName, aged $age.")
}
```

- 필요하지 않은 값은 `_`에 대입하면 컴파일러가 무시함  
- 변수 이름은 중요하지 않고, 순서에 따라 `componentN` 함수가 호출됨

---

### 구조 분해 선언의 한계

- **위치 기반 매핑**이기 때문에, 변수 이름은 의미가 없고 **순서가 중요함**  
- 데이터 클래스의 프로퍼티 순서가 바뀌면 **기존 구조 분해 코드가 잘못 작동할 수 있음**

```kotlin
val (firstName, lastName, age, city) = p
```

- 위 선언은 내부적으로 `component1`, `component2`, `component3`, `component4` 호출로 변환됨  
- 구조 분해는 **작은 컨테이너 클래스에 국한해서 사용하는 것이 안전**함
- 이러한 문제를 막기 위해 이름 기반 구조 분해 선언이 업데이트 될 수 있다는 점이 책에도 나와있었음

> 🔍 즉 복잡한 엔티티에서는 구조 분해 사용을 지양하는 것이 좋음

---
## 9.5 프로퍼티 접근자 로직 재활용: 위임 프로퍼티

**위임 프로퍼티(delegated property)** 는 프로퍼티의 getter/setter 로직을 **위임 객체(delegate object)** 에 위임함.  
이를 통해 데이터 저장 위치(예: DB, 세션, 맵 등)를 바꾸거나, 부가 로직(검증, 알림 등)을 쉽게 붙일 수 있음.

---

### 9.5.1 위임 프로퍼티의 기본 문법과 내부 동작

```kotlin
var p: Type by Delegate()
```

- `Delegate` 객체는 **`getValue`**, **`setValue`** 함수를 구현해야 함  
- 컴파일러는 감춰진 delegate 필드를 생성하고, 이를 통해 접근자 로직을 위임함

```kotlin
class Delegate {
    operator fun getValue(thisRef: Any?, property: KProperty<*>): Type { ... }
    operator fun setValue(thisRef: Any?, property: KProperty<*>, value: Type) { ... }
}
```

- 선택적으로 `provideDelegate` 함수도 구현 가능  
- 모든 위임 메서드에는 **`operator` 키워드**가 필요함

---

### 9.5.2 위임 프로퍼티 사용: by lazy()를 사용한 지연 초기화

#### lazy 함수 사용

```kotlin
class Person(val name: String) {
    val emails by lazy { loadEmails(this) }
}
```

- `lazy`는 첫 접근 시 한 번만 초기화되는 값을 반환하는 **스레드 안전 위임 객체** 

---

### 9.5.3 위임 프로퍼티 구현

예시는 너무 길어서 Observable 정의 같은 부분은 생략

#### 프로퍼티 변경 통지를 클래스로 구현

```kotlin
class ObservableProperty(var propValue: Int, val observable: Observable) {
    operator fun getValue(thisRef: Any?, prop: KProperty<*>) = propValue

    operator fun setValue(thisRef: Any?, prop: KProperty<*>, newValue: Int) {
        val oldValue = propValue
        propValue = newValue
        observable.notifyObservers(prop.name, oldValue, newValue)
    }
}
```

#### 위임 적용

```kotlin
class Person(val name: String, age: Int, salary: Int): Observable() {
    var age by ObservableProperty(age, this)
    var salary by ObservableProperty(salary, this)
}
```

- 컴파일러가 getter/setter 내부에 **`getValue`**, **`setValue`** 호출 코드를 생성해줌  
- 중복된 notify 로직 제거 가능

---

#### 표준 라이브러리 사용: Delegates.observable

표준 라이브러리를 사용하면 옵저버블한 변수 로직을 작성하지 않아도 됨

```kotlin
import kotlin.properties.Delegates

class Person(val name: String, age: Int, salary: Int): Observable() {
    private val onChange = { prop: KProperty<*>, old: Any?, new: Any? ->
        notifyObservers(prop.name, old, new)
    }

    var age by Delegates.observable(age, onChange)
    var salary by Delegates.observable(salary, onChange)
}
```

- `Delegates.observable` 함수는 변경 시 호출될 람다를 인자로 받음

---

### 9.5.4 위임 프로퍼티는 커스텀 접근자가 있는 감춰진 프로퍼티로 변환된다

```kotlin
class C {
    var prop: Type by MyDelegate()
}
```

- 위 코드는 다음처럼 컴파일됨:

```kotlin
class C {
    private val <delegate> = MyDelegate()

    var prop: Type
        get() = <delegate>.getValue(this, <property>)
        set(value) = <delegate>.setValue(this, <property>, value)
}
```

- `<delegate>`는 숨겨진 필드  
- `<property>`는 `KProperty` 객체로 컴파일 타임에 자동 생성됨

---

### 9.5.5 맵에 위임해서 동적으로 애트리뷰트 접근

동적으로 정의되는 속성을 맵에 저장하면서도 정적 프로퍼티처럼 사용할 수 있음

#### 맵을 사용하는 프로퍼티 위임 예제

```kotlin
class Person {
    private val _attributes = mutableMapOf<String, String>()

    fun setAttribute(attrName: String, value: String) {
        _attributes[attrName] = value
    }

    val name: String by _attributes
}
```

- `name` 프로퍼티는 내부적으로 `_attributes["name"]` 을 사용해 값을 읽음  
- **`getValue`/`setValue` 확장 함수**가 Map, MutableMap 인터페이스에 대해 정의되어 있기에 위임 가능

---

### 9.5.6 실전 프레임워크가 위임 프로퍼티를 활용하는 방법

책에서 예시로 든 **Exposed** 라는 ORM 프레임워크에서는 데이터베이스 테이블과 엔티티 간의 매핑을 위임을 통해 간결하게 구현함.

#### 위임 프로퍼티를 사용한 데이터베이스 칼럼 접근

```kotlin
object Users : IdTable() {
    val name: Column<String> = varchar("name", 50).index()
    val age: Column<Int> = integer("age")
}

class User(id: EntityID) : Entity(id) {
    var name: String by Users.name
    var age: Int by Users.age
}
```

- `Users`는 싱글턴 객체이며 DB 테이블에 해당함  
- `User`는 `Entity`를 상속하며, 각 프로퍼티는 `Users` 객체의 컬럼을 위임 받음  
- `Column<T>` 클래스는 `getValue` / `setValue` 함수를 통해 위임 관례를 구현함

```kotlin
operator fun <T> Column<T>.getValue(o: Entity, desc: KProperty<*>): T {
    // DB에서 값 읽기
}

operator fun <T> Column<T>.setValue(o: Entity, desc: KProperty<*>, value: T) {
    // DB에 값 쓰기
}
```

---

## 9장 요약

- **연산자 오버로딩**: `plus`, `times`, `compareTo`, `equals` 등 연산자 대응 함수 정의로 사용자 정의 타입에서도 연산자 사용 가능
- **비교 연산자**: `==` → `equals`, `<` → `compareTo` 로 컴파일됨
- **컬렉션 관례**: `get`, `set`, `contains` 정의 시 `[]`, `in` 연산자 사용 가능
- **구조 분해 선언**: `componentN` 함수 기반. data class는 자동 생성
- **위임 프로퍼티**:
  - `getValue`, `setValue` 함수로 로직 위임
  - `by lazy {}` → 지연 초기화
  - `Delegates.observable()` → 변경 감지
  - `by map` → 동적 속성 처리
  - 프레임워크에서 DB, JSON 등 다양한 응용 가능
