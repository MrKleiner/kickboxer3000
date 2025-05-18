import subprocess
from pathlib import Path





FFMPEG = r"C:\custom\ffmpeg_vulkan\bin\ffmpeg.exe"


# 764



def main():
	split_src = Path(input('File to split: ').strip('"'))
	split_dest = Path(input('Split output dir: ').strip('"'))
	while True:
		name = input('Index: ')

		for side, cmd in (('l', 'crop=iw/2.51:ih:0:0'), ('r', 'crop=iw/2.51:ih:iw/1.49:')):
			subprocess.call((
				str(FFMPEG), '-y',
				'-i', str(split_src),
				'-vf', f'{cmd}',
				str(split_dest / f'{name}_{side}.png')
			))





if __name__ == '__main__':
	main()

