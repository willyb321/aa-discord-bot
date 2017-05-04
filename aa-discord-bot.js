// AA Discord Bot

// Version 2.2, by CMDR DJ Arghlex
// Added EDSM distance and systeminfo retrieval

// DEPENDENCIES
console.log( "Loading dependencies" )

var fs = require( "fs" ) // built-in to nodejs
var Discord = require( "discord.io" ) // install using npm
var deasync = require( "deasync" ) // install using npm
var request = require( "request" ) // install using npm
var jsonfile = require( "jsonfile" ) // install using npm
var csvjson = require( "csvjson" ) // install using npm
var mathjs = require( "mathjs" ) // install using npm

console.log( "Loading configuration" )

configuration = {}
configuration.discord = {}
configuration.inara = {}
configuration.googleDocs = {}


configuration.discord.commandPrefix = 	"/"
configuration.discord.logfile = 	"./aa-discord-bot.log"
configuration.discord.authToken = 		"authtokenfromdiscordappsbotpage"
configuration.discord.serverId = 		"0"
configuration.discord.channelId = 		"0"
configuration.discord.testChannelId = 	"0"
configuration.discord.adminUserId = 	"0"

configuration.discord.nickname = 		"YourBotNameHere"
configuration.discord.currentGame = 	"YourBotCurrentlyPlayingGameMessage"

configuration.googleDocs.googleDocLink = 			"YourgDocSheetUrl"

configuration.googleDocs.sheets = {}
configuration.googleDocs.sheets.rosters = {}
configuration.googleDocs.sheets.lists = {}
configuration.googleDocs.sheets.groupIndexes = {}

configuration.googleDocs.sheets.lists["Primary KOS List"] = 			{ sheetId: "0",	association: "enemy" }
configuration.googleDocs.sheets.lists["Submissions"] = 				{ sheetId: "0",	association: "requestedenemy" }
configuration.googleDocs.sheets.lists["Old Enemies"] = 				{ sheetId: "0",		association: "oldenemy" }
configuration.googleDocs.sheets.lists["Friendly/Neutrals"] = 	{ sheetId: "0",	association: "friendly" }

configuration.googleDocs.sheets.rosters["Allied Player"] = 	{ sheetId: "0", 	association: "allied" }
configuration.googleDocs.sheets.rosters["Enemy Player"] = 	{ sheetId: "0", 	association: "enemy" }
configuration.googleDocs.sheets.rosters["Adle's Armada"] = 	{ sheetId: "0", 	association: "owngroup" }

configuration.googleDocs.sheets.groupIndexes["Group Indexes"] = 	{ sheetId: "0" }


configuration.inara.cookieElitesheet = 			"elitesheet cookie from inara.cz while logged in";
configuration.inara.cookieEsid = 				"esid cookie from inara.cz while logged in";

// don't touch these
configuration.inara.searchResultsRegexp = 		/Commanders found.*?\/cmdr\/(\d+)/i
configuration.inara.cmdrDetailsNameRegexp = 	/<span class="pflheadersmall">CMDR<\/span> (.*?)<\/td>/i
configuration.inara.cmdrDetailsTableRegexp = 	/<span class="pflcellname">(.*?)<\/span><br>(.*?)<\/td>/gi


configuration.discord.emojiReplaces={}

// ids for custom emojis on your discord server. upload all the icons, use them while the bot's running, and then copy-paste the IDs to this array
configuration.discord.emojiReplaces["enemy"] = 				"0"
configuration.discord.emojiReplaces["oldenemy"] = 			"0"
configuration.discord.emojiReplaces["requestedenemy"] = 	"0"
configuration.discord.emojiReplaces["neutral"] = 			"0"
configuration.discord.emojiReplaces["friendly"] = 			"0"
configuration.discord.emojiReplaces["allied"] = 			"0"
configuration.discord.emojiReplaces["owngroup"] = 			"0"
configuration.discord.emojiReplaces["unknown"] = 			"0"

configuration.discord.emojiReplaces["engineerhexagon"] = 			"0"
configuration.discord.emojiReplaces["engineerelementmaterial"] = 	"0"
configuration.discord.emojiReplaces["engineersalvagedmaterial"] = 	"0"
configuration.discord.emojiReplaces["engineerdatamaterial"] = 		"0"
configuration.discord.emojiReplaces["engineercommoditymaterial"] = 		"0"



