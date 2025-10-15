/**
 * Share command metadata from a common spot to be used for both runtime
 * and registration.
 */

export const INVITE_COMMAND = {
  name: 'invite',
  description: 'Get an invite link to add the bot to your server',
};

export const JOIN_COMMAND = {
  name: 'join',
  description: 'Creates a message where people react to join',
};

export const ASSIGN_COMMAND = {
  name: 'group-assign',
  description: 'Assigns all users to a team and posts assignments',
  type: 1, // 1 is type SUB_COMMAND
  options: [
    {
      name: 'champion',
      description: 'team that starts with the cup, use three letter code (ex: SEA)',
      type: 3,
      required: true,
    },
  ]
};

export const REASSIGN_COMMAND = {
  name: 'reassign',
  description: 'reassigns a team or teams',
  options: [
    {
      name: 'swap',
      description: 'swaps the teams of two users',
      type: 1, // 1 is type SUB_COMMAND
      options: [
        {
          name: 'player-one',
          description: 'first player to swap',
          type: 6,
          required: true,
        },
        {
          name: 'player-two',
          description: 'second player to swap',
          type: 6,
          required: true,
        },
      ]
    },
    {
      name: 'replace',
      description: 'reassign a team to a new player',
      type: 1,
      options: [
        {
          name: 'new-player',
          description: 'replacement player',
          type: 6,
          required: true,
        },
        {
          name: 'team',
          description: 'team new player is assigned to, use three letter code (ex: SEA)',
          type: 3,
          required: true,
        },
      ]
    }
  ]
};

export const START_COMMAND = {
  name: 'start',
  description: 'starts the tournament',
};

export const PICKEMS_COMMAND = {
  name: 'pick-ems',
  description: 'starts a game of pickems'
}