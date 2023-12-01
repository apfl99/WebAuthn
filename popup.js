document.addEventListener("DOMContentLoaded", function () {
  chrome.storage.sync.get({ credentials: [] }, function (result) {
    const credentialsList = result.credentials;
    const credentialListElement = document.getElementById("credentialList");
    
    credentialsList.forEach(function (credentials) {
      const url = new URL(credentials.url);
      const domain = url.hostname;

      const listItem = document.createElement("li");
      const usernameElement = document.createElement("span");
      const passwordElement = document.createElement("span");

      usernameElement.textContent = `\n Username: ${credentials.username}`;
      passwordElement.textContent = `\n Password: ${credentials.password}`;

      listItem.innerHTML = `URL: ${domain}<br>`;
      listItem.appendChild(usernameElement);
      listItem.innerHTML += '<br>';
      listItem.appendChild(passwordElement);

      credentialListElement.appendChild(listItem);
    });
  });
});
