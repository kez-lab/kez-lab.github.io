---
layout: post
title: "Manifest Android 정리 Q 11~15"
date: 2025-09-23 12:00:00 +0900
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


### Q) 11. ContentProvider의 목적은 무엇이며, 애플리케이션 간의 안전한 데이터 공유를 어떻게 용이하게 하나요?

#### 개인적으로 알고있던 내용
- 이미지 앱이나, 전화번호부 등 데이터를 공유하기 위해 사용되는 컴포넌트

#### 책을 보고 알게 된 내용
- ContentProvider는 애플리케이션 간 데이터 공유를 위한 표준화된 인터페이스를 제공하는 컴포넌트
- 다른 앱이나 컴포넌트가 나의 앱에 데이터를 CRUD 할 수 있도록 중앙 저장소 역할을 통해 안전하고 일관된 데이터 공유를 보장
- 특히 여러앱이 동일한 데이터에 접근해야하거나 DB 를 노출하지 않고 다른앱에 데이터를 제공할 때 용이
- ContentProvider의 목적: 데이터 접근 로직을 캡슐화하여 앱 간 데이터 공유를 더 쉽고 안전하게 만드는 것
- ContentProvider의 주요 구성 요소:
    - 데이터 접근 주소로 URI를 사용
    - 
- ContentProvider 구현하기:
    - contentProvider를 생성하려면 ContentProvider를 상속받고 다음 메서드를 구현
        - query(): 데이터를 검색
        - insert(): 새 데이터를 추가
        - update(): 기존 데이터를 수정
        - delete(): 데이터를 제거
        - getType(): 데이터의 MIME 유형을 반환
- ContentProvider에서 데이터 접근하기: 
    - ContentResolver 클래스로 상호 작용 가능
- ContentProvider의 onCreate() 메서드는 Application.onCreate() 메서드보다 먼저 호출 됨 (Jetpack App Startup 라이브러리)

#### 추가 내용


### Q) 12. 구성 변경(configuration changes)을 어떻게 처리하나요?
#### 개인적으로 알고있던 내용
- 구성 변경이란 화면의 회전, 테마의 속성 변경 등 화면의 전반적인 내용이 변할 때 앱 내에서도 이를 반영하기 위한 시스템의 재구성 동작
- 구성변경 발생 시 Activity 는 재생성되기 때문에 Activity 에서 초기화를 진행한 변수와 상태는 모두 초기화 됨. 
- 필자는 여기서 유지해야하는 데이터의 경우 크게 2가지 방법으로 유지 시킴
    - SavedInstanceHandle 을 활용하여 Bundle에 key - value 형식으로 저장 및 복원
    - ViewModel을 활용하여 상태 유지
    - 이 2가지 방식은 실은 엄청난 큰 차이가 있음(SavedInstanceHandle는 프로세스가 앱을 종료시킬 때도 남아있지만, ViewModel 은 오직 구성변경에 대해서만 체크해서 ViewModel 인스턴스를 유지시킴)
#### 책을 보고 알게 된 내용
- 복원 방법: 
    - UI 상태 저장 및 복원: onSaveInstanceState() 및 onRestoreInstanceState() 메서드를 구현하여 Activity 재생성 중 UI 상태를 보존하고 복원
    - Jetpack ViewModel: ViewModel 클래스를 활용하여 구성 변경에도 유지되어야 하는 UI 관련 데이터를 저장
    - 구성 변경 수동으로 처리하기: 애플리케이션이 특정 구성 변경 중에 리소스를 업데이트 할 필요가 없고 Activity 재시작을 피하고 싶다면, AndroidManifest.xml에서 Activity가 처리할 구성 변경 사항을 android:configChanges 속성을 사용하여 선언할 수 있음
    - Jetpack Compose 에 서 rememberSaveable 활용
#### 추가 내용
- SavedInstanceHandle는 

### Q) 13. 안드로이드는에서 메모리를 어떻게 효율적으로 관리하며, 메모리누수(memory leaks)를 어떻게 방지하는지 설명해주세요.
#### 개인적으로 알고있던 내용
- 안드로이드는 사용되지 않는 메모리를 자동으로 회수하여 활성 중인 애플리케이션 및 서비스에게 효율적인 메모리 할당을 보장하는 가비지 컬렉션(garbage collection) 메커니즘을 통해 메모리를 관리

#### 책을 보고 알게 된 내용
#### 추가 내용

