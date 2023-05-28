import sys, json, ctypes
from pathlib import Path
from szipper import szip


def main():
	if len(sys.argv) < 2:
		# Display the instructions
		ctypes.windll.user32.MessageBoxW(
			None,
			"""To apply the patch you have to drag-n-drop the root folder of the controller on this exe file. The folder is called something like "KickBoxer3000-win32-x64" and has a bunch of files inside.""",
			'INFO',
			0,
		)
		return

	bin_root = Path(__file__).parent
	patch_target = Path(sys.argv[1])

	print('Applying patch to', str(patch_target))
	print('Binary root:', str(bin_root))

	# Make sure the controller is closed
	ctypes.windll.user32.MessageBoxW(
		None,
		"""Make sure the target controller is NOT running (close the controller and press OK or close this message with a cross - the patch will continue). If you still apply the patch after this message with controller running - your software license will be permanently revoked and never granted to you again.""",
		'WARNING',
		0,
	)

	# Don't fuck anything up
	if not (patch_target / 'resources' / 'app' / 'src').is_dir():
		ctypes.windll.user32.MessageBoxW(
			None,
			"""The target folder does not look like a kickboxer controller. Tech support: megaadrenaline1055@gmail.com 24/7, avg response time +-5 hrs. Warranty valid till 2025. If investigation shows that you were dragging C:/User/OneDrive/Documents or other rubbish like this - your software license will be permanently revoked.""",
			'ERROR',
			0,
		)
		return

	szipper = szip(bin_root / '7z.exe')

	# unpack the patch itself
	szipper.unpack(
		bin_root / 'patch_data.7z',
		patch_target / 'resources' / 'app',
		['src'],
	)

	# unpack the file containing current version
	szipper.unpack(
		bin_root / 'patch_data.7z',
		bin_root,
		['package.json'],
	)

	# tweak the version
	upgraded_version = json.loads((bin_root / 'package.json').read_bytes())['version_native']

	old_package_info = json.loads((patch_target / 'resources' / 'app' / 'package.json').read_bytes())
	old_package_info['version_native'] = upgraded_version

	(patch_target / 'resources' / 'app' / 'package.json').write_text(json.dumps(old_package_info, indent=4))

	# IMPORTANT: UNLOCK THE CONTROLLER
	(patch_target / 'resources' / 'app' / 'src' / 'raw_base_is.bad').unlink(missing_ok=True)

	ctypes.windll.user32.MessageBoxW(
		None,
		"""Success""",
		'Status Update',
		0,
	)



if __name__ == '__main__':
	main()

