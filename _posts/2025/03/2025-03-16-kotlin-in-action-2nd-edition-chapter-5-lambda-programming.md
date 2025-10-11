---
layout: post
title:  "Kotlin In Action 2판 5장 람다를 사용한 프로그래밍"
tags: [Kotlin, Kotlin in Action, Lambda, 람다, Programming]
---

# 5장 람다를 사용한 프로그래밍

# 소개

### 람다에 대해 간단한 소개

- 다른 함수에 넘길 수 있는 작은 코드조각
- 람다를 사용하면 공통 코드 구조를 라이브러리 함수로 뽑을 수 있음

### 알아볼 내용

- 람다란 무엇인가?
- 코틀린에서의 람다 함수의 사용패턴
- 멤버참조와 람다의 관계
- 람다를 자바 API 와 함께 사용하기
- 함수형 인터페이스
- 수신객체 지정 람다란?

# 5.1 람다식과 멤버 참조

## 5.1.1 람다 소개: 코드 블록을 값으로 다루기

코드에서 일련의 동작을 변수에 저장하거나 다른 함수에 넘겨야 하는 경우 클래스의 인스턴스를 직접 넘기는 대신 함수를 전달하는 방식이다.

이러한 람다식을 활용하면 코드가 더욱 간결해지며, 함ㅁ수를 선언할 필요가 없어진다. 

또 함수를 값으로 다루고 행동을 표현하기 위해 함수를 조합하는 접근방식을 통해 함수형 프로그래밍 기법의 이점을 살릴 수 있다.

### 함수형 프로그래밍의 특징에 대해. . .

- 일급 시민인 함수: 함수를 값으로 다룰 수 있다
- 불변성: 내부 상태가 변하지 않음을 보장할 수 있다
- 부수 효과 없음: 외부 객체의 상태를 변경하지 않게  구성한다, 이를 순수 함수라 한다.

## 5.1.2 람다와 컬렉션

코드에서 중복을 제거하는 것이 스타일을 개선하는 중요한 방법이다.

이러한 관점에서 컬렉션을 다루는 대부분의 작업은 일반적인 패턴을 가지고 있기 때문에 중복된 코드를 제거하는 작업이 중요하다.

이러한 작업에서 코틀린은 람다를 통해 편리한 표준 라이브러리를 제공한다.

```kotlin
fun findTheOldest(people: List<Person>) {
    var maxAge = 0
    var theOldest: Person? = null
    for (person in people) {
        if (person.age > maxAge) {
            maxAge = person.age
            theOldest = person
        }
    }
    println(theOldest)
}

fun main() {
    val people = listOf(Person("Alice", 29), Person("Bob", 31))
    findTheOldest(people)
    // Person(name=Bob, age=31)
}

data class Person(val name: String, val age: Int)
```

이 코드를 람다를 사용하면

```kotlin
fun main() {
    val people = listOf(Person("Alice", 29), Person("Bob", 31))
    println(people.maxByOrNull{ it.age })
    // Person(name=Bob, age=31)
}
```

이렇게 간결해지는 것을 알 수 있다.

또한 `people.maxByOrNull(Person::age)` 와 같이 함수참조가 가능하다

