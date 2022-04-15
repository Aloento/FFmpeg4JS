import moduleFactory from "./ffmpeg";

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

export default async function FFmpeg4JS(files: File[] = [], moduleOpt: Partial<EmscriptenModule> = {}) {
  let res: File[] = [];

  //@ts-expect-error
  moduleOpt.preRun = () => {
    FS.mkdir("/ff");
    FS.chdir("/ff");

    for (const file of files) {
      if (file.name.match(/\//))
        throw new Error("Invalid File Name: " + file.name);

      const fd = FS.open(file.name, "w+");
      const data = toU8(file.data);

      FS.write(fd, data, 0, data.length);
      FS.close(fd);
    }
  };

  //@ts-expect-error
  moduleOpt.postRun = () => {
    //@ts-expect-error
    const con = FS.lookupPath("/ff").node.contents;
    const out = Object.values(con) as any[];
    res = out.filter((x) => !files.find(f => f.name === x.name))
      .map((x) => {
        return { name: x.name, data: toU8(x.contents) } as File
      });
  }

  await moduleFactory(moduleOpt);
  return res;
}
