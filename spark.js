/*
	Greetings, and welcome to the server-side source code for Spark-Coins!  This program runs on Node.JS (currently version 16) and manages HTTP(S) requests, WebSocket Connections, and Google's Spreadsheet API as the back-end to the Spark-Coin idea.  See ./views/index.ejs for the client-side HTML document and script.
	I'm hoping to leverage Transparency as Security, so if you see a flaw or bug in this program, feel free to update it or poke me (Brian Westgate)!  I'm just a hobbyist programmer working on this as a side-project, so I'm sure there are plenty of bugs and/or better ways to do things.	
*/

const DEBUG = true; //Turn this off in production environment!
const DEBUG_STARTUP_WAIT = false;
const SIMULATE_GOOGLE = true; //Bypasses google lookups, essential for github codespace hosting.
const VERSION = 20230327;
const BOOT_TIME = new Date();
console.log(`>*******************************************************************************`);
console.log(`>Spinning up Spark-Coin server version ${VERSION} on ${BOOT_TIME.toString()}...`);

//Included modules
//let express = require('express'); //We're using Express.js as our general web framework 
//let app = express();
let path = require('path');
let fs = require('fs');
let httpServer = require('http').createServer(httpHandler) //We tell NodeJS that we're using it for http services.
let io = require('socket.io')(httpServer); //We connect web socket service, Socket IO, to the http server
let crypto = require('crypto');
let { google } = require('googleapis');  //Google API required for spreadsheet manipulation

//Global variables/configuration
const HTTP_SERVER_ADDRESS = "localhost";  //Even when deployed to spark-coin.com, this will be localhost as Apache will be the initial handler to http & https requests and pass it to NodeJS.  This is for my VPS, but your hosting environment may differ.
const HTTP_SERVER_PORT = 3000;

