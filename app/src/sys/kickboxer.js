// Long story short: fuck javascript
window.self = undefined;
// self = undefined;



// todo:

// The default folder "db" is not present when pulling clean repo.
// Either validate its existence on every application startup or whatever.

// Finally move all the icons needed for install into the repo folder

// The repo is also missing the release folder




// ===================================
//              Base Libs
// ===================================

// Jquery
const $ = window.jQuery = require('./apis/jquery/3_6_0/jquery.min.js');

// filesaverjs
const fsaver = require('./apis/filesaverjs/2_0_4/FileSaver.js');

// Electron File System Access
const fs = require('fs');

// Basically, sockets
const dgram = require('dgram');

// os module, just like in python
const os_em = require('os');

// Python-like pathlib
// https://mauricepasternak.github.io/pathlib-js/
const pathlib = require('pathlib-js').default;
const Path = function(){
	return (new pathlib(...arguments))
}

// lizard's toolbox
require('./apis/toybox/toolbox.js');

// Crypto JS
require('./apis/crypto_js/4_1_1/crypto-js.min.js');



// ===================================
//           Define modules
// ===================================

// const kbmodules = {};

// ksys = most of the core functions
const ksys = {
	util: {
		cls_pwnage: require('./sys/class_pwnage.js'),
		// translit: require('./sys/transliteration.js'),
		str_ops: require('./sys/string_ops.js'),
	},
	ticker:   require('./sys/ticker.js'),
	fbi:      require('./sys/fbi_logger.js'),
	context:  require('./sys/context_manager.js'),
	db:       require('./sys/db_manager.js'),
	btns:     require('./sys/buttons.js'),
	tplates:  require('./sys/template_util.js'),
	strf:     require('./sys/str_format_gui.js'),
	pgview:   require('./sys/pgview.js'),
	tabsys:   require('./sys/tabsys.js'),
	hintsys:  require('./sys/hintsys.js'),
	info_msg: require('./sys/info_msg_sys.js'),
	switches: require('./sys/switches.js'),
	// Global events listeners
	binds:   {},
};



// Vmix bound operations, like talker
const vmix = {
	talker: require('./sys/vmix_talker.js'),
	title:  require('./sys/titlectrl.js'),
	util: {
		
	}
};






// ===================================
//           Basic core stuff
// ===================================

// Get app root path
// todo: this can be improved
function _get_app_root_path(){
	let got_root = Path(__dirname);
	while (true) {
		const exs = got_root.join('roothook.lizard').isFileSync()
		if (exs == true){
			break
		}
		got_root = got_root.parent()
	}
	return got_root
}
const app_root = _get_app_root_path();

// set version in the window header
// document.title = 'KickBoxer3000 - v' + JSON.parse(fs.readFileSync(app_root.parent().join('package.json').toString(), {encoding:'utf8', flag:'r'}))['version_native']
document.title = 'KickBoxer3000 - v' + JSON.parse(app_root.parent().join('package.json').readFileSync('utf-8'))['version_native']



// ---------------
//  python shite
// ---------------
const {PythonShell} = require('python-shell');
window.py_common_opts = {
	mode: 'binary',
	pythonPath: str(app_root.join('bins', 'python', 'bin', 'python.exe')),
	pythonOptions: [],
	scriptPath: str(app_root.join('py'))
};

function shell_end_c(err,code,signal)
{
	if (err) {throw err};
	console.log('The exit code was: ' + code);
	console.log('The exit signal was: ' + signal);
	console.log('finished');
}

// close the initial warning
function close_warnings()
{
	$('#logs_place').css('visibility', 'hidden')
	$('#logs_place').empty()
	ksys.context.global.prm('been_warned', true)
}


// ---------------
//  global listener binds
// ---------------
document.addEventListener('mousemove', evt => {
	ksys.binds?.mousemove?.(evt)
});
document.addEventListener('mousedown', evt => {
	ksys.binds?.mousedown?.(evt)
});
document.addEventListener('mouseup', evt => {
	ksys.binds?.mouseup?.(evt)
});







