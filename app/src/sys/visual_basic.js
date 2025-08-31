



const VisualBasicTextField = class{
	constructor(vb_item, params){
		const self = ksys.util.nprint(
			ksys.util.cls_pwnage.remap(this),
			'#C0C3FF',
		);

		self.tplates = ksys.tplates.sys_tplates.visual_basic;

		self.vb_item = vb_item;

		self._dom = null;
		self._type_switch = null;

		self.val = params.val;
		self.field_name = params.field_name;
	}

	set_edit_type(self, tgt_type){
		self.dom.index.tgt_input.classList.add('kbsys_hidden');
		self.dom.index.tgt_textarea.classList.add('kbsys_hidden');

		self.type_switch.selected = tgt_type;

		if (tgt_type == 'html_auto'){
			if (self.val.includes('\n')){
				self.dom.index.tgt_textarea.classList.remove('kbsys_hidden');
				self.dom.index.tgt_textarea.style.height = '100px';
			}else{
				self.dom.index.tgt_input.classList.remove('kbsys_hidden');
			}
			return
		}

		if (tgt_type == 'html_input'){
			self.dom.index.tgt_input.classList.remove('kbsys_hidden');
			return
		}

		if (tgt_type == 'html_textarea'){
			self.dom.index.tgt_textarea.classList.remove('kbsys_hidden');
			self.dom.index.tgt_textarea.style.height = '100px';
			return
		}
	}

	async push_val(self, tgt_val){
		self.dom.index.tgt_input.value = tgt_val;
		self.dom.index.tgt_textarea.value = tgt_val;
		self.val = tgt_val;

		await self.vb_item.vtitle.set_text(
			self.field_name.replaceAll('.Text', ''),
			self.val
		)
	}

	$type_switch(self){
		if (self._type_switch){
			return self._type_switch
		}

		self._type_switch = new ksys.switches.KBSwitch({
			'multichoice': false,
			'can_be_empty': false,
			'set_default': 'html_auto',
			'dom_array': [
				{
					'id': 'html_auto',
					'dom': self.dom.index.edit_as_auto,
				},
				{
					'id': 'html_input',
					'dom': self.dom.index.edit_as_input,
				},
				{
					'id': 'html_textarea',
					'dom': self.dom.index.edit_as_textarea,
				},
			],
			'callback': function(kbswitch, tgt_id){
				self.set_edit_type(tgt_id);
			}
		});

		return self._type_switch
	}

	$dom(self){
		if (self._dom){
			return self._dom
		}

		self._dom = self.tplates.gt_ctrl_text_field({
			'field_name':  '.field_name',
			'edit_as':     '.edit_as',

			'edit_as_auto':     '.edit_as [html_auto]',
			'edit_as_input':    '.edit_as [html_input]',
			'edit_as_textarea': '.edit_as [html_textarea]',

			'tgt_input':    'input',
			'tgt_textarea': 'textarea',
		})

		self._dom.index.field_name.textContent = self.field_name.replaceAll('.Text', '');
		self._dom.index.tgt_input.value = self.val;
		self._dom.index.tgt_textarea.value = self.val;

		self._dom.index.tgt_input.onchange = async function(){
			await self.push_val(
				self._dom.index.tgt_input.value
			);
		}
		self._dom.index.tgt_textarea.onchange = async function(){
			await self.push_val(
				self._dom.index.tgt_textarea.value
			);
		}

		// Todo: this function calls .dom, which hasn't finished executing at this point
		// It works, because self._dom is set by now, but still - this is fucking stupid
		self.set_edit_type('html_auto');

		return self._dom
	}
}





