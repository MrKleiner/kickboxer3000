

const sys_data = {};




const PsychWardTitle = class{
	static NPRINT_LEVEL = 5;

	// This (basically) gets multiplied by HARD_RELOAD_WAIT_CAP
	HARD_RELOAD_SLEEP = 275;

	// Waiting forever is fucking stupid
	HARD_RELOAD_WAIT_CAP = 50;

	HARD_RELOAD_RETRY_CAP = 2;

	constructor(psych_ward, cfg){
		const self = ksys.util.nprint(
			ksys.util.cls_pwnage.remap(this),
			'#FF9242',
		);

		self.remote_fpath = Path(cfg.remote_fpath);
		if (cfg.local_fpath){
			self.local_fpath = Path(cfg.local_fpath);
		}else{
			self.local_fpath = null;
		}

		self.title_name = self.remote_fpath.basename;

		self.psych_ward = psych_ward;

		self.tplates = ksys.tplates.sys_tplates.psych_ward;

		self.gtz_file = null;

		self.anim_durations = new Proxy({}, {
			get(target, prop, receiver){
				if (!(prop in target)){
					target[prop] = self.calc_anim_dur(
						(prop == 'null') ? null : prop
					);
				}

				return target[prop];
			}
		});

		self._dom = null;
	}

	$dom(self){
		if (self._dom){
			return self._dom
		}

		self._dom = self.tplates.title_unit({
			'preview_img':    'img.preview_img',
			'title_name':     '.title_name',
			'hard_reload':    'sysbtn.hard_reload',
			'vmix_presence':  '.presence.vmix',
			'local_presence': '.presence.pc',
			'edit':           '.edit_in_gtz_designer',
		})

		self._dom.index.hard_reload.onclick = async function(){
			if ( !!(await self.hard_reload()) ){
				ksys.info_msg.send_msg(
					`Reloaded ${self.title_name}`,
					'ok',
					3500
				);
			}else{
				ksys.info_msg.send_msg(
					`FATAL: Could not reload ${self.title_name}`,
					'err',
					7000
				);
			}

			await self.check_for_presence();
		}

		if (ksys.util.isDev()){
			self._dom.index.edit.classList.remove('kbsys_hidden');
			self._dom.index.edit.onclick = self.gtz_edit;
		}

		self._dom.root.onmouseover = self.display_vis_info;

		return self._dom
	}

	display_vis_info(self){
		self.psych_ward.editor_dom.index.thumbnail.src = self._dom.index.preview_img.src;
		const anims_info_lines = [
			['IN',  self.anim_durations[null].toFixed(3)],
			['OUT', self.anim_durations['TransitionOut'].toFixed(3)],
			[' ',   ' '],
		];

		let page_idx = 1;
		while (self.gtz_file.doc_xml.querySelector(`[Type="Page${page_idx}"]`)){
			anims_info_lines.push([
				`PAGE ${page_idx}`, self.anim_durations[`Page${page_idx}`].toFixed(3),
			])

			page_idx += 1;
		}

		self.psych_ward.editor_dom.index.facts_anims.textContent = (
			anims_info_lines
			.map(function(line){
				const [label, line_data] = line;
				return `${label.padEnd(16)}:  ${line_data}`;
			})
			.join('\n')
		);

		let phantom_len = 0;
		for (const file of Object.values(self.gtz_file.kb_data.files)){
			phantom_len += file.buf.length;
		}

		const phantom_len_kb = Math.floor(phantom_len / 1024);
		const phantom_len_bytes = phantom_len - (1024 * phantom_len_kb);

		self.psych_ward.editor_dom.index.facts_phantom.textContent = [
			'PHANTOM:',
			`${Object.values(self.gtz_file.kb_data.files).length} FILES`,
			`@ ${phantom_len_kb}.${phantom_len_bytes} KB`,
		].join('\n');
	}

	async count_duplicates(self){
		return (
			(await vmix.talker.project())
			.querySelectorAll(`inputs [title="${self.title_name}"]`)
			.length
		)
	}

	async hard_reload(self, wait_factor=1, retries_factor=1){
		const kbnc = ksys.kbnc.KBNC.sysData().currentClient;

		const remotePath = Path(
			'C:/custom/vmix_assets/current_titles',
			self.local_fpath.basename
		)

		const kbncResult = await kbnc.runCMD('generic.write_file', {
			'header': {
				'fpath': str(remotePath),
			},
			'payload': self.local_fpath.readFileSync(),
		})
		await kbncResult.result();

		let count_last = await self.count_duplicates();

		let retries = 0;

		while (count_last > 0){
			self.nprint('Removing', self.title_name);

			if (retries >= Math.ceil(self.HARD_RELOAD_RETRY_CAP * retries_factor)){
				return false
			}

			// Commandeer VMIX to remove the title
			await vmix.talker.talk({
				'Function': `RemoveInput`,
				'Input': self.title_name,
			})

			// Wait for VMIX to remove this duplicate
			const retry_cap = Math.ceil(self.HARD_RELOAD_WAIT_CAP * wait_factor);
			for (const i of range(retry_cap)){
				await ksys.util.sleep(self.HARD_RELOAD_SLEEP);
				const new_count = await self.count_duplicates();
				if (count_last != new_count){
					count_last = new_count;
					break
				}
				self.nprint('Waiting...', `${i+1}/${retry_cap}`);
			}

			// Don't wait forever
			retries += 1
		}

		// Re-add self
		await vmix.talker.talk({
			'Function': `AddInput`,
			'Value': `Title|${str(remotePath)}`,
		})

		return true
	}

	redraw(self){
		// First things first - redraw something that doesn't require local presence
		self.dom.index.title_name.textContent = Path(self.title_name).stem;

		self.nprint('Reading .gtzip', self.title_name.stem, self.local_fpath)

		if (!self.local_fpath || !self.local_fpath.isFileSync()){
			return
		}

		// If file is present on local machine - show the preview
		self.gtz_file = new ksys.gtzip_wrangler.GTZipFile({
			'fpath': self.local_fpath,
		});

		self.dom.index.preview_img.src = URL.createObjectURL(
			new Blob([self.gtz_file.zip_buf.readFile('thumbnail.png')])
		);

		// self.nprint(self.gtz_file, self.gtz_file.kb_data);
	}

	async check_for_presence(self, src_xml=null){
		const vmix_presence = !!(src_xml || (await vmix.talker.project())).querySelector(
			`inputs [title="${self.title_name}"]`
		)

		const local_presence = self.local_fpath?.isFileSync?.();

		self.dom.index.vmix_presence.classList.toggle(
			'kbsys_hidden_opacity',
			!vmix_presence
		)

		self.dom.index.local_presence.classList.toggle(
			'kbsys_hidden_opacity',
			!local_presence
		)
	}

	calc_anim_dur(self, anim_type){
		for (const storyboard of self.gtz_file.doc_xml.querySelectorAll('Storyboard')){
			if (storyboard.getAttribute('Type') == anim_type){
				const durations = [];
				for (const item of storyboard.querySelectorAll('[Delay], [Duration]')){
					if (item.nodeName == 'None'){continue};

					durations.push(
						float(item.getAttribute('Delay') || 0) +
						float(item.getAttribute('Duration') || 0)
					)
				}

				return (durations.sort().pop() || 0.5) * 1000
			}
		}

		return 0.5
	}

	gtz_edit(self){
		// "C:\Program Files (x86)\vMix\GT\GTDesigner.exe"

		const child = spawn('C:\\Program Files (x86)\\vMix\\GT\\GTDesigner.exe', [self.local_fpath], {
			detached: true,
			stdio: 'ignore',
			windowsHide: true
		})

		// Detach from parent so the parent can exit and Node will not wait
		child.unref()
	}
}





