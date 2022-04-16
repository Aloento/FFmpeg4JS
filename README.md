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

FFmpeg4JS uses the following version pattern: `major.minor.ddd`, where:

- **major** - FFmpeg's major version number used in the builds.
- **minor** - FFmpeg's minor version.
- **ddd** - FFmpeg4JS patch version.

Current `5.0.25`

## Usage
