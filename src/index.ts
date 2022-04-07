import ffmpeg from "./ffmpeg.js";

export default function NewFFmpeg() {
  return new Worker(new URL("./ffmpeg.js", import.meta.url)) as ffmpeg.Worker;
}
