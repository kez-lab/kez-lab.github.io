---
layout: post
title: "Kotlin in Action 2판 15장 구조화된 동시성"
description: "Kotlin 구조화된 동시성: 코루틴 스코프, 부모-자식 계층, CoroutineContext, 리소스 누수 방지"
date: 2025-07-06 12:00:00 +0900
categories:
    - Kotlin
tags:
    - Kotlin
    - Kotlin in Action
    - Coroutines
    - Structured Concurrency
    - CoroutineContext
---

# 15장 구조화된 동시성

## 15.1 코루틴 스코프가 코루틴 간의 구조를 확립한다

- 구조화된 동시성은 코루틴의 부모-자식 계층을 자동으로 만들어 실행과 취소를 체계적으로 관리 가능한 매커니즘
- 이 구조 덕분에 리소스 누수, 방치된 코루틴, 불필요한 작업을 효과적으로 예방할 수 있으며, 코루틴 컨텍스트와 구조화된 동시성이 긴밀하게 연결되어 있어, 오류나 취소의 경우 각 코루틴을 일일이 추적하지 않아도 안전하게 전파되는 구조를 갖추고 있음
- 따라서 애플리케이션 전반에 구조화된 동시성을 사용하면 계획보다 오래 실행되거나 잊혀진 '제멋대로인' 코루틴은 발생하지 않음

---

### 15.1.1 코루틴 스코프 생성: coroutineScope 함수

- 코루틴 빌더를 사용해 새로운 코루틴을 만들면 자체적인 CoroutineScope가 생성됨  
- 이를 통해 새로운 코루틴을 만들지 않고도 코루틴 스코프를 그룹화할 수 있음
- coroutineScope 함수는 일시 중단 함수로, 새로운 코루틴 스코프를 생성하고 해당 영역 안의 모든 자식 코루틴이 완료될 때까지 기다림
- 그렇기에 아래 예제와 같이 coroutineScope 동시적 작업 분해(여러 코루틴을 활용해 계산을 수행)에 주로 사용됨

```kotlin
suspend fun generateValue(): Int {
    delay(500.milliseconds)
    return Random.nextInt(0, 10)
}
suspend fun computeSum() {
    log("Computing a sum...")
    val sum = coroutineScope {
        val a = async { generateValue() }
        val b = async { generateValue() }
        a.await() + b.await()
    }
    log("Sum is $sum")
}
fun main() = runBlocking { computeSum() }
```

```
[main] Computing a sum...
[main] Sum is 10
```
- computeSum 함수 실행 시 "Computing a sum..." 로그 출력  
- coroutineScope 내에서 async로 두 개의 자식 코루틴을 만들고 각각 500ms 후 랜덤값을 반환  
- a.await(), b.await()로 두 값이 모두 준비될 때까지 기다림  
- coroutineScope 는 결과를 반환하기 전에  모든 자식 코루틴이 완료되길 기다림
- 

---

### 15.1.2 코루틴 스코프를 컴포넌트와 연관시키기: CoroutineScope

- coroutineScope 함수가 작업 분해에 사용되는 반면, 생명주기를 정의하고 코루틴의 시작과 종료를 관리하는 클래스를 만들고 싶을 때는 CoroutineScope 생성자를 사용해 새로운 독자적인 코루틴 스코프를 생성할 수 있음  
- CoroutineScope 생성자는 하나의 파라미터를 받는데, 이는 해당 코루틴 스코프와 연관된 코루틴 컨텍스트로 예를 들어 Dispatcher를 지정할 수 있음
- 기본적으로 CoroutineScope를 디스패처만으로 호출하면 새로운 Job이 자동으로 생성지만 실무에서는 CoroutineScope와 함께 SupervisorJob을 사용하는 것이 좋음(왜 좋은지 궁금)

