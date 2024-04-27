
if(!kbmodules){kbmodules={}};

if(!kbmodules.football_standard){kbmodules.football_standard={}};


/*
Previous system was a total embarrassment and offense for real programming.

Long story short, previous system indexed players by a string composed
of the players' name + surname + number.
This could totally lead to collisions when creating player lists from
scratch. It's completely unreliable and utterly fucking retarded.

The new system doesn't has any of these problems.
It may or may not be slower because of that, but who cares.

The new system utilizes registers pointing to JS objects.
This introduces a risk of redundant data, but garbage collection
is very simple in this situation and the only sacrifice is a few
milliseconds lost due to all the iterations needed for registers.


+------------------+
| Home/Enemy Club  |
+-----+------------+
      |
      +---+
          |
          v
        +------------+
    +-->|    Club    |
    |   +------------+
    |         |
    |         |     +------------------+
    |         +-----+    Club Info     |
    |         |     +------------------+
    |         |
    |         |     +-----------------------------------+
    |         +-----+ Visual header reference registry  |
    |         |     +-----------------------------------+
    |         |
    |         |     +----------------+
    |         +-----+ Control Panel  |
    |         |     +--------+-------+
    |         |              |
    |         |              |
    |         |              |   +------------------+
    |         |              +---+ Player List DOM  |
    |         |                  +---------+--------+
    |         |                            |
    |         |                            |
    |         |                            |   +------------------+
    |         |                            +---+  Player cfg DOM  |
    |         |                            |   +---------+--------+
    |         |                            |             |
    |         |                            ...           |
    |         |                                          |
    |         |     +------------------+                 |
    |         +-----+ Player registry  |                 |
    |               +--------+---------+                 |
    |                        |            +--------------+
    |                        |            |  +----------------------------------------------+
    |                        |            |  |                                              |
    |                        |            v  v                                              |
    |                        |     +------------+                                           |
    |                        +-----+   Player   |<--------------------------------------+   |
    |                              +------+-----+                                       |   |
    |                                     |                                             |   |
    |                                     |   +------------+                            |   |
    |                                     +---+    Info    |                            |   |
    |                                     |   +------------+                            |   |
    |                                     |                                             |   |
    |                                     |   +-----------------------------------+     |   |
    |                                     +---+ DOM element reference registry    |     |   |
    |                                     |   +-----------------------------------+     |   |
    |                                     |                             v               |   |
    |                                     |   +---------------------+   |               |   |
    |                                     +-->| List item DOM elem  |<--+               ^   |
    |                                     |   +---------------------+                   |   |
    |                                     |                                             |   |
    |                                     |   +----------------+                        |   |
    |                                     +-->| cfg DOM elem   |                        |   |
    |                                         +----------------+                        |   |
    |                                                                                   |   |
    |   +-------------+                                                                 |   ^
    +--<| Team Lineup |                                                                 |   |
        +------+------+                                                                 |   |
               |                                                                        |   |
               |   +----------------+                                                   |   |
               +---+   Main List    |                                                   |   |
               |   +--------+-------+                                                   |   |
               |            |                                                           |   |
               |            |   +----------------+                                      |   |
               |            +---+   List entry   |>-------------------------------------+   |
               |            |   +----------------+                                          |
               |            |                                                               |
               |            ...                                                             |
               |                                                                            |
               |                                                                            |
               |   +----------------+                                                       |
               +---+ Reserve List   |                                                       |
               |   +--------+-------+                                                       |
               |            |                                                               |
               |            |   +----------------+                                          |
               |            +---+   List entry   |>-----------------------------------------+
               |            |   +----------------+
               |            |
               |            ...
               |
               |    +----------------+
               +----+ Control panel  |
                    +----------------+


*/


// todo: is it fine this is here ?
kbmodules.football_standard.timer_fset = {
	'at_at': {},
	'builtin': {},
	// todo: move this to the sys level
	'first_load': true,
};

kbmodules.football_standard.ticker_time = {
	'base':{
		'minutes': 0,
		'seconds': 0,
	},
	'extra':{
		'minutes': 0,
		'seconds': 0,
	},
};

kbmodules.football_standard.load = async function(){
	const mctx = ksys.context.module;

	kbmodules.football_standard.resource_index = {
		available_colors: [
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
		],

		// Club currently being edited
		club_ctrl: null,


		side: {
			home: {
				club: null,
				lineup: null,
				field: null,

				substitute: {
					leaving: null,
					inbound: null,
				},
			},
			guest: {
				club: null,
				lineup: null,
				field: null,

				substitute: {
					leaving: null,
					inbound: null,
				},
			}
		},

		home_club: null,
		guest_club: null,

		home_lineup: null,
		guest_lineup: null,

		home_field: null,
		guest_field: null,

		card_player_filter: null,

		card_manager: null,

		score_manager: null,
	};

	// --------------------------
	// Index titles
	// --------------------------
	{
		kbmodules.football_standard.titles = {
			// field layout
			'team_layout': new vmix.title({
				'title_name': 'command_layout.gtzip',
				'default_overlay': 2,
				'timings': {
					'fps': 25,
					'frames_in': 50,
					'margin': 100,
				},
			}),


			// cards
			'yellow_card': new vmix.title({
				'title_name': 'yellow_card.gtzip',
				'default_overlay': 2,
				'timings': {
					'fps': 25,
					'frames_in': 72,
					'margin': 100,
				}
			}),
			'red_card': new vmix.title({
				'title_name': 'red_card.gtzip',
				'default_overlay': 2,
				'timings': {
					'fps': 25,
					'frames_in': 20,
					'margin': 100,
				}
			}),
			'ycbr_card': new vmix.title({
				'title_name': 'ycbr.gtzip',
				'default_overlay': 2,
				'timings': {
					'fps': 25,
					'frames_in': 36,
					'margin': 100,
				}
			}),

			// replacements
			'replacement_out': new vmix.title({
				'title_name': 'replacement_leaving.gtzip',
				'default_overlay': 2,
				'timings': {
					'fps': 25,
					'frames_in': 35,
					'margin': 100,
				}
			}),
			'replacement_in': new vmix.title({
				'title_name': 'replacement_incoming.gtzip',
				'default_overlay': 2,
				'timings': {
					'fps': 25,
					'frames_in': 42,
					'margin': 100,
				}
			}),

			'replacement_seq': new vmix.title({
				'title_name': 'replacement_seq.gtzip',
				'default_overlay': 2,
				'timings': {
					'fps': 25,
					'frames_in': 42,
					'margin': 100,
				}
			}),


			// VS
			'splash': new vmix.title({
				'title_name': 'splash.gtzip',
				'default_overlay': 2,
				'timings': {
					'fps': 25,
					'frames_in': 37,
					'frames_out': 41,
					'margin': 100,
				}
			}),

			// Goal / score
			'gscore': new vmix.title({
				'title_name': 'scored.gtzip',
				'default_overlay': 2,
				'timings': {
					'fps': 25,
					'frames_in': 36,
					'margin': 100,
				}
			}),

			// Coach l4d2
			'coach': new vmix.title({
				'title_name': 'coach.gtzip',
				'default_overlay': 2,
				'timings': {
					'fps': 25,
					'frames_in': 26,
					'margin': 100,
				}
			}),

			// Commenter
			'commenter': new vmix.title({
				'title_name': 'commenter.gtzip',
				'default_overlay': 2,
				'timings': {
					'fps': 25,
					'frames_in': 26,
					'margin': 100,
				}
			}),

			// Timer and scores
			'timer': new vmix.title({
				'title_name': 'score_and_time.gtzip',
				'default_overlay': 1,
				'timings': {
					'fps': 25,
					'frames_in': 23,
					'margin': 100,
				}
			}),

			// Composed scores
			'final_scores': new vmix.title({
				'title_name': 'final_scores.gtzip',
				'default_overlay': 2,
				'timings': {
					'fps': 25,
					'frames_in': 59,
					'margin': 100,
				}
			}),

			// Statistics
			'stats': new vmix.title({
				'title_name': 'stats.gtzip',
				'default_overlay': 2,
				'timings': {
					'fps': 10,
					'frames_in': 30,
					'frames_out': 10,
					'margin': 100,
				}
			}),
		};
	}

	// --------------------------
	// Declare global objects
	// --------------------------
	{
		// club selector dropdowns
		kbmodules.football_standard.resource_index.club_selector_dropdown = new kbmodules.football_standard.ClubSelectorDropdown();

		// Card/goal player picker
		kbmodules.football_standard.resource_index.card_player_filter = new kbmodules.football_standard.PlayerPicker(
			[[]],
			function(){return true},
			function(list_dom, player_class){
				const card_manager = kbmodules.football_standard.resource_index.card_manager;

				list_dom.onclick = function(){
					card_manager.eval_button_states(card_manager)
				}

				card_manager.redraw_card_vis_feedback_in_list_item(
					card_manager,
					list_dom.elem,
					player_class
				)
			}
		)

		kbmodules.football_standard.resource_index.card_manager = new kbmodules.football_standard.CardManager()

		// Create substitutes
		for (const side of ['home', 'guest']){
			for (const rtype of ['leaving', 'inbound']){
				kbmodules.football_standard.resource_index.side[side].substitute[rtype] = 
				new kbmodules.football_standard.PlayerPicker(
					[[]],
					function(){return true},
					function(list_dom){
						list_dom.onclick = function(){
							const opposite_side = (side == 'home') ? 'guest' : 'home';
							kbmodules.football_standard.resource_index.side[opposite_side].substitute.leaving.reset_selection()
							kbmodules.football_standard.resource_index.side[opposite_side].substitute.inbound.reset_selection()
						}
					}
				)

				$(`#replacement_teams .replacement_team[${side}] .replacement_list[${rtype}]`)
				.append(kbmodules.football_standard.resource_index.side[side].substitute[rtype].box)
			}
		}

		// create score manager
		kbmodules.football_standard.resource_index.score_manager = new kbmodules.football_standard.ScoreManager()
	}

	// --------------------------
	// Append some global objects to the page
	// --------------------------
	{
		// club selector dropdown in the club control global
		$('#load_existing_club_dropdown label').append(
			kbmodules.football_standard.resource_index.club_selector_dropdown.dropdown_elem(
				function(evt){
					kbmodules.football_standard.load_club_by_name(evt.target.value)
				}
			)
		);

		// Home club lineup selector in the lineup ctrl
		$('home-club-selector').append(
			kbmodules.football_standard.resource_index.club_selector_dropdown.dropdown_elem(
				function(evt){
					kbmodules.football_standard.create_club_lineup('home', evt.target.value);

					// todo: is this the right place for this?
					// Trigger lineup save
					kbmodules.football_standard.global_save({'lineup_lists': true})
				}
			)
		);

		// Guest club lineup selector in the lineup ctrl
		$('guest-club-selector').append(
			kbmodules.football_standard.resource_index.club_selector_dropdown.dropdown_elem(
				function(evt){
					kbmodules.football_standard.create_club_lineup('guest', evt.target.value);

					// todo: is this the right place for this?
					// Trigger lineup save
					kbmodules.football_standard.global_save({'lineup_lists': true})
				}
			)
		);

		// Player picker for cards and goals
		$('#cg_player_picker').append(
			kbmodules.football_standard.resource_index.card_player_filter.box
		)
	}


	// --------------------------
	// Misc.
	// --------------------------
	{
		// todo: save this info to a file too?
		// Or even better: Make these fields part of the core

		// Load todays commenter
		$('#commenter_name_input')[0].value = mctx.cache.todays_commenter;
		// Load VS sublines
		$('#vs_text_bottom_upper')[0].value = mctx.cache.vs_title_bottom_upper_line;
		$('#vs_text_bottom_lower')[0].value = mctx.cache.vs_title_bottom_lower_line;

		kbmodules.football_standard.update_team_colors();
		kbmodules.football_standard.resource_index.score_manager.resync_score_on_title()
	}


	//
	// Stats
	//
	{
		// todo: this is old copypasted code
		const prev_stats = JSON.parse(ksys.db.module.read('stats.fball')) || {'1':{}, '2':{}};

		kbmodules.football_standard.stats_unit_pool = {};

		const stats = [
			['1',            'l_text_r1', 'r_text_r1', 'УДАРИ'],
			['2',            'l_text_r2', 'r_text_r2', 'УДАРИ У ПЛОЩИНУ'],
			['3',            'l_text_r3', 'r_text_r3', 'КУТОВІ'],
			['4',            'l_text_r4', 'r_text_r4', 'ОФСАЙДИ'],
			['5',            'l_text_r5', 'r_text_r5', 'ФОЛИ'],
			['yellow_cards', 'l_text_r6', 'r_text_r6', 'ЖОВТІ КАРТКИ'],
			['red_cards',    'l_text_r7', 'r_text_r7', 'ЧЕРВОНІ КАРТКИ'],
		]

		for (const stat_info of stats){
			const stat_name = str(stat_info[0]);

			const stat_class = 
				new kbmodules.football_standard.StatUnit(
					kbmodules.football_standard.titles.stats,
					stat_info[1],
					stat_info[2],
					stat_info[3],

					// init val team 1
					prev_stats?.[stat_name]?.['1'],
					// init val team 2
					prev_stats?.[stat_name]?.['2'],
				)

			kbmodules.football_standard.stats_unit_pool[stat_name] = stat_class;
		}

	}

	// --------------------------
	//     Modern save data
	// --------------------------
	{
		kbmodules.football_standard.load_lineup_lists();
		kbmodules.football_standard.load_field_layouts();
		kbmodules.football_standard.load_card_data();
		kbmodules.football_standard.load_score_data();
	}

	// --------------------------
	//           AT-AT
	// --------------------------
	{
		// todo: create a core function that does something like pulling
		// data to inputs from context automatically or something
		document.querySelector('#atat_port_input').value = int(ksys.context.global.cache.atat_port || '');

		// todo: make use of this
		kbmodules.football_standard.at_at = {
			'service_ping': null,
			// important todo: is this absolutely fucking retarded?
			// Not really, because see KbAtCMDGateway's in /sys/ticker.js
			// comment on this matter.
			// Long story short: The less spam - the better.
			'btns_enable_lock': false,
		}

		const tgt_timer_fset = ksys.switches.entries.timer_system;

		kbmodules.football_standard.timer_ctrl = kbmodules.football_standard.timer_fset[tgt_timer_fset];

		if (tgt_timer_fset == 'at_at'){
			kbmodules.football_standard.toggle_atat_status_indicator(true);
			kbmodules.football_standard.restart_atat_service();
			kbmodules.football_standard.restore_atat_line();
		}else{
			kbmodules.football_standard.toggle_atat_btns(true);
			kbmodules.football_standard.toggle_atat_status_indicator(false);
		}

		// kbmodules.football_standard.update_selected_timer_system(tgt_timer_fset);
	}
}






/*

Each club has:
	- Logo
	- Official name
	- Official name shorthand
	- Main coach
	- Players

*/


// input_club_struct is a dict where:
// 	- logo_path: String representing an absolute path
// 	             pointing to the club's logo on the LOCAL disk.
// 
//  - club_name: Official, full name of the club.
// 
//  - club_name_shorthand: Club's name shorthand, like ОБОЛОНЬ -> ОБО
// 
//  - main_coach: Club's main coach.
// 
//  - playerbase: An array of dictionaries representing players and their info:
//                {
//                    'name':    player's name,
//                    'surname': player's surname,
//                    'num':     player's number,
//                }
//                These dictionaries get transformed
//                into ClubPlayer classes after initialization.
kbmodules.football_standard.FootballClub = class{
	constructor(input_club_struct=null, is_enemy=false){
		const club_struct = input_club_struct || {};

		// Base info
		this.logo_path =           club_struct.logo_path || './assets/red_cross.png';
		this.club_name =           (club_struct.club_name || '').lower();
		this.club_name_shorthand = club_struct.club_name_shorthand || '';
		this.main_coach =          (club_struct.main_coach || '').lower();

		// important todo: this is very unreliable
		this.is_enemy =            is_enemy;

		// An array of ClubPlayer classes
		this.playerbase =          new Set();

		// populate internal registry with initial data, if any
		for (const player_info of (club_struct.playerbase || [])){
			this.playerbase.add(new kbmodules.football_standard.ClubPlayer(this, player_info))
		}

		// Control panel reference
		this.control_panel = null;

		// visual headers references
		this.vis_header_references = new Set();
	}

	// forward update logos and club name
	forward_update(){
		// update visual headers
		for (const vheader of this.vis_header_references){
			vheader.index.logo.src = this.logo_path;
			vheader.index.title.textContent = this.club_name.upper();
		}
		// update player items
		for (const player of this.playerbase){
			player.forward_update()
		}

		// update self
		this.control_panel.index.logo_feedback.src = this.logo_path;
		this.control_panel.index.logo_feedback.setAttribute('kbhint', this.logo_path);
	}

	// get visual header: an element with club logo + name
	// this data is expected to be persistent
	vis_header_elem(){
		const tplate = ksys.tplates.index_tplate(
			'#club_header_template',
			{
				'logo':    'img',
				'title':   'club-header-title',
			}
		);

		tplate.index.logo.src = this.logo_path;
		tplate.index.title.textContent = this.club_name.upper();

		if (this.is_enemy){
			tplate.elem.setAttribute('is_enemy', true)
		}

		// register reference
		this.vis_header_references.add(tplate)

		return tplate.elem
	}

	// Delete all the club's resources from the interface
	erase(){
		// 1 - delete team lineup
		if (kbmodules.football_standard.resource_index.home_lineup?.club?.club_name?.lower?.() == this.club_name.lower()){
			$('#team_lineup home-club-lineup').empty()
		}
		if (kbmodules.football_standard.resource_index.guest_lineup?.club?.club_name?.lower?.() == this.club_name.lower()){
			$('#team_lineup guest-club-lineup').empty()
		}


		// Lastly, delete club control panel
		this.control_panel?.elem?.remove?.()
	}

	// Register a new player in this club
	// - input_player_info:dict player info as described in FootballClub class
	register_player(input_player_info=null){
		// create player class
		const player = new kbmodules.football_standard.ClubPlayer(this, input_player_info);
		// add player to the registry
		this.playerbase.add(player);
		// add player cfg box to the club pool
		this.control_panel.index.player_pool.append(player.player_params_elem().elem)
		// return the player class
		return player
	}

	// Create club control panel
	// todo: somehow make the file input element look like a file has just been selected
	control_panel_elem(){
		const self = this;

		if (this.control_panel){
			return this.control_panel
		}

		const tplate = ksys.tplates.index_tplate(
			'#club_def_template',
			{
				'logo_feedback':    'img.club_def_logo_visfeedback',

				// base params
				'logo_input':      'club-base-params club-param[prmname="logo"] input',
				'club_title':      'club-base-params club-param[prmname="title"] input',
				'title_shorthand': 'club-base-params club-param[prmname="title_shorthand"] input',
				'main_coach':      'club-base-params club-param[prmname="main_coach"] input',

				// Playerbase
				'reg_player_btn':  'club-playerbase sysbtn[btname="register_player_in_club"]',
				'player_pool':     'club-playerbase playerbase-pool',
			}
		);

		// save the template
		// todo: only one definition panel can exist for now
		this.control_panel = tplate;

		// populate pool with existing players
		for (const player of this.playerbase){
			tplate.index.player_pool.append(player.player_params_elem().elem)
		}

		// write other info
		tplate.index.club_title.value = this.club_name.upper();
		tplate.index.title_shorthand.value = this.club_name_shorthand.upper();
		tplate.index.main_coach.value = this.main_coach.upper();
		tplate.index.logo_feedback.src = this.logo_path;
		tplate.index.logo_feedback.setAttribute('kbhint', this.logo_path);

		// bind button for adding new players
		tplate.index.reg_player_btn.onclick = function(){
			self.register_player()
		}
		// bind logo change
		tplate.index.logo_input.onchange = function(evt){
			self.logo_path = evt.target?.files?.[0].path;
			self.forward_update()
		}
		// bind club name change
		tplate.index.club_title.onchange = function(evt){
			self.club_name = evt.target.value.lower();
			self.forward_update()
		}
		// bind shorthand change
		tplate.index.title_shorthand.onchange = function(evt){
			self.club_name_shorthand = evt.target.value.lower();
		}
		// bind coach change
		tplate.index.main_coach.onchange = function(evt){
			self.main_coach = evt.target.value.lower();
		}

		return tplate
	}

	// open club control panel in the club tab
	open_panel(){
		// delete previous control panel
		$('#club_definition club-def').remove();
		// Append new club
		$('#club_definition').append(this.control_panel_elem().elem);
		// set reference to this club in the resource index
		kbmodules.football_standard.resource_index.club_ctrl = this;
	}

	// return a json representing this club
	to_json(){
		const dump = {
			'logo_path':           this.logo_path,
			'club_name':           this.club_name,
			'club_name_shorthand': this.club_name_shorthand,
			'main_coach':          this.main_coach,
			'playerbase':          [],
		};

		for (const player of this.playerbase){
			dump.playerbase.push(player.as_dict())
		}

		print('Club dump info:', dump)

		return dump
	}

	// Get player class by nameid
	get_player_by_nameid(tgt_nameid=null){
		if (!tgt_nameid){return null};

		for (const player of this.playerbase){
			if (player.name_id == tgt_nameid){
				return player
			}
		}

		return null
	}
}



