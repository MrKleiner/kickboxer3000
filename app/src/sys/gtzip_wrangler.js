const archiver = require('archiver');
const AdmZip = require('adm-zip');
const zlib = require('zlib');
const child_process = require('child_process');
// const e_util = require('util');
// const execp = e_util.promisify(exec);
const fontkit = require('fontkit');



// Change this and you're FUCKED
const PHANTOM_LAYER_NAME = 'ce6a85bee07f133';

// Change this and you're FUCKED
const PHANTOM_IMG_NAME = 'ee5ade7fcc7e478';

// Edit the file it reads and you're FUCKED
// const PHANTOM_IMG_BUF = app_root.join('assets/blank.jpg').readFileSync();

// Edit this and you're FUCKED
const PHANTOM_IMG_BUF = Buffer.from([
	255,216,255,224,0,16,74,70,73,70,0,1,1,0,0,1,0,1,0,0,255,219,
	0,67,0,32,33,33,51,36,51,81,48,48,81,66,47,47,47,66,39,28,28,
	28,28,39,34,23,23,23,23,23,34,17,12,12,12,12,12,12,17,12,12,12,
	12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,
	12,12,12,12,255,219,0,67,1,34,51,51,52,38,52,34,24,24,34,20,14,
	14,14,20,20,14,14,14,14,20,17,12,12,12,12,12,17,17,12,12,12,12,
	12,12,17,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,
	12,12,12,12,12,12,12,12,12,12,255,192,0,17,8,0,4,0,4,3,1,34,0,2,
	17,1,3,17,1,255,196,0,21,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,
	255,196,0,20,16,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,196,0,20,
	1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,196,0,20,17,1,0,0,0,0,0,
	0,0,0,0,0,0,0,0,0,0,0,255,218,0,12,3,1,0,2,17,3,17,0,63,0,159,0,
	31,255,217,
])


const TPLATES = ksys_placeholder(
	() => ksys.tplates.sys_tplates.wrangler
)


const fontPacker = class{
	constructor(){
		const self = ksys.util.nprint(
			ksys.util.cls_pwnage.remap(this),
			'#96FFF4',
		);

		self._fontMap = null;
	}

	// List all the fonts installed in the system
	static listAllInstalledFonts(){
		const filePaths = new Set();

		// Do the registry first
		for (const hive of ['HKLM', 'HKCU']){
			const regPath = `${hive}\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts`;
			// const { stdout } = await execp(`reg query "${regPath}"`);
			const stdout = child_process.execSync(
				`reg query "${regPath}"`,
				{encoding: 'utf8'}
			);
			for (const line of stdout.split(/\r?\n/)){
				if (!line.includes(':')){continue};
				const lsplit = line.split(':');
				filePaths.add(
					[lsplit.at(-2).at(-1), lsplit.at(-1)].join(':').trim()
				)
			}
		}

		// Lookup basic font folders
		const fontDirs = [
			Path(process.env.WINDIR, 'Fonts'),
			Path(process.env.LOCALAPPDATA, 'Microsoft', 'Windows', 'Fonts'),
		]

		for (const fdir of fontDirs){
			for (const fpath of fdir.globSync('*.*')){
				if (!fpath.isFileSync()){continue};
				filePaths.add(str(fpath));
			}
		}

		return filePaths
	}

	// List all the fonts used in a .gtzip file
	// Accepts EITHER:
	//      - An instance of >GTZipFile<
	//      - A DOM tree with querySelectorAll capabilities
	static listTitleFonts(srcData){
		/*
		let targetXML = null;
		
		if (srcData instanceof GTZipFile){
			targetXML = srcData.doc_xml;
		}

		if (((srcData instanceof Document) || (srcData?.constructor?.name == 'XMLDocument')) && srcData?.querySelectorAll){
			targetXML = srcData;
		}

		if (!targetXML){
			throw new Error(
				`Supplied data must be either of type >GTZipFile< OR >Document<, but got >${srcData?.constructor?.name}<`
			)
		}
		*/

		const targetXML = srcData?.doc_xml || srcData;
		if (!targetXML?.querySelectorAll){
			self.nerr('Invalid srcData:', srcData);
			throw new Error(
				`Supplied data must be an XML document with querySelectorAll support`
			)
		}

		const fontFamilies = new Set();

		for (const XMLTag of targetXML.querySelectorAll('[FontFamily]')){
			const familyName = XMLTag?.getAttribute?.('FontFamily');
			if (familyName){
				fontFamilies.add(familyName);
			}
		}

		return fontFamilies
	}

	$fontMap(self){
		if (self._fontMap){
			return self._fontMap
		}

		const fpaths = self.constructor.listAllInstalledFonts();
		self._fontMap = [];

		for (const fpath of fpaths){
			let fontData = null;

			try{
				fontData = fontkit.openSync(fpath);
			}catch{
				continue
			}

			for (const font of (fontData.fonts || [fontData]) ){
				self._fontMap.push([
					[font.familyName, font.subfamilyName, font.fullName],
					fpath,
				])
			}
		}

		return self._fontMap
	}

	packFonts(self, targetGTzip){
		const traversedFilePaths = new Set();

		for (const fontFamilyName of self.constructor.listTitleFonts(targetGTzip)){
			for (let [nameVariants, fontFilePath] of self.fontMap){
				// todo: name variants often point to the same file
				for (const variantName of nameVariants){
					if (variantName.includes(fontFamilyName) && !traversedFilePaths.has(fontFilePath)){
						traversedFilePaths.add(fontFilePath);

						fontFilePath = Path(fontFilePath);
						targetGTzip.add_file({
							'buf': fontFilePath.readFileSync(),
							'meta': {
								'grp':   'fonts',
								'fname': fontFilePath.basename,
								'ftype': 'font',
							}
						})
					}
				}
			}
		}
	}
}



