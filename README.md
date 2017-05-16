# Adle's Armada Discord Bot
Discord-based bot for determining if a player is hostile based on their group affiliation or not, as well as searching INARA, EDSM, and more things, soon.

See it in action: https://discord.gg/EF5qXdD

## Installation and Requirements
Requirements:
First, you'll need [nodejs](<https://nodejs.org/en/>).


Running `npm install` in the bot's running directory should get you up and running.
 
## Configuration

Edit the configuration section of the bot's main script (this will be converted to https://www.npmjs.com/package/config -style configuration sometime later)

## Running the bot

Optimally you'll want the bot to run inside a screen or tmux session, automatically restarting its process if it happens to exit (i.e. if the adminUser tells it to /restart, it won't start up without being run again)

The best way to do that is a script that runs a `while true; do things; done` bash loop inside of screen.

[to be continued]
