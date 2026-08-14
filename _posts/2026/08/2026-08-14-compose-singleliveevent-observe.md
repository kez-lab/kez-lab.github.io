---
layout: post
title: "Compose에서 SingleLiveEvent를 사용하며 겪은 두 가지 문제"
description: "LaunchedEffect 안에서 LiveData를 observe할 때 완료된 CoroutineScope를 참조하는 문제와 조건부 composition에서 observer가 중복 등록되는 문제를 살펴본다"
date: 2026-08-14T10:00:00+09:00
categories:
  - Android
tags:
  - Jetpack Compose
  - LiveData
  - SingleLiveEvent
  - LaunchedEffect
  - Coroutines
  - Testing
---

오늘은 `LiveData`를 Compose에서 사용하면서 겪었던 오류들을 공유해보려고 합니다.

단일 이벤트를 처리하는 코드는 크게 두 방향으로 나뉩니다.

1. UI state에 처리할 값을 담고, Action을 수행한 뒤 해당 값을 비우는 방법
2. 하나의 이벤트 스트림을 통해 단발성 이벤트를 발행하는 방법

두 번째 방법에서는 Kotlin Coroutine의 `Channel`이나 `SharedFlow`를 사용하기도 하고, 기존 View 기반 프로젝트라면 `SingleLiveEvent`가 남아 있는 경우도 많습니다. 저 역시 Compose로 화면을 옮기면서 기존 `SingleLiveEvent`를 그대로 사용했는데요.

처음에는 큰 문제가 없어 보였습니다. 그런데 API 응답 시점에 따라 스크롤이 되기도 하고 안 되기도 했고, 조건부로 화면을 노출하는 테스트에서는 observer가 계속 늘어나는 현상도 확인했습니다.

이 두 문제 모두 코드만 봤을 때는 꽤 자연스러워 보인다는 공통점이 있었습니다.

## 완료된 `LaunchedEffect`의 scope를 다시 참조하고 있었다

API 호출이 성공하면 특정 위치로 스크롤해야 하는 화면이 있었습니다. ViewModel은 `SingleLiveEvent<Int>`로 이동할 위치를 전달했고, Compose에서는 `animateScrollToItem()`을 호출해야 했습니다.

`animateScrollToItem()`은 suspend 함수이기 때문에 자연스럽게 `LaunchedEffect` 안에서 observer를 등록했습니다.

```kotlin
@Composable
fun ProductListScreen(
    viewModel: ProductListViewModel,
    listState: LazyListState,
) {
    val lifecycleOwner = LocalLifecycleOwner.current

    LaunchedEffect(Unit) {
        viewModel.scrollEvent.observe(lifecycleOwner) { position ->
            launch {
                listState.animateScrollToItem(position)
            }
        }
    }
}
```

코드만 보면 별문제가 없어 보입니다. `LaunchedEffect` 안이니 coroutine을 쓸 수 있고, observer에서 이벤트를 받으면 `launch`로 suspend 함수를 실행하고 있으니까요.

문제는 `observe()`가 observer를 등록한 뒤 바로 반환된다는 점입니다.

```text
LaunchedEffect 시작
    ↓
observe()로 observer 등록
    ↓
LaunchedEffect 블록 종료
    ↓
LaunchedEffect의 Job 완료
    ↓
API 응답 도착
    ↓
observer 안에서 이미 완료된 scope로 launch 시도
```

`LaunchedEffect`의 블록은 `observe()`를 등록한 뒤 더 할 일이 없으니 바로 끝납니다. 이때 `LaunchedEffect`가 제공한 `CoroutineScope`의 Job도 완료됩니다. 나중에 API 응답이 도착해 observer가 실행되더라도, 내부의 `launch`는 이미 완료된 Job을 부모로 삼게 됩니다. 새 coroutine은 시작하지 못하고 취소됩니다.

observer 콜백 자체가 suspend scope인 것은 아닙니다. 다만 `LaunchedEffect`의 블록이 `CoroutineScope.() -> Unit` 형태라서, 그 안에 작성한 observer 람다에서도 바깥 receiver의 `launch`가 보입니다. 컴파일도 되니 놓치기 더 쉬웠습니다.

## 같은 코드가 어떤 때는 동작했던 이유

더 까다로웠던 점은 이 코드가 항상 실패하지 않았다는 것입니다.

`LiveData`에 이미 값이 들어 있다면 `observe()`를 등록하는 순간 현재 값이 observer에 전달될 수 있습니다. 이때는 `LaunchedEffect` 블록이 아직 끝나지 않았으므로 Job도 살아 있고, 내부의 `launch`가 정상적으로 실행됩니다.

반대로 API 응답이 observer 등록 이후에 도착하면 그때는 Job이 이미 완료된 상태입니다. 스크롤이 실행되지 않습니다.

