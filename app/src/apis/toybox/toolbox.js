(function() {

const _lizard = {
	info: `Lizard's toybox. Version 1.19`,
	obsolete: {},
};


// ============================================================
// ============================================================
//                      Extensions/mappings
// ============================================================
// ============================================================

// -----------------------
//         Strings
// -----------------------
{
	// LEGACY
	String.prototype.zfill = function(amt=1, char='0') {
		const pad_char = typeof char !== 'undefined' ? char : '0';
		let pad = new Array(1 + amt).join(pad_char);
		return (pad + this).slice(-pad.length);
	}


	// Strings
	String.prototype.capitalize = function(reformat=false) {
		if (!this[0]){return this};
		return this[0].toUpperCase() + (reformat ? this.slice(1).toLowerCase() : this.slice(1));
	}
	String.prototype.lower = function() {
		return this.toLowerCase()
	}
	String.prototype.upper = function() {
		return this.toUpperCase()
	}

	// String.prototype.zfill = function(amt=1, char='0') {
	// 	const pad_char = typeof char !== 'undefined' ? char : '0';
	// 	const pad = new Array(1 + amt).join(pad_char);
	// 	return (pad + this).slice(-pad.length);
	// }

	String.prototype.rstrip = function(chars='') {
		let start = 0;
		let end = this.length - 1;
		while (chars.indexOf(this[end]) >= 0) {
			end -= 1;
		}
		return this.substr(0, end + 1);
	}

	String.prototype.lstrip = function(chars='') {
		let start = 0;
		while (chars.indexOf(x[start]) >= 0) {
			start += 1;
		}
		let end = x.length - 1;
		return x.substr(start);
	}

	String.prototype.strip = function(chars='') {
		let start = 0;
		let trimmerd = this.trim()
		while (chars.indexOf(trimmerd[start]) >= 0) {
			start += 1;
		}
		let end = trimmerd.length - 1;
		while (chars.indexOf(trimmerd[end]) >= 0) {
			end -= 1;
		}
		return trimmerd.substr(start, end - start + 1);
	}

	String.prototype.encode = function(){
		return _lizard.strToUTF8Arr(this)
	}

	window.str = function (inp){
		try {
			if (inp){
				if (inp.toString){
					return inp.toString()
				}
			}
			return `${inp}`
		} catch (e) {
			return `${inp}`
		}
	}
}

// -----------------------
//      Numbers/Math
// -----------------------
{
	window.int = parseInt;

	window.float = parseFloat;

	// clamp a number to min/max
	Number.prototype.clamp = function(min, max) {
		return Math.min(Math.max(this, min), max);
	};

	// LEGACY
	Number.prototype.zfill = function(max_l, pad_char) {
		return str(this).padStart(max_l, pad_char)
	};

	Math.isEven = function(numb){
		return ((numb % 2) == 0)
	};
	Math.isOdd = function(numb){
		return ((numb % 2) != 0)
	};
}

// -----------------------
//      Arrays/Sets
// -----------------------
{
	// IMPORTANT TODO: WHY IS THIS ALWAYS CAUSING PROBLEMS ????
	// Array.prototype.rmdupli = function(){
	// 	const _to_set = new Set(this);
	// 	return Array.from(_to_set);
	// }

	// Implement Array.at for sets
	Set.prototype.at = function(index) {
		if (Math.abs(index) > this.size){
			return
		}

		let idx = index;
		if (idx < 0){
			idx = this.size + index;
		}
		let counter = 0;
		for (const elem of this){
			if (counter == idx){
				return elem
			}
			counter += 1;
		}
	}

	// Delete element of a set by index
	Set.prototype.del_idx = function(index) {
		const array_elem = this.at(index);
		if (!array_elem){
			return false
		}

		return this.delete(array_elem)
	}

	// Find index of an element in a set
	Set.prototype.indexof = function(tgt_elem) {
		let counter = 0;
		for (const elem of this){
			if (elem == tgt_elem){
				return counter
			}
			counter += 1;
		}
		return -1
	}

	// Join set into a string, like an Array
	// todo: this can be better
	Set.prototype.join = function(separator='') {
		const arr = [];
		for (const i of this){
			arr.push(i)
		}
		return arr.join(separator)
	}
}


// -----------------------
//      Python specific
// -----------------------
{
	// python-like len()
	window.len = function (inp){
		if (str(typeof inp).lower() == 'number'){
			throw new Error('Numbers have no length');
			return
		}
		try {
			return Object.keys(inp).length
		} catch (error) {}
		try {
			return inp.length
		} catch (error) {
			return str(inp).length
		}
	}

	// python-like range()
	window.range = function* (_start=0, _stop=null, _step=1){
		let start = _start;
		let stop = _stop;
		let step = _step;

		if (stop == null){
			stop = start
			start = 0
		}
		try {
			start = parseInt(start)
			stop = parseInt(stop)
			step = parseInt(step)
		} catch (error) {
			console.error('Range iterator: Invalid parameters', start, stop, step)
			return []
		}

		// var tgt_result = []
		// var eligible = true

		while (true) {
			if (start >= stop){
				return
				break
			}
			// tgt_result.push(start)
			yield start
			start += step
		}
	}

	// Object.prototype.keys = function(){
	// 	return Object.keys(this)
	// }
	// Object.prototype.values = function(){
	// 	return Object.values(this)
	// }
	// Object.prototype.items = function(){
	// 	return Object.entries(this)
	// }
}

// -----------------------
//    Extend URL class
// -----------------------
{
	const _ext_url_identifier = window.URL ? 'URL' : 'webkitURL';
	const _more_url = class extends (window.URL || window.webkitURL){
		get target(){
			const base = this.pathname.split('/');
			let stem = base.at(-1).split('.');
			stem.pop()
			const sex = {
				'name': base.at(-1) || null,
				'suffix': base.at(-1).split('.').at(-1) || null,
				'stem': stem.join('.') || null,
				'stem_raw': base.at(-1).split('.')[0] || null,
			}
			return sex
		}
		get no_search(){
			return (this.origin + this.pathname)
		}
	}

	window[_ext_url_identifier] = _more_url;
}

// -----------------------
//  Extend local storage
// -----------------------
{
	const _obj_get = function(itemname){
		const got_item = window.localStorage.getItem(itemname)
		return JSON.parse(got_item)
	}

	const _obj_set = function(itemname){
		window.localStorage.setItem(itemname, JSON.stringify(itemval))
	}

	window.localStorage.__proto__.getObject = _obj_get;
	window.localStorage.__proto__.setObject = _obj_set;
	window.localStorage.__proto__.getObj = _obj_get;
	window.localStorage.__proto__.setObj = _obj_set;
}




// todo: create .items() python style dict iteration;



// ============================================================
// ============================================================
//                            Functions
// ============================================================
// ============================================================

const _buffer_types = [
	window.ArrayBuffer,
	window.Uint8Array,
	window.Uint16Array,
	window.Uint32Array,
	window.Uint8ClampedArray,
	window.BigUint64Array,
	window.Int8Array,
	window.Int16Array,
	window.Float32Array,
	window.Float64Array,
	window.BigInt64Array,
]




// --------------------------------
//  Check whether object is a dict
// --------------------------------
{
	const _prohibited_is_dict = [
		..._buffer_types,
		window.Date,
		window.Array,
		window.Set,
		window.WeakMap,
		window.WeakSet,
		window.DataView,
		window.JSON,
		window.Promise,
		window.String,
		window.RegExp,
		window.Number,
		window.BigInt,
		window.Math,
		window.Error,
		window.Boolean,
		window.Symbol,

		// TODO: BROWSER COMPAT
		window.Atomics,
		window.WeakRef,
		window.FinalizationRegistry,
		window.Reflect,
		window.Proxy,
		window.Intl,
		window.EvalError,
		window.AggregateError,
		window.RangeError,
		window.ReferenceError,
		window.SyntaxError,
		window.TypeError,
		window.URIError,
	]
	const _prohibited_explicit = [
		Infinity,
		NaN,
		undefined,
		null,
	]
	_lizard.isDict = function(v){
		if (_prohibited_explicit.includes(v)){
			return false
		}
		
		if ((typeof v).lower() !== 'object'){
			return false
		}
		if (v == null || v == undefined){
			return false
		}
		for (const i of _prohibited_is_dict){
			if (v instanceof i){
				return false
			}
		}

		return true
	}
}




// --------------------------------
//  Check object type against multiple types
// --------------------------------
{
	_lizard.includesType = function(tgt, compared_types){
		if (!compared_types){
			console.error(
				'includesType: compared_types (types to check against) is invalid. Returning false'
			)
			return false
		}

		for (const tgt_type of compared_types){
			if (tgt instanceof tgt_type){
				return true
			}
		}

		return false
	}
}







// --------------------------------
//     Random string generator
// --------------------------------
{
	const _methods = {
		'flac': 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-()=+*#/!&?<>$~',
		'num': '1234567890',
		'def': 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-',
		'letters': 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
		'custom': ' ',
	}

	_lizard.rndwave = function(len=8, method='def', addchars='', crypto=true) {
		let result = '';

		const addon_chars = addchars.toString().replaceAll(' ', '');

		const characters = ((_methods[method] || _methods.def) + addon_chars).strip();
		const charactersLength = characters.length;

		// if (crypto == true){
		// 	var cryptonums = window.crypto.getRandomValues(new Uint32Array(len + 1))
		// }

		const cryptonums = (crypto == true) ? window.crypto.getRandomValues(new Uint32Array(len + 1)) : null;

		for ( let i = 0; i < len; i++ ) {
			if (crypto == true){
				result += characters.charAt(cryptonums[i] % charactersLength);
			}else{
				result += characters.charAt(Math.floor(Math.random() * charactersLength));
			}
		}
		return result;
	}
}



// ----------------------------------------
// Get a random number from within a range
// ----------------------------------------

// inclusive from both sides
_lizard.rnd_interval = function(min, max, fixed_len=false) {
	const rnd = window.crypto.getRandomValues(new BigUint64Array(1));
	return (rnd % (max - min + 1)) + min;
}
// random int of a fixed length
_lizard.rnd_int_fixed = function(digit_count=3){
	if (digit_count > 19){
		console.error('Requested Integer is longer than 19 characters, returning pseudo-int (a string)')
		const nums = Array.from(window.crypto.getRandomValues(new Uint32Array(digit_count + 1)))
		return nums.join('').slice(0, digit_count)
	}
	const rnd = window.crypto.getRandomValues(new BigUint64Array(1));
	return Math.floor(int('1' + '0'.repeat(digit_count-1)) + rnd % int('9' + '0'.repeat(digit_count-1)))
}





// --------------------------------
//             Biscuits
// --------------------------------
{
	// set cookies. from https://www.w3schools.com/js/js_cookies.asp
	_lizard.cookies = {};
	_lizard.cookies.set = function(cname, cvalue, exdays) {
		if ( typeof cname == 'undefined' || cvalue == 'undefined' || exdays == 'undefined' ) {
			console.log(`lizard's biscuits lack chocolate!`)
			return
		}
		const d = new Date();
		d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
		let expires = 'expires='+d.toUTCString();
		document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/';
	}

	_lizard.cookies.get = function(cname) {
		let name = cname + '=';
		let ca = document.cookie.split(';');
		for(let i = 0; i < ca.length; i++) {
			let c = ca[i];
			while (c.charAt(0) == ' ') {
				c = c.substring(1);
			}
			if (c.indexOf(name) == 0) {
				return c.substring(name.length, c.length);
			}
		}
		return '';
	}
}



// --------------------------------
//      Copy text to clipboard
// --------------------------------
_lizard.text2clipboard = function(tgt_text){
	const tmp = _lizard.ehtml('<input style="opacity: 0;position: absolute;z-index: -214748364">')
	document.body.append(tmp);
	tmp.value = tgt_text;
	tmp.select();
	document.execCommand('copy');
	tmp.remove();
}



// --------------------------------
//     rgb string to hex string
// --------------------------------
{
	const _hex = function(x) {
		return ('0' + parseInt(x).toString(16)).slice(-2);
	}
	_lizard.rgb2hex = function(input_rgb) {
		// Using RegExp
		const rgb = input_rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
		return '#' + _hex(rgb[1]) + _hex(rgb[2]) + _hex(rgb[3]);
	}
}




// --------------------------------
//     Bootleg file downloader
// --------------------------------
_lizard.textdl = function(filename='lizard.txt', text='iguana') {
	const element = document.createElement('a');
	element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
	element.setAttribute('download', filename);

	element.style.display = 'none';
	document.body.appendChild(element);

	element.click();

	document.body.removeChild(element);
}



// --------------------------------
//         Encoding shit
// --------------------------------
{
	/*\
	|*|
	|*|  Base64 / binary data / UTF-8 strings utilities
	|*|
	|*|  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Base64_encoding_and_decoding
	|*|
	\*/

	/* Array of bytes to Base64 string decoding */

	_lizard.b64ToUint6 = function (nChr) {

	  return nChr > 64 && nChr < 91 ?
		  nChr - 65
		: nChr > 96 && nChr < 123 ?
		  nChr - 71
		: nChr > 47 && nChr < 58 ?
		  nChr + 4
		: nChr === 43 ?
		  62
		: nChr === 47 ?
		  63
		:
		  0;

	}

	_lizard.base64DecToArr = function (sBase64, nBlocksSize) {
		var
			sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, ""), nInLen = sB64Enc.length,
			nOutLen = nBlocksSize ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize : nInLen * 3 + 1 >> 2, taBytes = new Uint8Array(nOutLen);

		for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
			nMod4 = nInIdx & 3;
			nUint24 |= _lizard.b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 6 * (3 - nMod4);
			if (nMod4 === 3 || nInLen - nInIdx === 1) {
				for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
					taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
				}
				nUint24 = 0;
			}
		}

		return taBytes;
	}

	/* Base64 string to array encoding */

	_lizard.uint6ToB64 = function (nUint6) {
	  return nUint6 < 26 ?
		  nUint6 + 65
		: nUint6 < 52 ?
		  nUint6 + 71
		: nUint6 < 62 ?
		  nUint6 - 4
		: nUint6 === 62 ?
		  43
		: nUint6 === 63 ?
		  47
		:
		  65;
	}

	_lizard.base64EncArr = function (aBytes) {
		var nMod3 = 2, sB64Enc = "";

		for (var nLen = aBytes.length, nUint24 = 0, nIdx = 0; nIdx < nLen; nIdx++) {
			nMod3 = nIdx % 3;
			// REVERT TO THIS IF NOW BROKEN
			// if (nIdx > 0 && (nIdx * 4 / 3) % 76 === 0) { sB64Enc += "\r\n"; }
			if (nIdx > 0 && (nIdx * 4 / 3) % 76 === 0) { sB64Enc += ""; }
			nUint24 |= aBytes[nIdx] << (16 >>> nMod3 & 24);
			if (nMod3 === 2 || aBytes.length - nIdx === 1) {
				sB64Enc += String.fromCodePoint(_lizard.uint6ToB64(nUint24 >>> 18 & 63), _lizard.uint6ToB64(nUint24 >>> 12 & 63), _lizard.uint6ToB64(nUint24 >>> 6 & 63), _lizard.uint6ToB64(nUint24 & 63));
				nUint24 = 0;
			}
		}

		return sB64Enc.substr(0, sB64Enc.length - 2 + nMod3) + (nMod3 === 2 ? '' : nMod3 === 1 ? '=' : '==');
	}

	/* UTF-8 array to JS string and vice versa */

	_lizard.UTF8ArrToStr = function (aBytes) {

	  var sView = "";

	  for (var nPart, nLen = aBytes.length, nIdx = 0; nIdx < nLen; nIdx++) {
		nPart = aBytes[nIdx];
		sView += String.fromCodePoint(
		  nPart > 251 && nPart < 254 && nIdx + 5 < nLen ? /* six bytes */
			/* (nPart - 252 << 30) may be not so safe in ECMAScript! So...: */
			(nPart - 252) * 1073741824 + (aBytes[++nIdx] - 128 << 24) + (aBytes[++nIdx] - 128 << 18) + (aBytes[++nIdx] - 128 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
		  : nPart > 247 && nPart < 252 && nIdx + 4 < nLen ? /* five bytes */
			(nPart - 248 << 24) + (aBytes[++nIdx] - 128 << 18) + (aBytes[++nIdx] - 128 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
		  : nPart > 239 && nPart < 248 && nIdx + 3 < nLen ? /* four bytes */
			(nPart - 240 << 18) + (aBytes[++nIdx] - 128 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
		  : nPart > 223 && nPart < 240 && nIdx + 2 < nLen ? /* three bytes */
			(nPart - 224 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
		  : nPart > 191 && nPart < 224 && nIdx + 1 < nLen ? /* two bytes */
			(nPart - 192 << 6) + aBytes[++nIdx] - 128
		  : /* nPart < 127 ? */ /* one byte */
			nPart
		);
	  }

	  return sView;

	}

	_lizard.strToUTF8Arr = function (sDOMStr) {

	  var aBytes, nChr, nStrLen = sDOMStr.length, nArrLen = 0;

	  /* mapping... */

	  for (var nMapIdx = 0; nMapIdx < nStrLen; nMapIdx++) {
		nChr = sDOMStr.codePointAt(nMapIdx);

		if (nChr > 65536) {
		  nMapIdx++;
		}

		nArrLen += nChr < 0x80 ? 1 : nChr < 0x800 ? 2 : nChr < 0x10000 ? 3 : nChr < 0x200000 ? 4 : nChr < 0x4000000 ? 5 : 6;
	  }

	  aBytes = new Uint8Array(nArrLen);

	  /* transcription... */

	  for (var nIdx = 0, nChrIdx = 0; nIdx < nArrLen; nChrIdx++) {
		nChr = sDOMStr.codePointAt(nChrIdx);
		if (nChr < 128) {
		  /* one byte */
		  aBytes[nIdx++] = nChr;
		} else if (nChr < 0x800) {
		  /* two bytes */
		  aBytes[nIdx++] = 192 + (nChr >>> 6);
		  aBytes[nIdx++] = 128 + (nChr & 63);
		} else if (nChr < 0x10000) {
		  /* three bytes */
		  aBytes[nIdx++] = 224 + (nChr >>> 12);
		  aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
		  aBytes[nIdx++] = 128 + (nChr & 63);
		} else if (nChr < 0x200000) {
		  /* four bytes */
		  aBytes[nIdx++] = 240 + (nChr >>> 18);
		  aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
		  aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
		  aBytes[nIdx++] = 128 + (nChr & 63);
		  nChrIdx++;
		} else if (nChr < 0x4000000) {
		  /* five bytes */
		  aBytes[nIdx++] = 248 + (nChr >>> 24);
		  aBytes[nIdx++] = 128 + (nChr >>> 18 & 63);
		  aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
		  aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
		  aBytes[nIdx++] = 128 + (nChr & 63);
		  nChrIdx++;
		} else /* if (nChr <= 0x7fffffff) */ {
		  /* six bytes */
		  aBytes[nIdx++] = 252 + (nChr >>> 30);
		  aBytes[nIdx++] = 128 + (nChr >>> 24 & 63);
		  aBytes[nIdx++] = 128 + (nChr >>> 18 & 63);
		  aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
		  aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
		  aBytes[nIdx++] = 128 + (nChr & 63);
		  nChrIdx++;
		}
	  }

	  return aBytes;

	}

	// advanced string encoding
	// (basically fixed native atob/btoa)
	_lizard.btoa = function(st=''){
		if (st == ''){return ''}
		return _lizard.base64EncArr(_lizard.strToUTF8Arr(st))
	}

	_lizard.atob = function(st=''){
		if (st == ''){return ''}
		return _lizard.UTF8ArrToStr(_lizard.base64DecToArr(st))
	}



	// quick string encoding
	// basically old and obsolete way of encoding strings
	// (because there's not an encoder/decoder class)
	_lizard.obsolete.u8btoa = function(st) {
		return btoa(unescape(encodeURIComponent(st)));
	}
	// decode
	_lizard.obsolete.u8atob = function(st) {
		return decodeURIComponent(escape(atob(st)));
	}
}


// --------------------------------
//      Await certain selector
// --------------------------------
{

	// takes selector as an input
	// and a name
	const _waiters_pool = {};
	_lizard.await_elem = function(sel=null, identify=null){
		if (!sel){return false}
		const save_sel = sel;
		let wname = identify || _lizard.rndwave(32, 'def')

		const waiter = {
			'name': wname,
			wait: function(){
				return new Promise(function(resolve, reject){
					const mysel = save_sel;
					let config = { attributes: true, childList: true, subtree: true };
					let callback = (mutationList, observer) => {
						const try_search = document.querySelector(mysel)
						if (try_search != null){
							observer.disconnect()
							delete _waiters_pool[wname]
							resolve(try_search)
						}
					};

					const obsr = new MutationObserver(callback);
					obsr.observe(document.body, config);

					_waiters_pool[wname] = obsr
				});
			},
			abort: function(){
				_waiters_pool[wname].disconnect();
				delete _waiters_pool[wname]
			}
		}

		return waiter
	}

}



// --------------------------------
//         bootleg jquery
// --------------------------------
_lizard.ehtml = function(c){
	const shit = document.createElement('div');
	shit.innerHTML = c;
	return shit.children[0]
}



// --------------------------------
// Delete every n element from an object
// --------------------------------
// st - input string OR array
// nth - every n character
// use - if set to true, will return every n character
// if set to false or not set, will return a string with every n character deleted
// smartass: Works with arrays too
_lizard.delnthelem = function(st, nth, use=false)
{
	if (st.toString() == ''){ return ''};

	let todel = null;
	if (Array.isArray(st)){
		todel = st;
	}else{
		todel = st.toString().split('');
	}

	let nthc = 1
	const delres = []
	for (let count in todel)
	{
		if (use){
			if (nthc != nth){
				nthc += 1
			}else{
				delres.push(todel[count])
				nthc = 1
			}
		}else{
			if (nthc != nth){
				delres.push(todel[count])
				nthc += 1
			}else{
				nthc = 1
			}
		}
	}
	if (Array.isArray(st)){
		return delres
	}else{
		return delres.join('')
	}
}

_lizard.delnthchar = _lizard.delnthelem;


// --------------------------------
//         object lookup
// --------------------------------
{
	_lizard.dict_lookup = {};

	/*
	var json = '{"glossary":{"title":"example glossary","GlossDiv":{"title":"S","GlossList":{"GlossEntry":{"ID":"SGML","SortAs":"SGML","GlossTerm":"Standard Generalized Markup Language","Acronym":"SGML","Abbrev":"ISO 8879:1986","GlossDef":{"para":"A meta-markup language, used to create markup languages such as DocBook.","ID":"44","str":"SGML","GlossSeeAlso":["GML","XML"]},"GlossSee":"markup"}}}}}';

	var js = JSON.parse(json);

	//example of grabbing objects that match some key and value in JSON
	console.log(find_objects(js,'ID','SGML'));
	//returns 1 object where a key names ID has the value SGML

	//example of grabbing objects that match some key in JSON
	console.log(find_objects(js,'ID',''));
	//returns 2 objects since keys with name ID are found in 2 objects

	//example of grabbing obejcts that match some value in JSON
	console.log(find_objects(js,'','SGML'));
	//returns 2 object since 2 obects have keys with the value SGML

	//example of grabbing objects that match some key in JSON
	console.log(find_objects(js,'ID',''));
	//returns 2 objects since keys with name ID are found in 2 objects

	//example of grabbing values from any key passed in JSON
	console.log(find_values(js,'ID'));
	//returns array ["SGML", "44"] 

	//example of grabbing keys by searching via values in JSON
	console.log(find_keys(js,'SGML'));
	//returns array ["ID", "SortAs", "Acronym", "str"] 

	*/

	// From github. Json/object searcher
	_lizard.dict_lookup.find_objects = function(obj, key, val) {
		  var objects = [];
		  for (var i in obj) {
			  if (!obj.hasOwnProperty(i)) continue;
			  if (typeof obj[i] == 'object') {
				  objects = objects.concat(_lizard.dict_lookup.find_objects(obj[i], key, val));    
			  } else 
			  // if key matches and value matches or if key matches and value is not passed
			  // (eliminating the case where key matches but passed value does not)
			  if (i == key && obj[i] == val || i == key && val == '') { //
				  objects.push(obj);
			  } else if (obj[i] == val && key == ''){
				  //only add if the object is not already in the array
				  if (objects.lastIndexOf(obj) == -1){
					  objects.push(obj);
				  }
			  }
		  }
		  return objects;
	}


	// return an array of values that match on a certain key
	_lizard.dict_lookup.find_values = function(obj, key) {
	  var objects = [];
	  for (var i in obj) {
		  if (!obj.hasOwnProperty(i)) continue;
		  if (typeof obj[i] == 'object') {
			  objects = objects.concat(_lizard.dict_lookup.find_values(obj[i], key));
		  } else if (i == key) {
			  objects.push(obj[i]);
		  }
	  }
	  return objects;
	}


	// return an array of keys that match on a certain value
	_lizard.dict_lookup.find_keys = function(obj, val) {
	  var objects = [];
	  for (var i in obj) {
		  if (!obj.hasOwnProperty(i)) continue;
		  if (typeof obj[i] == 'object') {
			  objects = objects.concat(_lizard.dict_lookup.find_keys(obj[i], val));
		  } else if (obj[i] == val) {
			  objects.push(i);
		  }
	  }
	  return objects;
	}
}


// --------------------------------
//         base64 to blob
// --------------------------------
// pass true to return the blob itself
_lizard.b64toblob = function(b64s, raw_blob=false){
	if (b64s == ''){return null}
	const bytes = _lizard.base64DecToArr(b64s.split(',').at(-1))
	const blob = new Blob([bytes]);
	const blobURL = (window.URL || window.webkitURL).createObjectURL(blob);

	if (raw_blob){
		return blob
	}else{
		return blobURL
	}
}


// --------------------------------
// Collect raw text nodes from am element
// --------------------------------
_lizard.collect_text_nodes = function(nd) {
	const element = nd;
	let text = '';
	for (let i = 0; i < element.childNodes.length; ++i){
		if (element.childNodes[i].nodeType === Node.TEXT_NODE){
			text += element.childNodes[i].textContent;
		}
	}
	return text
}


// --------------------------------
//   Compare arrays for equality
// --------------------------------
// returns true if an array contains any element which is not present in another array
// inwhat - array to check against
// what - input array
_lizard.compare_arrays = function(what, inwhat, return_elems=false){
    const magix = what.filter(f => !inwhat.includes(f));
    if (return_elems == true){
    	return magix
    }else{
    	return magix.length > 0
    }
}


// --------------------------------
//        Buffer comparison
// --------------------------------
{
	const _compare_buffers = function(buff2){
		if (this.byteLength != buff2.byteLength) return false;
		const dv1 = new Int8Array(this);
		const dv2 = new Int8Array(buff2);
		for (var i = 0 ; i != this.byteLength ; i++){
			if (dv1[i] != dv2[i]) return false;
		}
		return true;
	}

	for (let bt of _buffer_types){
		bt.prototype.sameAs = _compare_buffers;
	}
}


window.lizard = _lizard;

// todo: is this really needed ?
Object.freeze(window.lizard);


})();


