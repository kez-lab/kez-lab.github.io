---
layout: post
title:  "[Android/Kotlin] ViewPager2로 Did not find frame 오류 때려 잡기(UI 버벅임 해결)"
---


안녕하세요! 오늘은 제가 최근에 마주쳤던 아주 난감한 오류 로그와, 그 문제를 해결하기 위해 겪었던 시련과 깨달음(?)을 공유해보려 합니다. 

오늘 다룰 내용은 바로 **`updateAcquireFence: Did not find frame`** 라는 빨간색의 무시무시한(?) 로그입니다.
![](https://velog.velcdn.com/images/kej_ad/post/b3cd6c24-f999-4f90-818b-0218e2f1d309/image.png)

개발하다 보면, 항상 새로운 도전이 나타나곤 하죠. 이번 도전은 평소엔 눈치 못챘었지만 오랜만에 앱을 키니까 갑자기 버벅거리는게 느껴지고 급히 로그캣을 확인하던 도중에 발견한 문제였죠


> **“updateAcquireFence: Did not find frame”**  
> **“FrameEvents: Did not find frame.”**  
> **“mReversing is false. Don’t call initChildren.”**  
> **“Skipped X frames! The application may be doing too much work on its main thread.”**

처음엔 “아, 또 스레드 문제인가?” 싶은 마음에 UI 스레드나 무거운 로직을 의심했는데, 정작 로그를 자세히 뜯어보니 뭔가 **렌더링 쪽에서 프레임을 놓쳐버렸다**는 느낌이었습니다. 그리고 실제로도 탭 전환 애니메이션이 끊기고, 사용자 입장에서도 화면이 버벅이는 현상이 보였습니다. 앱 품질에도 영향을 주는 중요한 문제였죠.

---

## 문제 상황: BottomNavigationView와 Fragment 전환

앱의 주요 구조는 `BottomNavigationView`로 탭을 구성하고, 각 탭을 `FragmentTransaction`(주로 `replace()`)으로 전환하는 방식이었습니다.

- **로그 경고**: `updateAcquireFence: Did not find frame` 같은 문구가 계속 뜸  
- **프레임 드롭**: 화면 전환 시 애니메이션이 자연스럽게 이어지지 못하고 끊김  
- **사용자 경험 저하**: “앱이 왠지 무겁고 버벅이는 것 같은데?”라는 느낌을 주게 됨  

---

## 초반 의심 대상은? 무거운 애니메이션 요소들 . . .

“어쩌면 Home화면에 있는 거대한 Lottie View가 문제일 수도 있지 않을까?” 혹은 “ProgressBar 애니메이션이 뭔가 끼어들었나?” 등등, 흔히 생각할 수 있는 애니메이션 요소들을 하나씩 배제해보았습니다.

- **Lottie 제거**  
  - 탭 전환 시 쓰던 Lottie를 다 빼고 테스트해봤지만, 여전히 로그가 뜨고 버벅임도 사라지지 않음.  

- **ProgressBar 애니메이션 제거**  
  - 로딩 시 애니메이션 효과를 없앴는데도 변함없음.  

- **RecyclerView Adapter 정리**  
  - HomeFragment는 RecyclerView 구조로 되어있었기 때문에 `onDestroyView()`에서 제대로 정리되지 않은 Adapter가 문제일까 싶어 `null` 처리를 철저히 해봤지만 여전히 똑같은 로그가…

그야말로 ‘눈물의 배제법’이었습니다. 그런데도 문제가 전혀 나아지지 않아 답답하더군요.

---

## 🔎 Profiler로 근본적인 프레임 버벅임의 원인을 찾아보자

여기서 저는 근본적인 원인을 분석해야한다 생각했고 이러한 분석이 가능한 도구가 바로 **Android Studio의 Profiler**이죠!!

실제로 렌더링 시간을 체크해보니, 특정 프레임이 **예상(8.33ms)을 훌쩍 넘겨 100~200ms 이상** 소요되고 있었습니다.
![](https://velog.velcdn.com/images/kej_ad/post/f5391dcf-ef0c-436d-a0a0-79dbc6769e33/image.png)

아주 세세한 타임라인 이벤트를 보면 한 프레임에서 UI 스레드와 Render 스레드 모두 여러 작업(뷰 인플레이션, 이미지 디코딩, 텍스처 업로드 등)을 ‘몰아서’ 처리하고 있음을 알 수 있는데요

이러한 타임라인 이벤트를 스레드 별 로 요약하자면 다음과 같은 단계를 거치고 있는 상황입니다.

**1. 메인 스레드(Main)**
- `RV CreateView / RV OnBindView`: RecyclerView에 대한 itemView 할당
- `inflate()` → ConstraintLayout 등 복잡한 레이아웃 인플레이션
- `AssetManager::OpenNonAsset, ImageDecoder#decodeDrawable`: 큰 이미지를 디코딩하여 화면에 쓸 수 있는 형태로 변환하는 작업
- `measure(), layout()`: 뷰의 크기를 계산하고, 계산된 크기대로 화면에서의 위치를 배치하는 과정

**2. 렌더 스레드(Render)**
- 대형 이미지를 Texture upload(1080×1290 등)로 GPU에 업로드
- 추가로 VectorDrawable, 더 작은 PNG들까지 연달아 업로드
- 업로드가 끝난 뒤에야 flush commands → 실제 그리기 마무리

**이 모든 과정이 한 번의 프레임 안에 몰리면서 총 소요 시간이 Expected 8.33ms가 아니라 224.33ms까지 늘어나게 된 것입니다!!!**


### 더 간단하게 얘기하자면
- `replace()` 함수로 **새로운 Fragment**를 생성하고 이전 Fragment를 삭제하는 과정에서 화면 전체가 다시 그려지는 수준의 비용이 발생
- 탭마다 `RecyclerView`나 무거운 뷰들이 잔뜩 있는 상황이라, 매번 전환 후 View 재생성 마다 큰 부담  

즉, **“매번 뷰를 새로 갈아끼우는 구조 자체가 문제”**였던 겁니다.

### 이로 인한 ‘Deadline missed’ 발생
안드로이드에서는 [120fps 기기 기준](https://www.sportsadda.com/esports/news-esports/bgmi-3-5-update-120-fps-support-android-ios-devices/)으로 [8.33ms안에 한 프레임이 마무리돼야 매끄럽게 보이는데요,](https://www.xda-developers.com/smartphone-display-refresh-rates-explained/)

현재 로그에는 224.33ms(약 0.22초)가 걸려 버렸으니 약 26배 이상 지연된 셈이며,
그로인해 “Skipped X frames!”라는 메시지가 뜨며 사용자가 버벅임을 느끼게 되는 것이죠

---

## 해결 방법 고르기: `Fragment show/hide` vs **ViewPager2**

Profiler에서 원인을 찾은 뒤, 크게 두 가지 방법을 고민했습니다.

1) **`show/hide` 접근**  
   - 이미 생성된 Fragment를 `show()` / `hide()`만 하여 재구성 비용 줄이기  
   - Fragment 하나당 인스턴스를 계속 유지하므로 탭에 따라 **메모리 사용**이 늘어날 수도 있음  
   - `replace()` 대신 `add()`, `show()`, `hide()` 구조로 변경 시, 기존 코드가 많이 달라질 수 있음  

2) **`ViewPager2 + FragmentStateAdapter`**  
   - 각 탭(Fragment)을 **미리 로드**하고, 필요한 시점에 **화면만 전환**  
   - **장점**  
     - `FragmentStateAdapter`: 정리 가능한 Fragment의 뷰를 ‘메모리에서 날려’ 필요 시 다시 그려주지만, **상태는 유지**하므로 전환이 가벼움
     - **Lifecycle**을 적절히 관리하며, 코드 구조가 깔끔해짐  
     - `BottomNavigationView`와 쉽게 연동 가능 
   - **단점**  
     - 탭이 아주 많다면, 미리 만들어둔 Fragment 개수만큼 메모리에 부담이 될 수 있음  

### 왜 `ViewPager2`를 선택했을까?

- **유지보수성**: `FragmentStateAdapter`를 사용하는 방식이 직관적이고, 화면 전환 로직도 단순해짐  
- **상태 및 Lifecycle 관리**: Fragment를 매번 새로 안 만들어도 되고, 필요 시 뷰만 다시 그려주는 구조라서 효율적인 Fragment 관리 체계를 위임할 수 있음(더 자세한 내용은 FragmentStateAdapter의 내부를 (예: MaxLifecycleEnforcer, store 매커니즘) 공부해보면 좋습니다.)
- **하위 호환성**: Jetpack 라이브러리라 여러 안드로이드 버전에서 안정적으로 동작  

기존 `show/hide` 방식을 쓰면 각 Fragment를 계속 메모리에 띄워두는 형태가 되지만, `ViewPager2 + FragmentStateAdapter`는 **OffscreenPageLimit에 따라 Fragment를 유지하고 적절히 뷰만 파기하고 다시 복원**하기 때문에, 화면 수가 많아도 생각보다 부담이 적습니다.

---

## ViewPager2 적용 코드 예시

아래는 실제로 적용한 예시 코드입니다.

``` kotlin
# MainActivity.kt
. . .
    private fun initViewPager() {
        binding.vpMain.apply {
            isUserInputEnabled = false
            adapter = MainAdapter(this@MainActivity)
            setCurrentItem(MainScreen.HOME.ordinal, false)

        }
    }

    private fun initBottomNavigation() {
        binding.bnvMain.selectedItemId = R.id.home_dest
        binding.bnvMain.setOnItemSelectedListener { menuItem ->
            when (menuItem.itemId) {
                R.id.challenge_dest -> binding.vpMain.setCurrentItem(
                    MainScreen.CHALLENGE.ordinal,
                    false
                )

                R.id.home_dest -> binding.vpMain.setCurrentItem(
                    MainScreen.HOME.ordinal,
                    false
                )

                R.id.my_page_dest -> binding.vpMain.setCurrentItem(
                    MainScreen.MY_PAGE.ordinal,
                    false
                )
            }
            true
        }
    }
. . .


# MainAdapter.kt

class MainAdapter(fragmentActivity: FragmentActivity) : FragmentStateAdapter(fragmentActivity) {
    override fun getItemCount(): Int = MainScreen.entries.size

    override fun createFragment(position: Int): Fragment {
        return when (MainScreen.fromPosition(position)) {
            MainScreen.CHALLENGE -> ChallengeFragment()
            MainScreen.HOME -> HomeFragment()
            MainScreen.MY_PAGE -> MyPageFragment()
        }
    }
}
```

[Github PullRequset 링크](https://github.com/Team-HMH/HMH-Android/pull/288/files#diff-3bab0309c6e02ccec74ae94de2dc5907b411067c5b1e4f0369b1a7496d1f0708)

아주 간단히, **ViewPager2** 어댑터를 등록하고, `BottomNavigationView`와 연동했습니다. 이제 탭 전환 시 `replace()`를 매번 호출하지 않으니, 재인플레이션 때문에 발생하던 **렌더링 과부하**가 드라마틱하게 줄어들었습니다.

---

## 결론: 결국 문제는 ‘재생성 비용’이었고, 해결책은 Fragment의 재생성 과정 생략과 상태 유지

- **근본 원인**: 매번 `replace()`로 Fragment를 새로 붙이는 구조가 탭 전환 시 큰 렌더링 비용을 야기  
- **해결 포인트**: Profiler로 화면 전환 시 렌더링이 얼마나 오래 걸리는지 ‘수치화’해보고, **재생성 비용**이 크다는 점을 확인  
- **결과**: Off-screen 범위 내에서 `ViewPager2`를 이용해 Fragment 상태를 유지하니까 탭 전환시마다 반복되던 아래 작업이 생략됨
  1. Fragment의 Add(), Remove() 과정의 반복 생략
  2. inflate() 반복 과정의 생략

**따라서 로그 경고와 프레임 드롭이 없어짐**

이 과정을 통해, **“문제를 회피하기보단 정면으로 들여다보자!”**라는 개발의 기본 철학을 다시금 되새기게 되었습니다. 특히 Android Studio Profiler를 제대로 써본 덕분에 막연히 “뭐가 문제인지 모르겠다” 하고 있던 상태에서 벗어날 수 있었던 것 같습니다 ㅎ.ㅎ

> **혹시 비슷한 로그나 프레임 드롭 문제에 부딪혔다면,  **
> 1) 전환 방식(특히 `replace()` 연쇄 호출)을 의심해볼 것  
> 2) Profiler로 실제 ‘렌더링 타임’을 체크해볼 것  
> 3) 필요한 경우 **ViewPager2**나 `show/hide` 방식을 고려해볼 것  

