// Team params:
// logo image
// Name
// Coach

// Player params:
// Name
// Surname
// Number

window.modules.football_standard = {}



// field context is needed to ensure that a player item can only be dropped into the corresponding field
$this.player_item_drag_field_context = null
$this.next_card_out = null;

$this.titles = {
	// 'team_layout': new vmix_title('command_layout.gtzip'),

	// field layout
	'team_layout': new vmix_title({
		'title_name': 'command_layout.gtzip',
		'timings': {
			'fps': 30,
			'frames_in': 91,
			'margin': 100,
		},
	}),


	// cards
	'yellow_card': new vmix_title({
		'title_name': 'yellow_card.gtzip',
		'timings': {
			'fps': 30,
			'frames_in': 72,
			'margin': 100,
		}
	}),
	'red_card': new vmix_title({
		'title_name': 'red_card.gtzip',
		'timings': {
			'fps': 30,
			'frames_in': 72,
			'margin': 100,
		}
	}),

	// replacements
	'replacement_out': new vmix_title({
		'title_name': 'replacement_leaving.gtzip',
		'timings': {
			'fps': 30,
			'frames_in': 72,
			'frames_out': 65,
			'margin': 100,
		}
	}),
	'replacement_in': new vmix_title({
		'title_name': 'replacement_incoming.gtzip',
		'timings': {
			'fps': 30,
			'frames_in': 72,
			'frames_out': 65,
			'margin': 100,
		}
	}),

	// VS
	'splash': new vmix_title({
		'title_name': 'splash.gtzip',
		'timings': {
			'fps': 30,
			'frames_in': 55,
			'margin': 100,
		}
	}),

	// Goal / score
	'gscore': new vmix_title({
		'title_name': 'scored.gtzip',
		'timings': {
			'fps': 30,
			'frames_in': 71,
			'frames_out': 69,
			'margin': 100,
		}
	}),

	// Coach l4d2
	'coach': new vmix_title({
		'title_name': 'coach.gtzip',
		'timings': {
			'fps': 30,
			'frames_in': 60,
			'margin': 100,
		}
	}),
}



$this.load = async function(){
	$this.postload()
	$('#teams_layouts .team_layout .ftfield div, #teams_layouts .team_layout .ftfield .goalkeeper').addClass('player_slot');
	// important todo: such startup info has to be evaluated by the core
	// const vmix_state = (new DOMParser()).parseFromString((await window.talker.vmix_talk({'Function': ''})), 'application/xml');
	const vmix_state = await window.talker.project()

	const fresh_context = context.module.read();

	// important todo: Fuck VMIX
	{
		const yellow_card_sel = vmix_state.querySelector(`vmix inputs input[title="${$this.titles.yellow_card.title_name}"]`)
		const red_card_sel = vmix_state.querySelector(`vmix inputs input[title="${$this.titles.red_card.title_name}"]`)

		if (yellow_card_sel && red_card_sel){
			const yellow_card_num = str(yellow_card_sel.getAttribute('number'))
			const red_card_num = str(red_card_sel.getAttribute('number'))

			const card_corelation = {};
			// also, fuck js
			// todo: use map() ?
			card_corelation[yellow_card_num] = $this.titles.yellow_card;
			card_corelation[red_card_num] = $this.titles.red_card;

			print(yellow_card_num, red_card_num)
			print(vmix_state)

			// important todo: I sincerely hate VMIX
			// If both cards are overlayed, but on different overlays - ded
			for (let overlay of vmix_state.querySelectorAll('vmix overlays overlay')){
				const occupied_by = overlay.textContent;
				print('InnerText:', occupied_by)
				if (!occupied_by){continue}
				print(occupied_by, 'in', card_corelation)
				if (occupied_by.trim() in card_corelation){
					$this.next_card_out = card_corelation[occupied_by.trim()]
					print('Found overlay occupied by a card:', occupied_by, $this.next_card_out.title_name)
					break
				}
			}
		}
	}

	// presets
	{
		const index_file = JSON.parse(window.db.module.read('teams_index.index'))
		const preset_targets = $('.team_base_params_ctrl .team_preset_selector')
		if (index_file){
			for (let team of index_file){
				preset_targets.append(`
					<option value="${team}">${team}</option>
				`)
			}
		}
	}

	// context stuff
	{
		if (fresh_context.vs_title_bottom_upper_line){
			$('#vs_text_bottom_upper')[0].value = fresh_context.vs_title_bottom_upper_line
		}
		if (fresh_context.vs_title_bottom_lower_line){
			$('#vs_text_bottom_lower')[0].value = fresh_context.vs_title_bottom_lower_line
		}
	}

	// last ream preset
	{
		const team1_sel = document.querySelector('#team1_def select.team_preset_selector')
		const team2_sel = document.querySelector('#team2_def select.team_preset_selector')
		if (fresh_context.last_team_def1){
			team1_sel.value = fresh_context.last_team_def1
			team1_sel.dispatchEvent(new Event('change'));
		}
		if (fresh_context.last_team_def2){
			team2_sel.value = fresh_context.last_team_def2
			team2_sel.dispatchEvent(new Event('change'));
		}
		
	}

	$this.load_last_layout()

}
// $this.load()


