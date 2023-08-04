import { FFmpeg, fetchFile } from "@ffmpeg/ffmpeg";

const getAudioWaveform = async (ffmpeg: FFmpeg, fileName: string, file: File) => {
	// Load the FFmpeg
	if (!ffmpeg.isLoaded()) {
		await ffmpeg.load();
	}

	ffmpeg.FS('writeFile', fileName, await fetchFile(file));
	// Run FFmpeg command to extract audio
	await ffmpeg.run('-i', fileName, 'output.wav');

	await ffmpeg.run(
		'-i',
		'output.wav', '-filter_complex',
		'aformat=channel_layouts=mono,compand=gain=2,showwavespic=s=500x50:colors=#9cf42f[fg];\
    color=s=500x50:color=#44582c,drawgrid=width=iw/10:height=ih/5:color=#9cf42f@0.1[bg];\
    [bg][fg]overlay=format=auto,drawbox=x=(iw-w)/2:y=(ih-h)/2:w=iw:h=1:color=#9cf42f',
		'-frames:v',
		'1',
		'output.png'
	);
	//https://stackoverflow.com/questions/32254818/generating-a-waveform-using-ffmpeg

	// Get the output data
	const data = ffmpeg.FS('readFile', 'output.png');
	// Do something with the data (like creating a Blob and URL)
	const audioWaveform = new Blob([data.buffer], { type: 'image/png' });
	const audioWaveformURL = URL.createObjectURL(audioWaveform);

	return audioWaveformURL;
}

export { getAudioWaveform };