// FUNCTIONS
console.log( "Loading functions" )


// core parts of the bot
function writeLog( message, prefix ) {
	var prefix = typeof prefix !== "undefined" ? prefix : "Debug";
	wholeMessage = "[" + prefix + "] " + message
	console.log( "  " + wholeMessage )
	fs.appendFileSync( configuration.discord.logfile, wholeMessage + "\n" )
}


// remote file acquisitions
function getEngineerInfo() { // load our engineer info from our files
	writeLog( "Loading databases", "EngineerHelp" )
	database = {}
	try {
		database[ "Blueprints" ] = require( "./engineerhelp/blueprints.json" )
		database[ "Material Sources" ] = require( "./engineerhelp/materialSources.json" )
		database[ "Engineer Information" ] = require( "./engineerhelp/engineerInfo.json" )
	} catch ( err ) {
		database = null
	}
	console.log()
	return database
}

function getInaraPage( page , callback) { // grab a whole page's HTML from INARA, and return it all as a string
	writeLog( "Retrieving INARA page: " + page , "HTTP")
	var pageHandle = request.get( {
		url: "https://inara.cz/" + page,
		headers: {
			"user-agent": "AA Discord Bot Project",
			Cookie: "esid=" + configuration.inara.cookieEsid + "; elitesheet=" + configuration.inara.cookieElitesheet
		}
	}, function (error, response, body) {
		if (error) {throw error}
		if (body == undefined) {throw "Error retrieving INARA page!"}
		callback(body)
		return
	})
}

function getGdocSheet( docId, sheetId ) { // grab a sheet in CSV from a gDocs spreadsheet, convert it to a json, and return it
	writeLog( "Retrieving https://docs.google.com/spreadsheets/d/" + docId + "/pub?single=true&output=csv&gid=" + sheetId, "HTTP")
	var getGdocCsv = deasync(function (url, cb) {
		userAgent = {"User-Agent": "AA Discord Bot Project"}
		request.get({
			url: url,
			headers: userAgent
		},
		function (err, resp, body) {
			if (err) { cb(err, null) }
			cb(null, body)
		return
		})
	})
	return csvjson.toObject(getGdocCsv("https://docs.google.com/spreadsheets/d/" + docId + "/pub?single=true&output=csv&gid=" + sheetId))
}

var database = getEngineerInfo()

function getEdsmApiResult( page, callback ) { // query EDSM's api for something
	writeLog( "Retrieving EDSM APIv1 results: " + page , "HTTP")
	var pageHandle = request.get( {
		url: "https://www.edsm.net/api-v1/" + page,
		headers: {
			"user-agent": "AA Discord Bot Project",
		}
	}, function (error, response, body) {
		if (error) {throw error}
		if (body == undefined) {throw "Error retrieving EDSM APIv1 results!"}
		callback(JSON.parse(body))
	})
}
// logic functions
function getEmoji( emojiName ) { // return a properly formatted single-server discord emoji
	return "<:" + emojiName + ":" + configuration.discord.emojiReplaces[ emojiName ] + ">"
}

function compareTwoNames( name1, name2 ) { // compare two names
	// just try and see if they're equal right off the bat
	if ( name1 == name2 && name1 != "" && name2 != "" ) {
		return true
	}

	// mild escape prevention
	name1 = JSON.stringify( name1 )
	name2 = JSON.stringify( name2 )
	if ( name1 == name2 && name1 != "" && name2 != "" ) {
		return true
	}

	// toUpperCase the whole thing
	name1 = name1.toUpperCase()
	name2 = name2.toUpperCase()

	// cut spaces out
	name1 = name1.replace( "/\s+/g", "" );
	name2 = name2.replace( "/\s+/g", "" );
	if ( name1 == name2 && name1 != "" && name2 != "" ) {
		return true
	}

	// cut "CMDR" out
	name1 = name1.replace( "CMDR", "" );
	name2 = name2.replace( "CMDR", "" );
	if ( name1 == name2 && name1 != "" && name2 != "" ) {
		return true
	}

	// cut clantags off
	name1 = name1.split( '[' ).filter( function( el ) {
		return el.length != 0
	} )[ 0 ]
	name2 = name2.split( '[' ).filter( function( el ) {
		return el.length != 0
	} )[ 0 ]
	name1 = name1.split( '(' ).filter( function( el ) {
		return el.length != 0
	} )[ 0 ]
	name2 = name2.split( '(' ).filter( function( el ) {
		return el.length != 0
	} )[ 0 ]
	name1 = name1.split( '<' ).filter( function( el ) {
		return el.length != 0
	} )[ 0 ]
	name2 = name2.split( '<' ).filter( function( el ) {
		return el.length != 0
	} )[ 0 ]
	name1 = name1.split( '{' ).filter( function( el ) {
		return el.length != 0
	} )[ 0 ]
	name2 = name2.split( '{' ).filter( function( el ) {
		return el.length != 0
	} )[ 0 ]
	if ( name1 == name2 && name1 != "" && name2 != "" ) {
		return true
	}

	//cut all alphanumerics off
	name1 = name1.replace( "/\W/g", '' )
	name2 = name2.replace( "/\W/g", '' )
	if ( name1 == name2 && name1 != "" && name2 != "" ) {
		return true
	}

	//if none of that worked they must not match.
	return false
}


