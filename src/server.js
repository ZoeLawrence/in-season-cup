/**
 * The core server that runs on a Cloudflare worker.
 */
import { AutoRouter } from 'itty-router';
import {
  InteractionResponseFlags,
  InteractionResponseType,
  InteractionType,
  verifyKey,
} from 'discord-interactions';
import { INVITE_COMMAND, JOIN_COMMAND, ASSIGN_COMMAND, START_COMMAND, PICKEMS_COMMAND, REASSIGN_COMMAND } from './commands.js';
import { getCurrentMatchup } from './in-season-cup.js';
import { testAssignments } from './next-game.js';
import { getPickEms } from './pickems.js';

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

router.get('/', (request, env) => {
  return new Response(`👋 ${env.DISCORD_APPLICATION_ID}`);
});

/**
 * Main route for all requests sent from Discord.  All incoming messages will
 * include a JSON payload described here:
 * https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object
 */
router.post('/', async (request, env) => {
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
    const userId = interaction.member.user.id
    const results = await server.checkUser(userId, request, env);
    if(results != null && results.length > 0) {
      return new JsonResponse({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `You have already joined`,
          flags: InteractionResponseFlags.EPHEMERAL,
        },
      });
    }
    await server.addItem(userId, '', false, request, env);
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
                    content: "# 🏒 What is the “In-Season Cup”?\nThe In-Season Cup is a running “challenge trophy” that is defended and changes hands throughout the regular NHL season and the winner is the team that ends the season with the cup in their possession."
                  },
                  {
                    type: 1,  // ComponentType.ACTION_ROW
                    components: [
                      {
                        type: 2,  // ComponentType.BUTTON
                        custom_id: "join",
                        label: "Join",
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
        const champion = interaction.data.options[0].value;
        const results = await server.getUsers(request, env);
        const assignments = await server.assignTeams(results, champion, request, env);
        let toPrint = ``;
        for(let i = 0; i < assignments.length; i++) {
          toPrint += `${assignments[i].team} - <@${assignments[i].id}>\n`;
        }
        return new JsonResponse({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.IS_COMPONENTS_V2,
            content: `# Teams\n${toPrint}`,
          },
        });
      }
      case REASSIGN_COMMAND.name.toLowerCase(): {
        switch (interaction.data.options[0].name.toLowerCase()) {
          case 'swap': {
            // let test =  `command name: ${interaction.data.name.toLowerCase()} ${interaction.data.options[0].name.toLowerCase()}`;
            const options = interaction.data.options[0].options;
            // const res = await server.addItem(
            //   options[0].value,
            //   options[1].value,
            //   options[2].value,
            //   request,
            //   env,
            // );
            return new JsonResponse({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                flags: InteractionResponseFlags.IS_COMPONENTS_V2,
                content: `swap ${options[1].value} and ${options[0].value}`,
              },
            });
          }
          case 'replace': {
            const options = interaction.data.options[0].options;
            return new JsonResponse({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                flags: InteractionResponseFlags.IS_COMPONENTS_V2,
                content: `assign ${options[1].value} to ${options[0].value}`,
              },
            });
          }
          default: 
            return new JsonResponse({ error: 'Unknown Type' }, { status: 400 });
        }
      }
      case START_COMMAND.name.toLowerCase(): {
        const results = await server.getChamp(env);
        const game_data = await getCurrentMatchup(results[0].team, env);
        const awayTeam = game_data.awayTeam.commonName.default;
        const homeTeam = game_data.homeTeam.commonName.default;
        const winnerIsHome = results[0].team == game_data.homeTeam.abbrev;
        await server.createFirstMatch(game_data.game_id, game_data.game_time, env);
        let textContent = `# Current champ is <@${results[0].user_id}>\n`
        if(winnerIsHome) {
          const away = await server.getUser(game_data.awayTeam.abbrev, env);
          textContent +=  `Next match up: <@${away[0].user_id}>'s ${awayTeam} faces <@${results[0].user_id}>'s ${homeTeam}`;
        } else {
          const home = await server.getUser(game_data.homeTeam.abbrev, env);
          textContent += `Next match up: <@${home[0].user_id}>'s ${homeTeam} faces <@${results[0].user_id}>'s ${awayTeam}`;
        }
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
                    content: textContent
                  },
                ]
              }
            ]
          }
        });
      }
      case PICKEMS_COMMAND.name.toLowerCase(): {
        // const pickemsResult = await getPickEms();
        const result = await testNextGame(env);
        if(result[0] != undefined) {
          const datetime = result[0].datetime;
          return new JsonResponse({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              flags: InteractionResponseFlags.IS_COMPONENTS_V2,
              content: `datetime ${datetime}`
            }
          });
        } else {
          const d = new Date(); 
          return new JsonResponse({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              flags: InteractionResponseFlags.IS_COMPONENTS_V2,
              content: `new date ${d.toISOString()}`
            }
          });
        }
        // const date = `${d.toUTCStrin()}`
        // var datetime = "Last Sync: " + currentdate.getDate() + "/"
        //                 + (currentdate.getMonth()+1)  + "/" 
        //                 + currentdate.getFullYear() + " @ "  
        //                 + currentdate.getHours() + ":"  
        //                 + currentdate.getMinutes() + ":" 
        //         + currentdate.getSeconds();
        
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

