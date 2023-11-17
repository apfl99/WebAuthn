/* global $, QrCreator, register, login */
/* exported loadMainContainer, checkIfLoggedIn */

const renderMainContainer = (response) => {

	// Update name
	$("#name").text(response.name);
    
	// Clear credential table
	$("#credential-table tbody").html("");
	$("#userinfo-table tbody").html("");

	for(let authenticator of response.authenticators) {        
		$("#credential-table tbody").append("<tr><td><pre class\"pubkey\">" + authenticator.counter + "</pre></td><td><pre class=\"pubkey\">" + authenticator.credentialPublicKey + "</pre></td><td><pre class=\"pubkey\">" + new Date(authenticator.Created).toLocaleString() + "</pre></td></tr>");
	}

	if (response.siteinfos.length > 0) {
		for(let siteInfo of response.siteinfos) {        
			$("#userinfo-table tbody").append("<tr><td><pre class\"pubkey\">" + siteInfo.id + "</pre></td><td><pre class=\"pubkey\">" + siteInfo.password + "</pre></td><td><pre class=\"pubkey\">" + siteInfo.siteURL + "</pre></td></tr>");
		}
	}


	$("#registerContainer").hide();
	$("#mainContainer").show();
};

const loadMainContainer = () => {
	return fetch("personalInfo", {credentials: "include"})
		.then((response) => response.json())
		.then((response) => {
			if(response.status === "ok") {
				renderMainContainer(response);
			} else {
				alert(`Error! ${response.message}`);
			}
		});
};

let checkIfLoggedIn = () => {
	return fetch("isLoggedIn", {credentials: "include"})
		.then((response) => response.json())
		.then((response) => {
			if(response.status === "ok") {
				return true;
			} else {
				return false;
			}
		});
};

$("#button-logout").click(() => {
	fetch("logout", {credentials: "include"});
	$("#username")[0].value = ''
	$("#id")[0].value = ''
	$("#password")[0].value = ''
	$("#siteURL")[0].value = ''


	$("#registerContainer").show();
	$("#mainContainer").hide();
	$("#userinfoContainer").hide();
	$("#loginContainer").hide();
});


$("#button-register").click(() => {
	const username = $("#username")[0].value;
	if(!username) {
		alert("Username is missing!");
	} else {
		register(username);
	}
});

$("#button-addUserinfo").click(() => {
	$("#id")[0].value = ''
	$("#password")[0].value = ''
	$("#siteURL")[0].value = ''   
	$("#userinfoContainer").show();
	$("#loginContainer").hide();
});

$("#button-register-userinfo").click(() => {   
	const id = $("#id")[0].value;
	const password = $("#password")[0].value;
	const siteURL = $("#siteURL")[0].value; 
	if(!id && !password && !siteURL) {
		alert("Some field is missing!");
	} else {
		registerUserinfo(id, password, siteURL);
		$("#userinfoContainer").hide();
		$("#id")[0].value = ''
		$("#password")[0].value = ''
		$("#siteURL")[0].value = ''
	}
	
});

$("#button-websiteLogin").click(() => {   
	$("#websiteURL")[0].value = ''
	$("#websiteId")[0].value = ''
	$("#websitePassword")[0].value = ''
	$("#loginContainer").show();
	$("#userinfoContainer").hide();
});

$("#button-autofill").click(() => {   
	const websiteURL = $("#websiteURL")[0].value;
	if(!websiteURL) {
		alert("Website URL is missing!");
	} else {
		login(websiteURL);
	}
});
