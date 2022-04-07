declare namespace ffmpeg {
    interface Opts {
        root: string;
    }

    interface Mount {
        type: string;
        opts: Opts;
        mountpoint: string;
    }

    interface Result {
        MEMFS: Video[];
    }

    interface Video {
        data: Uint8Array;
        name: string;
    }

    namespace Worker {
        interface Type {
            "ready": never,
            "run": never,
            "stdout": never,
            "stderr": never,
            "abort": never,
            "error": never,
            "exit": never,
            "done": never
        }

        interface Data {
            type: keyof Type;
            data: string & Result;
        }

        interface PostMessageOptions {
            type: keyof Type;
            arguments: string[];
            MEMFS?: Video[];
            mounts?: Mount[];
            TOTAL_MEMORY?: number;
        }

        interface OnMessageOptions {
            data: Data;
        }
    }

    class Worker {
        constructor(someParam?: string);

        onmessage(opts: Worker.OnMessageOptions): void;
        postMessage(opts: Worker.PostMessageOptions): void;
        terminate(): void;
    }
}

export = ffmpeg;