// main functions to get data with
function getCmdrInfoFromInara( name, callback ) { // search inara for a CMDR, do some stuff with regexps, and return part of a formatted message
	getInaraPage( "search?location=search&searchglobal=" + encodeURIComponent( name ) , function (searchResults) { 
		var searchResultsMatches = searchResults.match( configuration.inara.searchResultsRegexp )
		if ( searchResultsMatches == null ) {
			callback( ":x: __**No INARA profiles found for `" + name + "`**__" )
			return
		}
		try {
			getInaraPage( "cmdr/" + searchResultsMatches[ 1 ],function (cmdrDetails) { 
				var cmdrDetailsNameMatches = cmdrDetails.match( configuration.inara.cmdrDetailsNameRegexp )
				var inaraInfo = {
					CMDR: cmdrDetailsNameMatches[ 1 ]
				}
				cmdrDetails.replace( configuration.inara.cmdrDetailsTableRegexp, function( match, p1, p2, offset, string ) {
					inaraInfo[ p1 ] = p2
				} )
				message = ":mag_right: __**INARA Search Results for `" + name + "`**__\n"
				
				var inaraGroupAlignment = "unknown"
				/*
					a brief note:
					we're currently allied with the federation powers
					we're hostile with the empire, and pirates/dictators
					everyone else can still go fuck themselves but honestly
					we probably won't see any Mahon supporters in open to shoot.
				*/
				if (
						inaraInfo.Power == "Yuri Grom" || 
						inaraInfo.Power == "Archon Delaine" || 
						
						inaraInfo.Allegiance == "Alliance" || 
						inaraInfo.Power == "Edmund Mahon" || 
						
						inaraInfo.Allegiance == "Empire" || 
						inaraInfo.Power == "Arissa Lavigny-Duval" || 
						inaraInfo.Power == "Zemina Torval" || 
						inaraInfo.Power == "Denton Patreus" ||
						inaraInfo.Power == "Aisling Duval" 
				) {
					inaraGroupAlignment == "oldenemy"
				}
				
				if (inaraInfo.Allegiance == "Federation" || inaraInfo.Power == "Zachary Hudson" || inaraInfo.Power == "Felicia Winters" ) {
					inaraGroupAlignment == "friendly"
				}
				
				var groupIndexes = getGdocSheet(configuration.googleDocs.googleDocLink ,configuration.googleDocs.sheets.groupIndexes["Group Indexes"].sheetId)
				for (var sheetRow in groupIndexes) {
					for ( var cell in groupIndexes[sheetRow] ) {
						if (groupIndexes[sheetRow][cell] != '') {
							if (inaraInfo.Wing == groupIndexes[sheetRow][cell]) {
								inaraGroupAlignment = cell
							}
						}
					}
				}
				
				message += getEmoji(inaraGroupAlignment)
				
				message += " **`CMDR " + inaraInfo.CMDR.toUpperCase() + "`** // " + inaraInfo.Wing + " -- " + inaraInfo.Allegiance + ", " + inaraInfo.Power
				message += "\n    **Rank:** " + inaraInfo.Rank
				if ( inaraInfo.Role != "" ) {
					message += ", **Occupation:** " + inaraInfo.Role
				}
				if ( inaraInfo[ "Overall assets" ] != "&nbsp;" ) {
					message += ", **Assets:** " + inaraInfo[ "Overall assets" ]
				}
				if ( inaraInfo.Ship != "" ) {
					message += "\n    **Ship:** " + inaraInfo.Ship
				}
				if ( inaraInfo[ "Registered ship name" ] != "" ) {
					message += ", *" + inaraInfo[ "Registered ship name" ] + "*"
				}
				callback(message)
				return
			})
		} catch ( err ) {
			callback(":sos: <@" + configuration.discord.adminUserId + ">! An error occured:\ngetCmdrInfoFromInara(): `Error retrieving/parsing CMDR Profile: " + err + "`")
			return
		}
	})
}
//getCmdrInfoFromInara("test",function(msg){console.log(msg)})
function getCmdrInfoFromDatabase( name, callback ) { // search our databases for CMDR information and return part of a formatted message
	rosters = {}
	results = []
	for ( var listobj in configuration.googleDocs.sheets.lists ) {
		var sheet = getGdocSheet( configuration.googleDocs.googleDocLink, configuration.googleDocs.sheets.lists[ listobj ].sheetId )
		writeLog( "Searching " + listobj + " list...", "CMDR-DB" )
		for ( var sheetRow in sheet ) {
			if ( compareTwoNames( sheet[ sheetRow ].CMDR, name ) ) {
				sheet[ sheetRow ].Association = configuration.googleDocs.sheets.lists[ listobj ].association
				results.push( sheet[ sheetRow ] )
			}
		}
	}
	for ( var listobj in configuration.googleDocs.sheets.rosters ) {
		rosters[ listobj ] = {}
		var sheet = getGdocSheet( configuration.googleDocs.googleDocLink, configuration.googleDocs.sheets.rosters[ listobj ].sheetId )
		writeLog( "Searching " + listobj + " rosters...", "CMDR-DB" )
		for ( var row in sheet ) {
			for ( var cell in sheet[ row ] ) {
				if ( sheet[ row ][ cell ] != '' ) {
					// cell is our groupname
					// sheet[row][cell] is our CMDR name
					if ( compareTwoNames( sheet[ row ][ cell ], name ) ) {
						results.push( {
							CMDR: sheet[ row ][ cell ],
							Crimes: "On " + listobj + " Group Roster",
							Group: cell,
							Association: configuration.googleDocs.sheets.rosters[ listobj ].association
						} )
					}
				}
			}
		}
	}
	writeLog("Found entries matching "+name,"CMDR-DB")
	if ( results == [] ) {
		var message = ":x: __**No CMDR results found for `" + name + "`**__"
		callback( message )
		return
	}
	var message = ":mag_right: __**CMDR Search Results for `" + name + "`**__\n"
	for ( var result in results ) {
		message += getEmoji( results[ result ][ "Association" ] )
		message += " **`CMDR " + results[ result ][ "CMDR" ].toUpperCase() + "`** "
		message += "// *" + results[ result ][ "Group" ] + "* "
		message += "-- " + results[ result ][ "Crimes" ] + "\n"
	}
	callback( message )
	return
}

