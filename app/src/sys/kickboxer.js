
// ============================================================
// ------------------------------------------------------------
//                   Core info and functions
// ------------------------------------------------------------
// ============================================================




// define modules

// ksys = most of the core functions
window.ksys = {};

// other sys stuff
window.vmix = {};


// interface for writing/saving files to global or local database
window.db = {};


window.modules = {};




// Electron File System Access
const fs = require('fs');

// Python-like pathlib
const pathlib = require('pathlib-js').default;
// app root path
var got_root = new pathlib(__dirname)
while (true) {
	var exs = got_root.join('roothook.lizard').isFileSync()
	if (exs == true){
		window.sysroot = got_root
		break
	}
	got_root = got_root.parent()
}

// set version in the title
document.title = 'KickBoxer3000 - v' + JSON.parse(fs.readFileSync(window.sysroot.parent().join('package.json').toString(), {encoding:'utf8', flag:'r'}))['version_native']

// Jquery
window.$ = window.jQuery = require('./apis/jquery/3_6_0/jquery.min.js');

// filesaverjs
window.fsaver = require('./apis/filesaverjs/2_0_4/FileSaver.js');


//
// python shite
//
const {PythonShell} = require('python-shell');
window.py_common_opts = {
	mode: 'binary',
	pythonPath: str(window.sysroot.join('bins', 'python', 'bin', 'python.exe')),
	pythonOptions: [],
	scriptPath: str(window.sysroot.join('py'))
};

function shell_end_c(err,code,signal)
{
	if (err) throw err;
	console.log('The exit code was: ' + code);
	console.log('The exit signal was: ' + signal);
	console.log('finished');
}








// ============================================================
// ------------------------------------------------------------
//                             Logger
// ------------------------------------------------------------
// ============================================================

class fbi_logger
{
	// constructor(height, width) {
	constructor() {
		window.print = console.log.bind(window.console);
		window.log = this.module_log
		console.log('Initialized Fbi Logger');
	};


	// module: module name, if found in predef styles - style correspondingly. Else - wrap into []
	// log: an array of objects to log
	module_log(md=null, lg=''){
		// get pure list of stuff to actually log
		var clear_log = [...arguments].slice(1)

		var predef_styles = {
			'skyboxer': {
				'bg': 'rgba(0, 0, 0, 0.0)',
				'fg': '#1F963B',
				'text': '[Skyboxer]'
			},
			'python_sender': {
				'bg': 'rgba(0, 0, 0, 0.0)',
				'fg': '#3852B2',
				'text': '[Python Sender]'
			},
			'vmix_talk': {
				'bg': 'rgba(0, 0, 0, 0.0)',
				'fg': '#C1186C',
				'text': '[Vmix Talker]'
			},
			'modmaker': {
				'bg': 'rgba(0, 0, 0, 0.0)',
				'fg': '#6198CC',
				'text': '[Modmaker]'
			},
			'gameinfo': {
				'bg': 'rgba(0, 0, 0, 0.0)',
				'fg': '#5F881E',
				'text': '[GameInfo]'
			},
			'dboard': {
				'bg': 'rgba(0, 0, 0, 0.0)',
				'fg': '#5C1EB8',
				'text': '[Dashboard]'
			}
		}

		// make the module name
		if (predef_styles.hasOwnProperty(md)){
			var module_name = `%c${predef_styles[md]['text']}`;
			var module_style = `background: ${predef_styles[md]['bg']}; color: ${predef_styles[md]['fg']}`;
		}else{
			var module_name = `[${md}]`;
			var module_style = '';
		}
		
		// absolute genius
		// return [module_name, module_style, ...clear_log]
		print(
			module_name,
			module_style,
			...clear_log
		)

	}

	warn_critical(msg=''){
		$('#logs_place').append(`
			<div class="warning_critical">
				<msg>${msg}</msg>
				<sysbtn onclick="close_warnings()"><span style="font-style: italic">I swear I will not ignore this warning and do what was asked</span></sysbtn>
			</div>
		`);
		$('#logs_place').css('visibility', 'visible')
	}

}
window.fbi = new fbi_logger();



//
// ctrl + r
//
document.addEventListener('keydown', kvt => {
    app_reload_refresh(kvt)
    if (kvt.altKey && kvt.keyCode == 87 && window.current_app_module != 'main_dashboard'){
    	dashboard_app_loader()
    }
});

