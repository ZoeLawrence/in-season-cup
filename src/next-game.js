export async function testAssignments(env) {
    const { results } = await env.ASSIGN_DB
        .prepare("SELECT * FROM players WHERE isChamp = 1;")
        .run();
    const token = env.DISCORD_TOKEN;
    const channelId = '1425222879703990332';
    const MESSAGE = {
        content: "Hello, World!",
        tts: false,
        embeds: [{
            title: "Hello, Embed!",
            description: `${results[0].team}`
        }]
    }

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