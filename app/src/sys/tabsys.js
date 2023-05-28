
_tabsys = {};



_tabsys.resync = function(){

	// tabs are hidden by defautl
	$('tab').addClass('tab_hidden')

	for (const tab of document.querySelectorAll('tabsys sys-tab')){
		const cfg = ksys.tplates.index_attributes(tab, ['match_id', 'default']);
		// document.querySelector(`tab[tabid="${cfg.match_id}"]`)
		tab.onclick = function(elem){
			const self_id = cfg.match_id;
			$('tab').addClass('tab_hidden')
			$('tabsys sys-tab').removeClass('active_tab')
			$(elem.target).closest('sys-tab').addClass('active_tab')
			$(`tab[tabid="${self_id}"]`).removeClass('tab_hidden')
		}
	}

	// activate default tab
	$('tabsys sys-tab[default]').click()

}













module.exports = _tabsys;
