---
layout: post
title: "Kotlin in Action 2판 17장 Flow Operator"
description: "Kotlin Flow 연산자: map, filter, flatMap, combine, zip, conflate, buffer 등 Flow 변환과 조합"
date: 2025-07-20 12:00:00 +0900
categories:
    - Kotlin
tags:
    - Kotlin
    - Kotlin in Action
    - Flow
    - Flow Operators
    - Functional Programming
---

# 17장 Flow 연산자

## 17.1 Flow 연산자로 Flow 조작

- Flow는 시간에 따라 나타나는 여러 연속적인 값을 처리할 수 있는 고수준 추상화
- Flow도 컬렉션과 마찬가지로 다양한 연산자(map, filter 등)를 사용하여 조작할 수 있음
- Flow 연산자는 **중간 연산자**와 **최종 연산자**로 구분됨
    - 중간 연산자는 실제 코드를 실행하지 않고, 변환된 Flow를 반환함
    - 최종 연산자는 컬렉션, 개별 원소, 계산된 값 등을 반환하거나 아무 값도 반환하지 않으면서 Flow를 수집하고 실제 코드를 실행함
<img width="542" height="256" alt="image" src="https://github.com/user-attachments/assets/6f4d10e0-c0b0-400d-8033-c978692d03ec" />



## 17.2 중간 연산자는 Upstream Flow에 적용되고, Downstream Flow를 반환함

- 중간 연산자는 Flow에 적용되어 새로운 Flow를 반환함
- 연산자가 적용되는 Flow를 **upstream Flow**, 중간 연산자가 반환하는 Flow를 **downstream Flow**라 부름
- downstream Flow는 또 다른 연산자의 upstream Flow가 될 수 있음
- 중간 연산자가 호출되어도 Flow 코드는 실제로 실행되지 않으며, 반환된 Flow는 콜드 상태임
- map, filter, onEach 등은 컬렉션의 연산자와 유사하게 동작하지만 Flow의 원소에 적용된다는 점이 다르며, Flow에는 컬렉션이나 시퀀스에서 볼 수 없는 특별한 연산자도 존재함
<img width="539" height="280" alt="image" src="https://github.com/user-attachments/assets/28c1d818-b2e5-4c6f-9707-3391fbcd1073" />

---

## 17.2.1 upstream 원소별 임의의 값을 배출: transform 함수

- transform 함수는 upstream Flow의 각 원소에 대해 원하는 만큼의 원소를 downstream Flow에 배출할 수 있음

예제:
```
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
fun main() {
    val names = flow {
        emit("Jo")
        emit("May")
        emit("Sue")
    }
    val uppercasedNames = names.map { it.uppercase() }
    runBlocking {
        uppercasedNames.collect { print("$it ") }
    }
    // JO MAY SUE
}
```
#### transform 사용 예제
```
import kotlinx.coroutines.flow.*
fun main() {
    val names = flow {
        emit("Jo")
        emit("May")
        emit("Sue")
    }
    val upperAndLowercasedNames = names.transform {
        emit(it.uppercase())
        emit(it.lowercase())
    }
    runBlocking {
        upperAndLowercasedNames.collect { print("$it ") }
    }
    // JO jo MAY may SUE sue
}
```
- 단순 값 목록의 경우 flowOf("Jo", "May", "Sue")로 Flow 생성 가능하다는 점을 참고

---

## 17.2.2 take나 관련 연산자는 Flow를 취소할 수 있음

- 시퀀스에서 배운 take, takeWhile 등은 Flow에서도 동일하게 사용 가능함
- 이러한 연산자는 조건이 더 이상 유효하지 않을 때 upstream Flow를 취소하고, 더 이상 원소가 배출되지 않게 함
- 예: 5개의 값만 받고 싶을 때 take(5)를 호출하면 다섯 번 배출 후 upstream Flow가 취소됨

예제:
```
import kotlinx.coroutines.flow.*
fun main() {
    val temps = getTemperatures()
    temps
        .take(5)
        .collect { log(it) }
    // 5번 배출 후 Flow 취소
}
```
- take는 코루틴 스코프 취소 외에도 Flow 수집을 제어적으로 취소하는 수단임

---

## 17.2.3 Flow의 각 단계 후킹: onStart, onEach, onCompletion, onEmpty

- onCompletion: Flow가 정상 종료, 취소, 예외 등 어떤 상황에서든 끝날 때 람다를 실행하는 중간 연산자임
- onStart: Flow 수집이 시작될 때, 첫 배출 전에 실행됨
- onEach: upstream Flow에서 각 원소가 배출된 후 실행됨
- onEmpty: 원소를 배출하지 않고 종료되는 경우 기본값 배출 등 실행 가능