//Just some fun "anonyomus" adjective + animal names to give something more friendly than IP addresses.
const RANDOM_ADJECTIVES = ["Acidic", "Aggressive", "Agreeable", "Alive", "Ambitious", "Ancient", "Angry", "Ashy", "Attractive", "Bald", "Beautiful", "Better", "Bewildered", "Big", "Bitter", "Black", "Blue", "Brave", "Breezy", "Brief", "Broad", "Bumpy", "Calm", "Careful", "Chilly", "Chubby", "Chunky", "Clean", "Clever", "Clumsy", "Cold", "Colossal", "Colorful", "Cool", "Crashing", "Creamy", "Crooked", "Crunchy", "Cuddly", "Curved", "Damaged", "Damp", "Dazzling", "Dead", "Deafening", "Deep", "Defeated", "Delicious", "Delightful", "Dirty", "Disgusting", "Drab", "Drunk", "Dry", "Eager", "Early", "Easy", "Echoing", "Elegant", "Embarrassed", "Excited", "Faint", "Faithful", "Famous", "Fancy", "Fast", "Fat", "Feral", "Fierce", "Fit", "Flabby", "Flaky", "Flat", "Fluffy", "Freezing", "Fresh", "Future", "Gentle", "Gifted", "Gigantic", "Glamorous", "Gorgeous", "Gray", "Greasy", "Greasy", "Great", "Green", "Grumpy", "Hallowed", "Handsome", "Happy", "Harsh", "Helpful", "Helpless", "High", "Hissing", "Hollow", "Hot", "Humid", "Howling", "Huge", "Icy", "Icky", "Immense", "Important", "Inexpensive", "Itchy", "Jealous", "Jolly", "Juicy", "Kind", "Large", "Late", "Lazy", "Lemon", "Little", "Lively", "Long", "Lonely", "Loose", "Loud", "Low", "Magnificent", "Mammoth", "Manly", "Massive", "Mealy", "Melodic", "Melted", "Microscopic", "Miniature", "Modern", "Moldy", "Muscular", "Mushy", "Mysterious", "Narrow", "Nervous", "Nice", "Noisy", "Nutritious", "Nutty", "Obedient", "Obnoxious", "Odd", "Old", "Old-Fashioned", "Orange", "Panicky", "Petite", "Pitiful", "Plain", "Plump", "Polite", "Poor", "Powerful", "Prehistoric", "Prickly", "Proud", "Puny", "Purple", "Purring", "Putrid", "Quaint", "Quick", "Quiet", "Rabid", "Rancid", "Rapid", "Rapping", "Raspy", "Red", "Refined", "Repulsive", "Rhythmic", "Rich", "Ripe", "Rotten", "Rough", "Round", "Salmon", "Salty", "Savory", "Scary", "Scrawny", "Screeching", "Scruffy", "Shaggy", "Shallow", "Shapely", "Sharp", "Short", "Shot", "Sly", "Shrilling", "Shy", "Silly", "Skinny", "Skinny", "Slimy", "Slow", "Small", "Sour", "Spicy", "Spoiled", "Square", "Squeaking", "Stale", "Steep", "Sticky", "Stocky", "Straight", "Strong", "Sweet", "Swift", "Tall", "Tangy", "Tart", "Tasteless", "Tasty", "Teeny", "Tender", "Thankful", "Thoughtless", "Thundering", "Tight", "Timely", "Tinkling", "Tiny", "Tipsy", "Ugly", "Uneven", "Unilaterial", "Uninterested", "Unkempt", "Unsightly", "Uptight", "Vast", "Victorious", "Wailing", "Warm", "Weak", "Wet", "Whining", "Whispering", "White", "Wide", "Witty", "Wonderful", "Wooden", "Worried", "Wrong", "Yellow", "Young", "Yummy", "Zealous"];
const RANDOM_ANIMALS = ["Aardvark", "Alligator", "Alpaca", "Ant", "Anteater", "Antelope", "Ape", "Armadillo", "Donkey", "Baboon", "Badger", "Barracuda", "Bat", "Bear", "Beaver", "Bee", "Beetle", "Bird", "Bison", "Bluebird", "Boar", "Bobcat", "Buffalo", "Bull", "Butterfly", "Camel", "Cat", "Cattle", "Cheetah", "Chicken", "Chimpanzee", "Chinchilla", "Chough", "Coati", "Cobra", "Cockroach", "Cod", "Cormorant", "Cow", "Coyote", "Crab", "Crane", "Cricket", "Crocodile", "Crow", "Cuckoo", "Curlew", "Deer", "Dhole", "Dingo", "Dinosaur", "Dog", "Dolphin", "Dove", "Dragonfly", "Duck", "Dugong", "Dunlin", "Eagle", "Echidna", "Eel", "Eland", "Elephant", "Elk", "Emu", "Falcon", "Ferret", "Finch", "Fish", "Flamingo", "Fly", "Fossa", "Fox", "Frog", "Gaur", "Gazelle", "Gecko", "Genet", "Gerbil", "Giraffe", "Gnat", "Gnu", "Goat", "Goldfinch", "Goosander", "Goose", "Gorilla", "Goshawk", "Grasshopper", "Grouse", "Guanaco", "Gull", "Hamster", "Hare", "Hawk", "Hedgehog", "Heron", "Herring", "Hippopotamus", "Hoatzin", "Hoopoe", "Hornet", "Horse", "Hummingbird", "Hyena", "Ibex", "Ibis", "Iguana", "Impala", "Jackal", "Jaguar", "Jay", "Jellyfish", "Junglefowl", "Kangaroo", "Kingbird", "Kingfisher", "Kinkajou", "Kite", "Koala", "Kodkod", "Komodo", "Kookaburra", "Kouprey", "Kowari", "Langur", "Lapwing", "Lark", "Lechwe", "Lemur", "Leopard", "Lion", "Lizard", "Llama", "Lobster", "Loris", "Louse", "Lynx", "Lyrebird", "Macaque", "Macaw", "Magpie", "Mammoth", "Manatee", "Mandrill", "Marmoset", "Marmot", "Meerkat", "Mink", "Mole", "Mongoose", "Moose", "Mosquito", "Mouse", "Myna", "Narwhal", "Newt", "Nightingale", "Nilgai", "Ocelot", "Octopus", "Okapi", "Olingo", "Opossum", "Orangutan", "Ostrich", "Otter", "Ox", "Owl", "Oyster", "Panther", "Parrot", "Panda", "Partridge", "Peafowl", "Pelican", "Penguin", "Pheasant", "Pigeon", "Pika", "Pony", "Porcupine", "Porpoise", "Pug", "Quail", "Quelea", "Quetzal", "Rabbit", "Raccoon", "Ram", "Rat", "Raven", "Reindeer", "Rhea", "Rhinoceros", "Rook", "Saki", "Salamander", "Salmon", "Sandpiper", "Sardine", "Sassaby", "Seahorse", "Seal", "Serval", "Shark", "Sheep", "Shrew", "Shrike", "Siamang", "Skink", "Skipper", "Skunk", "Sloth", "Snail", "Snake", "Spider", "Spoonbill", "Squid", "Squirrel", "Starfish", "Starling", "Stilt", "Swan", "Tamarin", "Tapir", "Tarsier", "Termite", "Thrush", "Tiger", "Toad", "Topi", "Toucan", "Turaco", "Turkey", "Turtle", "Vicuña", "Vinegaroon", "Viper", "Vulture", "Wallaby", "Walrus", "Wasp", "Weasel", "Whale", "Wildebeest", "Wobbegong", "Wolf", "Wolverine", "Wombat", "Woodpecker", "Worm", "Wren", "Yak", "Zebra"];

