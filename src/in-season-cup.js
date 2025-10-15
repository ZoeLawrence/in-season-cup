export async function getRandomTeam() {
  const teamList = ['CAR', 'CBJ', 'NJD', 'NYI', 'NYR', 'PHI', 'PIT', 'WSH', 'BOS', 'BUF', 'DET', 'FLA', 'MTL', 'OTT', 'TBL', 'TOR', 'CHI', 'COL', 'DAL', 'MIN', 'NSH', 'STL', 'UTA', 'WPG', 'ANA', 'CGY', 'EDM', 'LAK', 'SJS', 'SEA', 'VAN', 'VGK'];
  return teamList[Math.floor(Math.random() * teamList.length)];
}

export async function getCurrentMatchup(currentChamp) {
  const response = await fetch(`https://api-web.nhle.com/v1/club-schedule/${currentChamp}/week/now`);
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
  const game = data.games[0];
  const awayTeam = game.awayTeam.commonName.default;
  const homeTeam = game.homeTeam.commonName.default;
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
  return `Current champs ${currentChamp} vs ${awayTeam}`;
}