예제:
```
fun process(flow: Flow<Int>) = flow
    .onEmpty {
        emit(0)
        println("Nothing - emitting default value!")
    }
    .onStart { println("Starting!") }
    .onEach { println("On $it!") }
    .onCompletion { println("Done!") }
    .collect()

runBlocking {
    process(flowOf(1, 2, 3))
    // Starting!
    // On 1!
    // On 2!
    // On 3!
    // Done!

    process(flowOf())
    // Starting!
    // Nothing - emitting default value!
    // On 0!
    // Done!
}
```
- onEach는 onEmpty보다 upstream 쪽에 위치함
- 만약 onEmpty 호출을 더 다운스트림으로 옮기면 downstream 연산자에 의해 배출된 값을 onEach가 받지 못함

## 17.2.4 downstream 연산자와 수집자를 위한 원소 버퍼링: buffer 연산자

- 기본적으로 Cold Flow에서 값 생산자는 수집자가 이전 원소를 처리할 때까지 대기하기 때문에, Flow의 중간연산자나 collect 내에서 많은 작업을 수행하는 경우, 각 원소의 처리가 느릴 수 있음
- buffer 연산자는 upstream과 downstream 사이에 버퍼를 두어, 수집자가 바쁜 동안에도 upstream에서 원소를 미리 생성해 버퍼에 쌓을 수 있도록 함
- 버퍼 크기 및 overflow 동작(onBufferOverflow) 조절 가능
    - SUSPEND: 버퍼가 가득 차면 생산자가 대기
    - DROP_OLDEST: 가장 오래된 값을 버림
    - DROP_LATEST: 추가 중인 마지막 값을 버림

예제:
```
fun getAllUserIds(): Flow<Int> = flow {
    repeat(3) {
        delay(200.milliseconds)
        log("Emitting!")
        emit(it)
    }
}
suspend fun getProfileFromNetwork(id: Int): String {
    delay(2.seconds)
    return "Profile[$id]"
}
fun main() {
    val ids = getAllUserIds()
    runBlocking {
        ids
            .buffer(3)
            .map { getProfileFromNetwork(it) }
            .collect { log("Got $it") }
    }
}
```
- buffer를 사용하면, 전체 처리 시간이 줄어듦

---

## 17.2.5 중간 값을 버리는 연산자: conflate 연산자

- conflate 연산자는 수집자가 바쁠 때 upstream에서 배출된 중간 값을 무시하고 최신 값만 전달함
- 빠르게 구식이 되는 값 대신 항상 최신 값만 처리할 때 유용함

예제:
```
val temps = getTemperatures() // 16장에서 봤던 온도를 연속적으로 반환하느 Flow 함수
temps
    .onEach { log("Read $it from sensor") }
    .conflate()
    .collect {
        log("Collected $it")
        delay(1.seconds)
    }
```
- conflate를 쓰면 upstream과 downstream 실행이 분리되며, 최신 값만 보장되며 성능을 유지할 수 있음

---

## 17.2.6 일정 시간 동안 값을 필터링하는 연산자: debounce 연산자

- debounce(ms) 연산자는 upstream에서 값이 배출된 뒤, 지정한 시간 동안 추가 값이 없으면 그 값을 downstream에 전달함
- 사용자의 입력 등 이벤트에서 불필요한 중복 처리를 막고, 입력이 멈췄을 때만 처리하는 데 유용함
- 대표적인 예시는 텍스트 입력 시 자동 검색 기능을 구현하는 경우

예제:
```
val searchQuery = flow {
   emit("K")
   delay(100.milliseconds)
   emit("Ko")
   delay(200.milliseconds)
   emit("Kotl")
   delay(500.milliseconds)
   emit("Kotlin")
}

fun main() = runBlocking {
   searchQuery
       .debounce(250.milliseconds)
       .collect {
           log("Searching for $it")
       }
}

// 644 [main @coroutine#1] Searching for Kotl
// 876 [main @coroutine#1] Searching for Kotlin
```
- 250ms 이상 멈춘 시점의 값만 배출됨

---

## 17.2.7 Flow가 실행되는 코루틴 컨텍스트를 바꾸기: flowOn 연산자

- flowOn 연산자는 Flow 연산자 앞(upstream)에서 실행될 코루틴 디스패처(컨텍스트)를 지정함
  - 중요한 점은 upstream 플로우의 dispacher에만 영향을 끼침