async function getUser(team, env) {
  const { results } = await env.ASSIGN_DB
        .prepare("SELECT * FROM players WHERE team = ?;")
        .bind(team)
        .run();
  return results;
}

async function getChamp(env) {
  const { results } = await env.ASSIGN_DB
        .prepare("SELECT * FROM players WHERE isChamp = 1;")
        .run();
  return results;
}

async function assignTeams(results, champion, request, env) {
  let teamList = [
    {
        name: 'Carolina Hurricanes',
        value: 'CAR'
    },
    {
        name: 'Columbus Blue Jackets',
        value: 'CBJ'
    },
    {
        name: 'New Jersey Devils',
        value: 'NJD'
    },
    {
        name: 'New York Islanders',
        value: 'NYI'
    },
    {
        name: 'New York Rangers',
        value: 'NYR'
    },
    {
        name: 'Philadelphia Flyers',
        value: 'PHI'
    },
    {
        name: 'Pittsburgh Penguins',
        value: 'PIT'
    },
    {
        name: 'Washington Capitals',
        value: 'WSH'
    },
    {
        name: 'Boston Bruins',
        value: 'BOS'
    },
    {
        name: 'Buffalo Sabres',
        value: 'BUF'
    },
    {
        name: 'Detroit Red Wings',
        value: 'DET'
    },
    {
        name: 'Florida Panthers',
        value: 'FLA'
    },
    {
        name: 'Montreal Canadiens',
        value: 'MTL'
    },
    {
        name: 'Ottawa Senators',
        value: 'OTT'
    },
    {
        name: 'Tampa Bay Lightning',
        value: 'TBL'
    },
    {
        name: 'Toronto Maple Leafs',
        value: 'TOR'
    },
    {
        name: 'Chicago Blackhawks',
        value: 'CHI'
    },
    {
        name: 'Colorado Avalanche',
        value: 'COL'
    },
    {
        name: 'Dallas Stars',
        value: 'DAL'
    },
    {
        name: 'Minnesota Wild',
        value: 'MIN'
    },
    {
        name: 'Nashville Predators',
        value: 'NSH'
    },
    {
        name: 'St. Louis Blues',
        value: 'STL'
    },
    {
        name: 'Utah Mammoth',
        value: 'UTA'
    },
    {
        name: 'Winnepeg Jets',
        value: 'WPG'
    },
    {
        name: 'Anaheim Ducks',
        value: 'ANA'
    },
    {
        name: 'Calgary Flames',
        value: 'CGY'
    },
    {
        name: 'Edmonton Oilers',
        value: 'EDM'
    },
    {
        name: 'Los Angeles Kings',
        value: 'LAK'
    },
    {
        name: 'San Jose Sharks',
        value: 'SJS'
    },
    {
        name: 'Seattle Kraken',
        value: 'SEA'
    },
    {
        name: 'Vancouver Canucks',
        value: 'VAN'
    },
    {
        name: 'Vegas Golden Knights',
        value: 'VGK'
    },
  ];
  let statments = [];
  let assignments = [];
  let x = 0;
  const stmt  = env.ASSIGN_DB.prepare("INSERT INTO players (team, user_id, isChamp) VALUES (?, ?, ?);")
  while(teamList.length) {
    const team = teamList.splice(teamList.length * Math.random() | 0, 1)[0];
    const userId = results[x].username;
    const isChamp = team.value == champion;
    statments[x] = stmt.bind(team.value, userId, isChamp);
    assignments[x] = { team: team.name, id: userId };
    x++;
  }
  const { res } = await env.ASSIGN_DB.batch(statments)
  return assignments;
}

async function getAllUsers(request, env) {
  const { results } = await env.ASSIGN_DB.prepare("SELECT * FROM Persons;").run();
  return results;
}

async function addItem(username, team, isChamp, request, env) {
  const { results } = await env.ASSIGN_DB
        .prepare("INSERT INTO Persons (username, team, isChamp) VALUES (?, ?, ?);")
        .bind(username, team, isChamp)
        .run();
  return results;
}

async function createFirstMatch(game_id, game_time, env) {
  const { results } = await env.ASSIGN_DB
        .prepare("INSERT INTO match (game_id, datetime) VALUES (?, ?);")
        .bind(game_id, game_time)
        .run();
  return results;
}

async function testNextGame(env) {
  const { results } = await env.ASSIGN_DB
        .prepare("SELECT * FROM match;")
        .run();
  return results;
}

async function scheduled(controller, env, ctx) {
  ctx.waitUntil(testAssignments(env));
}

const server = {
  verifyDiscordRequest,
  getUsers: getAllUsers,
  getChamp,
  assignTeams,
  addItem,
  checkUser,
  scheduled,
  createFirstMatch,
  getUser,
  testNextGame,
  fetch: router.fetch,
};

export default server;
