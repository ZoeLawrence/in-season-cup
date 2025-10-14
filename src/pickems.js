export async function getPickEms() {
    // var date = new Date();
	// date.setDate(date.getDate() + 1);
    // let day = date.getDate();
    // let month = date.getMonth() + 1;
    // let year = date.getFullYear();
    // let currentDate = `https://api-web.nhle.com/v1/score/${year}-${month}-${day}`;
	let currentDate = `https://api-web.nhle.com/v1/score/2025-10-15`;
	const response = await fetch(currentDate);
  	if (!response.ok) {
    	let errorText = `Error fetching ${response.url}: ${response.status} ${response.statusText}`;
    	try {
			const error = await response.text();
			if (error) {
				errorText = `${errorText} \n\n ${error}`;
			}
    	} catch {
      	// ignore
    	}
   		throw new Error(errorText);
  	}
	const data = await response.json();
	// let text = `# Games Today\n`;
	let games = [];
	games[0] = {
		type: 10,  // ComponentType.TEXT_DISPLAY
		content: `# Games Today\n`
	}	
	for (let i = 0; i < data.games.length; i++) {
		const game = data.games[i];
		const awayTeam = game.awayTeam.name.default;
		const homeTeam = game.homeTeam.name.default;
		games[i + 1] = {
			type: 9,  // ComponentType.SECTION
			// accent_color: 703487,
			components: [
				{
					type: 10,  // ComponentType.TEXT_DISPLAY
					content: `${homeTeam} vs ${awayTeam}`
				},
				{
					type: 1,  // ComponentType.ACTION_ROW
					components: [
						{
							type: 2,  // ComponentType.BUTTON
							custom_id: `select-${homeTeam}`,
							label: `${homeTeam}`,
							style: 1
						},
						{
							type: 2,  // ComponentType.BUTTON
							custom_id: `select-${awayTeam}`,
							label: `${awayTeam}`,
							style: 1
						},
					],
				}
			],
			accessory: {
				type: 11,  // ComponentType.THUMBNAIL
				media: {
					url: game.homeTeam.logo
				}
			}
		}
	}
//   const posts = data.games.children
//     .map((post) => {
//       if (post.is_gallery) {
//         return '';
//       }
//       return (
//         post.data?.media?.reddit_video?.fallback_url ||
//         post.data?.secure_media?.reddit_video?.fallback_url ||
//         post.data?.url
//       );
//     })
//     .filter((post) => !!post);
//   const randomIndex = Math.floor(Math.random() * posts.length);
//   const randomPost = posts[randomIndex];
	return games;
}