//Our main data structure, the campaign class
class campaign {
	constructor(campaignID) { this.campaignID = campaignID; }
	spreadsheetId = "";
	spreadsheetURL = "";
	spreadsheetTimeRange = "H3";
	spreadsheetRange = "A1:X1000";
	spreadsheetLayout = { nameRange: "A1:A1", infoRange: "A3:I3", coinsRange: "A8:K1000", bucketsRange: "U8:Y1000", marketStartRange: "C3:C3", marketEndRange: "D3:D3" };
	spreadsheetArray = [[]];
	sheetId = "";
	name = "";
	info = [];
	coins = [];
	buckets = [];
	marketStartTime = 0;
	marketEndTime = 0;
	lastReadTime = 0;
	locked = false;
	lockDate = null;
	lockID = null;
	unlockTimer = null;

	//Attempts to unlock the sheet.
	async unlockSheet(){
		echo('#' + this.campaignID, "CAMPAIGN",  SIMULATE_GOOGLE ? `Simulating unlocking sheet...` : `Unlocking sheet after 10 seconds inactivity...`);
		
		try {
			if (this.lockID !== null) {										   
				let unlockRequests = [{ "deleteProtectedRange": { "protectedRangeId": this.lockID } }];
				let unlockResult = SIMULATE_GOOGLE ? "SIMULATED" : await googleSheetsInstance.spreadsheets.batchUpdate({ 
					spreadsheetId: this.spreadsheetId, 
					resource: { requests: unlockRequests } });
				this.locked = false;
				this.lockDate = null;

				let writeResponse = SIMULATE_GOOGLE ? "SIMULATED" : googleSheetsInstance.spreadsheets.values.update({
					auth,
					spreadsheetId: this.spreadsheetId,
					range: this.campaignID + "!A4",
					valueInputOption: 'USER_ENTERED',
					resource: { values: [[""]] }
				});	   
				
				echo('#' + this.campaignID, "CAMPAIGN",   `Sheet unlocked.`); 
			}
		} catch (err) { 
			echo('#' + this.campaignID, "CAMPAIGN",   `Failed to unlock sheet!  (Perhaps it's already unlocked?)`);
			console.log(err); 
		}


		this.lockID = null;
	}
	
	//Locks the sheet for 10 seconds so that it can be read then written to without desync (if a user or another server instance is also editing the sheet at the same time) 
	async lockSheet() {
		echo('#' + this.campaignID, "CAMPAIGN",   SIMULATE_GOOGLE ? `Simulating Locking sheet...` : `Locking sheet...`);

		if (this.lockID !== null){
			echo('#' + this.campaignID, "CAMPAIGN",   `Sheet is already locked - resetting it for another 10 seconds.`);
			clearTimeout(this.unlockTimer);
			this.unlockTimer = setTimeout(() => this.unlockSheet(), 10000);
			return;
		}
		if(this.lockDate !== null){
			echo('#' + this.campaignID, "CAMPAIGN",   `Sheet is already being locked!  Hold your horses!!`);
			return;
		}
			

		this.lockDate = new Date();
		
		let lockRequests = [{
			"addProtectedRange": {
				"protectedRange": {
					"range": { "sheetId": this.sheetId },
					"description": "Webserver lock",
					"warningOnly": true
				}
			}
		}]; 
		
		try {
			if (this.lockID == null) {
				let lockResult
				if (!SIMULATE_GOOGLE){
					lockResult =  await googleSheetsInstance.spreadsheets.batchUpdate({ 
						spreadsheetId: this.spreadsheetId, 
						resource: { requests: lockRequests } 
					});
				}else{ lockResult = JSON.parse(await new Promise((resolve, reject) => {
					fs.readFile('lockResult.json', 'utf8', (err, data) => {
						if (err) { reject(err); } 
						else { resolve(data);	 }
					} )  } ) )
				}
				if (lockResult.status == '200') { //200 is success code
						
					this.lockID = await lockResult.data.replies[0].addProtectedRange.protectedRange.protectedRangeId; //Get the ProtectedRange ID out of the reply so we can remove it later.
					this.locked = true;
					echo('#' + this.campaignID, "CAMPAIGN",   `Locked sheet with lockID of ${this.lockID}.`)
					 
					//Add a notice to the spreadsheet
					let writeResponse = SIMULATE_GOOGLE ? "SIMULATED" : googleSheetsInstance.spreadsheets.values.update({
						auth,
						spreadsheetId: this.spreadsheetId,
						range: this.campaignID + "!A4",
						valueInputOption: 'USER_ENTERED',
						resource: { values: [[`Webserver has locked this sheet at ${this.lockDate} to keep it synchronized - modifying or sorting these values while locked will break things!`]] }
					});
					
					//Set a timer to unlock
					this.unlockTimer = setTimeout(() => this.unlockSheet(), 10000);
				}else{
					echo('#' + this.campaignID, "CAMPAIGN",   `Lock failed!`);
					console.log(lockResult);
				}
			}
			
		} catch (err) {
			echo('#' + this.campaignID, "CAMPAIGN",   `Failed to lock sheet!  (Perhaps it's already locked by another user/process?  Clean any orphaned locks on the sheet and try again.)`);
			console.log(err);
		};  
	}

