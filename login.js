let getGetAssertionChallenge = (formBody) => {
  return fetch('http://localhost:3000/webauthn/login', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formBody)
  })
  .then((response) => response.json())
  .then((response) => {
      if(response.status !== 'ok')
          throw new Error(`Server responed with error. The message is: ${response.message}`);

      return response
  })
}

document.getElementById('login-form').addEventListener('submit', function(event) {
  event.preventDefault();
  let username = document.getElementById('username').value

  if(!username) {
    alert('Username is missing!')
    return
  }

  getGetAssertionChallenge({username: username})
  .then((response) => {
    response.rpId = "bjbpbalcmflngdfhbblddklhfbkdhapk";
    let publicKey  = preformatGetAssertReq(response);
    return navigator.credentials.get( {publicKey} );
  })
  .then((response) => {
    let getAssertionResponse = publicKeyCredentialToJSON(response);
    return sendAuthenticationResponse(getAssertionResponse);
  })
  .then((response) => {
    if(response.status === "ok") {
      console.log(response)
    } else {
      alert(`Server responed with error. The message is: ${response.message}`);
    }
  })
  .catch((error) => alert(error));
});


// 로그인 시 데스크탑 어플리케이션에서 디렉토리 경로 설정 필요
document.getElementById('test').addEventListener('click', function(event) {
  // read value from 
  fetch("file:///C:/Users/admin/Documents/test.json", {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  })
  .then(response => response.json())
  .then(response => {
    document.getElementById('test').innerText = response.test;
  })
  .catch((error) => alert(error));

  
});

