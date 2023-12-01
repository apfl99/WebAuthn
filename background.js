// initialize credentials when extension is installed
// credential data is temporarily stored in chrome.storage.sync (추후에 삭제 필요)
// background console에서 chrome.storage.sync.get(null, function(result) { console.log(result); }); 명령어로 sync에 저장된 데이터 확인 가능

chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.sync.set({ credentials: [] });
});

// append new credentials when saveCredentials message is received
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "saveCredentials") {
    chrome.storage.sync.get({ credentials: [] }, function (result) {
      console.log(result)
      const credentialsList = result.credentials;
      credentialsList.push(request.credentials);
      chrome.storage.sync.set({ credentials: credentialsList });
    });
  }
});


