
const electron_http_server = require('http');

// timings are in the following format:
// {
// 	'fps': 30,
// 	'frames_in': 72,
// 	'frames_out': 72,
// 	'margin': 3,
// }

const sys_data = {
	'overlay_preview_mode': false,
	'mem_bufs': {},
};

const global_params = {
	'resource_proxy': null,
};

// ============================
//        Basic, legacy
// ============================
const _BasicHTTPImagesProxy = class{
	constructor(own_addr=null, whitelist=null, no_cache=true){
		const self = ksys.util.cls_pwnage.remap(this);

		ksys.util.nprint(self, '#64C3FF');

		self.own_addr = own_addr || ksys.util.get_local_ipv4_addr(false);
		self.no_cache = no_cache;
		self.whitelist = whitelist;

		self.server = electron_http_server.createServer((req, res) => {
			self.process_request(req, res);
			// res.statusCode = 200;
			// res.setHeader('Content-Type', 'text/plain');
			// res.end('Hello World\n');
		});

		self.server.listen(0, '0.0.0.0', () => {
			self.addr = self.server.address();
			self.nprint(
				'Launched basic HTTP Image Proxy:',
				`${self.addr.address}:${self.addr.port}`
			);
		});
	}

	terminate(self){
		self.server.close(function() {
			self.nprint('Shutting down basic HTTP Image Proxy');
		});
	}

	remap_fpath(self, fpath){
		return (
			  `http://${self.own_addr}:${self.addr.port}`
			+ (self.no_cache ? `/${lizard.rndwave()}` : '')
			+ '/?'
			+ str(new URLSearchParams({
				'file': str(fpath),
			}))
		)
	}

	async process_request(self, req, res){
		self.nprint('Incoming request:', req, res);
		const fpath = Path(
			(new URL(req.url, `http://${req.headers.host}`)).searchParams.get('file')
		)

		if (self?.whitelist?.length){
			let ok = false;
			for (const allowed_dir of self.whitelist){
				if (!allowed_dir.trim()){continue};

				if (fpath.is_relative_to(allowed_dir)){
					self.nprint('Allowing', fpath)
					ok = true;
				}
			}

			if (!ok){
				res.statusCode = 404;
				res.write(`File ${str(fpath)} doesn't exist`);
				res.end();
				self.nwarn('File', str(fpath), `is not in whitelist`);
				return
			}
		}

		if (fpath.existsSync()){
			res.statusCode = 200;
			res.write(Buffer.from(
				fpath.readFileSync()
			))
			res.end();
		}else{
			res.statusCode = 404;
			res.write(`File ${str(fpath)} doesn't exist`);
			res.end();
			self.nwarn('File', str(fpath), `doesn't exist`);
		}
	}
}

const _enable_image_proxy = function(own_addr){
	global_params?.proxy?.terminate?.();
	global_params.proxy = new BasicHTTPImagesProxy(own_addr);
}

const _disable_image_proxy = function(){
	global_params.proxy = false;
	global_params?.proxy?.terminate?.();
}



// ksys.db.global.write('pgview_cfg_binds.kbcfg', JSON.stringify(binds))
// JSON.parse(ksys.db.global.read('pgview_cfg_binds.kbcfg'));