```kotlin
class ComponentWithScope(dispatcher: CoroutineDispatcher = Dispatchers.Default) {
    private val scope = CoroutineScope(dispatcher + SupervisorJob())
    fun start() {
        log("Starting!")
        scope.launch {
            while (true) {
                delay(500.milliseconds)
                log("Component working!")
            }
        }
        scope.launch {
            log("Doing a one-off task...")
            delay(500.milliseconds)
            log("Task done!")
        }
    }
    fun stop() {
        log("Stopping!")
        scope.cancel()
    }
}
fun main() {
    val c = ComponentWithScope()
    c.start()
    Thread.sleep(2000)
    c.stop()
}
```

```
// 22 [main] Starting!
// 37 [DefaultDispatcher-worker-2 @coroutine#2] Doing a one-off task...
// 544 [DefaultDispatcher-worker-1 @coroutine#2] Task done!
// 544 [DefaultDispatcher-worker-2 @coroutine#1] Component working!
// 1050 [DefaultDispatcher-worker-1 @coroutine#1] Component working!
// 1555 [DefaultDispatcher-worker-1 @coroutine#1] Component working!
// 2039 [main] Stopping!
```
- start를 호출하면 두 개의 코루틴이 실행됨  
- stop을 호출하면 scope.cancel()로 모든 코루틴이 종료됨
- 생명주기를 관리해야하는 컴포넌트를 다루는 프레임워크에서ㅡㄴ 내부적으로 CoroutineScope 함수를 많이 사용

| 함수             | 목적/용도                                                                          | 특징 및 차이점                                         |
|------------------|------------------------------------------------------------------------------------|------------------------------------------------------|
| coroutineScope   | 여러 작업(코루틴)을 동시성으로 실행·분해할 때 사용함                                | - 모든 자식 코루틴이 완료될 때까지 기다림 (일시 중단 함수) <br> - 결과값 계산 및 반환 가능    |
| CoroutineScope   | 코루틴을 클래스 생명주기 등과 연관시키는 스코프(영역) 생성에 사용함                | - 단순히 스코프만 생성하고, 추가 작업을 기다리지 않고 즉시 반환 <br> - 생성한 스코프는 추후에 취소 가능(1.5.2절 참고) |

---

### 15.1.3 GlobalScope의 위험성

- GlobalScope는 구조화된 동시성 계층에 포함되지 않는 전역 코루틴 스코프임  
- 전역 범위에서 시작된 코루틴은 자동으로 취소되지 않으며, 생명주기에 대한 개념도 없음
- 따라서 GlobalScope를 사용하면 리소스 누수가 발생하거나, 필요하지 않은 작업이 계속 실행되면서 시스템 자원이 낭비될 가능성이 큼

```kotlin
fun main() {
    runBlocking {
        GlobalScope.launch {
            delay(1000.milliseconds)
            launch {
                delay(250.milliseconds)
                log("Grandchild done")
            }
            log("Child 1 done!")
        }
        GlobalScope.launch {
            delay(500.milliseconds)
            log("Child 2 done!")
        }
        log("Parent done!")
    }
}
 
// 28 [main @coroutine#1] Parent done!

```
- GlobalScope로 시작된 launch들은 runBlocking의 자식이 아니므로, 프로그램이 빠르게 종료되면 자식 코루틴이 끝나기도 전에 로그가 출력되지 않을 수 있음
- 따라서 코루틴 빌더나 coroutineScope 함수를 사용해 더 적합한 스코프(영역)에서 코루틴을 시작하는 것이 좋음

---

### 15.1.4 코루틴 컨텍스트와 구조화된 동시성

- 코루틴 컨텍스트는 구조화된 동시성과 밀접한 관련이 있으며, 코루틴 간의 부모-자식 계층을 따라 상속됨  
- 자식 코루틴은 부모의 컨텍스트를 상속받고, 새로운 Job 객체가 생성되어 부모의 Job 객체의 자식이 됨  
- 예제와 같이 코루틴 컨텍스트의 job, job.parent, job.children 속성으로 계층 구조를 확인할 수 있음