function searchEngineeringDatabase( input, callback ) { // search our engineering help pages for a string
	if ( input.length < 3 ) {
		err = "Search query too short. (Needs to be 3 characters or more)"
		errorMessage = ":sos: **An error occured!**\n searchEngineeringDatabase(): `" + err + "`"
		callback( errorMessage )
	}
	if ( database == null ) {
		err = "Engineering database failed to load!"
		errorMessage = ":sos: **An error occured!**\n searchEngineeringDatabase(): `" + err + "`"
		callback( errorMessage )
	}

	results = {
		"Blueprints": [],
		"Engineer Information": [],
		"Material Sources": []
	}
	foundone = false
	for ( var section in database ) {
		for ( var entry in database[ section ] ) {
			if ( JSON.stringify( database[ section ][ entry ] ).toLowerCase().indexOf( input.toLowerCase() ) > -1 ) {
				results[ section ].push( database[ section ][ entry ] )
				foundone = true
			}
		}
	}

	if ( foundone == false ) {
		var message = ":x: No Engineering information found for `" + input + "`.\n"
		callback( message )
	} else {
		for ( var resultcategory in results ) {
			//blueprints
			if ( resultcategory == "Blueprints" && results[ resultcategory ] !== [] ) {
				var blueprintsmessage = "__**Blueprints**__\n"
				var printscount = 0;
				for ( var result in results[ resultcategory ] ) {
					if ( printscount < 5 ) {
						blueprintsmessage += "  "
						if ( results[ resultcategory ][ result ][ "Type" ] != "Unlock" ) {
							for ( var i = 0; i < parseInt( results[ resultcategory ][ result ][ "Grade" ] ); i++ ) {
								blueprintsmessage += getEmoji( "engineerhexagon" )
							}
						} else {
							blueprintsmessage += ":unlock:"
						}
						blueprintsmessage += "**" + results[ resultcategory ][ result ][ "Name" ]
						blueprintsmessage += " " + results[ resultcategory ][ result ][ "Type" ] + "**"
						blueprintsmessage += " :busts_in_silhouette:" + results[ resultcategory ][ result ][ "Engineers" ].join( ", " )
						blueprintsmessage += "\n  :nut_and_bolt: Required items:  "
						for ( var ingredient in results[ resultcategory ][ result ][ "Ingredients" ] ) {
							blueprintsmessage += results[ resultcategory ][ result ][ "Ingredients" ][ ingredient ][ "Size" ] + "x " + results[ resultcategory ][ result ][ "Ingredients" ][ ingredient ][ "Name" ] + "  "
						}
						blueprintsmessage = blueprintsmessage + "\n\n"
						printscount++
					}
				}
				if ( printscount > 0 ) {
					callback( blueprintsmessage )
				}
			}

			//engineer info
			if ( resultcategory == "Engineer Information" && results[ resultcategory ] !== [] ) {
				var engineerinfomessage = "__**Engineers**__\n"
				var foundone = false
				for ( var result in results[ resultcategory ] ) {
					foundone = true
					engineerinfomessage += "  :bust_in_silhouette: **" + results[ resultcategory ][ result ][ "Name" ] + "**"
					engineerinfomessage += "  :map: " + results[ resultcategory ][ result ][ "Location" ] + "\n"
					engineerinfomessage += "  :mag: " + results[ resultcategory ][ result ][ "Discover" ] + "\n"
					engineerinfomessage += "  :handshake: " + results[ resultcategory ][ result ][ "Meet" ] + "\n"
					engineerinfomessage += "  :unlock: " + results[ resultcategory ][ result ][ "Unlock" ] + "\n"
					engineerinfomessage += "  :arrow_double_up: Roll mods"
					if ( results[ resultcategory ][ result ][ "Rank Up" ] != "" ) { // 
						engineerinfomessage += " or turn in " + results[ resultcategory ][ result ][ "Rank Up" ] + "\n\n"
					}
				}
				if ( foundone ) {
					callback( engineerinfomessage )
				}
			}

			//materials and their info
			if ( resultcategory == "Material Sources" && results[ resultcategory ] !== [] ) {
				var materialsourcesmessage = "__**Materials**__\n"
				var foundone = false
				for ( var result in results[ resultcategory ] ) {
					foundone = true
					if ( results[ resultcategory ][ result ][ "Kind" ] == "Commodity" ) {
						materialsourcesmessage += getEmoji( "engineercommoditymaterial" )
					}
					if ( results[ resultcategory ][ result ][ "Kind" ] == "Data" ) {
						materialsourcesmessage += getEmoji( "engineerdatamaterial" )
					}
					if ( results[ resultcategory ][ result ][ "Kind" ] == "Material" ) {
						materialsourcesmessage += getEmoji( "engineerelementmaterial" )
					}
					materialsourcesmessage = materialsourcesmessage + results[ resultcategory ][ result ][ "Name" ]
					materialsourcesmessage += " :round_pushpin: " + results[ resultcategory ][ result ][ "OriginDetails" ].join( ", " )
				}
				if ( foundone ) {
					callback( materialsourcesmessage )
				}
			}
		}
	}
}

