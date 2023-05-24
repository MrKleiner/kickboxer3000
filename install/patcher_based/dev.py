import sys, os

# print(sys.argv)


if '-repack_node_modules' in sys.argv:
	os.system('cls')
	from szipper import szip
	from common_util import project

	szipper = szip(project / 'static_bins' / '7z' / '7z.exe')

	for kill in (project / 'static_bins').glob('node_modules.7z*'):
		kill.unlink()

	szipper.pack(
		project / 'app' / 'node_modules',
		project / 'static_bins' / 'node_modules.7z',
		chunk_size = '30m',
		echo=True,
	)