$this.postload = function(){
	// picking the player item up
	document.addEventListener('mousedown', tr_event => {

		// the item can be picked both from the filter menu and field
		const tgt = event.target.closest('.team_layout .player_item_cmd_layout')
		// also make sure it doesn't trigger on anything but LMB
		if (tgt && tr_event.which == 1){
			// set the current football field context
			$this.player_item_drag_field_context = event.target.closest('.team_layout')
			tgt.classList.add('dragging')
			tgt.style.left = tr_event.x + 'px'
			tgt.style.top = tr_event.y + 'px'
		}

	});


	// dropping/swapping player items

	// important todo: just fucking add some sort of "is dragging" attribute to the field
	// AND FOR FUCKS SAKE USE JQUERY. AT THIS POINT IT MIGHT AS WELL BE FASTER THAN ALL THIS VANILLA BDSM
	document.addEventListener('mouseup', tr_event => {

		// the player item which is being dragged
		const pldrag_item = document.querySelector('.player_item_cmd_layout.dragging');
		// the table cell to drop the player to
		// important: it has to be a cell related to the current field
		const player_layout_drop_tgt = tr_event.target.closest('.ftfield .player_slot');

		// if there's a cell underneath the cursor - drop the player item there
		// AND if this cell is related to the current field
		if (player_layout_drop_tgt && pldrag_item && $this.player_item_drag_field_context.contains(player_layout_drop_tgt)){
			// if the drop target is a cell already containing a player - swap the players
			if (player_layout_drop_tgt.querySelector('.player_item_cmd_layout')){
				const player_from_target = player_layout_drop_tgt.querySelector('.player_item_cmd_layout');
				const dragged_player = pldrag_item;

				// todo: WHAT THE FUCK ?!!!!!!
				const tmp1 = $('<div></div>')[0];
				const tmp2 = $('<div></div>')[0];

				player_from_target.replaceWith(tmp1);
				dragged_player.replaceWith(tmp2);

				tmp1.replaceWith(dragged_player)
				tmp2.replaceWith(player_from_target)
			}else{
				player_layout_drop_tgt.append(pldrag_item)
			}
		}

		// remove hover effect from the cell
		const remove_cell_hover_effect = document.querySelector('.ftfield .field_cell_hover')
		if (remove_cell_hover_effect){
			remove_cell_hover_effect.classList.remove('field_cell_hover')
		}

		// if there's an element being currently dragged on the page - remove dragging state from it
		// (this is something that happens no matter where the player item was droped off)
		if (pldrag_item){
			pldrag_item.classList.remove('dragging');
			pldrag_item.removeAttribute('style');
		}

		// clear football field context
		$this.player_item_drag_field_context = null;

	});

	// sticking the dragged player item to cursor
	document.addEventListener('mousemove', tr_event => {
		// if there's a player element which is marked as dragging - apply XY position to it
		const player_field_layout_player = document.querySelector('.player_item_cmd_layout.dragging')
		if (player_field_layout_player){
			player_field_layout_player.style.left = tr_event.x + 'px'
			player_field_layout_player.style.top = tr_event.y + 'px'
		}
	});

	// fancy hover effect
	document.addEventListener('mouseover', tr_event => {

		// whether or not a dragged element exists
		const is_dragging = document.querySelector('.player_item_cmd_layout.dragging')
		// the target cell the cursor is hovering over
		// important: it has to be a cell related to the current field
		const target_cell = tr_event.target.closest('.ftfield .player_slot')
		// remove hover effect from all the other cells
		for (let deselect of document.querySelectorAll('.field_cell_hover')){
			deselect.classList.remove('field_cell_hover')
		}
		// add hover effect to the cell, if any
		if (is_dragging && target_cell && $this.player_item_drag_field_context.contains(target_cell)){
			target_cell.classList.add('field_cell_hover')
		}

	});

	document.addEventListener('contextmenu', tr_event => {

		const field_player = tr_event.target.closest('.player_item_cmd_layout')
		if (field_player && tr_event.altKey){
			field_player.remove()
		}

		// delete player from the player definition list
		const del_player_def = tr_event.target.closest('.teamdef .player_list .player_item')
		if (del_player_def && tr_event.altKey){
			del_player_def.remove()
		}
	});


	document.addEventListener('keydown', tr_event => {
		if (tr_event.ctrlKey && tr_event.which == 83){
			$this.save_last_layout()
		}
		if (tr_event.altKey && tr_event.which == 19){
			$this.quit_all_titles()
		}
	});
}





