

/*

	Long story short, previous system indexed players by a string composed
	of the players' name + surname + number.
	This could totally lead to collisions when creating player lists from
	scratch. It's completely unreliable and utterly fucking retarded.

	The new system hasn't got any of these problems.
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
$this.timer_fset = {
	'at_at': {},
	'builtin': {},
	// todo: move this to the sys level
	'first_load': true,
};

$this.ticker_time = {
	'base':{
		'minutes': 0,
		'seconds': 0,
	},
	'extra':{
		'minutes': 0,
		'seconds': 0,
	},
};

$this.round_duration = 45;

$this.load = async function(){
	const mctx = ksys.context.module;

	$this.main_clock_id = 'fball.main';
	$this.extra_clock_id = 'fball.extra';


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
			'000000',
		],

		color_dict: {
			'000000': 'ffffff',
		},

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

		penalty_manager: new $this.PenaltyManager(5),

		title_graphics: {
			red_card: Path(app_root, 'assets/red_card.png'),
			yellow_card: Path(app_root, 'assets/yellow_card.png'),
			ycbr: Path(app_root, 'assets/pink_panther.png'),
		},
	};

	$this.time_lenghts_dict = {
		1: (0, 45),
		2: (45, 90),
		3: (90, 105),
		4: (105, 120),
	}

	// Round duration
	{
		const dur_input = document.querySelector('input#round_duration');
		dur_input.value = mctx.cache.rdur || 45;
		$this.round_duration = mctx.cache.rdur || 45;
		dur_input.onchange = function(){
			const dur = int(dur_input.value.trim() || 45)
			$this.round_duration = dur;
			ksys.context.module.prm('rdur', dur);
		}
	}

	// --------------------------
	// Index titles
	// --------------------------
	{
		$this.titles = {
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

			// field layout condensed
			'lineup_condensed': new vmix.title({
				'title_name': 'lineup_condensed.gtzip',
				'default_overlay': 2,
				'timings': {
					'fps': 10,
					'frames_in': 10,
					'margin': 5,
				},
			}),


			// cards
			'yellow_card': new vmix.title({
				'title_name': 'yellow_card.gtzip',
				'default_overlay': 2,
				'timings': {
					'fps': 10,
					'frames_in': 10,
					'margin': 2,
				}
			}),
			'red_card': new vmix.title({
				'title_name': 'red_card.gtzip',
				'default_overlay': 2,
				'timings': {
					'fps': 10,
					'frames_in': 10,
					'margin': 2,
				}
			}),
			'ycbr_card': new vmix.title({
				'title_name': 'ycbr.gtzip',
				'default_overlay': 2,
				'timings': {
					'fps': 10,
					'frames_in': 10,
					'margin': 2,
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


			// Substitute as separate title (the ones during the break)
			'subs1': new vmix.title({
				'title_name': 'Half_Substitution.gtzip',
				'default_overlay': 2,
				'timings': {
					'fps': 50,
					'frames_in': 75,
					'margin': 5,
				}
			}),
			'subs2': new vmix.title({
				'title_name': 'Half_Substitution2.gtzip',
				'default_overlay': 2,
				'timings': {
					'fps': 50,
					'frames_in': 75,
					'margin': 5,
				}
			}),
			'subs3': new vmix.title({
				'title_name': 'Half_Substitution3.gtzip',
				'default_overlay': 2,
				'timings': {
					'fps': 50,
					'frames_in': 75,
					'margin': 5,
				}
			}),


			// Substitute as separate title (the ones during the match)
			'm_subs1': new vmix.title({
				'title_name': 'match_substitution1.gtzip',
				'default_overlay': 2,
				'timings': {
					'fps': 10,
					'frames_in': 10,
					'margin': 2,
				}
			}),
			'm_subs2': new vmix.title({
				'title_name': 'match_substitution2.gtzip',
				'default_overlay': 2,
				'timings': {
					'fps': 10,
					'frames_in': 10,
					'margin': 2,
				}
			}),
			'm_subs3': new vmix.title({
				'title_name': 'match_substitution3.gtzip',
				'default_overlay': 2,
				'timings': {
					'fps': 10,
					'frames_in': 10,
					'margin': 2,
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
					'fps': 10,
					'frames_in': 10,
					'margin': 2,
				}
			}),

			// Coach l4d2
			'coach': new vmix.title({
				'title_name': 'coach_lower_third.gtzip',
				'default_overlay': 2,
				'timings': {
					'fps': 25,
					'frames_in': 26,
					'margin': 100,
				}
			}),

			// Timer and scores
			'timer': new vmix.title({
				'title_name': 'persistent_header.gtzip',
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

			// Penalties
			'penalties': new vmix.title({
				'title_name': 'penalties.gtzip',
				'default_overlay': 2,
				'timings': {
					'fps': 10,
					'frames_in': 30,
					'frames_out': 10,
					'margin': 100,
				}
			}),


			// Misc. titles
			'tape': new vmix.title({
				'title_name': 'tape.gtzip',
				'default_overlay': 2,
				'timings': {
					'fps': 10,
					'frames_in': 10,
					'margin': 5,
				}
			}),
			'commenter': new vmix.title({
				'title_name': 'commenter.gtzip',
				'default_overlay': 2,
				'timings': {
					'fps': 10,
					'frames_in': 10,
					'margin': 5,
				}
			}),
			'commenter_x2': new vmix.title({
				'title_name': 'commenter_x2.gtzip',
				'default_overlay': 2,
				'timings': {
					'fps': 10,
					'frames_in': 10,
					'margin': 5,
				}
			}),
			'info_1': new vmix.title({
				'title_name': 'info_1.gtzip',
				'default_overlay': 2,
				'timings': {
					'fps': 10,
					'frames_in': 10,
					'margin': 5,
				}
			}),
			'info_2': new vmix.title({
				'title_name': 'info_2.gtzip',
				'default_overlay': 2,
				'timings': {
					'fps': 10,
					'frames_in': 10,
					'margin': 5,
				}
			}),
			'referee': new vmix.title({
				'title_name': 'referee.gtzip',
				'default_overlay': 2,
				'timings': {
					'fps': 10,
					'frames_in': 10,
					'margin': 5,
				}
			}),
			'water_time': new vmix.title({
				'title_name': 'water_time.gtzip',
				'default_overlay': 2,
				'timings': {
					'fps': 10,
					'frames_in': 10,
					'margin': 5,
				}
			}),
		};
	}


	// --------------------------
	// Image magick location
	// --------------------------
	{
		$this.img_magick = document.querySelector('#image_magick_path');
		$this.img_magick.value = mctx.cache.img_magick || '/';
		$this.img_magick.onchange = function(){
			$this.img_magick.value = $this.img_magick.value.replaceAll('"', '');
			ksys.context.module.prm('img_magick', $this.img_magick.value);
		}
	}



	// --------------------------
	// FFMPEG location
	// --------------------------
	{
		$this.ffmpeg = document.querySelector('#ffmpeg_path');
		$this.ffmpeg.value = mctx.cache.ffmpeg || '/';
		$this.ffmpeg.onchange = function(){
			$this.ffmpeg.value = $this.ffmpeg.value.replaceAll('"', '');
			ksys.context.module.prm('ffmpeg', $this.ffmpeg.value);
		}
	}


	// --------------------------
	// Title schema switch
	// --------------------------
	{
		// Important todo: GTZ Shape is the only one that works
		$this.title_schema_switch = new ksys.switches.KBSwitch({
			'multichoice': false,
			'can_be_empty': false,
			'set_default': mctx.cache.title_schema,
			'dom_array': [
				{
					'id': 'separate',
					'dom': document.querySelector('#title_schema_switch [separate]'),
				},
				{
					'id': 'paged',
					'dom': document.querySelector('#title_schema_switch [paged]'),
				},
			],
			'callback': function(kbswitch, schema_id){
				print('Saved title schema:', schema_id);
				$this.update_title_schema(schema_id);
			}
		});

		if ($this.title_schema_switch.selected == 'paged'){
			$this.persistent_header = new $this.PersistentHeader();
			await $this.persistent_header.pages.pull_page_from_vmix();
		}
	}


	// --------------------------
	// Commenter schema switch
	// --------------------------
	{
		$this.commenter_schema_switch = new ksys.switches.KBSwitch({
			'multichoice': false,
			'can_be_empty': false,
			'set_default': mctx.cache.commenter_schema,
			'dom_array': [
				{
					'id': '2girls1cup',
					'dom': qsel('#commenter_schema_switch [girls2cup1]'),
				},
				{
					'id': '2girls2cups',
					'dom': qsel('#commenter_schema_switch [girls2cup2]'),
				},
			],
			'callback': function(kbswitch, schema_id){
				ksys.context.module.prm('commenter_schema', schema_id);
			}
		});
	}


	// --------------------------
	// Final Scores title Colours Schema
	// --------------------------
	{
		$this.final_scores_color_schema_switch = new ksys.switches.KBSwitch({
			'multichoice': false,
			'can_be_empty': false,
			'set_default': mctx.cache.final_scores_color_schema,
			'dom_array': [
				{
					'id': 'bitmap',
					'dom': qsel('#final_scores_color_schema_switch [bitmap]'),
				},
				{
					'id': 'masked',
					'dom': qsel('#final_scores_color_schema_switch [masked]'),
				},
			],
			'callback': function(kbswitch, schema_id){
				ksys.context.module.prm('final_scores_color_schema', schema_id);
			}
		});
	}



	// --------------------------
	// Persistent header team colours schema
	// --------------------------
	{
		$this.timer_team_color_schema_switch = new ksys.switches.KBSwitch({
			'multichoice': false,
			'can_be_empty': false,
			'set_default': mctx.cache.final_scores_color_schema,
			'dom_array': [
				{
					'id': 'bitmap',
					'dom': qsel('#timer_team_color_schema_switch [bitmap]'),
				},
				{
					'id': 'masked',
					'dom': qsel('#timer_team_color_schema_switch [masked]'),
				},
			],
			'callback': function(kbswitch, schema_id){
				ksys.context.module.prm('timer_team_color_schema_switch', schema_id);
			}
		});
	}



	// --------------------------
	// Command Layout main player list schema
	// --------------------------
	{
		$this.cmd_layout_mains_schema_switch = new ksys.switches.KBSwitch({
			'multichoice': false,
			'can_be_empty': false,
			'set_default': mctx.cache.cmd_layout_mains_schema,
			'dom_array': [
				{
					'id': 'shared',
					'dom': qsel('#lineup_mains_schema_switch [shared]'),
				},
				{
					'id': 'dedicated',
					'dom': qsel('#lineup_mains_schema_switch [dedicated]'),
				},
			],
			'callback': function(kbswitch, schema_id){
				ksys.context.module.prm('cmd_layout_mains_schema', schema_id);
			}
		});
	}


	// --------------------------
	// Time display schema switch
	// --------------------------
	{
		$this.timer_display_schema_switch = new ksys.switches.KBSwitch({
			'multichoice': false,
			'can_be_empty': false,
			'set_default': mctx.cache.timer_display_schema || 'normal',
			'dom_array': [
				{
					'id': 'normal',
					'dom': qsel('#timer_display_schema_switch [normal]'),
				},
				{
					'id': 'fuck_shit',
					'dom': qsel('#timer_display_schema_switch [fuck_shit]'),
				},
			],
			'callback': function(kbswitch, schema_id){
				ksys.context.module.prm('timer_display_schema', schema_id);
			}
		});
	}



	// --------------------------
	// Command Layout reserve player list schema
	// --------------------------
	{
		$this.cmd_layout_reserves_schema_switch = new ksys.switches.KBSwitch({
			'multichoice': false,
			'can_be_empty': false,
			'set_default': mctx.cache.cmd_layout_reserves_schema,
			'dom_array': [
				{
					'id': 'shared',
					'dom': qsel('#lineup_reserves_schema_switch [shared]'),
				},
				{
					'id': 'dedicated',
					'dom': qsel('#lineup_reserves_schema_switch [dedicated]'),
				},
			],
			'callback': function(kbswitch, schema_id){
				ksys.context.module.prm('cmd_layout_reserves_schema', schema_id);
			}
		});
	}



	// --------------------------
	// Red card schema switch
	// --------------------------
	{
		$this.red_card_schema_switch = new ksys.switches.KBSwitch({
			'multichoice': false,
			'can_be_empty': false,
			'set_default': mctx.cache.red_card_schema_switch,
			'dom_array': [
				{
					'id': 'images',
					'dom': document.querySelector('#card_schema_switch [images]'),
				},
				{
					'id': 'color',
					'dom': document.querySelector('#card_schema_switch [color]'),
				},
			],
			'callback': function(kbswitch, schema_id){
				ksys.context.module.prm('red_card_schema_switch', schema_id);
			}
		});

		$this.red_card_schema_color = document.querySelector('#red_card_schema_color');
		$this.red_card_schema_color.value = mctx.cache.red_card_schema_color || 'ff0000';
		$this.red_card_schema_color.onchange = function(){
			ksys.context.module.prm('red_card_schema_color', $this.red_card_schema_color.value);
		}
	}


	// --------------------------
	// Resources location
	// --------------------------
	{
		$this.resources_location = document.querySelector('#resources_location');
		$this.resources_location.value = mctx.cache.resources_location || '/';
		$this.resources_location.onchange = function(){
			$this.resources_location.value = $this.resources_location.value.replaceAll('"', '');
			ksys.context.module.prm('resources_location', $this.resources_location.value);
		}
	}

	// --------------------------
	// Player name schema switch
	// --------------------------
	{
		$this.pname_schema_switch = new ksys.switches.KBSwitch({
			'multichoice': false,
			'can_be_empty': false,
			'set_default': mctx.cache.pname_schema,
			'dom_array': [
				{
					'id': 'surname',
					'dom': document.querySelector('#pname_schema_switch [surname]'),
				},
				{
					'id': 'prefixed',
					'dom': document.querySelector('#pname_schema_switch [prefixed]'),
				},
			],
			'callback': function(kbswitch, schema_id){
				ksys.context.module.prm('pname_schema', schema_id);
			}
		});
	}

	// --------------------------
	//         Role Editor
	// --------------------------
	{
		$this.role_editor = new $this.PlayerRolesEditor();

		$this.role_editor.load();

		document.querySelector('#role_editor').append($this.role_editor.editor_dom.root);
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
					list_dom.elem,
					player_class
				)
			}
		)

		$this.resource_index.card_manager = new $this.CardManager();
		// Todo: it's stupid this is here
		await $this.show_red_cards();

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
					$this.create_club_lineup('home', evt.target.value);

					// todo: is this the right place for this?
					// Trigger lineup save
					$this.global_save({'lineup_lists': true})
				}
			)
		);

		// Guest club lineup selector in the lineup ctrl
		$('guest-club-selector').append(
			$this.resource_index.club_selector_dropdown.dropdown_elem(
				function(evt){
					$this.create_club_lineup('guest', evt.target.value);

					// todo: is this the right place for this?
					// Trigger lineup save
					$this.global_save({'lineup_lists': true})
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
		// todo: save this info to a file too?
		// Or even better: Make these fields part of the core

		// Load todays commenter
		// $('#commenter_name_input')[0].value = mctx.cache.todays_commenter || '';
		// Load VS sublines
		$('#vs_text_bottom_upper')[0].value = mctx.cache.vs_title_bottom_upper_line || '';
		$('#vs_text_bottom_lower')[0].value = mctx.cache.vs_title_bottom_lower_line || '';
		$('#vs_text_main_header')[0].value = mctx.cache.vs_title_main_header_line || '';

		$this.update_team_colors();
		$this.resource_index.score_manager.resync_score_on_title()
	}


	//
	// Stats
	//
	{
		// todo: this is old copypasted code
		const prev_stats = JSON.parse(ksys.db.module.read('stats.fball')) || {'1':{}, '2':{}};

		$this.stats_unit_pool = {};

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
				new $this.StatUnit(
					$this.titles.stats,
					stat_info[1],
					stat_info[2],
					stat_info[3],

					// init val team 1
					prev_stats?.[stat_name]?.['1'],
					// init val team 2
					prev_stats?.[stat_name]?.['2'],
				)

			$this.stats_unit_pool[stat_name] = stat_class;
		}

	}

	// --------------------------
	//     Modern save data
	// --------------------------
	{
		$this.load_lineup_lists();
		$this.load_field_layouts();
		$this.load_card_data();
		$this.load_score_data();
	}

	// --------------------------
	//           AT-AT
	// --------------------------
	{
		// TEMP FIX: Applying the new switch system to the timer switch
		const timer_sys_switch = new ksys.switches.KBSwitch({
			'multichoice':     false,
			'can_be_empty':    false,
			'set_default':     'builtin',
			'highlight_class': 'kb_radio_switch_active',
			'mod_key':         'ctrlKey',
			'dom_array': [
				{
					'id':  'builtin',
					'dom': document.querySelector('#timersys_switch [kb_param_id="builtin"]'),
				},
				{
					'id':  'at_at',
					'dom': document.querySelector('#timersys_switch [kb_param_id="at_at"]'),
				},
			],
			// 'callback': $this.update_selected_timer_system(sw, selected_id, event),
			'callback': $this.update_selected_timer_system,
		})

		$this.resource_index.timer_sys_switch = timer_sys_switch;

		timer_sys_switch.selected = mctx.cache.timer_sys || 'builtin';

		// todo: create a core function that does something like pulling
		// data to inputs from context automatically or something
		document.querySelector('#atat_port_input').value = int(ksys.context.global.cache.atat_port || '');
		const return_addr = ksys.context.global.cache.atat_return_addr;
		if (return_addr){
			document.querySelector('#atat_return_addr_input').value = return_addr.join('.');
		}else{
			document.querySelector('#atat_return_addr_input').value = ksys.util.get_local_ipv4_addr(true)?.join?.('.')
		}


		// todo: make use of this
		$this.at_at = {
			'service_ping': null,
			// important todo: is this absolutely fucking retarded?
			// Not really, because see KbAtCMDGateway's in /sys/ticker.js
			// comment on this matter.
			// Long story short: The less spam - the better.
			'btns_enable_lock': false,
			timer_sys_switch,
		}

		const tgt_timer_fset = timer_sys_switch.selected;

		$this.timer_ctrl = $this.timer_fset[tgt_timer_fset];

		if (tgt_timer_fset == 'at_at'){
			$this.toggle_atat_status_indicator(true);
			$this.restart_atat_service();
			$this.restore_atat_line();
		}else{
			$this.toggle_atat_btns(true);
			$this.toggle_atat_status_indicator(false);

			// 
			// AT-AT-N
			// 

			// Main ticker
			ksys.ticker.bundestag.attach({
				'clock_id': $this.main_clock_id,
				'tick':     $this.timer_fset.builtin.timer_callback,
				'end':      $this.timer_fset.builtin.base_timer_end_callback,
			})

			// Extra time
			ksys.ticker.bundestag.attach({
				'clock_id': $this.extra_clock_id,
				'tick':     $this.timer_fset.builtin.extra_timer_callback,
				'end':      $this.timer_fset.builtin.extra_time_end_callback,
			})

			$this.timer_fset.builtin.timer_callback(
				await ksys.ticker.bundestag.read_clock('fball.main')
			)
			$this.timer_fset.builtin.extra_timer_callback(
				await ksys.ticker.bundestag.read_clock('fball.extra')
			)
		}

		// $this.update_selected_timer_system(tgt_timer_fset);

		// temp fix: address selector dropdown
		const addr_selector = new ksys.ticker.kb_at.AddrPicker({
			'callback': function(_, selected){
				document.querySelector('#atat_return_addr_input').value = selected || '';
			}
		})

		document.querySelector('#atat_ip_addr_picker').append(addr_selector.dom);
	}

	// --------------------------
	//         Penalties
	// --------------------------
	{
		$this.resource_index.penalty_manager.resync(
			ksys.db.module.read('penalty_data.kbsave', 'json')
		);

		$this.resource_index.penalty_manager.resync_vmix();
	}

	// --------------------------
	//         Sequencer
	// --------------------------
	{
		$this.sequencer = new ksys.sequencer.TitleSequencer({
			// Cards in persistent header
			'cards': {
				'anim_in': 1500,
				'hold': 7000,
				'anim_out': 1500,
			},


			// Single in persistent header
			'subs_single_match': {
				'anim_in': 1500,
				'hold': 7000,
				'anim_out': 1500,
			},
			// Stack in persistent header
			'subs_stack_match': {
				'anim_in': 1500 + 4500,
				'hold': 3000,
				'anim_out': 1500,
			},


			// Single during break
			'subs_single_break': {
				'anim_in': 1500,
				'hold': 7000,
				'anim_out': 1500,
			},
			// Stack during match
			'subs_stack_break': {
				'anim_in': 1500,
				'hold': 7000,
				'anim_out': 1500,
			},

			// SCORED!!
			'scored': {
				'anim_in': 1500,
				'hold': 7000,
				'anim_out': 1500,
			},

			// Field Layout
			'field_layout': {
				'anim_in': 2500,
				'hold_main': 7000,
				// 'hold_reserve': 7000,
				'anim_out': 2500,
			},

			// Lineup Condensed
			'lineup_condensed': {
				'anim_in': 2000,
				// 'hold_gk': 4000,
				'hold_page': 4000,
				// 'hold_reserve': 7000,
				'anim_out': 2000,
			},
		});

		$this.sequencer.load();

		document.querySelector('#sequencer').append($this.sequencer.dom.root);
	}


	// --------------------------
	//         Misc. Titles
	// --------------------------
	{
		//     title_id: ID of this title
		//     dom_list: list of field DOM elements
		//     values: dict of field values (field_name:field_value)

		const misc_titles_data = ksys.db.module.read('misc_titles.kbsave', 'json') || {};
		$this.misc_titles = Object.freeze({
			'commenter': new $this.MiscTitle({
				'title_id': 'commenter',
				'dom_list': [
					qsel('[tabid="misc_titles"] [field_id="commenter_name_1"]'),
					qsel('[tabid="misc_titles"] [field_id="commenter_name_2"]'),
				],
				'values': misc_titles_data.commenter,
			}),
			'tape': new $this.MiscTitle({
				'title_id': 'tape',
				'dom_list': [
					document.querySelector('[tabid="misc_titles"] [field_id="tape"]'),
				],
				'values': misc_titles_data.tape,
			}),
			'info_1': new $this.MiscTitle({
				'title_id': 'info_1',
				'dom_list': [
					document.querySelector('[tabid="misc_titles"] [field_id="info_1"]'),
				],
				'values': misc_titles_data.info_1,
			}),
			'info_2': new $this.MiscTitle({
				'title_id': 'info_2',
				'dom_list': [
					document.querySelector('[tabid="misc_titles"] [field_id="info_2_upper"]'),
					document.querySelector('[tabid="misc_titles"] [field_id="info_2_lower"]'),
				],
				'values': misc_titles_data.info_2,
			}),
			'water_time': new $this.MiscTitle({
				'title_id': 'water_time',
				'dom_list': [
					qsel('[tabid="misc_titles"] [field_id="water_time_lower_text"]'),
				],
				'values': misc_titles_data.water_time,
			}),
			'referee': new $this.MiscTitle({
				'title_id': 'referee',
				'dom_list': [
					document.querySelector('[tabid="misc_titles"] [field_id="referee_1_upper"]'),
					document.querySelector('[tabid="misc_titles"] [field_id="referee_1_lower"]'),

					document.querySelector('[tabid="misc_titles"] [field_id="referee_2_upper"]'),
					document.querySelector('[tabid="misc_titles"] [field_id="referee_2_lower"]'),

					document.querySelector('[tabid="misc_titles"] [field_id="referee_3_upper"]'),
					document.querySelector('[tabid="misc_titles"] [field_id="referee_3_lower"]'),

					document.querySelector('[tabid="misc_titles"] [field_id="referee_4_upper"]'),
					document.querySelector('[tabid="misc_titles"] [field_id="referee_4_lower"]'),
				],
				'values': misc_titles_data.referee,
			}),
		})
	}


	/*
	// --------------------------
	//         SAMPLE DATA
	// --------------------------
	{
		// kbmodules.football_standard.resource_index.home_lineup.main_players.at(0)
		// kbmodules.football_standard.resource_index.home_lineup.subs.add_pair

		$this.resource_index.home_lineup.subs.add_pair([
			$this.resource_index.home_lineup.main_players.at(0),
			$this.resource_index.home_lineup.main_players.at(1),
		])
		$this.resource_index.home_lineup.subs.add_pair([
			$this.resource_index.home_lineup.main_players.at(2),
			$this.resource_index.home_lineup.main_players.at(3),
		])
		$this.resource_index.home_lineup.subs.add_pair([
			$this.resource_index.home_lineup.main_players.at(4),
			$this.resource_index.home_lineup.main_players.at(5),
		])

		$this.resource_index.guest_lineup.subs.add_pair([
			$this.resource_index.guest_lineup.main_players.at(0),
			$this.resource_index.guest_lineup.main_players.at(1),
		])
		$this.resource_index.guest_lineup.subs.add_pair([
			$this.resource_index.guest_lineup.main_players.at(2),
			$this.resource_index.guest_lineup.main_players.at(3),
		])
		// $this.resource_index.guest_lineup.subs.add_pair([
		// 	$this.resource_index.guest_lineup.main_players.at(4),
		// 	$this.resource_index.guest_lineup.main_players.at(5),
		// ])

	}
	*/
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
$this.FootballClub = class{
	constructor(input_club_struct=null, is_enemy=false){
		const self = this;
		ksys.util.cls_pwnage.remap(self);

		const club_struct = input_club_struct || {};

		// Base info
		self.logo_path =               club_struct.logo_path || './assets/red_cross.png';
		self.club_name =              (club_struct.club_name || '').lower();
		self.club_name_shorthand =     club_struct.club_name_shorthand || '';
		self.main_coach =             (club_struct.main_coach || '').lower();
		self.main_coach_title_short = (club_struct.main_coach_title_short || '').lower();
		self.main_coach_title_long =  (club_struct.main_coach_title_long || '').lower();

		// important todo: this is very unreliable
		self.is_enemy =            is_enemy;

		// An array of ClubPlayer classes
		self.playerbase =          new Set();

		// populate internal registry with initial data, if any
		for (const player_info of (club_struct.playerbase || [])){
			self.playerbase.add(new $this.ClubPlayer(this, player_info))
		}

		// Control panel reference
		self.control_panel = null;

		// visual headers references
		self.vis_header_references = new Set();
	}

	// forward update logos and club name
	forward_update(self){
		// update visual headers
		for (const vheader of self.vis_header_references){
			vheader.index.logo.src = self.logo_path;
			vheader.index.title.textContent = self.club_name.upper();
		}
		// update player items
		for (const player of self.playerbase){
			player.forward_update()
		}

		// update self
		self.control_panel.index.logo_feedback.src = self.logo_path;
		self.control_panel.index.logo_feedback.setAttribute('kbhint', self.logo_path);
	}

	// get visual header: an element with club logo + name
	// this data is expected to be persistent
	vis_header_elem(self){
		const tplate = ksys.tplates.index_tplate(
			'#club_header_template',
			{
				'logo':    'img',
				'title':   'club-header-title',
			}
		);

		tplate.index.logo.src = self.logo_path;
		tplate.index.title.textContent = self.club_name.upper();

		if (self.is_enemy){
			tplate.elem.setAttribute('is_enemy', true)
		}

		// register reference
		self.vis_header_references.add(tplate)

		return tplate.elem
	}

	// Delete all the club's resources from the interface
	erase(self){
		// 1 - delete team lineup
		if ($this.resource_index.home_lineup?.club?.club_name?.lower?.() == self.club_name.lower()){
			$('#team_lineup home-club-lineup').empty()
		}
		if ($this.resource_index.guest_lineup?.club?.club_name?.lower?.() == self.club_name.lower()){
			$('#team_lineup guest-club-lineup').empty()
		}

		// Lastly, delete club control panel
		self.control_panel?.elem?.remove?.()
	}

	// Register a new player in this club
	// - input_player_info:dict player info as described in FootballClub class
	register_player(self, input_player_info=null){
		// create player class
		const player = new $this.ClubPlayer(self, input_player_info);
		// add player to the registry
		self.playerbase.add(player);
		// add player cfg box to the club pool
		self.control_panel.index.player_pool.append(player.player_params_elem().elem)
		// return the player class
		return player
	}

	// Create club control panel
	// todo: somehow make the file input element look like a file has just been selected
	control_panel_elem(self){
		if (self.control_panel){
			return self.control_panel
		}

		const tplate = ksys.tplates.index_tplate(
			'#club_def_template',
			{
				'logo_feedback':    'img.club_def_logo_visfeedback',

				// base params
				'logo_input':             'club-base-params club-param[prmname="logo"] input',
				'club_title':             'club-base-params club-param[prmname="title"] input',
				'title_shorthand':        'club-base-params club-param[prmname="title_shorthand"] input',
				'main_coach':             'club-base-params club-param[prmname="main_coach"] input',
				'main_coach_title_short': 'club-base-params club-param[prmname="main_coach_title_short"] input',
				'main_coach_title_long':  'club-base-params club-param[prmname="main_coach_title_long"] input',

				// Playerbase
				'reg_player_btn':  'club-playerbase sysbtn[btname="register_player_in_club"]',
				'player_pool':     'club-playerbase playerbase-pool',

				// Init from URL
				// todo: inplement properly
				'init_from_url_input': 'club-base-params club-param[prmname="init_from_url"] input',
				'init_from_url_btn':   'club-base-params club-param[prmname="init_from_url"] sysbtn',

				'search':   'input.player_editor_search',
			}
		);

		// save the template
		// todo: only one definition panel can exist for now
		self.control_panel = tplate;

		// populate pool with existing players
		for (const player of self.playerbase){
			tplate.index.player_pool.append(player.player_params_elem().elem)
		}

		// write other info
		tplate.index.club_title.value = self.club_name.upper();
		tplate.index.title_shorthand.value = self.club_name_shorthand.upper();
		tplate.index.main_coach.value = self.main_coach.upper();
		tplate.index.main_coach_title_short.value = self.main_coach_title_short.upper();
		tplate.index.main_coach_title_long.value = self.main_coach_title_long.upper();
		tplate.index.logo_feedback.src = self.logo_path;
		tplate.index.logo_feedback.setAttribute('kbhint', self.logo_path);

		tplate.index.search.oninput = function(){
			for (const player_dom of tplate.index.player_pool.querySelectorAll('player-config')){
				const nameid = (
					        player_dom.querySelector('[prmname="player_num"] input').value.lower()
					+ ' ' + player_dom.querySelector('[prmname="player_surname"] input').value.lower()
					+ ' ' + player_dom.querySelector('[prmname="player_name"] input').value.lower()
				)

				const seqrch_query = tplate.index.search.value.lower().trim();
				if (nameid.includes(seqrch_query) || !seqrch_query){
					player_dom.classList.remove('kbsys_hidden');
				}else{
					player_dom.classList.add('kbsys_hidden');
				}
			}
		}

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
		// bind coach title change
		tplate.index.main_coach_title_short.onchange = function(evt){
			self.main_coach_title_short = evt.target.value.lower();
		}
		// bind coach title change
		tplate.index.main_coach_title_long.onchange = function(evt){
			self.main_coach_title_long = evt.target.value.lower();
		}

		// todo: implement properly
		tplate.index.init_from_url_btn.onclick = async function(evt){
			const html_d = (new DOMParser).parseFromString(
				(await ksys.util.url_get(tplate.index.init_from_url_input.value, 'text')).payload,
				'text/html'
			);
			console.log('get players');
			html_d.querySelectorAll('#ex1-tabs-1 .my-1').forEach(function(el) {
				const pfio = el.querySelectorAll('.m-0');
				const pnum = el.querySelector('.card-footer .col-auto');
				const role = el.querySelector('.card-footer .small');
				const pdata = self.register_player({
					'name': pfio[1].innerHTML.split(/(\s+)/)[0],
					'surname': pfio[0].innerHTML,
					'num': pnum.innerHTML.trim(),
					'role': $this.role_editor.create({
						'role_name_full': (role?.textContent || '').lower().trim(),
					}),
				})
				// let plr = {};
				// plr.name = pfio[1].innerHTML.split(/(\s+)/)[0];
				// plr.surname = pfio[0].innerHTML;
				// plr.num = pnum.innerHTML;
				
			});
		}

		return tplate
	}

	// open club control panel in the club tab
	open_panel(self){
		// delete previous control panel
		$('#club_definition club-def').remove();
		// Append new club
		$('#club_definition').append(self.control_panel_elem().elem);
		// set reference to this club in the resource index
		$this.resource_index.club_ctrl = self;
	}

	// return a json representing this club
	to_json(self){
		const dump = {
			'logo_path':              self.logo_path,
			'club_name':              self.club_name,
			'club_name_shorthand':    self.club_name_shorthand,
			'main_coach':             self.main_coach,
			'main_coach_title_short': self.main_coach_title_short,
			'main_coach_title_long':  self.main_coach_title_long,
			'playerbase':             [],
		};

		for (const player of self.playerbase){
			dump.playerbase.push(player.as_dict())
		}

		print('Club dump info:', dump)

		return dump
	}

	// Get player class by nameid
	get_player_by_nameid(self, tgt_nameid=null){
		if (!tgt_nameid){return null};

		for (const player of self.playerbase){
			if (player.name_id == tgt_nameid){
				return player
			}
		}

		// console.warn(
		// 	'Could not find player with id of',
		// 	tgt_nameid
		// )

		return null
	}
}