// ============================
//        New, definitive
// ============================
const HTTPResourceProxySecurityWhitelist = class{
	// Whitelist
	// Token
	// Dynamic

	static CFG_FNAME = 'http_resource_proxy.security.whitelist.kbcfg';
	static METHOD_ID = 'whitelist';

	constructor(server, params=null){
		const self = ksys.util.nprint(
			ksys.util.cls_pwnage.remap(this),
			'#64FFAD',
		);

		// Parent server
		self.server = server;

		// The whitelist
		self._whitelist = null;
	}

	$whitelist(self){
		if (self._whitelist != null){
			return self._whitelist
		}

		self.whitelist = ksys.db.global.read(self.constructor.CFG_FNAME) || [];

		return self._whitelist
	}

	$$whitelist(self, new_whitelist){
		if (!self._whitelist){
			self._whitelist = [];
		}

		self._whitelist.length = 0;

		const whitelist_entries = (
			Array.isArray(new_whitelist) ? new_whitelist : new_whitelist.split('\n')
		)

		for (const whitelist_dir of whitelist_entries){
			if (whitelist_dir.trim()){
				self._whitelist.push(
					whitelist_dir
				);
			}
		}

		ksys.db.global.write(
			self.constructor.CFG_FNAME,
			self._whitelist.join('\n')
		);
	}

	resolve(self, url_data){
		const fpath = Path(url_data.get('fpath'));

		self.nprint('Resolving:', fpath, self);

		if (self.whitelist.length == 1 && self.whitelist[0] == '*'){
			print('cunt')
			return {
				'ok': true,
				'fpath': fpath,
			}
		}

		for (const allowed_dir of self.whitelist){
			self.nprint('Checking', fpath, allowed_dir, fpath.is_relative_to(allowed_dir))
			if (fpath.is_relative_to(allowed_dir)){
				return {
					'ok': true,
					'fpath': fpath,
				}
			}
		}

		return {
			'ok': false,
		}
	}

	map_fpath(self, tgt_fpath){
		return {
			'fpath': tgt_fpath,
			'raw': tgt_fpath,
		}
	}
}

const HTTPResourceProxySecurityDynamic = class{
	static CFG_FNAME = 'http_resource_proxy.security.dynamic.kbcfg';
	static METHOD_ID = 'dynamic';

	constructor(server, params=null){
		const self = ksys.util.nprint(
			ksys.util.cls_pwnage.remap(this),
			'#64FFAD',
		);

		// Parent server
		self.server = server;

		// Files allowed to be read
		self.flist = new Set();
	}

	flush(self){
		self.flist.clear();
	}

	map_fpath(self, tgt_fpath){
		// '/a' file path is possible on Linux, but
		// not on Windows this controller can only run on
		if (tgt_fpath && tgt_fpath?.length > 3){
			self.flist.add(str(Path(tgt_fpath)))
		}

		return {
			'fpath': tgt_fpath,
		}
	}

	resolve(self, url_data){
		const fpath = Path(url_data.get('fpath'));

		self.nprint('Resolving:', fpath, url_data, self);

		if (self.flist.has(str(fpath))){
			return {
				'ok': true,
				'fpath': fpath,
			}
		}

		return {
			'ok': false,
			'raw': url_data.get('fpath'),
		}
	}
}

const HTTPResourceProxySecurityToken = class{
	static CFG_FNAME = 'http_resource_proxy.security.token.kbcfg';
	static METHOD_ID = 'token';

	static TOKEN_LEN = 8;

	constructor(server, params=null){
		const self = ksys.util.nprint(
			ksys.util.cls_pwnage.remap(this),
			'#64FFAD',
		);

		// The token itself
		self._token = params?.token || null;
	}

	regen_token(self){
		// self._token = ksys.util.rnd_uuid();
		self.token = lizard.rndwave(self.constructor.TOKEN_LEN, 'letters');
		return self._token
	}

	$token(self){
		if (self._token){
			return self._token
		}

		self._token = ksys.db.global.read(self.constructor.CFG_FNAME);

		if (!self._token){
			self.regen_token();
		}

		return self._token
	}

	$$token(self, new_token){
		if (!str(new_token)){
			self.nwarn('Tried applying invalid token:', new_token, self);
			return
		}
		self._token = str(new_token);

		ksys.db.global.write(self.constructor.CFG_FNAME, self._token);
	}

	map_fpath(self, tgt_fpath){
		const fpath = Path(tgt_fpath);
		self.nprint('Mapping tokenized fpath:', tgt_fpath, fpath.withStem(fpath.stem + self.token))
		return {
			'fpath': fpath.withStem(fpath.stem + self.token),
		}
	}

	resolve(self, url_data){
		const slice_size = self.constructor.TOKEN_LEN * -1;
		const fpath_data = Path(url_data.get('fpath'));
		const token = fpath_data.stem.slice(slice_size);
		const fpath = fpath_data.withStem(fpath_data.stem.slice(0, slice_size));

		self.nprint('Resolving:', token, fpath_data, fpath, self);

		if (token != self.token){
			self.nprint('Resolve failed:', token, fpath_data, fpath, self);
			return {
				'ok': false,
			}
		}

		return {
			'ok': true,
			'fpath': fpath,
			// important todo: this is weird
			'raw': url_data.get('fpath').slice(0, slice_size),
		}
	}
}