$this.quit_all_titles = async function(){
	document.body.classList.add('emergency_break')
	for (let quit_title in $this.titles){
		await $this.titles[quit_title].overlay_out(1)
	}
	document.body.classList.remove('emergency_break')
}




$this.show_chosen_club_logo = function(team){
	const _team_selector = {
		1: {
			field: '#team1_layout',
			def: '#team1_def',
			vfeed_name: '[vis_feedback="team1_name"]',
			vfeed_logo: '[vis_feedback="team1_logo"]',
		},
		2: {
			field: '#team2_layout',
			def: '#team2_def',
			vfeed_name: '[vis_feedback="team2_name"]',
			vfeed_logo: '[vis_feedback="team2_logo"]',
		},
	}
	const team_field = _team_selector[team].field;
	const team_def = _team_selector[team].def;
	const visfeed = _team_selector[team].vfeed_logo;
	const logo_path = $(`${team_def} .team_param_input`)[0].files[0].path
	$(team_def).attr('logo_path', logo_path)
	// $(`${team_def} .team_logo_vis, ${team_field} .layout_club_logo`).attr('src', logo_path)
	$(visfeed).attr('src', logo_path)
}

$this.club_name_dynamic_type = function(event, team){
	const _team_selector = {
		1: {
			field: '#team1_layout',
			def: '#team1_def',
			vfeed_name: '[vis_feedback="team1_name"]',
		},
		2: {
			field: '#team2_layout',
			def: '#team2_def',
			vfeed_name: '[vis_feedback="team2_name"]',
		},
	}
	const team_field = _team_selector[team].field;
	const team_def = _team_selector[team].def;
	const visfeed = _team_selector[team].vfeed_name;

	// important todo: pre-select all the stuff and store in the modules context
	// document.querySelector(`${team_field} .team_layout_header .layout_club_name`).innerText = event.target.value;
	$(visfeed).text(event.target.value.trim())
}

$this.spawn_player = function(event){
	const pool = $(event.target.closest('.player_list')).find('.list_pool')
	
	pool.append(`
		<div class="player_item">
			<div class="player_param" prmname="pname">
				<div class="player_param_label">Name</div>
				<input type="text" class="player_param_input">
			</div>
			<div class="player_param" prmname="psurname">
				<div class="player_param_label">Surname</div>
				<input type="text" class="player_param_input">
			</div>
			<div class="player_param" prmname="number">
				<div class="player_param_label">Number</div>
				<input type="text" class="player_param_input">
			</div>
		</div>
	`);
}

$this.save_team_preset = function(team){
	const _team_selector = {
		1: {
			field: '#team1_layout',
			def: '#team1_def',
		},
		2: {
			field: '#team2_layout',
			def: '#team2_def',
		},
	}
	const team_def = _team_selector[team].def;
	const team_field = _team_selector[team].field;
	
	// check whether the team name is null or not
	// this is needed not to save nameless malformed files
	const club_name = $(`${team_def} .team_base_params [prmname="team_name"] input`).val().trim().lower()
	// fuck me
	// const has_logo = $(`${team_def} .team_base_params [prmname="team_logo"] input`)[0].files[0]
	const has_logo = $(team_def).attr('logo_path')


	if (!club_name){
		// alert('Malformed Club Name OPEN YOUR EYES PLEASE ?!!')
		return
	}

	const club_info = {
		'club_name': club_name,
		'coach': $(`${team_def} .team_base_params [prmname="team_coach"] input`).val(),
		'logo': has_logo || null,
		'main_players': [],
		'reserve_players': [],
	}

	// main players
	for (let player of document.querySelectorAll(`${team_def} .player_lists .player_list.starters .player_item`)){
		club_info.main_players.push({
			'name': player.querySelector('[prmname="pname"] .player_param_input').value,
			'surname': player.querySelector('[prmname="psurname"] .player_param_input').value,
			'number': player.querySelector('[prmname="number"] .player_param_input').value,
		})
	}

	// reserve
	for (let player of document.querySelectorAll(`${team_def} .player_lists .player_list.reserve .player_item`)){
		club_info.reserve_players.push({
			'name': player.querySelector('[prmname="pname"] .player_param_input').value,
			'surname': player.querySelector('[prmname="psurname"] .player_param_input').value,
			'number': player.querySelector('[prmname="number"] .player_param_input').value,
		})
	}

	print(club_info)

	// save the team to file
	window.db.module.write(`${club_name}.tdef`, JSON.stringify(club_info, null, 4))

	// update index
	const index_file = window.db.module.read('teams_index.index')
	// important todo: Fuck
	const team_presets_index = JSON.parse(index_file) || [];

	if (!index_file){
		window.db.module.write('teams_index.index', JSON.stringify([], null, 4))
	}

	if (!team_presets_index.includes(club_name)){
		team_presets_index.push(club_name)
		window.db.module.write('teams_index.index', JSON.stringify(team_presets_index, null, 4))
	}

	$this.save_last_team_presets()
}

