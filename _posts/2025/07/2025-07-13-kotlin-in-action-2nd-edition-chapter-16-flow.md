---
layout: post
title: "Kotlin in Action 2판 16장 Flow"
description: "Kotlin Flow 기초: 비동기 스트림, Flow 빌더, 콜드/핫 Flow, 구조화된 동시성"
date: 2025-07-13 12:00:00 +0900
categories:
    - Kotlin
tags:
    - Kotlin
    - Kotlin in Action
    - Flow
    - Coroutines
    - Asynchronous Stream
---

# 16장 Flow(플로우)
- 코루틴을 기반으로한 고수준 추상화로 Flow 를 활용하면 시간이 지남에 따라 변경되는 여러 값에 대하여 구조화된 동시성 매커니즘을 활용할 수 있다

## 16.1 플로우는 연속적인 값의 스트림을 모델링함
- 일시중단(suspend) 함수는 한번 또는 여러번 실행을 중단할 수 있지만 원시타입, 객체, 객체의 컬렉션 같은 단일 값만을 반환한다
- 아래 예제는 일시 중단 함수로 3개의 값을 생성함

```kotlin
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import kotlin.time.Duration.Companion.seconds
 
suspend fun createValues(): List<Int> {
    return buildList {
        add(1)
        delay(1.seconds)
        add(2)
        delay(1.seconds)
        add(3)
        delay(1.seconds)
    }
}
 
fun main() = runBlocking {
    val list = createValues()
    list.forEach {
        log(it)
    }
}
 
// 3099 [main @coroutine#1] 1
// 3107 [main @coroutine#1] 2
// 3107 [main @coroutine#1] 3

```
- 실행하면 모든 값이 계산된 후 함수가 값을 반환하기에 3초 후에 3개의 값이 모두 출력됨
- 함수 내부적으로는 각 원소가 순차적으로 계산되지만, 함수 호출자는 리스트 전체가 반환될 때까지 기다림

### 16.1.1 플로우를 사용하면 배출되자마자 원소를 처리할 수 있음

- 플로우를 사용하면 값이 계산되는 즉시 사용할 수 있음  
- 아래는 flow 빌더를 사용한 예시

```kotlin
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.flow.*
import kotlin.time.Duration.Companion.milliseconds
 
fun createValues(): Flow<Int> {
    return flow {
        emit(1)
        delay(1000.milliseconds)
        emit(2)
        delay(1000.milliseconds)
        emit(3)
        delay(1000.milliseconds)
    }
}
 
fun main() = runBlocking {
    val myFlowOfValues = createValues()
    myFlowOfValues.collect { log(it) }
}
 
// 29 [main @coroutine#1] 1
// 1100 [main @coroutine#1] 2
// 2156 [main @coroutine#1] 3

```
- 코드가 모든 값을 계산할 때까지 기다릴 필요가 없음
- 이처럼 값이 계산되자마자 이를 사용할 수 있는 추상화가 Flow의 핵심 개념으로 효율적이고 반응적인 프로그래밍 가능

### 16.1.2 코틀린 플로우의 여러 유형

- 코틀린의 모든 플로우는 시간에 따라 등장하는 값과 작업할 수 있는 일관된 API를 제공하지만, 크게 콜드 플로우와 핫 플로우라는 두 가지 카테고리로 나뉨

- 콜드 플로우(차가운 플로우): 비동기 데이터 스트림으로, 값이 실제로 소비되기 시작할 때만 값이 배출됨
- 핫 플로우(뜨거운 플로우): 값이 실제로 소비되고 있는지와 상관없이 값을 독립적으로 배출함. 브로드캐스트 방식으로 동작함

---

## 16.2 콜드 플로우

### 16.2.1 flow 빌더 함수를 사용해 콜드 플로우 생성

