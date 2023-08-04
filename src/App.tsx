import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { createFFmpeg } from '@ffmpeg/ffmpeg';

import { getThumbnails } from './utils/getThumbnails';
import { getAudioWaveform } from './utils/getAudioWaveform';

const timelineWidth = 500;
let currentTimeID: ReturnType<typeof setInterval>;

export default function App() {
  const videoEl = useRef<HTMLVideoElement>(null);
  const [videoSrc, setVideoSrc] = useState('');
  const [uploadFile, setUploadFile] = useState<File>();
  const [audioWaveform, setAudioWaveform] = useState<string>();
  const ffmpeg = createFFmpeg({
    log: false,
  });
  // const [files, setFiles] = useState<FileList | null>();
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [play, setPlay] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [posX, setPosX] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (play) {
      currentTimeID = setInterval(function () {
        setCurrentTime((Math.round(videoEl.current?.currentTime! * 100) / 100))
      }, 100);
    }
    return () => clearInterval(currentTimeID);
  }, [play])

  useEffect(() => {
    const runFFmpeg = async () => {
      setThumbnails(await getThumbnails(ffmpeg, uploadFile?.name as string, uploadFile as File, duration));
      setAudioWaveform(await getAudioWaveform(ffmpeg, uploadFile?.name as string, uploadFile as File));
    }
    if (uploadFile && duration) {
      runFFmpeg();
    }
  }, [duration, uploadFile])

  const handleLoadedMetadata = () => {
    const video = videoEl.current;
    if (!video) return;
    setDuration(video.duration)
    console.log(`The video is ${video.duration.toFixed(1)} seconds long.`);
  };

  const handleVideoEnded = () => {
    handleReplayClick();
  }

  const handleOnChange = async (e: ChangeEvent<HTMLInputElement>) => {
    setThumbnails([]);
    // setFiles((e.target as HTMLInputElement).files);
    let file = (e.target as HTMLInputElement).files![0];
    setVideoSrc(URL.createObjectURL(file));
    setUploadFile(file);
  }

  const handlePlayClick = () => {
    setPlay(!play);
    if (!play) {
      videoEl.current?.play();
    } else {
      videoEl.current?.pause();
    }
  }

  const handlePauseClick = () => {
    setPlay(false);
    videoEl.current?.pause();
    console.log(videoEl.current!.currentTime);
  }

  const handleReplayClick = () => {
    handlePauseClick();
    setPlay(false);
    setCurrentTime(0);
    setPosX(0);
    videoEl.current!.currentTime = 0;
    console.log(posX);
  }

  return (
    <div className="App">
      <video width="480" src={videoSrc} ref={videoEl} onLoadedMetadata={handleLoadedMetadata} onEnded={handleVideoEnded} controls></video><br />
      <p>Time: {currentTime} s</p>
      <button disabled={!videoSrc} onClick={handlePlayClick}>{!play ? "Play" : "Pause"}</button>
      <button onClick={handleReplayClick}>Replay</button><br />
      <input type="file" accept="video/*" onChange={handleOnChange} />

      {videoSrc &&
        <div
          style={{
            width: `${timelineWidth}px`,
            height: '50px',
            border: "3px solid gray",
            boxSizing: "content-box",
            position: "relative"
          }}
        >
          {thumbnails.map((thumbnail, index) =>
            <img src={thumbnail} key={index} alt="" />
          )}
          <img src={audioWaveform} />
        </div>
      }

    </div>
  );
}