// - input_player_info:dict player info as described in FootballClub class
// - parent_club:FootballClub parent football club.
// This data is persistent, unless killed
$this.ClubPlayer = class{
	static NPRINT_NAME = 'ClubPlayer';

	constructor(parent_club, input_player_info=null){
		const self = this;
		ksys.util.cls_pwnage.remap(self);
		ksys.util.nprint(self, '#7FE2FF');

		const player_info = input_player_info || {};

		self.club = parent_club;

		self.player_name =    (player_info.name || '').lower();
		self.player_surname = (player_info.surname || '').lower();
		self.player_num =     (player_info.num || '').lower();

		// stats
		self.yellow_cards = 0;
		self.red_cards = 0;

		// todo: is this stupid?
		self.references = new Set();

		self.role = player_info.role;
	}

	$surname(self){
		self.nprint('Getting player surname')
		if ($this.pname_schema_switch.selected == 'prefixed'){
			const prefix = self.player_name.trim()[0] ? `${self.player_name.trim()[0]}.` : '';
			return `${prefix} ${self.player_surname}`
		}else{
			return self.player_surname
		}
	}

	// forward player data (name, surname, number, ...)
	// to all the related elements
	forward_update(self){
		self.nprint('forwarding update')
		for (const generic_list_elem of self.references){
			generic_list_elem.index.logo.src =            self.club.logo_path;
			generic_list_elem.index.num.textContent =     self.player_num.upper();
			generic_list_elem.index.surname.textContent = self.player_surname.upper();

			// generic_list_elem.index.role.innerHTML = '';
			// if (self.role){
			// 	self.nprint('Adding role DOM:', self.role.visfeed_short_dom().root)
			// 	generic_list_elem.index.role.append(self.role.visfeed_short_dom().root);
			// }
		}

		// todo: there used to be
		/*
		$this.global_save({
			'lineup_lists': true,
			'field_layout': true,
		})
		*/
	}

	// Remove the player from EVERYWHERE
	disqualify(self){
		// Remove DOM elements
		self.unlist();
		// Delete self from the club's registry
		self.club.playerbase.delete(self);
	}

	// Unlist the player ftom the current match
	unlist(self){
		// Delete all the GUI elements from the page
		for (const reference of self.references){
			reference.elem.remove();
		}
	}

	// delete obsolete references
	// todo: this means there are always redundant
	// elements until this method is called
	collect_garbage(self){
		for (const rubbish of self.references){
			if (!document.body.contains(rubbish.elem)){
				self.references.delete(rubbish);
			}
		}
	}

	// return an indexed template from ksys.tplates.index_tplate
	generic_list_elem(self, collect_rubbish=true){
		const tplate = ksys.tplates.index_tplate(
			'#generic_player_list_item_template',
			{
				'logo':    'img.player_club_logo',
				'num':     '.player_number',
				'surname': '.player_surname',
				'role':    '.player_role',
			}
		);

		// delete redundant references
		if (collect_rubbish){
			self.collect_garbage()
		}

		// Write down data
		tplate.index.logo.src = self.club.logo_path;
		tplate.index.num.textContent = self.player_num.upper();
		tplate.index.surname.textContent = self.player_surname.upper();

		// if (self.role){
		// 	tplate.index.role.append(self.role.visfeed_short_dom().root);
		// }

		// const role_selector_short_dom = self.role.editor.selector_dom(self, true);
		// role_selector_short_dom.index.list.value = self.role?.role_id || '';
		// tplate.index.role.append(role_selector_short_dom.root);

		// Write down reference to this element
		self.references.add(tplate);

		// too bad JS doesn't support cool python unpacking
		// (aka return a, b)
		return tplate
	}

	// return player config element
	// (inputs with name, surname, name, ...)
	player_params_elem(self){
		const tplate = ksys.tplates.index_tplate(
			'#generic_player_config_template',
			{
				'name':    'player-param[prmname="player_name"] input',
				'surname': 'player-param[prmname="player_surname"] input',
				'num':     'player-param[prmname="player_num"] input',
				'role':    'player-param[prmname="player_role"]',
			}
		);

		// Populate params
		tplate.index.name.value = self.player_name.upper();
		tplate.index.surname.value = self.player_surname.upper();
		tplate.index.num.value = self.player_num.upper();
		const role_selector_dom = $this.role_editor.selector_dom(self);
		tplate.index.role.append(role_selector_dom.root);
		// todo: is this stupid?
		role_selector_dom.index.list.value = self.role?.role_id || '';

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
				$this.resource_index.side.home?.club?.club_name?.lower?.(),
				$this.resource_index.side.guest?.club?.club_name?.lower?.(),
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

	$name_id(self){
		return `${self.player_name} ${self.player_surname} ${self.player_num}`.lower()
	}

	$side(self){
		if (self.club.is_enemy){
			return 'guest'
		}else{
			return 'home'
		}
	}

	// test whether the player is inside another player array
	// by his name_id
	is_in(self, target_array){
		for (const player of target_array){
			if (self.name_id == player.name_id){
				return true
			}
		}
		return false
	}

	$role(self){
		return self._role
	}

	$$role(self, tgt_role=null){
		if ((typeof tgt_role) == 'string'){
			self._role = $this.role_editor.lookup(tgt_role);
			self.forward_update();
			return
		}
		self._role = tgt_role;

		self.forward_update();
	}

	// return a dictionary representing this player
	as_dict(self){
		return {
			'name':    self.player_name,
			'surname': self.player_surname,
			'num':     self.player_num,
			'role':    self.role?.role_id || null,
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
$this.TeamLineup = class{
	constructor(club, colors=null, input_lineup_info=null){
		const self = this;
		ksys.util.cls_pwnage.remap(self);

		self.club = club;
		const lineup_info = input_lineup_info || {};

		print('Input lineup config', input_lineup_info)

		// basic config
		self.shorts_color =      lineup_info.shorts_col || null;
		self.shorts_text_color = lineup_info.shorts_text_col || null;

		self.tshirt_color =      lineup_info.tshirt_col || null;
		self.tshirt_text_color = lineup_info.tshirt_text_col || null;

		self.gk_color =          lineup_info.gk_col || null;
		self.gk_text_color =     lineup_info.gk_text_col || null;

		// todo: unused as of now
		self.field_layout = lineup_info.field_layout || {};

		// Team colours to pick from (hardcoded list of hex colours)
		// todo: vmix DOES support shape colour shifting
		self.available_colors = colors || [];

		// Colour picker classes
		self.shorts_colpick = null;
		self.tshirt_colpick = null;
		self.gk_colpick = null;

		// These sets contain player classes
		self.main_players = new Set();
		self.reserve_players = new Set();

		// todo: There can be only one control panel
		// why??
		self.tplate = null;

		self._roster = '';


		// 
		// Store input data
		// 

		// todo: is this stupid ?
		self.input_lineup_info = lineup_info;

		// Substitute stack
		self.subs = new $this.PlayerSubstitutes(self);
	}

	$roster(self){
		return self._roster || '';
	}

	redraw_pcounts(self){
		self.tplate.index.append_to_main_list_btn.textContent = `Add Here (${self.main_players.size})`;
		self.tplate.index.append_to_reserve_list_btn.textContent = `Add Here (${self.reserve_players.size})`;
	}

	// get control panel element for the lineup
	control_panel_elem(self){
		// todo: There can be only one control panel
		if (self.tplate){
			return self.tplate.elem
		}

		// Create the control panel itself
		self.tplate = ksys.tplates.index_tplate(
			'#club_match_lineup_template',
			{
				// Side (home/guest)
				'side':                'side-indicator',

				// Config (colour pickers)
				'shorts_color_picker': 'lineup-param[prmname="shorts_color"] .param_content',
				'tshirt_color_picker': 'lineup-param[prmname="tshirt_color"] .param_content',
				'gk_color_picker':     'lineup-param[prmname="gk_color"] .param_content',
				'roster':              'lineup-param[prmname="roster"] input',

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

		self._roster = ksys.context.module.prm(
			self.club.is_enemy ? 'roster_guest' : 'roster_home'
		) || '';

		// Roster
		self.tplate.index.roster.value = self._roster;

		self.tplate.index.roster.onchange = function(){
			self._roster = self.tplate.index.roster.value;
			ksys.context.module.prm(
				(self.club.is_enemy ? 'roster_guest' : 'roster_home'),
				self.tplate.index.roster.value
			);
		}

		//
		// create player picker
		// 
		const player_picker = new $this.PlayerPicker(
			[self.club.playerbase],

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
		self.tplate.index.player_picker_placeholder.replaceWith(player_picker.box);


		//
		// create colour pickers
		// 
		const resources = Path($this.resources_location.value || '/');


		// todo: shorts are now used for the timer title colours
		self.shorts_colpick = new $this.TeamLineupColorPicker({
			'baking': {
				'mask': resources.join('timer_team_color_mask.png'),
				'result_name': 'timer_team_color.png',
			}
		});
		// self.tplate.index.shorts_color_picker.append(self.shorts_colpick.dom.root)


		self.tshirt_colpick = new $this.TeamLineupColorPicker({
			'baking': {
				'mask': resources.join('tshirt', 'mask.png'),
				'bg': resources.join('tshirt', 'outline.png'),
				'result_name': 'tshirt_players.png',
			},
			'change_callback': function(color){
				self.shorts_colpick.color = color;
			}
		});
		self.tplate.index.tshirt_color_picker.append(self.tshirt_colpick.dom.root)


		self.gk_colpick = new $this.TeamLineupColorPicker({
			'baking': {
				'mask': resources.join('tshirt', 'mask.png'),
				'bg': resources.join('tshirt', 'outline.png'),
				'result_name': 'tshirt_gk.png',
			}
		});
		self.tplate.index.gk_color_picker.append(self.gk_colpick.dom.root)


		//
		// create header (visual identifier)
		// 
		self.tplate.elem.append(self.club.vis_header_elem())


		// 
		// Bind button actions
		// 

		// Append chosen player to the main player list
		self.tplate.index.append_to_main_list_btn.onclick = function(){
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
			$this.global_save({'lineup_lists': true})

			// self.redraw_pcounts();
		}
		// Append chosen player to the reserve player list
		self.tplate.index.append_to_reserve_list_btn.onclick = function(){
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
			$this.global_save({'lineup_lists': true})

			// self.redraw_pcounts();
		}
		// Edit related club in the club panel
		self.tplate.index.edit_club_btn.onclick = function(){
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
		self.shorts_colpick.text_color = self.shorts_text_color;

		self.tshirt_colpick.selected_color = self.tshirt_color;
		self.tshirt_colpick.text_color = self.tshirt_text_color;

		self.gk_colpick.selected_color = self.gk_color;
		self.gk_colpick.text_color = self.gk_text_color;

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

		// self.redraw_pcounts();


		return self.tplate.elem
	}

	// Add a player to either main player list or reserve
	// - player: ClubPlayer
	// - which_list: 'main' | 'reserve'
	add_player_to_list(self, player, which_list){
		const tgt_list = which_list == 'main' ? self.main_players : self.reserve_players;
		if (tgt_list.size >= 11){
			ksys.info_msg.send_msg(
				`There are more than 11 players in this list, proceed with extreme caution (aka the entire datastructure is getting corrupted)`,
				'warn',
				15000
			);
		}

		// print('Target list:', tgt_list, this.main_players, this.reserve_players)
		// if the player is already in the list - return
		if (self.main_players.has(player) || self.reserve_players.has(player)){return};

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
			$this.global_save({'lineup_lists': true})
		}
		// Add generic list item to the internal registry
		tgt_list.add(player)

		// Append DOM element to the list
		if (which_list == 'main'){
			self.tplate.index.main_list.append(list_elem.elem)
		}else{
			self.tplate.index.reserve_list.append(list_elem.elem)
		}

		self.redraw_pcounts();

	}

	// - player: ClubPlayer
	// - which_list: 'main' | 'reserve'
	remove_player_from_list(self, player, which_list){
		// todo: this is stupid
		let target_list = null;
		if (which_list == 'main'){target_list = self.main_players};
		if (which_list == 'reserve'){target_list = self.reserve_players};

		target_list.delete(player);

		self.redraw_pcounts();
	}

	// get selected lineup colours
	$colors(self){
		return {
			'tshirt': self.tshirt_colpick.selected_color,
			'shorts': self.shorts_colpick.selected_color,
			'gk': self.gk_colpick.selected_color,
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
$this._TeamLineupColorPicker = class{
	constructor(color_codes, callback=null){
		const self = this;
		ksys.util.cls_pwnage.remap(self);

		self.color_codes = color_codes || [];
		self.callback = callback;

		// currently active colour by colour code
		self._selected_color = color_codes[0];

		// colour objects (js DOM elements)
		self.colors = {};

		self.tplate = ksys.tplates.index_tplate(
			'#team_lineup_color_picker_template',
			{},
		);

		// the dom element itself
		self.list = self.tplate.elem;

		for (const col of self.color_codes){
			const clear_hex = str(col).replaceAll('#', '');

			// create colour DOM element
			const color_elem = $(`<picker-color style="background: #${clear_hex}"></picker-color>`)[0];
			// write down colour into palette registry
			self.colors[clear_hex] = color_elem;
			// append the DOM element to the list
			self.tplate.elem.append(color_elem)
			// Bind actions
			color_elem.onclick = function(){
				self.selected_color = clear_hex;

				// todo: is this the right place for this?
				// Trigger lineup save
				$this.global_save({'lineup_lists': true})
			}
		}
	}

	$selected_color(self){
		return self._selected_color
	}

	$$selected_color(self, newval){
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

$this.TeamLineupColorPicker = class{
	static NPRINT_NAME = 'TeamLineupColorPicker';

	constructor(params){
		const self = this;
		ksys.util.cls_pwnage.remap(self);
		ksys.util.nprint(self, '#8C86FF');

		self._dom = null;

		// This expects:
		// mask:         BW mask full abs path
		// bg:           Overlay mask result over this, if any. Full abs path
		// result_name:  filename of the resulting png image
		self.bake_params = params?.baking;

		self.change_callback = params?.change_callback;

		// self.suffix = ksys.util.rnd_uuid();
		self.suffix = params?.suffix || '';

		// Whether baked result needs rebaking
		self.bake_valid = false;
		self._baked = null;

		self._text_color_switch = null;
	}

	async img_dims(self, img_src){
		const [promise, resolve, reject] = ksys.util.promise();
		const img = new Image();
		img.onload = function() {
			resolve({
				width:  img.width,
				height: img.height
			})
		}
		img.src = img_src;

		return (await promise)
	}

	$selected_color(self){
		return self.color
	}

	$$selected_color(self, tgt_color){
		self.color = tgt_color;
	}

	$color(self){
		return self.dom.index.color_input.value
	}

	$$color(self, tgt_color){
		self.bake_valid = false;
		const color_code = str(tgt_color || 'ffffff').replaceAll('#', '').trim();
		self.dom.index.color_input.value = '#' + color_code;
		self.dom.index.color_code.value = color_code;

		self?.change_callback?.('#' + color_code);
	}

	$text_color(self){
		return self.text_color_switch.selected;
	}

	$$text_color(self, tgt_color){
		self.nprint('Setting BW color switch to:', tgt_color)
		self.text_color_switch.selected = tgt_color;
	}

	async run_proc(self, bin_path, params, pipe_data, buf_only=false){
		const text_decoder = new TextDecoder();

		const [promise, resolve, reject] = ksys.util.promise();
		const stdio = {'stdio': pipe_data?.proc_params}
		const proc = child_proc(
			bin_path,
			params,
			pipe_data ? stdio : {}
		);

		const status = {
			'stdout': [],
			'stderr': [],
			'stdbuf': [],
			'exit_code': null,
		}

		proc.stdout.on('data', function(data){
			if (!buf_only){
				try{status.stdout.push(text_decoder.decode(data))}catch{};
			}
			status.stdbuf.push(data);
		})

		proc.stderr.on('data', function(data){
			try{status.stderr.push(text_decoder.decode(data))}catch{};
		})

		proc.on('close', function(code){
			status.exit_code = code;
			resolve(true);
		})

		if (pipe_data){
			let idx = 3;
			for (const pipe_buf of pipe_data.bufs){
				proc.stdio[idx].write(
					Buffer.from(pipe_buf)
				)
				proc.stdio[idx].end();
				idx += 1;
			}
		}


		await promise;

		return {
			'stderr': status.stderr.join(''),
			'stdout': status.stdout.join(''),
			'stdbuf': Buffer.concat(status.stdbuf),
			'code': status.exit_code,
		}
	}

	$baked_WORKS(self){
		return new Promise(async function(resolve, reject){
			if (self._baked && self.bake_valid){
				resolve(self._baked)
				return
			}
			if (!self.bake_params){
				resolve(null)
				return
			}

			const text_decoder = new TextDecoder();

			const fill_dims = await self.img_dims(self.bake_params.mask);
			self.nprint('Fill dims:', fill_dims);

			const result_fpath = Path($this.resources_location.value).join('baked', str(self.bake_params.result_name));

			// 1 - generate color fill
			self.nprint('Generating fill');
			const fill_fpath = Path($this.resources_location.value, 'baked', `${self.color.replaceAll('#', '')}.png`);
			const fill_params = [
				'-y',
				'-f', 'lavfi',
				'-i', `color=c=${self.color}:size=${fill_dims.width}x${fill_dims.height}`,
				'-frames:v', '1',
				`${str(fill_fpath)}`
			]
			self.nprint('FILL PARAMS', fill_params);
			const fill_proc = child_proc(`C:\\custom\\ffmpeg_vulkan\\bin\\ffmpeg.exe`, fill_params);
			const [fill_promise, fill_resolve, fill_reject] = ksys.util.promise();
			fill_proc.on('close', function(code){
				self.nprint('Fill generation exit code:', code);
				fill_resolve(true);
			})
			fill_proc.stdout.on('data', function(data){
				self.nprint(text_decoder.decode(data))
			})
			fill_proc.stderr.on('data', function(data){
				self.nprint(text_decoder.decode(data))
			})
			await fill_promise
			self.nprint('DONE Generating fill')

			// 2 - apply mask
			self.nprint('Applying mask')
			const masked_fpath = result_fpath.withStem(result_fpath.stem + '_masked');
			self.nprint('Masked:', masked_fpath)
			const mask_proc = child_proc($this.img_magick.value, [
				`${str(fill_fpath)}`, `${str(self.bake_params.mask)}`,
				'-alpha', 'off',
				'-compose', 'CopyOpacity',
				'-composite',
				`${str(masked_fpath)}`
			])
			const [mask_promise, mask_resolve, mask_reject] = ksys.util.promise();
			mask_proc.on('close', function(code){
				self.nprint('Mask generation exit code:', code);
				mask_resolve(true);
			})
			mask_proc.stdout.on('data', function(data){
				self.nprint(text_decoder.decode(data))
			})
			mask_proc.stderr.on('data', function(data){
				self.nprint(text_decoder.decode(data))
			})
			await mask_promise
			self.nprint('DONE Applying mask')

			// at this point - the image is ready
			let baked_result_fpath = masked_fpath;

			// 3 - apply bg (if any)
			if (self.bake_params.bg){
				self.nprint('Overlaying')
				baked_result_fpath = result_fpath;
				const overlay_proc = child_proc($this.img_magick.value, [
					// bottom gear
					str(self.bake_params.bg),
					// top gear
					str(masked_fpath),
					'-gravity', 'center',
					'-composite', str(result_fpath),
				])
				const [overlay_promise, overlay_resolve, overlay_reject] = ksys.util.promise();
				overlay_proc.on('close', function(code){
					self.nprint('BG overlay exit code:', code);
					overlay_resolve(true);
				})
				overlay_proc.stdout.on('data', function(data){
					self.nprint(text_decoder.decode(data))
				})
				overlay_proc.stderr.on('data', function(data){
					self.nprint(text_decoder.decode(data))
				})
				await overlay_promise
				self.nprint('DONE Overlaying')
			}

			self.nprint('Bake final result:', baked_result_fpath);

			self.bake_valid = true;

			self._baked = baked_result_fpath

			resolve(self._baked)
		})
	}

	$baked_shorter(self){
		return new Promise(async function(resolve, reject){
			if (self._baked && self.bake_valid){
				resolve(self._baked)
				return
			}
			if (!self.bake_params){
				resolve(null)
				return
			}

			const text_decoder = new TextDecoder();

			const fill_dims = await self.img_dims(self.bake_params.mask);
			self.nprint('Fill dims:', fill_dims);

			const result_fpath = Path(
				$this.resources_location.value,
				'baked',
				str(self.suffix + self.bake_params.result_name)
			)


			// 1 - generate color fill
			self.nprint('Generating fill');
			const fill_fpath = Path(
				$this.resources_location.value,
				'baked',
				`${self.suffix + self.color.replaceAll('#', '')}.png`
			);
			const fill_params = [
				'-y',
				'-f', 'lavfi',
				'-i', `color=c=${self.color}:size=${fill_dims.width}x${fill_dims.height}`,
				'-frames:v', '1',
				`${str(fill_fpath)}`
			]
			self.nprint('FILL PARAMS', fill_params);
			const fill_proc_result = await self.run_proc(
				$this.ffmpeg.value,
				fill_params
			)
			self.nprint('DONE Generating fill', fill_proc_result)


			// 2 - apply mask
			self.nprint('Applying mask')
			const masked_fpath = result_fpath.withStem(result_fpath.stem + '_masked');
			const mask_params = [
				str(fill_fpath),  str(self.bake_params.mask),
				'-alpha',         'off',
				'-compose',       'CopyOpacity',
				'-composite',
				str(masked_fpath),
			]
			self.nprint('Mask params:', mask_params)
			const mask_proc_result = await self.run_proc(
				$this.img_magick.value,
				mask_params
			)
			self.nprint('DONE Applying mask', mask_proc_result)


			// at this point - the image is ready
			let baked_result_fpath = masked_fpath;

			// 3 - apply bg (if any)
			if (self.bake_params.bg){
				self.nprint('Overlaying')
				baked_result_fpath = result_fpath;
				const overlay_params = [
					// bottom gear
					str(self.bake_params.bg),
					// top gear
					str(masked_fpath),
					'-gravity', 'center',
					'-composite', str(result_fpath),
				]
				self.nprint('Overlay params:', overlay_params)
				const overlay_proc_result = await self.run_proc(
					$this.img_magick.value,
					overlay_params
				)
				self.nprint('DONE Overlaying:', overlay_proc_result)
			}

			self.nprint('Bake final result:', baked_result_fpath);

			self.bake_valid = true;

			self._baked = baked_result_fpath

			resolve(self._baked)
		})
	}

	async test(self){
		// #698cdd
		// -f lavfi -i color=c=#698cdd:size=250x250:rate=1 -frames:v 1 -vcodec png -f image2pipe pipe:1
		const fill_params = [
			// '-y',
			'-f', 'lavfi',
			'-i', `color=c=#698cdd:size=250x250:rate=1`,
			'-frames:v', '1',
			'-vcodec', 'png',
			'-f', 'image2pipe',
			// `${str(fill_fpath)}`
			'pipe:1',
		]
		const proc_result = await self.run_proc(
			$this.ffmpeg.value,
			fill_params,
		)

		self.nprint(proc_result)

		Path('W:/fussball/titles/vbet_22_07_2025/dev/pipe_test.png').writeFileSync(proc_result.stdbuf);

		// $this.img_magick.value
		const pipe_data = {
			'proc_params': [
				'pipe',
				'pipe',
				'pipe',
				'pipe',
				'pipe',
			],
			'bufs': [
				proc_result.stdbuf,
				Path(self.bake_params.mask).readFileSync(),
			]
		}
		const mask_params = [
			'fd:3', 'fd:4',
			'-alpha',     'off',
			'-compose',   'CopyOpacity',
			'-composite',
			'png:-',
		]

		const mask_result = await self.run_proc(
			$this.img_magick.value,
			mask_params,
			pipe_data,
		)

		self.nprint('Mask result:', mask_result)

		Path('W:/fussball/titles/vbet_22_07_2025/dev/pipe_test_masked.png').writeFileSync(mask_result.stdbuf);
	}

	$baked(self){
		return new Promise(async function(resolve, reject){
			if (self._baked && self.bake_valid){
				resolve(self._baked)
				return
			}
			if (!self.bake_params){
				resolve(null)
				return
			}

			// The fill must be of the same resolution as the mask
			const fill_dims = await self.img_dims(self.bake_params.mask);
			self.nprint('Fill dims:', fill_dims);


			// 1 - generalte solid colour fill
			// ffmpeg.exe params
			const fill_params = [
				'-f',        'lavfi',
				'-i',        `color=c=${self.color}:size=${fill_dims.width}x${fill_dims.height}`,
				'-frames:v', '1',
				'-vcodec',   'png',
				'-f',        'image2pipe',
				'pipe:1',
			]
			// ffmpeg.exe result
			self.nprint('Generating fill', fill_params);
			const fill_result = await self.run_proc(
				$this.ffmpeg.value,
				fill_params,
				false, false
			)
			self.nprint('Fill result', fill_result);


			// 2 - generate masked
			const mask_pipe_data = {
				'proc_params': [
					'pipe',
					'pipe',
					'pipe',
					'pipe',
					'pipe',
				],
				'bufs': [
					fill_result.stdbuf,
					Path(self.bake_params.mask).readFileSync(),
				]
			}
			const mask_params = [
				'fd:3',
				'fd:4',
				'-alpha',     'off',
				'-compose',   'CopyOpacity',
				'-composite', 'png:-',
			]
			self.nprint('Generating masked', mask_pipe_data, mask_params);
			const mask_result = await self.run_proc(
				$this.img_magick.value,
				mask_params,
				mask_pipe_data,
				false
			)
			self.nprint('Mask result:', mask_result)

			let result_buf = mask_result.stdbuf;

			// 3 - overlay over another image, if needed
			if (self.bake_params.bg){
				const overlay_params = [
					// bottom gear
					'fd:3',
					// top gear
					'fd:4',
					'-gravity',   'center',
					'-composite', 'png:-',
				]
				const overlay_pipe_data = {
					'proc_params': [
						'pipe',
						'pipe',
						'pipe',
						'pipe',
						'pipe',
					],
					'bufs': [
						// bottom gear
						Path(self.bake_params.bg).readFileSync(),
						// top gear
						mask_result.stdbuf,
					]
				}
				const overlay_result = await self.run_proc(
					$this.img_magick.value,
					overlay_params,
					overlay_pipe_data,
					false
				)
				self.nprint('Overlay result:', overlay_result);

				result_buf = overlay_result.stdbuf;
			}

			self.bake_valid = true;
			self._baked = result_buf;

			resolve(self._baked)

		})
	}

	$text_color_switch(self){
		if (self._text_color_switch){
			return self._text_color_switch
		}

		self._text_color_switch = new ksys.switches.KBSwitch({
			'multichoice': false,
			'can_be_empty': false,
			'set_default': 'white',
			'dom_array': [
				{
					'id': 'white',
					'dom': self.dom.index.bw_white,
				},
				{
					'id': 'black',
					'dom': self.dom.index.bw_black,
				},
			],
			'callback': function(kbswitch, color){
				self.text_color = color;
				$this.global_save({'lineup_lists': true})
			}
		});

		return self._text_color_switch
	}

	$dom(self){
		if (self._dom){
			return self._dom
		}

		self._dom = ksys.context.tplates.general.team_lineup_color_picker({
			'color_input': '.color_picker',
			'color_code':  '.color_code',

			'bw_white':    '.text_color_switch [kbswitch_item][white]',
			'bw_black':    '.text_color_switch [kbswitch_item][black]',
		})

		self._dom.index.color_input.onchange = function(){
			self.color = self._dom.index.color_input.value;
			// self.bake_valid = false;
			// self._dom.index.color_code.value = self._dom.index.color_input.value.replaceAll('#', '');
			// todo: is this the right place for this?
			// Trigger lineup save
			$this.global_save({'lineup_lists': true})
		}
		self._dom.index.color_code.onchange = function(){
			self.color = self._dom.index.color_code.value;
			// self.bake_valid = false;
			// self.color = self._dom.index.color_code.value;
			// todo: is this the right place for this?
			// Trigger lineup save
			$this.global_save({'lineup_lists': true})
		}

		self._dom.index.color_code.textContent = self.color;
		self._dom.index.color_input.value = self.color;

		return self._dom
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
		ksys.util.cls_pwnage.remap(self);

		self.data_source = data_sources;
		self.filter = filter;
		self.post_filter_action = post_filter_action;

		self.selected_entry = null;

		self.filtered_entries = [];

		// Create the filter box DOM element
		self.tplate = ksys.tplates.index_tplate(
			'#player_picker_template',
			{
				'input':    'input.player_picker_input',
				'result':   'player-picker-result',
			}
		);

		// The DOM element itself
		self.box = self.tplate.elem;

		// bind events
		// todo: this can directly point to this.match_query
		self.tplate.index.input.oninput = function(evt){
			// const query = evt.target.value;
			self.match_query(evt.target.value)
		}
	}

	// Filter data source according to query and display the results
	// - query: query string
	match_query(self, query){
		// clear previous selection
		self.selected_entry = null;
		// clear pool
		self.tplate.index.result.innerHTML = '';
		self.filtered_entries = [];

		// look for matches
		for (const dsource of self.data_source){
			for (const player of dsource){
				// const name_id = `${player.player_name} ${player.player_surname} ${player.player_num}`;
				const name_id = player.name_id;
				// todo: str() is very slow
				if (!name_id.includes(str(query).lower())){continue};
				if (!self.filter(player)){continue};

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
				self.tplate.index.result.append(list_item.elem)
				self.filtered_entries.push({
					'player': player,
					'list_elem': list_item.elem,
				})

				// apply post-filter actions, if any
				self?.post_filter_action?.(list_item, player);

				// Important todo: big crisis
				$this.role_editor.litter();
			}
		}

	}

	// remove selection from the filtered list
	// and deselect
	pull_out_selection(self){
		if (!self.selected_entry){return};
		self.selected_entry.list_elem.remove()
		self.selected_entry = null;
	}

	// deselect currently selected item
	reset_selection(self){
		if (!self.selected_entry){return};
		self.selected_entry.list_elem.classList.remove('selected_entry')
		self.selected_entry = null;
	}
}


$this.ClubSelectorDropdown = class{
	constructor(){
		const self = this;
		ksys.util.cls_pwnage.remap(self);

		self.registry = new Set();
	}

	dropdown_elem(self, onchange){
		const tplate = ksys.tplates.index_tplate(
			'#club_selector_dropdown_template',
			{}
		);
		$(tplate.elem).append('<option value="">--</option>');
		tplate.elem.onchange = onchange;
		self.registry.add(tplate.elem);
		self.resync();
		return tplate.elem
	}

	resync(self){
		// Technically, there could be multiple dropdowns
		// Practically - why ???
		for (let dropdown of self.registry){
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


$this.FieldLayout = class{
	constructor(lineup){
		const self = this;
		ksys.util.cls_pwnage.remap(self);

		if (!lineup){
			ksys.info_msg.send_msg(
				`FATAL: No lineup supplied to the FieldLayout class. Nothing will work`,
				'err',
				10000
			);
			console.error(
				'FATAL: No lineup supplied to the FieldLayout class. Nothing will work',
				'lineup',
				self,
			);
		}

		self.lineup = lineup;
		self.grid = new Set();

		// Map of cell dom:linked cell dict
		// todo: unused
		self.cell_map = new Map();

		// the player being dragged
		self.drag_target = {
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
			self.grid.add(row);

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
						const old_cell = self.cell_struct_from_dom(self.drag_target.list_elem.parentElement);

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
							$this.global_save({'field_layout': true})
						}

						// When swapping with an element from a list
						if (!old_cell && new_cell){
							print('Swapping from a list')
							new_cell.player = self.drag_target.player;

							// todo: is this the right place for this?
							// Save field layout
							$this.global_save({'field_layout': true})
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
						$this.global_save({'field_layout': true})
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
						$this.global_save({'field_layout': true})
					}
				}

				// unused
				cell.dom.onmouseover = function(){
					self.hover_target = cell;
				}

				// Absolutely retarded hack.
				// It has already been forgotten why it's needed,
				// but everything breaks without it
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

				row.add(cell);
			}
		}

		// todo: temp: hide some cells
		for (const row of self.grid){
			row.at(0).dom.classList.add('ghost_cell')
		}
		for (const cell of self.grid.at(-1)){
			cell.dom.classList.add('ghost_cell')
		}
		self.grid.at(-1).at(5).dom.classList.remove('ghost_cell')

		// instantiate grid DOM
		self.tplate = ksys.tplates.index_tplate(
			'#field_layout_template',
			{
				'picker': 'field-layout-picker',
				'grid':   'field-layout-grid',
				'header': 'field-layout-header',
			},
		);

		// append cells to grid DOM
		for (const cell of self.iter_cells()){
			self.tplate.index.grid.append(cell.dom)
		}

		// create player picker
		self.picker = new $this.PlayerPicker(
			// data source
			[self.lineup.main_players, self.lineup.reserve_players],
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
				self.bind_list_item(list_item, tgt_player)
			}
		)

		// append player picker to the template
		self.tplate.index.picker.append(self.picker.box)

		// append cell DOMs to the template
		for (const cell of self.iter_cells()){
			self.tplate.index.grid.append(cell.dom)
			self.cell_map[cell.dom] = cell;
		}

		// create club header and add it to the template
		self.tplate.index.header.append(self.lineup.club.vis_header_elem())
	}

	* iter_cells(self){
		for (const row of self.grid){
			for (const cell of row){
				yield cell
			}
		}
	}

	$goalkeeper(self){
		for (const cell_data of self.iter_cells()){
			if (cell_data.id == '8_5'){
				return cell_data.player
			}
		}

		return null
	}

	// check whether the player is on the field
	// and return the associated cell if so
	is_on_field(self, player){
		for (const cell of self.iter_cells()){
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
	to_json(self){
		const layout = {};

		for (const cell of self.iter_cells()){
			if (!cell.player){continue};

			layout[cell.id] = cell.player.name_id;
		}

		return layout;
	}

	wipe_field(self){
		self.hover_target = null;
		self.drag_target = {
			'player': null,
			'list_elem': null,
			'cell': null,
		};

		for (const cell in self.iter_cells()){
			cell.player = null;
			$(cell.dom).empty();
		}
	}

	// layout_data is a dict of cell_id:name_id
	apply_layout(self, layout_data){
		if (!layout_data){
			console.error('No layout data supplied to apply_layout', layout_data, self.lineup)
			return
		}

		// First - wipe the field
		self.wipe_field()

		// Now, add players
		for (const cell of self.iter_cells()){
			const player = self.lineup.club.get_player_by_nameid(layout_data[cell.id])
			if (!player){continue};

			cell.player = player;

			// create generic player list item
			const player_list_item = player.generic_list_elem();

			// create binds
			self.bind_list_item(player_list_item, player);

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
// todo: add to_json() method
// todo: over time the entire club would be in the red card registry. Too bad

// important todo: There are too many redraw calls.
// It's totally possible to reduce the load (from 10ms to 9ms)
$this.CardManager = class {
	constructor(init_data=null){
		const self = this;
		ksys.util.cls_pwnage.remap(self);

		// time in ms the card title should stay on screen
		// this.title_hang_time = 7000;

		self.player_picker = $this.resource_index.card_player_filter;


		self.sides = {
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
			self.sides[side].card_array = [
				tplate.index['card_a'],
				tplate.index['card_b'],
				tplate.index['card_c'],
			];
			self.sides[side].dom_index = tplate.index;

			tplate.index.pool.onclick = function(evt){
				if (evt.altKey){
					self.reg_red(side, null)
				}
			}
			tplate.index.pool.oncontextmenu = function(evt){
				if (evt.altKey){
					self.cancel_red(side)
				}
			}

			$('#red_card_counter').append(tplate.elem)
		}

	}

	// Show the relevant amount of cards in the counters
	// (old implementation)
	_redraw_counters(self){
		for (const side of ['home', 'guest']){
			cmap = self.sides[side].yc_map;

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
			for (const card of self.sides[side].card_array){
				card.classList.remove('.rcard_shown')
			}
			// gradually show cards
			for (const idx of range(red_count)){
				const card = self.sides[side].card_array[idx];
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
		self.resync_vmix();
	}

	// Show the cards the player has received
	// Directly in the list item
	// todo: get rid of jquery
	redraw_card_vis_feedback_in_list_item(self, list_dom=null, player=null){
		let items = [];
		if (!list_dom && !player){
			items = [...self.player_picker.filtered_entries];
			// print('Redrawing entire list:', items)
		}else{
			items = [{
				'list_elem': list_dom,
				'player': player,
			}]
		}

		for (const list_item of items){
			// print('Redrawing vis feedback for', list_item);

			const card_container = $('<div class="list_item_card_vis_feedback"></div>');
			const record = self.get_pside(list_item.player).yc_map.get(list_item.player);
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
		// print('evaluating button states')
		// todo: it's really stupid that it's here
		self.redraw_card_vis_feedback_in_list_item()

		ksys.btns.toggle({
			'red_card':           false,
			'yellow_card':        false,
			'pardon_yellow_card': false,
		})
		const player = self.player_picker?.selected_entry?.player;
		if (!player){return};

		const record = self.get_pside(player).yc_map.get(player)
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
	resync(self){
		for (const side of ['home', 'guest']){
			// the club currently loaded for this side in the system
			const active_club = $this.resource_index.side[side].club;
			// the club referenced in the CardManager registry
			const referenced_club = self.sides[side].club;
			// can only proceed if there's a club loaded for this side
			if (!active_club){continue};

			// if the referenced club does not match the club loaded in the system - resync
			// It's also intended to work when the referenced club is null
			if (active_club != referenced_club){
				self.sides[side].club = active_club;
				self.sides[side].yc_map = new Map();
				self.sides[side].red_stack = new Set();
				// and overwrite the visual header
				$(self.sides[side].dom_index.header).html(active_club.vis_header_elem())
			}
		}

		// Redraw the red card counters for both sides to reflect the current state
		self.redraw_counters()
	}

	// Get player's side (home/guest)
	// Player doesn't has to be registered for this to work
	get_pside(self, player, as_index=true){
		// print('Fuckshit', player);
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
		const yc_map = self.get_pside(player).yc_map

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

	// 1+ code duplications is already too much
	async show_card_title(self, title, player){
		if ($this.title_schema_switch.selected == 'paged'){
			let header_text = '';
			let icon = null;

			if (title.title_name == 'yellow_card.gtzip'){
				header_text = 'ЖОВТА КАРТКА';
				icon = Path($this.resources_location.value, 'icons/yellow_card.png')
			}

			if (title.title_name == 'ycbr.gtzip'){
				header_text = 'ДРУГА ЖОВТА КАРТКА';
				icon = Path($this.resources_location.value, 'icons/ycbr.png')
			}

			if (title.title_name == 'red_card.gtzip'){
				header_text = 'ЧЕРВОНА КАРТКА';
				icon = Path($this.resources_location.value, 'icons/red_card.png')
			}

			// $this.timeout_persistent_header_btns(7000 + 2500 + 50);
			$this.timeout_persistent_header_btns(
				$this.sequencer.sequences.cards.sum
			);

			const time = $this.get_current_time(true);
			const time_suffix = time.extra ? `+${time.extra}` : '';

			await $this.persistent_header.event({
				'header': header_text,
				'upper_text': player.surname,
				'lower_text': `${time.base}'` + time_suffix + ' ХВИЛИНА',
				'icon': str(icon),
				'team_logo': player.club.logo_path,
			})

			// let it hang for 7 seconds
			// await ksys.util.sleep(7000);
			await ksys.util.sleep(
				$this.sequencer.sequences.cards.items.hold.dur
			);
			// Switch back to clock
			await $this.persistent_header.clock();
			// Do not proceed any further
			return
		}else{
			// Set the player's surname
			await title.set_text(
				'player_name',
				ksys.strf.params.players.format(player.surname),
			)

			// important todo: Hardcoded shit
			// Set description
			const time = $this.get_current_time(true);
			const time_suffix = time.extra ? `+${time.extra}` : '';
			await title.set_text(
				'descr',
				`${time.base}'` + time_suffix + ' ХВИЛИНА',
			)

			// Set club logo
			await title.set_img_src('club_logo', player.club.logo_path)

			ksys.btns.adv_timeout({
				'yellow_card': $this.sequencer.sequences.cards.sum,
				'red_card':    $this.sequencer.sequences.cards.sum,
			})

			// Hide red cards
			await $this.hide_red_cards();

			// show the title
			await title.overlay_in()
			// let it hang for 7 seconds
			await ksys.util.sleep(
				$this.sequencer.sequences.cards.items.hold.dur
			)
			// await ksys.util.sleep($this.sequencer.sequences.cards.items.hold.dur);
			// hide the title
			await title.overlay_out()
			await $this.show_red_cards();
		}
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
		const pcard_info = self.ensure_player_is_registered(player);

		// All 3 titles (yellow, red, ycbr) have the same fields
		// So the logic is: Figure out what's going on -> update registry ->
		// select the title to show -> update the title -> show the title
		let title = null;

		// If this is a second warning - the title is yellow+yellow=red
		if (pcard_info.warned){
			pcard_info.red = true;
			title = $this.titles.ycbr_card;
			// register this red card
			self.reg_red(
				self.get_pside(player, false),
				player
			)
		}else{
			// otherwise - it's a first warning
			pcard_info.warned = true;
			title = $this.titles.yellow_card;

			// todo: is this the right place?
			// save card data
			$this.global_save({'card_data': true})
		}

		self.eval_button_states()

		// update the corresponding vmix title and show it
		await self.show_card_title(title, player)

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
		const pcard_info = self.ensure_player_is_registered(player);
		// todo: also flip warned to false ?
		pcard_info.red = true;
		// register this red card
		const pside = player.club.is_enemy ? 'guest' : 'home';
		self.reg_red(pside, player)

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
		self.redraw_counters()
		self.eval_button_states()

		// todo: is this the right place?
		// save card data
		$this.global_save({'card_data': true})
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
			const record = self.get_pside(last_red_player).yc_map.get(last_red_player)
			if (record){
				record.red = false;
			}
		}

		self.sides[side].red_stack.del_idx(-1)

		// todo: is this the right place?
		// save card data
		$this.global_save({'card_data': true})

		self.redraw_counters()
		self.eval_button_states()
	}

	// pardon a red card by player class
	named_red_pardon(self, player){
		const pside = self.get_pside(player);
		for (const rcard_record of pside.red_stack){
			if (rcard_record.player == player){
				pside.red_stack.delete(rcard_record)
			}
		}

		// todo: is this the right place?
		// save card data
		$this.global_save({'card_data': true})
	}

	// Pardon the player
	pardon(self, player){
		const pcard_info = self.ensure_player_is_registered(player);
		const pside = player.club.is_enemy ? 'guest' : 'home';

		// Cancel first warning only
		if (pcard_info.warned && !pcard_info.red){
			print('Cancelling first warning')
			pcard_info.warned = false;
			self.eval_button_states()
			self.redraw_counters()

			// todo: is this the right place?
			// save card data
			$this.global_save({'card_data': true})
			return
		}

		// Cancel ycbr
		if (pcard_info.warned && pcard_info.red){
			print('Cancelling ycbr')
			pcard_info.red = false;
			// self.cancel_red(pside)
			self.named_red_pardon(player)
			self.eval_button_states()
			self.redraw_counters()

			// todo: is this the right place?
			// save card data
			$this.global_save({'card_data': true})
			return
		}

		// Cancel immediate red
		if (!pcard_info.warned && pcard_info.red){
			print('Immediate red')
			pcard_info.red = false;
			// self.cancel_red(pside)
			self.named_red_pardon(player)
			self.eval_button_states()
			self.redraw_counters()

			// todo: is this the right place?
			// save card data
			$this.global_save({'card_data': true})
			return
		}

	}

	// resync title state in vmix
	async resync_vmix(self){
		// todo: there's an automatic assumption that home is index 1 of the cards
		const retarded = ['home', 'guest'];
		for (const _side_idx in retarded){
			const side_idx = int(_side_idx)
			const side = self.sides[retarded[side_idx]];

			for (const card_idx of range(3)){
				if ($this.red_card_schema_switch.selected == 'images'){
					await $this.titles.timer.toggle_img(
						`rcard_${side_idx+1}_${card_idx+1}`,
						!!side.red_stack.at(card_idx)
					)
				}else{
					await $this.titles.timer.set_shape_color(
						`rcard_${side_idx+1}_${card_idx+1}`,
						$this.red_card_schema_color.value + (!!side.red_stack.at(card_idx) ? '' : '00')
					)
				}
				
			}
		}
	}

	// todo: check whether club names match
	apply_data(self, input_data){
		if (!input_data){
			console.warn('Tried loading invalid card data:', input_data);
			return
		};

		for (const side of ['home', 'guest']){
			// todo: is it fine to get club by side ?
			const club = self.sides[side].club;

			if (!input_data[side] || !club){continue};

			self.sides[side].yc_map = new Map();
			self.sides[side].red_stack = new Set();

			// reconstruct yc map
			for (const player_nameid in input_data[side].yc_map){
				const player = club.get_player_by_nameid(player_nameid);
				const record_data = input_data[side].yc_map[player_nameid];
				if (!player){continue};

				self.sides[side].yc_map.set(player, record_data);
			}

			// reconstruct red stack
			for (const player_nameid of input_data[side].red_stack){
				const player = club.get_player_by_nameid(player_nameid);
				if (!player && player_nameid !== false){continue};

				self.sides[side].red_stack.add({
					'player': player || null,
				})
			}
		}

		// redraw/resync stuff
		self.redraw_counters();
		self.redraw_card_vis_feedback_in_list_item();
		self.eval_button_states();
	}
}







$this.ClubGoals = class {
	constructor(parent_club, init_data=null){
		const self = this;
		ksys.util.cls_pwnage.remap(self);

		self.parent_club = parent_club;

		self.tplate = ksys.tplates.index_tplate(
			'#club_score_list_template',
			{
				'header':              'club-score club-score-header',
				'list':                'club-score-list',
				'add_score_named_btn': 'club-score-buttons .club_score_add_record.add_score_with_player',
				'add_score_anon_btn': 'club-score-buttons .club_score_add_record.add_score_blank',
			}
		);

		// The dom element of the control panel
		self.dom = self.tplate.elem;

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
		self.score_stack = new Set();

		self.selected_record = null;

		// append header
		self.tplate.index.header.append(parent_club.vis_header_elem())


		self.tplate.index.add_score_named_btn.onclick = function(evt){
			const selected_player = $this.resource_index.score_manager.player_picker?.selected_entry?.player;
			if (!selected_player){
				ksys.info_msg.send_msg(
					`No player selected !`,
					'warn',
					3000
				);
				return
			}

			self.add_score(selected_player)
		}

		self.tplate.index.add_score_anon_btn.onclick = function(evt){
			self.add_score(null)
		}
	}

	// Add a score
	add_score(
		self,
		player=null,
		flags=null,
		timestamp_override=null,
		dosave=true,
		ignore_timer=false,
		override_id=null,
		locked=false)
	{
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

		if (locked){
			// important todo: proper links ?
			// This is simply retarded.
			tplate.elem.classList.add('score_locked');
		}

		// sanity check
		// if (!$this?.base_counter?.tick && !ignore_timer){
		if (false){
			ksys.info_msg.send_msg(
				`Main timer does not exist (no timestamp will be added to the score record)`,
				'warn',
				9000
			);
		}

		// get combined current time in minutes
		// todo: is it possible for timestamp_override to be random rubbish data
		// therefore corrupting half the data structure ?
		const calculated_timestamp = timestamp_override || $this.get_current_time(true);

		// create a registry record
		// todo: protection from garbage in input_flags.autogoal & input_flags.penalty
		const record = {
			// important todo: id pram was added as a last-minute
			// hack for penalties
			'id': override_id || lizard.rndwave(),
			'locked': locked,


			'author': player,
			'flags': {
				'autogoal': input_flags.autogoal || false,
				'penalty':  input_flags.penalty || false,
			},
			'time': calculated_timestamp,

			'dom_struct': tplate,
		}

		// push the record to the stack
		self.score_stack.add(record);


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
			const dur = $this.round_duration;
			if (input_val.includes('+') && (!input_val.includes(str(dur)) && !input_val.includes(str(dur*2)))){
				ksys.info_msg.send_msg(
					`Are you sure this is a valid format ?`,
					'warn',
					5000
				);
			}

			const components = input_val.split('+');
			record.time.base = int(components[0] || 0);
			record.time.extra = int(components[1] || 0);

			$this.global_save({'scores': true});
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

				// $this.global_save({'scores': true})
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

				$this.global_save({'scores': true})
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

				$this.global_save({'scores': true})
			};
		}


		// Deletion
		tplate.elem.oncontextmenu = function(evt){
			if (evt.altKey){
				self.delete_record(record);
			}
		}

		// changing the author
		tplate.elem.onclick = function(evt){
			if (!evt.target.closest('.score_author')){return};
			// stupid hack to make it possible to toggle
			const do_toggle = self.selected_record == record;

			$this.resource_index.score_manager.reset_player_selection();

			self.set_selected_record(record)

			if (do_toggle){
				$this.resource_index.score_manager.reset_player_selection();
			}
		}

		// todo: is this stupid?
		if (dosave){
			$this.global_save({'scores': true})
		}

		// finally, append the template to the DOM
		self.tplate.index.list.append(tplate.elem)

		// todo: what about async methods in here?
		// this function is also used to load scores from the previous save...
		$this.resource_index.score_manager.resync_score_on_title();

		return record;
	}

	// modify the author of the selected score record
	mod_author(self){
		// sanity check
		if (!self.selected_record){
			ksys.info_msg.send_msg(
				`FATAL: Unable to modify the author, because no record is selected (This message should never appear)`,
				'err',
				9000
			);
			return
		}

		// get the new player selected in the player picker
		const new_player = $this.resource_index.score_manager.player_picker.selected_entry.player;

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
		$this.resource_index.score_manager.reset_player_selection();

		// todo: is this the right place ?
		$this.global_save({'scores': true})
	}

	set_selected_record(self, record){
		self.selected_record = record;
		$(self.dom).find('.selected_score_record').removeClass('selected_score_record');
		record.dom_struct.elem.classList.add('selected_score_record');
	}

	delete_record(self, record=null){
		if (!record){return};

		// if deleted record is also the one currently selected - deselect
		if (record == self.selected_record){
			self.selected_record = null;
		}
		self.score_stack.delete(record);
		record.dom_struct.elem.remove()
		$this.resource_index.score_manager.resync_score_on_title()

		$this.global_save({'scores': true})
	}
}



// This class keeps track of both sides' scores
$this.ScoreManager = class{
	constructor(init_data=null){
		const self = this;
		ksys.util.cls_pwnage.remap(self);

		self.sides = {
			'home': {
				'score_list': null,
			},
			'guest': {
				'score_list': null,
			},
		}

		// create the player picker
		self.player_picker = new $this.PlayerPicker(
			[[]],
			function(){return true}
		)

		$('#score_ctrl_player_search').append(self.player_picker.box)
	}

	resync_picker_sources(self){
		const new_source = [];
		for (const side of ['home', 'guest']){
			// todo: if not lineup - continue
			new_source.push($this.resource_index.side[side]?.lineup?.main_players || []);
			new_source.push($this.resource_index.side[side]?.lineup?.reserve_players || []);
		}
		self.player_picker.data_source = new_source;
	}

	// resync lineups
	resync_lineups(self){
		// todo: there are too many 'for side of home, guest' loops
		for (const side of ['home', 'guest']){
			const club_data = $this.resource_index.side[side]
			if (club_data.lineup){
				const club_goals = new $this.ClubGoals(club_data.club);
				self.sides[side].score_list = club_goals;
				$(`#score_ctrl_${side}`).html(club_goals.dom);
			}
		}
	}

	reset_player_selection(self){
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

	async resync_score_on_title(self){
		const title = $this.titles.timer;

		// important todo: keep doing these stupid checks or simply lock all tabs till both lineups are present ?
		const home_score_list = $this.resource_index.score_manager.sides?.home?.score_list
		if (home_score_list){
			await title.set_text('score_l', home_score_list.score_stack.size)
		}

		const guest_score_list = $this.resource_index.score_manager.sides?.guest?.score_list
		if (guest_score_list){
			await title.set_text('score_r', guest_score_list.score_stack.size)
		}
		
	}

	// todo: add as_string param to all to_json() methods
	to_json(self){
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
			if (!self.sides[side].score_list){continue};

			dump[side].club_name = self.sides[side].score_list.parent_club.club_name.lower();

			for (const score of self.sides[side].score_list.score_stack){
				dump[side].score_list.push({
					'id': score.id,
					'author': score?.author?.name_id || null,
					'flags': score.flags,
					'timestamp': score.time,
					'locked': score.locked,
				})
			}
		}

		return dump
	}

	// todo: check club names
	// todo: make all to_json/apply_data functions be like in this class
	// (solid data structure and the save function from outside doesn't even create a temp buffer)
	apply_data(self, input_data){
		for (const side of ['home', 'guest']){
			const tgt_score_list = self.sides[side].score_list;
			const src_score_list = input_data[side].score_list;
			if (!tgt_score_list || !src_score_list){continue};

			for (const score of src_score_list){
				const player = (
					self.sides.home?.score_list?.parent_club?.get_player_by_nameid?.(score.author)
					||
					self.sides.guest?.score_list?.parent_club?.get_player_by_nameid?.(score.author)
					||
					null
				);
				tgt_score_list.add_score(
					player,
					score.flags,
					score.timestamp,
					false,
					true,
					score.id,
					score.locked
				)
			}
		}

		// todo: is this really needed ?
		self.resync_score_on_title()
	}

	// todo: unused
	$selected_score_record(self){
		return (
			self.sides?.home?.score_list?.selected_record
			||
			self.sides?.guest?.score_list?.selected_record
			||
			null
		)
	}

	modify_score_author(self){
		// todo: beautify ?
		if (self.sides?.home?.score_list?.selected_record){
			self.sides.home.score_list.mod_author(self.sides.home.score_list)
			return
		}
		if (self.sides?.guest?.score_list?.selected_record){
			self.sides.guest.score_list.mod_author(self.sides.guest.score_list)
			return
		}
	}
}






// Penalty manager. Persistent.
$this.PenaltyManager = class{
	constructor(pcount=5){
		const self = this;
		ksys.util.cls_pwnage.remap(self);

		self.pcount = pcount;

		self.dom_data = ksys.tplates.index_tplate(
			'#penalty_pool_template',
			{
				'header': '.pool_header',
				'table':  '.pool_table',
			}
		);

		self.sides = {
			'home': null,
			'guest': null,
		};
	}

	// Resync with relevant data, such as active clubs
	// Even if a single club changes - everything is wiped,
	// because otherwise it'd be a stupid mess.
	resync(self, input_data=null){
		// Wipe previous data
		self.sides?.home?.wipe();
		self.sides?.guest?.wipe();

		$('#penalty_pools').empty();

		// Create 2 penalty pools
		self.sides = {
			'home': new $this.TeamPenaltyPool(
				self,
				$this.resource_index.score_manager.sides['home'],
				$this.resource_index.side.home.club,
				input_data?.['home']
			),
			'guest': new $this.TeamPenaltyPool(
				self,
				$this.resource_index.score_manager.sides['guest'],
				$this.resource_index.side.guest.club,
				input_data?.['guest']
			),
		}

		// Append pools' DOM to the page
		$('#penalty_pools').append(self.sides.home.dom_data.elem);
		$('#penalty_pools').append(self.sides.guest.dom_data.elem);
	}

	async resync_vmix(self){
		for (const side in self.sides){
			for (const row_idx in self.sides[side].ctrl_elems){
				self.sides[side].ctrl_elems[row_idx].push_to_vmix()
			}
		}

		await $this.titles.penalties.set_img_src(
			'club_logo_l',
			$this.resource_index.side.home.club.logo_path
		)
		await $this.titles.penalties.set_img_src(
			'club_logo_r',
			$this.resource_index.side.guest.club.logo_path
		)

		await $this.titles.penalties.set_shape_color(
			'color_l',
			$this.resource_index.side.home.lineup.tshirt_colpick.color
		)
		await $this.titles.penalties.set_shape_color(
			'color_r',
			$this.resource_index.side.guest.lineup.tshirt_colpick.color
		)

		await $this.titles.penalties.set_text(
			'team_name_r',
			$this.resource_index.side.guest.club.club_name_shorthand.upper()
		)
		await $this.titles.penalties.set_text(
			'team_name_l',
			$this.resource_index.side.home.club.club_name_shorthand.upper()
		)

		await $this.titles.penalties.set_text(
			`score_l`,
			// $this.resource_index.score_manager.sides['home'].score_list.score_stack.size
			self.sides.home.sum
		)
		await $this.titles.penalties.set_text(
			`score_r`,
			// $this.resource_index.score_manager.sides['guest'].score_list.score_stack.size
			self.sides.guest.sum
		)

	}
}




$this.TeamPenaltyPool = class{
	constructor(parent_manager, score_manager, tgt_team, input_data=null){
		const self = this;
		ksys.util.cls_pwnage.remap(self);

		self.parent_manager = parent_manager;
		self.score_manager = score_manager;
		self.tgt_team = tgt_team;
		self.side = tgt_team?.is_enemy ? 'r' : 'l'

		self.dom_data = ksys.tplates.index_tplate(
			'#penalty_pool_template',
			{
				'header': '.pool_header',
				'table':  '.pool_table',
			}
		);

		// Create visual header
		if (self.tgt_team){
			self.dom_data.index.header.append(
				self.tgt_team.vis_header_elem()
			)
		}

		self.ctrl_elems = {};

		// Create control elements
		for (const idx of range(self.parent_manager.pcount)){
			const ctrl_elem = new $this.PenaltyTableEntry(
				self,
				idx,
				input_data?.[str(idx)]
			);
			self.ctrl_elems[idx] = ctrl_elem;
			self.dom_data.index.table.append(ctrl_elem.dom_data.elem);
		}
	}

	to_json(self){
		const data = {};
		for (const penalty_idx in self.ctrl_elems){
			const penalty = self.ctrl_elems[penalty_idx];
			// print('Saving penalty:', penalty)
			data[penalty.idx] = {
				'id_bind': penalty?.associated_record?.id,
				'state': penalty.get_state(),
			}
		}

		return data
	}

	wipe(self){
		for (const pn_idx in self.ctrl_elems){
			self.ctrl_elems[pn_idx].unreg();
		}
	}

	$sum(self){
		let sum = 0;

		for (const penalty_unit of Object.values(self.ctrl_elems)){
			if (penalty_unit.counts){
				sum += 1;
			}
		}

		return sum
	}

}



$this.PenaltyTableEntry = class{
	constructor(parent_pool, penalty_idx, input_data=null){
		const self = this;
		ksys.util.cls_pwnage.remap(self);

		self.parent_pool = parent_pool;
		self.idx = penalty_idx;
		self.side = parent_pool.side;

		// Whether this penalty should count towards
		// the global scores
		self.counts = false;
		// Score record associated with this table entry
		self.associated_record = null;

		self.dom_data = ksys.tplates.index_tplate(
			'#penalty_list_row_template',
			{
				'idx':      '.penalty_idx',
				'cbox_yes': '.penalty_cbox .penalty_yes',
				'cbox_no':  '.penalty_cbox .penalty_no',
			}
		);

		self.dom_data.index.idx.innerText = self.idx + 1;

		self.dom_data.index.cbox_yes.onchange = function(){
			self.dom_data.index.cbox_no.checked = false;
			// self.push_to_vmix(true);
			self.parent_pool.parent_manager.resync_vmix();
			$this.save_penalties();
		}
		self.dom_data.index.cbox_no.onchange = function(){
			self.dom_data.index.cbox_yes.checked = false;
			// self.push_to_vmix(true);
			self.parent_pool.parent_manager.resync_vmix();
			$this.save_penalties();
		}

		if (input_data){
			// todo: this is stupid
			if (input_data.state == 'yes'){
				self.dom_data.index.cbox_yes.checked = true;
			}
			if (input_data.state == 'no'){
				self.dom_data.index.cbox_no.checked = true;
			}
			if (input_data.state != 'no' && input_data.state != 'yes'){
				self.push_to_vmix();
			}
			self.push_to_vmix();
		}
	}

	// Push data to vmix
	push_to_vmix(self, dosave=false){
		const tgt_title = $this.titles.penalties;
		const score_manager = self.parent_pool.score_manager.score_list;
		if (!score_manager){
			console.warn('No score manager exists', score_manager);
			return
		}

		const tgt_idx = (self.parent_pool.parent_manager.pcount - 1) - self.idx;

		// penalties
		// let tgt_icon = Path($this.resources_location.value, 'icons/yellow_card.png');
		let tgt_icon = Path($this.resources_location.value, 'icons/p_neutral.png');

		if (self.dom_data.index.cbox_no.checked){
			tgt_icon = Path($this.resources_location.value, 'icons/p_no.png');
		}

		if (self.dom_data.index.cbox_yes.checked){
			tgt_icon = Path($this.resources_location.value, 'icons/p_yes.png');
		}

		tgt_title.set_img_src(`p_${self.side}_${tgt_idx}`, tgt_icon);

		if (self.dom_data.index.cbox_yes.checked){
			self.counts = true;
		}else{
			self.counts = false;
		}

		// tgt_title.set_text(
		// 	`score_${self.side}`,
		// 	score_manager.score_stack.size
		// )

		if (dosave){
			$this.save_penalties();
		}
	}

	get_state(self){
		if (self.dom_data.index.cbox_yes.checked){
			return 'yes'
		}
		if (self.dom_data.index.cbox_no.checked){
			return 'no'
		}

		return '?'
	}

	// Unreg the penalty, deleting associated scores and so on
	unreg(self){
		if (self.associated_record){
			const score_manager = self.parent_pool.score_manager.score_list;
			score_manager.delete_record(self.associated_record);
		}
	}
}



$this.PersistentHeaderPageManager = class{
	static NPRINT_NAME = 'PersistentHeaderPageManager';

	// Fuck you
	NAV_MAP = Object.freeze({
		0: Object.freeze([
			1, 3, 5, 7, 9,
		]),
		1: Object.freeze([
			2,
		]),
		2: Object.freeze([
			1, 3, 5, 7, 9,
		]),
		3: Object.freeze([
			4,
		]),
		4: Object.freeze([
			1, 5, 7, 9,
		]),
		5: Object.freeze([
			1, 6,
		]),
		6: Object.freeze([
			1, 3, 5, 7, 9,
		]),
		7: Object.freeze([
			8,
		]),
		8: Object.freeze([
			1, 3, 5, 7, 9,
		]),
		9: Object.freeze([
			10,
		]),
		10: Object.freeze([
			1, 3, 5, 7, 9,
		]),
	});

	OWNERSHIP = Object.freeze({
		'clock':  Object.freeze( [2, 4, 6, 8, 10] ),
		'event':  Object.freeze( [1]              ),
		'ballin': Object.freeze( [3]              ),
		'sub_1':  Object.freeze( [5]              ),
		'sub_3':  Object.freeze( [7]              ),
		'empty':  Object.freeze( [9]              ),
	});

	TR_DUR = Object.freeze({
		0:  1500,
		1:  1500,
		2:  1500,
		3:  1500,
		4:  1500,
		5:  1500,
		6:  1500,
		7:  1500 + 5000,
		8:  1500,
		9:  1500,
		10: 1500,
	})

	constructor(){
		const self = ksys.util.cls_pwnage.remap(this);
		ksys.util.nprint(self, '#FF57CA');
		// self._current = ksys.context.module.prm('pheader_nav_current') || 0;
		self._current = 0;
	}

	$current(self){
		return (self._current || 0)
	}

	$$current(self, newval){
		if (!Number.isInteger(newval)){
			self.nprint('Invalid current:', newval);
			return
		}

		self._current = int(newval);
		// ksys.context.module.prm('pheader_nav_current', self._current);
	}

	// Get VMIX project XML and determine current page index from it
	async pull_page_from_vmix(self, apply=true){
		const title_data = await $this.titles.timer.pull_xml();
		if (!title_data){
			return null
		}

		const idx = int(title_data.getAttribute('selectedIndex')) || 0;

		if (apply){
			self.current = idx;
			return self.current;
		}

		return idx || null
	}

	reset(self){
		self.current = 0;
	}

	seek(self, target){
		if (target == 'clock' && self.current == 0){
			self.nprint('Page 0 (clock) to clock switch requested. Ignoring');
			return false
		}

		if ( !target || !(target in self.OWNERSHIP) ){
			self.nprint('Invalid target:', target);
			return false
		}

		// Where to current can transition
		const current_allowance = self.NAV_MAP[self.current];
		const target_ownerships = self.OWNERSHIP[target];

		if (target_ownerships.includes(self.current)){
			self.nprint('Switching to the already displayed item. Aborting');
			return false
		}

		self.nprint(
			'Seeking for', target,
			'Target is on one of:', target_ownerships,
			'Current can switch to:', current_allowance,
		);

		for (const allowed of current_allowance){
			for (const tgt of target_ownerships){
				if (allowed == tgt){
					return tgt;
				}
			}
		}

		return null

		// let found = false;
		// for (const allowed of current_allowance){
		// 	for (const tgt of target_ownerships){
		// 		if (allowed == tgt){
		// 			self.current = tgt;
		// 			await $this.titles.timer.page(tgt, self.TR_DUR[tgt]);
		// 			found = true;
		// 			break
		// 		}
		// 	}
		// 	if (found){
		// 		break
		// 	}
		// }
	}

	async transition(self, target=null){
		for (const attempt of range(3)){
			if (attempt == 0){
				const direct_switch = self.seek(target);
				if (direct_switch === false){return};
				if (direct_switch == null){continue};

				self.nprint('Found switch target on first attempt');
				self.current = direct_switch;
				await $this.titles.timer.page(
					direct_switch,
					self.TR_DUR[direct_switch]
				);

				return
			}

			// Try switching to clock and then to target
			if (attempt == 1){
				const to_clock = self.seek('clock');
				if (to_clock === false){
					self.nprint(
						'Second switch attempt said the title is already at clock',
						'which is impossible. Proceeding to next attempt'
					)
					continue
				}
				if (to_clock == null){continue};


				self.current = to_clock;


				const to_target = self.seek(target);
				if (to_target === false){
					self.nprint(
						'Second switch attempt said that after switching to clock -',
						'the title is already at target page, which is impossible.',
						'Proceeding to next attempt'
					)
					continue
				}
				if (to_target == null){continue};


				self.current = to_target;


				self.nprint('Switching to clock and then target');
				await $this.titles.timer.page(
					to_clock,
					self.TR_DUR[to_clock]
				);
				await $this.titles.timer.page(
					to_target,
					self.TR_DUR[to_target]
				);
				return
			}


			if (attempt == 2){
				self.nprint('Last resort: Switching without considering animations');
				self.current = self.OWNERSHIP[target][0];
				await $this.titles.timer.page(
					self.current,
					self.TR_DUR[self.current]
				);
			}
		}

		// if (!found && !already_seeking){
		// 	self.nprint('No route found. Switching to clock and then to target');
		// 	await self.transition('clock', true);
		// 	await self.transition(target, true);
		// }

		// if (!found && already_seeking){
		// 	self.nprint(
		// 		'Failed to switch back to clock when seeking route.',
		// 		'Resetting to 0 '
		// 	)
		// }
	}
}


$this.PersistentHeader = class{
	static NPRINT_NAME = 'PersistentHeader';

	EVENT_TEXT_FIELDS = Object.freeze([
		// evt = event
		Object.freeze(['evt_header',     'header']),
		Object.freeze(['evt_upper_text', 'upper_text']),
		Object.freeze(['evt_lower_text', 'lower_text']),
	]);

	EVENT_IMAGE_FIELDS = Object.freeze([
		// evt = event
		Object.freeze(['evt_icon',      'icon']),
		Object.freeze(['evt_team_logo', 'team_logo']),
	]);

	constructor(){
		const self = ksys.util.cls_pwnage.remap(this);
		ksys.util.nprint(self, '#5AF9FF');

		self.pages = new $this.PersistentHeaderPageManager();
		self.title = $this.titles.timer;
	}

	async hide_all(self){
		await self.pages.transition('empty');
	}

	async clock(self){
		await self.pages.transition('clock');
	}

	/*
		event_data (dict):
		    text fields:
		    - evt_header
		    - evt_upper_text
		    - evt_lower_text

		    image_fields:
		    - evt_icon
		    - evt_team_logo
	*/
	async event(self, event_data){
		if (!event_data){
			self.nerr('FATAL: Bad event data:', event_data);
			return
		}

		// Set text fields
		for (const field_data of self.EVENT_TEXT_FIELDS){
			const [vmix_id, dict_id] = field_data;

			if (dict_id in event_data){
				await self.title.toggle_text(vmix_id, true);
				await self.title.set_text(vmix_id, event_data[dict_id]);
			}else{
				await self.title.toggle_text(vmix_id, false);
			}
		}

		// Set image fields
		for (const field_data of self.EVENT_IMAGE_FIELDS){
			const [vmix_id, dict_id] = field_data;

			if (dict_id in event_data){
				await self.title.toggle_img(vmix_id, true);
				await self.title.set_img_src(vmix_id, event_data[dict_id]);
			}else{
				await self.title.toggle_img(vmix_id, false);
			}
		}

		await self.pages.transition('event');
	}

	// Fuck it, we ball
	async ballin(self, perc_data){
		// percent left, percent right
		const [p_l, p_r] = perc_data;

		await self.title.set_text('Stat_A', `${p_l}%`);
		await self.title.set_text('Stat_B', `${p_r}%`);
		await self.pages.transition('ballin');
	}

	async subs(self, subs_data){
		if (!subs_data?.players){
			self.nerr('FATAL: Bad substitute data:', subs_data);
			return
		}

		self.nprint('Substitute:', subs_data);

		if (subs_data.players.length == 1){
			// Set team logo
			await self.title.set_img_src('subs1_team_logo', subs_data.team_logo);

			// Set player names
			await self.title.set_text('subs1_leaving0', subs_data.players[0].leaving);
			await self.title.set_text('subs1_inbound0', subs_data.players[0].inbound);

			await self.pages.transition('sub_1');
		}

		if (subs_data.players.length > 1){
			// Set team logo
			await self.title.set_img_src('subs3_team_logo', subs_data.team_logo);

			// Hide all text fields and arrows
			for (const idx of range(3)){
				// text fields
				await self.title.toggle_text(`subs3_leaving${idx}`, false);
				await self.title.toggle_text(`subs3_inbound${idx}`, false);
				// arrow icons
				await self.title.toggle_img(`leaving_icon_${idx}`, false);
				await self.title.toggle_img(`inbound_icon_${idx}`, false);
			}

			// Fill and show fields
			for (const idx of range(3)){
				const player_data = subs_data.players[idx];
				if (!player_data){break};

				// set text in leaving/inbound text fields
				await self.title.set_text(`subs3_leaving${idx}`, player_data.leaving);
				await self.title.set_text(`subs3_inbound${idx}`, player_data.inbound);

				// re-enable leaving/inbound text fields
				await self.title.toggle_text(`subs3_leaving${idx}`, true);
				await self.title.toggle_text(`subs3_inbound${idx}`, true);
				// re-enable arrow icons
				await self.title.toggle_img(`leaving_icon_${idx}`, true);
				await self.title.toggle_img(`inbound_icon_${idx}`, true);
			}

			await self.pages.transition('sub_3');
		}
	}
}



$this.PlayerRoleInstance = class{
	static NPRINT_NAME = 'PlayerRoleInstance';

	constructor(editor, role_data){
		const self = ksys.util.nprint(
			ksys.util.cls_pwnage.remap(this),
			'#FFFB88',
		);

		self.editor = editor;

		// indexed DOM templates reference array
		self.references = {
			'full':  new Set(),
			'short': new Set(),
		}

		// todo: ensure uuid doesn't already exist
		self._role_id = role_data?.role_id || ksys.util.rnd_uuid();
		self._role_name_full = role_data?.role_name_full || '';
		self._role_name_alt = role_data?.role_name_alt || '';
		self._role_name_short = role_data?.role_name_short || '';
		self._priority = role_data?.priority || false;

		self._priority_switch = null;
		self._editor_dom = null;
	}

	litter(self, litter_type){
		for (const rubbish of self.references[litter_type]){
			// self.nprint('Deleting litter:', self.references[litter_type])
			if (!document.body.contains(rubbish.root)){
				self.references[litter_type].delete(rubbish);
			}
		}
	}

	// Update visual feeds
	render_visfeed(self, kind){
		// todo: can this be better?
		for (const dom of self.references.full){
			dom.index.text.textContent = self.role_name_full;
		}
		for (const dom of self.references.short){
			dom.index.text.textContent = self.role_name_short;
		}
	}

	$role_id(self){
		return self._role_id
	}

	$role_name_full(self){
		return self._role_name_full
	}

	$$role_name_full(self, tgt_name){
		self._role_name_full = tgt_name;
		self.render_visfeed();
		self.editor.check_duplicates();
	}

	$role_name_alt(self){
		return self._role_name_alt
	}

	$$role_name_alt(self, tgt_name){
		self._role_name_alt = tgt_name;
		// self.render_visfeed();
		self.editor.check_duplicates();
	}

	$role_name_short(self){
		return self._role_name_short
	}

	$$role_name_short(self, tgt_name){
		self._role_name_short = tgt_name;
		self.render_visfeed();
		self.editor.check_duplicates();
	}

	$priority(self){
		return !!self.priority_switch.selected
	}

	remove(self){
		const home_playerbase = $this.resource_index?.home_club?.playerbase || new Set();
		const guest_playerbase = $this.resource_index?.guest_club?.playerbase || new Set();
		for (const player of home_playerbase.union(guest_playerbase)){
			if (player.role == self){
				player.role = null;
			}
		}

		self.editor.roles.delete(self);
		self._editor_dom.root.remove();
		self.editor.check_duplicates();
		self.render_visfeed();

		// todo: is this really needed?
		// self.editor = null;
	}

	visfeed_full_dom(self){
		self.litter('full');

		const dom = ksys.context.tplates.p_roles.visfeed_full({
			'text': '.player_role_visfeed',
		})

		dom.index.text.textContent = self.role_id;

		self.references.full.add(dom);

		return dom
	}

	visfeed_short_dom(self){
		self.litter('short');

		const dom = ksys.context.tplates.p_roles.visfeed_short({
			'text': '.player_role_visfeed',
		})

		dom.index.text.textContent = self.role_name_short;

		self.references.short.add(dom);

		return dom
	}

	$priority_switch(self){
		if (self._priority_switch){
			return self._priority_switch
		}

		self._priority_switch = new ksys.switches.KBSwitch({
			'multichoice': false,
			'can_be_empty': true,
			'set_default': self._priority,
			'dom_array': [
				{
					'id':  'yes',
					'dom': self.editor_dom.index.priority,
				},
			],
			'callback': function(kbswitch, schema_id){
				self._priority = self._priority_switch.selected;
				self.editor.save();
			}
		});

		return self._priority_switch
	}

	$editor_dom(self){
		if (self._editor_dom){
			return self._editor_dom
		}

		self._editor_dom = ksys.context.tplates.p_roles.role_instance({
			'icon':       '.icon',
			'name_full':  '.name_input.full',
			'name_short': '.name_input.short',
			'name_alt':   '.name_input.altr',
			'priority':   '.priority_cbox_content',
		})

		const dom_idx = self._editor_dom.index;

		self._editor_dom.index.name_full.value = self.role_name_full;
		self._editor_dom.index.name_alt.value = self.role_name_alt;
		self._editor_dom.index.name_short.value = self.role_name_short;

		self.priority_switch.selected = self._priority;

		dom_idx.name_full.onchange = function(){
			self.role_name_full = dom_idx.name_full.value;
			self.editor.save();
		}

		dom_idx.name_alt.onchange = function(){
			self.role_name_alt = dom_idx.name_alt.value;
			self.editor.save();
		}

		dom_idx.name_short.onchange = function(){
			self.role_name_short = dom_idx.name_short.value;
			self.editor.save();
		}

		self._editor_dom.root.oncontextmenu = function(evt){
			if (evt.altKey){
				self.remove()
				self.editor.save();
			}
		}

		return self._editor_dom
	}

	warn(self, state){
		if (state){
			self.editor_dom.index.icon.classList.remove('kbsys_hidden_opacity');
		}else{
			self.editor_dom.index.icon.classList.add('kbsys_hidden_opacity');
		}
	}

	to_dict(self){
		return {
			'role_id':         self.role_id,
			'role_name_full':  self.role_name_full,
			'role_name_alt':   self.role_name_alt,
			'role_name_short': self.role_name_short,
			'priority':        self.priority_switch.selected,
		}
	}
}


$this.PlayerRolesEditor = class{
	static NPRINT_NAME = 'PlayerRolesEditor';

	CFGFILE_NAME = 'player_roles.kbdata';

	constructor(){
		const self = ksys.util.nprint(
			ksys.util.cls_pwnage.remap(this),
			'#FFAE6D',
		);

		self.roles = new Set();

		self.selector_doms = new Set();

		self._editor_dom = null;
	}

	lookup(self, tgt_id){
		for (const role of self.roles){
			if (role.role_id == tgt_id){
				return role
			}
		}
	}

	litter(self){
		for (const selector_data of self.selector_doms){
			const [tgt_player, dom] = selector_data;
			if (!document.body.contains(dom.root)){
				self.selector_doms.delete(selector_data);
			}
		}
	}

	check_duplicates(self){
		self.nprint('Checking duplicates');

		for (const role of self.roles){
			role.warn(false);
		}

		for (const role of self.roles){
			self.nprint('Checking for duplicate', role)
			const duplicates = [];
			for (const dupe_role of self.roles){
				const has_dupes = [
					role.role_name_full.lower() == dupe_role.role_name_full.lower(),
					role.role_name_short.lower() == dupe_role.role_name_short.lower(),
				]
				if (has_dupes.includes(true)){
					duplicates.push(dupe_role)
				}
			}

			if (duplicates.length > 1){
				for (const dupe_role of duplicates){
					dupe_role.warn(true);
				}
			}
		}
	}

	render_selector(self, dom, short_only=false){
		// self.nprint('Redrawing role selector');

		const current_val = dom.index.list.value;

		// todo: remove jquery
		$(dom.index.list).find('option').remove();

		for (const role of self.roles){
			let vis = '?';

			if (short_only){
				vis = role.role_name_short;
			}else{
				vis = `${role.role_name_full.padEnd(17).replaceAll(' ', '&nbsp')} | ${role.role_name_short}`;
			}

			$(dom.index.list).append(`
				<option value="${role.role_id}">${vis}</option>
			`)
		}

		dom.index.list.value = current_val;
	}

	update_selectors(self){
		for (const selector_data of self.selector_doms){
			const [tgt_player, s_dom] = selector_data;
			// self.nprint('Updating', s_dom.root, 'to', tgt_player.role.role_id);
			// s_dom.root.value = tgt_player.role.role_id;
		}
	}

	selector_dom(self, tgt_player, short_only=false){
		// self.litter();

		const dom = ksys.context.tplates.p_roles.role_selector({
			'list': 'select',
		})

		self.selector_doms.add([tgt_player, dom]);

		dom.index.list.onfocus = function(){
			self.render_selector(dom, short_only);
		}

		dom.index.list.onchange = function(){
			tgt_player.role = self.lookup(dom.index.list.value);
			self.update_selectors();
		}

		self.render_selector(dom, short_only);

		return dom
	}

	create(self, data=null, check_duplicates=true){
		if (check_duplicates && data?.role_name_full){
			for (const role of self.roles){
				if (!role.role_name_full){continue};
				if (role.role_name_full.lower().trim() == data.role_name_full){
					return role;
				}
			}
		}
		const role = new $this.PlayerRoleInstance(self, data);
		self.roles.add(role);
		self.editor_dom.index.role_pool.append(role.editor_dom.root);
		return role
	}

	$editor_dom(self){
		if (self._editor_dom){
			return self._editor_dom
		}

		self._editor_dom = ksys.context.tplates.p_roles.role_editor({
			'add_new':   '.editor_btn.create_role',
			'role_pool': '.role_pool',
		})

		self._editor_dom.index.add_new.onclick = function(){
			self.create();
		}

		return self._editor_dom
	}

	save(self){
		const data = [];

		for (const role of self.roles){
			data.push(role.to_dict())
		}

		ksys.db.module.write(
			self.CFGFILE_NAME,
			JSON.stringify(data)
		);

		self.nprint('Saved', data);
	}

	load(self){
		const data = ksys.db.module.read(self.CFGFILE_NAME, 'json') || [];

		for (const role of data){
			self.create(role);
		}

		self.check_duplicates();

		self.nprint('Loaded:', data);
	}
}



$this.PlayerSubstitutes = class{
	constructor(lineup){
		const self = ksys.util.nprint(
			ksys.util.cls_pwnage.remap(this),
			'#FFF5A1',
		);

		self.lineup = lineup;

		self.stack = new Set();

		self._stack_ctrl_dom = null;
	}

	clear_stack(self){
		for (const pair of [...self.stack]){
			self.remove_pair(pair);
		}
	}

	remove_pair(self, pair_data){
		if (!pair_data){
			ksys.info_msg.send_msg(
				`FATAL: Tried removing invalid substitute pair from stack`,
				'err',
				6000
			);
			self.nerr('FATAL:', 'invalid player pair (remove):', players, self);

			return false
		}

		self.stack.delete(pair_data);

		pair_data.dom.root.remove();

		return true
	}

	add_pair(self, players){
		const [leaving, inbound] = players;
		if (!leaving || !inbound){
			ksys.info_msg.send_msg(
				`FATAL: Tried adding invalid players to substitute stack`,
				'err',
				6000
			);
			self.nerr('FATAL:', 'invalid player pair (add):', players, self);

			return false
		}

		if (self.stack.size >= 3){
			ksys.info_msg.send_msg(
				`There are 3 players already`,
				'warn',
				4000
			);

			return false
		}

		const pair_dom = ksys.context.tplates.subs.stack_pair({
			'leaving': '.subs_stack_player.leaving',
			'inbound': '.subs_stack_player.inbound',
		})

		const pair_data = {
			'dom': pair_dom,
			'leaving': leaving,
			'inbound': inbound,
		}

		self.stack.add(pair_data);

		pair_dom.index.leaving.append(leaving.generic_list_elem().root);
		pair_dom.index.inbound.append(inbound.generic_list_elem().root);

		self.stack_ctrl_dom.index.stack_list.append(pair_dom.root);

		pair_dom.root.oncontextmenu = function(evt){
			if (evt.altKey){
				self.remove_pair(pair_data);
			}
		}

		return pair_data
	}

	// Force run single substitute
	async run_title_single(self, players, subs_type='break'){
		const [leaving, inbound] = players;
		if (!leaving || !inbound){
			ksys.info_msg.send_msg(
				`FATAL: Tried using invalid players for single substitute during match`,
				'err',
				6000
			);
			self.nerr('FATAL:', 'invalid player pair (run_single_title):', players, self);

			return false
		}

		if (subs_type == 'match'){
			if ($this.title_schema_switch.selected == 'paged'){
				// Persistent Header can only do one thing at a time
				$this.timeout_persistent_header_btns(
					$this.sequencer.sequences.subs_single_match.sum
				);
				// Persistent header class applies data and switches to the corrent page on its own,
				// BUT it does NOT switch back to clock
				await $this.persistent_header.subs({
					'team_logo': leaving.club.logo_path,
					'players': [{
						'leaving': ksys.strf.params.players.format(leaving.surname),
						'inbound': ksys.strf.params.players.format(inbound.surname),
					}]
				})
				// Hold the title for n seconds
				await ksys.util.sleep($this.sequencer.sequences.subs_single_match.items.hold.dur);
				// Switch back to clock, because this doesn't happen automatically for good reasons
				await $this.persistent_header.clock();
			}else{
				// Set Logo
				await $this.titles.m_subs1.set_img_src(
					'club_logo',
					self.lineup.club.logo_path
				);

				// NAMES - LEAVING
				await $this.titles.m_subs1.set_text(
					`pnum_leaving0`,
					leaving.player_num
				);
				await $this.titles.m_subs1.set_text(
					`pname_leaving0`,
					`${ksys.strf.params.players.format(leaving.surname)}`
				);

				// NAMES - INBOUND
				await $this.titles.m_subs1.set_text(
					`pnum_inbound0`,
					inbound.player_num
				);
				await $this.titles.m_subs1.set_text(
					`pname_inbound0`,
					`${ksys.strf.params.players.format(inbound.surname)}`
				);

				$this.timeout_persistent_header_btns(
					$this.sequencer.sequences.subs_single_match.sum
				)

				// Hide red cards
				await $this.hide_red_cards();

				// Show the title
				await $this.titles.m_subs1.overlay_in();

				// Hold the title for n seconds
				await ksys.util.sleep($this.sequencer.sequences.subs_single_match.items.hold.dur);

				// Hide the title
				await $this.titles.m_subs1.overlay_out();

				// Bring back red cards
				await $this.show_red_cards();
			}
		}

		if (subs_type == 'break'){
			ksys.btns.adv_timeout({
				'exec_replacement_sequence_stack_break_home': $this.sequencer.sequences.subs_stack_break.sum,
				'exec_replacement_sequence_stack_break_guest': $this.sequencer.sequences.subs_stack_break.sum,
				'exec_replacement_sequence_break': $this.sequencer.sequences.subs_single_break.sum,
			})

			// Set Logo
			await $this.titles.subs1.set_img_src(
				'club_logo',
				leaving.club.logo_path
			);

			// NAMES - LEAVING
			await $this.titles.subs1.set_text(
				'pnum_leaving0',
				leaving.player_num
			);
			await $this.titles.subs1.set_text(
				'pname_leaving0',
				`${ksys.strf.params.players.format(leaving.surname)}`
			);

			// NAMES - INBOUND
			await $this.titles.subs1.set_text(
				'pnum_inbound0',
				inbound.player_num
			);
			await $this.titles.subs1.set_text(
				'pname_inbound0',
				`${ksys.strf.params.players.format(inbound.surname)}`
			);

			// Show the title
			await $this.titles.subs1.overlay_in();


			// Hold the title for n seconds
			await ksys.util.sleep($this.sequencer.sequences.subs_single_break.items.hold.dur);
			// Hide the title
			await $this.titles.subs1.overlay_out();
		}
	}

	// Force run as stack
	async run_title_stack(self, subs_type='break'){
		if (self.stack.size <= 0){
			ksys.info_msg.send_msg(
				`Empty stack`,
				'warn',
				3000
			);
			return
		}

		// Persistent header title
		if (subs_type == 'match'){
			if ($this.title_schema_switch.selected == 'paged'){
				// Persistent Header can only do one thing at a time
				$this.timeout_persistent_header_btns(
					$this.sequencer.sequences.subs_stack_match.sum
				);
				// .subs expects ready to use strings
				const players = [];
				for (const pdata of self.stack){
					players.push({
						'leaving': ksys.strf.params.players.format(pdata.leaving.surname),
						'inbound': ksys.strf.params.players.format(pdata.inbound.surname),
					})
				}
				// Persistent header class applies data and switches to the corrent page on its own,
				// BUT it does NOT switch back to clock
				await $this.persistent_header.subs({
					'team_logo': self.stack.at(0)?.leaving?.club?.logo_path,
					'players': players,
				})
				// Hold the title for n seconds
				await ksys.util.sleep($this.sequencer.sequences.subs_stack_match.items.hold.dur);
				// Switch back to clock, because this doesn't happen automatically for good reasons
				await $this.persistent_header.clock();
			}else{
				// important todo: this is fucking retarded
				for (const tile_id of ['m_subs1', 'm_subs2', 'm_subs3']){
					const tgt_title = $this.titles[tile_id];

					// Set Logo
					await tgt_title.set_img_src(
						'club_logo',
						self.lineup.club.logo_path
					);

					const stack = [...self.stack];

					for (const idx of range(3)){
						if (!stack[idx]){continue};
						const leaving = stack[idx].leaving;
						const inbound = stack[idx].inbound;

						// NAMES - LEAVING
						await tgt_title.set_text(
							`pnum_leaving${idx}`,
							leaving.player_num
						);
						await tgt_title.set_text(
							`pname_leaving${idx}`,
							`${ksys.strf.params.players.format(leaving.surname)}`
						);

						// NAMES - INBOUND
						await tgt_title.set_text(
							`pnum_inbound${idx}`,
							inbound.player_num
						);
						await tgt_title.set_text(
							`pname_inbound${idx}`,
							`${ksys.strf.params.players.format(inbound.surname)}`
						);
					}
				}

				// Select the appropriate title
				const tgt_title = $this.titles[`m_subs${self.stack.size}`];

				// Hide red cards
				await $this.hide_red_cards();

				// Show the appropriate title
				await tgt_title.overlay_in();

				// Hold the title for n seconds
				await ksys.util.sleep($this.sequencer.sequences.subs_stack_match.items.hold.dur);

				// Switch page
				await tgt_title.page(1);

				// Hold the page for n seconds
				await ksys.util.sleep($this.sequencer.sequences.subs_stack_match.items.hold.dur);

				// Hide the title
				await tgt_title.overlay_out();

				// Show red cards
				await $this.show_red_cards();
			}

		}

		// Multiple titles during the break
		if (subs_type == 'break'){
			ksys.btns.adv_timeout({
				'exec_replacement_sequence_stack_break_home': $this.sequencer.sequences.subs_stack_break.sum,
				'exec_replacement_sequence_stack_break_guest': $this.sequencer.sequences.subs_stack_break.sum,
				'exec_replacement_sequence_break': $this.sequencer.sequences.subs_single_break.sum,
			})

			// important todo: this is fucking retarded
			for (const tile_id of ['subs1', 'subs2', 'subs3']){
				const tgt_title = $this.titles[tile_id];

				// Set Logo
				await tgt_title.set_img_src(
					'club_logo',
					self.lineup.club.logo_path
				);

				const stack = [...self.stack];

				for (const idx of range(3)){
					if (!stack[idx]){continue};
					const leaving = stack[idx].leaving;
					const inbound = stack[idx].inbound;

					// NAMES - LEAVING
					await tgt_title.set_text(
						`pnum_leaving${idx}`,
						leaving.player_num
					);
					await tgt_title.set_text(
						`pname_leaving${idx}`,
						`${ksys.strf.params.players.format(leaving.surname)}`
					);

					// NAMES - INBOUND
					await tgt_title.set_text(
						`pnum_inbound${idx}`,
						inbound.player_num
					);
					await tgt_title.set_text(
						`pname_inbound${idx}`,
						`${ksys.strf.params.players.format(inbound.surname)}`
					);
				}
			}

			// Select the appropriate title
			const tgt_title = $this.titles[`subs${self.stack.size}`];

			// Show the appropriate title
			await tgt_title.overlay_in();

			// Hold the title for n seconds
			await ksys.util.sleep($this.sequencer.sequences.subs_stack_break.items.hold.dur);

			// Hide the title
			await tgt_title.overlay_out();
		}
	}

	$stack_ctrl_dom(self){
		if (self._stack_ctrl_dom){
			return self._stack_ctrl_dom
		}

		self._stack_ctrl_dom = ksys.context.tplates.subs.stack({
			'clear_stack': '.clear_subs_stack_btn',
			'exec_match':  '[btname="exec_replacement_sequence_stack_match"]',
			'exec_break':  '[btname="exec_replacement_sequence_stack_break"]',
			'stack_list':  '.stack_players',
		})

		const suffix = self.lineup.club.is_enemy ? '_guest' : '_home';

		self._stack_ctrl_dom.index.exec_match.setAttribute(
			'btname',
			self._stack_ctrl_dom.index.exec_match.getAttribute('btname') + suffix
		)
		self._stack_ctrl_dom.index.exec_break.setAttribute(
			'btname',
			self._stack_ctrl_dom.index.exec_break.getAttribute('btname') + suffix
		)

		self._stack_ctrl_dom.index.clear_stack.onclick = function(){
			self.clear_stack();
		}

		self._stack_ctrl_dom.index.exec_match.onclick = function(){
			self.run_title_stack('match');
		}

		self._stack_ctrl_dom.index.exec_break.onclick = function(){
			self.run_title_stack('break');
		}

		return self._stack_ctrl_dom
	}
}


$this.MiscTitle = class{
	static NPRINT_NAME = 'MiscTitle';
	// Field data is:
	//     title_id: ID of this title
	//     dom_list: list of field DOM elements
	//     values: dict of field values (field_name:field_value)
	constructor(field_data){
		const self = ksys.util.nprint(
			ksys.util.cls_pwnage.remap(this),
			'#FFFFFF',
		);

		// self.nprint('Input data:', field_data)

		self.title_id = field_data.title_id;
		self.fields = {};

		for (const field_dom of field_data.dom_list){
			self.bind_field(field_dom, field_data.values);
		}
	}

	bind_field(self, tgt_field, set_data=null){
		const field_id = tgt_field.getAttribute('field_id');
		self.fields[field_id] = tgt_field;
		tgt_field.value = set_data?.[field_id] || '';
		tgt_field.onchange = function(){
			$this.global_save({'misc_titles': true});
		}
	}

	to_dict(self){
		const fields = {};

		for (const field_data of Object.entries(self.fields)){
			const [field_id, field_dom] = field_data;
			fields[field_id] = field_dom.value;
		}

		return fields
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

	// this checks whether the save path input DOM element has at least something in it
	// and wether the club exists at all
	if (!tgt_dir || !$this.resource_index.club_ctrl){
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
		JSON.stringify($this.resource_index.club_ctrl.to_json(), null, '\t')
	)

	// todo: is this the right place for it?
	// see explanation in save_club_to_local_db about why is it here
	$this.global_save(null)
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
	$this.global_save(null)
}


// get club json by name without any further actions
$this.get_club_info_by_name = function(clubname=null){
	if (!clubname){return};

	const club_name = clubname.lower();
	const club_info = ksys.db.module.read(`clubs/${club_name}.clubdef`, 'json');
	if (!club_info){return};

	return club_info
}

// Load existing club into the control panel, this does NOT create a lineup
// This is only needed for EDITING the club
$this.load_club_by_name = function(clubname=null){
	if (!clubname){return};

	const existing_home = $this.resource_index.home_club;
	const existing_guest = $this.resource_index.guest_club;

	if (clubname.lower() == existing_home?.club_name.lower()){
		// todo: is this the right place for this ?
		$this.save_club_to_local_db()

		existing_home.open_panel()
		return
	}
	if (clubname.lower() == existing_guest?.club_name.lower()){
		// todo: is this the right place for this ?
		$this.save_club_to_local_db()

		existing_guest.open_panel()
		return
	}
	$this.create_new_club($this.get_club_info_by_name(clubname))
}



// Create lineup from club name. This will forward club info the rest of the controller
// (add visual header cues and so on)
// This is triggered when:
//     - A club is selected from the Home/Guest club dropdown in Config/Lists
//     - Club being loaded from previous controller state
$this.create_club_lineup = function(side, clubname, input_lineup_info=null){
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

	if (clubname.lower() == $this.resource_index.side[side == 'home' ? 'guest' : 'home']?.club?.club_name?.lower?.()){
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
	if ($this.resource_index.club_ctrl?.club_name?.lower?.() == clubname.lower()){
		// if so - get the Club class reference from the resource index
		club = $this.resource_index.club_ctrl;
		// and update the is_enemy flag
		$this.resource_index.club_ctrl.is_enemy = (side == 'guest');

	}else{
		// if not - create new Club class,
		// because a lineup cannot exist without a club
		// Lineup class is always a parent of a Club class
		club = new $this.FootballClub(
			$this.get_club_info_by_name(clubname),
			side == 'guest'
		);
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
		// ($this.resource_index.home_lineup ? $this.resource_index.home_lineup.main_players : []),
		// ($this.resource_index.home_lineup ? $this.resource_index.home_lineup.reserve_players : []),

		// ($this.resource_index.guest_lineup ? $this.resource_index.guest_lineup.main_players : []),
		// ($this.resource_index.guest_lineup ? $this.resource_index.guest_lineup.reserve_players : []),

		($this.resource_index?.home_lineup?.main_players || []),
		($this.resource_index?.home_lineup?.reserve_players || []),

		($this.resource_index?.guest_lineup?.main_players || []),
		($this.resource_index?.guest_lineup?.reserve_players || []),
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
	$this.resource_index.card_manager.resync()

	// resync penalty manager
	$this.resource_index.penalty_manager.resync();

	// resync substitutes
	document.querySelector(`#replacement_teams .replacement_team[${side}] .subs_stack`)?.remove?.();
	document.querySelector(`#replacement_teams .replacement_team[${side}]`).append(
		lineup.subs.stack_ctrl_dom.root
	)

	// resync old system stats headers
	// todo: finally make old stat system use new stuff
	{
		if ($this.resource_index.side.home.club){
			$('#team_stats_theader_home').html($this.resource_index.side.home.club.vis_header_elem());
			$('#team_stats_btn_ctrl_home').html($this.resource_index.side.home.club.vis_header_elem());
			$('#replacement_team1 .replacement_team_head').html($this.resource_index.side.home.club.vis_header_elem());
		}
		if ($this.resource_index.side.guest.club){
			$('#team_stats_theader_guest').html($this.resource_index.side.guest.club.vis_header_elem());
			$('#team_stats_btn_ctrl_guest').html($this.resource_index.side.guest.club.vis_header_elem());
			$('#replacement_team2 .replacement_team_head').html($this.resource_index.side.guest.club.vis_header_elem());
		}		
	}

	ksys.btns.resync();
}


// forward team colours to vmix timer + score title
$this.update_team_colors = async function(){
	const home = $this.resource_index.home_lineup;
	const guest = $this.resource_index.guest_lineup;

	if (home){
		if ($this.timer_team_color_schema_switch.selected == 'bitmap'){
			vmix.util.HTTPResourceProxy.reg_buf([
				'timer_tshirt_color_home',
				await home.shorts_colpick.baked,
			]);
			// tshirt home
			await $this.titles.timer.set_img_src(
				'tshirt_color_l',
				'timer_tshirt_color_home'
			)
			// Final scores shape tshirt colour
			await $this.titles.final_scores.set_shape_color(
				'tshirt_color_l',
				home.tshirt_colpick.color
			)
		}else{
			// tshirt home
			await $this.titles.timer.set_shape_color(
				'tshirt_color_l',
				home.shorts_colpick.color
			)
			// Final scores shape tshirt colour
			await $this.titles.final_scores.set_shape_color(
				'tshirt_color_l',
				home.tshirt_colpick.color
			)
		}
	}

	if (guest){
		if ($this.timer_team_color_schema_switch.selected == 'bitmap'){
			vmix.util.HTTPResourceProxy.reg_buf([
				'timer_tshirt_color_guest',
				await guest.shorts_colpick.baked,
			]);
			// tshirt guest
			await $this.titles.timer.set_img_src(
				'tshirt_color_r',
				'timer_tshirt_color_guest'
			)
			await $this.titles.final_scores.set_shape_color(
				'tshirt_color_r',
				guest.tshirt_colpick.color
			)
		}else{
			// tshirt guest
			await $this.titles.timer.set_shape_color(
				'tshirt_color_r',
				guest.shorts_colpick.color
			)
			await $this.titles.final_scores.set_shape_color(
				'tshirt_color_r',
				guest.tshirt_colpick.color
			)
		}

		// shorts guest
		// await $this.titles.timer.set_img_src(
		// 	'team_col_r_bot',
		// 	base_path.join(`r_bot_${guest.colors.shorts}.png`),
		// )
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

$this.forward_field_layout_to_vmix = async function(team){
	const tgt_side = str(team).lower();
	const tgt_field = $this.resource_index.side?.[tgt_side]?.field;
	const suffix = $this.resource_index.side?.[tgt_side]?.club?.is_enemy ? 'guest' : 'home';

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
	const title = $this.titles.team_layout;

	// important todo: this implies proxy is always active
	vmix.util.HTTPResourceProxy.reg_buf([
		`tshirt_color_${suffix}`,
		await tgt_field.lineup.tshirt_colpick.baked,
	]);
	vmix.util.HTTPResourceProxy.reg_buf([
		`gk_color_${suffix}`,
		await tgt_field.lineup.gk_colpick.baked,
	]);

	// -------------------
	// player cells on field
	// -------------------
	for (const cell of tgt_field.iter_cells()){
		// tshirt colour
		await title.set_img_src(`plr_bg_${cell.id}`, `tshirt_color_${suffix}`);
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
			await title.set_text(`plr_name_${cell.id}`, ksys.strf.params.players.format(cell.player.surname));
		}

		// Set text colour
		await title.set_text_color(
			`plr_num_${cell.id}`,
			(tgt_field.lineup.tshirt_colpick.text_color == 'white') ? 'ffffff' : '000000'
		);
	}

	// roster
	await title.set_text(
		'roster',
		$this.resource_index.side?.[tgt_side]?.lineup?.roster || ''
	)


	// goalkeeper tshirt colour
	await title.set_img_src(`plr_bg_8_5`, `gk_color_${suffix}`)

	await title.set_text_color(
		`plr_num_8_5`,
		(tgt_field.lineup.gk_colpick.text_color == 'white') ? 'ffffff' : '000000'
	);


	// -------------------
	// player slots in lineup
	// -------------------
	if ($this.cmd_layout_mains_schema_switch.selected == 'dedicated'){
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
				const player_surname = ksys.strf.params.players.format(player?.surname || '')

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
	}

	if ($this.cmd_layout_mains_schema_switch.selected == 'shared'){
		// important todo: this is shit
		const mains_list_nums = [];
		const mains_list_names = [];
		for (const player_idx of range(11)){
			const player = tgt_field.lineup.main_players.at(player_idx);
			if (player){
				mains_list_nums.push(player.player_num);
				mains_list_names.push(
					ksys.strf.params.players.format(player.surname)
				);
			}
		}

		await title.set_text(
			'main_nums',
			mains_list_nums.join('\n')
		)
		await title.set_text(
			'main_names',
			mains_list_names.join('\n')
		)
	}


	if ($this.cmd_layout_reserves_schema_switch.selected == 'shared'){
		// important todo: this is shit
		const reserve_list_nums = [];
		const reserve_list_names = [];
		for (const player_idx of range(11)){
			const player = tgt_field.lineup.reserve_players.at(player_idx);
			if (player){
				reserve_list_nums.push(player.player_num);
				reserve_list_names.push(player.surname);
			}
		}

		await title.set_text(
			'sub_nums',
			reserve_list_nums.join('\n')
		)
		await title.set_text(
			'sub_names',
			reserve_list_names.join('\n')
		)
	}



	// -------------------
	// Misc.
	// -------------------

	// Coach
	await title.set_text(
		'coach_name',
		ksys.strf.params.coach.format(tgt_field.lineup.club.main_coach)
	)
	// Coach title
	await title.set_text(
		'coach_title',
		ksys.strf.params.coach.format(tgt_field.lineup.club.main_coach_title_short + ':')
	)
	// Club name
	await title.set_text(
		'club_name',
		ksys.strf.params.club_name.format(tgt_field.lineup.club.club_name)
	)
	// Club logo
	await title.set_img_src('club_logo', tgt_field.lineup.club.logo_path)
	print('Finished forwarding layout data to VMIX')

	await ksys.util.sleep(1000);

	// Enable buttons responsible for showing the team's layout which was just prepared
	{
		ksys.btns.pool[`show_${tgt_side}_field_layout`].toggle(true)
		ksys.btns.pool[`hide_${tgt_side}_field_layout`].toggle(true)

		// do these two in batch
		ksys.btns.pool[`prepare_home_team_layout`].toggle(true)
		ksys.btns.pool[`prepare_guest_team_layout`].toggle(true)
	}
}


$this.show_field_layout = async function(team){
	ksys.btns.pool[`show_${team}_field_layout`].toggle(false)

	await $this.titles.team_layout.overlay_in()

	await ksys.util.sleep($this.sequencer.sequences.field_layout.items.hold_main.dur);

	await $this.titles.team_layout.page(1);

	ksys.btns.pool[`show_${team}_field_layout`].toggle(true)
}

$this.hide_field_layout = async function(){
	ksys.btns.toggle({
		'hide_home_field_layout':    false,
		'hide_guest_field_layout':   false,
	})
	await $this.titles.team_layout.overlay_out()
	ksys.btns.toggle({
		'hide_home_field_layout':    true,
		'hide_guest_field_layout':   true,
	})
}

$this._show_field_layout_condensed = async function(team){
	const tgt_side = str(team).lower();
	const tgt_lineup = $this.resource_index.side?.[tgt_side]?.lineup;
	const role_gropus = {};

	// Group players by roles
	for (const player of tgt_lineup.main_players){
		const role_id = player?.role?.role_id;
		if (!role_id){continue};
		if (!(role_id in role_gropus)){
			// Set for extra safety
			role_gropus[role_id] = new Set();
		}

		role_gropus[role_id].add(player);
	}

	// todo: hardcoded title setup
	const grp_array = Object.entries(role_gropus).slice(0, 3);
	const grp_amount = grp_array.length;

	// Disable all groups
	for (const grp_idx of range(3)){
		for (const x_idx of range(3)){
			for (const p_idx of range(4)){
				for (const nn of ['num', 'name']){
					await $this.titles.lineup_condensed.toggle_text(
						`c${grp_idx}_x${x_idx}_${nn}_${p_idx}`,
						false
					)
				}
			}
		}
	}

	// Enable and apply data
	for (const grp_idx of range(grp_amount)){
		const [role_id, plist] = grp_array[grp_idx];

		// Determine required X
		const x_idx = grp_array[grp_idx].size - 1;

		// Apply group label
		await $this.titles.lineup_condensed.set_text(
			`c${grp_idx}_label`,
			$this.role_editor.lookup(role_id).role_name_full || ''
		)

		// Player data
		let p_idx = 0;
		for (const p_data of grp_array[grp_idx]){
			for (const nn of ['num', 'name']){
				// Apply data
				await $this.titles.lineup_condensed.set_text(
					`c${grp_idx}_x${x_idx}_${nn}_${p_idx}`,
					ksys.strf.params.players.format(p_data.surname)
				)
				// Show fields
				await $this.titles.lineup_condensed.toggle_text(
					`c${grp_idx}_x${x_idx}_${nn}_${p_idx}`,
					true
				)
			}

			p_idx += 1;
		}
	}

	// Goalkeeper
	const gk_data = $this.resource_index.side?.[tgt_side]?.field?.goalkeeper;
	for (const nn of ['num', 'name']){
		// GK Num
		await $this.titles.lineup_condensed.set_text(
			'gk_num',
			gk_data?.player_num || ''
		)
		// GK Name
		await $this.titles.lineup_condensed.set_text(
			'gk_name',
			ksys.strf.params.players.format(gk_data?.surname || '')
		)
	}

	// Show title
	await $this.titles.lineup_condensed.overlay_in();

	// Hold goalkeeper
	

	// Go through categories
	for (const grp_idx of range(grp_amount)){
		await ksys.util.sleep($this.sequencer.sequences.lineup_condensed.items.hold_page.dur);
		await $this.titles.lineup_condensed.page(grp_idx + 1);
	}

	for (const grp_data of grp_array){
		const [role_id, plist] = grp_data;
		for (const player of plist){
			print($this.role_editor.lookup(role_id).role_name_full, ':', player.surname);
		}
	}

}

$this.show_field_layout_condensed = async function(team){
	const max_per_page = 3;
	const tgt_side = str(team).lower();
	const tgt_lineup = $this.resource_index.side?.[tgt_side]?.lineup;
	const role_gropus = {};

	// Group players by roles
	for (const player of tgt_lineup.main_players){
		const role_id = player?.role?.role_id;
		if (!role_id){continue};
		if (!(role_id in role_gropus)){
			// Set for extra safety
			role_gropus[role_id] = new Set();
		}

		role_gropus[role_id].add(player);
	}
	print('Condensed data:', role_gropus);

	// Sort groups by their priority
	// Because having a special page is stupid
	// Everything must be a regular page, shown in the required order
	const role_groups_sorted = [];

	for (const grp_data of Object.entries(role_gropus)){
		const [role_id, plr_set] = grp_data;
		const role_data = $this.role_editor.lookup(role_id);

		if (role_data.priority){
			role_groups_sorted.unshift([role_id, plr_set]);
		}else{
			role_groups_sorted.push([role_id, plr_set]);
		}
	}


	// todo: What if a crisis happens before this function finishes?
	await $this.titles.lineup_condensed.resume_render();

	await $this.titles.lineup_condensed.set_text(
		'roster',
		tgt_lineup.roster || ''
	)

	await $this.titles.lineup_condensed.set_text(
		'club_name',
		tgt_lineup.club.club_name || ''
	)

	// todo: this is stupid
	let title_shown = false;

	let last_role_grp = null;

	// Go through every group
	for (const grp_data of role_groups_sorted){
		const [role_id, plr_set] = grp_data;
		const plr_array = Array.from(plr_set);

		// Sort the group, so that the largest names are in the end
		// And therefore have a much bigger chance of appearing on a 2x page
		plr_array.sort(function(a, b){
			return (b.surname.length - a.surname.length)
		})

		while (plr_array.length){

			// Create a page
			const page_data = [];
			while (plr_array.length && (page_data.length < max_per_page)){
				const player = plr_array.pop();
				page_data.push([
					// Player Number
					player.player_num,
					// Player Name
					ksys.strf.params.players.format(player.surname),
				])
			}

			// Pause title renering (multiple updates incoming)
			//     There's some evidence to suggest that no render pausing is needed
			//     while the title is not on screen.
			//     Furthermore:
			//         Not on screen: Pause -> Apply Data -> Resume -> Show
			//         Apparently breakes shit.
			//     Long story short: Pause must only happen when the title is already on screen.
			if (title_shown){
				await $this.titles.lineup_condensed.pause_render();
			}

			// Wipe all fields
			for (const xcom of range(max_per_page)){
				for (const p_idx of range(max_per_page)){
					for (const nn of ['num', 'name']){
						await $this.titles.lineup_condensed.set_text(
							`c0_x${xcom+1}_${nn}_${p_idx}`,
							''
						)
					}
				}
			}

			const current_role_grp = ($this.role_editor.lookup(role_id).role_name_alt || '').upper() + ':';

			if (last_role_grp != current_role_grp){
				// Whipe role label to ensure the animation plays
				await $this.titles.lineup_condensed.set_text(
					'c0_label',
					''
				)

				// Re-apply role data to ensure the animation plays
				await $this.titles.lineup_condensed.set_text(
					'c0_label',
					// todo: + ':' assumes role name exists
					($this.role_editor.lookup(role_id).role_name_alt || '').upper() + ':'
				)
			}

			last_role_grp = current_role_grp;

			print('GRP LABEL:', ($this.role_editor.lookup(role_id).role_name_alt || '') + ':')

			// Determine XCOM
			const xcom = page_data.length;

			// Apply player data to corresponding fields
			for (const plr_idx of range(page_data.length)){
				[pnum, pname] = page_data[plr_idx];
				print('XCOM', xcom, ':', pnum, pname)
				await $this.titles.lineup_condensed.set_text(
					`c0_x${xcom}_num_${plr_idx}`,
					pnum
				)
				await $this.titles.lineup_condensed.set_text(
					`c0_x${xcom}_name_${plr_idx}`,
					pname
				)
			}

			// Resume render
			// Should play "page" animation
			await $this.titles.lineup_condensed.resume_render();

			if (!title_shown){
				title_shown = true;
				print('Showing condensed title');
				await $this.titles.lineup_condensed.overlay_in();
				await ksys.util.sleep(
					$this.sequencer.sequences.lineup_condensed.items.anim_in.dur
				);
			}

			print('Holding condensed title page');

			// Hold the page for n seconds
			await ksys.util.sleep(
				$this.sequencer.sequences.lineup_condensed.items.hold_page.dur
			);
		}
	}

	// await ksys.util.sleep(
	// 	$this.sequencer.sequences.lineup_condensed.items.hold_page.dur
	// );

	await $this.titles.lineup_condensed.overlay_out();
	await ksys.util.sleep(
		$this.sequencer.sequences.lineup_condensed.items.anim_out.dur
	);
	print('Done condensed title');
}




$this.hide_field_layout_condensed = async function(team){
	await $this.titles.lineup_condensed.overlay_out();
}

$this.update_title_schema = function(schema_id){
	ksys.context.module.prm('title_schema', schema_id);
}

$this.timeout_persistent_header_btns = function(dur){
	ksys.btns.adv_timeout({
		'yellow_card':     dur,
		'red_card':        dur,
		'scored':          dur,
		'kill_card':       dur,
		'scored_off':      dur,
		'show_main_timer': dur,
		'hide_main_timer': dur,
		'exec_replacement_sequence_stack_match': dur,
		'exec_replacement_sequence_match': dur,
	})
}



// ================================
//        Misc. Titles
// ================================
$this.show_misc_title = async function(tgt_title){
	if (tgt_title == 'tape'){
		const tape_words = [];
		for (const word of $this.misc_titles.tape.fields.tape.value.split('\n')){
			tape_words.push(word.trim());
		}
		await $this.titles.tape.set_text(
			'text',
			tape_words.join(' ')
		)
		await $this.titles.tape.overlay_in();
	}
	if (tgt_title == 'commenter'){
		const name_1 = $this.misc_titles.commenter.fields.commenter_name_1.value.trim();
		const name_2 = $this.misc_titles.commenter.fields.commenter_name_2.value.trim();

		// 2 girls 1 cup
		await $this.titles.commenter.set_text(
			'name',
			name_1
		)
		await $this.titles.commenter.set_text(
			'name2',
			name_2
		)

		// 2 girls 2 cups
		await $this.titles.commenter_x2.set_text(
			'name',
			name_1
		)
		await $this.titles.commenter_x2.set_text(
			'name2',
			name_2
		)

		// Show appropriate title
		if ($this.commenter_schema_switch.selected == '2girls2cups'){
			if (name_1 && name_2){
				await $this.titles.commenter_x2.overlay_in();
			}else{
				await $this.titles.commenter.overlay_in();
			}
		}else{
			await $this.titles.commenter.overlay_in();
		}
	}
	if (tgt_title == 'info_1'){
		await $this.titles.info_1.set_text(
			'text',
			$this.misc_titles.info_1.fields.info_1.value
		)
		await $this.titles.info_1.overlay_in();
	}
	if (tgt_title == 'info_2'){
		await $this.titles.info_2.set_text(
			'text_upper',
			$this.misc_titles.info_2.fields.info_2_upper.value
		)
		await $this.titles.info_2.set_text(
			'text_lower',
			$this.misc_titles.info_2.fields.info_2_lower.value
		)
		await $this.titles.info_2.overlay_in();
	}
	if (tgt_title == 'referee'){
		for (const idx of range(1, 5)){
			await $this.titles.referee.set_text(
				`name_${idx}`,
				$this.misc_titles.referee.fields[`referee_${idx}_upper`].value.upper()
			)
			await $this.titles.referee.set_text(
				`title_${idx}`,
				$this.misc_titles.referee.fields[`referee_${idx}_lower`].value.upper()
			)
		}
		await $this.titles.referee.overlay_in();
	}
	if (tgt_title == 'water_time'){
		await $this.titles.water_time.set_text(
			'lower_text',
			$this.misc_titles.water_time.fields.water_time_lower_text.value
		)
		await $this.titles.water_time.overlay_in();
	}
}

$this.hide_misc_title = async function(tgt_title){
	for (const t_id of (Array.isArray(tgt_title) ? tgt_title : [tgt_title])){
		await $this.titles[t_id].overlay_out();
	}
}

$this.set_referee_to_default = function(){
	const titles = [
		'ГОЛОВНИЙ АРБІТР',
		'ПОМІЧНИК АРБІТРА',
		'ПОМІЧНИК АРБІТРА',
		'РЕЗЕРВНИЙ АРБІТР',
	]

	for (const idx of range(4)){
		$this.misc_titles.referee.fields[`referee_${idx+1}_lower`].value = titles[idx];
	}

	$this.global_save({'misc_titles': true});
}








// ================================
//        VS stuff
// ================================
$this.save_vs_sublines = function(){
	ksys.context.module.prm('vs_title_bottom_upper_line', $('#vs_text_bottom_upper')[0].value, false);
	ksys.context.module.prm('vs_title_bottom_lower_line', $('#vs_text_bottom_lower')[0].value, false);
	ksys.context.module.prm('vs_title_main_header_line', $('#vs_text_main_header')[0].value);
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

	// Set main header
	await $this.titles.splash.set_text('title_upper', $('#vs_text_main_header').val())

	// Set logos
	await $this.titles.splash.set_img_src(
		'logo_l',
		$this.resource_index?.home_club?.logo_path || ''
	)
	await $this.titles.splash.set_img_src(
		'logo_r',
		$this.resource_index?.guest_club?.logo_path || ''
	)

	// Set team colours
	await $this.titles.splash.set_shape_color(
		'team_color_l',
		$this.resource_index.side.home?.lineup?.tshirt_colpick?.color
	)
	await $this.titles.splash.set_shape_color(
		'team_color_r',
		$this.resource_index.side.guest?.lineup?.tshirt_colpick?.color
	)

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
	await $this.titles.splash.overlay_in()

	// unlock the button
	ksys.btns.pool.show_splash.toggle(true)
}

$this.hide_vs_title = async function(){
	ksys.btns.pool.show_splash.toggle(false)
	await $this.titles.splash.overlay_out()
	ksys.btns.pool.show_splash.toggle(true)
}





// ================================
//        Coach stuff
// ================================
$this.show_coach = async function(side){

	const tgt_club = $this.resource_index.side?.[str(side).lower()]?.club;

	if (!tgt_club){
		ksys.info_msg.send_msg('No club selected', 'err', 5000);
		return
	}

	ksys.btns.toggle({
		'show_coach_home_team': false,
		'show_coach_guest_team': false,
	})

	await $this.titles.coach.set_text(
		'name',
		ksys.strf.params.coach.format(tgt_club.main_coach)
	)
	await $this.titles.coach.set_text(
		'title',
		ksys.strf.params.coach.format(tgt_club.main_coach_title_long)
	)
	await $this.titles.coach.set_img_src(
		'club_logo',
		tgt_club.logo_path
	)
	await $this.titles.coach.overlay_in()

	ksys.btns.toggle({
		'show_coach_home_team': true,
		'hide_coach_home_team': true,
		'show_coach_guest_team': true,
		'hide_coach_guest_team': true,
	})
}

$this.hide_coach = async function(){
	await $this.titles.coach.overlay_out()
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
			`hand_card received an invalid card type: ${card_type}`,
			card_type
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
			sel_entry.player,
		)
	}

	if (card_type == 'red'){
		await card_manager.hand_red(
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
		sel_entry.player,
	)
}

$this.hide_card = async function(){
	await vmix.talker.overlay_out(2)
}



// ================================
//        Substitute
// ================================
$this.substitute_player_pair = function(){
	// todo: is this stupid ?
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
		return [null, null]
	}

	return [leaving_player, incoming_player]
}

// SINGLE
$this.exec_substitute = async function(subs_type){
	const [leaving_player, incoming_player] = $this.substitute_player_pair();
	if (!leaving_player || !incoming_player){
		return
	}

	let stack;

	if (leaving_player.club.is_enemy){
		stack = $this.resource_index.guest_lineup.subs;
	}else{
		stack = $this.resource_index.home_lineup.subs;
	}

	await stack.run_title_single(
		[leaving_player, incoming_player],
		subs_type
	)
}



$this.stack_substitute = function(){
	const [leaving_player, incoming_player] = $this.substitute_player_pair();
	if (!leaving_player || !incoming_player){
		return
	}

	let stack;

	if (leaving_player.club.is_enemy){
		stack = $this.resource_index.guest_lineup.subs;
	}else{
		stack = $this.resource_index.home_lineup.subs;
	}

	stack.add_pair([leaving_player, incoming_player])
}












// ================================
//             Timers
// ================================


// ----------------
//      Shared
// ----------------
$this.update_extra_time_amount = async function(){
	const amount = $('#timer_ctrl_additional input').val().trim();
	await $this.titles.timer.set_text(
		'time_added',
		amount ? `+${amount}` : '',
	)
}

// Built-in / AT-AT switch
// todo: some CSS styling,
// such as hiding status indicator when the featureset is builtin
$this.update_selected_timer_system = async function(_, tgt_sys, event){
	if (!tgt_sys){
		ksys.info_msg.send_msg(
			`Fatal: tried changing timer feature set to ${tgt_sys}, but can only change to [builtin, at_at]`,
			'err',
			11000
		);
		return
	}
	print('Changing timer system to', tgt_sys);
	ksys.context.module.prm('timer_sys', $this.resource_index.timer_sys_switch.selected);

	// First, kill AT-AT watcher
	await $this.stop_atat_service();

	// Then, kill all timers

	// AT-AT Base
	await $this.timer_fset.at_at?.base_counter?.terminate?.();
	// await $this.timer_fset.at_at.base_counter.terminate();
	$this.timer_fset.at_at.base_counter = null;
	// AT-AT Extra
	await $this.timer_fset.at_at?.extra_counter?.terminate?.();
	$this.timer_fset.at_at.extra_counter = null;

	// Builtin Base
	$this?.base_counter?.force_kill?.();
	$this.base_counter = null;
	// Builtin Extra
	$this?.extra_counter?.force_kill?.();
	$this.extra_counter = null;

	// Restart AT-AT system
	// await ksys.ticker.kb_at.sys_restart();

	// Set feature set reference
	$this.timer_ctrl = $this.timer_fset[tgt_sys];

	if (tgt_sys == 'at_at'){
		// Restart the watchdog, because reasons
		// todo: what reasons?
		$this.restart_atat_service();

		// todo: is the commented garbage below still needed ?

		// The kickboxer was created with an idea in mind,
		// that it's possible to toggle between controllers/modules
		// without loosing any data.
		// So, if the timer exists already - use it.
		// if ($this.timer_fset.at_at.base_counter){

		// }

		$this.toggle_atat_status_indicator(true);
	}

	if (tgt_sys == 'builtin'){
		// It's important to completely get rid of the AT-AT
		// When switching to the built-in system
		$this.stop_atat_service();

		$this.timer_fset.at_at.base_counter = null;

		$this.toggle_atat_status_indicator(false);

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
$this._get_current_time = function(minutes=false, tsum=false){
	const divider = (minutes ? 60 : 1);

	if (tsum){
		const calc_sum = 
		Math.ceil(
			(
				($this?.base_counter?.tick?.global || 1)
				+
				($this?.extra_counter?.tick?.global || 1)
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
		let extra_t = $this?.extra_counter?.tick?.global;
		if ($this?.extra_counter?.tick?.global === 0) {
			extra_t = 1;
		}

		let base_t = Math.ceil(
			($this?.base_counter?.tick?.global || 1) / divider
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
$this.get_current_time = function(minutes=false, tsum=false){
	const divider = (minutes ? 60 : 1);
	const dur = $this.round_duration;

	if (tsum){
		const calc_sum = 
		Math.ceil(
			(
				(
					(
						($this.ticker_time.base.minutes * 60) +
						($this.ticker_time.base.seconds)
					)
					|| 0
				)
				+
				(
					(
						($this.ticker_time.extra.minutes * 60) +
						($this.ticker_time.extra.seconds)
					)
					|| 0
				)
			)
			/
			divider
		)
	}else{
		// important todo: is this retarded ?
		const extra_t = (
			($this.ticker_time.extra.minutes * 60) +
			($this.ticker_time.extra.seconds)
		)

		let base_t =
		Math.ceil(
			(
				($this.ticker_time.base.minutes * 60) +
				($this.ticker_time.base.seconds || 0)
			)
			/
			divider
		)

		return {
			'base': base_t,
			'extra': Math.ceil(
				(extra_t || 0) / divider
			),
		}
	}
}

$this.main_timer_vis = async function(state){
	const title = $this.titles.timer;

	// await $this.update_team_colors();

	if (state == true){
		if (!$this.resource_index?.side?.home?.club || !$this.resource_index?.side?.guest?.club){
			ksys.info_msg.send_msg(
				`This action requires both clubs to be present`,
				'warn',
				3000
			);
			return
		}

		if ( ($this.ticker_time.extra.minutes <= 0) && ($this.ticker_time.extra.seconds <= 0) ){
			await $this.extra_time_vis(false);
		}

		// todo: hardcoded pages
		await $this.titles.timer.page(2);

		await $this.resource_index.card_manager.redraw_counters();

		// Update team colours
		await $this.update_team_colors()

		await title.set_text(
			'command_l',
			str($this.resource_index.side.home.club.club_name_shorthand).upper()
		)
		await title.set_text(
			'command_r',
			str($this.resource_index.side.guest.club.club_name_shorthand).upper()
		)

		// push current score to the title
		$this.resource_index.score_manager.resync_score_on_title()

		title.overlay_in()
	}
	if (state == false){
		title.overlay_out()
	}
}

$this.extra_time_vis = async function(state){
	// await $this.titles.timer.resume_render();
	// await $this.titles.timer.pause_render();
	if (state == true){
		// await $this.titles.timer.set_shape_color('main_time_bg', 'D80D8300');
		// await $this.titles.timer.toggle_text('time_added', true);
		// await $this.titles.timer.toggle_text('extra_ticker', true);
		// await $this.titles.timer.toggle_img('extra_time_bg', true);

		await $this.titles.timer.toggle_img('main_time_bg', false);
		await $this.titles.timer.toggle_text('base_ticker', false);

		await $this.titles.timer.toggle_text('time_added', true);
		await $this.titles.timer.toggle_text('extra_ticker', true);
		await $this.titles.timer.toggle_img('extra_time_bg', true);
		
	}
	if (state == false){
		await $this.titles.timer.toggle_text('base_ticker', true);
		await $this.titles.timer.toggle_img('main_time_bg', true);

		await $this.titles.timer.toggle_text('time_added', false);
		await $this.titles.timer.toggle_text('extra_ticker', false);
		await $this.titles.timer.toggle_img('extra_time_bg', false);
	}
	// await $this.titles.timer.resume_render();
}

$this.zero_timer_time = function(){
	$this.ticker_time.base.minutes = 0;
	$this.ticker_time.base.seconds = 0;

	$this.ticker_time.extra.minutes = 0;
	$this.ticker_time.extra.seconds = 0;
}

$this.show_red_cards = async function(){
	await $this.titles.timer.page(2);
}
$this.hide_red_cards = async function(){
	await $this.titles.timer.page(1);
}



// ----------------
//      AT-AT
// ----------------

// 
// Status watcher stuff
// 
$this.update_atat_status = function(status){
	const status_dom = document.querySelector('#ticker_service_status');

	if (status.ok){
		status_dom.classList.remove('ticker_status_fatal_fail');
		status_dom.classList.add('ticker_status_good');
		if (!$this.at_at.btns_enable_lock){
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

$this.update_atat_port = function(evt){
	if (!evt.altKey){return};

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

	$this.restart_atat_service();
}

$this.update_atat_return_addr = function(evt){
	if (!evt.altKey){return};

	const octets = document.querySelector('#atat_return_addr_input').value.split('.')
	.map(function(oct){
		const oct_int = int(oct.trim());
		const conditions = [
			oct_int <= 255,
			oct_int >= 0,
			Number.isInteger(oct_int),
		]
		if (conditions.includes(false)){
			return null
		}else{
			return oct_int
		}
	})

	if ( (octets.length != 4) || octets.includes(null)){
		ksys.info_msg.send_msg(
			`Invalid address. Aborting`,
			'warn',
			5000
		);
		return
	}

	ksys.context.global.prm('atat_return_addr', octets, true);
	ksys.info_msg.send_msg(
		`Updated AT-AT return address to: ${octets.join('.')}; Restarting service...`,
		'ok',
		9000
	);

	$this.restart_atat_service();
}

$this.restart_atat_service = async function(){
	// Kill previous AT-AT status watcher
	$this.stop_atat_service();

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

	$this.at_at.service_ping = ksys.ticker.kb_at.StatusWatcher(
		ksys.context.global.cache.vmix_ip,
		atat_port,
		$this.update_atat_status
	)
}

$this.stop_atat_service = async function(){
	await $this.at_at?.service_ping?.terminate?.();
}

$this.toggle_atat_status_indicator = function(state){
	if (state == true){
		$('#ticker_service_status').css('display', '');
	}else{
		$('#ticker_service_status').css('display', 'none');
	}
}


// 
// Util
// 
$this.timeout_atat_btns = async function(timeout_ms=1000){
	$this.at_at.btns_enable_lock = true;
	ksys.btns.toggle({
		'launch_main_timer_r1': false,
		'launch_main_timer_r2': false,
		'continue_from_time':   false,
		'stop_extra_timer':     false,
	})

	await ksys.util.sleep(timeout_ms);

	$this.at_at.btns_enable_lock = false;
	ksys.btns.toggle({
		'launch_main_timer_r1': true,
		'launch_main_timer_r2': true,
		'continue_from_time':   true,
		'stop_extra_timer':     true,
	})
}

$this.toggle_atat_btns = function(state=true){
	if (state == true){
		$this.at_at.btns_enable_lock = false;
		ksys.btns.toggle({
			'launch_main_timer_r1': true,
			'launch_main_timer_r2': true,
			'continue_from_time':   true,
			'stop_extra_timer':     true,
		})
	}
	if (state == false){
		$this.at_at.btns_enable_lock = true;
		ksys.btns.toggle({
			'launch_main_timer_r1': false,
			'launch_main_timer_r2': false,
			'continue_from_time':   false,
			'stop_extra_timer':     false,
		})
	}
}

$this.restore_atat_line = async function(){
	// 
	// Main timer
	// 
	$this.timer_fset.at_at.create_base_timer();
	const base_timer_time = await $this.timer_fset.at_at.base_counter.get_curtime();
	console.error(base_timer_time);

	if (!base_timer_time.ok || !base_timer_time.reply_data){return};
	// If timer exists and well - reattach everything to it
	await $this.timer_fset.at_at.base_counter.resub_to_echo();
	await $this.timer_fset.at_at.base_counter.resub_to_end();

	// 
	// Extra timer
	// 
	$this.timer_fset.at_at.create_extra_time()
	const extra_timer_time = await $this.timer_fset.at_at.extra_counter.get_curtime();
	console.error(extra_timer_time);

	if (!extra_timer_time.ok || !extra_timer_time.reply_data){return};
	// If timer exists and well - reattach everything to it
	await $this.timer_fset.at_at.extra_counter.resub_to_echo();
	await $this.timer_fset.at_at.extra_counter.resub_to_end();
}

$this.atat_auto_return_addr = async function(){
	// document.querySelector('#atat_return_addr_input').value = ksys.util.get_local_ipv4_addr(false);
	document.querySelector('#atat_return_addr_input').value = await ksys.util.resolve_own_ip();
}


// 
// Base Timer
// 
$this.timer_fset.at_at.create_base_timer = function(rnum){
	const dur = $this.round_duration;

	$this.timer_fset.at_at.base_counter = new ksys.ticker.kb_at.AtAtTicker({
		'id':   2,
		'ip':   ksys.context.global.cache.vmix_ip,
		'port': ksys.context.global.cache.atat_port,
		// todo: Better url construction
		'url_params': `/API/?Function=SetText&Input=${$this.titles.timer.title_name}&SelectedName=base_ticker.Text&Value=\0`,
		'timings': {
			'start': [
				(rnum == 1) ? 0 : dur,
				0,
			],
			'end': [
				(rnum == 1) ? dur : (dur*2),
				0,
			],
		},
		'end_callback': async function(){
			console.error('End callback?');
			if (ksys.context.module.cache.round_num){
				await $this.timer_fset.at_at.launch_extra_time();
				$this.extra_time_vis(true);
			}
		},
		'echo_callback': $this.timer_fset.at_at.timer_callback,
	})
}

$this.timer_fset.at_at.wipe_timers = async function(rnum=1){
	// Kill base timer
	await $this.timer_fset.at_at?.base_counter?.terminate?.();
	$this.timer_fset.at_at.base_counter = null;

	// Kill extra timer
	await $this.timer_fset.at_at?.extra_counter?.terminate?.();
	$this.timer_fset.at_at.extra_counter = null;

	$this.zero_timer_time();

	// todo: It's speculated, that each time a new main timer starts - 
	// the extra time should be cleared.
	await $this.titles.timer.set_text('time_added', '');
	await $this.titles.timer.set_text('extra_ticker', '00:00');
	await $this.extra_time_vis(false);

	// Clear the base ticker text field
	await $this.titles.timer.set_text(
		'base_ticker', (rnum == 1) ? '00:00' : `${$this.round_duration}:00`
	);
}

$this.timer_fset.at_at.start_base_timer = async function(rnum){
	$this.toggle_atat_btns(false);
	$this.ticker_time.extra.minutes = 0;
	$this.ticker_time.extra.seconds = 0;

	// Save the target round number to context
	ksys.context.module.prm('round_num', rnum);

	// Todo: kill previous timers or simply overwrite with new data?
	// Commit murder for now

	// todo: shouldn't timer controls be stored in $this.at_at ?

	// todo: It's speculated, that each time a new main timer starts - 
	// the extra time should be cleared.
	// The function below does wipe the extra timer.
	await $this.timer_fset.at_at.wipe_timers(rnum);
	$('#timer_ctrl_additional input')[0].value = '';


	// Instantiate AT-AT ticker class
	$this.timer_fset.at_at.create_base_timer(rnum);

	// Launch the AT-AT ticker
	print(
		'Start response:',
		await $this.timer_fset.at_at.base_counter.start()
	);

	$this.timeout_atat_btns();
}

$this.timer_fset.at_at.timer_callback = function(msg){
	if (msg.data_buf[0] != 2){
		console.warn(
			'Received timer №', msg.data_buf[1] ,' echo with no payload:',
			msg.data_buf,
		)
		return
	}

	$this.ticker_time.base.minutes = msg.data_buf[2];
	$this.ticker_time.base.seconds = msg.data_buf[3];

	let minutes = str(msg.data_buf[2])

	if (minutes.length < 3){
		minutes = minutes.zfill(2);
	}

	const text = `${minutes}:${str(msg.data_buf[3]).zfill(2)}`;
	

	// const text = `${msg.data_buf[2]}:${msg.data_buf[3]}`;

	// $this.titles.timer.set_text('base_ticker', text);
	$('#timer_feedback_main').text(text);
}

$this.timer_fset.at_at.resume_main_timer_from_offset = async function(){
	if (!$this.timer_fset.at_at.base_counter){
		console.warn('Tried resuming non-existent main AT-AT timer');
		return
	}

	const dur = $this.round_duration;

	$this.toggle_atat_btns(false);

	const minutes = int(document.querySelector('#base_timer_resume_input .minutes').value || 0);
	const seconds = int(document.querySelector('#base_timer_resume_input .seconds').value || 0);

	// Seconds can be avoided, but minutes not.
	if (!minutes){
		ksys.info_msg.send_msg(
			`Malformed minutes: ${minutes}`,
			'warn',
			4000
		);
		$this.toggle_atat_btns(true);
		return
	}

	print('Resuming main timer from offset:', minutes, seconds)

	// Todo: more speculation...
	// update: Resolved
	await $this.titles.timer.set_text('time_added', '');
	await $this.extra_time_vis(false);

	// todo: implement this improvement in built-in ticker?
	// Calculate the round number from input.
	// Is this actually useless?
	const rnum = minutes < dur ? 1 : 2;
	// Save the calculated offset to context
	ksys.context.module.prm('round_num', rnum);

	await $this.timer_fset.at_at.base_counter.resume_from_offset({
		'start': [minutes, seconds,],
		'end': [
			(rnum == 1) ? dur : (dur*2),
			0,
		],
	})

	// important todo: it's speculated, that AT-AT's weak point is
	// timer restarts before the previous time ticked at least once
	$this.timeout_atat_btns();
}


// 
// Extra Timer
// 
$this.timer_fset.at_at.create_extra_time = function(){
	$this.timer_fset.at_at.extra_counter = new ksys.ticker.kb_at.AtAtTicker({
		'id':   3,
		'ip':   ksys.context.global.cache.vmix_ip,
		'port': ksys.context.global.cache.atat_port,
		// todo: Better url construction
		'url_params': `/API/?Function=SetText&Input=${$this.titles.timer.title_name}&SelectedName=extra_ticker.Text&Value=\0`,
		'timings': {
			'start': [0, 0],
			'end': [60, 0],
		},
		'end_callback': null,
		'echo_callback': $this.timer_fset.at_at.extra_timer_callback,
	})
}

$this.timer_fset.at_at.launch_extra_time = async function(){
	// Todo: kill previous timers or simply overwrite with new data?
	// Commit murder for now

	// Kill extra timer
	// todo: there's a function for this
	await $this.timer_fset.at_at?.extra_counter?.terminate?.();
	$this.timer_fset.at_at.extra_counter = null;
	await $this.titles.timer.set_text('extra_ticker', '00:00');

	// Instantiate AT-AT ticker class
	$this.timer_fset.at_at.create_extra_time()

	// Launch the AT-AT ticker
	print(
		'Extra timer start response:',
		await $this.timer_fset.at_at.extra_counter.start()
	);
}

$this.timer_fset.at_at.extra_timer_callback = function(msg){
	// todo: separate this check into a function
	if (msg.data_buf[0] != 2){
		console.warn(
			'Received timer №', msg.data_buf[1] ,' echo with no payload:',
			msg.data_buf,
		)
		return
	}

	$this.ticker_time.extra.minutes = msg.data_buf[2];
	$this.ticker_time.extra.seconds = msg.data_buf[3];

	const text = `${str(msg.data_buf[2]).zfill(2)}:${str(msg.data_buf[3]).zfill(2)}`;
	// const text = `${msg.data_buf[2]}:${msg.data_buf[3]}`;

	// $this.titles.timer.set_text('extra_ticker', text);
	$('#timer_feedback_extra').text(text);
}

$this.timer_fset.at_at.stop_extra_time = async function(){
	$this.timeout_atat_btns();
	await $this.timer_fset.at_at?.extra_counter?.terminate?.();
	$this.timer_fset.at_at.extra_counter = null;
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
$this.timer_fset.builtin._start_base_timer = async function(rnum){

	$this?.base_counter?.force_kill?.()
	$this.base_counter = null;

	$this?.extra_counter?.force_kill?.()
	$this.extra_counter = null;

	$this.ticker_time.extra.minutes = 0;
	$this.ticker_time.extra.seconds = 0;

	$this.titles.timer.set_text('time_added', '')
	$('#timer_ctrl_additional input')[0].value = '';

	await $this.titles.timer.set_text('extra_ticker', '00:00');
	await $this.extra_time_vis(false)

	ksys.context.module.prm('round_num', rnum)

	const dur = $this.round_duration;

	await $this.titles.timer.set_text('base_ticker', (rnum == 1) ? '00:00' : `${dur}:00`);

	$this.base_counter = ksys.ticker.spawn({
		// 'duration': (rnum == 2) ? (((dur*60)*1)+1) : ((dur*60)+1),
		'duration': ((dur*60)),
		'name': `giga_timer${rnum}`,
		'offset': (rnum == 2) ? (dur*60) : 0,
		'infinite': false,
		'reversed': false,
		'callback': $this.timer_fset.builtin.timer_callback,
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
				$this.timer_fset.builtin.launch_extra_time()
			}
			*/
			if (!pre_killed){
				$this.timer_fset.builtin.launch_extra_time()
			}
		}
	})

	// print($this.base_counter)
}

$this.timer_fset.builtin.start_base_timer = async function(rnum){
	print('STARTING BASE TIMER.....')
	// Destroy any extra time things
	await $this.timer_fset.builtin.destroy_extra_clock();

	// Reset time data for extra time
	$this.ticker_time.extra.minutes = 0;
	$this.ticker_time.extra.seconds = 0;

	// Save current round number
	ksys.context.module.prm('round_num', rnum);

	// Get round duration
	const dur = $this.round_duration * 60;

	print('ROUND DURATION:', dur)

	// Edit the main clock and start it
	await ksys.ticker.bundestag.edit_clock({
		'clock_id': $this.main_clock_id,
		'action': 'fire',
		'data': {
			'clock': {
				'duration': dur,
				// If it's the second round, then offset is the length of the
				// first time, such as 45.
				// Otherwise - offset is 0 (first round)
				'offset': (rnum == 2) ? dur : 0,
				'reversed': false,
				'vmix_fields': [{
					'count_as': 'clock',
					'tplate': '%mt%:%s%',
					'gtzip_name': $this.titles.timer.title_name,
					'text_field_name': 'base_ticker',
					// pad with 2 zeroes
					'pad': 2,
				}],
			}
		}
	})
}

$this.timer_fset.builtin.base_timer_end_callback = async function(data){
	print('BASE TIMER END CALLBACK')
	// simply start extra time
	$this.timer_fset.builtin.launch_extra_time();
}

$this.timer_fset.builtin.destroy_base_timer = async function(){
	await ksys.ticker.bundestag.edit_clock({
		'clock_id': $this.main_clock_id,
		'action': 'stop',
		'data': {}
	})
}

$this.timer_fset.builtin._timer_callback = function(tick){
	const minutes = Math.floor(tick.global / 60);
	const seconds = tick.global - (60*minutes);

	$this.ticker_time.base.minutes = minutes;
	$this.ticker_time.base.seconds = seconds;

	let text = `${str(minutes).zfill(2)}:${str(seconds).zfill(2)}`;

	const dur = $this.round_duration;

	// important todo: this is a retarded hack
	if (text == `${dur}:01`){
		text = `${dur}:00`;
		$this.ticker_time.base.minutes = dur;
		$this.ticker_time.base.seconds = 0;
	}

	if (text == '90:01'){
		text = '90:00';
		$this.ticker_time.base.minutes = dur * 2;
		$this.ticker_time.base.seconds = 0;
	}

	if (str(minutes).length > 2){
		text = `${str(minutes)}:${str(seconds).zfill(2)}`
	}

	$this.titles.timer.set_text('base_ticker', text);
	$('#timer_feedback_main').text(text);
}

$this.timer_fset.builtin.timer_callback = function(data){
	if (!data?.time?.total){return};
	const time = data.time;

	$this.ticker_time.base.minutes = time.total.minutes;
	$this.ticker_time.base.seconds = time.clock.seconds;

	$('#timer_feedback_main').text(
		`${str(time.total.minutes).zfill(2)}:${str(time.clock.seconds).zfill(2)}`
	);
}

// todo: make this function work with the new time input schema
$this.timer_fset.builtin._resume_main_timer_from_offset = function(event){

	$this?.extra_counter?.force_kill?.()
	$this.extra_counter = null;

	$this?.base_counter?.force_kill?.()
	$this.base_counter = null;

	$this.titles.timer.set_text('time_added', '');
	$this.extra_time_vis(false);

	const rnum = int(ksys.context.module.prm('round_num')) || 1;

	const offs_minutes = int(document.querySelector('#base_timer_resume_input .minutes').value || 0);
	const offs_seconds = int(document.querySelector('#base_timer_resume_input .seconds').value || 0);

	const offs = (offs_minutes * 60) + offs_seconds;

	const dur = ($this.round_duration*60);

	$this.base_counter = ksys.ticker.spawn({
		// 'duration': (rnum == 2) ? ((dur*2)+1) : (dur+1),
		'duration': (dur-(offs%dur))+1,
		'name': `giga_timer_offs${rnum}`,
		// 'offset': (rnum == 2) ? (dur+offs) : (0+offs),
		'offset': offs,
		'infinite': false,
		'reversed': false,
		'callback': $this.timer_fset.builtin.timer_callback,
		'wait': true,
	})

	$this.base_counter.fire()
	.then(function(_ticker) {
		// turn off automatically
		const pre_killed = _ticker.killed;
		if (_ticker){
			_ticker.force_kill()
			// if (document.querySelector('#timer_ctrl_additional input').value.trim()){
			// 	$this.timer_fset.builtin.launch_extra_time()
			// }
			if (!pre_killed){
				$this.timer_fset.builtin.launch_extra_time()
			}
		}
	})

	// print($this.base_counter)
}

$this.timer_fset.builtin.resume_main_timer_from_offset = async function(event){
	// Destroy any extra time things
	await $this.timer_fset.builtin.destroy_extra_clock();

	// Read current round number
	const rnum = int(ksys.context.module.prm('round_num')) || 1;

	// Calc offsets
	const offs_minutes = int(qsel('#base_timer_resume_input .minutes').value || 0);
	const offs_seconds = int(qsel('#base_timer_resume_input .seconds').value || 0);

	// Final offset in seconds
	const offs = (offs_minutes * 60) + offs_seconds;

	// Calc round duration in seconds
	const dur = $this.round_duration * 60;

	// Edit the main clock and start it
	await ksys.ticker.bundestag.edit_clock({
		'clock_id': $this.main_clock_id,
		'action': 'fire',
		'data': {
			'clock': {
				'duration': dur - (offs % dur),
				// If it's the second round, then offset is the length of the
				// first time, such as 45.
				// Otherwise - offset is 0 (first round)
				'offset': offs,
				'reversed': false,
				'vmix_fields': [{
					'count_as': 'clock',
					'tplate': '%mt%:%s%',
					'gtzip_name': $this.titles.timer.title_name,
					'text_field_name': 'base_ticker',
					// pad with 2 zeroes
					'pad': 2,
				}],
			}
		}
	})
}



// 
// Extra timer
// 

$this.timer_fset.builtin.destroy_extra_clock = async function(){
	// Stop extra time clock
	await ksys.ticker.bundestag.edit_clock({
		'clock_id': $this.extra_clock_id,
		'action': 'stop',
		'data': {}
	})
	await ksys.ticker.bundestag.reset_clock($this.extra_clock_id);

	// Clear additional extra time fields
	$this.titles.timer.set_text('time_added', '');
	$('#timer_ctrl_additional input')[0].value = '';

	$this.ticker_time.extra.minutes = 0;
	$this.ticker_time.extra.seconds = 0;

	$('#timer_feedback_extra').text(
		'--:--'
	);

	// Hide extra time
	await $this.extra_time_vis(false);
}

$this.timer_fset.builtin._launch_extra_time = async function(){
	$this?.extra_counter?.force_kill?.()
	$this.extra_counter = null;

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
		'callback': $this.timer_fset.builtin.extra_timer_callback,
		'wait': true,
	})

	$this.extra_counter.fire()
	.then(function(_ticker) {
		// turn off automatically
		if (_ticker){
			_ticker.force_kill()
		}
	})

	// print('EXTRA AMOUNT?!', extra_amount)
	await $this.titles.timer.set_text('extra_ticker', '00:00');
	// await $this.titles.timer.set_text('time_added', `+${Math.floor(extra_amount/1)}`)
	// await $this.titles.timer.toggle_text('time_added', true)
	// await $this.titles.timer.toggle_img('extra_time_bg', true)
	// await $this.titles.timer.toggle_text('extra_ticker', true)
}

$this.timer_fset.builtin.launch_extra_time = async function(){
	// Stop extra time clock
	await ksys.ticker.bundestag.edit_clock({
		'clock_id': $this.extra_clock_id,
		'action': 'stop',
		'data': {}
	})

	// Push extra time amount field value to VMIX title
	await $this.update_extra_time_amount();

	const fuck_shit = $this.timer_display_schema_switch.selected == 'fuck_shit';

	// Edit the extra clock and start it
	await ksys.ticker.bundestag.edit_clock({
		'clock_id': $this.extra_clock_id,
		'action': 'fire',
		'data': {
			'clock': {
				// It's actually not endless
				'duration': 60**2,
				'reversed': false,
				'fuck_you': fuck_shit ? ($this.ticker_time.base.minutes * 60) : 0,
				'vmix_fields': [{
					'count_as': 'clock',
					'tplate': '%m%:%s%',
					'gtzip_name': $this.titles.timer.title_name,
					'text_field_name': 'extra_ticker',
					// 'text_field_name': fuck_shit ? 'base_ticker' : 'extra_ticker',
					// pad with 2 zeroes
					'pad': 2,
				}],
			}
		}
	})
}

$this.timer_fset.builtin.extra_time_end_callback = async function(){
	// todo: not much needs to be done here really.
	// or is it ?
}

$this.timer_fset.builtin._extra_timer_callback = function(tick){
	const minutes = Math.floor(tick.global / 60)
	const seconds = tick.global - (60*minutes)

	$this.ticker_time.extra.minutes = minutes;
	$this.ticker_time.extra.seconds = seconds;

	const text = `${str(minutes).zfill(2)}:${str(seconds).zfill(2)}`;

	$this.titles.timer.set_text('extra_ticker', text)
	$('#timer_feedback_extra').text(text)
}

$this.timer_fset.builtin.extra_timer_callback = function(data){
	if (!data?.time?.total){return};

	const time = data.time;

	$this.ticker_time.extra.minutes = time.clock.minutes;
	$this.ticker_time.extra.seconds = time.clock.seconds;

	$('#timer_feedback_extra').text(
		`${str(time.clock.minutes).zfill(2)}:${str(time.clock.seconds).zfill(2)}`
	);
}

$this.timer_fset.builtin.stop_extra_time = async function(){
	// Stop extra time clock
	await $this.timer_fset.builtin.destroy_extra_clock();
}























// ================================
//               Scores
// ================================

// todo: add sanity check for player's side
$this.add_score_from_cards_panel = async function(){
	const player = $this.resource_index.card_player_filter?.selected_entry?.player;

	if (!player){
		ksys.info_msg.send_msg(
			`No player selected. Go to the Stats panel for advanced manipulations`,
			'warn',
			9000
		);
		return
	}

	const side = player.club.is_enemy ? 'guest' : 'home';
	const score_list = $this.resource_index.score_manager.sides[side].score_list
	score_list.add_score(
		player
	)

	// Show the title
	if ($this.title_schema_switch.selected == 'separate'){
		// Set logo
		await $this.titles.gscore.set_img_src(
			'club_logo',
			player.club.logo_path
		)

		// Set player's surname
		await $this.titles.gscore.set_text(
			'player_name',
			ksys.strf.params.players.format(player.surname)
		)

		// Set time
		const time = $this.get_current_time(true);
		const time_suffix = time.extra ? `+${time.extra}` : '';
		await $this.titles.gscore.set_text(
			'descr',
			`${time.base}'` + time_suffix + ' ХВИЛИНА'
		)

		ksys.btns.adv_timeout({
			'scored': $this.sequencer.sequences.scored.sum,
		})

		// Hide red cards
		await $this.hide_red_cards();

		await $this.titles.gscore.overlay_in()
		await ksys.util.sleep(
			$this.sequencer.sequences.scored.items.hold.dur
		)
		await $this.titles.gscore.overlay_out()
		await $this.show_red_cards();

	}else{

		const time = $this.get_current_time(true);
		const time_suffix = time.extra ? `+${time.extra}` : '';

		$this.timeout_persistent_header_btns(
			$this.sequencer.sequences.scored.sum
		);

		await $this.persistent_header.event({
			'header': 'АВТОР ГОЛУ',
			'upper_text': ksys.strf.params.players.format(player.surname),
			'lower_text': `${time.base}'` + time_suffix + ' ХВИЛИНА',
			// 'icon': null,
			'team_logo': player.club.logo_path,
		})

		await ksys.util.sleep($this.sequencer.sequences.scored.items.hold.dur);

		await $this.persistent_header.clock()
	}

}

$this.hide_scored_title = async function(){
	await $this.titles.gscore.overlay_out();
	// todo: Check if it's already on the required page
	await $this.show_red_cards();
}

$this.mod_score_author = function(evt){
	if (!evt.altKey){return};

	const selected_player = $this.resource_index.score_manager.player_picker?.selected_entry?.player;
	const selected_score_entry = $this.resource_index.score_manager.selected_score_record;
	if (!selected_player){
		ksys.info_msg.send_msg(
			`No player selected`,
			'warn',
			3000
		);
		return
	}
	if (!selected_score_entry){
		ksys.info_msg.send_msg(
			`No score record selected`,
			'warn',
			3000
		);
		return
	}

	$this.resource_index.score_manager.modify_score_author()

}




/*
	Algorithm responsible for displaying the score summary
	and collapsing multiple scores with the same author into a
	single row/string/call it whatever you want


	> Loop through every score unit of the team, as 'unit_a'
	    > If 'unit_a' has no author - skip, continue iteration

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


	Authorless scores are fucking evil.

	> Loop through every score unit of the team yet again, as 'unit_a'
	    > Skip the unit if it DOES have an author

	    > Append the score unit as text (e.g. `45'+2 (АГ)`)
	      to an array of rows that will be displayed in the VMIX title


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
$this.show_score_summary = async function(){
	await $this.update_team_colors();

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
		const score_stack = $this.resource_index?.score_manager?.sides[side]?.score_list?.score_stack;
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
	const score_amt_l = $this.resource_index?.score_manager?.sides?.home?.score_list?.score_stack?.size || 0;
	const score_amt_r = $this.resource_index?.score_manager?.sides?.guest?.score_list?.score_stack?.size || 0;
	await $this.titles.final_scores.set_text(
		'score_sum',
		`${score_amt_l} ${score_amt_r}`
	)


	// ------------------------------
	// Show the appropriate amount of fields
	// ------------------------------
	await $this.titles.final_scores.toggle_img('anim_full', false)
	await $this.titles.final_scores.toggle_img('anim_half', false)

	const need_rows = Math.max(score_summary.home.length || 0, score_summary.guest.length || 0).clamp(1, 5)
	// todo: hardcoded path. Too bad.
	$this.titles.final_scores.set_img_src(
		'upper_bg',
		Path($this.resources_location.value, 'final_scores').join(`${need_rows}.png`)
	)


	// ------------------------------
	// Push score lists to the title
	// ------------------------------
	await $this.titles.final_scores.set_text(
		'scores_l',
		score_summary.home.join('\n')
	)
	await $this.titles.final_scores.set_text(
		'scores_r',
		score_summary.guest.join('\n')
	)


	// ------------------------------
	// Misc.
	// ------------------------------

	// team name LEFT
	await $this.titles.final_scores.set_text(
		'team_name_l',
		ksys.strf.params.club_name.format($this.resource_index.side.home?.club?.club_name)
	)
	// team logo LEFT
	await $this.titles.final_scores.set_img_src(
		'team_logo_l',
		$this.resource_index.side.home?.club?.logo_path || ''
	)
	// team colour LEFT
	await $this.titles.final_scores.set_shape_color(
		'color_home',
		$this.resource_index.side.home?.lineup?.tshirt_colpick?.color
	)

	// team name RIGHT
	await $this.titles.final_scores.set_text(
		'team_name_r',
		ksys.strf.params.club_name.format($this.resource_index.side.guest?.club?.club_name || '')
	)
	// team logo RIGHT
	await $this.titles.final_scores.set_img_src(
		'team_logo_r',
		$this.resource_index.side.guest?.club?.logo_path || ''
	)
	// team colour RIGHT
	await $this.titles.final_scores.set_shape_color(
		'color_guest',
		$this.resource_index.side.guest?.lineup?.tshirt_colpick?.color
	)

	const current_total = ($this.ticker_time.base.minutes * 60) + $this.ticker_time.base.seconds;
	const dur_total = $this.round_duration * 60;
	// Set bottom text
	await $this.titles.final_scores.set_text(
		'bottom_text',
		// $this.ticker_time.base.minutes $this.round_duration
		(current_total <= dur_total) ? 'ПЕРШИЙ ТАЙМ' : 'ДРУГИЙ ТАЙМ'
	)

	// show the title
	await $this.titles.final_scores.overlay_in()
}

$this.hide_score_summary = async function(){
	await $this.titles.final_scores.overlay_out()
}




// ================================
//               Stats
// ================================

// todo: this is old, copypasted code

$this.save_match_stats = function(){
	const save = {};
	console.time('Saving stats')
	for (const stat_name in $this.stats_unit_pool){
		const stat = $this.stats_unit_pool[stat_name];
		save[stat_name] = {
			1: int(stat.val_selector[1]),
			2: int(stat.val_selector[2]),
		}
	}

	ksys.db.module.write('stats.fball', JSON.stringify(save, null, 4))

	console.timeEnd('Saving stats')
}

// stat unit
$this.StatUnit = class {
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
		$this.save_match_stats()
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
		$this.save_match_stats()
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


$this.show_team_stats = async function(){

	ksys.btns.pool.show_team_stats.toggle(false)

	for (const stat_name in $this.stats_unit_pool){
		$this.stats_unit_pool[stat_name].push_to_vmix()
	}

	// Set scores
	const score_amt_l = $this.resource_index.score_manager.sides.home.score_list.score_stack.size;
	const score_amt_r = $this.resource_index.score_manager.sides.guest.score_list.score_stack.size;
	await $this.titles.stats.set_text('scores', `${score_amt_l} : ${score_amt_r}`);

	// set logos
	await $this.titles.stats.set_img_src(
		'team_logo_l',
		$this.resource_index.side.home?.club?.logo_path || ''
	)
	await $this.titles.stats.set_img_src(
		'team_logo_r',
		$this.resource_index.side.guest?.club?.logo_path || ''
	)

	// set bottom text
	// todo: pull it from a more reliable place ?
	await $this.titles.stats.set_text('bottom_text', $('#vs_text_bottom_lower').val())

	// Set club names
	await $this.titles.stats.set_text(
		'team_name_l',
		ksys.strf.params.club_name.format($this.resource_index.side.home?.club?.club_name)
	)
	await $this.titles.stats.set_text(
		'team_name_r',
		ksys.strf.params.club_name.format($this.resource_index.side.guest?.club?.club_name)
	)

	await $this.titles.stats.overlay_in()

	ksys.btns.pool.show_team_stats.toggle(true)
}

$this.hide_team_stats = async function(){

	ksys.btns.pool.hide_team_stats.toggle(false)

	await $this.titles.stats.overlay_out()

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
$this.save_lineup_lists = function(){
	print('saving lineup lists');

	const save_data = {};

	const res_idx = $this.resource_index;

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
			'tshirt_col':      tgt_lineup.tshirt_colpick.color,
			'tshirt_text_col': tgt_lineup.tshirt_colpick.text_color,

			'shorts_col':      tgt_lineup.shorts_colpick.color,
			'shorts_text_col': tgt_lineup.shorts_colpick.text_color,

			'gk_col':          tgt_lineup.gk_colpick.color,
			'gk_text_col':     tgt_lineup.gk_colpick.text_color,

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
$this.load_lineup_lists = function(){
	// Check if there's anything in the save file
	const last_save = ksys.db.module.read('lineup_lists.kbsave', 'json');
	if (!last_save){return};

	// todo: compare club names
	for (const side of ['home', 'guest']){
		const side_info = last_save[side];
		if (!side_info){continue};

		$this.create_club_lineup(
			side,
			side_info.club_name,
			{
				'tshirt_col':      side_info.tshirt_col,
				'tshirt_text_col': side_info.tshirt_text_col,

				'shorts_col':      side_info.shorts_col,
				'shorts_text_col': side_info.shorts_text_col,

				'gk_col':          side_info.gk_col,
				'gk_text_col':     side_info.gk_text_col,

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
$this.save_field_layouts = function(){
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
		save_data[side].club_name = $this.resource_index.side[side]?.club?.club_name?.lower?.();
		save_data[side].field = $this.resource_index.side[side]?.field?.to_json?.() || {};
	}

	ksys.db.module.write(
		'field_layout.kbsave',
		JSON.stringify(save_data, null, '\t')
	)
}

$this.load_field_layouts = function(){
	// Check if there's anything in the save file
	const last_save = ksys.db.module.read('field_layout.kbsave', 'json');
	if (!last_save){return};

	for (const side of ['home', 'guest']){
		if (!$this.resource_index.side[side].field){continue};

		$this.resource_index.side[side].field.apply_layout(last_save[side].field)
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
$this.save_card_data = function(){
	print('Saving card data');

	const card_manager = $this.resource_index.card_manager;

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


$this.load_card_data = function(){
	// Check if there's anything in the save file
	const last_save = ksys.db.module.read('card_info.kbsave', 'json');
	if (!last_save){return};

	// sanity check
	if (!$this.resource_index.card_manager){
		console.error(`Why doesn't the card manager exist ?????`);
		return
	}

	$this.resource_index.card_manager.apply_data(last_save)
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
$this.save_score_data = function(){
	print('Saving score data')

	const score_manager = $this.resource_index.score_manager;
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

$this.load_score_data = function(){
	// Check if there's anything in the save file
	const last_save = ksys.db.module.read('score_data.kbsave', 'json');
	if (!last_save){return};

	const score_manager = $this.resource_index.score_manager;
	if (!score_manager){
		console.error('Score manager does not exist at the momment of loading save data');
		return
	}

	score_manager.apply_data(last_save)
}




// ---------------
//  Misc. Titles
// ---------------
$this.save_misc_titles = function(){
	const misc_title_data = {};

	for (const misc_title of Object.values($this.misc_titles)){
		misc_title_data[misc_title.title_id] = misc_title.to_dict();
	}

	ksys.db.module.write(
		'misc_titles.kbsave',
		JSON.stringify(misc_title_data, null, '\t')
	)
}






// ---------------
//  Saving gateway
// ---------------

// pass null to save everything
$this.global_save = function(save_targets=null){
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
		$this.save_lineup_lists()
	}

	// Save field layouts
	if (what_to_save.field_layout || save_targets == null){
		$this.save_field_layouts()
	}

	// Save card data
	if (what_to_save.card_data || save_targets == null){
		$this.save_card_data()
	}

	// Save score data
	if (what_to_save.scores || save_targets == null){
		$this.save_score_data()
	}

	// Save score data
	if (what_to_save.penalties || save_targets == null){
		$this.save_penalties()
	}

	// Save score data
	if (what_to_save.misc_titles || save_targets == null){
		$this.save_misc_titles();
	}
}



// ---------------
//    Penalties
// ---------------
$this.save_penalties = function(){
	const penalty_manager = $this.resource_index.penalty_manager;

	const penalty_data = {
		'home': penalty_manager?.sides?.home?.to_json?.(),
		'guest': penalty_manager?.sides?.guest?.to_json?.(),
	}

	ksys.db.module.write(
		'penalty_data.kbsave',
		JSON.stringify(penalty_data, null, '\t')
	)
}

$this.show_penalty_title = async function(){
	const tgt_title = $this.titles.penalties;

	await $this.resource_index.penalty_manager.resync_vmix();

	await ksys.util.sleep(500);
	await tgt_title.overlay_in(2);
}

$this.hide_penalty_title = async function(){
	const tgt_title = $this.titles.penalties;

	await tgt_title.overlay_out(2);
}




// ================================
//         Create new match
// ================================

// (Wipe previous data)
$this.init_new_match = function(evt){
	if (!evt.ctrlKey){return};

	// First of all - delete files
	const del_entries = [
		'lineup_lists.kbsave',
		'field_layout.kbsave',
		'card_info.kbsave',
		'score_data.kbsave',
		'stats.fball',
		'penalty_data.kbsave',
	]

	for (const fname of del_entries){
		ksys.db.module.delete(fname);
	}

	ksys.context.module.prm('todays_commenter', '');
	ksys.context.module.prm('vs_title_bottom_upper_line', '');
	ksys.context.module.prm('vs_title_bottom_lower_line', '');
	ksys.context.module.prm('vs_text_main_header', '');

	// why bother...
	// Just reload the controller...
	$('body').css({'pointer-events': 'none'});
	ksys.fbi.warn_critical(
		`Please press CTRL + R (there's nothing else you can do)`
	)
	ksys.util.reload();

}



