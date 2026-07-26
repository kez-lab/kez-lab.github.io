---
layout: post
title: "WebView 브릿지: addJavascriptInterface 대신 WebMessageListener 사용하기"
description: "Android WebView와 앱 사이 메시지 브릿지를 WebMessageListener와 origin 규칙으로 안전하게 구성하는 방법"
date: 2026-02-01T09:00:00+09:00
categories:
    - Android
tags:
    - Android
    - WebView
    - WebMessageListener
    - WebViewCompat
    - Security
---



## 핵심 요약

WebView와 네이티브 앱 간 통신에 `addJavascriptInterface` 대신 `WebMessageListener`를 권장합니다.

| 개선 항목 | 기존 (addJavascriptInterface) | 권장 (WebMessageListener) |
|----------|------------------------------|--------------------------|
| 콜백 스레드 | 백그라운드 스레드 | UI 스레드 |
| Origin 검증 | 직접 구현 필요 | 내장 지원 |
| 응답 처리 | evaluateJavascript 별도 호출 | replyProxy로 직접 응답 |
| 보안 | 전역 객체 노출 | postMessage 단일 채널 |

신규 프로젝트라면 WebMessageListener로 시작하시고, 기존 프로젝트도 WebView 버전 지원 범위가 충분하다면 마이그레이션을 검토해보시기 바랍니다.

---

## 배경

WebView를 사용하다 보면 JavaScript와 네이티브 앱 사이에서 데이터를 주고받아야 하는 경우가 많습니다. 웹에서 버튼을 누르면 앱의 카메라를 열어야 한다거나, 앱에서 로그인 토큰을 웹으로 전달해야 하는 상황이 대표적입니다.

그동안 이런 작업은 `addJavascriptInterface`로 처리해왔습니다. 동작에는 문제가 없지만, 개발 과정에서 몇 가지 불편한 점들이 있었습니다.

---

## 기존 방식의 문제점

### 1. 스레드 처리 번거로움

`@JavascriptInterface` 메서드는 백그라운드 스레드에서 호출됩니다. UI 업데이트가 필요할 때마다 별도의 스레드 전환 코드를 작성해야 합니다.
```kotlin
@JavascriptInterface
fun showToast(message: String) {
    // UI 스레드가 아니므로 직접 호출하면 크래시 발생
    Handler(Looper.getMainLooper()).post {
        Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
    }
}
```

### 2. Origin 검증 부재

어떤 origin에서 호출했는지 확인하는 기능이 내장되어 있지 않습니다. 보안이 중요한 경우 직접 검증 로직을 구현해야 합니다.

### 3. 양방향 통신의 복잡성

JavaScript에서 앱을 호출하는 것은 간단하지만, 앱에서 JavaScript로 응답을 돌려주려면 `evaluateJavascript`를 별도로 호출해야 합니다.
```kotlin
@JavascriptInterface
fun requestUserInfo() {
    val userInfo = getUserInfo()
    webView.post {
        webView.evaluateJavascript("receiveUserInfo('$userInfo')") { }
    }
}
```

요청과 응답의 쌍을 맞추기 어렵고, 콜백 ID를 직접 관리해야 하는 경우도 발생합니다.

---

## WebMessageListener 소개

androidx.webkit 1.3.0에서 추가된 `WebMessageListener`는 Web API의 `postMessage`와 유사한 방식으로 동작합니다.

### 주요 특징

- **UI 스레드 콜백**: `@UiThread` 어노테이션이 적용되어 있어 별도의 스레드 처리가 필요 없습니다.
- **Origin 검증 내장**: 허용할 origin을 명시적으로 지정할 수 있습니다.
- **JavaScriptReplyProxy**: evaluateJavascript 호출 없이 바로 응답을 전송할 수 있습니다.

---

## 구현 방법

### 앱 측 설정
```kotlin
private fun setupWebMessageListener() {
    if (!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
        setupLegacyJavascriptInterface()
        return
    }

    WebViewCompat.addWebMessageListener(
        webView,
        "appBridge",
        setOf("https://yourdomain.com"),
        object : WebViewCompat.WebMessageListener {
            override fun onPostMessage(
                view: WebView,
                message: WebMessageCompat,
                sourceOrigin: Uri,
                isMainFrame: Boolean,
                replyProxy: JavaScriptReplyProxy
            ) {
                handleMessage(message.data, replyProxy)
            }
        }
    )
}

private fun handleMessage(data: String?, replyProxy: JavaScriptReplyProxy) {
    when (data) {
        "getUserInfo" -> {
            val userInfo = getUserInfo()
            replyProxy.postMessage(userInfo)
        }
        "openCamera" -> {
            openCamera()
            replyProxy.postMessage("ok")
        }
        else -> replyProxy.postMessage("unknown command")
    }
}
```

