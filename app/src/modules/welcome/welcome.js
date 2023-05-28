


$this.load = function(){
	ksys.pgview.show_pool()
}



$this.add_pgview_keybind = function(){
	const entry = new ksys.pgview.pgview_entry()
	print('what??', entry.bind_ctrl)
	$('#pgview_link_pool').append(entry.bind_ctrl)
}






