import type { ComponentType } from 'react';

export function UsersIcon({ size = 32 }: { size?: number }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden
		>
			<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
			<circle cx="9" cy="7" r="4" />
			<path d="M22 21v-2a4 4 0 0 0-3-3.87" />
			<path d="M16 3.13a4 4 0 0 1 0 7.75" />
		</svg>
	);
}

export function SettingsIcon({ size = 32 }: { size?: number }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden
		>
			<circle cx="12" cy="12" r="3" />
			<path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
		</svg>
	);
}

export function GroupsIcon({ size = 32 }: { size?: number }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
			<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
			<circle cx="9" cy="7" r="4" />
			<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
			<path d="M16 3.13a4 4 0 0 1 0 7.75" />
		</svg>
	);
}

export function OuIcon({ size = 32 }: { size?: number }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
			<rect x="3" y="3" width="7" height="7" rx="1" />
			<rect x="14" y="3" width="7" height="7" rx="1" />
			<rect x="3" y="14" width="7" height="7" rx="1" />
			<rect x="14" y="14" width="7" height="7" rx="1" />
		</svg>
	);
}

export function ClaimantIcon({ size = 32 }: { size?: number }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
			<path d="M16 3h5v5" />
			<path d="M8 3H3v5" />
			<path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" />
			<path d="m15 9 6-6" />
			<path d="M21 16v5h-5" />
			<path d="M3 16v5h5" />
		</svg>
	);
}

export function DeviceIcon({ size = 32 }: { size?: number }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
			<rect x="2" y="3" width="20" height="14" rx="2" />
			<path d="M8 21h8M12 17v4" />
		</svg>
	);
}

export function SubDeviceIcon({ size = 32 }: { size?: number }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
			<rect x="4" y="4" width="16" height="12" rx="1" />
			<path d="M8 20h8M10 16v4M14 16v4" />
		</svg>
	);
}

export function TypesIcon({ size = 32 }: { size?: number }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
			<path d="M4 7h16M4 12h10M4 17h6" />
			<circle cx="18" cy="12" r="3" />
		</svg>
	);
}

export function PropertiesIcon({ size = 32 }: { size?: number }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
			<path d="M12 3v18M3 12h18" />
			<circle cx="12" cy="12" r="3" />
		</svg>
	);
}

export function ComponentsIcon({ size = 32 }: { size?: number }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
			<rect x="3" y="3" width="7" height="7" />
			<rect x="14" y="3" width="7" height="7" />
			<rect x="3" y="14" width="7" height="7" />
			<path d="M14 17h7" />
		</svg>
	);
}

export function SoftwareIcon({ size = 32 }: { size?: number }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
			<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3" />
			<path d="M8 21H5a2 2 0 0 1-2-2v-3m18 0v3a2 2 0 0 1-2 2h-3" />
			<rect x="8" y="8" width="8" height="8" rx="1" />
		</svg>
	);
}

export function SoftwareTypeIcon({ size = 32 }: { size?: number }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
			<path d="M4 6h16M4 12h16M4 18h10" />
		</svg>
	);
}

export function LicenseIcon({ size = 32 }: { size?: number }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
			<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
			<path d="M14 2v6h6M9 15l2 2 4-4" />
		</svg>
	);
}

export function LicenseKeyIcon({ size = 32 }: { size?: number }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
			<circle cx="8" cy="15" r="4" />
			<path d="M11 15h10M16 12v6" />
		</svg>
	);
}

export function CalendarIcon({ size = 32 }: { size?: number }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
			<rect x="3" y="4" width="18" height="18" rx="2" />
			<path d="M16 2v4M8 2v4M3 10h18" />
		</svg>
	);
}

export function SubjectIcon({ size = 32 }: { size?: number }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
			<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
			<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
		</svg>
	);
}

export function ClassIcon({ size = 32 }: { size?: number }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
			<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
			<path d="M9 22V12h6v10" />
		</svg>
	);
}

export type AppIcon = ComponentType<{ size?: number }>;
