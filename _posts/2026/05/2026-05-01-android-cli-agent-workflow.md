---
layout: post
title: "[Android] Android CLI: 에이전트 시대의 Android 개발 도구"
description: "Android CLI가 기존 Android 개발 도구와 다른 점, 에이전트 친화 기능, 설치와 주요 명령어 흐름 정리"
date: 2026-05-01T19:28:52+09:00
categories:
    - Android
tags:
    - Android
    - Android CLI
    - AI Agent
    - CLI
    - SDK
    - Emulator
---


Google이 Android 개발 워크플로를 터미널에서 다루기 위한 공식 도구인 **Android CLI**를 공개했습니다. Android CLI는 프로젝트 생성, SDK 설치, 에뮬레이터 관리, APK 배포 같은 기본 작업을 `android` 명령어 아래로 묶습니다.

하지만 이 도구에서 더 중요한 부분은 단순한 명령어 통합이 아닙니다. `layout`, `screen`, `docs`, `skills`처럼 **AI 에이전트가 Android 프로젝트를 이해하고 조작하기 좋은 기능**이 함께 들어왔다는 점입니다.

기존에도 `adb`, `sdkmanager`, `avdmanager`, Gradle Wrapper로 대부분의 작업은 가능했습니다. Android CLI는 그 도구들을 완전히 대체한다기보다, 사람과 에이전트가 함께 쓰기 좋은 공식 진입점을 제공하는 쪽에 가깝습니다.

---

## Android CLI가 해결하려는 문제

Android 개발 환경은 원래부터 CLI 도구가 많습니다.

- 빌드는 Gradle Wrapper
- 디바이스 제어는 `adb`
- SDK 설치는 `sdkmanager`
- AVD 관리는 `avdmanager`와 `emulator`
- 프로젝트 생성은 Android Studio 또는 템플릿

사람이 직접 쓸 때는 익숙해지면 큰 문제가 없지만, 스크립트나 AI 에이전트가 다루기에는 경로와 도구가 흩어져 있습니다. 예를 들어 "디버그 APK를 찾아서 에뮬레이터에 설치하고, 현재 화면을 검사한 뒤, 공식 문서를 참고해서 수정한다"는 작업을 자동화하려면 여러 도구를 조합해야 합니다.

Android CLI는 이런 흐름을 `android`라는 단일 명령 체계로 정리하려는 시도입니다.

공식 문서 기준으로 Android CLI의 첫 릴리스는 2026년 4월의 `0.7` 버전입니다. 아직 초기 도구이므로 실제 프로젝트에 적용할 때는 `android -h`, `android <command> -h`, 릴리스 노트를 함께 확인하는 편이 좋습니다.

---

## 설치와 환경 확인

설치는 OS별 스크립트로 진행할 수 있습니다.

### macOS

```bash
curl -fsSL https://dl.google.com/android/cli/latest/darwin_arm64/install.sh | bash
```

### Linux

```bash
curl -fsSL https://dl.google.com/android/cli/latest/linux_x86_64/install.sh | bash
```

### Windows

```powershell
curl.exe -fsSL https://dl.google.com/android/cli/latest/windows_x86_64/install.cmd -o "%TEMP%\i.cmd" && "%TEMP%\i.cmd"
```

설치 후에는 먼저 CLI가 잡히는지 확인합니다.

```bash
command -v android
android --version
android info
```

`android info`는 Android CLI가 어떤 Android SDK를 기준으로 동작하는지 확인할 때 유용합니다. 기존 Android Studio SDK와 다른 경로를 쓰고 싶다면 `--sdk` 옵션을 직접 넘기거나 `.androidrc`에 기본 옵션을 저장할 수 있습니다.

```bash
android --sdk=/path/to/android/sdk sdk list "platforms/android-.*"
```

```bash
# ~/.androidrc
--sdk=/path/to/android/sdk
```

최신 버전 유지는 아래 명령어로 처리합니다.

```bash
android update
```

현재 알려진 제한도 있습니다. Windows에서는 `android emulator` 명령어가 비활성화되어 있고, Windows PowerShell을 통한 Android CLI 다운로드도 아직 지원되지 않습니다.

---

## 핵심은 에이전트 친화 기능

