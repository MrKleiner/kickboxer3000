// Long story short: fuck javascript
window.self = undefined;
// self = undefined;

window.print = console.log;

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

// same as python: import socket
const dgram = require('dgram');

// same as python: import os
const os_em = require('os');

// http electron module
const http_em = require('http');

// Electron's crypto module
const crypto_em = require('crypto');

// Subprocess like in python
// const { spawn } = require('child_process')
const { spawn, execFile , execFileSync } = require('child_process')
const child_proc = spawn;

// Fuck you
const { ipcRenderer } = require('electron');

// Python-like pathlib
// https://mauricepasternak.github.io/pathlib-js/
const pathlib = require('pathlib-js').default;
/*
	const Path = function(){
		return (new pathlib(...arguments))
	}
*/
const Path = function(){
	const cls = new pathlib(...arguments);

	cls.is_relative_to = function(target){
	    const stack = Path(cls).parts();
	    const parent = str(target);

	    while (stack.length){
	        const current = str(Path(stack.join('/')));
	        if (current == parent){
	            return true;
	        }
	        stack.pop();
	    }

	    return false;
	}

	return cls;
}

// lizard's toolbox
require('./apis/toybox/toolbox.js');

// Crypto JS
require('./apis/crypto_js/4_1_1/crypto-js.min.js');

// Get app root path.
// This has to be done BEFORE loading modules,
// because some modules make use of this.
const app_root = (function(){
	const stack = Path(__dirname).parts();

	while (stack.length){
		const tgt = Path(stack.join('/')).join('roothook.lizard');
		if (tgt.isFileSync()){
			return tgt.parent()
		}

		stack.pop();
	}

	alert(
		`FATAL: Couldn't launch Kickboxer 3000: Unable to locate the app's root dir.`
	)

	console.error(
		`Failed to locate app's root:`,
		__dirname,
		Path(__dirname),
	);
	throw new Error(`Failed to locate app's root`);
})()


// ===================================
//           Define modules
// ===================================

// todo: this is retarded
const ksys_placeholder = function(placeholder){
	return new Proxy({}, new class{
		get(target, prop, receiver){
			return placeholder()[prop];
		}
	})
}

// ksys = most of the core functions
const ksys = {
	util: {
		cls_pwnage: require('./sys/class_pwnage.js'),
		str_ops:    require('./sys/string_ops.js'),
		// translit: require('./sys/transliteration.js'),
	},
	ticker:         require('./sys/ticker.js'),
	fbi:            require('./sys/fbi_logger.js'),
	context:        require('./sys/context_manager.js'),
	db:             require('./sys/db_manager.js'),
	btns:           require('./sys/buttons.js'),
	tplates:        require('./sys/template_util.js'),
	strf:           require('./sys/str_format_gui.js'),
	pgview:         require('./sys/pgview.js'),
	tabsys:         require('./sys/tabsys.js'),
	hintsys:        require('./sys/hintsys.js'),
	info_msg:       require('./sys/info_msg_sys.js'),
	switches:       require('./sys/switches.js'),
	packer_md:      require('./sys/packer.js'),
	gtzip_wrangler: require('./sys/gtzip_wrangler.js'),
	sequencer:      require('./sys/sequencing.js'),

	// Global events listeners
	binds:   {},
};

// todo: this is getting out of hand
// ksys.gtzip_wrangler = require('./sys/gtzip_wrangler.js');


// VMIX-bound operations, like talker
const _vmix_title_util = require('./sys/titlectrl.js');

const vmix = {
	talker: require('./sys/vmix_talker.js'),
	title:  _vmix_title_util.VMIXTitle,
	util:   _vmix_title_util,
};






// ===================================
//           Basic core stuff
// ===================================

