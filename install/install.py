import os
import sys
from pathlib import Path
import subprocess
import base64
import shutil
import win32com.client

application_path = os.path.dirname(sys.executable)
server = Path(application_path).absolute()

print("""

=======================================================
=======================================================
			   KICKBOXER 300 INSTALLING
=======================================================
=======================================================


---------------- Spinning Earth..... ------------------

""")

# get binaries
binaries = (server / 'install_bin.pootis').read_text().split('\n')
# create temp file
with open(str(server / 'input.7z'), 'wb') as inp:
	inp.write(base64.b64decode(binaries[2].encode()))

# Create 7zip directory
(server / 'unpk').mkdir(parents=True, exist_ok=True)

# first line = 7z.exe
with open(str(server / 'unpk' / '7z.exe'), 'wb') as arch:
	arch.write(base64.b64decode(binaries[0].encode()))
# second line = 7z dll
with open(str(server / 'unpk' / '7z.dll'), 'wb') as arch:
	arch.write(base64.b64decode(binaries[1].encode()))



# unpack with created 7z
eprms = [
	str(server / 'unpk' / '7z.exe'),
	'x',
	'-o' + str(server),
	str(server / 'input.7z'),
	'-aoa'
]

# exec unpacking
subprocess.call(eprms)

# cleanup
# delete 7z
shutil.rmtree(server / 'unpk')
# delete temp file
(server / 'input.7z').unlink()

print('--------------------- Finalizing ----------------------')



desktop = str(server) # path to where you want to put the .lnk
path = os.path.join(desktop, 'KickBoxer3000.lnk')
target = str(server / 'KickBoxer3000-win32-x64' / 'KickBoxer3000.exe')
# icon = r'C:\path\to\icon\resource.ico'

shell = win32com.client.Dispatch("WScript.Shell")
shortcut = shell.CreateShortCut(path)
shortcut.Targetpath = target
# shortcut.IconLocation = icon
# shortcut.WindowStyle = 7
shortcut.save()



print('------------------------ DONE ------------------------')