const VisualBasicItem = class{
	ICONS = Object.freeze({
		'image':           './assets/image_icon.svg',
		'gt':              './assets/gt_title_icon.svg',
		'video':           './assets/video_icon.svg',
		'videolist':       './assets/playlist_icon.svg',
		'capture':         './assets/camera_icon.svg',
		'ndi':             './assets/ndi_icon.svg',
		'desktopcapture':  './assets/desktop_icon.svg',
		'colour':          './assets/color_palette_icon.svg',
		'virtualset':      './assets/scene_icon.svg',
		'browser':         './assets/browser_icon.svg',
	});

	constructor(vb, params){
		const self = ksys.util.nprint(
			ksys.util.cls_pwnage.remap(this),
			'#C0C3FF',
		);

		self.tplates = ksys.tplates.sys_tplates.visual_basic;

		// VisualBasic class instance reference
		self.vb = vb;

		// This input as a small list item
		self._dom_list_item = null;
		// This input's control panel
		self._dom_ctrl = null;

		// GUID is used for all the API manipulations, because
		// multiple inputs with the same name can exist
		self.guid = params.guid;
		// Visual name for visual representation in the HTML
		self.visual_name = params.visual_name;
		// This input's type, such as: gt, title, video ...
		self.input_type = params.input_type;

		// Whether this item is favourited or not
		// Needed for saving the current state
		self.fav = params.fav || false;

		// Whether this item is selected or not
		// Needed for saving the current state
		self.active = false;

		// Missing titles are impossible to manipulate for obvious reasons
		self.missing = false;

		// Some basic control
		self.vtitle = new vmix.title(self.guid || self.visual_name);
	}

	$dom_list_item(self){
		if (self._dom_list_item){
			return self._dom_list_item
		}

		self._dom_list_item = self.tplates.list_item({
			'input_type':    '.input_type',
			'input_name':    '.input_name',
			'input_ctrl':    '.input_ctrl',

			'ov_1':          '.ov_1',
			'ov_2':          '.ov_2',
			'ov_3':          '.ov_3',
			'ov_4':          '.ov_4',
		})

		if (self.input_type in self.ICONS){
			self._dom_list_item.index.input_type.src = self.ICONS[self.input_type];
		}

		self._dom_list_item.index.input_name.textContent = self.visual_name;

		self._dom_list_item.root.onclick = async function(){
			self.select();
			await self.refresh();
			self.vb.save();
		}

		self._dom_list_item.root.oncontextmenu = function(){
			self.set_fav('toggle');
			self.vb.save();
		}

		return self._dom_list_item
	}

	$dom_ctrl(self){
		if (self._dom_ctrl){
			return self._dom_ctrl
		}

		self._dom_ctrl = self.tplates.input_ctrl({
			// General control all inputs share: Overlay
			'overlay_ctrl': '.overlay_ctrl',

			'overlay_1': '.overlay_ctrl [overlay_1]',
			'overlay_2': '.overlay_ctrl [overlay_2]',
			'overlay_3': '.overlay_ctrl [overlay_3]',
			'overlay_4': '.overlay_ctrl [overlay_4]',

			'overlay_off': '.overlay_ctrl [overlay_off]',

			'search':      '.field_search',

			// Place for the input specific control panel
			'specific': '.ctrl_specific',
		})

		for (const i of range(4)){
			const ov_idx = i + 1;
			self._dom_ctrl.index[`overlay_${ov_idx}`].onclick = async function(evt){
				if (!evt.altKey){return};
				self._dom_ctrl.index.overlay_ctrl.classList.add('kbsys_locked');

				await self.vtitle.overlay_in(ov_idx);
				await self.vb.redraw_overlay_occupation();

				self._dom_ctrl.index.overlay_ctrl.classList.remove('kbsys_locked');
			}
		}

		self._dom_ctrl.index.overlay_off.onclick = async function(evt){
			if (!evt.altKey){return};

			self._dom_ctrl.index.overlay_ctrl.classList.add('kbsys_locked');

			await self.vtitle.overlay_out_all();
			await self.vb.redraw_overlay_occupation();

			self._dom_ctrl.index.overlay_ctrl.classList.remove('kbsys_locked');
		}

		return self._dom_ctrl
	}

	async redraw_overlay_occupation(self, params){
		const occupied_overlays = await self.vtitle.list_occupied_overlays(params?.src_xml);

		for (const i of range(4)){
			const ov_idx = i + 1;
			if (occupied_overlays.includes(ov_idx)){
				self.dom_list_item.index[`ov_${ov_idx}`].classList.remove('kbsys_hidden');
			}else{
				self.dom_list_item.index[`ov_${ov_idx}`].classList.add('kbsys_hidden');
			}
		}
	}

	mark_missing(self){
		self.missing = true;
		self.dom_list_item.root.classList.add('visual_basic_missing');
	}

	unmark_missing(self){
		self.missing = false;
		self.dom_list_item.root.classList.remove('visual_basic_missing');
	}

	deselect(self){
		self.dom_list_item.root.classList.remove('vb_active');
	}

	select(self){
		if (self.missing == true){return};

		for (const vb_item of self.vb.inputs){
			vb_item.active = false;
			vb_item.deselect();
		}

		self.active = true;

		self.dom_list_item.root.classList.add('vb_active');

		self.vb.dom.index.input_ctrl.innerHTML = '';
		self.vb.dom.index.input_ctrl.append(self.dom_ctrl.root);
		ksys.btns.resync();
	}

	set_fav(self, state){
		if (state == 'toggle'){
			if (self.fav == true){
				self.fav = false;
				self.vb.dom.index.all_inputs.append(self.dom_list_item.root);
				return
			}
			if (self.fav == false){
				self.fav = true;
				self.vb.dom.index.fav_inputs.append(self.dom_list_item.root);
				return
			}
			return
		}

		if (state == true){
			self.fav = true;
			self.vb.dom.index.fav_inputs.append(self.dom_list_item.root);
			return
		}

		if (state == false){
			self.fav = true;
			self.vb.dom.index.all_inputs.append(self.dom_list_item.root);
			return
		}
	}

	async refresh(self){
		const input_xml = (await vmix.talker.project()).querySelector(
			`inputs input[key="${self.guid}"]`
		)

		if (!input_xml){
			self.mark_missing();
			return
		}else{
			self.unmark_missing();
		}

		self.dom_list_item.index.input_name.textContent = input_xml.getAttribute('title');

		self.dom_ctrl.index.specific.innerHTML = '';

		if (self.input_type == 'gt'){
			const text_field_array = new Set();
			for (const field_data of input_xml.children){
				if (field_data.getAttribute('name').endsWith('.Text')){
					const text_field = new VisualBasicTextField(self, {
						'val': field_data.textContent,
						'field_name': field_data.getAttribute('name'),
					})
					text_field_array.add(text_field);
					self.dom_ctrl.index.specific.append(text_field.dom.root);
				}
			}

			self.dom_ctrl.index.search.oninput = function(){
				const query = self.dom_ctrl.index.search.value.lower().trim();

				for (const text_field of text_field_array){
					if (!query){
						text_field.dom.root.classList.remove('kbsys_hidden');
						continue
					}

					if (text_field.val.lower().includes(query) || text_field.field_name.lower().includes(query)){
						text_field.dom.root.classList.remove('kbsys_hidden');
					}else{
						text_field.dom.root.classList.add('kbsys_hidden');
					}
				}
			}
		}
	}
}







