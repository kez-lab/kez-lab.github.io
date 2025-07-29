---
layout: post
title: "Kotlin in Action 2판 18장 오류 처리와 테스트"
description: "Kotlin Coroutines 오류 처리와 테스트에 대하여"
date: 2025-07-27 12:00:00 +0900
categories: [Kotlin, Kotlin In Action 2, 코틀린 인 액션 2판]
tags: [Kotlin in Action 2판 18장, Coroutine, Flow, CoroutineExceptionHandler, Exception,]
author: admin
---

# 18장 오류 처리와 테스트
[오류처리]
- 거의 대부분의 애플리케이션은 우리가 제어할 수 없는 외부 시스템과 API를 통해 상호작용함
- 이러한 상황에서 외부의 상황에 따라 시스템의 실패 상황에서도 정상동작을 하도록 해야할 책임이 존재함
- 따라서 위와 같은 상황에 대비하기 위헤 코틀린 코루틴에서 오류를 어떻게 처리하는지 다룸

[테스트]
- 애플리케이션의 강건성을 높이기 위해 테스트를 작성하는 방법에 대해 이 장에서 다룰 예정
- 가상 시간을 활용하거나 터빈 라이브러리를 활용하는 방법에 대해 배울 예정

## 18.1 코루틴 내부에서 던져진 오류 처리
- 코틀린 코루틴의 launch, async 등 코루틴 빌더 함수 내부에서 예외가 발생하면, 해당 코루틴 바깥의 try-catch로는 잡히지 않음(스레드에서 발생한 예외가 스레드를 만든 코드에서 잡히지 않는 것과 같음)
- 즉 launch의 람다 내부에서 예외가 발생하면, 해당 예외는 launch 바깥에서 잡을 수 없는 구조
- 따라서 올바른 예외 처리는 launch의 람다 내부에 try-catch를 두는 방식

예제 코드
```kotlin
fun main(): Unit = runBlocking {
    try {
        launch {
            throw UnsupportedOperationException("Ouch!")
        }
    } catch (u: UnsupportedOperationException) {
        println("Handled $u")
    }
}
// 예외는 잡히지 않음

// launch 람다 내부에서 try-catch로 잡는 예제
fun main(): Unit = runBlocking {
    launch {
        try {
            throw UnsupportedOperationException("Ouch!")
        } catch (u: UnsupportedOperationException) {
            println("Handled $u")
        }
    }
}
// 예외가 핸들됨
```
- async는 생성된 코루틴에서 예외를 던지면 await 호출 시 예외가 던져지므로, await을 try-catch로 감싸야 예외를 처리할 수 있음

```kotlin
// async에서 예외를 던지고 await에서 잡는 예제
fun main(): Unit = runBlocking {
    val myDeferredInt: Deferred<Int> = async {
        throw UnsupportedOperationException("Ouch!")
    }
    try {
        val i: Int = myDeferredInt.await()
        println(i)
    } catch (u: UnsupportedOperationException) {
        println("Handled: $u")
    }
}
// 하지만 오류 콘솔에도 예외가 출력됨!
```
- await에서 예외가 잡히더라도, 자식 코루틴이 잡히지 않은 예외를 발생시키면,부모 코루틴(runBlocking 등)에 예외가 전파되며, 부모가 예외 처리를 해야 함
  - (책에서는 이를 재밌게 현실에서 자식들의 문제를 부모가 감당한다는 비유를 듬)

## 18.2 코틀린 코루틴에서의 오류 전파

- 구조적 동시성에서 자식 코루틴에서 발생한 잡히지 않은 예외는 부모 코루틴에 어떻게 전달되는지에 따라 두 가지 방식으로 나눌 수 있음
  - 자식 중 하나의 실패가 부모의 실패로 이어지는 경우 (기본 Job)  
  - 자식이 실패해도 전체 실패로 이어지지 않는 경우(감독자 SupervisorJob)  
- Job을 사용하는 스코프에서는 자식 코루틴에서 발생한 예외가 부모 코루틴을 예외로 종료시키고, 다른 자식 코루틴도 모두 취소됨  
- 반면 SupervisorJob을 사용하는 스코프에서는 한 자식의 실패가 다른 자식, 부모 코루틴에 영향을 미치지 않음  
- 부모 코루틴의 컨텍스트에 Job(실패가 전파됨) 또는 SupervisorJob(실패가 전파되지 않음)이 있는지에 따라 동작이 달라짐

### 18.2.1 자식이 실패하면 모든 자식을 취소하는 코루틴

