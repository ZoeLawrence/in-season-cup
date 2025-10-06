/**
 * Share command metadata from a common spot to be used for both runtime
 * and registration.
 */

export const INVITE_COMMAND = {
  name: 'invite',
  description: 'Get an invite link to add the bot to your server',
};

export const TEST_COMMAND = {
  name: 'test',
  description: 'send a hello world with emoji',
};

export const MATCH_UP_COMMAND = {
  name: 'match-up',
  description: 'next match-up for the in-season cup',
};

export const SETUP_COMMAND = {
  name: 'set-up',
  description: 'set-up the bot for a new season',
  options: [
    {
      name: 'assign',
      description: 'assign teams',
      type: 1,
      options: [
        {
          name: 'user',
          description: 'user to assign to team',
          type: 6,
          required: true,
        },
        {
          name: 'team',
          description: 'team to assign user to',
          type: 8,
          required: true,
        },
         {
          name: 'champion',
          description: 'sets whether user is the current champion',
          type: 5,
        },
      ],
    },
  ],
};