// - input_player_info:dict player info as described in FootballClub class
// - parent_club:FootballClub parent football club.
// This data is persistent, unless killed
kbmodules.football_standard.ClubPlayer = class{
	constructor(parent_club, input_player_info=null){
		const player_info = input_player_info || {};

		this.club = parent_club;

		this.player_name =    (player_info.name || '').lower();
		this.player_surname = (player_info.surname || '').lower();
		this.player_num =     (player_info.num || '').lower();

		// stats
		this.yellow_cards = 0;
		this.red_cards = 0;

		// todo: is this really a good idea???
		// treating JS like C ??!?!?!
		// POINTERS???
		// CONSPIRACIES?????
		this.references = new Set();
	}

	// forward player data (name, surname, number)
	// to all the related elements
	forward_update(){
		for (const generic_list_elem of this.references){
			generic_list_elem.index.logo.src =          this.club.logo_path;
			generic_list_elem.index.num.textContent =     this.player_num.upper();
			generic_list_elem.index.surname.textContent = this.player_surname.upper();
		}

		// todo: there used to be
		/*
		kbmodules.football_standard.global_save({
			'lineup_lists': true,
			'field_layout': true,
		})
		*/
	}

	// Remove the player from EVERYWHERE
	disqualify(){
		// Remove DOM elements
		this.unlist()
		// Delete self from the club's registry
		this.club.playerbase.delete(this)
	}

	// Unlist the player ftom the current match
	unlist(){
		// Delete all the GUI elements from the page
		for (const reference of this.references){
			reference.elem.remove();
		}
	}

	// delete obsolete references
	// todo: this means there are always redundant
	// elements until this method is called
	collect_garbage(){
		for (const rubbish of this.references){
			if (!document.body.contains(rubbish.elem)){
				this.references.delete(rubbish)
			}
		}
	}

	// return an indexed template from ksys.tplates.index_tplate
	generic_list_elem(collect_rubbish=true){
		const self = this;

		const tplate = ksys.tplates.index_tplate(
			'#generic_player_list_item_template',
			{
				'logo':    'img.player_club_logo',
				'num':     '.player_number',
				'surname': '.player_surname',
			}
		);

		// delete redundant references
		if (collect_rubbish){
			this.collect_garbage()
		}

		// Write down data
		tplate.index.logo.src = this.club.logo_path;
		tplate.index.num.textContent = this.player_num.upper();
		tplate.index.surname.textContent = this.player_surname.upper();

		// Write down reference to this element
		self.references.add(tplate)

		// too bad JS doesn't support cool python unpacking
		// (aka return a, b)
		return tplate
	}

	// return player config element
	// (inputs with name, surname, name, ...)
	player_params_elem(){
		const self = this;

		const tplate = ksys.tplates.index_tplate(
			'#generic_player_config_template',
			{
				'name':    'player-param[prmname="player_name"] input',
				'surname': 'player-param[prmname="player_surname"] input',
				'num':     'player-param[prmname="player_num"] input',
			}
		);

		// Populate params
		tplate.index.name.value = this.player_name.upper();
		tplate.index.surname.value = this.player_surname.upper();
		tplate.index.num.value = this.player_num.upper();

		tplate.index.name.onchange = function(evt){
			self.player_name = evt.target.value.lower();
			self.forward_update();
		}
		tplate.index.surname.onchange = function(evt){
			self.player_surname = evt.target.value.lower();
			self.forward_update();
		}
		tplate.index.num.onchange = function(evt){
			self.player_num = evt.target.value.lower();
			self.forward_update();
		}

		// bind deletion of the player from the registry
		// (alt+RMB)
		tplate.elem.oncontextmenu = function(evt){
			const cant_del = [
				kbmodules.football_standard.resource_index.side.home?.club?.club_name?.lower?.(),
				kbmodules.football_standard.resource_index.side.guest?.club?.club_name?.lower?.(),
			]
			if (cant_del.includes(self.club.club_name.lower())){
				ksys.info_msg.send_msg(
					`Unfortunately, the data structure doesn't allow deleting players,
					if their club is loaded in the lineup (to prevent data corruption)`,
					'warn',
					15000
				);
				return
			}
			if (evt.altKey){
				// self combustion moment (real)
				self.disqualify()
				// remove the box DOM element
				tplate.elem.remove()
			}
		}

		return tplate
	}

	get name_id(){
		return `${this.player_name} ${this.player_surname} ${this.player_num}`.lower()
	}

	get side(){
		if (this.club.is_enemy){
			return 'guest'
		}else{
			return 'home'
		}
	}

	// test whether the player is inside another player array
	// by his name_id
	is_in(target_array){
		for (const player of target_array){
			if (this.name_id == player.name_id){
				return true
			}
		}
		return false
	}

	// return a dictionary representing this player
	as_dict(){
		return {
			'name':    this.player_name,
			'surname': this.player_surname,
			'num':     this.player_num,
		}
	}
}



/*
Club lineup for the upcoming match.
	- club is the parent FootballClub class the lineup is constructed from.

	- colors: array of HEX colours available in the colour picker.

	- input_lineup_info is a dictionary containing lineup info:
	    - main_players:    An array of player name ids.
	    - reserve_players: An array of player name ids.
	    - shorts_col: Shorts colour identifier for the match.
	    - tshirt_col: T-shirt colour identifier for the match.
	    - gk_col: Goalkeeper colour identifier for the match.

	    - field_layout: UNUSED A dictionary where key is field cell id
	                    and value is player info dict.
*/
kbmodules.football_standard.TeamLineup = class{
	constructor(club, colors=null, input_lineup_info=null){
		this.club = club;
		const lineup_info = input_lineup_info || {};

		// basic config
		this.shorts_color = lineup_info.shorts_col || null;
		this.tshirt_color = lineup_info.tshirt_col || null;
		this.gk_color =     lineup_info.gk_col || null;

		// todo: unused as of now
		this.field_layout = lineup_info.field_layout || {};

		// Team colours to pick from (hardcoded list of hex colours)
		// todo: vmix DOES support shape colour shifting
		this.available_colors = colors || [];

		// Colour picker classes
		this.shorts_colpick = null;
		this.tshirt_colpick = null;
		this.gk_colpick = null;

		// These sets contain player classes
		this.main_players = new Set();
		this.reserve_players = new Set();

		// todo: There can be only one control panel
		// why??
		this.tplate = null;


		// 
		// Store input data
		// 

		// todo: is this stupid ?
		this.input_lineup_info = lineup_info;

	}

	// get control panel element for the lineup
	control_panel_elem(){
		const self = this;

		// todo: There can be only one control panel
		if (self.tplate){
			return self.tplate.elem
		}

		// Create the control panel itself
		this.tplate = ksys.tplates.index_tplate(
			'#club_match_lineup_template',
			{
				// Side (home/guest)
				'side':                'side-indicator',

				// Config (colour pickers)
				'shorts_color_picker': 'lineup-param[prmname="shorts_color"] .param_content',
				'tshirt_color_picker': 'lineup-param[prmname="tshirt_color"] .param_content',
				'gk_color_picker':     'lineup-param[prmname="gk_color"] .param_content',

				// lists
				'player_picker_placeholder': 'lineup-lists lineup-player-picker',
				'main_list':                 'lineup-lists lineup-main lineup-pool',
				'reserve_list':              'lineup-lists lineup-reserve lineup-pool',

				// buttons
				'append_to_main_list_btn':    'lineup-lists lineup-main sysbtn[btname="append_player_to_main_lineup"]',
				'append_to_reserve_list_btn': 'lineup-lists lineup-reserve sysbtn[btname="append_player_to_reserve_lineup"]',
				'edit_club_btn':              'sysbtn[btname="edit_club_from_lineup"]',
			}
		);

		// Side indicator
		if (self.club.is_enemy){
			self.tplate.index.side.setAttribute('enemy', true)
		}else{
			self.tplate.index.side.setAttribute('home', true)
		}

		//
		// create player picker
		// 
		const player_picker = new kbmodules.football_standard.PlayerPicker(
			[this.club.playerbase],

			// Filter function to filter out players already in the lists
			function(target_player){
				for (const existing_player of [...self.main_players, ...self.reserve_players]){
					if (existing_player.name_id == target_player.name_id){
						return false
					}
				}
				return true
			}
		);

		// replace the placeholder in the template with a real picker
		this.tplate.index.player_picker_placeholder.replaceWith(player_picker.box);


		//
		// create colour pickers
		// 
		this.shorts_colpick = new kbmodules.football_standard.TeamLineupColorPicker(this.available_colors, kbmodules.football_standard.update_team_colors);
		this.tplate.index.shorts_color_picker.append(this.shorts_colpick.list)

		this.tshirt_colpick = new kbmodules.football_standard.TeamLineupColorPicker(this.available_colors, kbmodules.football_standard.update_team_colors);
		this.tplate.index.tshirt_color_picker.append(this.tshirt_colpick.list)

		this.gk_colpick = new kbmodules.football_standard.TeamLineupColorPicker(this.available_colors, kbmodules.football_standard.update_team_colors);
		this.tplate.index.gk_color_picker.append(this.gk_colpick.list)

		//
		// create header (visual identifier)
		// 
		this.tplate.elem.append(this.club.vis_header_elem())


		// 
		// Bind button actions
		// 

		// Append chosen player to the main player list
		this.tplate.index.append_to_main_list_btn.onclick = function(){
			if (!player_picker.selected_entry){
				ksys.info_msg.send_msg('No player selected', 'warn', 500);
				return
			};
			self.add_player_to_list(
				player_picker.selected_entry.player,
				'main'
			)
			player_picker.pull_out_selection()

			// todo: is this the right place for this?
			// Trigger lineup save
			kbmodules.football_standard.global_save({'lineup_lists': true})
		}
		// Append chosen player to the reserve player list
		this.tplate.index.append_to_reserve_list_btn.onclick = function(){
			if (!player_picker.selected_entry){
				ksys.info_msg.send_msg('No player selected', 'warn', 500);
				return
			};
			self.add_player_to_list(
				player_picker.selected_entry.player,
				'reserve'
			)
			player_picker.pull_out_selection()

			// todo: is this the right place for this?
			// Trigger lineup save
			kbmodules.football_standard.global_save({'lineup_lists': true})
		}
		// Edit related club in the club panel
		this.tplate.index.edit_club_btn.onclick = function(){
			self.club.open_panel();

			// Switch to the "Clubs" tab
			// (Standard panel from the very top)
			$('sys-tab[match_id="club_def"]').click();
		}



		// 
		// Apply existing data
		// 

		// Todo: this FULLY relies on the fact, that there could be only one control panel

		// Colours
		self.shorts_colpick.selected_color = self.shorts_color;
		self.tshirt_colpick.selected_color = self.tshirt_color;
		self.gk_colpick.selected_color = self.gk_color;

		// Players
		for (const tgt_list of [['main_players', 'main'], ['reserve_players', 'reserve']]){
			const input_list = tgt_list[0];
			const add_list = tgt_list[1];

			if (self.input_lineup_info[input_list]){
				for (const player_nameid of self.input_lineup_info[input_list]){
					const player = self.club.get_player_by_nameid(player_nameid);
					if (!player){continue};

					self.add_player_to_list(player, add_list)
				}
			}
		}


		return self.tplate.elem
	}

	// Add a player to either main player list or reserve
	// - player: ClubPlayer
	// - which_list: 'main' | 'reserve'
	add_player_to_list(player, which_list){
		const self = this;

		const tgt_list = which_list == 'main' ? this.main_players : this.reserve_players;
		if (tgt_list.size >= 11){
			ksys.info_msg.send_msg(
				'There are more than 11 players in this list, proceed with caution',
				'warn',
				9000
			);
		}

		// print('Target list:', tgt_list, this.main_players, this.reserve_players)
		// if the player is already in the list - return
		if (this.main_players.has(player) || this.reserve_players.has(player)){return};

		// Create generic list item
		const list_elem = player.generic_list_elem();

		// Bind actions to the generic list item
		list_elem.elem.oncontextmenu = function(evt){
			if (!evt.altKey){return};
			// delete self from the DOM list
			evt.target.closest('player').remove();
			// delete self from the lineup registry
			self.remove_player_from_list(player, which_list)

			// todo: is this the right place for this?
			// Trigger lineup save
			kbmodules.football_standard.global_save({'lineup_lists': true})
		}
		// Add generic list item to the internal registry
		tgt_list.add(player)

		// Append DOM element to the list
		if (which_list == 'main'){
			this.tplate.index.main_list.append(list_elem.elem)
		}else{
			this.tplate.index.reserve_list.append(list_elem.elem)
		}

	}

	// - player: ClubPlayer
	// - which_list: 'main' | 'reserve'
	remove_player_from_list(player, which_list){
		// todo: this is stupid
		let target_list = null;
		if (which_list == 'main'){target_list = this.main_players};
		if (which_list == 'reserve'){target_list = this.reserve_players};

		target_list.delete(player)
	}

	// get selected lineup colours
	get colors(){
		return {
			'tshirt': this.tshirt_colpick.selected_color,
			'shorts': this.shorts_colpick.selected_color,
			'gk': this.gk_colpick.selected_color,
		}
	}
}

/*
Colour picker for the lineup.
	- colors: An array of HEX colours to create.
	- callback: Callback function to trigger on color change.
	            The function receives exactly 1 argument:
	            HEX value of the selected colour.
*/
kbmodules.football_standard.TeamLineupColorPicker = class{
	constructor(color_codes, callback=null){
		const self = this;

		this.color_codes = color_codes || [];
		this.callback = callback;

		// currently active colour by colour code
		this._selected_color = color_codes[0];

		// colour objects (js DOM elements)
		this.colors = {};

		this.tplate = ksys.tplates.index_tplate(
			'#team_lineup_color_picker_template',
			{},
		);

		// the dom element itself
		this.list = this.tplate.elem;

		for (const col of this.color_codes){
			const clear_hex = str(col).replaceAll('#', '');

			// create colour DOM element
			const color_elem = $(`<picker-color style="background: #${clear_hex}"></picker-color>`)[0];
			// write down colour into palette registry
			this.colors[clear_hex] = color_elem;
			// append the DOM element to the list
			this.tplate.elem.append(color_elem)
			// Bind actions
			color_elem.onclick = function(){
				self.selected_color = clear_hex;

				// todo: is this the right place for this?
				// Trigger lineup save
				kbmodules.football_standard.global_save({'lineup_lists': true})
			}
		}
	}

	get selected_color(){
		return this._selected_color
	}

	set selected_color(newval){
		const self = this;

		const col_elem = self.colors[str(newval).replaceAll('#', '').trim()];
		if (!col_elem){
			console.warn('Cannot find target colour:', newval);
			return
		}

		// visual feedback: Remove outline class from all entries
		// and then add it back to the one being selected
		$(self.tplate.elem).find('picker-color').removeClass('active_color');
		col_elem.classList.add('active_color');

		// write down the selected hex
		self._selected_color = newval;
		// Execute callback function, if any and pass the selected hex value to it
		self?.callback?.(newval)

		// col_elem.click()
	}
}




/*
A regular filter box for quick (aka the only way of) player lookup.
	- data_sources: Iterable of iterables of player classes.

	- filter: Filter function.
	          The class checks for name/surname/number match
	          automatically, then the filter function must
	          return true for the player to appear in the list.
	          The function receives exactly 1 argument: Player Class.
	          pro tip: function(){return true} is a totally legit strat.
	
	- post_filter_action: function to call after the player was added
	                      to the list.
	                      The function receives exactly 2 arguments:
	                      player list item DOM, player class

"onclick" event on the root of the list item is pre-occupied.
To add custom "onclick" - add "onclick" to the object passed to the post_filter_function
*/
kbmodules.football_standard.PlayerPicker = class{
	constructor(data_sources, filter, post_filter_action=null){
		const self = this;

		this.data_source = data_sources;
		this.filter = filter;
		this.post_filter_action = post_filter_action;

		this.selected_entry = null;

		this.filtered_entries = [];

		// Create the filter box DOM element
		this.tplate = ksys.tplates.index_tplate(
			'#player_picker_template',
			{
				'input':    'input.player_picker_input',
				'result':   'player-picker-result',
			}
		);

		// The DOM element itself
		this.box = this.tplate.elem;

		// bind events
		// todo: this can directly point to this.match_query
		this.tplate.index.input.oninput = function(evt){
			// const query = evt.target.value;
			self.match_query(evt.target.value)
		}
	}

	// Filter data source according to query and display the results
	// - query: query string
	match_query(query){
		const self = this;

		// clear previous selection
		this.selected_entry = null;
		// clear pool
		this.tplate.index.result.innerHTML = '';
		this.filtered_entries = [];

		// look for matches
		for (const dsource of this.data_source){
			for (const player of dsource){
				// const name_id = `${player.player_name} ${player.player_surname} ${player.player_num}`;
				const name_id = player.name_id;
				// todo: str() is very slow
				if (!name_id.includes(str(query).lower())){continue};
				if (!this.filter(player)){continue};

				// checks passed - append to the list
				const list_item = player.generic_list_elem()
				const click = function(){
					// Remove previous selection highlighting
					if (self.selected_entry){
						self.selected_entry.list_elem.classList.remove('selected_entry')
					}
					// Write down new selection
					self.selected_entry = {
						'player': player,
						'list_elem': list_item.elem,
					}
					// Highlight currently selected element
					list_item.elem.classList.add('selected_entry')
				}

				list_item.elem.onclick = function(evt){
					click()
					list_item?.onclick?.(evt)
				}

				// append the matched result to the lists
				this.tplate.index.result.append(list_item.elem)
				this.filtered_entries.push({
					'player': player,
					'list_elem': list_item.elem,
				})

				// apply post-filter actions, if any
				this?.post_filter_action?.(list_item, player)
			}
		}

	}

	// remove selection from the filtered list
	// and deselect
	pull_out_selection(){
		if (!this.selected_entry){return};
		this.selected_entry.list_elem.remove()
		this.selected_entry = null;
	}

	// deselect currently selected item
	reset_selection(){
		if (!this.selected_entry){return};
		this.selected_entry.list_elem.classList.remove('selected_entry')
		this.selected_entry = null;
	}
}


kbmodules.football_standard.ClubSelectorDropdown = class{
	constructor(){
		this.registry = new Set();
	}

	dropdown_elem(onchane){
		const tplate = ksys.tplates.index_tplate(
			'#club_selector_dropdown_template',
			{}
		);
		$(tplate.elem).append('<option value="">--</option>');
		tplate.elem.onchange = onchane;
		this.registry.add(tplate.elem);
		this.resync();
		return tplate.elem
	}

	resync(){
		// Technically, there could be multiple dropdowns
		// Practically - why ???
		for (let dropdown of this.registry){
			dropdown = $(dropdown);
			// Delete all previous dropdown entries
			dropdown.find('option:not([value=""])').remove();
			// Iterate the 'clubs' subdir in the local db
			for (const clubname of ksys.db.module.path().join('clubs').globSync('*.clubdef')){
				dropdown.append(`
					<option value="${clubname.stem.lower()}">${clubname.stem.upper()}</option>
				`)
			}
		}
	}
}


