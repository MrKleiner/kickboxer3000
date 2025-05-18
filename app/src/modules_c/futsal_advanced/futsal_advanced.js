
if(!window.kbmodules){window.kbmodules={}};
if(!window.kbmodules.futsal_advanced){window.kbmodules.futsal_advanced={}};






window.kbmodules.futsal_advanced.load = function(){
	window.kbmodules.futsal_advanced.titles = {
		'global_table': new vmix.title({
			'title_name': 'Table.gtzip',
			'default_overlay': 2,
			'timings': {
				'fps': 10,
				'frames_in': 2,
				'margin': 2,
			},
		}),
		'stats': new vmix.title({
			'title_name': 'FullStat.gtzip',
			'default_overlay': 2,
			'timings': {
				'fps': 10,
				'frames_in': 2,
				'margin': 2,
			},
		}),
		'ind_stat': new vmix.title({
			'title_name': 'StatIn.gtzip',
			'default_overlay': 2,
			'timings': {
				'fps': 10,
				'frames_in': 2,
				'margin': 2,
			},
		}),
	}

	// Load global table control
	const global_table_cfg = ksys.db.module.read('global_table_cfg.kbsave', 'json');
	if (global_table_cfg){
		document.querySelector('#global_table_url').value = global_table_cfg.url || '';
		// document.querySelector('#global_table_data_map').value = global_table_cfg.map_data || '';
	};

	// Load global table control
	const stats_cfg = ksys.db.module.read('stats_cfg.kbsave', 'json');
	if (stats_cfg){
		document.querySelector('#stats_url').value = stats_cfg.url || '';
		document.querySelector('#stats_data_map').value = stats_cfg.map_data || '';
	};

}


window.kbmodules.futsal_advanced.create_retarded_table = function(table_data=null){
	const data_src = new window.kbmodules.futsal_advanced.DataSRC(table_data['data_src']);
	const table_cfg = new window.kbmodules.futsal_advanced.RetardedTableCFG(table_data['cfg']);
	const retarded_table = new window.kbmodules.futsal_advanced.RetardedTable(
		data_src,
		table_cfg,
	);
}


window.kbmodules.futsal_advanced.save_global_table_cfg = function(){
	ksys.db.module.write(
		'global_table_cfg.kbsave',
		JSON.stringify(
			{
				'url': document.querySelector('#global_table_url').value,
				// 'map_data': document.querySelector('#global_table_data_map').value,
			},
			null,
			'\t'
		)
	)
}


window.kbmodules.futsal_advanced.global_table_vis = function(state){
	if (state == true){
		window.kbmodules.futsal_advanced.titles.global_table.overlay_in();
	}
	if (state == false){
		window.kbmodules.futsal_advanced.titles.global_table.overlay_out();
	}
}


window.kbmodules.futsal_advanced.__update_global_table = async function(){
	const data_url = document.querySelector('#global_table_url').value;
	const map_data = document.querySelector('#global_table_data_map').value.split('\n');
	const tmap = [];

	for (let line of map_data){
		line = line.trim();
		if (!line || line.startsWith('#')){continue};
		const line_data = line.split('=');
		tmap.push([
			line_data[0].trim(),
			line_data[1].trim(),
		])
	}


	const response = await ksys.util.url_get(data_url);
	if (response.status != 'ok'){
		ksys.info_msg.send_msg(
			`Update failed: URL request failed. Response code: ${response.code} | Reason: ${response.reason}. Aborting`,
			'err',
			9000
		);
		return false
	}

	const data = JSON.parse(response.payload);


	const col_data = {};

	for (const [col_id, json_key] of tmap){
		if (!col_data[col_id]){
			col_data[col_id] = '';
		}

		for (const json_data of data){
			col_data[col_id] += json_data[json_key] + '\n';
		}
	}

	console.log('fuckshit', col_data);

	for (const col_id in col_data){
		await window.kbmodules.futsal_advanced.titles.global_table.set_text(
			col_id,
			col_data[col_id]
		)
	}

	let idx = 1;
	for (const team_data of data){
		await window.kbmodules.futsal_advanced.titles.global_table.set_img_src(
			`Logo${idx}`,
			team_data['TeamLogo']
		)

		idx += 1
	}

	ksys.info_msg.send_msg(
		`Update OK`,
		'ok',
		2000
	);
}


