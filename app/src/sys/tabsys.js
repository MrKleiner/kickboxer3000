
const _tabsys = {};

document.addEventListener('keydown', evt => {
	return
	if (evt.repeat){return};

	if (evt.keyCode == 192 && _tabsys.quicktab){
		_tabsys.viewing_quick = true;
		_tabsys.quicktab_prev_tab = $('sys-tab.active_tab')[0]
		_tabsys.quicktab.click()
	}
});

document.addEventListener('keyup', evt => {
	return
	if (_tabsys.quicktab_prev_tab && evt.keyCode == 192){
		if (_tabsys.quicktab_prev_tab.classList.contains('active_tab')){return};
		_tabsys.quicktab_prev_tab.click()
		if (_tabsys.remember_last_scroll){$(window).scrollTop(_tabsys.remember_last_scroll)};
		_tabsys.viewing_quick = false;
	}
});

// todo: this is broken
$(window).on('scroll', function() {
	if (_tabsys.viewing_quick){return};
	_tabsys.remember_last_scroll = $(window).scrollTop()
});

_tabsys.resync = function(){

	// tabs are hidden by defautl
	$('tab').addClass('tab_hidden')

	for (const tab of document.querySelectorAll('tabsys sys-tab')){
		const cfg = ksys.tplates.index_attributes(tab, ['match_id', 'default', 'quick_access']);
		// document.querySelector(`tab[tabid="${cfg.match_id}"]`)
		tab.onclick = function(elem){
			const self_id = cfg.match_id;
			$('tab').addClass('tab_hidden')
			$('tabsys sys-tab').removeClass('active_tab')
			$(elem.target).closest('sys-tab').addClass('active_tab')
			$(`tab[tabid="${self_id}"]`).removeClass('tab_hidden')
			ksys.context.module.prm('_tabsys_active_tab_id', self_id)
		}

		if (cfg.quick_access != null){
			_tabsys.quicktab = tab;
		}
	}

	// activate default tab, if no saved tab was found
	const last_tab = ksys.context.module.prm('_tabsys_active_tab_id')
	if (last_tab){
		print('Switching to', last_tab)
		$(`tabsys sys-tab[match_id="${last_tab}"]`).click()
	}else{
		$('tabsys sys-tab[default]').click()
	}

}






module.exports = _tabsys;
