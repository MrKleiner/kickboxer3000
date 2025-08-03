




const TitleSequenceItem = class{
	constructor(seq, data){
		const self = ksys.util.nprint(
			ksys.util.cls_pwnage.remap(this),
			'#F68DFF',
		);

		self.tplates = ksys.tplates.sys_tplates.sequencing;

		self.seq = seq;

		// self.seq_id = data.seq_id;

		self._dom = null;

		self._dur = 0;
		self._item_id = null;

		self.dur = data.dur;
		self.item_id = data.item_id;
	}

	$dur(self){
		return self._dur || 0
	}

	$$dur(self, dur){
		self._dur = int(dur) || 0;
		self.dom.index.dur.value = self._dur;
	}

	$item_id(self){
		return self._item_id
	}

	$$item_id(self, tgt_id){
		self.dom.index.item_id.textContent = tgt_id;
		self._item_id = tgt_id;
	}

	$dom(self){
		if (self._dom){
			return self._dom
		}

		self._dom = self.tplates.sequence_item({
			'item_id': '.seq_item_param .item_id',
			'dur':     '.seq_item_param.item_dur input',
		})

		self._dom.index.dur.onchange = function(){
			self.dur = self._dom.index.dur.value;
			self.seq.sequencer.save();
		}

		return self._dom
	}

	to_json(self){
		return {
			'item_id': self.item_id,
			'dur': self.dur,
		}
	}
}




const TitleSequence = class{
	constructor(sequencer, data){
		const self = ksys.util.nprint(
			ksys.util.cls_pwnage.remap(this),
			'#C4FF51',
		);

		self.tplates = ksys.tplates.sys_tplates.sequencing;

		self.nprint('Spawning sequence', data);

		self.sequencer = sequencer;

		self._dom = null;

		self._seq_id = '';

		self.items = {};

		for (const seq_item of Object.entries(data.seq_items)){
			const [seq_id, dur] = seq_item;

			self.items[seq_id] = (
				new TitleSequenceItem(self, {
					'dur': dur,
					'item_id': seq_id,
				})
			)

			self.dom.index.item_pool.append(
				self.items[seq_id].dom.root
			)
		}

		self.sequencer.dom.index.seq_pool.append(self.dom.root)

		self.seq_id = data.seq_id;
	}

	$seq_id(self){
		return self._seq_id;
	}

	$$seq_id(self, tgt_id){
		self.dom.index.seq_id.textContent = tgt_id;
		self._seq_id = tgt_id;
	}

	$sum(self){
		let sum = 0;
		for (const i of Object.values(self.items)){
			sum += i.dur;
		}

		return sum;
	}

	$dom(self){
		if (self._dom){
			return self._dom
		}

		self._dom = self.tplates.sequence({
			'seq_id': '.seq_param .seq_id',
			'item_pool': '.seq_items_pool',
		})

		return self._dom
	}

	to_json(self){
		const data = {
			'seq_id': self.seq_id,
			'seq_items': {},
		};
		for (const seq_item of Object.entries(self.items)){
			const [seq_id, seq_data] = seq_item;

			data.seq_items[seq_id] = seq_data.to_json();
		}

		return data
	}
}





const TitleSequencer = class{
	CFGFILE_NAME = 'sequencer.kbcfg';

	constructor(schema){
		const self = ksys.util.nprint(
			ksys.util.cls_pwnage.remap(this),
			'#77FF69',
		);

		self.nprint('Input schema:', schema)

		self.tplates = ksys.tplates.sys_tplates.sequencing;

		self.schema = schema;

		self._dom = null;
		self._lock_timings = true;

		self.sequences = {};
	}

	$lock_timings(self){
		return self._lock_timings;
	}

	$$lock_timings(self, state){
		self._lock_timings = Boolean(state);
		self.dom.index.lock_timings_cbox.checked = Boolean(state);

		for (const seq of Object.values(self.sequences)){
			for (const seq_item of Object.values(seq.items)){
				seq_item.dom.index.dur.classList[Boolean(state) ? 'add' : 'remove']('kbsys_locked');
			}
		}
	}

	$dom(self){
		if (self._dom){
			return self._dom
		}

		self._dom = self.tplates.editor({
			'lock_timings_cbox':   '.editor_ctrl .lock_timings input',
			'seq_pool':            '.seq_pool',
		})

		self._dom.index.lock_timings_cbox.onchange = function(){
			self.lock_timings = self._dom.index.lock_timings_cbox.checked;
			self.save();
		}

		return self._dom;
	}

	save(self){
		const data = {
			'lock_timings': self.lock_timings,
			'sequences': {},
		}

		for (const seq in self.sequences){
			data.sequences[seq] = (
				self.sequences[seq].to_json()
			);
		}

		ksys.db.module.write(
			self.CFGFILE_NAME,
			JSON.stringify(data)
		);

		self.nprint('Saved', data);
	}

	load(self){
		const data = ksys.db.module.read(self.CFGFILE_NAME, 'json') || {
			'sequences': {}, 
		};

		for (const seq_data of Object.entries(self.schema)){
			const [seq_id, seq_items] = seq_data;

			self.nprint('Getting schema', seq_id, seq_items);
			self.nprint('Schema data', data.sequences[seq_id])

			for (const item_id of Object.keys(seq_items)){
				try{
					seq_items[item_id] = data.sequences[seq_id].seq_items[item_id].dur
				}catch{

				}
			}

			self.sequences[seq_id] = new TitleSequence(self, {
				'seq_id': seq_id,
				// 'seq_items': Object.assign(seq_items, data.sequences[seq_id]?.seq_items || {}),
				'seq_items': seq_items,
			})
		}

		self.lock_timings = data.lock_timings;
	}
}





module.exports = {
	TitleSequencer,
}