```kotlin
import kotlinx.coroutines.job

fun main() = runBlocking(CoroutineName("A")) {
   log("A's job: ${coroutineContext.job}")
   launch(CoroutineName("B")) {
      log("B's job: ${coroutineContext.job}")
      log("B's parent: ${coroutineContext.job.parent}")
   }
   log("A's children: ${coroutineContext.job.children.toList()}")
}


// 0 [main @A#1] A's job: "A#1":BlockingCoroutine{Active}@41
// 10 [main @A#1] A's children: "B#2":StandaloneCoroutine{Active}@24
// 11 [main @B#2] B's job: "B#2":StandaloneCoroutine{Active}@24
// 11 [main @B#2] B's parent: "A#1":BlockingCoroutine{Completing}@41
```
- 각 코루틴의 컨텍스트에서 job, parent, children 등 계층 관계를 확인할 수 있음
- 결론적으로 디스패처를 명시하지 않고 새로운 코루틴을 시작하면 Dispatchers.Default가 아니라, 부모 코루틴의 디스패처에서 실행된 다는 것을 알 수 있음

---

## 15.2 취소

- 코루틴의 취소는 코드가 모두 끝나기 전에 실행을 중단하는 것임  
- 실제 애플리케이션에서 계산, 네트워크 등 여러 작업을 수행할 때 취소 기능은 필수임  
- 또한 취소는 불필요한 작업과 리소스 낭비, 메모리 누수를 막고 오류 처리도 쉽게 해줌  
- 예시로 들어 사용자가 화면을 떠나면(약간 애매한데 화면이 파괴되면으로 보는 것이 알맞음) 실행 중인 코루틴을 바로 중단해야 함

### 15.2.1 취소 촉발

- launch, async 등 코루틴 빌더가 반환하는 Job, Deferred 객체의 cancel() 메서드를 호출해 해당 코루틴의 취소를 촉발할 수 있음  
- 코루틴 스코프의 컨텍스트에도 Job이 있으므로, 스코프 전체를 취소할 수도 있음

```kotlin
fun main() {
    runBlocking {
        val launchedJob = launch {
            log("I'm launched!")
            delay(1000.milliseconds)
            log("I'm done!")
        }
        val asyncDeferred = async {
            log("I'm async")
            delay(1000.milliseconds)
            log("I'm done!")
        }
        delay(200.milliseconds)
        launchedJob.cancel()
        asyncDeferred.cancel()
    }
}
```

```
[main @coroutine#2] Im launched!
[main @coroutine#3] Im async
```
- 200ms 후 두 코루틴 모두 취소되므로 “Im done!”은 출력되지 않음  
- launch, async가 반환하는 객체를 통해 직접 취소를 관리함

---

### 15.2.2 시간 제한이 초과된 후 자동으로 취소 호출

- Kotlin 코루틴 라이브러리는 withTimeout, withTimeoutOrNull 함수를 제공하며, 함수들은 지정한 시간 내에 블록이 완료되지 않으면 코루틴을 자동으로 취소한다는 특징을 가지고 있음
- withTimeout은 TimeoutCancellationException 예외를 발생시키고, withTimeoutOrNull은 null을 반환함

```kotlin

suspend fun calculateSomething(): Int {
   delay(3.seconds)
   return 2 + 2
}

fun main() = runBlocking {
   val quickResult = withTimeoutOrNull(500.milliseconds) {
       calculateSomething()
   }
   println(quickResult)
   // null
   val slowResult = withTimeoutOrNull(5.seconds) {
       calculateSomething()
   }
   println(slowResult)
   // 4
}
```
- 첫 호출은 500ms 내에 결과가 준비되지 않아 취소되고 null이 반환됨  
- 두 번째 호출은 5초 내에 결과(4)를 정상 반환함

> **참고:** withTimeout이 발생시키는 TimeoutCancellationException을 잡지 않으면 의도와 다르게 코루틴 전체가 종료될 수 있음  
> 안전하게 처리하려면 withTimeoutOrNull을 쓰거나 try-catch로 TimeoutCancellationException에 대한 예외를 잡아야 함

---

### 15.2.3 취소는 모든 자식 코루틴에게 전파된다

- 코루틴 계층의 부모 Job이 취소되면 모든 자식 코루틴도 자동으로 취소됨  
- 중첩된 launch가 여러 계층이라도, 최상위 코루틴의 cancel()만 호출하면 하위 모든 코루틴이 정리됨
- 즉 취소 하위 전파 매커니즘은 처음에 얘기한 제멋대로인 코루틴이 남지 않도록 할 수 있는 장치임

