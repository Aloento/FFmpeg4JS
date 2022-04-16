COMMON_BSFS = vp9_superframe

COMMON_FILTERS = aresample scale crop overlay hstack vstack

COMMON_DEMUXERS = matroska mov avi h264 hevc av1 \
	mp3 wav ogg aac flac \
	image2 concat \
	s16le s24le f32le f64le

COMMON_DECODERS = av1 vvc hevc vp9 vp8 h264 \
	flac vorbis opus aac mp3 \
	png webp jpeg psd \
	pcm_f32le pcm_f64le \
	pcm_s16le pcm_s24le 

NEXT_MUXERS = webm ogg opus null
NEXT_ENCODERS = libvpx_vp9 vorbis opus

FFMPEG_NEXT_BC = build/ffmpeg-next/ffmpeg.bc

NEXT_SHARED_DEPS = build/libvpx/dist/lib/libvpx.so

all: ffmpeg.js

clean: clean-js clean-libvpx clean-ffmpeg-next

clean-js:
	rm -f src/ffmpeg*.js

clean-libvpx:
	cd build/libvpx && git clean -xdf
clean-ffmpeg-next:
	cd build/ffmpeg-next && git clean -xdf

build/libvpx/dist/lib/libvpx.so:
	cd build/libvpx && \
	git reset --hard && \
	patch -p1 < ../libvpx-fix-ld.patch && \
	emconfigure ./configure \
		--prefix="$$(pwd)/dist" \
		--target=generic-gnu \
		--disable-dependency-tracking \
		--disable-multithread \
		--disable-runtime-cpu-detect \
		--enable-shared \
		--disable-static \
		\
		--disable-examples \
		--disable-docs \
		--disable-unit-tests \
		--disable-webm-io \
		--disable-libyuv \
		--disable-vp8 \
		--disable-vp9-decoder \
		&& \
	emmake make -j && \
	emmake make install

FFMPEG_COMMON_ARGS = \
	--cc=emcc \
	--ranlib=emranlib \
	--enable-cross-compile \
	--target-os=none \
	--arch=x86 \
	--disable-runtime-cpudetect \
	--disable-asm \
	--disable-fast-unaligned \
	--disable-pthreads \
	--disable-w32threads \
	--disable-os2threads \
	--disable-debug \
	--disable-stripping \
	--disable-safe-bitstream-reader \
	\
	--disable-all \
	--enable-ffmpeg \
	--enable-avcodec \
	--enable-avformat \
	--enable-avfilter \
	--enable-swresample \
	--enable-swscale \
	--disable-network \
	--disable-d3d11va \
	--disable-dxva2 \
	--disable-vaapi \
	--disable-vdpau \
	$(addprefix --enable-bsf=,$(COMMON_BSFS)) \
	$(addprefix --enable-decoder=,$(COMMON_DECODERS)) \
	$(addprefix --enable-demuxer=,$(COMMON_DEMUXERS)) \
	--enable-protocol=file \
	$(addprefix --enable-filter=,$(COMMON_FILTERS)) \
	--disable-bzlib \
	--disable-iconv \
	--disable-libxcb \
	--disable-lzma \
	--disable-sdl2 \
	--disable-securetransport \
	--disable-xlib \
	--enable-zlib

build/ffmpeg-next/ffmpeg.bc: $(NEXT_SHARED_DEPS)
	cd build/ffmpeg-next && \
	EM_PKG_CONFIG_PATH=$(FFMPEG_NEXT_PC_PATH) emconfigure ./configure \
		$(FFMPEG_COMMON_ARGS) \
		$(addprefix --enable-encoder=,$(NEXT_ENCODERS)) \
		$(addprefix --enable-muxer=,$(NEXT_MUXERS)) \
		--enable-gpl \
		--enable-libopus \
		--enable-libvpx \
		--extra-cflags="-s USE_ZLIB=1 -I../libvpx/dist/include" \
		--extra-ldflags="-r -L../libvpx/dist/lib" \
		&& \
	emmake make -j EXESUF=.bc

EMCC_COMMON_ARGS = \
	-g \
	-O3 \
	-flto \
	-s ASSERTIONS=0 \
	-s EXIT_RUNTIME=1 \
	-s NODEJS_CATCH_EXIT=0 \
	-s NODEJS_CATCH_REJECTION=0 \
	-s ALLOW_MEMORY_GROWTH=1 \
	-s MODULARIZE=1 \
	-s EXPORT_ES6=1 \
	-s ENVIRONMENT=worker \
	-s EXPORTED_RUNTIME_METHODS=[FS,UTF8ArrayToString] \
	-o src/$@

ffmpeg.js: $(FFMPEG_NEXT_BC)
	emcc $(FFMPEG_NEXT_BC) $(NEXT_SHARED_DEPS) \
		$(EMCC_COMMON_ARGS)
