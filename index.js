/*
	Greetings, and welcome to the server-side source code for Spark-Coins!  This program runs on Node.JS (currently version 16) and manages HTTP(S) requests, WebSocket Connections, and Google's Spreadsheet API as the back-end to the Spark-Coin idea.  See ./views/index.ejs for the client-side HTML document and script.
	I'm hoping to leverage Transparency as Security, so if you see a flaw or bug in this program, feel free to update it or poke me (Brian Westgate)!  I'm just a hobbyist programmer working on this as a side-project, so I'm sure there are plenty of bugs and/or better ways to do things.	
*/

/*
	TODO:
	-Cleanup
	-Chat Channels
	-Slash Commands
	-Ability to comment on buckets
	-Pan/Zoom
	
*/ 
const DEBUG = true; //Turn this off in production environment!
const VERSION = 20230211;
console.log(`>*******************************************************************************`); 
const BOOT_TIME = new Date();
console.log(`>Spinning up Spark-Coin server version ${VERSION} on ${BOOT_TIME.toString()}...`); 


//Included modules
let express = require('express'); //We're using Express.js as our general web framework 
let app = express();
let fs = require('fs');
let readline = require('readline');
let path = require('path');
let process = require('process');
let http = require('http').Server(app); //We tell NodeJS that we're using it for http services.
let io = require('socket.io')(http); //We connect web socket service, Socket IO, to the server
let jquery = require('jquery');
let crypto = require('crypto');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
//const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'client_secret_101996952822818855998.json')
let {google} = require('googleapis');  //Google API required for spreadsheet manipulation

//Global variables/configuration
const HTTP_SERVER_ADDRESS = "localhost";  //Even when deployed to spark-coin.com, this will be localhost as Apache will be the initial handler to http & https requests and pass it to NodeJS.  This is for my VPS, but your hosting environment may differ.
const HTTP_SERVER_PORT = 3000;

//Just some fun "anonyomus" adjective + animal names to give something more friendly than IP addresses.
const RANDOM_ADJECTIVES = ["Acidic","Aggressive","Agreeable","Alive","Ambitious","Ancient","Angry","Ashy","Attractive","Bald","Beautiful","Better","Bewildered","Big","Bitter","Black","Blue","Brave","Breezy","Brief","Broad","Bumpy","Calm","Careful","Chilly","Chubby","Chunky","Clean","Clever","Clumsy","Cold","Colossal","Colorful","Cool","Crashing","Creamy","Crooked","Crunchy","Cuddly","Curved","Damaged","Damp","Dazzling","Dead","Deafening","Deep","Defeated","Delicious","Delightful","Dirty","Disgusting","Drab","Drunk","Dry","Eager","Early","Easy","Echoing","Elegant","Embarrassed","Excited","Faint","Faithful","Famous","Fancy","Fast","Fat","Feral","Fierce","Fit","Flabby","Flaky","Flat","Fluffy","Freezing","Fresh","Future","Gentle","Gifted","Gigantic","Glamorous","Gorgeous","Gray","Greasy","Greasy","Great","Green","Grumpy","Hallowed","Handsome","Happy","Harsh","Helpful","Helpless","High","Hissing","Hollow","Hot","Humid","Howling","Huge","Icy","Icky","Immense","Important","Inexpensive","Itchy","Jealous","Jolly","Juicy","Kind","Large","Late","Lazy","Lemon","Little","Lively","Long","Lonely","Loose","Loud","Low","Magnificent","Mammoth","Manly","Massive","Mealy","Melodic","Melted","Microscopic","Miniature","Modern","Moldy","Muscular","Mushy","Mysterious","Narrow","Nervous","Nice","Noisy","Nutritious","Nutty","Obedient","Obnoxious","Odd","Old","Old-Fashioned","Orange","Panicky","Petite","Pitiful","Plain","Plump","Polite","Poor","Powerful","Prehistoric","Prickly","Proud","Puny","Purple","Purring","Putrid","Quaint","Quick","Quiet","Rabid","Rancid","Rapid","Rapping","Raspy","Red","Refined","Repulsive","Rhythmic","Rich","Ripe","Rotten","Rough","Round","Salmon","Salty","Savory","Scary","Scrawny","Screeching","Scruffy","Shaggy","Shallow","Shapely","Sharp","Short","Shot","Sly","Shrilling","Shy","Silly","Skinny","Skinny","Slimy","Slow","Small","Sour","Spicy","Spoiled","Square","Squeaking","Stale","Steep","Sticky","Stocky","Straight","Strong","Sweet","Swift","Tall","Tangy","Tart","Tasteless","Tasty","Teeny","Tender","Thankful","Thoughtless","Thundering","Tight","Timely","Tinkling","Tiny","Tipsy","Ugly","Uneven","Unilaterial","Uninterested","Unkempt","Unsightly","Uptight","Vast","Victorious","Wailing","Warm","Weak","Wet","Whining","Whispering","White","Wide","Witty","Wonderful","Wooden","Worried","Wrong","Yellow","Young","Yummy","Zealous"];
const RANDOM_ANIMALS = ["Aardvark","Alligator","Alpaca","Ant","Anteater","Antelope","Ape","Armadillo","Donkey","Baboon","Badger","Barracuda","Bat","Bear","Beaver","Bee","Beetle","Bird","Bison","Bluebird","Boar","Bobcat","Buffalo","Bull","Butterfly","Camel","Cat","Cattle","Cheetah","Chicken","Chimpanzee","Chinchilla","Chough","Coati","Cobra","Cockroach","Cod","Cormorant","Cow","Coyote","Crab","Crane","Cricket","Crocodile","Crow","Cuckoo","Curlew","Deer","Dhole","Dingo","Dinosaur","Dog","Dolphin","Dove","Dragonfly","Duck","Dugong","Dunlin","Eagle","Echidna","Eel","Eland","Elephant","Elk","Emu","Falcon","Ferret","Finch","Fish","Flamingo","Fly","Fossa","Fox","Frog","Gaur","Gazelle","Gecko","Genet","Gerbil","Giraffe","Gnat","Gnu","Goat","Goldfinch","Goosander","Goose","Gorilla","Goshawk","Grasshopper","Grouse","Guanaco","Gull","Hamster","Hare","Hawk","Hedgehog","Heron","Herring","Hippopotamus","Hoatzin","Hoopoe","Hornet","Horse","Hummingbird","Hyena","Ibex","Ibis","Iguana","Impala","Jackal","Jaguar","Jay","Jellyfish","Junglefowl","Kangaroo","Kingbird","Kingfisher","Kinkajou","Kite","Koala","Kodkod","Komodo","Kookaburra","Kouprey","Kowari","Langur","Lapwing","Lark","Lechwe","Lemur","Leopard","Lion","Lizard","Llama","Lobster","Loris","Louse","Lynx","Lyrebird","Macaque","Macaw","Magpie","Mammoth","Manatee","Mandrill","Marmoset","Marmot","Meerkat","Mink","Mole","Mongoose","Moose","Mosquito","Mouse","Myna","Narwhal","Newt","Nightingale","Nilgai","Ocelot","Octopus","Okapi","Olingo","Opossum","Orangutan","Ostrich","Otter","Ox","Owl","Oyster","Panther","Parrot","Panda","Partridge","Peafowl","Pelican","Penguin","Pheasant","Pigeon","Pika","Pony","Porcupine","Porpoise","Pug","Quail","Quelea","Quetzal","Rabbit","Raccoon","Ram","Rat","Raven","Reindeer","Rhea","Rhinoceros","Rook","Saki","Salamander","Salmon","Sandpiper","Sardine","Sassaby","Seahorse","Seal","Serval","Shark","Sheep","Shrew","Shrike","Siamang","Skink","Skipper","Skunk","Sloth","Snail","Snake","Spider","Spoonbill","Squid","Squirrel","Starfish","Starling","Stilt","Swan","Tamarin","Tapir","Tarsier","Termite","Thrush","Tiger","Toad","Topi","Toucan","Turaco","Turkey","Turtle","Vicuña","Vinegaroon","Viper","Vulture","Wallaby","Walrus","Wasp","Weasel","Whale","Wildebeest","Wobbegong","Wolf","Wolverine","Wombat","Woodpecker","Worm","Wren","Yak","Zebra"];	

