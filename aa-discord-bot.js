// AA Discord Bot
// by CMDR DJ Arghlex

// DEPENDENCIES
console.log( "Loading dependencies" )
var fs = require( "fs" ) // built-in to nodejs
var Discord = require( "discord.io" ) // install using npm
var deasync = require( "deasync" ) // install using npm
var request = require( "request" ) // install using npm
var jsonfile = require( "jsonfile" ) // install using npm
var csvjson = require( "csvjson" ) // install using npm
var mathjs = require( "mathjs" ) // install using npm
var config = require( "config" ) // install using npm

console.log( "Loading configuration" )
var configuration = config.get( "configuration" )
jsonfile.spaces = 4
djRebuyCount = 654
fchar = "\uD83C\uDDEB"
// FUNCTIONS
console.log( "Loading functions" )

// core parts of the bot
function writeLog( message, prefix, writeToFile ) {
	prefix = typeof prefix !== "undefined" ? prefix : "Debug"; // by default put [Debug] in front of the message
	writeToFile = typeof writeToFile !== "undefined" ? writeToFile : true;	// log everything to file by default
	wholeMessage = "[" + prefix + "] " + message
	console.log( "  " + wholeMessage )
	if (writeToFile == true ) {
		fs.appendFileSync( configuration.discord.logfile, wholeMessage + "\n" )
	}
	return
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
	return database
}
function getInaraPage( page, callback ) { // grab a whole page's HTML from INARA, and return it all as a string
	writeLog( "Retrieving INARA page: https://inara.cz/" + page, "HTTP" )
	pageHandle = request.get( {
		url: "https://inara.cz/" + page,
		headers: {
			"user-agent": "AA Discord Bot by CMDR DJ Arghlex",
			Cookie: "esid=" + configuration.inara.cookieEsid + "; elitesheet=" + configuration.inara.cookieElitesheet
		}
	}, function( error, response, body ) {
		if ( error ) {
			throw error
		}
		if ( body == undefined ) {
			throw "Error retrieving INARA page!"
		}
		callback( body )
		return
	} )
	return
}
function getGdocSheet( docId, sheetId ) { // grab a sheet in CSV from a gDocs spreadsheet, convert it to a json, and return it
	writeLog( "Retrieving https://docs.google.com/spreadsheets/d/" + docId + "/pub?single=true&output=tsv&gid=" + sheetId, "HTTP" )
	getGdocCsv = deasync( function( url, cb ) {
		userAgent = {
			"User-Agent": "AA Discord Bot by CMDR DJ Arghlex"
		}
		request.get( {
			url: url,
			headers: userAgent
		}, function( err, resp, body ) {
			if ( err ) {
				cb( err, null )
			}
			cb( null, body )
			return
		} )
	} )
	return csvjson.toObject( getGdocCsv( "https://docs.google.com/spreadsheets/d/" + docId + "/pub?single=true&output=tsv&gid=" + sheetId ), {
		delimiter: "\t"
	} )
}
function getEdsmApiResult( page, callback ) { // query EDSM's api for something
	writeLog( "Retrieving EDSM APIv1 results: https://www.edsm.net/api-v1/" + page, "HTTP" )
	pageHandle = request.get( {
		url: "https://www.edsm.net/api-v1/" + page,
		headers: {
			"user-agent": "AA Discord Bot by CMDR DJ Arghlex",
		}
	}, function( error, response, body ) {
		if ( error ) {
			throw error
		}
		if ( body == undefined ) {
			throw "Error retrieving EDSM APIv1 results!"
		}
		callback( JSON.parse( body ) )
		return
	} )
	return
}

