---
layout: post
title: "Kotlin in Action 2판 14장 코루틴과 플로우를 활용한 동시성 프로그래밍"
date: 2025-06-22 12:00:00 +0900
categories: [Kotlin, Kotlin In Action 2, 코틀린 인 액션 2판]
tags: [Kotlin, Kotlin in Action, Coroutine, Flow, Concurrency]
---

# 14장 코루틴과 플로우를 활용한 동시성 프로그래밍

## 이 장에서 다루는 내용
- 동시성·병렬성 개념
- 일시중단 함수
- 코루틴과 기존 동시성 모델(콜백, 퓨처, 리액티브)과의 비교
- 코루틴 호출 구조

---
## 14.1 동시성과 병렬성

- **동시성**: 여러 작업을 동시에 실행하는 것. 반드시 물리적으로 동시에 실행되는 것이 아니라, 하나의 코어에서도 작업 전환을 통해 동시성을 구현할 수 있음.
- **병렬성**: 여러 작업을 여러 CPU 코어에서 물리적으로 동시에 실행하는 것.
- 코틀린 코루틴은 동시성, 병렬성 모두 지원함.

---

## 14.2 코틀린의 동시성 처리 방식: 일시중단 함수와 코루틴

- **코루틴**: 코틀린의 강력한 특징으로 비동기적으로 실행되는 논블록킹 동시성 코드를 우아하게 작성가능
- 구조화된 동시성 작업과 생명주기 관리 기능도 있음
- 코루틴은 스레드를 블록시키지 않고도 일시적으로 실행을 멈췄다가 재개할 수 있음

---

## 14.3 스레드와 코루틴 비교

#### 스레드는 동시성/병렬성을 위한 전통적인 추상화

- 자바에서처럼 코틀린에서도 스레드는 서로 독립적으로 동시에 실행되는 코드 블록을 지정할 수 있음.
- 코틀린 표준 라이브러리의 `thread` 함수를 사용하면 새 스레드를 쉽게 시작할 수 있음.
``` kotlin
import kotlin.concurrent.thread

fun main() {
    println("I'm on ${Thread.currentThread().name}") // 메인 스레드
    thread {
        println("And I'm on ${Thread.currentThread().name}") // 새 스레드
    }
}
```
- 스레드는 블로킹 작업(예: 네트워크 대기) 동안 자원을 낭비하게 됨
- JVM에서 생성하는 각 스레드는 OS가 관리하는 시스템 스레드로 생성·관리 비용이 높고,최신 시스템에서도 수천 개까지만 효율적으로 관리 가능
- 스레드는 작업(예시: 네트워크 요청)이 끝날 때까지 블록되는 특징을 가지고 있음  
  - 즉 대기 중인 동안 다른 의미 있는 작업을 하지 못하고 시스템 자원만 차지함

#### 코루틴의 특징

- 코루틴은 스레드의 경량 추상화로, 일시 중단 가능한 계산을 나타냄
- 초경량 추상화로, 노트북에서도 10만 개 이상의 코루틴을 실행 가능함
    - 생성·관리 비용이 매우 저렴하기 때문에 미세한 작업이나 아주 짧게 실행하는 작업에도 적합
- 코루틴은 시스템 자원을 블록시키지 않고 실행을 일시 중단할 수 있고, 나중에 멈춘 지점부터 다시 재개 가능함
  - 네트워크나 IO 대기 등 비동기 작업에서 매우 효율적임
- 구조화된 동시성 개념을 통해 취소 및 오류 처리를 위한 매커니즘을 제공
---

## 14.4 잠시 멈출 수 있는 함수: 일시중단 함수

- 코루틴의 가장 큰 특징은 **순차적으로 보이는 코드**에서 넌블로킹 비동기 처리가 가능하다는 점

- 예시: 블로킹 코드
    ``` kotlin
    fun login(credentials: Credentials): UserID
    fun loadUserData(userID: UserID): UserData
    fun showData(data: UserData)

    fun showUserInfo(credentials: Credentials) {
        val userID = login(credentials)
        val userData = loadUserData(userID)
        showData(userData)
    }
    ```
- 위 코드는 네트워크 대기 동안 스레드를 블록시켜 자원을 낭비함

