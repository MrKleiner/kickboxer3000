kbmodules.football_standard={};

// Team params:
// logo image
// Name
// Coach

// Player params:
// Name
// Surname
// Number

kbmodules.football_standard = {};

// window.modules.football_standard.playerbase

// field context is needed to ensure that a player item can only be dropped into the corresponding field
kbmodules.football_standard.player_item_drag_field_context = null
kbmodules.football_standard.next_card_out = null;
kbmodules.football_standard.base_timer = null;



kbmodules.football_standard.index_titles = function(ctx){

	kbmodules.football_standard.titles = {
		// 'team_layout': new vmix_title('command_layout.gtzip'),

		// field layout
		'team_layout': new vmix.title({
			'title_name': 'command_layout.gtzip',
			'timings': {
				'fps': 30,
				'frames_in': 91,
				'margin': 100,
			},
		}),


		// cards
		'yellow_card': new vmix.title({
			'title_name': 'yellow_card.gtzip',
			'timings': {
				'fps': 30,
				'frames_in': 72,
				'margin': 100,
			}
		}),
		'red_card': new vmix.title({
			'title_name': 'red_card.gtzip',
			'timings': {
				'fps': 30,
				'frames_in': 72,
				'margin': 100,
			}
		}),

		// replacements
		'replacement_out': new vmix.title({
			'title_name': 'replacement_leaving.gtzip',
			'timings': {
				'fps': 30,
				'frames_in': 72,
				'frames_out': 65,
				'margin': 100,
			}
		}),
		'replacement_in': new vmix.title({
			'title_name': 'replacement_incoming.gtzip',
			'timings': {
				'fps': 30,
				'frames_in': 72,
				'frames_out': 65,
				'margin': 100,
			}
		}),

		// VS
		'splash': new vmix.title({
			'title_name': 'splash.gtzip',
			'timings': {
				'fps': 30,
				'frames_in': 55,
				'margin': 100,
			}
		}),

		// Goal / score
		'gscore': new vmix.title({
			'title_name': 'scored.gtzip',
			'timings': {
				'fps': 30,
				'frames_in': 71,
				'frames_out': 69,
				'margin': 100,
			}
		}),

		// Coach l4d2
		'coach': new vmix.title({
			'title_name': 'coach.gtzip',
			'timings': {
				'fps': 30,
				'frames_in': 60,
				'margin': 100,
			}
		}),

		// Timer and scores
		'timer': new vmix.title({
			'title_name': 'score_and_time.gtzip',
			'timings': {
				'fps': 30,
				'frames_in': 70,
				'margin': 100,
			}
		}),

		// Composed scores
		'final_scores': new vmix.title({
			'title_name': 'final_scores.gtzip',
			'timings': {
				'fps': 30,
				'frames_in': 59,
				'margin': 100,
			}
		}),
	}

}

// important todo: this entire system STILL has a HUGE flaw:
// Getting a player by his nameid is VERY expensive
// because this operation requires looping through the entire list

kbmodules.football_standard.playerbase = {
	'one': {
		'main': {},
		'reserve': {},
		'both': {},
	},
	'two': {
		'main': {},
		'reserve': {},
		'both': {},
	},

	// todo: is this collision safe ?
	'global_index': {},
}
kbmodules.football_standard.playerbase[1] = kbmodules.football_standard.playerbase['one'];
kbmodules.football_standard.playerbase['1'] = kbmodules.football_standard.playerbase['one'];

kbmodules.football_standard.playerbase[2] = kbmodules.football_standard.playerbase['two'];
kbmodules.football_standard.playerbase['2'] = kbmodules.football_standard.playerbase['two'];



kbmodules.football_standard.__playerbase_as_dict = function(){
	// console.time('pbase as dict')
	const pbase_dict = {
		'one': {
			'main': {},
			'reserve': {},
			'both': {},
		},
		'two': {
			'main': {},
			'reserve': {},
			'both': {},
		},
		// important todo: This is a big fucking risk
		// what if there's a player with the same name, surname and number in both teams ?
		'global': {},
	}
	// todo: use map or whatever


	// 
	// TEAM 1 
	// 

	// MAIN
	for (let player of kbmodules.football_standard.playerbase.one.main){
		pbase_dict.one.main[player.namecode] = player;
		pbase_dict.one.both[player.namecode] = player;
	}
	// RESERVE
	for (let player of kbmodules.football_standard.playerbase.one.reserve){
		pbase_dict.one.reserve[player.namecode] = player;
		pbase_dict.one.both[player.namecode] = player;
	}


	// 
	// TEAM 2 
	// 

	// MAIN
	for (let player of kbmodules.football_standard.playerbase.two.main){
		pbase_dict.two.main[player.namecode] = player;
		pbase_dict.two.both[player.namecode] = player;
	}
	// RESERVE
	for (let player of kbmodules.football_standard.playerbase.two.reserve){
		pbase_dict.two.reserve[player.namecode] = player;
		pbase_dict.two.both[player.namecode] = player;
	}


	// console.timeEnd('pbase as dict')

	return pbase_dict
}

kbmodules.football_standard.tab_switch = function(event){
	const id_pair = event.target.getAttribute('match_id');

	$('tab').addClass('tab_hidden');
	$(`tab[tabid="${id_pair}"]`).removeClass('tab_hidden');
	$('#tabs .tab').removeClass('active_tab');
	event.target.classList.add('active_tab');
}

// kbmodules.football_standard.teams = {
// 	1: team1_sel,
// 	'1': team1_sel,
// 	'one': team1_sel,

// 	2: team2_sel,
// 	'2': team2_sel,
// 	'two': team2_sel,
// }

