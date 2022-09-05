import os
import sys
from pathlib import Path
import subprocess
import base64
import shutil
import win32com.client
import math
import json
import time
application_path = os.path.dirname(sys.executable)
server = Path(application_path).absolute()

def pretty(tgt='', sym='-', length=55):
	length = length - 2
	result = ''
	result += math.ceil((length - len(tgt))/2)*sym
	result += ' '
	result += tgt
	result += ' '
	result += math.floor((length - len(tgt))/2)*sym
	return result


print("""

=======================================================
=======================================================
              KICKBOXER 300 INSTALLING
=======================================================
=======================================================




""")

print(pretty('Spinning Earth...'))





# ========================================
#           Unpack binaries
# ========================================

src_bin = server / 'install_bin.pootis'


# read first 8192 bytes of the thing
with open(str(src_bin), 'rb') as bootleg:
	bin_info = json.loads(base64.b64decode(bootleg.read(8192).decode().strip('!').encode()))
	# print(bin_info)


	#
	# unpack 7z
	#

	print('')
	print(pretty('Discovering LV-426...'))

	# create folder
	(server / 'unpk').mkdir(parents=True, exist_ok=True)

	# exe
	# set pointer to the start of the offset
	bootleg.seek(8192 + bin_info['7z_exe']['offset'], 0)
	# read/write
	(server / 'unpk' / '7z.exe').write_bytes(bootleg.read(bin_info['7z_exe']['length']))

	# DLL
	# set pointer to the start of the offset
	bootleg.seek(8192 + bin_info['7z_dll']['offset'], 0)
	# read/write
	(server / 'unpk' / '7z.dll').write_bytes(bootleg.read(bin_info['7z_dll']['length']))





	#
	# unpack binary archive
	#

	print('')
	print(pretty('Sending Chuck Norris...'))
	
	# set pointer to the start of the offset
	bootleg.seek(8192 + bin_info['app']['offset'], 0)
	# read/write
	(server / 'input.bootlegger').write_bytes(bootleg.read(bin_info['app']['length']))























# unpack with created 7z
eprms = [
	str(server / 'unpk' / '7z.exe'),
	'x',
	'-o' + str(server),
	str(server / 'input.bootlegger'),
	'-aoa'
]

# exec unpacking
subprocess.run(eprms, stdout=subprocess.DEVNULL)

print('')
print('')
print('')
print('')
# print(pretty('Chuck Norris can divide by zero...'))
print(pretty('Mission Status: No survivors...'))
print('')



# cleanup
# delete 7z
shutil.rmtree(server / 'unpk')
# delete temp file
(server / 'input.bootlegger').unlink()



print(pretty('... among Aliens.'))
print('')
print('')
print('')
print('')


desktop = str(server) # path to where you want to put the .lnk
path = os.path.join(desktop, 'KickBoxer3000.lnk')
target = str(server / 'KickBoxer3000-win32-x64' / 'KickBoxer3000.exe')
# icon = r'C:\path\to\icon\resource.ico'

shell = win32com.client.Dispatch('WScript.Shell')
shortcut = shell.CreateShortCut(path)
shortcut.Targetpath = target
# shortcut.IconLocation = str(server / 'KickBoxer3000-win32-x64' / 'resources' / 'app' / 'src' / 'assets' / 'pink_panther.ico')
# shortcut.WindowStyle = 7
shortcut.save()



print(pretty('Installation Complete. No Errors.'))
print('')
print('')
print('')
print('')

# refresh icons
# this is honestly extremely fucking irritating
subprocess.call([r'C:\Windows\System32\ie4uinit.exe', '-show'])




time.sleep(5)