class campaign{
	constructor(campaignID){ this.campaignID = campaignID;}
	spreadsheetId = "";
	spreadsheetURL = "";
	spreadsheetTimeRange = "H3";
	spreadsheetRange =	"A1:X1000";
	spreadsheetLayout = { nameRange:"A1:A1", infoRange:	"A3:I3", coinsRange:"A8:K1000", bucketsRange:"U8:Y1000", marketStartRange:"C3:C3", marketEndRange:"D3:D3" };
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
	lastLockDate = 0;
	lockID = 0;
	unlockTimer = null;
	lastWriteTime = 0;
	
	async readSS(){
		this.lastReadTime = new Date();
		
		//If the spreadsheet isn't already locked, lock it.
		if(!this.locked){
			console.log(`>Syncing ${this.campaignID}'s spreadsheet...`);

			//Build and send our lock request
			let lockRequests = [];
			lockRequests.push({
				"addProtectedRange": {
					"protectedRange": {
						"range": {"sheetId": this.sheetId},
						"description": "Webserver lock",
						"warningOnly": true,
					}
				},			
			});
			let lockResult = await googleSheetsInstance.spreadsheets.batchUpdate({spreadsheetId: this.spreadsheetId, resource: {requests: lockRequests}});
			this.lockID = lockResult.data.replies[0].addProtectedRange.protectedRange.protectedRangeId; //Get the ProtectedRange ID out of the reply so we can remove it later.
			this.lastLockDate = new Date();
			this.locked = true;
			console.log(`>Locked ${this.campaignID}'s spreadsheet at ${this.lastLockDate}.`)
			
			//Add a notice to the spreadsheet
			let writeResponse = googleSheetsInstance.spreadsheets.values.update({
				auth, 
				spreadsheetId: this.spreadsheetId, 
				range: this.campaignID + "!A4", 
				valueInputOption: 'USER_ENTERED',
				resource: {values: [[`Webserver has locked this sheet at ${this.lastLockDate} to keep it synchronized - modifying or sorting these values while locked will break things!`]]}
			});
				
			//Let's pull the spreadsheet data
			let fetchStartTime = new Date().getTime();
			let fetchResult = googleSheetsInstance.spreadsheets.values.get({auth,  spreadsheetId: this.spreadsheetId, valueRenderOption: 'UNFORMATTED_VALUE', range: this.campaignID + "!" + this.spreadsheetRange})
			.then((results) => {
				if (results.status == '200') {
					console.log(`>Sheet ${this.campaignID}'s data successfully retrieved after ${new Date().getTime() - fetchStartTime}ms`);
					
					//Now to use the layout to slice out data from the large spreadsheet array
					this.spreadsheetArray = results.data.values.slice(0);				
					this.name = extractFromSSArr(this.spreadsheetArray, this.spreadsheetLayout.nameRange)[0];				
					this.info = extractFromSSArr(this.spreadsheetArray, this.spreadsheetLayout.infoRange);
					this.coins = extractFromSSArr(this.spreadsheetArray, this.spreadsheetLayout.coinsRange).map(function(e){
						if ( e != "") return {ID:e[0], secretHash:e[1], passphraseHash:e[2], multiplier:e[3], currentValue:e[4], note:e[5], message:e[6], dateCreated:e[7], lastScanned:e[8], lastScannedBy:e[9], scanCount:e[10]}
					});
					this.buckets = extractFromSSArr(this.spreadsheetArray, this.spreadsheetLayout.bucketsRange).filter(e => e != "");
					this.marketStartTime = ExcelDateToJSDate(extractFromSSArr(this.spreadsheetArray, this.spreadsheetLayout.marketStartRange)[0]).getTime();
					this.marketEndTime = ExcelDateToJSDate(extractFromSSArr(this.spreadsheetArray, this.spreadsheetLayout.marketEndRange)[0]).getTime();
					
				}else {
					console.log(`>Sheet${this.campaignID}'s data failed to be retrieved after ${new Date().getTime() - fetchStartTime}ms:`);
					console.log(results);
				}
			})
			.catch((results) => {
				console.log(`>Failed to retrieve a response to ${this.campaignID}'s sync from Google after ${new Date().getTime() - fetchStartTime}ms:`);
				console.log(results);
			});	
				
			//Set a 10 second timer to check if we should unlock it yet.
			this.unlockTimer = setTimeout(() => {
				let curTime = new Date();
				
				if (curTime.getTime() - this.lastLockDate.getTime() >= 10000){
					let unlockRequests = []
					unlockRequests.push({"deleteProtectedRange": {"protectedRangeId": this.lockID}});
					let unlockResult = googleSheetsInstance.spreadsheets.batchUpdate({spreadsheetId: this.spreadsheetId, resource: {requests: unlockRequests}});
					this.locked = false; 
					
					//Remove the notice
					let writeResponse = googleSheetsInstance.spreadsheets.values.update({
						auth, 
						spreadsheetId: this.spreadsheetId, 
						range: this.campaignID + "!A4", 
						valueInputOption: 'USER_ENTERED',
						resource: {values: [[""]]}
					});
					
					console.log(`>Sheet ${this.campaignID} unlocked after 10 seconds of inactivity.`);
				}else{
					console.log(`>Nope - not time to unlock yet...`);
				}
			}, 10000);
		} 
		
	}
};

