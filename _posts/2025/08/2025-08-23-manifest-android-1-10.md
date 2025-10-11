---
layout: post
title: "Manifest Android 정리 Q 1~10"
date: 2025-08-23 12:00:00 +0900
categories: [Android]
tags: [Android, Android Intent]
---

Manifest Android 책을 읽으면서 안드로이드 프레임워크에 대한 전반적인 이해를 높이기 위해 책을 읽고 기록하는 글입니다.

정리 방식은 다음과 같습니다.
1. 먼저 질문을 보고 책을 읽지 않고 개인적으로 알고 있던 내용을 먼저 적는다.
2. 책을 보고 알게 된 내용을 정리한다, 틀렸던 내용이 있다면 언급하여 수정한다.
3. 중요하거나 더 알고싶다고 생각한 부분이 있다면 추가로 조사 후 정리한다.

**[Template]**
#### 개인적으로 알고있던 내용
#### 책을 보고 알게 된 내용
#### 추가 내용



### Q) 1. 인텐트(Intent)란 무엇인가요?

#### 개인적으로 알고있던 내용
- Intent는 Bundle(key, value) 형태로 데이터를 전달하기 위한 객체이다.
- Intent는 Activity, Service, BroadcastReceiver 에서 각 컴포넌트 별 데이터 전송을 위해 사용된다.
- 대표적으로 사용되는 예시는 startActivity, ActivityLauncher의 callback 값 이 생각난다.
- Serializable, Parcelable 한 객체를 담아 보낼 수 있다.

#### 책을 보고 알게 된 내용
- Intent에 대한 한마디 정리로 수행될 작업에 대한 추상적인 설명이라고 얘기한다.
- 명시적, 암시적 Intent 가 있음을 까먹었다.
    - 명시적(Explicit) Intent : 
        - 정의: 호출한 컴포넌트를 직접 지정하여 명시하는 Intent
        - 사용 사례: 대상 컴포넌트를 알고있을 때, 내부 앱 네비게이션 로직
        - 시나리오: 대표적으로 Activity 이동 시
    - 암시적(Implicit) Intent :
        - 정의: 호출할 컴포넌트를 지정하지 않고, Action, Category, Data 를 기반으로 어떤 작업을 처리할지만을 선언함
        - 사용사례: 다른 앱, 시스템 컴포넌트를 이용할 경우 -> 예) URL 열기, 공유하기, 시스템 설정 화면 열기, 전화 걸기
- 즉 Intent 는 컴포넌트 간 앱 간 데이터 송신을 원활하게 하여 유연하고 효율적인 앱 개발이 가능하게끔 하는 메시징 객체
- 인텐트 필터(Intent Filters)란: 
    - 특정 Intent에 어떻게 대답할 수 있는지를 정의할 수 있는 객체
    - 즉 Intent 유형을 선언하는 필터 역할을 하며 Manifest.xml 파일에 명시해야함
    - 어떤 action·category·data(MIME/URI) 들을 처리할 수 있는지 명시해두면, 스템이 암시적 인텐트를 보낼 때 필터와 매칭 규칙으로 적합한 컴포넌트를 찾아 실행하는 구조

