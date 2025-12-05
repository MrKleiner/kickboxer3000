const fastq = require('fastq');


const SYS_DATA = {
	'presetSaveSched': fastq.promise(async function(item){
		const saveFilePath = (await vmix.talker.project()).querySelector('preset')?.textContent;
		if (!saveFilePath){
			item.reject();
			return
		}

		await vmix.talker.talk({
			'Function': 'SavePreset',
			'Value': saveFilePath,
		})

		await ksys.util.sleep(1500);

		item.resolve();
	}, 1),
};




VOL_DICT = [
	0,
	9.999999E-07,
	1.6E-05,
	8.099999E-05,
	0.000256,
	0.000625,
	0.001296,
	0.002401,
	0.004096,
	0.006561001,
	0.01,
	0.014641,
	0.020736,
	0.02856099,
	0.038416,
	0.05062501,
	0.06553599,
	0.083521,
	0.104976,
	0.130321,
	0.16,
	0.194481,
	0.234256,
	0.279841,
	0.331776,
	0.390625,
	0.4569759,
	0.5314411,
	0.614656,
	0.7072809,
	0.8100001,
	0.923521,
	1.048576,
	1.185921,
	1.336336,
	1.500625,
	1.679616,
	1.874161,
	2.085136,
	2.313441,
	2.56,
	2.825761,
	3.111696,
	3.418801,
	3.748096,
	4.100625,
	4.477456,
	4.879681,
	5.308415,
	5.764802,
	6.25,
	6.7652,
	7.311615,
	7.890479,
	8.503057,
	9.150626,
	9.834496,
	10.556,
	11.31649,
	12.11736,
	12.96,
	13.84584,
	14.77634,
	15.75296,
	16.77721,
	17.85062,
	18.97474,
	20.15112,
	21.38138,
	22.66712,
	24.01,
	25.41168,
	26.87386,
	28.39824,
	29.98658,
	31.64063,
	33.36217,
	35.15304,
	37.01505,
	38.95008,
	40.96,
	43.04672,
	45.21217,
	47.45832,
	49.78713,
	52.20063,
	54.70082,
	57.28976,
	59.96953,
	62.74224,
	65.60999,
	68.57497,
	71.6393,
	74.80521,
	78.0749,
	81.45062,
	84.93465,
	88.52929,
	92.23682,
	96.0596,
	100,
	101,
]

VOL_DICT_MONO = [
	0,
	9.999999E-09,
	1.6E-07,
	8.099999E-07,
	2.56E-06,
	6.25E-06,
	1.296E-05,
	2.401E-05,
	4.096E-05,
	6.561001E-05,
	0.0001,
	0.00014641,
	0.00020736,
	0.0002856099,
	0.00038416,
	0.0005062501,
	0.0006553599,
	0.00083521,
	0.00104976,
	0.00130321,
	0.0016,
	0.00194481,
	0.00234256,
	0.00279841,
	0.00331776,
	0.00390625,
	0.004569759,
	0.005314411,
	0.00614656,
	0.007072809,
	0.008100001,
	0.009235211,
	0.01048576,
	0.01185921,
	0.01336336,
	0.01500625,
	0.01679616,
	0.01874161,
	0.02085136,
	0.02313441,
	0.0256,
	0.02825761,
	0.03111696,
	0.03418801,
	0.03748096,
	0.04100624,
	0.04477456,
	0.04879681,
	0.05308415,
	0.05764801,
	0.0625,
	0.067652,
	0.07311615,
	0.07890479,
	0.08503057,
	0.09150626,
	0.09834496,
	0.10556,
	0.1131649,
	0.1211736,
	0.1296,
	0.1384584,
	0.1477634,
	0.1575296,
	0.1677721,
	0.1785062,
	0.1897474,
	0.2015112,
	0.2138138,
	0.2266712,
	0.2401,
	0.2541168,
	0.2687386,
	0.2839824,
	0.2998658,
	0.3164063,
	0.3336217,
	0.3515304,
	0.3701505,
	0.3895009,
	0.4096,
	0.4304672,
	0.4521217,
	0.4745832,
	0.4978713,
	0.5220063,
	0.5470082,
	0.5728976,
	0.5996953,
	0.6274224,
	0.6560999,
	0.6857497,
	0.716393,
	0.7480521,
	0.780749,
	0.8145062,
	0.8493465,
	0.8852929,
	0.9223682,
	0.960596,
	1,
	1.1,
]


const savePreset = async function(){
	const [savePromise, saveResolve, saveReject] = ksys.util.flatPromise();
	SYS_DATA.presetSaveSched.push({
		'resolve': saveResolve,
		'reject': saveReject,
	})

	await savePromise;
}



const animateLinear = function({
	from = 0,
	to = 1,
	duration = 1000,
	onUpdate = () => {},
	onComplete = () => {}
} = {}) {
	let start = performance.now();
	let rafId = null;
	let cancelled = false;

	function frame(now) {
		if (cancelled) return;
		let t = (now - start) / duration;
		if (t <= 0) t = 0;
		if (t >= 1) t = 1;

		const value = from + (to - from) * t; // linear interpolation
		onUpdate(value);

		if (t < 1) {
			rafId = requestAnimationFrame(frame);
		} else {
			onComplete(value);
		}
	}

	// handle zero/negative duration immediately
	if (duration <= 0) {
		onUpdate(to);
		onComplete(to);
		return { cancel: () => {} };
	}

	rafId = requestAnimationFrame(frame);

	return {
		cancel: () => {
			cancelled = true;
			if (rafId) cancelAnimationFrame(rafId);
		}
	};
}