Android CLI에서 가장 눈에 띄는 부분은 단순히 프로젝트를 만들고 APK를 설치하는 기능보다, 에이전트가 프로젝트와 실행 중인 앱을 이해할 수 있게 돕는 기능입니다.

### UI 레이아웃 추출

```bash
android layout --pretty --output=./hierarchy.json
```

`android layout`은 연결된 디바이스나 에뮬레이터에서 활성 앱의 UI 레이아웃 트리를 JSON으로 반환합니다. 사람이 눈으로 화면을 확인하는 대신, 에이전트가 현재 화면 구조를 읽고 판단할 수 있는 형태가 됩니다.

변경된 요소만 보고 싶다면 `--diff` 옵션도 사용할 수 있습니다.

```bash
android layout --diff --output=./layout-diff.json
```

### 스크린샷 라벨링과 좌표 변환

```bash
android screen capture --output=ui.png --annotate
android screen resolve --screenshot=ui.png --string="input tap #5"
```

`--annotate` 옵션으로 캡처하면 UI 요소에 라벨이 붙고, `screen resolve`는 `#5` 같은 라벨을 실제 좌표로 변환합니다.

예를 들어 `#5`가 `(500, 1000)` 위치라면 다음과 같은 결과를 얻습니다.

```bash
input tap 500 1000
```

UI 자동화에서 좌표를 직접 하드코딩하지 않고, 화면 요소를 기준으로 액션을 만들 수 있다는 점이 핵심입니다.

### Android Knowledge Base

```bash
android docs search 'How do I improve my app performance?'
android docs fetch kb://android/topic/performance/overview
```

`android docs`는 Android Knowledge Base를 터미널에서 검색하고 가져오는 명령입니다. 검색 결과에는 `kb://`로 시작하는 URL이 포함되고, 이를 `fetch`로 열람할 수 있습니다.

이 기능은 에이전트가 공식 Android 문서를 참고하면서 코드를 수정하는 흐름과 잘 맞습니다. 예를 들어 성능, edge-to-edge, Compose 권장 패턴 같은 내용을 웹 검색이 아니라 Android CLI의 문서 인터페이스로 확인할 수 있습니다.

### Android Skills

```bash
android init
android skills add --all
android skills find 'performance'
android skills list --long
```

`android skills`는 에이전트가 Android 권장 패턴을 이해하고 적용할 수 있도록 돕는 지침 묶음을 설치하고 관리합니다. `android init`을 실행하면 에이전트가 Android CLI를 이해할 수 있도록 `android-cli` 스킬을 설치합니다.

이 지점에서 Android CLI의 방향성이 분명해집니다. 이 도구는 단순히 개발자가 터미널에서 명령을 덜 외우게 하려는 도구가 아니라, 에이전트가 프로젝트 구조를 읽고, 문서를 참고하고, 앱을 실행하고, 화면을 검사하는 흐름을 공식화하려는 도구입니다.

