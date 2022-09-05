# I should've done this LONG ago !
import subprocess, os, shutil, sys, base64, json
from pathlib import Path

# application_path = os.path.dirname(sys.executable)
project = Path(__file__).parent.parent


# ========================================
# 			      Icon Shit
# ========================================

# magick path
magix = Path(r'C:\custom\imgmagick\magick.exe')

# rcedit path
rcedit = (project / 'install' / 'icon' / 'rcedit_simple.exe')

# Icon original image
iconsrc = (project / 'app' / 'src' / 'assets' / 'pink_panther.png')

# create 4 different versions
sizedict = [128, 64, 32, 32]
collapse = []
for sz in sizedict:
	resized_path = project / 'install' / 'icon' / 'icon_res' / ('ic_' + str(sz) + '.png')
	magix_prms = [
		str(magix),
		# input path
		str(iconsrc),
		# clamp to max size
		'-resize', str(sz),

		# output path
		str(resized_path)
	]

	# convert to required size
	print(subprocess.run(magix_prms, capture_output=True).stdout)

	collapse.append(resized_path)


#
# collapse 4 versions into one
#
collapse_prms = [
	str(magix),

	# input path
	str(collapse[0]), str(collapse[1]), str(collapse[2]), str(collapse[3]),

	# output path
	str(project / 'install' / 'icon' / 'icon_res' / 'favicon.ico')
]
print(subprocess.run(magix_prms, capture_output=True).stdout)


#
# Use rcedit to set new icon
#
rc_prms = [
	str(rcedit),

	# input exe
	str(project / 'app' / 'out' / 'KickBoxer3000-win32-x64' / 'KickBoxer3000.exe'),

	# set icon
	'--set-icon',

	# icon path
	str(project / 'install' / 'icon' / 'icon_res' / 'favicon.ico')
]
print(subprocess.run(rc_prms, capture_output=True).stdout)





# ========================================
# 			     Pack Folder
# ========================================

# 7z exe
zipper = (project / 'install' / '7z' / '7z.exe')

# delete previous archive, if any
(project / 'app' / 'out' / 'KickBoxer3000-win32-x64.7z').unlink(missing_ok=True)

zip_prms = [
	# executable
	str(zipper),

	# param to create an archive
	'a',

	# path to resulting archive
	str(project / 'app' / 'out' / 'KickBoxer3000-win32-x64.7z'),

	# archive params
	'-ssw',

	# path to folder to pack
	str(project / 'app' / 'out' / 'KickBoxer3000-win32-x64'),

	#zip parameters
	
	# method. LZMA2, the coolset one
	'-m0=LZMA2',
	# Compression rate. 9 = max
	'-mx=9',
	# some sort of analysis which affects compression rate... 9 = max
	'-myx=9',
	# iteration passes, the more the better. 64 = 2 times more thatn default
	'-mmc=64',
	# Dict size. 12 MB
	'-md=12m',
	# word size. 273
	'-mfb=273',
	# solid block size. 2 GB
	'-ms=2g'
]
# print(subprocess.run(zip_prms, capture_output=True).stdout)
subprocess.call(zip_prms)










# ========================================
#           Create giga binary
# ========================================

# first 8192 bytes are reserved for a base 64 of a json containing file info

# json is a dict
# Key: file name, Value: file info:
# name: string
# offset: int
# length: int

packfiles = [
	{
		'path': (project / 'install' / '7z' / '7z.exe'),
		'name': '7z_exe'
	},
	{
		'path': (project / 'install' / '7z' / '7z.dll'),
		'name': '7z_dll'
	},
	{
		'path': (project / 'install' / 'boxer.7z'),
		'name': 'app'
	}
]



destination = (project / 'release' / 'install_bin.pootis')

rawbin = destination.with_suffix('.nohead')
rawbin.write_bytes(b'')

header = {}

destination.unlink(missing_ok=True)
for fl in packfiles:
	src =  Path(fl['path'])

	offset = rawbin.stat().st_size
	dat = src.read_bytes()
	length = len(dat)

	# write data
	with open(str(rawbin), 'ab') as giga:
		giga.write(dat)

	# update header
	# header.append({
	# 	'name': fl['name'],
	# 	'offset': offset,
	# 	'length': length
	# })

	header[fl['name']] = {
		'offset': offset,
		'length': length
	}


# write header
with open(str(destination), 'wb') as chad:
	head_data = base64.b64encode(json.dumps(header).encode())
	padding = head_data + ((8192 - len(head_data))*'!').encode()
	chad.write(padding)
	#
	# Write data
	#
	chad.write(rawbin.read_bytes())

# delete nohead bin
rawbin.unlink(missing_ok=True)






# ========================================
#           Binary - old system
# ========================================
"""
# todo: make it cooler with chunks... ????
(project / 'release' / 'install_bin.pootis').unlink(missing_ok=True)
with open(str(project / 'release' / 'install_bin.pootis'), 'ab') as giga:
	# write 7z exe
	giga.write(base64.b64encode((project / 'install' / '7z' / '7z.exe').read_bytes()))
	giga.write('\n'.encode())
	# write 7z dll
	giga.write(base64.b64encode((project / 'install' / '7z' / '7z.dll').read_bytes()))
	giga.write('\n'.encode())
	# write archive
	giga.write(base64.b64encode((project / 'app' / 'out' / 'KickBoxer3000-win32-x64.7z').read_bytes()))
"""















# ========================================
# 			 Compile python exe
# ========================================
cmpileprms = [
	str(project / 'app'/ 'src' / 'bins' / 'python' / 'bin' / 'python.exe'),
	'-m',
	'PyInstaller',
	'--noconfirm',
	'--onefile',
	'--console',
	'--icon',
	'E:/mapping/hl1/resource/game.ico',
	str(project / 'install' / 'install.py')
]

subprocess.call(cmpileprms)

# move exe
shutil.move(str(project / 'install' / 'dist' / 'install.exe'), str(project / 'release' / 'install.exe'))

# delete shit
shutil.rmtree(str(project / 'install' / 'build'))
shutil.rmtree(str(project / 'install' / 'dist'))

for spec in (project / 'install').glob('*'):
	if spec.suffix.lower() == '.spec':
		os.remove(str(spec))










