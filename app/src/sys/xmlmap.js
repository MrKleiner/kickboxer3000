class xmlmap
{
	constructor(map_elem, xmlsrc){
		this.xmlsrc = xmlsrc;
		// map element as jquery object
		this.jqmap_elem = $(map_elem);
		// map element as pure javascript element
		this.map_elem = this.jqmap_elem[0];

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

	// refresh info
	visrefresh(){
		if (el.closest('xmlmap') == null || info == null){
			return null
		}

		// wipe previous stuff
		el.innerHTML = '';

		for (var resync of info){
			el.append(lizard.ehtml(`
				<entry init>
					<input special type="text" placeholder="Special" value="${resync['special'] || ''}">

					<from>
						<inf>From</inf>
						<input spellcheck="false" type="text" value="${resync['from'].trim() || ''}">
						<val from>nil</val>
					</from>

					<between></between>

					<to>
						<inf>To</inf>
						<input spellcheck="false" type="text" value="${resync['to'].trim() || ''}">
						<val to>nil</val>
					</to>
				</entry>
			`))
		}
	}

	// reload xml data
	async reload_xml(){
		const load_xml = await ksys.url_get(this.xmlsrc);
		return load_xml
	}

	* pipe(){

	}

}