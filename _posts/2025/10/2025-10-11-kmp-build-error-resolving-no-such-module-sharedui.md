---
layout: post
title: "KMP Build Error: Resolving 'No such module SharedUI'"
description: ""
date: 2025-10-11T18:00:04.066Z
categories:
    - CMP
    - KMP
    - iOS
tags:
    - Kotlin
    - Kotlin Multiplatform
    - Compose Multiplatform
    - KMP iOS
    - No such module SharedUI
---

# KMP 빌드 실패 해결기: **No such module 'SharedUI'** / **assembleDebugXCFramework 없음** (XCFramework 설정 가이드)

---

## 1) 에러 상황 (문제 정의)

안녕하세요, 오늘은 Compose Multiplatform(CMP) 을 개발하면서 겪은 iOS 앱 빌드 이슈와 관련하여 포스팅을 준비했습니다.

[개발 상황]
저는 먼저 CMP 기초 프로젝트 셋팅을 위해서 (Compose-Multiplatform-Wizard)[https://terrakok.github.io/Compose-Multiplatform-Wizard] 사이트에서 프로젝트를 셋팅하여 다운로드를 받았습니다.

다운로드 후 iOS 앱을 테스트 삼아 빌드했더니 **`iosApp.swift`**에서 다음 오류가 발생했습니다.

```
No such module 'SharedUI'
```

그동안은 이런적이 없었는데 오랜만에 프로젝트를 직접 셋팅해서 빌드하려니 처음 보는 에러가 발생하더라고요?!  
  
SharedUI 모듈이란 Android, iOS 가 공통적으로 공유해야하는 Screen, ViewModel 을 담고 있는 모듈인데요... 애초에 기초 셋팅이 되어있는 프로젝트인데 이 모듈을 iOS 에서 참조하지 못한다는 것은 무언가 이상하다고 생각했습니다.

---

### 2) 원인 개요

**증상:** `iosApp.swift`에서 `import SharedUI` 시점에 `No such module 'SharedUI'`가 발생했습니다.  
이 에러는 **런타임 링크 문제**가 아니라, **컴파일 타임에 모듈(프레임워크)을 아예 찾지 못했다**는 뜻입니다. 다시 말해, Xcode가 **SharedUI.xcframework를 프로젝트/타깃에 제대로 연결하지 못한 상태**일 가능성이 가장 큽니다.
  
여기서 확인 차원으로 아래 명령을 실행해 봤습니다.

```bash
./gradlew :sharedUI:assembleDebugXCFramework
./gradlew :sharedUI:assembleReleaseXCFramework
```
  
그런데 다음과 같은 에러가 났습니다.
  
```
[error] Cannot locate tasks that match ':sharedUI:assembleDebugXCFramework'
[error] ... 'assembleReleaseXCFramework' not found ...
```
  
이 메시지는 **Gradle에 XCFramework packaging(멀티 아키 번들 생성) 태스크가 등록되어 있지 않다**는 뜻인데요  

KMP에서 공유되는 Kotlin 코드(공유 모듈)를 iOS용 모듈로 쓰려면 각 타깃 프레임워크(slices (예: iosArm64, iosSimulatorArm64))를 XCFramework로 패키징하고, 이를 Xcode에 Link + Embed & Sign 해야합니다 [(Apple Developer)](https://developer.apple.com/documentation/xcode/creating-a-multi-platform-binary-framework-bundle)  
  
이때 Gradle에 XCFramework 패키징을 명시적으로 선언하지 않으면 assemble*XCFramework 류 태스크가 애초에 생성되지 않으며, 결과적으로 Xcode에 연결할 `.xcframework` 산출물이 존재하지 않게 됩니다. 따라서 iosApp 모듈(예: iosApp.swift)에서 import SharedUI와 같은 모듈 참조가 컴파일 타임에 실패하게 됩니다.
  
> 정리하면,
> 1) XCFramework packaging 미선언 → Gradle task registration 부재(assemble*XCFramework 생성 안 됨) → artifact(.xcframework) 미생성.
> 2) Xcode 링크/임베드 미구성(Link Binary With Libraries, Embed & Sign 누락) → 컴파일 타임 모듈 디스커버리 실패 → No such module 'SharedUI' 발생.
  