```kotlin
fun main() = runBlocking {
    val job = launch {
        launch {
            launch {
                launch {
                    log("I'm started")
                    delay(500.milliseconds)
                    log("I'm done!")
                }
            }
        }
    }
    delay(200.milliseconds)
    job.cancel()
}
 
// 0 [main @coroutine#5] I'm started

```
- job.cancel() 호출로 모든 하위 launch가 일괄적으로 취소됨  
- “I'm done!” 로그는 출력되지 않음

---

### 15.2.4 취소된 코루틴은 특수한 지점에서 CancellationException을 던진다

- 취소 메커니즘은 일시 중단(suspension) 지점에서 CancellationException을 던짐  
- delay, yield, withTimeout 같은 suspend 함수(중단점)는 일시 중단과 동시에 취소를 감지해서 예외를 던질 수 있음

```kotlin
coroutineScope {
    log("A")
    delay(500.milliseconds) // 이 지점에서 함수가 취소될 수 있음
    log("B")
    log("C")
}
```
- delay(500.milliseconds)에서 취소가 발생하면 “A”까지만 출력되고 “B”, “C”는 출력되지 않음

- 예외를 잘못 처리하면 무한 반복 등 문제가 발생함  (아래 예제)
- 예외 핸들러에서 Exception을 catch할 때, CancellationException은 반드시 다시 던져야 정상적으로 취소가 전파됨 (아주 중요!)

```kotlin
suspend fun doWork() {
    delay(500.milliseconds)
    throw UnsupportedOperationException("Didn't work!")
}
fun main() {
    runBlocking {
        withTimeoutOrNull(2.seconds) {
            while (true) {
                try {
                    doWork()
                } catch (e: Exception) {
                    println("Oops: ${e.message}")
                }
            }
        }
    }
}
```
- CancellationException도 catch되면 취소가 전파되지 않아 무한 루프가 발생하는 상황을 보여주는 예제
- Exception 대신 UnsupportedOperationException만 catch하거나, catch 블록에서 if (e is CancellationException) throw e를 추가해야 함

---

### 15.2.5 취소는 협력적이다

- 코틀린 코루틴은 기본적으로 **협력적 취소(cooperative cancellation)**를 지원함  
- 즉, 코루틴 내에서 명시적으로 일시 중단(suspend) 지점을 만들지 않으면, 취소 요청이 와도 작업이 즉시 멈추지 않음
- 직접 작성한 suspend 함수 안에 delay, yield 등 취소 지점이 없으면 코루틴은 끝까지 실행됨(이전에 헷갈렸던 코루틴 로그 순서와 비슷한 결)

```kotlin
suspend fun doCpuHeavyWork(): Int {
    log("I'm doing work!")
    var counter = 0
    val startTime = System.currentTimeMillis()
    while (System.currentTimeMillis() < startTime + 500) {
        counter++
    }
    return counter
}
fun main() {
    runBlocking {
        val myJob = launch {
            repeat(5) {
                doCpuHeavyWork()
            }
        }
        delay(600.milliseconds)
        myJob.cancel()
    }
}

30 [main @coroutine#2] I'm doing work!
535 [main @coroutine#2] I'm doing work!
1036 [main @coroutine#2] I'm doing work!
1537 [main @coroutine#2] I'm doing work!
2042 [main @coroutine#2] I'm doing work!
```
- doCpuHeavyWork 함수 내부에는 일시 중단 지점이 없으므로, 취소 요청이 와도 모든 반복이 끝날 때까지 코루틴이 멈추지 않음  
- 취소는 suspend 함수 내부에 일시 중단 지점을 도입해야 제대로 취소됨

---

### 15.2.6 코루틴이 취소됐는지 확인

- 코루틴이 취소됐는지 확인할 때는 `isActive` 속성을 사용하거나, 직접 반복문 안에서 해당 값을 체크하여 탈출할 수 있음  
- `ensureActive()`를 호출하면 코루틴이 비활성화 상태일 때 CancellationException을 던져 작업을 바로 멈춤

