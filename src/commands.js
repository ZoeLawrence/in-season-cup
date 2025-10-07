/**
 * Share command metadata from a common spot to be used for both runtime
 * and registration.
 */

export const INVITE_COMMAND = {
  name: 'invite',
  description: 'Get an invite link to add the bot to your server',
};

export const MATCH_UP_COMMAND = {
  name: 'match-up',
  description: 'next match-up for the in-season cup',
};

export const JOIN_COMMAND = {
  name: 'join',
  description: 'Creates a message where people react to join',
};

export const ASSIGN_COMMAND = {
  name: 'group-assign',
  description: 'Assigns all users to a team and responds posts assignments',
  options: [
    {
      name: 'current champ',
      description: 'use 3 letter code (ex: SEA)',
      type: 6,
      required: true,
    },
  ],
};

export const START_COMMAND = {
  name: 'start',
  description: 'starts the tournament'
};

export const SWAP_COMMAND = {
  name: 'swap',
  description: 'swaps the teams of two users',
  type: 1,
  options: [
    {
      name: 'player one',
      description: '',
      type: 6,
      required: true,
    },
    {
      name: 'player two',
      description: '',
      type: 6,
      required: true,
    },
  ],
};