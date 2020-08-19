const express = require("express");
const redis = require("redis");
const axios = require("axios");
const app = express();

// redis setup
const redisPort = 6379;
const redisClient = redis.createClient(redisPort);

redisClient.on("connect", () => {
	console.log("Redis connected");
});

redisClient.on("error", (error) => {
	console.error(error);
});
// redis setup end

app.get("/recipe/:foodItem", async (req, res) => {
	try {
		const { foodItem } = req.params;

		redisClient.get(foodItem, async (err, recipe) => {
			// recipe is strigified json string
			// if recipe found return the cached result
			if (recipe) {
				return res.status(200).json({
					cachedResult: true,
					data: JSON.parse(recipe)
				});
			}

			// if not found, fetch data and cache it
			const fetchedRecipe = await axios.get(`http://www.recipepuppy.com/api/?q=${foodItem}`);

			// (key, time in sec, data); 1200 -> 20mins
			redisClient.setex(foodItem, 1200, JSON.stringify(fetchedRecipe.data.results));

			return res.status(200).json({
				cachedResult: false,
				data: fetchedRecipe.data.results
			});
		});
	} catch (error) {
		return res.status(400).json({
			error
		});
	}
});

const port = 5000;
app.listen(port, () => {
	console.log(`Server running on port: ${port}`);
});