const HTTPResourceProxy = class{
	static LOG_REQUESTS = true;

	static SECURITY_METHODS = Object.freeze([
		HTTPResourceProxySecurityWhitelist,
		HTTPResourceProxySecurityDynamic,
		HTTPResourceProxySecurityToken,
	]);


	constructor(params=null){
		const self = ksys.util.nprint(
			ksys.util.cls_pwnage.remap(this),
			'#64C3FF',
		);

		// Electron's HTTP server object
		self.server = null;
		// Auto-assigned port for electron's HTTP server
		self.port = null;

		// Security to only allow serving eligible files
		self.security_method = params?.security_method || 'whitelist';
		/*
		self.security = {
			'whitelist': new HTTPResourceProxySecurityWhitelist(self, params?.security?.whitelist),
			'dynamic': new HTTPResourceProxySecurityDynamic(self, params?.security?.dynamic),
			'token': new HTTPResourceProxySecurityToken(self, params?.security?.token),
		}
		*/
		self.security = {};
		for (const method of self.constructor.SECURITY_METHODS){
			self.security[method.METHOD_ID] = new method(
				self,
				params?.security?.[method.METHOD_ID],
			)
		}

		// IP address of the machine this server runs on
		// (VMIX must know where to send HTTP requests)
		self._own_ip = params?.own_ip;

		// Bootleg steganography
		self._troll = null;
	}

	static async restart(){
		print('Restarting resource proxy');

		if (!global_params.resource_proxy){
			global_params.resource_proxy = new HTTPResourceProxy({
				'security_method': ksys.context.global.cache.resource_proxy_security,
			});
		}

		ksys.context.global.prm('resource_proxy_enabled', true);

		await global_params.resource_proxy.terminate();
		await global_params.resource_proxy.run();
	}

	static async disable(){
		ksys.context.global.prm('resource_proxy_enabled', false);
		await global_params?.resource_proxy?.terminate?.();
	}

	static async sys_init(){
		print('Proxy sys init');

		global_params.resource_proxy = new HTTPResourceProxy({
			'security_method': ksys.context.global.cache.resource_proxy_security,
		});

		if (ksys.context.global.cache.resource_proxy_enabled){
			await HTTPResourceProxy.restart();
		}else{
			await HTTPResourceProxy.disable();
		}
	}

	static module_init(){
		const placeholder = document.querySelector('http-resource-proxy-control');
		if (placeholder){
			placeholder.replaceWith(
				(new HTTPResourceProxyControlPanel({'resource_proxy': global_params.resource_proxy})).dom.root
			);
		}
	}

	static reg_buf(buf_data){
		let buf_path = null;
		let buf = null;

		if (Array.isArray(buf_data)){
			// important todo: this is generally fine, but duplicating buffers
			// so much is not good
			buf_path = str(buf_data[0]).lower().trim();
			buf = Buffer.from(buf_data[1]);
		}else{
			buf_path = str(buf_data.path).lower().trim();
			buf = Buffer.from(buf_data.buf);
		}

		sys_data.mem_bufs[buf_path] = buf;
	}

	static sysdata(){
		return sys_data
	}

	$own_ip(self){
		return self._own_ip
	}

	$$own_ip(self, new_ip){
		if (!ksys.util.validate_ip_format(new_ip)){
			self.nerr('SET .own_ip: invalid IP provided:', new_ip, self);
			ksys.info_msg.send_msg(
				  `FATAL: ${self.constructor.name}.own_ip received invalid IP: >${new_ip}<`
				+ ` You're fucked: Serving resources to VMIX from this PC is now most likely FUCKED.`,
				'err',
				30_000
			);
			return
		}
		self._own_ip = new_ip;
		return
	}

	// http://192.168.0.69:6969 + common params
	$server_url(self){
		if (self.port && self.server){
			return `http://${self.own_ip}:${self.port}/`
		}else{
			return false
		}
	}

	$is_active(self){
		return !!self.server
	}

	// Bootleg steganography
	$troll(self){
		if (!self._troll){
			self._troll = {
				'token': ksys.util.rnd_uuid(),
				'access_token': ksys.util.rnd_uuid(),
			}
		}

		self._troll.session_id = lizard.rndwave(8, 'letters');

		return self._troll;
	}

	// todo: is it possible for a new adapter to be ADDED, which would therefore
	// make this function deceptive and useless?
	async resolve_own_ip(self, apply=true){
		const new_ip = await ksys.util.resolve_own_ip();
		if (apply){
			self.own_ip = new_ip;
		}
		return new_ip;
	}

	async run(self){
		return new Promise(async function(resolve, reject){
			if (self.server){
				self.nwarn('Already running:', self);
				resolve(false);
			}

			if (!self.own_ip){
				await self.resolve_own_ip();
			}

			self.server = electron_http_server.createServer((req, res) => {
				self.process_request(req, res);
				// res.statusCode = 200;
				// res.setHeader('Content-Type', 'text/plain');
				// res.end('Pootis\n');
			});

			self.server.listen(0, '0.0.0.0', () => {
				const addr = self.server.address();
				self.port = addr.port;
				self.nprint(
					'Launch ok:',
					`${addr.address}:${addr.port}`,
					self.own_ip,
				);

				resolve(true);
			});
		});
	}

	async terminate(self){
		return new Promise(function(resolve, reject){
			if (!self.server?.close){
				resolve(true);
			}

			self.server?.close?.(function(){
				self.server = null;
				self.port = null;

				self.nprint('Terminated basic HTTP Image Proxy');
				resolve(true);
			});
		});
	}

	map_fpath(self, tgt_fpath){
		const mapped_data = self.security[self.security_method].map_fpath(tgt_fpath);
		mapped_data.fpath = str(mapped_data.fpath);
		return self.server_url + '?' + str(new URLSearchParams(Object.assign(
			mapped_data,
			self.troll,
		)))
	}

	async process_request(self, req, res){
		if (self.constructor.LOG_REQUESTS){
			self.nprint('Incoming Request:', req, res);
		}

		const request_url_params = (new URL(req.url, `http://${req.headers.host}`)).searchParams;
		const validation = self.security[self.security_method].resolve(request_url_params);

		if (!validation.ok){
			res.statusCode = 404;
			res.write(`File doesn't exist`);
			res.end();
			if (self.constructor.LOG_REQUESTS){
				self.nwarn(
					'Failed validation on request',
					req.url,
					[...request_url_params.entries()]
				);
			}
			return
		}

		const path_raw = (
			validation.raw
			.replaceAll(Path('fuck').dirname, '')
			.replaceAll('/', '')
			.replaceAll('\\', '')
			.lower()
			.trim()
		);
		self.nprint('RAW:', path_raw)
		const mem_buf = sys_data.mem_bufs[path_raw];
		if (mem_buf){
			self.nprint('Returning memory buffer:', path_raw);
			res.statusCode = 200;
			res.write(mem_buf);
			res.end();

			return
		}

		if (validation.fpath.existsSync()){
			res.statusCode = 200;
			res.write(Buffer.from(
				validation.fpath.readFileSync()
			))
			res.end();
		}else{
			res.statusCode = 404;
			res.write(`File doesn't exist`);
			res.end();
			self.nwarn('File (validated)', str(validation.fpath), `doesn't exist`);
		}
	}
}