- 새로운 콜드 플로우는 flow 빌더 함수로 생성할 수 있으며, 이 함수는 flow라 불림
블록 안에서 emit 함수를 호출해 Flow의 Collector에게 값을 제공하며, Collector가 해당 값을 처리할 때까지 빌더 함수의 실행을 중단함

- flow가 받는 블록은 suspend이기에 내부에서 delay 등 일시 중단 함수를 호출할 수 있음

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import kotlin.time.Duration.Companion.milliseconds
 
fun main() {
    val letters = flow {
        log("Emitting A!")
        emit("A")
        delay(200.milliseconds)
        log("Emitting B!")
        emit("B")
    }
}
```

- 이 코드는 실제로 아무런 출력도 나타나지 않는데 그 이유는 flow 빌더 함수가 연속적인 값의 스트림을 표현하는 Flow<T> 타입 객체를 반환하기 때문임
- 즉 flow는 콜드 스트림으로 처음에 비활성 상태이며, 터미널 오퍼레이터가 호출되어야 빌더에서 정의된 계산이 시작됨 이 때문에 flow를 콜드라 부름

- 추가적으로 빌더 내부 코드는 플로우가 수집될 때만 실행되기에 무한 플로우를 정의하고 반환해도 괜찮음

```kotlin
val counterFlow = flow {
    var x = 0
    while (true) {
        emit(x++)
        delay(200.milliseconds)
    }
}
```

### 16.2.2 콜드 플로우는 수집되기 전까지 작업을 수행하지 않음

- Flow에 대해 collect 함수를 호출해야 그 로직이 실행됨  
- collect는 suspend 함수이며, 플로우가 끝날 때까지 일시 중단되는 구조이며, 내부 람다 또한 일시 중단 될 수 있기에 다른 일시 중단 함수의 호출 가능
- 예를 들어 플로우의 수집자는 수신한 값에 따라 데이터를 데이터베이스에 쓰거나 HTTP 요청을 수행할 수 있음

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import kotlin.time.Duration.Companion.milliseconds

val letters = flow {
   log("Emitting A!")
   emit("A")
   delay(200.milliseconds)
   log("Emitting B!")
   emit("B")
}

fun main() = runBlocking {
   letters.collect {
       log("Collecting $it")
       delay(500.milliseconds)
   }
}

// 27 [main @coroutine#1] Emitting A!
// 38 [main @coroutine#1] Collecting A
// 757 [main @coroutine#1] Emitting B!
// 757 [main @coroutine#1] Collecting B
```

- 수집자가 플로우 빌더의 첫 번째 배출을 발생시키고, 수집자 람다가 호출되며 메시지를 기록하고 500밀리초 지연됨  
- 이후 플로우 람다가 계속 실행되어 200밀리초 지연 후 배출과 수집이 발생함(총 700ms 소요)


> 아래 예시와 같이 collect를 여러 번 호출하면 flow의 로직이 여러 번 실행되며, 이로 인해 플로우에 네트워크 요청 등 부수효과가 있으면 여러 번 실행되기에 유의해서 사용해야함

```kotlin
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.*
import kotlin.time.Duration.Companion.milliseconds

fun main() = runBlocking {
   letters.collect {
       log("(1) Collecting $it")
       delay(500.milliseconds)
   }
   letters.collect {
       log("(2) Collecting $it")
       delay(500.milliseconds)
   }
}

// 23 [main @coroutine#1] Emitting A!
// 33 [main @coroutine#1] (1) Collecting A
// 761 [main @coroutine#1] Emitting B!
// 762 [main @coroutine#1] (1) Collecting B
// 1335 [main @coroutine#1] Emitting A!
// 1335 [main @coroutine#1] (2) Collecting A
// 2096 [main @coroutine#1] Emitting B!
// 2096 [main @coroutine#1] (2) Collecting B
```

### 16.2.3 플로우 수집 취소