$this.load_team_preset = function(event){
	print(event)
	const team_preset = JSON.parse(window.db.module.read(`${event.target.value}.tdef`))
	if (!team_preset){return}

	const tgt_team = $(event.target.closest('.teamdef'))

	const _team_selector = {
		'team1_def': {
			field: '#team1_layout',
			def: '#team1_def',
			vfeed_name: '[vis_feedback="team1_name"]',
			vfeed_logo: '[vis_feedback="team1_logo"]',
		},
		'team2_def': {
			field: '#team2_layout',
			def: '#team2_def',
			vfeed_name: '[vis_feedback="team2_name"]',
			vfeed_logo: '[vis_feedback="team2_logo"]',
		},
	}
	// const team_field = _team_selector[team].field;
	// const team_def = _team_selector[team].def;
	const visfeed = _team_selector[tgt_team[0].id].vfeed_logo;
	const tname_feed = _team_selector[tgt_team[0].id].vfeed_name;

	tgt_team.find('.team_base_params [prmname="team_name"] input')[0].value = team_preset.club_name
	tgt_team.find('.team_base_params [prmname="team_coach"] input')[0].value = team_preset.coach

	tgt_team.find('.player_list .list_pool').empty()

	tgt_team.attr('logo_path', team_preset.logo)
	// $(`${team_def} .team_logo_vis, ${team_field} .layout_club_logo`).attr('src', logo_path)
	$(visfeed).attr('src', team_preset.logo)
	$(tname_feed).text(team_preset.club_name)

	for (let player of team_preset.main_players){
		tgt_team.find('.player_list.starters .list_pool').append(`
			<div class="player_item">
				<div class="player_param" prmname="pname">
					<div class="player_param_label">Name</div>
					<input value="${player.name}" type="text" class="player_param_input">
				</div>
				<div class="player_param" prmname="psurname">
					<div class="player_param_label">Surname</div>
					<input value="${player.surname}" type="text" class="player_param_input">
				</div>
				<div class="player_param" prmname="number">
					<div class="player_param_label">Number</div>
					<input value="${player.number}" type="text" class="player_param_input">
				</div>
			</div>
		`)
	}

	for (let player of team_preset.reserve_players){
		tgt_team.find('.player_list.reserve .list_pool').append(`
			<div class="player_item">
				<div class="player_param" prmname="pname">
					<div class="player_param_label">Name</div>
					<input value="${player.name}" type="text" class="player_param_input">
				</div>
				<div class="player_param" prmname="psurname">
					<div class="player_param_label">Surname</div>
					<input value="${player.surname}" type="text" class="player_param_input">
				</div>
				<div class="player_param" prmname="number">
					<div class="player_param_label">Number</div>
					<input value="${player.number}" type="text" class="player_param_input">
				</div>
			</div>
		`)
	}

	$this.save_last_team_presets()

}

$this.save_last_team_presets = function(){
	context.module.prm('last_team_def1', $('#team1_def [prmname="team_name"] input')[0].value)
	context.module.prm('last_team_def2', $('#team2_def [prmname="team_name"] input')[0].value, true)
}


// По какому принципу должна происходить фильтрация?
$this.filter_players = function(event, team){
	// current team's field/players
	const field_context = event.target.closest('.team_layout');
	const pool = $(field_context).find('.player_picker .player_picker_pool');
	// the query from the text input
	const tquery = event.target.value.toLowerCase();

	// clear the filtered pool
	pool.empty()

	// collect players present on the field
	const occupied_players = [];
	for (let field_player of field_context.querySelectorAll('.ftfield .player_item_cmd_layout')){
		// simply name + surname with a space and lowercase (important standard)
		occupied_players.push(field_player.getAttribute('namecode'))
	}
	// print('FUUUUUUUU')

	for (let player of document.querySelectorAll(`${team} .list_pool .player_item`)){
		const surname = player.querySelector('[prmname="psurname"] input').value
		const name =    player.querySelector('[prmname="pname"] input').value
		const number =  player.querySelector('[prmname="number"] input').value

		// simply name + surname with a space and lowercase (important standard)
		const fullname_code = (name + ' ' + surname).toLowerCase()

		// print(fullname_code)

		//                   match player name or number                        make sure the player is not on the field
		if (  (fullname_code.includes(tquery) || number.includes(tquery))  &&  !occupied_players.includes(fullname_code)  ){
			pool.append(`
				<div
					class="player_item_cmd_layout"
					namecode="${fullname_code}"
					player_num="${number}"
					pname="${name}"
					surname="${surname}"
				>
					<div class="player_number">${number}</div>
					<div class="player_surname">${surname.toLowerCase().capitalize()}</div>
				</div>
			`)
		}
	}
}

