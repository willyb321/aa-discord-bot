// AA Discord Bot
// by CMDR DJ Arghlex

// DEPENDENCIES
console.log("Loading dependencies")
var fs = require("fs") // built-in to nodejs
var Discord = require("discord.io") // install using npm
var request = require("request") // install using npm
var mathjs = require("mathjs") // install using npm
var config = require("config") // install using npm
var exec = require('child_process').exec;

console.log("Loading configuration")
var configuration = config.get("configuration")
fchar = "\uD83C\uDDEB"
// FUNCTIONS
console.log("Loading functions")

// core parts of the bot
function writeLog(message, prefix, writeToFile) {
	prefix = typeof prefix !== "undefined" ? prefix : "Debug"; // by default put [Debug] in front of the message
	writeToFile = typeof writeToFile !== "undefined" ? writeToFile : true;	// log everything to file by default
	wholeMessage = "[" + prefix + "] " + message
	console.log("  " + wholeMessage)
	if (writeToFile == true) {
		fs.appendFileSync(configuration.logfile, wholeMessage + "\n")
	}
	return
}
function getInaraPage(page, callback) { // grab a whole page's HTML from INARA, and return it all as a string
	writeLog("Retrieving INARA page: https://inara.cz/" + page, "HTTP")
	try {
		pageHandle = request.get({
			url: "https://inara.cz/" + page,
			headers: {
				"user-agent": "AA Discord Bot by CMDR DJ Arghlex",
				Cookie: "esid=" + configuration.inaraCookieEsid + "; elitesheet=" + configuration.inaraCookieElitesheet
			},
			timeout: 30000
		}, function (error, response, body) {
			if (error) {
				callback(null)
				writeLog("Error retrieving INARA page: " + error, "HTTP")
				throw error
			}
			if (body == undefined) {
				callback(null)
				writeLog("General error retrieving INARA page!", "HTTP")
				throw "General error retrieving INARA page!"
			}
			callback(body)
		})
	} catch (errr) {
		writeLog("Failed to retrieve INARA page: " + errr, "HTTP")
		callback(null)
	}
}
function getEdsmApiResult(page, callback) { // query EDSM's api for something
	writeLog("Retrieving EDSM APIv1 results: https://www.edsm.net/api-v1/" + page, "HTTP")
	pageHandle = request.get({
		url: "https://www.edsm.net/api-v1/" + page,
		headers: {
			"user-agent": "AA Discord Bot by CMDR DJ Arghlex",
		},
		timeout: 30000
	}, function (error, response, body) {
		if (error) {
			writeLog("Error retrieving EDSM APIv1 result: " + error, "HTTP")
			throw error
		}
		if (body == undefined) {
			callback(null)
			writeLog("Error retrieving EDSM APIv1 result!", "HTTP")
			throw "Error retrieving EDSM APIv1 results!"
		}
		callback(JSON.parse(body))
		return
	})
	return
}

// logic functions
function getEmoji(emojiName) { // return a properly formatted single-server discord emoji
	return "<:" + emojiName + ":" + configuration.emojiReplaces[emojiName] + ">"
}
function compareTwoNames(name1, name2) { // compare two names
	// just try and see if they're equal right off the bat
	if (name1 == undefined || name2 == undefined) {
		return false
	}
	if (name1 == name2 && name1 != "" && name2 != "") {
		return true
	}
	// mild escape prevention
	name1 = JSON.stringify(name1)
	name2 = JSON.stringify(name2)
	if (name1 == name2 && name1 != "" && name2 != "") {
		return true
	}
	// toUpperCase the whole thing
	name1 = name1.toUpperCase()
	name2 = name2.toUpperCase()
	// cut spaces out
	name1 = name1.replace(/\s+/g, '');
	name2 = name2.replace(/\s+/g, '');
	if (name1 == name2 && name1 != "" && name2 != "") {
		return true
	}
	// cut "CMDR" out
	name1 = name1.replace("CMDR", '');
	name2 = name2.replace("CMDR", '');
	if (name1 == name2 && name1 != "" && name2 != "") {
		return true
	}
	// cut clantags off
	name1 = name1.split('[').filter(function (el) {
		return el.length != 0
	})[0]
	name2 = name2.split('[').filter(function (el) {
		return el.length != 0
	})[0]
	name1 = name1.split('(').filter(function (el) {
		return el.length != 0
	})[0]
	name2 = name2.split('(').filter(function (el) {
		return el.length != 0
	})[0]
	name1 = name1.split('<').filter(function (el) {
		return el.length != 0
	})[0]
	name2 = name2.split('<').filter(function (el) {
		return el.length != 0
	})[0]
	name1 = name1.split('{').filter(function (el) {
		return el.length != 0
	})[0]
	name2 = name2.split('{').filter(function (el) {
		return el.length != 0
	})[0]
	if (name1 == name2 && name1 != "" && name2 != "") {
		return true
	}
	//cut all non-alphanumerics off
	name1 = name1.replace(/[^A-Za-z0-9]/g, '')
	name2 = name2.replace(/[^A-Za-z0-9]/g, '')
	if (name1 == name2 && name1 != "" && name2 != "") {
		return true
	}
	//if none of that worked they must not match.
	return false
}

