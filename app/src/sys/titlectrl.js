

// timings are in the following format:
// {
// 	'fps': 30,
// 	'frames_in': 72,
// 	'frames_out': 72,
// 	'margin': 3,
// }

const VMIXTitle = class{
	constructor(title_name, gt_format=true){
		const self = ksys.util.cls_pwnage.remap(this);

		self.last_overlay = null;
		self.timings = null;
		self.default_overlay = null;

		self.xml_cache = null;

		// if the first parameter is a string - create a title with no timings
		// if the first parameter is an object, then ignore the second one and derive everything from the provided object
		if (typeof title_name == 'string'){
			self.title_name = title_name;
			self.gtformat = gt_format;
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

			self.title_name =      cfg.title_name;
			self.gtformat =        cfg.gtformat;
			self.timings =         cfg.timings;
			self.default_overlay = cfg.default_overlay;

			// print('MERGE RESULT', merge, self.gtformat)
		}
	}

	async set_text(self, field_name, newval){
		await vmix.talker.talk({
			'Function': 'SetText',
			'Value': newval,
			'Input': self.title_name,
			'SelectedName': field_name + (self.gtformat ? '.Text' : ''),
		})
	}

	async toggle_text(self, field_name, state=null){
		await vmix.talker.talk({
			'Function': (state == null) ? 'SetTextVisible' : `SetTextVisible${state ? 'On' : 'Off'}`,
			'Input': self.title_name,
			'SelectedName': field_name + (self.gtformat ? '.Text' : ''),
		})
	}


	async set_img_src(self, img_name, newsrc){
		await vmix.talker.talk({
			'Function': 'SetImage',
			'Value': str(newsrc),
			'Input': self.title_name,
			'SelectedName': img_name + (self.gtformat ? '.Source' : ''),
		})
	}

	async toggle_img(self, field_name, state=null){
		await vmix.talker.talk({
			'Function': (state == null) ? 'SetImageVisible' : `SetImageVisible${state ? 'On' : 'Off'}`,
			'Input': self.title_name,
			'SelectedName': field_name + (self.gtformat ? '.Source' : ''),
		})
	}


	// todo: add check to prevent exceeding 4 overlays
	// todo: check for valid overlay numbers ?
	async overlay_in(self, overlay_num=null, wait=true){

		const target_overlay = overlay_num || self.default_overlay || 1;
		self.last_overlay = target_overlay;

		await vmix.talker.talk({
			'Function': `OverlayInput${target_overlay}In`,
			'Input': self.title_name,
		})

		if (self.timings && wait){
			const margin = (self.timings.margin || 0) + 500;
			await ksys.util.sleep(((self.timings.frames_in / self.timings.fps)*1000) + margin)
		}
	}

	async overlay_out(self, overlay_num=null, wait=true){
		const target_overlay = overlay_num || self.last_overlay || self.default_overlay || 1;

		await vmix.talker.talk({
			'Function': `OverlayInput${target_overlay}Out`,
			'Input': self.title_name,
		})

		if (self.timings && wait){
			const margin = (self.timings.margin || 0) + 500
			const frames_out = self.timings.frames_out || self.timings.frames_in
			await ksys.util.sleep(((frames_out / self.timings.fps)*1000) + margin)
		}
	}


	// todo: these manipulations require
	// beyond sattelite manufacturing precision,
	// otherwise retarded artifacts occur

	// Pause title rendering while making multiple updates
	async pause_render(self){
		await vmix.talker.talk({
			'Function': `PauseRender`,
			'Input': self.title_name,
		})
	}
	// Resume render
	async resume_render(self){
		await vmix.talker.talk({
			'Function': `ResumeRender`,
			'Input': self.title_name,
		})
	}




}

module.exports = VMIXTitle;


