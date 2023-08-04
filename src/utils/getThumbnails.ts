import { FFmpeg, fetchFile } from "@ffmpeg/ffmpeg";

const getThumbnails = async (ffmpeg: FFmpeg, fileName: string, file: File, duration: number) => {
    if (!ffmpeg.isLoaded()) {
        await ffmpeg.load();
    }

    ffmpeg.FS('writeFile', fileName, await fetchFile(file));
    let tempThumbnails = [];

    // Calculate the interval for the thumbnails
    const interval = duration / 10;

    // Extract the thumbnails
    for (let i = 0; i < 10; i++) {
        const outputFileName = `thumbnail_${i + 1}.jpg`;

        await ffmpeg.run('-ss', String(i * interval), '-i', fileName, '-vf', 'scale=-1:50,crop=50:50', '-frames:v', '1', outputFileName);

        // Read the output file from FFmpeg's in-memory filesystem
        const data = ffmpeg.FS('readFile', outputFileName);

        // Convert the data to a Blob
        const blob = new Blob([data.buffer], { type: 'image/jpeg' });

        // Do something with the Blob (e.g., create an Object URL and set it as the src of an img element)
        const url = URL.createObjectURL(blob);
        tempThumbnails.push(url);
    }
    return tempThumbnails;
}

export { getThumbnails };