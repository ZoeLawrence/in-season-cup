/**
 * The core server that runs on a Cloudflare worker.
 */
import { AutoRouter } from 'itty-router';
import {
  InteractionResponseType,
  InteractionType,
  verifyKey,
} from 'discord-interactions';
import { INVITE_COMMAND, MATCH_UP_COMMAND, JOIN_COMMAND, ASSIGN_COMMAND, START_COMMAND, SWAP_COMMAND } from './commands.js';
import { getCurrentMatchup } from './nhl.js';
import { InteractionResponseFlags } from 'discord-interactions';

class JsonResponse extends Response {
  constructor(body, init) {
    const jsonBody = JSON.stringify(body);
    init = init || {
      headers: {
        'content-type': 'application/json;charset=UTF-8',
      },
    };
    super(jsonBody, init);
  }
}

const router = AutoRouter();

/**
 * A simple :wave: hello page to verify the worker is working.
 */
router.get('/', (request, env) => {
  return new Response(`👋 ${env.DISCORD_APPLICATION_ID}`);
});

/**
 * Main route for all requests sent from Discord.  All incoming messages will
 * include a JSON payload described here:
 * https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object
 */
router.post('/', async (request, env) => {
  // console.log(request);
  const { isValid, interaction } = await server.verifyDiscordRequest(
    request,
    env,
  );
  if (!isValid || !interaction) {
    return new Response('Bad request signature.', { status: 401 });
  }

  if (interaction.type === InteractionType.PING) {
    // The `PING` message is used during the initial webhook handshake, and is
    // required to configure the webhook in the developer portal.
    return new JsonResponse({
      type: InteractionResponseType.PONG,
    });
  }

  if(interaction.type == InteractionType.MESSAGE_COMPONENT) {
    const results = await server.checkUser(interaction.member.user.id, request, env);
    if(results != null && results.length > 0) {
      return new JsonResponse({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `You have already joined`,
          flags: InteractionResponseFlags.EPHEMERAL,
        },
      });
    }
    await server.addItem(interaction.member.user.id, '', false, request, env);
    return new JsonResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `Thank you for joining`,
        flags: InteractionResponseFlags.EPHEMERAL,
      },
    });
  }

  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    // Most user commands will come as `APPLICATION_COMMAND`.
    switch (interaction.data.name.toLowerCase()) {
      case INVITE_COMMAND.name.toLowerCase(): {
        const applicationId = env.DISCORD_APPLICATION_ID;
        const INVITE_URL = `https://discord.com/oauth2/authorize?client_id=${applicationId}&scope=applications.commands`;
        return new JsonResponse({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: INVITE_URL,
            flags: InteractionResponseFlags.EPHEMERAL,
          },
        });
      }
      case MATCH_UP_COMMAND.name.toLowerCase(): {
        const currentMatchup = await getCurrentMatchup();
        return new JsonResponse({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.IS_COMPONENTS_V2,
            content: `hello world ${currentMatchup}`,
          },
        });
      }
      case JOIN_COMMAND.name.toLowerCase(): {
        return new JsonResponse({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: 32768,
            components: [
              {
                type: 17,  // ComponentType.CONTAINER
                accent_color: 703487,
                components: [
                  {
                    type: 10,  // ComponentType.TEXT_DISPLAY
                    content: "🏒 # What is the “In-Season Cup”?\n- The In-Season Cup is a running “challenge trophy” that is defended and changes hands throughout the regular NHL season and the winner is the team that ends the season with the cup in their possession."
                  },
                  {
                    type: 1,  // ComponentType.ACTION_ROW
                    components: [
                      {
                        type: 2,  // ComponentType.BUTTON
                        custom_id: "join",
                        label: "Join :Pleasee:",
                        style: 1
                      },
                    ]
                  }
                ]
              }
            ]
          }
        });
      }
      case ASSIGN_COMMAND.name.toLowerCase(): {
        //Pull all teams from DB, pull all users from DB
        const assignments = await server.assignTeams(request, env);
        return new JsonResponse({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.IS_COMPONENTS_V2,
            content: `Assignments: ${assignments}`,
          },
        });
      }
      case SWAP_COMMAND.name.toLowerCase(): {
        const options = interaction.data.options[0].options;
        const res = await server.addItem(
          options[0].value,
          options[1].value,
          options[2].value,
          request,
          env,
        );
        return new JsonResponse({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.IS_COMPONENTS_V2,
            content: `${JSON.stringify(res)} assign ${options[1].value} to ${options[0].value} and champion as ${options[2].value}`,
          },
        });
      }
      case START_COMMAND.name.toLowerCase(): {
        const currentMatchup = await getCurrentMatchup();
        return new JsonResponse({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.IS_COMPONENTS_V2,
            content: `hello world ${currentMatchup}`,
          },
        });
      }
      default:
        return new JsonResponse({ error: 'Unknown Type' }, { status: 400 });
    }
  }

  console.error('Unknown Type');
  return new JsonResponse({ error: 'Unknown Type' }, { status: 400 });
});

router.all('*', () => new Response('Not Found.', { status: 404 }));

async function verifyDiscordRequest(request, env) {
  const signature = request.headers.get('x-signature-ed25519');
  const timestamp = request.headers.get('x-signature-timestamp');
  const body = await request.text();
  const isValidRequest =
    signature &&
    timestamp &&
    (await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY));
  if (!isValidRequest) {
    return { isValid: false };
  }

  return { interaction: JSON.parse(body), isValid: true };
}

async function checkUser(username, request, env) {
  const { results } = await env.ASSIGN_DB
        .prepare("SELECT * FROM Persons WHERE username = ?;")
        .bind(username)
        .run();
  return results;
}

async function assignTeams(request, env) {
  const teamList = ['CAR', 'CBJ', 'NJD', 'NYI', 'NYR', 'PHI', 'PIT', 'WSH', 'BOS', 'BUF', 'DET', 'FLA', 'MTL', 'OTT', 'TBL', 'TOR', 'CHI', 'COL', 'DAL', 'MIN', 'NSH', 'STL', 'UTA', 'WPG', 'ANA', 'CGY', 'EDM', 'LAK', 'SJS', 'SEA', 'VAN', 'VGK'];
  const { res } = await env.ASSIGN_DB.prepare("SELECT * FROM Persons;").run();
  const assignments = [];
  const stmt = env.ASSIGN_DB.prepare("INSERT INTO players (team, user_id, isChamp) VALUES (?, ?, false);")
  for(var i = teamList.length-1;i>=0;i--){
    const team = teamList.splice(Math.floor(Math.random()*teamList.length), 1);
    assignments[i] = stmt.bind(team, res.results[i].username);
  }
  const { results } = await env.ASSIGN_DB.batch(assignments)
  return results;
}

async function addItem(username, team, isChamp, request, env) {
  const { results } = await env.ASSIGN_DB
        .prepare("INSERT INTO Persons (username, team, isChamp) VALUES (?, ?, ?);")
        .bind(username, team, isChamp)
        .run();
  return results;
}

const server = {
  verifyDiscordRequest,
  assignTeams,
  addItem,
  checkUser,
  fetch: router.fetch,
};

export default server;