```kotlin
LaunchedEffect(Unit) {
    val effectJob = coroutineContext[Job]

    viewModel.scrollEvent.observe(lifecycleOwner) { position ->
        Log.d(
            "ScrollEvent",
            "active=${effectJob?.isActive}, completed=${effectJob?.isCompleted}",
        )

        launch {
            listState.animateScrollToItem(position)
        }
    }
}
```

이런 코드는 캐시된 값이나 빠른 응답에서는 정상처럼 보이고, 응답이 늦어지는 상황에서만 실패할 수 있습니다. QA에서는 잘 됐는데 운영 환경에서 간헐적으로 동작하지 않는 버그로 이어지기 딱 좋은 조건이죠.

공식 Compose 문서에서도 `LaunchedEffect`는 composition에 진입할 때 coroutine을 실행하고, 전달한 블록의 생명주기 안에서 suspend 작업을 수행하는 API라고 설명합니다. observer처럼 나중에 호출되는 callback을 등록만 해두는 용도와는 수명이 다릅니다. [Compose side-effects 문서](https://developer.android.com/develop/ui/compose/side-effects)

## `LaunchedEffect(Unit)`도 조건문 안에서는 다시 실행된다

두 번째 문제는 observer의 중복 등록이었습니다.

`LaunchedEffect(Unit)`이라고 쓰면 해당 화면에서 딱 한 번만 실행될 것처럼 느껴집니다. 정확히는 **현재 composition에 들어와 있는 동안 한 번**입니다. Composable이 composition에서 빠졌다가 다시 들어오면 새로운 `LaunchedEffect(Unit)`이 만들어집니다.

```kotlin
if (visible) {
    LaunchedEffect(Unit) {
        event.observe(lifecycleOwner) {
            Log.d("SingleEvent", "observer called")
        }
    }
}
```

이 코드는 다음 순서로 움직입니다.

1. `visible == true`가 되면서 observer가 등록됩니다.
2. `visible == false`가 되면 Composable은 composition에서 빠집니다.
3. 하지만 `LiveData`의 observer는 같은 `LifecycleOwner`가 `DESTROYED` 되기 전까지 남아 있습니다.
4. 다시 `visible == true`가 되면 새로운 observer가 하나 더 등록됩니다.

Compose 입장에서는 `LaunchedEffect`를 정상적으로 정리했습니다. 그러나 `LiveData.observe()`로 등록한 observer까지 대신 제거해주지는 않습니다. Compose의 생명주기와 `LifecycleOwner`의 생명주기를 같은 것으로 생각했던 게 문제였습니다.

실제로 observer 등록 지점에 로그를 찍고 `Toggle` 버튼을 열세 번 눌러봤을 때 로그는 여덟 번 찍혔습니다. 처음에는 `Unit`으로 묶었는데 왜 여러 번 호출되는지부터 이해가 되지 않았습니다.

클릭 횟수와 observer 등록 횟수는 같지 않습니다. 화면이 다시 보이는 시점에만 `LaunchedEffect`가 composition에 진입하기 때문입니다. 최초 상태와 분기 구조에 따라 숫자도 달라질 수 있습니다. 중요한 것은 열세 번이나 여덟 번이라는 숫자가 아니라, **같은 `LifecycleOwner`가 살아 있는 동안 composition에 재진입할 때마다 observer가 추가될 수 있다는 사실**입니다.

## `SingleLiveEvent`가 중복 observer를 가리고 있었다

그런데 실제 화면에서는 observer가 늘어났는데도 Action이 여러 번 실행되지는 않았습니다.

`SingleLiveEvent`는 AndroidX가 제공하는 표준 타입이 아니어서 구현은 프로젝트마다 다릅니다. 많이 사용된 구현은 `AtomicBoolean` 형태의 pending flag를 두고, 여러 observer 중 한 곳에서만 값을 소비하도록 만듭니다. 첫 observer가 flag를 `false`로 바꾸면 나머지 observer의 callback은 통과하지 못합니다.

덕분에 화면 동작만 보면 정상처럼 보입니다. 하지만 동작이 한 번이라는 사실이 observer도 하나라는 뜻은 아닙니다. 사용되지 않는 observer wrapper는 여전히 `LiveData` 내부에 남아 있을 수 있습니다.

중복 등록을 확인할 때는 `SingleLiveEvent` 대신 일반 `MutableLiveData`를 사용하는 편이 문제를 드러내기 쉽습니다.

```kotlin
@Test
fun observer_is_registered_again_after_composition_reentry() {
    val event = MutableLiveData<String>()
    val received = AtomicInteger()

    composeRule.setContent {
        var visible by remember { mutableStateOf(true) }
        val lifecycleOwner = LocalLifecycleOwner.current

        Column {
            Button(onClick = { visible = !visible }) {
                Text("Toggle")
            }

            if (visible) {
                LaunchedEffect(Unit) {
                    event.observe(lifecycleOwner) {
                        received.incrementAndGet()
                    }
                }
            }
        }
    }

    // 화면을 composition에서 제거했다가 다시 진입시킵니다.
    composeRule.onNodeWithText("Toggle").performClick()
    composeRule.waitForIdle()
    composeRule.onNodeWithText("Toggle").performClick()
    composeRule.waitForIdle()

    composeRule.runOnIdle {
        event.value = "message"
    }

    composeRule.runOnIdle {
        assertThat(received.get()).isEqualTo(2)
    }
}
```

첫 진입에서 observer가 하나 등록되고, 화면 재진입에서 하나가 더 등록됩니다. 이후 값을 한 번 발행했는데 callback은 두 번 실행됩니다. `SingleLiveEvent`로 테스트하면 pending flag 때문에 callback이 한 번만 통과할 수 있어 이 문제가 가려집니다.

## 기존 LiveData를 유지해야 한다면 등록과 해제를 묶어야 한다

기존 ViewModel의 LiveData를 당장 바꿀 수 없다면 `DisposableEffect`에서 observer 등록과 해제를 한 쌍으로 관리할 수 있습니다.

```kotlin
@Composable
fun ProductListScreen(
    viewModel: ProductListViewModel,
    listState: LazyListState,
) {
    val lifecycleOwner = LocalLifecycleOwner.current
    val scope = rememberCoroutineScope()

    DisposableEffect(viewModel.scrollEvent, lifecycleOwner) {
        val observer = Observer<Int> { position ->
            scope.launch {
                listState.animateScrollToItem(position)
            }
        }

        viewModel.scrollEvent.observe(lifecycleOwner, observer)

        onDispose {
            viewModel.scrollEvent.removeObserver(observer)
        }
    }
}
```

이 코드에서는 `rememberCoroutineScope()`가 현재 composition의 생명주기를 따릅니다. 화면이 composition에 있는 동안 도착한 이벤트는 이 scope에서 실행되고, 화면이 빠지면 coroutine도 취소됩니다. `DisposableEffect`의 `onDispose`에서는 observer를 명시적으로 제거합니다.

적어도 등록과 해제의 책임이 같은 곳에 놓입니다.

## Compose에서 Single Event 처리 방법

이번 문제를 겪고 나서는 Snackbar, 스크롤, Navigation처럼 UI에서 처리해야 하는 Action을 우선 2가지 방법으로 해결하고 있는데요.

### State로 Single Event 처리하기

```kotlin
data class ProductListUiState(
    val scrollTarget: Int? = null,
)

@Composable
fun ProductListScreen(
    uiState: ProductListUiState,
    onScrollCompleted: () -> Unit,
    listState: LazyListState,
) {
    uiState.scrollTarget?.let { position ->
        LaunchedEffect(position) {
            listState.animateScrollToItem(position)
            onScrollCompleted()
        }
    }
}
```

Action을 처리한 뒤 `scrollTarget`을 `null`로 비우면 됩니다. suspend 함수는 원래 실행되어야 할 `LaunchedEffect` 블록 안에 있고, observer를 등록하거나 제거할 필요도 없습니다.

현재 Android UI events 가이드도 ViewModel에서 시작된 UI Action을 UI state 변화로 표현하고, UI가 처리한 뒤 다시 상태를 갱신하는 방향을 권장합니다. `Channel` 같은 스트림이 모든 상황에서 잘못됐다는 뜻은 아니지만, ViewModel이 UI보다 오래 살아 있는 경우에는 전달과 처리 보장을 별도로 고민해야 합니다. [Android UI events 가이드](https://developer.android.com/topic/architecture/ui-layer/events)

### Kotlin Coroutines의 Channel 활용하기

여러 이벤트를 순서대로 처리해야 하거나, state에 값을 넣었다가 다시 비우는 코드가 오히려 어색하다면 `Channel`을 사용할 수도 있습니다.

ViewModel에서는 외부에 `Channel` 자체를 공개하지 않고 `receiveAsFlow()`로 변환한 `Flow`만 노출합니다. 그래야 UI는 이벤트를 받기만 하고, 발행은 ViewModel 안에서만 일어나게 만들 수 있습니다.

```kotlin
sealed interface ProductListEffect {
    data class ScrollTo(val position: Int) : ProductListEffect
    data class ShowMessage(val message: String) : ProductListEffect
}

class ProductListViewModel : ViewModel() {

    private val _effects = Channel<ProductListEffect>(
        capacity = Channel.BUFFERED,
    )
    val effects: Flow<ProductListEffect> = _effects.receiveAsFlow()

    fun loadProducts() {
        viewModelScope.launch {
            val products = productRepository.getProducts()

            if (products.isEmpty()) {
                _effects.send(
                    ProductListEffect.ShowMessage("상품이 없습니다."),
                )
                return@launch
            }

            _effects.send(ProductListEffect.ScrollTo(position = 0))
        }
    }
}
```

Compose에서는 `LaunchedEffect` 안에서 Flow를 계속 collect합니다.

```kotlin
@Composable
fun ProductListScreen(
    viewModel: ProductListViewModel,
    listState: LazyListState,
    snackbarHostState: SnackbarHostState,
) {
    val lifecycleOwner = LocalLifecycleOwner.current

    LaunchedEffect(
        viewModel,
        listState,
        snackbarHostState,
        lifecycleOwner,
    ) {
        lifecycleOwner.lifecycle.repeatOnLifecycle(
            Lifecycle.State.STARTED,
        ) {
            viewModel.effects.collect { effect ->
                when (effect) {
                    is ProductListEffect.ScrollTo -> {
                        listState.animateScrollToItem(effect.position)
                    }

                    is ProductListEffect.ShowMessage -> {
                        snackbarHostState.showSnackbar(effect.message)
                    }
                }
            }
        }
    }
}
```

앞에서 문제가 됐던 `LiveData.observe()`와 차이가 보입니다. `observe()`는 observer를 등록한 뒤 바로 반환되지만, `collect`는 Flow 수집이 끝날 때까지 suspend 상태로 남습니다. 따라서 이벤트가 나중에 도착해도 `LaunchedEffect`의 Job은 아직 살아 있고, `animateScrollToItem()`이나 `showSnackbar()` 같은 suspend 함수를 같은 블록에서 바로 호출할 수 있습니다.

`repeatOnLifecycle(STARTED)`를 함께 사용한 이유는 화면이 foreground에 있을 때만 UI Action을 처리하기 위해서입니다. 화면이 composition에서 빠지면 `LaunchedEffect`가 취소되고, lifecycle이 `STOPPED` 상태가 되면 안쪽 collection만 취소됩니다. 어느 경우든 `LiveData`처럼 observer를 직접 제거할 필요는 없습니다.

다만 `Channel`이라고 해서 전달 문제가 자동으로 해결되는 것은 아닙니다. 위 예제에서 `Channel.BUFFERED`를 선택한 것도 하나의 정책입니다.

- 기본값인 `Channel.RENDEZVOUS`는 buffer가 없어서 receiver가 없으면 `send()`가 suspend됩니다.
- `Channel.BUFFERED`는 UI가 잠시 수집하지 않아도 event를 buffer에 남길 수 있지만, 화면으로 돌아왔을 때 이미 의미가 없어진 스크롤이나 Navigation이 실행될 수도 있습니다.
- `trySend()`는 receiver나 buffer 공간이 없을 때 실패할 수 있으므로 반환된 `ChannelResult`를 확인해야 합니다.
- `receiveAsFlow()`를 여러 곳에서 collect하면 broadcast가 아니라 fan-out으로 동작합니다. 하나의 event는 collector 한 곳에만 전달됩니다.

또 collector가 event를 꺼낸 직후 취소되면 실제 UI Action을 수행하기 전에 값이 사라질 수도 있습니다. Kotlin 공식 문서도 Channel의 capacity에 따라 sender의 suspend와 buffer 동작이 달라지고, `receiveAsFlow()`는 취소 시점에 따라 전달받은 element가 유실될 수 있다고 설명합니다. [Channel API](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.channels/-channel/), [`receiveAsFlow()` API](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/receive-as-flow.html)

그래서 Channel을 사용할 때는 “단발 이벤트니까 Channel”에서 끝내지 않고 아래 조건을 먼저 정해야 합니다.

1. 화면이 없을 때 event를 버릴지, 기다릴지, buffer에 보관할지
2. 여러 화면이 collect할 때 한 곳만 받을지, 모두 받아야 할지
3. event를 받은 뒤 UI Action이 완료되지 못했을 때 다시 처리해야 하는지

사용자에게 반드시 보여야 하는 결과거나 화면 복원 후에도 의미가 남는 정보라면 state가 더 잘 맞습니다. 반대로 현재 화면이 살아 있는 동안 발생한 UI 효과를 한 collector가 순서대로 처리하고, 취소 시 유실되어도 괜찮다는 조건이 분명하다면 Channel도 선택할 수 있습니다.

기존 코드에서 `LaunchedEffect(Unit) { liveData.observe(...) }`를 발견했다면 두 가지를 먼저 확인해보면 좋겠습니다.

- observer callback에서 바깥 `LaunchedEffect`의 `launch`를 다시 사용하고 있지 않은가
- 조건부 composition에 재진입했을 때 이전 observer를 제거하고 있는가

긴 글 읽어주셔서 감사합니다.
