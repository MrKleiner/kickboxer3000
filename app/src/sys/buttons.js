
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
	};

	// register named buttons in a pool
	sync_pool(){
		for (let reg of document.querySelectorAll('vmixbtn[btname]')){
			window.vmix_btns.pool[reg.getAttribute('btname')] = reg
		}
	}

	get pool(){
		// todo: temp: Resync pool before getting it
		this.sync_pool()
		return window.vmix_btns.pool
	}

}

module.exports = new vmix_t_bottuns();