#### 추가 내용
- Intent Filters
    - Android 12(API 31)+ 타깃일 때 필터가 있는 컴포넌트는 android:exported를 반드시 명시해야 설치/빌드 오류가 나지 않음. [(문서)](https://developer.android.com/about/versions/12/behavior-changes-12)

### Q) 2. PendingIntent의 목적은 무엇인가요?

#### 개인적으로 알고있던 내용
- 써보긴 많이 써봤는데 잘 모름 까먹음..
- 대충 포그라운드 서비스 실행시킬 때 쓰는 걸로 알고 있음

#### 책을 보고 알게 된 내용
- PendingIntent는 다른 애플리케이션이나 시스템 컴포넌트가 애플리케이션을 대신하여 미리 정의된 Intent를 나중에 실행할 수 있는 권한을 부여하는 또 다른 종류의 Intent
    - 알림, 서비스 처럼 앱의 생명 주기를 벗어나 트리거 되야하는 작업에 유용
- PendingIntent의 주요 특징:
    - Intent의 wrapper 역할로 앱의 생명주기 이상의 지속성을 지니게 됨.
    - PendingIntent는 Activity, Service 또는 BroadcastReceiver를 위해 생성될 수 있음
    - PendingIntent는 상호작용 방식을 제어하는 다양한 플래그를 지원함
        - FLAG_UPDATE_CURRENT: 기존 PendingIntent를 새 데이터로 업데이트합니다.
        - FLAG_CANCEL_CURRENT: 새 PendingIntent를 만들기 전에 기존 PendingIntent를 취소합니다.
        - FLAG_IMMUTABLE: PendingIntent를 변경 불가능하게 만들어 수신자가 수정하는 것을방지합니다. (Android 12+ 에서 중요)
        - FLAG_ONE_SHOT: PendingIntent가 한 번만 사용될 수 있도록 보장합니다.

#### 추가 내용
- PendingIntent 의 정의가 어려워서 ChatGpt 에게 다시 물어봄
    - 답변: PendingIntent는 “나 대신 나의 권한으로 나중에 인텐트를 실행할 수 있는 시스템 보관용 토큰”이에요. 다른 앱(또는 시스템)이 이 토큰을 받아 내 앱의 정체성/권한으로 미리 정의한 작업을 실행합니다. 앱 프로세스가 죽어도 토큰은 유효
    - 이해한거: 대충 앱 대신 앱이 실행중이지 않더라도 앱처럼 실행시켜주는 비서 같은 Intent



### Q) 3. Serializable과 Parcelable의 차이점은 무엇인가요?

#### 개인적으로 알고있던 내용
- 둘 다 역/직렬화를 위해 사용됨
- Serializable은 Java 리플렉션을 통해 작동하여 성능이 좀 더 느린 것으로 알고 있음
- Parcelable은 Android에서 제공하는 API로 성능이 더 빠른 것으로 알고 있음
- 이를 통해 Bundle 에 Java/Kotlin 객체를 전달 가능함
#### 책을 보고 알게 된 내용
- Serializable
    - Serializable은 객체를 바이트 스트림으로 변환하여 Activity 간에 전달하거나 디스크에 쓸 수 있도록 하는 표준 Java 인터페이스
    - 사용사례: Serializable은 성능이 중요하지 않거나 안드로이드 특정 코드가 아닌 코드베이스를 다룰 때 유용(예시:안드로이드 비종속 모듈, Network 통신시 Json 파싱)
- Parcelable
    - Parcelable은 안드로이드 컴포넌트 내에서 고성능 프로세스 간 통신(IPC)을 위해 특별히 설계된 안드로이드 특정 인터페이스
    - 사용 사례: Parcelable은 성능이 중요한 안드로이드 데이터 전달, 특히 IPC나 Activity 또는 Service 간 데이터 전달
    - Parcelable은 직렬화 중에 모든 속성을 평면화하려고 함, 따라서 원시 타입이 아닌 필드를 수동으로 직렬화를 처리하기를 원한다면 프로퍼티에 @RawValue 어노테이션을 추가하고 수동으로 직렬화 로직을 추가할 수 있음
    - kotlin‑parcelize plugin이 구현을 자동으로 생성하여 Parcelable 객체를 만드는 과정을 단순화 함(@Parcelize 어노테이션을 붙이기만 하면 됨)
#### 추가 내용
- 


### Q) 4. Context란 무엇이며 어떤 유형의 Context가 있나요?
#### 개인적으로 알고있던 내용
- Application 의 전반적인 정보를 담은 추상 클래스
- 시스템 클래스, 리소스, 파일 등에 접근할 수 있도록 함
- 각 컴포넌트 실행 또한 담당

#### 책을 보고 알게 된 내용
- Context 란?
    - Context는 애플리케이션의 환경 또는 상태를 나타내며 애플리케이션별 리소스 및 클래스에 대한 접근을 제공
    - 앱과 안드로이드 시스템 간의 브릿지 역할
- Application Context
- Activity Context
- Service Context
- Broadcast Context

#### 추가 내용
- Activity에서 this와 baseContext 인스턴스의 차이점은 무엇인가요?
    - Activity
        - Activity에서 this는 현재 클래스의 자체 인스턴스로 ContextWrapper의 하위 클래스(따라서 간접적으로 Context의 하위 클래스)임
        - 따라서 Activity와 상호작용이 가능한 API를 호출할 수 있음(startActivity 등)
    - baseContext
        - baseContext 는 Activity가 상속하고 있는 ContextWrapper 클래스의 일부
        - 따라서 커스텀 ContextWrapper을 작업을 하거나 ContextWrapper가 가지고 있는 원본 Context를 참조해야 할 때 사용하는 경우에 사용
        - + 순수 Context 기능만 있음 (UI lifecycle 없음)
        - UI 테마/Window 정보가 없어 AlertDialog.Builder(baseContext) 같은 호출은 Crash 발생


### Q) 5. Application 클래스란 무엇인가요?

#### 개인적으로 알고있던 내용
- Application의 Lifecycle에 대한 콜백과 전역 상태 관리를 위한 클래스
- 앱 시작 시 필요한 Library들의 다양한 init을 Application 의 onCreate 에서 담당함(로깅, 광고, Context를 필요로 하는 등의 라이브러리)
- 기본적으로 DI 프레임워크가 IOC를 Application 주기 동안 들고 있기 때문에 관련이 있음
- WorkerManager도 Application 에서 초기화 함
- Dex 크기를 넘어설 경우 Multidex 를 설정했던 기억이 있음
#### 책을 보고 알게 된 내용
- Application 클래스는 전역 상태를 유지하고 애플리케이션 전체 초기화를 수행하도록 설계되었음
- Application 클래스의 주요 메서드
    1. onCreate(): onCreate() 메서드는 앱 프로세스가 생성될 때 호출, 일반적으로 데이터베이스 인스턴스, 네트워크 라이브러리 또는 Firebase 애널리틱스와 같은 분석 도구와 같은 애플리케이션 전체 의존성을 초기화하는 곳
    2. onTerminate(): 이 메서드는 에뮬레이션된 환경에서 애플리케이션이 종료될 때 호출 됨, 안드로이드가 호출을 보장하지 않으므로 실제 기기의 프로덕션 환경에서는 호출되지 않음
    3. onLowMemory() 및 onTrimMemory(): 이 메서드들은 시스템이 메모리 부족 상태를 감지할 때 트리거 됨 onLowMemory()는 이전 API 레벨에서 사용되며, onTrimMemory()는 앱의 현재 메모리 상태에 따라 더 세분화된 제어를 제공
- 사용 사례
    - 전역 리소스 관리: DB, SharedPreferences 등 초기화 및 앱 전역에 재사용 가능하게끔 구성
    - 컴포넌트 초기화
    - 의존성 주입: agger 또는 Hilt와 같은 프레임워크를 초기화하여 앱 전체에 의존성을 제공
#### 추가 내용


### Q) 6. AndroidManifest 파일의 목적은 무엇인가요?
#### 개인적으로 알고있던 내용
- Application Component(Activity, BroadcastReceiver, Content Provider, Service) 등록하는 곳
- 전반적인 Application에 필요한 정보를 등록하는 파일(권한, 테마, 네트워크 보안 룰, 랜딩 가능한 앱 패키지)

#### 책을 보고 알게 된 내용
- AndroidManifest.xml 파일은 안드로이드 운영 체제에 애플리케이션에 대한 필수 정보를 정의 하는 안드로이드 프로젝트에서 아주 중요한 구성 파일
- Application과 OS 간의 브릿지 역할을 하는 파일
- 주요기능: 
    - 하드웨어 및 소프트웨어 요구 사항: 카메라, GPS 또는 특정 화면 크기와 같이 앱이 의존하는 기능을 명시하여 Play Store가 이러한 요구 사항을 충족하지 않는 기기를 필터링하는 데 도움을 줌
    - 앱 메타 정보(App Metadata): 앱의 패키지 이름, 버전, 최소 및 대상 API 레벨, 테마, 스타일과 같은 필수 정보 제공
    - 인텐트 필터(Intent Filters): 컴포넌트에 대한 Intent Filters를 정의하여 응답 가능한 Intent 종류를 명시하고, 다른 앱이 개발자의 앱과 상호 작용할 수 있도록 함

#### 추가 내용
- 없음

### Q) 7. Activity 생명주기를 설명해주세요

#### 개인적으로 알고있던 내용
- 안드로이드 대표 컴포넌트!
- 유저와 직접 상호작용하는 화면
- 생성 ~ 파괴 까지의 수명주기를 가지고 있음
- intent filter 들을 활용해서 외부에서 특정 액티비티로 진입할 수 있음
- ContextWrapper 를 상속함
- Window 등의 UI 속성과 긴밀히 상관이 있음
- Back Stack 관리가 필요함
- Configuration Change 시 재생성 됨
- main thread가 5초 이상 block 되면 ANR 발생


#### 책을 보고 알게 된 내용
- onRestart() 는 onStart() 이전에 불리며, onRestart() 가 불려도 onStart()는 불림
- 

#### 추가 내용
- 문득 안드로이드의 실행은 어디서부터 시작되는가를 보면 main 이 없다는 것이 어색할 수 있음
  - 바로 [ActivityThread.java](https://cs.android.com/android/platform/superproject/+/android-latest-release:frameworks/base/core/java/android/app/ActivityThread.java;l=9018?q=ActivityThread&ss=android%2Fplatform%2Fsuperproject&hl=ar) 파일에서 동작이 시작됨


### Q) 8. Fragment 생명주기를 설명해주세요

#### 개인적으로 알고있던 내용
- Fragment 객체의 생명주기와 Fragment View의 생명주기는 다름
    - 따라서 View는 해제된 시점에 View에 접근하게 될 경우 예외적인 상황이 발생할 수 있음
    - 예를 들어 네트워크 통신 진행 완료 콜백 메서드에 UI 관련 로직이 있다면 문제가 되는 경우가 허다함.
    - 이를 방지하기 위해 LiveData, Flow + flowWithLifeCycle 조합등으로 더 건강한 앱 구조를 만들어야함
- lifecycleOwner 와 viewLifeCycleOwner 가 다름

#### 책을 보고 알게 된 내용
- fragmentManager와 childFragmentManager의 차이점
    - fragmentManager
        - FragmentActivity 또는 Fragment와 연결되어 있으며 Activity 수준에서 Fragment를 관리하는 역할
    - childFragmentManager
        - 하나의 Fragment에 속하며 해당 Fragment의 자식 Fragment를 관리
        - childFragmentManager에 의해 관리되는 자식 Fragment는 부모 Fragment에 의하여 범위가 지정되기에 부모 Fragment 가 사라지면 자식도 사라짐
- viewLifecycleOwner란
    - 뷰 계층과 관련된 LifecycleOwner
#### 추가 내용
- 

### Q) 9. Service란 무엇인가요?

#### 개인적으로 알고있던 내용
- 실제 사용자가 앱에 진입하지 않고도 특정 수행할 수 있도록 하는 컴포넌트(음악, 걷기, 다운로드, 그 외의 백그라운드 작업)
- 정확히는 기억 안나지만 언젠가부터 Service 동작 시 Notification 이 필수가 됨 ForegroundService -> 백그라운드에서 악의적인 동작을 수행하는 것을 방지(캡쳐, 해킹 등)

#### 책을 보고 알게 된 내용
- Bound Service는 안드로이드의 컴포넌트가 bindService()를 사용하여 서비스에 바인딩할 수 잇도록 함
    - 원격 서버에서 데이터 가져오기
    - 백그라운드 블루투스 연결 관리

#### 추가 내용
- Bound Service 한눈에 이해
	- 개념: 다른 컴포넌트(Activity/Fragment/Service 등)가 bindService()로 서비스에 붙어(Service에 접속) 서비스가 제공하는 메서드/기능을 직접 호출하는 구조.
	- 수명주기: 오직 바인딩으로만 시작된 서비스는 클라이언트가 ≥ 1명일 때만 살아 있고, 모든 클라이언트가 unbindService()로 떠나면 자동 종료(onDestroy) 됨.
    - → 단, startService()(또는 포그라운드 서비스)로 “시작”까지 해두면 바인딩이 모두 끊겨도 서비스는 계속 유지됨(직접 stopSelf()/stopService() 필요).

    - 언제 쓰나? (사례로 감 잡기)
	- UI에서 장시간 유지되는 연결·상태를 공유해야 할 때
	- 백그라운드 블루투스 연결 관리: 여러 화면에서 같은 연결(스캔/페어링/데이터 스트림) 상태를 공유하고, 화면이 바뀌어도 연결은 유지해야 함 → Bound Service로 연결 상태·API를 노출하면 모든 화면이 동일 객체/상태를 이용 가능.
- 개인적으로 작업할 때 startService 실행 시 같은 Class가 여러개가 뜰 수 있던 버그가 존재.
- 따라서 서비스가 여러개 실행되지 않도록 여러가지 조치를 취해야함

### Q) 10. BroadcastReceiver란 무엇인가요?
#### 개인적으로 알고있던 내용
- 시스템 및 앱 내의 전역이벤트 송수신을 위한 컴포넌트
- Google 은 Android 아키텍쳐를 어긴다고 LocalBroadcastManager 를 deprecated 시켜버림

#### 책을 보고 알게 된 내용
- 커스텀 BroadcastReceiver 등록(2가지 방법)
    - 매니페스트 파일을 통한 정적 등록
        - 앱이 실행 중이지 않을 때도 처리해야 하는 이벤트에 사용
        - 다만 앱이 프로세스에 올라가 있지 않은 경우에도 악의적으로 앱을 키기 위해 사용하는 경우가 늘어나면서 대부분이 막힌 것으로 알고 있음(디바이스 재부팅, 시간 마다 호출, 배터리 충전 연결)
    - 코드를 통한 동적 등록
        - 동적 등록은 등록, 해제를 컴포넌트 수명주기에 알맞게 직접 해줘야 함

- BroadcastReceiver 사용 사례
    - 네트워크 연결 변경 모니터링
    - SMS 또는 통화 이벤트에 응답

#### 추가 내용
- BroadcastReceiver 는 exported를 true로 두고, 다른 앱에서 신호 송신 시 수신 가능함


### Q) 11. ContentProvider의 목적은 무엇이며, 애플리케이션 간의 안전한 데이터 공유를 어떻게 용이하게 하나요?