function app_reload_refresh(evee){
	if (  evee.ctrlKey  &&  evee.keyCode == 82  ){
		location.reload()
	}
}

function clamp(num, min, max) {
  return num <= min 
    ? min 
    : num >= max 
      ? max 
      : num
}





window.mein_sleep = {}
async function jsleep(amt=500, ref='a') {

	return new Promise(function(resolve, reject){
	    window.mein_sleep[ref] = setTimeout(function () {
			resolve(true)
	    }, amt);
	});
}
/*
async function jsleep(amt=500) {
	return new Promise(function(resolve, reject){
	    setTimeout(function () {
			resolve(true)
	    }, amt);
	});

}
*/





// if empty then return empty_string html
window.ksys.str_check = function(st, msg='empty string')
{
	if (str(st).trim() == ''){
		return `<span style="color: gray; user-select: none">${msg}</span>`
	}else{
		return st
	}
}



window.ksys.ensure_exists = function(pt=null, create=true)
{
	// if path is invalid - return false immediately
	if (!pt){return false}

	// if it exists - return true
	if (!fs.existsSync(str(pt))){
		// if it doesnt exist - create if asked and return false
		if (create == true){
			fs.mkdirSync(str(pt))
		}
		return false
	}else{
		return true
	}
}


window.ksys.eval_xml = function(str){
	try{
		return $.parseXML(str)
	}catch{
		return false
	}
	
}










window.ksys.ask_for_file = function()
{
	return new Promise(function(resolve, reject){
		var input = document.createElement('input');
		input.type = 'file';
		input.addEventListener('change', ch => {
			// print(input.files)
			resolve([...input.files])
			input.remove()
			input = null
		});
		input.click();
	});
}











// ============================================================
// ------------------------------------------------------------
//                             Ticker
// ------------------------------------------------------------
// ============================================================







// amount = amount sec
window.ksys.ticker = {};
window.ksys.ticker.sys_pool = {};
window.ksys.ticker.syskill = false;

window.ksys.ticker.spawn = function(params)
{
	var timename = params['name'] ? params['name'] : CryptoJS.SHA256(lizard.rndwave(512, 'flac')).toString();
	var upt_params = params
	if (timename in window.ksys.ticker.sys_pool){
		timename = CryptoJS.SHA256(lizard.rndwave(517, 'flac')).toString();
		upt_params['name'] = timename
	}
	var zick = new kickboxer_ticker(upt_params)
	window.ksys.ticker.sys_pool[timename] = zick;
	return zick
}

window.ksys.ticker.kill_all = function()
{
	for (var tm in window.ksys.ticker.sys_pool){
		try{
			window.ksys.ticker.sys_pool[tm].force_kill()
			delete window.ksys.ticker.sys_pool[tm]
		}catch (error){

		}
	}
}


window.ksys.ticker.pool = function()
{
	var pl = {};
	for (var tm of window.ksys.ticker.sys_pool){
		try{
			pl[tm.name] = tm
		}catch (error){

		}
	}
	return pl
}








// returns a promise wich is resolved after the timer has reached its end naturally AND is not looped

// {
// 	duration = duration of 1 interval in seconds. Default is 5;
// 	name = timer name. Duplicates not allowed. Random name is assigned if duplicate. Random name assigned if null/not passed;
// 	infinite = whether keep ticking forever or not. Default is false;
// 	start = start from a number. Clamped to max-1 if round is true and start exceeds 1 round duration. Default is 0;
// 	speed = tickspeed. msec. Default is 1000 (1 second);
//	step = step to add to ticker. Default is 1;
// 	round = whether to loop over specified interval or not. Default is false;
//	wait = whether to await for callback to complete or not. Default is false;
// 	callback = callback function to call every iteration;
// }

