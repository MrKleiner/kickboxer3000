
if(!kbmodules){kbmodules={}};

if(!kbmodules.football_standard){kbmodules.football_standard={}};
// Team params:
// logo image
// Name
// Coach

// Player params:
// Name
// Surname
// Number

// kbmodules.football_standard = {};

// kbmodules.football_standard.playerbase

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

kbmodules.football_standard.tab_switch = function(event){
	const id_pair = event.target.getAttribute('match_id');

	$('tab').addClass('tab_hidden');
	$(`tab[tabid="${id_pair}"]`).removeClass('tab_hidden');
	$('#tabs .tab').removeClass('active_tab');
	event.target.classList.add('active_tab');
}


kbmodules.football_standard.load = async function(){
	// 
	// Index colours
	// 
	{
		kbmodules.football_standard.team_colors = [
			// '000000',
			'0066c3',
			'00984c',
			'00aff1',
			'69c62b',
			'818181',
			'9c82bb',
			'c13dca',
			'e43d3d',
			'e43da5',
			'f0ec00',
			'fdda3d',
			'ff0003',
			'ff0282',
			'ff0604',
			'ffc938',
			'ffe100',
			'ffffff',
		]

		for (color of kbmodules.football_standard.team_colors){
			const col = $(`<div class="tcolour" tc="${color}" style="background: #${color}"></div>`);

			col.on('click', function(evt){
				const event = evt;
				$(event.target).closest('.colour_picker').find('.tcolour').removeClass('col_selected');
				event.target.classList.add('col_selected');
			})

			$('.team_param .colour_picker').append(col)
		}
	}

	kbmodules.football_standard.index_titles()
	kbmodules.football_standard.postload()
	$('#teams_layouts .team_layout .ftfield div, #teams_layouts .team_layout .ftfield .goalkeeper').addClass('player_slot');
	// important todo: such startup info has to be evaluated by the core
	// const vmix_state = (new DOMParser()).parseFromString((await window.talker.vmix_talk({'Function': ''})), 'application/xml');
	const vmix_state = await vmix.talker.project();

	await kbmodules.football_standard.titles.timer.toggle_text('time_added', false);
	await kbmodules.football_standard.titles.timer.toggle_img('extra_time_bg', false);
	await kbmodules.football_standard.titles.timer.toggle_text('extra_ticker', false);
	// await kbmodules.football_standard.titles.timer.set_text('extra_ticker', '00:00');
	// await kbmodules.football_standard.titles.timer.set_text('base_ticker', '00:00');

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

	// last team preset
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
				'logo_input':          $(`#team${t}_def [prmname="team_logo"] input`)[0],
				'team_name':           $(`#team${t}_def [prmname="team_name"] input`)[0],
				'shorthand':           $(`#team${t}_def [prmname="club_shorthand"] input`)[0],
				'team_coach':          $(`#team${t}_def [prmname="team_coach"] input`)[0],
				'player_color_picker': $(`#team${t}_def [prmname="team_player_color"] .colour_picker`)[0],
				'gk_color_picker':     $(`#team${t}_def [prmname="team_gk_color"] .colour_picker`)[0],
				'score_pool':          $(`#score_ctrl_team${t} .score_ctrl_table`)[0],
				'player_pool_main':    $(`#team${t}_def .player_lists .player_list.starters .list_pool`)[0],
				'player_pool_reserve': $(`#team${t}_def .player_lists .player_list.reserve .list_pool`)[0],
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

	// 
	// String formatting binds
	// 
	{
		document.querySelector('#text_formatting_params').onclick = function(){
			// Coach translit
			ksys.context.module.prm(
				'coach_translit',
				document.querySelector('#coach_text_format_translit').checked,
			);
			// Coach format
			ksys.context.module.prm(
				'coach_format',
				document.querySelector('#coach_string_format input:checked').value,
			);


			// Players translit
			ksys.context.module.prm(
				'players_translit',
				document.querySelector('#players_text_format_translit').checked,
			);
			// Players format
			ksys.context.module.prm(
				'players_format',
				document.querySelector('#players_string_format input:checked').value,
			);


			// Club translit
			ksys.context.module.prm(
				'club_translit',
				document.querySelector('#club_name_text_format_translit').checked,
			);
			// Club format
			ksys.context.module.prm(
				'club_format',
				document.querySelector('#club_string_format input:checked').value,
			);

		}
	}

	// 
	// String formatting load
	// 
	{
		if ('coach_format' in ksys.context.module.cache){
			const _ctx = ksys.context.module.cache;

			document.querySelector('#coach_text_format_translit').checked =                                  _ctx.coach_translit;
			document.querySelector(`#coach_string_format input[value="${_ctx.coach_format}"]`).checked =     true;
			
			document.querySelector('#players_text_format_translit').checked =                                _ctx.players_translit;
			document.querySelector(`#players_string_format input[value="${_ctx.players_format}"]`).checked = true;
			
			document.querySelector('#club_name_text_format_translit').checked =                              _ctx.club_translit;
			document.querySelector(`#club_string_format input[value="${_ctx.club_format}"]`).checked =       true;
		}
	}

	// 
	// Scores
	// 
	{
		const prev_scores = JSON.parse(ksys.db.module.read('scores.fball')) || {'1':[], '2':[]};
		for (let team of ['1', '2']){
			for (let score of prev_scores[team]){
				// kbmodules.football_standard.playerbase.global_index[score.namecode].score(team, score.time)
				kbmodules.football_standard.push_score(team, score.surname, score.time)
			}
		}
	}

	kbmodules.football_standard.resync_red_penalty_cards()

}
// kbmodules.football_standard.load()


