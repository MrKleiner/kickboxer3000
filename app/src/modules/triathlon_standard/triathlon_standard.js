





$this.load = function(){
	$this.data_src_dom_list = document.querySelector('#url_sources_box');
	$this.table_list_dom = document.querySelector('#table_list');

	$this.data_sources = new Set();
	$this.titles = {
		'partner_single': new vmix.title({
			'title_name': 'partner_single.gtzip',
			'default_overlay': 2,
			'timings': {
				'fps': 10,
				'frames_in': 5,
				'margin': 5,
			},
		}),
		'partner_seq': new vmix.title({
			'title_name': 'partners_all.gtzip',
			'default_overlay': 2,
			'timings': {
				'fps': 10,
				'frames_in': 5,
				'margin': 5,
			},
		}),
		'interview': new vmix.title({
			'title_name': 'interview.gtzip',
			'default_overlay': 2,
			'timings': {
				'fps': 10,
				'frames_in': 10,
				'margin': 5,
			},
		}),
	};

	$this.partners_dir_input = document.querySelector('#partner_list_dir');
	$this.interview_name_input = document.querySelector('#interview_name_input');
	$this.guest_list = document.querySelector('#guest_list');

	$this.partnerships_ctrl = new $this.Partnerships();


	/*
	$this.add_data_source({
		'data_url': 'http://127.0.0.1:13377/301175/WQYWDFGDZH2X85S8O6K7CJUF3P0DZHC3',
		'vmix_title_name': 'table_main.gtzip',
		'descr': 'fuckshit',
		'trow_count': 10,
		'data_map': [
			'object_path = .',
			'Учасник =   tr{%i}_name_val',
			'Результат = tr{%i}_club_val',
			'# =         tr{%i}_pos_val',
		].join('\n')
	});
	$this.add_data_source({
		'data_url': 'http://127.0.0.1:13377/301175/UHSWLYPVZACD355FDF4WHXYVB53U9XWU',
		'vmix_title_name': 'table_main.gtzip',
		'descr': 'pootis',
		'trow_count': 10,
		'data_map': [
			'object_path = .',
			'Учасник =   tr{%i}_name_val',
			'Результат = tr{%i}_club_val',
			'# =         tr{%i}_pos_val',
		].join('\n')
	});
	*/
	


	// Load data sources
	const data_sources = ksys.db.module.read('data_sources.kbsave', 'json');
	if (data_sources){
		for (const data_src_input_cfg of data_sources){
			$this.add_data_source(data_src_input_cfg)
		}
	};

	$this.load_global_params();

	$this.partnerships_ctrl.resync();
}