class kickboxer_ticker
{
	constructor(prms=null, defprms={
		'duration': 5,
		'name': null,
		'infinite': false,
		'offset': 0,
		'speed': 1000,
		'round': false,
		'wait': false,
		'callback': null,
		'reversed': false,
		'loopcallback': null
	}){
		//
		// input shit
		//

		// todo: WHAT THE FUCK ????? JUST MERGE TWO OBJECTS !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
		this.duration 	=           prms['duration']    ? prms['duration']  : defprms['duration'];
		this.timer_name =           prms['name']        ? prms['name']      : defprms['name'];
		this.infinite =             prms['infinite']    ? prms['infinite']  : defprms['infinite'];
		this.offset =               prms['offset']      ? prms['offset']    : defprms['offset'];
		this.tickspeed =            prms['speed']       ? prms['speed']     : defprms['speed'];
		this.round =                prms['round']       ? prms['round']     : defprms['round'];
		this.wait_for_callback =    prms['wait']        ? prms['wait']      : defprms['wait'];
		this.callback_func =        prms['callback']    ? prms['callback']  : defprms['callback'];
		this.reversed =             prms['reversed']    ? prms['reversed']  : defprms['reversed'];


		//
		// sys shit
		//

		// state
		this.alive = true;
		this.paused = false;
		this.fired = false;

		// counter
		// this.current_tick = 0 + this.offset;
		this.global_tick = 0 + this.offset;
		this.iteration_tick = 0;
		this.iteration_count = 0;
	}

	fire()
	{
		// useless safety margins ?
		if (!this.callback_func || this.fired == true){return 'dead_timer'}
		
		// mark this timer as fired. It's impossible to call fire() if the timer was already fired
		this.fired = true;

		// thy holy hand grenade
		const self = this;

		return new Promise(async function(resolve, reject){
			while (self.alive == true && (self.global_tick < self.duration || self.infinite == true)){

				// if paused then skip this iteration
				if (self.paused == true){
					// jsleep is very important, because otherwise the while loop would run way too fast
					// and everything will freeze

					// best we can do is divide the tickspeed by 2
					// todo: better way of doing this?
					// fun fact: python suffers of the same issue...
					await jsleep(self.tickspeed / 2)
					continue
				}

				//
				// counting things
				//

				// wait for callback function to complete, if asked
				if (self.wait_for_callback == true){
					await self.callback_func(self.tick)

				}else{
					self.callback_func(self.tick)
				}

				if (self.iteration_tick == self.duration){
					self.iteration_tick = -1;
					self.iteration_count += 1;
				}

				// global timer
				self.global_tick += 1;

				// iteration
				self.iteration_tick += 1;


				// wait before executing next iteration
				await jsleep(self.tickspeed)
			}
			self.alive = false;
			resolve(true)
		});
	}

	get tname(){
		return this.timer_name
	}

	force_kill(){
		this.alive = false;
		return null
	}

	get pause(){
		return this.paused;
	}

	set pause(state='toggle'){
		if (state == 'toggle'){
			this.paused = !this.paused;
		}
		// todo: paranoid...
		if (state == true){
			this.paused = true;
		}
		// todo: paranoid...
		if (state == false){
			if (this.fired == false){
				this.fire()
			}
			this.paused = false;
		}
	}

	get callback(){
		return this.callback_func;
	}

	set callback(cb){
		if (cb){
			this.callback_func = cb;
		}
	}

	get timer_duration(){
		return this.duration;
	}

	set timer_duration(dr){
		if (dr){
			this.duration = dr;
		}
	}

	get tick(){
		return {
			'global': this.reversed ? (this.duration - this.global_tick) : this.global_tick,
			'iteration': (this.reversed ? (this.duration - this.global_tick) : this.global_tick) % this.duration,
			'loops': this.iteration_count,
			'all': this
		}
	}

	set_iteration_tick(tick, trigger_callback=false){
		if (tick){
			this.iteration_tick = tick;
			if (trigger_callback == true){
				this.callback_func(this.tick)
			}
		}
	}

	set_global_tick(tick, trigger_callback=false){
		if (tick){
			this.global_tick = this.reversed ? (this.duration - tick) : tick;
			// let thy = this
			if (trigger_callback == true){
				this.callback_func(this.tick)
			}
		}
	}



}
































// ============================================================
// ------------------------------------------------------------
//                             Buttons
// ------------------------------------------------------------
// ============================================================

class vmix_t_bottuns
{
	// constructor(height, width) {
	constructor() {
		window.vmix_btns = {}
		window.vmix_btns.pool = {}
		console.log('Initialized Buttons System');
		Element.prototype.vmixbtn=function(state=false) {
			if (this.closest('vmixbtn') != null){
				if (state == false){
					this.classList.add('vmixbtn_locked')
				}
				if (state == true){
					this.classList.remove('vmixbtn_locked')
				}
			}
		}
	};

