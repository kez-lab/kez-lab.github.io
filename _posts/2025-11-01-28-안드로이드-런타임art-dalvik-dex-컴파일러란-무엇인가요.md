---
layout: post
title: 안드로이드 런타임(ART), Dalvik, Dex 컴파일러란?
description: ""
date: null
categories: []
tags: []
---

## ART 란?
Android RunTime 은 안드로이드 설치 시 중에 바이트코드를 기계어로 변환
런타임 시 JIT 컴파일의 필요성을 없애 앱 시작시간 단축 및 실행 중 CPU 사용량 개선

### ART 주요 특징

#### 1. 개선된 성능
ART는 앱 성능을 개선할 수 있는 AOT 컴파일을 도입함
설치 시 ART는 기기의 dex2oat 도구를 사용하여 앱을 컴파일 함 이 유틸리티는 DEX 파일을 받아서 대상 기기에서 실행할 수 있는 컴파일된 앱을 생성

최적화된 기계 코드를 생성하여 런타임 오버헤드를 줄임


#### 2. 가비지 컬렉션 개선
가비지 컬렉션(GC)은 리소스 집약적이므로 앱 성능을 저하시켜 화면 끊김, UI 응답성 부족 등의 문제를 유발할 수 있음
따라서 ART에서는 다음과 같은 여러 가지 방법으로 가비지 컬렉션을 개선했음

- 단일 GC 일시중지가 있는 동시 실행 설계
- 백그라운드 메모리 사용량 및 조각화를 줄이기 위한 동시 복사
- 힙 크기와 무관한 GC 일시중지 길이
- 최근 할당된 단기 객체를 정리하는 특별한 경우 총 GC 시간이 짧아지는 컬렉터
- 동시 가비지 컬렉션이 더욱 적절한 때에 실행되기 때문에 일반적인 사용 사례에서 GC_FOR_ALLOC 이벤트가 거의 발생하지 않도록 하는 개선된 가비지 컬렉션 에르고노믹스

#### 3. 디버깅 및 프로파일링 지원

##### 프로파일링
ART 이전까지 Android 개발자는 앱 실행 트레이싱을 위한 Traceview 도구를 프로파일러로 사용했었음 
Traceview는 유용한 정보를 제공하지만 Dalvik상의 결과가 메서드 호출당 오버헤드에 의해 왜곡되며 Traceview를 사용하면 런타임 성능에 큰 영향을 미친다는 단점이 있음

따라서 ART에는 이러한 제한사항이 없는 전용 샘플링 프로파일러에 관한 지원이 추가됨  
이렇게 하면 속도를 크게 떨어뜨리지 않으면서 앱 실행을 더욱 정확하게 확인할 수 있음

##### 디버깅 기능 추가 지원
ART는 특히 모니터 및 가비지 컬렉션 관련 기능에서 새로운 디버깅 옵션을 다수 지원

**[예시]**
1. 스택 트레이스에 어떤 잠금이 있는지 확인한 다음 잠금이 있는 스레드로 이동합니다.
2. 특정 클래스에 라이브 인스턴스가 얼마나 있는지 묻고 인스턴스 확인을 요청한 뒤 객체를 유지하는 참조를 확인합니다.
3. 특정 인스턴스와 관련하여 중단점 등의 이벤트를 필터링합니다.
4. 'method-exit' 이벤트를 사용하여 종료 시 메서드가 반환한 값을 확인합니다.
5. 특정 필드가 액세스 또는 수정될 때 프로그램 실행을 정지하도록 필드 watchpoint를 설정합니다.


##### 예외 및 비정상 종료 보고서의 진단 세부정보 개선
ART는 런타임 예외가 발생할 때 최대한 많은 컨텍스트와 세부정보를 제공

ART는 java.lang.ClassCastException, java.lang.ClassNotFoundException, java.lang.NullPointerException과 관련하여 확장된 예외 세부정보를 제공

Dalvik의 이후 버전에서는 java.lang.ArrayIndexOutOfBoundsException 및 java.lang.ArrayStoreException과 관련하여 확장된 예외 세부정보가 제공되었으며 현재는 배열의 크기와 범위를 벗어난 오프셋이 포함됨.

예를 들어 java.lang.NullPointerException은 이제 앱에서 작성하려고 했던 필드 또는 앱에서 호출하려고 했던 메서드 등 앱이 null 포인터로 실행하려고 했던 작업에 관한 정보를 표시


```
java.lang.NullPointerException: Attempt to write to field 'int
android.accessibilityservice.AccessibilityServiceInfo.flags' on a null object
reference


java.lang.NullPointerException: Attempt to invoke virtual method
'java.lang.String java.lang.Object.toString()' on a null object reference
```

또한 ART는 앱 네이티브 비정상 종료 보고서에 Java 및 네이티브 스택 정보를 모두 포함시키기 때문에 더 풍부한 컨텍스트 정보를 제공