const create_xml_tag = function(xml, tag_name, attrs=null, content=null){
	// Create the tag itself
	const tag = (xml.ownerDocument || xml).createElement(tag_name);

	// Add attributes, if any
	for (const attr_data of attrs){
		const [attr_name, attr_val] = attr_data;
		tag.setAttribute(attr_name, attr_val);
	}

	// Add content, if any
	if (content){
		tag.textContent = str(content);
	}

	return tag
}

const create_xml_tree = function(parent_xml_tag, tree){
	let parent = parent_xml_tag;

	for (tag_data of tree){
		const [tag_name, tag_attrs, tag_content] = tag_data;

		// Create the tag with all the attributes
		const tag = create_xml_tag(
			parent,
			tag_name,
			tag_attrs,
			tag_content,
		);

		// Append result to the last parent
		parent.appendChild(tag);

		// Newly created tag is now parent of the next tag
		parent = tag;
	}

	return parent
}

const escape_backslashes = function(tgt_str){
	return tgt_str.replaceAll('\\', '\\\\');
}

const _tidy_phantom_fpath = function(tgt){
	return str(tgt.join ? tgt.join('/') : tgt).strip('/').trim();
}

const clear_string = function(tgt){
	return str(tgt).replaceAll('/', '').trim();
}

const BytesIO = class {
	constructor(initialData) {
		const self = ksys.util.cls_pwnage.remap(this);
		ksys.util.nprint(self, '#64A2FF');

		// Accept initialData as Buffer, string, Uint8Array, or leave empty.
		if (Buffer.isBuffer(initialData)) {
			self._buffer = Buffer.from(initialData); // clone to avoid external mutations
		} else if (typeof initialData === 'string') {
			self._buffer = Buffer.from(initialData);
		} else if (initialData instanceof Uint8Array) {
			self._buffer = Buffer.from(initialData);
		} else {
			self._buffer = Buffer.alloc(0);
		}
		self._pos = 0;
	}

	read(self, n) {
		// If n is undefined or negative, read until the end.
		if (n == null || n < 0) {
			n = self._buffer.length - self._pos;
		}
		if (self._pos >= self._buffer.length) {
			return Buffer.alloc(0);
		}
		let end = self._pos + n;
		if (end > self._buffer.length) {
			end = self._buffer.length;
		}
		const chunk = self._buffer.slice(self._pos, end);
		self._pos = end;
		return chunk;
	}

	write(self, data) {
		let dataBuffer;
		if (Buffer.isBuffer(data)) {
			dataBuffer = data;
		} else if (typeof data === 'string') {
			dataBuffer = Buffer.from(data);
		} else if (data instanceof Uint8Array) {
			dataBuffer = Buffer.from(data);
		} else if (data instanceof self.constructor) {
			dataBuffer = data._buffer;
		} else {
			self.nerr(data);
			throw new Error('Data must be a Buffer, Uint8Array, or string');
		}
		let newPos = self._pos + dataBuffer.length;
		// If new data goes past the current length, extend the buffer.
		if (newPos > self._buffer.length) {
			let newBuffer = Buffer.alloc(newPos);
			self._buffer.copy(newBuffer, 0, 0, self._buffer.length);
			self._buffer = newBuffer;
		}
		// Copy the new data into the buffer at the current position.
		dataBuffer.copy(self._buffer, self._pos);
		self._pos = newPos;
		return dataBuffer.length;
	}

	seek(self, offset, whence = 0) {
		let newPos;
		if (whence === 0) { // from beginning
			newPos = offset;
		} else if (whence === 1) { // from current position
			newPos = self._pos + offset;
		} else if (whence === 2) { // from end
			newPos = self._buffer.length + offset;
		} else {
			throw new Error('Invalid value for whence');
		}
		if (newPos < 0) {
			throw new Error('New position is before the beginning of the buffer');
		}
		self._pos = newPos;
		return self._pos;
	}

	tell(self) {
		return self._pos;
	}

	getvalue(self) {
		return self._buffer;
	}

	$buf(self){
		return self._buffer
	}

	// Optional: Truncate the buffer to a given size.
	truncate(self, size) {
		if (size === undefined) {
			size = self._pos;
		}
		if (size < self._buffer.length) {
			self._buffer = self._buffer.slice(0, size);
		} else if (size > self._buffer.length) {
			let newBuffer = Buffer.alloc(size);
			self._buffer.copy(newBuffer);
			self._buffer = newBuffer;
		}
		if (self._pos > size) {
			self._pos = size;
		}
	}
}



