export function initTooltipFade(
	tooltipSelector,
	iconSelector,
	fadeDuration = 2000,
) {
	const tooltip = d3.select(tooltipSelector);
	const icon = d3.select(iconSelector);

	// Start fade out on page load
	tooltip.transition().duration(fadeDuration).style("opacity", 0);

	// On icon hover, interrupt fade and show tooltip
	icon
		.on("mouseover", () => {
			tooltip.interrupt().style("opacity", 1);
		})
		.on("mouseout", () => {
			tooltip.style("opacity", 0);
		});
}
