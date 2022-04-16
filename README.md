# [FFmpeg4JS](https://www.npmjs.com/package/ffmpeg4js)

[中文](https://github.com/Aloento/FFmpeg4JS/blob/master/README-CN.md)

## Builds

### Modern (Default)

#### Decoders

| Video | Image | Audio  | RAW       |
| ----- | ----- | ------ | --------- |
| av1   | png   | flac   | pcm_f64le |
| vvc   | webp  | vorbis | pcm_f32le |
| hevc  | jpeg  | opus   | pcm_s24le |
| vp9   | psd   | aac    | pcm_s16le |
| vp8   |       | mp3    |           |
| h264  |       |        |

#### Encoders

| Video      | Audio  |
| ---------- | ------ |
| libvpx_vp9 | opus   |
|            | vorbis |

## Version scheme

FFmpeg4JS uses the following version pattern: `major.minor.ddd`, where:

- **major** - FFmpeg's major version number used in the builds.
- **minor** - FFmpeg's minor version.
- **ddd** - FFmpeg4JS patch version.

Current `5.0.25`

## Usage

Using `FFmpeg4JS` is very easy, but please note that this library is designed to run in the Worker (especially the Web Worker)  
If you plan to use FFmpeg in NodeJS, please call the native ffmpeg directly, `FFmpeg4JS` may not work properly in NodeJS Worker

### Sync

In general, we don't recommend synchronous calls,  
as this will cause WASM to run in the main thread and the UI will definitely block while executing.  
So here we do a very simple thing to verify that if our library is working properly

```ts
import FFmpeg4JS from "ffmpeg4js";

export async function FFInfo() {
  await FFmpeg4JS(undefined, {
    arguments: ["-codecs"],
  });

  console.debug("------------------");

  await FFmpeg4JS(undefined, {
    arguments: ["-hide_banner", "-formats"],
  });
}
```

Try calling `FFInfo()` and you should see a lot of output from FFmpeg in the console, otherwise you should check what's wrong

### Async

Let's take a file converted to Opus as an example

```ts
import * as Comlink from "comlink";
import type FFmpeg4JS from "ffmpeg4js";

export async function ToOpus(
  name: string,
  data: ArrayBuffer
): Promise<Uint8Array | undefined> {
  const worker = new Worker(
    new URL("~/node_modules/ffmpeg4js/src/index", import.meta.url),
    { type: "module" }
  );

  const ff = Comlink.wrap<typeof FFmpeg4JS>(worker);
  const res = await ff(Comlink.transfer([{ name, data }], [data]), {
    arguments: [
      "-hide_banner",
      "-i",
      name,
      "-strict",
      "-2",
      "-c:a",
      "opus",
      `${name}.opus`,
    ],
  });

  worker.terminate();
  return res.find((x) => x.name === `${name}.opus`)?.data;
}
```

## Tips

- Please give preference to [WebCodecs](https://web.dev/webcodecs/) before using FFmpeg

- The `new URL` should be determined according to your project environment  
  `UMI (Webpack)` can be written directly as `new Worker(new URL("ffmpeg4js", import.meta.url));`

- We use [Comlink](https://github.com/GoogleChromeLabs/comlink) to optimize the Worker workflow

- `Comlink.transfer` is not required, but it is better to do so.  
  If `data` is an object such as `Uint8Array` that stores its contents in `buffer`  
  Please write as `Comlink.transfer([{ name, data }], [data.buffer])`

- Don't forget to close the unused worker: `worker.terminate();` otherwise the memory may not be freed

- Each `FFmpegModule` can only be used once  
  But you can call `FFmpeg4JS` repeatedly, and each call will generate a new instance of `FFmpegModule`

- `FFmpeg4JS` does not escape ts and optimize js files (but does optimize WASM)  
  make sure your environment can handle them

- In `FFmpeg4JS`, you cannot override `stdout` and `stderr`  
  Because they have line break recognition problems, pass `print` and `printErr` instead

- If you are not satisfied with the default Wrapper, you can do it yourself  
  `import factory from "ffmpeg4js/src/ffmpeg";`
