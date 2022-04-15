export interface FFmpegModule extends EmscriptenModule {
    FS: typeof FS,
    stdin: () => any;
}

declare var factory: EmscriptenModuleFactory<FFmpegModule>;

export default factory;