kbmodules.football_standard.FieldLayout = class{
	constructor(lineup){
		const self = this;

		this.lineup = lineup;
		this.grid = new Set();

		// Map of cell dom:linked cell dict
		// todo: unused
		this.cell_map = new Map();

		// the player being dragged
		this.drag_target = {
			// player calss
			'player': null,
			// the element itself, NOT index
			'list_elem': null,
			// unused
			'cell': null,
		};

		self.hover_target = null;

		// create cells struct
		for (const row_id of range(9)){
			const row = new Set();
			this.grid.add(row)

			for (const cell_id of range(10)){
				const cell = {
					'id': `${row_id}_${cell_id}`,
					'dom': $('<cell></cell>')[0],
					'player': null,
				}
				cell.dom.onmouseup = function(){
					if (!self.drag_target.player){return};

					// todo: it seems like this could benefit from a few return statements...
					if (cell.player){
						print('Cell has player, swapping:', cell.player)

						// Get data
						const new_cell = cell;
						const old_cell = self.cell_struct_from_dom(self, self.drag_target.list_elem.parentElement);

						print('Old cell:', old_cell, 'New cell:', new_cell)

						// Swap list items
						new_cell.dom.children[0].swapWith(self.drag_target.list_elem)

						// only do it if there's stuff to actually swap
						if (new_cell && old_cell){
							print('Sufficient data, swapping struct')
							old_cell.player = new_cell.player;
							new_cell.player = self.drag_target.player;

							// todo: is this the right place for this?
							// Save field layout
							kbmodules.football_standard.global_save({'field_layout': true})
						}

						// When swapping with an element from a list
						if (!old_cell && new_cell){
							print('Swapping from a list')
							new_cell.player = self.drag_target.player;

							// todo: is this the right place for this?
							// Save field layout
							kbmodules.football_standard.global_save({'field_layout': true})
						}
						print('cells with new players', new_cell, old_cell)
					}else{
						const src_cell = self.is_on_field(self.drag_target.player)
						if (src_cell){
							print('Detaching from prev cell:', src_cell)
							src_cell.player = null;
						}
						print('Cell doesnt have a player', cell)
						print('Lift:', self.drag_target)
						cell.dom.innerHTML = '';
						cell.dom.append(self.drag_target.list_elem)
						cell.player = self.drag_target.player;
						print('cell with new player', cell);

						// todo: is this the right place for this?
						// Save field layout
						kbmodules.football_standard.global_save({'field_layout': true})
					}

					self.drag_target = {
						'player': null,
						'list_elem': null,
						'cell': null,
					};
				}

				cell.dom.oncontextmenu = function(evt){
					if (evt.altKey){
						cell.dom.innerHTML = '';
						cell.player = null;

						// todo: is this the right place for this?
						// Save field layout
						kbmodules.football_standard.global_save({'field_layout': true})
					}
				}

				// unused
				cell.dom.onmouseover = function(){
					self.hover_target = cell;
				}

				// Absolutely retarded hack.
				// It has already been forgotten why it's needed,
				// but eerything breaks without it
				cell.dom.onmousedown = function(){
					if (!cell.player){
						self.drag_target = {
							// player calss
							'player': null,
							// the element itself, NOT index
							'list_elem': null,
						};
					}
				}

				row.add(cell)
			}
		}

		// todo: temp: hide some cells
		for (const row of this.grid){
			row.at(0).dom.classList.add('ghost_cell')
		}
		for (const cell of this.grid.at(-1)){
			cell.dom.classList.add('ghost_cell')
		}
		this.grid.at(-1).at(5).dom.classList.remove('ghost_cell')

		// instantiate grid DOM
		this.tplate = ksys.tplates.index_tplate(
			'#field_layout_template',
			{
				'picker': 'field-layout-picker',
				'grid':   'field-layout-grid',
				'header': 'field-layout-header',
			},
		);

		// append cells to grid DOM
		for (const cell of this.iter_cells()){
			this.tplate.index.grid.append(cell.dom)
		}

		// create player picker
		this.picker = new kbmodules.football_standard.PlayerPicker(
			// data source
			[this.lineup.main_players, this.lineup.reserve_players],
			// filter
			function(tgt_player){
				// Only show players that are NOT on the field
				if (!self.is_on_field(tgt_player)){
					return true
				}else{
					return false
				}
			},
			// post-filter actions:
			// All the neccessary bindings for dragging and assigning
			// the target player to the cell
			function(list_item, tgt_player){
				self.bind_list_item(self, list_item, tgt_player)
			}
		)

		// append player picker to the template
		this.tplate.index.picker.append(this.picker.box)

		// append cell DOMs to the template
		for (const cell of this.iter_cells()){
			this.tplate.index.grid.append(cell.dom)
			this.cell_map[cell.dom] = cell;
		}

		// create club header and add it to the template
		this.tplate.index.header.append(this.lineup.club.vis_header_elem())
	}

	* iter_cells(){
		for (const row of this.grid){
			for (const cell of row){
				yield cell
			}
		}
	}

	// check whether the player is on the field
	// and return the associated cell if so
	is_on_field(player){
		for (const cell of this.iter_cells()){
			if (cell.player == player){
				print(cell.player, player)
				return cell
			}
		}
		return false
	}

	// create all the neccessary bindings for a player list item
	// appended to the field grid
	bind_list_item(self, list_item, tgt_player){

		// bind mouse down location bind
		list_item.elem.onmousedown = function(evt){
			if (evt.altKey){return};

			// make it float
			list_item.elem.ClientPosFromEvent(evt)
			list_item.elem.classList.add('is_dragging')
			self.tplate.index.grid.classList.add('hover')
			
			// write down cell, if any
			const src_cell = self.is_on_field(tgt_player)

			// write down drag target
			self.drag_target = {
				'player': tgt_player,
				'list_elem': list_item.elem,
			}

			// Create a global system-wide bind to stop the element floating
			ksys.binds.mouseup = function(evt){

				// Stop floating and effects
				list_item.elem.classList.remove('is_dragging')
				list_item.elem.ClientPosFromEvent(null)
				self.tplate.index.grid.classList.remove('hover')

				// remove system-wide binds
				ksys.binds.mousemove = null;
				ksys.binds.mouseup = null;

				if (!evt.target.closest('field-layout-grid cell')){
					self.drag_target = {
						'player': null,
						'list_elem': null,
					}
				}
			}

			// Forward cursor position to the element
			ksys.binds.mousemove = function(evt){
				list_item.elem.ClientPosFromEvent(evt)
			}
		}
	}

	// get associated cell struct from the cell's dom
	cell_struct_from_dom(self, cell_dom){
		print('Requesting struct', cell_dom)
		for (const cell of self.iter_cells()){
			if (cell.dom == cell_dom){
				print('Found DOM match:', cell)
				return cell
			}
		}
	}

	// unused
	swap_cells(self, cell_a, cell_b){
		const cstruct_a = self.cell_map[cell_a];
		const cstruct_b = self.cell_map[cell_b];
	}

	// dump field layout to json
	/*
	{
		'cell_id': 'name_id',
		'cell_id': 'name_id',
		...
	}
	*/
	to_json(){
		const layout = {};

		for (const cell of this.iter_cells()){
			if (!cell.player){continue};

			layout[cell.id] = cell.player.name_id;
		}

		return layout;
	}

	wipe_field(){
		this.hover_target = null;
		this.drag_target = {
			'player': null,
			'list_elem': null,
			'cell': null,
		};

		for (const cell in this.iter_cells()){
			cell.player = null;
			$(cell.dom).empty();
		}
	}

	// layout_data is a dict of cell_id:name_id
	apply_layout(layout_data){
		if (!layout_data){
			console.error('No layout data supplied to apply_layout', layout_data, this.lineup)
			return
		}

		// First - wipe the field
		this.wipe_field()

		// Now, add players
		for (const cell of this.iter_cells()){
			const player = this.lineup.club.get_player_by_nameid(layout_data[cell.id])
			if (!player){continue};

			cell.player = player;

			// create generic player list item
			const player_list_item = player.generic_list_elem();

			// create binds
			this.bind_list_item(this, player_list_item, player);

			// todo: get rid of jquery
			$(cell.dom).html(player_list_item.elem);
		}
	}
}

/*
this.tplate = ksys.tplates.index_tplate(
	'#match_signals_template',
	{
		'picker':           'msignals-player-picker',
		'pardon_btn':       'msignals-card-counter vmixbtn[btname="pardon_yellow_card"]',
		'red_card_counter': 'msignals-red-cards',
	}
);
*/


// !!!!!!!!! OBSOLETE !!!!!!!!!
// vvvvvvvvvvvvvvvvvvvvvvvvvvvv

// A single unit of a statistic
// Anything from cards to goals
// - stat_struct: mandatory dict desribing the stat unit struct,
//                possibly carrying existing numbers
// - log_tabe:    Table acting as a dump, literally a log of changes to this stat
// - edit_table:  Table where this statistic can be edited quickly,
//                definitely breaking the log records.
/*

stat_struct:

{
	'stat_name': 'name_desribing_the_stat',
	'vis_name': 'Визуальное Имя в Интерфейсе',
	'count': 0,
	'attributes': {
		'attr_name': 'attr_val',
	}
}
*/
kbmodules.football_standard._FMStatUnit = class{
	constructor(stat_struct, log_table, edit_table, expose_in_quick_control=true){
		this.count = stat_struct.count;
		this.name = stat_struct.stat_name;
		this.vis_name = stat_struct.vis_name;
		this.attributes = stat_struct.attributes || {};

		// whether to expose this stat unit to control or not
		this.fast_expose = expose_in_quick_control;

		// tables to report to
		this.log_table = log_table;
		// this.edit_table = edit_table;

		// The log event stack
		this.event_stack = [];

		// Row element
		this._tplate = ksys.tplates.index_tplate(
			'#match_signals_template',
			{
				'picker':           'msignals-player-picker',
				'pardon_btn':       'msignals-card-counter vmixbtn[btname="pardon_yellow_card"]',
				'red_card_counter': 'msignals-red-cards',
			}
		);
	}
}


// All kinds of stats
// - prev_log:
//   A json containing previous log
kbmodules.football_standard._FMStats = class{
	constructor(prev_log=null){
		this.home_stats = new Set();
		this.guest_stats = new Set();
	}
}

// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// !!!!!!!!! OBSOLETE !!!!!!!!!











// A table representing a set of statistics with a fixed structure
// table_struct is an array of arrays
// where each pair represents column id and column GUI display name:
/*
[
	['time',          'Time']
	['left',          'Left']
	['replaced_with', 'Replaced With']
]

Will result into the following table structure:
+--------+-------------+-----------------+
|  Time  |    Left     |  Replaced With  |
+--------+-------------+-----------------+
|  37:55 |   ДАНИЛО    |     ВЕКЛИЧ      |
+--------+-------------+-----------------+
|  21:32 |  ОЛЕКСАНДР  |    ПОДРЕЗАН     |
+--------+-------------+-----------------+
...

*/

// table_name: A pair of Table ID name / Table GUI name
// table_image: GUI image of the table
kbmodules.football_standard.FMStatsTable = class{
	constructor(table_struct, table_id, table_image){
		this.struct = table_struct;
		this.table_id = table_id;
		this.table_image = table_image;

		// Stat instances
		// Displayed in the table from top to bottom
		// Last element of the set = top
		// First element of the set = bottom
		this.stack = new Set();
	}

	// Cancel last stat
	cancel_last(){
		this.stack.del_idx(-1)
	}

	// Return this table as json
	to_json(as_string=false){
		const tgt_json = {
			'table_id': this.table_id,
			'entries': [],
		}

		for (const entry of this.stack){
			tgt_json.entries.unshift(entry.stat_map)
		}

		if (as_string){
			return JSON.stringify(tgt_json)
		}else{
			return tgt_json
		}
	}

	// Remove a stat from everywhere by its FMStatInstance class instance
	remove(stat_instance){
		return this.stack.delete(stat_instance)
	}

	// Create a stat instance
	// stat_map is a dict of column_id:value
	// can also be an array, like ['37:55', 'ДАНИЛО', 'ВЕКЛИЧ']
	add(stat_map=null){
		// todo: also check wether all elements are there
		if (!stat_map){
			console.error('Tried adding invalid stat:', stat_map)
			return
		}

		// todo: just use instanceof
		if (lizard.includesType(stat_map, [Set, Array])){
			if ( (stat_map.size || stat_map.length) != this.struct.length ){
				console.error('Tried adding invalid stat:', stat_map)
			}

			const struct_dict = {};
			for (const idx in this.struct){
				const column_id = this.struct[idx][0];
				struct_dict[column_id] = stat_map[idx];
			}
		}else{

		}
	}

}


// A stat instance.
// Each table row DOM is tied to its class instance
// stat_map is a dict of column_id:value
kbmodules.football_standard.FMStatInstance = class{
	constructor(stat_map){
		this.stat_map = stat_map;

		// this stores all the DOM references
		this.dom_registry = new Set();
	}
}













// Yellow and red cards manager
// It's only created once when the system is loaded
// This entire class is slightly retarded, because it's not a child of Club/Lineup/whatever
// Which means it has to tie itself to the data manually
// todo: make it a child too ?
// todo: add to_json() method
// todo: over time the entire club would be in the red card registry. Too bad

// important todo: There are too many redraw calls.
// It's totally possible to reduce the load (from 10ms to 9ms)
kbmodules.football_standard.CardManager = class {
	constructor(init_data=null){
		// time in ms the card title should stay on screen
		// this.title_hang_time = 7000;

		this.player_picker = kbmodules.football_standard.resource_index.card_player_filter;


		this.sides = {
			home: {
				// Persistent
				// (DOM stuff, such as card images n stuff)
				card_array: null,
				dom_index: null,

				// dynamic
				club: null,

				// key: player class
				// value: dict:
				/*
					{
						warned: false
						(a boolean indicating wether the player was warned with a yellow card)

						red: false
						(a boolean indicating wether the player got a red card)
					}
				*/
				// This makes it possible to determine wether the red card
				// was issued immediately or as a result of a second warning
				yc_map: new Map(),


				// event stack of the red cards
				// each element is a dict:
				// important todo:
				// The specification does not require sets to preserve
				// the element order, meanwhile the entire system relies
				// on element order in this set.
				/*
				{
					player: player class,
					log_record: FMStatInstance class,
				}
				*/
				red_stack: new Set(),
			},
			guest: {
				// persistent
				card_array: null,
				dom_index: null,

				// dynamic
				club: null,
				yc_map: new Map(),
				red_stack: new Set(),
			}
		}

		// Create the controls
		const self = this;
		for (const side of ['home', 'guest']){
			const tplate = ksys.tplates.index_tplate(
				'#red_card_control_template',
				{
					'header':  '.red_card_counter_head',
					'pool':    '.red_card_counter_pool',

					'card_a':  '.rcard1',
					'card_b':  '.rcard2',
					'card_c':  '.rcard3',
				}
			);
			this.sides[side].card_array = [
				tplate.index['card_a'],
				tplate.index['card_b'],
				tplate.index['card_c'],
			];
			this.sides[side].dom_index = tplate.index;

			tplate.index.pool.onclick = function(evt){
				if (evt.altKey){
					self.reg_red(self, side, null)
				}
			}
			tplate.index.pool.oncontextmenu = function(evt){
				if (evt.altKey){
					self.cancel_red(self, side)
				}
			}

			$('#red_card_counter').append(tplate.elem)
		}

	}

	// Show the relevant amount of cards in the counters
	// (old implementation)
	_redraw_counters(){
		for (const side of ['home', 'guest']){
			cmap = this.sides[side].yc_map;

			// Go through the records and count all the red cards
			let red_count = 0;

			// todo: is iterating without .values() faster?
			for (const record of cmap.values()){
				// Yes, (0 + true = 1) and (0 + false = 0)
				// And even (false + false = 0) and (true + true = 2)
				red_count += record.red;
			}

			// todo: retarded

			// hide all cards
			for (const card of this.sides[side].card_array){
				card.classList.remove('.rcard_shown')
			}
			// gradually show cards
			for (const idx of range(red_count)){
				const card = this.sides[side].card_array[idx];
				if (!card){break};

				card.classList.add('.rcard_shown');
			}
		}
	}

	// Show the relevant amount of cards in the counters
	redraw_counters(self){
		for (const side of ['home', 'guest']){
			// todo: retarded.
			// hide all cards
			for (const card of self.sides[side].card_array){
				card.classList.remove('rcard_shown')
			}
			// gradually show cards
			for (const idx of range(self.sides[side].red_stack.size)){
				const card = self.sides[side].card_array[idx];
				if (!card){break};

				card.classList.add('rcard_shown');
			}
		}

		// also resync vmix title (tiny red squares above timer)
		// todo: is this the right place ?
		self.resync_vmix(self)
	}


	// Show the cards the player has received
	// Directly in the list item
	// todo: get rid of jquery
	redraw_card_vis_feedback_in_list_item(self, list_dom=null, player=null){
		let items = [];
		if (!list_dom && !player){
			items = [...self.player_picker.filtered_entries];
			print('Redrawing entire list:', items)
		}else{
			items = [{
				'list_elem': list_dom,
				'player': player,
			}]
		}

		for (const list_item of items){
			print('Redrawing vis feedback for', list_item);

			const card_container = $('<div class="list_item_card_vis_feedback"></div>');
			const record = self.get_pside(self, list_item.player).yc_map.get(list_item.player);
			if (!record){continue};

			// if the player was warned - append a yellow card
			if (record.warned){
				card_container.prepend('<img contain src="./assets/yellow_card.png">');
			}

			// if the player has a red card - append the red card
			if (record.red){
				card_container.prepend('<img contain src="./assets/red_card.png">');
			}

			$(list_item.list_elem).find('.list_item_card_vis_feedback').remove();
			$(list_item.list_elem).append(card_container)
		}

	}


	// Enable/disable buttons based on selected player
	// And append cards to the list item
	eval_button_states(self){
		print('evaluating button states')
		// todo: it's really stupid that it's here
		self.redraw_card_vis_feedback_in_list_item(self)

		ksys.btns.toggle({
			'red_card':           false,
			'yellow_card':        false,
			'pardon_yellow_card': false,
		})
		const player = self.player_picker?.selected_entry?.player;
		if (!player){return};

		const record = self.get_pside(self, player).yc_map.get(player)
		// No record means this player may receive any card
		if (!record){
			ksys.btns.toggle({
				'red_card':    true,
				'yellow_card': true,
			})
			return
		};


		// A player can only receive 1 extra card: Another yellow
		if (record.warned){
			ksys.btns.toggle({
				'red_card':    true,
				'yellow_card': true,
			})
		}

		// A player cannot receive any more cards after a red one
		if (record.red){
			ksys.btns.toggle({
				'red_card':    false,
				'yellow_card': false,
			})
		}else{
			ksys.btns.toggle({
				'red_card':    true,
				'yellow_card': true,
			})
		}

		// Pardon is only available for players with cards
		if (record.red || record.warned){
			ksys.btns.toggle({
				'pardon_yellow_card': true,
			})
		}
	}


	// Resync dependencies:
	// If the club changed - purge old player card map and red counter
	resync(){
		for (const side of ['home', 'guest']){
			// the club currently loaded for this side in the system
			const active_club = kbmodules.football_standard.resource_index.side[side].club;
			// the club referenced in the CardManager registry
			const referenced_club = this.sides[side].club;
			// can only proceed if there's a club loaded for this side
			if (!active_club){continue};

			// if the referenced club does not match the club loaded in the system - resync
			// It's also intended to work when the referenced club is null
			if (active_club != referenced_club){
				this.sides[side].club = active_club;
				this.sides[side].yc_map = new Map();
				this.sides[side].red_stack = new Set();
				// and overwrite the visual header
				$(this.sides[side].dom_index.header).html(active_club.vis_header_elem())
			}
		}

		// Redraw the red card counters for both sides to reflect the current state
		this.redraw_counters(this)
	}

	// Get player's side (home/guest)
	// Player doesn't has to be registered for this to work
	get_pside(self, player, as_index=true){
		const side_id = player.club.is_enemy ? 'guest' : 'home';
		if (as_index){
			return self.sides[side_id]
		}else{
			return side_id
		}
	}

	// ensure that the player exists in the registry and return the record
	ensure_player_is_registered(self, player){
		// todo: duplicated code ?
		// const tgt_club = player.club;
		// const pside = tgt_club.is_enemy ? 'guest' : 'home';
		// const yc_map = self.sides[pside].yc_map;
		const yc_map = self.get_pside(self, player).yc_map

		// first check if the player exists in the card registry
		if (!yc_map.has(player)){
			yc_map.set(
				player,
				{
					'warned': false,
					'red': false,
				}
			)
		}

		return yc_map.get(player)
	}

	// 1+ code duplications is too much
	async show_card_title(title, player){
		// Set the player's surname
		await title.set_text(
			'player_name',
			`${player.player_num} ${ksys.strf.params.players.format(player.player_surname)}`,
		)
		// Set club logo
		await title.set_img_src('club_logo', player.club.logo_path)

		// show the title
		await title.overlay_in()
		// let it hang for 7 seconds
		await ksys.util.sleep(7000)
		// hide the title
		await title.overlay_out()
	}

	// hand a yellow card to a player
	async hand_yellow(self, player){
		if (!player){
			// this warning should never appear, because the caller should be
			// responsible for handing a valid player class
			ksys.info_msg.send_msg(
				`No player selected for yellow warning (this warning should never appear) ${player}`,
				'err',
				9000
			);
			console.error('Invalid side when handing a warning yellow card:', side);
			return
		}

		// ensure that the player exists in the registry
		const pcard_info = self.ensure_player_is_registered(self, player);

		// All 3 titles (yellow, red, ycbr) have the same fields
		// So the logic is: Figure out what's going on -> update registry ->
		// select the title to show -> update the title -> show the title
		let title = null;

		// If this is a second warning - the title is yellow+yellow=red
		if (pcard_info.warned){
			pcard_info.red = true;
			title = kbmodules.football_standard.titles.ycbr_card;
			// register this red card
			self.reg_red(self, self.get_pside(self, player, false), player)
		}else{
			// otherwise - it's a first warning
			pcard_info.warned = true;
			title = kbmodules.football_standard.titles.yellow_card;

			// todo: is this the right place?
			// save card data
			kbmodules.football_standard.global_save({'card_data': true})
		}

		self.eval_button_states(self)

		// update the corresponding vmix title and show it
		await this.show_card_title(title, player)

	}

	// immediately hand a red card to a player, skipping the first warning
	async hand_red(self, player){
		if (!player){
			// this warning should never appear, because the caller should be
			// responsible for handing a valid player class
			ksys.info_msg.send_msg(
				`No player selected for immediate red (this warning should never appear) ${player}`,
				'err',
				9000
			);
			console.error('Invalid side when handing an immediate red card:', side);
			return
		}

		// ensure that the player exists in the registry
		const pcard_info = self.ensure_player_is_registered(self, player);
		// todo: also flip warned to false ?
		pcard_info.red = true;
		// register this red card
		const pside = player.club.is_enemy ? 'guest' : 'home';
		self.reg_red(self, pside, player)

		const title = kbmodules.football_standard.titles.red_card;
		// update the corresponding title and show it
		await self.show_card_title(title, player)
	}

	// register a red card for the club
	reg_red(self, side, player=null){
		if (self.sides[side].red_stack.size >= 3){
			ksys.info_msg.send_msg(
				`There are 3 red cards already`,
				'warn',
				3000
			);
			return
		}
		// register this red card in the stack
		self.sides[side].red_stack.add({
			'player': player,
		})
		self.redraw_counters(self)
		self.eval_button_states(self)

		// todo: is this the right place?
		// save card data
		kbmodules.football_standard.global_save({'card_data': true})
	}

	// Cancel the last red card on team basis
	cancel_red(self, side){
		if (self.sides[side].red_stack.size <= 0){
			ksys.info_msg.send_msg(
				`There are no cards to remove`,
				'warn',
				3000
			);
			return
		}
		// delete the last card from the stack
		const last_red_player = self.sides[side].red_stack.at(-1)?.player;
		if (last_red_player){
			const record = self.get_pside(self, last_red_player).yc_map.get(last_red_player)
			if (record){
				record.red = false;
			}
		}

		self.sides[side].red_stack.del_idx(-1)

		// todo: is this the right place?
		// save card data
		kbmodules.football_standard.global_save({'card_data': true})

		self.redraw_counters(self)
		self.eval_button_states(self)
	}

	// pardon a red card by player class
	named_red_pardon(self, player){
		const pside = self.get_pside(self, player)
		for (const rcard_record of pside.red_stack){
			if (rcard_record.player == player){
				pside.red_stack.delete(rcard_record)
			}
		}

		// todo: is this the right place?
		// save card data
		kbmodules.football_standard.global_save({'card_data': true})
	}

	// Pardon the player
	pardon(self, player){
		const pcard_info = self.ensure_player_is_registered(self, player);
		const pside = player.club.is_enemy ? 'guest' : 'home';

		// Cancel first warning only
		if (pcard_info.warned && !pcard_info.red){
			print('Cancelling first warning')
			pcard_info.warned = false;
			self.eval_button_states(self)
			self.redraw_counters(self)

			// todo: is this the right place?
			// save card data
			kbmodules.football_standard.global_save({'card_data': true})
			return
		}

		// Cancel ycbr
		if (pcard_info.warned && pcard_info.red){
			print('Cancelling ycbr')
			pcard_info.red = false;
			// self.cancel_red(self, pside)
			self.named_red_pardon(self, player)
			self.eval_button_states(self)
			self.redraw_counters(self)

			// todo: is this the right place?
			// save card data
			kbmodules.football_standard.global_save({'card_data': true})
			return
		}

		// Cancel immediate red
		if (!pcard_info.warned && pcard_info.red){
			print('Immediate red')
			pcard_info.red = false;
			// self.cancel_red(self, pside)
			self.named_red_pardon(self, player)
			self.eval_button_states(self)
			self.redraw_counters(self)

			// todo: is this the right place?
			// save card data
			kbmodules.football_standard.global_save({'card_data': true})
			return
		}

	}

	// resync title state in vmix
	async resync_vmix(self){
		// L
		// todo: there's an automatic assumption that home is index 1 of the cards
		const retarded = ['home', 'guest'];
		for (const _side_idx in retarded){
			const side_idx = int(_side_idx)
			const side = self.sides[retarded[side_idx]];

			for (const card_idx of range(3)){
				await kbmodules.football_standard.titles.timer.toggle_img(`rcard_${side_idx+1}_${card_idx+1}`, !!side.red_stack.at(card_idx))
			}
		}
	}

	// todo: check whether club names match
	apply_data(input_data){
		if (!input_data){
			console.warn('Tried loading invalid card data:', input_data);
			return
		};

		for (const side of ['home', 'guest']){
			// todo: is it fine to get club by side ?
			const club = this.sides[side].club;

			if (!input_data[side] || !club){continue};

			this.sides[side].yc_map = new Map();
			this.sides[side].red_stack = new Set();

			// reconstruct yc map
			for (const player_nameid in input_data[side].yc_map){
				const player = club.get_player_by_nameid(player_nameid);
				const record_data = input_data[side].yc_map[player_nameid];
				if (!player){continue};

				this.sides[side].yc_map.set(player, record_data);
			}

			// reconstruct red stack
			for (const player_nameid of input_data[side].red_stack){
				const player = club.get_player_by_nameid(player_nameid);
				if (!player && player_nameid !== false){continue};

				this.sides[side].red_stack.add({
					'player': player || null,
				})
			}
		}

		// redraw/resync stuff
		this.redraw_counters(this)
		this.redraw_card_vis_feedback_in_list_item(this)
		this.eval_button_states(this)
	}
}







