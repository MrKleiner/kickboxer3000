

const sys_data = {};



const BasicTextEditor = class{

	MIN_LINES = 10;
	LINE_HEIGHT = 20;

	constructor(_params){
		const self = ksys.util.nprint(
			ksys.util.cls_pwnage.remap(this),
			'#FF9242',
		);

		const params = _params || {};

		self._DOM = null;

		self.MIN_LINES =       params.MIN_LINES || self.MIN_LINES;
		self.LINE_HEIGHT =     params.LINE_HEIGHT || self.LINE_HEIGHT;

		self.redraw();
	}

	$selectedLines(self){
		const text =     self.realVal.replace(/\r/g, '');
		const selStart = self.DOM.index.textarea.selectionStart;
		const selEnd =   self.DOM.index.textarea.selectionEnd;

		const lines = text.split('\n');
		const result = [];

		let index = 0;

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const lineStart = index;
			const lineEnd = index + line.length;

			let selected = false;

			if (selStart === selEnd) {
				// caret
				selected = selStart >= lineStart && selStart <= lineEnd;
			} else {
				// overlap
				selected = selStart <= lineEnd && selEnd >= lineStart;
			}

			result.push({
				text: line,
				selected: selected,
				disabled: line.trim().startsWith('#'),
			});

			// +1 for newline
			index = lineEnd + 1;
		}

		return result;
	}

	$DOM(self){
		if (self._DOM){
			return self._DOM
		}

		self._DOM = ksys.tplates.sys_tplates.general.basic_text_editor({
			'textarea': 'textarea',
			'twrap':    '.textarea_wrap',
		});

		self._DOM.root.appendTo = function(targetElement){
			targetElement.append(self._DOM.root);

			self._DOM.index.textarea.oninput = self.redraw;
			self._DOM.index.textarea.onkeydown = function(evt){
				if (evt.repeat){return};
				if (evt.ctrlKey && evt.which == 81){
					self.toogleSelectedLines();
				}
			}

			self._DOM.index.textarea.onkeyup = self.highlightSelectedLines;

			// self._DOM.index.textarea.onselectionchange = self.highlightSelectedLines;
			self._DOM.index.textarea.onselect = self.highlightSelectedLines;

			self._DOM.index.textarea.style.lineHeight = `${self.LINE_HEIGHT}px`;
		}

		return self._DOM
	}

	$realVal(self){
		return self.DOM.index.textarea.value
	}

	$$realVal(self, val){
		self.DOM.index.textarea.value = val;
		self.redraw()
	}

	$computedVal(self){
		const items = [];
		for (let line of self.realVal.split('\n')){
			line = line.trim();

			if (!line){continue};
			if (line.startsWith('#')){continue};

			items.push(line);
		}

		return items
	}

	addLine(self, disabled=false){
		const lineDOM = document.createElement('div');
		lineDOM.style.height = `${self.LINE_HEIGHT}px`;
		lineDOM.classList.add('line');
		lineDOM.classList.toggle('disabled', disabled);

		self.DOM.index.twrap.append(lineDOM);
		return lineDOM
	}

	redraw(self){
		const DOMIDX = self.DOM.index;
		const DOMRoot = self.DOM.root;

		for (const line of DOMIDX.twrap.querySelectorAll('.line')){
			line.remove();
		}

		for (const line of self.realVal.split('\n')){
			self.addLine(
				line.trim().startsWith('#')
			)
		}

		while (DOMRoot.querySelectorAll('.line').length < self.MIN_LINES){
			self.addLine(false);
		}

		DOMIDX.textarea.style.height = (
			`${DOMRoot.querySelectorAll('.line').length * self.LINE_HEIGHT}px`
		);

		self.highlightSelectedLines();
	}

	highlightSelectedLines(self){
		return;

		let i = 0;
		const bgLines = self.DOM.root.querySelectorAll('.line');
		for (const line of self.selectedLines){
			bgLines[i].classList.toggle('selected', line.selected);
			i++
		}
	}

	toogleSelectedLines(self){
		const textarea = self.DOM.index.textarea;

		const selectionStart = textarea.selectionStart;
		const selectionEnd = textarea.selectionEnd;

		const newLines = [];

		const disableStates = [];
		for (const line of self.selectedLines){
			if (line.text.trim() && line.selected){
				disableStates.push(line.disabled);
			}
		}

		const forceDisable = disableStates.includes(true) && disableStates.includes(false);

		for (const line of self.selectedLines){
			const textTrim = line.text.trim();

			if (line.selected && textTrim){
				if (forceDisable){
					if (!textTrim.startsWith('#')){
						line.text = '# ' + line.text;
					}
				}else{
					if (textTrim.startsWith('#')){
						line.text = line.text.replace('#', '').trim();
					}else{
						line.text = '# ' + line.text;
					}
				}
			}

			newLines.push(line.text)
		}

		self.realVal = newLines.join('\n');

		textarea.selectionStart = selectionStart;
		textarea.selectionEnd = selectionStart;

		try{
			textarea?.onchange?.();
		}catch(e){
			console.error(e);
		}
		
	}
}




