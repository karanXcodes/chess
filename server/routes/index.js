const router = require("express").Router();
const mongoose = require("mongoose");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const { StatusCodes, ReasonPhrases } = require("http-status-codes");
const SavedGame = require("../model/SavedGame");
const User = require("../model/User");
const MatchHistory = require("../model/MatchHistory");

router.post("/register", async (req, res) => {
	try {
		const { username, email, password } = req.body;
		const emailExists = await User.findOne({ email });
		if (emailExists) {
			return res
				.status(StatusCodes.CONFLICT)
				.json({ error: "email is already registered" });
		}
		const usernameExists = await User.findOne({ username });
		if (usernameExists) {
			return res
				.status(StatusCodes.CONFLICT)
				.json({ error: "username unavailable" });
		}

		bcrypt.genSalt(10, (err, salt) => {
			if (err) {
				return console.log(err);
			}

			bcrypt.hash(password, salt, async (err, hash) => {
				if (err) {
					return console.log(err);
				}
				const newUser = await new User({
					email,
					username,
					password: hash,
				}).save();
				return res
					.status(StatusCodes.CREATED)
					.json({ message: "Registered Successfully." });
			});
		});
	} catch (error) {
		console.log("Error:", error.message);
		return res
			.status(StatusCodes.INTERNAL_SERVER_ERROR)
			.json({ error: ReasonPhrases.INTERNAL_SERVER_ERROR });
	}
});

router.post(
	"/login",
	function (req, res, next) {
		passport.authenticate("local", function (err, user, info) {
			if (err) {
				return res
					.status(StatusCodes.INTERNAL_SERVER_ERROR)
					.json({ error: ReasonPhrases.INTERNAL_SERVER_ERROR });
			}
			if (!user) {
				return res
					.status(StatusCodes.UNAUTHORIZED)
					.json({ error: "username or password is incorrect" });
			}
			req.logIn(user, function (err) {
				if (err) {
					return res
						.status(StatusCodes.UNAUTHORIZED)
						.json({ error: "username or password is incorrect" });
				}
				return res.status(StatusCodes.OK).json({
					email: req.user.email,
					username: req.user.username,
				});
			});
		})(req, res, next);
	}
	// function (req, res) {
	// 	var temp = req.session.passport; // {user: 1}
	// 	console.log(temp)
	// 	req.session.regenerate(function (err) {
	// 		//req.session.passport is now undefined
	// 		req.session.passport = temp;
	// 		req.session.save(function (err) {
	// 			res.send(200);
	// 		});
	// 	});
	// }
	// passport.authenticate("local"),
	// (req, res, next) => {
	// 	// Handle success
	// 	if (req.user) {
	// 		return res.status(StatusCodes.OK).send({
	// 			email: req.user.email,
	// 			username: req.user.username,
	// 		});
	// 	}
	// 	console.log(req.authInfo);
	// 	return res
	// 		.status(StatusCodes.UNAUTHORIZED)
	// 		.send({ error: "username or password is incorrect" });
	// },
	// (err, req, res, next) => {
	// 	// Handle error
	// 	console.log(err)
	// 	return res
	// 		.status(StatusCodes.INTERNAL_SERVER_ERROR)
	// 		.send({ error: ReasonPhrases.INTERNAL_SERVER_ERROR });
	// }
	// (req, res) => {
	// 	try {
	// 		// do something with req.user
	// 		console.log(req.user);
	// 		if (req.user) {
	// 			console.log(req.user);
	// 			return res.status(StatusCodes.OK).send({
	// 				email: req.user.email,
	// 				username: req.user.username,
	// 			});
	// 		}
	// 		console.log("2");
	// 		return res
	// 			.status(StatusCodes.UNAUTHORIZED)
	// 			.json({ error: "username or password is incorrect" });
	// 	} catch (error) {
	// 		console.log("Error:", error.message);
	// 		return res
	// 			.status(StatusCodes.INTERNAL_SERVER_ERROR)
	// 			.json({ error: ReasonPhrases.INTERNAL_SERVER_ERROR });
	// 	}
	// }
);

