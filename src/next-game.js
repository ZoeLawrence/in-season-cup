import { getCurrentMatchup } from './in-season-cup.js';

export async function testAssignments(env) {
    const { current } = await env.ASSIGN_DB
        .prepare("SELECT * FROM current;")
        .run();
    if(current[0] != undefined) {
        const datetime = current[0].time;
        const { results } = await env.ASSIGN_DB
            .prepare("SELECT * FROM players WHERE isChamp = 1;")
            .run();
        const game_data = await getCurrentMatchup(results[0].team, env);
        const awayTeam = game_data.awayTeam.commonName.default;
        const homeTeam = game_data.homeTeam.commonName.default;
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