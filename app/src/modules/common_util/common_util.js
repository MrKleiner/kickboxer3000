




$this.load = function(){
	const defineWipeGTZSelectorDOM = qsel('#gtzip_selector');

	defineWipeGTZSelectorDOM.addEventListener('dragenter', function(){
		defineWipeGTZSelectorDOM.classList.add('drag_hover');
	});
	defineWipeGTZSelectorDOM.addEventListener('dragleave', function(){
		defineWipeGTZSelectorDOM.classList.remove('drag_hover');
	});

	defineWipeGTZSelectorDOM.addEventListener('dragover', function(evt){
		evt.preventDefault();
	});

	defineWipeGTZSelectorDOM.addEventListener('drop', $this.listWipeTitles);


	$this.wipeTitlesArray = [];
	$this.selectedTitle = null;
}


$this.listWipeTitles = function(evt){
	$this.wipeTitlesArray.length = 0;
	const selectorDOM = qsel('#gtzip_selector');
	selectorDOM.innerHTML = '';

	evt.preventDefault();
	selectorDOM.classList.remove('drag_hover');

	for (const fdata of (evt?.dataTransfer?.files || [])){
		try{
			const DOM = ksys.context.tplates.general.title_preview({
				'preview': 'img',
				'name':    '.name',
			})

			const GTZ = new ksys.gtzip_wrangler.GTZipFile({
				'fpath': fdata.path,
			});

			DOM.index.preview.src = URL.createObjectURL(
				new Blob([GTZ.zip_buf.readFile('thumbnail.png')])
			);

			DOM.index.name.textContent = Path(fdata.path).basename;

			DOM.root.onclick = function(){
				$this.selectedTitle = GTZ;
				DOM.root.classList.add('selected');
				$('#gtzip_selector .selected').removeClass('selected');
				DOM.root.classList.add('selected');
			}

			selectorDOM.append(DOM.root);

			$this.wipeTitlesArray.push(GTZ);
		}catch(e){
			console.warn(e)
		}
	}
}


$this.defineWipe = function(){
	const fileInput = qsel('#define_wipe input');

	if (!fileInput.files.length){return};

	const wipeParams = {
		'fields': [],
	};

	const definitionFilePath = Path(fileInput.files[0].path);
	const definitionFileData = definitionFilePath.readFileSync();

	for (let line of str(definitionFileData).split('\n')){
		line = line.trim();
		if (!line){continue};

		const [fieldID, wipeTo] = line.split(':');

		wipeParams.fields.push({
			'fieldID': fieldID?.trim?.(),
			'wipeTo':  wipeTo?.trim?.(),
		})
	}

	const fbuf = Buffer.from(
		JSON.stringify(wipeParams)
	)

	for (const GTZ of $this.wipeTitlesArray){
		GTZ.add_file({
			'buf': fbuf,
			'meta': {
				'grp':   'kbsys',
				'fname': 'wipeParams',
				'ftype': 'text',
			},
		})

		GTZ.src_fpath.writeFileSync(
			GTZ.to_zip_buf()
		)
	}
}




$this.defineSwitch = function(){
	const fileInput = qsel('#define_switch input');

	if (!fileInput.files.length){return};

	const GTZ = new ksys.gtzip_wrangler.GTZipFile({
		'fpath': $this.selectedTitle.src_fpath,
	});

	const switchDir = Path(fileInput.files[0].path);
	const [switchID, targetImageLayer] = switchDir.basename.split('.');

	const imageSwitch = GTZ.createImageSwitch();
	imageSwitch.switchID = switchID;
	imageSwitch.targetImageLayer = targetImageLayer;

	for (const fpath of switchDir.globSync('*.png')){
		imageSwitch.values[fpath.stem] = fpath.readFileSync();
	}

	GTZ.src_fpath.writeFileSync(
		GTZ.to_zip_buf()
	)
}

$this.clearAllSwitches = function(){
	for (const GTZ of $this.wipeTitlesArray){
		for (const file of Object.values(GTZ.kb_data.files)){
			if (file.grp.startsWith('imageSwitch')){
				file.kill()
			}
		}
		GTZ.src_fpath.writeFileSync(
			GTZ.to_zip_buf()
		)
	}
}




$this.defineTextColorSwitch = function(){
	const fileInput = qsel('#define_text_switch input');
	if (!fileInput.files.length){return};

	const GTZ = new ksys.gtzip_wrangler.GTZipFile({
		'fpath': $this.selectedTitle.src_fpath,
	});

	const switchFile = Path(fileInput.files[0].path);
	const switchData = JSON.parse(switchFile.readFileSync());

	const textColorSwitch = GTZ.createTextColorSwitch();
	textColorSwitch.switchID = switchData.switchID;

	textColorSwitch.targetTextLayer = switchData.targetTextLayer;

	for (const [key, val] of Object.entries(switchData.colorMap)){
		textColorSwitch.values[key] = val;
	}

	GTZ.src_fpath.writeFileSync(
		GTZ.to_zip_buf()
	)
}

$this.clearAllTextColorSwitches = function(){
	for (const GTZ of $this.wipeTitlesArray){
		delete GTZ.kb_data.meta['textColorSwitches'];
		GTZ.src_fpath.writeFileSync(
			GTZ.to_zip_buf()
		)
	}
}




$this.defineShift = function(){
	const GTZ = new ksys.gtzip_wrangler.GTZipFile({
		'fpath': $this.selectedTitle.src_fpath,
	});

	const [shiftX, shiftY] = qsel('#define_shift input').value.split(':');

	GTZ.kb_data.meta.shift = {
		'x': float(shiftX.trim()),
		'y': float(shiftY.trim()),
	}

	GTZ.src_fpath.writeFileSync(
		GTZ.to_zip_buf()
	)
}

$this.clearShift = function(){
	const GTZ = new ksys.gtzip_wrangler.GTZipFile({
		'fpath': $this.selectedTitle.src_fpath,
	});

	delete GTZ.kb_data.meta['shift'];

	GTZ.src_fpath.writeFileSync(
		GTZ.to_zip_buf()
	)
}



$this.unpack = function(){
	for (const GTZ of $this.wipeTitlesArray){
		GTZ.unpack(GTZ.src_fpath);
	}
}