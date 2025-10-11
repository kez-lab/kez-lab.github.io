---
layout: post
title: "Kotlin in Action 2판 14장 코루틴과 플로우를 활용한 동시성 프로그래밍"
date: 2025-06-29 12:00:00 +0900
categories: [Kotlin, Kotlin In Action 2, 코틀린 인 액션 2판]
tags: [Kotlin, Kotlin in Action, Coroutine, Flow, Concurrency]
---

# 14장 코루틴과 플로우를 활용한 동시성 프로그래밍

## 이 장에서 다루는 내용
- 코루틴 빌더
- Dispatcher(디스패처)

---
#### 14.6 코루틴의 세계로 들어가기: 코루틴 빌더

- 코루틴의 명확한 정의: 코루틴은 일시 중단 가능한 계산의 인스턴스로 다른 코루틴들과 동시에(혹은 심지어 병렬로) 실행될 수 있는 코드 블록
- 코루틴을 생성할 때 코루틴 빌더 함수 중 하나를 사용해야 함
  - runBlocking: 블로킹 코드와 일시 중단 함수의 세계를 연결할 때 사용함
  - launch: 값을 반환하지 않는 새로운 코루틴을 시작할 때 사용함
  - async: 비동기적으로 값을 계산할 때 사용함

---

#### 14.6.1 일반 코드에서 코루틴의 세계로: runBlocking 함수

- 일반 블로킹 코드를 runBlocking 코루틴 빌더 함수를 통해 호출 시 일시 중단 함수로 호출 가능
- runBlocking은 새 코루틴을 생성하고 실행하며, 해당 코루틴이 완료될 때까지 현재 스레드를 블록 함
- 전달된 코드 블록 내에서는 일시 중단 함수를 호출할 수 있음

```kotlin
import kotlinx.coroutines.*
import kotlin.time.Duration.Companion.milliseconds

suspend fun doSomethingSlowly() {
    delay(500.milliseconds)
    println("I'm done")
}

fun main() = runBlocking {
    doSomethingSlowly()
}
```
- runBlocking 블록 내에서는 추가 자식 코루틴을 얼마든지 시작할 수 있고,  이 자식 코루틴들은 다른 스레드를 더 이상 블록시키지 않음
- 자식 코루틴을 시작하는데에는 launch 함수를 활용해서 가능함

---

#### 14.6.2 발사 후 망각 코루틴 생성: launch 함수

- launch 함수는 새로운 자식 코루틴을 시작하는 데 사용
- 일반적으로 "fire-and-forget" 시나리오에 사용되며, 어떤 코드를 실행하지만 결과 값을 기다리지 않을 때 적합


