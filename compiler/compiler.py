from pathlib import Path
import shutil

app = Path(__file__).parents[1] / 'app' / 'src'



# wipe previous shite
shutil.rmtree(str(app / 'modules_c'))
(app / 'modules_c').mkdir(exist_ok=True)

# do shit
for md in (app / 'modules').glob('*'):
	if not md.is_dir():
		continue

	# create this module in the compiled folder
	(app / 'modules_c' / md.name).mkdir(exist_ok=True)

	# copy files
	for fl in md.glob('*'):
		if not fl.is_file():
			continue
		if fl.suffix.lower() == '.js':
			(app / 'modules_c' / md.name / fl.name).write_text('window.modules.' + md.name + '={};' + '\n\n' + fl.read_text().replace('$this', 'window.modules.' + md.name))
		else:
			(app / 'modules_c' / md.name / fl.name).write_text(fl.read_text().replace('$this', md.name))


