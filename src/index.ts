import factory, { type FFmpegModule } from "./ffmpeg";
import * as Comlink from "comlink";

function toU8(data: ArrayBuffer | ArrayLike<number>) {
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

interface Input {
  data: ArrayBuffer | any;
  name: string;
}

interface Output {
  data: Uint8Array;
  name: string;
}

export default async function FFmpeg4JS(files: Input[] = [], moduleOpt: Partial<FFmpegModule> = {}) {
  let res: Output[] = [];
  moduleOpt.stdin = function () { }
  moduleOpt.print = console.debug;
  moduleOpt.printErr = console.info;

  //@ts-expect-error
  moduleOpt.preRun = function (mod: FFmpegModule) {
    function outFix(cb: Function) {
      let buf: number[] = [];
      const push = () => cb(mod.UTF8ArrayToString(buf, 0));

      return function (char: number, flush: boolean) {
        if (flush && buf.length)
          return push();

        if (char === 10 || char === 13) {
          push();
          buf = [];
        } else if (char !== 0)
          buf.push(char);
      }
    }

    mod.stdout = outFix(mod.print);
    mod.stderr = outFix(mod.printErr);

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
        return { name: x.name, data: toU8(x.contents) };
      });
  }

  await factory(moduleOpt);
  return Comlink.transfer(res, res.map(x => x.data.buffer));
}

Comlink.expose(FFmpeg4JS);