- collect는 플로우의 모든 원소가 처리될 때까지 일시 중단됨  하지만 플로우에 무한한 원소가 있을 수 있으므로, collect도 무기한 일시 중단될 수 있음
- 이러한 경우 모든 원소가 처리되기 전에 플로우 수집을 중지하고 싶으면 플로우를 취소할 수 있도록 코루틴 매커니즘과 동일하게 취소를 지원

```kotlin
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.*
import kotlin.time.Duration.Companion.seconds

fun main() = runBlocking {
   val collector = launch {
       counterFlow.collect {
           println(it)
       }
   }
   delay(5.seconds)
   collector.cancel()
}

// 1 2 3 ... 24
```

- 5초 동안 collect를 수행하고 이후 collector 코루틴을 취소할 때 emit도 코드에서 취소와 일시 중단 지점으로 작동함(? 이해가 잘 안됨)

---

### 16.2.4 콜드 플로우의 내부 구현

- 콜드 플로우는 일시 중단 함수와 수신 객체 지정 람다를 결합한 구조로 간단하게 Flow와 FlowCollector 두 가지 인터페이스만 필요함

```kotlin
interface Flow<T> {
    suspend fun collect(collector: FlowCollector<T>)
}

interface FlowCollector<T> {
    suspend fun emit(value: T)
}
```

- flow 빌더 함수의 블록은 FlowCollector를 수신 객체로 받고, 빌더 내부에서 emit 함수를 호출하면, collect 함수에 전달된 람다가 실행되는 구조
- collect를 호출하면 플로우 빌더 함수가 실행되고 emit이 호출되면 collect에 전달된 람다가 호출되는 유기적인 구조를 가지고 있음
- collect 내부의 람다 표현식 실행이 완료되면 다시 flow 빌더 함수의 본문으로 돌아가 계속 실행 되는 구조
(이미지 2)

```kotlin
val letters = flow {
    delay(300)
    emit("A")
    delay(300)
    emit("B")
}

fun main() = runBlocking {
    letters.collect { letter ->
        println(letter)
        delay(200)
    }
}
```

---

### 16.2.5 채널 플로우를 사용한 동시성 플로우

- flow 빌더 함수로 만든 콜드 플로우는 모두 순차적으로 실행되며 코드 블록은 하나의 코루틴으로 실행되는 구조
- 대부분의 경우 이런 추상화로 충분하지만, 여러 코루틴에서 독립적으로 실행할 수 있는 작업이 있을 때 순차적 특성은 병목이 될 수 있음

아래는 10개의 난수를 순차적으로 계산하는 플로우 예제

```kotlin
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.*
import kotlin.random.Random
import kotlin.time.Duration.Companion.milliseconds

suspend fun getRandomNumber(): Int {
   delay(500.milliseconds)
   return Random.nextInt()
}

val randomNumbers = flow {
   repeat(10) {
       emit(getRandomNumber())
   }
}

fun main() = runBlocking {
   randomNumbers.collect {
       log(it)
   }
}

// 583 [main @coroutine#1] 1514439879
// 1120 [main @coroutine#1] 1785211458
// 1693 [main @coroutine#1] -996479986
// ...
// 5463 [main @coroutine#1] -2047597449
```

- 각 getRandomNumber 호출이 순차적으로 실행되기 때문에 플로우를 수집하는 데 약 5초가 걸리는 비효율적인 구조
- 만약 이를 방지하기 위해서 flow 빌더에서 여러 코루틴을 시작해서 값을 배출하면 `“Flow invariant is violated: Emission from another coroutine is detected. FlowCollector is not thread-safe and concurrent emissions are prohibited.”` 라는 오류 메시지가 발생함 
- 이처럼 플로우 수집자가 스레드 안전하지 않아서 원소를 병렬로 배출하면 안 됨


이렇듯 여러 코루틴에서 배출을 허용하는 플로우가 필요할 때는 channelFlow를 사용해야함
- channelFlow는 emit이 아니라 send를 사용해 여러 코루틴에서 값을 제공할 수 있음  
- 이 때 Collector 는 값을 순차적으로 수신함

