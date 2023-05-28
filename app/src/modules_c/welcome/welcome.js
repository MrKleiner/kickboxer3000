
if(!kbmodules){kbmodules={}};

if(!kbmodules.welcome){kbmodules.welcome={}};



kbmodules.welcome.load = function(){
	ksys.pgview.show_pool()
}



kbmodules.welcome.add_pgview_keybind = function(){
	const entry = new ksys.pgview.pgview_entry()
	print('what??', entry.bind_ctrl)
	$('#pgview_link_pool').append(entry.bind_ctrl)
}