/****************************
	//Let's get to work!  
****************************/

let serverLog = [`Spark-Coin server version ${VERSION} started ${new Date().toString()}`];
let sparkClients = [];
let campaigns = {};

let auth = new google.auth.GoogleAuth({keyFile: 'spark-coin-355803-0a5d8584ec33.json', scopes: ['https://www.googleapis.com/auth/spreadsheets']});
let authClient = auth.getClient();

let googleSheetsInstance = google.sheets({ version: 'v4', auth});
if (typeof googleSheetsInstance !== 'object' && googleSheetsInstance !== null) throw('Invalid Google Sheets instance!');

let googleAppsScriptInstance = google.script({version: 'v1', auth});
if (typeof googleAppsScriptInstance !== 'object' && googleAppsScriptInstance !== null) throw('Invalid Google Apps Script instance!');

//Load up the data we need to do our job from the spreadsheet before we start offering services to our clients
async function startServer(){
	if(DEBUG){
		console.log(`>Debug mode on.  Waiting 6 seconds for Debugger to attach...`);
		await new Promise(resolve => setTimeout(resolve, 6000)); //Wait for the debugger to attach...
	}

	//Set up our normal Spark campaign
	campaigns["000"] = new campaign("000");
	campaigns["000"].spreadsheetId = "1j2awYVu1CcMuNACG3RBg8s34GohQxVeQVSHZ02AdiI8";
	campaigns["000"].sheetId = "650135663";
	campaigns["000"].spreadsheetURL = "https://docs.google.com/spreadsheets/d/1j2awYVu1CcMuNACG3RBg8s34GohQxVeQVSHZ02AdiI8/view#gid=650135663";

	/*//Rothcoins
	campaigns["SEL"] = new campaign("SEL");
	campaigns["SEL"].spreadsheetId = "1j2awYVu1CcMuNACG3RBg8s34GohQxVeQVSHZ02AdiI8";
	campaigns["SEL"].spreadsheetURL = "https://docs.google.com/spreadsheets/d/1j2awYVu1CcMuNACG3RBg8s34GohQxVeQVSHZ02AdiI8/view#gid=1035659003";

	//AllSpark Campaign
	campaigns["DW"] = new campaign("DW");
	campaigns["DW"].spreadsheetId = "1j2awYVu1CcMuNACG3RBg8s34GohQxVeQVSHZ02AdiI8";
	campaigns["DW"].spreadsheetURL = "https://docs.google.com/spreadsheets/d/1j2awYVu1CcMuNACG3RBg8s34GohQxVeQVSHZ02AdiI8/view#gid=1857288650";
 
	//Morpheus campaign
	campaigns["MOR"] = new campaign("MOR");
	campaigns["MOR"].spreadsheetId = "1gcXP9qrw1Ft7wNyn7Prv-C05ltLYK30KvVVVcYTvU1E"; 		
	campaigns["MOR"].spreadsheetURL = "https://docs.google.com/spreadsheets/d/1gcXP9qrw1Ft7wNyn7Prv-C05ltLYK30KvVVVcYTvU1E/view#gid=650135663";*/
	
	//Fetch the data from the spreadsheets, and once we got them all then set start listening for clients
	Promise.all([campaigns["000"].readSS()/*, campaigns["SEL"].readSS(), campaigns["DW"].readSS(), campaigns["MOR"].readSS()*/])
	.then(() => {
		http.listen(HTTP_SERVER_PORT, () => {
			echo("SERVER", 'all', `Listening for HTTP requests at ${HTTP_SERVER_ADDRESS}:${HTTP_SERVER_PORT}.`);  
		});
	}); 
}   

//Simple function that writes messages to the logs and the relevant connected clients.
function echo(sender, recipient, message, toLog=true, toConsole=true){
	let now = new Date();
	let timeStamp = now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', fractionalSecondDigits: 3 })
	if(toLog) serverLog.push(timeStamp + ` [${sender}]> ${message}`);
	if(toConsole) console.log(timeStamp + ` [${sender}]> ${message}`);
	io.emit(recipient, JSON.stringify({time: now, sender, message}));
}

//Attempts to retrieve the client name via HTTP's IP address, and if not found adds them to the list for future connections (e.g. SocketIO).  Returns [name, isNew]
function getClientNameHTTP(ip, headers){
	let matchingIndexes = [];
	sparkClients.forEach((element, index) => {
		if(element.ip){
			if(element.ip == ip) matchingIndexes.push(index);
		}
	});
	
	if (matchingIndexes.length > 1) return [sparkClients[matchingIndexes[0]].name, false]; //TODO - multiple clients have this IP address, so we SHOULD de-conflict
	if (matchingIndexes.length == 1) return [sparkClients[matchingIndexes[0]].name, false];
	if (matchingIndexes.length < 1){
		//Not found, so must be new - let's add them! 
		let name = RANDOM_ADJECTIVES[JSON.stringify(headers).length % 256] + ' ' + RANDOM_ANIMALS[Number(ip.split(".")[3] || 0)];
		let client = {ip, headers, name, campaign:"", coin:"", secret:"", hash:""};
		
		sparkClients.push(client);
		return [name, true];
	}
}

//Attempts to retrieve the client name via Socket's IP Address
function getClientNameSOCK(socket){
	let ip = socket.handshake.headers['x-forwarded-for'] || socket.client.conn.remoteAddress;
	let matchingIndexes = [];
	sparkClients.forEach((element, index) => {
		if(element.ip){
			if(element.ip == ip) matchingIndexes.push(index);
		}
	});
	
	if (matchingIndexes.length > 1) return sparkClients[matchingIndexes[0]].name; //TODO - multiple clients have this IP address, so we SHOULD de-conflict
	if (matchingIndexes.length == 1) return sparkClients[matchingIndexes[0]].name;
	if (matchingIndexes.length < 1) return "UNKNOWN (" + ip + ") ";	//Cannot find the client based off the information provided
}

