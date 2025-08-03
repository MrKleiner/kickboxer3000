
// todo: this system needs to be rewritten

// Die
Element.prototype.vmixbtn = function(state=false, adv=false) {
	if (this.closest('vmixbtn')){
		if (state == false){
			this.classList.add(adv ? 'vmixbtn_adv_locked' : 'vmixbtn_locked')
		}
		if (state == true){
			this.classList.remove(adv ? 'vmixbtn_adv_locked' : 'vmixbtn_locked')
		}
	}
}



// todo: finally clean the mess
// todo: buttons with timeouts (automatic, cool looking)
// todo: there are quite a few global document listeners at this point



const mod_keys = {
	'alt': 'altKey',
	'ctrl': 'ctrlKey',
}

document.addEventListener('click', evt => {
	const tgt_btn = evt.target.closest('sysbtn, vmixbtn');
	if (!tgt_btn){return};

	const tgt_mod_key = tgt_btn.getAttribute('mod_key');
	if (tgt_mod_key){
		if (!evt[mod_keys[tgt_mod_key.lower().strip()]]){
			ksys.info_msg.send_msg(
				`Hold ${tgt_mod_key.upper().strip()}`,
				'warn',
				3000
			);
			return
		}
	}

	const timeout_attr = tgt_btn.getAttribute('click_timeout');
	if (!timeout_attr){return};

	const timeout_amount = int(timeout_attr);
	if (!timeout_amount){return};


	tgt_btn.classList.add('is_timeout_blocked');
	ksys.util.sleep(timeout_amount)
	.then(function(){
		tgt_btn.classList.remove('is_timeout_blocked');
	})
});



const pool = {}


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
const preload_icons = async function(){
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

// _vb.icon_pre_load
const icon_pre_load = async function(){
	return await preload_icons()
}



const vmixbtn = class{
	constructor(sel=null){
		const self = this;
		ksys.util.cls_pwnage.remap(self);

		self.elem = $(sel)
		if (!self.elem[0]){
			console.error('Button doesnt exist', sel)
			return
		}
		self.elem = self.elem[0];
		self.enabled = true;
	}

	timeout(self, dur=null){
		return new Promise(function(resolve, reject){
			self.toggle(false)
			self.pause_timeout = setTimeout(function(){
				self.toggle(true)
				resolve(true)
			}, (dur || 1000));
		});
	}

	cancel_timeout(self, re_enable=true){
		clearTimeout(self.pause_timeout)
		if (re_enable){
			self.elem.vmixbtn(true)
		}
	}

	toggle(self, state=null, adv=false){
		if (state == true){
			self.elem.vmixbtn(true, adv)
			self.enabled = true;
			return
		}
		if (state == false){
			self.elem.vmixbtn(false, adv)
			self.enabled = false;
			return
		}

		// toggle
		if (self.enabled == true){
			self.elem.vmixbtn(false, adv)
		}else{
			self.elem.vmixbtn(true, adv)
		}
	}
}


const resync = function(){
	// Wipe the existing pool
	// pool = {};

	// index every named button
	for (let reg of document.querySelectorAll('vmixbtn[btname]')){
		const btname = reg.getAttribute('btname');
		pool[btname] = new vmixbtn(`vmixbtn[btname="${btname}"]`)
	}

	// create hints
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

	// turn off buttons that should be off by default
	for (const btn of document.querySelectorAll('vmixbtn[off]')){
		btn.vmixbtn(false);
		btn.removeAttribute('off');
	}
}

const timeout = function(cmd){

	for (const btname in cmd){
		const btn = pool[btname];
		if (!btn){
			console.warn('Cannot find button', btname)
			continue
		}

		btn.timeout(cmd[btname])
	}
}


const adv_timeout = function(btn_ids){
	for (const btname in btn_ids){
		const btn = pool[btname];
		if (!btn){
			console.warn('Cannot find button', btname)
			continue
		}

		btn.toggle(false, true);

		const pie = new ksys.info_msg.MagicCircle({
			'get_stuck': false,
			'stroke_w': 35,
		});
		const pie_dom = $('<div class="kb_btn_timeout_vis"></div>')[0];
		pie_dom.append(pie.dom);

		btn.elem.append(pie_dom);

		pie.launch_anim(btn_ids[btname] || 500)
		.then((value) => {
			if (!pie.get_stuck){
				pie_dom.remove();
				btn.toggle(true, true);
			}
		});
	}
}


const toggle = function(cmd){
	for (const btname in cmd){
		const btn = pool[btname];
		if (!btn){
			console.warn('Cannot find button', btname)
			continue
		}

		btn.toggle(cmd[btname])
	}
}




// module.exports = _vb;
module.exports = {
	vmixbtn,
	resync,
	timeout,
	toggle,
	icon_pre_load,
	adv_timeout,
	pool,
}