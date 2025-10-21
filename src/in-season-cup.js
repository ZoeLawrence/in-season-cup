// export async function getRandomTeam() {
//   const teamList = ['CAR', 'CBJ', 'NJD', 'NYI', 'NYR', 'PHI', 'PIT', 'WSH', 'BOS', 'BUF', 'DET', 'FLA', 'MTL', 'OTT', 'TBL', 'TOR', 'CHI', 'COL', 'DAL', 'MIN', 'NSH', 'STL', 'UTA', 'WPG', 'ANA', 'CGY', 'EDM', 'LAK', 'SJS', 'SEA', 'VAN', 'VGK'];
//   return teamList[Math.floor(Math.random() * teamList.length)];
// }

export async function getNHLData(url) {
  const response = await fetch(`https://api-web.nhle.com/v1/${url}`);
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
    return errorText;
    // throw new Error(errorText);
  }
  const data  = await response.json();
  return data;
}

export async function getCurrentMatchup(currentChamp) {
  const current_time = new Date();
  const year = current_time.getFullYear();
  const month = current_time.getMonth();
  const day = current_time.getDate();
  const response = await fetch(`https://api-web.nhle.com/v1/club-schedule/${currentChamp}/week/${year}-${month}-${day}`);
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
    return errorText;
    // throw new Error(errorText);
  }
  const data = await response.json();
  //TODO: For the olympics break this is will break?
  const game = data.games[0];
  // const awayTeam = game.awayTeam.commonName.default;
  // const homeTeam = game.homeTeam.commonName.default;
  
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
  return {
    game_id: game.id,
    game_time: game.startTimeUTC,
    homeTeam: game.homeTeam,
    awayTeam: game.awayTeam,
  };
  //`${JSON.stringify(results)} Current champ is ${currentChamp}, match up is ${awayTeam} @ ${homeTeam}`
}