// set version in the window header
// document.title = 'KickBoxer3000 - v' + JSON.parse(fs.readFileSync(app_root.parent().join('package.json').toString(), {encoding:'utf8', flag:'r'}))['version_native']
document.title = 'KickBoxer3000 - v' + JSON.parse(app_root.parent().join('package.json').readFileSync())['version_native']



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
ksys.util.eval_xml = function(xml_str){
	try{
		const parser = new DOMParser();
		return parser.parseFromString(xml_str, 'application/xml');
	}catch (e){
		console.error('Tried evaluating invalid xml:', e, xml_str);
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
ksys.util.ask_file = function(multiple=false){
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
ksys.util.ask_folder = function(multiple=false){
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
ksys.util.list_ip_interfaces = function(octets=false, include_mask=false){
	// important todo: Fix this.
	// return ksys.context.global.cache.atat_return_addr;

	const compound_list = [];

	const interfaces = os_em.networkInterfaces();
	for (const interfaceName in interfaces) {
		const addresses = interfaces[interfaceName];
		for (const address of addresses) {
			if (address.family === 'IPv4' && !address.internal) {
				if (octets){
					if (include_mask){
						compound_list.push([
							address.address.split('.').map(function(e){return int(e)}),
							address.netmask.split('.').map(function(e){return int(e)}),
						]);
					}else{
						compound_list.push(
							address.address.split('.').map(function(e){return int(e)})
						);
					}

				}else{
					if (include_mask){
						compound_list.push([
							compound_list.push(address.address),
							compound_list.push(address.netmask),
						]);
					}else{
						compound_list.push(address.address);
					}
					
				}
			}
		}
	}
	return compound_list
}


// Get local ipv4 address
// This is so retarded...
ksys.util.get_local_ipv4_addr = function(octets=false){
	for (const interface of ksys.util.list_ip_interfaces(true, true)){
		const [ip, mask] = interface;
		const masked_addr = ip.map((part, i) => part & mask[i]).join('.');
		print('masked shite:', masked_addr)
		if (masked_addr == ksys.context.global.cache.vmix_ip){
			return masked_addr
		}
	}

	return null
}

ksys.util.resolve_object_path = function(tgt_obj, tgt_path){
	let last = tgt_obj;
	for (const p of tgt_path){
		last = last?.[p.trim()];
	}

	return last
}

ksys.util.lock_gui = function(state){
	if (state == true){
		document.body.classList.add('__cockblocked');
	}
	if (state == false){
		document.body.classList.remove('__cockblocked');
	}
}

ksys.util.reload = function(){
	ipcRenderer.invoke('kbn.main.reload', { key: 'value' });
}

ksys.util.nprint = function(cls, color, extras='', cls_name_override=null){
	const nprint_name = (
		cls.constructor.NPRINT_NAME ||
		cls.constructor.name ||
		cls_name_override ||
		'UNKNOWN_CLASS'
	)

	const console_color = (color == '?') ? ksys.util.rnd_hex(true) : color;

	cls.nprint = function(){
		if (cls.constructor.MUTE_NPRINT){return};
		console.log(
			// `%c[${cls_name_override || cls.constructor.name}]`,
			`%c[${nprint_name}]`,
			`color: ${console_color};` + extras,
			...arguments
		)
	}
	cls.nwarn = function(){
		if (cls.constructor.MUTE_NPRINT){return};
		console.warn(
			`%c[${nprint_name}]`,
			`color: ${console_color};` + extras,
			...arguments
		)
	}
	cls.nerr = function(){
		if (cls.constructor.MUTE_NPRINT){return};
		console.error(
			`%c[${nprint_name}]`,
			`color: ${console_color};` + extras,
			...arguments
		)
	}

	return cls;
}

// Bootleg UUID
// todo: replace with "npm install uuid"
ksys.util.rnd_uuid = function(joinchar='-'){
	const bytes = crypto_em.randomBytes(16);

	bytes[6] = (bytes[6] & 0x0f) | 0x40;
	bytes[8] = (bytes[8] & 0x3f) | 0x80;

	return [
		bytes.toString('hex', 0, 4),
		bytes.toString('hex', 4, 6),
		bytes.toString('hex', 6, 8),
		bytes.toString('hex', 8, 10),
		bytes.toString('hex', 10, 16)
	].join(joinchar || '-');
}

ksys.util.bind_val_to_dom = function(_params){
	const params = Object.assign(
		{
			'dom':         _params.dom[0],
			'dom_key':     _params.dom[1] || 'value',
			'val_path':    _params.val[0],
			'val_key':     _params.val[1],
			'bind_method': _params.bind_method || 'onchange',
			'autofill':    [true, false].includes(_params.autofill) ? _params.autofill : true,
			'fwd':         _params.fwd || [],
		},
		{
			// 'dom_key': 'value',
			// 'bind_method': 'onchange',
			// 'autofill': true,
		}
	)

	if (params.autofill){
		params.dom.value = params.val_path[params.val_key] || '';
	}

	params.dom[params.bind_method] = function(){
		params.val_path[params.val_key] = params.dom[params.dom_key];
	}

	for (const fwd_data of params.fwd){

	}
}

ksys.util.exit_textareas = function(){
	for (const tag of document.querySelectorAll('textarea')){
		tag.blur();
	}
}

// Determine the IP assigned to the network adapter from which
// the controller managed to access VMIX
ksys.util.resolve_own_ip = function(){
	const log_prefix = '[ksys.util.resolve_own_ip]';

	return new Promise(function(resolve, reject){
		const ctx_cache = ksys.context.global.cache;

		const request = http_em.request(
			{
				'hostname': ctx_cache.vmix_ip,
				'port':     ctx_cache.vmix_port,
				'path':     '/API/?Function=',
				'method':   'GET',
				'timeout':  5000,
			},
			function(response){
				print(log_prefix, 'response:', response);
			}
		)

		request.on('socket', socket => {

			socket.on('connect', () => {
				resolve(
					socket.address().address
				)
			})

			socket.on('error', err => {
				console.warn(log_prefix, 'Socker Error:', err);
				resolve(false);
			})

			socket.setTimeout(5000);
			socket.on('timeout', () => {
				resolve(false);
				console.warn(log_prefix, 'Timed Out on waiting for reply');
				request.abort();
			})

		})

		request.end()
	});
}

ksys.util.validate_ip_format = function(tgt){
	let int_array = null;

	if (Array.isArray(tgt)){
		int_array = tgt;
	}

	if (typeof tgt == 'string'){
		int_array = tgt.split('.');
	}

	if (!int_array || (int_array.length != 4)){
		return false
	}

	return !int_array.map(function(i){
		const integer = parseInt(i);
		return Number.isInteger(integer) && integer >= 0;
	}).includes(false);
}

ksys.util.vis_feed_anim = async function(tag){
	tag.classList.remove('ksys_onchange_vis_feedback_cls');
	void tag.offsetWidth;
	tag.classList.add('ksys_onchange_vis_feedback_cls');
	await ksys.util.sleep(400);
	tag.classList.remove('ksys_onchange_vis_feedback_cls');
}

ksys.util.promise = function(){
	const promise_data = [null, null, null];

	const promise_itself = new Promise(function(resolve, reject){
		promise_data[1] = resolve;
		promise_data[2] = reject;
	});

	promise_data[0] = promise_itself;

	return promise_data;
}

ksys.util.rnd_hex = function(hashtag=false){
	// Generate a random integer between 0 and 0xFFFFFF
	const rnd_int = Math.floor(Math.random() * 0x1000000);
	// Convert to hexadecimal and pad with leading zeros if necessary
	const hex_str = rnd_int.toString(16).padStart(6, '0');
	return (hashtag ? '#' : '') + hex_str;
}

// A dictionary where key is whatever a class' property returns
// Todo: this is some unused shit
ksys.util.ClassDict = class{
	static NPRINT_NAME = 'ClassDict';

	constructor(key_attr){
		const self = ksys.util.nprint(
			ksys.util.cls_pwnage.remap(this),
			'#FFFB88',
		);

		self.key_attr = key_attr.trim();

		self.cls_array = new Set();
	}

	check_cls(self, tgt_cls){
		if (!(self.key_attr in tgt_cls)){
			throw new Error('Class', tgt_cls, `doesn't contain attribute`, self.key_attr);
		}
	}

	cls_lookup(self, tgt_cls){
		self.check_cls(tgt_cls);

		for (const set_cls of self.cls_array){
			// todo: == or === ????
			if (set_cls[self.key_attr] === tgt_cls[self.key_attr]){
				return set_cls;
			}
		}

		return undefined
	}

	lookup(self, key_val){
		for (const set_cls of self.cls_array){
			if (set_cls[self.key_attr] === key_val){
				return set_cls
			}
		}

		return undefined
	}

	set(self, tgt_cls){
		self.check_cls(tgt_cls);

		const existing_cls = self.cls_lookup(tgt_cls);

		if (existing_cls){
			self.cls_array.delete(existing_cls);
		}

		self.cls_array.add(tgt_cls);
	}

	cls_get(self, tgt_cls){
		self.check_cls(tgt_cls);

		return self.cls_lookup(tgt_cls)
	}

	get(self, key_val){
		return self.lookup(key_val)
	}

	includes(self, key_val){
		return Boolean(self.lookup(key_val))
	}

	cls_includes(self, tgt_cls){
		self.check_cls(tgt_cls);
		return Boolean(self.cls_lookup(tgt_cls))
	}

	* iter(self){
		for (const i of self.cls_array){
			yield i
		}
	}

	* iter_kv(self){
		for (const i of self.cls_array){
			yield [i[self.key_attr], i]
		}
	}
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

Element.prototype.triggerChange = function(evt='change'){
	this.dispatchEvent(new Event(evt));
}

Element.prototype.visFeedAnim = function(){
	ksys.util.vis_feed_anim(this);
}

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
	print('Trying to load', nm, save_state);
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

	// Add templates
	ksys.context.tplates = ksys.tplates.module_templates[nm];

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

	// Resync Packer
	ksys.packer_md.resync()

	// resync switches
	// ksys.switches.resync()

	// Init resource proxy
	vmix.util.HTTPResourceProxy.module_init();

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
			console.warn('Module', nm, `has no load function`)
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
	const ctx_cache = ksys.context.global.pull();

	// patch-based system: The base is empty by default.
	// Patch has to be aplied immediately after installation
	// Therefore, check whether this is a raw base or not
	if (app_root.join('raw_base_is.bad').isFileSync()){
		document.body.style.pointerEvents = 'none';
		ksys.fbi.warn_critical(
			'The current installation is a raw base. Patch has to be applied. Close the controller and apply a patch.'
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
	await ksys.btns.icon_pre_load();

	// Create db folder if it doesnt exist
	ksys.util.ensure_folder_exists(app_root.join('db'));

	// starting page is ip:port selector
	// this page gets overwritten with the homepage if ip:port is valid
	sys_load('starting_page', false)

	// init pgview
	ksys.pgview.reload()

	// ping vmix
	const reach = await vmix.talker.ping()

	// modkey hints
	// todo: this is obsolete
	ksys.hintsys.reg_modkey_hint('Control', 'CTRL + R - Reload controller', false);
	ksys.hintsys.reg_modkey_hint('Alt', 'ALT + W - Back to homepage', false);

	// Index module templates
	ksys.tplates.index_module_templates();

	// Node AT-AT Ticker
	await ksys.ticker.NodeAtAtBundestag.sys_init();


	// if vmix is not reachable - do not save the IP/port and simply prompt input again
	if (reach == false){
		// display an error
		$('#welcome_screen_title_2').html(
			`Unable to reach VMIX at <addr>${ksys.util.str_ops.validate(ctx_cache.vmix_ip)}</addr> : <addr>${ksys.util.str_ops.validate(ctx_cache.vmix_port)}</addr>. Please enter a valid ip/port to proceed or ensure that the networking is not malfunctioning (aka rubbish bootleg firewalls, wrong LAN, etc...) and VMIX is running with Web Controller ONN.`
		)
		$('startpage').append(`
			<div id="welcome_enter_info">
				<input style="color: white" type="text" placeholder="IP (absolute)" ip>:<input style="color: white" type="number" value="8088" placeholder="Port" port>
			</div>
			<sysbtn style="margin-top: 10px" onclick="kbmodules.starting_page.save_creds()" id="welcome_apply_creds">Apply</sysbtn>
		`)
		return
	}else{
		// add ip:port to the window title
		document.title = `${document.title}  |  ${ctx_cache.vmix_ip}:${ctx_cache.vmix_port}`;

		// init resource proxy
		await vmix.util.HTTPResourceProxy.sys_init();

		ipcRenderer.invoke('kbn.basic_vmix.update_addr', {
			'ip': ksys.context.global.cache['vmix_ip'],
			'port': ksys.context.global.cache['vmix_port']
		});

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

// alt + w and ctrl + r
document.addEventListener('keydown', evt => {
	if (evt.code == 'KeyW' && evt.altKey){
		sys_load('welcome')
	}
	if (evt.code == 'KeyR' && evt.ctrlKey){
		// ksys.util.reload();
	}
});



// ============================================================
// ------------------------------------------------------------
//                  Onchange Visual Feedback
// ------------------------------------------------------------
// ============================================================

document.addEventListener('keydown', evt => {
	if (evt.which == 27 && ['INPUT', 'TEXTAREA'].includes(evt.target.tagName)){
		evt.target.blur();
	}
});

document.addEventListener('change', async function(evt){
	const tag = evt.target;
	if (['INPUT', 'TEXTAREA'].includes(tag.tagName) && ('onchange_vis_feed' in tag.attributes)){
		tag.visFeedAnim();
	}
})

document.addEventListener('focusin', function(evt){
	const tag = evt.target;
	if (['INPUT', 'TEXTAREA'].includes(tag.tagName) && !('spellcheck' in tag.attributes)){
		tag.setAttribute('spellcheck', 'false');
	}
	if (['INPUT', 'TEXTAREA'].includes(tag.tagName) && tag.classList.contains('kbsys_locked')){
		tag.blur();
	}
})