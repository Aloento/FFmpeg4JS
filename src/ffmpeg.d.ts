export interface FFmpegModule extends EmscriptenModule {
    FS: typeof FS,
}

declare var factory: EmscriptenModuleFactory<FFmpegModule>;

export default factory;
