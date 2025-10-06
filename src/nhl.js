export async function getCurrentMatchup() {
  const response = await fetch(nextGame);
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
    // throw new Error(errorText);
    return errorText;
  }
  const data = await response.json();
  const game = data.games[0];
  const awayTeam = game.awayTeam.commonName.default
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
  return awayTeam;
}

//Things needed to determine the current match-up
export const currentChamp = `FLA`;
export const nextGame = `https://api-web.nhle.com/v1/club-schedule/${currentChamp}/week/now`;