const GTZipFile = class{
	// The scope of my engineering genius literally knows no bounds

	static MUTE_NPRINT = false;

	// NEVER compress phantom payloads smaller than this
	COMPRESSION_CAP = (1024 ** 2) * 2;

	// Compression efficiency <-> time spent factor (0-11)
	COMPRESSION_QUALITY = 1;

	/*
		Protocol ID (8)
		Protocol-based payload



		===========================
			Protocol PHANTOM1:
			KB sys offs (4)
			KB sys len (4)
			File count (4)

			File offs (4)
			File path len (4)
			File meta len (4)
			File data len (4)

			...

			Files n shit
		===========================



		===========================
			Protocol PHANTOM2:
			Header len (4)
			Header data...

			Byte content...


			Header data:
			{
			    'files': [
			        {
			            'meta_len':  (4),
			            'flen':      (4),
			        },
			        ...
			    ],
			    'meta': {
			         'len': (4),
			     },
			}

			Files are sequential. No need for offsets.
			meta always comes last. Only len is needed.
		===========================
	*/


	// _src is a dict:
	//     - fpath = absolute file path to the target gtzip
	//     - buf = raw .gtzip buffer

	constructor(_src=null){
		const self = ksys.util.cls_pwnage.remap(this);
		ksys.util.nprint(self, '#E764FF');

		const src = _src || {};

		const get_fucked = (
			  `FATAL: Failed to initialize ${self.constructor.name}. `
			+ `You're fucked: One of GTZip titles is now FUCKED`
		)

		if (src.fpath){
			self.src_fpath = Path(src.fpath);
		}else{
			self.src_fpath = null;
		}
		
		self._src_buf = src.buf || null;

		// Can't do shit with no starting point
		if (!self._src_buf && !self.src_fpath){
			self.nerr('Neither src_buf or src_fpath were provided to', self, _src);
			ksys.info_msg.send_msg(
				get_fucked,
				'err',
				20_000
			);
			throw new Error('Neither src_buf or src_fpath were provided to', self, _src);
		}

		// No buffer provided, filepath provided = filepath must exist to read buffer from
		if (!self._src_buf && !self.src_fpath.isFileSync()){
			self.nerr(
				'No buffer provided and the provided filepath',
				str(self.src_fpath),
				`doesn't point to a file`
			);
			ksys.info_msg.send_msg(
				get_fucked,
				'err',
				20_000
			);
			throw new Error(
				'No buffer provided and the provided filepath',
				str(self.src_fpath),
				`doesn't point to a file`
			);
		}

		self._zip_buf = null;
		self._res_xml = null;
		self._doc_xml = null;
		self._ct_xml = null;
		self._phantom_layer = null;
		self._phantom_img = null;

		self._phantom_img_zip_pointer = null;
		self._phantom_img_uid = null;
		self._kb_data = null;
	}

	// Fucking MORONS
	to_int32(self, num){
		const buf = Buffer.alloc(4);
		buf.writeUint32LE(num);
		return buf
	}

	// todo: RAM
	$src_buf(self){
		if (self._src_buf){
			return self._src_buf
		}

		self._src_buf = Buffer.from(
			self.src_fpath.readFileSync()
		)

		return self._src_buf
	}

	// AdmZip instance
	$zip_buf(self){
		if (self._zip_buf){
			return self._zip_buf
		}

		self._zip_buf = new AdmZip(self.src_buf);

		return self._zip_buf
	}

	// resources.xml
	$res_xml(self){
		if (self._res_xml){
			return self._res_xml
		}

		self._res_xml = (new DOMParser()).parseFromString(
			self.zip_buf.readFile('resources.xml'),
			'application/xml'
		)

		return self._res_xml
	}

	// document.xml
	$doc_xml(self){
		if (self._doc_xml){
			return self._doc_xml
		}

		self._doc_xml = (new DOMParser()).parseFromString(
			self.zip_buf.readFile('document.xml'),
			'application/xml'
		)

		return self._doc_xml
	}

	// [Content_Types].xml
	$ct_xml(self){
		if (self._ct_xml){
			return self._ct_xml
		}

		self._ct_xml = (new DOMParser()).parseFromString(
			self.zip_buf.readFile('[Content_Types].xml'),
			'application/xml'
		)

		return self._ct_xml
	}

	$phantom_layer(self){
		if (self._phantom_layer){
			return self._phantom_layer
		}

		// Check if it exists already
		self._phantom_layer = self.doc_xml.querySelector(
			`Layer[Name="${PHANTOM_LAYER_NAME}"]`
		)

		if (self._phantom_layer){
			self.nprint('Found existing phantom layer:', self._phantom_layer);
			return self._phantom_layer
		}

		// Create if it doesn't exist
		self._phantom_layer = create_xml_tree(
			self.doc_xml.querySelector('Composition'),
			[
				['Layer', [
					['Name', PHANTOM_LAYER_NAME],
					// ['Visible', 'False'],
					['Dimensions', '4,4,0'],
					['Location', '-69,0,0'],
				]],
				['Layer.Composition', []],
				['Composition', [
					['Width', '4'],
					['Height', '4'],
				]],
			]
		)

		self.nprint(
			'No existing phantom layer found. Creating a new one:',
			self._phantom_layer
		);

		return self._phantom_layer
	}

	$phantom_img_uid(self){
		if (self._phantom_img_uid){
			return self._phantom_img_uid
		}

		let phantom_img_layer = self.doc_xml.querySelector(
			`Image[Name="${PHANTOM_IMG_NAME}"] Image\\.Bitmap Bitmap`
		)

		if (!phantom_img_layer){
			self._phantom_img_uid = ksys.util.rnd_uuid();

			self.nprint(
				'No existing phantom image found. Creating a new one:',
				self._phantom_img_uid
			)

			// The stupid "Source" shit
			const phantom_img_gtz_src = `${ksys.util.rnd_uuid()}\\${PHANTOM_IMG_NAME}.jpg`;

			// Create image layer in the layer tree
			create_xml_tree(
				self.phantom_layer,
				[
					['Image', [
						['Name', PHANTOM_IMG_NAME],
						['Dimensions', '2,2,0'],
						['Locked', 'True'],
					]],
					['Image.Bitmap', []],
					['Bitmap', [
						['Source', phantom_img_gtz_src],
					]],
				]
			)

			// Create content types entries
			if (!self.ct_xml.querySelector('Default[Extension="jpg"]')){
				self.ct_xml.querySelector('Types').appendChild(create_xml_tag(
					self.ct_xml,
					'Default',
					[
						['Extension', 'jpg'],
						['ContentType', 'image/jpg'],
					]
				));
			}
			if (!self.ct_xml.querySelector(`Override[PartName="/${self._phantom_img_uid}"]`)){
				self.ct_xml.querySelector('Types').appendChild(create_xml_tag(
					self.ct_xml,
					'Override',
					[
						['PartName', `/${self._phantom_img_uid}`],
						['ContentType', 'application/octet-stream'],
					]
				));
			}

			// Create resource entry
			if (!self.res_xml.querySelector(escape_backslashes(`resource[filename="${phantom_img_gtz_src}"]`))){
				create_xml_tree(
					self.res_xml.querySelector('resources'),
					[
						['resource', [
							['filename', phantom_img_gtz_src],
						]],
						[
							'source',
							[ ['guid', self._phantom_img_uid], ],
							phantom_img_gtz_src,
						],
					]
				)
			}

			return self._phantom_img_uid
		}

		// Otherwise - get existing shit
		self._phantom_img_uid = (
			self.res_xml.querySelector(
				escape_backslashes(
					`resource[filename="${phantom_img_layer.getAttribute('Source')}"] source`
				)
			)
			.getAttribute('guid')
			.trim()
		)

		self.nprint('Got existing phantom image uid:', self._phantom_img_uid);

		return self._phantom_img_uid
	}

	// ZIP file object, which points to the phantom .jpg image
	$phantom_img_zip_pointer(self){
		if (self._phantom_img_zip_pointer){
			return self._phantom_img_zip_pointer
		}

		self._phantom_img_zip_pointer = self.zip_buf.getEntry(self.phantom_img_uid);

		if (!self._phantom_img_zip_pointer){
			self._phantom_img_zip_pointer = self.zip_buf.addFile(
				self.phantom_img_uid,
				PHANTOM_IMG_BUF
			);
		}else{
			self.nprint('Found phantom image:', self._phantom_img_zip_pointer);
		}

		return self._phantom_img_zip_pointer
	}

	$kb_data(self){
		if (self._kb_data){
			return self._kb_data
		}

		// self.nprint('FUUUU', self.phantom_img_zip_pointer.getData());

		// Raw phantom buffer
		const phantom_buf = new BytesIO(
			self.phantom_img_zip_pointer.getData().slice(PHANTOM_IMG_BUF.length)
		)

		// Read the protocol
		const protocol = str(phantom_buf.read(8)).replaceAll('\0', '');
		self.nprint('Reading protocol:', protocol);

		self._kb_data = {
			'meta': {},
			'files': {},
		}

		if (protocol.length <= 1){
			self.nprint('Phantom image has no payload');
			return self._kb_data
		}

		// Read header
		const header = JSON.parse(
			phantom_buf.read(
				phantom_buf.read(4).readUint32LE()
			)
		)
		self.nprint('PHANTOM2 Header:', header);

		let payload_buf = phantom_buf;

		if (header?.meta?.compression?.method == 'zlib.brotli'){
			payload_buf = new BytesIO(
				zlib.brotliDecompressSync(phantom_buf.read())
			);
			self.nprint('Decompressing...');
		}else{
			self.nprint('No compression detected');
		}

		// Read files
		for (const fdata of header.files){
			const phantom_file = new GTZPhantomFile({
				'parent': self,
				'meta': JSON.parse(payload_buf.read(fdata.meta_len)),
				'buf': payload_buf.read(fdata.flen),
			});

			self._kb_data.files[phantom_file.fid] = phantom_file;
		}

		// Read meta
		self._kb_data.meta = JSON.parse(payload_buf.read(header.meta.len));

		return self._kb_data
	}

	// Create a legit .jpg image buffer with all the phantom data embedded into it
	// and return it as a buffer
	to_phantom_buf(self, force_compress=false, force_no_compress=false){
		const payload_buf = new BytesIO();
		const header_data = {
			'files': [],
			'meta': {},
		};

		// Write files
		for (const fdata of Object.entries(self.kb_data.files)){
			const [fpath, file] = fdata;
			const [fmeta_buf, fdata_buf] = file.to_buf();

			header_data.files.push({
				// 'offs': payload_buf.tell(),
				// 'fpath': str(fpath),
				'meta_len': fmeta_buf.length,
				'flen': fdata_buf.length,
			})

			payload_buf.write(fmeta_buf);
			payload_buf.write(fdata_buf);
		}

		const compression_enabled = (
			(
				(payload_buf.buf.length > self.COMPRESSION_CAP) ||
				((payload_buf.buf.length > 3) && force_compress)
			)
			&&
			!force_no_compress
		);

		if (compression_enabled){
			header_data['meta']['compression'] = {
				'method': 'zlib.brotli',
			}
		}

		// Write meta
		// const kb_meta = self.kb_data.meta.to_buf();
		const kb_meta = Buffer.from(JSON.stringify(self.kb_data.meta));
		payload_buf.write(kb_meta);
		header_data.meta.len = kb_meta.length;

		const header_buf = Buffer.from(JSON.stringify(header_data));

		const phantom_buf = new BytesIO();
		phantom_buf.write(PHANTOM_IMG_BUF);
		phantom_buf.write('PHANTOM2');
		phantom_buf.write(self.to_int32(header_buf.length));
		phantom_buf.write(header_buf);

		// phantom_buf.write(payload_buf);

		const payload_buf_raw = payload_buf.getvalue();

		if (compression_enabled){
			self.nprint('Compressing...');
			phantom_buf.write(
				zlib.brotliCompressSync(payload_buf_raw, {
					'params': {
						[zlib.constants.BROTLI_PARAM_QUALITY]: self.COMPRESSION_QUALITY,
						[zlib.constants.BROTLI_PARAM_SIZE_HINT]: payload_buf_raw.length,
					}
				})
			);
		}else{
			phantom_buf.write(payload_buf_raw);
		}

		return phantom_buf.getvalue();
	}

	// Collapse everything into a .zip archive
	// and return byte buffer of the resulting .zip archive
	to_zip_buf(self, _prms=null){
		const prms = Object.assign({
			'as_buf': true,
			'force_compress': false,
			'force_no_compress': false,
		}, _prms)

		const serializer = new XMLSerializer();

		self.zip_buf.updateFile(
			'[Content_Types].xml',
			// todo: this is fucking retarded, BOTH OF YOU CUNTS:
			// WHY TF IS IT ADDING THIS STUPID XMLNS SHIT? NOBODY FUCKING ASKED FOR IT
			// WHY TF IS GT DESIGNER REFUSING TO LOAD ANYTHING WITH LITERALLY ONE EXTRA ATTRIBUTE ??
			// This only happens with this particular file...
			Buffer.from(serializer.serializeToString(self.ct_xml).replaceAll('xmlns=""', ''))
		);
		self.zip_buf.updateFile(
			'document.xml',
			Buffer.from(serializer.serializeToString(self.doc_xml))
		);
		self.zip_buf.updateFile(
			'resources.xml',
			Buffer.from(serializer.serializeToString(self.res_xml))
		);

		self.phantom_img_zip_pointer.setData(
			self.to_phantom_buf(prms.force_compress, prms.force_no_compress)
		);

		// for (const entry of self.zip_buf.getEntries()){
		// 	entry.header.versionMadeBy = 0x00;
		// 	entry.header.method = 0;
		// }

		if (prms.as_buf){
			return self.zip_buf.toBuffer();
		}else{
			return self.zip_buf
		}
	}

	add_file(self, _fdata){
		if (_fdata instanceof GTZPhantomFile){
			_fdata._parent = self;
			self.kb_data.files[_fdata.fid] = _fdata;
			return _fdata;
		}

		const fdata = _fdata || {};

		const phantom_file = new GTZPhantomFile({
			'parent': self,
			'meta': fdata.meta,
			'buf': fdata.buf,
		})

		self.kb_data.files[phantom_file.fid] = phantom_file;

		return phantom_file
	}

	// fdata is either fid string or GTZPhantomFile instance
	del_file(self, fdata){
		if (fdata instanceof GTZPhantomFile){
			delete self.kb_data.files[fdata.fid];
			fdata.kill();
			return
		}

		self.kb_data.files[fdata]?.kill?.();
		delete self.kb_data.files[fdata];
	}

	move_file(self, file, grp){
		const tgt_grp = clear_string(grp);
		if (!tgt_grp){
			throw new Error(
				'Invalid group name:',
				`Input: >${grp}<`,
				`Converted: >${tgt_grp}<`,
			);
		}

		delete self.kb_data.files[file.fid];
		file._grp = tgt_grp;
		self.kb_data.files[file.fid] = file;
	}

	rename_file(self, file, tgt_name){
		const new_name = clear_string(tgt_name);
		if (!new_name){
			throw new Error(
				'Invalid file name:',
				`Input: >${tgt_name}<`,
				`Converted: >${new_name}<`,
			);
		}

		delete self.kb_data.files[file.fid];
		file._fname = new_name;
		file.meta.fname = new_name;
		self.kb_data.files[file.fid] = file;
	}


	$tags(self){
		return self.kb_data.meta.tags || [];
	}

	$$tags(self, _val){
		const val = _val || [];

		if ((typeof val) === 'string'){
			self.kb_data.meta.tags = val.split('\n').map(function(v){
				return v.replaceAll(',', '').lower().trim();
			})
		}else{
			self.kb_data.meta.tags = val.map(function(v){
				return v.replaceAll(',', '').lower().trim();
			})
		}

		self.kb_data.meta.tags = Array.from(
			new Set(self.kb_data.meta.tags.filter(function(val){
				return !!val
			}))
		)

		self.nprint('Updated tags to', self.kb_data.meta.tags);
	}
}