//Set up our HTTP services
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));  //Basic response to any module look-ups (libraries like jquery or SocketIO)
app.use('/public', express.static(path.join(__dirname, 'public')))
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies

app.get('/favicon.ico', (req, res) => { //Basic response to browsers trying to find a favicon for the site
	let clientNameArr = getClientNameHTTP(req.headers['x-forwarded-for'] || req.socket.remoteAddress, req.headers);
	echo(clientNameArr[0], 'all', `HTTP GET "${req.url}"`); //Let's log it too because I'm curious =P
	res.sendFile('/favicon.ico', { root: __dirname });
	echo("SERVER", 'all', `${clientNameArr[1] ? '(New Client!)' : ''} Sent '/favicon.ico' to ${clientNameArr[0]}.`);
});
app.get('/spark-coins.jpg', (req, res) => { //The HTML doc at the root (https://spark-coin.com) has an image that the browser will request too
	let clientNameArr = getClientNameHTTP(req.headers['x-forwarded-for'] || req.socket.remoteAddress, req.headers);
	echo(clientNameArr[0], 'all', `HTTP GET "${req.url}"`);
	res.sendFile("/spark-coins.jpg", { root: __dirname });
	echo("SERVER", 'all', `${clientNameArr[1] ? '(New Client!)' : ''} Sent '/spark-coins.jpg' to ${clientNameArr[0]}.`);
});
app.get('/', (req, res) => {  //Deliver the HTML doc for the root (https://spark-coin.com)
	let clientNameArr = getClientNameHTTP(req.headers['x-forwarded-for'] || req.socket.remoteAddress, req.headers);
	echo(clientNameArr[0], 'all', `HTTP GET "${req.url}"`);
	res.sendFile("/home.html", { root: __dirname });
	echo("SERVER", 'all', `${clientNameArr[1] ? '(New Client!)' : ''} Sent '/home.html' to ${clientNameArr[0]}.`);
});