- **코루틴 기반 일시중단 함수**는 다음과 같이 순차적 코드를 유지하면서도 넌블로킹 비동기를 구현할 수 있음
    ``` kotlin
    suspend fun login(credentials: Credentials): UserID
    suspend fun loadUserData(userID: UserID): UserData
    fun showData(data: UserData)

    suspend fun showUserInfo(credentials: Credentials) {
        val userID = login(credentials)
        val userData = loadUserData(userID)
        showData(userData)
    }
    ```
- `suspend` 키워드는 함수가 일시적으로 실행을 멈추고 재개될 수 있음을 나타내며 이때 스레드를 블록시키지 않음
- 대신 함수 실행이 중단되면 다른 코드가 같은 스레드에서 실행 가능
- 실제로 네트워크 라이브러리(Ktor HTTP, Retrofit, OkHttp 등)도 코루틴과 함께 동작하는 API를 제공함

---

## 14.5 코루틴과 다른 동시성 접근 방식 비교

- **콜백 기반**
    ``` kotlin
    fun loginAsync(credentials: Credentials, callback: (UserID) -> Unit)
    fun loadUserDataAsync(userID: UserID, callback: (UserData) -> Unit)
    fun showData(data: UserData)

    fun showUserInfo(credentials: Credentials) {
        loginAsync(credentials) { userID ->
            loadUserDataAsync(userID) { userData ->
                showData(userData)
            }
        }
    }
    ```
    - 콜백 중첩이 발생(콜백 지옥), 가독성과 유지보수성이 떨어짐.

- **퓨처(CompletableFuture) 기반**
    ``` kotlin
    fun loginAsync(credentials: Credentials): CompletableFuture<UserID>
    fun loadUserDataAsync(userID: UserID): CompletableFuture<UserData>
    fun showData(data: UserData)

    fun showUserInfo(credentials: Credentials) {
        loginAsync(credentials)
            .thenCompose { loadUserDataAsync(it) }
            .thenAccept { showData(it) }
    }
    ```
    - 콜백 중첩은 줄어들지만, 새로운 연산자를 익혀야 하고 반환 타입 변경 필요.

- **반응형 스트림(RxJava 등) 기반**
    ``` kotlin
    fun login(credentials: Credentials): Single<UserID>
    fun loadUserData(userID: UserID): Single<UserData>
    fun showData(data: UserData)

    fun showUserInfo(credentials: Credentials) {
        login(credentials)
            .flatMap { loadUserData(it) }
            .doOnSuccess { showData(it) }
            .subscribe()
    }
    ```
    - 역시 타입이 복잡해지고, 연산자 개념을 익혀야 함.

- **코루틴 기반**은 기존 함수에 `suspend`만 붙이면 되고, 코드는 순차적이며 스레드를 블록시키는 단점을 피할 수 있음

---
## 14.5.1 일시 중단 함수 호출

- **일시 중단 함수**는 실행을 일시적으로 멈출 수 있기 때문에, 임의의 위치에서 호출할 수 없음.
- 반드시 **코루틴이나 다른 일시 중단 함수** 내에서만 호출 가능함.
    - 이는 '함수가 실행을 일시 중단할 수 있다면 그 함수를 호출하는 함수의 실행도 잠재적으로 일시중단 될 수 있음' 이라는 논리와 일치함

예시:
``` kotlin
suspend fun showUserInfo(credentials: Credentials) {
    val userID: UserID = login(credentials)
    val userData: UserData = loadUserData(userID)
    showData(userData)
}
```

- **일반 함수에서 일시 중단 함수 호출 시 컴파일 오류**
    ``` kotlin
    suspend fun mySuspendingFunction() {}

    fun main() {
        mySuspendingFunction() // Error: Suspend function should be called only from a coroutine or another suspend function
    }
    ```

- **일시 중단 함수 호출 방법**
    1. 가장 단순한 방법: `main` 함수 자체를 `suspend`로 선언
        ``` kotlin
        suspend fun main() {
            // 일시 중단 함수 호출 가능
        }
        ```
        - 다만, 안드로이드 등 프레임워크에서는 메인 함수를 `suspend`로 바꿀 수 없으므로 범용적이지 않음.
    2. **코루틴 빌더 함수 사용**
        - 코루틴 빌더는 새 코루틴을 만들고, 일시 중단 함수 실행 진입점 역할을 함

---