	//Reads the spreadsheet
	async readSheet() {
		this.lastReadTime = new Date();

		echo('#' + this.campaignID, "CAMPAIGN",   SIMULATE_GOOGLE ? `Simulating sheet read...` : `Reading sheet...`);
		
		//Let's pull the spreadsheet data
		let readStartTime = new Date().getTime();
		let readResult;

		if (!SIMULATE_GOOGLE){ readResult = await googleSheetsInstance.spreadsheets.values.get({ auth, spreadsheetId: this.spreadsheetId, valueRenderOption: 'UNFORMATTED_VALUE', range: this.campaignID + "!" + this.spreadsheetRange })}
		else{ readResult = JSON.parse(await new Promise((resolve, reject) => {
			fs.readFile('readResult.json', 'utf8', (err, data) => {
			  if (err) { reject(err); } 
			  else { resolve(data);	 }
			} )  } ) )
		}

		if (readResult.status == '200') { //200 is success code
			echo('#' + this.campaignID, "CAMPAIGN",   `Sheet's data successfully retrieved after ${new Date().getTime() - readStartTime}ms`);

			//Now to use the layout to slice out data from the large spreadsheet array
			this.spreadsheetArray = readResult.data.values.slice(0);
			this.name = extractFromSSArr(this.spreadsheetArray, this.spreadsheetLayout.nameRange)[0];
			this.info = extractFromSSArr(this.spreadsheetArray, this.spreadsheetLayout.infoRange);
			this.coins = extractFromSSArr(this.spreadsheetArray, this.spreadsheetLayout.coinsRange).map(function (e) {
				if (e != "") return { ID: e[0], secretHash: e[1], passphraseHash: e[2], multiplier: e[3], currentValue: e[4], note: e[5], message: e[6], dateCreated: e[7], lastScanned: e[8], lastScannedBy: e[9], scanCount: e[10] }
			});
			this.buckets = extractFromSSArr(this.spreadsheetArray, this.spreadsheetLayout.bucketsRange).filter(e => e != "");
			this.marketStartTime = ExcelDateToJSDate(extractFromSSArr(this.spreadsheetArray, this.spreadsheetLayout.marketStartRange)[0]).getTime();
			this.marketEndTime = ExcelDateToJSDate(extractFromSSArr(this.spreadsheetArray, this.spreadsheetLayout.marketEndRange)[0]).getTime();
		} else {
			echo('#' + this.campaignID, "CAMPAIGN",   `Read failed!`);
			console.log(results);
		}
	
	}; 

	async updateCoin(coinIndex, coin, clientName, serialDate){
		echo('#' + this.campaignID, "CAMPAIGN",   `Updating coin...`);
		
		this.coins[coinIndex] = coin;
		
		Promise.all([this.lockSheet()])
		.then(() => this.readSheet())
		.then(() => {
			let writeRequests = [{
				"updateCells": {
				}
			}]; 
			/*let writeResult = await googleSheetsInstance.spreadsheets.batchUpdate({ 
					spreadsheetId: this.spreadsheetId, 
					resource: { requests: writeRequests } 
				});
			if (writeResult.status == '200') { //200 is success code
				echo('#' + this.campaignID, "CAMPAIGN",   `Coin update successful.`);
			}else{
				echo('#' + this.campaignID, "CAMPAIGN",   `Coin update failed!`);
			}*/
			let writeResponse = SIMULATE_GOOGLE ? "SIMULATED" : googleSheetsInstance.spreadsheets.values.update({
				auth,
				spreadsheetId: this.spreadsheetId,
				range: this.campaignID + "!" + 'I' + (coinIndex + 8) + ':' + 'K' + (coinIndex + 8),
				valueInputOption: 'USER_ENTERED',
				resource: { values: [[serialDate, clientName, coin.scanCount + 1]] }
			});
			
			echo('#' + this.campaignID, "CAMPAIGN",   `Coin updated!`);
		});
	}
}; 

/****************************
	//Let's get to work!  
****************************/