function getDistanceBetweenTwoSystems ( input, callback ) {
	var systems = input.split(",",2)
	console.log(systems.length)
	if ( systems.length != 2 ) {
		callback("Incorrect usage. Separate your two system names with a `,`")
		return
	}
	
	system1 = systems[0].trim()
	system2 = systems[1].trim()
	
	getEdsmApiResult("system?showId=1&showCoordinates=1&showPermit=1&showInformation=1&systemName="+encodeURIComponent(system1), function (system1info) {
		if (system1info.coords != undefined ) {
			getEdsmApiResult("system?showId=1&showCoordinates=1&showPermit=1&showInformation=1&systemName="+encodeURIComponent(system2), function (system2info) {
				if (system2info.coords != undefined ) {
					system1coords = [system1info.coords.x,system1info.coords.y,system1info.coords.z]
					system2coords = [system2info.coords.x,system2info.coords.y,system2info.coords.z]
					distance = mathjs.distance(system1coords,system2coords).toFixed(2)
					var message = "Distance between **`"+system1+"`** and **`"+system2+"`**: **`"+ distance + "Ly`**"
					callback(message)
				} else {
					callback("Could not locate second system!")
				}
				return
			})
		}else {
			callback("Could not locate first system!")
		}
		return
	})
}

function getInformationAboutSystem ( input , callback ) {
	getEdsmApiResult("system?showId=1&showCoordinates=1&showPermit=1&showInformation=1&systemName="+encodeURIComponent(input), function (systeminfo) {
		console.log(systeminfo)
		if (systeminfo.name != undefined ) {
			var message = "System Name: **`" + systeminfo.name + "`**\n*EDSM: <https://www.edsm.net/en/system/id/"+systeminfo.id+"/name/"+encodeURIComponent(systeminfo.name)+">*"
			if (systeminfo.information.eddbId != undefined) { message += "  *EDDB: <https://eddb.io/system/" + systeminfo.information.eddbId +">*" }
			message += "\n"
			if (systeminfo.information.faction != undefined) { message += "Controlled by: **" + systeminfo.information.faction +"**" }
			if (systeminfo.information.allegiance != undefined) { message += ", " + systeminfo.information.allegiance }
			if (systeminfo.information.government != undefined) { message += " " + systeminfo.information.government + " Faction"}
			message += "\n"
			if (systeminfo.information.state != undefined) { message += "State: *" + systeminfo.information.state +"* " }
			if (systeminfo.information.population != undefined) { message += "Population: *" + systeminfo.information.population +"* " }
			if (systeminfo.information.security != undefined) { message += "Security: *" + systeminfo.information.security +"* " }
			if (systeminfo.information.economy != undefined) { message += "Economy: *" + systeminfo.information.economy +"* " }
		} else {
			var message = "No system found."
		}
		callback(message)
		return
	})
}
console.log( "Starting Discord interface" )

