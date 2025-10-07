---
layout: post
title: "Ktor 서버를 AWS Elastic Beanstalk을 활용하여 배포하는 방법"
date: 2025-03-30 12:00:00 +0900
categories: [Ktor, Aws, ELB, Elastic Beanstalk, Kotlin Multiplatform, Ktor 배포]
tags: [Ktor, AWS, Elastic Beanstalk, Deploy]
---

# Ktor 서버를 AWS Elastic Beanstalk을 활용하여 배포하는 방법

안녕하세요. 오늘은 Kotlin 기반의 웹 프레임워크인 Ktor 서버 애플리케이션을 AWS의 Elastic Beanstalk을 활용해 배포하는 방법을 기록해보고자 블로그를 작성하게 되었습니다.

특히 Ktor의 실행 방식, 빌드 전략, Fat JAR의 개념, 그리고 AWS 환경에서 안정적으로 작동하기 위한 저의 삽질 경험들을 포함하여 빠르고 안정적으로 배포할 수 있는 방법을 안내드릴 수 있도록 하겠습니다 ㅎㅎ

---

## 1단계: Ktor 프로젝트 구성 및 실행 방식 이해하기

Ktor는 JVM 기반의 경량 웹 프레임워크로, 서버 구동 방식에 따라 두 가지 실행 전략을 제공하는데요, 이에 따라 배포 시 고려해야할 요소가 달라지고 Elastic Beanstalk 환경 설정에도 영향을 미칩니다.

### 방식 1: `embeddedServer` 방식

Ktor 애플리케이션이 코드 내에서 직접 서버를 실행하는 방식입니다. 이 경우, 서버 포트, 호스트 등을 코드에 직접 명시합니다. Elastic Beanstalk에서는 내부적으로 5000번 포트를 통해 역방향 프록시가 애플리케이션으로 요청을 전달하므로, 반드시 해당 포트를 사용해야 합니다.

```
embeddedServer(Netty, port = 5000) {
    module()
}.start(wait = true)
```

### 방식 2: `application.conf` 기반 설정

코드가 아닌 외부 설정 파일(`application.conf`)을 통해 서버 실행 정보를 정의하는 방식입니다. 이 설정은 `EngineMain` 클래스를 엔트리 포인트로 사용할 때 필요합니다.

`resources/application.conf` 예시:

```
ktor {
    deployment {
        port = 5000
    }
    application {
        modules = [ com.example.ApplicationKt.module ]
    }
}
```

실행은 다음과 같이 `EngineMain`을 통해 이루어집니다:

```
fun main(args: Array<String>): Unit = EngineMain.main(args)
```

저는 환경변수 설정이나 프로덕트 운영측면에서 application.conf를 통해서 실행하는 것이 안정적이라 고생각하여 방법 2번으로 Ktor 애플리케이션을 개발했습니다.  

참고해주시면 감사하겠습니다.

---

## 2단계: Fat JAR란 무엇인가? 그리고 생성 방법

### Fat JAR이란?

Fat JAR(또는 Uber JAR)는 Java 애플리케이션 실행에 필요한 모든 클래스 파일, 라이브러리, 의존성 등을 하나의 JAR 파일로 통합한 실행 파일입니다. 이를 통해 외부에 추가적인 의존성 설치 없이도 단일 JAR만으로 애플리케이션을 실행할 수 있게 됩니다.

> 이게 좀 신기했던게 안드로이드의 경우 aar 파일은 종속 전이가 되지 않는데 Fat Jar는 그러한 문제를 방지하기 위해 애초에 의존성까지 통합한 방법이더라고요. 마치 PPT에서 폰트 포함해서 내보내기 느낌입니다 ㅎ.ㅎ

Elastic Beanstalk의 Java 플랫폼은 WAR 또는 JAR 파일을 실행 대상으로 사용하므로, Ktor 애플리케이션은 Fat JAR 형태로 빌드하는 것이 필수적입니다. 
따라서 해당 방법으로 Jar를 생성해줘야 합니다.

### Fat JAR 생성 방법

`build.gradle.kts` 파일에 다음 설정이 포함되어 있어야 합니다:

```
application {
    mainClass.set("com.example.ApplicationKt") // 또는 EngineMain 사용 시 해당 경로
}
```

그 후 다음 명령어를 실행합니다:

```
./gradlew buildFatJar
```

빌드가 완료되면 다음 경로에 Fat JAR이 생성됩니다:

- `build/libs/your-app-all.jar`

이 파일이 Elastic Beanstalk에 업로드할 대상 파일입니다.

---

## 3단계: Elastic Beanstalk 환경 생성 및 배포

### Beanstalk 설정 및 업로드 절차 (사진 추가 예정)

1. AWS Management Console에서 Elastic Beanstalk 서비스로 이동합니다.
2. [환경 생성]을 클릭합니다.
3. 플랫폼은 **Java**를 선택하고, 버전은 Amazon Corretto 17 이상을 사용합니다.
4. 환경 유형은 **웹 서버 환경**으로 설정합니다.
5. 업로드할 애플리케이션 소스로 프로젝트 경로 내 `build/libs/your-app-all.jar` 파일을 선택합니다.
6. VPC를 선택하여 어떤 인스턴스와의 연결을 할 지 선택합니다.
7. 이 후 제출하여 배포를 시작합니다.

### 배포 완료 후 확인 사항

- AWS에서 자동으로 생성된 도메인 URL을 통해 Ktor 애플리케이션이 실행되는지 확인합니다.
- 배포 중 에러가 발생한 경우, EC2 인스턴스의 로그 또는 CloudWatch를 통해 문제를 진단할 수 있습니다.

혹은 저같은 경우는 Log를 추출하여 GP에게 넘겨주는 방식으로 디버깅을 했습니다 . . .

---

## 4단계: 운영 환경에서 반드시 고려해야 할 사항

- Elastic Beanstalk은 **역방향 프록시 서버(NGINX)** 를 사용하여 외부 트래픽을 내부 애플리케이션 포트(기본 5000번)로 전달합니다.
- 반드시 포트를 5000번으로 설정해야 외부 연결이 가능해집니다.
- [환경 구성] 메뉴에서 EC2 인스턴스 타입, 오토스케일링 정책, 헬스 체크 경로(`/health` or `/` 등)를 설정하여 가용성과 안정성을 확보할 수 있습니다.
- 로그는 AWS CloudWatch와 연결되어 실시간 확인이 가능하며, 오류 발생 시 빠르게 대응할 수 있습니다.
- 설정 변경 시 애플리케이션이 자동 재배포될 수 있으므로, 운영 중에는 변경 사항을 신중히 적용해야 합니다.

---

이상으로 Kotlin Ktor 애플리케이션을 AWS Elastic Beanstalk에 배포하는 전체 절차를 살펴보았습니다. 본 글은 초심자뿐만 아니라 실무에서 직접 배포 환경을 구성하는 개발자에게도 도움이 되도록 모든 설정과 용어를 상세히 설명하는 데 중점을 두었습니다.

저는 안드로이드 개발자이기 때문에 AWS 환경 설정이라던가, Ktor 서버와 관련하여 틀린 내용이 있을 수 있습니다, 발견 시 편하게 제보해주시면 감사하겠습니다.

긴 글 읽어주셔서 감사합니다.