- 코루틴 간의 부모-자식 계층은 Job 객체를 통해 구축되기에 SupervisorJob 없이 생성된 코루틴에서는 자식 코루틴에서 발생한 잡히지 않은 예외가 부모 코루틴을 예외로 종료시키는 방식으로 예외를 처리
- 이후 부모는 다음과 같은 작업을 수행
  - 부모는 불필요한 작업을 막기 위해 다른 모든 자식 코루틴을 취소함  
  - 동일 예외로 자신의 실행을 완료하고, 상위 계층으로 예외를 전파함  
- 이 구조는 하나의 코루틴 그룹에서 동시 계산을 할 때 유용함. 한 자식의 실패는 더 이상 의미있는 결과를 만들 수 없음을 뜻함

예제 코드
```kotlin
fun main(): Unit = runBlocking {
    launch {
        try {
            while (true) {
                println("Heartbeat!")
                delay(500.milliseconds)
            }
        } catch (e: Exception) {
            println("Heartbeat terminated: $e")
            throw e
        }
    }
    launch {
        delay(1.seconds)
        throw UnsupportedOperationException("Ow!")
    }
}

# 출력
Heartbeat!
Heartbeat!
Heartbeat terminated: kotlinx.coroutines.JobCancellationException: Parent job is Cancelling; job=BlockingCoroutine{Cancelling}@1517365b
Exception in thread "main" java.lang.UnsupportedOperationException: Ow!

// 결과 처럼 한 쪽에서 예외 발생시 다른 자식 코루틴(형제)도 취소됨
```

### 18.2.2 구조적 동시성은 코루틴 스코프를 넘는 예외에만 영향

- 형제 코루틴을 취소하고 예외를 상위 계층에 전파하는 동작은 스코프를 넘는 예외에만 영향 줌  
- try-catch를 코루틴 내부에 두면 예외가 스코프 밖으로 넘어가지 않으므로 다른 형제 코루틴이 취소되지 않음  
- 처리되지 않은 예외가 구조적 동시성을 강제하지만, 전체 애플리케이션이 종료되는 것은 바람직하지 않음, 따라서 이 오류 전파의 경계를 정의하기 위해 Supervisor(관리자) 코루틴을 사용

예제 코드
```kotlin
import kotlinx.coroutines.*
import kotlin.time.Duration.Companion.milliseconds
import kotlin.time.Duration.Companion.seconds
fun main(): Unit = runBlocking {
    launch {
        try {
            while (true) {
                println("Heartbeat!")
                delay(500.milliseconds)
            }
        } catch (e: Exception) {
            println("Heartbeat terminated: $e")
            throw e
        }
    }
    launch {
        try {
            delay(1.seconds)
            throw UnsupportedOperationException("Ow!")
        } catch(u: UnsupportedOperationException) {
            println("Caught $u")
        }
    }
}
// 예외가 잡힌 후에도 첫 코루틴은 계속 동작함
```

> Note:
CancellationException과 그 하위 타입 예외는 catch 블록에서 잡지 않거나, 반드시 다시 던져야 함.
CancellationException은 코루틴의 정상적인 취소 동작(취소 신호의 전파)을 보장하기 위한 예외이므로, 만약 다시 던지지 않으면 코루틴이 완전히 종료되지 않거나 자원이 해제되지 않을 수 있음.

### 18.2.3 슈퍼바이저는 부모와 형제가 취소되지 않게 한다
<img width="323" height="167" alt="image" src="https://github.com/user-attachments/assets/88f055e4-6509-488d-88d6-5f6f7b35e387" />

- SupervisorJob을 사용하면, 한 자식 코루틴의 실패가 부모/형제 코루틴에 영향을 주지 않음  
- SupervisorJob은 예외를 부모에게 전파하지 않고, 다른 자식 작업이 실패해도 취소되지 않게 함  
- supervisorScope 함수를 사용해 스코프를 만들 수 있으며, 자식 중 하나가 실패해도, 다른 형제/부모 코루틴은 계속 동작함  
- 주로 애플리케이션 전체 수명 등 오랫동안 실행되는 컴포넌트에 자주 사용됨

예제 코드
```kotlin
import kotlinx.coroutines.*
import kotlin.time.Duration.Companion.milliseconds
import kotlin.time.Duration.Companion.seconds
fun main(): Unit = runBlocking {
    supervisorScope {
        launch {
            try {
                while (true) {
                    println("Heartbeat!")
                    delay(500.milliseconds)
                }
            } catch (e: Exception) {
                println("Heartbeat terminated: $e")
                throw e
            }
        }
        launch {
            delay(1.seconds)
            throw UnsupportedOperationException("Ow!")
        }
    }
}
// 예외가 발생해도 Heartbeat 코루틴은 계속 동작함
```
- 이렇게 애플리케이션이 계속 실행되는 직접적인 이유는, SupervisorJob이 launch 빌더로 시작된 자식 코루틴에 대해 CoroutineExceptionHandler를 호출 하기 때문

