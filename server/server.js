const express = require("express");
const path = require('path');
const cookieParser = require("cookie-parser");
const cors = require("cors");
const corsOptions = {
	origin: "*",
	credentials: true, //access-control-allow-credentials:true
	optionSuccessStatus: 200,
};

const { createServer } = require("http");
const { socketServer } = require("./sockets/");
const session = require("express-session");
// const { Server } = require("socket.io");
const routes = require("./routes/");
const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });
const passport = require("passport");
require("./config/passport");

const app = express();
const httpServer = createServer(app);
// const io = new Server(httpServer, {
// 	cors: {
// 		origin: "http://localhost:5173",
// 	},
// });

socketServer(httpServer);

const PORT = process.env.PORT || 3000;

mongoose
	.connect(
		process.env.DATABASE
	)
	.then(() => console.log("Connected to MongoDB"))
	.catch("error", (err) => {
		console.log("Couldn't connect to MongoDB", err.message);
	});

app.use(
	cors({
		origin: process.env.CORS,
		credentials: true, //access-control-allow-credentials:true
		optionSuccessStatus: 200,
	})
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
	session({
		secret: process.env.SECRET,
		resave: false,
		saveUninitialized: true,
		proxy: true
		// cookie: { secure: false }
	})
);
app.use(passport.initialize());
app.use(passport.session());

app.use("/api", routes);


httpServer.listen(PORT, () => {
	console.log(
		`server is listening.\nLocal: http://localhost:${PORT}`
	);
});
