export function drawLineChart(data, elementId) {

    const container = document.getElementById('linechart-container');
    const width = container.clientWidth;
    const height =  container.clientHeight;

    const parseTime = d3.timeParse("%Y %b");

    const series = Object.entries(data.indices)
        .map(([key, value]) => ({
            date: parseTime(key),
            value: +value
        }))
        .sort((a, b) => a.date - b.date);

    console.log(data);

    

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(`#${elementId}`)
        .attr("width", width)
        .attr("height", height);

    // Chart title
    const title = svg.selectAll(".chart-title").data([null]);
    title.join(
    enter => enter.append("text")
        .attr("class", "chart-title")
        .attr("x", width / 2)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .text(data.name),
    update => update.text(data.name)
    );

    // Y-axis label
    const yLabel = svg.selectAll(".y-axis-label").data([null]);
    yLabel.join(
    enter => enter.append("text")
        .attr("class", "y-axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -50)
        .attr("text-anchor", "middle")
        .text("CPIH Index")
    );

    // Remove old tooltip if any
    d3.select(`#${elementId}-tooltip`).remove();

    // Add tooltip div (absolute positioned)
    const tooltip = d3.select('#chart-tooltip');
    const g = svg.select("g.chart-group");
    let chartGroup;
    if (g.empty()) {
        chartGroup = svg.append("g").attr("class", "chart-group")
            .attr("transform", `translate(${margin.left},${margin.top})`);
    } else {
        chartGroup = g;
    }

    const x = d3.scaleTime()
        .domain(d3.extent(series, d => d.date))
        .range([0, innerWidth]);

    const y = d3.scaleLinear()
        .domain([0,d3.max(series, d => d.value)])
        .nice()
        .range([innerHeight, 0]);

    // Axes setup or update
    const xAxis = d3.axisBottom(x);
    const yAxis = d3.axisLeft(y);

    // X Axis
    let xAxisG = chartGroup.select("g.x-axis");
    if (xAxisG.empty()) {
        xAxisG = chartGroup.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(xAxis);
    } else {
        xAxisG.transition().duration(750).call(xAxis);
    }

    // Y Axis
    let yAxisG = chartGroup.select("g.y-axis");
    if (yAxisG.empty()) {
        yAxisG = chartGroup.append("g")
            .attr("class", "y-axis")
            .call(yAxis);
    } else {
        yAxisG.transition().duration(750).call(yAxis);
    }

    // Line generator
    const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.value));

    // Bind data to path
    let path = chartGroup.selectAll("path.line-path").data([series]);

    // Enter + update + exit for line
    path.join(
        enter => enter.append("path")
            .attr("class", "line-path")
            .attr("d", line)
            .attr("stroke", "#2196f3")
            .attr("fill", "none")
            .attr("opacity", 0)
            .transition()
            .duration(500)
            .attr("opacity", 1),
        update => update
            .attr("opacity", 0)
            .attr("d", line)
            .transition()
            .duration(500)
            .attr("opacity", 1),
 
        exit => exit.remove()
    );

    // Circles for hover points
    let circles = chartGroup.selectAll("circle.data-point").data(series, d => d.date);

    // Exit old circles
    circles.exit()
        .transition()
        .duration(500)
        .attr("r", 0)
        .remove();

    // Update existing circles
    circles.transition()
        .duration(750)
        .attr("cx", d => x(d.date))
        .attr("cy", d => y(d.value))
        .attr("r", 4)
        .attr("fill", "steelblue");

    // Enter new circles
    circles.enter()
        .append("circle")
        .attr("class", "data-point")
        .attr("cx", d => x(d.date))
        .attr("cy", d => y(d.value))
        .attr("r", 0)
        .attr("fill", "steelblue")
        .on("mousemove", (event, d) => {
            const tooltipWidth = 100;
            const padding = 20;
            const pageWidth = window.innerWidth;

            let x = event.pageX + padding;
            const y = event.pageY - 28;

            // Clamp to the left if overflowing to the right
            if (x + tooltipWidth > pageWidth - 25) {
                x = event.pageX - tooltipWidth - padding;
            }
            tooltip
                .style('display', 'block')
                .html(`<strong>${d3.timeFormat("%Y %b")(d.date)}</strong><br/>Value: ${d.value.toFixed(2)}`)
                .style("left", `${x}px`)
                .style("top", `${y}px`);
            d3.select(event.currentTarget).attr("fill", "orange").attr("r", 6);
        })
        .on("mouseleave", (event) => {
            tooltip.style('display', 'none');
            d3.select(event.currentTarget).attr("fill", "steelblue").attr("r", 4);
        })
        .transition()
        .duration(750)
        .attr("r", 4);
}