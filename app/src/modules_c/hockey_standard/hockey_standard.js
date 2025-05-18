
if(!window.kbmodules){window.kbmodules={}};
if(!window.kbmodules.hockey_standard){window.kbmodules.hockey_standard={}};








window.kbmodules.hockey_standard.load = async function(){
	window.kbmodules.hockey_standard.timers = new window.kbmodules.hockey_standard.TimersContainer();



}



window.kbmodules.hockey_standard.TimersContainer = class{
	constructor(){
		const self = this;
		ksys.util.cls_pwnage.remap(self);

		self.main_timer = null;
		self.deletion_timers = [
			[null, null],
			[null, null],
		];
	}

	window.kbmodules(self){
		const valid_timers = [];
		const all_timers = [
			self.main_timer,
			self.deletion_timers[0][0],
			self.deletion_timers[0][1],

			self.deletion_timers[1][0],
			self.deletion_timers[1][1],
		];

		for (const timer of all_timers){
			if (timer){
				valid_timers.push(timer)
			}
		}

		return valid_timers;
	}
}

