//This URL Pattern probably means they scanned a coin, and thus are requesting a Spark-Coin Client
app.get(/\/[a-zA-Z0-9]{2,3}\/[a-zA-Z0-9]{5}-\S+/, (req, res) => {  //Regex string that should match the URL encoded onto the coins (XXX/YYYYY-ZZZZZZZZZZZZZZZ where X is the campaign ID, Y is the coin ID, and Z is the secret code)

	let responseHTML = `
	<html>
		<head>
			<meta name="viewport" content="width=device-width, initial-scale=1" />
			<style>
				body { color:#EEE; background:#000 repeat url("../public/4452639598_c7d981777f_o.jpg");}
				.content { margin: 30px auto; width: 90%; font: 12pt system-ui; background: #00000044; border: 1px solid black; backdrop-filter: blur(10px); border-radius: 25px; filter: drop-shadow(10px 10px 6px black); padding: 10px; }
			</style>
		</head>
		<body>
			<div class="content">
				<img src="../public/Tails.png" style="width: 1.25in; margin: auto; display: block;"/>
								
				<p>Hello!  I'm the Spark-Coin Web Server!  I'll eventually probably use something like OpenAI's ChatGPT to talk to you, but for now you just get Brian W. pretending to be some AI...</p>`;
	let requestDate = new Date();
	let wroteToSS = false;
	let clientNameArr = getClientNameHTTP(req.headers['x-forwarded-for'] || req.socket.remoteAddress, req.headers);
	if (clientNameArr[1]) responseHTML += `
				<p>It seems we haven't met yet, stranger!  At least, not since I was last rebooted on ${BOOT_TIME.toString()}.  Based on your IP address and web browser headers, I'mma call you... <span style='font-weight:bold'>Anonymous ${clientNameArr[0]}</span>!</p>`;
	else responseHTML += `
				<p>Good to see you again, <span style='font-weight:bold'>Anonymous ${clientNameArr[0]}</span>!</p>`;
	
	echo("SERVER", 'all', `[${clientNameArr[0]}] ${clientNameArr[1] ? '(New Client!)' : ''} is connecting..."`);
	
	let scanCampaignID = req.url.match(/\/[a-zA-Z0-9]{2,3}/g)[0].slice(1); //XXX
	if (scanCampaignID == "DW"){
		responseHTML += `
				<p style="font-style:italic; color:red;">Sorry, DW coins don't work just yet and breaks all the upcoming code.  Try later!  -Brian </p></body></html>`;
		res.send(responseHTML); 
		return;}
	let scanID = req.url.match(/[a-zA-Z0-9]{5}-/g)[0].slice(0,5); //YYYYY
	let scanSecret = req.url.match(/-\S+/)[0].slice(1); //ZZZZZZZZZZZZZZZ
	let URLParameters = new URLSearchParams(new URL("http://spark-coin.com" + req.url).search);
	responseHTML += `
				<p>It looks like you just scanned coin <span style='font-weight:bold'>#${scanID}</span> belonging to campaign <span style='font-weight:bold'>#${scanCampaignID}</span>.</p>`

	//Refresh our reading of the spreadsheet if needed.
	Promise.all([campaigns[scanCampaignID].readSS()])
	.then(() => {
	
		let coinIndex = campaigns[scanCampaignID].coins.findIndex((e) => e.ID == scanID); //Find the coin the client is claiming to be for
		let coin = campaigns[scanCampaignID].coins[coinIndex]; 
		
		let scanHash = crypto.createHash('md5').update(scanSecret).digest().toString("hex").toUpperCase(); //Run the MD5 function on the provided secret to get the hash. 
			
		//If the hashes match, authentication was successful!
		if(coin.secretHash == scanHash){
			echo("SERVER", 'all', `[${clientNameArr[0]}] ${clientNameArr[1] ? '(New Client!)' : ''}'s hash found."`);
			responseHTML += `
					<p>I found this coin in row <span style='font-weight:bold'>${coinIndex + 8}</span> of <span style='font-weight:bold'><a href='${campaigns[scanCampaignID].spreadsheetURL}' target='_blank'>this campaign's spreadsheet</a></span>!</p>`;
					
			//Give some info about the campaign
			responseHTML += `
					<p>The campain's name is <span style='font-weight:bold'>${campaigns[scanCampaignID].name}</span>. <br />
					Its market begins <span style='font-weight:bold'>${new Date(campaigns[scanCampaignID].marketStartTime).toLocaleString(undefined, {year: "numeric", 	month: "long", day: "numeric", hour: "numeric", minute: "numeric", timeZoneName: "short"})}</span> (${timeDiffMessage(new Date().getTime() - campaigns[scanCampaignID].marketStartTime)}). <br /> 
						Its market ends <span style='font-weight:bold'>${new Date(campaigns[scanCampaignID].marketEndTime).toLocaleString(undefined, {year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "numeric", timeZoneName: "short"})}</span> (${timeDiffMessage(new Date().getTime() - campaigns[scanCampaignID].marketEndTime)}). <br />
						This coin currently represents <span style='font-weight:bold'>$${coin.currentValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span> of the campaign's <span style='font-weight:bold'>$${campaigns[scanCampaignID].info[0][0].toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span> funding distributed between <span style='font-weight:bold'>${campaigns[scanCampaignID].coins.length - 1}</span> coins to be spent across <span style='font-weight:bold'>${campaigns[scanCampaignID].buckets.length -1}</span> buckets.</p>`;
			
			//Increment the scan count on the spreadsheet, if appropriate.
			if (coin.scanCount > 0){ 
				responseHTML += `
					<p>It looks like this coin was scanned <span style='font-weight:bold'>${coin.scanCount} time${coin.scanCount > 1 ? 's' : ''}</span> so far, with the previous scan <span style='font-weight:bold'>${timeDiffMessage(new Date().getTime() - ExcelDateToJSDate(coin.lastScanned).getTime())}</span> by ${coin.lastScannedBy}.  `	
				if("Anonymous " + clientNameArr[0] != coin.lastScannedBy){
					responseHTML += `
						I'm guessing you're not the same person that scanned it last time, so I'll increment the scan count by 1.  `;
					let serialDate = 25569.0 + ((requestDate.getTime() - (requestDate.getTimezoneOffset() * 60 * 1000)) / (1000 * 60 * 60 * 24)); //Convert the javascript Date object to a spreadsheet serialized date.  
					let writeResponse = googleSheetsInstance.spreadsheets.values.update({
						auth, 
						spreadsheetId: campaigns[scanCampaignID].spreadsheetId, 
						range: scanCampaignID + "!" + 'I' + (coinIndex + 8) + ':' + 'K' + (coinIndex + 8), 
						valueInputOption: 'USER_ENTERED',
						resource: {values: [[serialDate, "Anonymous " + clientNameArr[0], coin.scanCount + 1]]}
					});
					wroteToSS = true;
					//console.log(writeResponse);								
			
					
				}else responseHTML += `
						I'm guessing you're the same person that scanned it last time, so I wont bother incrementing the scan count.  `;
				responseHTML += `
						It's not a big deal either way; I'm just trying to show you how a simple web-server can intelligently interact with a spreadsheet using a QR code and/or NFC chip.  (Imagine applying this to inventory/asset management!)</p>`;
			}else{
				responseHTML += `
					<p>You seem to be the first person to scan their coin!  I'll start the counter at 1.</p>`;
				let serialDate = 25569.0 + ((requestDate.getTime() - (requestDate.getTimezoneOffset() * 60 * 1000)) / (1000 * 60 * 60 * 24)); //Convert the javascript Date object to a spreadsheet serialized date.  
				let writeResponse = googleSheetsInstance.spreadsheets.values.update({
					auth, 
					spreadsheetId: campaigns[scanCampaignID].spreadsheetId, 
					range: scanCampaignID + "!" + 'I' + (coinIndex + 8) + ':' + 'K' + (coinIndex + 8), 
					valueInputOption: 'USER_ENTERED',
					resource: {values: [[serialDate, "Anonymous " + clientNameArr[0], 1]]}
				});
				wroteToSS = true;
			}
			
			if(coin.message != "") responseHTML += `
					<p><span style='font-weight:bold'>This coin has an embedded message for you:</span> <br />
						<span style='font-family:consolas; color:#000; background-color:#FFF; display:block; text-align:center'>${coin.message}</span></p>`;
			
			if(coin.passphraseHash != ""){
				responseHTML += `
					<p><span style='font-weight:bold'>This coin appears to have been claimed!</span>  To unlock it, type the passphrase below and click "launch".  Passphrases are not case sensitivty and should be something memorable rather than complex.  If you're the one who claimed/set the passphrase but don't remember it, contact a Campaign Manager as they'll have to delete the "Passphrase Hash" from the spreadsheet.</p>`
			}else{
				responseHTML += `
					<p><span style='font-weight:bold'>This coin appears to be unclaimed!</span>  To claim this coin and <span style='font-weight:bold'>launch the GUI client</span>, type in a secret passphrase below and click "launch".  This secret passphrase locks the coin and prevents anyone else from using it, kinda like a PIN number on your debit card.  It's not case sensitive, and don't worry about numbers or symbols - <span style='font-weight:bold'>something memorable is more important than something complex</span>.  This completes Two-Factor Authentication without any need for usernames, email addresses, or phone numbers.  <span style='font-weight:bold'>Only a Campaign Manager can reset the coin</span> by deleting its hash from the spreadsheet, so if you're claiming the coin as your own be sure to remember your passphrase! (And don't use a password you use elsewhere, as the web admins will be able to see it in HTTP requests even if SSL prevents anyone else from seeing it, hence why you should always still use a different password on every site!)</p>`
			}
			responseHTML += `
					<form method='POST'>
						<label style="font-weight:bold">Passphrase: <input type='text' name='passphrase' /></label>
						<input type="hidden" name="coinCampaignID" value="${scanCampaignID}" />
						<input type="hidden" name="coinID" value="${scanID}" />
						<input type="hidden" name="coinSecret" value="${scanSecret}" />
						<input type="hidden" name="clientName" value="${clientNameArr[0]}" />
						<button type='submit'>Launch</button>
					</form><br/>`;
				
			responseHTML += `
					<p style='font-style:italic'>Alternatively, you can drop an unclaimed coin in one of the <span style='font-weight:bold'>physical IRL (In Real-Life) buckets</span> and the NFC chip inside will do all the work for you.  Dropping it into a <span style='font-weight:bold'>red bucket, or a bucket that's already full, will recycle any remaining funds on the coin</span> thereby increasing the funds on the remaining coins still in play.  If the coin has been claimed, dropping the coin in a bucket does nothing (the bucket doesn't know the passphrase).  But, if you do claim the coin and spend the "digital twin" using the GUI client above, you can keep the physical coin as a sourvenier (or maybe use it in future campaigns!).  However, if you don't want to keep it, I'd appreciate you dropping it in a bucket anyway because even though they cost ~$1.50 in materials to make, a batch of 48 takes about 8 hours of my free time to design, paint and prepare, laser-etch and cut the pieces, coat with epoxy resin, glue together, and program the chip...  So just trashing it would hurt my feelings!</p>`
			responseHTML += `
					<p style='font-weight:bold; font-style:italic'>NOTE: the physical buckets don't exist yet for this demo campaign.  Nor does the money.  For now, just keep the coin and play around with it, and maybe it'll be used for-realz later on! You're welcome to ask questions about it or getting some set up for your own spark event (still free)!  Just find me on the AllSpark Discord server here: <a href='https://discord.gg/Wzu8pesnye'>https://discord.gg/Wzu8pesnye</a> -Brian W. 19-Jan-2023</p>`;
		}else{
			echo("SERVER", 'all', `[${clientNameArr[0]}] failed to authenticate coin ${scanID} for campaign ${scanCampaignID}!"`);
			responseHTML += `
					<p><span style='font-weight:bold'>But the coin appears to be invalid</span>, or not (yet) associated to any active campaigns.</p>`;
			responseHTML += `
					<p>If you actually have a coin, just keep an eye out in various communities for announcements for the next campaign!</p>`;
			responseHTML += `
					<p>If you're trying to be clever and guess at which coins exist, good luck, as there's less than a thousand randomized coin secrets but 7 septillion different combinations (16 alphanumeric digits = 36^16 = 7,958,661,109,946,400,884,391,936) Is it impossible to guess?  No.  But to put this needle-in-a-haystack problem in context, imagine a few thousand $1 bills - easy!  But if the US Treasury printed 1 septillion $1 dollar bills, it would fill the entire US landmass in a layer 1km thick. So good luck!</p>`;
			responseHTML += `
					<p>But chances are you have a legitimate coin - the screw up is on our end, so if you're not trying to do anything strange then just let someone who looks like they know what they're doing know!</p>`;
			responseHTML += `
					<p>And if you just want to play with the test coin, try going to <a href="https://www.spark-coin.com/000/00000-MYSECRETCODETEST">https://www.spark-coin.com/000/00000-MYSECRETCODETEST</a></p>.`;
		}
		
		responseHTML += `
					<p xmlns:cc="http://creativecommons.org/ns#" xmlns:dct="http://purl.org/dc/terms/"><a property="dct:title" rel="cc:attributionURL" href="http://www.spark-coin.com">Spark-Coin</a> by <span property="cc:attributionName">Brian Westgate</span> is licensed under <a href="http://creativecommons.org/licenses/by-sa/4.0/?ref=chooser-v1" target="_blank" rel="license noopener noreferrer" style="display:inline-block;">CC BY-SA 4.0<img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/cc.svg?ref=chooser-v1"><img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/by.svg?ref=chooser-v1"><img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/sa.svg?ref=chooser-v1"></a></p>`;
		responseHTML += `
					<a href="https://www.buymeacoffee.com/brianwestgate"><img src="https://img.buymeacoffee.com/button-api/?text=Coffee keeps me going!&emoji=&slug=brianwestgate&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff" /></a>
				</div>
			</body>
		</html>`
		res.send(responseHTML);
		//if(wroteToSS) campaigns[scanCampaignID].readSS(); //Refresh our data as we may have written to the sheet.
	});
});