router.delete("/logout", (req, res, next) => {
	try {
		// console.log(req.isAuthenticated());
		// console.log(req.user);
		if (!req.isAuthenticated()) {
			// console.log("failed");
			return res
				.status(StatusCodes.UNAUTHORIZED)
				.json({ error: "logout failed." });
		}

		req.logout();
		req.session.destroy((err) => {
			res.clearCookie("connect.sid");
			// Don't redirect, just print text

			// console.log("logout");
			return res.status(StatusCodes.OK).json({
				message: "Logout Successful.",
			});
		});
	} catch (error) {
		console.log("Error:", error.message);
		return res
			.status(StatusCodes.INTERNAL_SERVER_ERROR)
			.json({ error: ReasonPhrases.INTERNAL_SERVER_ERROR });
	}
});

router.get("/getUser", (req, res) => {
	try {
		if (!req.isAuthenticated()) {
			return res
				.status(StatusCodes.UNAUTHORIZED)
				.json({ error: "user not logged in" });
		}
		return res.status(StatusCodes.OK).json({
			email: req.user.email,
			username: req.user.username,
		});
	} catch (error) {
		console.log("Error:", error.message);
		return res
			.status(StatusCodes.INTERNAL_SERVER_ERROR)
			.json({ error: ReasonPhrases.INTERNAL_SERVER_ERROR });
	}
});

router.get("/savegame/all", async (req, res) => {
	try {
		if (req.isAuthenticated()) {
			const savedGames = await SavedGame.find({
				username: req.user.username,
			})
				.limit(100)
				.sort({ createdAt: -1 });
			// res.status(200).send({ savedGames });
			if (savedGames) {
				return res.status(StatusCodes.OK).json({ data: savedGames });
			}
			return res
				.status(StatusCodes.NO_CONTENT)
				.json({ message: "no saved games" });
		}
		return res
			.status(StatusCodes.UNAUTHORIZED)
			.json({ error: "login required for mongodb saves" });
	} catch (error) {
		console.log("Error:", error.message);
		return res
			.status(StatusCodes.INTERNAL_SERVER_ERROR)
			.json({ error: ReasonPhrases.INTERNAL_SERVER_ERROR });
	}
});

router.get("/savegame/:gameId", async (req, res) => {
	try {
		if (req.isAuthenticated()) {
			const savedGame = await SavedGame.findOne({
				gameId: req.params.gameId,
			});

			return res.status(StatusCodes.OK).json({ data: savedGame });
		}
		return res
			.status(StatusCodes.UNAUTHORIZED)
			.json({ error: "login required for mongodb saves" });
		// const savedGame = await SavedGame.find({ gameId: req.params.gameId });

		// res.status(200).send(savedGame);
	} catch (error) {
		console.log("Error:", error.message);
		return res
			.status(StatusCodes.INTERNAL_SERVER_ERROR)
			.json({ error: ReasonPhrases.INTERNAL_SERVER_ERROR });
	}
});

router.post("/savegame/:gameId", async (req, res) => {
	try {
		// console.log(req.user);
		if (req.isAuthenticated()) {
			const { gameId, fen } = req.body;
			const username = req.user.username;
			const alreadyExists = await SavedGame.findOne({ gameId });
			if (alreadyExists) {
				await SavedGame.findOneAndUpdate({ gameId }, { fen });
			} else {
				const newSavedGame = new SavedGame({
					gameId,
					fen,
					username,
				});

				await newSavedGame.save();
			}
			const savedGames = await SavedGame.find({
				username: req.user.username,
			});

			return res.status(StatusCodes.CREATED).json({ data: savedGames });
		}
		return res
			.status(StatusCodes.UNAUTHORIZED)
			.json({ error: "login required for mongodb game save" });
	} catch (error) {
		console.log("Error:", error.message);
		return res
			.status(StatusCodes.INTERNAL_SERVER_ERROR)
			.json({ error: ReasonPhrases.INTERNAL_SERVER_ERROR });
	}
});

