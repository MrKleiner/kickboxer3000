

const sys_data = {};




const PsychWardTitle = class{
	// This gets multiplied by HARD_RELOAD_WAIT_CAP
	HARD_RELOAD_SLEEP = 275;

	// Waiting forever is fucking stupid
	HARD_RELOAD_WAIT_CAP = 50;

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

		self._dom = null;
	}

	$dom(self){
		if (self._dom){
			return self._dom
		}

		self._dom = self.tplates.title_unit({
			'preview_img': 'img.preview_img',
			'title_name':  '.title_name',
			'hard_reload': 'sysbtn.hard_reload',
		})

		self._dom.index.hard_reload.onclick = async function(){
			await self.hard_reload();
			ksys.info_msg.send_msg(
				`Reloaded ${self.title_name}`,
				'ok',
				4000
			);
		}

		self._dom.root.onmouseover = function(){
			self.psych_ward.editor_dom.index.thumbnail.src = self._dom.index.preview_img.src;
		}

		return self._dom
	}

	async count_duplicates(self){
		return (await vmix.talker.project()).querySelectorAll(`inputs [title="${self.title_name}"]`).length
	}

	async hard_reload(self){
		let count_last = await self.count_duplicates();

		while (count_last > 0){
			self.nprint('Removing', self.title_name);
			// Commandeer VMIX to remove the title
			await vmix.talker.talk({
				'Function': `RemoveInput`,
				'Input': self.title_name,
			})
			// Wait for VMIX to remove this duplicate
			for (const i of range(self.HARD_RELOAD_WAIT_CAP)){
				await ksys.util.sleep(self.HARD_RELOAD_SLEEP);
				const new_count = await self.count_duplicates();
				if (count_last != new_count){
					count_last = new_count;
					break
				}
				self.nprint('Waiting...', `${i}/${self.HARD_RELOAD_WAIT_CAP}`);
			}
		}

		// Re-add self
		await vmix.talker.talk({
			'Function': `AddInput`,
			'Value': `Title|${str(self.remote_fpath)}`,
		})
	}

	redraw(self){
		// First things first - redraw something that doesn't require local presence
		self.dom.index.title_name.textContent = Path(self.title_name).stem;

		self.nprint('Reading .gtzip', self.title_name.stem, self.local_fpath)

		if (!self.local_fpath || !self.local_fpath.isFileSync()){
			return
		}

		// If file is present on local machine - show the preview
		const gtz_file = new ksys.gtzip_wrangler.GTZipFile({
			'fpath': self.local_fpath,
		});

		self.dom.index.preview_img.src = URL.createObjectURL(
			new Blob([gtz_file.zip_buf.readFile('thumbnail.png')])
		);
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
			'results':    '.psych_ward_results',
			'thumbnail':  'img.title_thumbnail',

			// Buttons
			'hard_reload_all':  'sysbtn.hard_reload_all',
			'redraw':           'sysbtn.redraw',
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
		self._editor_dom.index.redraw.onclick = function(){
			self.redraw();
			ksys.info_msg.send_msg(
				'Done',
				'ok',
				3000
			);
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
	}

	// Hard reload all titles in VMIX
	async hard_reload_all(self){
		try{
			self.lock_gui();
			for (const title of self.titles){
				await title.hard_reload();
				ksys.info_msg.send_msg(
					`Reloaded ${title.title_name}`,
					'ok',
					1000
				);
			}
		}catch{}

		self.unlock_gui();
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