app.post(/\/[a-zA-Z0-9]{3}\/[a-zA-Z0-9]{5}-\S+/, (req, res) => {
	let wroteToSS = false;
	let scanCampaignID = req.url.slice(1,4); //XXX
	let scanID = req.url.slice(5,10); //YYYYY
	let scanSecret = req.url.slice(11, 27); //ZZZZZZZZZZZZZZZ
	let URLParameters = new URLSearchParams(new URL("http://spark-coin.com" + req.url).search);

	let coinIndex = campaigns[scanCampaignID].coins.findIndex((e) => e.ID == scanID); //Find the coin the client is claiming to be for
	let coin = campaigns[scanCampaignID].coins[coinIndex]; 
	
	//Make sure we're still validated with the coin secret and nobody's trying anything sneaky.
	let scanHash = crypto.createHash('md5').update(scanSecret).digest().toString("hex").toUpperCase(); //Run the MD5 function on the provided secret to get the hash. 
	if(coin.secretHash == scanHash){
		let scanPassphraseHash = crypto.createHash('md5').update(req.body.passphrase.toUpperCase()).digest().toString("hex").toUpperCase();

		//Let's validate the passphrase matches the hash (or, if there is no hash, becomes the hash)
		if (coin.passphraseHash == scanPassphraseHash || coin.passphraseHash == ""){
			
			if(coin.passphraseHash == ""){
				let writeResponse = googleSheetsInstance.spreadsheets.values.update({
					auth, 
					spreadsheetId: campaigns[scanCampaignID].spreadsheetId, 
					range: scanCampaignID + "!" + 'C' + (coinIndex + 8) + ':' + 'C' + (coinIndex + 8), 
					valueInputOption: 'USER_ENTERED',
					resource: {values: [[scanPassphraseHash]]}
				});
				wroteToSS = true; 
			}

			//Let's pre-load the client with some useful info and log history
			let preamble = "";
			serverLog.forEach((e) => {preamble += "<li class='msgLI'>" + e + "</li>";}); 
			
			if(scanCampaignID == "000"){
				res.render("index.ejs", {	campaign: JSON.stringify(campaigns[scanCampaignID]), 
											preamble, 
											clientName: req.body.clientName, 
											coinCampaignID: scanCampaignID, 
											coinID: req.body.coinID, 
											coinSecret: req.body.coinSecret, 
											coinToken: req.body.passphrase.toUpperCase(), 
											spreadsheetURL: "blah", 
											debug:DEBUG});
			}else res.send(`
	<html>
		<body>
			<p>There doesn't appear to be a GUI client for this campaign yet!  If you just want to play around with one, try going to <a href="https://www.spark-coin.com/000/00000-MYSECRETCODETEST">https://www.spark-coin.com/000/00000-MYSECRETCODETEST</a>.</p>
		</body>
	</html>`);
		}else{
			res.send(`No go on that passphrase, boss.  It's still locked!`);
		}
	}else{
		res.send(`You tried cheating by modifying the POST body, didn't ya?!`);
	}
	//if(wroteToSS) campaigns[scanCampaignID].readSS(); //Refresh our data as we may have written to the sheet.
});

