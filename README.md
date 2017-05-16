# Adle's Armada Discord Bot
Discord-based bot for determining if a player is hostile based on their group affiliation or not, as well as searching INARA, EDSM, and more things, soon.

See it in action: https://discord.gg/EF5qXdD

## Installation and Requirements
Requirements:
First, you'll need [nodejs](<https://nodejs.org/en/>).


Running `npm install` in the bot's running directory should get you up and running.
 
## Configuration

Edit config/default.js. Most of it should be self explanatory, except for the format for your spreadsheets.

#### For lists:
Each CMDR should have their own row, with the columns being as such:

Timestamp, CMDR, Crimes, Group, ID, Evidence

They can be in any order, but every list needs to have those six columns.

Just put "Friendly", "Ally", or "Neutral" in the Crimes column for various CMDRs to get a proper alignment emoji returned from a sheet marked as friendly

#### For rosters:

List them by columns, group name on top. ex:

Group1, Group2, Group3
======|=======|======
CMDR1,Cmdr2,Cmdr3
cmdr4,Cmdr5,Cmdr6
Cmdr7,,

## Running the bot

Just run `./start.sh` and you're good to go.

[more later, incl. example gdoc, better explanation of alignment emoji system)


## Notes

### The `emoji/` folder

Upload these to your discord server and copy their IDs down. They're used by the bot.

Only the alignment ones are used right now.