const HTTPResourceProxyControlPanel = class{
	constructor(params=null){
		const self = ksys.util.nprint(
			ksys.util.cls_pwnage.remap(this),
			'#64C3FF',
		);

		self.resource_proxy = params.resource_proxy;

		self.tplates = ksys.tplates.sys_tplates.res_proxy;

		self._dom = null;

		self._sm_panels = null;
	}

	$dom(self){
		if (self._dom){
			return self._dom
		}

		self._dom = self.tplates.root({
			'enabled_cbox':     '.enabled_cbox input',
			'pong_ip_input':    '.pong_ip_input',
			'pong_ip_auto_btn': '.pong_ip_auto_btn',
			'pong_ip_picker':   '.pong_ip_picker',

			'security_ctrl':    '.security_method_ctrl',

			'sm_whitelist':     '.security_method_item[whitelist]',
			'sm_dynamic':       '.security_method_item[dynamic]',
			'sm_token':         '.security_method_item[token]',
		})

		const dom_idx = self._dom.index;

		new ksys.switches.KBSwitch({
			'multichoice': false,
			'can_be_empty': false,
			'set_default': ksys.context.global.cache.resource_proxy_security || 'whitelist',
			'dom_array': [
				{
					'id': 'whitelist',
					'dom': dom_idx.sm_whitelist,
				},
				{
					'id': 'dynamic',
					'dom': dom_idx.sm_dynamic,
				},
				{
					'id': 'token',
					'dom': dom_idx.sm_token,
				},
			],
			// sm_ = Security Method
			'callback': function(kbswitch, sm_id){
				ksys.context.global.prm('resource_proxy_security', sm_id);
				self.resource_proxy.security_method = sm_id;
				dom_idx.security_ctrl.innerHTML = '';
				dom_idx.security_ctrl.append(self.sm_panels[sm_id].root);
			}
		});

		dom_idx.enabled_cbox.checked = ksys.context.global.cache.resource_proxy_enabled;
		dom_idx.enabled_cbox.onchange = function(){
			if (dom_idx.enabled_cbox.checked){
				HTTPResourceProxy.restart();
			}else{
				HTTPResourceProxy.disable();
			}
		}

		dom_idx.pong_ip_input.value = global_params?.resource_proxy?.own_ip || '';
		dom_idx.pong_ip_input.onchange = function(){
			global_params.resource_proxy.own_ip = dom_idx.pong_ip_input.value.trim();
		}

		dom_idx.pong_ip_auto_btn.onclick = async function(){
			dom_idx.pong_ip_input.value = await global_params.resource_proxy.resolve_own_ip();
			dom_idx.pong_ip_input.visFeedAnim();
		}

		const addr_picker = new ksys.ticker.kb_at.AddrPicker({
			'callback': function(picker, val){
				if (!val){return};
				dom_idx.pong_ip_input.value = val;
				global_params.resource_proxy.own_ip = val;
				dom_idx.pong_ip_input.visFeedAnim();
			}
		})
		dom_idx.pong_ip_picker.replaceWith(addr_picker.dom);

		dom_idx.security_ctrl.innerHTML = '';
		dom_idx.security_ctrl.append(self.sm_panels[self.resource_proxy.security_method].root);

		return self._dom;
	}

	$sm_panels(self){
		if (self._sm_panels){
			return self._sm_panels
		}

		self._sm_panels = {
			'whitelist': self.tplates.whitelist_ctrl({
				'whitelist_input': 'textarea',
			}),
			'dynamic': self.tplates.dynamic_ctrl({
				'flush_btn': 'sysbtn',
			}),
			'token': self.tplates.token_ctrl({
				'regen_token_btn': 'sysbtn',
			}),
		};

		self._sm_panels.whitelist.index.whitelist_input.value = self.resource_proxy.security.whitelist.whitelist.join('\n');
		self._sm_panels.whitelist.index.whitelist_input.onchange = function(){
			self.resource_proxy.security.whitelist.whitelist = self._sm_panels.whitelist.index.whitelist_input.value;
		}

		self._sm_panels.dynamic.index.flush_btn.onclick = function(){
			self.resource_proxy.security.dynamic.flush();
		}

		self._sm_panels.token.index.regen_token_btn.onclick = function(){
			self.resource_proxy.security.token.regen_token();
		}

		return self._sm_panels
	}
}