즉 slice(각 타깃 framework) → XCFramework로의 packaging이 선언·빌드되지 않았기에 Xcode에서도 모듈 탐색에 실패했다는 것을 알 수 있습니다.
---

## 3) 해결 방법 **Xcode에 SharedUI.xcframework 셋팅**
해결 방법은 매우 간단한데요!  
  
`sharedUI/build.gradle.kts`에 **XCFramework packaging**을 명시적으로 선언해 실제 태스크를 생성하고, packaging 된 `SharedUI.xcframework`를 Xcode에 **Link + Embed & Sign**으로 정확히 연결하면 끝납니다.

패키징 선언 예시는 아래와 같습니다.
```kotlin
# build.gradle(sharedUI)
import org.jetbrains.kotlin.gradle.plugin.mpp.KotlinNativeTarget
import org.jetbrains.kotlin.gradle.plugin.mpp.apple.XCFramework

kotlin {
    iosArm64()
    iosSimulatorArm64()

    val xcf = XCFramework("SharedUI") // multi-arch packaging 선언

    targets
        .withType<KotlinNativeTarget>()
        .matching { it.konanTarget.family.isAppleFamily }
        .configureEach {
            binaries.framework {
                baseName = "SharedUI"
                xcf.add(this) // 각 타깃 슬라이스를 XCFramework에 추가
            }
        }
}
```

이후 실제 생성된 태스크 이름을 확인해보시면 이제는 아까와 같은 에러가 발생하지 않는 것을 알 수 있습니다.

```bash
./gradlew :sharedUI:tasks --all | grep -i xcframework
# 예: :sharedUI:assembleSharedUIXCFramework 등 출력됨

./gradlew :sharedUI:assembleSharedUIXCFramework
```

이제 실제 빌드를 위해 Xcode를 재부팅해서 프로젝트를 새로 open 한다면 `import SharedUI`  에럴가 해결되어 iOS 빌드가 정상 진행되고 시뮬레이터가 띄워지면서 에러가 해결된 것을 확인하실 수 있습니다!

### 4) 이런 에러를 처음 본 이유?
음 그동안 iOS 빌드를 여러번 진행했었는데 이런 에러가 처음 발생한 이유가 궁금해서 슬쩍 살펴보았는데요.
그동안은 **CocoaPods로 Kotlin Code 로 공유되는 모듈들을 통합**하고 있었기 때문에, 다음 작업들이 Pods에 의해 자동으로 처리되었던 것이였습니다. [(관련 링크)](https://www.jetbrains.com/help/kotlin-multiplatform-dev/multiplatform-cocoapods-overview.html#configure-the-project)

**[Pods의 역할]**
- 패키징 자동화: 각 타깃 슬라이스(예: iosArm64, iosSimulatorArm64)를 묶어 .xcframework로 만드는 작업을 Pod가 대신 처리하여 별도로 XCFramework packaging 태스크를 등록하거나 실행할 필요가 없음
- Xcode 설정 자동화: pod install 후 생성되는 .xcworkspace를 열면,
링크(Link), 임베드(Embed & Sign), 검색 경로 설정 등이 자동으로 잡혀 Swift에서 import SharedUI가 바로 동작

이번에는 CocoaPods를 쓰지 않고 수동으로 .xcframework를 연결하려다 보니, 이러한 차이 때문에 이번에 처음으로 `No such module 'SharedUI'` 에러가 발생한 것이였습니다.
  
  
  
---

오늘은 간단하지만 처음보았던 KMP, CMP Build Error 에 대해서 포스팅해보았는데요.
Velog에서 Github로 블로그를 옮기고 나니 아무런 셋팅도 아직 안되어 있어서 가독성이 좋을지는 잘 모르겠습니다 ㅠㅠ


추가적으로 궁금한 점은 댓글로 남겨주시면 최대한 빠르게 답변드려보겠습니다 긴 글 읽어주셔서 감사합니다 ^&^
---