	// register named buttons in a pool
	sync_pool(){
		for (var reg of document.querySelectorAll('vmixbtn[btname]')){
			window.vmix_btns.pool[reg.getAttribute('btname')] = reg
		}
	}

	get pool(){
		// todo: temp: Resync pool before getting it
		this.sync_pool()
		return window.vmix_btns.pool
	}

}
window.btns = new vmix_t_bottuns();














































// ============================================================
// ------------------------------------------------------------
//                           Talker
// ------------------------------------------------------------
// ============================================================

class vmix_app_talker
{

	constructor() {
		print('Initialized Talker');
	};




	// ============================================================
	// ------------------------------------------------------------
	//                           VMIX Talker
	// ------------------------------------------------------------
	// ============================================================

	// takes a dict of parameters
	async vmix_talk(rq={})
	{
		return new Promise(function(resolve, reject){
			var prms = new URLSearchParams(rq)

			// get random colour and id for this request
			var rnd_colour = `color: hsl(${357 % window.crypto.getRandomValues(new Uint32Array(1))[0]}deg, 52%, 47%);`;
			var rnd_id = window.crypto.getRandomValues(new Uint16Array(1))[0]

			log('vmix_talk', rnd_id, 'Talking to', window.vmix.app_context.vmix_ip, ':', window.vmix.app_context.vmix_port, rq, prms.toString())

			fetch(`http://${window.vmix.app_context.vmix_ip}:${window.vmix.app_context.vmix_port}/API/?${prms.toString()}`, {
			    'headers': {
			        'accept': '*/*',
			        'cache-control': 'no-cache',
			        'pragma': 'no-cache',
			        'Access-Control-Allow-Origin': '*'
			        // 'Access-Control-Allow-Methods': 'DELETE, POST, GET, OPTIONS',
			        // 'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
			    },
			    'method': 'GET',
			    'mode': 'cors',
			    'credentials': 'omit'
			})
			.then(function(response) {
				log('vmix_talk', rnd_id, 'Status:', response.status)
			    if (response.status != 200){
			    	resolve(false)
			    }
			    response.arrayBuffer().then(function(data) {
			    	var dt = lizard.UTF8ArrToStr(new Uint8Array(data))
			    	log('vmix_talk', rnd_id, 'Data:', dt)
			    	resolve(dt)
			    });
			})
			.catch((error) => {
				resolve(false)
			});
		});
	}









	// ============================================================
	// ------------------------------------------------------------
	//                           Python Talker
	// ------------------------------------------------------------
	// ============================================================

	// Takes action to be executed
	// A payload
	async py_talk(act='', pl={})
	{
		return new Promise(function(resolve, reject){
			let shell = new PythonShell('gateway.py', window.py_common_opts);
			var dtstorage = null
			var mkpayload = JSON.stringify({
				'action': act,
				'payload': pl
			})
			print(mkpayload)
			shell.send(mkpayload);

			shell.stdout.on('data', function (message) {
			    dtstorage = message
			});
			shell.end(function (err,code,signal) {
				// shell_end_c(err,code,signal)
				// print(lizard.UTF8ArrToStr(window.sexmsg))
				print(dtstorage)
				var converted = lizard.UTF8ArrToStr(dtstorage)
				// print(converted)
				resolve(converted)
			});
		});
	}









	// get current vmix project XML
	async project(raw=false){
		if (raw == true){
			return await this.vmix_talk({'Function': ''})
		}else{
			return $.parseXML(await this.vmix_talk({'Function': ''}))
		}
	}

	async ping(){
		var pinger = await this.vmix_talk({'Function': ''})
		if (pinger != false){
			return true
		}else{
			return false
		}
	}



}
window.talker = new vmix_app_talker();




// simply compares text and "function completed successfully"
window.ksys.vmix_ok = function(txt){
	if (!txt){return false}
	if (txt.trim() == 'Function completed successfully.'){
		return true
	}else{
		return false
	}
}






































// ============================================================
// ------------------------------------------------------------
//                        Context Manager
// ------------------------------------------------------------
// ============================================================



