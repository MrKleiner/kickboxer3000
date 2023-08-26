

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









$this.load = async function(){
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
	};


	// --------------------------
	// Create club control
	// --------------------------
	{
		print('Loading clubs')
		// create the class
		const club_ctrl = new $this.FootballClub({
			'club_name': 'лівий берег',
			'club_name_shorthand': 'лБк',
			'main_coach': 'Віталій ПЕРВАК',
		})
		// store the class globally
		$this.resource_index.club_ctrl = club_ctrl;
		// Append control panel to the DOM
		$('#club_definition').append(club_ctrl.control_panel_elem().elem)


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
		]

		for (const _testing of _test){
			club_ctrl.register_player(_testing)
		}

		const team_lineup = new $this.TeamLineup(
			club_ctrl,
			$this.resource_index.available_colors
		)

		$('#team_lineup').append(team_lineup.control_panel_elem())

		$this.index_existing_clubs()

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
//  - club_name_shorthand: Club's name shorthand, like ОБОЛОНЬ - ОБО
// 
//  - main_coach: Club's main coach.
// 
//  - playerbase: An array of dictionaries representing players and their info:
//                {
//                    'name':    player's name,
//                    'surname': player's surname,
//                    'num':     player's number,
//                }
//                This dictionary gets transformed
//                into a ClubPlayer class after initialization.
$this.FootballClub = class{
	constructor(input_club_struct=null, is_enemy=false){
		const club_struct = input_club_struct || {};

		// Base info
		this.logo_path =           club_struct.logo_path || './assets/red_cross.png';
		this.club_name =           club_struct.club_name || '';
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
			vheader.index.title.innerText = this.club_name.upper();
		}
		// update player items
		for (const player of this.playerbase){
			player.forward_update()
		}

		// update self
		this.control_panel.index.logo_feedback.src = this.logo_path;
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
		tplate.index.title.innerText = this.club_name.upper();

		if (this.is_enemy){
			tplate.elem.setAttribute('is_enemy', true)
		}

		// register reference
		this.vis_header_references.add(tplate)

		return tplate.elem
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
		tplate.index.club_title.value = this.club_name
		tplate.index.title_shorthand.value = this.club_name_shorthand
		tplate.index.main_coach.value = this.main_coach
		tplate.index.logo_feedback.src = this.logo_path

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
			self.club_name = evt.target.value
			self.forward_update()
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
			generic_list_elem.index.num.innerText =     this.player_num.upper();
			generic_list_elem.index.surname.innerText = this.player_surname.upper();
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
		tplate.index.num.innerText = this.player_num.upper();
		tplate.index.surname.innerText = this.player_surname.upper();

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
	- club is the FootballClub class the lineup is constructed from.

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

		//
		// create player picker
		// 
		const player_picker = new $this.PlayerPicker(
			this.club.playerbase,
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
		this.shorts_colpick = new $this.TeamLineupColorPicker(this.available_colors);
		this.tplate.index.shorts_color_picker.append(this.shorts_colpick.list)

		this.tshirt_colpick = new $this.TeamLineupColorPicker(this.available_colors);
		this.tplate.index.tshirt_color_picker.append(this.tshirt_colpick.list)

		this.gk_colpick = new $this.TeamLineupColorPicker(this.available_colors);
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
			if (!player_picker.selected_entry){return};
			self.add_player_to_list(
				player_picker.selected_entry.player,
				'main'
			)
			player_picker.pull_out_selection()
		}
		// Append chosen player to the reserve player list
		this.tplate.index.append_to_reserve_list_btn.onclick = function(){
			if (!player_picker.selected_entry){return};
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
		this._selected_color = null;

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
		const col = this.colors[str(newval).replaceAll('#', '')];
		if (!col){
			console.warn('Cannot find target colour:', newval);
		}

		col.click()
	}
}




/*
A regular filter box for quick player lookup.
	- data_source: Iterable array of player classes.
	
	- filter: Filter function.
	          The class checks for name/surname/number match
	          automatically, then the filter function must
	          return true for the player to appear in the list.
	          The function receives exactly 1 argument: Player Class.
	
	- post_filter_action: function to call after the player was added
	                      to the list.
	                      The function receives exactly 1 argument:
	                      indexed generic player list item.
*/
$this.PlayerPicker = class{
	constructor(data_source, filter, post_filter_action=null){
		const self = this;

		this.data_source = data_source;
		this.filter = filter;
		this.post_filter_action = post_filter_action;

		this.selected_entry = null;

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

		// look for matches
		for (const player of this.data_source){
			const name_id = `${player.player_name} ${player.player_surname} ${player.player_num}`;
			// todo: str() is very slow
			if (!name_id.includes(str(query).lower())){continue};
			if (!this.filter(player)){continue};

			// checks passed - append to the list
			const list_item = player.generic_list_elem()
			list_item.elem.onclick = function(){
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
			this.tplate.index.result.append(list_item.elem)

			// apply post-filter actions
			this?.post_filter_action?.(list_item)
		}
	}

	// remove selection from the filtered list
	// and deselect
	pull_out_selection(){
		if (!this.selected_entry){return};
		this.selected_entry.list_elem.remove()
		this.selected_entry = null;
	}
}



$this.create_new_club = function(club_resources=null){
	// create new club class
	const new_club = new $this.FootballClub(club_resources);
	// write club reference to the registry
	$this.resource_index.club_ctrl = new_club;
	new_club.open_panel()
}


$this.save_club_to_file = function(){
	const tgt_dir = $('#club_ctrl_save_to_file_target .tgtdir').val();
	if (!tgt_dir || !$this.resource_index.club_ctrl){return};
	
	// construct path
	const tgt_file = Path(
		tgt_dir,
		($('#club_ctrl_save_to_file_target .tgtfname').val() || 'club_info') + '.clubdef',
	);

	// Write the json file
	tgt_file.writeFileSync(
		JSON.stringify($this.resource_index.club_ctrl.to_json(), null, '\t')
	)
}


$this.save_club_to_local_db = function(){
	// Make sure there's a club to save
	if (!$this.resource_index.club_ctrl || !$this.resource_index?.club_ctrl?.club_name){return};
	// ensure that the club title is not empty
	const club_info = $this.resource_index.club_ctrl.to_json();

	// write file
	ksys.db.module.write(
		`clubs/${club_info.club_name}.clubdef`,
		JSON.stringify(club_info, null, '\t')
	)

	// re-index dropdown
	$this.index_existing_clubs()
}


// Add entries to the club loader dropdown
$this.index_existing_clubs = function(){
	const dropdown = $('#load_existing_club_dropdown select');
	dropdown.find('option:not([value=""])').remove();
	for (const clubname of ksys.db.module.path().join('clubs').globSync('*.clubdef')){
		dropdown.append(`
			<option value="${clubname.stem}">${clubname.stem.upper()}</option>
		`)
	}
}


$this.load_club_by_name = function(clubname=null){
	if (!clubname){return};

	const club_name = clubname.lower();
	const club_info = ksys.db.module.read(`clubs/${club_name}.clubdef`, 'json');
	if (!club_info){return};

	$this.create_new_club(club_info)
}