// ============================================================
// ------------------------------------------------------------
//                         Basic utils
// ------------------------------------------------------------
// ============================================================


// -------------------------
//  clamp number to a range
// -------------------------
ksys.util.clamp = function(num, min, max) {
  return num <= min 
    ? min 
    : num >= max 
      ? max 
      : num
}


// -------------------------
//          eval xml
// -------------------------
ksys.util.eval_xml = function(xml){
	try{
		const parser = new DOMParser();
		const doc = parser.parseFromString(xml, 'application/xml');
		return doc
	}catch (e){
		console.error('Tried evaluating invalid xml:', e)
		return null
	}
}


// -------------------------
//      sleep for n ms
// -------------------------
ksys.util.sleep = function(amt=500, ref='a') {

	return new Promise(function(resolve, reject){
	    // window.mein_sleep[ref] = setTimeout(function () {
	    const abc = setTimeout(function () {
			resolve(true)
	    }, amt);
	});
}


// ------------------------------
// open a file selection dialogue
// ------------------------------

// returns a promise which resolves into a path
// multiple - whether to return an array of files or first file only
ksys.util.ask_file = function(multiple=false)
{
	return new Promise(function(resolve, reject){
		let input = document.createElement('input');
		input.type = 'file';
		input.addEventListener('change', ch => {
			resolve(multiple ? [...input.files] : input.files[0]);
			input.remove();
			input = null;
		});
		input.click();
	});
}


// todo: this is broken
ksys.util.ask_folder = function(multiple=false)
{
	return new Promise(function(resolve, reject){
		let input = document.createElement('input');
		input.type = 'file';
		input.setAttribute('webkitdirectory', true)
		input.addEventListener('change', ch => {
			resolve(multiple ? [...input.files] : input.files[0]);
			input.remove();
			input = null;
		});
		input.click();
	});
}


// ------------------------------
//     get contents of a url
// ------------------------------

// url = request URL
// ctype = text|bytes (default to text)
ksys.util.url_get = async function(url=null, ctype='text'){
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
			'credentials': 'omit',
		})
		.catch((error) => {
			console.error(`Fetching ${url} resulted in the following errror:`, error);
			resolve({
				'status': 'fail',
				'reason': error,
			})
		});

		print(response)

		// if (!response){return}
		if (!response){
			resolve({
				'status': 'fail',
				'reason': 'unknown',
			})
			return
		}
		if (!response.ok){
			resolve({
				'status': 'fail',
				'reason': 'unknown',
				'code': response.status,
				'details': response,
			})
			return
		}

		const rsp_buff = await response.arrayBuffer();

		// text
		if (ctype == 'text'){
			// const dt = lizard.UTF8ArrToStr(new Uint8Array(rsp_buff))
			resolve({
				'status': 'ok',
				'code': response.status,
				'payload': lizard.UTF8ArrToStr(new Uint8Array(rsp_buff)),
			})
		}

		// buffer
		if (ctype == 'bytes'){
			resolve({
				'status': 'ok',
				'code': response.status,
				'payload': new Uint8Array(rsp_buff),
			})
		}

	});
}


// ------------------------------
// ensure that the folder exists
// ------------------------------
ksys.util.ensure_folder_exists = function(pt=null, create=true){
	// if path is invalid - return false immediately
	if (!pt){
		console.warn('Checked for invalid path', pt)
		return false
	}

	// if it exists - return true
	if (!fs.existsSync(str(pt))){
		// if it doesnt exist - create if asked and return false
		if (create == true){
			fs.mkdirSync(str(pt), {recursive: true})
		}
		return false
	}else{
		return true
	}
}


// simply compares text and "function completed successfully"
ksys.util.vmix_ok = function(txt){
	if (!txt){return false}
	if (txt.trim() == 'Function completed successfully.'){
		return true
	}else{
		return false
	}
}


