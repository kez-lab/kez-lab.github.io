---
layout: post
title: "Kotlin in Action 2판 14장 코루틴과 플로우를 활용한 동시성 프로그래밍"
date: 2025-06-08 12:00:00 +0900
categories: [Kotlin, Kotlin In Action 2, 코틀린 인 액션 2판]
tags: Kotlin in Action 2판 14장 코루틴과 플로우를 활용한 동시성 프로그래밍
author: admin
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

- **코루틴**: 전통적인 스레드 기반 동시성(자바 스레드)보다 훨씬 가벼운 추상화임.
- 코루틴은 스레드를 블록시키지 않고도 일시적으로 실행을 멈췄다가 재개할 수 있음.
- **구조적 동시성**을 통해 계층적 작업 관리와 취소·오류처리도 지원함.
- 코루틴은 JVM뿐만 아니라 iOS 등 다양한 플랫폼에서 동작 가능함.

---

## 14.3 스레드와 코루틴 비교

- JVM의 스레드는 OS 수준 스레드로, 생성·관리 비용이 높고, 수천 개까지만 효율적으로 관리 가능함.
- 스레드는 블로킹 작업(예: 네트워크 대기) 동안 자원을 낭비하게 됨.
- 코루틴은 매우 경량이며, 노트북에서도 수십만개도 생성할 수 있음.
- 코루틴은 비동기 작업(네트워크 등)에서 스레드를 블록시키지 않음.
- 코루틴은 구조적 동시성을 통해 계층적으로 작업을 관리하고 취소할 수 있음.
- **Project Loom**은 JVM의 가상 스레드를 도입하는 시도로, 코루틴과 비슷한 경량 동시성 추상화를 제공하나, 언어 차원에서 로컬/원격 작업 구분이 어려움. 코틀린 코루틴은 이 점을 명확히 드러냄.

---

## 14.4 잠시 멈출 수 있는 함수: 일시중단 함수

- 코루틴의 가장 큰 특징은 **순차적으로 보이는 코드**에서 넌블로킹 비동기 처리가 가능하다는 점임.
- 예시: 블로킹 코드
    ```
    fun login(credentials: Credentials): UserID
    fun loadUserData(userID: UserID): UserData
    fun showData(data: UserData)

    fun showUserInfo(credentials: Credentials) {
        val userID = login(credentials)
        val userData = loadUserData(userID)
        showData(userData)
    }
    ```
- 위 코드는 네트워크 대기 동안 스레드를 블록시켜 자원을 낭비함.

- **코루틴 기반 일시중단 함수**는 다음과 같이 순차적 코드를 유지하면서도 넌블로킹 비동기를 구현할 수 있음.
    ```
    suspend fun login(credentials: Credentials): UserID
    suspend fun loadUserData(userID: UserID): UserData
    fun showData(data: UserData)

    suspend fun showUserInfo(credentials: Credentials) {
        val userID = login(credentials)
        val userData = loadUserData(userID)
        showData(userData)
    }
    ```
- `suspend` 키워드는 함수가 일시적으로 실행을 멈추고 재개될 수 있음을 나타냄. 이때 스레드를 블록시키지 않음.
- 실제로 네트워크 라이브러리(Ktor HTTP, Retrofit, OkHttp 등)도 코루틴 친화적 API를 제공함.

---

## 14.5 코루틴과 다른 동시성 접근 방식 비교

- **콜백 기반**
    ```
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
    ```
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
    ```
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

- **코루틴 기반**은 기존 함수에 `suspend`만 붙이면 되고, 코드는 순차적이며 직관적임.
- 코틀린은 기존 동시성 모델(RxJava 등)과도 연동이 쉬움.

---
## 14.5.1 일시 중단 함수 호출

- **일시 중단 함수**는 실행을 일시적으로 멈출 수 있기 때문에, 임의의 위치에서 호출할 수 없음.
- 반드시 **코루틴이나 다른 일시 중단 함수** 내에서만 호출 가능함.
    - 이는 '실행을 일시 중단할 수 있는 함수는, 호출하는 쪽도 일시 중단될 수 있어야 한다'는 논리와 일치함.

예시:
```
suspend fun showUserInfo(credentials: Credentials) {
    val userID: UserID = login(credentials)
    val userData: UserData = loadUserData(userID)
    showData(userData)
}
```
- IDE(IntelliJ, Android Studio)는 일시 중단 함수 호출 옆에 '일시 중단' 아이콘이나 색상 표시를 제공함.

- **일반 함수에서 일시 중단 함수 호출 시 컴파일 오류**
    ```
    suspend fun mySuspendingFunction() {}

    fun main() {
        mySuspendingFunction() // Error: Suspend function should be called only from a coroutine or another suspend function
    }
    ```
    - 오류 메시지는 '일시 중단 함수는 코루틴이나 다른 일시 중단 함수 안에서만 호출해야 한다'는 뜻임.

- **일시 중단 함수 호출 방법**
    1. 가장 단순한 방법: `main` 함수 자체를 `suspend`로 선언
        ```
        suspend fun main() {
            // 일시 중단 함수 호출 가능
        }
        ```
        - 다만, 안드로이드 등 프레임워크에서는 메인 함수를 `suspend`로 바꿀 수 없으므로 범용적이지 않음.
    2. **코루틴 빌더 함수 사용**
        - 코루틴 빌더는 새 코루틴을 만들고, 일시 중단 함수 실행 진입점 역할을 함.
        - 대표적인 코루틴 빌더는 `launch`, `async`, `runBlocking` 등임.
        - 예제(설명은 14.6, 14.7에서 더 다룸):

        ```
        import kotlinx.coroutines.*

        fun main() = runBlocking {
            mySuspendingFunction()
        }
        ```

---