const animateLinearAwait = function({
	from = 0,
	to = 1,
	duration = 1000,
	onUpdate = () => {},
	onComplete = () => {}
} = {}) {
	let start = performance.now();
	let rafId = null;
	let cancelled = false;

	let resolveFinish, rejectFinish;
	const finished = new Promise((res, rej) => {
		resolveFinish = res;
		rejectFinish = rej;
	});

	async function frame(now){
		if (cancelled) return;
		let t = (now - start) / duration;
		if (t <= 0) t = 0;
		if (t >= 1) t = 1;

		const value = from + (to - from) * t; // linear

		try {
			// await user-provided update (can be async)
			await onUpdate(value);
		} catch (err) {
			cancelled = true;
			if (rafId) cancelAnimationFrame(rafId);
			rejectFinish(err);
			return;
		}

		if (t < 1) {
			rafId = requestAnimationFrame(frame);
		} else {
			try {
				await onComplete(value);
			} catch (err) {
				// ignore or propagate — here we resolve first then optionally reject
			}
			resolveFinish(value);
		}
	}

	// handle zero/negative duration immediately
	if (duration <= 0) {
		(async () => {
			try {
				await onUpdate(to);
				await onComplete(to);
				resolveFinish(to);
			} catch (err) {
				rejectFinish(err);
			}
		})();
		return {
			cancel: () => { cancelled = true; if (rafId) cancelAnimationFrame(rafId); },
			finished
		};
	}

	rafId = requestAnimationFrame(frame);

	return {
		cancel: () => { cancelled = true; if (rafId) cancelAnimationFrame(rafId); },
		finished
	};
}


const avgCalc = function(){
	let n = 0;
	let mean = 0;
	return {
		add(x) {
			n++;
			const delta = x - mean;
			mean += delta / n;
		},
		get() {
			return n === 0 ? NaN : mean;
		}
	};
}


const fastXPATH = async function(query){
	let CMDResult = SYS_DATA.VMIXTCP.runCMD(
		'XMLTEXT',
		query
	);

	CMDResult = await CMDResult.result();

	CMDResult = [
		CMDResult.VMIXOK,
		CMDResult.payload,
	]

	return CMDResult
}



const ADVSlider = class{
	constructor(params){
		const self = ksys.util.nprint(
			ksys.util.cls_pwnage.remap(this),
			'#46F4EE',
		);

		self.srcInputDOM = params.srcInputDOM;
		self.fillDOM = params.fillDOM;
		self.phantomDOM = params.phantomDOM;
		self.markerDOM = params.markerDOM;
		self.valDispayDOM = params.valDispayDOM;

		self.vertical = !!params.srcInputDOM.closest('[vertical]');

		self.srcInputDOM.oninput = self.redraw;

		self.changeCallback = params.changeCallback;
		self.srcInputDOM.onchange = self.runChangeCallback;

		self.lastValue = self.srcInputDOM.value;

		self.inputMin = int(
			self.srcInputDOM.getAttribute('min') || 0
		);
		self.inputMax = int(
			self.srcInputDOM.getAttribute('max') || 100
		);

		self.displayType = params.displayType;

		self.inputCallbackPostDraw = params.callbackPostDraw;
		self.inputCallbackPreDraw = params.callbackPreDraw;
		self.inputCallbackChange = params.callbackChange;

		self.redraw(false);
	}


	// Extra bar
	phantomVis(self, state){
		if (self.phantomDOM){
			self.phantomDOM.classList.toggle('kbsys_hidden', !state);
		}
	}

	phantomSet(self, val){
		if (self.phantomDOM){
			const targetParam = self.vertical ? 'height' : 'width';
			self.phantomDOM.style[targetParam] = `${val * 100}%`;
		}
	}


	// Marker
	markerVis(self, state){
		if (self.markerDOM){
			self.markerDOM.classList.toggle('kbsys_hidden', !state);
		}
	}

	markerSet(self, val){
		if (self.markerDOM){
			const targetParam = self.vertical ? 'bottom' : 'left';
			self.markerDOM.style[targetParam] = `${val}%`;
		}
	}

	markerText(self, val){
		if (self.markerDOM){
			self.markerDOM.querySelector('.marker_text').textContent = val;
		}
	}


	// General
	runChangeCallback(self, evt){
		self?.changeCallback?.(self.val, evt);
		self.lastValue = self.srcInputDOM.value;
	}

	setValue(self, val){
		// self.nprint(val);
		self.srcInputDOM.value = val * self.inputMax;
		self.lastValue = self.srcInputDOM.value;
		self.redraw(false);
	}

	tweakValue(self, val){
		const newVal = ksys.util.clamp(
			int(self.srcInputDOM.value) + val,
			self.inputMin,
			self.inputMax
		);
		// self.nprint(newVal)
		self.srcInputDOM.value = newVal;
		self.redraw(false);
	}

	$val(self){
		return self.srcInputDOM.value / self.inputMax;
	}

	redraw(self, runCallback=true){
		// let fac = self.srcInputDOM.value / self.inputMax;

		if (runCallback){
			self.inputCallbackPreDraw?.(self.val);
		}

		const fac = self.val;

		const targetParam = self.vertical ? 'height' : 'width';

		self.fillDOM.style[targetParam] = `${fac * 100}%`;

		if (self.displayType == 'fac'){
			self.valDispayDOM.textContent = fac.toFixed(2);
		}
		if (self.displayType == 'perc'){
			self.valDispayDOM.textContent = int(fac * 100);
		}

		if (runCallback){
			self.inputCallbackPostDraw?.(fac);
		}
	}
}