const PsychWardTitle = class{
	static NPRINT_LEVEL = 5;

	// This (basically) gets multiplied by HARD_RELOAD_WAIT_CAP
	HARD_RELOAD_SLEEP = 275;

	// Waiting forever is fucking stupid
	HARD_RELOAD_WAIT_CAP = 50;

	HARD_RELOAD_RETRY_CAP = 2;

	// For how long to wait for titles to appear in VMIX
	HARD_RELOAD_ADD_WAIT_CAP = 15;

	STORYBOARD_SHORTER_NAMES = Object.freeze({
		[null]:            'IN',
		['TransitionOut']: 'OUT',
	})

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

		self.noVMIX = cfg.noVMIX;

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
			'wipe_icon':      '.presence.wipe',
			'edit':           '.edit_in_gtz_designer',
			'unpack':         '.unpack_as_archive',
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

		self._dom.index.unpack.onclick = self.unpack;

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

		// Pages
		let page_idx = 1;
		while (self.gtz_file.doc_xml.querySelector(`[Type="Page${page_idx}"]`)){
			anims_info_lines.push([
				`PAGE ${page_idx}`, self.anim_durations[`Page${page_idx}`].toFixed(3),
			])

			page_idx += 1;
		}

		// Image sequences
		const imageSequenceFactsLines = [];

		for (const storyboardEntry of self.gtz_file.doc_xml.querySelectorAll('Storyboard ImageSequence')){
			const objectID = storyboardEntry.getAttribute('Object');
			const objectData = self.gtz_file.doc_xml.querySelector(`Layer [Name="${objectID}"]`);
			if (!objectID || !objectData){continue};

			const storyboardType = storyboardEntry.closest('Storyboard').getAttribute('Type');
			// The same image sequence can be used by multiple items
			// with different duration in seconds
			const declaredSeconds = float(storyboardEntry.getAttribute('Duration') || 1);
			const targetSequence = self.gtz_file.imageSequences[
				objectData.querySelector('Bitmap')?.getAttribute?.('Source')
			];
			if (!targetSequence){continue};

			// Total amount of frames in this sequence
			const frameAmount = targetSequence.frames.length;
			// Guess FPS based on declared animation duration
			const FPSGuess = targetSequence.FPSFromDuration(declaredSeconds);
			// This sequence should animate for this amount of time in seconds IF
			// the duration was calculated by dividing the frame amount by 50
			const sampleDuration = targetSequence.durationFromFPS(50);

			// Resulting description chunks
			const descrStringElements = [
				`${frameAmount}f`.padEnd(4),
				// Guessed FPS
				`@${declaredSeconds}s`.padEnd(6), '=', `~${FPSGuess}fps`.padEnd(9), '/',
				// Sample FPS
				`@${50}fps`.padEnd(3), '=', `~${sampleDuration}s`.padEnd(7),
			]

			imageSequenceFactsLines.push([
				`SEQ | ${objectID.padEnd(15)} | ${self.STORYBOARD_SHORTER_NAMES[storyboardType]}`,
				descrStringElements.join(' '),
			])
		}

		// Set text for general facts
		self.psych_ward.editor_dom.index.facts_anims.textContent = (
			anims_info_lines
			.map(function(line){
				const [label, line_data] = line;
				return `${label.padEnd(16)}:  ${line_data}`;
			})
			.join('\n')
		);

		// Set text for image sequence facts
		self.psych_ward.editor_dom.index.img_sequence_facts.textContent = (
			imageSequenceFactsLines
			.map(function(line){
				const [label, line_data] = line;
				return `${label.padEnd(32)}:  ${line_data}`;
			})
			.join('\n')
		);

		// Phantom files total size
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

	async hard_reload(self, params){
		if (!self.local_fpath.isFileSync()){return false};
		if (self.noVMIX){return true};

		const kbnc = ksys.kbnc.KBNC.sysData().currentClient;

		const remotePath = Path(
			'C:/custom/vmix_assets/current_titles',
			ksys.context.module_name || 'unknown_module',
			(new Date()).toDateString().replaceAll(' ', '_'),
			self.local_fpath.basename
		)

		const GTZFile = new ksys.gtzip_wrangler.GTZipFile({
			'fpath': self.local_fpath,
		});

		// Wipe fields IF there's wipe definition
		const wipeDefinition = self.gtz_file.kb_data.files['kbsys/wipeParams']?.buf;
		if (wipeDefinition && !params?.nowipe){
			for (const fieldParams of (JSON.parse(wipeDefinition)?.fields || [])){
				try{
					if (!fieldParams.fieldID){continue};
					const tgtDOM = GTZFile.doc_xml.querySelector(
						`[Name="${fieldParams.fieldID}"]`
					);
					if (!tgtDOM){continue};

					if (tgtDOM.nodeName == 'TextBlock'){
						tgtDOM.setAttribute('Text', fieldParams.wipeTo || '');
					}
					if (tgtDOM.nodeName == 'Rectangle'){
						tgtDOM.querySelector('Rectangle\\.Fill Brush')
						?.setAttribute
						?.('Color', fieldParams.wipeTo || '00000000');
					}
					if (tgtDOM.nodeName == 'Image'){
						const fileUID = GTZFile.res_xml.querySelector(
							`[filename="${tgtDOM.querySelector('Bitmap').getAttribute('Source').replaceAll('\\', '\\\\')}"]`
						)?.querySelector?.('source')?.getAttribute?.('guid');

						if (fileUID){
							GTZFile.zip_buf.getEntry(fileUID).setData(
								app_root.join('assets', 'phantom_transparent.png').readFileSync()
							)
						}
					}
				}catch(e){
					self.nerr(e);
				}
			}
		}

		const kbncResult = await kbnc.runCMD('generic.write_file', {
			'header': {
				'fpath': str(remotePath),
			},
			'payload': GTZFile.to_zip_buf(),
		});

		await kbncResult.result();

		let count_last = await self.count_duplicates();

		let retries = 0;

		while (count_last > 0){
			self.nprint('Removing', self.title_name);

			if (retries >= Math.ceil(self.HARD_RELOAD_RETRY_CAP * (params?.retries_factor || 1))){
				return false
			}

			// Commandeer VMIX to remove the title
			await vmix.talker.talk({
				'Function': `RemoveInput`,
				'Input': self.title_name,
			})

			// Wait for VMIX to remove this duplicate
			const retry_cap = Math.ceil(self.HARD_RELOAD_WAIT_CAP * (params?.wait_factor || 1));
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

		// Wait for the title to appear
		for (const i of range(self.HARD_RELOAD_ADD_WAIT_CAP)){
			if (await self.count_duplicates()){
				break
			}

			await ksys.util.sleep(125);
		}

		// Apply shift
		if (GTZFile.kb_data.meta.shift && !params?.nowipe){
			await vmix.talker.talk({
				'Function': `SetPanX`,
				'Input': self.title_name,
				'Value': GTZFile.kb_data.meta.shift.x,
			})
			await vmix.talker.talk({
				'Function': `SetPanY`,
				'Input': self.title_name,
				'Value': GTZFile.kb_data.meta.shift.y,
			})
		}

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

		if (self.gtz_file.kb_data.files['kbsys/wipeParams']){
			self.dom.index.wipe_icon.classList.remove('kbsys_hidden_opacity');
		}else{
			self.dom.index.wipe_icon.classList.add('kbsys_hidden_opacity');
		}

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
						float(item.getAttribute('Duration') || 1)
					)
				}

				// return (durations.sort().pop() || 0.5) * 1000
				return (durations.sort().pop() || 1.0) * 1000
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

	unpack(self){
		self.gtz_file.unpack(
			self.local_fpath.parent().join(
				self.local_fpath.basename.replaceAll('.gtzip', '')
			)
		)
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
			'flist':      '.flist',

			// Visual output
			'results':            '.psych_ward_results',
			'thumbnail':          '.title_thumbnail img',
			'facts_anims':        '.title_facts .anims',
			'facts_phantom':      '.title_facts .phantom',
			'img_sequence_facts': '.img_sequence_facts',

			// Buttons
			'install_fonts':         'sysbtn.install_fonts',
			'pack_fonts':            'sysbtn.pack_fonts',
			'hard_reload_all':       'sysbtn.hard_reload_all',
			'redraw':                'sysbtn.redraw',
			'check_presence':        'sysbtn.check_presence_all',
			'render_hires_previews': 'sysbtn.render_hires_previews',
			'check_missing_fonts':   'sysbtn.check_fonts',
			'missing_fonts_box':     '.font_check',
		});

		self.fileListTextEditor = new BasicTextEditor();
		self.fileListTextEditor.DOM.root.appendTo(
			self._editor_dom.index.flist
		)

		self.fileListTextEditor.DOM.index.textarea.onchange = function(){
			self.redraw();
			self.save();
		}

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
			// self.redraw();
			// self.save();
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

		self._editor_dom.index.check_missing_fonts.onclick = async function(){
			await self.checkMissingFonts();
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

		// const logWarn = function(){
		// 	const tplate = self.tplates.missing_fonts_log_entry({});
		// 	tplate.root.textContent = [...arguments].join(' ');
		// 	self.editor_dom.index.missing_fonts_box.append(tplate.root);
		// };

		// logWarn(
		// 	`Current .vmix file doesn't contain info for input`,
		// 	'fuck_shit.gtzip'
		// )

		// for (const _ of range(20)){
		// 	const inputTemplate = self.tplates.missing_font_title({
		// 		'label':     '.label',
		// 		'font_list': '.font_list',
		// 	});

		// 	inputTemplate.index.label.textContent = 'fuck_shit.gtzip';

		// 	for (const missingFontName of ['Pootis Regular', 'Bebra Neue', 'Fuck Shit', 'Pootis Medic']){
		// 		const fontTemplate = self.tplates.missing_font_instance({});

		// 		fontTemplate.root.textContent = missingFontName;

		// 		inputTemplate.index.font_list.append(fontTemplate.root);
		// 	}

		// 	self.editor_dom.index.missing_fonts_box.append(
		// 		inputTemplate.root
		// 	)
		// }

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
			'flist':      self.fileListTextEditor.realVal,
		}));
	}

	load(self){
		const cfg = ksys.db.module.read('_psych_ward.kbcfg', 'json');
		if (!cfg){return};

		self.remote_dir = cfg.remote_dir;
		self.local_dir = cfg.local_dir;
		self.fileListTextEditor.realVal = cfg.flist;

		self.redraw();

		self.check_presence_all();
	}

	read_input(self){
		// textarea value
		const input_text = self.fileListTextEditor.realVal;

		// Absolute paths to gtzip titles
		const done = [];
		const titles = [];

		for (let line of input_text.split('\n')){
			line = line.replaceAll('.gtzip', '').trim();

			if (!line){continue};
			if (line.startsWith('#')){continue};
			if (done.includes(line)){continue};

			const paths = [null, null, false];

			if (line.startsWith('$')){
				paths[2] = true;
				line = line.replaceAll('$', '');
			};

			done.push(line);

			if (self.remote_dir){
				paths[0] = Path(self.remote_dir, `${line}.gtzip`);
			}

			if (self.local_dir){
				paths[1] = Path(self.local_dir, `${line}.gtzip`);
			}

			titles.push(paths);
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
				const [remote_fpath, local_fpath, noVMIX] = fpath_data;
				const psych_ward_title = new PsychWardTitle(self, {
					remote_fpath,
					local_fpath,
					noVMIX,
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
				if (title.noVMIX){continue};
				if ( !!(await title.hard_reload({'nowipe': true})) ){
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

	async checkMissingFonts(self){
		self.editor_dom.index.missing_fonts_box.innerHTML = '';

		const logWarn = function(){
			const tplate = self.tplates.missing_fonts_log_entry({});
			tplate.root.textContent = [...arguments].join(' ');
			self.editor_dom.index.missing_fonts_box.append(tplate.root);
		};

		const fontsPresent = null;

		const kbncRequest = await ksys.KBNClient.runCMD('fonts.list_installed', {
			'header': {},
			'payload': null,
		});

		const remoteFontMap = JSON.parse(
			(await kbncRequest.result()).payload
		);

		ksys.info_msg.send_msg(
			`Loaded remote PC's installed fonts map`,
			'ok',
			7000
		);

		self.nprint('Loaded remote installed fonts map:', remoteFontMap);

		const presetXML = await vmix.talker.presetXML();

		const missing = {};

		for (
			const titleDOM of

			(await vmix.talker.project())
			.querySelectorAll('inputs input[type="GT"]')
		){
			const titleRemoteFilePath = (
				presetXML
				?.querySelector?.(`[Key="${titleDOM.getAttribute('key')}"]`)
				?.textContent
			);

			self.nprint('Loading', titleRemoteFilePath);

			if (!titleRemoteFilePath){
				// ksys.info_msg.send_msg(
				// 	`Current .vmix file doesn't contain info for input ${titleDOM.getAttribute('title')}`,
				// 	'warn',
				// 	7000
				// );

				logWarn(
					`Current .vmix file doesn't contain info for input`,
					titleDOM.getAttribute('title'),
				)

				continue
			}

			let GTZFile = await ksys.KBNClient.runCMD('generic.read_file', {
				'header': {
					'fpath': str(titleRemoteFilePath),
				},
			});

			try{
				GTZFile = new ksys.gtzip_wrangler.GTZipFile({
					'buf': (await GTZFile.result()).payload,
				});
			}catch(e){
				// ksys.info_msg.send_msg(
				// 	`Could not scan ${titleDOM.getAttribute('title')}`,
				// 	'warn',
				// 	7000
				// );

				logWarn(
					`Couldn't load`,
					`${titleDOM.getAttribute('title')}, skipping.`, '\n',
					'See console for details.', '\n',
					'(target .gtzip is likely missing OR fucked)',
				)

				self.nwarn(e);

				continue
			}

			for (const fontFamilyName of ksys.gtzip_wrangler.fontPacker.listTitleFonts(GTZFile)){
				let found = false;
				for (let [nameVariants, fontFilePath] of remoteFontMap){
					for (const variantName of nameVariants){
						if (variantName.includes(fontFamilyName)){
							found = true;
							break
						}
					}

					if (found){break};
				}

				if (!found){
					(missing[titleDOM.getAttribute('title')] ??= []).push(
						fontFamilyName
					);

					self.nwarn(
						'Missing remote font',
						fontFamilyName,
						'from input',
						titleDOM.getAttribute('title')
					)
				}
			}
		}

		for (const [inputName, missingFonts] of Object.entries(missing)){
			const inputTemplate = self.tplates.missing_font_title({
				'label':     '.label',
				'font_list': '.font_list',
			});

			inputTemplate.index.label.textContent = inputName;

			for (const missingFontName of missingFonts){
				const fontTemplate = self.tplates.missing_font_instance({});

				fontTemplate.root.textContent = missingFontName;

				inputTemplate.index.font_list.append(fontTemplate.root);
			}

			self.editor_dom.index.missing_fonts_box.append(
				inputTemplate.root
			)
		}

		if (!Object.keys(missing).length){
			ksys.info_msg.send_msg(
				`All fonts present`,
				'ok',
				13_500
			);
		}else{
			ksys.info_msg.send_msg(
				`Missing fonts found`,
				'warn',
				13_500
			);
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