```kotlin
import kotlinx.coroutines.flow.channelFlow
import kotlinx.coroutines.launch

val randomNumbers = channelFlow {
    repeat(10) {
        launch {
            send(getRandomNumber())
        }
    }
}

553 [main] -1927966915
568 [main] 222582016
...
569 [main] 1827898086
```

- channelFlow를 수집하면 getRandomNumber 함수가 동시적으로 실행되기에 예제와 같이 전체 실행 시간이 약 500밀리초로 줄어듦
- 일반적인 콜드 플로우는 가장 간단하고 성능이 좋은 추상화로 channelFlow는 동시 작업이라는 구체적 용례를 위해 설계됨  
- 즉 channelFlow는 내부적으로 채널을 관리하므로, 생성하는 데 비용이 들기 때문에 플로우 안에서 새로운 코루틴을 시작해야 하는 경우에만 channelFlow를 선택하고, 그렇지 않은 경우에는 일반 콜드 플로우가 성능상 더 나은 방식임
---

## 16.3 핫 플로우

- 방출, 수집이라는 구조는 같지만, 핫 플로우는 콜드 플로우와 여러 속성이 다름
- 핫 플로우는 여러 구독자(subscriber)가 배출된 항목을 공유하기에 시스템에서 이벤트나 상태 변경이 발생해 수집자가 존재하는지와 상관없이 값을 배출해야 하는 경우에 적합한 플로우
- 또한 핫 플로우는 항상 활성 상태이므로 구독자의 유무와 관계 없이 값이 배출될 수 있음

코틀린 코루틴에는 두 가지 핫 플로우 구현이 제공됨  
- SharedFlow: 값을 브로드캐스트하기 위해 사용함  
- StateFlow: 상태를 전달하는 특별한 경우에 사용함

---

### 16.3.1 SharedFlow는 값을 구독자에게 브로드캐스트함

- SharedFlow는 Collector가 존재하는지와 상관없이 값이 브로드캐스트 방식으로 방출됨
- 코루틴에서 값을 emit하여 SharedFlow에 배출할 수 있는 구조

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import kotlin.random.*
import kotlin.time.Duration.Companion.milliseconds
 
class RadioStation {
    private val _messageFlow = MutableSharedFlow<Int>()
    val messageFlow = _messageFlow.asSharedFlow()
 
    fun beginBroadcasting(scope: CoroutineScope) {
        scope.launch {
            while(true) {
                delay(500.milliseconds)
                val number = Random.nextInt(0..10)
                log("Emitting $number!")
                _messageFlow.emit(number)
            }
        }
    }
}

fun main() = runBlocking {
    RadioStation().beginBroadcasting(this)
}
 
// 575 [main @coroutine#2] Emitting 2!
// 1088 [main @coroutine#2] Emitting 10!
// 1593 [main @coroutine#2] Emitting 4!
// ...

```

- Collector를 추가하는 방법은 콜드 플로우와 동일하게 collect를 호출하면 되는 구조
- 콜드 플로우와 다른 점은 Collector는 구독 시작 이후에 배출된 값만 수신함

```kotlin
fun main(): Unit = runBlocking {
   val radioStation = RadioStation()
   radioStation.beginBroadcasting(this)
   delay(600.milliseconds)
   radioStation.messageFlow.collect {
       log("A collecting $it!")
   }
}