const VolumeMeter = class{
	constructor(params){
		const self = ksys.util.nprint(
			ksys.util.cls_pwnage.remap(this),
			'#74BCFF',
		);

		self.tplates = ksys.tplates.sys_tplates.audio_mixer;

		self.VMIXTCP =     params.VMIXTCP;
		self.fastXPATH =   params.fastXPATH;

		self.valSelector = params.valSelector;

		self._DOM = null;
	}

	convertVMIXVol(self, asMono, val){
		for (const idx of range(0, 101)){
			const dictVal = (asMono ? VOL_DICT_MONO : VOL_DICT)[idx];

			if (val >= dictVal){
				continue
			}

			return (idx - 1) / 100
		}

		return 1.0
	}

	async update(self){
		const val = self.convertVMIXVol(true,
			float((await fastXPATH(self.valSelector))[1])
		)

		self.DOM.index.fill.style.transform = `scaleX(${1.0 -val})`;
	}

	$DOM(self){
		if (self._DOM){
			return self._DOM
		}

		self._DOM = self.tplates.audio_meter({
			'fill': '.fill',
		})

		return self._DOM
	}
}



const VolumeSlider = class{

	PAUSE_HOLD_MS = 500;

	constructor(params){
		const self = ksys.util.nprint(
			ksys.util.cls_pwnage.remap(this),
			'#74BCFF',
		);

		self.tplates = ksys.tplates.sys_tplates.audio_mixer;

		self.VMIXTCP =      params.VMIXTCP;
		self.fastXPATH =    params.fastXPATH;

		self.adv =          params.adv;
		self.valSelector =  params.valSelector;
		self.monoConvert =  params.monoConvert;
		self.label =        params.label;
		self.volSetCMDID =  params.volSetCMDID;
		self.uid =          params.uid;
		self.defaultValue = params.defaultValue;

		self.animating = false;

		self.pauseTimeoutHandler = null;

		self._pauseUpdates = false;

		self._DOM = null;
		self._slider = null;
	}

	convertVMIXVol(self, asMono, val){
		for (const idx of range(0, 101)){
			const dictVal = (asMono ? VOL_DICT_MONO : VOL_DICT)[idx];

			if (val >= dictVal){
				continue
			}

			return (idx - 1) / 100
		}

		return 1.0
	}

	async update(self){
		if (!self.pauseUpdates && self.valSelector){
			self.slider.setValue(self.convertVMIXVol(self.monoConvert,
				float((await fastXPATH(self.valSelector))[1])
			))
		}
	}

	async pushCurrentValueToVMIX(self){
		const CMDResult = SYS_DATA.VMIXTCP.runCMD(self.volSetCMDID, {
			'Input': self.uid,
			'Value': int(self.slider.val * 100),
		});
		return (
			await CMDResult.result()
		)
	}

	callbackPostDraw(self, fac){
		const valPre = self.slider.lastValue;
		const valPost = int(fac * 100);
		if (valPost > valPre){
			self._slider.markerText(
				`${valPre} + ${str(valPost - valPre).padEnd(2)}`
			)
		}else{
			self._slider.markerText(
				`${valPre} - ${str(valPre - valPost).padEnd(2)}`
			)
		}
	}

	callbackPreDraw(self){
		if (self.animating){
			self.slider.srcInputDOM.value = self.slider.lastValue;
		}
	}

	changeCallback(self, fac, evt){
		self.animating = true;
		self.pauseUpdates = true;
		self.DOM.root.classList.add('kbsys_locked');
		animateLinearAwait({
			'from':     int(self.slider.lastValue),
			'to':       int(fac * 100),
			'duration': SYS_DATA.fadeDur,
			'onUpdate': async function(val){
				self.pauseUpdates = true;
				let CMDResult = SYS_DATA.VMIXTCP.runCMD(self.volSetCMDID, {
					'Input': self.uid,
					'Value': int(val),
				});

				await CMDResult.result()

				self.slider.setValue(val / 100);
			},
			'onComplete': function(){
				self.pauseUpdates = false;
				self.animating = false;
				self.DOM.root.classList.remove('kbsys_locked');
			}
		})
	}

	$pauseUpdates(self){
		return self._pauseUpdates
	}

	$$pauseUpdates(self, state){
		if (state){
			clearTimeout(self.pauseTimeoutHandler);
			self.DOM.index.pause_icon.classList.remove('kbsys_hidden');
			self._pauseUpdates = true;
		}else{
			clearTimeout(self.pauseTimeoutHandler);
			self.pauseTimeoutHandler = setTimeout(function(){
				self.DOM.index.pause_icon.classList.add('kbsys_hidden');
				self._pauseUpdates = false;
			}, self.PAUSE_HOLD_MS)
		}
	}

	$DOM(self){
		if (self._DOM){
			return self._DOM
		}

		self._DOM = self.tplates.vol_slider_instance({
			'tgt_input':    'input',
			'fill':         '.slider_fill_main',
			'phantom_fill': '.slider_fill_phantom',
			'marker':       '.marker',
			'val_display':  '.val_display',
			'chan_label':   '.chan_label',
			'pause_icon':   '.pause_icon',
		});

		self._DOM.index.chan_label.textContent = self.label;

		if (!self.valSelector){
			self.slider.setValue(
				self.convertVMIXVol(true, self.defaultValue)
			);
		}



		self._DOM.root.appendTo = function(target){
			target.append(self._DOM.root);

			self._DOM.index.tgt_input.onmousedown = function(){
				self.slider.markerSet(self.slider.lastValue);
				self.slider.markerText(self.slider.lastValue);
				self.slider.markerVis(true);
				self.pauseUpdates = true;
			}
			self._DOM.index.tgt_input.onmouseup = function(){
				if (self.animating){
					self.slider.markerVis(false);
					self.pauseUpdates = false;
				}
			}
			self._DOM.index.tgt_input.oncontextmenu = function(evt){
				evt.preventDefault();
			}

			// self._DOM.root.addEventListener('mouseover', function(evt){
			self._DOM.root.onmouseover = function(evt){
				SYS_DATA.targetSlider = self;
				if (evt.altKey){
					self.pauseUpdates = true;
				}
			}

			// self._DOM.root.addEventListener('mouseleave', function(evt){
			self._DOM.root.onmouseleave = function(evt){
				SYS_DATA.targetSlider = null;
				self.slider.markerVis(false);
				self.slider.srcInputDOM.blur();
				self.pauseUpdates = false;
			}

			// self._DOM.index.tgt_input.addEventListener('wheel', async function(evt){
			self._DOM.index.tgt_input.onmousewheel = async function(evt){
				if (!evt.altKey){return};
				evt.preventDefault();
				const fac = SYS_DATA.doubleSpeed ? 2 : 1;
				self.slider.tweakValue(
					(1 > evt.wheelDelta) ? (fac * -1) : fac
				)

				await self.pushCurrentValueToVMIX();
			}
		}

		return self._DOM
	}

	$slider(self){
		if (self._slider){
			return self._slider
		}

		self._slider = new ADVSlider({
			'srcInputDOM':      self.DOM.index.tgt_input,
			'fillDOM':          self.DOM.index.fill,
			'phantomDOM':       self.DOM.index.phantom_fill,
			'markerDOM':        self.DOM.index.marker,
			'valDispayDOM':     self.DOM.index.val_display,
			'displayType':      'perc',

			'callbackPostDraw': self.callbackPostDraw,
			'callbackPreDraw':  self.callbackPreDraw,
			'changeCallback':   self.changeCallback,
		});

		return self._slider
	}
}



