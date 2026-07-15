export function PublicAtmosphere() {
	return (
		<div className="public-atmosphere" aria-hidden="true">
			<div className="public-atmosphere__cut-light" />
			<div className="public-atmosphere__vignette" />
			<img
				className="public-atmosphere__watermark"
				src="/fitway-logo.png"
				width="620"
				height="620"
				alt=""
			/>
		</div>
	);
}
