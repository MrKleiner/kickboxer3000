

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





const _test = [
	{
		'name':    'Олександр',
		'surname': 'Чернятинський',
		'num':     '1',
	},
	{
		'name':    'Ернест',
		'surname': 'Астахов',
		'num':     '27',
	},
	{
		'name':    'Роман',
		'surname': 'Андрієшин',
		'num':     '44',
	},
	{
		'name':    'Андрій',
		'surname': 'Якимів',
		'num':     '97',
	},
	{
		'name':    'Олександр',
		'surname': 'Дударенко',
		'num':     '3',
	},
	{
		'name':    'Руслан',
		'surname': 'Дедух',
		'num':     '18',
	},
	{
		'name':    'Андрій',
		'surname': 'Співаков',
		'num':     '14',
	},
	{
		'name':    'Микола',
		'surname': 'Когут',
		'num':     '19',
	},
	{
		'name':    'Іван',
		'surname': 'Когут',
		'num':     '17',
	},
	{
		'name':    'Владислав',
		'surname': 'Войцеховський',
		'num':     '11',
	},
	{
		'name':    'Даниїл',
		'surname': 'Сухоручко',
		'num':     '21',
	},
];






$this.load = async function(){
	const mctx = ksys.context.module;

	$this.resource_index = {
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
	};

	// --------------------------
	// index titles
	// --------------------------
	{
		$this.titles = {
			// field layout
			'team_layout': new vmix.title({
				'title_name': 'command_layout.gtzip',
				'timings': {
					'fps': 25,
					'frames_in': 41,
					'margin': 100,
				},
			}),


			// cards
			'yellow_card': new vmix.title({
				'title_name': 'yellow_card.gtzip',
				'timings': {
					'fps': 25,
					'frames_in': 72,
					'margin': 100,
				}
			}),
			'red_card': new vmix.title({
				'title_name': 'red_card.gtzip',
				'timings': {
					'fps': 25,
					'frames_in': 20,
					'margin': 100,
				}
			}),
			'ycbr_card': new vmix.title({
				'title_name': 'ycbr.gtzip',
				'timings': {
					'fps': 25,
					'frames_in': 36,
					'margin': 100,
				}
			}),

			// replacements
			'replacement_out': new vmix.title({
				'title_name': 'replacement_leaving.gtzip',
				'timings': {
					'fps': 25,
					'frames_in': 35,
					'margin': 100,
				}
			}),
			'replacement_in': new vmix.title({
				'title_name': 'replacement_incoming.gtzip',
				'timings': {
					'fps': 25,
					'frames_in': 42,
					'margin': 100,
				}
			}),

			'replacement_seq': new vmix.title({
				'title_name': 'replacement_seq.gtzip',
				'timings': {
					'fps': 25,
					'frames_in': 42,
					'margin': 100,
				}
			}),


			// VS
			'splash': new vmix.title({
				'title_name': 'splash.gtzip',
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
				'timings': {
					'fps': 25,
					'frames_in': 36,
					'margin': 100,
				}
			}),

			// Coach l4d2
			'coach': new vmix.title({
				'title_name': 'coach.gtzip',
				'timings': {
					'fps': 25,
					'frames_in': 26,
					'margin': 100,
				}
			}),

			// Commenter
			'commenter': new vmix.title({
				'title_name': 'commenter.gtzip',
				'timings': {
					'fps': 25,
					'frames_in': 26,
					'margin': 100,
				}
			}),

			// Timer and scores
			'timer': new vmix.title({
				'title_name': 'score_and_time.gtzip',
				'timings': {
					'fps': 25,
					'frames_in': 23,
					'margin': 100,
				}
			}),

			// Composed scores
			'final_scores': new vmix.title({
				'title_name': 'final_scores.gtzip',
				'timings': {
					'fps': 25,
					'frames_in': 59,
					'margin': 100,
				}
			}),

			// Statistics
			'stats': new vmix.title({
				'title_name': 'stats.gtzip',
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
		$this.resource_index.club_selector_dropdown = new $this.ClubSelectorDropdown();

		// Card/goal player picker
		$this.resource_index.card_player_filter = new $this.PlayerPicker(
			[[]],
			function(){return true},
			function(list_dom, player_class){
				const card_manager = $this.resource_index.card_manager;

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

		$this.resource_index.card_manager = new $this.CardManager()

		// Create substitutes
		for (const side of ['home', 'guest']){
			for (const rtype of ['leaving', 'inbound']){
				$this.resource_index.side[side].substitute[rtype] = 
				new $this.PlayerPicker(
					[[]],
					function(){return true},
					function(list_dom){
						list_dom.onclick = function(){
							const opposite_side = (side == 'home') ? 'guest' : 'home';
							$this.resource_index.side[opposite_side].substitute.leaving.reset_selection()
							$this.resource_index.side[opposite_side].substitute.inbound.reset_selection()
						}
					}
				)

				$(`#replacement_teams .replacement_team[${side}] .replacement_list[${rtype}]`)
				.append($this.resource_index.side[side].substitute[rtype].box)
			}
		}

		// create score manager
		$this.resource_index.score_manager = new $this.ScoreManager()
	}

	// --------------------------
	// Append some global objects to the page
	// --------------------------
	{
		// club selector dropdown in the club control global
		$('#load_existing_club_dropdown label').append(
			$this.resource_index.club_selector_dropdown.dropdown_elem(
				function(evt){
					$this.load_club_by_name(evt.target.value)
				}
			)
		);

		// Home club lineup selector in the lineup ctrl
		$('home-club-selector').append(
			$this.resource_index.club_selector_dropdown.dropdown_elem(
				function(evt){
					$this.create_club_lineup('home', evt.target.value)
				}
			)
		);

		// Guest club lineup selector in the lineup ctrl
		$('guest-club-selector').append(
			$this.resource_index.club_selector_dropdown.dropdown_elem(
				function(evt){
					$this.create_club_lineup('guest', evt.target.value)
				}
			)
		);

		// Player picker for cards and goals
		$('#cg_player_picker').append(
			$this.resource_index.card_player_filter.box
		)
	}


	// --------------------------
	// Misc.
	// --------------------------
	{
		// Load todays commenter
		$('#commenter_name_input')[0].value = mctx.cache.todays_commenter;
		// Load VS sublines
		$('#vs_text_bottom_upper')[0].value = mctx.cache.vs_title_bottom_upper_line;
		$('#vs_text_bottom_lower')[0].value = mctx.cache.vs_title_bottom_lower_line;
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


// club_struct is a dict where:
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
$this.FootballClub = class{
	constructor(input_club_struct=null, is_enemy=false){
		const club_struct = input_club_struct || {};

		// Base info
		this.logo_path =           club_struct.logo_path || './assets/red_cross.png';
		this.club_name =           (club_struct.club_name || '').lower();
		this.club_name_shorthand = club_struct.club_name_shorthand || '';
		this.main_coach =          (club_struct.main_coach || '').lower();
		this.is_enemy =            is_enemy;

		// An array of ClubPlayer classes
		this.playerbase =          new Set();

		// populate internal registry with initial data, if any
		for (const player_info of (club_struct.playerbase || [])){
			this.playerbase.add(new $this.ClubPlayer(this, player_info))
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
		if ($this.resource_index.home_lineup?.club?.club_name?.lower?.() == this.club_name.lower()){
			$('#team_lineup home-club-lineup').empty()
		}
		if ($this.resource_index.guest_lineup?.club?.club_name?.lower?.() == this.club_name.lower()){
			$('#team_lineup guest-club-lineup').empty()
		}


		// Lastly, delete club control panel
		this.control_panel?.elem?.remove?.()
	}

	// Register a new player in this club
	// - input_player_info:dict player info as described in FootballClub class
	register_player(input_player_info=null){
		// create player class
		const player = new $this.ClubPlayer(this, input_player_info);
		// add player to the registry
		this.playerbase.add(player);
		// add player cfg box to the club pool
		this.control_panel.index.player_pool.append(player.player_params_elem().elem)
		// return the player class
		return player
	}

	// Create club control panel
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
}



// - input_player_info:dict player info as described in FootballClub class
// - parent_club:FootballClub parent football club.
// This data is persistent, unless killed
$this.ClubPlayer = class{
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

	- input_lineup_info is a dictionary containing lineup info:
	    - main_players: An array of player info dicts.
	    - reserve_players: An array of player info dicts.
	    - shorts_color: Shorts colour identifier for the match.
	    - tshirt_color: T-shirt colour identifier for the match.
	    - gk_color: Goalkeeper colour identifier for the match.
	    - field_layout: A dictionary where key is field cell id
	                    and value is player info dict.
	    - colors: array of HEX colours available in the colour picker.
*/
$this.TeamLineup = class{
	constructor(club, colors=null, input_lineup_info=null){
		this.club = club;
		const lineup_info = input_lineup_info || {};

		// basic config
		this.shorts_color = lineup_info.shorts_color || null;
		this.tshirt_color = lineup_info.tshirt_color || null;
		this.gk_color =     lineup_info.gk_color || null;
		this.field_layout = lineup_info.field_layout || {};

		// Team colours to pick from
		this.available_colors = colors || [];

		// Color picker classes
		this.shorts_colpick = null;
		this.tshirt_colpick = null;
		this.gk_colpick = null;

		// These sets contain player classes
		this.main_players = new Set();
		this.reserve_players = new Set();

		this.tplate = null;
	}

	// get control panel element for the lineup
	control_panel_elem(){
		const self = this;

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
		if (this.club.is_enemy){
			this.tplate.index.side.setAttribute('enemy', true)
		}else{
			this.tplate.index.side.setAttribute('home', true)
		}

		//
		// create player picker
		// 
		const player_picker = new $this.PlayerPicker(
			[this.club.playerbase],
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
		this.shorts_colpick = new $this.TeamLineupColorPicker(this.available_colors, $this.update_team_colors);
		this.tplate.index.shorts_color_picker.append(this.shorts_colpick.list)

		this.tshirt_colpick = new $this.TeamLineupColorPicker(this.available_colors, $this.update_team_colors);
		this.tplate.index.tshirt_color_picker.append(this.tshirt_colpick.list)

		this.gk_colpick = new $this.TeamLineupColorPicker(this.available_colors, $this.update_team_colors);
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
		}
		// Edit related club in the club panel
		this.tplate.index.edit_club_btn.onclick = function(){
			self.club.open_panel();
			$('sys-tab[match_id="club_def"]').click();
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
			ksys.info_msg.send_msg('There are more than 11 players in this list, proceed with caution', 'warn', 9000);
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
$this.TeamLineupColorPicker = class{
	constructor(color_codes, callback=null){
		const self = this;

		this.color_codes = color_codes || [];
		this.callback = callback;

		// currently active colour by colour code
		this._selected_color = color_codes[0];

		// colour objects
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
				$(self.tplate.elem).find('picker-color').removeClass('active_color');
				color_elem.classList.add('active_color');
				self._selected_color = clear_hex;
				self?.callback?.(clear_hex)
			}
		}
	}

	get selected_color(){
		return this._selected_color
	}

	set selected_color(newval){
		const col = this.colors[str(newval).replaceAll('#', '').trim()];
		if (!col){
			console.warn('Cannot find target colour:', newval);
		}

		col.click()
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
$this.PlayerPicker = class{
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


$this.ClubSelectorDropdown = class{
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
		for (let dropdown of this.registry){
			dropdown = $(dropdown);
			dropdown.find('option:not([value=""])').remove();
			for (const clubname of ksys.db.module.path().join('clubs').globSync('*.clubdef')){
				dropdown.append(`
					<option value="${clubname.stem.lower()}">${clubname.stem.upper()}</option>
				`)
			}
		}
	}
}


$this.FieldLayout = class{
	constructor(lineup){
		const self = this;

		this.lineup = lineup;
		this.grid = new Set();

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
						}

						// When swapping with an element from a list
						if (!old_cell && new_cell){
							print('Swapping from a list')
							new_cell.player = self.drag_target.player;
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
						print('cell with new player', cell)
					}
				}

				cell.dom.oncontextmenu = function(evt){
					if (evt.altKey){
						cell.dom.innerHTML = '';
						cell.player = null;
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

		// temp: hide some cells
		for (const row of this.grid){
			row.at(0).dom.classList.add('ghost_cell')
		}
		for (const cell of this.grid.at(-1)){
			cell.dom.classList.add('ghost_cell')
		}
		this.grid.at(-1).at(5).dom.classList.remove('ghost_cell')

		// instanciate grid DOM
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
		this.picker = new $this.PlayerPicker(
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
			ksys.binds.mouseup = function(){

				// Stop floating and effects
				list_item.elem.classList.remove('is_dragging')
				list_item.elem.ClientPosFromEvent(null)
				self.tplate.index.grid.classList.remove('hover')

				// remove system-wide binds
				ksys.binds.mousemove = null;
				ksys.binds.mouseup = null;
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
$this._FMStatUnit = class{
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
$this._FMStats = class{
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

Will result into the following table:
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
$this.FMStatsTable = class{
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
$this.FMStatInstance = class{
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

// important todo: There are too many redraw calls.
// It's totally possible to reduce the load (from 10ms to 9ms)
$this.CardManager = class {
	constructor(init_data=null){
		// time in ms the card title should stay on screen
		// this.title_hang_time = 7000;

		this.player_picker = $this.resource_index.card_player_filter;


		this.sides = {
			home: {
				// persistent
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
				// was given out immediately or after a second warning
				yc_map: new Map(),


				// event stack of the red cards
				// each element is a dict:
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

		// create the controls
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
			const active_club = $this.resource_index.side[side].club;
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
		await title.overlay_in(1)
		// let it hang for 7 seconds
		await ksys.util.sleep(7000)
		// hide the title
		await title.overlay_out(1)
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
			title = $this.titles.ycbr_card;
			// register this red card
			self.reg_red(self, self.get_pside(self, player, false), player)
		}else{
			// otherwise - it's a first warning
			pcard_info.warned = true;
			title = $this.titles.yellow_card;
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

		const title = $this.titles.red_card;
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
			return
		}

	}
}







$this.ClubGoals = class {
	constructor(parent_club, init_data=null){
		this.parent_club = parent_club;

		this.tplate = ksys.tplates.index_tplate(
			'#club_score_list_template',
			{
				'header':        'club-score club-score-header',
				'list':          'club-score-list',
				'add_score_btn': 'club-score-buttons .club_score_add_record',
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
				'time': score timestamp in seconds,

				'dom_struct': the dom of the score element,
			}
		*/
		this.score_stack = new Set();

		this.selected_record = null;

		// append header
		this.tplate.index.header.append(parent_club.vis_header_elem())

		// bind button
		const self = this;

		this.tplate.index.add_score_btn.onclick = function(evt){
			const selected_player = $this.resource_index.score_manager.player_picker?.selected_entry?.player;
			if (!selected_player && !evt.altKey){
				ksys.info_msg.send_msg(
					`Hold ALT key to add authorless score`,
					'warn',
					3000
				);
				return
			}

			self.add_score(self, selected_player)
		}
	}

	// Add a score
	add_score(self, player=null, flags=null){
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
		if (!$this?.base_counter?.tick){
			ksys.info_msg.send_msg(
				`Main timer does not exist (no timestamp will be added to the score record)`,
				'warn',
				9000
			);
		}

		// get combined current time in minutes 
		const calculated_timestamp = $this.get_current_time(true);

		// create a registry record
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
		tplate.index.autogoal_flag.penalty = record.flags.penalty;

		// set timestamp in minutes
		tplate.index.timestamp.value = calculated_timestamp;

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
			record.time = evt.target.value;
		}

		// flags
		{
			// todo: this is retarded
			const click_switch = function(evt){
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
			}

			// autogoal flag change
			tplate.index.autogoal_flag.onchange = function(evt){
				record.flags.autogoal = evt.target.checked;
			}
			// penalty flag change
			tplate.index.penalty_flag.onchange = function(evt){
				record.flags.penalty = evt.target.checked;
			}

			tplate.index.autogoal_hitbox.onclick = click_switch;
			tplate.index.penalty_hitbox.onclick = click_switch;
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
			}
		}

		// changing the author
		tplate.elem.onclick = function(evt){
			if (!evt.target.closest('.score_author')){return};
			// stupid hack to make it possible to toggle
			const do_toggle = self.selected_record == record

			$this.resource_index.score_manager.reset_player_selection();

			self.set_selected_record(self, record)

			if (do_toggle){
				$this.resource_index.score_manager.reset_player_selection();
			}
		}

		// finally, append the template to the DOM
		self.tplate.index.list.append(tplate.elem)

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
		const new_player = $this.resource_index.score_manager.player_picker.selected_entry;

		// modify the record
		self.selected_record.author = new_player;

		$(self.selected_record.dom_struct.score_author).html(new_player.generic_list_elem())

		// reset the record selection to prevent accidents
		$this.resource_index.score_manager.reset_player_selection();

		// idiot
		if (!self.parent_club.playerbase.has(new_player)){
			// todo: make it present by default, but with visibility disabled
			$(self.selected_record.dom_struct.score_author).append(
				'<img class="self_score_indicator" src="./assets/clown.png">'
			)
		}else{
			$(self.selected_record.dom_struct.score_author).find('.self_score_indicator').remove()
		}
	}

	set_selected_record(self, record){
		self.selected_record = record;
		$(self.dom).find('.selected_score_record').removeClass('selected_score_record');
		record.dom_struct.elem.classList.add('selected_score_record');
	}
}



// This class keeps track of both sides' scores
$this.ScoreManager = class {
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
		this.player_picker = new $this.PlayerPicker(
			[[]],
			function(){return true}
		)

		$('#score_ctrl_player_search').append(this.player_picker.box)
	}

	resync_picker_sources(){
		const new_source = [];
		for (const side of ['home', 'guest']){
			// todo: if not lineup - continue
			new_source.push($this.resource_index.side[side]?.lineup?.main_players || []);
			new_source.push($this.resource_index.side[side]?.lineup?.reserve_players || []);
		}
		this.player_picker.data_source = new_source;
	}

	// resync lineups
	resync_lineups(){
		// todo: there are too many 'for side of home, guest' loops
		for (const side of ['home', 'guest']){
			const club_data = $this.resource_index.side[side]
			if (club_data.lineup){
				const club_goals = new $this.ClubGoals(club_data.club);
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
			const score_list = $this.resource_index.score_manager.sides[side].score_list;
			if (!score_list){continue};

			score_list.selected_record = null;
			$(score_list.dom).find('.selected_score_record').removeClass('selected_score_record');
		}
		
	}
}
























// Create new club and overwrite previous club control
// This is triggered when a "New Club" button is pressed in the "Club" panel
$this.create_new_club = function(club_resources=null, open_panel=true){
	$this.save_club_to_local_db()

	// create new club class
	const new_club = new $this.FootballClub(club_resources);
	// write club reference to the registry
	$this.resource_index.club_ctrl = new_club;
	new_club.open_panel()
}

// Save file to an abstract location on disk
$this.save_club_to_file = function(){
	const tgt_dir = $('#club_ctrl_save_to_file_target .tgtdir').val();
	if (!tgt_dir || !$this.resource_index.club_ctrl){
		ksys.info_msg.send_msg('Dir path or filename is invalid (not specified)', 'err', 5000);
		return
	};

	// construct path
	const tgt_file = Path(
		tgt_dir,
		($('#club_ctrl_save_to_file_target .tgtfname').val() || 'club_info') + '.clubdef',
	);

	// important todo: check if the path exists
	// Write the json file
	tgt_file.writeFileSync(
		JSON.stringify($this.resource_index.club_ctrl.to_json(), null, '\t')
	)
}

// Delete currently edited club from disk
// and wipe anything referencing that club from the interface
$this.delete_current_club = function(evt){
	if (!evt.ctrlKey){return};

	const club = $this.resource_index.club_ctrl;
	if (!club){return};

	// 1 - erase club from GUI
	club.erase()
	// 2 - delete from database
	print('DELETE ME PLEASE')
	ksys.db.module.path().join('clubs', `${club.club_name.lower()}.clubdef`).deleteSync()
	// 3 - resync dropdowns
	$this.resource_index.club_selector_dropdown.resync()
}


$this.save_club_to_local_db = function(mute=true){
	// Make sure there's a club to save
	if (!$this.resource_index?.club_ctrl?.club_name){
		if (!mute){
			ksys.info_msg.send_msg(`Invalid club name`, 'err', 5000);
		}
		return
	};
	// ensure that the club title is not empty
	const club_info = $this.resource_index.club_ctrl.to_json();

	// write file
	ksys.db.module.write(
		`clubs/${club_info.club_name.lower()}.clubdef`,
		JSON.stringify(club_info, null, '\t')
	)

	ksys.info_msg.send_msg(`Save OK`, 'ok', 500);

	// re-index dropdowns
	$this.resource_index.club_selector_dropdown.resync()
}


// get club json by name without any further actions
$this.get_club_info_by_name = function(clubname=null){
	if (!clubname){return};

	const club_name = clubname.lower();
	const club_info = ksys.db.module.read(`clubs/${club_name}.clubdef`, 'json');
	if (!club_info){return};

	return club_info
}

// Load existing club into the control panel
$this.load_club_by_name = function(clubname=null){
	if (!clubname){return};

	const existing_home = $this.resource_index.home_club;
	const existing_guest = $this.resource_index.guest_club;

	if (clubname.lower() == existing_home?.club_name.lower()){
		existing_home.open_panel()
		return
	}
	if (clubname.lower() == existing_guest?.club_name.lower()){
		existing_guest.open_panel()
		return
	}
	$this.create_new_club($this.get_club_info_by_name(clubname))
}



// Create lineup from club name.
// This is triggered when:
//     - A club is selected from the Home/Guest club dropdown in Config/Lists
//     - Club being loaded from previous controller state
$this.create_club_lineup = function(side, clubname, input_lineup_info=null){
	if (!clubname){return};

	let club = null;

	// Check if the requested club is the one being edited in the Clubs panel
	if ($this.resource_index.club_ctrl?.club_name.lower() == clubname.lower()){
		// if so - get the Club class reference from the resource index
		club = $this.resource_index.club_ctrl;
		// and update the is_enemy flag
		$this.resource_index.club_ctrl.is_enemy = (side == 'guest');

	}else{
		// if not - create new Club class,
		// because a lineup cannot exist without a club
		// Lineup class is always a parent of a Club class
		club = new $this.FootballClub($this.get_club_info_by_name(clubname), side == 'guest');
	}

	// create player lineup for the club
	const lineup = new $this.TeamLineup(
		// parent club
		club,
		// available uniform colours
		$this.resource_index.available_colors,
		// input info (player lists, field layout, etc ...)
		input_lineup_info
	)

	// create field layout
	const field_layout = new $this.FieldLayout(lineup)

	if (side == 'home'){
		// write down the club to the resource index
		$this.resource_index.home_club = club;
		// write down lineup to the resource index
		$this.resource_index.home_lineup = lineup;
		// write field reference to the resource index
		$this.resource_index.home_field = field_layout;
	}

	if (side == 'guest'){
		// write down the club to the resource index
		$this.resource_index.guest_club = club;
		// write down lineup to the resource index
		$this.resource_index.guest_lineup = lineup;
		// write field reference to the resource index
		$this.resource_index.guest_field = field_layout;
	}

	// New fancy system
	// (should've been like that from the very beginning)
	if (['home', 'guest'].includes(side)){
		$this.resource_index.side[side].club = club;
		$this.resource_index.side[side].lineup = lineup;
		$this.resource_index.side[side].field = field_layout;
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
	$this.resource_index.card_player_filter.data_source = [
		($this.resource_index.home_lineup ? $this.resource_index.home_lineup.main_players : []),
		($this.resource_index.home_lineup ? $this.resource_index.home_lineup.reserve_players : []),

		($this.resource_index.guest_lineup ? $this.resource_index.guest_lineup.main_players : []),
		($this.resource_index.guest_lineup ? $this.resource_index.guest_lineup.reserve_players : []),
	]

	// update sources for substitutes
	for (const side of ['home', 'guest']){
		for (const rtype of ['leaving', 'inbound']){
			$this.resource_index.side[side].substitute[rtype].data_source = [
				($this.resource_index.side[side]?.lineup?.main_players || []),
				($this.resource_index.side[side]?.lineup?.reserve_players || []),
			]
		}
	}

	// update sources for score picker
	$this.resource_index.score_manager.resync_picker_sources()

	// resync score manager
	$this.resource_index.score_manager.resync_lineups()

	// resync card manager
	$this.resource_index.card_manager.resync($this.resource_index.card_manager)

}


// forward team colours to vmix timer + score title
$this.update_team_colors = function(){
	const base_path = Path('C:/custom/vmix_assets/t_shirts/overlay');
	const home = $this.resource_index.home_lineup;
	const guest = $this.resource_index.guest_lineup;

	if (home){
		// tshirt home
		$this.titles.timer.set_img_src(
			'team_col_l_top',
			base_path.join(`l_top_${home.colors.tshirt}.png`),
		)
		// shorts home
		$this.titles.timer.set_img_src(
			'team_col_l_bot',
			base_path.join(`l_bot_${home.colors.shorts}.png`),
		)
	}

	if (guest){
		// tshirt guest
		$this.titles.timer.set_img_src(
			'team_col_r_top',
			base_path.join(`r_top_${guest.colors.tshirt}.png`),
		)
		// shorts guest
		$this.titles.timer.set_img_src(
			'team_col_r_bot',
			base_path.join(`r_bot_${guest.colors.shorts}.png`),
		)
	}
}

// Clear the player list in the lineup vmix title
$this.wipe_player_list_from_title = async function(){
	for (const idx of range(1, 12)){
		// player number
		await $this.titles.team_layout.set_text(`plist_num_${idx}`, '')
		// player surname
		await $this.titles.team_layout.set_text(`plist_pname_${idx}`, '');
	}
	await ksys.util.sleep(500)
}

// Push current field layout/lineup to the field layout title in vmix
$this.forward_field_layout_to_vmix = async function(team){
	let tgt_field = null;
	const tgt_side = $this.resource_index.side?.[str(team).lower()]?.field;

	if (!tgt_field){
		ksys.info_msg.send_msg('Lineup does not exist for this side', 'warn', 9000);
		return
	}

	// Switch off all buttons responsible for showing the title on screen
	ksys.btns.toggle({
		'show_home_field_layout':    true,
		'hide_home_field_layout':    true,
		'show_guest_field_layout':   true,
		'hide_guest_field_layout':   true,

		'prepare_home_team_layout':  true,
		'prepare_guest_team_layout': true,
	})

	// target vmix title
	const title = $this.titles.team_layout;

	// t-shirt colours
	// todo: remove hardcoded paths
	const player_tshirt_col =
	Path('C:\\custom\\vmix_assets\\t_shirts\\tshirts')
	.join(`${tgt_field.lineup.colors.tshirt || 'ffffff'}.png`);

	await title.pause_render()

	// 
	// player slots
	// 
	await $this.wipe_player_list_from_title()
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
	let counter = 1;
	for (const player of tgt_field.lineup.main_players){
		// player number
		await title.set_text(`plist_num_${counter}`, player.player_num)
		// player surname
		await title.set_text(`plist_pname_${counter}`, ksys.strf.params.players.format(player.player_surname));

		counter += 1;
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

	await title.resume_render()

	// Enable buttons responsible for showing the team's layout which was just prepared
	{
		ksys.btns.pool[`show_${tgt_side}_field_layout`].toggle(true)
		ksys.btns.pool[`hide_${tgt_side}_field_layout`].toggle(true)

		ksys.btns.pool[`prepare_home_team_layout`].toggle(true)
		ksys.btns.pool[`prepare_guest_team_layout`].toggle(true)
	}
}

// Show the field layout on screen
$this.show_field_layout = async function(team){
	const tgt_lineup = $this.resource_index.side?.[str(team).lower()]?.lineup;

	{
		ksys.btns.pool[`show_home_field_layout`].toggle(false)
		ksys.btns.pool[`show_guest_field_layout`].toggle(false)
	}

	const title = $this.titles.team_layout

	// pause render
	await title.pause_render()

	// ?????
	await ksys.util.sleep(100)

	// show the overlay
	await title.overlay_in(1)

	// wait for 10 seconds
	// await ksys.util.sleep(10000)


	// commit warcrimes (changes)
	// await $this.wipe_player_list_from_title()
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

$this.hide_field_layout = async function(){
	const btn_pool = ksys.btns.pool;

	// btn_pool.show_home_field_layout.toggle(false)
	// btn_pool.hide_home_field_layout.toggle(false)
	// btn_pool.show_guest_field_layout.toggle(false)
	// btn_pool.hide_guest_field_layout.toggle(false)
	await $this.titles.team_layout.overlay_out(1)
	// btn_pool.show_home_field_layout.toggle(true)
	// btn_pool.hide_home_field_layout.toggle(true)
	// btn_pool.show_guest_field_layout.toggle(true)
	// btn_pool.hide_guest_field_layout.toggle(true)
}





// ================================
//        Commenter stuff
// ================================
$this.save_commenter = function(){
	ksys.context.module.prm('todays_commenter', $('#commenter_name_input')[0].value)
}

$this.show_commenter = async function(){
	ksys.btns.pool.show_commenter.toggle(false)

	await $this.titles.commenter.set_text(
		'name',
		$('#commenter_name_input')[0].value
	)
	await $this.titles.commenter.overlay_in(1)

	ksys.btns.pool.show_commenter.toggle(true)
}

$this.hide_commenter = async function(){
	ksys.btns.pool.show_commenter.toggle(false)
	await $this.titles.commenter.overlay_out(1)
	ksys.btns.pool.show_commenter.toggle(true)
}




// ================================
//        VS stuff
// ================================
$this.save_vs_sublines = function(){
	ksys.context.module.prm('vs_title_bottom_upper_line', $('#vs_text_bottom_upper')[0].value, false)
	ksys.context.module.prm('vs_title_bottom_lower_line', $('#vs_text_bottom_lower')[0].value)
}

$this.show_vs_title = async function(){

	if (!$this.resource_index.side.home.club || !$this.resource_index.side.guest.club){
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
	await $this.titles.splash.set_text('title_lower_top', $('#vs_text_bottom_upper').val())
	await $this.titles.splash.set_text('title_lower_bot', $('#vs_text_bottom_lower').val())

	// Set logos
	await $this.titles.splash.set_img_src('logo_l', $this.resource_index?.home_club?.logo_path || '')
	await $this.titles.splash.set_img_src('logo_r', $this.resource_index?.guest_club?.logo_path || '')

	// Set Club names
	await $this.titles.splash.set_text(
		'club_name_l',
		ksys.strf.params.club_name.format(
			$this.resource_index?.home_club?.club_name || ''
		)
	)
	await $this.titles.splash.set_text(
		'club_name_r',
		ksys.strf.params.club_name.format(
			$this.resource_index?.guest_club?.club_name || ''
		)
	)

	// Show the title
	await $this.titles.splash.overlay_in(1)

	// unlock the button
	ksys.btns.pool.show_splash.toggle(true)
}

$this.hide_vs_title = async function(){
	ksys.btns.pool.show_splash.toggle(false)
	await $this.titles.splash.overlay_out(1)
	ksys.btns.pool.show_splash.toggle(true)
}





// ================================
//        Coach stuff
// ================================
$this.show_coach = async function(side){

	const tgt_club = $this.resource_index.side?.[str(side).lower()]?.club;

	if (!tgt_club){
		ksys.info_msg.send_msg('No club selected', 'warn', 5000);
		return
	}

	ksys.btns.pool.show_coach_home_team.toggle(false)
	// ksys.btns.pool.hide_coach_home_team.toggle(false)
	ksys.btns.pool.show_coach_guest_team.toggle(false)
	// ksys.btns.pool.hide_coach_guest_team.toggle(false)

	await $this.titles.coach.set_text(
		'name',
		ksys.strf.params.coach.format(tgt_club.main_coach)
	)
	await $this.titles.coach.set_img_src(
		'club_logo',
		tgt_club.logo_path
	)
	await $this.titles.coach.overlay_in(1)

	ksys.btns.pool.show_coach_home_team.toggle(true)
	ksys.btns.pool.hide_coach_home_team.toggle(true)
	ksys.btns.pool.show_coach_guest_team.toggle(true)
	ksys.btns.pool.hide_coach_guest_team.toggle(true)
}

$this.hide_coach = async function(){
	await $this.titles.coach.overlay_out(1)
}





// ================================
//        Card stuff
// ================================
$this.hand_card = async function(card_type){
	// sanity check
	if (!['yellow', 'red'].includes(card_type)){
		ksys.info_msg.send_msg(
			`Fatal error: unknown card type: ${card_type}`,
			'err',
			9000
		);
		console.error(
			`hand_card received an invalid card type: ${card_type}`
		)
		return
	}

	// ensure there's a player selected
	const sel_entry = $this.resource_index.card_player_filter.selected_entry;
	const card_manager = $this.resource_index.card_manager;
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
$this.pardon_player = async function(){
	// ensure there's a player selected
	const sel_entry = $this.resource_index.card_player_filter.selected_entry;
	const card_manager = $this.resource_index.card_manager;
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





// ================================
//        Substitute
// ================================
$this.exec_substitute = async function(){
	const leaving_player = (
		$this.resource_index.side.home.substitute['leaving']?.selected_entry?.player
		||
		$this.resource_index.side.guest.substitute['leaving']?.selected_entry?.player
	);
	const incoming_player = (
		$this.resource_index.side.home.substitute['inbound']?.selected_entry?.player
		||
		$this.resource_index.side.guest.substitute['inbound']?.selected_entry?.player
	);

	if (!leaving_player || !incoming_player){
		ksys.info_msg.send_msg(
			`Selection incomplete`,
			'warn',
			2000
		);
		return
	}

	const title = $this.titles.replacement_seq;

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
	await title.overlay_in(1)
	// let it hang for 7 seconds
	await ksys.util.sleep(11000)
	// hide the title
	await title.overlay_out(1)
}











// ================================
//        Timers
// ================================


$this.start_base_timer = async function(rnum){
	if ($this.base_counter){
		$this.base_counter.force_kill()
		$this.base_counter = null;
	}

	$this?.extra_counter?.force_kill()
	$this.extra_counter = null;

	await $this.titles.timer.set_text('extra_ticker', '00:00');
	await $this.extra_time_vis(false)

	ksys.context.module.prm('round_num', rnum)

	const dur = 45;

	await $this.titles.timer.set_text('base_ticker', (rnum == 1) ? '00:00' : '45:00');

	$this.base_counter = ksys.ticker.spawn({
		// 'duration': (rnum == 2) ? (((dur*60)*1)+1) : ((dur*60)+1),
		'duration': ((dur*60)+1),
		'name': `giga_timer${rnum}`,
		'offset': (rnum == 2) ? (dur*60) : 0,
		'infinite': false,
		'reversed': false,
		'callback': $this.timer_callback,
		'wait': true,
	})

	$this.base_counter.fire()
	.then(function(_ticker) {
		// turn off automatically
		const pre_killed = _ticker.killed;
		if (_ticker){
			_ticker.force_kill()
			/*
			if (document.querySelector('#timer_ctrl_additional input').value.trim() && !pre_killed){
			// if (document.querySelector('#timer_ctrl_additional input').value.trim()){
				$this.launch_extra_time()
			}
			*/
			if (!pre_killed){
				$this.launch_extra_time()
			}
		}
	})

	// print($this.base_counter)

}

$this.timer_callback = function(tick){
	const minutes = Math.floor(tick.global / 60)
	const seconds = tick.global - (60*minutes)

	const text = `${str(minutes).zfill(2)}:${str(seconds).zfill(2)}`;

	$this.titles.timer.set_text('base_ticker', text)
	$('#timer_feedback_main').text(text)
}

$this.resume_main_timer_from_offset = function(event){

	if ($this.base_counter){
		$this.base_counter.force_kill()
		$this.base_counter = null;
	}

	const rnum = int(ksys.context.module.prm('round_num')) || 1;

	const offs = eval(document.querySelector('#timer_ctrl_base_resume input').value);

	const dur = (45*60);

	$this.base_counter = ksys.ticker.spawn({
		// 'duration': (rnum == 2) ? ((dur*2)+1) : (dur+1),
		'duration': (dur-(offs%dur))+1,
		'name': `giga_timer_offs${rnum}`,
		// 'offset': (rnum == 2) ? (dur+offs) : (0+offs),
		'offset': offs,
		'infinite': false,
		'reversed': false,
		'callback': $this.timer_callback,
		'wait': true,
	})

	$this.base_counter.fire()
	.then(function(_ticker) {
		// turn off automatically
		if (_ticker){
			_ticker.force_kill()
			// if (document.querySelector('#timer_ctrl_additional input').value.trim()){
			// 	$this.launch_extra_time()
			// }
			$this.launch_extra_time()
		}
	})

	// print($this.base_counter)
}

$this.main_timer_vis = async function(state){
	const title = $this.titles.timer;

	if (state == true){
		// player_color_picker
		// gk_color_picker



		// TEAM COLOR L
		// t-shirts
		const team_col_l_top =
		Path('C:\\custom\\vmix_assets\\t_shirts\\overlay')
		.join(`l_top_${$($this.teams[1].player_color_picker).find('.tcolour.col_selected').attr('tc') || 'ffffff'}.png`);
		await title.set_img_src(`team_col_l_top`, str(team_col_l_top))
		// shorts
		const team_col_l_bot =
		Path('C:\\custom\\vmix_assets\\t_shirts\\overlay')
		.join(`l_bot_${$($this.teams[1].shorts_color_picker).find('.tcolour.col_selected').attr('tc') || 'ffffff'}.png`);
		await title.set_img_src(`team_col_l_bot`, str(team_col_l_bot))

		// TEAM COLOR R
		// t-shirts
		const team_col_r_top =
		Path('C:\\custom\\vmix_assets\\t_shirts\\overlay')
		.join(`r_top_${$($this.teams[2].player_color_picker).find('.tcolour.col_selected').attr('tc') || 'ffffff'}.png`);
		await title.set_img_src(`team_col_r_top`, str(team_col_r_top))
		// shorts
		const team_col_r_bot =
		Path('C:\\custom\\vmix_assets\\t_shirts\\overlay')
		.join(`r_bot_${$($this.teams[2].shorts_color_picker).find('.tcolour.col_selected').attr('tc') || 'ffffff'}.png`);
		await title.set_img_src(`team_col_r_bot`, str(team_col_r_bot))



		await title.set_text('command_l', $this.teams[1].shorthand.value)
		await title.set_text('command_r', $this.teams[2].shorthand.value)

		await title.set_text('score_l', $($this.teams[1].score_pool).find('.team_score_record').length)
		await title.set_text('score_r', $($this.teams[2].score_pool).find('.team_score_record').length)

		title.overlay_in(2)
	}
	if (state == false){
		title.overlay_out(2)
	}
}




$this.launch_extra_time = async function(){
	if ($this.extra_counter){
		$this.extra_counter.force_kill()
		$this.extra_counter = null;
	}

	await $this.update_extra_time_amount()

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

	$this.extra_counter = ksys.ticker.spawn({
		'duration': extra_amount*60,
		'name': `gigas_timer${1}`,
		'infinite': true,
		'reversed': false,
		'callback': $this.extra_timer_callback,
		'wait': true,
	})

	$this.extra_counter.fire()
	.then(function(_ticker) {
		// turn off automatically
		if (_ticker){
			_ticker.force_kill()
		}
	})

	print('EXTRA AMOUNT?!', extra_amount)
	await $this.titles.timer.set_text('extra_ticker', '00:00');
	// await $this.titles.timer.set_text('time_added', `+${Math.floor(extra_amount/1)}`)
	// await $this.titles.timer.toggle_text('time_added', true)
	// await $this.titles.timer.toggle_img('extra_time_bg', true)
	// await $this.titles.timer.toggle_text('extra_ticker', true)
}

$this.extra_timer_callback = function(tick){
	const minutes = Math.floor(tick.global / 60)
	const seconds = tick.global - (60*minutes)

	const text = `${str(minutes).zfill(2)}:${str(seconds).zfill(2)}`;

	$this.titles.timer.set_text('extra_ticker', text)
	$('#timer_feedback_extra').text(text)
}

$this.extra_time_vis = async function(state){
	if (state == true){
		await $this.titles.timer.toggle_text('time_added', true)
		await $this.titles.timer.toggle_text('extra_ticker', true)
		await $this.titles.timer.toggle_img('extra_time_bg', true)
	}
	if (state == false){
		await $this.titles.timer.toggle_text('time_added', false)
		await $this.titles.timer.toggle_text('extra_ticker', false)
		await $this.titles.timer.toggle_img('extra_time_bg', false)
	}
}

$this.update_extra_time_amount = async function(){
	const amount = $('#timer_ctrl_additional input').val()
	await $this.titles.timer.set_text(
		'time_added',
		amount ? `+${amount}` : '',
	)
}



$this.stop_extra_time = function(){
	$this?.extra_counter?.force_kill()
	$this.extra_counter = null;
}


// get combined current timer time
// base ticker + extra time
$this.get_current_time = function(minutes=false){
	return Math.ceil(
		(
			($this?.base_counter?.tick?.global || 1)
			+
			($this?.extra_counter?.tick?.global || 1)
		)
		/
		(minutes ? 60 : 1)
	)
}
