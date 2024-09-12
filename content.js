// 로그인 데이터 입력 감지
window.addEventListener('input', function (event) {
  const idFieldNames = ["id", "Id", "ID", "user", "User", "USER", "email", "Email", "EMAIL"]
  const urlNames = ["lg", "auth", "log"]
  const url = window.location.href
  const urlObject = new URL(url)
  const domain = urlObject.hostname

  if(urlNames.some(function (name) { return url.includes(name)})){
    if (event.target.type === "password"){
      chrome.runtime.sendMessage({ action: "passwordInput", domain: domain, password: event.target.value})
    }
    if (idFieldNames.some(function (name) { return event.target.id.includes(name) || event.target.name.includes(name)})){
      chrome.runtime.sendMessage({ action: "usernameInput", domain: domain, username: event.target.value})
    }
  }
});

// 로그인 시도 시 로그인 성공 여부 확인 프로세스 시작

// 로그인 버튼 혹은 로그인 링크 클릭시
window.addEventListener('click', function (event) {
  const loginButtonNames = ["log", "sign", "로그인"]
  const urlNames = ["lg", "auth", "log"]
  const url = window.location.href
  
  if(urlNames.some(function (name) { return url.includes(name)})){
    if(loginButtonNames.some(function (name) { return event.target.innerText.includes(name)})){
      if(event.target.tagName === "BUTTON" || event.target.tagName === "A"){
        chrome.runtime.sendMessage({ action: "loginTry", url: url})
      }
    }
    else{
      chrome.runtime.sendMessage({ action: "loginReset" })
    }
  }
});

// 엔터키 입력시
if(document.querySelector('input[type="password"]')){
  const ENTER = 13
  document.querySelector('input[type="password"]').addEventListener('keypress', function (event) {
    const urlNames = ["lg", "auth", "log"]
    const url = window.location.href

    if(urlNames.some(function (name) { return url.includes(name)}) && event.keyCode === ENTER){
      chrome.runtime.sendMessage({ action: "loginTry", url: url})
    }
  });
}

// 페이지 로드 시 인증 후 autofill
window.addEventListener('load', function (event) {
  const idFieldNames = ["id", "Id", "ID", "user", "User", "USER", "email", "Email", "EMAIL"]
  const loginUrlNames = ["lg", "auth", "log"]
  const urlObject = new URL(window.location.href)
  const domain = urlObject.hostname
  const xhr = new XMLHttpRequest()
  xhr.onreadystatechange = function() {
    if (xhr.readyState == XMLHttpRequest.DONE) {
      if(xhr.status == 200){
        const data = JSON.parse(xhr.responseText)
        // 서버에 해당 페이지에 대한 로그인 데이터가 있을 때
        if(data.length !== 0){
          // webauthn 인증 요구 필요
          //
          //
          // autofill
          const inputFields = document.querySelectorAll('input[type="text"], input[type="password"], input[type="email"]')
          inputFields.forEach(function (field) {
            if (field.type === "password") {
              field.value = data[0].password
            }
            if (idFieldNames.some(function (name) { return field.id.includes(name)})) {
              field.value = data[0].username
            }
          });
        }
      }
    }
  };

  // 로그인 페이지인 경우에만 임시 서버에 데이터 요청
  if(loginUrlNames.some(function (name) { return window.location.href.includes(name)})){
    xhr.open("GET", "http://localhost:3000/getData?domain="+domain, true)
    xhr.send()
  }
});