$this.filter_players_to_punish = function(event){

	// important todo: PLEASE NO
	const team_relation = {
		'team1_layout': '#team1_def',
		'team2_layout': '#team2_def',
	}

	// the query from the text input
	const tquery = event.target.value.toLowerCase();

	// collect players from both fields

	// todo: get the fuck rid of Jquery
	const punish_pool = $('#card_player_filter_pool');
	punish_pool.empty()

	for (let player of document.querySelectorAll('#team1_layout .ftfield .player_item_cmd_layout, #team2_layout .ftfield .player_item_cmd_layout')){
		const surname = player.getAttribute('surname')
		const name =    player.getAttribute('pname')
		const number =  player.getAttribute('player_num')
		// important todo: THIS IS RETARDED !!!
		// JUST INDEX EVERYTHING IN A DICT WITH UIDS FROM WINDOW.CRYPTO ASSIGNED TO EVERY PLAYER N SHIT
		print('Selecting', `#team_defs ${team_relation[player.closest('.team_layout').id]}`)
		const club_logo = document.querySelector(`#team_defs ${team_relation[player.closest('.team_layout').id]}`).getAttribute('logo_path')

		const fullname_code = player.getAttribute('namecode')

		// match player name or number
		if ( (fullname_code.includes(tquery) || number.includes(tquery)) ){
			punish_pool.append(`
				<div
					class="player_item_cmd_layout"
					namecode="${fullname_code}"
					player_num="${number}"
					pname="${name}"
					surname="${surname}"
					team_logo="${club_logo}"
					onclick="$this.select_player_for_punishment(event)"
				>
					<div class="player_number">${number}</div>
					<div class="player_surname">${surname.lower().capitalize()}</div>
				</div>
			`)
		}
	}

}


$this.save_last_layout = function(){
	const layout = {
		'team1': {},
		'team2': {},
	};

	for (let player of document.querySelectorAll('#team1_layout .ftfield .player_slot')){
		const player_info = player.querySelector('.player_item_cmd_layout')
		if (!player_info){
			layout.team1[player.getAttribute('t_num')] = null
			continue
		}
		layout.team1[player.getAttribute('t_num')] = {
			'player_num': player_info.getAttribute('player_num'),
			'name': player_info.getAttribute('pname'),
			'surname': player_info.getAttribute('surname'),
		}
	}
	for (let player of document.querySelectorAll('#team2_layout .ftfield .player_slot')){
		const player_info = player.querySelector('.player_item_cmd_layout')
		if (!player_info){
			layout.team2[player.getAttribute('t_num')] = null
			continue
		}
		layout.team2[player.getAttribute('t_num')] = {
			'player_num': player_info.getAttribute('player_num'),
			'name': player_info.getAttribute('pname'),
			'surname': player_info.getAttribute('surname'),
		}
	}

	window.db.module.write('last_layout.lol', JSON.stringify(layout, null, 4))

	print('saved last layout')
}

$this.load_last_layout = function(){
	const last_layout = JSON.parse(window.db.module.read('last_layout.lol'))
	print(last_layout)
	if (!last_layout){return}

	for (let slotnum in last_layout.team1){
		const player_info = last_layout.team1[slotnum]
		const slot = document.querySelector(`#team1_layout .ftfield [t_num="${slotnum}"]`)
		// todo: empty the cell ?
		if (!player_info){continue}
		$(slot).append(`
			<div
				class="player_item_cmd_layout"
				namecode="${player_info.name.lower() + ' ' + player_info.surname.lower()}"
				player_num="${player_info.player_num}"
				pname="${player_info.name}"
				surname="${player_info.surname}"
			>
				<div class="player_number">${player_info.player_num}</div>
				<div class="player_surname">${player_info.surname.lower().capitalize()}</div>
			</div>
		`)
	}
	for (let slotnum in last_layout.team2){
		const player_info = last_layout.team2[slotnum]
		const slot = document.querySelector(`#team2_layout .ftfield [t_num="${slotnum}"]`)
		// todo: empty the cell ?
		if (!player_info){continue}
		$(slot).append(`
			<div
				class="player_item_cmd_layout"
				namecode="${player_info.name.lower() + ' ' + player_info.surname.lower()}"
				player_num="${player_info.player_num}"
				pname="${player_info.name}"
				surname="${player_info.surname}"
			>
				<div class="player_number">${player_info.player_num}</div>
				<div class="player_surname">${player_info.surname.lower()}</div>
			</div>
		`)
	}
}