kbmodules.football_standard.load = async function(){
	kbmodules.football_standard.index_titles()
	kbmodules.football_standard.postload()
	$('#teams_layouts .team_layout .ftfield div, #teams_layouts .team_layout .ftfield .goalkeeper').addClass('player_slot');
	// important todo: such startup info has to be evaluated by the core
	// const vmix_state = (new DOMParser()).parseFromString((await window.talker.vmix_talk({'Function': ''})), 'application/xml');
	const vmix_state = await vmix.talker.project();

	await kbmodules.football_standard.titles.timer.toggle_text('time_added', false);
	await kbmodules.football_standard.titles.timer.toggle_img('extra_time_bg', false);
	await kbmodules.football_standard.titles.timer.toggle_text('extra_ticker', false);
	await kbmodules.football_standard.titles.timer.set_text('extra_ticker', '0:00');
	await kbmodules.football_standard.titles.timer.set_text('base_ticker', '0:00');

	const fresh_context = ksys.context.module.pull();

	// important todo: Fuck VMIX
	{
		const yellow_card_sel = vmix_state.querySelector(`vmix inputs input[title="${kbmodules.football_standard.titles.yellow_card.title_name}"]`)
		const red_card_sel = vmix_state.querySelector(`vmix inputs input[title="${kbmodules.football_standard.titles.red_card.title_name}"]`)

		if (yellow_card_sel && red_card_sel){
			const yellow_card_num = str(yellow_card_sel.getAttribute('number'))
			const red_card_num = str(red_card_sel.getAttribute('number'))

			const card_corelation = {};
			// also, fuck js
			// todo: use map() ?
			card_corelation[yellow_card_num] = kbmodules.football_standard.titles.yellow_card;
			card_corelation[red_card_num] = kbmodules.football_standard.titles.red_card;

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
					kbmodules.football_standard.next_card_out = card_corelation[occupied_by.trim()]
					print('Found overlay occupied by a card:', occupied_by, kbmodules.football_standard.next_card_out.title_name)
					break
				}
			}
		}
	}

	// presets
	{
		const index_file = JSON.parse(ksys.db.module.read('teams_index.index'))
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

	// it's important that the layout is loaded AFTER the player items were created in the control panel
	kbmodules.football_standard.load_last_layout()

	// the time number
	kbmodules.football_standard.time_num = fresh_context.time_num || 1;

	// 
	// index all the selectors and whatever the fucknot
	// 
	{
		const return_selectors = function(t){
			return {
				'logo_input': $(`#team${t}_def [prmname="team_logo"] input`)[0],
				'team_name':  $(`#team${t}_def [prmname="team_name"] input`)[0],
				'shorthand':  $(`#team${t}_def [prmname="club_shorthand"] input`)[0],
				'team_coach': $(`#team${t}_def [prmname="team_coach"] input`)[0],
				'score_pool': $(`#score_ctrl_team${t} .score_ctrl_table`)[0],
				logo: function(){
					const input_elem = $(`#team${t}_def [prmname="team_logo"] input`)[0]
					if (!input_elem.files[0] && !$(`#team${t}_def`).attr(`logo_path`)){
						return null
					}
					if (input_elem.files[0]){
						return input_elem.files[0].path
					}else{
						return $(`#team${t}_def`).attr(`logo_path`)
					}
				},

				'field': {
					'filter_pool': $(`#teams_layouts #team${t}_layout .player_picker_pool`)[0],
					'field': $(`#teams_layouts #team${t}_layout .ftfield`)[0],
				},

				'replace': {
					'leaving': $(`#replacement #replacement_team${t} .replacement_leaving .replacement_filtered_list`)[0],
					'inbound': $(`#replacement #replacement_team${t} .replacement_incoming .replacement_filtered_list`)[0],
				},
			}
		}

		const team1_sel = return_selectors(1);
		const team2_sel = return_selectors(2);

		kbmodules.football_standard.teams = {
			1: team1_sel,
			'1': team1_sel,
			'one': team1_sel,

			2: team2_sel,
			'2': team2_sel,
			'two': team2_sel,
		}
	}

}
// kbmodules.football_standard.load()