kbmodules.football_standard.ClubGoals = class {
	constructor(parent_club, init_data=null){
		this.parent_club = parent_club;

		this.tplate = ksys.tplates.index_tplate(
			'#club_score_list_template',
			{
				'header':              'club-score club-score-header',
				'list':                'club-score-list',
				'add_score_named_btn': 'club-score-buttons .club_score_add_record.add_score_with_player',
				'add_score_anon_btn': 'club-score-buttons .club_score_add_record.add_score_blank',
			}
		);

		// The dom element of the control panel
		this.dom = this.tplate.elem;

		// The score stack. Last element = latest score
		// it's an array of dicts:
		/*
			{
				'author': player class or null,
				'flags': {
					'autogoal': false,
					'penalty': false,
				},
				'time': score timestamp components,

				'dom_struct': the dom of the score element,
			}
		*/
		this.score_stack = new Set();

		this.selected_record = null;

		// append header
		this.tplate.index.header.append(parent_club.vis_header_elem())

		// bind button
		const self = this;

		this.tplate.index.add_score_named_btn.onclick = function(evt){
			const selected_player = kbmodules.football_standard.resource_index.score_manager.player_picker?.selected_entry?.player;
			if (!selected_player){
				ksys.info_msg.send_msg(
					`No player selected !`,
					'warn',
					3000
				);
				return
			}

			self.add_score(self, selected_player)
		}

		this.tplate.index.add_score_anon_btn.onclick = function(evt){
			self.add_score(self, null)
		}
	}

	// Add a score
	add_score(self, player=null, flags=null, timestamp_override=null, dosave=true, ignore_timer=false){
		const input_flags = flags || {};
		// create a dom template
		const tplate = ksys.tplates.index_tplate(
			'#club_score_record_template',
			{
				'timestamp':     'input.score_timestamp',
				'score_author':  '.score_author',

				// flags
				'autogoal_flag':  'score-record-flags record-flag[flag_name="auto_goal"] input',
				'penalty_flag':   'score-record-flags record-flag[flag_name="penalty"] input',

				'autogoal_hitbox':  'score-record-flags record-flag[flag_name="auto_goal"]',
				'penalty_hitbox':   'score-record-flags record-flag[flag_name="penalty"]',
			}
		);

		// sanity check
		// if (!kbmodules.football_standard?.base_counter?.tick && !ignore_timer){
		if (false){
			ksys.info_msg.send_msg(
				`Main timer does not exist (no timestamp will be added to the score record)`,
				'warn',
				9000
			);
		}

		// get combined current time in minutes
		// todo: is it possible for timestamp_override to happen to be random rubbish data
		// therefore corrupting half the data structure ?
		const calculated_timestamp = timestamp_override || kbmodules.football_standard.get_current_time(true);

		// create a registry record
		// todo: protection from garbage in input_flags.autogoal & input_flags.penalty
		const record = {
			'author': player,
			'flags': {
				'autogoal': input_flags.autogoal || false,
				'penalty':  input_flags.penalty || false,
			},
			'time': calculated_timestamp,

			'dom_struct': tplate,
		}

		// push the record to the stack
		self.score_stack.add(record)


		// modify the template

		// add flags
		tplate.index.autogoal_flag.checked = record.flags.autogoal;
		tplate.index.penalty_flag.checked = record.flags.penalty;

		// set timestamp in minutes
		if (calculated_timestamp.extra){
			tplate.index.timestamp.value = `${calculated_timestamp.base} + ${calculated_timestamp.extra}`;
		}else{
			tplate.index.timestamp.value = calculated_timestamp.base;
		}

		// set author, if any
		if (player){
			// todo: get rid of jquery?
			$(tplate.index.score_author).html(player.generic_list_elem().elem);

			// idiot
			if (!self.parent_club.playerbase.has(player)){
				// todo: make it present by default, but with visibility disabled
				// todo: duplicated code
				$(tplate.index.score_author).append(
					'<img contain class="self_score_indicator" src="./assets/clown.png">'
				)
			}
		}


		// Add bindings

		// Time change
		tplate.index.timestamp.onchange = function(evt){
			const input_val = evt.target.value;

			// sanity check
			if (input_val.includes('+') && (!input_val.includes('45') && !input_val.includes('90'))){
				ksys.info_msg.send_msg(
					`Are you sure this is a valid format ?`,
					'warn',
					5000
				);
			}

			const components = input_val.split('+');
			record.time.base = int(components[0] || 0);
			record.time.extra = int(components[1] || 0);

			kbmodules.football_standard.global_save({'scores': true});
		}

		// flags
		{
			// todo: this is retarded

			// explanation: since the entire data struct relies on "change" event
			// coming from checkboxes - it'd be much easier to simulate an onclick event
			// rather than bothering with maintaining the struct
			// (cbox.checked = true does not trigger onchange event)
			// todo: update: this breaks saving
			const _click_switch = function(evt){
				const target_cbox = evt.target.closest('record-flag').querySelector('input');

				// switch off other flags
				for (const flag of evt.target.closest('score-record-flags').querySelectorAll('record-flag input')){
					if (target_cbox == flag){continue};

					if (flag.checked){
						flag.click()
					}
				}

				// activate target
				evt.target.closest('record-flag').querySelector('input').click();

				// kbmodules.football_standard.global_save({'scores': true})
			}

			// autogoal flag change
			// tplate.index.autogoal_flag.onchange = function(evt){
			// 	record.flags.autogoal = evt.target.checked;
			// }
			// penalty flag change
			// tplate.index.penalty_flag.onchange = function(evt){
			// 	record.flags.penalty = evt.target.checked;
			// }

			// todo: this is a stupid retarded hack. What if there are more checkboxes ?
			// (this is related to )
			tplate.index.autogoal_hitbox.onclick = function(evt){
				if (tplate.index.autogoal_flag.checked){
					tplate.index.autogoal_flag.checked = false;
					tplate.index.penalty_flag.checked = false;

					record.flags.autogoal = false;
					record.flags.penalty = false;
				}else{
					tplate.index.autogoal_flag.checked = false;
					tplate.index.penalty_flag.checked = false;

					tplate.index.autogoal_flag.checked = true;
					record.flags.penalty = false;
					record.flags.autogoal = true;
				}

				kbmodules.football_standard.global_save({'scores': true})
			};
			tplate.index.penalty_hitbox.onclick = function(evt){
				if (tplate.index.penalty_flag.checked){
					tplate.index.autogoal_flag.checked = false;
					tplate.index.penalty_flag.checked = false;

					record.flags.autogoal = false;
					record.flags.penalty = false;
				}else{
					tplate.index.autogoal_flag.checked = false;
					tplate.index.penalty_flag.checked = false;

					tplate.index.penalty_flag.checked = true;
					record.flags.autogoal = false;
					record.flags.penalty = true;
				}

				kbmodules.football_standard.global_save({'scores': true})
			};
		}


		// Deletion
		tplate.elem.oncontextmenu = function(evt){
			if (evt.altKey){
				// if deleted record is also the one currently selected - deselect
				if (record == self.selected_record){
					self.selected_record = null;
				}
				self.score_stack.delete(record);
				tplate.elem.remove()
				kbmodules.football_standard.resource_index.score_manager.resync_score_on_title()

				kbmodules.football_standard.global_save({'scores': true})
			}
		}

		// changing the author
		tplate.elem.onclick = function(evt){
			if (!evt.target.closest('.score_author')){return};
			// stupid hack to make it possible to toggle
			const do_toggle = self.selected_record == record;

			kbmodules.football_standard.resource_index.score_manager.reset_player_selection();

			self.set_selected_record(self, record)

			if (do_toggle){
				kbmodules.football_standard.resource_index.score_manager.reset_player_selection();
			}
		}

		// todo: is this stupid?
		if (dosave){
			kbmodules.football_standard.global_save({'scores': true})
		}

		// finally, append the template to the DOM
		self.tplate.index.list.append(tplate.elem)

		// todo: what about async methods in here?
		// this function is also used to load scores from the previous save...
		kbmodules.football_standard.resource_index.score_manager.resync_score_on_title()
	}

	// modify the author of the selected score record
	mod_author(self){
		// sanity check
		if (!self.selected_record){
			ksys.info_msg.send_msg(
				`Unable to modify the author, because no record is selected (This message should never appear)`,
				'err',
				9000
			);
			return
		}

		// get the new player selected in the player picker
		const new_player = kbmodules.football_standard.resource_index.score_manager.player_picker.selected_entry.player;

		// modify the record
		self.selected_record.author = new_player;

		print('Selected don struct', self.selected_record)

		$(self.selected_record.dom_struct.index.score_author).html(new_player.generic_list_elem().elem)

		// idiot
		if (!self.parent_club.playerbase.has(new_player)){
			// todo: make it present by default, but with visibility disabled
			$(self.selected_record.dom_struct.index.score_author).append(
				'<img class="self_score_indicator" src="./assets/clown.png">'
			)
		}else{
			$(self.selected_record.dom_struct.index.score_author).find('.self_score_indicator').remove()
		}

		// reset the record selection to prevent accidents
		kbmodules.football_standard.resource_index.score_manager.reset_player_selection();

		// todo: is this the right place ?
		kbmodules.football_standard.global_save({'scores': true})
	}

	set_selected_record(self, record){
		self.selected_record = record;
		$(self.dom).find('.selected_score_record').removeClass('selected_score_record');
		record.dom_struct.elem.classList.add('selected_score_record');
	}
}



// This class keeps track of both sides' scores
kbmodules.football_standard.ScoreManager = class {
	constructor(init_data=null){
		this.sides = {
			'home': {
				'score_list': null,
			},
			'guest': {
				'score_list': null,
			},
		}

		// create the player picker
		this.player_picker = new kbmodules.football_standard.PlayerPicker(
			[[]],
			function(){return true}
		)

		$('#score_ctrl_player_search').append(this.player_picker.box)
	}

	resync_picker_sources(){
		const new_source = [];
		for (const side of ['home', 'guest']){
			// todo: if not lineup - continue
			new_source.push(kbmodules.football_standard.resource_index.side[side]?.lineup?.main_players || []);
			new_source.push(kbmodules.football_standard.resource_index.side[side]?.lineup?.reserve_players || []);
		}
		this.player_picker.data_source = new_source;
	}

	// resync lineups
	resync_lineups(){
		// todo: there are too many 'for side of home, guest' loops
		for (const side of ['home', 'guest']){
			const club_data = kbmodules.football_standard.resource_index.side[side]
			if (club_data.lineup){
				const club_goals = new kbmodules.football_standard.ClubGoals(club_data.club);
				this.sides[side].score_list = club_goals;
				$(`#score_ctrl_${side}`).html(club_goals.dom);
			}
		}
	}

	reset_player_selection(){
		// important todo: Global level: don't even bother checking
		// wether both sides have lineups defined.
		// Simply make such tabs inaccessible.
		for (const side of ['home', 'guest']){
			const score_list = kbmodules.football_standard.resource_index.score_manager.sides[side].score_list;
			if (!score_list){continue};

			score_list.selected_record = null;
			$(score_list.dom).find('.selected_score_record').removeClass('selected_score_record');
		}
		
	}

	async resync_score_on_title(){
		const title = kbmodules.football_standard.titles.timer;

		// important todo: keep doing these stupid checks or simply lock all tabs till both lineups are present ?
		const home_score_list = kbmodules.football_standard.resource_index.score_manager.sides?.home?.score_list
		if (home_score_list){
			await title.set_text('score_l', home_score_list.score_stack.size)
		}

		const guest_score_list = kbmodules.football_standard.resource_index.score_manager.sides?.guest?.score_list
		if (guest_score_list){
			await title.set_text('score_r', guest_score_list.score_stack.size)
		}
		
	}

	// todo: add as_string param to all to_json() methods
	to_json(){
		const dump = {
			'home': {
				'club_name': null,
				'score_list': [],
			},
			'guest': {
				'club_name': null,
				'score_list': [],
			},
		};

		for (const side of ['home', 'guest']){
			if (!this.sides[side].score_list){continue};

			dump[side].club_name = this.sides[side].score_list.parent_club.club_name.lower();

			for (const score of this.sides[side].score_list.score_stack){
				dump[side].score_list.push({
					'author': score?.author?.name_id || null,
					'flags': score.flags,
					'timestamp': score.time,
				})
			}
		}

		return dump
	}

	// todo: check club names
	// todo: make all to_json/apply_data functions be like in this class
	// (solid data structure and the save function from outside doesn't even create a temp buffer)
	apply_data(input_data){
		for (const side of ['home', 'guest']){
			const tgt_score_list = this.sides[side].score_list;
			const src_score_list = input_data[side].score_list;
			if (!tgt_score_list || !src_score_list){continue};

			for (const score of src_score_list){
				const player =
					this.sides.home?.score_list?.parent_club?.get_player_by_nameid?.(score.author)
					||
					this.sides.guest?.score_list?.parent_club?.get_player_by_nameid?.(score.author)
					||
					null

				tgt_score_list.add_score(
					tgt_score_list,
					player,
					score.flags,
					score.timestamp,
					false,
					true,
				)
			}
		}

		// todo: is this really needed ?
		this.resync_score_on_title()
	}

	// todo: unused
	get selected_score_record(){
		return (
			this.sides?.home?.score_list?.selected_record
			||
			this.sides?.guest?.score_list?.selected_record
			||
			null
		)
	}

	modify_score_author(){
		// todo: beautify ?
		if (this.sides?.home?.score_list?.selected_record){
			this.sides.home.score_list.mod_author(this.sides.home.score_list)
			return
		}
		if (this.sides?.guest?.score_list?.selected_record){
			this.sides.guest.score_list.mod_author(this.sides.guest.score_list)
			return
		}
	}
}
























// Create new club and overwrite previous club control
// This is triggered when a "New Club" button is pressed in the "Club" panel
kbmodules.football_standard.create_new_club = function(club_resources=null, open_panel=true){
	kbmodules.football_standard.save_club_to_local_db()

	// create new club class
	const new_club = new kbmodules.football_standard.FootballClub(club_resources);
	// write club reference to the registry
	kbmodules.football_standard.resource_index.club_ctrl = new_club;
	new_club.open_panel()
}

