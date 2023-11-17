const express  = require("express");
const router   = express.Router();
const database = require("../db/db");

/* Returns if user is logged in */
router.get("/isLoggedIn", (request, response) => {
	if(!request.session.loggedIn) {
		response.json({
			"status": "failed"
		});
	} else {
		response.json({
			"status": "ok"
		});
	}
});

/* Logs user out */
router.get("/logout", (request, response) => {
	request.session.loggedIn = false;
	request.session.username = undefined;

	response.json({
		"status": "ok"
	});
});

/* Returns personal info and THE SECRET INFORMATION */
router.get("/personalInfo", (request, response) => {
	if(!request.session.loggedIn) {
		response.json({
			"status": "failed",
			"message": "Access denied"
		});
	} else {
		userInfo = database.getData("/users/"+ request.session.username);
		siteInfos = database.getData("/users/"+ request.session.username + "/siteinfos");
		response.json({
			"status": "ok",
			"authenticators": userInfo.authenticators,
			"name": userInfo.name,
			"siteinfos": siteInfos
		});
	}
});

module.exports = router;