//
// modern shite
//

// user
window.context = {};
window.context.global = {};
window.context.module = {};
// storing files
window.context.module.db = {};
// window.context.db = {};

// system
// this is where actual parameters are stored and this is where they're actually written to
window.vmix.app_context = {};
window.vmix.module_context = {};





// -------------------------------
// 			Global context
// -------------------------------

// get/set parameter
window.context.global.prm = function(key=null, value=undefined, dosave=true){

	// if value is undefined, then it means that we're only getting a parameter
	if (value == undefined){
		return window.vmix.app_context[key]
	}
	var remap_this = this;
	// if defined - set and maybe save
	window.vmix.app_context[key] = value;
	if (dosave == true){
		window.context.global.save()
	}
}


// save context
window.context.global.save = function(){

	// ensure that the destination folder exists
	var context_file = window.sysroot.join('db', 'global', 'context.ct')
	ksys.ensure_exists(context_file.dirname)

	fs.writeFileSync(str(context_file), JSON.stringify(window.vmix.app_context, null, 4))
	print('Saved Global Context')

	/*
	return new Promise(function(resolve, reject){
		var rsp = await talker.py_talk('save_context', window.vmix.app_context)
		// var resp = lizard.UTF8ArrToStr(new Uint8Array(rsp))
		print('save response:', rsp)
		resolve(rsp)
	});
	*/
}


// load fresh context from disk into memory
window.context.global.pull = function(){
	var context_file = window.sysroot.join('db', 'global', 'context.ct')

	if (ksys.ensure_exists(context_file, false)){
		var ld_context = JSON.parse(fs.readFileSync(str(context_file), {encoding:'utf8', flag:'r'}))
		window.vmix.app_context = ld_context;
		return ld_context
	}else{
		return {}
	}
}



// returns readonly dict of parameters
window.context.global.read = function(){
	// todo: there are better ways of duplicating shit
	var dupli = {}
	for (var k in window.vmix.app_context){
		dupli[k] = window.vmix.app_context[k]
	}
	return dupli
}














// -------------------------------
// 			Module context
// -------------------------------

// get/set parameter
window.context.module.prm = function(key=null, value=undefined, dosave=true){

	// if value is undefined, then it means that we're only getting a parameter
	if (value == undefined){
		return window.vmix.module_context[key]
	}

	// if defined - set and maybe save
	window.vmix.module_context[key] = value;
	if (dosave == true){
		window.context.module.save()
	}
}


// save context
window.context.module.save = function(){

	var target_folder = window.sysroot.join('db', 'module', window.context.module.name)
	// ensure that the destination folders exists
	ksys.ensure_exists(target_folder.dirname)
	ksys.ensure_exists(target_folder)

	var modpath = window.sysroot.join('db', 'module', window.context.module.name, 'context.ct')
	fs.writeFileSync(str(modpath), JSON.stringify(window.vmix.module_context, null, 4))
	print('Saved Module Context')
}


// load fresh context from disk into memory
window.context.module.pull = function(){
	var context_file = window.sysroot.join('db', 'module', window.context.module.name, 'context.ct');

	// only try loading it if it exists
	if (ksys.ensure_exists(context_file, false)){
		var ld_context = JSON.parse(fs.readFileSync(str(context_file), {encoding:'utf8', flag:'r'}))
		window.vmix.module_context = ld_context;
		print('Pulled Module Context')
		return ld_context
	}else{
		return {}
	}
}



// returns readonly dict of parameters
window.context.module.read = function(){
	// todo: there are better ways of duplicating shit
	var dupli = {};
	for (var k in window.vmix.module_context){
		dupli[k] = window.vmix.module_context[k]
	}
	return dupli
}






















// ============================================================
// ------------------------------------------------------------
//                        Database Manager
// ------------------------------------------------------------
// ============================================================

//
// module-level
//
window.db.module = {};

// read file
window.db.module.read = function(fname=null){
	if (fname){
		var file_target = window.sysroot.join('db', 'module', window.context.module.name, fname)
		// ensure that the destination file exists
		if (ksys.ensure_exists(file_target, false)){
			return fs.readFileSync(str(file_target), {encoding:'utf8', flag:'r'})
		}else{
			print('Requested to read non-existent file', str(file_target))
			return null
		}
	}else{
		print('Requested to read invalid file from module database:', fname)
		return null
	}
}