// Что должно выводиться в список?
// Какие игроки из каких списков ?
$this.filter_players_replacement = function(event){
	const team_relation = {
		'replacement_team1': '#team1_def',
		'replacement_team2': '#team2_def',
	}

	const team = team_relation[event.target.closest('.replacement_team').id]

	// the query from the text input
	const tquery = event.target.value.toLowerCase();

	// important todo: get rid of jquery
	const replacement_pool = $(event.target.closest('.replacement_list').querySelector('.replacement_filtered_list'));
	replacement_pool.empty();

	for (let player of document.querySelectorAll(`${team} .list_pool .player_item`)){
		const name = player.querySelector('[prmname="pname"] input').value
		const surname = player.querySelector('[prmname="psurname"] input').value
		const number = player.querySelector('[prmname="number"] input').value

		if (event.target.closest('.replacement_incoming')){
			if (event.target.closest('.replacement_team_body').querySelector(`.replacement_leaving [namecode="${name.lower() + ' ' + surname.lower()}"].selected_replacement`)){
				continue
			}
		}

		// print('SWAP', `#team_defs ${team}`)
		const club_logo = document.querySelector(`#team_defs ${team}`).getAttribute('logo_path')

		const name_code = (name + ' ' + surname).toLowerCase()

		if (name_code.includes(tquery) || number.includes(tquery)){
			replacement_pool.append(`
				<div
					class="player_item_cmd_layout"
					namecode="${name_code}"
					player_num="${number}"
					pname="${name}"
					surname="${surname}"
					onclick="$this.mark_replacement_player(event)"
					team_logo="${club_logo}"
				>
					<div class="player_number">${number}</div>
					<div class="player_surname">${surname.toLowerCase()}</div>
				</div>
			`)
		}
	}
}

$this.mark_replacement_player = function(event){
	var list_pair = '.replacement_incoming';
	if (event.target.closest('.replacement_list').classList.contains('replacement_leaving')){
		var list_pair = '.replacement_leaving';
	}
	$(`#replacement .replacement_team .replacement_list${list_pair} .replacement_filtered_list .player_item_cmd_layout`).removeClass('selected_replacement')
	event.target.closest('.player_item_cmd_layout').classList.add('selected_replacement');
}

$this.replacement_player_title = async function(event){
	const tgtbtn = event.target.closest('vmixbtn')

	const leaving_player = $('#replacement .replacement_list.replacement_leaving .selected_replacement')
	const incoming_player = $('#replacement .replacement_list.replacement_incoming .selected_replacement')

	if (!leaving_player[0] || !incoming_player[0]){
		return
	}

	await $this.titles.replacement_out.set_text('player_name', leaving_player.attr('surname'))
	await $this.titles.replacement_out.set_img_src('club_logo', leaving_player.attr('team_logo'))
	await $this.titles.replacement_in.set_text('player_name', incoming_player.attr('surname'))
	await $this.titles.replacement_in.set_img_src('club_logo', incoming_player.attr('team_logo'))


	if (tgtbtn.getAttribute('btname') == 'subst_show_leaving'){
		window.btns.pool.subst_show_leaving.vmixbtn(false)
		window.btns.pool.subst_show_incoming.vmixbtn(false)

		await $this.titles.replacement_out.overlay_in(1)

		window.btns.pool.subst_show_leaving.vmixbtn(true)
		window.btns.pool.subst_show_incoming.vmixbtn(true)
	}

	if (tgtbtn.getAttribute('btname') == 'subst_hide_leaving'){
		window.btns.pool.subst_hide_leaving.vmixbtn(false)
		window.btns.pool.subst_hide_incoming.vmixbtn(false)

		await $this.titles.replacement_out.overlay_out(1)

		window.btns.pool.subst_hide_leaving.vmixbtn(true)
		window.btns.pool.subst_hide_incoming.vmixbtn(true)
	}

	if (tgtbtn.getAttribute('btname') == 'subst_show_incoming'){
		window.btns.pool.subst_show_leaving.vmixbtn(false)
		window.btns.pool.subst_show_incoming.vmixbtn(false)

		await $this.titles.replacement_in.overlay_in(1)

		window.btns.pool.subst_show_leaving.vmixbtn(true)
		window.btns.pool.subst_show_incoming.vmixbtn(true)
	}

	if (tgtbtn.getAttribute('btname') == 'subst_hide_incoming'){
		window.btns.pool.subst_hide_leaving.vmixbtn(false)
		window.btns.pool.subst_hide_incoming.vmixbtn(false)

		await $this.titles.replacement_in.overlay_out(1)

		window.btns.pool.subst_hide_leaving.vmixbtn(true)
		window.btns.pool.subst_hide_incoming.vmixbtn(true)
	}
}


$this.select_player_for_punishment = function(event){
	$('#card_player_filter_pool .player_item_cmd_layout').removeClass('selected_to_punish')
	event.target.closest('.player_item_cmd_layout').classList.add('selected_to_punish')
}

$this.show_card = async function(_card){
	const card_selection = {
		'yellow': 'yellow_card',
		'red':    'red_card',
	}
	const card = $this.titles[card_selection[_card]];
	const selected_player = document.querySelector('#card_player_filter .player_item_cmd_layout.selected_to_punish')
	if (selected_player){
		$this.next_card_out = card;

		await card.set_text('player_name', selected_player.getAttribute('surname').toUpperCase())
		await card.set_img_src('club_logo', selected_player.getAttribute('team_logo'))
		// disable buttons
		window.btns.pool.red_card.vmixbtn(false)
		window.btns.pool.yellow_card.vmixbtn(false)
		await card.overlay_in(1)

		// re-enable buttons
		window.btns.pool.red_card.vmixbtn(true)
		window.btns.pool.yellow_card.vmixbtn(true)
	}
}