let serverLog = [`Spark-Coin server version ${VERSION} started ${new Date().toString()}`];
let sparkClients = [];
let campaigns = {};

let auth = SIMULATE_GOOGLE ? "SIMULATED" : new google.auth.GoogleAuth({keyFile: 'spark-coin-355803-05458491fa45.json', scopes: ['https://www.googleapis.com/auth/spreadsheets']});
let googleSheetsInstance = SIMULATE_GOOGLE ? "SIMULATED" : google.sheets({ version: 'v4', auth });
//if (typeof googleSheetsInstance !== 'object' && googleSheetsInstance !== null) throw ('Invalid Google Sheets instance!');


//Simple function that writes messages to the logs and the relevant connected clients.
function echo(channel, sender, message, toLog = true, toConsole = true) {
	let now = new Date();
	let timeStamp = now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', fractionalSecondDigits: 3 })
	//          BLUE                    " "    ORANGE                  CYAN by default                   GREY      "> "
	let line = "\x1b[34m" + timeStamp + " " + "\x1b[33m" + channel + " \x1b[36m" + "[" + sender + "]" + "\x1b[0m" + "> " + message;
	if (toLog) serverLog.push(line);
	if (toConsole) console.log(line);
	io.emit(channel, JSON.stringify({ time: now, sender, message }));
}

//Attempts to retrieve the client name either via HTTP or WebSocket, and if not found adds them to the list for future connections. 
function getClientName(clientInfo) {
	let ip = 	(clientInfo.headers && clientInfo.headers['x-forwarded-for']) || 
				(clientInfo.socket && clientInfo.socket.remoteAddress) || 
				(clientInfo.handshake && clientInfo.handshake.headers['x-forwarded-for']) || 
				clientInfo.client.conn.remoteAddress; //One of these otta have an IP!
	let headers = clientInfo.headers || clientInfo.handshake.headers;

	//Let's try to find it based on IP.
	let matchingIndexes = [];
	sparkClients.forEach((element, index) => {
		if (element.ip && element.ip == ip) matchingIndexes.push(index);
	});

	if (matchingIndexes.length > 1) return sparkClients[matchingIndexes[0]].clientName; //TODO - multiple clients have this IP address, so we SHOULD de-conflict
	if (matchingIndexes.length == 1) return sparkClients[matchingIndexes[0]].clientName;
	if (matchingIndexes.length < 1) {
		//Not found, so must be new - let's add them! 
		let clientName = RANDOM_ADJECTIVES[JSON.stringify(headers).length % 256] + ' ' + RANDOM_ANIMALS[Number(ip.split(".")[3] || 0)];
		let client = { ip, headers, clientName};

		sparkClients.push(client);
		echo("#SERVER", `SERVER`, `${ip} has connected as \x1b[31m[${clientName}]\x1b[0m!`);
		return clientName;
	}
}

