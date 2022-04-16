# [FFmpeg4JS](https://www.npmjs.com/package/ffmpeg4js)

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

FFmpeg4JS 按照 `major.minor.ddd` 的形式来标记版本号，其中

- **major** - FFmpeg 的主要版本号
- **minor** - FFmpeg' 的次要版本号
- **ddd** - FFmpeg4JS 自己的修订版本号

当前稳定版本 `5.0.25`

## Usage

使用 `FFmpeg4JS` 非常简单，但请注意，本库是专门设计来在 Worker （尤其是 Web Worker）中运行的  
如果你打算在 NodeJS 中使用 FFmpeg，请直接调用本机程序，`FFmpeg4JS` 可能无法在 NodeJS Worker 中正常运行

### Sync

一般来说，我们不建议同步调用，因为这样会导致 WASM 运行在主线程，执行任务时 UI 一定会阻塞  
所以这里我们做一件非常简单的事情，来验证我们的库工作是否正常

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

尝试调用 `FFInfo()`，你应该能在控制台中看到来自 FFmpeg 的大量输出信息，否则你应该检查哪里出了问题

### Async

我们以一个文件转换成 Opus 为例

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

- 在使用 FFmpeg 之前，请优先考虑使用 [WebCodecs](https://aloen.to/Program/FrontEnd/WebCodecs/%E8%AE%BA%E4%BD%BF%E7%94%A8WebCodecs%E5%AF%B9%E8%A7%86%E9%A2%91%E8%BF%9B%E8%A1%8C%E5%A4%84%E7%90%86/)

- `new URL` 部分请根据你的项目环境确定具体值  
  `UMI (Webpack)` 可以直接写成 `new Worker(new URL("ffmpeg4js", import.meta.url));`

- 我们使用 [Comlink](https://github.com/GoogleChromeLabs/comlink) 来优化 Worker 工作流

- `Comlink.transfer` 不是必须的，但最好这么做  
  如果 `data` 是 `Uint8Array` 等以 `buffer` 储存内容的对象  
  请写成 `Comlink.transfer([{ name, data }], [data.buffer])`

- 不要忘记关闭不用的 Worker：`worker.terminate();` 否则内存有可能不会释放

- 每一个 `FFmpegModule` 只能使用一次  
  但是你可以重复调用 `FFmpeg4JS`，每次调用会生成新的 `FFmpegModule` 实例

- `FFmpeg4JS` 并没有转义 ts 和优化 js 文件（但是优化了 WASM），请确保你的环境能够处理它们

- 在 `FFmpeg4JS` 中，你不能重写 `stdout` 和 `stderr`  
  因为它们有换行符识别问题，请传递 `print` 和 `printErr`

- 如果你对默认的 Wrapper 不满意，你可以自行  
  `import factory from "ffmpeg4js/src/ffmpeg";`
