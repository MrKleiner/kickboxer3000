import sys, json, ctypes, os, math, shutil, subprocess, time
import win32com.client
from pathlib import Path
from szipper import szip

def pretty(tgt='', sym='-', length=55):
	length = length - 2
	result = ''
	result += math.ceil((length - len(tgt))/2)*sym
	result += ' '
	result += tgt
	result += ' '
	result += math.floor((length - len(tgt))/2)*sym
	return result


def drop(amt=1):
	for d in range(amt):
		print('')


drop()
print("""
=======================================================
=======================================================
              KICKBOXER 3000 INSTALLING
=======================================================
=======================================================
""")
drop(5)

def main():


	print(pretty('Spinning Earth...'))

	drop()
	print(pretty('Discovering LV-426...'))

	bin_root = Path(__file__).parent
	exe_dir = Path(sys.executable).parent

	drop()
	print(pretty('Sending Chuck Norris...'))

	szipper = szip(bin_root / '7z.exe')





	# ========================================
	#   Unpack controller to the current dir
	# ========================================
	szipper.unpack(
		bin_root / 'kb_data.7z',
		exe_dir,
	)



	drop(4)
	print(pretty('Mission Status: No survivors...'))
	drop(1)



	# ========================================
	# Move 7zip executable to the bins folder inside controller
	# ========================================
	(exe_dir / 'KickBoxer3000-win32-x64' / 'resources' / 'app' / 'src' / 'bins' / '7z').mkdir(parents=True, exist_ok=True)
	shutil.move(
		bin_root / '7z.exe', 
		exe_dir / 'KickBoxer3000-win32-x64' / 'resources' / 'app' / 'src' / 'bins' / '7z' / '7z.exe',
	)
	shutil.move(
		bin_root / '7z.dll', 
		exe_dir / 'KickBoxer3000-win32-x64' / 'resources' / 'app' / 'src' / 'bins' / '7z' / '7z.dll',
	)




	# ========================================
	#       Important: create a lock file
	# ========================================
	(exe_dir / 'KickBoxer3000-win32-x64' / 'resources' / 'app' / 'src' / 'raw_base_is.bad').write_text('Achtung')




	# ========================================
	#            Create a shortcut
	# ========================================
	shotcut_loc = str(exe_dir / 'KickBoxer3000.lnk')
	shotcut_target = str(exe_dir / 'KickBoxer3000-win32-x64' / 'KickBoxer3000.exe')
	# icon = r'C:\path\to\icon\resource.ico'

	shell = win32com.client.Dispatch('WScript.Shell')
	shortcut = shell.CreateShortCut(shotcut_loc)
	shortcut.Targetpath = shotcut_target
	# shortcut.IconLocation = icon
	# shortcut.WindowStyle = 7
	shortcut.save()




	print(pretty('... among Aliens.'))
	drop(4)




	# ========================================
	#            Reload Icons
	# ========================================
	subprocess.call([r'C:\Windows\System32\ie4uinit.exe', '-show'])




	print(pretty('Installation Complete. No Errors.'))
	drop(5)

	time.sleep(5)



if __name__ == '__main__':
	main()