$this.DataSRC = class{
	/*
		- input_data:
		    - data_url:
		      WEB URL pointing to data source.

		    - vmix_title_name:
		      VMIX title name this source is for.

		    - descr:
		      Short description of this title.

		    - trow_count:
		      Amount of rows in the VMIX title.

		    - data_map:
		      Data mapping.
	*/
	constructor(input_data=null){
		const self = this;
		// Fuck JS
		{
			self.cfg_gui = function(){
				return self.__cfg_gui(self, ...arguments);
			}
			self.set_field = function(){
				return self._set_field(self, ...arguments);
			}
			self.get_field = function(){
				return self._get_field(self, ...arguments);
			}
			self.apply_data = function(){
				return self._apply_data(self, ...arguments);
			}
			self.json = function(){
				return self._json(self, ...arguments);
			}
			self.kill = function(){
				return self._kill(self, ...arguments);
			}
			self.redraw = function(){
				return self._redraw(self, ...arguments);
			}
		}

		self.field_dict = {
			'data_url':        '.data_url',
			'vmix_title_name': '.vmix_title_name',
			'descr':           '.descr',
			'trow_count':      '.trow_count',
			'data_map':        '.data_map',
		}

		self.cfg = input_data || {};

		self._cfg_gui = null;

		self.linked_table = new $this.BasicTable(self);

		self.apply_data(input_data);
	}

	__cfg_gui(self){
		if (self._cfg_gui){
			return self._cfg_gui
		}

		const tplate = ksys.tplates.index_tplate(
			'#data_src_entry_template',
			{}
		);

		// for (const field_name in self.field_dict){
		// 	const field_selector = self.field_dict[field_name];
		// 	tplate.querySelector(field_selector).value = self.cfg[field_name];
		// }

		for (const field_name in self.field_dict){
			const field_selector = self.field_dict[field_name];
			const field_dom = tplate.elem.querySelector(field_selector);
			field_dom.onchange = function(){
				self.set_field(field_name, field_dom.value);
				$this.resync_table_struct();
				$this.redraw_tables_gui();
				$this.save();
			}
		}

		tplate.elem.oncontextmenu = function(evt){
			if (!evt.altKey){
				return
			}
			self.kill();
			$this.save();
		}

		self._cfg_gui = tplate.elem;

		print('Creating CFG GUI', self._cfg_gui)

		return self._cfg_gui
	}

	_set_field(self, field_name, val){
		// self.cfg_gui.querySelector(self.field_dict[field_name]).value = val;
		const field_dom = self.cfg_gui().querySelector(self.field_dict[field_name]);
		if (field_dom.getAttribute('type') == 'checkbox'){
			field_dom.checked = val
			return
		}
		field_dom.value = val;
		self.cfg[field_name] = val;

		return 
	}

	_get_field(self, field_name){
		const field_dom = self.cfg_gui().querySelector(self.field_dict[field_name]);
		if (field_dom.getAttribute('type') == 'checkbox'){
			return field_dom.checked
		}
		return field_dom.value
	}

	_apply_data(self, data=null){
		self.cfg = data || {};

		for (const field_name in self.field_dict){
			self.set_field(field_name, self.cfg[field_name] || '')
		}

		// $this.resync_table_struct();
		// $this.redraw_tables_gui();
	}

	_kill(self){
		self.cfg_gui().remove();
		self.linked_table.ctrl_gui().elem.remove();
		$this.data_sources.delete(self);
	}

	_json(self){
		const data = {};
		for (const field_name in self.field_dict){
			data[field_name] = self.get_field(field_name);
		}
		return data
	}

	_redraw(self){
		if (!$this.data_src_dom_list.contains(self.cfg_gui())){
			$this.data_src_dom_list.append(self.cfg_gui());
		}
		if (!$this.table_list_dom.contains(self.linked_table.ctrl_gui().elem)){
			$this.table_list_dom.append(self.linked_table.ctrl_gui().elem);
		}

		self.linked_table.ctrl_gui().index.header.innerText = self.get_field('descr') || 'Table';
	}
}