## 18.3 CoroutineExceptionHandler: 예외 처리를 위한 마지막 수단

- 위에서 얘기한 것 처럼 자식 코루틴의 처리되지 않은 예외가 Supervisor 혹은 계층의 최상위로 가면, CoroutineExceptionHandler에 전달됨  
- CoroutineExceptionHandler는 코루틴 컨텍스트의 일부로, 최상위 코루틴(launch 등)에서만 호출되며 코루틴 컨텍스트에 제공 시 예외 처리 동작의 커스텀이 가능
- 만약 코루틴 컨텍스트에 예외 핸들러가 없다면 JVM에서는 핸들러가 예외 스택트레이스를 오류 콘솔에 출력, Android에서는 예외 발생 시 앱 종료
- 예시로 ViewModelScope에서는 핸들러를 지정하지 않으므로 launch에서 발생한 예외는 앱을 종료시킴

예제 코드
```kotlin
val exceptionHandler = CoroutineExceptionHandler { context, exception ->
    println("[ERROR] $exception")
}

class ComponentWithScope(dispatcher: CoroutineDispatcher = Dispatchers.Default) {
    private val exceptionHandler = CoroutineExceptionHandler { _, e ->
        println("[ERROR] ${e.message}")
    }
    private val scope = CoroutineScope(SupervisorJob() + dispatcher + exceptionHandler)
    fun action() = scope.launch {
        throw UnsupportedOperationException("Ouch!")
    }
}
fun main() = runBlocking {
    val supervisor = ComponentWithScope()
    supervisor.action()
    delay(1.seconds)
}
// [ERROR] Ouch!
```
#### 코루틴 계층의 최상위에 있는 예외 핸들러만 호출된다.
<img width="542" height="313" alt="image" src="https://github.com/user-attachments/assets/29793495-f264-4a71-914e-ead388129086" />

- 또한 중요하게 짚고 넘어가야할 점은 코루틴 계층의 최상위 launch에 정의된 코루틴 컨텍스의 핸들러만이 호출된다는 점임

예제 코드 (최상위 예외 핸들러 동작 확인)
```kotlin
import kotlinx.coroutines.*
private val topLevelHandler = CoroutineExceptionHandler { _, e ->
    println("[TOP] ${e.message}")
}
private val intermediateHandler = CoroutineExceptionHandler { _, e ->
    println("[INTERMEDIATE] ${e.message}")
}
@OptIn(DelicateCoroutinesApi::class)
fun main() {
    GlobalScope.launch(topLevelHandler) {
        launch(intermediateHandler) {
            throw UnsupportedOperationException("Ouch!")
        }
        Thread.sleep(1000)
    }
}
// [TOP] Ouch!
```

### 18.3.1 CoroutineExceptionHandler를 launch와 async에 적용할 때의 차이점

- launch 빌더로 생성된 최상위 코루틴만 예외 핸들러가 호출되는데 async로 시작된 최상위 코루틴의 예외는 await에서 소비자가 직접 처리해야 한다는 차이점이 있음
- SupervisorJob이 없는 경우, 처리되지 않은 예외는 스코프 내의 다른 자식 코루틴도 모두 취소시킴

예제 코드 (launch-async 비교)
```kotlin
class ComponentWithScope(dispatcher: CoroutineDispatcher = Dispatchers.Default) {
    private val exceptionHandler = CoroutineExceptionHandler { _, e ->
        println("[ERROR] ${e.message}")
    }
    private val scope = CoroutineScope(SupervisorJob() + dispatcher + exceptionHandler)
    fun action() = scope.launch {
        async {
            throw UnsupportedOperationException("Ouch!")
        }
    }
}
fun main() = runBlocking {
    val supervisor = ComponentWithScope()
    supervisor.action()
    delay(1.seconds)
}
// [ERROR] Ouch!
```

```
// async 최상위 예시
class ComponentWithScope(dispatcher: CoroutineDispatcher = Dispatchers.Default) {
    private val exceptionHandler = CoroutineExceptionHandler { _, e ->
        println("[ERROR] ${e.message}")
    }
    private val scope = CoroutineScope(SupervisorJob() + dispatcher + exceptionHandler)
    fun action() = scope.async {
        launch {
            throw UnsupportedOperationException("Ouch!")
        }
    }
}
fun main() = runBlocking {
    val supervisor = ComponentWithScope()
    supervisor.action()
    delay(1.seconds)
}
// 아무 것도 출력되지 않음 (예외 핸들러 호출 안 됨)
```
- async의 예외는 await을 호출하는 쪽에서 try-catch로 직접 처리해야 함  