611 [main @coroutine#2] Emitting 8!
1129 [main @coroutine#2] Emitting 9!
1131 [main @coroutine#1] A collecting 9!
1647 [main @coroutine#2] Emitting 1!
1647 [main @coroutine#1] A collecting 1!
```

- 첫 번째 값은 구독자가 collect를 시작하기 전에 배출되어 수신되지 않는 것을 볼 수 있음

#### SharedFlow 의 속성
- SharedFlow의 replay 파라미터를 설정하면, 새 구독자를 위해 최근 값 몇 개를 캐시할 수 있음  
- 예를 들어, replay=5로 설정하면 최근 5개의 값을 새로운 구독자가 수신할 수 있음

```kotlin
private val _messageFlow = MutableSharedFlow<Int>(replay = 5)

560 [main @coroutine#2] Emitting 6!
635 [main @coroutine#1] A collecting 6!
1080 [main @coroutine#2] Emitting 10!
1081 [main @coroutine#1] A collecting 10!
```

---
#### 콜드 플로우를 SharedFlow로

콜드 플로우를 SharedFlow로 변환하려면 shareIn 함수를 사용할 수 있음
- shareIn은 CoroutineScope 타입의 scope를 첫번째 파라미터를 받아서 코루틴을 실행함  

두 번째 파라미터 started로 플로우가 실제로 언제 시작될지 정함  
- Eagerly: 플로우 수집을 즉시 시작함  
- Lazily: 첫 번째 구독자가 나타나야만 수집을 시작함  
- WhileSubscribed: 첫 번째 구독자가 나타나야 수집을 시작하고, 마지막 구독자가 사라지면 플로우 수집을 취소함

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import kotlin.random.*
import kotlin.time.Duration.Companion.milliseconds

fun querySensor(): Int = Random.nextInt(-10..30)

fun getTemperatures(): Flow<Int> {
   return flow {
       while(true) {
           emit(querySensor())
           delay(500.milliseconds)
       }
   }
}

fun celsiusToFahrenheit(celsius: Int) =
    celsius * 9.0 / 5.0 + 32.0
 
fun main() {
   val temps = getTemperatures()
   runBlocking {
       val sharedTemps = temps.shareIn(this, SharingStarted.Lazily)
       launch {
           sharedTemps.collect {
               log("$it Celsius")
           }
       }
       launch {
           sharedTemps.collect {
               log("${celsiusToFahrenheit(it)} Fahrenheit")
           }
       }
   }
}

// 45 [main @coroutine#3] -10 Celsius
// 52 [main @coroutine#4] 14.0 Fahrenheit
// 599 [main @coroutine#3] 11 Celsius
// 599 [main @coroutine#4] 51.8 Fahrenheit
```
---

### 16.3.2 시스템 상태 추적: StateFlow
- StateFlow는 시간이 지나면서 변할 수 있는 값을 추적하는 데 특화된 핫 플로우임  
- StateFlow는 생성자에게 초깃값을 제공해야 함  
- emit 대신 update 함수를 사용해 값을 원자적으로 갱신 가능

```kotlin
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.*
 
class ViewCounter {
    private val _counter = MutableStateFlow(0)
    val counter = _counter.asStateFlow()
 
    fun increment() {
        _counter.update { it + 1 }
    }
}
 
fun main() {
    val vc = ViewCounter()
    vc.increment()
    println(vc.counter.value)
    // 1
}
```
- counter.value로 현재 값을 읽을 수 있음  
- update 함수는 이전 값을 기반으로 새 값을 계산하는 람다를 받으며, 동시에 여러 코루틴에서 값 갱신이 일어나도 update를 사용하면 원자적으로 값이 갱신됨
- StateFlow는 값이 실제로 달라졌을 때만 값을 배출함(동등성 기반 통합), 따라서 동일한 값이 연속으로 대입되면 한 번만 알림을 보냄

```kotlin
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.*

enum class Direction { LEFT, RIGHT }

class DirectionSelector {
   private val _direction = MutableStateFlow(Direction.LEFT)
   val direction = _direction.asStateFlow()

   fun turn(d: Direction) {
       _direction.update { d }
   }
}

fun main() = runBlocking {
   val switch = DirectionSelector()
   launch {
       switch.direction.collect {
           log("Direction now $it")
       }
   }
   delay(200.milliseconds)
   switch.turn(Direction.RIGHT)
   delay(200.milliseconds)
   switch.turn(Direction.LEFT)
   delay(200.milliseconds)
   switch.turn(Direction.LEFT)
}

// 37 [main @coroutine#2] Direction now LEFT
// 240 [main @coroutine#2] Direction now RIGHT
// 445 [main @coroutine#2] Direction now LEFT
```
LEFT를 두 번 연속 전달해도 한 번만 배출되는 것을 볼 수 있음

---

#### 콜드 플로우를 StateFlow로
- 콜드 플로우를 StateFlow로 변환하려면 stateIn 함수를 사용함  
- stateIn은 코루틴 스코프 내에서 플로우를 시작하고, 스코프가 취소될 때까지 최신 값을 유지함  
- 이를 통해 value 프로퍼티로 직접 값을 읽을 수 있음

```kotlin
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.*
import kotlin.time.Duration.Companion.milliseconds

fun main() {
   val temps = getTemperatures()
   runBlocking {
       val tempState = temps.stateIn(this)
       println(tempState.value)
       delay(800.milliseconds)
       println(tempState.value)
       // 18
       // -1
   }
}
```

---

### 16.3.3 StateFlow와 SharedFlow의 비교

- StateFlow와 SharedFlow 모두 구독자 존재 여부와 상관없이 값을 배출할 수 있음  
- StateFlow는 상태를 나타내며 동등성 기반 통합을 사용하며, 값이 실제로 변경된 경우에만 값을 배출함  
- SharedFlow는 구독자가 구독하는 동안만 이벤트를 배출함  
- StateFlow는 한 가지 값만 나타내며, SharedFlow는 여러 값이 예상되는 시점에 구독자가 존재해야 함

---

### 16.3.4 핫 플로우, 콜드 플로우, SharedFlow, StateFlow: 언제 어떤 플로우를 사용할까

표 16.1에 플로우의 주요 속성을 정리함

|             | 콜드 플로우    | 핫 플로우          |
|-------------|---------------|---------------------|
| 기본 활성화 | 비활성(수집자) | 항상 활성           |
| 구독자      | 하나          | 여러 구독자         |
| 배출 범위   | 모두 받음     | 구독 시점부터 받음  |
| 배출 방식   | 순차적 emit   | 여러 코루틴에서 emit|
| 완료 여부   | 보통 완료됨   | 보통 미완료         |

일반적으로 네트워크 요청이나 데이터베이스 읽기 등 서비스 함수는 콜드 플로우를 사용해 선언함  
필요하면 콜드 플로우를 StateFlow나 SharedFlow로 변환함

---

## 요약

- 코틀린 플로우는 시간이 지나면서 발생하는 값을 처리할 수 있는 코루틴 기반의 추상화임  
- 플로우에는 핫 플로우와 콜드 플로우 두 가지 유형이 있음  
- 콜드 플로우는 기본적으로 비활성 상태이고, 하나의 수집자와 연결됨. flow 빌더 함수로 생성하고, emit 함수로 값을 비동기적으로 제공함  
- 채널 플로우는 콜드 플로우의 특수 유형으로, 여러 코루틴에서 send 함수로 값을 배출할 수 있음  
- 핫 플로우는 항상 활성 상태이고, 여러 구독자와 연결됨. SharedFlow, StateFlow가 예임  
- SharedFlow는 브로드캐스트 방식으로 값을 전달함  
- SharedFlow 구독자는 구독을 시작한 시점부터 값을 받으며, replay 값을 조정해 최근 값을 받을 수 있음  
- 동시성 시스템에서 상태를 관리할 때 StateFlow를 사용할 수 있음  
- StateFlow는 동등성 기반 통합을 수행함. 값이 실제로 변경된 경우에만 배출됨  
- shareIn이나 stateIn 함수로 콜드 플로우를 핫 플로우로 변환할 수 있음


