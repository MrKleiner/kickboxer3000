
const strf_gui = {
	'params': {},
};



const _format_option = class{
	constructor(strf_p, input_cfg=null){
		this.__is_frmt_gui = true;

		const prm_id = strf_p.getAttribute('fpid')
		const display_name = strf_p.getAttribute('display_name')
		// const translit_default = 
		// 	({'1': true, 'true': true, '0': false, 'false': false})[strf_p.getAttribute('translit_default')]
		// 	||
		// 	false;
		// const trim_default = 
		// 	({'1': true, 'true': true, '0': false, 'false': false})[strf_p.getAttribute('trim_default')]
		// 	||
		// 	true;
		const trim_cfg_attr = strf_p.getAttribute('trim_default');
		const format_default = strf_p.getAttribute('format_default') || 'all_upper';

		this.param_elem = $(`
			<strf-param strf-param-id="${prm_id}">
				<strf-label>${display_name}</strf-label>
				<strf-selector>

					<strf-opt-group>
						<strf-opt strf-opt-type="translit">
							<label for="strf-opt-id-${prm_id}-translit">Translit</label>
							<input id="strf-opt-id-${prm_id}-translit" name="strf-opt-cboxg-${prm_id}" type="checkbox">
						</strf-opt>
						<strf-opt strf-opt-type="trim">
							<label for="strf-opt-id-${prm_id}-trim">Trim</label>
							<input id="strf-opt-id-${prm_id}-trim" name="strf-opt-cboxg-${prm_id}" type="checkbox">
						</strf-opt>
					</strf-opt-group>

					<strf-opt-group strf-group-type="case">
						<strf-opt strf-opt-type="capital">
							<label for="strf-opt-id-${prm_id}-capital">Capital</label>
							<input id="strf-opt-id-${prm_id}-capital" name="strf-opt-radiog-${prm_id}" value="1" type="radio">
						</strf-opt>

						<strf-opt strf-opt-type="all_upper">
							<label for="strf-opt-id-${prm_id}-all_upper">ALL UPPER</label>
							<input id="strf-opt-id-${prm_id}-all_upper" name="strf-opt-radiog-${prm_id}" value="2" type="radio">
						</strf-opt>

						<strf-opt strf-opt-type="all_lower">
							<label for="strf-opt-id-${prm_id}-all_lower">all lower</label>
							<input id="strf-opt-id-${prm_id}-all_lower" name="strf-opt-radiog-${prm_id}" value="3" type="radio">
						</strf-opt>

						<strf-opt strf-opt-type="as_is">
							<label for="strf-opt-id-${prm_id}-as_is">As is</label>
							<input id="strf-opt-id-${prm_id}-as_is" name="strf-opt-radiog-${prm_id}" value="4" type="radio">
						</strf-opt>
					</strf-opt-group>

				</strf-selector>
			</strf-param>
		`)[0]

		this.param_elem.querySelector(`[strf-group-type="case"] [strf-opt-type="${format_default}"] input`).checked = true;

		const param_index = ksys.tplates.index_elem(
			this.param_elem,
			{
				'translit':  '[strf-opt-type="translit"] input',
				'trim':      '[strf-opt-type="trim"] input',
				'capital':   '[strf-opt-type="capital"] input',
				'all_upper': '[strf-opt-type="all_upper"] input',
				'all_lower': '[strf-opt-type="all_lower"] input',
			}
		)

		param_index.index.translit.onchange = strf_gui.save;
		param_index.index.trim.onchange = strf_gui.save;
		param_index.index.capital.onchange = strf_gui.save;
		param_index.index.all_upper.onchange = strf_gui.save;
		param_index.index.all_lower.onchange = strf_gui.save;

		strf_p.replaceWith(this.param_elem)

		// index this parameter
		strf_gui.params[prm_id] = this;

		// update config if it was provided
		if (input_cfg){
			// By default - trim is true
			let do_trim = true;
			// Try overriding trim state with attribute config
			if (trim_cfg_attr != null){
				const trim_state_attr = ({'1': true, 'true': true, '0': false, 'false': false})[trim_cfg_attr];
				do_trim = trim_state_attr != undefined ? trim_state_attr : true;
			}
			// Then try overriding trim state with stuff provided in the config
			// todo: there's a smarter way of detecting whether a key is present
			// in the object or not
			if ('trim' in input_cfg){
				do_trim = input_cfg.trim;
			}

			input_cfg['trim'] = do_trim;

			this.cfg = input_cfg;
		}
	}

	get cfg(){
		return {
			'translit': this.param_elem.querySelector('[strf-opt-type="translit"] input').checked,
			'trim': this.param_elem.querySelector('[strf-opt-type="trim"] input').checked,
			'formatting': this.param_elem.querySelector('strf-opt-group[strf-group-type="case"] input:checked').value,
		}
	}

	set cfg(state){
		if (state.translit){
			this.param_elem.querySelector('[strf-opt-type="translit"] input').checked = state.translit;
		}
		if (state.trim){
			this.param_elem.querySelector('[strf-opt-type="trim"] input').checked = state.trim;
		}
		if (state.formatting){
			this.param_elem.querySelector(`strf-opt-group[strf-group-type="case"] input[value="${state.formatting}"]`).checked = true;
		}
	}

	format(_txt, fuck=null){
		const fuck_js = this || fuck;

		// todo: move trimming to the format function itself
		const txt = fuck_js.param_elem.querySelector('[strf-opt-type="trim"] input').checked ? str(_txt).trim() : _txt;

		return ksys.util.str_ops.format(
			txt,
			fuck_js.param_elem.querySelector('strf-opt-group[strf-group-type="case"] input:checked').value,
			fuck_js.param_elem.querySelector('[strf-opt-type="translit"] input').checked,
		)
	}
}



strf_gui.resync = function(){
	print('Resyncing string formatting')
	const strf_cfg = JSON.parse(ksys.db.module.read('_strf_cfg.kbcfg'));

	strf_gui.params = {};
	for (const strf_p of document.querySelectorAll('string-formatting:not([synced]) f-param')){
		// todo: this entire solution is not that perfect
		// go back to applying config with IF statements ?
		const strf_param = new _format_option(strf_p, strf_cfg ? strf_cfg[strf_p.getAttribute('fpid')] : null)
	}

	$('string-formatting').attr('synced', true);
}


strf_gui.save = function(){
	// const format_cfg = ksys.db.module.read('_strf_cfg.kbcfg');
	console.time('Saved String Formatting In');
	const dump = {};
	for (const param_name in strf_gui.params){
		dump[param_name] = strf_gui.params[param_name].cfg;
	}
	console.timeEnd('Saved String Formatting In')

	ksys.db.module.write('_strf_cfg.kbcfg', JSON.stringify(dump));
}









module.exports = strf_gui;