const GTZFileKBMeta = class{
	constructor(buf=null){
		const self = ksys.util.cls_pwnage.remap(this);
		ksys.util.nprint(self, '#E764FF');

		self.kb_meta = buf ? JSON.parse(buf) : {};
	}

	to_buf(self){
		return Buffer.from(JSON.stringify(self.kb_meta))
	}
}


const GTZPhantomFile = class{
	// todo: Files should only exist in groups.

	/*
		constructor(parent, meta=null, buf=null){
			const self = ksys.util.cls_pwnage.remap(this);
			ksys.util.nprint(self, '#64FF6F');

			self.parent = parent;

			self.meta = Buffer.isBuffer(meta) ? JSON.parse(meta) : meta;
			self.buf = buf || Buffer.alloc(0);
			self.dead = false;

			self._fpath = tidy_phantom_fpath(
				self.meta.fpath || ksys.util.rnd_uuid()
			);

			delete self.meta['fpath'];

			self._editor_dom = null;
		}
	*/

	static DEFAULT_GRP = 'main';

	static FTYPE_MAP = Object.freeze({
		'image': [
			'.jpg',
			'.jpeg',
			'.png',
			'.tif',
			'.tiff',
			'.apng',
			'.webp',
			'.bmp',
			'.gif',
			'.dds',
			'.svg',
		],
		'font': [
			'.otf',
			'.ttf',
			'.ttc',
			'.woff',
			'.woff2',
		],
		'text': [
			'.json',
			'.txt',
			'.xml',
			'.html',
			'.css',
			'.reg',
		]
	})

	constructor(fdata){
		const self = ksys.util.cls_pwnage.remap(this);
		ksys.util.nprint(self, '#64FF6F');

		self.dead = false;

		self.nprint('Created file:', fdata, self);

		self._parent = fdata.parent;
		self.meta = fdata.meta || {};
		self.buf = fdata.buf || Buffer.alloc(0);

		self._fname = self.meta.fname || ksys.util.rnd_uuid();
		self._grp = self.meta.grp || self.constructor.DEFAULT_GRP;

		if (!self.meta.ftype){
			self.meta.ftype = 'buf';
			for (const ftype_data of Object.entries(self.constructor.FTYPE_MAP)){
				const [ftype, fext_array] = ftype_data;
				if (fext_array.includes(Path(self.fname).ext.lower())){
					self.meta.ftype = ftype;
					break
				}
			}
		}

		// todo: The fucking Blob shit is EVIL
		self.blobs = new Set();

		self._editor_dom = null;
	}

	kill_blobs(self){
		for (const blob_url of self.blobs){
			URL.revokeObjectURL(blob_url);
		}
	}

	kill(self, unparent=true){
		self.kill_blobs();
		self.buf = Buffer.alloc(0);
		self.meta = {};
		self?._editor_dom?.root?.remove?.();

		self.dead = true;
	}

	to_buf(self){
		if (self.dead){
			self.nwarn('to_buf() called on a dead file', self);
		}

		// self.meta.fname = self.fname;
		// self.meta.grp = self.grp;

		return [
			Buffer.from(JSON.stringify(Object.assign(self.meta, {
				'fname': self.fname,
				'grp': self.grp,
			}))),
			Buffer.from(self.buf),
		]
	}

	$parent(self){
		return self._parent
	}

	$grp(self){
		return (self._grp || self.constructor.DEFAULT_GRP)
	}

	$fname(self){
		return self._fname
	}

	$fid(self){
		return [self.grp, self.fname].join('/')
	}

	$editor_dom(self){
		if (self._editor_dom){
			return self._editor_dom
		}

		self._editor_dom = TPLATES.editor_file_instance({
			'fname': '.fname',
			'fpreview': '.fpreview',
			'fmeta': '.fmeta',
		});

		self._editor_dom.root.oncontextmenu = function(evt){
			const selected_files = self?.parent?.editor?.selected_files;
			if (!selected_files){return};

			if (selected_files.has(self)){
				selected_files.delete(self);
				self._editor_dom.root.classList.remove('selected');
			}else{
				selected_files.add(self);
				self._editor_dom.root.classList.add('selected');
			}
		}

		ksys.util.bind_val_to_dom({
			'dom': [self._editor_dom.index.fname],
			'val': [self, '_fname'],
		})

		let preview_dom;

		if (self.meta.ftype == 'image'){
			preview_dom = TPLATES.phantom_file_preview_img({
				'img': 'img',
			});

			const blob_url = URL.createObjectURL(
				new Blob([self.buf])
			);
			self.blobs.add(blob_url);
			preview_dom.index.img.src = blob_url;
		}

		if (self.meta.ftype == 'font'){
			preview_dom = TPLATES.phantom_file_preview_font({
				'style_tag': 'style',
			});

			const samples_uid = lizard.rndwave(16, 'letters');
			const family_uid = lizard.rndwave(16, 'letters');

			preview_dom.root.classList.add(samples_uid);

			const blob_url = URL.createObjectURL(
				new Blob([self.buf])
			);
			self.blobs.add(blob_url);

			preview_dom.index.style_tag.textContent = `
				@font-face{
					font-family: '${family_uid}';
					font-weight: 400;
					font-style: normal;
					src: url('${blob_url}');
				}
				.${samples_uid} *{
					font-family: ${family_uid};
				}
			`
		}

		if (self.meta.ftype == 'text'){
			preview_dom = TPLATES.phantom_file_preview_text({
				'text_tag': '.text_samples',
			});
			preview_dom.index.text_tag.textContent = str(self.buf);
		}

		if (self.meta.ftype == 'buf'){
			preview_dom = TPLATES.phantom_file_preview_buf({
				'btn': 'sysbtn',
			});
			preview_dom.index.btn.onclick = function(){
				self.nprint('Buffer preview:', self.buf);
			}
		}

		self._editor_dom.index.fpreview.append(preview_dom.root);

		return self._editor_dom
	}

	_rename(self, name, overwrite=true){
		const has_parent = !!self.parent;
		const new_name = str(name).replaceAll('/', '').trim();

		if (!new_name){
			throw new Error(
				'Invalid name:', `Input: >${name}<`, `Converted: >${new_name}<`
			);
		}
		let duplicate = false;

		if (has_parent){
			if (self.fid in self.parent.kb_data.files){
				duplicate = true;				
			}
			delete self.parent.kb_data.files[self.fid];
		}

		self.meta.fname = new_name;
		self._fname = new_name;

		if (has_parent){
			self.parent.kb_data.files[self.fid] = self;
		}

		return {
			has_parent,
			duplicate,
		}
	}

	_move(self, grp, overwrite=true){
		const tgt_grp = str(grp).replaceAll('/', '').trim();
		if (!tgt_grp){
			throw new Error(
				'Invalid group name:',
				`Input: >${grp}<`,
				`Converted: >${tgt_grp}<`,
			);
		}

		if (self.parent){
			delete self.parent.kb_data.files[self.fid];
		}

		self._grp = tgt_grp;

		return self.rename(self.fname, overwrite);
	}

	rename(self, new_name){
		if (self.parent){
			return self.parent.rename_file(self, new_name);
		}

		self._fname = clear_string(new_name);
		self.meta.fname = self._fname;

		return self.fid
	}

	move(self, new_grp){
		if (self.parent){
			return self.parent.move_file(self, new_grp);
		}

		self._grp = clear_string(new_grp);
		self.meta.grp = self._grp;

		return self.fid
	}
}