// Start listening for the keys pressed
// and return the first one to be pushed
ksys.util.get_key = function(){
	return new Promise(function(resolve, reject){
		$('.__kb_shadow_input').remove();
		const shadow_input = $(`
		<input
			class="__kb_shadow_input"
			type="text"
			style="
				position: fixed;
				opacity: 0;
				z-index: -99999;
				width: 0px;
				height: 0px;
			"
		>`)[0]

		shadow_input.onblur = function(){
			try{
				resolve(null)
				shadow_input.remove()
				print('Resolving:', null)
			}catch (e){}
		}
		shadow_input.onkeydown = function(evt){
			resolve(evt)
			try{
				shadow_input.remove()
			}catch(e){};
			print('Resolving:', evt)
		}

		document.body.append(shadow_input)

		shadow_input.focus()
	});
}

// Get local ipv4 address
// This is so retarded...
ksys.util.get_local_ipv4_addr = function(octets=true){
	// important todo: Fix this.
	return ksys.context.global.cache.atat_return_addr;

	const interfaces = os_em.networkInterfaces();
	for (const interfaceName in interfaces) {
		const addresses = interfaces[interfaceName];
		for (const address of addresses) {
			if (address.family === 'IPv4' && !address.internal) {
				if (octets){
					return address.address.split('.').map(function(e){return int(e)});
				}else{
					return address.address
				}
			}
		}
	}
	return false
}


ksys.util.resolve_object_path = function(tgt_obj, tgt_path){
	let last = tgt_obj;
	for (const p of tgt_path){
		last = last?.[p.trim()];
	}

	return last
}


// swap nodes
Element.prototype.swapWith = function(tgt_node) {
	const temp = document.createComment('');
	this.replaceWith(temp)
	tgt_node.replaceWith(this)
	temp.replaceWith(tgt_node)
}


// Set position of an element from an event
Element.prototype.ClientPosFromEvent = function(evt, lock_x=false, lock_y=false) {
	if (evt == null){
		this.style.left = null;
		this.style.top = null;
		return
	}
	if (!lock_x){
		this.style.left = `${evt.clientX}px`;
	}
	if (!lock_y){
		this.style.top = `${evt.clientY}px`;
	}
}

// Set position of an element from an event
Element.prototype.PagePosFromEvent = function(evt, lock_x=false, lock_y=false) {
	if (evt == null){
		this.style.left = null;
		this.style.top = null;
		return
	}
	if (!lock_x){
		this.style.left = `${evt.pageX}px`;
	}
	if (!lock_y){
		this.style.top = `${evt.pageY}px`;
	}
}

// FUCK JAVASCRIPT
// Pro tip: this is already in the toolbox
/*
Set.prototype.at = function(index) {
	if (Math.abs(index) > this.size){
		return null;
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
*/







// ============================================================
// ------------------------------------------------------------
//                        Module Loader
// ------------------------------------------------------------
// ============================================================

// important todo: Would it be possible to make this function async?
// Without breaking everything up the call stack?
// AT-AT ticker is the first candidate to want this to be async.
const sys_load = function(nm, save_state=true)
{
	print('Trying to load', nm, save_state)
	// load html layout of the module
	const page = fs.readFileSync(
		app_root.join('modules_c', nm, `${nm}.html`).toString(), {encoding:'utf8', flag:'r'}
	);
	// display loaded html on the page
	$('#app_sys').html(page);
	// get css of the module
	$('head link#mdstyle')[0].href = app_root.join('modules_c', nm, `${nm}.css`).toString();
	ksys.context.module_name = nm;

	// save last loaded module to the context
	if (save_state){
		ksys.context.global.prm('last_module', nm)
	}

	// refresh context cache
	ksys.context.module.pull()

	// refresh global context
	ksys.context.global.pull()

	// resync buttons
	ksys.btns.resync()

	// resync string formatting
	ksys.strf.resync()

	// resync tabs
	ksys.tabsys.resync()

	// Restart KB AT-AT
	ksys.ticker.kb_at.sys_restart()

	// resync switches
	ksys.switches.resync()

	// wipe binds
	ksys.binds = {};

	// images are not draggable by default
	// Todo: there's a chromium-only CSS property, that does this.
	$('img:not(img[candrag])').attr('draggable', false);

	// If requested module has a "load" function - execute it
	try{
		const module_loader = kbmodules[nm]?.load;

		if (module_loader){
			module_loader()
		}else{
			console.warn('Module', nm, `doesn't has a load function`)
		}
	}catch (error){
		console.error('Error occured while loading a module:', error)
		console.trace(error)
	}
}





