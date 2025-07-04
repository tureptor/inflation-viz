export function drawLineChart(data, elementId) {
	const container = document.getElementById("linechart-container");
	const width = container.clientWidth;
	const height = container.clientHeight;

	const parseTime = d3.timeParse("%Y %b");

	const series = Object.entries(data.indices)
		.map(([key, value]) => ({
			date: parseTime(key),
			value: +value,
		}))
		.sort((a, b) => a.date - b.date);

	const margin = { top: 20, right: 30, bottom: 40, left: 50 };
	const innerWidth = width - margin.left - margin.right;
	const innerHeight = height - margin.top - margin.bottom;

	const transitionDuration = 600;

	const svg = d3
		.select(`#${elementId}`)
		.attr("width", width)
		.attr("height", height);

	svg
		.selectAll(".chart-title")
		.data([null])
		.join(
			(enter) =>
				enter
					.append("text")
					.attr("class", "chart-title")
					.attr("x", width / 2)
					.attr("y", 30)
					.attr("text-anchor", "middle")
					.text(data.name),
			(update) => update.text(data.name),
		);

	// Hint to user regarding zoom hint
	const zoomHint = svg.selectAll(".zoom-hint").data([null]);
	zoomHint.join((enter) =>
		enter
			.append("text")
			.attr("class", "zoom-hint")
			.attr("x", width / 2)
			.attr("y", 60)
			.attr("text-anchor", "middle")
			.attr("fill", "#999")
			.attr("font-size", "12px")
			.text("Highlight a region to zoom in. Right-click to reset zoom."),
	);

	const yAxisLabel = svg.selectAll(".y-axis-label").data([null]);
	yAxisLabel.join((enter) =>
		enter
			.append("text")
			.attr("class", "y-axis-label")
			.attr("transform", "rotate(-90)")
			.attr("x", -height / 2)
			.attr("y", -50)
			.attr("text-anchor", "middle")
			.text("CPIH Index"),
	);

	d3.select(`#${elementId}-tooltip`).remove();
	const tooltip = d3.select("#chart-tooltip");

	let chartGroup = svg.select("g.chart-group");
	if (chartGroup.empty()) {
		chartGroup = svg
			.append("g")
			.attr("class", "chart-group")
			.attr("transform", `translate(${margin.left},${margin.top})`);
	}

	const x = d3.scaleTime().range([0, innerWidth]);
	const y = d3
		.scaleLinear()
		.range([innerHeight, 0])
		.domain([0, d3.max(series, (d) => d.value)]); // Fixed y domain

	const xAxis = d3.axisBottom(x);
	const yAxis = d3.axisLeft(y);

	let xAxisG = chartGroup.select("g.x-axis");
	if (xAxisG.empty()) {
		xAxisG = chartGroup
			.append("g")
			.attr("class", "x-axis")
			.attr("transform", `translate(0,${innerHeight})`);
	}

	let yAxisG = chartGroup.select("g.y-axis");
	if (yAxisG.empty()) {
		yAxisG = chartGroup.append("g").attr("class", "y-axis");
	}

	const line = d3
		.line()
		.x((d) => x(d.date))
		.y((d) => y(d.value));

	let path = chartGroup.selectAll("path.line-path").data([[]]);

	let circles = chartGroup.selectAll("circle.data-point").data([[]]);

	// Horizontal brush
	const brush = d3
		.brushX()
		.extent([
			[0, 0],
			[innerWidth, innerHeight],
		])
		.on("end", brushed);

	let brushG = chartGroup.select("g.brush");
	if (brushG.empty()) {
		brushG = chartGroup
			.insert("g", ":first-child") // ⬅ insert behind everything
			.attr("class", "brush")
			.call(brush);
	} else {
		brushG.call(brush);
	}

	// right click resets zoom
	svg.on("contextmenu", (event) => {
		event.preventDefault();
		renderChart(series); // Reset zoom to full data
	});

	// Initial draw
	renderChart(series);

	function renderChart(dataSubset) {
		x.domain(d3.extent(dataSubset, (d) => d.date));
		// y.domain([0, d3.max(dataSubset, d => d.value)]);

		xAxisG.transition().duration(transitionDuration).call(xAxis);
		yAxisG.transition().duration(transitionDuration).call(yAxis);

		// Year lines
		const years = d3.timeYear.range(x.domain()[0], x.domain()[1]);

		const yearLines = chartGroup
			.selectAll(".year-line")
			.data(years, (d) => d.getFullYear());

		yearLines.join(
			(enter) =>
				enter
					.append("line")
					.attr("class", "year-line")
					.attr("x1", (d) => x(d))
					.attr("x2", (d) => x(d))
					.attr("y1", 0)
					.attr("y2", innerHeight)
					.attr("stroke", "#ddd")
					.attr("stroke-width", 1)
					.attr("stroke-dasharray", "2,2")
					.attr("opacity", 0)
					.transition()
					.duration(transitionDuration)
					.attr("opacity", 1),
			(update) =>
				update
					.transition()
					.duration(transitionDuration)
					.attr("x1", (d) => x(d))
					.attr("x2", (d) => x(d)),
			(exit) => exit.remove(),
		);

		path = chartGroup.selectAll("path.line-path").data([dataSubset]);
		path.join(
			(enter) =>
				enter
					.append("path")
					.attr("class", "line-path")
					.attr("fill", "none")
					.attr("stroke", "#2196f3")
					.attr("opacity", 0)
					.attr("d", line)
					.transition()
					.duration(transitionDuration)
					.attr("opacity", 1),
			(update) =>
				update.transition().duration(transitionDuration).attr("d", line),
			(exit) => exit.remove(),
		);

		circles = chartGroup
			.selectAll("circle.data-point")
			.data(dataSubset, (d) => d.date);
		circles.join(
			(enter) =>
				enter
					.append("circle")
					.attr("class", "data-point")
					.attr("r", 0)
					.attr("fill", "steelblue")
					.attr("cx", (d) => x(d.date))
					.attr("cy", (d) => y(d.value))
					.on("mousemove", mouseMoveHandler)
					.on("mouseleave", mouseLeaveHandler)
					.transition()
					.duration(transitionDuration)
					.attr("r", 4), // Grow into view
			(update) =>
				update
					.transition()
					.duration(transitionDuration)
					.attr("cx", (d) => x(d.date))
					.attr("cy", (d) => y(d.value))
					.attr("r", 4),
			(exit) => exit.remove(),
		);
	}

	function brushed(event) {
		if (!event.selection) return;
		const [x0, x1] = event.selection;
		const newDomain = [x.invert(x0), x.invert(x1)];
		const filtered = series.filter(
			(d) => d.date >= newDomain[0] && d.date <= newDomain[1],
		);
		renderChart(filtered);
		brushG.call(brush.move, null); // Clear selection
	}

	function mouseMoveHandler(event, d) {
		d3.select(event.currentTarget).attr("fill", "orange").attr("r", 6);
		const tooltipWidth = 120;
		const padding = 15;
		const pageWidth = window.innerWidth;
		let xPos = event.pageX + padding;
		const yPos = event.pageY + padding;
		if (xPos + tooltipWidth > pageWidth - padding) {
			xPos = event.pageX - tooltipWidth + padding;
		}
		tooltip
			.style("display", "block")
			.html(
				`<strong>${d3.timeFormat("%Y %b")(d.date)}</strong><br/>CPIH Index: ${d.value.toFixed(2)}`,
			)
			.style("left", `${xPos}px`)
			.style("top", `${yPos}px`);
	}

	function mouseLeaveHandler(event) {
		tooltip.style("display", "none");
		d3.select(event.currentTarget).attr("fill", "steelblue").attr("r", 4);
	}
}
