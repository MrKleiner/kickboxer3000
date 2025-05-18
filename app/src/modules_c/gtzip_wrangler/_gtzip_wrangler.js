
if(!window.kbmodules){window.kbmodules={}};
if(!window.kbmodules.gtzip_wrangler){window.kbmodules.gtzip_wrangler={}};

/*
for (const tag of document.querySelectorAll('[dragfx]')){
	tag.ondragover = function(evt){
		if (!('dragfx' in tag.attributes)){return};
		evt.preventDefault();
		evt.target.closest('[dragfx]').classList.add('drag_n_drop_indicator');
	}
	tag.ondragleave = function(evt){
		if (!('dragfx' in tag.attributes)){return};
		evt.preventDefault();
		evt.target.closest('[dragfx]').classList.remove('drag_n_drop_indicator');
		print('Entered drag', evt);
	}
	tag.ondrop = function(evt){
		evt.preventDefault();
		evt.target.classList.remove('drag_n_drop_indicator');
		print('Dropped drag', evt);	
	}
}

window.kbmodules.gtzip_wrangler.dom.file_meta.ondrop = function(evt){
	evt.preventDefault();
	evt.target.classList.remove('drag_n_drop_indicator');
	window.kbmodules.gtzip_wrangler.edit_gtzip(evt.dataTransfer.files[0].path);
}
*/





window.kbmodules.gtzip_wrangler.load = function(){
	const ctx_prms = ksys.context.module.cache;

	window.kbmodules.gtzip_wrangler.dom = {
		'columns': document.querySelector('#wrangler_columns'),
		'db_listing': document.querySelector('#db_listing'),
		'db_flist': document.querySelector('#db_listing .column_content'),
		'db_path_input': document.querySelector('#db_path_input'),
		'db_path': document.querySelector('#db_path_input'),
		'gt_editor': document.querySelector('#gt_editor_path'),
		'file_meta': document.querySelector('#file_meta'),
		'phantom_editor': document.querySelector('#phantom_editor'),
		'db_lookup': document.querySelector('#db_lookup'),
		'db_lookup_tags_include': document.querySelector('#db_lookup_tags_include'),
		'db_lookup_tags_exclude': document.querySelector('#db_lookup_tags_exclude'),
		'db_files_input': document.querySelector('#db_files_input'),
	}
	window.kbmodules.gtzip_wrangler.current_gtzip = null;

	window.kbmodules.gtzip_wrangler.gt_editor_exe = Path('C:/Program Files (x86)/vMix/GT/GTDesigner.exe');

	if (!window.kbmodules.gtzip_wrangler.gt_editor_exe.isFileSync()){
		window.kbmodules.gtzip_wrangler.dom.gt_editor.value = '';
	}

	// TESTING
	// todo: special DEV mode, which automatically executes certain actions
	// window.kbmodules.gtzip_wrangler.edit_gtzip('E:/!webdesign/kickboxer/kickboxer3000/testing/basic_wrangled.gtzip');

	// Listen for ctrl + s and make sure this listener is not assigned multiple times
	window.kbmodules.gtzip_wrangler.listen_ctrl_s();

	// Init editor type switch
	window.kbmodules.gtzip_wrangler.fuckshit = new ksys.switches.KBSwitch({
		'multichoice': false,
		'can_be_empty': false,
		'set_default': ctx_prms.active_editor_column || 'editor',
		'dom_array': [
			{
				'id': 'editor',
				'dom': document.querySelector('#editor_type_switch [switch_item="editor"]'),
			},
			{
				'id': 'db_lookup',
				'dom': document.querySelector('#editor_type_switch [switch_item="db_lookup"]'),
			},
		],
		'callback': function(_, item_id){
			window.kbmodules.gtzip_wrangler.toggle_columns(item_id, true);
		}
	})

	window.kbmodules.gtzip_wrangler.toggle_columns(
		ctx_prms.active_editor_column || 'editor',
		false
	)

	window.kbmodules.gtzip_wrangler.gtz_db = new ksys.gtzip_wrangler.GTZipDB(window.kbmodules.gtzip_wrangler.dom.db_path_input.value);

	window.kbmodules.gtzip_wrangler.db_contents = [];

	window.kbmodules.gtzip_wrangler.rescan_db();
}

window.kbmodules.gtzip_wrangler.toggle_columns = function(tgt_active, save_state=true){
	if (tgt_active == 'editor'){
		window.kbmodules.gtzip_wrangler.dom.db_lookup.classList.add('kbsys_hidden');
		window.kbmodules.gtzip_wrangler.dom.phantom_editor.classList.remove('kbsys_hidden');
	}
	if (tgt_active == 'db_lookup'){
		window.kbmodules.gtzip_wrangler.dom.db_lookup.classList.remove('kbsys_hidden');
		window.kbmodules.gtzip_wrangler.dom.phantom_editor.classList.add('kbsys_hidden');
	}

	if (save_state){
		ksys.context.module.prm('active_editor_column', tgt_active)
	}
}