공식 Android Skills와 별개로, 자주 쓰는 Android 개발 워크플로는 커스텀 스킬로 따로 정리해 둘 수도 있습니다. 저는 Compose Preview 확인, 커밋 메시지 작성, PR 설명 작성처럼 반복되는 작업을 [`kez-lab/android-custom-skills`](https://github.com/kez-lab/android-custom-skills)에 정리해 두었습니다. 공식 스킬이 Android 권장 패턴을 제공한다면, 커스텀 스킬은 팀이나 개인의 작업 방식을 에이전트에게 알려주는 보조 레이어로 볼 수 있습니다.

---

## 기본 개발 작업도 가능하다

물론 일반적인 Android 개발 작업도 Android CLI에서 수행할 수 있습니다.

### 프로젝트 생성

```bash
android create list
android create --output=./MyApp empty-activity-agp-9
android create --dry-run --verbose empty-activity-agp-9
```

`--dry-run`은 실제 파일을 만들지 않고 템플릿이 어떤 구조를 생성하는지 확인할 수 있어 유용합니다.

다만 실무 프로젝트에서는 회사별 Gradle convention, 모듈 구조, 내부 템플릿이 더 중요할 수 있습니다. 그래서 `android create`는 기존 대규모 앱을 대체한다기보다, 샘플 프로젝트 생성이나 에이전트 기반 스캐폴딩 검증에 더 잘 맞아 보입니다.

이미 존재하는 프로젝트를 분석할 때는 `android describe`를 사용할 수 있습니다.

```bash
android describe --project_dir=/path/to/project
```

이 명령은 프로젝트 구조와 빌드 결과물 위치를 찾는 데 필요한 메타데이터를 제공합니다. 에이전트가 APK 경로를 추측하지 않고 확인할 수 있다는 점에서 의미가 있습니다.

### SDK 관리

```bash
android sdk install platforms/android-34 build-tools/34.0.0
android sdk install platforms/android-34@2
android sdk update
android sdk list "platforms/android-.*"
```

버전 핀닝(`@version`)과 채널 선택(`--beta`, `--canary`)을 지원하므로 CI 환경에서 재현 가능한 SDK 구성을 만들 때 활용할 수 있습니다.

### 에뮬레이터 관리

```bash
android emulator create --list-profiles
android emulator create --profile=medium_phone
android emulator list
android emulator start medium_phone
android emulator stop emulator-5554
```

기존에는 AVD 생성과 실행을 위해 `avdmanager`, `emulator`, `adb`를 오가야 했습니다. Android CLI는 이 흐름을 `android emulator` 아래로 묶습니다.

단, 앞에서 언급했듯이 Windows에서는 현재 `android emulator` 명령이 제한되어 있으므로 macOS/Linux 기준으로 보는 편이 안전합니다.

### APK 배포

```bash
./gradlew assembleDebug
android run --apks=app/build/outputs/apk/debug/app-debug.apk
```

`android run`은 빌드를 수행하지 않습니다. Gradle로 APK를 만든 뒤, 그 결과물 경로를 `--apks`로 전달하는 방식입니다.

Split APK나 특정 디바이스 지정도 가능합니다.

```bash
android run --apks=base.apk,density-hdpi.apk,lang-en.apk
android run --apks=app-debug.apk --device=emulator-5554
```

공식 문서에는 특정 컴포넌트 타입을 지정하는 예시도 있지만, `--type` 지원 값은 현재 설치된 CLI 도움말과 맞춰 확인하는 것이 좋습니다.

```bash
android run -h
```

---

## 기존 도구를 대체하는가?

아직은 대체재라기보다 보조 계층에 가깝습니다.

| 도구 | 주 역할 |
| --- | --- |
| Android Studio | 코드 작성, 디버깅, 프로파일링 |
| Gradle Wrapper | 빌드, 테스트, 태스크 실행 |
| ADB | 디바이스 직접 제어 |
| sdkmanager / avdmanager | SDK와 AVD 관리 |
| Android CLI | 위 작업들을 에이전트/스크립트가 쓰기 좋은 공식 인터페이스로 연결 |

Android CLI가 의미 있는 이유는 기존 도구를 없애서가 아닙니다. 여러 도구를 조합해야 했던 자동화 흐름에 공식적인 진입점이 생겼다는 점입니다.

특히 `layout`, `screen`, `docs`, `skills`는 기존 Android CLI 도구들과 성격이 다릅니다. 이 명령들은 사람이 직접 쓰기에도 유용하지만, 실제로는 에이전트가 앱 상태를 이해하고 다음 행동을 결정하기 위한 인터페이스에 더 가깝습니다.

---

## 정리

Android CLI는 Android 개발을 터미널에서 더 일관되게 다루기 위한 공식 CLI입니다. 프로젝트 생성, SDK 설치, 에뮬레이터 관리, APK 배포 같은 기본 작업도 다루지만, 더 중요한 차별점은 `layout`, `screen`, `docs`, `skills` 같은 에이전트 친화 기능입니다.

아직 첫 릴리스 단계이고 Windows 지원에도 제한이 있습니다. 바로 실무 워크플로 전체를 바꿀 정도의 도구라기보다는, AI 에이전트와 Android 개발 환경이 어떻게 연결될지 보여주는 초기 신호로 보는 편이 적절해 보입니다.

## 참고 문서

- [Android CLI Overview](https://developer.android.com/tools/agents/android-cli)
- [Android CLI Download / Archive](https://developer.android.com/tools/agents/android-cli/archive)
- [Android CLI Release Notes](https://developer.android.com/tools/agents/android-cli/release-notes)
- [Agent tools and resources](https://developer.android.com/tools/agents)
- [kez-lab/android-custom-skills](https://github.com/kez-lab/android-custom-skills)