// ============================================================
// ------------------------------------------------------------
//                        System Init
// ------------------------------------------------------------
// ============================================================

// always start from the welcome page
// check if vmix is reachable
// if reachable - load module
async function app_init()
{
	// load global context
	const ctx_cache = ksys.context.global.pull()

	// patch-based system: The base is empty by default.
	// Patch has to be aplied immediately after installation
	// Therefore, check whether this is a raw base or not
	if (app_root.join('raw_base_is.bad').isFileSync()){
		document.body.style.pointerEvents = 'none';
		ksys.fbi.warn_critical(
			'The current installation is a raw base. Patch has to be applied. Close the controller and apply the patch.'
		)
		return
	}

	// display a warning if it wasn't displayed before
	// todo: this is basically useless
	if (ksys.context.global.cache['been_warned'] != true){
		ksys.fbi.warn_critical(
			'Do not forget to turn on alpha channel on the required outputs (sdi/ndi)!'
		)
	}

	// pre-index button icons
	await ksys.btns.icon_pre_load()

	// Create db folder if it doesnt exist
	ksys.util.ensure_folder_exists(app_root.join('db'))

	// starting page is ip:port selector
	// this page gets overwritten with the homepage if ip:port is valid
	sys_load('starting_page', false)

	// init pgview
	ksys.pgview.reload()

	// ping vmix
	const reach = await vmix.talker.ping()

	// modkey hints
	// todo: this is obsolete
	ksys.hintsys.reg_modkey_hint('Control', 'CTRL + R - Reload controller', false)
	ksys.hintsys.reg_modkey_hint('Alt', 'ALT + W - Back to homepage', false)


	// if vmix is not reachable - do not save the IP/port and simply prompt input again
	if (reach == false){
		// display an error
		$('#welcome_screen_title_2').html(
			`Unable to reach VMIX at <addr>${ksys.util.str_ops.validate(ctx_cache.vmix_ip)}</addr> : <addr>${ksys.util.str_ops.validate(ctx_cache.vmix_port)}</addr>. Please enter a valid ip/port to proceed or ensure that the networking is not malfunctioning (aka rubbish bootleg firewalls, wrong LAN, etc...) and VMIX is running with Web Controller ONN.`
		)
		$('startpage').append(`
			<div id="welcome_enter_info">
				<input style="color: white" type="text" placeholder="IP (absolute)" ip>:<input style="color: white" type="number" placeholder="Port" port>
			</div>
			<sysbtn style="margin-top: 10px" onclick="kbmodules.starting_page.save_creds()" id="welcome_apply_creds">Apply</sysbtn>
		`)
		return
	}else{
		// add ip:port to the window title
		document.title = `${document.title}  |  ${ctx_cache.vmix_ip}:${ctx_cache.vmix_port}`;
		// if vmix is reachable - display a list of available systems
		// OR load previously active module
		if (ctx_cache.last_module){
			sys_load(ctx_cache.last_module)
		}else{
			sys_load('welcome', false)
		}
		// sys_load('welcome', false)
	}
}


// init app when document is ready
$(document).ready(function(){
	app_init()
});













// ============================================================
// ------------------------------------------------------------
//                  Going back to selector page
// ------------------------------------------------------------
// ============================================================

// alt + w
document.addEventListener('keydown', evt => {
	if (evt.which == 87 && evt.altKey){
		sys_load('welcome')
	}
});





