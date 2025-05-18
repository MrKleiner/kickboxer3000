
if(!window.kbmodules){window.kbmodules={}};
if(!window.kbmodules.gtzip_wrangler){window.kbmodules.gtzip_wrangler={}};




const TPLATES = ksys_placeholder(
	() => ksys.context.tplates
)



window.kbmodules.gtzip_wrangler.load = function(){
	const ctx_prms = ksys.context.module.cache;
}







const GTZEditor = class{
	constructor(gtz_file){
		const self = ksys.util.cls_pwnage.remap(this);
		ksys.util.nprint(self, '#64FF68');

		self.gtz_file = gtz_file;

		self._dblist_item_dom = null;
		self._meta_dom = null;
	}

	// DOM, which appears in the DB listing column
	$dblist_item_dom(self){
		if (self._dblist_item_dom){
			return self._dblist_item_dom
		}

		self._dblist_item_dom = TPLATES.phantom_editor.dblist_item({
			'title': 'phantom-list-item',
		})

		self._dblist_item_dom.index.title.textContent = (
			   self.gtz_file.kb_data.meta.real_name
			|| self?.gtz_file?.src_fpath?.basename
		)

		return self._dblist_item_dom;
	}

	$tags(self){
		return self?.gtz_file?.kb_data?.meta?.tags?.join?.('\n') || [];
	}

	$$tags(self, val){
		self.gtz_file.tags = val;
	}

	// Basic params, such as preview, real name, comment, tags ...
	$meta_dom(self){
		if (self._meta_dom){
			return self._meta_dom
		}

		self._meta_dom = TPLATES.phantom_editor.meta({
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
		// todo: bootleg hack?
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

		// Preview image (thumbnail.png created by GT Title Editor)
		dom_idx.preview_img.src = URL.createObjectURL(
			new Blob([self.gtz_file.zip_buf.readFile('thumbnail.png')])
		);

		return self._meta_dom
	}

}