// Save file to an abstract location on disk
kbmodules.football_standard.save_club_to_file = function(){
	const tgt_dir = $('#club_ctrl_save_to_file_target .tgtdir').val();

	// this checks whether the save path input DOM element has at least something in it
	// and wether the club exists at all
	if (!tgt_dir || !kbmodules.football_standard.resource_index.club_ctrl){
		ksys.info_msg.send_msg('Dir path or filename is invalid (not specified)', 'err', 5000);
		return
	};

	// construct path
	// todo: lowercase the club name ?
	const tgt_file = Path(
		tgt_dir,
		($('#club_ctrl_save_to_file_target .tgtfname').val() || 'club_info') + '.clubdef',
	);

	// important todo: check if the path exists
	// Write the json file
	tgt_file.writeFileSync(
		JSON.stringify(kbmodules.football_standard.resource_index.club_ctrl.to_json(), null, '\t')
	)

	// todo: is this the right place for it?
	// see explanation in save_club_to_local_db about why is it here
	kbmodules.football_standard.global_save(null)
}


// Delete currently edited club from disk
// and wipe anything referencing that club from the interface
kbmodules.football_standard.delete_current_club = function(evt){
	if (!evt.ctrlKey){return};

	const club = kbmodules.football_standard.resource_index.club_ctrl;
	if (!club){return};

	// 1 - erase club from GUI
	club.erase()
	// 2 - delete from database
	print('DELETE ME PLEASE')
	ksys.db.module.path().join('clubs', `${club.club_name.lower()}.clubdef`).deleteSync()
	// 3 - resync dropdowns
	kbmodules.football_standard.resource_index.club_selector_dropdown.resync()
}


kbmodules.football_standard.save_club_to_local_db = function(mute=true){
	// Make sure there's a club to save
	if (!kbmodules.football_standard.resource_index?.club_ctrl?.club_name){
		if (!mute){
			ksys.info_msg.send_msg(`Invalid club name`, 'err', 5000);
		}
		return
	};
	// ensure that the club title is not empty
	const club_info = kbmodules.football_standard.resource_index.club_ctrl.to_json();

	// write file
	ksys.db.module.write(
		`clubs/${club_info.club_name.lower()}.clubdef`,
		JSON.stringify(club_info, null, '\t')
	)

	ksys.info_msg.send_msg(`Save OK`, 'ok', 500);

	// re-index dropdowns
	kbmodules.football_standard.resource_index.club_selector_dropdown.resync()

	// todo: is this the right place for this?
	// Trigger full global save
	// Reason: To keep data consistency.
	// Example:
	//     1 - Players are placed on the field
	//     2 - Player's name changes
	//     3 - Last lineup save still has the old name
	//     4 - Controller reolads and tries loading last layout
	//     5 - The mechanism encouters the old, unchanged name
	//     6 - The mechanism creates resonance cascade
	//     7 - Everybody dies.
	//         (JK LOL, it simply skips the problematic player,
	//         aka he will not be added to any lists or field.
	//         I hope it's understandable, that this is bad enough, or at least stupid)
	kbmodules.football_standard.global_save(null)
}


// get club json by name without any further actions
kbmodules.football_standard.get_club_info_by_name = function(clubname=null){
	if (!clubname){return};

	const club_name = clubname.lower();
	const club_info = ksys.db.module.read(`clubs/${club_name}.clubdef`, 'json');
	if (!club_info){return};

	return club_info
}

// Load existing club into the control panel, this does NOT create a lineup
// This is only needed for EDITING the club
kbmodules.football_standard.load_club_by_name = function(clubname=null){
	if (!clubname){return};

	const existing_home = kbmodules.football_standard.resource_index.home_club;
	const existing_guest = kbmodules.football_standard.resource_index.guest_club;

	if (clubname.lower() == existing_home?.club_name.lower()){
		// todo: is this the right place for this ?
		kbmodules.football_standard.save_club_to_local_db()

		existing_home.open_panel()
		return
	}
	if (clubname.lower() == existing_guest?.club_name.lower()){
		// todo: is this the right place for this ?
		kbmodules.football_standard.save_club_to_local_db()

		existing_guest.open_panel()
		return
	}
	kbmodules.football_standard.create_new_club(kbmodules.football_standard.get_club_info_by_name(clubname))
}



// Create lineup from club name. This will forward club info the rest of the controller
// (add visual header cues and so on)
// This is triggered when:
//     - A club is selected from the Home/Guest club dropdown in Config/Lists
//     - Club being loaded from previous controller state
kbmodules.football_standard.create_club_lineup = function(side, clubname, input_lineup_info=null){
	if (!clubname){
		// This should never happen, because this function can only be triggered
		// internally
		ksys.info_msg.send_msg(
			`How did this even happen? No clubname supplied to lineup loader (everything's fine): >${clubname}<`,
			'err',
			9000
		);
		return
	};

	if (clubname.lower() == kbmodules.football_standard.resource_index.side[side == 'home' ? 'guest' : 'home']?.club?.club_name?.lower?.()){
		ksys.info_msg.send_msg(
			`Unfortunately, the data structure does not allow clubs palying against themselves`,
			'err',
			9000
		);
		return
	}

	let club = null;

	// todo: if the club that's being edited at the momment
	// gets chosen as both home and guest club - everything breaks

	// Check if the requested club is the one being edited in the Clubs panel
	if (kbmodules.football_standard.resource_index.club_ctrl?.club_name?.lower?.() == clubname.lower()){
		// if so - get the Club class reference from the resource index
		club = kbmodules.football_standard.resource_index.club_ctrl;
		// and update the is_enemy flag
		kbmodules.football_standard.resource_index.club_ctrl.is_enemy = (side == 'guest');

	}else{
		// if not - create new Club class,
		// because a lineup cannot exist without a club
		// Lineup class is always a parent of a Club class
		club = new kbmodules.football_standard.FootballClub(
			kbmodules.football_standard.get_club_info_by_name(clubname),
			side == 'guest'
		);
	}

	// create player lineup for the club
	const lineup = new kbmodules.football_standard.TeamLineup(
		// parent club
		club,
		// available uniform colours
		kbmodules.football_standard.resource_index.available_colors,
		// input info (player lists, field layout, etc ...)
		input_lineup_info
	)

	// create field layout
	const field_layout = new kbmodules.football_standard.FieldLayout(lineup)

	if (side == 'home'){
		// write down the club to the resource index
		kbmodules.football_standard.resource_index.home_club = club;
		// write down lineup to the resource index
		kbmodules.football_standard.resource_index.home_lineup = lineup;
		// write field reference to the resource index
		kbmodules.football_standard.resource_index.home_field = field_layout;
	}

	if (side == 'guest'){
		// write down the club to the resource index
		kbmodules.football_standard.resource_index.guest_club = club;
		// write down lineup to the resource index
		kbmodules.football_standard.resource_index.guest_lineup = lineup;
		// write field reference to the resource index
		kbmodules.football_standard.resource_index.guest_field = field_layout;
	}

	// New fancy system
	// (should've been like that from the very beginning)
	if (['home', 'guest'].includes(side)){
		kbmodules.football_standard.resource_index.side[side].club = club;
		kbmodules.football_standard.resource_index.side[side].lineup = lineup;
		kbmodules.football_standard.resource_index.side[side].field = field_layout;
	}



	// stupid, but works, who cares

	// create lineup panel
	$(`${side}-club-lineup`).html(lineup.control_panel_elem());
	// Create field layout
	$(`${side}-field-layout`).html(field_layout.tplate.elem);
	// Overwrite header element in the Field Layout Control section
	$(`#${side}_layout_ctrl .layout_ctrl_head`).html(lineup.club.vis_header_elem())


	// Update sources for the card/goal filter
	// It would be easier to store a reference to the player pools
	// somewhere in the global index, but that will introduce
	// completely unneccessary complications
	kbmodules.football_standard.resource_index.card_player_filter.data_source = [
		(kbmodules.football_standard.resource_index.home_lineup ? kbmodules.football_standard.resource_index.home_lineup.main_players : []),
		(kbmodules.football_standard.resource_index.home_lineup ? kbmodules.football_standard.resource_index.home_lineup.reserve_players : []),

		(kbmodules.football_standard.resource_index.guest_lineup ? kbmodules.football_standard.resource_index.guest_lineup.main_players : []),
		(kbmodules.football_standard.resource_index.guest_lineup ? kbmodules.football_standard.resource_index.guest_lineup.reserve_players : []),
	]

	// update sources for substitutes
	for (const side of ['home', 'guest']){
		for (const rtype of ['leaving', 'inbound']){
			kbmodules.football_standard.resource_index.side[side].substitute[rtype].data_source = [
				(kbmodules.football_standard.resource_index.side[side]?.lineup?.main_players || []),
				(kbmodules.football_standard.resource_index.side[side]?.lineup?.reserve_players || []),
			]
		}
	}

	// update sources for score picker
	kbmodules.football_standard.resource_index.score_manager.resync_picker_sources()

	// resync score manager
	kbmodules.football_standard.resource_index.score_manager.resync_lineups()

	// resync card manager
	kbmodules.football_standard.resource_index.card_manager.resync(kbmodules.football_standard.resource_index.card_manager)

	// resync old system stats headers
	// todo: finally make old stat system use new stuff
	{
		if (kbmodules.football_standard.resource_index.side.home.club){
			$('#team_stats_theader_home').html(kbmodules.football_standard.resource_index.side.home.club.vis_header_elem());
			$('#team_stats_btn_ctrl_home').html(kbmodules.football_standard.resource_index.side.home.club.vis_header_elem());
			$('#replacement_team1 .replacement_team_head').html(kbmodules.football_standard.resource_index.side.home.club.vis_header_elem());
		}
		if (kbmodules.football_standard.resource_index.side.guest.club){
			$('#team_stats_theader_guest').html(kbmodules.football_standard.resource_index.side.guest.club.vis_header_elem());
			$('#team_stats_btn_ctrl_guest').html(kbmodules.football_standard.resource_index.side.guest.club.vis_header_elem());
			$('#replacement_team2 .replacement_team_head').html(kbmodules.football_standard.resource_index.side.guest.club.vis_header_elem());
		}		
	}
}


// forward team colours to vmix timer + score title
kbmodules.football_standard.update_team_colors = function(){
	const base_path = Path('C:/custom/vmix_assets/t_shirts/overlay');
	const home = kbmodules.football_standard.resource_index.home_lineup;
	const guest = kbmodules.football_standard.resource_index.guest_lineup;

	if (home){
		// tshirt home
		kbmodules.football_standard.titles.timer.set_img_src(
			'team_col_l_top',
			base_path.join(`l_top_${home.colors.tshirt}.png`),
		)
		// shorts home
		kbmodules.football_standard.titles.timer.set_img_src(
			'team_col_l_bot',
			base_path.join(`l_bot_${home.colors.shorts}.png`),
		)
	}

	if (guest){
		// tshirt guest
		kbmodules.football_standard.titles.timer.set_img_src(
			'team_col_r_top',
			base_path.join(`r_top_${guest.colors.tshirt}.png`),
		)
		// shorts guest
		kbmodules.football_standard.titles.timer.set_img_src(
			'team_col_r_bot',
			base_path.join(`r_bot_${guest.colors.shorts}.png`),
		)
	}
}

// Clear the player list in the lineup vmix title
kbmodules.football_standard.wipe_player_list_from_title = async function(){
	for (const idx of range(1, 12)){
		// player number
		await kbmodules.football_standard.titles.team_layout.set_text(`plist_num_${idx}`, '')
		// player surname
		await kbmodules.football_standard.titles.team_layout.set_text(`plist_pname_${idx}`, '');
	}
	await ksys.util.sleep(500)
}

// Push current field layout/lineup to the field layout title in vmix
kbmodules.football_standard._forward_field_layout_to_vmix = async function(team){
	const tgt_side = str(team).lower();
	const tgt_field = kbmodules.football_standard.resource_index.side?.[tgt_side]?.field;

	if (!tgt_field){
		ksys.info_msg.send_msg('Lineup does not exist for this side', 'warn', 9000);
		return
	}

	// Switch off all buttons responsible for showing the title on screen
	ksys.btns.toggle({
		'show_home_field_layout':    false,
		'hide_home_field_layout':    false,
		'show_guest_field_layout':   false,
		'hide_guest_field_layout':   false,

		'prepare_home_team_layout':  false,
		'prepare_guest_team_layout': false,
	})

	// target vmix title
	const title = kbmodules.football_standard.titles.team_layout;

	// t-shirt colours
	// todo: remove hardcoded paths
	const player_tshirt_col =
	Path('C:\\custom\\vmix_assets\\t_shirts\\tshirts')
	.join(`${tgt_field.lineup.colors.tshirt || 'ffffff'}.png`);

	// await title.pause_render()

	// 
	// player slots
	// 
	// await kbmodules.football_standard.wipe_player_list_from_title()

	// Set label back to starters
	await title.set_text('playerlist_head', 'СТАРТОВІ');

	for (const cell of tgt_field.iter_cells()){
		// tshirt colour
		await title.set_img_src(`plr_bg_${cell.id}`, str(player_tshirt_col));
		// player number
		await title.toggle_text(`plr_num_${cell.id}`, !!cell.player)
		// player name
		await title.toggle_text(`plr_name_${cell.id}`, !!cell.player)
		// tshirt image
		await title.toggle_img(`plr_bg_${cell.id}`, !!cell.player)

		if (cell.player){
			// player number
			await title.set_text(`plr_num_${cell.id}`, cell.player.player_num);
			// player name
			await title.set_text(`plr_name_${cell.id}`, ksys.strf.params.players.format(cell.player.player_surname));
		}
	}
	// goalkeeper tshirt colour
	const gk_tshirt_col =
	Path('C:\\custom\\vmix_assets\\t_shirts\\tshirts')
	.join(`${tgt_field.lineup.colors.gk || 'ffffff'}.png`);
	await title.set_img_src(`plr_bg_8_5`, str(gk_tshirt_col))



	// 
	// Main players
	// 

	// todo: stupid counter ?
	// let counter = 1;
	// for (const player of tgt_field.lineup.main_players){
	for (const player_idx of range(11)){
		const player = tgt_field.lineup.main_players.at(player_idx);

		const player_num = player?.player_num || '';
		const player_surname = ksys.strf.params.players.format(player?.player_surname || '')

		// player number
		await title.set_text(`plist_num_${player_idx + 1}`, player_num)
		// player surname
		await title.set_text(`plist_pname_${player_idx + 1}`, player_surname);

		// counter += 1;
	}



	// Coach
	await title.set_text(
		'coach_name',
		ksys.strf.params.coach.format(tgt_field.lineup.club.main_coach)
	)
	// Club name
	await title.set_text(
		'club_name',
		ksys.strf.params.club_name.format(tgt_field.lineup.club.club_name)
	)
	// Club logo
	await title.set_img_src('club_logo', tgt_field.lineup.club.logo_path)
	print('Finished')

	// await title.resume_render()

	// Enable buttons responsible for showing the team's layout which was just prepared
	{
		ksys.btns.pool[`show_${tgt_side}_field_layout`].toggle(true)
		ksys.btns.pool[`hide_${tgt_side}_field_layout`].toggle(true)

		ksys.btns.pool[`prepare_home_team_layout`].toggle(true)
		ksys.btns.pool[`prepare_guest_team_layout`].toggle(true)
	}
}


kbmodules.football_standard.forward_field_layout_to_vmix = async function(team){
	const tgt_side = str(team).lower();
	const tgt_field = kbmodules.football_standard.resource_index.side?.[tgt_side]?.field;

	if (!tgt_field){
		ksys.info_msg.send_msg('Lineup does not exist for this side', 'warn', 9000);
		return
	}

	// Switch off all buttons responsible for showing the title on screen
	ksys.btns.toggle({
		'show_home_field_layout':    false,
		'hide_home_field_layout':    false,

		'show_guest_field_layout':   false,
		'hide_guest_field_layout':   false,

		'prepare_home_team_layout':  false,
		'prepare_guest_team_layout': false,
	})

	// get target vmix title
	const title = kbmodules.football_standard.titles.team_layout;

	// construct t-shirt colour path
	// (absolute path to the corresponding tshirt colour)
	// todo: remove hardcoded paths
	const player_tshirt_col =
	Path('C:\\custom\\vmix_assets\\t_shirts\\tshirts')
	.join(`${tgt_field.lineup.colors.tshirt || 'ffffff'}.png`);




	// -------------------
	// player cells on field
	// -------------------
	for (const cell of tgt_field.iter_cells()){
		// tshirt colour
		await title.set_img_src(`plr_bg_${cell.id}`, str(player_tshirt_col));
		// player number
		await title.toggle_text(`plr_num_${cell.id}`, !!cell.player)
		// player name
		await title.toggle_text(`plr_name_${cell.id}`, !!cell.player)
		// tshirt image
		await title.toggle_img(`plr_bg_${cell.id}`, !!cell.player)

		if (cell.player){
			// player number
			await title.set_text(`plr_num_${cell.id}`, cell.player.player_num);
			// player name
			await title.set_text(`plr_name_${cell.id}`, ksys.strf.params.players.format(cell.player.player_surname));
		}
	}
	// goalkeeper tshirt colour
	const gk_tshirt_col =
	Path('C:\\custom\\vmix_assets\\t_shirts\\tshirts')
	.join(`${tgt_field.lineup.colors.gk || 'ffffff'}.png`);
	await title.set_img_src(`plr_bg_8_5`, str(gk_tshirt_col))




	// -------------------
	// player slots in lineup
	// -------------------

	// 
	// Player slots in lineup
	// 
	const data_mapping = [
		{
			'plist': tgt_field.lineup.main_players,
			'slot_type': 'm',
		},
		{
			'plist': tgt_field.lineup.reserve_players,
			'slot_type': 'r',
		},
	]
	for (const list_data of data_mapping){
		for (const player_idx of range(11)){

			const player = list_data.plist.at(player_idx);

			const player_num = player?.player_num || '';
			const player_surname = ksys.strf.params.players.format(player?.player_surname || '')

			// player number
			await title.set_text(
				`plist_num_${list_data.slot_type}_${player_idx + 1}`,
				player_num
			)
			// player surname
			await title.set_text(
				`plist_pname_${list_data.slot_type}_${player_idx + 1}`,
				player_surname
			);
		}
	}



	// -------------------
	// Misc.
	// -------------------

	// Coach
	await title.set_text(
		'coach_name',
		ksys.strf.params.coach.format(tgt_field.lineup.club.main_coach)
	)
	// Club name
	await title.set_text(
		'club_name',
		ksys.strf.params.club_name.format(tgt_field.lineup.club.club_name)
	)
	// Club logo
	await title.set_img_src('club_logo', tgt_field.lineup.club.logo_path)
	print('Finished forwarding layout data to VMIX')

	await ksys.util.sleep(1000)

	// Enable buttons responsible for showing the team's layout which was just prepared
	{
		ksys.btns.pool[`show_${tgt_side}_field_layout`].toggle(true)
		ksys.btns.pool[`hide_${tgt_side}_field_layout`].toggle(true)

		// do these two in batch
		ksys.btns.pool[`prepare_home_team_layout`].toggle(true)
		ksys.btns.pool[`prepare_guest_team_layout`].toggle(true)
	}
}


// Show the field layout on screen
kbmodules.football_standard._show_field_layout = async function(team){
	const tgt_lineup = kbmodules.football_standard.resource_index.side?.[str(team).lower()]?.lineup;

	// todo: there's a batch switch now
	{
		ksys.btns.pool[`show_home_field_layout`].toggle(false)
		ksys.btns.pool[`show_guest_field_layout`].toggle(false)
	}

	const title = kbmodules.football_standard.titles.team_layout;


	// ?????
	await ksys.util.sleep(1000)

	// show the overlay
	await title.overlay_in()

	// ?????
	await ksys.util.sleep(7000)

	// wait for 10 seconds
	// await ksys.util.sleep(10000)
	await ksys.util.sleep(5000)


	// pause render
	await title.pause_render()

	// ?????
	await ksys.util.sleep(1000)

	// commit warcrimes (changes)
	// await kbmodules.football_standard.wipe_player_list_from_title()

	// Set label to reserve
	await title.set_text('playerlist_head', 'ЗАПАСНІ');

	let counter = 1;
	for (const idx of range(1, 12)){
		// await ksys.util.sleep(100)
		const player = tgt_lineup.reserve_players.at(idx - 1);
		if (player){
			// player number
			await title.set_text(`plist_num_${idx}`, player.player_num)
			// player surname
			await title.set_text(`plist_pname_${idx}`, ksys.strf.params.players.format(player.player_surname));
		}else{
			// player number
			await title.set_text(`plist_num_${idx}`, ' ')
			// player surname
			await title.set_text(`plist_pname_${idx}`, ' ');
		}


		// counter += 1;
	}

	// sleep for extra second, just in case
	await ksys.util.sleep(1000)

	// unpause render
	await title.resume_render()
}

