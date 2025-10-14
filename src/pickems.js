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
	let text = `# Games Today\n`;
	text += `${data.games[0].awayTeam.name.default}\n`;
	// for (let i = 0; i < data.games.length; i++) {
	// 	const game = data.games[i];
	// 	const awayTeam = game.awayTeam.commonName.default;
	// 	const homeTeam = game.homeTeam.commonName.default;
	// 	text += `${homeTeam} vs ${awayTeam}\n`
	// }
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
	return text;
}