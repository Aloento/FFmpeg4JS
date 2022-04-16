export interface FFmpegModule extends EmscriptenModule {
    FS: typeof FS,
    stdin: () => any;
    stdout: (char: number, flush: boolean) => any;
    stderr: (char: number, flush: boolean) => any;
    UTF8ArrayToString: (heapOrArray: any, idx: number, maxBytesToRead?: number | undefined) => string;
}

declare var factory: EmscriptenModuleFactory<FFmpegModule>;

export default factory;