router.delete("/savegame/:gameId", async (req, res) => {
	try {
		// console.log(req.user);
		if (req.isAuthenticated()) {
			const savedGame = await SavedGame.findOne({
				gameId: req.params.gameId,
			});

			if (savedGame.username === req.user.username) {
				await SavedGame.deleteOne({ gameId: req.params.gameId });
				const savedGames = await SavedGame.find({
					username: req.user.username,
				});

				return res.status(StatusCodes.OK).json({ data: savedGames });
			}

			return res
				.status(StatusCodes.UNAUTHORIZED)
				.json({ error: "only owner is authorized to delete" });
		}
		return res
			.status(StatusCodes.UNAUTHORIZED)
			.json({ error: "login required for mongodb game save" });
	} catch (error) {
		console.log("Error:", error.message);
		return res
			.status(StatusCodes.INTERNAL_SERVER_ERROR)
			.json({ error: ReasonPhrases.INTERNAL_SERVER_ERROR });
	}
});

router.get("/getratings", async (req, res) => {
	try {

		const users = await User.find({}, 'username rating').sort({ rating: -1 });

		return res.status(StatusCodes.OK).json({
			users
		});
	} catch (error) {
		console.log("Error:", error.message);
		return res
			.status(StatusCodes.INTERNAL_SERVER_ERROR)
			.json({ error: ReasonPhrases.INTERNAL_SERVER_ERROR });
	}
});

router.get("/gethistory/:username", async (req, res) => {
	try {

		// const user = req.user;
		const username =req.params.username;

		const matches = await MatchHistory.find({ username }).sort({ createdAt: -1 });

		return res.status(StatusCodes.OK).json({
			matches
		});
	} catch (error) {
		console.log("Error:", error.message);
		return res
			.status(StatusCodes.INTERNAL_SERVER_ERROR)
			.json({ error: ReasonPhrases.INTERNAL_SERVER_ERROR });
	}
});

router.post("/rating", async (req, res) => {

	const { winner, loser, draw } = req.body;

	try {
		const winnerUser = await User.findOne({ username: winner });
		const loserUser = await User.findOne({ username: loser });

		if (!winnerUser || !loserUser) {
			return res.status(404).json({ error: "Users not found" });
		}

		const { newWinnerRating, newLoserRating, winnerChange, loserChange } = calculateElo(
			winnerUser.rating,
			loserUser.rating,
			draw
		);

		winnerUser.rating = newWinnerRating;
		loserUser.rating = newLoserRating;

		await winnerUser.save();
		await loserUser.save();

		// Save match history correctly
		const historyForWinner = new MatchHistory({
			username: winner,
			opponent: loser,
			change: winnerChange,
		});

		const historyForLoser = new MatchHistory({
			username: loser,
			opponent: winner,
			change: loserChange,
		});

		await historyForWinner.save();
		await historyForLoser.save();

		res.json({
			success: true,
			winner,
			winnerRating: newWinnerRating,
			loser,
			loserRating: newLoserRating,
		});
	} catch (error) {
		console.log(error)
		return res
			.status(StatusCodes.INTERNAL_SERVER_ERROR)
			.json({ error: ReasonPhrases.INTERNAL_SERVER_ERROR });
	}


});

function calculateElo(winnerRating, loserRating, draw = false) {
	const K = 32;

	const expectedScoreWinner =
		1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
	const expectedScoreLoser = 1 - expectedScoreWinner;

	let winnerScore = 1;
	let loserScore = 0;

	if (draw) {
		winnerScore = 0.5;
		loserScore = 0.5;
	}

	const newWinnerRating = Math.round(
		winnerRating + K * (winnerScore - expectedScoreWinner)
	);
	const newLoserRating = Math.round(
		loserRating + K * (loserScore - expectedScoreLoser)
	);

	const winnerChange = newWinnerRating - winnerRating ;
	const loserChange = newLoserRating -loserRating ;

	return { newWinnerRating, newLoserRating, winnerChange, loserChange };
}


module.exports = router;