//Routes the HTTP maths to the local files.
function httpHandler(req, res) {
	let url = req.url;
	let requestDate = new Date();
	let clientName = getClientName(req);
	
	echo("#SERVER", 'HTTPServer', `HTTP request from \x1b[31m[${clientName}]\x1b[0m for ${req.url}`);
	
	//Determine what to serve depending on the URL
	
	let filePath = "";
	switch(true){
		case (url.match(/^\/[a-zA-Z0-9]{2,3}\/[a-zA-Z0-9]{5}-\S+$/) !== null):
			/*
						
			let scanCampaignID = url.slice(1, 4); //XXX
			let scanID = url.slice(5, 10); //YYYYY
			let scanSecret = url.slice(11, 27); //ZZZZZZZZZZZZZZZ
			
			try {
				await Promise.all([campaigns[scanCampaignID].readSheet()])
					.then(async () => {

						let coinIndex = campaigns[scanCampaignID].coins.findIndex((e) => e.ID == scanID); //Find the coin the client is claiming to be for
						let coin = campaigns[scanCampaignID].coins[coinIndex];
						let scanHash = crypto.createHash('md5').update(scanSecret).digest().toString("hex").toUpperCase(); //Run the MD5 function on the provided secret to get the hash.

						//If the hashes match, authentication was successful!
						if (coin && coin.secretHash == scanHash) {
							echo(scanCampaignID, '#ALL', `[${clientName}]'s hash found!  Delivering client..."`);

							//Increment the scan count on the spreadsheet, if appropriate.
							let serialDate = 25569.0 + ((requestDate.getTime() - (requestDate.getTimezoneOffset() * 60 * 1000)) / (1000 * 60 * 60 * 24)); //Convert the javascript Date object to a spreadsheet serialized date.  
							await campaigns[scanCampaignID].updateCoin(coinIndex, coin, clientName, serialDate);
							
							//Let's pre-load the client with some useful info and log history
							let preamble = "";
							serverLog.forEach((e) => { preamble += "<li class='msgLI'>" + e + "</li>"; });

							res.render("index.ejs", {
								campaignSpreadsheetID: JSON.stringify(campaigns[scanCampaignID].spreadsheetId),
								campaignSpreadsheetURL: JSON.stringify(campaigns[scanCampaignID].spreadsheetURL),
								campaignSpreadsheetLayout: JSON.stringify(campaigns[scanCampaignID].spreadsheetLayout),
								campaignSheetId: JSON.stringify(campaigns[scanCampaignID].sheetId),
								campaignName: JSON.stringify(campaigns[scanCampaignID].name),
								campaignInfo: JSON.stringify(campaigns[scanCampaignID].info),
								campaignCoins: JSON.stringify(campaigns[scanCampaignID].coins),
								campaignBuckets: JSON.stringify(campaigns[scanCampaignID].buckets),
								campaignMarketStartTime: campaigns[scanCampaignID].marketStartTime,
								campaignMarketEndTime: campaigns[scanCampaignID].marketEndTime,
								preamble,
								clientName: req.body.clientName,
								coinCampaignID: scanCampaignID,
								coinID: req.body.coinID,
								coinSecret: req.body.coinSecret,				
								clientDebug: DEBUG
							}); 					
							
						} else {
							echo(scanCampaignID, '#ALL', `[${clientName}] failed to authenticate coin ${scanID}!"`);			
						}

					})
			} catch (err) {
				console.log(`> Failed to send response to ${clientName} @ ${scanCampaignID}/${scanID}/${scanSecret}`);
				console.log(err);
			}*/
			 filePath = path.join(__dirname, 'views/client.html');
			 break;
		case (url === "/"):
			filePath = path.join(__dirname, 'home.html');
			break;
		case (url.startsWith('/node_modules/')):
			filePath = path.join(__dirname, url); 
			break;
		case (url.startsWith('/socket.io/')):
			// serve socket.io files
			const socketIoPath = path.join(__dirname, 'node_modules/socket.io/client-dist');
			filePath = path.join(socketIoPath, req.url.replace('/socket.io/', ''));
			break;
		default:
			filePath = path.join(__dirname, 'public', url);
	}
	
	//Determine the appropriate content type based on file extention
	let ext = path.extname(filePath), contentType = 'text/plain';
	if (ext === '.html') { contentType = 'text/html'; } 
	else if (ext === '.css') { contentType = 'text/css'; } 
	else if (ext === '.js') { contentType = 'text/javascript'; }
	res.setHeader('Content-Type', contentType);  // Send the file to the client with the appropriate content type
	
	fs.readFile(filePath, (err, data) => {
		if (err) {
			res.writeHead(404);
			res.end("404 Not Found");
			echo("#SERVER", 'HTTPServer', `404 for ${filePath}`);
		} else {
			res.writeHead(200);
			res.end(data);
			echo("#SERVER", 'HTTPServer', `200 for ${filePath}`);
		}
	});
}