### 웹 측 코드
```javascript
// 앱으로 메시지 전송
appBridge.postMessage("getUserInfo");

// 앱에서 오는 응답 수신
appBridge.onmessage = function(event) {
    console.log("앱 응답:", event.data);
};
```

### JSON 기반 구조화 통신

실무에서는 단순 문자열보다 JSON 형식으로 주고받는 것이 관리하기 편리합니다.
```kotlin
data class BridgeRequest(
    val action: String,
    val payload: JsonObject? = null,
    val callbackId: String? = null
)

data class BridgeResponse(
    val success: Boolean,
    val data: Any? = null,
    val error: String? = null,
    val callbackId: String? = null
)

private fun handleMessage(data: String?, replyProxy: JavaScriptReplyProxy) {
    val request = try {
        gson.fromJson(data, BridgeRequest::class.java)
    } catch (e: Exception) {
        replyProxy.postMessage(gson.toJson(BridgeResponse(false, error = "Invalid request")))
        return
    }

    val response = when (request.action) {
        "getUserInfo" -> {
            val userInfo = getUserInfo()
            BridgeResponse(true, data = userInfo, callbackId = request.callbackId)
        }
        "openCamera" -> {
            openCamera()
            BridgeResponse(true, callbackId = request.callbackId)
        }
        else -> BridgeResponse(false, error = "Unknown action", callbackId = request.callbackId)
    }

    replyProxy.postMessage(gson.toJson(response))
}
```
```javascript
function callNative(action, payload) {
    return new Promise((resolve, reject) => {
        const callbackId = Date.now().toString();

        const handler = (event) => {
            const response = JSON.parse(event.data);
            if (response.callbackId === callbackId) {
                appBridge.onmessage = null;
                response.success ? resolve(response.data) : reject(new Error(response.error));
            }
        };

        appBridge.onmessage = handler;
        appBridge.postMessage(JSON.stringify({ action, payload, callbackId }));
    });
}

// 사용 예시
const userInfo = await callNative("getUserInfo");
```

---

## 적용 시 주의사항

### 1. Feature 지원 여부 확인 필수

구형 WebView에서는 지원하지 않으므로 반드시 체크 후 fallback을 준비해야 합니다.
```kotlin
if (!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
    // addJavascriptInterface로 fallback
}
```

Chrome WebView 기준 버전 90 이상이면 대체로 안전합니다.

### 2. 로컬 파일 Origin 처리

file://이나 content://로 로컬 파일을 로드하면 `sourceOrigin`이 문자열 `"null"`로 전달됩니다.
```kotlin
// 잘못된 방식
if (sourceOrigin == null) { ... }

// 올바른 방식
if (sourceOrigin.toString() == "null") { ... }
```

로컬 파일 로드가 필요한 경우 `WebViewAssetLoader`를 사용하여 http/https origin으로 제공하는 것을 권장합니다.
```kotlin
val assetLoader = WebViewAssetLoader.Builder()
    .addPathHandler("/assets/", AssetsPathHandler(context))
    .build()

webView.webViewClient = object : WebViewClient() {
    override fun shouldInterceptRequest(
        view: WebView,
        request: WebResourceRequest
    ): WebResourceResponse? {
        return assetLoader.shouldInterceptRequest(request.url)
    }
}

webView.loadUrl("https://appassets.androidplatform.net/assets/index.html")
```

### 3. 기존 방식과의 혼용

기술적으로는 두 방식을 동시에 사용할 수 있습니다. 다만 통신 채널이 이원화되면 관리가 복잡해지므로 가능하면 한쪽으로 통일하시기 바랍니다.

---

## 결론

신규 프로젝트에서는 WebMessageListener 사용을 권장합니다. Origin 검증이 기본 제공되어 보안 측면에서 유리하고, UI 스레드 콜백으로 코드가 간결해집니다.

기존 프로젝트의 경우 WebView Feature 지원 범위를 확인한 후 마이그레이션을 검토해보시기 바랍니다. 인터페이스 설계가 상이하므로 점진적 마이그레이션보다는 일괄 전환이 효율적일 수 있습니다.

---

## 참고 자료

- [WebViewCompat.WebMessageListener - Android Developers](https://developer.android.com/reference/androidx/webkit/WebViewCompat.WebMessageListener)
- [WebViewAssetLoader - Android Developers](https://developer.android.com/reference/androidx/webkit/WebViewAssetLoader)
- [androidx.webkit releases](https://developer.android.com/jetpack/androidx/releases/webkit)