```kotlin
// runBlocking이 오직 하나의 스레드만 블로킹한다는 주장을 테스트하는 예제
private var zeroTime = System.currentTimeMillis()
fun log(message: Any?) =
    println("${System.currentTimeMillis() - zeroTime} [${Thread.currentThread().name}] $message")

fun main() = runBlocking {
    log("The first, parent, coroutine starts")
    launch {
        log("The second coroutine starts and is ready to be suspended")
        delay(100.milliseconds)
        log("The second coroutine is resumed")
    }
    launch {
        log("The third coroutine can run in the meantime")
    }
    log("The first coroutine has launched two more coroutines")
}

// 출력
36 [main @coroutine#1] The first, parent, coroutine starts
40 [main @coroutine#1] The first coroutine has launched two more coroutines
42 [main @coroutine#2] The second coroutine starts and is ready to be suspended
47 [main @coroutine#3] The third coroutine can run in the meantime
149 [main @coroutine#2] The second coroutine is resumed
```
![image](https://github.com/user-attachments/assets/0a29b756-345e-4a33-a2d0-e22e99acfd2c)

- 이 코드의 모든 코루틴은 한 스레드(main)에서 실행됨
- 코루틴 #2는 delay에서 일시 중단되고, 그동안 main 스레드는 코루틴 #3의 작업을 수행
- launch는 부수효과를 일으키는 작업, 예를 들어 파일이나 데이터베이스에 쓰기 등에 적합
- launch는 Job(코루틴 핸들) 타입 객체를 반환하며, 코루틴 실행 제어에 사용 가능(예: 취소)

---

#### 14.6.3 대기 가능한 연산: async 빌더

- async 빌더는 비동기 계산을 수행할 때 사용
- launch와 마찬가지로 async에도 실행할 코드를 코루틴으로 전달할 수 있음, 하지만 async의 반환 타입은 launch와 달리 Deferred<T>
- Deferred 객체에서 await 일시 중단 함수를 호출하여 결과를 기다릴 수 있음

```kotlin
// 두 숫자를 비동기적으로 계산하는 예제
suspend fun slowlyAddNumbers(a: Int, b: Int): Int {
    log("waiting a bit before calculating $a + $b")
    delay(100.milliseconds * a)
    return a + b
}
fun main() = runBlocking {
    log("Starting the async computation")
    val myFirstDeferred = async { slowlyAddNumbers(2, 2) }
    val mySecondDeferred = async { slowlyAddNumbers(4, 4) }
    log("Waiting for the deferred value to be available")
    log("The first result: ${myFirstDeferred.await()}")
    log("The second result: ${mySecondDeferred.await()}")
}

// 출력
• [main @coroutine#1] Starting the async computation
4 [main @coroutine#1] Waiting for the deferred value to be available
8 [main @coroutine#2] Waiting a bit before calculating 2 + 2
9 [main @coroutine#3] Waiting a bit before calculating 4 + 4
213 [main @coroutine#1] The first result: 4
415 [main @coroutine#1] The second result: 8
```
![image](https://github.com/user-attachments/assets/ce2bbf8c-6033-4252-adbb-6d201207fe4f)

- async 호출마다 새로운 코루틴이 시작되고, await를 호출하면 해당 Deferred 값이 사용 가능해질 때까지 기다릴 수 있음
- Deferred는 미래에 결과가 준비될 것이라는 약속(Future/Promise와 동일 개념)
- 즉 순차적인 코드에서는 async/await가 필요없고, 여러 작업을 동시에 시작하고 결과를 기다릴 때만 사용 하는 용도의 함수


| 빌더         | 반환값            | 용도 설명                                |
|--------------|-------------------|------------------------------------------|
| runBlocking  | 람다가 계산한 값   | 블로킹 코드와 논블로킹 코드의 연결         |
| launch       | Job               | 부수 효과가 있는 시작-후-망각 작업         |
| async        | Deferred<T>       | 비동기로 값을 계산하고 기다릴 수 있는 작업 |

---

#### 14.7 어디서 코드를 실행할지 정하기: 디스패처

- 코루틴의 디스패처(Dispatcher)는 코루틴이 어떤 스레드나 스레드 풀에서 실행될지 결정하는 역할
- 부모 코루틴으로부터 디스패처를 상속받기 때문에 명시적으로 지정하지 않아도 되지만, 필요하다면 다음과 같이 여러 디스패처를 선택할 수 있음

---

##### 14.7.1 디스패처 선택

- **Dispatchers.Default:**  
  - 가장 일반적인 디스패처로, CPU 코어 수만큼의 스레드 풀 기반
  - 일반 연산이나 CPU 집약적 작업에 적합
  - 단일 스레드에서도 수천 개 코루틴 처리 가능

- **Dispatchers.Main:**  
  - UI 프레임워크(자바FX, Swing, Android 등)에서 UI 작업을 메인 스레드에서 실행할 때 사용
  - 실제 값은 프레임워크마다 다름
  - 각 플랫폼에서 별도 아티팩트로 구현 제공(예: kotlinx-coroutines-android)

- **Dispatchers.IO:**  
  - 블로킹 IO(데이터베이스, 파일, 네트워크 등) 작업에 적합
  - 자동 확장되는 스레드 풀에서 실행
  - CPU 집약적이지 않은 작업(API 응답 대기)에 사용

- **Dispatchers.Unconfined, limitedParallelism(n):**  
  - 특별한 경우에 사용.  
  - Unconfined는 스레드 제약 없음(즉시 실행)
  - limitedParallelism은 병렬성 수를 사용자가 제한할 때 사용
 
![image](https://github.com/user-attachments/assets/d687e263-47cd-448e-ac2f-bb8a4f3df41d)


| 디스패처              | 스레드 개수                | 쓰임새                                |
|----------------------|----------------------------|---------------------------------------|
| Dispatchers.Default  | CPU 코어 수                | 일반 연산, CPU 집약적 작업             |
| Dispatchers.Main     | 1                          | UI 스레드에서 실행                    |
| Dispatchers.IO       | 64 + CPU 코어 수(최대 64)  | 블로킹 IO 작업, 파일, 네트워크 작업     |
| Dispatchers.Unconfined | 제한 없음                 | 즉시 스케줄링(특수 용도)              |
| limitedParallelism(n)| 사용자 지정                | 병렬성 제한이 필요한 커스텀 시나리오    |

- 디스패처를 지정하지 않으면 부모 코루틴의 디스패처에서 실행됨.

---

##### 14.7.2 코루틴 빌더에 디스패처 전달

runBlocking, launch, async 등 모든 코루틴 빌더는 디스패처를 명시적으로 인자로 전달할 수 있음

```kotlin
fun main() {
    runBlocking {
        log("Doing some work")
        launch(Dispatchers.Default) {
            log("Doing some background work")
        }
    }
}
// 예시 출력:
// 26 [main @coroutine#1] Doing some work
// 33 [DefaultDispatcher-worker-1 @coroutine#2] Doing some background work
```
- launch(Dispatchers.Default)로 지정하면 해당 코루틴은 Default 스레드 풀에서 실행됨

---

##### 14.7.3 withContext를 사용해 코루틴 안에서 디스패처 바꾸기

- 코루틴 내에서 특정 부분만 다른 디스패처(스레드)에서 실행하려면 withContext 사용
- 전형적으로 백그라운드 작업 후, 결과를 UI 스레드에서 안전하게 처리하는 패턴에서 사용

```kotlin
launch(Dispatchers.Default) {
    val result = performBackgroundOperation()
    withContext(Dispatchers.Main) {
        updateUI(result)
    }
}
```

---

##### 14.7.4 코루틴과 디스패처는 스레드 안전성 문제에 대한 마법이 아님

- Dispatchers.Default, Dispatchers.IO는 다중 스레드 디스패처임
- 한 코루틴은 항상 순차적으로 실행되어 데이터 경합 문제가 없음
- 여러 코루틴이 동일 변수에 접근/변경 시 스레드 안전성 문제가 발생할 수 있음(레이스 컨디션)

```kotlin
// 예시1: 한 코루틴만 값을 변경하면 안전함

fun main() {
    runBlocking {
        launch(Dispatchers.Default) {
            var x = 0
            repeat(10_000) {
                x++
            }
            println(x)
        }
    }
}
// 10,000
```
```kotlin
// 예시2: 여러 코루틴이 동일 변수 변경 시 레이스 컨디션 발생
fun main() {
    runBlocking {
        var x = 0
        repeat(10_000) {
            launch(Dispatchers.Default) {
                x++
            }
        }
        delay(1.seconds)
        println(x)
    }
}
// 예) 9,916 (값이 항상 10,000이 아님)
```
해결법: Mutex 사용
```kotlin
fun main() = runBlocking {
    val mutex = Mutex()
    var x = 0
    repeat(10_000) {
        launch(Dispatchers.Default) {
            mutex.withLock {
                x++
            }
        }
    }
    delay(1.seconds)
    println(x)
}
// 10,000
```
- AtomicInteger, ConcurrentHashMap 등 스레드 안전 데이터 구조 사용도 가능

---

#### 14.8 코루틴은 코루틴 컨텍스트에 추가적인 정보를 담고 있음

- 코루틴 빌더 함수와 withContext 함수에 전달하는 파라미터는 CoroutineDispatcher가 아니라 CoroutineContext임
- CoroutineContext는 여러 요소로 이루어진 집합으로 이 요소 중 하나가 코루틴의 실행 스레드를 결정하는 Dispatcher
- CoroutineContext에는 보통 코루틴의 생명주기와 취소를 관리하는 Job 객체, CoroutineName, CoroutineExceptionHandler 같은 추가 메타데이터도 포함 가능


```kotlin
import kotlinx.coroutines.*
suspend fun introspect() {
    // 코루틴의 현재 CoroutineContext는 언제든지 일시 중단 함수 안에서 coroutineContext 속성으로 확인 가능
    log(coroutineContext)
}

fun main() {
    runBlocking {
        introspect()
    }
}
// 예시 출력:
// 25 [main @coroutine#1] [CoroutineId(1), "coroutine#1":BlockingCoroutine{Active}@610694f1, BlockingEventLoop@43814d18]
```

- 코루틴 빌더나 withContext 함수에 인자를 전달하면, 자식 코루틴의 Context에서 해당 요소만 덮어씀
- 여러 파라미터를 한 번에 덮어쓰려면 + 연산자를 사용하여 CoroutineContext 객체를 결합함

예시:
```kotlin
fun main() {
    runBlocking(Dispatchers.IO + CoroutineName("Coolroutine")) {
        introspect()
    }
}
// 예시 출력:
// 27 [DefaultDispatcher-worker-1 @Coolroutine#1] [CoroutineName(Coolroutine), CoroutineId(1), "Coolroutine#1":BlockingCoroutine{Active}@d115c9f, Dispatchers.IO]
```

- runBlocking에 전달한 인자는 자식 코루틴의 Context의 원소를 덮어씀
- 예를 들어, Dispatchers.IO를 전달하면 runBlocking의 BlockingEventLoop 디스패처 대신 사용됨
- CoroutineName("Coolroutine")을 추가하면 코루틴 이름이 설정됨

---

#### 요약

- runBlocking, launch, async로 새 코루틴 생성
- Dispatcher는 코루틴 실행 스레드/스레드 풀 결정
  - Default: 일반 용도, Main: UI 스레드, IO: 블로킹 IO
- Default/IO는 다중 스레드 디스패처이므로 레이스 컨디션 주의
- withContext로 코루틴 실행 중 Dispatcher 전환 가능
- CoroutineContext에는 Dispatcher, Name, Job 등 다양한 정보 포함


---
