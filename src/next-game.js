import { getNHLData, getCurrentMatchup } from './in-season-cup.js';

export async function testAssignments(env) {
	let title = ``;
	let description = ``;
	const currentMatch = await getCurrentMatch(env);
	if (currentMatch[0] != undefined) {
		const game_time = new Date(currentMatch[0].datetime);
		const current_time = new Date();
		if (current_time.getTime() > game_time.getTime()) {
			title = `current time`
			description = current_time.toLocaleDateString()
			const game_data = await getNHLData(`gamecenter/${currentMatch[0].game_id}/landing`);
			const away_abbr = game_data.awayTeam.abbrev;
			const home_abbr = game_data.homeTeam.abbrev;

			const currentChampIsHome = currentMatch[0].team == home_abbr;
			const winnerIsHome = game_data.homeTeam.score > game_data.awayTeam.score;

			const stmt = env.ASSIGN_DB.prepare("UPDATE players SET isChamp = ? WHERE team = ?;")
			if (currentChampIsHome != winnerIsHome) {
				await env.ASSIGN_DB.batch([
					stmt.bind(!winnerIsHome, away_abbr),
					stmt.bind(winnerIsHome, home_abbr)
				]);
				title = `wins the cup!`;
			} else {
				title = `retains the cup!`
			}

			// const results = await server.getChamp(env);
			const newChamp = await getNewChamp()

			// const game_data = await getCurrentMatchup(results[0].team, env);
			const match_data = await getCurrentMatchup(newChamp[0].team, env);

			const awayTeam = `${match_data.awayTeam.placeName.default} ${match_data.awayTeam.commonName.default}`;
			const homeTeam = `${match_data.homeTeam.placeName.default} ${match_data.homeTeam.commonName.default}`;

			// const winnerIsHome = results[0].team == game_data.homeTeam.abbrev;
			const newChampIsHome = newChamp[0].team == match_data.homeTeam.abbrev;

			// // await server.createFirstMatch(game_data.game_id, game_data.game_time, env);
			// await getNextMatch(match_data.game_id, match_data.game_time, env);

			// const game_day = new Date(match_data.game_time);

			// const player = env.ASSIGN_DB.prepare("SELECT * FROM players WHERE team = ?;")
			// const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
			// if (newChampIsHome) {
			// 	const { away } = await player.bind(match_data.awayTeam.abbrev).run();
			// 	description += `<@${newChamp[0].user_id}>'s ${homeTeam} will move on to face <@${away[0].user_id}>'s ${awayTeam} on ${days[game_day.getDay()]}!`;
			// } else {
			// 	const { home } = await player.bind(match_data.homeTeam.abbrev).run();
			// 	description += `<@${newChamp[0].user_id}>'s ${awayTeam} will move on to face <@${home[0].user_id}>'s ${homeTeam} on ${days[game_day.getDay()]}!`;
			// }
			// title = `# <@${newChamp[0].user_id}> ${title}`;
		} else {
			title = `game time`
			description = game_time.toLocaleDateString()
		}
	} else {
		title = `No match found:`
		description = 'use /start to set up'
	}

	const MESSAGE = {
		tts: false,
		embeds: [{
			title: title,
			description: description
		}]
	}
	const token = env.DISCORD_TOKEN;
	const channelId = '1425222879703990332';

	if (!token) {
		throw new Error('The DISCORD_TOKEN environment variable is required.');
	}
	if (!channelId) {
		throw new Error(
			'The DISCORD_APPLICATION_ID environment variable is required.',
		);
	}

	const url = `https://discord.com/api/v10/channels/${channelId}/messages`;

	const response = await fetch(url, {
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bot ${token}`,
		},
		method: 'POST',
		body: JSON.stringify(MESSAGE),
	});

	if (response.ok) {
		console.log('Registered all commands');
		const data = await response.json();
		console.log(JSON.stringify(data, null, 2));
	} else {
		console.error('Error registering commands');
		let errorText = `Error registering commands \n ${response.url}: ${response.status} ${response.statusText}`;
		try {
			const error = await response.text();
			if (error) {
				errorText = `${errorText} \n\n ${error}`;
			}
		} catch (err) {
			console.error('Error reading body from request:', err);
		}
		console.error(errorText);
	}
}

async function getCurrentMatch(env) {
	const { results } = await env.ASSIGN_DB
		.prepare("SELECT * FROM match;")
		.run();
	return results;
}

async function getNewChamp(env) {
	const { results } = await env.ASSIGN_DB
		.prepare("SELECT * FROM players WHERE isChamp = 1;")
		.run();
	return results;
}

async function getNextMatch(game_id, game_time, env) {
	const { results } = await env.ASSIGN_DB
		.prepare("UPDATE match SET game_id = ?, datetime = ? WHERE rowid = 1;")
		.bind(game_id, game_time)
		.run();
	return results;
}