kbmodules.football_standard.show_field_layout = async function(team){
	ksys.btns.pool[`show_${team}_field_layout`].toggle(false)

	await kbmodules.football_standard.titles.team_layout.overlay_in()

	ksys.btns.pool[`show_${team}_field_layout`].toggle(true)
}

kbmodules.football_standard.hide_field_layout = async function(){
	ksys.btns.toggle({
		'hide_home_field_layout':    false,
		'hide_guest_field_layout':   false,
	})
	await kbmodules.football_standard.titles.team_layout.overlay_out()
	ksys.btns.toggle({
		'hide_home_field_layout':    true,
		'hide_guest_field_layout':   true,
	})
}







// ================================
//        Commenter stuff
// ================================
kbmodules.football_standard.save_commenter = function(){
	ksys.context.module.prm('todays_commenter', $('#commenter_name_input')[0].value)
}

kbmodules.football_standard.show_commenter = async function(){
	ksys.btns.pool.show_commenter.toggle(false)

	await kbmodules.football_standard.titles.commenter.set_text(
		'name',
		$('#commenter_name_input')[0].value
	)
	await kbmodules.football_standard.titles.commenter.overlay_in()

	ksys.btns.pool.show_commenter.toggle(true)
}

kbmodules.football_standard.hide_commenter = async function(){
	ksys.btns.pool.show_commenter.toggle(false)
	await kbmodules.football_standard.titles.commenter.overlay_out()
	ksys.btns.pool.show_commenter.toggle(true)
}




// ================================
//        VS stuff
// ================================
kbmodules.football_standard.save_vs_sublines = function(){
	ksys.context.module.prm('vs_title_bottom_upper_line', $('#vs_text_bottom_upper')[0].value, false)
	ksys.context.module.prm('vs_title_bottom_lower_line', $('#vs_text_bottom_lower')[0].value)
}

kbmodules.football_standard.show_vs_title = async function(){

	if (!kbmodules.football_standard.resource_index.side.home.club || !kbmodules.football_standard.resource_index.side.guest.club){
		ksys.info_msg.send_msg(
			`Both sides should be present for this title`,
			'warn',
			2000
		);
		return
	}

	// lock the button
	ksys.btns.pool.show_splash.toggle(false)

	// Set bottom lines text
	await kbmodules.football_standard.titles.splash.set_text('title_lower_top', $('#vs_text_bottom_upper').val())
	await kbmodules.football_standard.titles.splash.set_text('title_lower_bot', $('#vs_text_bottom_lower').val())

	// Set logos
	await kbmodules.football_standard.titles.splash.set_img_src(
		'logo_l',
		kbmodules.football_standard.resource_index?.home_club?.logo_path || ''
	)
	await kbmodules.football_standard.titles.splash.set_img_src(
		'logo_r',
		kbmodules.football_standard.resource_index?.guest_club?.logo_path || ''
	)

	// Set Club names
	await kbmodules.football_standard.titles.splash.set_text(
		'club_name_l',
		ksys.strf.params.club_name.format(
			kbmodules.football_standard.resource_index?.home_club?.club_name || ''
		)
	)
	await kbmodules.football_standard.titles.splash.set_text(
		'club_name_r',
		ksys.strf.params.club_name.format(
			kbmodules.football_standard.resource_index?.guest_club?.club_name || ''
		)
	)

	// Show the title
	await kbmodules.football_standard.titles.splash.overlay_in()

	// unlock the button
	ksys.btns.pool.show_splash.toggle(true)
}

kbmodules.football_standard.hide_vs_title = async function(){
	ksys.btns.pool.show_splash.toggle(false)
	await kbmodules.football_standard.titles.splash.overlay_out()
	ksys.btns.pool.show_splash.toggle(true)
}





// ================================
//        Coach stuff
// ================================
kbmodules.football_standard.show_coach = async function(side){

	const tgt_club = kbmodules.football_standard.resource_index.side?.[str(side).lower()]?.club;

	if (!tgt_club){
		ksys.info_msg.send_msg('No club selected', 'err', 5000);
		return
	}

	ksys.btns.toggle({
		'show_coach_home_team': false,
		'show_coach_guest_team': false,
	})

	await kbmodules.football_standard.titles.coach.set_text(
		'name',
		ksys.strf.params.coach.format(tgt_club.main_coach)
	)
	await kbmodules.football_standard.titles.coach.set_img_src(
		'club_logo',
		tgt_club.logo_path
	)
	await kbmodules.football_standard.titles.coach.overlay_in()

	ksys.btns.toggle({
		'show_coach_home_team': true,
		'hide_coach_home_team': true,
		'show_coach_guest_team': true,
		'hide_coach_guest_team': true,
	})
}

kbmodules.football_standard.hide_coach = async function(){
	await kbmodules.football_standard.titles.coach.overlay_out()
}





// ================================
//        Card stuff
// ================================
kbmodules.football_standard.hand_card = async function(card_type){
	// sanity check
	if (!['yellow', 'red'].includes(card_type)){
		ksys.info_msg.send_msg(
			`Fatal error: unknown card type: ${card_type}`,
			'err',
			9000
		);
		console.error(
			`hand_card received an invalid card type: ${card_type}`,
			card_type
		)
		return
	}

	// ensure there's a player selected
	const sel_entry = kbmodules.football_standard.resource_index.card_player_filter.selected_entry;
	const card_manager = kbmodules.football_standard.resource_index.card_manager;
	if (!sel_entry){
		ksys.info_msg.send_msg(
			`No player selected`,
			'warn',
			2000
		);
		return
	}

	if (card_type == 'yellow'){
		await card_manager.hand_yellow(
			card_manager,
			sel_entry.player,
		)
	}

	if (card_type == 'red'){
		await card_manager.hand_red(
			card_manager,
			sel_entry.player,
		)
	}

}

// todo: duplicated code
kbmodules.football_standard.pardon_player = async function(){
	// ensure there's a player selected
	const sel_entry = kbmodules.football_standard.resource_index.card_player_filter.selected_entry;
	const card_manager = kbmodules.football_standard.resource_index.card_manager;
	if (!sel_entry){
		ksys.info_msg.send_msg(
			`No player selected`,
			'warn',
			2000
		);
		return
	}

	card_manager.pardon(
		card_manager,
		sel_entry.player,
	)
}

kbmodules.football_standard.hide_card = async function(){
	await vmix.talker.overlay_out()
}



// ================================
//        Substitute
// ================================
kbmodules.football_standard.exec_substitute = async function(){
	// todo: is this stupid ?
	const leaving_player = (
		kbmodules.football_standard.resource_index.side.home.substitute['leaving']?.selected_entry?.player
		||
		kbmodules.football_standard.resource_index.side.guest.substitute['leaving']?.selected_entry?.player
	);
	const incoming_player = (
		kbmodules.football_standard.resource_index.side.home.substitute['inbound']?.selected_entry?.player
		||
		kbmodules.football_standard.resource_index.side.guest.substitute['inbound']?.selected_entry?.player
	);

	if (!leaving_player || !incoming_player){
		ksys.info_msg.send_msg(
			`Selection incomplete`,
			'warn',
			2000
		);
		return
	}

	const title = kbmodules.football_standard.titles.replacement_seq;

	// Set players' names

	// leaving
	await title.set_text(
		'leaving_player',
		`${leaving_player.player_num} ${ksys.strf.params.players.format(leaving_player.player_surname)}`,
	)
	// inbound
	await title.set_text(
		'incoming_player',
		`${incoming_player.player_num} ${ksys.strf.params.players.format(incoming_player.player_surname)}`,
	)
	// Set club logo
	await title.set_img_src('club_logo', leaving_player.club.logo_path)

	// show the title
	await title.overlay_in()
	// let it hang for 11 seconds
	// (this wait time also accounts for the scripted animation sequence inside the title)
	await ksys.util.sleep(11000)
	// hide the title
	await title.overlay_out()
}











// ================================
//             Timers
// ================================


// ----------------
//      Shared
// ----------------
kbmodules.football_standard.update_extra_time_amount = async function(){
	const amount = $('#timer_ctrl_additional input').val().trim();
	await kbmodules.football_standard.titles.timer.set_text(
		'time_added',
		amount ? `+${amount}` : '',
	)
}

// Built-in / AT-AT switch
// todo: some CSS styling,
// such as hiding status indicator when the featureset is builtin
kbmodules.football_standard.update_selected_timer_system = async function(tgt_sys){
	if (!tgt_sys){
		ksys.info_msg.send_msg(
			`Fatal: tried changing timer feature set to ${tgt_sys}, but can only change to [builtin, at_at]`,
			'err',
			11000
		);
		return
	}
	print('Changing timer system to', tgt_sys);

	// First, kill AT-AT watcher
	await kbmodules.football_standard.stop_atat_service();

	// Then, kill all timers

	// AT-AT Base
	await kbmodules.football_standard.timer_fset.at_at?.base_counter?.terminate?.();
	// await kbmodules.football_standard.timer_fset.at_at.base_counter.terminate();
	kbmodules.football_standard.timer_fset.at_at.base_counter = null;
	// AT-AT Extra
	await kbmodules.football_standard.timer_fset.at_at?.extra_counter?.terminate?.();
	kbmodules.football_standard.timer_fset.at_at.extra_counter = null;

	// Builtin Base
	kbmodules.football_standard?.base_counter?.force_kill?.();
	kbmodules.football_standard.base_counter = null;
	// Builtin Extra
	kbmodules.football_standard?.extra_counter?.force_kill?.();
	kbmodules.football_standard.extra_counter = null;

	// Restart AT-AT system
	// await ksys.ticker.kb_at.sys_restart();

	// Set feature set reference
	kbmodules.football_standard.timer_ctrl = kbmodules.football_standard.timer_fset[tgt_sys];

	if (tgt_sys == 'at_at'){
		// Restart the watchdog, because reasons
		// todo: what reasons?
		kbmodules.football_standard.restart_atat_service();

		// todo: is the commented garbage below still needed ?

		// The kickboxer was created with an idea in mind,
		// that it's possible to toggle between controllers/modules
		// without loosing any data.
		// So, if the timer exists already - use it.
		// if (kbmodules.football_standard.timer_fset.at_at.base_counter){

		// }

		kbmodules.football_standard.toggle_atat_status_indicator(true);
	}

	if (tgt_sys == 'builtin'){
		// It's important to completely get rid of the AT-AT
		// When switching to the built-in system
		kbmodules.football_standard.stop_atat_service();

		kbmodules.football_standard.timer_fset.at_at.base_counter = null;

		kbmodules.football_standard.toggle_atat_status_indicator(false);

		ksys.btns.toggle({
			'launch_main_timer_r1': true,
			'launch_main_timer_r2': true,
			'continue_from_time':   true,
			'stop_extra_timer':     true,
		})
	}
}

// base = global or 1
// extra = extra or 1

// todo: unfortunately, a score on 45:00 + 2 would result into 46 + 2
// There's a stupid hack for now, but later this issue should be addressed
// systematically
// todo: fix this function to work with the new timer system
kbmodules.football_standard._get_current_time = function(minutes=false, tsum=false){
	const divider = (minutes ? 60 : 1);

	if (tsum){
		const calc_sum = 
		Math.ceil(
			(
				(kbmodules.football_standard?.base_counter?.tick?.global || 1)
				+
				(kbmodules.football_standard?.extra_counter?.tick?.global || 1)
			)
			/
			divider
		)

		if (minutes && calc_sum == 46){
			return 45
		}else{
			return calc_sum
		}

	}else{
		// important todo: this is fucked
		let extra_t = kbmodules.football_standard?.extra_counter?.tick?.global;
		if (kbmodules.football_standard?.extra_counter?.tick?.global === 0) {
			extra_t = 1;
		}

		let base_t = Math.ceil(
			(kbmodules.football_standard?.base_counter?.tick?.global || 1) / divider
		);
		if (minutes && base_t == 46 && extra_t > 1){
			base_t = 45;
		}
		if (minutes && base_t == 91 && extra_t > 1){
			base_t = 90;
		}

		return {
			'base': base_t,
			'extra': Math.ceil(
				(extra_t || 0) / divider
			),
		}
	}
}

// important todo: make everything use minutes:seconds schema
kbmodules.football_standard.get_current_time = function(minutes=false, tsum=false){
	const divider = (minutes ? 60 : 1);

	if (tsum){
		const calc_sum = 
		Math.ceil(
			(
				(
					(
						(kbmodules.football_standard.ticker_time.base.minutes * 60) +
						(kbmodules.football_standard.ticker_time.base.seconds)
					)
					|| 1
				)
				+
				(
					(
						(kbmodules.football_standard.ticker_time.extra.minutes * 60) +
						(kbmodules.football_standard.ticker_time.extra.seconds)
					)
					|| 1
				)
			)
			/
			divider
		)

		// todo: is this still needed ?
		if (minutes && calc_sum == 46){
			return 45
		}else{
			return calc_sum
		}

	}else{
		// important todo: is this retarded ?
		const extra_t = (
			(kbmodules.football_standard.ticker_time.extra.minutes * 60) +
			(kbmodules.football_standard.ticker_time.extra.seconds)
		)

		let base_t =
		Math.ceil(
			(
				(kbmodules.football_standard.ticker_time.base.minutes * 60) +
				(kbmodules.football_standard.ticker_time.base.seconds || 1)
			)
			/
			divider
		)

		if (minutes && base_t == 46 && extra_t > 1){
			base_t = 45;
		}
		if (minutes && base_t == 91 && extra_t > 1){
			base_t = 90;
		}

		return {
			'base': base_t,
			'extra': Math.ceil(
				(extra_t || 0) / divider
			),
		}
	}
}

kbmodules.football_standard.main_timer_vis = async function(state){
	const title = kbmodules.football_standard.titles.timer;

	if (state == true){

		if (!kbmodules.football_standard.resource_index?.side?.home?.club || !kbmodules.football_standard.resource_index?.side?.guest?.club){
			ksys.info_msg.send_msg(
				`This action requires both clubs present`,
				'warn',
				3000
			);
			return
		}

		await title.set_text(
			'command_l',
			str(kbmodules.football_standard.resource_index.side.home.club.club_name_shorthand).upper()
		)
		await title.set_text(
			'command_r',
			str(kbmodules.football_standard.resource_index.side.guest.club.club_name_shorthand).upper()
		)

		// push current score to the title
		kbmodules.football_standard.resource_index.score_manager.resync_score_on_title()

		title.overlay_in()
	}
	if (state == false){
		title.overlay_out()
	}
}

kbmodules.football_standard.extra_time_vis = async function(state){
	if (state == true){
		await kbmodules.football_standard.titles.timer.toggle_text('time_added', true)
		await kbmodules.football_standard.titles.timer.toggle_text('extra_ticker', true)
		await kbmodules.football_standard.titles.timer.toggle_img('extra_time_bg', true)
	}
	if (state == false){
		await kbmodules.football_standard.titles.timer.toggle_text('time_added', false)
		await kbmodules.football_standard.titles.timer.toggle_text('extra_ticker', false)
		await kbmodules.football_standard.titles.timer.toggle_img('extra_time_bg', false)
	}
}

kbmodules.football_standard.zero_timer_time = function(){
	kbmodules.football_standard.ticker_time.base.minutes = 0;
	kbmodules.football_standard.ticker_time.base.seconds = 0;

	kbmodules.football_standard.ticker_time.extra.minutes = 0;
	kbmodules.football_standard.ticker_time.extra.seconds = 0;
}


// ----------------
//      AT-AT
// ----------------

// 
// Status watcher stuff
// 
kbmodules.football_standard.update_atat_status = function(status){
	const status_dom = document.querySelector('#ticker_service_status');

	if (status.ok){
		status_dom.classList.remove('ticker_status_fatal_fail');
		status_dom.classList.add('ticker_status_good');
		if (!kbmodules.football_standard.at_at.btns_enable_lock){
			ksys.btns.toggle({
				'launch_main_timer_r1': true,
				'launch_main_timer_r2': true,
				'continue_from_time':   true,
				'stop_extra_timer':     true,
			})
		}
	}else{
		console.warn('Football unable to reach timer:', status.error);
		status_dom.classList.remove('ticker_status_good');
		status_dom.classList.add('ticker_status_fatal_fail');
			ksys.btns.toggle({
				'launch_main_timer_r1': false,
				'launch_main_timer_r2': false,
				'continue_from_time':   false,
				'stop_extra_timer':     false,
			})
	}
}

kbmodules.football_standard.update_atat_port = function(evt){
	if (!evt.altKey){
		// todo: is this message really needed here ?
		ksys.info_msg.send_msg(
			`Hold ALT`,
			'warn',
			1000
		);
		return
	};

	const tgt_int = int(document.querySelector('#atat_port_input').value);
	const int_valid = (
		!!tgt_int &&
		tgt_int <= 65535 &&
		tgt_int > 0
	)

	if (!int_valid){
		ksys.info_msg.send_msg(
			`Invalid AT-AT port: ${tgt_int}`,
			'warn',
			4000
		);
		return
	}

	ksys.context.global.prm('atat_port', tgt_int, true)

	ksys.info_msg.send_msg(
		`Updated AT-AT port to: ${tgt_int}. Restarting service...`,
		'ok',
		4000
	);

	kbmodules.football_standard.restart_atat_service();
}

kbmodules.football_standard.restart_atat_service = async function(){
	// Kill previous AT-AT status watcher
	kbmodules.football_standard.stop_atat_service();

	const atat_port = ksys.context.global.cache.atat_port;

	if (!atat_port){
		ksys.info_msg.send_msg(
			`Unable to restart AT-AT service: no port present: ${atat_port}`,
			'err',
			4000
		);
	}
	// Toggle buttons off
	ksys.btns.toggle({
		'launch_main_timer_r1': false,
		'launch_main_timer_r2': false,
		'continue_from_time':   false,
		'stop_extra_timer':     false,
	})

	kbmodules.football_standard.at_at.service_ping = ksys.ticker.kb_at.StatusWatcher(
		ksys.context.global.cache.vmix_ip,
		atat_port,
		kbmodules.football_standard.update_atat_status
	)
}

kbmodules.football_standard.stop_atat_service = async function(){
	await kbmodules.football_standard.at_at?.service_ping?.terminate?.();
}

kbmodules.football_standard.toggle_atat_status_indicator = function(state){
	if (state == true){
		$('#ticker_service_status').css('display', null);
	}else{
		$('#ticker_service_status').css('display', 'none');
	}
}


// 
// Util
// 
kbmodules.football_standard.timeout_atat_btns = async function(timeout_ms=1000){
	kbmodules.football_standard.at_at.btns_enable_lock = true;
	ksys.btns.toggle({
		'launch_main_timer_r1': false,
		'launch_main_timer_r2': false,
		'continue_from_time':   false,
		'stop_extra_timer':     false,
	})

	await ksys.util.sleep(timeout_ms);

	kbmodules.football_standard.at_at.btns_enable_lock = false;
	ksys.btns.toggle({
		'launch_main_timer_r1': true,
		'launch_main_timer_r2': true,
		'continue_from_time':   true,
		'stop_extra_timer':     true,
	})
}

kbmodules.football_standard.toggle_atat_btns = function(state=true){
	if (state == true){
		kbmodules.football_standard.at_at.btns_enable_lock = false;
		ksys.btns.toggle({
			'launch_main_timer_r1': true,
			'launch_main_timer_r2': true,
			'continue_from_time':   true,
			'stop_extra_timer':     true,
		})
	}
	if (state == false){
		kbmodules.football_standard.at_at.btns_enable_lock = true;
		ksys.btns.toggle({
			'launch_main_timer_r1': false,
			'launch_main_timer_r2': false,
			'continue_from_time':   false,
			'stop_extra_timer':     false,
		})
	}
}

kbmodules.football_standard.restore_atat_line = async function(){
	// 
	// Main timer
	// 
	kbmodules.football_standard.timer_fset.at_at.create_base_timer();
	const base_timer_time = await kbmodules.football_standard.timer_fset.at_at.base_counter.get_curtime();
	console.error(base_timer_time);

	if (!base_timer_time.ok || !base_timer_time.reply_data){return};
	// If timer exists and well - reattach everything to it
	await kbmodules.football_standard.timer_fset.at_at.base_counter.resub_to_echo();
	await kbmodules.football_standard.timer_fset.at_at.base_counter.resub_to_end();

	// 
	// Extra timer
	// 
	kbmodules.football_standard.timer_fset.at_at.create_extra_time()
	const extra_timer_time = await kbmodules.football_standard.timer_fset.at_at.extra_counter.get_curtime();
	console.error(extra_timer_time);

	if (!extra_timer_time.ok || !extra_timer_time.reply_data){return};
	// If timer exists and well - reattach everything to it
	await kbmodules.football_standard.timer_fset.at_at.extra_counter.resub_to_echo();
	await kbmodules.football_standard.timer_fset.at_at.extra_counter.resub_to_end();
}