const VolumeControlMirror = class{
	CHAN_COUNT_DICT = {
		'30': 2,
		'31': 2,
		'32': 2,
		'33': 2,
		'50': 2,
		'51': 2,
		'40': 2,
		'41': 2,

		'36': 8,
		'42': 8,

		30:   2,
		31:   2,
		32:   2,
		33:   2,
		50:   2,
		51:   2,
		40:   2,
		41:   2,

		36:   8,
		42:   8,
	}

	constructor(params){
		const self = ksys.util.nprint(
			ksys.util.cls_pwnage.remap(this),
			'#74BCFF',
		);

		self.tplates = ksys.tplates.sys_tplates.audio_mixer;

		self._active = false;

		self.mirrorMain = params.mirrorMain;

		self.rootSelector =  params.rootSelector;
		self.labelSelector = params.labelSelector;

		self.chanCountOverride = params.chanCountOverride;

		self.bus =      params.bus;
		self.isMaster = params.isMaster;

		self.sliderArray = [];
		self.advSliderArray = [];
		self.meterArray = [];

		self._DOM = null;
		self._pickerDOM = null;
	}

	$active(self){
		return self._active
	}

	$$active(self, state){
		self._active = Boolean(state);

		self.DOM.then(async function(anodeDOM){
			const pickerDOM = await self.pickerDOM;
			if (state){
				anodeDOM.root.appendTo(
					self.mirrorMain.DOM.index.active_anodes
				)
				pickerDOM.root.classList.add('active');
			}else{
				pickerDOM.root.classList.remove('active');
				anodeDOM.root.remove();
			}
		})
	}

	async isMonoSeparate(self){
		return (
			!(await fastXPATH(`${self.rootSelector}/@volumeF1`))
			.includes(false)
			&&
			!(await fastXPATH(`${self.rootSelector}/@volumeF2`))
			.includes(false)
		)
	}

	async countChannels(self){
		if (self.chanCountOverride){
			return self.chanCountOverride
		}

		const uid = await self.pullUID();
		if (!uid){
			return [
				1.0,
				1.0,
			]
		}

		const chanConfig = [];

		const presetXML = await vmix.talker.presetXML();
		const tgtDOM = presetXML.querySelector(`[Key="${uid}"]`);

		if (tgtDOM.getAttribute('Type') == '0'){
			const msg = await ksys.KBNClient.runCMD('ffprobe', {
				'payload': tgtDOM.textContent,
			})

			for (const stream of JSON.parse((await msg.result()).payload).streams){
				if (stream.codec_type == 'audio'){
					return [...range(stream.channels)].map(function(chanIDX){
						return tgtDOM.getAttribute(`ChannelVolumeF${chanIDX+1}`) || 1.0
					})
				}
			}

			return [1.0, 1.0]
		}

		const chanCount = self.CHAN_COUNT_DICT[
			tgtDOM.getAttribute('CaptureAudioInput')
		] || 2

		for (const chanIDX of range(chanCount)){
			chanConfig.push(float(
				tgtDOM.getAttribute(`ChannelVolumeF${chanIDX+1}`) || 1.0
			))
		}

		return chanConfig
	}

	async pullUID(self){
		const [VMIXOK, UID] = await fastXPATH(`${self.rootSelector}/@key`);
		return (
			VMIXOK ? UID : null
		)
	}

	async update(self){
		const DOM = await self.DOM;

		const [exists] = await fastXPATH(self.rootSelector);
		if (!exists){
			DOM.root.classList.add('missing');
			DOM.root.classList.add('kbsys_locked');
			return
		}else{
			DOM.root.classList.remove('missing');
			DOM.root.classList.remove('kbsys_locked');
		}

		for (const slider of self.sliderArray){
			if (!slider.adv){
				await slider.update();
			}
		}
		for (const meter of self.meterArray){
			await meter.update();
		}

		let label = null;
		if (!self.bus && !self.isMaster){
			label = (await fastXPATH(self.labelSelector))[1];
		}
		if (self.bus){
			label = `BUS  ${self.bus.id}`;
		}
		if (self.isMaster){
			label = 'MASTER';
		}

		DOM.index.name_label.textContent = label;
		(await self.pickerDOM).index.name.textContent = label;
	}

	updateAdvancedSlider(self, sliderIDX, val){
		const sliderData = self.advSliderArray[sliderIDX];
		if (!sliderData.pauseUpdates){
			sliderData.slider.setValue(
				sliderData.convertVMIXVol(true, val)
			);
		}
	}

	async $DOM(self){
		if (self._DOM){
			return self._DOM
		}

		const isMonoSeparate = await self.isMonoSeparate();
		const UID = await self.pullUID();

		// 
		// Volume Sliders
		// 
		if (isMonoSeparate){
			self.sliderArray.push(new VolumeSlider({
				'valSelector': `${self.rootSelector}/@volumeF1`,
				'monoConvert': true,
				'label':       'L',
				'volSetCMDID': 'SetVolumeChannel1',
				'uid':         UID,
			}))
			self.sliderArray.push(new VolumeSlider({
				'valSelector': `${self.rootSelector}/@volumeF2`,
				'monoConvert': true,
				'label':       'R',
				'volSetCMDID': 'SetVolumeChannel2',
				'uid':         UID,
			}))
		}else{
			let setVolCMD = 'SetVolume';
			if (self.bus){
				setVolCMD = `SetBus${self.bus.id}Volume`;
			}
			if (self.isMaster){
				setVolCMD = 'SetMasterVolume';
			}

			self.sliderArray.push(new VolumeSlider({
				'valSelector': `${self.rootSelector}/@volume`,
				'monoConvert': false,
				'label':       'ALL',
				'volSetCMDID': setVolCMD,
				'uid':         UID,
			}))
		}

		if (!self.bus && !self.isMaster){
			const channelDefaults = await self.countChannels();
			let idx = 0;
			for (const defaultValue of channelDefaults){
				idx += 1;
				self.advSliderArray.push(new VolumeSlider({
					'valSelector':  null,
					'monoConvert':  false,
					'defaultValue': defaultValue,
					'label':        `CH  ${idx}`,
					'volSetCMDID':  `SetVolumeChannelMixer${idx}`,
					'uid':          UID,
					'adv':          true,
				}))
			}
		}

		self._DOM = self.tplates.volume_slider({
			'slider_array': '.master_sliders',
			'name_label':   '.slider_label',
			'adv_sliders':  '.adv_sliders',
			'meter_array':  '.meters',
		})

		const DOMIDX = self._DOM.index;
		const DOMRoot = self._DOM.root;

		if (self.bus || self.isMaster){
			DOMRoot.classList.add('no_adv');
		}

		// 
		// Volume Meters
		// 
		for (const idx of range(2)){
			const meter = new VolumeMeter({
				'valSelector': `${self.rootSelector}/@meterF${idx + 1}`,
			})

			self.meterArray.push(meter);

			DOMIDX.meter_array.append(meter.DOM.root);
		}

		DOMRoot.appendTo = function(target){
			target.append(self._DOM.root);

			for (const slider of self.sliderArray){
				if (slider.adv){
					slider.DOM.root.appendTo(DOMIDX.adv_sliders);
				}else{
					slider.DOM.root.appendTo(DOMIDX.slider_array);
				}
			}

			for (const slider of self.advSliderArray){
				slider.DOM.root.appendTo(DOMIDX.adv_sliders);
			}
		}

		return self._DOM
	}

	async $pickerDOM(self){
		if (self._pickerDOM){
			return self._pickerDOM
		}

		self._pickerDOM = self.tplates.anode_picker_item({
			'icon': '.icon',
			'name': '.name',
		})

		const DOMIDX = self._pickerDOM.index;
		const DOMRoot = self._pickerDOM.root;

		if (self.bus){
			DOMIDX.icon.src = './assets/sliders_icon.svg';
		}

		if (self.isMaster){
			DOMIDX.icon.src = './assets/bus_master.svg';
		}

		if (!self.bus && !self.isMaster){
			DOMIDX.icon.src = ksys.visual_basic.ICON_DICT[
				(await fastXPATH(`${self.rootSelector}/@type`)).pop().lower()
			]
		}

		DOMRoot.onclick = function(){
			const state = !self.active;
			self.active = state;
			self.mirrorMain.selectionArray.delete(self);
			if (state){
				self.mirrorMain.selectionArray.add(self);
			}
			self.mirrorMain.saveConfig();
		}

		await self.update();

		return self._pickerDOM
	}
}