// DISCORDBOT INTERFACES
disconnectCount = 0;
var bot = new Discord.Client( {
	token: configuration.discord.authToken,
	autorun: true
} )

bot.on( 'ready', function() {
	writeLog( "Bot ready!", "Discord" )
	writeLog( "User ID: " + bot.id + ", Bot User: " + bot.username, "Discord" )
	writeLog( "Now only accepting messages from channelID: " + configuration.discord.channelId, "Discord" )
	writeLog( "Add to your server using this link: ", "Discord" );
	writeLog( " https://discordapp.com/oauth2/authorize?client_id=" + bot.id + "&scope=bot&permissions=104160256 ", "Discord" );
	bot.sendMessage( {
			to: configuration.discord.channelId,
			message: ":ok: Adle's Armada Discord Bot online! Type `" + configuration.discord.commandPrefix + "help` for a list of commands."
		} ),
		bot.setPresence( {
			"game": {
				"name": configuration.discord.currentGame
			}
		} );
	bot.editNickname( {
		serverID: configuration.discord.serverId,
		userId: bot.id,
		nick: configuration.discord.nickname
	} )
} )

bot.on( 'message', function( user, userId, channelId, message, event ) {
	if ( channelId == configuration.discord.channelId || channelId == configuration.discord.testChannelID ) {
		writeLog( "< " + user + " @ " + userId + " / " + channelId + " > " + message, "Channel" )
		var command = message.split( " ", 1 ).join( " " )
		var argument = message.split( " " ).slice( 1 ).join( " " )

		// parse messages
		if ( command == configuration.discord.commandPrefix + "ping" ) { // send a message to the channel as a ping-testing thing.
			bot.sendMessage( {
				to: channelId,
				message: ":heavy_check_mark: <@" + userId + ">: Pong!"
			} )
		} else if ( command == configuration.discord.commandPrefix + "help" ) {
			message = "<@" + userId.toString() + ">:\n:question: AA Discord Bot Help Page\n\n"
			message += "`" + configuration.discord.commandPrefix + "help` - This output\n"
			message += "`" + configuration.discord.commandPrefix + "ping` - Returns pong.\n"
			message += "`" + configuration.discord.commandPrefix + "whois <cmdr>` - Searches the AA Database and INARA for <cmdr>\n    Support INARA! <https://inara.cz/>\n"
			message += "`" + configuration.discord.commandPrefix + "kos` - Aliased to `" + configuration.discord.commandPrefix + "whois`\n"
			message += "`" + configuration.discord.commandPrefix + "eng <query>` - Looks for <query> in the Engineering Database.\n    Support EDEngineer! <https://github.com/msarilar/EDEngineer/>\n"
			message += "`" + configuration.discord.commandPrefix + "dist <system1>, <system2>` - Queries EDSM for the distance between two systems.\n"
			message += "`" + configuration.discord.commandPrefix + "distance` - Aliased to `" + configuration.discord.commandPrefix + "dist`\n"
			message += "`" + configuration.discord.commandPrefix + "system <system>` - Queries EDSM for specific details about a system.\n    Support EDSM! <https://www.edsm.net/en/donation>\n"
			if ( userId.toString() == configuration.discord.adminUserId ) {
				message += "\n**Bot Administrative Commands (usable only by <@" + configuration.discord.adminUserId + ">)**\n"
				message += "`" + configuration.discord.commandPrefix + "setCurrentGame <string>` - Sets 'Playing' message to <string>\n"
				message += "`" + configuration.discord.commandPrefix + "setNickname <string>` - Sets server nickname to <string>\n"
				message += "`" + configuration.discord.commandPrefix + "setCmdPrefix <string>` - Sets prefix character(s) to <string> (resets to default after restart)\n"
				message += "`" + configuration.discord.commandPrefix + "restart` - Shuts down the bot to be restarted by the watcher script later.\n"
				message += "`" + configuration.discord.commandPrefix + "disconnect` - Reconnects the bot to Discord.\n"
			}
			message += "\n  ~~Open source! Check out <https://github.com/ArghArgh200/aa-discord-bot>!~~ Soon to be updated with this bot's code.\n"
			message += "  Donate to help cover running costs. Or not, I don't care. <https://arghlex.net/?page=donate>\n"
			bot.sendMessage( {
				to: channelId,
				message: message
			} )
			writeLog( "Sent help page", "Discord" )
		} else if ( command == configuration.discord.commandPrefix + "whois" || command == configuration.discord.commandPrefix + "kos" ) {
			try {
				bot.simulateTyping( channelId )
				getCmdrInfoFromDatabase( argument, function( outputmessage ) {
					bot.sendMessage( {
						to: channelId,
						message: "<@" + userId + ">\n" + outputmessage
					} )
				} )
			} catch ( err ) {
				bot.sendMessage( {
					to: channelId,
					message: ":sos: <@" + configuration.discord.adminUserId + ">! An error occured:\nwhoisCmdr(): `" + err + "`"
				} )
			}
			try {
				bot.simulateTyping( channelId )
				getCmdrInfoFromInara( argument, function( outputmessage ) {
					bot.sendMessage( {
						to: channelId,
						message: "<@" + userId + ">\n" + outputmessage
					} )
				} )
			} catch ( err ) {
				bot.sendMessage( {
					to: channelId,
					message: ":sos: <@" + configuration.discord.adminUserId + ">! An error occured:\nwhoisCmdr(): `" + err + "`"
				} )
			}
		} else if ( command == configuration.discord.commandPrefix + "eng" ) {
			try {
				bot.simulateTyping( channelId )
				searchEngineeringDatabase( argument, function( outputmessage ) {
					bot.sendMessage( {
						to: channelId,
						message: ":mag_right: <@" + userId + ">: Engineer Help Search Results\n" + outputmessage
					} )
				} )
			} catch ( err ) {
				bot.sendMessage( {
					to: channelId,
					message: ":sos: <@" + configuration.discord.adminUserId + ">! An error occured:\nsearchEngineeringDb(): `" + err + "`"
				} )
			}
		} else if ( command == configuration.discord.commandPrefix + "dist" ) {
			try {
				bot.simulateTyping( channelId )
				getDistanceBetweenTwoSystems( argument, function( outputmessage ) {
					bot.sendMessage( {
						to: channelId,
						message: ":straight_ruler: <@" + userId + ">: System Distances\n" + outputmessage
					} )
				} )
			} catch ( err ) {
				bot.sendMessage( {
					to: channelId,
					message: ":sos: <@" + configuration.discord.adminUserId + ">! An error occured:\ngetDistanceBetweenTwoSystems(): `" + err + "`"
				} )
			}
		} else if ( command == configuration.discord.commandPrefix + "system" ) {
			try {
				bot.simulateTyping( channelId )
				getInformationAboutSystem( argument, function( outputmessage ) {
					bot.sendMessage( {
						to: channelId,
						message: ":globe_with_meridians: <@" + userId + ">: System Information\n" + outputmessage
					} )
				} )
			} catch ( err ) {
				bot.sendMessage( {
					to: channelId,
					message: ":sos: <@" + configuration.discord.adminUserId + ">! An error occured:\ngetInformationAboutSystem(): `" + err + "`"
				} )
			}
		}
		if ( userId.toString() == configuration.discord.adminUserId ) { //admin commands
			if ( command == configuration.discord.commandPrefix + "setCurrentGame" ) {
				try {
					bot.setPresence( {
						"game": {
							"name": argument.toString()
						}
					} );
					returnmessage = "<@" + configuration.discord.adminUserId + ">:\n:ok: **Current game set to:** `" + argument.toString() + "`"
					bot.sendMessage( {
						to: channelID,
						message: returnmessage
					} )
					writeLog( "Currently Playing Game set to: ", "Discord" )
				} catch ( err ) {
					errorMessage = "<@" + configuration.discord.adminUserId + ">:\n:sos: **An error occured!**\n discordSetGame(): `" + err + '`'
					bot.sendMessage( {
						to: channelId,
						message: errorMessage
					} )
					writeLog( err, "Error" )
				}
			} else if ( command == configuration.discord.commandPrefix + "setCmdPrefix" ) {
				try {
					configuration.discord.commandPrefix = argument.toString()
					returnmessage = "<@" + configuration.discord.adminUserId + ">:\n:ok: **Command prefix set to:** `" + configuration.discord.commandPrefix + "`\nThis will reset to default if bot restarts."
					bot.sendMessage( {
						to: channelId,
						message: returnmessage
					} )
					bot.setPresence( {
						"game": {
							"name": "For help, type " + configuration.discord.commandPrefix + "help"
						}
					} );
					writeLog( "Command prefix changed to: " + configuration.discord.commandPrefix, "Discord" )
				} catch ( err ) {
					errorMessage = "<@" + configuration.discord.adminUserId + ">:\n:sos: **An error occured!**\n discordSetCmdPrefix(): `" + err + '`'
					bot.sendMessage( {
						to: channelId,
						message: errorMessage
					} )
					writeLog( err, "Error" )
				}
			} else if ( command == configuration.discord.commandPrefix + "setNickname" ) {
				try {
					bot.editNickname( {
						serverID: configuration.discord.serverId,
						userId: bot.id,
						nick: argument.toString()
					} )
					returnmessage = "<@" + configuration.discord.adminUserId + ">:\n:ok: **Bot's nickname on this server set to:** `" + argument.toString() + "`"
					bot.sendMessage( {
						to: channelId,
						message: returnmessage
					} )
					writeLog( "Nickname on server changed to: " + argument.toString(), "Discord" )
				} catch ( err ) {
					errorMessage = "<@" + configuration.discord.adminUserId + ">:\n:sos: **An error occured!**\n discordSetNickname(): `" + err + '`'
					bot.sendMessage( {
						to: channelId,
						message: errorMessage
					} )
					writeLog( err, "Error" )
				}
			} else if ( command == configuration.discord.commandPrefix + "restart" ) {
				bot.sendMessage( {
					to: channelId,
					message: ":wave: Restarting!"
				}, setTimeout( process.exit( 0 ), 500 ) )
			} else if ( command == configuration.discord.commandPrefix + "disconnect" ) {
				bot.sendMessage( {
					to: channelId,
					message: ":wave: Reconnecting!"
				}, setTimeout( bot.disconnect(), 500 ) )
			}
		} // end admin commands
	}
} )

bot.on( 'disconnect', function( errMessage, code ) {
	writeLog( "Disconnected from server! Code: " + code + ", Reason: " + errMessage, "Error" )
	if ( disconnectCount <= 50 ) {
		disconnectCount++
		writeLog( "Disconnect Counter (max 50 before bot exits): " + disconnectCount, "Error" )
		setTimeout( bot.connect(), 5000 )
	} else {
		writeLog( "Too many disconnects, exiting", "Fatal Error" )
		process.exit( 1 )
	}
} );
