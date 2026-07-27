import { Box, LoadingOverlay, type BoxProps } from '@mantine/core';
import type { ComponentType, ReactNode } from 'react';

export type LoadingProps = BoxProps & {
    children: ReactNode;
    active?: boolean;
    keepMounted?: boolean;
    component?: ComponentType<BoxProps>;
    skeleton?: ReactNode;
};

const OVERLAY_PROPS = { radius: 'sm', blur: 2 } as const;
const LOADER_PROPS = { color: 'pink', type: 'bars' } as const;

export function Loading({
    children,
    active,
    keepMounted,
    component: Component = Box,
    skeleton,
    ...props
}: LoadingProps) {
    const Wrapper = Component as typeof Box;

    if (active && skeleton) {
        return (
            <Wrapper pos="relative" {...props}>
                {skeleton}
            </Wrapper>
        );
    }

    return (
        <Wrapper
            pos="relative"
            miw={active ? 300 : undefined}
            mih={active ? 300 : undefined}
            {...props}
        >
            {(keepMounted || !active) && children}
            <LoadingOverlay
                visible={active}
                overlayProps={OVERLAY_PROPS}
                loaderProps={LOADER_PROPS}
            />
        </Wrapper>
    );
}
