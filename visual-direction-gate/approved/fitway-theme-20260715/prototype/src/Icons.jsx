function Icon({ children, className, ...props }) {
	return (
		<svg
			{...props}
			aria-hidden="true"
			className={className}
			fill="none"
			focusable="false"
			height="1em"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="1.8"
			viewBox="0 0 24 24"
			width="1em"
		>
			{children}
		</svg>
	);
}

export function ClockIcon(props) {
	return (
		<Icon {...props}>
			<circle cx="12" cy="12" r="8.5" />
			<path d="M12 7.5V12l3 1.8" />
		</Icon>
	);
}

export function WifiOffIcon(props) {
	return (
		<Icon {...props}>
			<path d="m3 3 18 18" />
			<path d="M8.5 6.1A14.7 14.7 0 0 1 21 9.6" />
			<path d="M3 9.6a14.8 14.8 0 0 1 2.7-1.5" />
			<path d="M6.5 13a9.4 9.4 0 0 1 5.4-1.8" />
			<path d="M15.5 13a9.7 9.7 0 0 1 2 1.3" />
			<path d="M9.8 16.4a4 4 0 0 1 4.4 0" />
			<circle cx="12" cy="19.25" fill="currentColor" r="1" stroke="none" />
		</Icon>
	);
}

export function AlertTriangleIcon(props) {
	return (
		<Icon {...props}>
			<path d="M10.5 4.2 2.9 17.4A1.7 1.7 0 0 0 4.4 20h15.2a1.7 1.7 0 0 0 1.5-2.6L13.5 4.2a1.7 1.7 0 0 0-3 0Z" />
			<path d="M12 9v4.5" />
			<circle cx="12" cy="16.8" fill="currentColor" r=".8" stroke="none" />
		</Icon>
	);
}

export function MoonIcon(props) {
	return (
		<Icon {...props}>
			<path d="M20.2 15.1A8.5 8.5 0 0 1 8.9 3.8 8.5 8.5 0 1 0 20.2 15Z" />
		</Icon>
	);
}

export function ActivityBarsIcon(props) {
	return (
		<Icon {...props}>
			<path d="M5 19v-5M10 19V9M15 19V5M20 19v-8" />
		</Icon>
	);
}

export function EditIcon(props) {
	return (
		<Icon {...props}>
			<path d="M13.4 5.1 18.9 10.6" />
			<path d="m4 20 4.2-1 11.4-11.4a2 2 0 0 0-2.8-2.8L5.4 16.2 4 20Z" />
		</Icon>
	);
}

export function DownloadIcon(props) {
	return (
		<Icon {...props}>
			<path d="M12 3v12" />
			<path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
			<path d="M4 19.5h16" />
		</Icon>
	);
}

export function SettingsIcon(props) {
	return (
		<Icon {...props}>
			<circle cx="12" cy="12" r="3" />
			<path d="M19.1 13.5a7.7 7.7 0 0 0 0-3l2-1.4-2-3.4-2.3 1a8.6 8.6 0 0 0-2.6-1.5L14 2.8h-4l-.3 2.4a8.6 8.6 0 0 0-2.6 1.5l-2.2-1-2 3.4 2 1.4a7.7 7.7 0 0 0 0 3l-2 1.4 2 3.4 2.2-1a8.6 8.6 0 0 0 2.6 1.5l.3 2.4h4l.3-2.4a8.6 8.6 0 0 0 2.6-1.5l2.3 1 2-3.4-2.1-1.4Z" />
		</Icon>
	);
}

export function UsersIcon(props) {
	return (
		<Icon {...props}>
			<circle cx="9" cy="8.5" r="3" />
			<path d="M3.5 19v-1a5.5 5.5 0 0 1 11 0v1" />
			<path d="M15.2 6.1a3 3 0 0 1 0 5.8M16.5 14a5.5 5.5 0 0 1 4 5" />
		</Icon>
	);
}

export function AccessIcon(props) {
	return (
		<Icon {...props}>
			<circle cx="8" cy="8" r="3" />
			<path d="M2.8 19a5.2 5.2 0 0 1 10.4 0" />
			<circle cx="17.5" cy="14.5" r="3" />
			<path d="m19.7 16.7 2.3 2.3M21 18l-1.2 1.2" />
		</Icon>
	);
}

export function AuditIcon(props) {
	return (
		<Icon {...props}>
			<path d="M9 5h10v16H5V5h2" />
			<path d="M8 3h4a1 1 0 0 1 1 1v2H7V4a1 1 0 0 1 1-1Z" />
			<path d="m8 12 1.3 1.3L12 10.5M8 17h7" />
		</Icon>
	);
}

export function ListIcon(props) {
	return (
		<Icon {...props}>
			<path d="M9 6h11M9 12h11M9 18h11" />
			<circle cx="4.5" cy="6" fill="currentColor" r=".85" stroke="none" />
			<circle cx="4.5" cy="12" fill="currentColor" r=".85" stroke="none" />
			<circle cx="4.5" cy="18" fill="currentColor" r=".85" stroke="none" />
		</Icon>
	);
}

export function PulseIcon(props) {
	return (
		<Icon {...props}>
			<path d="M2.5 12h4l2-5 3.2 10 2.5-7 1.8 2h5.5" />
		</Icon>
	);
}

export const HealthIcon = PulseIcon;

export function ChevronIcon(props) {
	return (
		<Icon {...props}>
			<path d="m9 5 7 7-7 7" />
		</Icon>
	);
}

export function MinusIcon(props) {
	return (
		<Icon {...props}>
			<path d="M5 12h14" />
		</Icon>
	);
}

export function PlusIcon(props) {
	return (
		<Icon {...props}>
			<path d="M12 5v14M5 12h14" />
		</Icon>
	);
}

export function RefreshIcon(props) {
	return (
		<Icon {...props}>
			<path d="M20 7v5h-5" />
			<path d="M18.3 16.5A8 8 0 1 1 19.8 10L20 12" />
		</Icon>
	);
}

export function LockIcon(props) {
	return (
		<Icon {...props}>
			<rect height="10" rx="2" width="16" x="4" y="10" />
			<path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2" />
		</Icon>
	);
}

export function EyeIcon(props) {
	return (
		<Icon {...props}>
			<path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
			<circle cx="12" cy="12" r="2.5" />
		</Icon>
	);
}

export function EyeOffIcon(props) {
	return (
		<Icon {...props}>
			<path d="m3 3 18 18" />
			<path d="M10.3 6.2A9 9 0 0 1 12 6c6 0 9.5 6 9.5 6a16.7 16.7 0 0 1-2.2 2.8M6.2 6.2A16.7 16.7 0 0 0 2.5 12s3.5 6 9.5 6a9 9 0 0 0 4.2-1" />
			<path d="M9.8 9.8a3 3 0 0 0 4.4 4.4" />
		</Icon>
	);
}

export function CheckIcon(props) {
	return (
		<Icon {...props}>
			<path d="m4.5 12.5 4.5 4.5L19.5 6.5" />
		</Icon>
	);
}