// write file
window.db.module.write = function(fname=null, data=null){
	var module_loc = window.sysroot.join('db', 'module', window.context.module.name)

	if (fname && data){
		// ensure that the destination folder exists
		ksys.ensure_exists(module_loc)
		fs.writeFileSync(str(window.sysroot.join('db', 'module', window.context.module.name, fname)), data)
		return true
	}else{
		print('Requested to write invalid file to module database:', fname)
		return null
	}
}












































// ============================================================
// ------------------------------------------------------------
//                        Mapper
// ------------------------------------------------------------
// ============================================================

window.ksys.map = {};

// takes map element and src XML
// important todo: better piping in case of specials
window.ksys.map.pipe = function(el, src)
{
	var map_entries = {
		wipe: function(){
			for (var wp of el.querySelectorAll('from val')){
				wp.innerHTML = '<span style="color: gray; user-select: none">empty string</span>'
			}
		}
	}

	var looper = []

	for (var entry of el.querySelectorAll('entry'))
	{
		let solid = entry;

		var xmlsrc_text = null;

		let select_from_src = src.querySelector(solid.querySelector('from input').value)
		if (select_from_src){
			var xmlsrc_text = select_from_src.textContent;
		}

		looper.push({
			'data': xmlsrc_text,
			'target': solid.querySelector('to input').value.trim(),
			'special': solid.querySelector('input[special]').value,
			confirm_from: function(overwrite=null){
				solid.querySelector('from val').innerHTML = overwrite || ksys.str_check(xmlsrc_text);
				solid.querySelector('from inf').setAttribute('success', true);
				solid.querySelector('from inf').removeAttribute('fail');
			},
			confirm_to: function(overwrite=null){
				solid.querySelector('to val').innerHTML = overwrite || ksys.str_check(xmlsrc_text);
				solid.querySelector('to inf').setAttribute('success', true);
				solid.querySelector('to inf').removeAttribute('fail');
			},
			deny: function(reason='invalid_string'){
				solid.querySelector('from val').innerHTML = ksys.str_check('', 'not found');
				solid.querySelector('from inf').setAttribute('fail', true);

				solid.querySelector('to val').innerHTML = ksys.str_check('');
				// solid.querySelector('to inf').setAttribute('fail', true);
			}
		})

	}
	map_entries['loop'] = looper
	return map_entries
}


// ensures all maps are there n shit
window.ksys.map.resync = function(el, src)
{
	for (var resync of document.querySelectorAll('xmlmap entry:not(xmlmap entry[init])')){
		if (resync.hasAttribute('init')){continue}
		// var special = resync.querySelector('')
		resync.replaceWith(lizard.ehtml(`
			<entry init>
				<input special type="text" placeholder="Special" value="${resync.getAttribute('special') || ''}">

				<from>
					<inf>From</inf>
					<input spellcheck="false" type="text" value="${resync.querySelector('from').innerText.trim()}">
					<val from>nil</val>
				</from>

				<between></between>

				<to>
					<inf>To</inf>
					<input spellcheck="false" type="text" value="${resync.querySelector('to').innerText.trim()}">
					<val to>nil</val>
				</to>
			</entry>
		`))
	}
}



// rips ifo from the map
window.ksys.map.rip = function(el)
{
	if (el.closest('xmlmap') == null){
		return null
	}
	var map_entries = []

	for (var entry of el.querySelectorAll('entry'))
	{
		map_entries.push({
			'from': entry.querySelector('from input').value,
			'to': entry.querySelector('to input').value,
			'special': entry.querySelector('input[special]').value
		})

	}
	return map_entries
}



// overwrites shite
// takes an array of dicts:
// {
// 'from': '',
// 'to': '',
// 'special': ''
// }

window.ksys.map.load = function(el, info=null)
{
	if (el.closest('xmlmap') == null || info == null){
		return null
	}

	// wipe previous stuff
	el.innerHTML = '';

	for (var resync of info){
		el.append(lizard.ehtml(`
			<entry init>
				<input special type="text" placeholder="Special" value="${resync['special'] || ''}">

				<from>
					<inf>From</inf>
					<input spellcheck="false" type="text" value="${resync['from'].trim() || ''}">
					<val from>nil</val>
				</from>

				<between></between>

				<to>
					<inf>To</inf>
					<input spellcheck="false" type="text" value="${resync['to'].trim() || ''}">
					<val to>nil</val>
				</to>
			</entry>
		`))
	}
}






