// main functions
function getCmdrInfoFromInara(name, callback) { // search inara for a CMDR, do some stuff with regexps, and return part of a formatted message
	searchResultsRegexp = /Commanders found.*?\/cmdr\/(\d+)/i
	cmdrDetailsNameRegexp = /<span class="pflheadersmall">CMDR<\/span> (.*?)<\/td>/i
	cmdrDetailsAvatarRegexp = /<td rowspan="4" class="profileimage"><img src="(.*)"><\/td>/i
	cmdrDetailsTableRegexp = /<span class="pflcellname">(.*?)<\/span><br>(.*?)<\/td>/gi
	loginToSearchRegexp = /You must be logged in to view search results.../

	getInaraPage("search?location=search&searchglobal=" + encodeURIComponent(name), function (searchResults) {
		if (searchResults) {
			searchResultsMatches = searchResults.match(searchResultsRegexp)
			loginToSearchMatches = searchResults.match(loginToSearchRegexp)
			if (loginToSearchMatches == null) {
				if (searchResultsMatches == null) {
					callback(".\n:x: No INARA profiles found.")
				} else {
					getInaraPage("cmdr/" + searchResultsMatches[1], function (cmdrDetails) {
						if (cmdrDetails) {
							writeLog("processing data", "CMDR-INARA")
							cmdrDetailsNameMatches = cmdrDetails.match(cmdrDetailsNameRegexp)
							cmdrDetailsAvatarMatches = cmdrDetails.match(cmdrDetailsAvatarRegexp)
							inaraInfo = {
								CMDR: cmdrDetailsNameMatches[1]
							}
							cmdrDetails.replace(cmdrDetailsTableRegexp, function (match, p1, p2, offset, string) {
								inaraInfo[p1] = p2
							})
							returnedmessage = ".\nINARA Profile found for **`CMDR " + inaraInfo.CMDR.toUpperCase() + "`:**\n"
							for (var inaraInfoEntry in inaraInfo) {
								if (inaraInfo[inaraInfoEntry] != "&nbsp;" && inaraInfo[inaraInfoEntry] != "" && inaraInfo[inaraInfoEntry] != " ") {
									returnedmessage += "**" + inaraInfoEntry + "**: " + inaraInfo[inaraInfoEntry] + "\n"
								}
							}
							
							writeLog("done! sending to channel", "CMDR-INARA")
							callback(returnedmessage)
						} else {
							callback(".\n:sos: **<@" + configuration.adminUserId + ">: An error occured: profile page retrieval failed!")
						}
					})
				}
			} else {
				
				callback(".\n:sos: **<@" + configuration.adminUserId + ">: An error occured: Need login creds to INARA updated! **")
			}
		} else {
			callback(".\n:sos: **<@" + configuration.adminUserId + ">: An error occured: search results page retrieval failed!")
		}
	})
	return
}
function getCmdrInfoFromDatabase(name, callback) { // search our databases for CMDR information and return part of a formatted message
	results = []

	writeLog("Retrieving database", "CMDR-DB")
	database = JSON.parse(fs.readFileSync('database.json', 'utf8')); // don't prefix with 'var' or it'll gum up our memory bad

	// index parsing
	index = { "list": {}, "roster": {}}
	for (var row in database["Index"]) {
		var sheettype = database["Index"][row]["Type"]
		var sheetalignment = database["Index"][row]["Alignment"]
		var sheetname = database["Index"][row]["Sheet Name"]
		index[sheettype][sheetname] = sheetalignment
	}
	for (var sheet in database) {
		if (index["list"][sheet] != undefined) {
			// search lists
			writeLog("Searching " + sheet + " list...", "CMDR-DB")
			for (var sheetRow in database[sheet]) {
				if (compareTwoNames(database[sheet][sheetRow].CMDR, name)) {
					console.log("Found one!")
					if (database[sheet][sheetRow].Crimes == '') {
						database[sheet][sheetRow].Crimes == "Enemy/Hostile"
					}
					if (database[sheet][sheetRow].Group == '') {
						database[sheet][sheetRow].Group = "Unknown/No Group"
					}
					database[sheet][sheetRow].Association = index["list"][sheet]
					if (index["list"][sheet] == "friendly") {
						//friendlies sheet special 'crimes' handling
						if (database[sheet][sheetRow].Crimes.toUpperCase() === "ALLIED" || database[sheet][sheetRow].Crimes.toUpperCase() === "ALLY") {
							database[sheet][sheetRow].Association = "ally"
						}
						if (database[sheet][sheetRow].Crimes.toUpperCase() === "NEUTRAL") {
							database[sheet][sheetRow].Association = "neutral"
						}
						if (database[sheet][sheetRow].Crimes.toUpperCase() === "UNKNOWN") {
							database[sheet][sheetRow].Association = "unknown"
						}
					}
					results.push(database[sheet][sheetRow])
				}
			}
		}
		if (index["roster"][sheet] != undefined) {
			// search roster
			writeLog("Searching " + sheet + " rosters...", "CMDR-DB")
			for (var row in database[sheet]) {
				for (var cell in database[sheet][row]) {
					if (database[sheet][row][cell] != '') {
						// cell is our groupname
						// sheet[row][cell] is our CMDR name
						if (compareTwoNames(database[sheet][row][cell], name)) {
							console.log("found one!")
							if (cell == '') { // somehow that can happen??
								group = "Unknown/No Group"
							} else {
								group = cell
							}
							results.push({
								CMDR: database[sheet][row][cell],
								Crimes: "On " + sheet,
								Group: group,
								Association: index["roster"][sheet]
							})
						}
					}
				}
			}
		}
	}
	delete database // for memory conservation sake
	writeLog("Search complete. Sending to Discord.","CMDR-DB")
	var returnedEmbedObject = ".\n__**CMDR Database Search Results**__\n*CMDRs Found: ` " + results.length +" `*\n*Submit a new KOS: <https://adlesarmada.arghlex.net/kos/submit/>*\n\n"
	if (results == []) {
		returnedEmbedObject = ".\n__**CMDR Database Search Results**__\n:x: No CMDR Database results found.\n*Submit a new KOS: <https://adlesarmada.arghlex.net/kos/submit/>*"
	} else {
		for (var result in results) {
			returnedEmbedObject += getEmoji("alignment_"+results[result]["Association"])
			returnedEmbedObject += "**"+results[result]["Association"].toUpperCase() + "**:"
			returnedEmbedObject += " **`CMDR " + results[result]["CMDR"].toUpperCase() + "` "+ "//** *" + results[result]["Group"] + "* "
			if (results[result]["User ID"]) {
				returnedEmbedObject += " - ID `" + results[result]["User ID"] + "`"
			}
			returnedEmbedObject += "\n    "
			// now for the littler text
			if (results[result]["Crimes"] != "" || results[result]["Crimes"] != undefined){
				returnedEmbedObject += results[result]["Crimes"]
			} else {
				returnedEmbedObject += "Enemy/Hostile"
			}
			returnedEmbedObject += "\n    "
			if (results[result]["Incident Description"]) {
				returnedEmbedObject += results[result]["Incident Description"]
			}
			if (results[result]["Evidence"]) {
				returnedEmbedObject += " <" + results[result]["Evidence"] + ">"
			}
			if (results[result]["Submitter"]) {
				returnedEmbedObject += ", *Submitted by " + results[result]["Submitter"] + "*"
			}
			returnedEmbedObject += "\n"
		}
	}
	writeLog("done! sent to discord", "CMDR-DB")
	callback(returnedEmbedObject)
}
function getDistanceBetweenTwoSystems(input, callback) { // query EDSM twice to fetch the distance between one system and another
	returnedEmbedObject = {
		timestamp: timestamp,
		footer: {
			icon_url: "https://github.com/ArghArgh200/aa-discord-bot/raw/master/images/logo.png",
			"text": "Adle's Armada Bot by CMDR DJ Arghlex"
		},
		author: {
			name: "System Distance Finder",
			icon_url: "https://github.com/ArghArgh200/aa-discord-bot/raw/master/images/edsmsearch.png"
		},
		title: "Error!",
		description: ":SOS: An error occured.",
		fields: []
	}
	try {
		system1 = input.split(",", 2)[0].trim()
		system2 = input.split(",", 2)[1].trim()
	} catch (err) {
		returnedEmbedObject.title = "Incorrect usage. Try `/system <system1>, <system2>` or `/help`"
		callback(returnedEmbedObject)
		return
	}
	getEdsmApiResult("system?showCoordinates=1&systemName=" + encodeURIComponent(system1), function (system1info) {
		writeLog("Fetched information for " + system1, "EDSM SysDist")
		if (system1info.coords != undefined) {
			writeLog("Info for " + system1 + " looks OK", "EDSM SysDist")
			getEdsmApiResult("system?showCoordinates=1&systemName=" + encodeURIComponent(system2), function (system2info) {
				writeLog("Fetched information for " + system2, "EDSM SysDist")
				if (system2info.coords != undefined) {
					writeLog("Info for " + system2 + " looks OK, calculating distance", "EDSM SysDist")
					system1coords = [system1info.coords.x, system1info.coords.y, system1info.coords.z]
					system2coords = [system2info.coords.x, system2info.coords.y, system2info.coords.z]
					distance = mathjs.distance(system1coords, system2coords).toFixed(2)
					returnedEmbedObject.title = "Distance between `" + system1 + "` and `" + system2 + "`"
					returnedEmbedObject.description = "***```" + distance + "Ly```**"
					writeLog("Distance between " + system1 + " and " + system2 + ": " + distance + "Ly", "EDSM SysDist")
					callback(returnedEmbedObject)
				} else {
					returnedEmbedObject.description = ":x: Could not locate one of the systems!"
					callback(returnedEmbedObject)
				}
			})
		} else {
			returnedEmbedObject.description = ":x: Could not locate one of the systems!"
			callback(returnedEmbedObject)
		}
	})
}
function getInformationAboutSystem(input, callback) { // query EDSM for the details about a system
	returnedEmbedObject = {
		timestamp: timestamp,
		footer: {
			icon_url: "https://github.com/ArghArgh200/aa-discord-bot/raw/master/images/logo.png",
			"text": "Adle's Armada Bot"
		},
		author: {
			name: "System Information",
			icon_url: "https://github.com/ArghArgh200/aa-discord-bot/raw/master/images/edsmsearch.png"
		},
		title: "Error!",
		description: ":x: No systems found.",
		fields: []
	}
	getEdsmApiResult("system?showId=1&showCoordinates=1&showPermit=1&showInformation=1&systemName=" + encodeURIComponent(input), function (systeminfo) {
		writeLog("Got EDSM Info for " + input.toString(), "EDSM SysInfo")
		if (systeminfo.name != undefined) {
			writeLog("Info for " + input.toString() + " looks OK.", "EDSM SysInfo")

			returnedEmbedObject.title = "System Information for __" + systeminfo.name + "__"

			returnedEmbedObject.description = "EDSM:  *<https://www.edsm.net/en/system/id/" + systeminfo.id + "/name/" + encodeURIComponent(systeminfo.name) + ">*"
			if (systeminfo.information.eddbId != undefined) {
				returnedEmbedObject.description += "\nEDDB:  *<https://eddb.io/system/" + systeminfo.information.eddbId + ">*"
			}
			returnedEmbedObject.fields[0] = { name: "__Controlled by__", value: '<ERROR - CONTACT EDSM>' }
			if (systeminfo.information.faction != undefined) {
				returnedEmbedObject.fields[0].value = systeminfo.information.faction
			}
			if (systeminfo.information.allegiance != undefined) {
				returnedEmbedObject.fields[0].value += ", a " + systeminfo.information.allegiance + "-aligned"
				if (systeminfo.information.government != undefined) {
					returnedEmbedObject.fields[0].value += " " + systeminfo.information.government + " faction."
				} else { // no govt available, just say 'a X-aligned faction'
					returnedEmbedObject.fields[0].value += " faction."
				}
			}
			if (systeminfo.information.state != undefined) {
				returnedEmbedObject.fields.push({ name: "__State__", value: systeminfo.information.state })
			}
			if (systeminfo.information.population != undefined) {
				returnedEmbedObject.fields.push({ name: "__Population__", value: systeminfo.information.population })
			}
			if (systeminfo.information.security != undefined) {
				returnedEmbedObject.fields.push({ name: "__Security__", value: systeminfo.information.security })
			}
			if (systeminfo.information.economy != undefined) {
				returnedEmbedObject.fields.push({ name: "__Economy__", value: systeminfo.information.economy })
			}
		}
		callback(returnedEmbedObject)
	})
}
function getCurrentGameTime(input, callback) { // calculate current game time
	callback({
		footer: {
			icon_url: "https://github.com/ArghArgh200/aa-discord-bot/raw/master/images/logo.png",
			"text": "Adle's Armada Bot by CMDR DJ Arghlex"
		},
		author: {
			name: "Current In-Game Time",
			icon_url: "https://github.com/ArghArgh200/aa-discord-bot/raw/master/images/gametime.png"
		},
		title: "\n**```" + timestamp.replace(/T/, ' ').replace(/\..+/, '') + "```**",
		fields: []
	})
}