//The first thing a client's websocket should do is handshake, and this is how Spark-Coins do it!  All other websocket events are dependent on that connection, so are embedded into the function
io.on('connection', async (socket) => {
	let clientName = getClientName(socket); //Figure out who this is
	let lastChatMinute = new Date().getMinutes(); //This is just a timer for the auto-response to unknown requests/messages in the comms channel (which doubles as a chat-room!)

	echo("#SERVER", 'SocketIO', `Web Socket connection from \x1b[31m[${clientName}]\x1b[0m!`); //Broadcast the new connection to the log and all the existing clients

	socket.on('#ALL', msg => { //These are simple chat messages, probably just between the clients (e.g. users asking/answering questions, potential alternative to Slack/Discord/Teams)
		echo(clientName, '#ALL', msg);

		let currentMinute = new Date().getMinutes()
		if (lastChatMinute != currentMinute) {
			echo("#ALL", 'SocketIO', `Hello, \x1b[31m[${clientName}]\x1b[0m!  I'm just a dumb server that can't understand much yet, but I'm getting there!`);
			lastChatMinute = currentMinute;
		}
	});

	socket.on('#AUTH', async (coinCampaignID, coinID, coinSecret) => { //The client is attempting to authenticate
		let requestDate = new Date();

		//Let's start easy by reading the campaign name in cell B1 
		echo("#AUTH", 'SocketIO', `\x1b[31m[${clientName}]\x1b[0m is trying to authenicate campaign ${coinCampaignID}'s coin \x1b[32m<${coinID}>\x1b[0m with secret ${coinSecret}.`);

		await campaigns[coinCampaignID].readSheet();
		
		let coinIndex = campaigns[coinCampaignID].coins.findIndex((e) => e.ID == coinID); //Find the coin the client is claiming to be for
		let coin = campaigns[coinCampaignID].coins[coinIndex];
		let coinHash = crypto.createHash('md5').update(coinSecret).digest().toString("hex").toUpperCase(); //Run the MD5 function on the provided secret to get the hash.

		//If the hashes match, authentication was successful!
		if (coin && coin.secretHash == coinHash) {
			echo('#' + coinCampaignID, 'SocketIO', `\x1b[31m[${clientName}]\x1b[0m's hash for coin \x1b[32m<${coinID}>\x1b[0m found in row ${coinIndex}!  Sending campaign info...`);

			socket.emit(coinSecret, JSON.stringify(campaigns[coinCampaignID]));
			//Increment the scan count on the spreadsheet, if appropriate.
			/*let serialDate = 25569.0 + ((requestDate.getTime() - (requestDate.getTimezoneOffset() * 60 * 1000)) / (1000 * 60 * 60 * 24)); //Convert the javascript Date object to a spreadsheet serialized date.  
			await campaigns[scanCampaignID].updateCoin(coinIndex, coin, clientName, serialDate);
			
			//Let's pre-load the client with some useful info and log history
			let preamble = "";
			serverLog.forEach((e) => { preamble += "<li class='msgLI'>" + e + "</li>"; });

			res.render("index.ejs", {
				campaignSpreadsheetID: JSON.stringify(campaigns[scanCampaignID].spreadsheetId),
				campaignSpreadsheetURL: JSON.stringify(campaigns[scanCampaignID].spreadsheetURL),
				campaignSpreadsheetLayout: JSON.stringify(campaigns[scanCampaignID].spreadsheetLayout),
				campaignSheetId: JSON.stringify(campaigns[scanCampaignID].sheetId),
				campaignName: JSON.stringify(campaigns[scanCampaignID].name),
				campaignInfo: JSON.stringify(campaigns[scanCampaignID].info),
				campaignCoins: JSON.stringify(campaigns[scanCampaignID].coins),
				campaignBuckets: JSON.stringify(campaigns[scanCampaignID].buckets),
				campaignMarketStartTime: campaigns[scanCampaignID].marketStartTime,
				campaignMarketEndTime: campaigns[scanCampaignID].marketEndTime,
				preamble,
				clientName: req.body.clientName,
				coinCampaignID: scanCampaignID,
				coinID: req.body.coinID,
				coinSecret: req.body.coinSecret,				
				clientDebug: DEBUG
			}); 					
			*/
		} else {
			echo('#' + coinCampaignID, 'SocketIO', `\x1b[31m[${clientName}]\x1b[0m failed to authenticate coin \x1b[32m<${coinID}>\x1b[0m!`);			
		}

	});

});



//Stolen from https://javascript.tutorialink.com/converting-excel-date-serial-number-to-date-using-javascript/
function ExcelDateToJSDate(serial) {
	var utc_days = Math.floor(serial - 25569) + 1;
	var utc_value = utc_days * 86400;
	var date_info = new Date(utc_value * 1000);

	var fractional_day = serial - Math.floor(serial) + 0.0000001;

	var total_seconds = Math.floor(86400 * fractional_day);

	var seconds = total_seconds % 60;

	total_seconds -= seconds;

	var hours = Math.floor(total_seconds / (60 * 60));
	var minutes = Math.floor(total_seconds / 60) % 60;

	return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
}

//Extracts data from a spreadsheet array using A1 Notation (so it's easier for campaign managers to maintain this code)
function extractFromSSArr(ssArr, A1) {
	//Use regex to extract out row and column info from the A1 notation string
	let match = /([A-Z]+)([0-9]+):([A-Z]+)([0-9]+)/gi.exec(A1);
	if (match == null || match.length < 5) throw ("improperly formatted A1 Notation - remember to specify ranges and not individual cells!");

	//An A1 range is just a rectangle.  Ex: in A1:B2, column A is left, row 1 is top, column B is right, and row 2 is bottom  
	let A1Left = match[1], A1Top = match[2], A1Right = match[3], A1Bottom = match[4]; //match[0] is just the entire matched string; we want the groups in our RegEx's ()'s

	//convert our column letters to numbers where A = 1, B = 2, C = 3...  Z = 26, AA = 27, ZZ = 702, XYZ = 16900 and so on.
	const A = "A".charCodeAt(0); //Get a reference to where "A" begins in our character set (should be 65 on the ASCII table).
	let l = 0, r = 0;
	for (let n = 1; n <= A1Left.length; n++) { l += (A1Left.charCodeAt(n - 1) - A + 1) * Math.pow(26, A1Left.length - n); } //Walk the string character-by-character, multiplying the value of that digit to the power of its Place (e.g. in "12,345", the "2" is in the 1000s place, or 10-to-the-power-of-3)
	for (let n = 1; n <= A1Right.length; n++) { r += (A1Right.charCodeAt(n - 1) - A + 1) * Math.pow(26, A1Right.length - n); }

	//Rows start at 1, but array indexes start at 0.  (They're also integers, not strings, but math operaators typecast Strings into Numbers when possible)
	let t = A1Top - 1;
	let b = A1Bottom - 1;
	l--;
	r--;

	//Now that we got our indexes from the A1 Notation, we can start working with arrays.
	let data = ssArr.slice(t, b + 1).map(e => e.slice(l, r + 1)); //since we're working with a 2D array that's essentially a grid, slicing the first dimension essentially gives us rows, and the .map function runs on each row to again slice out the columns.

	return data;
}


