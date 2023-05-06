
class vmix_t_bottuns
{
	// constructor(height, width) {
	constructor() {
		window.vmix_btns = {}
		window.vmix_btns.pool = {}
		console.log('Initialized Buttons System');
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

		this.icon_registry = {
			'auto_seq':    './assets/auto_seq_icon_c.svg',
			'vis_show':    './assets/eye_vis_on.svg',
			'vis_hide':    './assets/eye_vis_off.svg',
			'update':      './assets/update_icon.svg',
			'play':        './assets/play_icon.svg',
			'auto_tweaks': './assets/gear_icon.svg',
		}
	};

	// register named buttons in a pool
	sync_pool(){
		for (let reg of document.querySelectorAll('vmixbtn[btname]')){
			window.vmix_btns.pool[reg.getAttribute('btname')] = reg
		}

		for (let btn of document.querySelectorAll('vmixbtn[seq_info]')){
			const _self = this;
			const actions = btn.getAttribute('seq_info').split('+')
			const seq = actions.map(function(act){
				return `<img class="vmixbtn_info_icon" src="${_self.icon_registry[act.trim()]}">`
			})
			$(btn).append(`<div class="vmixbtn_info_icon_pool">${seq.join('')}</div>`)
			btn.removeAttribute('seq_info')
			btn.setAttribute('rel_pos', null)
		}
	}

	get pool(){
		// todo: temp: Resync pool before getting it
		this.sync_pool()
		return window.vmix_btns.pool
	}

}

module.exports = new vmix_t_bottuns();