
// Die
Element.prototype.vmixbtn = function(state=false) {
	if (this.closest('vmixbtn')){
		if (state == false){
			this.classList.add('vmixbtn_locked')
		}
		if (state == true){
			this.classList.remove('vmixbtn_locked')
		}
	}
}













const _vb = {
	'pool': {},
};




// Button icons
const icon_registry = {
	'auto_seq':    './assets/auto_seq_icon_c.svg',
	'vis_show':    './assets/eye_vis_on.svg',
	'vis_hide':    './assets/eye_vis_off.svg',
	'update':      './assets/update_icon.svg',
	'play':        './assets/play_icon.svg',
	'resume':      './assets/resume_icon.svg',
	'auto_tweaks': './assets/gear_icon.svg',
	'if':          './assets/question_mark_icon.svg',
	'cond':        './assets/question_mark_icon.svg',
	'alive':       './assets/heart_icon_b.svg',
	'else':        './assets/else_icon.svg',
	'pause':       './assets/pause_icon.svg',
	'stop':        './assets/stop_icon.svg',
}


// pre-load all the icons
_vb.icon_pre_load = async function(){
	for (const idx in icon_registry){
		const icon_path = icon_registry[idx];

		const rsp = await
		fetch(icon_path, {
			'headers': {
				'accept': '*/*',
				'cache-control': 'no-cache',
				'pragma': 'no-cache'
			},
			'method': 'GET',
			'mode': 'cors',
			'credentials': 'omit',
			'cache': 'no-store',
		})

		const rblob = await rsp.blob();

		// overwrite corresponding dictionary entry
		icon_registry[idx] = URL.createObjectURL(rblob);
	}
}




_vb.vmixbtn = class
{
	constructor(sel=null){
		this.elem = $(sel)
		if (!this.elem[0]){
			console.error('Button doesnt exist', sel)
			return
		}
		this.elem = this.elem[0];
		this.enabled = true;
	}

	timeout(dur=null){
		const _self = this;
		return new Promise(function(resolve, reject){
			_self.toggle(false)
			_self.pause_timeout = setTimeout(function(){
				_self.toggle(true)
				resolve(true)
			}, (dur || 1000));
		});
	}

	cancel_timeout(re_enable=true){
		clearTimeout(this.pause_timeout)
		if (re_enable){
			this.elem.vmixbtn(true)
		}
	}

	toggle(state=null){
		if (state == true){
			this.elem.vmixbtn(true)
			this.enabled = true;
			return
		}
		if (state == false){
			this.elem.vmixbtn(false)
			this.enabled = false;
			return
		}

		// toggle
		if (this.enabled == true){
			this.elem.vmixbtn(false)
		}else{
			this.elem.vmixbtn(true)
		}
	}
}


_vb.resync = function(){
	// Wipe the existing pool
	_vb.pool = {};

	// index every named button
	for (let reg of document.querySelectorAll('vmixbtn[btname]')){
		const btname = reg.getAttribute('btname');
		_vb.pool[btname] = new _vb.vmixbtn(`vmixbtn[btname="${btname}"]`)
	}

	for (let btn of document.querySelectorAll('vmixbtn[seq_info]')){
		const actions = btn.getAttribute('seq_info').split('+')
		const seq = actions.map(function(act){
			if (act == '<'){
				return '<div>'
			}
			if (act == '>'){
				return '</div>'
			}
			return `<img class="vmixbtn_info_icon" src="${icon_registry[act.trim()]}">`
		})
		$(btn).append(`<div class="vmixbtn_info_icon_pool">${seq.join('')}</div>`)
		btn.removeAttribute('seq_info')
		btn.setAttribute('rel_pos', null)
	}
}

_vb.timeout = function(cmd){

	for (const btname in cmd){
		const btn = _vb.pool[btname];
		if (!btn){
			console.warn('Cannot find button', btname)
			continue
		}

		btn.timeout(cmd[btname])
	}
}

_vb.toggle = function(cmd){
	for (const btname in cmd){
		const btn = _vb.pool[btname];
		if (!btn){
			console.warn('Cannot find button', btname)
			continue
		}

		btn.toggle(cmd[btname])
	}
}




console.log('Initialized Buttons System');
// module.exports = new vmix_t_bottuns();
module.exports = _vb;