$this.BasicTable = class{
	constructor(data_src){
		print('Creating BasicTable', data_src)
		const self = this;
		ksys.util.cls_pwnage.remap(self);
		// Fuck JS
		/*
		{
			self.link_vmix_title = function(){
				return self._link_vmix_title(self, ...arguments);
			}
			self.ctrl_gui = function(){
				return self.__ctrl_gui(self, ...arguments);
			}
			self.create_table_data = function(){
				return self._create_table_data(self, ...arguments);
			}
			self.update_cache = async function(){
				return await self._update_cache(self, ...arguments);
			}
			self.update_title = async function(){
				return await self._update_title(self, ...arguments);
			}
			self.show_table = async function(){
				return await self._show_table(self, ...arguments);
			}
			self.hide_table = async function(){
				return await self._hide_table(self, ...arguments);
			}
		}
		*/

		self.data_src = data_src;

		self.data_cache = null;

		self._ctrl_gui = null;

		self.vmix_title = null;

		self.link_vmix_title();
	}

	link_vmix_title(self){
		self.vmix_title = new vmix.title({
			'title_name': self.data_src.get_field('vmix_title_name') || 'table_main.gtzip',
			'default_overlay': 2,
			'timings': {
				'fps': 10,
				'frames_in': 20,
				'margin': 50,
			},
		})
	}

	ctrl_gui(self){
		if (self._ctrl_gui){
			return self._ctrl_gui
		}
		const tplate = ksys.tplates.index_tplate(
			'#table_ctrl_gui_template',
			{
				'header': '.tctrl_header',
				'upd':    'vmixbtn.upd_table_btn',
				'show':   'vmixbtn.show_table_btn',
				'hide':   'vmixbtn.hide_table_btn'
			}
		);

		tplate.index.upd.onclick = async function(){
			await self.update_title();
		}
		tplate.index.show.onclick = async function(){
			await self.show_table();
		}
		tplate.index.hide.onclick = async function(){
			await self.hide_table();
		}

		self._ctrl_gui = tplate;

		return self._ctrl_gui;

	}

	create_table_data(self, input_data){
		const row_map = {};
		let data_array = null;

		// Create mapping data
		for (let line of self.data_src.get_field('data_map').split('\n')){
			line = line.trim();
			if (!line || line.startsWith('//')){continue};
			print('Line:', line)

			// First, resolve object path
			if (line.startsWith('object_path')){
				const objpath = line.split('=').at(-1).trim();
				if (objpath == '.'){
					data_array = input_data;
				}

				if (!data_array){
					data_array = ksys.util.resolve_object_path(
						input_data,
						objpath.split('.')
					)
				}

				continue
			}

			// Now create row formatting

			/*
			const [key_data, regex] = line.split('=');
			const [src_key, title_key] = key_data.split(':');
			row_map[src_key.trim()] = [
				title_key.trim(),
				regex.trim(),
			];
			*/

			// const [key, regex] = line.split('=');
			// row_map[key.trim()] = regex.trim();

			const [key, regex_data] = line.split('=');
			const [regex, text_case, translit] = regex_data.split(':')
			row_map[key.trim()] = [
				regex.trim(),
				int(text_case) ? text_case : '1',
				Boolean(int(translit)) ? translit : false,
			]
		}

		// Cannot proceed with data array
		if (!data_array){
			ksys.info_msg.send_msg(
				`Unable to resolve object path`,
				'err',
				5000
			);
			return null;
		}

		// Construct data ready for immediate VMIX push
		const cooked_data = [];

		const row_count = int(self.data_src.get_field('trow_count'));
		for (const row_idx of range(row_count)){
			const data_dict = data_array[row_idx] || {};

			for (let src_key in row_map){
				const [regex, text_case, translit] = row_map[src_key];
				cooked_data.push([
					regex.replace('{%i}', str(row_idx+1)),
					data_dict?.[src_key] || '',
					text_case,
					translit,
				])
			}
		}

		return cooked_data
	}

	// Push data to VMIX title
	async update_cache(self){
		const data_url = self.data_src.get_field('data_url');
		if (!data_url){
			ksys.info_msg.send_msg(
				`No data URL provided. Aborting.`,
				'warn',
				9000
			);
			return false
		}
		const response = await ksys.util.url_get(data_url);
		if (response.status != 'ok'){
			ksys.info_msg.send_msg(
				`URL request failed. Response code: ${response.code} | Reason: ${response.reason}. Aborting`,
				'err',
				9000
			);
			return false
		}

		const evaluated_data = JSON.parse(response.payload);
		print('Evaluated Payload data:', evaluated_data)
		self.data_cache = self.create_table_data(evaluated_data);
		return true
	}

	// Push data to VMIX title
	async update_title(self){
		const cache_updated = await self.update_cache();
		if (!self.data_cache){
			ksys.info_msg.send_msg(
				`Fatal: URL request failed and there's no cached data`,
				'err',
				10000
			);
			return
		}

		if (!cache_updated){
			ksys.info_msg.send_msg(
				`URL Request failed. Displaying cached data.`,
				'warn',
				10000
			);
		}

		for (const [vmix_title_key, text, text_case, translit] of self.data_cache){
			await self.vmix_title.set_text(
				vmix_title_key,
				ksys.util.str_ops.format(text, text_case, translit)
			);
		}
	}

	// Show table
	async show_table(self){
		await self.vmix_title.overlay_in(2);
	}

	// Show table
	async hide_table(self){
		await self.vmix_title.overlay_out(2);
	}
}

