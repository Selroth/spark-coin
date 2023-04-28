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

//Breaks down a difference in time into a string.
function timeDiffMessage(timeDelta){
    //Break down the difference in millisecond timestamps into days, hours, minutes, seconds.
    let chunk = Math.abs(timeDelta);
    const DAYS = Math.floor(chunk/86400000); chunk -= DAYS*86400000;
    const HOURS = Math.floor(chunk/3600000); chunk -= HOURS*3600000;
    const MINUTES = Math.floor(chunk/60000); chunk -= MINUTES*60000;
    const SECONDS = Math.round(chunk/1000);
    return (DAYS ? DAYS + `day${DAYS > 1? 's' : ''} ` : "") + (HOURS ? HOURS + `hr${HOURS > 1? 's' : ''} ` : "") + (MINUTES ? MINUTES + "min " : "") + SECONDS + "s";
}

//Converts console color escape codes to html spans.
function formatAnsiEscapeCodes(text) {
  // Define a mapping of ANSI escape codes to HTML styles
  const styleMap = {
    "\u001b[0m": "</span>",
    "\u001b[1m": "<span style='font-weight: bold;'>",
    "\u001b[2m": "<span style='opacity: 0.5;'>",
    "\u001b[3m": "<span style='font-style: italic;'>",
    "\u001b[4m": "<span style='text-decoration: underline;'>",
    "\u001b[30m": "<span style='color: black;'>",
    "\u001b[31m": "<span style='color: red;'>",
    "\u001b[32m": "<span style='color: green;'>",
    "\u001b[33m": "<span style='color: yellow;'>",
    "\u001b[34m": "<span style='color: blue;'>",
    "\u001b[35m": "<span style='color: magenta;'>",
    "\u001b[36m": "<span style='color: cyan;'>",
    "\u001b[37m": "<span style='color: white;'>",
    "\u001b[40m": "<span style='background-color: black;'>",
    "\u001b[41m": "<span style='background-color: red;'>",
    "\u001b[42m": "<span style='background-color: green;'>",
    "\u001b[43m": "<span style='background-color: yellow;'>",
    "\u001b[44m": "<span style='background-color: blue;'>",
    "\u001b[45m": "<span style='background-color: magenta;'>",
    "\u001b[46m": "<span style='background-color: cyan;'>",
    "\u001b[47m": "<span style='background-color: white;'>",
  };

  // Replace each ANSI escape code with its corresponding HTML style
  for (let code in styleMap) {
    text = text.split(code).join(styleMap[code]);
  }

  // Add a closing span tag to any unclosed spans
  let openSpanCount = (text.match(/<span/g) || []).length;
  let closeSpanCount = (text.match(/<\/span>/g) || []).length;
  for (let i = 0; i < openSpanCount - closeSpanCount; i++) {
    text += "</span>";
  }

  return text;
}


module.exports = {ExcelDateToJSDate, extractFromSSArr, timeDiffMessage, formatAnsiEscapeCodes};