kbmodules.football_standard.postload = function(){
	// picking the player item up
	document.addEventListener('mousedown', tr_event => {

		// the item can be picked both from the filter menu and field
		const tgt = event.target.closest('.team_layout .generic_player_item')
		// also make sure it doesn't trigger on anything but LMB
		if (tgt && tr_event.which == 1){
			$('body').blur();
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

			// kbmodules.football_standard.save_last_layout()
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


// update vis feedback of all the logos and team names
// and write the logo path to the attributes of the team def table
// important todo: make teams use dict system and not this retarded on-demand manual garbage
kbmodules.football_standard.upd_vis_feedback = function(){
	// todo: this is rather stupid

	// TEAM 1
	let team_logo = $('#team1_def [prmname="team_logo"] input')[0];
	if (team_logo.files[0]){
		$('#team1_def').attr('logo_path', team_logo.files[0].path);
		team_logo = team_logo.files[0].path;
	}else{
		team_logo = null;
	}
	$('[vis_feedback="team1_logo"]').attr('src', team_logo || $('#team1_def').attr('logo_path'));
	$('[vis_feedback="team1_name"]').text($('#team1_def [prmname="team_name"] input').val().upper());
	team_logo = null;


	// TEAM 2
	team_logo = $('#team2_def [prmname="team_logo"] input')[0];
	if (team_logo.files[0]){
		$('#team2_def').attr('logo_path', team_logo.files[0].path);
		team_logo = team_logo.files[0].path;
	}else{
		team_logo = null;
	}
	$('[vis_feedback="team2_logo"]').attr('src', team_logo || $('#team2_def').attr('logo_path'));
	$('[vis_feedback="team2_name"]').text($('#team2_def [prmname="team_name"] input').val().upper());
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
		const _self = this;

		const ctrl_elem = $(`
			<div class="player_item" namecode="${this.namecode}">
				<div class="player_param" prmname="pname">
					<div class="player_param_label">Name</div>
					<input type="text" class="player_param_input" value="${this.name}">
				</div>
				<div class="player_param" prmname="psurname">
					<div class="player_param_label">Surname</div>
					<input type="text" class="player_param_input" value="${ksys.util.str_ops.format(this.surname, '2')}">
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
			_self.name = evt.target.value;
			_self._update_namecode(true);
		}
		ctrl_elem.find('[prmname="psurname"] input')[0].onchange = function(evt){
			// print('FUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUU', _self, evt.target.value)
			_self.surname = evt.target.value;
			_self._update_namecode(true);
		}
		ctrl_elem.find('[prmname="number"] input')[0].onchange = function(evt){
			_self.number = evt.target.value;
			_self._update_namecode(true);
		}
		ctrl_elem[0].oncontextmenu = function(evt){
			if (evt.altKey){
				_self.kill()
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
		const reserve_or_main = this.is_reserve ? 'reserve' : 'main';

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
		tgt_elems.find('.player_surname').text(ksys.util.str_ops.format(this.surname, '2'))

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
				<div class="player_surname">${ksys.util.str_ops.format(this.surname, '2')}</div>
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

	async penalty_card(_card){
		const _ctx = ksys.context.module.cache;

		const card_selection = {
			'yellow': 'yellow_card',
			'red':    'red_card',
		}
		const card = kbmodules.football_standard.titles[card_selection[_card]];

		kbmodules.football_standard.next_card_out = card;

		await card.set_text(
			'player_name',
			`${this.number} ${ksys.util.str_ops.format(this.surname, _ctx.players_format, _ctx.players_translit)}`,
		)
		await card.set_img_src('club_logo', this.get_team_logo())
		
		// disable buttons
		ksys.btns.toggle({
			'red_card':    false,
			'yellow_card': false,
		})

		if (_card == 'red'){
			ksys.context.module.prm(`team${this.team.num}_rcard_count`, (`team${this.team.num}_rcard_count` in _ctx) ? (_ctx[`team${this.team.num}_rcard_count`] += 1).clamp(0, 3) : 1)
			kbmodules.football_standard.resync_red_penalty_cards()
		}

		// show the card in vmix
		await card.overlay_in(1)

		// let them hang for 7 seconds
		await ksys.util.sleep(7000)
		// hide card
		await kbmodules.football_standard.hide_card()

		// re-enable buttons
		ksys.btns.toggle({
			'red_card':    true,
			'yellow_card': true,
		})

	}
}


// ================================
//        Text formatting
// ================================


kbmodules.football_standard.resync_red_penalty_cards = function(){
	const _ctx = ksys.context.module.cache;
	// print('Resyncing cards...')
	for (let team of ['1', '2']){

		const team_card_count = _ctx[`team${team}_rcard_count`]
		if (!(`team${team}_rcard_count` in _ctx)){continue};

		// print('WTF', `team${team}_rcard_count`)

		$(`#red_card_counter_team${team} .red_card_counter_pool img`).removeClass('rcard_shown')
		for (let card of range(1, 4)){
			if (card > team_card_count){
				kbmodules.football_standard.titles.timer.toggle_img(`rcard_${team}_${card}`, false)
				continue
			}
			// print('Syncing card', card)
			$(`#red_card_counter_team${team} .red_card_counter_pool img.rcard${card}`).addClass('rcard_shown')
			kbmodules.football_standard.titles.timer.toggle_img(`rcard_${team}_${card}`, true)
		}
	}
}

kbmodules.football_standard.mod_penalty_red_card = function(event, team, subtr=false){

	if (!event.altKey){return};

	const _ctx = ksys.context.module.cache;

	if (subtr){
		ksys.context.module.prm(`team${team}_rcard_count`, (`team${team}_rcard_count` in _ctx) ? (_ctx[`team${team}_rcard_count`] -= 1).clamp(0, 3) : 0)
	}else{
		ksys.context.module.prm(`team${team}_rcard_count`, (`team${team}_rcard_count` in _ctx) ? (_ctx[`team${team}_rcard_count`] += 1).clamp(0, 3) : 0)
	}

	print(ksys.context.module.cache.team1_rcard_count, ksys.context.module.cache.team2_rcard_count)

	kbmodules.football_standard.resync_red_penalty_cards()
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
		'player_color': $(`${team_def} .team_base_params [prmname="team_player_color"] .tcolour.col_selected`).attr('tc') || '000000',
		'gk_color': $(`${team_def} .team_base_params [prmname="team_gk_color"] .tcolour.col_selected`).attr('tc') || '000000',
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

	// 
	// update index
	// 

	// Read existing index file, if any
	const index_file = ksys.db.module.read('teams_index.index')
	// Eval file into json
	// If file doesn't exist - the db reader would return "null" which is a valid json
	// and evaluates into false value
	// important todo: Fuck
	const team_presets_index = JSON.parse(index_file) || [];

	// If index doesn't exist - create one. Empty
	if (!index_file){
		ksys.db.module.write('teams_index.index', JSON.stringify([], null, 4))
	}

	// If index doesn't contain the current team - add it
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
	tgt_team.find('.team_base_params [prmname="team_name"] input')[0].value = team_preset.club_name.upper();
	// Set team coach name input value
	tgt_team.find('.team_base_params [prmname="team_coach"] input')[0].value = team_preset.coach.upper();


	tgt_team.find('.team_base_params .tcolour').removeClass('col_selected');
	// Set players colour
	tgt_team.find(`.team_base_params [prmname="team_player_color"] .tcolour[tc="${team_preset.player_color}"]`).addClass('col_selected');
	// Set goalkeeper colour
	tgt_team.find(`.team_base_params [prmname="team_gk_color"] .tcolour[tc="${team_preset.gk_color}"]`).addClass('col_selected');


	// empty both player pools of this team
	tgt_team.find('.player_list .list_pool').empty()
	// Set logo attribute of the current team
	tgt_team.attr('logo_path', team_preset.logo)
	// team shorthand
	// todo: there's option chaining in latest chromium
	tgt_team.find('.team_base_params [prmname="club_shorthand"] input')[0].value = (team_preset.shorthand || '').upper();

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
	ksys.context.module.prm('last_team_def1', $('#team1_def [prmname="team_name"] input')[0].value.lower(), false)
	ksys.context.module.prm('last_team_def2', $('#team2_def [prmname="team_name"] input')[0].value.lower())
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
	console.time('Saved laout')
	const layout = {
		'team1': {},
		'team2': {},
	};

	const playerbase_keyed = kbmodules.football_standard.playerbase;

	for (let team of [1, 2]){
		for (let player of document.querySelectorAll(`#team${team}_layout .ftfield .player_slot`)){
			const player_info = player.querySelector('.generic_player_item')
			if (!player_info){
				layout[`team${team}`][player.getAttribute('t_num')] = null
				continue
			}
			const player_item = playerbase_keyed[team].both[player_info.getAttribute('namecode')]
			layout[`team${team}`][player.getAttribute('t_num')] = {
				'player_num': player_item.number,
				'name':       player_item.name,
				'surname':    player_item.surname,
				'namecode':   player_item.namecode,
			}
		}
	}

	ksys.db.module.write('last_layout.lol', JSON.stringify(layout, null, 4))

	// print('saved last layout')
	console.timeEnd('Saved laout')
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

		// if (reserve_demand && (!player.is_reserve || player_is_on_field)){
		if (reserve_demand && !player.is_reserve){
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
	kbmodules.football_standard.shadow_swap()

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

	await kbmodules.football_standard.titles.replacement_out.set_text('player_name', leaving_player_object.number + ' ' + leaving_player_object.surname)
	await kbmodules.football_standard.titles.replacement_out.set_img_src('club_logo', leaving_player_object.get_team_logo())
	await kbmodules.football_standard.titles.replacement_in.set_text('player_name', incoming_player_object.number + ' ' + incoming_player_object.surname)
	await kbmodules.football_standard.titles.replacement_in.set_img_src('club_logo', incoming_player_object.get_team_logo())

	ksys.btns.pool.exec_replacement_sequence.toggle(false)

	await kbmodules.football_standard.titles.replacement_out.overlay_in(1)
	await ksys.util.sleep(5000)
	await kbmodules.football_standard.titles.replacement_in.overlay_in(1)
	await ksys.util.sleep(5000)
	await kbmodules.football_standard.titles.replacement_in.overlay_out(1)

	ksys.btns.pool.exec_replacement_sequence.toggle(true)
}


kbmodules.football_standard.select_player_for_punishment = function(event){
	$('#card_player_filter_pool .generic_player_item').removeClass('selected_to_punish')
	event.target.closest('.generic_player_item').classList.add('selected_to_punish')
}

kbmodules.football_standard.show_card = async function(card){
	const selected_player = document.querySelector('#card_player_filter .generic_player_item.selected_to_punish')
	if (selected_player){
		const player_object = kbmodules.football_standard.playerbase.global_index[selected_player.getAttribute('namecode')].penalty_card(card);
	}
}

kbmodules.football_standard.hide_card = async function(){
	// disable buttons
	ksys.btns.toggle({
		'red_card':    false,
		'yellow_card': false,
		'kill_card':   false,
	})

	if (kbmodules.football_standard.next_card_out){
		print('Turning off', kbmodules.football_standard.next_card_out.title_name)
		await kbmodules.football_standard.next_card_out.overlay_out(1)
	}

	// re-enable buttons
	ksys.btns.toggle({
		'red_card':    true,
		'yellow_card': true,
		'kill_card':   true,
	})
}


kbmodules.football_standard.upd_player_layout = async function(team){

	const _ctx = ksys.context.module.cache;

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

	// player thshirt colour
	const player_tshirt_col =
	Path('C:\\custom\\vmix_assets\\t_shirts\\tshirts')
	.join(`${$(team_def).find('[prmname="team_player_color"] .tcolour.col_selected').attr('tc') || 'ffffff'}.png`);

	for (let player_slot of document.querySelectorAll(`${team_field} .ftfield .player_slot`)){
		const player_item = player_slot.querySelector('.generic_player_item');
		const slot_has_player = !!player_item;
		const cell_id = player_slot.getAttribute('t_num');

		// tshirt colour
		await title.set_img_src(`plr_bg_${cell_id}`, str(player_tshirt_col))
		
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
			await title.set_text(`plr_name_${cell_id}`, ksys.util.str_ops.format(player_object.surname, _ctx.players_format, _ctx.players_translit));
		}
	}

	// goalkeeper tshirt colour
	const gk_tshirt_col =
	Path('C:\\custom\\vmix_assets\\t_shirts\\tshirts')
	.join(`${$(team_def).find('[prmname="team_gk_color"] .tcolour.col_selected').attr('tc') || 'ffffff'}.png`);
	await title.set_img_src(`plr_bg_8_5`, str(gk_tshirt_col))



	// 
	// main player list
	// 

	// 
	// I sincerely fucking hate javascript retarded fucking useless pointless stupid garbage
	// Go fucking die in a car crash and then in a fire
	// (fuck .map, especially)
	// 
	const player_list_sorted = [];
	// for (let player in kbmodules.football_standard.playerbase[team].main){
	for (let player of kbmodules.football_standard.teams[team].player_pool_main.querySelectorAll('.player_item')){
		player = kbmodules.football_standard.playerbase[team].main[player.getAttribute('namecode')]
		// player_list_sorted.push(kbmodules.football_standard.playerbase[team].main[player])
		player_list_sorted.push(player)
	}
	// player_list_sorted.sort(function(a, b){
	// 	return int(a.number) - int(b.number)
	// })
	const player_list = [];
	const player_nums = [];
	for (let player of player_list_sorted){
		player_nums.push(player.number)
		player_list.push(ksys.util.str_ops.format(player.surname, _ctx.players_format, _ctx.players_translit))
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
		reserve_list.push(ksys.util.str_ops.format(player.surname, _ctx.players_format, _ctx.players_translit))
	}
	// names
	await title.set_text('reserve_list', reserve_list.join('\n'))
	// numbers
	await title.set_text('reserve_list_nm', reserve_nums.join('\n'))



	// 
	// coach
	// 
	await title.set_text(
		'coach_name',
		ksys.util.str_ops.format($(`${team_def} [prmname="team_coach"] input`).val(), _ctx.coach_format, _ctx.coach_translit)
	)

	// 
	// team name
	// 
	await title.set_text(
		'club_name',
		ksys.util.str_ops.format($(`${team_def} [prmname="team_name"] input`).val().upper(), _ctx.club_format, _ctx.club_translit)
	)

	// 
	// logo
	// 
	await title.set_img_src('club_logo', $(team_def).attr('logo_path'))
}


kbmodules.football_standard.show_field_layout = async function(team){
	const btn_pool = ksys.btns.pool;

	btn_pool.show_field_layout_command1.toggle(false)
	btn_pool.hide_field_layout_command1.toggle(false)
	btn_pool.show_field_layout_command2.toggle(false)
	btn_pool.hide_field_layout_command2.toggle(false)
	await kbmodules.football_standard.upd_player_layout(team)
	await kbmodules.football_standard.titles.team_layout.overlay_in(1)
	btn_pool.show_field_layout_command1.toggle(true)
	btn_pool.hide_field_layout_command1.toggle(true)
	btn_pool.show_field_layout_command2.toggle(true)
	btn_pool.hide_field_layout_command2.toggle(true)
}


kbmodules.football_standard.hide_field_layout = async function(team){
	const btn_pool = ksys.btns.pool;

	btn_pool.show_field_layout_command1.toggle(false)
	btn_pool.hide_field_layout_command1.toggle(false)
	btn_pool.show_field_layout_command2.toggle(false)
	btn_pool.hide_field_layout_command2.toggle(false)
	// await kbmodules.football_standard.upd_player_layout(team)
	await kbmodules.football_standard.titles.team_layout.overlay_out(1)
	btn_pool.show_field_layout_command1.toggle(true)
	btn_pool.hide_field_layout_command1.toggle(true)
	btn_pool.show_field_layout_command2.toggle(true)
	btn_pool.hide_field_layout_command2.toggle(true)
}


kbmodules.football_standard.save_vs_sublines = function(){
	ksys.context.module.prm('vs_title_bottom_upper_line', $('#vs_text_bottom_upper')[0].value, false)
	ksys.context.module.prm('vs_title_bottom_lower_line', $('#vs_text_bottom_lower')[0].value)
}


kbmodules.football_standard.show_vs_title = async function(){
	const _ctx = ksys.context.module.cache;
	ksys.btns.pool.show_splash.toggle(false)
	await kbmodules.football_standard.titles.splash.set_text('title_lower_top', $('#vs_text_bottom_upper').val())
	await kbmodules.football_standard.titles.splash.set_text('title_lower_bot', $('#vs_text_bottom_lower').val())

	await kbmodules.football_standard.titles.splash.set_img_src('logo_l', $('#team1_def').attr('logo_path'))
	await kbmodules.football_standard.titles.splash.set_img_src('logo_r', $('#team2_def').attr('logo_path'))

	await kbmodules.football_standard.titles.splash.set_text('club_name_l', ksys.util.str_ops.format($('#team1_def [prmname="team_name"] input').val(), _ctx.club_format, _ctx.club_translit))
	await kbmodules.football_standard.titles.splash.set_text('club_name_r', ksys.util.str_ops.format($('#team2_def [prmname="team_name"] input').val(), _ctx.club_format, _ctx.club_translit))

	await kbmodules.football_standard.titles.splash.overlay_in(1)

	ksys.btns.pool.show_splash.toggle(true)
}


kbmodules.football_standard.hide_vs_title = async function(){
	ksys.btns.pool.show_splash.toggle(false)
	ksys.btns.pool.hide_splash.toggle(false)
	await kbmodules.football_standard.titles.splash.overlay_out(1)
	ksys.btns.pool.show_splash.toggle(true)
	ksys.btns.pool.hide_splash.toggle(true)
}


kbmodules.football_standard.goal_score_on = async function(){
	const selected_player = document.querySelector('#card_player_filter .generic_player_item.selected_to_punish')

	if (!selected_player){return};

	const player_object = kbmodules.football_standard.playerbase.global_index[selected_player.getAttribute('namecode')]

	// register this goal
	kbmodules.football_standard.push_score(player_object.team.num, player_object.surname)

	await kbmodules.football_standard.titles.gscore.set_text('player_name', `${player_object.number} ${player_object.surname.toUpperCase()}`)
	await kbmodules.football_standard.titles.gscore.set_img_src('club_logo', player_object.get_team_logo())

	await kbmodules.football_standard.titles.timer.set_text('score_l', $(kbmodules.football_standard.teams[1].score_pool).find('.team_score_record').length)
	await kbmodules.football_standard.titles.timer.set_text('score_r', $(kbmodules.football_standard.teams[2].score_pool).find('.team_score_record').length)

	// disable buttons
	ksys.btns.pool.scored.toggle(false)

	await kbmodules.football_standard.titles.gscore.overlay_in(1)

	// hold for 7 seconds
	await ksys.util.sleep(7000)

	// hide title
	await kbmodules.football_standard.goal_score_off()

	// re-enable buttons
	ksys.btns.pool.scored.toggle(true)
}


kbmodules.football_standard.goal_score_off = async function(){
	ksys.btns.pool.scored.toggle(false)
	ksys.btns.pool.scored_off.toggle(false)

	await kbmodules.football_standard.titles.gscore.overlay_out(1)

	ksys.btns.pool.scored.toggle(true)
	ksys.btns.pool.scored_off.toggle(true)
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

	const _ctx = ksys.context.module.cache;

	ksys.btns.pool.show_coach_team1.toggle(false)
	ksys.btns.pool.hide_coach_team1.toggle(false)
	ksys.btns.pool.show_coach_team2.toggle(false)
	ksys.btns.pool.hide_coach_team2.toggle(false)

	await kbmodules.football_standard.titles.coach.set_text('name', ksys.util.str_ops.format($(`${teamdef} [prmname="team_coach"] input`)[0].value, _ctx.coach_format, _ctx.coach_translit))
	await kbmodules.football_standard.titles.coach.overlay_in(1)

	ksys.btns.pool.show_coach_team1.toggle(true)
	ksys.btns.pool.hide_coach_team1.toggle(true)
	ksys.btns.pool.show_coach_team2.toggle(true)
	ksys.btns.pool.hide_coach_team2.toggle(true)
}


kbmodules.football_standard.hide_coach = async function(){
	ksys.btns.pool.show_coach_team1.toggle(false)
	ksys.btns.pool.hide_coach_team1.toggle(false)
	ksys.btns.pool.show_coach_team2.toggle(false)
	ksys.btns.pool.hide_coach_team2.toggle(false)
	await kbmodules.football_standard.titles.coach.overlay_out(1)
	ksys.btns.pool.show_coach_team1.toggle(true)
	ksys.btns.pool.hide_coach_team1.toggle(true)
	ksys.btns.pool.show_coach_team2.toggle(true)
	ksys.btns.pool.hide_coach_team2.toggle(true)
}


kbmodules.football_standard.timer_callback = function(tick){
	const minutes = Math.floor(tick.global / 60)
	const seconds = tick.global - (60*minutes)
	kbmodules.football_standard.titles.timer.set_text('base_ticker', `${str(minutes).zfill(2)}:${str(seconds).zfill(2)}`)
}


kbmodules.football_standard.extra_timer_callback = function(tick){
	const minutes = Math.floor(tick.global / 60)
	const seconds = tick.global - (60*minutes)
	kbmodules.football_standard.titles.timer.set_text('extra_ticker', `${str(minutes).zfill(2)}:${str(seconds).zfill(2)}`)
}




kbmodules.football_standard.start_base_timer = async function(rnum){
	if (kbmodules.football_standard.base_counter){
		kbmodules.football_standard.base_counter.force_kill()
		kbmodules.football_standard.base_counter = null;
	}

	await kbmodules.football_standard.titles.timer.set_text('extra_ticker', '00:00');

	ksys.context.module.prm('round_num', rnum)

	const dur = 45;

	await kbmodules.football_standard.titles.timer.set_text('base_ticker', (rnum == 1) ? '00:00' : '45:00');

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
	.then(function(_ticker) {
		// turn off automatically
		const pre_killed = _ticker.killed;
		if (_ticker){
			_ticker.force_kill()
			if (document.querySelector('#timer_ctrl_additional input').value.trim() && !pre_killed){
				kbmodules.football_standard.launch_extra_time()
			}
		}
	})

	// print(kbmodules.football_standard.base_counter)

}


kbmodules.football_standard.main_timer_vis = async function(state){
	const title = kbmodules.football_standard.titles.timer;

	if (state == true){
		// player_color_picker
		// gk_color_picker

		// TEAM COLOR L
		const team_col_l =
		Path('C:\\custom\\vmix_assets\\t_shirts\\overlay')
		.join(`${$(kbmodules.football_standard.teams[1].player_color_picker).find('.tcolour.col_selected').attr('tc') || 'ffffff'}_l.png`);
		await title.set_img_src(`team_col_l`, str(team_col_l))
		// TEAM COLOR R
		const team_col_r =
		Path('C:\\custom\\vmix_assets\\t_shirts\\overlay')
		.join(`${$(kbmodules.football_standard.teams[2].player_color_picker).find('.tcolour.col_selected').attr('tc') || 'ffffff'}_r.png`);
		await title.set_img_src(`team_col_r`, str(team_col_r))

		await title.set_text('command_l', kbmodules.football_standard.teams[1].shorthand.value)
		await title.set_text('command_r', kbmodules.football_standard.teams[2].shorthand.value)

		await title.set_text('score_l', $(kbmodules.football_standard.teams[1].score_pool).find('.team_score_record').length)
		await title.set_text('score_r', $(kbmodules.football_standard.teams[2].score_pool).find('.team_score_record').length)

		title.overlay_in(2)
	}
	if (state == false){
		title.overlay_out(2)
	}
}

kbmodules.football_standard.extra_time_vis = async function(state){
	if (state == true){
		kbmodules.football_standard.titles.timer.toggle_text('time_added', true)
		kbmodules.football_standard.titles.timer.toggle_text('extra_ticker', true)
		kbmodules.football_standard.titles.timer.toggle_img('extra_time_bg', true)
	}
	if (state == false){
		kbmodules.football_standard.titles.timer.toggle_text('time_added', false)
		kbmodules.football_standard.titles.timer.toggle_text('extra_ticker', false)
		kbmodules.football_standard.titles.timer.toggle_img('extra_time_bg', false)
	}
}


kbmodules.football_standard.launch_extra_time = async function(){
	if (kbmodules.football_standard.extra_counter){
		kbmodules.football_standard.extra_counter.force_kill()
		kbmodules.football_standard.extra_counter = null;
	}

	const _extra_amount = $('#timer_ctrl_additional input').val()
	if (!_extra_amount){
		return
	}
	const extra_amount = eval(_extra_amount);
	if (!extra_amount){
		return
	}

	kbmodules.football_standard.extra_counter = ksys.ticker.spawn({
		'duration': extra_amount*60,
		'name': `gigas_timer${1}`,
		'infinite': true,
		'reversed': false,
		'callback': kbmodules.football_standard.extra_timer_callback,
		'wait': true,
	})

	kbmodules.football_standard.extra_counter.fire()
	.then(function(_ticker) {
		// turn off automatically
		if (_ticker){
			_ticker.force_kill()
		}
	})

	print('EXTRA AMOUNT?!', extra_amount)
	await kbmodules.football_standard.titles.timer.set_text('extra_ticker', '00:00');
	await kbmodules.football_standard.titles.timer.set_text('time_added', `+${Math.floor(extra_amount/1)}`)
	await kbmodules.football_standard.titles.timer.toggle_text('time_added', true)
	await kbmodules.football_standard.titles.timer.toggle_img('extra_time_bg', true)
	await kbmodules.football_standard.titles.timer.toggle_text('extra_ticker', true)
}



kbmodules.football_standard.score_sum_vis = async function(state){
	if (state == true){

		const nums_l = [];
		const names_l = [];
		for (let player of document.querySelectorAll('#score_ctrl_team1 .score_ctrl_table .team_score_record')){
			nums_l.push(player.querySelector('.score_record_time').value + `'`)
			names_l.push(player.querySelector('.score_record_player').value)
		}


		const nums_r = [];
		const names_r = [];
		for (let player of document.querySelectorAll('#score_ctrl_team2 .score_ctrl_table .team_score_record')){
			nums_r.push(player.querySelector('.score_record_time').value + `'`)
			names_r.push(player.querySelector('.score_record_player').value)
		}



		// composite
		const score_amt_l = document.querySelectorAll('#score_ctrl_team1 .score_ctrl_table .team_score_record').length
		const score_amt_r = document.querySelectorAll('#score_ctrl_team2 .score_ctrl_table .team_score_record').length
		await kbmodules.football_standard.titles.final_scores.set_text('score_sum', `${score_amt_l} : ${score_amt_r}`)

		// Show the appropriate amount of fields
		await kbmodules.football_standard.titles.final_scores.toggle_img('anim_full', false)
		await kbmodules.football_standard.titles.final_scores.toggle_img('anim_half', false)
		if (score_amt_l > 2 || score_amt_r > 2){
			await kbmodules.football_standard.titles.final_scores.toggle_img('anim_full', true)
		}else{
			names_r.unshift(' ')
			names_r.unshift(' ')
			names_l.unshift(' ')
			names_l.unshift(' ')

			nums_r.unshift(' ')
			nums_r.unshift(' ')
			nums_l.unshift(' ')
			nums_l.unshift(' ')
			await kbmodules.football_standard.titles.final_scores.toggle_img('anim_half', true)
		}

		// Set the numbers/surnames
		await kbmodules.football_standard.titles.final_scores.set_text('scores_r', names_r.join('\n'))
		await kbmodules.football_standard.titles.final_scores.set_text('scores_r_num', nums_r.join('\n'))

		await kbmodules.football_standard.titles.final_scores.set_text('scores_l', names_l.join('\n'))
		await kbmodules.football_standard.titles.final_scores.set_text('scores_l_num', nums_l.join('\n'))



		// team name LEFT
		await kbmodules.football_standard.titles.final_scores.set_text('team_name_l', kbmodules.football_standard.teams.one.team_name.value.upper())
		// team logo LEFT
		await kbmodules.football_standard.titles.final_scores.set_img_src('team_logo_l', kbmodules.football_standard.teams.one.logo())

		// team name RIGHT
		await kbmodules.football_standard.titles.final_scores.set_text('team_name_r', kbmodules.football_standard.teams.two.team_name.value.upper())
		// team logo RIGHT
		await kbmodules.football_standard.titles.final_scores.set_img_src('team_logo_r', kbmodules.football_standard.teams.two.logo())

		// show the title
		await kbmodules.football_standard.titles.final_scores.overlay_in(1)
	}

	if (state == false){
		await kbmodules.football_standard.titles.final_scores.overlay_out(1)
	}
}

kbmodules.football_standard.update_scores = function(){
	const score_l = document.querySelectorAll('#score_ctrl_team1 .score_ctrl_table .team_score_record').length
	const score_r = document.querySelectorAll('#score_ctrl_team2 .score_ctrl_table .team_score_record').length
	kbmodules.football_standard.titles.timer.set_text('score_l', score_l)
	kbmodules.football_standard.titles.timer.set_text('score_r', score_r)

	const score_map = {
		'1': [],
		'2': [],
	};

	for (let team of ['1', '2']){
		for (let goal of document.querySelectorAll(`#score_ctrl_team${team} .score_ctrl_table .team_score_record`)){
			score_map[team].push({
				'time': goal.querySelector('.score_record_time').value,
				'surname': goal.querySelector('.score_record_player').value,
				'namecode': goal.getAttribute('namecode'),
			})
		}
	}

	ksys.db.module.write('scores.fball', JSON.stringify(score_map, null, 4))

}

kbmodules.football_standard.push_score = function(team, surname, time=null){
	// print(
	// 	'kys',
	// 	time,
	// 	kbmodules.football_standard?.base_counter?.tick?.global,
	// 	kbmodules.football_standard?.extra_counter?.tick?.global,
	// )
	const calc_time = Math.ceil(
		(
			(kbmodules.football_standard?.base_counter?.tick?.global || 1)
			+
			(kbmodules.football_standard?.extra_counter?.tick?.global || 1)
		)
		/
		60
	)
	const score_elem = $(`
		<div class="team_score_record">
			<input onchange="kbmodules.football_standard.update_scores()" value="${time || calc_time}" type="text" class="score_record_time">
			<input onchange="kbmodules.football_standard.update_scores()" value="${surname}" type="text" class="score_record_player">
		</div>
	`)

	score_elem[0].oncontextmenu = function(event){
		if (event.altKey){
			event.target.closest('.team_score_record').remove()
			kbmodules.football_standard.update_scores()
		}
	}

	$(`#score_ctrl_team${team} .score_ctrl_table`)[0].append(score_elem[0])

	kbmodules.football_standard.update_scores()
}


kbmodules.football_standard.add_score = function(team){
	const selected_player = $('#score_ctrl_player_search_pool .generic_player_item.selected_to_punish').attr('namecode')
	if (!selected_player){return};
	const player_info = kbmodules.football_standard.playerbase.global_index[selected_player]
	kbmodules.football_standard.push_score(team, player_info.surname)
}


kbmodules.football_standard.shadow_swap = async function(){
	const leaving_player = $('#replacement .replacement_list.replacement_leaving .selected_replacement')
	const incoming_player = $('#replacement .replacement_list.replacement_incoming .selected_replacement')
	if (!leaving_player[0] || !incoming_player[0]){
		return
	}
	const new_player_elem = kbmodules.football_standard.playerbase.global_index[incoming_player.attr('namecode')].get_generic_player_item(true)
	$(`.ftfield [namecode="${leaving_player.attr('namecode')}"]`).replaceWith(new_player_elem)
}


kbmodules.football_standard.filter_players_for_score = function(event){

	const pool = document.querySelector('#score_ctrl_player_search_pool')
	// Query from the text input
	const tquery = event.target.value.toLowerCase();

	// Clear the filtered pool
	pool.innerHTML = '';

	for (let player_index in kbmodules.football_standard.playerbase.global_index){
		const player = kbmodules.football_standard.playerbase.global_index[player_index]

		if (player.namecode.includes(tquery)){
			const player_elem = player.get_generic_player_item(false)
			player_elem.onclick = function(event){
				$(event.target).closest('#score_ctrl_player_search_pool').find('.generic_player_item').removeClass('selected_to_punish')
				event.target.closest('.generic_player_item').classList.add('selected_to_punish')
			}
			pool.append(player_elem)
		}
	}
}


kbmodules.football_standard.resume_main_timer_from_offset = function(event){

	if (kbmodules.football_standard.base_counter){
		kbmodules.football_standard.base_counter.force_kill()
		kbmodules.football_standard.base_counter = null;
	}

	const rnum = int(ksys.context.module.prm('round_num')) || 1;

	const offs = eval(document.querySelector('#timer_ctrl_base_resume input').value);

	const dur = (45*60);

	kbmodules.football_standard.base_counter = ksys.ticker.spawn({
		// 'duration': (rnum == 2) ? ((dur*2)+1) : (dur+1),
		'duration': (dur-(offs%dur))+1,
		'name': `giga_timer_offs${rnum}`,
		// 'offset': (rnum == 2) ? (dur+offs) : (0+offs),
		'offset': offs,
		'infinite': false,
		'reversed': false,
		'callback': kbmodules.football_standard.timer_callback,
		'wait': true,
	})

	kbmodules.football_standard.base_counter.fire()
	.then(function(_ticker) {
		// turn off automatically
		if (_ticker){
			_ticker.force_kill()
			if (document.querySelector('#timer_ctrl_additional input').value.trim()){
				kbmodules.football_standard.launch_extra_time()
			}
		}
	})

	// print(kbmodules.football_standard.base_counter)
}


kbmodules.football_standard.stop_extra_time = function(){
	kbmodules.football_standard?.extra_counter?.force_kill()
}