// 
// Base Timer
// 
kbmodules.football_standard.timer_fset.at_at.create_base_timer = function(rnum){
	kbmodules.football_standard.timer_fset.at_at.base_counter = new ksys.ticker.kb_at.AtAtTicker({
		'id':   2,
		'ip':   ksys.context.global.cache.vmix_ip,
		'port': ksys.context.global.cache.atat_port,
		// todo: Better url construction
		'url_params': `/API/?Function=SetText&Input=${kbmodules.football_standard.titles.timer.title_name}&SelectedName=base_ticker.Text&Value=\0`,
		'timings': {
			'start': [
				(rnum == 1) ? 0 : 45,
				0,
			],
			'end': [
				(rnum == 1) ? 45 : 90,
				0,
			],
		},
		'end_callback': async function(){
			console.error('End callback?');
			if (ksys.context.module.cache.round_num){
				await kbmodules.football_standard.timer_fset.at_at.launch_extra_time();
				kbmodules.football_standard.extra_time_vis(true);
			}
		},
		'echo_callback': kbmodules.football_standard.timer_fset.at_at.timer_callback,
	})
}

kbmodules.football_standard.timer_fset.at_at.wipe_timers = async function(rnum=1){
	// Kill base timer
	await kbmodules.football_standard.timer_fset.at_at?.base_counter?.terminate?.();
	kbmodules.football_standard.timer_fset.at_at.base_counter = null;

	// Kill extra timer
	await kbmodules.football_standard.timer_fset.at_at?.extra_counter?.terminate?.();
	kbmodules.football_standard.timer_fset.at_at.extra_counter = null;

	kbmodules.football_standard.zero_timer_time();

	// todo: It's speculated, that each time a new main timer starts - 
	// the extra time should be cleared.
	kbmodules.football_standard.titles.timer.set_text('time_added', '');
	await kbmodules.football_standard.titles.timer.set_text('extra_ticker', '00:00');
	await kbmodules.football_standard.extra_time_vis(false);

	// Clear the base ticker text field
	await kbmodules.football_standard.titles.timer.set_text(
		'base_ticker', (rnum == 1) ? '00:00' : '45:00'
	);
}

kbmodules.football_standard.timer_fset.at_at.start_base_timer = async function(rnum){
	kbmodules.football_standard.toggle_atat_btns(false);

	// Save the target round number to context
	ksys.context.module.prm('round_num', rnum);

	// Todo: kill previous timers or simply overwrite with new data?
	// Commit murder for now

	// todo: shouldn't timer controls be stored in kbmodules.football_standard.at_at ?

	// todo: It's speculated, that each time a new main timer starts - 
	// the extra time should be cleared.
	// The function below does wipe the extra timer.
	await kbmodules.football_standard.timer_fset.at_at.wipe_timers(rnum);

	// Instantiate AT-AT ticker class
	kbmodules.football_standard.timer_fset.at_at.create_base_timer(rnum);

	// Launch the AT-AT ticker
	print(
		'Start response:',
		await kbmodules.football_standard.timer_fset.at_at.base_counter.start()
	);

	kbmodules.football_standard.timeout_atat_btns();
}

kbmodules.football_standard.timer_fset.at_at.timer_callback = function(msg){
	if (msg.data_buf[0] != 2){
		console.warn(
			'Received timer №', msg.data_buf[1] ,' echo with no payload:',
			msg.data_buf,
		)
		return
	}

	kbmodules.football_standard.ticker_time.base.minutes = msg.data_buf[2];
	kbmodules.football_standard.ticker_time.base.seconds = msg.data_buf[3];

	const text = `${str(msg.data_buf[2]).zfill(2)}:${str(msg.data_buf[3]).zfill(2)}`;
	// const text = `${msg.data_buf[2]}:${msg.data_buf[3]}`;

	// kbmodules.football_standard.titles.timer.set_text('base_ticker', text);
	$('#timer_feedback_main').text(text);
}

kbmodules.football_standard.timer_fset.at_at.resume_main_timer_from_offset = async function(){
	if (!kbmodules.football_standard.timer_fset.at_at.base_counter){
		console.warn('Tried resuming non-existent main AT-AT timer');
		return
	}

	kbmodules.football_standard.toggle_atat_btns(false);

	const minutes = int(document.querySelector('#base_timer_resume_input .minutes').value);
	const seconds = int(document.querySelector('#base_timer_resume_input .seconds').value);

	// Seconds can be avoided, but minutes not.
	if (!minutes){
		ksys.info_msg.send_msg(
			`Malformed minutes: ${minutes}`,
			'warn',
			4000
		);
		kbmodules.football_standard.toggle_atat_btns(true);
		return
	}

	print('Resuming main timer from offset:', minutes, seconds)

	// Todo: more speculation...
	kbmodules.football_standard.titles.timer.set_text('time_added', '');

	// todo: implement this improvement in built-in ticker?
	// Calculate the round number from input.
	// Is this actually useless?
	const rnum = minutes < 45 ? 1 : 2;
	// Save the calculated offset to context
	ksys.context.module.prm('round_num', rnum);

	await kbmodules.football_standard.timer_fset.at_at.base_counter.resume_from_offset({
		'start': [minutes, seconds,],
		'end': [
			(rnum == 1) ? 45 : 90,
			0,
		],
	})

	// important todo: it's speculated, that AT-AT's weak point is
	// timer restarts before the previous time ticked at least once
	kbmodules.football_standard.timeout_atat_btns();
}


// 
// Extra Timer
// 
kbmodules.football_standard.timer_fset.at_at.create_extra_time = function(){
	kbmodules.football_standard.timer_fset.at_at.extra_counter = new ksys.ticker.kb_at.AtAtTicker({
		'id':   3,
		'ip':   ksys.context.global.cache.vmix_ip,
		'port': ksys.context.global.cache.atat_port,
		// todo: Better url construction
		'url_params': `/API/?Function=SetText&Input=${kbmodules.football_standard.titles.timer.title_name}&SelectedName=extra_ticker.Text&Value=\0`,
		'timings': {
			'start': [0, 0],
			'end': [60, 0],
		},
		'end_callback': null,
		'echo_callback': kbmodules.football_standard.timer_fset.at_at.extra_timer_callback,
	})
}

kbmodules.football_standard.timer_fset.at_at.launch_extra_time = async function(){
	// Todo: kill previous timers or simply overwrite with new data?
	// Commit murder for now

	// Kill extra timer
	// todo: there's a function for this
	await kbmodules.football_standard.timer_fset.at_at?.extra_counter?.terminate?.();
	kbmodules.football_standard.timer_fset.at_at.extra_counter = null;
	await kbmodules.football_standard.titles.timer.set_text('extra_ticker', '00:00');

	// Instantiate AT-AT ticker class
	kbmodules.football_standard.timer_fset.at_at.create_extra_time()

	// Launch the AT-AT ticker
	print(
		'Extra timer start response:',
		await kbmodules.football_standard.timer_fset.at_at.extra_counter.start()
	);
}

kbmodules.football_standard.timer_fset.at_at.extra_timer_callback = function(msg){
	// todo: separate this check into a function
	if (msg.data_buf[0] != 2){
		console.warn(
			'Received timer №', msg.data_buf[1] ,' echo with no payload:',
			msg.data_buf,
		)
		return
	}

	kbmodules.football_standard.ticker_time.extra.minutes = msg.data_buf[2];
	kbmodules.football_standard.ticker_time.extra.seconds = msg.data_buf[3];

	const text = `${str(msg.data_buf[2]).zfill(2)}:${str(msg.data_buf[3]).zfill(2)}`;
	// const text = `${msg.data_buf[2]}:${msg.data_buf[3]}`;

	kbmodules.football_standard.titles.timer.set_text('extra_ticker', text);
	$('#timer_feedback_extra').text(text);
}

kbmodules.football_standard.timer_fset.at_at.stop_extra_time = async function(){
	kbmodules.football_standard.timeout_atat_btns();
	await kbmodules.football_standard.timer_fset.at_at?.extra_counter?.terminate?.();
	kbmodules.football_standard.timer_fset.at_at.extra_counter = null;
}





// ---------------- 
//     Builtin
// ----------------

// 
// Base timer
// 

// important todo: because of the "... == '45:01'" check in the timer callback - 
// second round basically starts from 45:02
// This is a relatively easy fix (hack on top of a hack):
// Simply port the round number saving mechanism from AT-AT,
// Save the round numbers and only execute the "... == '45:01'" hack
// according to round numbers
kbmodules.football_standard.timer_fset.builtin.start_base_timer = async function(rnum){

	kbmodules.football_standard?.base_counter?.force_kill?.()
	kbmodules.football_standard.base_counter = null;

	kbmodules.football_standard?.extra_counter?.force_kill?.()
	kbmodules.football_standard.extra_counter = null;

	kbmodules.football_standard.titles.timer.set_text('time_added', '')

	await kbmodules.football_standard.titles.timer.set_text('extra_ticker', '00:00');
	await kbmodules.football_standard.extra_time_vis(false)

	ksys.context.module.prm('round_num', rnum)

	const dur = 45;

	await kbmodules.football_standard.titles.timer.set_text('base_ticker', (rnum == 1) ? '00:00' : '45:00');

	kbmodules.football_standard.base_counter = ksys.ticker.spawn({
		// 'duration': (rnum == 2) ? (((dur*60)*1)+1) : ((dur*60)+1),
		'duration': ((dur*60)+1),
		'name': `giga_timer${rnum}`,
		'offset': (rnum == 2) ? (dur*60) : 0,
		'infinite': false,
		'reversed': false,
		'callback': kbmodules.football_standard.timer_fset.builtin.timer_callback,
		'wait': true,
	})

	kbmodules.football_standard.base_counter.fire()
	.then(function(_ticker) {
		// turn off automatically
		const pre_killed = _ticker.killed;
		if (_ticker){
			_ticker.force_kill()
			/*
			if (document.querySelector('#timer_ctrl_additional input').value.trim() && !pre_killed){
			// if (document.querySelector('#timer_ctrl_additional input').value.trim()){
				kbmodules.football_standard.timer_fset.builtin.launch_extra_time()
			}
			*/
			if (!pre_killed){
				kbmodules.football_standard.timer_fset.builtin.launch_extra_time()
			}
		}
	})

	// print(kbmodules.football_standard.base_counter)
}

kbmodules.football_standard.timer_fset.builtin.timer_callback = function(tick){
	const minutes = Math.floor(tick.global / 60);
	const seconds = tick.global - (60*minutes);

	kbmodules.football_standard.ticker_time.base.minutes = minutes;
	kbmodules.football_standard.ticker_time.base.seconds = seconds;

	let text = `${str(minutes).zfill(2)}:${str(seconds).zfill(2)}`;

	// important todo: this is a retarded hack
	if (text == '45:01'){
		text = '45:00';
		kbmodules.football_standard.ticker_time.base.minutes = 45;
		kbmodules.football_standard.ticker_time.base.seconds = 0;
	}

	if (text == '90:01'){
		text = '90:00';
		kbmodules.football_standard.ticker_time.base.minutes = 90;
		kbmodules.football_standard.ticker_time.base.seconds = 0;
	}

	kbmodules.football_standard.titles.timer.set_text('base_ticker', text);
	$('#timer_feedback_main').text(text);
}

// todo: make this function work with the new time input schema
kbmodules.football_standard.timer_fset.builtin.resume_main_timer_from_offset = function(event){

	kbmodules.football_standard?.extra_counter?.force_kill?.()
	kbmodules.football_standard.extra_counter = null;

	kbmodules.football_standard?.base_counter?.force_kill?.()
	kbmodules.football_standard.base_counter = null;

	kbmodules.football_standard.titles.timer.set_text('time_added', '')


	const rnum = int(ksys.context.module.prm('round_num')) || 1;

	const offs_minutes = int(document.querySelector('#base_timer_resume_input .minutes').value);
	const offs_seconds = int(document.querySelector('#base_timer_resume_input .seconds').value);

	const offs = (offs_minutes * 60) + offs_seconds;

	const dur = (45*60);

	kbmodules.football_standard.base_counter = ksys.ticker.spawn({
		// 'duration': (rnum == 2) ? ((dur*2)+1) : (dur+1),
		'duration': (dur-(offs%dur))+1,
		'name': `giga_timer_offs${rnum}`,
		// 'offset': (rnum == 2) ? (dur+offs) : (0+offs),
		'offset': offs,
		'infinite': false,
		'reversed': false,
		'callback': kbmodules.football_standard.timer_fset.builtin.timer_callback,
		'wait': true,
	})

	kbmodules.football_standard.base_counter.fire()
	.then(function(_ticker) {
		// turn off automatically
		const pre_killed = _ticker.killed;
		if (_ticker){
			_ticker.force_kill()
			// if (document.querySelector('#timer_ctrl_additional input').value.trim()){
			// 	kbmodules.football_standard.timer_fset.builtin.launch_extra_time()
			// }
			if (!pre_killed){
				kbmodules.football_standard.timer_fset.builtin.launch_extra_time()
			}
		}
	})

	// print(kbmodules.football_standard.base_counter)
}