window.kbmodules.futsal_advanced.save_stats_data = function(){
	ksys.db.module.write(
		'stats_cfg.kbsave',
		JSON.stringify(
			{
				'url': document.querySelector('#stats_url').value,
				'map_data': document.querySelector('#stats_data_map').value,
			},
			null,
			'\t'
		)
	)

	/*
	const ind_stats_list = document.querySelector('#individual_stats');
	ind_stats_list.innerHTML = '';
	for (let stat_name of document.querySelector('#stats_data_map').value.split('\n')){
		stat_name = stat_name.trim();
		if (!stat_name || stat_name.startsWith('#')){continue};

		const tplate = ksys.tplates.index_tplate(
			'#individual_stat_tplate',
			{
				'name': '.ind_stat_name',
				'show': '.show_ind_stat',
				'hide': '.hide_ind_stat',
			}
		);

		tplate.index.name.innerText = stat_name;
		tplate.index.show = async function(){
			await window.kbmodules.futsal_advanced.titles.ind_stat.set_text(
				`StatInfo`,
				stat_name
			)
			await window.kbmodules.futsal_advanced.titles.ind_stat.set_text(
				`StatA`,
				stat_name
			)
		}
	}
	*/
}


window.kbmodules.futsal_advanced.update_global_table = async function(){
	const data_url = document.querySelector('#global_table_url').value;
	const response = await ksys.util.url_get(data_url);
	if (response.status != 'ok'){
		ksys.info_msg.send_msg(
			`Update failed: URL request failed. Response code: ${response.code} | Reason: ${response.reason}. Aborting`,
			'err',
			9000
		);
		return false
	}

	const table_data = JSON.parse(response.payload);

	// Team Names
	await window.kbmodules.futsal_advanced.titles.global_table.set_text(
		`Teams`,
		table_data[0]['TeamName']
	)
	await window.kbmodules.futsal_advanced.titles.global_table.set_text(
		`Games`,
		table_data[0]['Games']
	)
	await window.kbmodules.futsal_advanced.titles.global_table.set_text(
		`Points`,
		table_data[0]['Points']
	)
	await window.kbmodules.futsal_advanced.titles.global_table.set_text(
		`Wins`,
		table_data[0]['Wons']
	)
	await window.kbmodules.futsal_advanced.titles.global_table.set_text(
		`PatS`,
		table_data[0]['Drawn']
	)
	await window.kbmodules.futsal_advanced.titles.global_table.set_text(
		`Loses`,
		table_data[0]['Lost']
	)
	await window.kbmodules.futsal_advanced.titles.global_table.set_text(
		`Delta`,
		table_data[0]['DiferenceGoals']
	)

	console.log('Fuck you')

	// Set team logos
	const team_names = table_data[0]['TeamName'].split('\n');

	let idx = 1;
	for (const team_name of team_names){
		for (const team_data of table_data){
			if (team_name.trim() == team_data['TeamName']){
				await window.kbmodules.futsal_advanced.titles.global_table.set_img_src(
					`Logo${idx}`,
					team_data['TeamLogo']
				)
				break
			}
		}

		idx += 1;
	}

	await window.kbmodules.futsal_advanced.titles.global_table.set_img_src(
		`Logo1`,
		table_data[0]['TeamLogo']
	)

	ksys.info_msg.send_msg(
		`Update OK`,
		'ok',
		2000
	);

}

window.kbmodules.futsal_advanced.update_stats = async function(){
	const data_url = document.querySelector('#stats_url').value;
	const response = await ksys.util.url_get(data_url);

	if (response.status != 'ok'){
		ksys.info_msg.send_msg(
			`Update failed: URL request failed. Response code: ${response.code} | Reason: ${response.reason}. Aborting`,
			'err',
			9000
		);
		return false
	}

	const stats_data = JSON.parse(response.payload);

	let idx = 1;
	for (let stat_name of document.querySelector('#stats_data_map').value.split('\n')){
		stat_name = stat_name.trim();
		if (!stat_name || stat_name.startsWith('#')){continue};

		for (const stat_data of stats_data){
			if (stat_data['eventType'] == stat_name){
				await window.kbmodules.futsal_advanced.titles.stats.set_text(
					`Stat_${idx}_A`,
					stat_data['TeamHome'] || '0'
				)
				await window.kbmodules.futsal_advanced.titles.stats.set_text(
					`Stat_${idx}_B`,
					stat_data['TeamGuest'] || '0'
				)
				await window.kbmodules.futsal_advanced.titles.stats.set_text(
					`StatEvent_${idx}`,
					stat_name
				)
				break
			}
		}

		idx += 1;
	}

	ksys.info_msg.send_msg(
		`Update OK`,
		'ok',
		2000
	);
}



window.kbmodules.futsal_advanced.stats_vis = function(state){
	if (state == true){
		window.kbmodules.futsal_advanced.titles.stats.overlay_in();
	}
	if (state == false){
		window.kbmodules.futsal_advanced.titles.stats.overlay_out();
	}
}