const VisualBasic = class{

	SAVE_FILE_NAME = '_visual_basic.kbcfg';

	// Known input types
	KNOWN_TYPES = Object.freeze([
		'image',
		'gt',
		'video',
	]);

	constructor(){
		const self = ksys.util.nprint(
			ksys.util.cls_pwnage.remap(this),
			'#C0C3FF',
		);

		self.tplates = ksys.tplates.sys_tplates.visual_basic;

		self._dom = null;

		self.inputs = new Set();
	}

	$dom(self){
		if (self._dom){
			return self._dom
		}

		self._dom = self.tplates.main({
			'refresh_all':   '.refresh_all',

			'search':        '.search_by_name',

			'all_inputs': '.inputs_list.all',
			'fav_inputs': '.inputs_list.favourites',
			'input_ctrl': '.tgt_input_ctrl',
		})

		self._dom.index.refresh_all.onclick = async function(){
			await self.refresh();
		}
		self._dom.index.search.oninput = async function(){
			self.filter_lists(self._dom.index.search.value);
		}

		return self._dom
	}

	filter_lists(self, query){
		for (const inp of self.inputs){
			if (!query.trim()){
				inp.dom_list_item.root.classList.remove('kbsys_hidden');
				continue
			}
			if ((inp.visual_name || '').includes(query)){
				inp.dom_list_item.root.classList.remove('kbsys_hidden');
			}else{
				inp.dom_list_item.root.classList.add('kbsys_hidden');
			}
		}
	}

	async redraw_overlay_occupation(self){
		const project_xml = await vmix.talker.project();
		for (const inp of self.inputs){
			await inp.redraw_overlay_occupation({'src_xml': project_xml});
		}
	}

	save(self){
		// Create an array of favourited items
		const favs = Array.from(self.list_favs());

		// Find the currently selected item, if any
		const current = self.get_current();

		ksys.db.module.write(self.SAVE_FILE_NAME, JSON.stringify({
			'favs': favs,
			'current': current,
		}));
	}

	async load(self){
		await self.refresh();

		const cfg = ksys.db.module.read(self.SAVE_FILE_NAME, 'json');
		if (!cfg){return};

		self.set_favs(cfg.favs);

		await self.set_current(cfg.current);

		ksys.btns.resync();
	}

	// List all favourited items
	list_favs(self){
		const favs = new Set();
		for (const inp of self.inputs){
			if (inp.fav){
				favs.add({
					'visual_name': inp.visual_name,
					'input_type': inp.input_type,
				});
			}
		}

		return favs
	}

	get_current(self){
		for (const inp of self.inputs){
			if (inp.active){
				return inp.visual_name;
			}
		}

		return null
	}

	async set_current(self, tgt){
		for (const inp of self.inputs){
			if (inp.visual_name == tgt){
				inp.select();
				await inp.refresh();
				break
			}
		}

		ksys.btns.resync();
	}

	set_favs(self, favs){
		for (const fav_item of favs){
			let found = false;
			for (const inp of self.inputs){
				if (inp.visual_name == fav_item.visual_name){
					found = true;
					inp.set_fav(true);
				}
			}

			if (!found){
				const vb_item = new VisualBasicItem(self, {
					'guid':        null,
					'visual_name': fav_item.visual_name,
					'input_type':  fav_item.input_type,
				})

				vb_item.mark_missing();

				self.inputs.add(vb_item);

				self.dom.index.all_inputs.append(vb_item.dom_list_item.root);

				vb_item.set_fav(true);
			}
		}
	}

	async refresh(self){
		// Save favourites and re-apply them later
		const favs = self.list_favs();
		const current = self.get_current();

		self.dom.index.all_inputs.innerHTML = '';
		self.dom.index.fav_inputs.innerHTML = '';
		self.dom.index.input_ctrl.innerHTML = '';

		self.inputs.clear();

		const project_xml = await vmix.talker.project();

		for (const vmix_input of project_xml.querySelectorAll('inputs input')){
			const input_type = (vmix_input.getAttribute('type') || '').lower();

			// if (!self.KNOWN_TYPES.includes(input_type)){continue};

			const vb_item = new VisualBasicItem(self, {
				'guid':        vmix_input.getAttribute('key'),
				'visual_name': vmix_input.getAttribute('title'),
				'input_type':  input_type,
			})

			self.inputs.add(vb_item);

			await vb_item.redraw_overlay_occupation({'src_xml': project_xml});

			self.dom.index.all_inputs.append(vb_item.dom_list_item.root);
		}

		await self.set_favs(favs);
		self.set_current(current);
		ksys.btns.resync();
	}
}





const m_init = async function(){
	const tgt_editor = qsel('visual-basic');
	if (!tgt_editor){return};

	const visual_basic = new VisualBasic();
	await visual_basic.load();

	tgt_editor.replaceWith(visual_basic.dom.root);

	ksys.btns.resync();
}








module.exports = {
	VisualBasic,
	m_init,
}
