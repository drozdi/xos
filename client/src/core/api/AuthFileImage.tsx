import { Image, type ImageProps } from '@mantine/core';

import { useMainFileUrl } from '@/core/api/useMainFileUrl';

type AuthFileImageProps = Omit<ImageProps, 'src'> & {
	fileId: number | null | undefined;
	/** Optional local/preview URL while fileId blob loads. */
	fallbackSrc?: string | null;
};

/** Renders main_file image via authenticated blob URL. */
export function AuthFileImage({ fileId, fallbackSrc, alt, ...rest }: AuthFileImageProps) {
	const blobUrl = useMainFileUrl(fileId);
	const src = blobUrl || fallbackSrc || undefined;
	if (!src) {
		return null;
	}
	return <Image src={src} alt={alt} {...rest} />;
}
