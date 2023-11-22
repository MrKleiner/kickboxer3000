

// timings are in the following format:
// {
// 	'fps': 30,
// 	'frames_in': 72,
// 	'frames_out': 72,
// 	'margin': 3,
// }

class vmix_title
{
	constructor(title_name, gt_format=true){
		this.last_overlay = null;
		this.timings = null;
		this.default_overlay = null;

		this.xml_cache = null;

		// if the first parameter is a string - create a title with no timings
		// if the first parameter is an object, then ignore the second one and derive everything from the provided object
		if (typeof title_name == 'string'){
			this.title_name = title_name;
			this.gtformat = gt_format;
		}

		if (typeof title_name != 'string'){
			const defaults = {
				// title name cannot be missing
				// 'title_name': null,
				'gtformat': true,
				'timings': null,
				'default_overlay': null,
			};
			const cfg = { ...defaults, ...title_name };

			if (!cfg.title_name){
				console.error(
					'Invalid title name:', cfg.title_name
				)
			}

			this.title_name =      cfg.title_name;
			this.gtformat =        cfg.gtformat;
			this.timings =         cfg.timings;
			this.default_overlay = cfg.default_overlay;

			// print('MERGE RESULT', merge, this.gtformat)
		}
	}


	async set_text(field_name, newval){
		await vmix.talker.talk({
			'Function': 'SetText',
			'Value': newval,
			'Input': this.title_name,
			'SelectedName': field_name + (this.gtformat ? '.Text' : ''),
		})
	}

	async toggle_text(field_name, state=null){
		await vmix.talker.talk({
			'Function': (state == null) ? 'SetTextVisible' : `SetTextVisible${state ? 'On' : 'Off'}`,
			'Input': this.title_name,
			'SelectedName': field_name + (this.gtformat ? '.Text' : ''),
		})
	}


	async set_img_src(img_name, newsrc){
		await vmix.talker.talk({
			'Function': 'SetImage',
			'Value': str(newsrc),
			'Input': this.title_name,
			'SelectedName': img_name + (this.gtformat ? '.Source' : ''),
		})
	}

	async toggle_img(field_name, state=null){
		await vmix.talker.talk({
			'Function': (state == null) ? 'SetImageVisible' : `SetImageVisible${state ? 'On' : 'Off'}`,
			'Input': this.title_name,
			'SelectedName': field_name + (this.gtformat ? '.Source' : ''),
		})
	}


	// todo: add check to prevent exceeding 4 overlays
	// todo: check for valid overlay numbers ?
	async overlay_in(overlay_num=null, wait=true){

		const target_overlay = overlay_num || this.default_overlay || 1;
		this.last_overlay = target_overlay;

		await vmix.talker.talk({
			'Function': `OverlayInput${target_overlay}In`,
			'Input': this.title_name,
		})

		if (this.timings && wait){
			const margin = (this.timings.margin || 0) + 500;
			await ksys.util.sleep(((this.timings.frames_in / this.timings.fps)*1000) + margin)
		}
	}

	async overlay_out(overlay_num=null, wait=true){
		const target_overlay = overlay_num || this.last_overlay || 1;

		await vmix.talker.talk({
			'Function': `OverlayInput${target_overlay}Out`,
			'Input': this.title_name,
		})

		if (this.timings && wait){
			const margin = (this.timings.margin || 0) + 500
			const frames_out = this.timings.frames_out || this.timings.frames_in
			await ksys.util.sleep(((frames_out / this.timings.fps)*1000) + margin)
		}
	}


	// Pause title rendering while making multiple updates
	async pause_render(){
		await vmix.talker.talk({
			'Function': `PauseRender`,
			'Input': this.title_name,
		})
	}
	// Resume render
	async resume_render(){
		await vmix.talker.talk({
			'Function': `ResumeRender`,
			'Input': this.title_name,
		})
	}




}

module.exports = vmix_title;