$this.hide_card = async function(){
	// disable buttons
	window.btns.pool.red_card.vmixbtn(false)
	window.btns.pool.yellow_card.vmixbtn(false)
	window.btns.pool.kill_card.vmixbtn(false)

	if ($this.next_card_out){
		print('Turning off', $this.next_card_out.title_name)
		await $this.next_card_out.overlay_out(1)
	}

	// re-enable buttons
	window.btns.pool.red_card.vmixbtn(true)
	window.btns.pool.yellow_card.vmixbtn(true)
	window.btns.pool.kill_card.vmixbtn(true)
}

// Вратарь по центру !!!!!!!!!!!!!!!!!!!!!!
// ПОДПИСАТЬ PLAYER IN PLAYER OUT


// В каком формате имена?
// Фамилия + Имя? С большой буквы? Транслит?

// Как отображать тех кто вышел на замену?
// Показывать их в списке или нет? Если да - то в каком? И убирать ли их из списка замен?

// Что насчёт заголовков списков?
// В некоторыъ случая он отображал количество игроков
// И что в них вообще писать? Нужны ли они вообще?

// Что делать с запасными?
// Что делать если запасной игрок вышел на поле ?

// Должен ли таймер отображать доп время и т.д. ?
$this.upd_player_layout = async function(team){

	const title = $this.titles.team_layout;

	const _team_selector = {
		1: {
			field: '#team1_layout',
			def: '#team1_def',
		},
		2: {
			field: '#team2_layout',
			def: '#team2_def',
		},
	}

	const team_field = _team_selector[team].field;
	const team_def = _team_selector[team].def;

	// 
	// player layout
	// 
	for (let player_slot of document.querySelectorAll(`${team_field} .ftfield .player_slot`)){
		const player_item = player_slot.querySelector('.player_item_cmd_layout');
		const slot_has_player = !!player_item;
		const cell_id = player_slot.getAttribute('t_num');

		
		// player number
		await title.toggle_text(`player_num_${cell_id}`, slot_has_player)
		// player name
		await title.toggle_text(`player_name_${cell_id}`, slot_has_player)
		// tshirt image
		await title.toggle_img(`player_bg_${cell_id}`, slot_has_player)

		if (slot_has_player){
			// player number
			await title.set_text(`player_num_${cell_id}`, player_item.getAttribute('player_num'));
			// player name
			await title.set_text(`player_name_${cell_id}`, player_item.getAttribute('surname'));
		}
	}


	// 
	// main player list
	// 

	// todo: use array and then join it
	const player_list = [];
	const player_nums = [];
	for (let player of document.querySelectorAll(`${team_def} .player_list.starters .list_pool .player_item`)){
		player_list.push(player.querySelector('[prmname="psurname"] input').value)
		player_nums.push(player.querySelector('[prmname="number"] input').value)
	}
	// names
	await title.set_text('playerlist', player_list.join('\n'))
	// numbers
	await title.set_text('playerlist_nums', player_nums.join('\n'))


	// 
	// reserve list
	// 
	const reserve_list = [];
	const reserve_nums = [];
	for (let player of document.querySelectorAll(`${team_def} .player_list.reserve .list_pool .player_item`)){
		reserve_list.push(player.querySelector('[prmname="psurname"] input').value)
		reserve_nums.push(player.querySelector('[prmname="number"] input').value)
	}
	// names
	await title.set_text('reserve_list', reserve_list.join('\n'))
	// numbers
	await title.set_text('reserve_list_nm', reserve_nums.join('\n'))

	// 
	// coach
	// 
	await title.set_text('coach_name', $(`${team_def} [prmname="team_coach"] input`).val())

	// 
	// team name
	// 
	await title.set_text('club_name', $(`${team_def} [prmname="team_name"] input`).val())

	// 
	// logo
	// 
	await title.set_img_src('club_logo', $(team_def).attr('logo_path'))
}


$this.show_field_layout = async function(team){
	window.btns.pool.show_field_layout_command1.vmixbtn(false)
	window.btns.pool.hide_field_layout_command1.vmixbtn(false)
	window.btns.pool.show_field_layout_command2.vmixbtn(false)
	window.btns.pool.hide_field_layout_command2.vmixbtn(false)
	await $this.upd_player_layout(team)
	await $this.titles.team_layout.overlay_in(1)
	window.btns.pool.show_field_layout_command1.vmixbtn(true)
	window.btns.pool.hide_field_layout_command1.vmixbtn(true)
	window.btns.pool.show_field_layout_command2.vmixbtn(true)
	window.btns.pool.hide_field_layout_command2.vmixbtn(true)
}