// DISCORD BOT INTERFACES
console.log("Starting Discord interface")
disconnectCount = 0;
database = getEngineerInfo()
var bot = new Discord.Client({
	token: configuration.authToken,
	autorun: true
})
bot.on('ready', function () {
	writeLog("User ID: " + bot.id + ", Bot User: " + bot.username, "Discord")
	writeLog("Now only accepting messages from channelId: " + configuration.channelId, "CMDR-DB Whois")
	writeLog("Add to your server using this link: ", "Discord");
	writeLog(" https://discordapp.com/oauth2/authorize?client_id=" + bot.id + "&scope=bot&permissions=104160256 ", "Discord");
	writeLog("*** Bot ready! ***", "Discord")
	bot.sendMessage({ to: configuration.channelId, message: ":ok: <@" + configuration.adminUserId + ">: Adle's Armada Discord Bot back online! Type `" + configuration.commandPrefix + "help` for a list of commands." })

	bot.setPresence({ "game": { "name": configuration.currentGame } });

	bot.editNickname({ serverID: configuration.serverId, userId: bot.id, nick: configuration.nickname })
})
bot.on('message', function (user, userId, channelId, message, event) {
	currenttime = new Date().toISOString()
	timestamp = (parseInt(currenttime.split(/-(.+)/, 2)[0]) + 1286) + "-" + currenttime.split(/-(.+)/, 2)[1]
	serverId = bot.channels[channelId]["guild_id"]
	channel = "#" + bot.channels[channelId].name
	server = bot.servers[serverId].name
	
	command = message.split(" ", 1).join(" ").toLowerCase()
	argument = message.split(" ").slice(1).join(" ")
	writeLog("<" + user + "> " + message, "Channel - " + server + "/" + channel, false) // don't log channels to file
	
	if (command == configuration.commandPrefix + "ping") { // send a message to the channel as a ping-testing thing.
		bot.sendMessage({
			to: channelId,
			message: ":heavy_check_mark: <@" + userId + ">: Pong!"
		})
	} else if (command == configuration.commandPrefix + "help") { // help page
		message = ":question::book: <@" + userId.toString() + ">: __**Help Page**__\n"
		message += "`" + configuration.commandPrefix + "help` - This output\n"
		message += "`" + configuration.commandPrefix + "ping` - Returns pong\n"
		message += "`" + configuration.commandPrefix + "time` - Returns current ingame date and time.\n"
		if (channelId == configuration.channelId || channelId == "362010463828967426") { // only show KOS/INARA searcher if it's the right channel
			message += "`" + configuration.commandPrefix + "whois <cmdr>` - Searches the AA Database and INARA for <cmdr>\n    Support INARA! <https://inara.cz/>\n"
		} else {
			message += "`" + configuration.commandPrefix + "whois <cmdr>` - Searches INARA for <cmdr>\n    Support INARA! <https://inara.cz/>\n"
		}
		message += "`" + configuration.commandPrefix + "distance <system1>, <system2>` - Queries EDSM for the distance between two systems.\n"
		message += "`" + configuration.commandPrefix + "system <system>` - Queries EDSM for specific details about a system.\n    Support EDSM! <https://www.edsm.net/en/donation>\n"
		if (userId.toString() == configuration.adminUserId) {
			message += "\n**Bot Administrative Commands (usable only by <@" + configuration.adminUserId + ">)**\n"
			message += "`" + configuration.commandPrefix + "setCurrentGame <string>` - Sets 'Playing' message to <string>\n"
			message += "`" + configuration.commandPrefix + "setNickname <string>` - Sets server nickname to <string>\n"
			message += "`" + configuration.commandPrefix + "setCmdPrefix <string>` - Sets prefix character(s) to <string> (resets to default after restart)\n"
			message += "`" + configuration.commandPrefix + "restart` - Restarts the bot.\n"
		}
		message += "\n**Other commands**\n"
		message += ":regional_indicator_f: - Pay your respects.\n"
		message += "\nOpen source! <https://github.com/ArghArgh200/aa-discord-bot>!\n"
		message += "Donate to help cover running costs. <https://arghlex.net/?page=donate>\n"
		//message += "Add this bot to your server! <https://discordapp.com/oauth2/authorize?client_id=283482763686969345&scope=bot&permissions=104160256>"
		bot.sendMessage({
			to: channelId,
			message: message
		})
		writeLog("Sent help page", "Discord")
	} else if (command == configuration.commandPrefix + "whois" || command == configuration.commandPrefix + "kos") { // KOS/INARA Searcher system
		try {
			getCmdrInfoFromInara(argument, function (embeddedObject) {
				bot.sendMessage({
					to: channelId,
					"message": embeddedObject
				})
			})
		} catch (err) {
			bot.sendMessage({
				to: channelId,
				message: ":sos: <@" + configuration.adminUserId + ">! An error occured:\nwhoisCmdr(): getCmdrInfoFromInara(): `" + err + "`"
			})
		}
		if (channelId == configuration.channelId || channelId == "362010463828967426") { // cmdr-db lookups restricted to one channel, hopefully with permissions properly set on it
			try {
				bot.simulateTyping(channelId)
				getCmdrInfoFromDatabase(argument, function (embeddedObject) {
					bot.sendMessage({
						to: channelId,
						"message": embeddedObject
					})
				})
			} catch (err) {
				bot.sendMessage({
					to: channelId,
					message: ":sos: <@" + configuration.adminUserId + ">! An error occured:\nwhoisCmdr(): getCmdrInfoFromDatabase(): `" + err + "`"
				})
			}
		}
	} else if (command == configuration.commandPrefix + "dist" || command == configuration.commandPrefix + "distance") { // edsm two systems distance fetcher
		try {
			getDistanceBetweenTwoSystems(argument, function (embeddedObject) {
				bot.sendMessage({
					to: channelId,
					"embed": embeddedObject
				})
			})
		} catch (err) {
			bot.sendMessage({
				to: channelId,
				message: ":sos: <@" + configuration.adminUserId + ">! An error occured:\ngetDistanceBetweenTwoSystems(): `" + err + "`"
			})
		}
	} else if (command == configuration.commandPrefix + "system" || command == configuration.commandPrefix + "sys") { // edsm system info
		try {
			bot.simulateTyping(channelId)
			getInformationAboutSystem(argument, function (embeddedObject) {
				bot.sendMessage({
					to: channelId,
					"embed": embeddedObject
				})
			})
		} catch (err) {
			bot.sendMessage({
				to: channelId,
				message: ":sos: <@" + configuration.adminUserId + ">! An error occured:\ngetInformationAboutSystem(): `" + err + "`"
			})
		}
	} else if (command == configuration.commandPrefix + "time") { // game-time fetcher
		try {
			getCurrentGameTime(argument, function (embeddedObject) {
				bot.sendMessage({
					to: channelId,
					"embed": embeddedObject
				})
			})
		} catch (err) { // you never know.
			bot.sendMessage({
				to: channelId,
				message: ":sos: <@" + configuration.adminUserId + ">! An error occured:\ngetCurrentGameTime(): `" + err + "`"
			})
		}
	} else if (command == configuration.commandPrefix + "restart" ) { // public
		writeLog("Restart command given by admin","Administrative")
		bot.sendMessage({ to: channelId, message: ":wave:" },function (error, response) {
			writeLog("Restarting!","Shutdown")
			process.exit(0)
		})
	}
	
	
	if (message == 'F' || message == 'f' || message == fchar) { // pay respects
		writeLog("Paying Respects", "F")
		bot.addReaction({ channelID: channelId, messageID: event.d.id, reaction: fchar }, function (returned) {
			if (returned !== null) {
				writeLog("Unable to pay respects. F. Reason: " + returned, "F")
			}
		})
	}
	
	
	if (userId.toString() == configuration.adminUserId) { //admin commands, usable everywhere but only by admin
		if (command == configuration.commandPrefix + "setcurrentgame") {
			try {
				bot.setPresence({
					"game": {
						"name": argument.toString()
					}
				})
				bot.sendMessage({
					to: channelId,
					message: "<@" + configuration.adminUserId + ">:\n:ok: **Current game set to:** `" + argument.toString() + "`"
				})
				writeLog("Currently Playing Game set to: " + argument.toString(), "Discord")
			} catch (err) {
				bot.sendMessage({
					to: channelId,
					message: "<@" + configuration.adminUserId + ">:\n:sos: **An error occured!**\n discordSetGame(): `" + err + '`'
				})
				writeLog(err, "Error")
			}
		}
		else if (command == configuration.commandPrefix + "setcmdprefix") {
			try {
				configuration.commandPrefix = argument.toString()
				bot.sendMessage({
					to: channelId,
					message: "<@" + configuration.adminUserId + ">:\n:ok: **Command prefix set to:** `" + configuration.commandPrefix + "`\nThis will reset to default if bot restarts."
				})
				bot.setPresence({
					"game": {
						"name": configuration.currentGame
					}
				});
				writeLog("Command prefix changed to: " + configuration.commandPrefix, "Discord")
			} catch (err) {
				bot.sendMessage({
					to: channelId,
					message: "<@" + configuration.adminUserId + ">:\n:sos: **An error occured!**\n discordSetCmdPrefix(): `" + err + '`'
				})
				writeLog(err, "Error")
			}
		}
		else if (command == configuration.commandPrefix + "setnickname") {
			try {
				bot.editNickname({
					serverID: serverId,
					userID: bot.id,
					nick: argument.toString()
				})
				bot.sendMessage({
					to: channelId,
					message: "<@" + configuration.adminUserId + ">:\n:ok: **Bot's nickname on this server (" + server + ") set to:** `" + argument.toString() + "`"
				})
				writeLog("Nickname on " + server + " changed to: " + argument.toString(), "Discord")
			} catch (err) {
				bot.sendMessage({
					to: channelId,
					message: "<@" + configuration.adminUserId + ">:\n:sos: **An error occured!**\n discordSetNickname(): `" + err + '`'
				})
				writeLog(err, "Error")
			}
		} else if ( command == configuration.commandPrefix + "update" ) {
			try {
				exec("~/aa-discord-bot/start.sh databaseparser",function (error, stdout, stderror) {
					if (error != null) {
						writeLog("Error occured while manually updating CMDR-DB: "+stdout+" (N: "+error+")","CMDR-DB")
						throw error
					}
					else {
						bot.sendMessage({
							to: channelId,
							message: "<@" + configuration.adminUserId + ">:\n:ok: **CMDR-DB Updated!**\n"
						})
					}
				})
				writeLog("Updated CMDR-DB at request of admin.", "CMDR-DB")
			} catch (err) {
				bot.sendMessage({
					to: channelId,
					message: "<@" + configuration.adminUserId + ">:\n:sos: **An error occured!**\n cmdrDbUpdate(): `" + err + '`'
				})
				writeLog(err, "Error")
			}
		}
		
	}
	

	if (serverId == configuration.serverId) { // automatic messages
		for (replaceCommand in configuration.replaceCommands) {
			if (command == configuration.commandPrefix + replaceCommand.toLowerCase()) {
				if (argument == "") {
					var prefixMessageWith = "<@" + userId + ">"
				} else {
					var prefixMessageWith = argument
				}
				bot.sendMessage({
					to: channelId,
					message: ":gear::speech_left: " + prefixMessageWith + "\n" + configuration.replaceCommands[replaceCommand]
				})
			}
		}
	}
})
bot.on('disconnect', function (errMessage, code) { // just hard-exit on disconnection
	writeLog("Disconnected from server! Code: " + code + ", Reason: " + errMessage, "Error")
	process.exit(1)
});