```kotlin
val myJob = launch {
    repeat(5) {
        doCpuHeavyWork()
        if (!isActive) return@launch
    }
}
```
또는
```kotlin
val myJob = launch {
    repeat(5) {
        doCpuHeavyWork()
        ensureActive()
    }
}
```

#### 취소를 위한 유틸리티

- `isActive` 속성: 현재 코루틴이 활성 상태인지 확인할 수 있음  
- `ensureActive()` 함수: 취소된 경우 바로 CancellationException을 던짐  
- `yield()` 함수: 일시 중단과 취소 지점 모두를 제공하며, 다른 코루틴에 실행 기회를 넘김
---

### 15.2.7 yield 함수

- `yield()` 함수는 일시 중단 지점을 제공할 뿐 아니라, 같은 디스패처 내에서 다른 코루틴에게 실행 기회를 넘기는 역할도 함  
- 여러 코루틴이 같은 자원을 점유하고 있다면 yield를 통해 작업이 공평하게 나누어짐

```kotlin
import kotlinx.coroutines.*

suspend fun doCpuHeavyWork(): Int {
    var counter = 0
    val startTime = System.currentTimeMillis()
    while (System.currentTimeMillis() < startTime + 500) {
        counter++
        yield()
    }
    return counter
}
fun main() {
    runBlocking {
        launch {
            repeat(3) { doCpuHeavyWork() }
        }
        launch {
            repeat(3) { doCpuHeavyWork() }
        }
    }
}

0 [main @coroutine#2] I'm doing work!
559 [main @coroutine#3] I'm doing work!
1062 [main @coroutine#2] I'm doing work!
1634 [main @coroutine#3] I'm doing work!
2208 [main @coroutine#2] I'm doing work!
2734 [main @coroutine#3] I'm doing work!
```

- 예제와 같이 yield를 사용하면 두 코루틴이 번갈아가며 작업을 처리함  
- delay 없이 while 루프만 있을 때는 한 코루틴이 모두 끝나야 다음 코루틴이 시작됨

---

### 15.2.8 리소스를 얻을 때 취소를 염두에 두기

- 실제 코드에서는 데이터베이스 연결 등 외부 리소스를 코루틴에서 사용할 일이 많음  
- 코루틴이 취소될 때 리소스 누수가 발생하지 않도록 finally 블록이나 use 함수를 사용해 반드시 정리해야 함

```kotlin
class DatabaseConnection : AutoCloseable {
    fun write(s: String) = println("writing $s!")
    override fun close() = println("Closing!")
}

val dbTask = launch {
    val db = DatabaseConnection()
    try {
        delay(500.milliseconds)
        db.write("I love coroutines!")
    } finally {
        db.close()
    }
}
```
또는
```kotlin
val dbTask = launch {
    DatabaseConnection().use {
        delay(500.milliseconds)
        it.write("I love coroutines!")
    }
}
```
- 코루틴이 취소되더라도 close()가 반드시 호출되어 리소스 누수를 막음

---

### 15.2.9 프레임워크가 여러분 대신 취소를 할 수 있다

- 실제 애플리케이션에서는 프레임워크가 코루틴 스코프와 취소를 관리하는 경우가 많음  
- 예를 들어 안드로이드 ViewModel의 viewModelScope는 화면이 파괴되면 자동으로 취소됨

```kotlin
class MyViewModel : ViewModel() {
    init {
        viewModelScope.launch {
            while (true) {
                println("Tick!")
                delay(1000.milliseconds)
            }
        }
    }
}
```

- Ktor 서버 프레임워크에서도 요청 단위의 코루틴 스코프가 암시적으로 제공되며, 클라이언트 연결이 끊기면 스코프가 취소됨

```kotlin
routing {
    get("/") {
        launch {
            println("I'm doing some background work!")
            delay(5000.milliseconds)
            println("I'm done")
        }
    }
}
```
- 클라이언트가 5초 안에 연결을 끊으면 "I'm done"이 출력되지 않음  
- Application 스코프를 사용하면 앱 전체 생명주기에 맞춘 코루틴 실행도 가능함

---

