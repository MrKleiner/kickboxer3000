
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

$this.dom.file_meta.ondrop = function(evt){
	evt.preventDefault();
	evt.target.classList.remove('drag_n_drop_indicator');
	$this.edit_gtzip(evt.dataTransfer.files[0].path);
}
*/





$this.load = function(){
	const ctx_prms = ksys.context.module.cache;

	$this.dom = {
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
	$this.current_gtzip = null;

	$this.gt_editor_exe = Path('C:/Program Files (x86)/vMix/GT/GTDesigner.exe');

	if (!$this.gt_editor_exe.isFileSync()){
		$this.dom.gt_editor.value = '';
	}

	// TESTING
	// todo: special DEV mode, which automatically executes certain actions
	// $this.edit_gtzip('E:/!webdesign/kickboxer/kickboxer3000/testing/basic_wrangled.gtzip');

	// Listen for ctrl + s and make sure this listener is not assigned multiple times
	$this.listen_ctrl_s();

	// Init editor type switch
	$this.fuckshit = new ksys.switches.KBSwitch({
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
			$this.toggle_columns(item_id, true);
		}
	})

	$this.toggle_columns(
		ctx_prms.active_editor_column || 'editor',
		false
	)

	$this.gtz_db = new ksys.gtzip_wrangler.GTZipDB($this.dom.db_path_input.value);

	$this.db_contents = [];

	$this.rescan_db();
}

$this.toggle_columns = function(tgt_active, save_state=true){
	if (tgt_active == 'editor'){
		$this.dom.db_lookup.classList.add('kbsys_hidden');
		$this.dom.phantom_editor.classList.remove('kbsys_hidden');
	}
	if (tgt_active == 'db_lookup'){
		$this.dom.db_lookup.classList.remove('kbsys_hidden');
		$this.dom.phantom_editor.classList.add('kbsys_hidden');
	}

	if (save_state){
		ksys.context.module.prm('active_editor_column', tgt_active)
	}
}

$this.edit_gtzip = function(fpath){
	try{
		URL.revokeObjectURL($this.current_gtzip.meta_dom.index.preview_img.src);
	}catch{}

	if (fpath instanceof ksys.gtzip_wrangler.GTZipFileEditor){
		$this.current_gtzip = fpath;
	}else{
		$this.current_gtzip = new ksys.gtzip_wrangler.GTZipFileEditor(new ksys.gtzip_wrangler.GTZipFile({
			'fpath': fpath
		}))
	}

	$this.dom.file_meta.innerHTML = '';
	$this.dom.file_meta.append($this.current_gtzip.meta_dom.root)

	$this.dom.phantom_editor.innerHTML = '';
	$this.dom.phantom_editor.append($this.current_gtzip.ftree_dom.root)
}

$this.save_current_gtzip = function(){
	// todo: Can this be false?
	// Is it possible to save non-existent GTZIP ?

	// Get the current GTZip file (GTZipFile class)
	const gtz_file = $this?.current_gtzip?.gtz_file;

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

$this.rescan_db = function(){
	$this.db_contents.length = 0;
	$this.dom.db_flist.innerHTML = '';
	$this.gtz_db.rescan();
	for (const gtz_file of $this.gtz_db.contents){
		const gtz_editor = new ksys.gtzip_wrangler.GTZipFileEditor(gtz_file);
		$this.db_contents.push(gtz_editor);
		gtz_editor.list_item_dom.root.onclick = function(){
			$this.edit_gtzip(gtz_editor);
		}
		$this.dom.db_flist.append(gtz_editor.list_item_dom.root);
	}
}

$this.filter_db = function(){
	let tags_include = $this.dom.db_lookup_tags_include.value.split('\n').map(function(v){
		return v.replaceAll(',', '').lower().trim();
	})
	tags_include = new Set(tags_include.filter(function(val){
		return !!val
	}))

	let tags_exclude = $this.dom.db_lookup_tags_exclude.value.split('\n').map(function(v){
		return v.replaceAll(',', '').lower().trim();
	})
	tags_exclude = new Set(tags_exclude.filter(function(val){
		return !!val
	}))

	for (const gtz_editor of $this.db_contents){
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

$this.listen_ctrl_s = function(){
	if ($this.save_keybind_active){return};

	document.addEventListener('keydown', function(evt) {
		if (evt.ctrlKey && (evt.code == 'KeyS') && !evt.repeat) {
			evt.preventDefault();
			$this.save_current_gtzip();
		}
	});

	$this.save_keybind_active = true;
}

$this.add_selected_files_to_db = function(){
	for (const file_data of $this.dom.db_files_input.files){
		// const fpath = Path(file_data.path);
		$this.gtz_db.add_file(file_data.path);
	}
}


$this.insert_searched_tag = function(tgt){
	tgt.value = tgt.value + '\n' + document.querySelector('#existing_tags_search').value;
}