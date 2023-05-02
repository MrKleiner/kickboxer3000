


// ===================================
//              Base Libs
// ===================================

// Jquery
const $ = window.jQuery = require('./apis/jquery/3_6_0/jquery.min.js');

// filesaverjs
const fsaver = require('./apis/filesaverjs/2_0_4/FileSaver.js');

// Electron File System Access
const fs = require('fs');

// Python-like pathlib
const pathlib = require('pathlib-js').default;
const Path = function(){
	const p = new pathlib(...arguments)
	return p
}

// lizard's toolbox
require('./apis/toybox/toolbox.js')

// Crypto JS
require('./apis/crypto_js/4_1_1/crypto-js.min.js')






// ===================================
//           Define modules
// ===================================

const kbmodules = {};

// ksys = most of the core functions
const ksys = {
	util: {
		translit: require('./sys/transliteration.js'),
		str_ops: require('./sys/string_ops.js'),
	},
	ticker:  require('./sys/ticker.js'),
	fbi:     require('./sys/fbi_logger.js'),
	context: require('./sys/context_manager.js'),
	db:      require('./sys/db_manager.js'),
	btns:    require('./sys/buttons.js'),
};

// Vmix-bound operations, like talker
const vmix = {
	talker: require('./sys/vmix_talker.js'),
	title:  require('./sys/titlectrl.js'),
};






// ===================================
//           Basic core stuff
// ===================================

// Get app root path
function _get_app_root_path(){
	var got_root = new pathlib(__dirname);
	while (true) {
		const exs = got_root.join('roothook.lizard').isFileSync()
		if (exs == true){
			window.sysroot = got_root
			break
		}
		got_root = got_root.parent()
	}
	return got_root
}
const app_root = _get_app_root_path();

// set version in the window header
document.title = 'KickBoxer3000 - v' + JSON.parse(fs.readFileSync(window.sysroot.parent().join('package.json').toString(), {encoding:'utf8', flag:'r'}))['version_native']


// ---------------
//  python shite
// ---------------
const {PythonShell} = require('python-shell');
window.py_common_opts = {
	mode: 'binary',
	pythonPath: str(window.sysroot.join('bins', 'python', 'bin', 'python.exe')),
	pythonOptions: [],
	scriptPath: str(window.sysroot.join('py'))
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
	context.global.prm('been_warned', true)
}







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
ksys.util.sleep = async function jsleep(amt=500, ref='a') {

	return new Promise(function(resolve, reject){
	    window.mein_sleep[ref] = setTimeout(function () {
			resolve(true)
	    }, amt);
	});
}


// ------------------------------
// open a file selection dialogue
// ------------------------------

// returns a promise which resolves a path
ksys.util.ask_file = function()
{
	return new Promise(function(resolve, reject){
		const input = document.createElement('input');
		input.type = 'file';
		input.addEventListener('change', ch => {
			resolve([...input.files])
			input.remove()
			input = null
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
			'credentials': 'omit'
		})
		.catch((error) => {
			console.error(`fetching ${url} resulted in the following errror:`, error);
			resolve({
				'status': 'fail',
				'reason': error,
			})
		});

		if (!response){return}

		const rsp_buff = await response.arrayBuffer();

		// text
		if (ctype == 'text'){
			// const dt = lizard.UTF8ArrToStr(new Uint8Array(rsp_buff))
			resolve({
				'status': 'success',
				'code': response.status,
				'payload': lizard.UTF8ArrToStr(new Uint8Array(rsp_buff)),
			})
		}

		// buffer
		if (ctype == 'bytes'){
			resolve({
				'status': 'success',
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















// ============================================================
// ------------------------------------------------------------
//                        Module Loader
// ------------------------------------------------------------
// ============================================================

const sys_load = function(nm)
{
	// load html layout of the module
	const page = fs.readFileSync(app_root.join('modules_c', nm, `${nm}.html`).toString(), {encoding:'utf8', flag:'r'});
	// display loaded html on the page
	$('#app_sys').html(page);
	// get css of the module
	$('head link#mdstyle')[0].href = app_root.join('modules', nm, `${nm}.css`).toString();
	ksys.context.module_name = nm;

	// refresh context
	ksys.context.module.pull()

	// init load for module
	try{
		if (kbmodules[nm].load){
			kbmodules[nm].load()
		}
	}catch (error){
		console.error('Error occured while loading a module:', error)
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

	// display a warning if it wasn't displayed before
	if (ksys.context.global.cache['been_warned'] != true){
		ksys.fbi.warn_critical('Do not forget to turn on alpha channel on the required outputs (sdi/ndi)!')
	}

	// starting page is ip:port selector
	// this page gets overwritten with the homepage if ip:port is valid
	sys_load('starting_page')

	// ping vmix
	const reach = await vmix.talker.ping()

	// if vmix is not reachable - do not save the IP/port and simply prompt input again
	if (reach == false){
		// display an error
		$('#welcome_screen_title_2').html(`Unable to reach VMIX at <addr>${ksys.util.str_ops.validate(ctx_cache.vmix_ip)}</addr> : <addr>${ksys.util.str_ops.validate(ctx_cache.vmix_port)}</addr>. Please enter a valid ip/port to proceed or ensure that the networking is not malfunctioning (aka rubbish bootleg firewalls, wrong LAN, etc...) and VMIX is running with Web Controller ONN.`)
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

		// load welcome
		// ksys.sys_load('welcome')
		sys_load('football_standard')
	}
}


// init app when document is ready
$(document).ready(function(){
	app_init()
});





