const AudioMixerMirror = class{

	BUS_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

	TCP_TIMEOUT_MS = 3500;
	SLEEP_TIME = 1000;

	UPDATES_PER_SECOND = 24;

	CFG_FNAME = 'audio_mixer.base_cfg.kbcfg'

	constructor(params){
		const self = ksys.util.nprint(
			ksys.util.cls_pwnage.remap(this),
			'#74BCFF',
		);

		self.active = true;

		self.cfg = {};

		self.tplates = ksys.tplates.sys_tplates.audio_mixer;

		self.CTRLArrayDOM = params.CTRLArrayDOM;
		self.VMIXTCP =      params.VMIXTCP;

		self.targetSlider = null;

		self.busArray = [];
		self.inputsDict = {};

		self.selectionArray = new Set();

		self._DOM = null;
	}

	timeoutReset(self){
		self?.timeoutAnim?.cancel?.();
		self.timeoutAnim = animateLinear({
			'from': 100,
			'to': 0,
			'duration': self.TCP_TIMEOUT_MS,
			'onUpdate': function(val){
				self.DOM.index.timeout_vis.style.transform = `scaleX(${val/100})`;
				if (val < 50){
					self.DOM.index.timeout_icon.style.display = null;
					self.DOM.index.timeout_icon.style.opacity = str(
						(50 - val) / 50
					);
				}else{
					self.DOM.index.timeout_icon.style.opacity = 0;
					self.DOM.index.timeout_icon.style.display = 'none';
				}
			}
		})

		return setTimeout(function(){
			if (!self.active){return};
			self.nerr('TCP Got stuck');
			self?.VMIXTCP?.currentCMD?.abort?.();
		}, self.TCP_TIMEOUT_MS);
	}

	timeoutStop(self, timeoutHandle){
		clearTimeout(timeoutHandle);
		self?.timeoutAnim?.cancel?.();
		self.DOM.index.timeout_vis.style.transform = 'scaleX(1)';
		self.DOM.index.timeout_icon.style.opacity = 0;
	}

	async spawnMirror(self, isBus, mirrorParams){
		mirrorParams['mirrorMain'] = self;

		const anode = new VolumeControlMirror(mirrorParams);

		if (isBus){
			self.busArray.push(anode);
		}else{
			self.inputsDict[mirrorParams.uid] = anode;
		}

		self.DOM.index.anode_picker.append(
			(await anode.pickerDOM).root
		)
	}

	async fastXPATH(self, query){
		let CMDResult = self.VMIXTCP.runCMD(
			'XMLTEXT',
			query
		);

		CMDResult = await CMDResult.result();

		CMDResult = [
			CMDResult.VMIXOK,
			CMDResult.payload,
		]

		return CMDResult
	}

	async createBuses(self){
		await self.spawnMirror(true, {
			'rootSelector': `//audio/master`,
			'labelSelector': null,
			'isMaster':      true,
		})

		for (const busID of self.BUS_LETTERS){
			const [busExists, _] = await self.fastXPATH(`//audio/bus${busID}`);
			if (!busExists){continue};

			await self.spawnMirror(true, {
				'rootSelector':  `//audio/bus${busID}`,
				'labelSelector': null,
				'isMaster':      false,
				'bus': {
					'id': busID
				},
			})
		}
	}

	async createInputs(self){
		let idx = 0;
		while (true){
			idx += 1;

			const [inputExists] = await self.fastXPATH(
				`//input[@number="${idx}"]`
			);
			if (!inputExists){break};

			const [inputHasVolCtrl, inputUID] = await self.fastXPATH(
				`//input[@number="${idx}"][@volume]/@key`
			);
			if (!inputHasVolCtrl){continue};

			await self.spawnMirror(false, {
				'rootSelector':  `//input[@key="${inputUID}"]`,
				'labelSelector': `//input[@key="${inputUID}"]/@title`,
				'isMaster':      false,
				'uid':           inputUID,
			})
		}
	}

	async activatorCallback(self, activatorData){
		if (activatorData.includes('InputVolumeChannelMixer')){
			const [cmdID, inputIDX, vol] = activatorData.split(' ');
			const channelIDX = int(cmdID.at(-1)) - 1;

			const [,UID] = await fastXPATH(
				`//input[@number="${inputIDX}"]/@key`
			)

			self.inputsDict[UID].updateAdvancedSlider(
				channelIDX,
				float(vol)
			)
		}
	}

	async init(self){
		// self.CTRLArrayDOM.innerHTML = '';

		await savePreset();

		await self.createBuses();
		await self.createInputs();

		self.nprint(await self.VMIXTCP.subscribeActivators(
			self.activatorCallback,
			false
		));

		document.addEventListener('keydown', function(evt){
			if (evt.code == 'Backquote'){
				SYS_DATA.doubleSpeed = true;
			}

			if (evt.altKey && SYS_DATA.targetSlider){
				SYS_DATA.targetSlider.pauseUpdates = true;
			}
		})

		document.addEventListener('keyup', function(evt){
			if ((evt.key == 'Alt') && SYS_DATA.targetSlider){
				SYS_DATA.targetSlider.pauseUpdates = false;
			}

			if (evt.code == 'Backquote'){
				SYS_DATA.doubleSpeed = false;
			}
		})
	}

	async renderUpdates(self, renderTimesDisplayDOM=null){
		const executionTimes = [];

		let mean = avgCalc();

		let sleep = false;

		while (self.VMIXTCP.enabled){
			await ksys.util.sleep(
				1000 / self.UPDATES_PER_SECOND
			);

			if (!self.active){return};

			const timeStart = (new Date()).getTime();

			const timeoutHandle = self.timeoutReset();

			try{
				if (self.stall){
					await ksys.util.sleep(self.TCP_TIMEOUT_MS * 2);
				}

				sleep = true;

				for (const busData of self.busArray){
					if (busData.active){
						sleep = false;
						await busData.update();
					}
				}

				for (const inputData of Object.values(self.inputsDict)){
					if (inputData.active){
						sleep = false;
						await inputData.update();
					}
				}

				self.timeoutStop(timeoutHandle);
			}catch(e){
				await ksys.util.sleep(250);
				console.error(e);
			}

			const timeElapsed = (new Date()).getTime() - timeStart;

			if (sleep){
				await ksys.util.sleep(self.SLEEP_TIME);
			}

			if (!renderTimesDisplayDOM){continue};

			if (executionTimes.length > (self.UPDATES_PER_SECOND * 15)){
				executionTimes.length = 0;
				mean = avgCalc();
			}

			executionTimes.push(timeElapsed);
			mean.add(timeElapsed);

			const textRows = [
				`Exec:  ${str(timeElapsed).padEnd(5)}`,
				`Max:   ${str(Math.max(...executionTimes)).padEnd(5)}`,
				`Min:   ${str(Math.min(...executionTimes)).padEnd(5)}`,
				`Avg:   ${str(int(mean.get())).padEnd(5)}`,
				`FPS:   ${str(int(1000 / timeElapsed) || '1000+').padEnd(5)}`,
				`TFPS:  ${self.UPDATES_PER_SECOND}`,
				`SLEEP: ${sleep ? 'T' : 'F'}`,
			]

			renderTimesDisplayDOM.textContent = textRows.join('\n');
		}
	}

	async terminate(self){
		self.active = false;
		await self?.VMIXTCP?.terminate?.();
	}

	devStall(self){
		self.stall = true;
	}

	async saveConfig(self){
		const selection = [];

		for (const anode of self.selectionArray){
			selection.push({
				'isMaster': anode.isMaster,
				'bus':      anode.bus,
				'uid':      (!anode.isMaster && !anode.bus) ? await anode.pullUID() : null,
			})
		}

		/*
		for (const anode of [...self.busArray]){
			if (anode.active){
				selection.push({
					'isMaster': anode.isMaster,
					'bus':      anode.bus,
				})
			}
		}

		for (const [uid, anode] of Object.entries(self.inputsDict)){
			if (anode.active){
				selection.push({
					'isMaster': false,
					'bus':      null,
					'uid':      uid,
				})
			}
		}
		*/

		ksys.db.global.write(self.CFG_FNAME, JSON.stringify({
			'fps': self.UPDATES_PER_SECOND,
			'fade_dur': SYS_DATA.fadeDur,
			'selection': selection,
		}));
	}

	loadConfig(self){
		const config = ksys.db.global.read(self.CFG_FNAME, 'json');
		if (!config){return};

		self.UPDATES_PER_SECOND = config.fps || 11;
		self.switchFPS.selected = self.UPDATES_PER_SECOND;
		SYS_DATA.fadeDur = config.fade_dur || 1000;
		self.DOM.index.inp_fade_dur.value = SYS_DATA.fadeDur;

		for (const anode of (config.selection || [])){
			if (anode.isMaster){
				self.nprint('????????', self.busArray)
				self.busArray[0].active = true;
				self.selectionArray.add(self.busArray[0]);
				continue
			}
			if (anode.bus){
				for (const busAnode of self.busArray){
					if (busAnode.isMaster){continue};
					if (busAnode.bus.id == anode.bus.id){
						busAnode.active = true;
						self.selectionArray.add(busAnode);
					}
				}
				continue
			}

			if (self.inputsDict[anode.uid]){
				self.inputsDict[anode.uid].active = true;
				self.selectionArray.add(
					self.inputsDict[anode.uid]
				);
			}
		}
	}

	$switchFPS(self){
		if (self._switchFPS){
			return self._switchFPS
		}

		self._switchFPS = new ksys.switches.KBSwitch({
			'multichoice':  false,
			'can_be_empty': false,
			'set_default':  self.UPDATES_PER_SECOND,
			'dom_array': [
				{
					'id':  3,
					'dom': self.DOM.index.switch_fps.querySelector('[fps="3"]'),
				},
				{
					'id':  11,
					'dom': self.DOM.index.switch_fps.querySelector('[fps="11"]'),
				},
				{
					'id':  24,
					'dom': self.DOM.index.switch_fps.querySelector('[fps="24"]'),
				},
				{
					'id':  30,
					'dom': self.DOM.index.switch_fps.querySelector('[fps="30"]'),
				},
			],
			'callback': function(kbswitch, fps){
				self.UPDATES_PER_SECOND = fps;
				self.saveConfig();
			}
		});

		return self._switchFPS
	}

	$DOM(self){
		if (self._DOM){
			return self._DOM
		}

		self._DOM = self.tplates.audio_mixer({
			'btn_resync':       '.cfg_btn.resync',
			'btn_terminate':    '.cfg_btn.terminate',
			'btn_deselect_all': '.cfg_btn.deselect_all',

			'inp_fade_dur':  '.fade_dur',

			'switch_fps':    '.fps_switch',

			'active_anodes': '.active_anodes',
			'anode_picker':  '.anode_picker',

			'timeout_vis':   '.timeout_indicator_fill',
			'timeout_icon':  '.warn_triangle',
		})

		const DOMIDX = self._DOM.index;
		const DOMRoot = self._DOM.root;

		DOMIDX.btn_terminate.onclick = self.terminate;
		DOMIDX.btn_resync.onclick = async function(){
			await resync(true);
			SYS_DATA.mixer.DOM.root.appendTo(
				qsel('audio-mixer-mirror')
			)
		};

		DOMIDX.btn_deselect_all.onclick = function(){
			for (const anode of [...self.busArray, ...Object.values(self.inputsDict)]){
				anode.active = false;
				self.selectionArray.delete(anode);
			}
			self.saveConfig();
		};

		DOMRoot.appendTo = async function(tgt){
			tgt.append(DOMRoot);
			for (const anode of [...self.busArray, ...Object.values(self.inputsDict)]){
				DOMIDX.anode_picker.append(
					(await anode.pickerDOM).root
				)
			}
		}

		DOMIDX.inp_fade_dur.onchange = function(){
			SYS_DATA.fadeDur = int(DOMIDX.inp_fade_dur.value) || 1000;
			DOMIDX.inp_fade_dur.value = SYS_DATA.fadeDur;
			self.saveConfig();
		}

		DOMIDX.timeout_icon.src = ksys.util.svgWithColor('warn_icon', 'red');

		return self._DOM
	}
}