const PsychWard = class{
	constructor(){
		const self = ksys.util.nprint(
			ksys.util.cls_pwnage.remap(this),
			'#FF4242',
		);

		self.tplates = ksys.tplates.sys_tplates.psych_ward;

		self.titles = new Set();

		self._editor_dom = null;
		// self._local_dir = null;
		// self._remote_dir = null;
	}

	static get SYSDATA(){
		return sys_data
	}

	$editor_dom(self){
		if (self._editor_dom){
			return self._editor_dom
		}

		self._editor_dom = self.tplates.editor({
			// Directories
			'local_dir':  'input.local_dir',
			'remote_dir': 'input.remote_dir',

			// Textarea with gtzip names
			'flist':      'textarea.flist',

			// Visual output
			'results':       '.psych_ward_results',
			'thumbnail':     '.title_thumbnail img',
			'facts_anims':   '.title_facts .anims',
			'facts_phantom': '.title_facts .phantom',

			// Buttons
			'install_fonts':         'sysbtn.install_fonts',
			'pack_fonts':            'sysbtn.pack_fonts',
			'hard_reload_all':       'sysbtn.hard_reload_all',
			'redraw':                'sysbtn.redraw',
			'check_presence':        'sysbtn.check_presence_all',
			'render_hires_previews': 'sysbtn.render_hires_previews',
		})

		self._editor_dom.index.local_dir.onchange = function(){
			self.local_dir = self.editor_dom.index.local_dir.value;
			self.redraw();
			self.save();
		}

		self._editor_dom.index.remote_dir.onchange = function(){
			self.remote_dir = self.editor_dom.index.remote_dir.value;
			self.redraw();
			self.save();
		}

		self._editor_dom.index.flist.onchange = function(){
			self.redraw();
			self.save();
		}

		self._editor_dom.index.hard_reload_all.onclick = async function(){
			await self.hard_reload_all();
			ksys.info_msg.send_msg(
				'Done Reloading',
				'ok',
				9000
			);
		}

		self._editor_dom.index.pack_fonts.onclick = async function(){
			await self.pack_all_fonts();
			ksys.info_msg.send_msg(
				'Done Packing Fonts',
				'ok',
				7000
			);
		}

		self._editor_dom.index.install_fonts.onclick = async function(){
			await self.install_fonts();
			ksys.info_msg.send_msg(
				'Done installing fonts',
				'ok',
				7000
			);
		}

		self._editor_dom.index.redraw.onclick = function(){
			self.redraw();
			ksys.info_msg.send_msg(
				'Done',
				'ok',
				3000
			);
		}

		self._editor_dom.index.check_presence.onclick = async function(){
			await self.check_presence_all();
			ksys.info_msg.send_msg(
				'Done Checking',
				'ok',
				3000
			);
		}

		self._editor_dom.index.render_hires_previews.onclick = async function(){
			await self.render_hires_previews();
		}

		self._editor_dom.index.thumbnail.onmousedown = function(){
			const pootis = $(`
				<img
					contain
					id="vb_fullscreen_preview"
					src="${self._editor_dom.index.thumbnail.src}"
				>
			`)[0];
			document.body.append(pootis);
			pootis.onmouseup = function(){
				pootis?.remove?.();
			}
		}

		return self._editor_dom
	}

	$local_dir(self){
		const fpath = (self.editor_dom.index.local_dir.value || '').trim();
		if (fpath){
			return Path(fpath)
		}else{
			return null
		}
	}

	$$local_dir(self, tgt_dir){
		if (!tgt_dir){return};
		self.editor_dom.index.local_dir.value = (
			str(tgt_dir)
			.replaceAll('"', '')
			.replaceAll('\\', '/')
			.trim()
		);
	}

	$remote_dir(self){
		const fpath = (self.editor_dom.index.remote_dir.value || '').trim();
		if (fpath){
			return Path(fpath)
		}else{
			return null
		}
	}

	$$remote_dir(self, tgt_dir){
		if (!tgt_dir){return};
		self.editor_dom.index.remote_dir.value = (
			str(tgt_dir)
			.replaceAll('"', '')
			.replaceAll('\\', '/')
			.trim()
		);
	}

	lock_gui(self){
		self.editor_dom.root.classList.add('kbsys_locked');
	}

	unlock_gui(self){
		self.editor_dom.root.classList.remove('kbsys_locked');
	}

	save(self){
		ksys.db.module.write('_psych_ward.kbcfg', JSON.stringify({
			'remote_dir': str(self.remote_dir),
			'local_dir':  str(self.local_dir),
			'flist':      self.editor_dom.index.flist.value,
		}));
	}

	load(self){
		const cfg = ksys.db.module.read('_psych_ward.kbcfg', 'json');
		if (!cfg){return};

		self.remote_dir = cfg.remote_dir;
		self.local_dir = cfg.local_dir;
		self.editor_dom.index.flist.value = cfg.flist;

		self.redraw();

		self.check_presence_all();
	}

	read_input(self){
		// textarea value
		const input_text = self.editor_dom.index.flist.value;

		// Absolute paths to gtzip titles
		const done = [];
		const titles = [];

		for (let line of input_text.split('\n')){
			line = line.replaceAll('.gtzip', '').trim();

			if (!line){continue};
			if (line.startsWith('#')){continue};
			if (done.includes(line)){continue};
			done.push(line);

			const paths = [null, null];

			if (self.remote_dir){
				paths[0] = Path(self.remote_dir, `${line}.gtzip`);
			}

			if (self.local_dir){
				paths[1] = Path(self.local_dir, `${line}.gtzip`);
			}

			titles.push(paths)
		}

		return titles
	}

	// Fucking object urls
	free(self){
		for (const title of self.titles){
			// Important fucking shit: URL.createObjectURL fucks with garbage collection...
			URL.revokeObjectURL(title.dom.index.preview_img.src);
		}
	}

	// Redraw all titles based on textarea input
	redraw(self){
		const fpath_list = self.read_input();
		self.nprint('Read input:', fpath_list);

		// Clear previous titles
		self.free();
		self.titles.clear();
		self.editor_dom.index.results.innerHTML = '';

		if (self.remote_dir || self.local_dir){
			for (const fpath_data of fpath_list){
				const [remote_fpath, local_fpath] = fpath_data;
				const psych_ward_title = new PsychWardTitle(self, {
					remote_fpath,
					local_fpath,
				})

				psych_ward_title.redraw();

				self.titles.add(psych_ward_title);

				self.editor_dom.index.results.append(psych_ward_title.dom.root);
			}
		}

		self.check_presence_all();
	}

	// Hard reload all titles in VMIX
	async hard_reload_all(self){
		try{
			self.lock_gui();
			for (const title of self.titles){
				if ( !!(await title.hard_reload()) ){
					ksys.info_msg.send_msg(
						`Reloaded ${title.title_name}`,
						'ok',
						1000
					);
				}else{
					ksys.info_msg.send_msg(
						`FATAL: Could not reload ${title.title_name}`,
						'err',
						7000
					);
				}
			}
			await self.check_presence_all();
		}catch(e){
			self.nerr(e);
		}finally{
			self.unlock_gui();
		}
	}

	async check_presence_all(self){
		const project_xml = await vmix.talker.project();

		try{
			self.lock_gui();
			for (const title of self.titles){
				await title.check_for_presence(project_xml);
			}
		}catch(e){
			self.nprint(e);
		}finally{
			self.unlock_gui();
		}
	}

	async pack_all_fonts(self){
		const font_packer = new ksys.gtzip_wrangler.fontPacker();

		try{
			self.lock_gui();
			for (const title of self.titles){
				const gtz_title = new ksys.gtzip_wrangler.GTZipFile({
					'fpath': title.local_fpath,
				})

				await font_packer.packFonts(gtz_title, true);

				Path(title.local_fpath).writeFileSync(
					gtz_title.to_zip_buf()
				);
			}
		}catch(e){
			self.nprint(e);
		}finally{
			self.unlock_gui();
		}
	}

	async install_fonts(self){
		try{
			self.lock_gui();
			const kbnc = ksys.kbnc.KBNC.sysData().currentClient;
			for (const title of self.titles){
				const gtz_title = new ksys.gtzip_wrangler.GTZipFile({
					'fpath': title.local_fpath,
				})

				for (const file of Object.values(gtz_title.kb_data.files)){
					if (file.grp == 'fonts'){
						const writeFileResult = await kbnc.runCMD('generic.write_file', {
							'header': {
								'fpath': `C:/custom/vmix_assets/kbnc/fonts/${file.fname}`,
							},
							'payload': file.buf,
						})
						self.nprint(
							'Write font result:',
							await writeFileResult.result()
						)
					}
				}
			}

			await (await kbnc.runCMD('generic.explorer_dir', {
				'header': {
					'dir_path': `C:/custom/vmix_assets/kbnc/fonts`,
				},
			})).result()

			await ksys.util.sleep(2000);

			await (await kbnc.runCMD('generic.show_msg', {
				'header': {
					'msgTitle': 'KickBoxer 3000 INFO',
					'msgContent': [
						'Ctrl + A -> Shift + RMB -> Install For All Users',
						'Ctrl + A -> Shift + Delete',
					].join('\n'),
				},
			})).result()

		}catch(e){
			self.nprint(e);
		}finally{
			self.unlock_gui();
		}
	}

	async render_hires_previews(self){
		try{
			self.lock_gui();
			const kbnc = ksys.kbnc.KBNC.sysData().currentClient;
			if (!kbnc?.enabled){return};

			for (const title of self.titles){
				if ( !!(await title.hard_reload()) ){
					await ksys.util.sleep(1000);

					const titleControl = new vmix.title(title.title_name);

					await titleControl.overlay_in(1);

					await ksys.util.sleep(500);

					await vmix.talker.talk({
						'Function': 'SnapshotInput',
						'Value': 'C:\\custom\\vmix_assets\\buf.png',
						'Input': title.title_name,
					})

					await ksys.util.sleep(1000);

					const msg = await kbnc.runCMD('generic.read_file', {
						'header': {
							'fpath': 'C:\\custom\\vmix_assets\\buf.png',
						},
					})

					const gtz_file = new ksys.gtzip_wrangler.GTZipFile({
						'fpath': title.local_fpath,
					});

					gtz_file.zip_buf.getEntry('thumbnail.png').setData(
						(await msg.result()).payload
					)

					Path(title.local_fpath).writeFileSync(
						gtz_file.to_zip_buf()
					)

					await ksys.util.sleep(500);

					ksys.info_msg.send_msg(
						`Rendered ${title.title_name}`,
						'ok',
						1000
					);
				}else{
					ksys.info_msg.send_msg(
						`FATAL: Could not render ${title.title_name}`,
						'err',
						7000
					);
				}
			}

			self.redraw();
		}catch(e){
			self.nerr(e);
		}finally{
			self.unlock_gui();
		}
	}
}


// Module Init
const m_init = function(){
	sys_data?.current_editor?.free?.();
	const tgt_editor = qsel('psych-ward');
	if (!tgt_editor){return};

	const psych_ward = new PsychWard();
	psych_ward.load();

	sys_data.current_editor = psych_ward;

	tgt_editor.replaceWith(psych_ward.editor_dom.root);
}








module.exports = {
	PsychWard,
	m_init,
}