## 18.4 플로우에서 예외 처리

- 플로우(Flow)도 일반 함수나 일시중단 함수처럼 예외를 던질 수 있음  
- 플로우의 생성, 변환, 수집 중 예외가 발생하면 collect에서 예외가 던져짐  
- collect를 try-catch 블록으로 감싸면 예외를 처리할 수 있음  
- 플로우 연산자(map 등)가 적용됐는지 여부와 상관없이 예외는 collect에서 잡힘

예제 코드  
```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
class UnhappyFlowException: Exception()
val exceptionalFlow = flow {
    repeat(5) { number ->
        emit(number)
    }
    throw UnhappyFlowException()
}
fun main() = runBlocking {
    val transformedFlow = exceptionalFlow.map { it * 2 }
    try {
        transformedFlow.collect {
            print("$it ")
        }
    } catch (u: UnhappyFlowException) {
        println("\nHandled: $u")
    }
}
// 0 2 4 6 8
// Handled: UnhappyFlowException
```

- 긴 파이프라인에서는 catch 연산자를 사용하는 것이 편리함

### 18.4.1 catch 연산자로 업스트림 예외 처리

- catch는 플로우에서 발생한 예외를 처리할 수 있는 중간 연산자로 연결된 람다의 파라미터(it)로 예외가 전달됨  
- 오직 업스트림에서 발생한 예외만 잡을 수 있다는 특징을 가지기 때문에 아래 예제처럼 catch 호출 다음(onEach 등)에서 발생한 예외는 catch에서 잡히지 않음

예제 코드  
```kotlin
fun main() = runBlocking {
    exceptionalFlow
        .catch { cause ->
            println("\nHandled: $cause")
            emit(-1)
        }
        .collect {
            print("$it ")
        }
}
// 0 1 2 3 4
// Handled: UnhappyFlowException
// -1
```

예제 코드  
```kotlin
fun main() = runBlocking {
    exceptionalFlow
        .map { it + 1 }
        .catch { cause ->
            println("\nHandled $cause")
        }
        .onEach {
            throw UnhappyFlowException()
        }
        .collect()
}
// Exception in thread "main" UnhappyFlowException
```
- catch 연산자는 업스트림에서 발생한 예외만 처리하기에 위 예제의 경우 예외가 출력됨 
- collect 람다 안의 예외는 try-catch로 감싸서 처리 가능

### 18.4.2 술어가 참일 때 플로우의 수집 재시도: retry 연산자

- 플로우 처리 중 예외가 발생하면, retry 연산자로 작업을 재시도할 수 있음  
- catch와 같이 업스트림 예외를 잡으며, 예외를 처리하고 Boolean을 반환하는 람다를 통해, true일 경우(지정한 최대 재시도 횟수까지) 재시도하는 함수
- 재시도 중에는 업스트림 플로우가 처음부터 다시 수집되며, 부수효과가 있는 작업의 경우 재시도에 주의해야 함(여러 번 실행될 수 있음)

예제 코드  
```kotlin
class CommunicationException : Exception("Communication failed!")
val unreliableFlow = flow {
    println("Starting the flow!")
    repeat(10) { number ->
        if (Random.nextDouble() < 0.1) throw CommunicationException()
        emit(number)
    }
}
fun main() = runBlocking {
    unreliableFlow
        .retry(5) { cause ->
            println("\nHandled: $cause")
            cause is CommunicationException
        }
        .collect { number ->
            print("$number ")
        }
}
// 여러 번 시도한 뒤 최종적으로 0~9까지 출력
```
## 18.5 코루틴과 플로우 테스트

코틀린 코루틴과 플로우를 사용하는 코드를 올바르게 테스트하려면 일반적인 테스트 기법과 더불어, **runTest 빌더를 통한 가상 시간 활용**, **테스트 전용 디스패처**, **플로우의 특성을 고려한 Turbine 라이브러리 활용법**을 익혀야 함.  
실제 delay/지연이 존재하는 코드를 빠르게 테스트하고, 무한/복잡 플로우에 대한 신뢰성 있는 검증 방법도 함께 다룸.

---

### 18.5.1 코루틴을 사용하는 테스트를 빠르게 만들기: 가상 시간과 테스트 디스패처