const resync = async function(fullForce=false){
	if (fullForce || !SYS_DATA?.VMIXTCP?.enabled){
		await SYS_DATA?.mixer?.terminate?.();
		await SYS_DATA?.VMIXTCP?.terminate?.();

		SYS_DATA.VMIXTCP = new ksys.vmix_tcp.VMIXTCP(
			ksys.context.global.cache.vmix_ip, {
				'reconnectFail': function(){
					ksys.info_msg.send_msg(
						'Failed to reconnect',
						'warn',
						6000
					);
				},
				'reconnectOk': function(headerData){
					ksys.info_msg.send_msg(
						`Connection restored: ${headerData}`,
						'ok',
						6000
					);
				},
				'permaDeath': function(reason){
					ksys.info_msg.send_msg(
						`Dead forever, because: ${reason}`,
						'err',
						6000
					);
				},
			}
		)

		SYS_DATA.VMIXTCP.maintainConnection();

		ksys.info_msg.send_msg(
			await SYS_DATA.VMIXTCP.connection(),
			'ok',
			6000
		);
	}

	if (SYS_DATA.mixer){
		SYS_DATA.mixer.active = false;
		SYS_DATA.mixer.DOM.root.remove();
	}

	SYS_DATA.mixer = new AudioMixerMirror({
		'VMIXTCP': SYS_DATA.VMIXTCP,
	});

	await SYS_DATA.mixer.init();

	SYS_DATA.mixer.renderUpdates(
		qsel('#volume_ctrl_debug')
	);

	SYS_DATA.mixer.loadConfig();
}



const ___m_init = async function(){
	if (!SYS_DATA.mixer){
		await ksys?.KBNClient?.connectionPromise;
		await resync();
	}

	if (qsel('audio-mixer-mirror')){
		SYS_DATA.mixer.DOM.root.appendTo(
			qsel('audio-mixer-mirror')
		)
	}
}


const m_init = async function(){
	const ctrlPanel = qsel('audio-mixer-mirror');
	if (!ctrlPanel){return};

	if (!SYS_DATA.mixer){
		await ksys?.KBNClient?.connectionPromise;
		await resync();
	}

	SYS_DATA.mixer.DOM.root.appendTo(
		ctrlPanel
	)
}



module.exports = {
	m_init,
	SYS_DATA,
}