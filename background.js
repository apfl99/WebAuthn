chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.sync.set({ loginData: {domain: "", username: "", password: ""} })
  chrome.storage.sync.set({ loginTryUrl: "" })
});

// 로그인 데이터 입력 및 로그인 시도 감지
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  chrome.storage.sync.get({ loginData: {domain: "", username: "", password: ""}, loginTryUrl: "" }, function (result) {
    var loginData = result.loginData
    if (request.action === "usernameInput") {
      loginData["domain"] = request.domain;
      loginData["username"] = request.username;
      chrome.storage.sync.set({ loginData: loginData });
    }

    if (request.action === "passwordInput") {
      loginData["domain"] = request.domain;
      loginData["password"] = request.password;
      chrome.storage.sync.set({ loginData: loginData })
    }

    if (request.action === "loginTry") {
      chrome.storage.sync.set({ loginTryUrl: request.url })
    }  
  })
});

// 페이지 전환 시 로그인 성공 확인
chrome.webNavigation.onCommitted.addListener(details => {
  const loginUrlNames = ["lg", "auth", "log"]
  chrome.storage.sync.get({ loginData: {domain: "", username: "", password: ""}, loginTryUrl: "" }, function (result) {
    if (!details.url.startsWith("chrome://extensions") && !details.url.startsWith("about:blank")) {
      // 로그인 시도가 있을때
      if(result.loginTryUrl){
        // 로그인 성공
        if(!(loginUrlNames.some(function (name) { return details.url.includes(name)}))){
          chrome.storage.sync.set({ loginTryUrl: "" });
          fetch("https://demoworld.ddns.net/getData?domain="+result.loginData["domain"], {
            method: "GET",
            headers: {
              "Content-Type": "application/json"
            }
          })
          .then(response => response.json())
          .then(data => {
            if(data.length === 0 && result.loginData["username"] && result.loginData["password"]){
              chrome.windows.create({
                type: "popup",
                url: "saveLoginData.html",
                width: 300,
                height: 300
              });
            }
          })
        }
        // 로그인 실패
        else if(details.url.includes(result.loginTryUrl)){
          chrome.storage.sync.set({ loginData: {domain: "", username: "", password: ""}, loginTryUrl: "" })
        }
      }
    }
  })
});