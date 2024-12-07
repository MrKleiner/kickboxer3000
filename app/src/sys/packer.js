const archiver = require('archiver');
const AdmZip = require('adm-zip');


const pack_dir_to_file = function(src_dir, output_fpath){
	const output = fs.createWriteStream(output_fpath);
	const archive = archiver('zip', { zlib: { level: 9 } });
	archive.pipe(output);
	archive.directory(src_dir, false);
	archive.finalize();
}

const _pack_dir_to_buffer = function(src_dir){
	const output = [];
	const archive = archiver('zip', { zlib: { level: 9 } });

	archive.on('data', (chunk) => {
		output.push(chunk);
	});

	archive.directory(str(src_dir), false);
	archive.finalize();

	return Buffer.concat(output);
}

const pack_dir_to_buffer = function (src_dir) {
	return new Promise((resolve, reject) => {
		const output = [];
		const archive = archiver('zip', { zlib: { level: 9 } });

		archive.on('data', (chunk) => {
			output.push(chunk);
		});

		archive.on('end', () => {
			resolve(Buffer.concat(output)); // Resolve promise when all data has been written
		});

		archive.on('error', (err) => {
			resolve(false);
		});

		// Pipe the archiving process
		archive.directory(str(src_dir), false);
		archive.finalize();
	});
};


const _unpack_blob_to_dir = function(blob, destinationDir){
	if (!fs.existsSync(destinationDir)) {
		fs.mkdirSync(destinationDir, { recursive: true });
	}

	const zip = new AdmZip(blob);

	for (const entry of zip.getEntries()){
		const filePath = path.join(destinationDir, entry.entryName);

		if (entry.isDirectory) {
			// Ensure directories are created
			if (!fs.existsSync(filePath)) {
				fs.mkdirSync(filePath, { recursive: true });
			}
		} else {
			// Write file contents synchronously
			fs.writeFileSync(filePath, entry.getData());
		}
	}

	/*
	zip.getEntries().forEach((entry) => {
		const filePath = path.join(destinationDir, entry.entryName);

		if (entry.isDirectory) {
			// Ensure directories are created
			if (!fs.existsSync(filePath)) {
				fs.mkdirSync(filePath, { recursive: true });
			}
		} else {
			// Write file contents synchronously
			fs.writeFileSync(filePath, entry.getData());
		}
	});
	*/
}


const unpack_buf_to_dir = function(buffer, offset, targetDir){
	const chunkBuffer = buffer.slice(offset); // Slice from offset to end
	const zip = new AdmZip(chunkBuffer);

	// Ensure the directory exists
	if (!fs.existsSync(str(targetDir))) {
		fs.mkdirSync(str(targetDir), { recursive: true });
	}

	// Extract to target directory
	zip.extractAllTo(str(targetDir), true);
}