//The first thing a client's websocket should do is handshake, and this is how Spark-Coins do it!  All other websocket events are dependent on that connection, so are embedded into the function
io.on('connection', async (socket) => {
	let clientName = getClientNameSOCK(socket); //Figure out who this is
	let lastChatMinute = new Date().getMinutes(); //This is just a timer for the auto-response to unknown requests/messages in the comms channel (which doubles as a chat-room!)
	
	echo("SERVER", 'all', `[${clientName}]'s Web Socket connected!`); //Broadcast the new connection to the log and all the existing clients
	
	if(clientName.slice(0,7) == "UNKNOWN"){ //If we couldn't figure out who this is, disconnect them
		socket.disconnect(); //Terminate the connection 
		echo("SERVER", 'all', `[${clientName}]'s Web Socket terminated due to Stranger Danger!`);
		return;
		}else{
		
		socket.on('chat', msg => { //These are simple chat messages, probably just between the clients (e.g. users asking/answering questions, potential alternative to Slack/Discord/Teams)
			echo(clientName + '\'s user', 'all', msg);
			
			let currentMinute = new Date().getMinutes()
			if(lastChatMinute != currentMinute){
				echo('SERVER', 'all', `Hello, ${clientName}'s user!  I'm just a dumb server that can't understand much yet, but I'm getting there!`);
				lastChatMinute = currentMinute;
			}
		});
		
		socket.on('authentication', async (coinCampaignID, coinID, coinHash) => { //The client is attempting to authenticate
			let requestDate = new Date();
			
			//Let's start easy by reading the campaign name in cell B1 
			echo("SERVER", 'authentication', `Reading Google Sheet...`);
			/*try{
				//let spreadsheetLayout.URL = "https://docs.google.com/spreadsheets/d/1j2awYVu1CcMuNACG3RBg8s34GohQxVeQVSHZ02AdiI8/edit#gid=650135663"
				//let spreadsheetLayout.ID = "1j2awYVu1CcMuNACG3RBg8s34GohQxVeQVSHZ02AdiI8"; //ID of the Spark Coin spreadsheet
				//let CAMPAIGN_NAME_REF = "A1", CAMPAIGN_INFO_REF = "A3:I3", MD5_COLUMN_REF = "B", COIN_VALUE_COLUMN_REF = "D", COIN_SPENT_TO_COLUMN_REF = "G", PITCHES_RANGE_REF = "T8:X108", LAST_SCANNED_COLUMN = "E", LAST_SCANNED_BY_COLUMN = "F";
				
				//let nameCell = await googleSheetsInstance.spreadsheets.values.get({auth,  spreadsheetId: campaigns[coinCampaignID].spreadsheetId, valueRenderOption: 'UNFORMATTED_VALUE', range: coinCampaignID + "!" + campaigns[coinCampaignID].spreadsheetLayout.name});
				//let infoRange = await googleSheetsInstance.spreadsheets.values.get({auth, spreadsheetId: campaigns[coinCampaignID].spreadsheetId, valueRenderOption: 'UNFORMATTED_VALUE', range: coinCampaignID + "!" + campaigns[coinCampaignID].spreadsheetLayout.info});
				
				//let coinValuesRange = await googleSheetsInstance.spreadsheets.values.get({auth, spreadsheetId: campaigns[coinCampaignID].spreadsheetId, valueRenderOption: 'UNFORMATTED_VALUE', range: coinCampaignID + "!" + campaigns[coinCampaignID].spreadsheetLayout.coinValues});
				//echo("SERVER", "coinValues", JSON.stringify({coinValuesRange}));
				
				campaigns[coinCampaignID].name = nameCell.data.values[0][0];
				campaigns[coinCampaignID].overallFunding = infoRange.data.values[0][0];
				campaigns[coinCampaignID].marketTimezoneOffset = infoRange.data.values[0][1];
				campaigns[coinCampaignID].marketStartTime = ExcelDateToJSDate(infoRange.data.values[0][2]);
				campaigns[coinCampaignID].marketEndTime = ExcelDateToJSDate(infoRange.data.values[0][3]);
				campaigns[coinCampaignID].unspentFunding = infoRange.data.values[0][4];
				campaigns[coinCampaignID].spentFunds = infoRange.data.values[0][5];			
				
				
				echo("SERVER", 'campaign', JSON.stringify(campaigns[coinCampaignID]));
				
				//Let's now try to find the coin in the spreadsheet!
				echo("SERVER", 'authentication', `Searching for hash of ${coinHash}...`);
				let coinMD5Column = await googleSheetsInstance.spreadsheets.values.get({auth, spreadsheetId: campaigns[coinCampaignID].spreadsheetId, valueRenderOption: 'UNFORMATTED_VALUE', range: coinCampaignID + "!" + campaigns[coinCampaignID].spreadsheetLayout.MD5s + ":" + campaigns[coinCampaignID].spreadsheetLayout.MD5s}) 	
				if(coinMD5Column.data.values.length > 0){
					//We got values, now let's find if any of them match.
					let coinRowNumber = coinMD5Column.data.values.findIndex((e) => e[0] == coinHash); //Gets the index of the array element that matches the hash.
					if(coinRowNumber >=0){
						coinRowNumber = coinRowNumber + 1; //Spreadsheet rows start at 1, not 0 like array indexes.
						let coinRow = await googleSheetsInstance.spreadsheets.values.get({auth, spreadsheetId: campaigns[coinCampaignID].spreadsheetId, valueRenderOption: 'UNFORMATTED_VALUE', range: coinCampaignID + "!" + coinRowNumber + ":" + coinRowNumber});
						
						echo("SERVER", 'authentication', `Hash found in row ${coinRowNumber} - authentication successful!`);
						
						//campaigns["000"].peek();
						
						//console.log(`<p><span class="t">t=` + new Date().getTime() + `></span> ` + `I found <span class="mine">your coin</span> in row <b>` + coinRowNumber + `</b> of the spreadsheet <b><a href="` + spreadsheetLayout.URL + `&range=` + coinRowNumber + ":" + coinRowNumber + `" target="_blank">here!</a></b></p>\n`);
						//console.log(`<p><span class="t">t=` + new Date().getTime() + `></span> ` + `This coin represents a value of <span class="mine">$` + coinRow.data.values[0][4].toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) + `</span> (with a multipler of <b>` + coinRow.data.values[0][3] + `</b>).  It was last scanned on <b>` + ExcelDateToJSDate(coinRow.data.values[0][5]) + `</b> by <b>` + coinRow.data.values[0][6] + `</b>.</p>\n`);
						
						//Coin notes/messages?
						//if(coinRow.data.values[0][8] != '' && coinRow.data.values[0][8] != undefined){
						let coin = {
							id: coinRow.data.values[0][0],
							hash: coinRow.data.values[0][1],
							multiplier: coinRow.data.values[0][2],
							value: coinRow.data.values[0][3],
							note: coinRow.data.values[0][4],
							joke: coinRow.data.values[0][5],
							createdDate: coinRow.data.values[0][6],
							lastScannedDate: coinRow.data.values[0][7],
							lastScannedBy: coinRow.data.values[0][8],
							bucketA: coinRow.data.values[0][9],
							bucketB: coinRow.data.values[0][10]
						}
						//echo("SERVER", 'coin', JSON.stringify({coin}));
						//}
						
						//let coinGivenTo = await googleSheetsInstance.spreadsheets.values.get({auth, spreadsheetLayout.ID: spreadsheetLayout.ID, valueRenderOption: 'UNFORMATTED_VALUE', range: '000!N' + coinRowNumber});
						//console.log(', originally given to ' + coinGivenTo.data.values[0][0]);
						
						//Add the time and "user name" it was scanned to the spreadsheet.
						//console.log(`<p><span class="t">t=` + new Date().getTime() + `></span> ` + `I'll update the spreadsheet to show this coin was last scanned as of <b>` + requestDate + `</b>...`)
						
						serialDate = 25569.0 + ((requestDate.getTime() - (requestDate.getTimezoneOffset() * 60 * 1000)) / (1000 * 60 * 60 * 24)); //Convert the javascript Date object to a spreadsheet serialized date.  
						let writeResponse = await googleSheetsInstance.spreadsheets.values.update({
							auth, 
							spreadsheetId: campaigns[coinCampaignID].spreadsheetId, 
							range: coinCampaignID + "!" + campaigns[coinCampaignID].spreadsheetLayout.lastScanned + coinRowNumber + ':' + campaigns[coinCampaignID].spreadsheetLayout.lastScannedBy + coinRowNumber, 
							valueInputOption: 'USER_ENTERED',
							resource: {values: [[serialDate, "Anonymous " + clientName]]}
						});
						
						echo('SERVER', 'authentication', `Google Sheet updated to show last login.`);
						
						}else{
						//Couldn't find a matching hash in the spreadsheet.
						echo('SERVER', 'authentication', `Authentication failed - ${coinHash} not found in listing...`);
					}
					}else{
					//We didn't get anything from the spreadsheet.
					echo('SERVER', 'authentication', `Authentication failed - unable to locate hashes.`);
				}
				} catch(error){
				echo('SERVER', 'authentication', `Failed to read spreadsheet.`);
				console.log(error);
			}*/
		});
	}
	
});