$this.Partnerships = class{
	constructor(){
		const self = this;

		// Fuck JS
		{
			self.create_partner_ctrl = function(){
				return self._create_partner_ctrl(self, ...arguments);
			}
			self.resync = function(){
				return self._resync(self, ...arguments);
			}
		}
	}

	_create_partner_ctrl(self, img_path){
		const tplate = ksys.tplates.index_tplate(
			'#partner_template',
			{
				'img':    '.partner_img',
				'apply':  'vmixbtn.partner_apply',
				'show':   'vmixbtn.partner_show',
				'hide':   'vmixbtn.partner_hide',
			}
		);

		tplate.index.img.src = str(img_path);
		tplate.index.apply.onclick = async function(){
			await $this.titles.partner_single.set_img_src(
				'overlay_img',
				str(img_path)
			)
		}
		tplate.index.show.onclick = async function(){
			$this.titles.partner_single.overlay_in(2);
		}
		tplate.index.hide.onclick = function(){
			$this.titles.partner_single.overlay_out(2);
		}

		document.querySelector('#partner_list').append(tplate.elem);
	}

	_resync(self){
		const src_dir = Path($this.partners_dir_input.value);
		if (!src_dir.isDirectorySync()){
			ksys.info_msg.send_msg(
				`Partners source is not a directory. Aborting sync`,
				'warn',
				7000
			);
			return
		}

		$('#partner_list').empty();

		for (const partner_img of src_dir.globSync('*.*')){
			self.create_partner_ctrl(partner_img);
		}

		ksys.btns.resync();
	}
}


$this.save = function(){
	const data_sources = [];
	for (data_src of $this.data_sources){
		data_sources.push(data_src.json())
	}

	ksys.db.module.write(
		'data_sources.kbsave',
		JSON.stringify(data_sources, null, '\t')
	)
}

$this.resync_table_struct = function(){
	for (const data_src of $this.data_sources){
		data_src.linked_table.link_vmix_title();
	}
}

$this.redraw_tables_gui = function(){
	for (const data_src of $this.data_sources){
		data_src.redraw();
	}
	ksys.btns.resync();
}

$this.save_global_params = function(){
	ksys.db.module.write(
		'global_params.kbsave',
		JSON.stringify(
			{
				'partners_dir': $this.partners_dir_input.value,
				'interview_name_input': $this.interview_name_input.value,
				'guest_list': $this.guest_list.value,
			},
			null,
			'\t'
		)
	)
}

$this.load_global_params = function(){
	const global_params = ksys.db.module.read('global_params.kbsave', 'json') || {};

	$this.partners_dir_input.value = global_params['partners_dir'] || '';
	$this.interview_name_input.value = global_params['interview_name_input'] || '';
	$this.guest_list.value = global_params['guest_list'] || '';
}


$this.add_data_source = function(input_data){
	const data_src = new $this.DataSRC(input_data);
	$this.data_sources.add(data_src);

	$this.redraw_tables_gui();

	return data_src
}


$this.partners_sequence = async function(state){
	if (state){
		await $this.titles.partner_seq.overlay_in(2);
	}else{
		await $this.titles.partner_seq.overlay_out(2);
	}
}


$this.interview = async function(state){
	if (state){
		await $this.titles.interview.set_text(
			'main_text',
			$this.interview_name_input.value || ''
		)
		await $this.titles.interview.overlay_in(2);
	}else{
		await $this.titles.interview.overlay_out(2);
	}
}