interface MediaFormat {
	url: string;
	duration: number;
	preview: string;
	dims: [number, number];
	size: number;
}

interface MediaFormats {
	tinywebp_transparent: MediaFormat;
	webp: MediaFormat;
	nanowebm: MediaFormat;
	tinygif: MediaFormat;
	tinymp4: MediaFormat;
	mp4: MediaFormat;
	gifpreview: MediaFormat;
	mediumgif: MediaFormat;
	tinywebppreview_transparent: MediaFormat;
	nanowebppreview_transparent: MediaFormat;
	tinygifpreview: MediaFormat;
	webppreview_transparent: MediaFormat;
	nanomp4: MediaFormat;
	nanowebp_transparent: MediaFormat;
	loopedmp4: MediaFormat;
	tinywebm: MediaFormat;
	webp_transparent: MediaFormat;
	gif: MediaFormat;
	nanogif: MediaFormat;
	nanogifpreview: MediaFormat;
	webm: MediaFormat;
}

interface TenorResult {
	id: string;
	title: string;
	media_formats: MediaFormats;
	created: number;
	content_description: string;
	itemurl: string;
	url: string;
	tags: string[];
	flags: string[];
	hasaudio: boolean;
	content_description_source: string;
}