const PackerMd = class{
	static GUI_HTML = `
		<div>
		<md-packer synced subtle_box>
			<div class="md_packer_cfg input_cfg">
				<input type="file" class="input_file_picker">

				<div class="param">
					<div class="param_label">Input Directory</div>
					<div class="param_val">
						<input type="text" class="input_dir">
					</div>
				</div>

				<div class="param">
					<div class="param_label">Input Filename</div>
					<div class="param_val">
						<input type="text" class="input_filename" placeholder="File extension is added automatically">
					</div>
				</div>

				<sysbtn class="action_btn import">Import</sysbtn>

			</div>

			<div class="md_packer_cfg output_cfg">
				<div class="param">
					<div class="param_label">Output Directory</div>
					<div class="param_val">
						<input type="text" class="output_dir">
					</div>
				</div>
				<div class="param">
					<div class="param_label">Output Filename</div>
					<div class="param_val">
						<input type="text" class="output_filename" placeholder="File extension is added automatically">
					</div>
				</div>

				<sysbtn class="action_btn export">Export</sysbtn>
			</div>

		</md-packer>
		</div>
	`;

	constructor(){
		const self = this;
		ksys.util.cls_pwnage.remap(self);

		self._gui = null;
		self._dom = null;
	}

	$input_path(self){
		const input_dir = (self.dom.index.input_dir.value || '').trim();
		const input_filename = (self.dom.index.input_filename.value || '').trim();

		if (!input_dir || !input_filename){
			return null
		}

		return Path(input_dir, input_filename  + '.mdp');
	}

	$output_path(self){
		const output_dir = (self.dom.index.output_dir.value || '').trim();
		const output_filename = (self.dom.index.output_filename.value || '').trim();

		if (!output_dir || !output_filename){
			return null
		}

		return Path(output_dir, output_filename + '.mdp');
	}

	$dom(self){
		if (self._dom){return self._dom};

		const dom = ksys.tplates.index_elem(
			PackerMd.GUI_HTML,
			{
				'input_picker':     '.input_file_picker',
				'input_dir':        '.input_dir',
				'input_filename':   '.input_filename',

				'output_dir':       '.output_dir',
				'output_filename':  '.output_filename',

				'exec_import':      '.action_btn.import',
				'exec_export':      '.action_btn.export',
			}
		)
		self._dom = dom;

		dom.index.exec_import.onclick = async function(){
			ksys.util.lock_gui(true);
			try{
				const ok = await self.exec_import()
				if (!ok){
					ksys.info_msg.send_msg(
						`Specified file doesn't exist or invalid. Aborting`,
						'warn',
						5000
					);
				}else{
					ksys.info_msg.send_msg(`Import OK`, 'ok', 500);
				}
			}finally{
				ksys.util.lock_gui(false);
			}
		}

		dom.index.exec_export.onclick = async function(){
			ksys.util.lock_gui(true);
			try{
				const ok = await self.exec_export();
				if (!ok){
					ksys.info_msg.send_msg(
						`Output directory doesn't exist. Aborting`,
						'warn',
						3000
					);
				}else{
					ksys.info_msg.send_msg(`Export OK`, 'ok', 500);
				}
			}finally{
				ksys.util.lock_gui(false);
			}
		}

		dom.index.input_picker.onchange = function(){
			const fpath = Path(dom.index.input_picker.files[0].path);
			dom.index.input_dir.value = str(fpath.parent());
			dom.index.input_filename.value = str(fpath.stem);
		}

		return self._dom;
	}

	exec_import(self){
		if (!self.input_path || !self.input_path.existsSync()){
			return false
		}

		const buf = self.input_path.readFileSync();
		const info_len = buf.readInt32BE(0);
		const info = JSON.parse(
			str(buf.slice(
				4,
				4 + info_len
			))
		);

		if (info.module != ksys.context.module_name){
			ksys.info_msg.send_msg(
				`The specified pack was created for another module: ${info.module}`,
				'warn',
				11000
			);
		}

		unpack_buf_to_dir(
			buf,
			4 + info_len,
			str(app_root.join('db', 'module', ksys.context.module_name))
		)

		ipcRenderer.invoke('ipc_hard_reload', { key: 'value' });

		return true
	}

	async exec_export(self){
		if (!self.output_path || !self.output_path.parent().existsSync()){
			return false
		}

		const pack_info = JSON.stringify({
			'module': ksys.context.module_name,
		})

		const pack_info_len = Buffer.alloc(4);
		pack_info_len.writeInt32BE(pack_info.length, 0);

		const buf = Buffer.concat([
			pack_info_len,
			Buffer.from(pack_info),
			await pack_dir_to_buffer(
				app_root.join('db', 'module', ksys.context.module_name)
			)
		])

		self.output_path.writeSync(buf);

		return true;
	}

}



const resync = function(){
	for (const md_packer of document.querySelectorAll('md-packer:not([synced])')){
		md_packer.replaceWith(
			(new PackerMd()).dom.root
		)
	}
}





module.exports = {
	resync,
}

