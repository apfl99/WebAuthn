const express   = require("express");
const Fido2     = require("../utils/fido2");
const config    = require("../config");
const crypto    = require("crypto");
const router    = express.Router();
const database  = require("../db/db");
const username  = require("../utils/username");
const userNameMaxLenght = 25;

const base64 = require("@hexagon/base64");
const SimpleWebAuthnServer = require('@simplewebauthn/server');

let f2l = new Fido2(config.rpId, config.rpName, undefined, config.challengeTimeoutMs);

/**
 * Returns base64url encoded buffer of the given length
 * @param  {Number} len - length of the buffer
 * @return {String}     - base64url random buffer
 */
let randomBase64URLBuffer = (len) => {
	len = len || 32;
	let buff = crypto.randomBytes(len);
	return base64.fromArrayBuffer(buff, true);
};


router.post("/register", async (request, response) => {

	if(!request.body || !request.body.username || !request.body.name) {
		response.json({
			"status": "failed",
			"message": "Request missing name or username field!"
		});
		return;
	}

	let usernameClean = username.clean(request.body.username),
		name     = usernameClean;

	if (!usernameClean) {
		response.json({
			"status": "failed",
			"message": "Invalid username!"
		});
	}
    
	if ( usernameClean.length > userNameMaxLenght ) {
		response.json({
			"status": "failed",
			"message": "Username " + usernameClean + " too long. Max username lenght is " + userNameMaxLenght + " characters!"
		});
		return;
	}

	let db = database.getData("/");

	if(db.users[usernameClean] && db.users[usernameClean].registered) {
		response.json({
			"status": "failed",
			"message": `Username ${usernameClean} already exists`
		});
	}

	let id = randomBase64URLBuffer();

	database.push("/users",
		{ 
			[usernameClean]: {
				name: name,
				registered: false,
				id: id,
				authenticators: [],
				siteinfos: []
			}}, false);

	let challengeMakeCred = await f2l.registration(usernameClean, name, id);


	// Transfer challenge and username to session
	request.session.challenge = challengeMakeCred.challenge;
	request.session.username  = usernameClean;

	// Respond with credentials
	response.json(challengeMakeCred);
});


router.post("/registrationResponse", async (request, response) => {

	// Verify the attestation response
	let verification;
	try {
		verification = await SimpleWebAuthnServer.verifyRegistrationResponse({
			response: request.body,
			expectedChallenge: request.session.challenge,
			expectedOrigin: config.origin,
			expectedRPID: config.rpId
		});
	} catch (error) {
		console.error(error);
		return response.status(400).send({error: error.message});
	}
	const {verified, registrationInfo} = verification;

	registrationInfo.transports = request.body.transports;
	registrationInfo.Created = new Date().getTime();
	registrationInfo.credentialPublicKey = base64.fromArrayBuffer(registrationInfo.credentialPublicKey, true);
	registrationInfo.credentialID = base64.fromArrayBuffer(registrationInfo.credentialID, true);
	registrationInfo.attestationObject = base64.fromArrayBuffer(registrationInfo.attestationObject, true);

	if (verified) {
		request.session.loggedIn = true;
		database.push("/users/" + request.session.username + "/authenticators[]", registrationInfo);
		database.push("/users/" + request.session.username + "/registered", true);
		return response.json({ "status": "ok" });
	}

	return response.json({
		"status": "failed",
		"message": "Can not authenticate signature!"
	});
});

router.post("/login", async (request, response) => {

	if(!request.session.loggedIn) {
		response.json({
			"status": "failed",
			"message": "Request missing websiteURL field!"
		});

		return;
	}

	let usernameClean = username.clean(request.session.username);
	
	let db = database.getData("/");
	if(!db.users[usernameClean] || !db.users[usernameClean].registered) {
		response.json({
			"status": "failed",
			"message": `User ${usernameClean} does not exist!`
		});

		return;
	}

	let assertionOptions = await f2l.login(usernameClean);

	// Transfer challenge and username to session
	request.session.challenge = assertionOptions.challenge;
	request.session.username  = usernameClean;

	// Pass this, to limit selectable credentials for user... This may be set in response instead, so that
	// all of a users server (public) credentials isn't exposed to anyone
	let allowCredentials = [];
	for(let authr of database.getData("/users/" + request.session.username + "/authenticators")) {
		allowCredentials.push({
			type: authr.credentialType,
			id: authr.credentialID,
			transports: authr.transports
		});
	}

	assertionOptions.allowCredentials = allowCredentials;

	request.session.allowCredentials = allowCredentials;

	response.json(assertionOptions);

});


router.post("/authenticaitonResponse", async (request, response) => {

	if (!database.getData("/users/" + request.session.username + "/registered")) {
		response.status(404).send(false);
	}
	const websiteURL = request.body.websiteURL;
	delete request.body[websiteURL];

	var authenticators = database.getData("/users/" + request.session.username + "/authenticators")[0];

	authenticators.credentialPublicKey = base64.toArrayBuffer(authenticators.credentialPublicKey, true);
	authenticators.credentialID = base64.toArrayBuffer(authenticators.credentialID, true);
	authenticators.attestationObject = base64.toArrayBuffer(authenticators.attestationObject, true);

	let verification;
	try {
		verification = await SimpleWebAuthnServer.verifyAuthenticationResponse({
			response: request.body,
			expectedChallenge: request.session.challenge,
			expectedOrigin: config.origin,
			expectedRPID: config.rpId,
			authenticator: authenticators,
		});
	} catch (error) {
		console.error(error);
		return response.status(400).send({error: error.message});
	}

	authenticators.credentialPublicKey = base64.fromArrayBuffer(authenticators.credentialPublicKey, true);
	authenticators.credentialID = base64.fromArrayBuffer(authenticators.credentialID, true);
	authenticators.attestationObject = base64.fromArrayBuffer(authenticators.attestationObject, true);
 
	const {verified} = verification;
	if (verified) {
		const fieldPath = "/users/" + request.session.username + "/siteinfos"
		let siteinfos = database.getData(fieldPath);
		let id, password;

		for(let siteinfo of siteinfos) {        
			if (siteinfo.siteURL == websiteURL) {
				id = siteinfo.id;
				password = siteinfo.password;
			}
		}

		return response.json({ "status": "ok", "id": id, "password": password});
	}

	return response.json({
		"status": "failed",
		"message": "Can not authenticate signature!"
	});
});


router.post("/registerUserinfo", async (request, response) => {

	if(!request.body || !request.body.id || !request.body.password || !request.body.siteURL) {
		response.json({
			"status": "failed",
			"message": "Request missing some field!"
		});
		return;
	}

	if (!database.getData("/users/" + request.session.username + "/registered")) {
		response.status(404).send(false);
	}

	try {
		const fieldPath = "/users/" + request.session.username + "/siteinfos"
		let siteinfos = database.getData(fieldPath);
		siteinfos.push(request.body);
		database.push(fieldPath, siteinfos, true);

		return response.json({ "status": "ok" });
	} catch(e) {
		return response.json({ "status": "failed",  "message": "DB fail!"});
	}

});

module.exports = router;