function pokeSS(campaignID){
	googleSheetsInstance.spreadsheets.values.update({
					auth, 
					spreadsheetId: campaigns[campaignID].spreadsheetId, 
					range: campaignID + "!" + 'I3:I3', 
					valueInputOption: 'USER_ENTERED',
					resource: {values: [[new Date().getTime()]]}
				});
}

//Stolen from https://javascript.tutorialink.com/converting-excel-date-serial-number-to-date-using-javascript/
function ExcelDateToJSDate(serial) {
	var utc_days  = Math.floor(serial - 25569) + 1;
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

function timeDiffMessage(timeDelta){
	//Break down the difference in millisecond timestamps into days, hours, minutes, seconds.
	let chunk = Math.abs(timeDelta);
	const DAYS = Math.floor(chunk/86400000); chunk -= DAYS*86400000;
	const HOURS = Math.floor(chunk/3600000); chunk -= HOURS*3600000;
	const MINUTES = Math.floor(chunk/60000); chunk -= MINUTES*60000;
	const SECONDS = Math.round(chunk/1000);
	return (timeDelta <= 0 ? "in " : "") + (DAYS ? DAYS + `day${DAYS > 1? 's' : ''} ` : "") + (HOURS ? HOURS + `hr${HOURS > 1? 's' : ''} ` : "") + (MINUTES ? MINUTES + "min " : "") + SECONDS + "s" + (timeDelta > 0 ? " ago" : "");
}

//Extracts data from a spreadsheet array using A1 Notation (so it's easier for campaign managers to maintain this code)
function extractFromSSArr(ssArr, A1) {
	//Use regex to extract out row and column info from the A1 notation string
	let match = /([A-Z]+)([0-9]+):([A-Z]+)([0-9]+)/gi.exec(A1);
	if(match == null || match.length < 5) throw("improperly formatted A1 Notation - remember to specify ranges and not individual cells!");
	
	//An A1 range is just a rectangle.  Ex: in A1:B2, column A is left, row 1 is top, column B is right, and row 2 is bottom  
	let A1Left = match[1], A1Top = match[2], A1Right = match[3], A1Bottom = match[4]; //match[0] is just the entire matched string; we want the groups in our RegEx's ()'s

	//convert our column letters to numbers where A = 1, B = 2, C = 3...  Z = 26, AA = 27, ZZ = 702, XYZ = 16900 and so on.
	const A = "A".charCodeAt(0); //Get a reference to where "A" begins in our character set (should be 65 on the ASCII table).
	let l = 0, r = 0;
	for(let n = 1 ; n <= A1Left.length; n++) { l += (A1Left.charCodeAt(n-1)-A + 1) * Math.pow(26, A1Left.length - n); } //Walk the string character-by-character, multiplying the value of that digit to the power of its Place (e.g. in "12,345", the "2" is in the 1000s place, or 10-to-the-power-of-3)
	for(let n = 1 ; n <= A1Right.length; n++) { r += (A1Right.charCodeAt(n-1)-A + 1) * Math.pow(26, A1Right.length - n); }
	
	//Rows start at 1, but array indexes start at 0.  (They're also integers, not strings, but math operaators typecast Strings into Numbers when possible)
	let t = A1Top - 1; 
	let b = A1Bottom - 1;
	l--;
	r--;

	//Now that we got our indexes from the A1 Notation, we can start working with arrays.
	let data = ssArr.slice(t, b + 1).map(e => e.slice(l, r + 1)); //since we're working with a 2D array that's essentially a grid, slicing the first dimension essentially gives us rows, and the .map function runs on each row to again slice out the columns.
				
	return data;
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
/* function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
} */

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
/* function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
} */

console.log(`>index.js fully parsed!`);  //This is the end of the script, likely reached before the services are complete.
startServer();