## 5.1.3 람다식 문법
![image](https://github.com/user-attachments/assets/d65e7cb1-13ab-4ed3-8ee7-096d1d349642)



### **코틀린 람다식 문법 특징**

- 코틀린 람다식은 항상 중괄호로 둘러싸여 있다.
- 인자 목록 주변에는 괄호가 없다.
- 화살표가 인자 목록과 람다 본문을 구분해준다.

람다를 만들자마자 바로 호출하는 방식은 그다지 쓸모가 없다, 그렇기에 만약 코드의 일부분을 블록으로 실행하여야 할 경우가 있다면 run을 활용해라

```kotlin
// 쓸모 없는 . .. 
fun main() {
    val sum = {x:Int, y:Int -> x+y}
    println(sum(1,2))
    // 3
}

// 차라리 이렇게
fun main() {
    println(run {1+2})
    // 3
}
```

코인액에서는 코드 블록을 실행하고 싶을 때 run이 아주 유용하다.

특히 run을 쓰는 이런 호출에서 아무 부가 비용이 들지 않으며, 프로그램이 제공하는 기본 구성 요소와 비슷한 성능을 낸다. 이는 추후 10.2 절에서 설명한다고 한다

특히 이 부분에 대해서 필자도 동의한다.

예를 들어 어떤 인스턴스가 널인 경우 특정 코드블럭을 실행하고 싶을 때 항상 if문을 활용할 필요가 없이 Elvis Operation(?: ) 뒤에 run 블럭을 위치하면 된다.

```kotlin
data class People(
    val adress: Adress?
) {
    data class Adress(
        val name: String?
    )
}
fun main() {
    var people: People? = null
    if(people == null || people?.adress == null || peopel?.adress?.name == null) {
        println("null data")
        return
    }
}

fun main() {
    var people: People? = null
    people?.adress?.name ?: run {
        println("null data")
        return
    }
}
```

간단한 예시에서 혹은 더 세부적인 비교가 필요한 경우 if/when으로 처리하는게 더 깔끔해보일 수 는 있으나 people?.adress?.name 이런 객체 내부의 필드 값에 대한 전체적인 널 비교가 있는 경우 한번에 처리할 수 있다는 장점이 있다.

### **코틀린이 람다를 줄여쓸 수 있도록 하는 과정**

1. 이 코드는 구분자(중/대괄호를 얘기하는 듯?)가 너무 많다

```kotlin
people.maxByOrNull({p:Person -> p.age})
people.maxByOrNull() { p:Person -> p.age }
people.maxByOrNull { p:Person -> p.age }
```

1. 컴파일러가 문맥으로 유추할 수 있는 인자타입은 적지 않아도 된다

```kotlin
people.maxByOrNull { p:Person -> p.age }
people.maxByOrNull { p -> p.age }
```

1. 인자가 하나뿐인 경우 인자에 이름을 붙이지 않아도 된다

```kotlin
people.maxByOrNull { p -> p.age }
people.maxByOrNull { it.age }
```

람다는 블록 내에서 명시적은 return은 필요없다.

다만 변수에 람다를 할당할 경우 인자의 타입을 명시해야한다. (2, 3번이 skip 되지 않음)

### **trailing lamda**

추가적으로 마지막 인자만 람다인 경우에는 람다를 밖으로 빼내는 스타일이 있다. 이를 [trailing lamda](https://kotlinlang.org/docs/lambdas.html#passing-trailing-lambdas) 라고 한다.

```kotlin
val product = items.fold(1) { acc, e -> acc * e }
run { println("...") }
```

일반적으로 가장 좋은 코드 스타일이지만, 인자에 람다가 2개 이상부터는 오히려 괄호 내에 이름있는 인자를 통해 람다를 표현하는 것이 가독성 측면에서는 더 효율적이다. 

이는 특히 Android의 Jetpack Compose라는 현대적인 선언형 UI ToolKit 에서 공감할 수 있는 구조이다.

```kotlin
@Composable
fun Scaffold(
    modifier: Modifier = Modifier,
    topBar: @Composable () -> Unit = {},
    bottomBar: @Composable () -> Unit = {},
    snackbarHost: @Composable () -> Unit = {},
    floatingActionButton: @Composable () -> Unit = {},
    floatingActionButtonPosition: FabPosition = FabPosition.End,
    containerColor: Color = MaterialTheme.colorScheme.background,
    contentColor: Color = contentColorFor(containerColor),
    contentWindowInsets: WindowInsets = ScaffoldDefaults.contentWindowInsets,
    content: @Composable (PaddingValues) -> Unit
)

Scaffold(
    topBar = {},
    battomBar = {}
) . . .
```

수 많은 람다 인자를 가진 컴포넌트를 활용할 때 그 효과를 체감할 수 있다.

또 오히려 trailing lamda는 익숙치 않은 API에서는 역 효과가 발생한다고 얘기한다.

## 5.1.4 현재 영역에 있는 변수 접근

람다를 함수 내부에 정의할 경우 함수의 파라메터와 로컬 변수도 람다에서 사용할 수 있다, 이는 곧 람다 내부에서 외부 변수를 변경할 수 있다는 뜻이다.

기본적으로 함수에 정의된 로컬 변수의 생명주기는 함수가 반환되면 끝나지만 어떤 함수가 자신의 로컬변수를 캡쳐한 람다를 반환하거나 다른 변수에 저장한다면  로컬변수의 생명주기와 함수의 생명주기는 달라진다는 것이다.

이러한 동작이 가능한 이유는 다음과 같다.

- 파이널 변수를 캡쳐한 경우 람다 코드를 변수와 함께 저장
- 혹 파이널이 아닌 변수를 캡쳐한 경우 특별한 래퍼로 감싸서 나중에 변경하거나 읽을 수 있도록 하여 래퍼에 대한 참조를 람다 코드와 함께 저장

### **변경 가능한 변수를 람다에서 캡처하는 방법**

자바에서는 람다에서 변경 가능한 변수를 직접 캡처할 수 없지만, Kotlin에서는 가능함 

**래퍼 클래스를 사용하여 변경 가능한 변수 캡처(교묘한 속임수?)**

```kotlin
class Ref<T>(var value: T)

fun main() {
    val counter = Ref(0)
    val inc = { counter.value++ }
}
```

- `Ref<T>`라는 래퍼 클래스를 만들고, 값(`value`)을 변경 가능하게 선언
- `val counter = Ref(0)`으로 초기화한 후, `counter.value++`을 통해 값을 변경
- 캡쳐한 counter는 final이지만 counter.value는 변경 가능한 값이므로 참조 가능해짐

**실제 코드에서는? 직접 변경 가능한 변수 사용**

```kotlin
fun main() {
    var counter = 0
    val inc = { counter++ }
}
```

- `var counter = 0`을 선언하고, `counter++`을 수행하는 람다를 선언
- Kotlin에서는 직접 변경 가능한 변수를 람다에서 캡처 가능

**주의할 점**

람다가 이벤트 핸들러나 비동기적으로 실행되는 코드로 활용될 경우, 로컬 변수 변경이 **람다가 실행될 때 일어난다**는 점을 기억해야함

```kotlin
fun tryToCountButtonClicks(button: Button): Int {
    var clicks = 0
    button.onClick { clicks++ }
    return clicks
}
```

예시로 위 코드의

- `clicks` 변수가 `0`으로 초기화된 후, 함수가 종료되면 **값이 사라짐**.
- `onClick` 핸들러가 실행될 때마다 `clicks++`이 실행되지만, `tryToCountButtonClicks` 함수는 이미 `clicks`를 `return`하고 종료되었기 때문에 변경 사항을 추적할 수 없음.
- 해결 방법: `clicks` 변수를 **함수의 바깥**(클래스 프로퍼티 등)으로 이동해야 함.

그렇기에 영원히 0만 반환 됨

## 5.1.5 멤버 참조

넘기려는 코드 조각이 이미 함수로 선언된 경우 함수를 직접 값으로 바꾸어 이 멤버 참조를 활용하면 됨

이 때 함수를 바꾸는 문법은 이중 콜론(::) 임

```kotlin
val getAge = Person::age
```

:: 를 사용하는 식을 멤버 참조(method reference) 라고 부름

### 멤버 참조 문법

멤버 참조는 정확히 한 메서드를 호출하거나 프로퍼티에 접근하는 함수 값을 만들어줌

::은 클래스 이름과 참조하려는 멤버(프로퍼티나 메서드) 이름 사이에 위치
![image](https://github.com/user-attachments/assets/34750582-defd-414d-8777-75d0faa1b57c)


```kotlin
// 이는 아래와 같은 람다식을 더 간단히 만듬
val getAge = { person: Person => person.age }
val getAge = Person::age
```

### 멤버 참조의 장점

이러한 멤버 참조는 람다가 인자가 여럿인 다른 함수에 작업을 위임하는 경우 더욱 돋보임

```kotlin
val action = {person: Person, message: String -> 
   sendEmail(person, message)
}
val nextAction = ::sendEmail
```

### 생성자 참조

필자는 생성자 참조를 처음 알게됨, 아래 처럼 클래스 생성 작업을 연기하거나 저장할 때 사용된다고 함

```kotlin
class Person(val name: String)

val createPerson: (String) -> Person = ::Person

fun main() {
    val person = createPerson("Kez")
    println(person.name)
}

```

확장 함수도 동일한 방식으로 참조 가능

## 5.1.6 값과 엮인 호출 가능 참조

만약 특정 객체의 값을 **미리 고정된 상태로 호출**하고 싶다면, **역인 호출 기능 참조**(Bounded Callable Reference)를 사용할 수 있음

```kotlin
fun main() {
    val seb = Person("Sebastian", 26)
    
    // 일반적인 람다 참조
    val personsAgeFunction = Person::age
    println(personsAgeFunction(seb))

    // Bounded Callable Reference
    val sebsAgeFunction = seb::age
    println(sebsAgeFunction())
    
    // 이게 제일 간단한데.. . ..
    println(seb.age)
}
```

더 간단하다고는 얘기하지만 솔직히 예제가 별로여서 와닿지 않는다, 언젠간 이해되겠지 하고 5.2 로 넘어가겠다.

## 5.2 자바의 함수형 인터페이스 사용: 단일 추상 메서드

### 단일 추상 메서드(SAM) 혹은 함수형 인터페이스

인터페이스 안에 추상 메서드가 단 하나뿐인 인터페이스를 함수형 인터페이스 혹은 단일 추상 메서드(SAM) 라고 부른다.

### 5.2.1 람다를 자바 메서드의 파라미터로 전달

자바 메서드가 **함수형 인터페이스를 인자로 받는 경우**, Kotlin에서는 람다를 직접 전달할 수 있음.

```java
# Java
void postponeComputation(int delay, Runnable coputation);
```

```kotlin
# Kotlin
postponeComputation(1000) { println(42) }
```

코틀린 에서는 `postponeComputation()` 메서드 호출 시 컴파일러가 익명클래스 인스턴스를 만들고 그 람다를 인스턴스의 유일한 추상 메서드의 본문으로 만들어준다.

<aside>
💡

 위 예시코드에서 Runnable을 명시적으로 구현(직접 익명객체를 생성)하여 인자로 넘기는 것도 똑같은 효과를 낸다.
 다만 람다는 자신이 정의된 함수의 변수에 접근하지 않는다면 **함수가 호출 될 때 마다 람다에 해당하는 익명 객체가 재사용** 된다.

</aside>

## 5.2.2 SAM 변환: 람다를 함수형 인터페이스로 명시적 변환

 SAM 생성자는 컴파일러가 생성한 함수로 람다를 단일 추상 메서드 인터페이스의 인스턴스로 명시적으로 변환해준다, 다만 아래의 2가지 상황에서는 컴파일러가 자동으로 추상메서드 인터페이스의 인스턴스를 **명시적으로 변환해주지 못한다.** 

1. 함수형 인터페이스의 인스턴스를 반환하는 함수

```kotlin
fun createRunnable(): Runnable {
    return Runnable { println("All done!") }
}

fun main() {
    val runnable = createRunnable()
    runnable.run()
}
```

이러한 경우 SAM 생성자의 이름은 사용하려는 함수형 인터페이스의 이름과 동일하다.

1. 람다로 생성한 함수형 인터페이스 인스턴스를 변수에 저장해야하는 경우

```kotlin
val listener = OnClickListener { view ->  
    val text = when (view.id) {
        R.id.button1 -> "First button"
        R.id.button2 -> "Second button"
        else -> "Unknown button"
    }
    toast(text)
}

button1.setOnClickListener(listener)
button2.setOnClickListener(listener)
```

이러한 경우 직접 익명 객체를 선언하여 리스너를 만들 수 도 있지만 SAM 생성자를 쓰는 쪽이 더 간결하다.

### 람다와 리스너 등록/해제

- **람다에는 `this`가 없음** → 람다 내부에서는 익명 객체처럼 `this`를 사용하여 자기 자신을 참조할 수 없음.
- **익명 객체는 `this` 사용 가능** → `this`를 사용하여 이벤트 리스너를 해제할 수 있음.
- **이벤트 리스너를 해제해야 할 경우** → 람다가 아니라 **익명 객체**를 사용해야 함.

```kotlin
button.setOnClickListener {
    println("Button clicked")
    // this 사용 불가능 → 자기 자신을 참조할 수 없음
}

val listener = object : View.OnClickListener {
    override fun onClick(v: View?) {
        println("Button clicked")

        // 자기 자신을 해제 가능 (this 사용 가능)
        v?.setOnClickListener(null)
    }
}

button.setOnClickListener(listener)
```

## 5.3 코틀린에서 SAM 인터페이스 정의

코틀린에서 fun interface를 정의하면 함수형 인터페이스를 활용 가능

코틀린의 함수형 인터페이스는 정확히 하나의 추상 메서드만 포함하지만 다른 비추상 메서드를 여럿 가질 수 있음

```kotlin
fun interface IntCondition {
    fun check(i: Int): Boolean
    fun checkString(s: String) = check(s.toInt())
    fun checkChar(c: Char) = check(c.digitToInt())
}
```

### 함수형 인터페이스의 동적 호출

fun interface로 정의된 타입의 파라미터를 받는 함수가 있을 때 람다 구현이나 람다에 대한 참조를 직접 넘길 수 있다, 이 경우 모두 동적으로 인터페이스 구현을 인스턴스화 해준다.

```kotlin
fun invokeCondition(condition: IntCondition, num: Int) {
    println("결과: ${condition.check(num)}")
}

fun main() {
    val isOdd: IntCondition = { it % 2 != 0 }
    invokeCondition(isOdd, 3)  // 결과: true
}
```

### 자바에서 함수형 인터페이스 호출

자바와 코틀린에서 함께 쓰이는 코드에서 fun interface를 쓰면 자바에서도 코드의 간결성을 높일 수 있다.

잘은 모르겠지만 코틀린 함수 타입은 파라미터와 반환타입을 타입 파라미터로 하는 제네릭 타입인 객체로 번역되기에 가능하다고 한다.

```kotlin
fun interface StringConsumer {
    fun consume(s: String)
}

fun consumeHelloFunctional(t: (String) -> Unit) {
    t("Hello")
}
```

```java
public class MyApp {
    public static void main(String[] args) {
        // 자바에서 Kotlin의 fun interface를 람다로 호출 가능
        MainKt.consumeHello(s -> System.out.println(s.toUpperCase()));

        // Kotlin의 함수 타입을 자바에서 사용하려면 Unit.INSTANCE를 반환해야 함
        MainKt.consumeHelloFunctional(s -> {
            System.out.println(s.toUpperCase());
            return Unit.INSTANCE;
        });
    }
}
```