const GTZipFileEditor = class{
	constructor(gtz_file){
		const self = ksys.util.cls_pwnage.remap(this);
		ksys.util.nprint(self, '#64FF68');

		self.gtz_file = gtz_file;

		self.gtz_file.editor = self;

		self._list_item_dom = null;
		self._meta_dom = null;
		self._ftree_dom = null;

		self.selected_files = new Set();
	}

	$list_item_dom(self){
		if (self._list_item_dom){
			return self._list_item_dom
		}

		self._list_item_dom = TPLATES.editor_gtz_list_item({
			'title': 'phantom-list-item',
		})

		self._list_item_dom.index.title.textContent = self.gtz_file.kb_data.meta.real_name || self?.gtz_file?.src_fpath?.basename;

		return self._list_item_dom;
	}

	$tags(self){
		return self?.gtz_file?.kb_data?.meta?.tags?.join?.('\n') || [];
	}

	$$tags(self, val){
		self.gtz_file.tags = val;
	}

	$meta_dom(self){
		if (self._meta_dom){
			return self._meta_dom
		}

		self._meta_dom = TPLATES.editor_sys_meta({
			'preview_img':      '.title_preview',
			'comment_input':    '.gtz_comment textarea',
			'tags_input':       '.gtz_tags textarea',
			'real_name_input':  '.gtz_real_name',
		})

		const dom_idx = self._meta_dom.index;

		// Real Name
		ksys.util.bind_val_to_dom({
			'dom': [dom_idx.real_name_input],
			'val': [self.gtz_file.kb_data.meta, 'real_name'],
		})
		ksys.util.bind_val_to_dom({
			'autofill': false,
			'bind_method': 'oninput',
			'dom': [dom_idx.real_name_input],
			'val': [self.list_item_dom.root, 'textContent'],
		})

		// Comment
		ksys.util.bind_val_to_dom({
			'dom': [dom_idx.comment_input],
			'val': [self.gtz_file.kb_data.meta, 'comment'],
		})

		// Tags
		ksys.util.bind_val_to_dom({
			'dom': [dom_idx.tags_input],
			'val': [self, 'tags'],
		})

		// Preview image (thumbnail.png created by VMIX)
		dom_idx.preview_img.src = URL.createObjectURL(
			new Blob([self.gtz_file.zip_buf.readFile('thumbnail.png')])
		);

		return self._meta_dom
	}

	$ftree_dom(self){
		if (self._ftree_dom){
			return self._ftree_dom
		}

		self._ftree_dom = TPLATES.editor_files({
			'flist':        '.flist_array',
			'create_grp':   '.create_group',
			'delete_files': '.delete_selected_files',
		})

		const groups = {};

		for (const file of Object.values(self.gtz_file.kb_data.files)){
			if (!groups[file.grp]){
				groups[file.grp] = [];
			}

			groups[file.grp].push(file);
		}

		for (const grp_data of Object.entries(groups)){
			const [grp_name, grp_content] = grp_data;
			self.create_group(grp_name, grp_content);
		}

		self._ftree_dom.index.create_grp.onclick = function(){
			self.create_group();
		}
		self._ftree_dom.index.delete_files.onclick = function(){
			if (!confirm(`Delete ${self.selected_files.size} files?`)){return};
			for (const phantom_file of self.selected_files){
				// phantom_file.kill();
				self.gtz_file.del_file(phantom_file);
			}

			self.selected_files.clear();
		}

		return self._ftree_dom
	}

	create_group(self, grp_name, grp_content=null){
		const grp_data = {
			'grp_name': grp_name || ksys.util.rnd_uuid(),
		}

		const grp_dom = TPLATES.editor_fgroup({
			'content':        '.fgroup_content',
			
			'del_grp_btn':    'sysbtn[action="delete_grp"]',

			'grp_name_vis':   '.fgroup_name',
			'grp_name_input': 'input[action="rename"]',
			'grp_name_btn':   'sysbtn[action="rename"]',

			'move_here_btn':  'sysbtn[action="move_here"]',

			'file_input':     'input[action="fpicker"]',
			'file_input_btn': 'sysbtn[action="fpicker"]',
		})

		grp_dom.index.grp_name_vis.textContent = grp_data.grp_name;

		grp_dom.index.del_grp_btn.onclick = function(){
			if (!confirm('Are you sure? This will irreversibly annihilate all the files in this group and the group itself')){return};

			for (const phantom_file of Object.values(self.gtz_file.kb_data.files)){
				if (phantom_file.grp == grp_data.grp_name){
					self.gtz_file.del_file(phantom_file);
				}
			}

			grp_dom.root.remove();
		}

		grp_dom.index.grp_name_vis.onclick = function(){
			grp_dom.root.classList.toggle('open');
		}

		grp_dom.index.grp_name_btn.onclick = function(){
			const new_grp_name = grp_dom.index.grp_name_input.value;
			self.nprint('Renaming:', grp_data.grp_name, '>', new_grp_name);
			if (!new_grp_name){
				self.nerr('Invalid group name:', new_grp_name);
				return
			}

			for (const phantom_file of Object.values(self.gtz_file.kb_data.files)){
				if (phantom_file.grp == grp_data.grp_name){
					phantom_file.move(new_grp_name);
				}
			}

			grp_dom.index.grp_name_vis.textContent = new_grp_name;
			grp_data.grp_name = new_grp_name;
		}

		grp_dom.index.file_input_btn.onclick = function(){
			for (const file_data of grp_dom.index.file_input.files){
				const fpath = Path(file_data.path);
				const phantom_file = new GTZPhantomFile({
					'buf': fpath.readFileSync(),
					'meta': {
						'fname': fpath.basename,
						'grp': grp_data.grp_name,
					}
				})
				// const phantom_file = self.gtz_file.add_file({

				// })

				self.gtz_file.kb_data.files?.[phantom_file.fid]?.editor_dom?.root?.remove?.();
				self.gtz_file.del_file(phantom_file.fid);

				self.gtz_file.add_file(phantom_file);

				grp_dom.index.content.append(phantom_file.editor_dom.root);
			}

			grp_dom.index.file_input.value = null;
		}

		grp_dom.index.move_here_btn.onclick = function(){
			for (const phantom_file of self.selected_files){
				phantom_file.move(grp_data.grp_name);
				grp_dom.index.content.append(phantom_file.editor_dom.root);
			}
		}

		if (grp_content){
			for (const phantom_file of grp_content){
				grp_dom.index.content.append(phantom_file.editor_dom.root);
			}
		}

		self.ftree_dom.index.flist.append(grp_dom.root);

		return grp_dom
	}
}