//Load up the data we need to do our job from the spreadsheet before we start offering services to our clients
async function startServer() {
	if (DEBUG_STARTUP_WAIT) {
		console.log(`>Debug mode on.  Waiting 6 seconds for Debugger to attach...`);
		await new Promise(r => setTimeout(r, 6000)); //Wait for the debugger to attach...
	}

	//Set up our normal Spark campaign
	campaigns["000"] = new campaign("000");
	campaigns["000"].spreadsheetId = "1j2awYVu1CcMuNACG3RBg8s34GohQxVeQVSHZ02AdiI8";
	campaigns["000"].sheetId = "650135663";
	campaigns["000"].spreadsheetURL = "https://docs.google.com/spreadsheets/d/1j2awYVu1CcMuNACG3RBg8s34GohQxVeQVSHZ02AdiI8/view#gid=650135663";

	//Rothcoins
	/*campaigns["SEL"] = new campaign("SEL");
	campaigns["SEL"].spreadsheetId = "1j2awYVu1CcMuNACG3RBg8s34GohQxVeQVSHZ02AdiI8";
	campaigns["SEL"].sheetId = "1035659003";
	campaigns["SEL"].spreadsheetURL = "https://docs.google.com/spreadsheets/d/1j2awYVu1CcMuNACG3RBg8s34GohQxVeQVSHZ02AdiI8/view#gid=1035659003";*/

	//AllSpark Campaign
	/*campaigns["DW"] = new campaign("DW");
	campaigns["DW"].spreadsheetId = "1j2awYVu1CcMuNACG3RBg8s34GohQxVeQVSHZ02AdiI8";
	campaigns["000"].sheetId = "1857288650";
	campaigns["DW"].spreadsheetURL = "https://docs.google.com/spreadsheets/d/1j2awYVu1CcMuNACG3RBg8s34GohQxVeQVSHZ02AdiI8/view#gid=1857288650";*/
 
	//Morpheus campaign
	/*campaigns["MOR"] = new campaign("MOR");
	campaigns["MOR"].spreadsheetId = "1gcXP9qrw1Ft7wNyn7Prv-C05ltLYK30KvVVVcYTvU1E"; 
	campaigns["MOR"].sheetId = "650135663";
	campaigns["MOR"].spreadsheetURL = "https://docs.google.com/spreadsheets/d/1gcXP9qrw1Ft7wNyn7Prv-C05ltLYK30KvVVVcYTvU1E/view#gid=650135663";*/
	
	//Set up our BRAVO Spark campaign
	campaigns["BRV"] = new campaign("BRV");
	campaigns["BRV"].spreadsheetId = "1j2awYVu1CcMuNACG3RBg8s34GohQxVeQVSHZ02AdiI8";
	campaigns["BRV"].sheetId = "1242764648";
	campaigns["BRV"].spreadsheetURL = "https://docs.google.com/spreadsheets/d/1j2awYVu1CcMuNACG3RBg8s34GohQxVeQVSHZ02AdiI8/view#gid=1242764648";

	//Fetch the data from the spreadsheets, and once we got them all then set start listening for clients
	await Promise.all([campaigns["000"].readSheet(), /*campaigns["SEL"].readSheet(), campaigns["DW"].readSheet(), campaigns["MOR"].readSheet(), */campaigns["BRV"].readSheet()])


	
	  
	httpServer.listen(3000, () => {
		echo("#SERVER", 'HTTPServer', `Listening for HTTP requests at ${HTTP_SERVER_ADDRESS}:${HTTP_SERVER_PORT}.`);
	});
}

console.log(`>index.js fully parsed!`);  //This is the end of the script, likely reached before the services are complete.
startServer();