- 여러 번 사용할 수 있고, 각 flowOn은 자기보다 앞에 있는 연산자와 Flow에만 영향

예제:
```
runBlocking {
    flowOf(1)
       .onEach { log("A") }
        .flowOn(Dispatchers.Default)
       .onEach { log("B") }
       .flowOn(Dispatchers.IO)
        .onEach { log("C") }
       .collect()
}

// 36 [DefaultDispatcher-worker-3 @coroutine#3] A
// 44 [DefaultDispatcher-worker-1 @coroutine#2] B
// 44 [main @coroutine#1] C
```
- "A"는 Default, "B"는 IO, "C"는 collect가 실행된 컨텍스트에서 실행됨

---

## 17.3 커스텀 중간 연산자 만들기

- 표준 연산자 외에 사용자가 직접 중간 연산자를 구현할 수 있음
- 중간 연산자는 upstream Flow를 collect로 수집한 뒤, 변환하거나 부수 효과를 추가한 후 downstream에 emit
- 커스텀 연산자도 collect가 호출될 때까지 콜드 상태를 유지함

예제:
```
fun Flow<Double>.averageOfLast(n: Int): Flow<Double> = flow {
    val numbers = mutableListOf<Double>()
    collect {
        if (numbers.size >= n) numbers.removeFirst()
        numbers.add(it)
        emit(numbers.average())
    }
}
fun main() = runBlocking {
    flowOf(1.0, 2.0, 30.0, 121.0)
        .averageOfLast(3)
        .collect { print("$it ") }
}
// 1.0 1.5 11.0 51.0
```
- 표준 연산자도 이와 비슷하게 구현되며, 성능 최적화 코드가 추가될 수 있음

## 17.4 최종 연산자는 upstream Flow를 실행하고 값을 계산함

- 중간 연산자는 주어진 Flow를 변환하지만, 실제 코드는 실행하지 않으며, 최종 연산자가 호출될 때 Flow가 실행되고 값이 계산됨
- 최종 연산자는 단일 값이나 값의 컬렉션을 계산하거나, 지정된 연산과 부수효과를 수행함
- 가장 일반적인 최종 연산자는 collect임
    - collect는 Flow의 각 원소에 대해 실행할 람다를 지정할 수 있음

예제:
```
fun main() = runBlocking {
    getTemperatures()
        .onEach { log(it) }
        .collect()
}
```
- collect가 호출되어야 Flow 전체가 수집될 때까지 일시 중단됨
- first, firstOrNull 등의 연산자는 첫 원소만 받고 upstream Flow를 취소할 수 있음

예제:
```
fun main() = runBlocking {
    getTemperatures()
        .first()
}
```

---

## 17.4.1 프레임워크는 커스텀 연산자를 제공함

- Jetpack Compose나 Compose Multiplatform과 같은 프레임워크는 Flow와 직접 통합된 커스텀 연산자와 변환 함수를 제공함
- 예를 들어 collectAsState 함수는 정수 Flow를 State 객체로 변환해줌으로서 Compose에서 UI 상태로 사용할 수 있음

예제:
```
@Composable
fun TemperatureDisplay(temps: Flow<Int>) {
    val temperature = temps.collectAsState(null)
    Box {
        temperature.value?.let {
            Text("The current temperature is $it!")
        }
    }
}
```
- Flow는 코루틴 기반 툴킷에 시간에 따른 값을 우아하게 처리할 수 있는 강력한 기능을 추가해줌

---

## 요약

- 중간 연산자는 Flow를 다른 Flow로 변환함  
    - upstream Flow에 대해 작동하며 downstream Flow를 반환함
    - 콜드 상태이며, 최종 연산자가 호출될 때까지 실행되지 않음
- 시퀀스에 사용 가능한 많은 중간 연산자를 Flow에서도 사용할 수 있음
- Flow에는 변환(transform), 실행 콘텍스트 관리(flowOn), 특정 단계별 코드 실행(onStart, onCompletion 등) 중간 연산자가 추가로 제공됨
- collect와 같은 최종 연산자는 Flow 코드를 실제로 실행함  
    - 핫 Flow의 경우 collect는 구독 처리 역할을 담당함
- Flow 빌더 내에서 upstream Flow를 수집하고 변환된 원소를 배출하는 방식으로 커스텀 중간 연산자를 만들 수 있음
- Jetpack Compose와 같은 일부 외부 프레임워크는 코틀린 Flow와의 직접적 통합을 제공함