$this.hide_field_layout = async function(team){
	window.btns.pool.show_field_layout_command1.vmixbtn(false)
	window.btns.pool.hide_field_layout_command1.vmixbtn(false)
	window.btns.pool.show_field_layout_command2.vmixbtn(false)
	window.btns.pool.hide_field_layout_command2.vmixbtn(false)
	// await $this.upd_player_layout(team)
	await $this.titles.team_layout.overlay_out(1)
	window.btns.pool.show_field_layout_command1.vmixbtn(true)
	window.btns.pool.hide_field_layout_command1.vmixbtn(true)
	window.btns.pool.show_field_layout_command2.vmixbtn(true)
	window.btns.pool.hide_field_layout_command2.vmixbtn(true)
}


$this.save_vs_sublines = function(){
	context.module.prm('vs_title_bottom_upper_line', $('#vs_text_bottom_upper')[0].value)
	context.module.prm('vs_title_bottom_lower_line', $('#vs_text_bottom_lower')[0].value, true)
}


$this.show_vs_title = async function(){
	window.btns.pool.show_splash.vmixbtn(false)
	await $this.titles.splash.set_text('title_lower_top', $('#vs_text_bottom_upper')[0].value)
	await $this.titles.splash.set_text('title_lower_bot', $('#vs_text_bottom_lower')[0].value)

	await $this.titles.splash.set_img_src('logo_l', $('#team1_def').attr('logo_path'))
	await $this.titles.splash.set_img_src('logo_r', $('#team2_def').attr('logo_path'))

	await $this.titles.splash.set_text('club_name_l', $('#team1_def [prmname="team_name"] input')[0].value)
	await $this.titles.splash.set_text('club_name_r', $('#team2_def [prmname="team_name"] input')[0].value)

	await $this.titles.splash.overlay_in(1)

	window.btns.pool.show_splash.vmixbtn(true)
}


$this.hide_vs_title = async function(){
	window.btns.pool.show_splash.vmixbtn(false)
	window.btns.pool.hide_splash.vmixbtn(false)
	await $this.titles.splash.overlay_out(1)
	window.btns.pool.show_splash.vmixbtn(true)
	window.btns.pool.hide_splash.vmixbtn(true)
}


$this.goal_score_on = async function(){
	const selected_player = document.querySelector('#card_player_filter .player_item_cmd_layout.selected_to_punish')

	if (!selected_player){return}

	await $this.titles.gscore.set_text('player_name', selected_player.getAttribute('surname').toUpperCase())
	await $this.titles.gscore.set_img_src('club_logo', selected_player.getAttribute('team_logo'))
	// disable buttons
	window.btns.pool.scored.vmixbtn(false)

	await $this.titles.gscore.overlay_in(1)

	// re-enable buttons
	window.btns.pool.scored.vmixbtn(true)
}

$this.goal_score_off = async function(){
	window.btns.pool.scored.vmixbtn(false)
	window.btns.pool.scored_off.vmixbtn(false)

	await $this.titles.gscore.overlay_out(1)

	window.btns.pool.scored.vmixbtn(true)
	window.btns.pool.scored_off.vmixbtn(true)
}


$this.show_coach = async function(team){
	const _team_selector = {
		1: {
			field: '#team1_layout',
			def: '#team1_def',
		},
		2: {
			field: '#team2_layout',
			def: '#team2_def',
		},
	}

	const teamdef = _team_selector[team].def

	window.btns.pool.show_coach_team1.vmixbtn(false)
	window.btns.pool.hide_coach_team1.vmixbtn(false)
	window.btns.pool.show_coach_team2.vmixbtn(false)
	window.btns.pool.hide_coach_team2.vmixbtn(false)

	await $this.titles.coach.set_text('name', $(`${teamdef} [prmname="team_coach"] input`)[0].value)
	await $this.titles.coach.overlay_in(1)

	window.btns.pool.show_coach_team1.vmixbtn(true)
	window.btns.pool.hide_coach_team1.vmixbtn(true)
	window.btns.pool.show_coach_team2.vmixbtn(true)
	window.btns.pool.hide_coach_team2.vmixbtn(true)
}


$this.hide_coach = async function(){
	window.btns.pool.show_coach_team1.vmixbtn(false)
	window.btns.pool.hide_coach_team1.vmixbtn(false)
	window.btns.pool.show_coach_team2.vmixbtn(false)
	window.btns.pool.hide_coach_team2.vmixbtn(false)
	await $this.titles.coach.overlay_out(1)
	window.btns.pool.show_coach_team1.vmixbtn(true)
	window.btns.pool.hide_coach_team1.vmixbtn(true)
	window.btns.pool.show_coach_team2.vmixbtn(true)
	window.btns.pool.hide_coach_team2.vmixbtn(true)
}