---

### 한마디로 정리
> **“🥵 ViewPager2로 갈아타고 나니, 그 지긋지긋한 ‘Did not find frame’ 로그가 감쪽같이 사라지더라!”**

물론, 모든 상황에 **100%** 통하는 만능 해결책은 아니지만, 탭 간 전환 시 무거운 UI를 자주 쓰는 구조라면 큰 도움이 될 것입니다. 

이번 글에서는 시행착오를 거쳐서라도 근본 원인을 찾아내었고 이를 통해서 근본적인 해결책을 발견하여 해결했던 경험으로 꽤나 어렵고 복잡하고 시간 걸리는 일이였던 것 같습니다 ㅠ.ㅠ

개발은 늘 새로운 문제와의 싸움이자, 동시에 새로운 배움의 기회라고 생각합니다 하핳 부디 여러분도 비슷한 문제로 고생 중이라면 이 글이 많은 힌트가 되시길 바라면서 저는 이만!

**긴 글 읽어주셔서 감사합니다.**

---

## 글 마무리에 추가 팁

- **구현 시 주의점**:  
  - ViewPager2로 전환할 때, 기존 Fragment Transaction 코드(`replace()`, `add()`, `remove()`)를 **함께** 쓰지 않도록 구조를 정리해야 합니다.  
  - 중복으로 Fragment가 붙거나, 예기치 않은 버그가 생길 수 있습니다. (바보짓으로 30분 날린 사람 여깄슴다)

- **Profiler 사용 습관**:  
  - “Profiler는 느려질 때만 쓴다” 라기 보다는, 무거운 작업이 배포되는 경우 일정 주기로 성능 체크를 해두면 나중에 문제 터질 때 쉽게 비교할 수 있다고는 생각합니다.
  - 다만 너무 잦은 분석에 빠진다면 정작 개발할 시간을 뺏길수도? 적적한 주기를 팀에서 정하는 것이 좋을 것 같다고 생각됩니다. **(정답은 없음)**