// ============================================================
// ------------------------------------------------------------
//                        Module Loader
// ------------------------------------------------------------
// ============================================================

window.ksys.sys_load = function(nm)
{
	var page = fs.readFileSync(window.sysroot.join('modules_c', nm, `${nm}.html`).toString(), {encoding:'utf8', flag:'r'});
	// var pagestyle = fs.readFileSync(window.sysroot.join('modules', nm, `${nm}.css`).toString(), {encoding:'utf8', flag:'r'});
	$('#app_sys').html(page)
	// $('#module_styling').text(pagestyle)
	$('head link#mdstyle')[0].href = window.sysroot.join('modules', nm, `${nm}.css`).toString()
	window.context.module.name = nm;
	// pull_cached_data()

	// resync map objects
	window.ksys.map.resync()

	// get context
	context.module.pull()

	// init load for module
	try{
		window.modules[nm].load()
	}catch (error){

	}
}













// ============================================================
// ------------------------------------------------------------
//                        Get Url Contents
// ------------------------------------------------------------
// ============================================================


// text or bytes. Default = text
window.ksys.url_get = async function(url=null, ctype='text'){
	return new Promise(async function(resolve, reject){

		const response = await
		fetch(url, {
			'headers': {
				'accept': '*/*',
				'cache-control': 'no-cache',
				'pragma': 'no-cache'
			},
			'method': 'GET',
			'mode': 'cors',
			'credentials': 'omit'
		}).catch((error) => {
			console.error(`fetching ${url} resulted in the following errror:`, error);
			resolve({
				'status': 'fail',
				'reason': error
			})
		});

		if (!response){return}

		const rsp_buff = await response.arrayBuffer();

		// text
		if (ctype == 'text'){
			const dt = lizard.UTF8ArrToStr(new Uint8Array(rsp_buff))
			resolve({
				'status': 'success',
				'code': response.status,
				'payload': dt
			})
		}

		// buffer
		if (ctype == 'bytes'){
			resolve({
				'status': 'success',
				'code': response.status,
				'payload': new Uint8Array(rsp_buff)
			})
		}

	});
}


























// ============================================================
// ------------------------------------------------------------
//                        System Init
// ------------------------------------------------------------
// ============================================================


// init app when document is ready
$(document).ready(function(){
	app_init()
});


// always start from the welcome page
// check if vmix is reachable
// if reachable - load module
async function app_init()
{
	// load latest config into ram
	var loadlast = context.global.pull()

	// display a warning if not were warned before
	if (context.global.read()['been_warned'] != true){
		fbi.warn_critical('Do not forget to turn on alpha channel on the required outputs (sdi/ndi)!')
	}

	ksys.sys_load('starting_page')

	// ping vmix
	var reach = await talker.ping()

	// if vmix is not reachable - do not save the IP/port and simply prompt input again
	if (reach == false){
		// load the starting page

		// apply info
		$('#welcome_screen_title_2').html(`Unable to reach VMIX at <addr>${ksys.str_check(loadlast.vmix_ip)}</addr> : <addr>${ksys.str_check(loadlast.vmix_port)}</addr>. Please enter a valid ip/port to proceed or ensure that the networking is not malfunctioning (aka rubbish bootleg firewalls, wrong LAN, etc...) and VMIX is running with Web Controller ONN.`)
		$('startpage').append(`
			<div id="welcome_enter_info">
				<input style="color: white" type="text" placeholder="IP (absolute)" ip>:<input style="color: white" type="number" placeholder="Port" port>
			</div>
			<sysbtn style="margin-top: 10px" onclick="window.modules.starting_page.save_creds()" id="welcome_apply_creds">Apply</sysbtn>
		`)
		return
	}else{
		// if vmix is reachable - display a list of available systems

		// load welcome
		ksys.sys_load('welcome')
	}
}












function close_warnings()
{
	$('#logs_place').css('visibility', 'hidden')
	$('#logs_place').empty()
	context.global.prm('been_warned', true)
}







