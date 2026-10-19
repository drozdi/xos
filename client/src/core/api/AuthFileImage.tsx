import { Box, Image, type ImageProps } from '@mantine/core';
import { useEffect, useRef, useState } from 'react';

import { useMainFileUrl } from '@/core/api/useMainFileUrl';

type AuthFileImageProps = Omit<ImageProps, 'src'> & {
	fileId: number | null | undefined;
	/** Optional local/preview URL while fileId blob loads. */
	fallbackSrc?: string | null;
	/** Defer the authenticated blob request until the image scrolls near the viewport. */
	lazy?: boolean;
};

const LAZY_ROOT_MARGIN = '200px';

function useInView(enabled: boolean) {
	const ref = useRef<HTMLDivElement>(null);
	const [inView, setInView] = useState(!enabled);

	useEffect(() => {
		if (inView) {
			return undefined;
		}
		const element = ref.current;
		if (!element) {
			return undefined;
		}
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) {
					setInView(true);
					observer.disconnect();
				}
			},
			{ rootMargin: LAZY_ROOT_MARGIN },
		);
		observer.observe(element);
		return () => observer.disconnect();
	}, [inView]);

	return { ref, inView };
}

/** Renders main_file image via authenticated blob URL. */
export function AuthFileImage({ fileId, fallbackSrc, alt, lazy = false, ...rest }: AuthFileImageProps) {
	const { ref, inView } = useInView(lazy);
	const blobUrl = useMainFileUrl(inView ? fileId : null);
	const src = blobUrl || fallbackSrc || undefined;
	if (!inView) {
		return <Box ref={ref} w={rest.w} h={rest.h} />;
	}
	if (!src) {
		return null;
	}
	return <Image src={src} alt={alt} {...rest} />;
}
