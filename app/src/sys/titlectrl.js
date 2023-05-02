

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

		// if the first parameter is a string - create a title with no timings
		// if the first parameter is an object, then ignore the second one and derive everything from the provided object
		if (typeof title_name == 'string'){
			this.title_name = title_name;
			this.gtformat = gt_format;
		}

		if (typeof title_name != 'string'){
			const defaults = {
				// 'title_name': null,
				'gtformat': true,
				'timings': null,
			};
			const merge = { ...defaults, ...title_name };

			this.title_name = merge.title_name;
			this.gtformat =   merge.gtformat;
			this.timings =    merge.timings;

			// print('MERGE RESULT', merge, this.gtformat)
		}
	}

	async set_text(field_name, newval){
		await vmix.talker.vmix_talk({
			'Function': 'SetText',
			'Value': newval,
			'Input': this.title_name,
			'SelectedName': field_name + (this.gtformat ? '.Text' : ''),
		})
	}

	async toggle_text(field_name, state=null){
		// const do_toggle = state == null;
		await vmix.talker.vmix_talk({
			'Function': (state == null) ? 'SetTextVisible' : `SetTextVisible${state ? 'On' : 'Off'}`,
			'Input': this.title_name,
			'SelectedName': field_name + (this.gtformat ? '.Text' : ''),
		})
	}

	async set_img_src(img_name, newsrc){
		await vmix.talker.vmix_talk({
			'Function': 'SetImage',
			'Value': str(newsrc),
			'Input': this.title_name,
			'SelectedName': img_name + (this.gtformat ? '.Source' : ''),
		})
	}

	async toggle_img(field_name, state=null){
		// const do_toggle = state == null;
		await vmix.talker.vmix_talk({
			'Function': (state == null) ? 'SetImageVisible' : `SetImageVisible${state ? 'On' : 'Off'}`,
			'Input': this.title_name,
			'SelectedName': field_name + (this.gtformat ? '.Source' : ''),
		})
	}
	// todo: add check to prevent exceeding 4 overlays
	async overlay_in(overlay_num=1, wait=true){
		this.last_overlay = overlay_num;
		await vmix.talker.vmix_talk({
			'Function': `OverlayInput${overlay_num}In`,
			'Input': this.title_name,
		})
		if (this.timings && wait){
			const margin = this.timings.margin || 0
			await kbsleep(((this.timings.frames_in / this.timings.fps)*1000) + margin)
		}
	}

	async overlay_out(overlay_num=null, wait=true){
		await vmix.talker.vmix_talk({
			'Function': `OverlayInput${this.last_overlay || overlay_num || 1}Out`,
			'Input': this.title_name,
		})
		if (this.timings && wait){
			const margin = this.timings.margin || 0
			const frames_out = this.timings.frames_out || this.timings.frames_in
			await kbsleep(((frames_out / this.timings.fps)*1000) + margin)
		}
	}
}

module.exports = vmix_title;