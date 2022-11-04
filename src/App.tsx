import { ChangeEvent, DragEvent, useEffect, useRef, useState } from 'react';
import { createFFmpeg, fetchFile, FFmpeg } from '@ffmpeg/ffmpeg';
import Draggable, { DraggableData, DraggableEventHandler, DraggableEvent } from 'react-draggable';
// import { useDraggable } from "react-use-draggable-scroll";

const timelineWidth = 500;
let currentTimeID: ReturnType<typeof setInterval>;

export default function App() {
  // const frameRef = useRef<HTMLDivElement>() as React.MutableRefObject<HTMLInputElement>;
  // const { events } = useDraggable(frameRef);
  const videoEl = useRef<HTMLVideoElement>(null);
  const [videoSrc, setVideoSrc] = useState('');
  const [message, setMessage] = useState('Click Start to transcode');
  const ffmpeg = createFFmpeg({
    log: true,
  });
  // const [files, setFiles] = useState<FileList | null>();
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [play, setPlay] = useState(false);
  const [replay, setReplay] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [pauseTime, setPauseTime] = useState(0);
  const [posX, setPosX] = useState(0);
  const [dragPosX, setDragPosX] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (play) {
      currentTimeID = setInterval(function () {
        setCurrentTime((Math.round(videoEl.current?.currentTime! * 10) / 10))
        console.log(((currentTime - pauseTime) / duration * timelineWidth) + posX);
      }, 100);
    }
    return () => clearInterval(currentTimeID);
  }, [play])

  const handleLoadedMetadata = () => {
    const video = videoEl.current;
    if (!video) return;
    setDuration(video.duration)
    console.log(`The video is ${video.duration.toFixed(1)} seconds long.`);
  };

  const handleVideoEnded = () => {
    handleReplayClick();
  }

  const getThumbnails = async (fileName: string, file: File) => {
    await ffmpeg.load();
    ffmpeg.FS('writeFile', fileName, await fetchFile(file));
    await ffmpeg.run('-i', fileName, '-vf', `fps=${10 / duration},scale=-1:50,crop=50:50`, 'thumbnail-%03d.jpg')
    let i = 1;
    let errMessage = '';
    let tempThumbnails = [];
    while (!errMessage) {
      try {
        const thumbnail = ffmpeg.FS('readFile', `thumbnail-${i.toString().padStart(3, '0')}.jpg`);
        tempThumbnails.push(URL.createObjectURL(new Blob([thumbnail.buffer], { type: 'image/jpg' })))
        i++;
      } catch (err) {
        if (err instanceof Error) {
          errMessage = err.message;
          console.error(err.message);
        }
      }
    }
    setThumbnails(tempThumbnails)
  }

  const handleOnChange = async (e: ChangeEvent<HTMLInputElement>) => {
    setMessage('Generate thumbnails');
    setThumbnails([]);
    // setFiles((e.target as HTMLInputElement).files);
    let file = (e.target as HTMLInputElement).files![0];
    setVideoSrc(URL.createObjectURL(file));
    await getThumbnails(file.name, file);
    setMessage('Complete generating');
  }

  const handlePlayClick = () => {
    setReplay(false);
    setPlay(!play);
    if (!play) {
      videoEl.current?.play();
    } else {
      videoEl.current?.pause();
    }

  }

  const handleStopClick = () => {
    setPlay(false);
    videoEl.current?.pause();
    setPauseTime(videoEl.current!.currentTime);
  }

  const handleReplayClick = () => {
    handleStopClick();
    setReplay(true);
    setPlay(false);
    setCurrentTime(0);
    setPosX(0);
    setPauseTime(0);
    videoEl.current!.currentTime = 0;
    console.log(posX);
  }

  const handleDrag = (e: DraggableEvent, data: DraggableData) => {
    handleStopClick();
    let time = data.x / 500 * duration;
    setIsDragging(true);
    setCurrentTime(time);
    setPosX(data.x);
    // console.log(data.x);
    videoEl.current!.currentTime = time
  }

  const handleDragStart = () => {
    setReplay(false);
    setDragPosX((currentTime - pauseTime) / duration * timelineWidth);
  }

  const handleDragStop = (e: DraggableEvent, data: DraggableData) => {
    let time = data.x / 500 * duration;
    setIsDragging(false);
  }

  return (
    <div className="App">
      <video width="480" src={videoSrc} ref={videoEl} onLoadedMetadata={handleLoadedMetadata} onEnded={handleVideoEnded} controls></video><br />
      <p>Time: {currentTime} s</p>
      <button disabled={!videoSrc} onClick={handlePlayClick}>{!play ? "Play" : "Pause"}</button>
      {/* <button disabled={!videoSrc || !play} onClick={handleStopClick}>Pause</button> */}
      <button onClick={handleReplayClick}>Replay</button><br />
      <input type="file" accept="video/*" onChange={handleOnChange} />
      {/* <button disabled={message === 'Start transcoding'} onClick={doTranscode}>Start</button> */}
      <p>{message}</p>

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
          <Draggable
            axis='x'
            bounds="parent"
            onStart={handleDragStart}
            onDrag={handleDrag}
            onStop={handleDragStop}
            // defaultPosition={{ x: 0, y: 0 }}
            position={replay ? { x: 0, y: 0 } : {x: posX, y: 0}}
          >
            <span
              style={{
                cursor: 'grab',
                left: isDragging ? dragPosX : (currentTime - pauseTime) / duration * timelineWidth,
                // left: 0,
                position: "absolute",
                width: "2px",
                height: "50px",
                background: "#ff422a"
              }}
            ></span>
          </Draggable>
          {
            thumbnails.map((thumbnail, index) =>
              <img onDrag={(e: DragEvent<HTMLImageElement>) => { e.preventDefault() }} src={thumbnail} key={index} alt="" />
            )
          }
        </div>
      }

    </div>
  );
}