const GTZipDB = class{
	constructor(db_path){
		const self = ksys.util.cls_pwnage.remap(this);
		ksys.util.nprint(self, '#FF88D1');

		self.db_path = Path(db_path);

		self._contents = null;
	}

	$contents(self){
		if (self._contents){
			return self._contents;
		}

		self._contents = self.rescan();

		return self._contents
	}

	rescan(self){
		const flist = [];

		for (const gtzfile of self.db_path.globSync('*.gtzip')){
			flist.push(new GTZipFile({
				'fpath': gtzfile,
			}));
		}

		self._contents = flist;

		return flist;
	}

	add_file(self, _gtz_fpath){
		const gtz_fpath = Path(_gtz_fpath);

		if (self.db_path.join(gtz_fpath.basename).isFileSync()){
			self.nprint('File', gtz_fpath, 'already in db');
			return
		}

		const gtzfile = new GTZipFile({
			'fpath': gtz_fpath,
		});

		self.db_path.join(`${ksys.util.rnd_uuid()}.gtzip`).writeFileSync(
			gtzfile.to_zip_buf()
		)

		/*
		fs.rename(
			str(gtz_fpath),
			str(self.db_path.join(
				`${ksys.util.rnd_uuid()}.gtzip`
			)),
			function(e){self.nprint(e)}
		)
		*/
	}
}



module.exports = {
	GTZipFile,
	GTZPhantomFile,
	fontPacker,
	GTZipDB,
	// GTZipFileEditor,
}