// 
// Extra timer
// 
kbmodules.football_standard.timer_fset.builtin.launch_extra_time = async function(){
	kbmodules.football_standard?.extra_counter?.force_kill?.()
	kbmodules.football_standard.extra_counter = null;

	await kbmodules.football_standard.update_extra_time_amount()

	/*
	let extra_amount = $('#timer_ctrl_additional input').val()
	if (!extra_amount){
		return
	}
	extra_amount = eval(_extra_amount);
	if (!extra_amount){
		return
	}
	*/
	const extra_amount = 60;

	kbmodules.football_standard.extra_counter = ksys.ticker.spawn({
		'duration': extra_amount*60,
		'name': `gigas_timer${1}`,
		'infinite': true,
		'reversed': false,
		'callback': kbmodules.football_standard.timer_fset.builtin.extra_timer_callback,
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
	// await kbmodules.football_standard.titles.timer.set_text('time_added', `+${Math.floor(extra_amount/1)}`)
	// await kbmodules.football_standard.titles.timer.toggle_text('time_added', true)
	// await kbmodules.football_standard.titles.timer.toggle_img('extra_time_bg', true)
	// await kbmodules.football_standard.titles.timer.toggle_text('extra_ticker', true)
}

kbmodules.football_standard.timer_fset.builtin.extra_timer_callback = function(tick){
	const minutes = Math.floor(tick.global / 60)
	const seconds = tick.global - (60*minutes)

	kbmodules.football_standard.ticker_time.extra.minutes = minutes;
	kbmodules.football_standard.ticker_time.extra.seconds = seconds;

	const text = `${str(minutes).zfill(2)}:${str(seconds).zfill(2)}`;

	kbmodules.football_standard.titles.timer.set_text('extra_ticker', text)
	$('#timer_feedback_extra').text(text)
}

kbmodules.football_standard.timer_fset.builtin.stop_extra_time = function(){
	kbmodules.football_standard?.extra_counter?.force_kill?.()
	kbmodules.football_standard.extra_counter = null;
}









// ================================
//               Scores
// ================================

// todo: add sanity check for player's side
kbmodules.football_standard.add_score_from_cards_panel = async function(){
	const player = kbmodules.football_standard.resource_index.card_player_filter?.selected_entry?.player;

	if (!player){
		ksys.info_msg.send_msg(
			`No player selected. Go to the Stats panel for advanced manipulations`,
			'warn',
			9000
		);
		return
	}

	const side = player.club.is_enemy ? 'guest' : 'home';
	const score_list = kbmodules.football_standard.resource_index.score_manager.sides[side].score_list
	score_list.add_score(
		score_list,
		player
	)

	// Show the title

	// Set logo
	await kbmodules.football_standard.titles.gscore.set_img_src(
		'club_logo',
		player.club.logo_path
	)

	// Set player's surname
	await kbmodules.football_standard.titles.gscore.set_text(
		'player_name',
		`${player.player_num} ${ksys.strf.params.players.format(player.player_surname)}`
	)

	await kbmodules.football_standard.titles.gscore.overlay_in()
	await ksys.util.sleep(7000)
	await kbmodules.football_standard.titles.gscore.overlay_out()
}

kbmodules.football_standard.hide_scored_title = async function(){
	await kbmodules.football_standard.titles.gscore.overlay_out()
}

kbmodules.football_standard.mod_score_author = function(evt){
	if (!evt.altKey){return};

	const selected_player = kbmodules.football_standard.resource_index.score_manager.player_picker?.selected_entry?.player;
	const selected_score_entry = kbmodules.football_standard.resource_index.score_manager.selected_score_record;
	if (!selected_player){
		ksys.info_msg.send_msg(
			`No player selected`,
			'warn',
			2000
		);
		return
	}
	if (!selected_score_entry){
		ksys.info_msg.send_msg(
			`No score record selected`,
			'warn',
			2000
		);
		return
	}

	kbmodules.football_standard.resource_index.score_manager.modify_score_author()

}




/*
Algorithm responsible for displaying the score summary
and collapsing multiple scores with the same author into a
single row/string/call it whatever you want


> Loop through every score unit of the team, as 'unit_a'
    > If 'unit_a' doesn't has an author - skip, continue iteration

    > If the author of 'unit_a' should be ignored - skip, continue iteration

	> Append the author of 'unit_a' to an array
	  to ignore units with the same author on next iteration


	Basically, we get a player who scored at least a single score
	and iterate over the score stack again to collect all the scores
	belonging to him.


    > Loop through every score unit of the team again, as 'unit_b'
        > Check if the author of 'unit_b' equals to 'unit_a'. If not - skip, continue iteration.

        > Append the 'unit_b' to an array as text, such as 45'+2 (АГ)
          (an array would look like this: [`14'`, `27' (АГ)`, `45'+2`])

    > Depending on the side (home/guest)
      join the array mentioned above into a string with a ` ,` separator
      and add author name derived from 'unit_a' to the string either
      to the beginning or end:
      HOME:  [`14'`, `27' (АГ)`, `45'+2`].join(', ') + 'unit_a'.author
      GUEST: 'unit_a'.author + [`14'`, `27' (АГ)`, `45'+2`].join(', ')
      And append the resulting string to an array of rows that will be
      displayed in the VMIX title


Yes, here you will see that authorless scores are fucking evil
PLEASE, don't do this.

> Loop through every score unit of the team yet again, as 'unit_a'
    > Skip the unit if it DOES has an author

    > Append the score unit as text (e.g. `45'+2 (АГ)`)
      to an array of rows that will be displayed in the VMIX title

This is the only logical thing to do in case of authorless scores...
Sorry...
(get rekt lmfao, don't care, not sorry)


The text block inside of the score summary VMIX title
where the score summary is displayed
represents a single huge block of text,
there are no rows whatsoever, therefore...

> Join the array of rows with `\n` separator
  and send the resulting string to the VMIX title:
  [
      `11' ПЕТРОВ`,
      `14', 27' (АГ), 45'+2 ВОЙЦЕХОВСЬКИЙ`,
      ...
  ].join('\n')
  =
  11' ПЕТРОВ\n
  14', 27' (АГ), 45'+2 ВОЙЦЕХОВСЬКИЙ

> Profit.

*/

// todo: get rid of ?.
kbmodules.football_standard.show_score_summary = async function(){
	// todo: this is only a dict for easy access
	const score_summary = {
		'home': [],
		'guest': [],
	}

	// Convert a score unit to text, such as 35'+5 (АГ)
	// todo: re-declaring this function each time the score should be shown
	// is not a problem, but just stupid...
	const score_unit_to_text = function(score_unit){
		const result = [];

		if (score_unit.time.extra){
			result.push(`${score_unit.time.base}'+${score_unit.time.extra}`)
		}else{
			result.push(`${score_unit.time.base}'`)
		}

		// todo: use else. There could be only one flag
		if (score_unit.flags.autogoal){
			result.push('(АГ)')
		}

		if (score_unit.flags.penalty){
			result.push('(ПЕН)')
		}

		return result.join(' ')
	}


	// 
	// Create the scores list for both teams
	// 
	for (const side of ['home', 'guest']){
		const score_stack = kbmodules.football_standard.resource_index?.score_manager?.sides[side]?.score_list?.score_stack;
		if (!score_stack){continue};

		// todo: not only there's certainly a better way of doing this,
		// but this should also be sorted

		// per every player
		// todo: this "player" variable naming is a direct violation of at least 9 Geneva conventions
		const collected_players = [];
		for (const player of score_stack){

			// Deal with nonames later
			if (!player.author){
				continue
			}

			// Don't re-collect same players 
			if (collected_players.includes(player.author)){
				continue
			}else{
				collected_players.push(player.author)
			}

			const collected_scores = [];

			// traverse the entire list again
			// and collect all scores associated with him
			for (const score of score_stack){
				if (score.author == player.author){
					collected_scores.push(score)
				}
			}


			// Now process collected scores

			// Create timestamps with flags
			const score_times = [];
			for (const score of collected_scores){
				score_times.push(score_unit_to_text(score))
			}

			// Append constructed string to the final table

			let score_string = '';
			if (side == 'guest'){
				score_string = 
				`${ksys.strf.params.players.format(player.author?.player_surname || '')} ${score_times.join(', ')}`;
			}else{
				score_string = 
				`${score_times.join(', ')} ${ksys.strf.params.players.format(player.author?.player_surname || '')}`;
			}

			score_summary[side].push(score_string)

		}


		// Collect uncredited poor souls
		// imporatnt todo: duplicated code.
		for (const score of score_stack){
			if (score.author){continue};

			score_summary[side].push(score_unit_to_text(score))
		}
	}


	// 
	// Composite the title
	// 



	// ------------------------------
	// Set bottom score (0:0)
	// ------------------------------
	const score_amt_l = kbmodules.football_standard.resource_index?.score_manager?.sides.home?.score_list?.score_stack?.size || 0;
	const score_amt_r = kbmodules.football_standard.resource_index?.score_manager?.sides.guest?.score_list?.score_stack?.size || 0;
	await kbmodules.football_standard.titles.final_scores.set_text(
		'score_sum',
		`${score_amt_l} : ${score_amt_r}`
	)


	// ------------------------------
	// Show the appropriate amount of fields
	// ------------------------------
	await kbmodules.football_standard.titles.final_scores.toggle_img('anim_full', false)
	await kbmodules.football_standard.titles.final_scores.toggle_img('anim_half', false)

	const need_rows = Math.max(score_summary.home.length || 0, score_summary.guest.length || 0).clamp(1, 5)
	// todo: hardcoded path. Too bad.
	kbmodules.football_standard.titles.final_scores.set_img_src(
		'upper_bg',
		Path('C:/custom/vmix_assets/differential').join(`${need_rows}.png`)
	)


	// ------------------------------
	// Push score lists to the title
	// ------------------------------
	await kbmodules.football_standard.titles.final_scores.set_text(
		'scores_l',
		score_summary.home.join('\n')
	)
	await kbmodules.football_standard.titles.final_scores.set_text(
		'scores_r',
		score_summary.guest.join('\n')
	)


	// ------------------------------
	// Misc.
	// ------------------------------

	// team name LEFT
	await kbmodules.football_standard.titles.final_scores.set_text(
		'team_name_l',
		ksys.strf.params.club_name.format(kbmodules.football_standard.resource_index.side.home?.club?.club_name)
	)
	// team logo LEFT
	await kbmodules.football_standard.titles.final_scores.set_img_src(
		'team_logo_l',
		kbmodules.football_standard.resource_index.side.home?.club?.logo_path || ''
	)

	// team name RIGHT
	await kbmodules.football_standard.titles.final_scores.set_text(
		'team_name_r',
		ksys.strf.params.club_name.format(kbmodules.football_standard.resource_index.side.guest?.club?.club_name || '')
	)
	// team logo RIGHT
	await kbmodules.football_standard.titles.final_scores.set_img_src(
		'team_logo_r',
		kbmodules.football_standard.resource_index.side.guest?.club?.logo_path || ''
	)

	// Set bottom text
	await kbmodules.football_standard.titles.final_scores.set_text(
		'bottom_text',
		$('#vs_text_bottom_lower').val()
	)

	// show the title
	await kbmodules.football_standard.titles.final_scores.overlay_in()
}

kbmodules.football_standard.hide_score_summary = async function(){
	await kbmodules.football_standard.titles.final_scores.overlay_out()
}




// ================================
//               Stats
// ================================

// todo: this is old, copypasted code

kbmodules.football_standard.save_match_stats = function(){
	const save = {};
	console.time('Saving stats')
	for (const stat_name in kbmodules.football_standard.stats_unit_pool){
		const stat = kbmodules.football_standard.stats_unit_pool[stat_name];
		save[stat_name] = {
			1: int(stat.val_selector[1]),
			2: int(stat.val_selector[2]),
		}
	}

	ksys.db.module.write('stats.fball', JSON.stringify(save, null, 4))

	console.timeEnd('Saving stats')
}

// stat unit
kbmodules.football_standard.StatUnit = class {
	constructor(related_title, team1_txt_block, team2_txt_block, visname, init_val_t1=0, init_val_t2=0){
		this.related_title = related_title;
		this.visname = visname;
		this.elem_index = {};
		const self = this;

		this.text_field_selector = {
			1: team1_txt_block,
			2: team2_txt_block,
		}

		this.val_selector = {
			1: int(init_val_t1) || 0,
			2: int(init_val_t2) || 0,
		}

		this.vis_echo = {
			1: [],
			2: [],
		};


		//
		// append table row to both tables
		//

		for (const tnum of [1, 2]){
			$(`.tstats_table_${tnum}`).append(this.table_row_elem(tnum))
		}

		//
		// Create quick buttons
		//
		for (const tnum of [1, 2]){
			$(`.tstats_buttons_team_${tnum}`).append(this.quick_button(tnum))
		}

	}

	// get html element of a quick buttons
	// where you click to add/subtract one
	quick_button(team){
		const self = this;

		const qbtn_html = `
			<div class="team_stat_quick_btn_pair">
				<div class="team_stat_quick_btn_vis_value">${this.val_selector[team]}</div>
				<sysbtn click_timeout="700" stat_action="add" class="team_stat_quick_btn_add">+ ${this.visname}</sysbtn>
				<sysbtn click_timeout="700" stat_action="subt" class="team_stat_quick_btn_subt">- ${this.visname}</sysbtn>
			</div>
		`;

		const qbtn_index = ksys.tplates.index_elem(
			qbtn_html,
			{
				'add': '.team_stat_quick_btn_add',
				'subt': '.team_stat_quick_btn_subt',
				'vis_val': '.team_stat_quick_btn_vis_value',
			},
			true
		);

		qbtn_index.index.add.onclick = function(){
			self.upd_value(team, 1)
		}
		qbtn_index.index.subt.onclick = function(){
			self.upd_value(team, -1)
		}

		// register for echo
		this.vis_echo[team].push({
			'echo_type': 'elem_text',
			'tgt': qbtn_index.index.vis_val,
		})

		return qbtn_index.elem
	}

	table_row_elem(team){
		const self = this;

		const stat_unit_table_row_html = `
			<div class="stat_unit_table_row">
				${this.visname}
				<input noctrl type="number">
			</div>
		`
		// create and index row element
		const row_elem = ksys.tplates.index_elem(
			stat_unit_table_row_html,
			{'inp': 'input'},
			true
		)
		row_elem.index.inp.value = this.val_selector[team]
		row_elem.index.inp.onchange = function(evt){
			self.set_value(team, int(evt.target.value) || 0)
		}
		row_elem.index.inp.onclick = function(evt){
			evt.target.select()
		}

		// register for echo
		this.vis_echo[team].push({
			'echo_type': 'input',
			'tgt': row_elem.index.inp,
		})

		return row_elem.elem
	}

	// set value to a specific number
	set_value(team, val){
		// update vmix title
		this.related_title.set_text(this.text_field_selector[team], val)
		// update self info
		this.val_selector[team] = val;
		// update values in the table rows, etc
		this.forward_vis_echo()
		// save stats to file
		kbmodules.football_standard.save_match_stats()
	}

	// addition subtraction
	// addition/subtraction is determined by the input value
	// which means to subtract from the value - pass a negative integer
	upd_value(team, val){
		// basically same as set_value, except it's addition/subtraction
		const new_val = this.val_selector[team] + val;
		this.val_selector[team] = Math.max(new_val, 0);
		this.related_title.set_text(this.text_field_selector[team], this.val_selector[team]);
		// update values in the table rows, etc
		this.forward_vis_echo()
		// save stats to file
		kbmodules.football_standard.save_match_stats()
	}

	// update values in the table rows, etc
	forward_vis_echo(){
		// each element of the echo array should have a value property
		for (const team of [1, 2]){
			for (const echo of this.vis_echo[team]){
				if (echo.echo_type == 'input'){
					echo.tgt.value = this.val_selector[team];
				}
				if (echo.echo_type == 'elem_text'){
					echo.tgt.innerText = this.val_selector[team];
				}
			}
		}
	}

	async push_to_vmix(){
		await this.related_title.set_text(this.text_field_selector[1], this.val_selector[1]);
		await this.related_title.set_text(this.text_field_selector[2], this.val_selector[2]);
	}

}


kbmodules.football_standard.show_team_stats = async function(){

	ksys.btns.pool.show_team_stats.toggle(false)

	for (const stat_name in kbmodules.football_standard.stats_unit_pool){
		kbmodules.football_standard.stats_unit_pool[stat_name].push_to_vmix()
	}

	// Set scores
	const score_amt_l = kbmodules.football_standard.resource_index.score_manager.sides.home.score_list.score_stack.size;
	const score_amt_r = kbmodules.football_standard.resource_index.score_manager.sides.guest.score_list.score_stack.size;
	await kbmodules.football_standard.titles.stats.set_text('scores', `${score_amt_l} : ${score_amt_r}`);

	// set logos
	await kbmodules.football_standard.titles.stats.set_img_src(
		'team_logo_l',
		kbmodules.football_standard.resource_index.side.home?.club?.logo_path || ''
	)
	await kbmodules.football_standard.titles.stats.set_img_src(
		'team_logo_r',
		kbmodules.football_standard.resource_index.side.guest?.club?.logo_path || ''
	)

	// set bottom text
	// todo: pull it from a more reliable place ?
	await kbmodules.football_standard.titles.stats.set_text('bottom_text', $('#vs_text_bottom_lower').val())

	// Set club names
	await kbmodules.football_standard.titles.stats.set_text(
		'team_name_l',
		ksys.strf.params.club_name.format(kbmodules.football_standard.resource_index.side.home?.club?.club_name)
	)
	await kbmodules.football_standard.titles.stats.set_text(
		'team_name_r',
		ksys.strf.params.club_name.format(kbmodules.football_standard.resource_index.side.guest?.club?.club_name)
	)

	await kbmodules.football_standard.titles.stats.overlay_in()

	ksys.btns.pool.show_team_stats.toggle(true)
}

kbmodules.football_standard.hide_team_stats = async function(){

	ksys.btns.pool.hide_team_stats.toggle(false)

	await kbmodules.football_standard.titles.stats.overlay_out()

	ksys.btns.pool.hide_team_stats.toggle(true)
	ksys.btns.pool.show_team_stats.toggle(true)
}








// ================================
//           Save/Load sys
// ================================

// Every separate save target gets saved to a separate file:
// save_lineup_lists: lineup_lists.kbsave


// important todo: under some circumstances it's very important to check whether
// the loaded player exists in any of the lineup lists.
// Right now it's only checked against global club playerbase.

// todo: add docs to some of the functions below







// ---------------
//  Lineup lists
// ---------------

// File: lineup_lists.kbsave
// Save entries:
//     - Club name
//     - T-Shirt colour
//     - Shorts colour
//     - Golakeeper colour
//     - Lineup lists: main/reserve

// Triggered when:
// 	- tshirt/shorts/gk colour changes
// 	- Player is added/removed from main/reserve player list by the USER
//  - A club is loaded by the USER
//  - Player's name is changed in the club config panel

// Save struct:
/*
{
	'home': {
		'club_name': lowercase club name,

		'tshirt_col': t-shirt colour (hex),
		'shorts_col': shorts colour (hex),
		'gk_col':     goalkeeper colour (hex),

		// main/reserve players
		'player_lineup': {
			'main_players': [
				'player nameid',
				'player nameid',
				...
			],
			'reserve_players': [],
		}
	},

	// same as home
	'guest':{},
}
*/
kbmodules.football_standard.save_lineup_lists = function(){
	print('saving lineup lists');

	const save_data = {};

	const res_idx = kbmodules.football_standard.resource_index;

	// important todo: fix inconsistencies in home/guest
	for (const side of ['home', 'guest']){

		// Only save if there's a lineup to save

		// todo: data corruption?
		// do not allow saving till both sides are loaded ????
		const tgt_lineup = res_idx.side[side].lineup;
		const tgt_club = res_idx.side[side].club;
		if (!tgt_lineup){continue};


		// 
		// first, easy part - save club name & colours and define the save file struct
		// 
		save_data[side] = {

			// club name
			'club_name': str(tgt_club.club_name).lower(),


			// shorts_colpick
			// tshirt_colpick
			// gk_colpick

			// colours
			// todo: lineup has a built-in colours getter (lineup.colors)
			// returns a dict
			'tshirt_col': tgt_lineup.tshirt_colpick.selected_color,
			'shorts_col': tgt_lineup.shorts_colpick.selected_color,
			'gk_col':     tgt_lineup.gk_colpick.selected_color,

			// create player struct
			'player_lineup': {
				'main_players': [],
				'reserve_players': [],
			},
		}



		// 
		// Now, save player lists
		// 

		// Each lineup stores 2 player arrays: main and reserve.
		// Iterate over their names and grab them from the lineup class

		// SO, for list type...
		for (const tgt_list of ['main_players', 'reserve_players']){
			// main_players
			// reserve_players

			// Iterate over the said list type to grab players in there...
			for (const player of tgt_lineup[tgt_list]){
				// The player class has a name_id getter.
				// Append player's nameid to the target save list.
				save_data[side].player_lineup[tgt_list].push(player.name_id)
			}
		}
	}


	// 
	// Save data to file
	// 
	ksys.db.module.write(
		'lineup_lists.kbsave',
		JSON.stringify(save_data, null, '\t')
	)
}

// Load lineup lists and colours
kbmodules.football_standard.load_lineup_lists = function(){
	// Check if there's anything in the save file
	const last_save = ksys.db.module.read('lineup_lists.kbsave', 'json');
	if (!last_save){return};

	// todo: compare club names
	for (const side of ['home', 'guest']){
		const side_info = last_save[side];
		if (!side_info){continue};

		kbmodules.football_standard.create_club_lineup(
			side,
			side_info.club_name,
			{
				'tshirt_col': side_info.tshirt_col,
				'shorts_col': side_info.shorts_col,
				'gk_col':     side_info.gk_col,

				'main_players':    side_info.player_lineup.main_players,
				'reserve_players': side_info.player_lineup.reserve_players,
			}
		)
	}
}





// ---------------
//  Field layout
// ---------------

// File: field_layout.kbsave
// Save entries:
//     - Club name
//     - field layout

// Triggered when:
// 	- Any field layout is changed
//  - Player's name is changed in the club config panel

// Save struct:
/*
{
	'home': {
		'club_name': lowercase club name,

		'field': {
			'cell_id': 'name_id',
			'cell_id': 'name_id',
			...
		}
	},

	// same as home
	'guest':{},
}
*/
kbmodules.football_standard.save_field_layouts = function(){
	print('Saving field layouts')
	// todo: save layouts by club name ?
	// aka without any ties to home/guest

	const save_data = {
		'home': {
			'club_name': null,
			'field': {},
		},

		'guest': {
			'club_name': null,
			'field': {},
		},
	}

	for (const side of ['home', 'guest']){
		save_data[side].club_name = kbmodules.football_standard.resource_index.side[side]?.club?.club_name?.lower?.();
		save_data[side].field = kbmodules.football_standard.resource_index.side[side]?.field?.to_json?.() || {};
	}

	ksys.db.module.write(
		'field_layout.kbsave',
		JSON.stringify(save_data, null, '\t')
	)
}

kbmodules.football_standard.load_field_layouts = function(){
	// Check if there's anything in the save file
	const last_save = ksys.db.module.read('field_layout.kbsave', 'json');
	if (!last_save){return};

	for (const side of ['home', 'guest']){
		if (!kbmodules.football_standard.resource_index.side[side].field){continue};

		kbmodules.football_standard.resource_index.side[side].field.apply_layout(last_save[side].field)
	}
}








// ---------------
//    Card info
// ---------------

// File: card_info.kbsave
// Save entries:
//     - All the card info

// Triggered when:
// 	- Card info is modified
//  - Player's name is changed in the club config panel
kbmodules.football_standard.save_card_data = function(){
	print('Saving card data');

	const card_manager = kbmodules.football_standard.resource_index.card_manager;

	if (!card_manager){return};

	const save_data = {
		'home': {
			'club_name': null,
			'yc_map': {},
			'red_stack': [],
		},
		'guest': {
			'club_name': null,
			'yc_map': {},
			'red_stack': [],
		},
	}

	for (const side of ['home', 'guest']){
		const target_side = card_manager.sides[side];

		if (target_side.club){
			save_data[side].club_name = target_side.club.club_name.lower();

			// yc map
			for (const yc_record of target_side.yc_map){
				const player = yc_record[0];
				const record_data = yc_record[1];

				save_data[side].yc_map[player.name_id] = record_data;
			}

			// red stack
			for (const rcard_record of target_side.red_stack){
				save_data[side].red_stack.push(rcard_record?.player?.name_id || false)
			}
		}
	}

	// save file
	ksys.db.module.write(
		'card_info.kbsave',
		JSON.stringify(save_data, null, '\t')
	)

}


kbmodules.football_standard.load_card_data = function(){
	// Check if there's anything in the save file
	const last_save = ksys.db.module.read('card_info.kbsave', 'json');
	if (!last_save){return};

	// sanity check
	if (!kbmodules.football_standard.resource_index.card_manager){
		console.error(`Why doesn't the card manager exist ?????`);
		return
	}

	kbmodules.football_standard.resource_index.card_manager.apply_data(last_save)
}




// ---------------
//     Scores
// ---------------

// File: score_data.kbsave
// Save entries:
//     - All scores

// Triggered when:
// 	- Score is added/removed
//  - Player's name is changed in the club config panel
kbmodules.football_standard.save_score_data = function(){
	print('Saving score data')

	const score_manager = kbmodules.football_standard.resource_index.score_manager;
	if (!score_manager){
		ksys.info_msg.send_msg(
			`Score manager does not exist ???!!!`,
			'err',
			4000
		);
		console.error('Score manager does not exist:', score_manager)
		return
	}

	// save file
	ksys.db.module.write(
		'score_data.kbsave',
		JSON.stringify(score_manager.to_json(), null, '\t')
	)
}

kbmodules.football_standard.load_score_data = function(){
	// Check if there's anything in the save file
	const last_save = ksys.db.module.read('score_data.kbsave', 'json');
	if (!last_save){return};

	const score_manager = kbmodules.football_standard.resource_index.score_manager;
	if (!score_manager){
		console.error('Score manager does not exist at the momment of loading save data');
		return
	}

	score_manager.apply_data(last_save)
}












// ---------------
//  Saving gateway
// ---------------

// pass null to save everything
kbmodules.football_standard.global_save = function(save_targets=null){
	const what_to_save = Object.assign(
		{
			'lineup_lists': false,
			'field_layout': false,
			'card_data': false,
			'scores': false,
		},
		save_targets || {},
	);

	// print('What to save:', what_to_save)

	// todo: use for loop?

	// Save lineup lists
	if (what_to_save.lineup_lists || save_targets == null){
		kbmodules.football_standard.save_lineup_lists()
	}

	// Save field layouts
	if (what_to_save.field_layout || save_targets == null){
		kbmodules.football_standard.save_field_layouts()
	}

	// Save card data
	if (what_to_save.card_data || save_targets == null){
		kbmodules.football_standard.save_card_data()
	}

	// Save score data
	if (what_to_save.scores || save_targets == null){
		kbmodules.football_standard.save_score_data()
	}
}












// ================================
//         Create new match
// ================================

// (Wipe previous data)
kbmodules.football_standard.init_new_match = function(evt){
	if (!evt.ctrlKey){return};

	// First of all - delete files
	const del_entries = [
		'lineup_lists.kbsave',
		'field_layout.kbsave',
		'card_info.kbsave',
		'score_data.kbsave',
		'stats.fball',
	]

	for (const fname of del_entries){
		ksys.db.module.delete(fname);
	}

	// why bother...
	// Just reload the controller...
	ksys.fbi.warn_critical(
		`Please press CTRL + R (there's nothing else you can do)`
	)

	$('body').css({'pointer-events': 'none'});
}