// logic functions
function getEmoji( emojiName ) { // return a properly formatted single-server discord emoji
	return "<:" + emojiName + ":" + configuration.discord.emojiReplaces[ emojiName ] + ">"
}
function compareTwoNames( name1, name2 ) { // compare two names
	// just try and see if they're equal right off the bat
	if ( name1 == undefined || name2 == undefined ) {
		return false
	}
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

// main functions
function getCmdrInfoFromInara( name, callback ) { // search inara for a CMDR, do some stuff with regexps, and return part of a formatted message
	searchResultsRegexp = /Commanders found.*?\/cmdr\/(\d+)/i
	cmdrDetailsNameRegexp = /<span class="pflheadersmall">CMDR<\/span> (.*?)<\/td>/i
	cmdrDetailsAvatarRegexp = /<td rowspan="4" class="profileimage"><img src="(.*)"><\/td>/i
	cmdrDetailsTableRegexp = /<span class="pflcellname">(.*?)<\/span><br>(.*?)<\/td>/gi
	loginToSearchRegexp = /You must be logged in to view search results.../
	returnedEmbedObject = {
		timestamp: timestamp,
		footer: {
			icon_url: "https://github.com/ArghArgh200/aa-discord-bot/raw/master/images/logo.png",
			"text": "Adle's Armada Bot by CMDR DJ Arghlex"
		},
		title: "Error!", 
		description: ":x: No INARA profiles found.",
		author: {
			name: "INARA Profile Search",
			icon_url: "https://github.com/ArghArgh200/aa-discord-bot/raw/master/images/inarasearch.png"
		},
		fields: []
	}
	getInaraPage( "search?location=search&searchglobal=" + encodeURIComponent( name ), function( searchResults ) {
		searchResultsMatches = searchResults.match( searchResultsRegexp )
		loginToSearchMatches = searchResults.match( loginToSearchRegexp )
		if ( loginToSearchMatches == null ) {
			if ( searchResultsMatches == null ) {
				callback( returnedEmbedObject )
			} else {
				getInaraPage( "cmdr/" + searchResultsMatches[ 1 ], function( cmdrDetails ) {
					cmdrDetailsNameMatches = cmdrDetails.match( cmdrDetailsNameRegexp )
					cmdrDetailsAvatarMatches = cmdrDetails.match( cmdrDetailsAvatarRegexp )
					inaraInfo = {
						CMDR: cmdrDetailsNameMatches[ 1 ]
					}
					cmdrDetails.replace( cmdrDetailsTableRegexp, function( match, p1, p2, offset, string ) {
						inaraInfo[ p1 ] = p2
					} )
					inaraGroupAlignment = "unknown"
					if ( inaraInfo.Power == "Yuri Grom" || inaraInfo.Power == "Archon Delaine" || inaraInfo.Allegiance == "Alliance" || inaraInfo.Power == "Edmund Mahon" || inaraInfo.Allegiance == "Empire" || inaraInfo.Power == "Arissa Lavigny-Duval" || inaraInfo.Power == "Zemina Torval" || inaraInfo.Power == "Denton Patreus" || inaraInfo.Power == "Aisling Duval" ) {
						inaraGroupAlignment == "oldenemy"
					}
					if ( inaraInfo.Allegiance == "Federation" || inaraInfo.Power == "Zachary Hudson" || inaraInfo.Power == "Felicia Winters" ) {
						inaraGroupAlignment == "friendly"
					}
					groupIndexes = getGdocSheet( configuration.googleDocs.googleDocLink, configuration.googleDocs.sheets.groupIndexes[ "Group Indexes" ].sheetId )
					for ( var sheetRow in groupIndexes ) {
						for ( var cell in groupIndexes[ sheetRow ] ) {
							if ( groupIndexes[ sheetRow ][ cell ] != '' ) {
								if ( inaraInfo.Wing == groupIndexes[ sheetRow ][ cell ] ) {
									inaraGroupAlignment = cell
								}
							}
						}
					}
					returnedEmbedObject.title = getEmoji( "alignment_" + inaraGroupAlignment ) + "**`CMDR " + inaraInfo.CMDR.toUpperCase() + "`**"
					returnedEmbedObject.description = "*" + inaraInfo.Wing + "* -- " + inaraInfo.Allegiance + ", " + inaraInfo.Power
					if (cmdrDetailsAvatarMatches != null ) {
						if (cmdrDetailsAvatarMatches[1] != undefined) {
							returnedEmbedObject.thumbnail = {url: "https://inara.cz/" + cmdrDetailsAvatarMatches[1]}
						}
					}
					returnedEmbedObject.fields.push({name:"__Rank__",value:inaraInfo.Rank})
					if ( inaraInfo.Role != "" ) {
						returnedEmbedObject.fields.push({name:"__Occupation__",value:inaraInfo.Role})
					}
					if ( inaraInfo[ "Overall assets" ] != "&nbsp;" ) {
						returnedEmbedObject.fields.push({name:"__Assets__" ,value: inaraInfo[ "Overall assets" ]})
					}
					if ( inaraInfo.Ship != "" ) {
						addedField = {name:"__Ship__" ,value:inaraInfo.Ship}
						if ( inaraInfo[ "Registered ship name" ] != "" ) {
							addedField.value += ", the *" + inaraInfo[ "Registered ship name" ] + "*"
						}
						returnedEmbedObject.fields.push(addedField)
					}
					callback( returnedEmbedObject )
				} )
			}
		} else {
			returnedEmbedObject.description = ":sos: **<@"+configuration.discord.adminUserId+">: An error occured: Need login creds to INARA updated! **"
			callback( returnedEmbedObject )
		}
	} )
	return
}
function getCmdrInfoFromDatabase( name, callback ) { // search our databases for CMDR information and return part of a formatted message
	rosters = {}
	results = []
	writeLog("Retrieving all sheets","CMDR-DB")
	for ( var listobj in configuration.googleDocs.sheets.lists ) {
		sheet = getGdocSheet( configuration.googleDocs.googleDocLink, configuration.googleDocs.sheets.lists[ listobj ].sheetId )
		writeLog( "Searching " + listobj + " list...", "CMDR-DB" )
		for ( var sheetRow in sheet ) {
			if ( compareTwoNames( sheet[ sheetRow ].CMDR, name ) ) {
				if ( sheet[sheetRow].Crimes == '' ) {
					sheet[sheetRow].Crimes == "Enemy/Hostile"
				}
				if ( sheet[ sheetRow ].Group == '' ) {
					sheet[ sheetRow ].Group = "Unknown/No Group"
				}
				sheet[ sheetRow ].Association = configuration.googleDocs.sheets.lists[ listobj ].association
				if ( configuration.googleDocs.sheets.lists[ listobj ].association == "friendly" ) {
					//friendlies sheet special 'crimes' handling
					if ( sheet[ sheetRow ].Crimes.toUpperCase() === "ALLIED" || sheet[ sheetRow ].Crimes.toUpperCase() === "ALLY" ) {
						sheet[ sheetRow ].Association = "ally"
					}
					if ( sheet[ sheetRow ].Crimes.toUpperCase() === "NEUTRAL" ) {
						sheet[ sheetRow ].Association = "neutral"
					}
					if ( sheet[ sheetRow ].Crimes.toUpperCase() === "UNKNOWN" ) {
						sheet[ sheetRow ].Association = "unknown"
					}
				}
				results.push( sheet[ sheetRow ] )
			}
		}
	}
	writeLog("Retrieving all rosters","CMDR-DB")
	for ( var listobj in configuration.googleDocs.sheets.rosters ) {
		rosters[ listobj ] = {}
		sheet = getGdocSheet( configuration.googleDocs.googleDocLink, configuration.googleDocs.sheets.rosters[ listobj ].sheetId )
		writeLog( "Searching " + listobj + " rosters...", "CMDR-DB" )
		for ( var row in sheet ) {
			for ( var cell in sheet[ row ] ) {
				if ( sheet[ row ][ cell ] != '' ) {
					// cell is our groupname
					// sheet[row][cell] is our CMDR name
					if ( compareTwoNames( sheet[ row ][ cell ], name ) ) {
						if ( cell == '' ) {
							group = "Unknown/No Group"
						} else {
							group = cell
						}
						results.push( {
							CMDR: sheet[ row ][ cell ],
							Crimes: "On " + listobj + " Group Roster",
							Group: group,
							Association: configuration.googleDocs.sheets.rosters[ listobj ].association
						} )
					}
				}
			}
		}
	}
	writeLog("comparing name to all sources","CMDR-DB")
	returnedEmbedObject = {
		timestamp: timestamp,
		footer: {
			icon_url: "https://github.com/ArghArgh200/aa-discord-bot/raw/master/images/logo.png",
			"text": "Adle's Armada Bot by CMDR DJ Arghlex"
		},
		author: {
			name: "CMDR Database Search Results",
			icon_url: "https://github.com/ArghArgh200/aa-discord-bot/raw/master/images/cmdrsearch.png"
		},
		title: "CMDRs Found: ` " + results.length + " `",
		description: "[Submit a new KOS?](https://adlesarmada.arghlex.net/kos/submit/)",
		fields: []
	}
	if ( results == [] ) {
		returnedEmbedObject.description = ":x: No CMDR Database results found. \n [Submit a new KOS?](https://adlesarmada.arghlex.net/kos/submit/)"
		returnedEmbedObject.fields = []
	} else {
		for ( var result in results ) {
			newField={name:"", value:""}
			newField.name += getEmoji( "alignment_" + results[ result ][ "Association" ] )
			newField.name += " **`CMDR " + results[ result ][ "CMDR" ].toUpperCase() + "`** "
			newField.name += "**//** *" + results[ result ][ "Group" ] + "* "
			newField.value += results[ result ][ "Crimes" ] + "\n"
			returnedEmbedObject.fields.push( newField )
		}
	}
	writeLog("done! sent to discord","CMDR-DB")
	callback( returnedEmbedObject )
}
function searchEngineeringDatabase( input, callback ) { // search our engineering help pages for a string
	if ( input.length < 3 ) {
		callback( ":sos: **An error occured!**\n searchEngineeringDatabase(): `Search query too short. (Needs to be 3 characters or more)`" )
	}
	if ( database == null ) {
		callback( ":sos: **An error occured!**\n searchEngineeringDatabase(): `Engineering database failed to load!`" )
	}
	writeLog("Searching Engineering Database","EngHelp")
	results = {
		"Blueprints": [],
		"Engineer Information": [],
		"Material Sources": []
	}
	foundone = false
	for ( section in database ) {
		for ( entry in database[ section ] ) {
			if ( JSON.stringify( database[ section ][ entry ] ).toLowerCase().indexOf( input.toLowerCase() ) > -1 ) {
				results[ section ].push( database[ section ][ entry ] )
				foundone = true
			}
		}
	}
	if ( foundone == false ) {
		callback( ":x: **No Engineering information found.**" )
	} else {
		for ( resultcategory in results ) {
			//blueprints
			if ( resultcategory == "Blueprints" && results[ resultcategory ] !== [] ) {
				blueprintsmessage = "__**Blueprints**__\n"
				printscount = 0;
				for ( result in results[ resultcategory ] ) {
					if ( printscount < 5 ) {
						blueprintsmessage += "  "
						if ( results[ resultcategory ][ result ][ "Type" ] != "Unlock" ) {
							blueprintsmessage += "**G" + results[ resultcategory ][ result ][ "Grade" ] + "** "
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
				engineerinfomessage = "__**Engineers**__\n"
				foundone = false
				for ( result in results[ resultcategory ] ) {
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
				materialsourcesmessage = "__**Materials**__\n"
				foundone = false
				for ( result in results[ resultcategory ] ) {
					foundone = true
					materialsourcesmessage = materialsourcesmessage + results[ resultcategory ][ result ][ "Name" ]
					materialsourcesmessage += " :round_pushpin: " + results[ resultcategory ][ result ][ "OriginDetails" ].join( ", " )
				}
				if ( foundone ) {
					callback( materialsourcesmessage )
				}
			}
		}
	}
	return
}
function getDistanceBetweenTwoSystems( input, callback ) { // query EDSM twice to fetch the distance between one system and another
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
		system1 = input.split( ",", 2 )[ 0 ].trim()
		system2 = input.split( ",", 2 )[ 1 ].trim()
	} catch ( err ) {
		returnedEmbedObject.title = "Incorrect usage. Try `/system <system1>, <system2>` or `/help`"
		callback( returnedEmbedObject )
		return
	}
	getEdsmApiResult( "system?showCoordinates=1&systemName=" + encodeURIComponent( system1 ), function( system1info ) {
		writeLog("Fetched information for "+system1,"EDSM SysDist")
		if ( system1info.coords != undefined ) {
			writeLog("Info for "+system1 + " looks OK","EDSM SysDist")
			getEdsmApiResult( "system?showCoordinates=1&systemName=" + encodeURIComponent( system2 ), function( system2info ) {
			writeLog("Fetched information for "+system2,"EDSM SysDist")
				if ( system2info.coords != undefined ) {
					writeLog("Info for "+system2 + " looks OK, calculating distance","EDSM SysDist")
					system1coords = [ system1info.coords.x, system1info.coords.y, system1info.coords.z ]
					system2coords = [ system2info.coords.x, system2info.coords.y, system2info.coords.z ]
					distance = mathjs.distance( system1coords, system2coords ).toFixed( 2 )
					returnedEmbedObject.title = "Distance between `" + system1 + "` and `" + system2 + "`"
					returnedEmbedObject.description = "***```" + distance + "Ly```**"
					writeLog("Distance between "+system1+" and "+system2+": "+distance+"Ly","EDSM SysDist")
					callback( returnedEmbedObject )
				} else {
					returnedEmbedObject.description = ":x: Could not locate one of the systems!"
					callback( returnedEmbedObject )
				}
			} )
		} else {
			returnedEmbedObject.description = ":x: Could not locate one of the systems!"
			callback( returnedEmbedObject )
		}
	} )
}
function getInformationAboutSystem( input, callback ) { // query EDSM for the details about a system
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
	getEdsmApiResult( "system?showId=1&showCoordinates=1&showPermit=1&showInformation=1&systemName=" + encodeURIComponent( input ), function( systeminfo ) {
		writeLog("Got EDSM Info for "+input.toString(),"EDSM SysInfo")
		if ( systeminfo.name != undefined ) {
			writeLog("Info for "+input.toString() + " looks OK.","EDSM SysInfo")
			
			returnedEmbedObject.title= "System Information for __" +systeminfo.name+"__"
			
			returnedEmbedObject.description = "EDSM:  *<https://www.edsm.net/en/system/id/" + systeminfo.id + "/name/" + encodeURIComponent( systeminfo.name ) + ">*"
			if ( systeminfo.information.eddbId != undefined ) {
				returnedEmbedObject.description += "\nEDDB:  *<https://eddb.io/system/" + systeminfo.information.eddbId + ">*"
			}
			returnedEmbedObject.fields[ 0 ] = {name:"__Controlled by__",value:'<ERROR - CONTACT EDSM>'}
			if ( systeminfo.information.faction != undefined ) {
				returnedEmbedObject.fields[ 0 ].value = systeminfo.information.faction
			}
			if ( systeminfo.information.allegiance != undefined ) {
				returnedEmbedObject.fields[ 0 ].value += ", a " + systeminfo.information.allegiance + "-aligned"
				if ( systeminfo.information.government != undefined ) {
					returnedEmbedObject.fields[ 0 ].value += " " + systeminfo.information.government + " faction."
				}else { // no govt available, just say 'a X-aligned faction'
					returnedEmbedObject.fields[ 0 ].value += " faction."
				}
			}
			if ( systeminfo.information.state != undefined ) {
				returnedEmbedObject.fields.push({name:"__State__", value: systeminfo.information.state})
			}
			if ( systeminfo.information.population != undefined ) {
				returnedEmbedObject.fields.push({name:"__Population__", value: systeminfo.information.population})
			}
			if ( systeminfo.information.security != undefined ) {
				returnedEmbedObject.fields.push({name:"__Security__" , value:  systeminfo.information.security})
			}
			if ( systeminfo.information.economy != undefined ) {
				returnedEmbedObject.fields.push({name:"__Economy__" , value: systeminfo.information.economy})
			}
		}
		callback(returnedEmbedObject)
	} )
}
function getCurrentGameTime( input, callback ) { // calculate current game time
	callback( {
		footer: {
			icon_url: "https://github.com/ArghArgh200/aa-discord-bot/raw/master/images/logo.png",
			"text": "Adle's Armada Bot by CMDR DJ Arghlex"
		},
		author: {
			name: "Current In-Game Time",
			icon_url: "https://github.com/ArghArgh200/aa-discord-bot/raw/master/images/gametime.png"
		},
		title: "\n**```" + timestamp.replace( /T/, ' ' ).replace( /\..+/, '' ) + "```**",
		fields: []
	} )
}
function getLastDjDeaths ( input, callback ) { // list DJ deaths
	writeLog ( "fetching list and making it pretty" , "DJDeaths" )
	djDeaths = jsonfile.readFileSync( "./djdeaths.json" )
	totalRebuys = djRebuyCount + Object.keys(djDeaths).length
	returnedEmbedObject = {
		footer: {
			icon_url: "https://github.com/ArghArgh200/aa-discord-bot/raw/master/images/logo.png",
			"text": "Adle's Armada Bot by CMDR DJ Arghlex"
		},
		author: {
			name: "Last deaths of DJ Arghlex",
		},
		title: "List of deaths of CMDR DJ Arghlex, from latest to oldest recorded.",
		fields: [{name: "List of Deaths", value: " "}],
		description: "Number of total rebuys: **` "+ totalRebuys +" `**"
	}
	for (death in djDeaths ) {
		returnedEmbedObject.fields[0].value += "On **` "+death + " `**, CMDR DJ Arghlex died because: **" + djDeaths[death] + "**\n"
	}
	callback( returnedEmbedObject )
}
function addDjDeath ( input, callback ) { // add a DJ death to the list
	if ( input.trim() != "" ) {
		// load the list
		djDeaths = jsonfile.readFileSync( "./djdeaths.json" )
		fancytimestamp = timestamp.replace( /T/, ' ' ).replace( /\..+/, '' )
		// edit the list
		djDeaths[fancytimestamp] = input.toString()
		
		// now save the deaths list
		jsonfile.writeFileSync("./djdeaths.json",djDeaths)
		message = ":ok: Added a DJ Death at time `"+fancytimestamp+"` with reason `"+input.toString()+"`\nType `"+configuration.discord.commandPrefix+"djdeaths` for a list.\n\n**DAYS SINCE LAST DJ DEATH:**\nhttps://arghargh200.net/u/5KU6AxDGgdMS.png"
	} else {
		message = ":x: Specify a reason."
	}
	callback ( message )
}

// DISCORD BOT INTERFACES
console.log( "Starting Discord interface" )
disconnectCount = 0;
database = getEngineerInfo()
var bot = new Discord.Client( {
	token: configuration.discord.authToken,
	autorun: true
} )
bot.on( 'ready', function() {
	writeLog( "User ID: " + bot.id + ", Bot User: " + bot.username, "Discord" )
	writeLog( "Now only accepting messages from channelId: " + configuration.discord.channelId, "Discord" )
	writeLog( "Add to your server using this link: ", "Discord" );
	writeLog( " https://discordapp.com/oauth2/authorize?client_id=" + bot.id + "&scope=bot&permissions=104160256 ", "Discord" );
	writeLog( "*** Bot ready! ***", "Discord" )
	//bot.sendMessage( { to: configuration.discord.channelId, message: ":ok: <@" + configuration.discord.adminUserId + ">: Adle's Armada Discord Bot back online! Type `" + configuration.discord.commandPrefix + "help` for a list of commands."} )
	//bot.sendMessage( { to: configuration.discord.secondChannelId, message: ":ok: <@" + configuration.discord.adminUserId + ">: Adle's Armada Discord Bot back online! Type `" + configuration.discord.commandPrefix + "help` for a list of commands."} )
	
	bot.setPresence( { "game": { "name": configuration.discord.currentGame } } );
	
	bot.editNickname( { serverID: configuration.discord.serverId, userId: bot.id, nick: configuration.discord.nickname } )
	bot.editNickname( { serverID: configuration.discord.secondServerId, userId: bot.id, nick: configuration.discord.nickname } )
} )
bot.on( 'message', function( user, userId, channelId, message, event ) {
	currenttime = new Date().toISOString()
	timestamp = (parseInt(currenttime.split(/-(.+)/,2)[0])+1286)+"-"+currenttime.split(/-(.+)/,2)[1]
	serverId = bot.channels[channelId]["guild_id"]
	channel = "#" + bot.channels[channelId].name
	server = bot.servers[serverId].name
	command = message.split( " ", 1 ).join( " " ).toLowerCase()
	argument = message.split( " " ).slice( 1 ).join( " " )
	writeLog( "<" + user + "> " + message, "Channel - "+server+"/"+channel )
		
	if ( command == configuration.discord.commandPrefix + "ping" ) { // send a message to the channel as a ping-testing thing.
		bot.sendMessage( {
			to: channelId,
			message: ":heavy_check_mark: <@" + userId + ">: Pong!"
		} )
	}
	if ( command == configuration.discord.commandPrefix + "help" ) { // help page
		message = ":question::book: <@" + userId.toString() + ">: __**Help Page**__\n"
		message += "`" + configuration.discord.commandPrefix + "help` - This output\n"
		message += "`" + configuration.discord.commandPrefix + "ping` - Returns pong\n"
		message += "`" + configuration.discord.commandPrefix + "time` - Returns current ingame date and time.\n"
		if ( channelId == configuration.discord.channelId || channelId == configuration.discord.secondChannelId || channelId == configuration.discord.testChannelID ) { // only show KOS/INARA searcher if it's the right channel
			message += "`" + configuration.discord.commandPrefix + "whois <cmdr>` - Searches the AA Database and INARA for <cmdr>\n    Support INARA! <https://inara.cz/>\n"
		} else {
			message += "`" + configuration.discord.commandPrefix + "whois <cmdr>` - Searches INARA for <cmdr>\n    Support INARA! <https://inara.cz/>\n"
		}
		message += "`" + configuration.discord.commandPrefix + "eng <query>` - Looks for <query> in the Engineering Database.\n    Support EDEngineer! <https://github.com/msarilar/EDEngineer/>\n"
		message += "`" + configuration.discord.commandPrefix + "distance <system1>, <system2>` - Queries EDSM for the distance between two systems.\n"
		message += "`" + configuration.discord.commandPrefix + "system <system>` - Queries EDSM for specific details about a system.\n    Support EDSM! <https://www.edsm.net/en/donation>\n"
		if ( userId.toString() == configuration.discord.adminUserId ) {
			message += "\n**Bot Administrative Commands (usable only by <@" + configuration.discord.adminUserId + ">)**\n"
			message += "`" + configuration.discord.commandPrefix + "djDeaths` - List all deaths of CMDR DJ Arghlex\n"
			message += "`" + configuration.discord.commandPrefix + "addDjDeath <string>` - Add a DJ Death to the list\n"
			message += "`" + configuration.discord.commandPrefix + "setCurrentGame <string>` - Sets 'Playing' message to <string>\n"
			message += "`" + configuration.discord.commandPrefix + "setNickname <string>` - Sets server nickname to <string>\n"
			message += "`" + configuration.discord.commandPrefix + "setCmdPrefix <string>` - Sets prefix character(s) to <string> (resets to default after restart)\n"
			message += "`" + configuration.discord.commandPrefix + "restart` - Restarts the bot.\n"
		}
		message += "\n**Other Commands/Responses/Memes**\n"
		message += ":regional_indicator_f: - Pay your respects.\n"
		message += "`/.*reee.*/` - Ask Maztek.\n"
		message += "\nOpen source! Check out <https://github.com/ArghArgh200/aa-discord-bot>!\n"
		message += "Donate to help cover running costs. Or not, I don't care. <https://arghlex.net/?page=donate>\n"
		message += "Add this bot to your server! <https://discordapp.com/oauth2/authorize?client_id=283482763686969345&scope=bot&permissions=104160256>"
		bot.sendMessage( {
			to: channelId,
			message: message
		} )
		writeLog( "Sent help page", "Discord" )
	}
	if ( command == configuration.discord.commandPrefix + "whois" || command == configuration.discord.commandPrefix + "kos" ) { // KOS/INARA Searcher system
		if ( channelId == configuration.discord.channelId || channelId == configuration.discord.secondChannelId || channelId == configuration.discord.testChannelID ) {
			try {
				bot.simulateTyping( channelId )
				getCmdrInfoFromDatabase( argument, function( embeddedObject ) {
					bot.sendMessage( {
						to: channelId,
						"embed": embeddedObject
					} )
				} )
			} catch ( err ) {
				bot.sendMessage( {
					to: channelId,
					message: ":sos: <@" + configuration.discord.adminUserId + ">! An error occured:\nwhoisCmdr(): getCmdrInfoFromDatabase(): `" + err + "`"
				} )
			}
		}
		try {
			getCmdrInfoFromInara( argument, function( embeddedObject ) {
				bot.sendMessage( {
					to: channelId,
					"embed": embeddedObject
				} )
			} )
		} catch ( err ) {
			bot.sendMessage( {
				to: channelId,
				message: ":sos: <@" + configuration.discord.adminUserId + ">! An error occured:\nwhoisCmdr(): getCmdrInfoFromInara(): `" + err + "`"
			} )
		}
	}
	if ( command == configuration.discord.commandPrefix + "eng" ) { // engineer database searcher
		try {
			searchEngineeringDatabase( argument, function( embeddedObject ) {
				bot.sendMessage( {
					to: channelId,
					"message": embeddedObject
				} )
			} )
		} catch ( err ) {
			bot.sendMessage( {
				to: channelId,
				message: ":sos: <@" + configuration.discord.adminUserId + ">! An error occured:\nsearchEngineeringDatabase(): `" + err + "`"
			} )
		}
	}
	if ( command == configuration.discord.commandPrefix + "dist" || command == configuration.discord.commandPrefix + "distance" ) { // edsm two systems distance fetcher
		try {
			getDistanceBetweenTwoSystems( argument, function( embeddedObject ) {
				bot.sendMessage( {
					to: channelId,
					"embed": embeddedObject
				} )
			} )
		} catch ( err ) {
			bot.sendMessage( {
				to: channelId,
				message: ":sos: <@" + configuration.discord.adminUserId + ">! An error occured:\ngetDistanceBetweenTwoSystems(): `" + err + "`"
			} )
		}
	}
	if ( command == configuration.discord.commandPrefix + "system" || command == configuration.discord.commandPrefix + "sys" ) { // edsm system info
		try {
			bot.simulateTyping( channelId )
			getInformationAboutSystem( argument, function( embeddedObject ) {
				bot.sendMessage( {
					to: channelId,
					"embed": embeddedObject
				} )
			} )
		} catch ( err ) {
			bot.sendMessage( {
				to: channelId,
				message: ":sos: <@" + configuration.discord.adminUserId + ">! An error occured:\ngetInformationAboutSystem(): `" + err + "`"
			} )
		}
	}
	if ( command == configuration.discord.commandPrefix + "time" ) { // game-time fetcher
		try {
			getCurrentGameTime( argument, function( embeddedObject ) {
				bot.sendMessage( {
					to: channelId,
					"embed": embeddedObject
				} )
			} )
		} catch ( err ) { // you never know.
			bot.sendMessage( {
				to: channelId,
				message: ":sos: <@" + configuration.discord.adminUserId + ">! An error occured:\ngetCurrentGameTime(): `" + err + "`"
			} )
		}
	}
	if ( command == configuration.discord.commandPrefix + "djdeaths" ) { // list DJ's Deaths
		try {
			getLastDjDeaths( argument, function( embeddedObject ) {
				bot.sendMessage( {
					to: channelId,
					"embed": embeddedObject
				} )
			} )
		} catch ( err ) {
			bot.sendMessage( {
				to: channelId,
				message: ":sos: <@" + configuration.discord.adminUserId + ">! An error occured:\ngetLastDjDeaths(): `" + err + "`"
			} )
		}
	}
	if ( userId.toString() == configuration.discord.adminUserId ) { //admin commands, usable everywhere
		if ( command == configuration.discord.commandPrefix + "adddjdeath" ) { // add DJ's deaths
			try {
				addDjDeath( argument, function( returnedmessage ) {
					bot.sendMessage( {
						to: channelId,
						message: returnedmessage
					} )
				} )
			} catch ( err ) {
				bot.sendMessage( {
					to: channelId,
					message: ":sos: <@" + configuration.discord.adminUserId + ">! An error occured:\naddDjDeath(): `" + err + "`"
				} )
			}
		}
		if ( command == configuration.discord.commandPrefix + "setcurrentgame" ) {
			try {
				bot.setPresence( {
					"game": {
						"name": argument.toString()
					}
				} )
				bot.sendMessage( {
					to: channelId,
					message: "<@" + configuration.discord.adminUserId + ">:\n:ok: **Current game set to:** `" + argument.toString() + "`"
				} )
				writeLog( "Currently Playing Game set to: " + argument.toString(), "Discord" )
			} catch ( err ) {
				bot.sendMessage( {
					to: channelId,
					message: "<@" + configuration.discord.adminUserId + ">:\n:sos: **An error occured!**\n discordSetGame(): `" + err + '`'
				} )
				writeLog( err, "Error" )
			}
		}
		if ( command == configuration.discord.commandPrefix + "setcmdprefix" ) {
			try {
				configuration.discord.commandPrefix = argument.toString()
				bot.sendMessage( {
					to: channelId,
					message: "<@" + configuration.discord.adminUserId + ">:\n:ok: **Command prefix set to:** `" + configuration.discord.commandPrefix + "`\nThis will reset to default if bot restarts."
				} )
				bot.setPresence( {
					"game": {
						"name": configuration.discord.currentGame
					}
				} );
				writeLog( "Command prefix changed to: " + configuration.discord.commandPrefix, "Discord" )
			} catch ( err ) {
				bot.sendMessage( {
					to: channelId,
					message: "<@" + configuration.discord.adminUserId + ">:\n:sos: **An error occured!**\n discordSetCmdPrefix(): `" + err + '`'
				} )
				writeLog( err, "Error" )
			}
		}
		if ( command == configuration.discord.commandPrefix + "setnickname" ) {
			try {
				bot.editNickname( {
					serverID: serverId,
					userID: bot.id,
					nick: argument.toString()
				} )
				bot.sendMessage( {
					to: channelId,
					message: "<@" + configuration.discord.adminUserId + ">:\n:ok: **Bot's nickname on this server ("+server+") set to:** `" + argument.toString() + "`"
				} )
				writeLog( "Nickname on "+server+" changed to: " + argument.toString(), "Discord" )
			} catch ( err ) {
				bot.sendMessage( {
					to: channelId,
					message: "<@" + configuration.discord.adminUserId + ">:\n:sos: **An error occured!**\n discordSetNickname(): `" + err + '`'
				} )
				writeLog( err, "Error" )
			}
		}
		if ( command == configuration.discord.commandPrefix + "restart" ) {
			writeLog("Restarting (Restart command given by admin)")
			process.exit( 0 )
		}
	}
	if ( message == 'F' || message == 'f' || message == fchar ) { // pay respects
		writeLog("Paying Respects","F")
		bot.addReaction({channelID: channelId, messageID: event.d.id, reaction: fchar }, function (returned) { 
			if (returned !== null) {
				writeLog("Unable to pay respects. F. Reason: "+returned,"F")
			}
		})
	}
	if ( serverId == configuration.discord.secondServerId || serverId == configuration.discord.serverId ) { // automatic messages
		for ( replaceCommand in configuration.discord.replaceCommands ) {
			if ( command == configuration.discord.commandPrefix + replaceCommand.toLowerCase() ) {
				if ( argument == "" ) {
					var prefixMessageWith = "<@" + userId + ">"
				} else {
					var prefixMessageWith = argument
				}
				bot.sendMessage( {
					to: channelId,
					message: ":gear::speech_left: " + prefixMessageWith + "\n" + configuration.discord.replaceCommands[ replaceCommand ]
				} )
			}
		}
	}
	if ( bot.id !== userId ) { // developed upon request by Maztek
		if ( message.match( /.*fuckin.*norm.*/i ) !== null || message.match( /.*reee.*/i ) !== null ) {
			writeLog("FUCKING NORMIES","REEE")
			bot.sendMessage( { to: channelId, message: "REEEEEEEEEEEEEE" } )
		}
	}
} )
bot.on( 'disconnect', function( errMessage, code ) { // just hard-exit on disconnection
	writeLog( "Disconnected from server! Code: " + code + ", Reason: " + errMessage, "Error" )
	process.exit( 1 )
} );
