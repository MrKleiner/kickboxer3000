

class _fbi_logger
{
	// constructor(height, width) {
	constructor() {
		// window.print = console.log.bind(window.console);
		window.log = this.module_log
		console.log('Initialized Fbi Logger');
	};


	// module: module name, if found in predef styles - style correspondingly. Else - wrap into []
	// log: an array of objects to log
	module_log(md=null, lg=''){
		// get pure list of stuff to actually log
		const clear_log = [...arguments].slice(1)

		const predef_styles = {
			'skyboxer': {
				'bg': 'rgba(0, 0, 0, 0.0)',
				'fg': '#1F963B',
				'text': '[Skyboxer]'
			},
			'python_sender': {
				'bg': 'rgba(0, 0, 0, 0.0)',
				'fg': '#3852B2',
				'text': '[Python Sender]'
			},
			'vmix_talk': {
				'bg': 'rgba(0, 0, 0, 0.0)',
				'fg': '#C1186C',
				'text': '[Vmix Talker]'
			},
			'modmaker': {
				'bg': 'rgba(0, 0, 0, 0.0)',
				'fg': '#6198CC',
				'text': '[Modmaker]'
			},
			'gameinfo': {
				'bg': 'rgba(0, 0, 0, 0.0)',
				'fg': '#5F881E',
				'text': '[GameInfo]'
			},
			'dboard': {
				'bg': 'rgba(0, 0, 0, 0.0)',
				'fg': '#5C1EB8',
				'text': '[Dashboard]'
			}
		}

		// make the module name

		const module_name = predef_styles.hasOwnProperty(md) ? `%c${predef_styles[md]['text']}` : `[${md}]`;
		const module_style = predef_styles.hasOwnProperty(md) ? `background: ${predef_styles[md]['bg']}; color: ${predef_styles[md]['fg']}` : '';
		
		// absolute genius
		// return [module_name, module_style, ...clear_log]
		print(
			module_name,
			module_style,
			...clear_log,
		)

	}

	warn_critical(msg=''){
		$('#logs_place').append(`
			<div class="warning_critical">
				<msg>${msg}</msg>
				<sysbtn onclick="close_warnings()"><span style="font-style: italic">I swear I will not ignore this warning and act accordingly</span></sysbtn>
			</div>
		`);
		$('#logs_place').css('visibility', 'visible')
	}

}

const fbi = new _fbi_logger();


module.exports = fbi;