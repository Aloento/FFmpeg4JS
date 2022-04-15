import factory, { type FFmpegModule } from "./ffmpeg";

function toU8(data: Data) {
  if (Array.isArray(data) || data instanceof ArrayBuffer) {
    data = new Uint8Array(data);
  } else if (!data) {
    // `null` for empty files.
    data = new Uint8Array(0);
  } else if (!(data instanceof Uint8Array)) {
    // Avoid unnecessary copying.
    //@ts-expect-error
    data = new Uint8Array(data.buffer);
  }
  return data as Uint8Array;
}

type Data = ArrayLike<number> | { buffer: ArrayBufferLike };

interface File {
  data: Data;
  name: string;
}

export default async function FFmpeg4JS(files: File[] = [], moduleOpt: Partial<FFmpegModule> = {}) {
  let res: File[] = [];

  //@ts-expect-error
  moduleOpt.preRun = function (mod: FFmpegModule) {
    mod.FS.mkdir("/ff");
    mod.FS.chdir("/ff");

    for (const file of files) {
      if (file.name.match(/\//))
        throw new Error("Invalid File Name: " + file.name);

      const fd = mod.FS.open(file.name, "w+");
      const data = toU8(file.data);

      mod.FS.write(fd, data, 0, data.length);
      mod.FS.close(fd);
    }
  };

  //@ts-expect-error
  moduleOpt.postRun = function (mod: FFmpegModule) {
    //@ts-expect-error
    const con = mod.FS.lookupPath("/ff").node.contents;
    const out = Object.values(con) as any[];
    res = out.filter((x) => !files.find(f => f.name === x.name))
      .map((x) => {
        return { name: x.name, data: toU8(x.contents) } as File;
      });
  }

  await factory(moduleOpt);
  return res;
}