- 코루틴 테스트에서 runTest 빌더를 사용하면 실제 시간 경과 없이 delay 등 지연 코드를 빠르게 테스트할 수 있음
- runBlocking만 사용할 경우 delay가 명시된 만큼 실제로 기다려야 해 테스트가 느려짐
- runTest는 테스트 전용 디스패처와 스케줄러를 사용해 delay 등이 즉시 처리됨  
- 대규모 테스트 스위트에서는 이 방법이 필수적이며, 테스트가 느릴수록 테스트 실행 빈도가 낮아질 수 있기 때문에 효과적임

예제 코드 (가상 시간 활용)
```kotlin

class PlaygroundTest {
    @Test
    fun testDelay() = runTest {
        val startTime = System.currentTimeMillis()
        delay(20.seconds)
        println(System.currentTimeMillis() - startTime) // 수 ms 내로 실행됨
    }
}
```

- runTest는 단일 스레드에서 동기 실행됨. 자식 코루틴의 실행 순서를 보장하려면 delay, yield 등 일시중단 포인트를 명확히 지정해야 함  
- 가상 시계(TestCoroutineScheduler)의 runCurrent(), advanceUntilIdle() 등으로 예약된 코루틴 실행을 제어할 수 있음

예제 코드 (가상 시계 활용)
```kotlin
@OptIn(ExperimentalCoroutinesApi::class)
@Test
fun testDelay() = runTest {
    var x = 0
    launch {
        delay(500.milliseconds)
        x++
        launch {
            x++
            delay(1.seconds)
        }
        println(currentTime) // 0
        delay(600.milliseconds)
        assertEquals(1, x)
        println(currentTime) // 600
        delay(506.milliseconds)
        assertEquals(2, x)
        println(currentTime) // 1100
    }
}
```

예제 코드 (advanceUntilIdle 활용)
```kotlin
@OptIn(ExperimentalCoroutinesApi::class)
@Test
fun testDelay() = runTest {
    var x = 0
    launch {
        x++
        launch { x++ }
    }
    launch {
        x++
        delay(200.milliseconds)
    }
    runCurrent()
    assertEquals(2, x)
    advanceUntilIdle()
    assertEquals(3, x)
}
```

- 테스트 가능한 코드로 만들려면 디스패처를 파라미터로 받을 수 있게 설계하는 것이 바람직함

---

### 18.5.2 Turbine으로 플로우 테스트

- 플로우 기반 코드의 테스트에서는 runTest + toList 등을 통해 원소를 모아 검증할 수 있음
- 복잡한 플로우, 무한/비동기 스트림, 불변성 검증에는 Turbine 라이브러리를 활용하는 것이 효과적임
- Turbine의 test 확장 함수를 사용하면 awaitItem, awaitComplete, awaitError 등으로 배출 순서/완료/에러를 세밀하게 검증할 수 있음

예제 코드 (Turbine 기본 사용)
```kotlin
val myFlow = flow {
    emit(1)
    emit(2)
    emit(3)
}

@Test
fun doTest() = runTest {
    myFlow.test {
        assertEquals(1, awaitItem())
        assertEquals(2, awaitItem())
        assertEquals(3, awaitItem())
        awaitComplete()
    }
}
```

- Turbine은 여러 플로우의 결합, 시스템 일부를 대체하는 객체 생성 등 고급 테스트 기능도 제공함  
- 공식 문서(https://github.com/cashapp/turbine)에서 추가 활용법을 확인할 수 있음

---

요약

- 한 코루틴에만 국한된 예외는 일반 코드처럼 처리 가능함  
- 코루틴 경계를 넘는 예외는 구조적 동시성에 따라 부모/형제에게 전파됨  
- 기본적으로 처리되지 않은 예외가 발생하면 부모/형제 모두 취소되어 구조적 동시성이 강제됨  
- supervisorScope/SupervisorJob을 사용하면 자식 코루틴의 실패가 부모/형제에 전파되지 않음  
- async에서 발생한 예외는 await에서 다시 던져짐  
- 처리되지 않은 예외는 supervisor 또는 계층의 최상단까지 전파되며, CoroutineExceptionHandler에서 최종 처리  
- JVM/Android에서 시스템 예외 핸들러 동작 방식이 다름  
- CoroutineExceptionHandler는 최상단 launch로 생성된 코루틴만 핸들링함  
- 플로우의 예외 처리는 collect의 try-catch 또는 catch 연산자 사용  
- catch는 업스트림 예외만 처리, 다운스트림 예외는 무시됨  
- retry 연산자로 플로우를 재시도할 수 있음  
- runTest를 활용하면 코루틴/플로우 테스트를 빠르게 실행할 수 있음  
- Turbine은 플로우 테스트를 간편하고 세밀하게 해줌
