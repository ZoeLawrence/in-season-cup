import { getCurrentMatchup } from './in-season-cup.js';

export async function testAssignments(env) {
    const { current } = await env.ASSIGN_DB
        .prepare("SELECT * FROM match;")
        .run();
    if(current[0] != undefined) {
        const game_time = new Date(current[0].time);
        const current_time = new Date();
        if(current_time.getTime() > game_time.getTime()) {
            const res = await fetch(`https://api-web.nhle.com/v1/gamecenter/${current[0].gamed_id}/landing`);
            if (!res.ok) {
                let errorText = `Error fetching ${res.url}: ${res.status} ${res.statusText}`;
                try {
                const error = await res.text();
                if (error) {
                    errorText = `${errorText} \n\n ${error}`;
                }
                } catch {
                // ignore
                }
                throw new Error(errorText);
            }
            const game_data = await res.json();
            const away_score = game_data.awayTeam.score;
            const home_score = game_data.homeTeam.score;
            const champIsHome = results[0].team == game_data.homeTeam.abbrev;
            const winnerIsHome = home_score > away_score;

            if(winnerIsHome && !champIsHome) {
                //switch champ 
                
            }
            //find next match up for same team
            
            
            let textContent = `# Current champ is <@${results[0].user_id}>\n`
            if(champIsHome) {
                const away = await server.getUser(game_data.awayTeam.abbrev, env);
                textContent +=  `Next match up: <@${away[0].user_id}>'s ${awayTeam} faces <@${results[0].user_id}>'s ${homeTeam}`;
            } else {
                const home = await server.getUser(game_data.homeTeam.abbrev, env);
                textContent += `Next match up: <@${home[0].user_id}>'s ${homeTeam} faces <@${results[0].user_id}>'s ${awayTeam}`;
            }
            

            const token = env.DISCORD_TOKEN;
            const channelId = '1425222879703990332';
            const MESSAGE = {
                tts: false,
                embeds: [{
                    title: "Hello, Embed!",
                    description: `Current champ is ${results[0].team}, next match up is ${awayTeam} @ ${homeTeam}`
                }]
            }
            
        //     @Fenrir retains the cup!
        // @Fenrir and the Florida Panthers will move on to face @chrrisyg and the Philadelphia Flyers on Thursday!

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
    }
}