kbmodules.football_standard.postload = function(){
	// picking the player item up
	document.addEventListener('mousedown', tr_event => {

		// the item can be picked both from the filter menu and field
		const tgt = event.target.closest('.team_layout .generic_player_item')
		// also make sure it doesn't trigger on anything but LMB
		if (tgt && tr_event.which == 1){
			// set the current football field context
			kbmodules.football_standard.player_item_drag_field_context = event.target.closest('.team_layout')
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
		const pldrag_item = document.querySelector('.generic_player_item.dragging');
		// the table cell to drop the player to
		// important: it has to be a cell related to the current field
		const player_layout_drop_tgt = tr_event.target.closest('.ftfield .player_slot');

		// if there's a cell underneath the cursor - drop the player item there
		// AND if this cell is related to the current field
		if (player_layout_drop_tgt && pldrag_item && kbmodules.football_standard.player_item_drag_field_context.contains(player_layout_drop_tgt)){
			// if the drop target is a cell already containing a player - swap the players
			if (player_layout_drop_tgt.querySelector('.generic_player_item')){
				const player_from_target = player_layout_drop_tgt.querySelector('.generic_player_item');
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
		kbmodules.football_standard.player_item_drag_field_context = null;

	});

	// sticking the dragged player item to cursor
	document.addEventListener('mousemove', tr_event => {
		// if there's a player element which is marked as dragging - apply XY position to it
		const player_field_layout_player = document.querySelector('.generic_player_item.dragging')
		if (player_field_layout_player){
			player_field_layout_player.style.left = tr_event.x + 'px'
			player_field_layout_player.style.top = tr_event.y + 'px'
		}
	});


	// fancy hover effect
	document.addEventListener('mouseover', tr_event => {

		// whether or not a dragged element exists
		const is_dragging = document.querySelector('.generic_player_item.dragging')
		// the target cell the cursor is hovering over
		// important: it has to be a cell related to the current field
		const target_cell = tr_event.target.closest('.ftfield .player_slot')
		// remove hover effect from all the other cells
		for (let deselect of document.querySelectorAll('.field_cell_hover')){
			deselect.classList.remove('field_cell_hover')
		}
		// add hover effect to the cell, if any
		if (is_dragging && target_cell && kbmodules.football_standard.player_item_drag_field_context.contains(target_cell)){
			target_cell.classList.add('field_cell_hover')
		}

	})


	document.addEventListener('contextmenu', tr_event => {

		const field_player = tr_event.target.closest('.generic_player_item')
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
			kbmodules.football_standard.save_last_layout()
		}
		if (tr_event.altKey && tr_event.which == 19){
			kbmodules.football_standard.quit_all_titles()
		}
	});
}


kbmodules.football_standard.quit_all_titles = async function(){
	document.body.classList.add('emergency_break')
	for (let quit_title in kbmodules.football_standard.titles){
		await kbmodules.football_standard.titles[quit_title].overlay_out(1)
	}
	document.body.classList.remove('emergency_break')
}

kbmodules.football_standard.format_text = function(txt, case_sel, translit=false){
	var result = txt;
	if (translit){
		result = ksys.translit(result);
	}

	// 1 = capital
	if (case_sel == 1){
		result = txt.lower().capitalize()
	}
	// 2 = all upper
	if (case_sel == 2){
		result = txt.upper()
	}
	// 3 = all lower
	if (case_sel == 2){
		result = txt.lower()
	}

	return result
}


kbmodules.football_standard._show_chosen_club_logo = function(team){
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

kbmodules.football_standard._club_name_dynamic_type = function(event, team){
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

// update vis feedback of all the logos and team names
// and write the logo path to the attributes of the team def table
// important todo: make teams use dict system and not this retarded on-demand manual garbage
kbmodules.football_standard.upd_vis_feedback = function(){
	// todo: this is rather stupid

	// TEAM 1
	var team_logo = $('#team1_def [prmname="team_logo"] input')[0];
	if (team_logo.files[0]){
		$('#team1_def').attr('logo_path', team_logo.files[0].path);
		var team_logo = team_logo.files[0].path;
	}else{
		var team_logo = null;
	}
	$('[vis_feedback="team1_logo"]').attr('src', team_logo || $('#team1_def').attr('logo_path'));
	$('[vis_feedback="team1_name"]').text($('#team1_def [prmname="team_name"] input').val());
	var team_logo = null;


	// TEAM 2
	var team_logo = $('#team2_def [prmname="team_logo"] input')[0];
	if (team_logo.files[0]){
		$('#team2_def').attr('logo_path', team_logo.files[0].path);
		var team_logo = team_logo.files[0].path;
	}else{
		var team_logo = null;
	}
	$('[vis_feedback="team2_logo"]').attr('src', team_logo || $('#team2_def').attr('logo_path'));
	$('[vis_feedback="team2_name"]').text($('#team2_def [prmname="team_name"] input').val());
}



// player parameters input
kbmodules.football_standard.player_ctrl = class {
	constructor(team, is_reserve, pname='', psurname='', number=''){
		this.name = pname;
		this.surname = psurname;
		this.number = number;
		this.is_reserve = is_reserve;
		this.scores = 0;
		// important todo: WHAT THE FUCK IS THIS ?!!!
		const _team_selector = {
			1: 'one',
			2: 'two',
		};
		this.team = {
			'num': team,
			'num_word': _team_selector[team],
			// 'elem': $(`${_team_elem_selector[team]}`),
			'elem': $(`#team${team}_def`),
			'field': $(`#team${team}_layout .ftfield`),
		};
		this.namecode = '';

		// still, fuck javascript
		const self = this;

		const ctrl_elem = $(`
			<div class="player_item" namecode="${this.namecode}">
				<div class="player_param" prmname="pname">
					<div class="player_param_label">Name</div>
					<input type="text" class="player_param_input" value="${this.name}">
				</div>
				<div class="player_param" prmname="psurname">
					<div class="player_param_label">Surname</div>
					<input type="text" class="player_param_input" value="${this.surname}">
				</div>
				<div class="player_param" prmname="number">
					<div class="player_param_label">Number</div>
					<input type="text" class="player_param_input" value="${this.number}">
				</div>
			</div>
		`)

		this.ctrl_elem = ctrl_elem[0];

		// update the namecode in case player info was passed to the class
		this._update_namecode(false)

		// todo: this is still not ideal
		ctrl_elem.find('[prmname="pname"] input')[0].onchange = function(evt){
			// print('FUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUU')
			self.name = evt.target.value;
			self._update_namecode(true);
		}
		ctrl_elem.find('[prmname="psurname"] input')[0].onchange = function(evt){
			// print('FUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUU', self, evt.target.value)
			self.surname = evt.target.value;
			self._update_namecode(true);
		}
		ctrl_elem.find('[prmname="number"] input')[0].onchange = function(evt){
			self.number = evt.target.value;
			self._update_namecode(true);
		}
		ctrl_elem[0].oncontextmenu = function(evt){
			if (evt.altKey){
				self.kill()
			}
		}

		// register this player in the index
		kbmodules.football_standard.playerbase[this.team.num_word][this.is_reserve ? 'reserve' : 'main'][this.namecode] = this;
		kbmodules.football_standard.playerbase[this.team.num_word]['both'][this.namecode] = this;
		kbmodules.football_standard.playerbase.global_index[this.namecode] = this;
	}

	// important todo: this retarded shit logic does an extra lap. TOO BAD

	// update the namecode including the control element
	_update_namecode(forward){
		const reserve_or_main = this.is_reserve ? 'reserve' : 'main';

		// global player index
		delete kbmodules.football_standard.playerbase.global_index[this.namecode];
		// current team reserve/main
		delete kbmodules.football_standard.playerbase[this.team.num_word][reserve_or_main][this.namecode];
		// current team combo of main and reserve
		delete kbmodules.football_standard.playerbase[this.team.num_word].both[this.namecode];

		// Forward update has to come BEFORE the class' namecode is updated,
		// because all the other generic player items still have an old namecode
		if (forward){
			this.forward_update(true)
		}
		this.namecode = `${this.name.lower()} ${this.surname.lower()} ${this.number}`;
		this.ctrl_elem.setAttribute('namecode', this.namecode);

		kbmodules.football_standard.playerbase[this.team.num_word][reserve_or_main][this.namecode] = this;
		kbmodules.football_standard.playerbase[this.team.num_word].both[this.namecode] = this;
		kbmodules.football_standard.playerbase.global_index[this.namecode] = this;
	}

	// remove, destroy, kill, annihilate, obliterate this player from the face of Earth
	kill(){
		// global player index
		delete kbmodules.football_standard.playerbase.global_index[this.namecode];
		// current team reserve/main
		delete kbmodules.football_standard.playerbase[this.team.num_word][reserve_or_main][this.namecode];
		// current team combo of main and reserve
		delete kbmodules.football_standard.playerbase[this.team.num_word].both[this.namecode];

		this.ctrl_elem.remove();

		$(`player[namecode="${this.namecode}"]`).remove();
	}

	// update all the player elements on the page with new data
	// todo: is this too expensive? Shouldn't be...
	// Because just how often is this going to be triggered ?
	forward_update(upd_namecode=true){
		// print('Forward update...', this.namecode)
		const tgt_elems = $(`player[namecode="${this.namecode}"]`);

		tgt_elems.find('.player_number').text(this.number)
		tgt_elems.find('.player_surname').text(this.surname)

		if (upd_namecode){
			this._update_namecode(false)
		}

		tgt_elems.attr('namecode', this.namecode)
		
	}

	get_generic_player_item(asjq=true){
		const generic_item = $(`
			<player
				class="generic_player_item"
				namecode="${this.namecode}"
			>
				<img vis_feedback="team${this.team.num}_logo" src="${this.get_team_logo()}">
				<div class="player_number">${this.number}</div>
				<div class="player_surname">${this.surname.lower().capitalize()}</div>
			</player>
		`)

		if (asjq){
			return generic_item
		}else{
			return generic_item[0]
		}
	}

	// get logo filepath of this player's team
	// returns null if nothing's present
	get_team_logo(){
		const input_elem = this.team.elem.find('[prmname="team_logo"] input')[0]
		if (!input_elem.files[0] && !this.team.elem.attr('logo_path')){
			return null
		}
		if (input_elem.files[0]){
			return input_elem.files[0].path
		}else{
			return this.team.elem.attr('logo_path')
		}
		// return (input_elem.files[0].path || this.team.elem.attr('logo_path'))
	}

	// whether this player is on the field or not
	is_on_field(){
		return !!this.team.field[0].querySelector(`[namecode="${this.namecode}"]`)
	}
}






kbmodules.football_standard.spawn_player = function(event, team){
	const pool = $(event.target.closest('.player_list')).find('.list_pool')
	if (!team){
		console.error('INVALID TEAM')
		return
	}
	const new_player = new kbmodules.football_standard.player_ctrl(team, pool[0].closest('.player_list').classList.contains('reserve'));
	pool.append(new_player.ctrl_elem)
}


kbmodules.football_standard.save_team_preset = function(team){
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
		'shorthand': $(`${team_def} .team_base_params [prmname="club_shorthand"] input`).val(),
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
	ksys.db.module.write(`${club_name}.tdef`, JSON.stringify(club_info, null, 4))

	// update index
	const index_file = ksys.db.module.read('teams_index.index')
	// important todo: Fuck
	const team_presets_index = JSON.parse(index_file) || [];

	if (!index_file){
		ksys.db.module.write('teams_index.index', JSON.stringify([], null, 4))
	}

	if (!team_presets_index.includes(club_name)){
		team_presets_index.push(club_name)
		ksys.db.module.write('teams_index.index', JSON.stringify(team_presets_index, null, 4))
	}

	kbmodules.football_standard.save_last_team_presets()
}

kbmodules.football_standard.load_team_preset = function(event){
	print(event)
	// get preset by file name and evaluate to JSON
	const team_preset = JSON.parse(ksys.db.module.read(`${event.target.value}.tdef`))
	// if this files does not exist - don't do anything
	if (!team_preset){return};

	// Get current team control panel element for later use
	const tgt_team = $(event.target.closest('.teamdef'))

	// element selectors
	const _team_selector = {
		'team1_def': {
			field: '#team1_layout',
			// def: '#team1_def',
			num: 1,
		},
		'team2_def': {
			field: '#team2_layout',
			// def: '#team2_def',
			num: 2,
		},
	}

	const tgt_team_info = _team_selector[tgt_team[0].id];

	// Set team name input value
	tgt_team.find('.team_base_params [prmname="team_name"] input')[0].value = team_preset.club_name;
	// Set team coach name input value
	tgt_team.find('.team_base_params [prmname="team_coach"] input')[0].value = team_preset.coach;
	// empty both player pools of this team
	tgt_team.find('.player_list .list_pool').empty()
	// Set logo attribute of the current team
	tgt_team.attr('logo_path', team_preset.logo)
	// team shorthand
	tgt_team.find('.team_base_params [prmname="club_shorthand"] input')[0].value = team_preset.shorthand || '';

	// spawn main players
	// team, is_reserve, pname='', psurname='', number=''
	for (let player of team_preset.main_players){
		const new_player = new kbmodules.football_standard.player_ctrl(
			tgt_team_info.num,
			false,
			player.name,
			player.surname,
			player.number,
		);
		tgt_team.find('.player_list.starters .list_pool').append(new_player.ctrl_elem)
	}

	// spawn reserve players
	for (let player of team_preset.reserve_players){
		const new_player = new kbmodules.football_standard.player_ctrl(
			tgt_team_info.num,
			true,
			player.name,
			player.surname,
			player.number,
		);
		tgt_team.find('.player_list.reserve .list_pool').append(new_player.ctrl_elem)
	}

	// Update vis feedback, like team logos and team names
	kbmodules.football_standard.upd_vis_feedback()
	// save the names of the currently selected teams
	kbmodules.football_standard.save_last_team_presets()

}

kbmodules.football_standard.save_last_team_presets = function(){
	ksys.context.module.prm('last_team_def1', $('#team1_def [prmname="team_name"] input')[0].value)
	ksys.context.module.prm('last_team_def2', $('#team2_def [prmname="team_name"] input')[0].value, true)
}


kbmodules.football_standard.filter_players = function(event, team){
	// Worst timing result: 2.5 ms

	// current team's field/players
	const field_context = event.target.closest('.team_layout');
	const pool = $(field_context).find('.player_picker .player_picker_pool');
	// Query from the text input
	const tquery = event.target.value.toLowerCase();

	// Clear the filtered pool
	pool.empty()

	for (let player_index in kbmodules.football_standard.playerbase[team].both){
		const player = kbmodules.football_standard.playerbase[team].both[player_index]

		//    match player name or number           make sure the player is not on the field
		if (  player.namecode.includes(tquery)  &&  !player.is_on_field()  ){
			pool.append(player.get_generic_player_item())
		}
	}
}

kbmodules.football_standard.filter_players_to_punish = function(event){

	// the query from the text input
	const tquery = event.target.value.lower();

	// todo: get the fuck rid of Jquery
	const punish_pool = $('#card_player_filter_pool');
	punish_pool.empty()

	// todo: is this too slow ?
	// and is this faster than getting indexed shit ?
	// const all_players = [
	// 	...kbmodules.football_standard.playerbase.one.main,
	// 	...kbmodules.football_standard.playerbase.one.reserve,

	// 	...kbmodules.football_standard.playerbase.two.main,
	// 	...kbmodules.football_standard.playerbase.two.reserve,
	// ];

	for (let player_index in kbmodules.football_standard.playerbase.global_index){
		// match player name or number
		const player = kbmodules.football_standard.playerbase.global_index[player_index];
		if (player.namecode.includes(tquery)){
			const filtered_item = player.get_generic_player_item()
			filtered_item[0].onclick = kbmodules.football_standard.select_player_for_punishment;
			punish_pool.append(filtered_item)
		}
	}

}


kbmodules.football_standard.save_last_layout = function(){
	const layout = {
		'team1': {},
		'team2': {},
	};

	const playerbase_keyed = kbmodules.football_standard.playerbase;

	// TEAM 1
	for (let player of document.querySelectorAll('#team1_layout .ftfield .player_slot')){
		const player_info = player.querySelector('.generic_player_item')
		if (!player_info){
			layout.team1[player.getAttribute('t_num')] = null
			continue
		}
		const player_item = playerbase_keyed.one.both[player_info.getAttribute('namecode')]
		layout.team1[player.getAttribute('t_num')] = {
			'player_num': player_item.number,
			'name':       player_item.name,
			'surname':    player_item.surname,
			'namecode':   player_item.namecode,
		}
	}

	// TEAM 2
	for (let player of document.querySelectorAll('#team2_layout .ftfield .player_slot')){
		const player_info = player.querySelector('.generic_player_item')
		if (!player_info){
			layout.team2[player.getAttribute('t_num')] = null
			continue
		}
		const player_item = playerbase_keyed.two.both[player_info.getAttribute('namecode')]
		layout.team2[player.getAttribute('t_num')] = {
			'player_num': player_item.number,
			'name':       player_item.name,
			'surname':    player_item.surname,
			'namecode':   player_item.namecode,
		}
	}

	ksys.db.module.write('last_layout.lol', JSON.stringify(layout, null, 4))

	print('saved last layout')
}

kbmodules.football_standard.load_last_layout = function(){
	// get last layout file and evaluate it as JSON
	const last_layout = JSON.parse(ksys.db.module.read('last_layout.lol'))
	print(last_layout)
	// if file does not exist/invalid - return
	// Yes, it works, because JSON.parse(null) returns null
	if (!last_layout){return};

	// get playerbase as an indexed dict
	const pbase_indexed = kbmodules.football_standard.playerbase;

	print('WHAT THE FUCK', pbase_indexed)
	// Go through each slot number in the last layout dict
	// and see if value of this key contains something that is not null

	// TEAM 1
	for (let slotnum in last_layout.team1){
		// Get player info from the last layout dict by slot number, if any (can map to null if cell is empty)
		const player_info = last_layout.team1[slotnum]
		// todo: empty the cell ?
		if (!player_info){continue};
		// Get the corresponding slot on the field grid
		const slot = document.querySelector(`#team1_layout .ftfield [t_num="${slotnum}"]`)
		// append generic player element to the cell
		// print('GO FUCKING DIE', player_info.namecode)
		$(slot).append(pbase_indexed.one.both[player_info.namecode].get_generic_player_item())
	}

	// TEAM 2
	for (let slotnum in last_layout.team2){
		const player_info = last_layout.team2[slotnum]
		if (!player_info){continue};

		const slot = document.querySelector(`#team2_layout .ftfield [t_num="${slotnum}"]`)

		$(slot).append(pbase_indexed.two.both[player_info.namecode].get_generic_player_item())
	}
}


// Что должно выводиться в список?
// Какие игроки из каких списков ?
kbmodules.football_standard.filter_players_replacement = function(event, _team){
	const team_relation = {
		'one': 1,
		'two': 2,
	}
	// todo: FUUUUUUUUUUUU
	// although this is still a slight improvement
	const team = team_relation[_team];

	// the query from the text input
	const tquery = event.target.value.toLowerCase();

	// important todo: get rid of jquery
	// get the player pool to append the filtered items to
	const replacement_pool = $(event.target.closest('.replacement_list').querySelector('.replacement_filtered_list'));
	replacement_pool.empty();

	// main, replacement
	// const pools = kbmodules.football_standard.playerbase[_team][event.target.closest('')];
	// const all_players = kbmodules.football_standard.playerbase_as_dict()[_team];
	// const all_players = [...kbmodules.football_standard.playerbase[_team].main, ...kbmodules.football_standard.playerbase[_team].reserve];

	// important todo: create a function to return players on the field or reservees or whatever
	// basically groups
	const on_field_demand = !!event.target.closest('.replacement_leaving');
	const reserve_demand = !!event.target.closest('.replacement_incoming');

	// for (let player of document.querySelectorAll(`${team} .list_pool .player_item`)){
	for (let player_index in kbmodules.football_standard.playerbase[team].both){
		const player = kbmodules.football_standard.playerbase[team].both[player_index];

		const player_is_on_field = player.is_on_field()

		if (on_field_demand && !player_is_on_field){
			// continue
		}

		if (reserve_demand && (!player.is_reserve || player_is_on_field)){
			continue
		}

		// todo: do the same for other filters
		if (!player.namecode.includes(tquery)){
			continue
		}

		const player_item = player.get_generic_player_item()
		// todo: make this selection generic
		player_item[0].onclick = kbmodules.football_standard.mark_replacement_player;
		replacement_pool.append(player_item);

	}
}

kbmodules.football_standard.mark_replacement_player = function(event){
	var list_pair = '.replacement_incoming';
	if (event.target.closest('.replacement_list').classList.contains('replacement_leaving')){
		var list_pair = '.replacement_leaving';
	}
	$(`#replacement .replacement_team .replacement_list${list_pair} .replacement_filtered_list .generic_player_item`).removeClass('selected_replacement')
	event.target.closest('.generic_player_item').classList.add('selected_replacement');
}

kbmodules.football_standard.replacement_player_title = async function(event){
	const tgtbtn = event.target.closest('vmixbtn')

	const leaving_player = $('#replacement .replacement_list.replacement_leaving .selected_replacement')
	const incoming_player = $('#replacement .replacement_list.replacement_incoming .selected_replacement')

	if (!leaving_player[0] || !incoming_player[0]){
		return
	}

	// todo: do the same for other titles
	// const pdict = kbmodules.football_standard.playerbase_as_dict()
	const all_players = kbmodules.football_standard.playerbase.global_index;

	const leaving_player_object = all_players[leaving_player.attr('namecode')];
	const incoming_player_object = all_players[incoming_player.attr('namecode')];

	await kbmodules.football_standard.titles.replacement_out.set_text('player_name', leaving_player_object.surname)
	await kbmodules.football_standard.titles.replacement_out.set_img_src('club_logo', leaving_player_object.get_team_logo())
	await kbmodules.football_standard.titles.replacement_in.set_text('player_name', incoming_player_object.surname)
	await kbmodules.football_standard.titles.replacement_in.set_img_src('club_logo', incoming_player_object.get_team_logo())

	ksys.btns.pool.exec_replacement_sequence.vmixbtn(false)

	await kbmodules.football_standard.titles.replacement_out.overlay_in(1)
	await kbsleep(5000)
	await kbmodules.football_standard.titles.replacement_in.overlay_in(1)
	await kbsleep(5000)
	await kbmodules.football_standard.titles.replacement_in.overlay_out(1)

	ksys.btns.pool.exec_replacement_sequence.vmixbtn(true)
}


kbmodules.football_standard.select_player_for_punishment = function(event){
	$('#card_player_filter_pool .generic_player_item').removeClass('selected_to_punish')
	event.target.closest('.generic_player_item').classList.add('selected_to_punish')
}

kbmodules.football_standard.show_card = async function(_card){
	const card_selection = {
		'yellow': 'yellow_card',
		'red':    'red_card',
	}
	const card = kbmodules.football_standard.titles[card_selection[_card]];
	const selected_player = document.querySelector('#card_player_filter .generic_player_item.selected_to_punish')
	if (selected_player){
		const player_object = kbmodules.football_standard.playerbase.global_index[selected_player.getAttribute('namecode')];

		kbmodules.football_standard.next_card_out = card;

		await card.set_text('player_name', `${player_object.number} ${player_object.surname.toUpperCase()}`)
		await card.set_img_src('club_logo', player_object.get_team_logo())
		// disable buttons
		ksys.btns.pool.red_card.vmixbtn(false)
		ksys.btns.pool.yellow_card.vmixbtn(false)
		await card.overlay_in(1)

		// re-enable buttons
		ksys.btns.pool.red_card.vmixbtn(true)
		ksys.btns.pool.yellow_card.vmixbtn(true)
	}
}

kbmodules.football_standard.hide_card = async function(){
	// disable buttons
	ksys.btns.pool.red_card.vmixbtn(false)
	ksys.btns.pool.yellow_card.vmixbtn(false)
	ksys.btns.pool.kill_card.vmixbtn(false)

	if (kbmodules.football_standard.next_card_out){
		print('Turning off', kbmodules.football_standard.next_card_out.title_name)
		await kbmodules.football_standard.next_card_out.overlay_out(1)
	}

	// re-enable buttons
	ksys.btns.pool.red_card.vmixbtn(true)
	ksys.btns.pool.yellow_card.vmixbtn(true)
	ksys.btns.pool.kill_card.vmixbtn(true)
}


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
kbmodules.football_standard.upd_player_layout = async function(team){

	const title = kbmodules.football_standard.titles.team_layout;

	const _team_selector = {
		1: {
			field: '#team1_layout',
			def: '#team1_def',
			num: 'one',
		},
		2: {
			field: '#team2_layout',
			def: '#team2_def',
			num: 'two',
		},
	}

	const team_field = _team_selector[team].field;
	const team_def = _team_selector[team].def;

	const player_pool = kbmodules.football_standard.playerbase[_team_selector[team].num].both;
	// const player_pool = [...kbmodules.football_standard.playerbase[_team_selector[team].num].main, ...kbmodules.football_standard.playerbase[_team_selector[team].num].reserve]

	// 
	// player layout
	// 
	for (let player_slot of document.querySelectorAll(`${team_field} .ftfield .player_slot`)){
	// for (let player_slot of player_pool){
		const player_item = player_slot.querySelector('.generic_player_item');
		const slot_has_player = !!player_item;
		const cell_id = player_slot.getAttribute('t_num');

		
		// player number
		await title.toggle_text(`plr_num_${cell_id}`, slot_has_player)
		// player name
		await title.toggle_text(`plr_name_${cell_id}`, slot_has_player)
		// tshirt image
		await title.toggle_img(`plr_bg_${cell_id}`, slot_has_player)

		if (slot_has_player){
			const player_object = player_pool[player_item.getAttribute('namecode')];
			// player number
			await title.set_text(`plr_num_${cell_id}`, player_object.number);
			// player name
			await title.set_text(`plr_name_${cell_id}`, player_object.surname);
		}
	}


	// 
	// main player list
	// 

	// 
	// I sincerely fucking hate javascript retarded fucking useless pointless stupid stinky garbage
	// Go fucking die in a car crash and then in a fire
	// (fuck .map, especially)
	// 
	const player_list_sorted = [];
	for (let player in kbmodules.football_standard.playerbase[team].main){
		player_list_sorted.push(kbmodules.football_standard.playerbase[team].main[player])
	}
	player_list_sorted.sort(function(a, b){
		// print(a, b)
		return int(a.number) - int(b.number)
	})
	const player_list = [];
	const player_nums = [];
	for (let player of player_list_sorted){
		player_nums.push(player.number)
		player_list.push(player.surname)
	}

	// names
	await title.set_text('playerlist', player_list.join('\n'))
	// numbers
	await title.set_text('playerlist_nums', player_nums.join('\n'))



	// 
	// reserve list
	// 
	const reserve_list_sorted = [];
	for (let player in kbmodules.football_standard.playerbase[team].reserve){
		reserve_list_sorted.push(kbmodules.football_standard.playerbase[team].reserve[player])
	}
	reserve_list_sorted.sort(function(a, b){
		// print(a, b)
		return int(a.number) - int(b.number)
	})
	const reserve_list = [];
	const reserve_nums = [];
	for (let player of reserve_list_sorted){
		reserve_nums.push(player.number)
		reserve_list.push(player.surname)
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
	await title.set_text('club_name', $(`${team_def} [prmname="team_name"] input`).val().upper())

	// 
	// logo
	// 
	await title.set_img_src('club_logo', $(team_def).attr('logo_path'))
}


kbmodules.football_standard.show_field_layout = async function(team){
	ksys.btns.pool.show_field_layout_command1.vmixbtn(false)
	ksys.btns.pool.hide_field_layout_command1.vmixbtn(false)
	ksys.btns.pool.show_field_layout_command2.vmixbtn(false)
	ksys.btns.pool.hide_field_layout_command2.vmixbtn(false)
	await kbmodules.football_standard.upd_player_layout(team)
	await kbmodules.football_standard.titles.team_layout.overlay_in(1)
	ksys.btns.pool.show_field_layout_command1.vmixbtn(true)
	ksys.btns.pool.hide_field_layout_command1.vmixbtn(true)
	ksys.btns.pool.show_field_layout_command2.vmixbtn(true)
	ksys.btns.pool.hide_field_layout_command2.vmixbtn(true)
}


kbmodules.football_standard.hide_field_layout = async function(team){
	ksys.btns.pool.show_field_layout_command1.vmixbtn(false)
	ksys.btns.pool.hide_field_layout_command1.vmixbtn(false)
	ksys.btns.pool.show_field_layout_command2.vmixbtn(false)
	ksys.btns.pool.hide_field_layout_command2.vmixbtn(false)
	// await kbmodules.football_standard.upd_player_layout(team)
	await kbmodules.football_standard.titles.team_layout.overlay_out(1)
	ksys.btns.pool.show_field_layout_command1.vmixbtn(true)
	ksys.btns.pool.hide_field_layout_command1.vmixbtn(true)
	ksys.btns.pool.show_field_layout_command2.vmixbtn(true)
	ksys.btns.pool.hide_field_layout_command2.vmixbtn(true)
}


kbmodules.football_standard.save_vs_sublines = function(){
	context.module.prm('vs_title_bottom_upper_line', $('#vs_text_bottom_upper')[0].value)
	context.module.prm('vs_title_bottom_lower_line', $('#vs_text_bottom_lower')[0].value, true)
}


kbmodules.football_standard.show_vs_title = async function(){
	ksys.btns.pool.show_splash.vmixbtn(false)
	await kbmodules.football_standard.titles.splash.set_text('title_lower_top', $('#vs_text_bottom_upper').val())
	await kbmodules.football_standard.titles.splash.set_text('title_lower_bot', $('#vs_text_bottom_lower').val())

	await kbmodules.football_standard.titles.splash.set_img_src('logo_l', $('#team1_def').attr('logo_path'))
	await kbmodules.football_standard.titles.splash.set_img_src('logo_r', $('#team2_def').attr('logo_path'))

	await kbmodules.football_standard.titles.splash.set_text('club_name_l', $('#team1_def [prmname="team_name"] input').val().upper())
	await kbmodules.football_standard.titles.splash.set_text('club_name_r', $('#team2_def [prmname="team_name"] input').val().upper())

	await kbmodules.football_standard.titles.splash.overlay_in(1)

	ksys.btns.pool.show_splash.vmixbtn(true)
}


kbmodules.football_standard.hide_vs_title = async function(){
	ksys.btns.pool.show_splash.vmixbtn(false)
	ksys.btns.pool.hide_splash.vmixbtn(false)
	await kbmodules.football_standard.titles.splash.overlay_out(1)
	ksys.btns.pool.show_splash.vmixbtn(true)
	ksys.btns.pool.hide_splash.vmixbtn(true)
}


kbmodules.football_standard.goal_score_on = async function(){
	const selected_player = document.querySelector('#card_player_filter .generic_player_item.selected_to_punish')

	if (!selected_player){return};

	const player_object = kbmodules.football_standard.playerbase.global_index[selected_player.getAttribute('namecode')]

	// register this goal
	$(kbmodules.football_standard.teams[player_object.team.num_word].score_pool).append(`
		<div oncontextmenu="this.remove()" namecode="${player_object.namecode}" class="team_score_record">
			<input value="${Math.floor(kbmodules.football_standard.base_counter.tick.global / 60)}" type="text" class="score_record_time">
			<input value="${player_object.surname}" type="text" class="score_record_player">
		</div>
	`);

	await kbmodules.football_standard.titles.gscore.set_text('player_name', `${player_object.number} ${player_object.surname.toUpperCase()}`)
	await kbmodules.football_standard.titles.gscore.set_img_src('club_logo', player_object.get_team_logo())

	await kbmodules.football_standard.titles.timer.set_text('score_l', $(kbmodules.football_standard.teams[1].score_pool).find('.team_score_record').length)
	await kbmodules.football_standard.titles.timer.set_text('score_r', $(kbmodules.football_standard.teams[2].score_pool).find('.team_score_record').length)

	// disable buttons
	ksys.btns.pool.scored.vmixbtn(false)

	await kbmodules.football_standard.titles.gscore.overlay_in(1)

	// re-enable buttons
	ksys.btns.pool.scored.vmixbtn(true)
}


kbmodules.football_standard.goal_score_off = async function(){
	ksys.btns.pool.scored.vmixbtn(false)
	ksys.btns.pool.scored_off.vmixbtn(false)

	await kbmodules.football_standard.titles.gscore.overlay_out(1)

	ksys.btns.pool.scored.vmixbtn(true)
	ksys.btns.pool.scored_off.vmixbtn(true)
}


kbmodules.football_standard.show_coach = async function(team){
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

	ksys.btns.pool.show_coach_team1.vmixbtn(false)
	ksys.btns.pool.hide_coach_team1.vmixbtn(false)
	ksys.btns.pool.show_coach_team2.vmixbtn(false)
	ksys.btns.pool.hide_coach_team2.vmixbtn(false)

	await kbmodules.football_standard.titles.coach.set_text('name', $(`${teamdef} [prmname="team_coach"] input`)[0].value)
	await kbmodules.football_standard.titles.coach.overlay_in(1)

	ksys.btns.pool.show_coach_team1.vmixbtn(true)
	ksys.btns.pool.hide_coach_team1.vmixbtn(true)
	ksys.btns.pool.show_coach_team2.vmixbtn(true)
	ksys.btns.pool.hide_coach_team2.vmixbtn(true)
}


kbmodules.football_standard.hide_coach = async function(){
	ksys.btns.pool.show_coach_team1.vmixbtn(false)
	ksys.btns.pool.hide_coach_team1.vmixbtn(false)
	ksys.btns.pool.show_coach_team2.vmixbtn(false)
	ksys.btns.pool.hide_coach_team2.vmixbtn(false)
	await kbmodules.football_standard.titles.coach.overlay_out(1)
	ksys.btns.pool.show_coach_team1.vmixbtn(true)
	ksys.btns.pool.hide_coach_team1.vmixbtn(true)
	ksys.btns.pool.show_coach_team2.vmixbtn(true)
	ksys.btns.pool.hide_coach_team2.vmixbtn(true)
}


kbmodules.football_standard.timer_callback = function(tick){
	const minutes = Math.floor(tick.global / 60)
	const seconds = tick.global - (60*minutes)
	kbmodules.football_standard.titles.timer.set_text('base_ticker', `${minutes}:${str(seconds).zfill(2)}`)
}


kbmodules.football_standard.extra_timer_callback = function(tick){
	const minutes = Math.floor(tick.global / 60)
	const seconds = tick.global - (60*minutes)
	kbmodules.football_standard.titles.timer.set_text('extra_ticker', `${minutes}:${str(seconds).zfill(2)}`)
}




kbmodules.football_standard.start_base_timer = async function(rnum){
	if (kbmodules.football_standard.base_counter){
		kbmodules.football_standard.base_counter.force_kill()
		kbmodules.football_standard.base_counter = null;
	}

	const dur = 45;

	kbmodules.football_standard.base_counter = ksys.ticker.spawn({
		'duration': (rnum == 2) ? (((dur*60)*2)+1) : ((dur*60)+1),
		'name': `giga_timer${rnum}`,
		'offset': (rnum == 2) ? (dur*60) : 0,
		'infinite': false,
		'reversed': false,
		'callback': kbmodules.football_standard.timer_callback,
		'wait': true,
	})

	kbmodules.football_standard.base_counter.fire()
	.then(function(response) {
		// turn off automatically
		if (kbmodules.football_standard.base_counter){
			kbmodules.football_standard.base_counter.force_kill()
		}
	})

	// print(kbmodules.football_standard.base_counter)

}


kbmodules.football_standard.main_timer_vis = async function(state){
	if (state == true){
		await kbmodules.football_standard.titles.timer.set_text('command_l', kbmodules.football_standard.teams[1].shorthand.value)
		await kbmodules.football_standard.titles.timer.set_text('command_r', kbmodules.football_standard.teams[2].shorthand.value)

		await kbmodules.football_standard.titles.timer.set_text('score_l', $(kbmodules.football_standard.teams[1].score_pool).find('.team_score_record').length)
		await kbmodules.football_standard.titles.timer.set_text('score_r', $(kbmodules.football_standard.teams[2].score_pool).find('.team_score_record').length)

		kbmodules.football_standard.titles.timer.overlay_in(2)
	}
	if (state == false){
		kbmodules.football_standard.titles.timer.overlay_out(2)
	}
}

kbmodules.football_standard.extra_time_vis = async function(state){
	if (state == true){
		await kbmodules.football_standard.titles.timer.toggle_text('time_added', true)
		await kbmodules.football_standard.titles.timer.toggle_img('extra_time_bg', true)
		await kbmodules.football_standard.titles.timer.toggle_text('extra_ticker', true)
	}
	if (state == false){
		await kbmodules.football_standard.titles.timer.toggle_text('time_added', false)
		await kbmodules.football_standard.titles.timer.toggle_img('extra_time_bg', false)
		await kbmodules.football_standard.titles.timer.toggle_text('extra_ticker', false)
	}
}


kbmodules.football_standard.launch_extra_time = async function(){
	const extra_amount = int($('#timer_ctrl_additional input').val())
	if (!extra_amount){
		return
	}

	await kbmodules.football_standard.titles.timer.set_text('time_added', $(`+${extra_amount}`))
	await kbmodules.football_standard.titles.timer.toggle_text('time_added', true)
	await kbmodules.football_standard.titles.timer.toggle_img('extra_time_bg', true)
	await kbmodules.football_standard.titles.timer.toggle_text('extra_ticker', true)

	kbmodules.football_standard.extra_counter = ksys.ticker.spawn({
		'duration': extra_amount*60,
		'name': `gigas_timer${1}`,
		'infinite': true,
		'reversed': false,
		'callback': kbmodules.football_standard.extra_timer_callback,
		'wait': true,
	})

	kbmodules.football_standard.extra_counter.fire()
	.then(function(response) {
		// turn off automatically
		if (kbmodules.football_standard.extra_counter){
			kbmodules.football_standard.extra_counter.force_kill()
		}
	})
}



kbmodules.football_standard.score_sum_vis = async function(state){
	if (state == true){

		const nums_l = [];
		const names_l = [];
		for (let player of document.querySelectorAll('#score_ctrl_team1 .score_ctrl_table .team_score_record')){
			nums_l.push(player.querySelector('.score_record_time').value)
			names_l.push(player.querySelector('.score_record_player').value)
		}
		await kbmodules.football_standard.titles.final_scores.set_text('scores_l', names_l.join('\n'))
		await kbmodules.football_standard.titles.final_scores.set_text('scores_l_num', nums_l.join('\n'))

		const nums_r = [];
		const names_r = [];
		for (let player of document.querySelectorAll('#score_ctrl_team2 .score_ctrl_table .team_score_record')){
			nums_r.push(player.querySelector('.score_record_time').value)
			names_r.push(player.querySelector('.score_record_player').value)
		}
		await kbmodules.football_standard.titles.final_scores.set_text('scores_r', names_r.join('\n'))
		await kbmodules.football_standard.titles.final_scores.set_text('scores_r_num', nums_r.join('\n'))



		// composite
		await kbmodules.football_standard.titles.final_scores.set_text('score_sum', `${document.querySelectorAll('#score_ctrl_team1 .score_ctrl_table .team_score_record').length} : ${document.querySelectorAll('#score_ctrl_team2 .score_ctrl_table .team_score_record').length}`)

		// team name LEFT
		await kbmodules.football_standard.titles.final_scores.set_text('team_name_l', kbmodules.football_standard.teams.one.team_name.value.upper())
		// team logo LEFT
		await kbmodules.football_standard.titles.final_scores.set_img_src('team_logo_l', kbmodules.football_standard.teams.one.logo())

		// team name RIGHT
		await kbmodules.football_standard.titles.final_scores.set_text('team_name_r', kbmodules.football_standard.teams.two.team_name.value.upper())
		// team logo RIGHT
		await kbmodules.football_standard.titles.final_scores.set_img_src('team_logo_r', kbmodules.football_standard.teams.two.logo())

		// show
		await kbmodules.football_standard.titles.final_scores.overlay_in(1)
	}

	if (state == false){
		await kbmodules.football_standard.titles.final_scores.overlay_out(1)
	}
}


kbmodules.football_standard.add_score = function(team){
	$(`#score_ctrl_team${team} .score_ctrl_table`).append(`
		<div oncontextmenu="this.remove()" class="team_score_record">
			<input type="text" class="score_record_time">
			<input type="text" class="score_record_player">
		</div>
	`)
}