const fastq = require('fastq');



const SYS_DATA = {};



const RemoteInputUpload = class{
	constructor(fpath){
		const self = ksys.util.nprint(
			ksys.util.cls_pwnage.remap(this),
			'#FFEF42',
		);

		self.fpath = Path(fpath);

		self.tplates = ksys.tplates.sys_tplates.remote_inputs;

		self._dom = null;
	}

	ok(self){
		self.dom.root.classList.add('ok');
		self.dom.root.classList.remove('fail');
		self.dom.root.classList.remove('current');
	}

	fail(self){
		self.dom.root.classList.add('fail');
		self.dom.root.classList.remove('current');
		self.dom.root.classList.remove('ok');
	}

	current(self){
		self.dom.root.classList.add('current');
		self.dom.root.classList.remove('ok');
		self.dom.root.classList.remove('fail');
	}

	updateProg(self, fac){
		self.dom.index.prog_fill.style.transform = `scaleX(${fac})`;
	}

	$dom(self){
		if (self._dom){
			return self._dom
		}

		self._dom = self.tplates.swift_input_instance({
			'fname':       '.fname',
			'prog_fill':   '.upload_progress-fill',
		})

		self._dom.index.fname.textContent = self.fpath.basename;

		return self._dom
	}
}


const KBNCRemoteInputs = class{
	// 69 MB
	CHUNK_SIZE = (1024**2) * 69;

	/*
	FTYPE_MAP = Object.freeze([
		[[
			'avi',
			'webm',
			'mp4',
			'ts',
			'mov',
			'mkv',
			'ogv',
			'wmv',
		], 'Video'],
		[[
			'png',
			'jpg',
			'jpeg',
			'tiff',
			'tif',
			'webp',
			'gif',
			'tga',
			'hdr',
			'exr',
			'bmp',
			'jfif',
		], 'Image'],
		[[
			'gtzip',
		], 'Title'],
	]);
	*/

	FTYPE_MAP = Object.freeze([
		['Video', [
			'avi',
			'webm',
			'mp4',
			'ts',
			'mov',
			'mkv',
			'ogv',
			'wmv',
		]],
		['Image', [
			'png',
			'apng',
			'jpg',
			'jpeg',
			'tiff',
			'tif',
			'webp',
			'gif',
			'tga',
			'hdr',
			'exr',
			'bmp',
			'jfif',
		]],
		['Title', [
			'gtzip',
		]],
	]);

	constructor(){
		const self = ksys.util.nprint(
			ksys.util.cls_pwnage.remap(this),
			'#FFEF42',
		);

		self.tplates = ksys.tplates.sys_tplates.remote_inputs;
		self._dom = null;

		self.uploadSched = fastq.promise(self.sendFile, 1);
	}

	dragEnter(self, evt){
		evt.preventDefault();
		self.dom.index.drag_area.classList.add('drag_hover');
	}

	dragLeave(self, evt){
		evt.preventDefault();
		self.dom.index.drag_area.classList.remove('drag_hover');
	}

	dragDrop(self, evt){
		evt.preventDefault();
		self.nprint(evt);
		self.dom.index.drag_area.classList.remove('drag_hover');

		for (const fdata of (evt?.dataTransfer?.files || [])){
			self.nprint('Adding', fdata.path);
			const swiftItem = new RemoteInputUpload(fdata.path);
			self.uploadSched.push(
				swiftItem
			);

			self.dom.index.log.append(swiftItem.dom.root);
		}
	}

	determineType(self, fpath){
		const ext = (
			Path(fpath)
			.suffixes
			.pop()
			?.replaceAll?.('.', '')
			?.trim?.()
			?.lower?.()
		);

		if (!ext){
			return null
		}

		for (const [vmixType, extArray] of self.FTYPE_MAP){
			if (extArray.includes(ext)){
				return vmixType
			}
		}

		return null
	}

	async sendFile(self, swiftItem){
		swiftItem.current();

		const srcFpath = swiftItem.fpath;
		const tgtFpath = Path(
			'C:/custom/vmix_assets/kbnc/ballistic_inputs',
			srcFpath.basename
		);

		const vmixType = self.determineType(swiftItem.fpath);
		if (!vmixType){
			self.nwarn('Unsupported file format:', swiftItem.fpath);
			swiftItem.fail();
			return false
		}

		const kbnc = ksys.kbnc.KBNC.sysData().currentClient;
		const srcFsize = (await srcFpath.stat()).size;
		await srcFpath.open({flags: 'r'});
		const targetInput = new vmix.title(tgtFpath.basename);

		if (!(await targetInput.close())){
			await ksys.util.sleep(2000);
		}

		let progTotal = 0;
		const onProg = function(info){
			progTotal += info.chunk;
			swiftItem.updateProg(progTotal / srcFsize);
		}

		let uploadOK = false;

		try{
			const buf = Buffer.alloc(self.CHUNK_SIZE);
			let bytesRead = 0;

			self.nprint('Deleting existing file');

			const msgDelFile = await kbnc.runCMD('file.delete', {
				'header': {
					'fpath': str(tgtFpath),
				},
			})

			self.nprint('Deleted existing file:', await msgDelFile.result());

			do{
				const result = await srcFpath.read(
					buf, 0, buf.length, null, false
				);

				bytesRead = result.bytesRead ?? 0;

				if (bytesRead > 0){
					// const chunk = buf.slice(0, bytesRead);
					const msg = await kbnc.runCMD('file.append', {
						'header': {
							'fpath': str(tgtFpath),
						},
						'payload': buf.slice(0, bytesRead),
					}, onProg)

					print('Append result:', await msg.result());
				}
			}while(
				bytesRead > 0
			)

			await targetInput.hard_reload({
				'gtz_fpath': str(tgtFpath),
				'add_as': vmixType,
			});

			uploadOK = true;
		}catch(e){
			self.nerr(e);
			swiftItem.fail();
		}finally{
			try{await srcFpath.close()}catch{};
		}

		if (uploadOK){
			swiftItem.ok();
		}
	}

	$dom(self){
		if (self._dom){
			return self._dom
		}

		self._dom = self.tplates.swift_input({
			'drag_area':   '.drag_area',
			'log':         '.log',
		});

		self._dom.index.drag_area.addEventListener('dragenter', self.dragEnter);
		self._dom.index.drag_area.addEventListener('dragleave', self.dragLeave);

		self._dom.index.drag_area.addEventListener('dragover', function(evt){
			evt.preventDefault();
		});

		self._dom.index.drag_area.addEventListener('drop', self.dragDrop);

		self._dom.index.log.oncontextmenu = function(){
			for (const dom of [...self._dom.index.log.children]){
				dom.remove();
			}
		}

		return self._dom
	}
}



const m_init = function(){
	if (!SYS_DATA.current){
		SYS_DATA.current = new KBNCRemoteInputs();
	}

	qsel('remote-inputs')?.replaceWith?.(
		SYS_DATA.current.dom.root
	)
}






module.exports = {
	KBNCRemoteInputs,
	m_init,
}











