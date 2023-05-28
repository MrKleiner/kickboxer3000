
const strf_gui = {
	'params': {},
};



const _format_option = class{
	constructor(strf_p, input_cfg=null){
		const prm_id = strf_p.getAttribute('fpid')
		const display_name = strf_p.getAttribute('display_name')
		const translit_default = 
			({'1': true, 'true': true, '0': false, 'false': false})[strf_p.getAttribute('translit_default')]
			||
			false;
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
				'capital':   '[strf-opt-type="capital"] input',
				'all_upper': '[strf-opt-type="all_upper"] input',
				'all_lower': '[strf-opt-type="all_lower"] input',
			}
		)

		param_index.index.translit.onchange = strf_gui.save;
		param_index.index.capital.onchange = strf_gui.save;
		param_index.index.all_upper.onchange = strf_gui.save;
		param_index.index.all_lower.onchange = strf_gui.save;

		strf_p.replaceWith(this.param_elem)

		// index this parameter
		strf_gui.params[prm_id] = this;

		// update config if it was provided
		if (input_cfg){
			this.cfg = input_cfg;
		}
	}

	get cfg(){
		return {
			'translit': this.param_elem.querySelector('[strf-opt-type="translit"] input').checked,
			'formatting': this.param_elem.querySelector('strf-opt-group[strf-group-type="case"] input:checked').value,
		}
	}

	set cfg(state){
		if (state.translit){
			this.param_elem.querySelector('[strf-opt-type="translit"] input').checked = state.translit;
		}
		if (state.formatting){
			this.param_elem.querySelector(`strf-opt-group[strf-group-type="case"] input[value="${state.formatting}"]`).checked = true;
		}
	}

	format(txt, fuck=null){
		return ksys.util.str_ops.format(
			txt,
			(this || fuck).param_elem.querySelector('strf-opt-group[strf-group-type="case"] input:checked').value,
			(this || fuck).param_elem.querySelector('[strf-opt-type="translit"] input').checked,
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
	console.time('Saved String Formatting In')
	const dump = {};
	for (const param_name in strf_gui.params){
		dump[param_name] = strf_gui.params[param_name].cfg;
	}
	console.timeEnd('Saved String Formatting In')

	ksys.db.module.write('_strf_cfg.kbcfg', JSON.stringify(dump));
}









module.exports = strf_gui;