window.kbmodules.gtzip_wrangler.edit_gtzip = function(fpath){
	try{
		URL.revokeObjectURL(window.kbmodules.gtzip_wrangler.current_gtzip.meta_dom.index.preview_img.src);
	}catch{}

	if (fpath instanceof ksys.gtzip_wrangler.GTZipFileEditor){
		window.kbmodules.gtzip_wrangler.current_gtzip = fpath;
	}else{
		window.kbmodules.gtzip_wrangler.current_gtzip = new ksys.gtzip_wrangler.GTZipFileEditor(new ksys.gtzip_wrangler.GTZipFile({
			'fpath': fpath
		}))
	}

	window.kbmodules.gtzip_wrangler.dom.file_meta.innerHTML = '';
	window.kbmodules.gtzip_wrangler.dom.file_meta.append(window.kbmodules.gtzip_wrangler.current_gtzip.meta_dom.root)

	window.kbmodules.gtzip_wrangler.dom.phantom_editor.innerHTML = '';
	window.kbmodules.gtzip_wrangler.dom.phantom_editor.append(window.kbmodules.gtzip_wrangler.current_gtzip.ftree_dom.root)
}

window.kbmodules.gtzip_wrangler.save_current_gtzip = function(){
	// todo: Can this be false?
	// Is it possible to save non-existent GTZIP ?

	// Get the current GTZip file (GTZipFile class)
	const gtz_file = window.kbmodules.gtzip_wrangler?.current_gtzip?.gtz_file;

	if (!gtz_file){
		ksys.info_msg.send_msg(
			`Not editing any GTZIP files. Nothing to save.`,
			'warn',
			5000
		);
		return
	}

	// Todo: Implement this...
	if (!gtz_file.src_fpath){
		ksys.info_msg.send_msg(
			`FATAL: Unable to save, because current GTZIP file has no source filepath.`,
			'err',
			5000
		);
		console.error(
			'Time to implement path-less GTZIP editing...',
			gtz_file
		)
		return
	}

	// Exit textareas so that changes are registered...
	ksys.util.exit_textareas();

	// Write buffer to disk
	gtz_file.src_fpath.writeSync(
		gtz_file.to_zip_buf()
	);

	ksys.info_msg.send_msg(
		`Saved`,
		'ok',
		2000
	);

}

window.kbmodules.gtzip_wrangler.rescan_db = function(){
	window.kbmodules.gtzip_wrangler.db_contents.length = 0;
	window.kbmodules.gtzip_wrangler.dom.db_flist.innerHTML = '';
	window.kbmodules.gtzip_wrangler.gtz_db.rescan();
	for (const gtz_file of window.kbmodules.gtzip_wrangler.gtz_db.contents){
		const gtz_editor = new ksys.gtzip_wrangler.GTZipFileEditor(gtz_file);
		window.kbmodules.gtzip_wrangler.db_contents.push(gtz_editor);
		gtz_editor.list_item_dom.root.onclick = function(){
			window.kbmodules.gtzip_wrangler.edit_gtzip(gtz_editor);
		}
		window.kbmodules.gtzip_wrangler.dom.db_flist.append(gtz_editor.list_item_dom.root);
	}
}

window.kbmodules.gtzip_wrangler.filter_db = function(){
	let tags_include = window.kbmodules.gtzip_wrangler.dom.db_lookup_tags_include.value.split('\n').map(function(v){
		return v.replaceAll(',', '').lower().trim();
	})
	tags_include = new Set(tags_include.filter(function(val){
		return !!val
	}))

	let tags_exclude = window.kbmodules.gtzip_wrangler.dom.db_lookup_tags_exclude.value.split('\n').map(function(v){
		return v.replaceAll(',', '').lower().trim();
	})
	tags_exclude = new Set(tags_exclude.filter(function(val){
		return !!val
	}))

	for (const gtz_editor of window.kbmodules.gtzip_wrangler.db_contents){
		const gtz_tags = new Set(gtz_editor.gtz_file.tags);

		const cond = [
			tags_include.intersection(gtz_tags).size == tags_include.size,
			tags_exclude.intersection(gtz_tags).size <= 0,
		]

		if (cond.includes(false)){
			gtz_editor.list_item_dom.root.classList.add('kbsys_hidden');
		}else{
			gtz_editor.list_item_dom.root.classList.remove('kbsys_hidden');
		}
	}
}

window.kbmodules.gtzip_wrangler.listen_ctrl_s = function(){
	if (window.kbmodules.gtzip_wrangler.save_keybind_active){return};

	document.addEventListener('keydown', function(evt) {
		if (evt.ctrlKey && (evt.code == 'KeyS') && !evt.repeat) {
			evt.preventDefault();
			window.kbmodules.gtzip_wrangler.save_current_gtzip();
		}
	});

	window.kbmodules.gtzip_wrangler.save_keybind_active = true;
}

window.kbmodules.gtzip_wrangler.add_selected_files_to_db = function(){
	for (const file_data of window.kbmodules.gtzip_wrangler.dom.db_files_input.files){
		// const fpath = Path(file_data.path);
		window.kbmodules.gtzip_wrangler.gtz_db.add_file(file_data.path);
	}
}


window.kbmodules.gtzip_wrangler.insert_searched_tag = function(tgt){
	tgt.value = tgt.value + '\n' + document.querySelector('#existing_tags_search').value;
}