// todo: page switching logic from football to here
const VMIXTitle = class{
	ADV_LETTERS = true;
	ADV_LETTERS_ARRAY = 'ыъэё';

	constructor(title_name, gt_format=true){
		const self = ksys.util.cls_pwnage.remap(this);

		self.last_overlay = null;
		self.timings = null;
		self.default_overlay = null;

		self.xml_cache = null;

		// if the first parameter is a string - create a title with no timings
		// if the first parameter is an object, then ignore the second one and derive everything from the provided object
		if (typeof title_name == 'string'){
			self.title_name = title_name;
			self.gtformat = gt_format;
		}

		if (typeof title_name != 'string'){
			const defaults = {
				// title name cannot be missing
				// 'title_name': null,
				'gtformat': true,
				'timings': null,
				'default_overlay': null,
			};
			const cfg = { ...defaults, ...title_name };

			if (!cfg.title_name){
				console.error(
					'Invalid title name:', cfg.title_name
				)
			}

			self.title_name =      cfg.title_name;
			self.gtformat =        cfg.gtformat;
			self.timings =         cfg.timings;
			self.default_overlay = cfg.default_overlay;

			// print('MERGE RESULT', merge, self.gtformat)
		}
	}

	create_function_name(self, target_overlay, state){
		if (sys_data.overlay_preview_mode){
			return `PreviewOverlayInput${target_overlay}`
		}
	}

	// Pul this title's XML data from VMIX
	async pull_xml(self){
		return (await vmix.talker.project()).querySelector(
			`inputs input[title="${self.title_name}"]`
		)
	}

	async set_text(self, field_name, newval){
		let val = str(newval);
		if (self.ADV_LETTERS){
			for (const letter of self.ADV_LETTERS_ARRAY){
				val = (
					val
					.replaceAll(letter, '')
					.replaceAll(letter.upper(), '')
				)
			}
		}
		await vmix.talker.talk({
			'Function': 'SetText',
			'Value': val,
			'Input': self.title_name,
			'SelectedName': field_name + (self.gtformat ? '.Text' : ''),
		})
	}

	async toggle_text(self, field_name, state=null){
		await vmix.talker.talk({
			'Function': (state == null) ? 'SetTextVisible' : `SetTextVisible${state ? 'On' : 'Off'}`,
			'Input': self.title_name,
			'SelectedName': field_name + (self.gtformat ? '.Text' : ''),
		})
	}

	async set_img_src(self, img_name, newsrc){
		let img_src;

		if (ksys.context.global.cache.resource_proxy_enabled){
			img_src = global_params.resource_proxy.map_fpath(newsrc);
		}else{
			img_src = newsrc;
		}

		await vmix.talker.talk({
			'Function': 'SetImage',
			'Value': str(img_src).trim() || '',
			'Input': self.title_name,
			'SelectedName': img_name + (self.gtformat ? '.Source' : ''),
		})
	}

	async toggle_img(self, field_name, state=null){
		await vmix.talker.talk({
			'Function': (state == null) ? 'SetImageVisible' : `SetImageVisible${state ? 'On' : 'Off'}`,
			'Input': self.title_name,
			'SelectedName': field_name + (self.gtformat ? '.Source' : ''),
		})
	}

	// todo: add check to prevent exceeding 4 (max) overlays
	// todo: check for valid overlay numbers ?
	async overlay_in(self, overlay_num=null, wait=true){
		const target_overlay = overlay_num || self.default_overlay || 1;
		self.last_overlay = target_overlay;

		const overlay_variant = sys_data.overlay_preview_mode ? 'PreviewOverlayInput' : 'OverlayInput';
		const suffix = sys_data.overlay_preview_mode ? '' : 'In'

		await vmix.talker.talk({
			'Function': `${overlay_variant}${target_overlay}` + suffix,
			'Input': self.title_name,
		})

		if (self.timings && wait){
			const margin = (self.timings.margin || 0) + 500;
			await ksys.util.sleep(((self.timings.frames_in / self.timings.fps)*1000) + margin)
		}
	}

	async overlay_out(self, overlay_num=null, wait=true){
		const target_overlay = overlay_num || self.last_overlay || self.default_overlay || 1;

		const overlay_variant = sys_data.overlay_preview_mode ? 'PreviewOverlayInput' : 'OverlayInput';
		const suffix = sys_data.overlay_preview_mode ? '' : 'Out'

		await vmix.talker.talk({
			'Function': `${overlay_variant}${target_overlay}` + suffix,
			'Input': self.title_name,
		})

		if (self.timings && wait){
			const margin = (self.timings.margin || 0) + 500
			const frames_out = self.timings.frames_out || self.timings.frames_in
			await ksys.util.sleep(((frames_out / self.timings.fps)*1000) + margin)
		}
	}


	// todo: these manipulations (pause/resume render) require
	// beyond sattelite manufacturing precision,
	// otherwise retarded artifacts occur

	// Pause title rendering while making multiple updates
	async pause_render(self){
		await vmix.talker.talk({
			'Function': `PauseRender`,
			'Input': self.title_name,
		})
	}
	// Resume title rendering after making multiple updates, so that
	// certain animations trigger perfectly parallel to each other
	async resume_render(self){
		await vmix.talker.talk({
			'Function': `ResumeRender`,
			'Input': self.title_name,
		})
	}


	async set_text_color(self, field_name, hex_color){
		await vmix.talker.talk({
			'Function': 'SetTextColour',
			'Value': `#${str(hex_color).replaceAll('#', '')}`,
			'Input': self.title_name,
			'SelectedName': field_name + (self.gtformat ? '.Text' : ''),
		})
	}

	async set_shape_color(self, field_name, hex_color){
		await vmix.talker.talk({
			'Function': 'SetColor',
			'Value': `#${str(hex_color).replaceAll('#', '')}`,
			'Input': self.title_name,
			'SelectedName': field_name + (self.gtformat ? '.Fill.Color' : ''),
		})
	}

	async page(self, page_num, anim_dur=null){
		// await vmix.talker.talk({
		// 	'Function': 'TitleBeginAnimation',
		// 	'Value': `[Page${page_num}]`,
		// 	'Input': self.title_name,
		// })

		await vmix.talker.talk({
			'Function': 'SelectIndex',
			'Value': page_num,
			'Input': self.title_name,
		})

		if (anim_dur){
			await ksys.util.sleep(anim_dur);
		}
	}
}


document.addEventListener('keydown', evt => {
	// if (evt.which == 80 && evt.ctrlKey && evt.altKey){
	if (evt.code == 'KeyP' && evt.ctrlKey && evt.altKey){
		const indicator = document.querySelector('#overlay_preview_mode');
		if (sys_data.overlay_preview_mode == true){
			indicator.classList.add('oprm_hidden');
			sys_data.overlay_preview_mode = false;
		}else{
			indicator.classList.remove('oprm_hidden');
			sys_data.overlay_preview_mode = true;
		}
	}
});


module.exports = {
	VMIXTitle,
	// BasicHTTPImagesProxy,
	// enable_image_proxy,
	// disable_image_proxy,
	// global_params,
	HTTPResourceProxy,
};

