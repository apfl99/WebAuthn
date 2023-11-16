const
	express       	= require("express"),
	bodyParser    	= require("body-parser"),
	cookieSession 	= require("cookie-session"),
	path          	= require("path"),
	crypto        	= require("crypto"),

	config        	= require("./config"),

	defaultroutes 	= require("./routes/default"),
	webuathnroutes  = require("./routes/webauthn"),
	tokenroutes   	= require("./routes/token"),

	app           	= express();

app.use(bodyParser.json());

// Sessions
app.use(cookieSession({
	name: "session",
	keys: [crypto.randomBytes(32).toString("hex")],
	// Cookie Options
	maxAge: config.cookieMaxAge
}));


// Static files (./static)
app.use(express.static(path.join(__dirname, "public/static")));

// Routes
app.use("/", defaultroutes);
app.use("/webauthn", webuathnroutes);
app.use("/token", tokenroutes);

const port = config.port;


app.listen(3000, () => {
	console.log(`Started app on port ${port}`);
});


module.exports = app;
