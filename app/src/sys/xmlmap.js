class xmlmap
{
	constructor(map_elem, xmlsrc){
		this.xmlsrc = xmlsrc;
		// map element as jquery object
		this.jqmap_elem = $(map_elem);
		// map element as pure javascript element
		this.map_elem = this.jqmap_elem[0];

		this.xml_data = null;

		// actually spawn the map
		this.respawn();
	}

	// ensure that the map is initialized
	respawn(){
		for (let resync of this.map_elem.querySelectorAll('entry:not(xmlmap entry[init])')){
			if (resync.hasAttribute('init')){continue}
			// var special = resync.querySelector('')
			resync.replaceWith(lizard.ehtml(`
				<entry init>
					<input special type="text" placeholder="Special" value="${resync.getAttribute('special') || ''}">

					<from>
						<inf>From</inf>
						<input spellcheck="false" type="text" value="${resync.querySelector('from').innerText.trim()}">
						<val from>nil</val>
					</from>

					<between></between>

					<to>
						<inf>To</inf>
						<input spellcheck="false" type="text" value="${resync.querySelector('to').innerText.trim()}">
						<val to>nil</val>
					</to>
				</entry>
			`))
		}
	}

	// rip info from the map as json
	rip(){
		const map_entries = [];

		for (let entry of this.map_elem.querySelectorAll('entry'))
		{
			map_entries.push({
				'from': entry.querySelector('from input').value,
				'to': entry.querySelector('to input').value,
				'special': entry.querySelector('input[special]').value,
			})

		}
		return map_entries
	}

	// reload xml data
	async reload_xml(){
		const load_xml = ksys.util.eval_xml(await ksys.url_get(this.xmlsrc));
		this.xml_data = load_xml;
		return load_xml
	}

	// wipe from
	wipe_from(){
		this.jqmap_elem.find('from val').html('<span style="color: gray; user-select: none">empty string</span>');
	}
	// wipe to
	wipe_to(){
		this.jqmap_elem.find('to val').html('<span style="color: gray; user-select: none">empty string</span>');
	}

	* pipe(){

		const src = this.xml_data;
		const dest = this.map_elem;

		for (let entry of this.map_elem.querySelectorAll('entry')){
			let self = entry;

			var xmlsrc_text = null;

			let select_from_src = src.querySelector(self.querySelector('from input').value)
			if (select_from_src){
				xmlsrc_text = select_from_src.textContent;
			}

			yield {
				'data': xmlsrc_text,
				'target': self.querySelector('to input').value.trim(),
				'special': self.querySelector('input[special]').value,
				confirm_from: function(overwrite=null){
					self.querySelector('from val').innerHTML = overwrite || ksys.str_check(xmlsrc_text);
					self.querySelector('from inf').setAttribute('success', true);
					self.querySelector('from inf').removeAttribute('fail');
				},
				confirm_to: function(overwrite=null){
					self.querySelector('to val').innerHTML = overwrite || ksys.str_check(xmlsrc_text);
					self.querySelector('to inf').setAttribute('success', true);
					self.querySelector('to inf').removeAttribute('fail');
				},
				deny: function(reason='invalid_string'){
					self.querySelector('from val').innerHTML = ksys.str_check('', 'not found');
					self.querySelector('from inf').setAttribute('fail', true);

					self.querySelector('to val').innerHTML = ksys.str_check('');
					// self.querySelector('to inf').setAttribute('fail', true);
				}
			}

		}
	}

}