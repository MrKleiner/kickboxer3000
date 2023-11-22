_pgview = {
	'pool': {},
	'quick_view': null,
};


/*
document.addEventListener('keydown', evt => {
	const toggle_tgt = _pgview.pool[evt.keyCode];
	if (toggle_tgt){
		toggle_tgt.show()
		// toggle_tgt.webv.openDevTools()
	}
});

document.addEventListener('keypress', evt => {
	if (evt.keyCode == 192 && document.querySelector('.__pgview_shown')){
		$('#pgview_base').addClass('__pgview_hidden');
		$('#pgview_base webview').addClass('__pgview_hidden');
	}
});
*/

document.addEventListener('keydown', evt => {
	return
	if (event.repeat != undefined) {
		__allowed = !event.repeat;
	}
	if (!__allowed) return;
	__allowed = false;

	// print('KURWA', evt)
	if (evt.target.closest('input, textarea, [contenteditable]')){return};

	const toggle_tgt = _pgview.pool[evt.keyCode];
	if (toggle_tgt){
		toggle_tgt.show()
	}

	if (evt.keyCode == 192 && _pgview.quick_view){
		_pgview.quick_view.show()
	}

	if (evt.keyCode == 27){
		$('#pgview_base').addClass('__pgview_hidden');
		$('#pgview_base webview').addClass('__pgview_hidden');
	}
});

document.addEventListener('keyup', evt => {
	return
	if (evt.keyCode == 192 && _pgview.quick_view){
		_pgview.quick_view.hide()
	}
});


_pgview.pgview_entry = class{
	constructor(keybind=null, tgt_url=null, keybind_name=null){
		this.tgt_url = tgt_url;
		this.keybind = keybind;
		this.keybind_name = keybind_name;

		this.webv = $(`
			<webview
				src="${this.tgt_url}"
				class="__pgview_hidden"
			>
			</webview>
		`)[0]

		// register in the pool if data is present
		if (keybind){
			_pgview.pool[keybind] = this;
		}

		$('#pgview_base').append(this.webv)
	}

	get bind_ctrl(){
		// (fuckoff)
		const label_link = lizard.rndwave() 

		const ctrl = $(`
			<div class="pgview_bind_entry">
				<input value="${this.tgt_url}" placeholder="LINK">
				<sysbtn>&gt${this.keybind_name}&lt</sysbtn>
				<div>
					<div labeled_cbox>
						<label for="${label_link}">Quick View</label>
						<input class="__pgview_quick_view_inp" id="${label_link}" type="radio" name="_pgview_tilde_cond_radio">
					</div>
				</div>
			</div>
		`)
		const ctrl_index = ksys.tplates.index_elem(
			ctrl[0],
			{
				'link_input': 'input',
				'keybind': 'sysbtn',
				'qview_inp': '.__pgview_quick_view_inp',
			}
		)

		const self = this;
		ctrl_index.index.link_input.onchange = function(elem){
			print('just fuckoff', elem.target.value)
			self.webv.src = elem.target.value;
			self.tgt_url = elem.target.value;

			if (self.keybind){
				_pgview.save_pool()
			}
		}

		ctrl_index.index.keybind.onclick = async function(elem){
			elem.target.textContent = '...'
			const bind = await ksys.util.get_key()
			if (bind != null && bind?.keyCode != 192){
				self.keybind_name = bind.key;

				// re-register in the pool
				delete _pgview.pool[self.keybind]
				_pgview.pool[bind.keyCode] = self;
				self.keybind = bind.keyCode;

				// save pool
				_pgview.save_pool()
			}

			elem.target.textContent = self.keybind_name;

		}

		ctrl_index.index.qview_inp.onchange = function(elem){
			print('QV changed:', elem)
			_pgview.quick_view = self;
		}

		return ctrl[0]
	}

	show(){
		print('showing...', this)
		$('#pgview_base').removeClass('__pgview_hidden');
		$('#pgview_base webview').addClass('__pgview_hidden');
		$(this.webv).removeClass('__pgview_hidden')
	}

	hide(){
		print('hiding...', this)
		$('#pgview_base').addClass('__pgview_hidden');
		$('#pgview_base webview').addClass('__pgview_hidden');
	}
}


_pgview.reload = function(){
	$('#pgview_base').empty()
	_pgview.pool = {};

	const bindings = JSON.parse(ksys.db.global.read('pgview_cfg_binds.kbcfg'));
	if (!bindings){return};

	for (const key_code in bindings){
		const bind_info = bindings[key_code]

		const pgv = new _pgview.pgview_entry(key_code, bind_info.url, bind_info.kbname)

		$('#pgview_link_pool').append(pgv.bind_ctrl)
	}
}

_pgview.show_pool = function(){
	for (const keyb in _pgview.pool){
		const pgv = _pgview.pool[keyb]
		$('#pgview_link_pool').append(pgv.bind_ctrl)
	}
}

_pgview.save_pool = function(){
	const binds = {};
	for (const keyb in _pgview.pool){
		const pgv = _pgview.pool[keyb];
		binds[keyb] = {
			'url': pgv.tgt_url,
			'kbname': pgv.keybind_name,
		}
	}
	ksys.db.global.write('pgview_cfg_binds.kbcfg', JSON.stringify(binds))
}









module.exports = _pgview;