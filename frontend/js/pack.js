// based on https://observablehq.com/@d3/zoomable-circle-packing
export function pack(parent, props) {
  const {
    data, // nested objects
    z,
    color,
    startNodeName,
    clickHandler,
    value, // given a node d, returns a quantitative value (for area encoding; null for count)
  } = props;

  // ***** 1 - SETUP DIMENSIONS AND HIERARCHY *****
  const margin = 0;
  /*const width = +parent.attr('width') - margin;
  const height = +parent.attr('height') - margin;
 */
  const container = document.getElementById('circlepack-container');
  const width = Math.min(container.clientWidth, container.clientHeight);
  const height = width;

  const root = d3.pack()
    .size([width, height])
    .padding(0)
    (d3.hierarchy(data)
      .sum(value)
      .sort((a, b) => b.value - a.value));

  // ***** 2 - SETUP FOCUS AND VIEW *****
  const focusedNode = root.find(d => d.data.name === startNodeName);

  const view = [focusedNode.x, focusedNode.y, focusedNode.r * 2];
  const prevView = parent.property('view') || view; // second case only true upon initial load
  parent.property('view', view);

  const kPrev = width / prevView[2];
  const kNew = width / view[2];

  // get translation co-ords for a given node.
  const translateCoordsPrev = d => `translate(${(d.x - prevView[0]) * kPrev},${(d.y - prevView[1]) * kPrev})`;
  const translateCoordsNew = d => `translate(${(d.x - view[0]) * kNew},${(d.y - view[1]) * kNew})`;

  const transitionDuration = 600;

  // ***** 3 - SETUP PARENT SVG *****

  parent
    .attr("viewBox", `-${(width + margin) / 2} -${(height + margin) / 2} ${width + margin} ${height + margin}`)
    .style("cursor", "pointer");

  // ***** 4 - SETUP SVG GROUPS *****

  // Create groups if they don't exist (or select existing)
  const oldCirclesG = parent.select("g.circles");
  const circlesG = oldCirclesG.empty()
    ? parent.append("g")
      .attr("class", "circles")
      .attr("stroke", "#000")
      .attr("stroke-width", 0.1)
      .attr("r", 0)
    : oldCirclesG;

  const oldLabelsG = parent.select("g.labels");
  const labelsG = oldLabelsG.empty()
    ? parent.append("g")
      .attr("class", "labels")
    : oldLabelsG;


  const nodes = root.descendants();

  // ***** 5 - DRAW CIRCLES *****

  const circles = circlesG.selectAll("circle")
    .data(nodes, d => d.data.id);

  circles.join(
    enter => enter.append("circle")
      .attr("transform", translateCoordsPrev)
      .attr("fill", d => color(z(d)[0]))
      .attr("r", d => d.r * kPrev)
      .on("mouseover", handleMouseOver)
      .on("mousemove", handleMouseMove)
      .on("mouseout", handleMouseOut)
      .on("click", handleClick),

    update => update
      .call(update => update.transition().duration(transitionDuration)
        .attr("transform", translateCoordsNew)
        .attr("r", d => d.r * kNew)
        .attr("fill", d => color(z(d)[0]))
      ),

    exit => exit.remove() // circles are never removed so this doesnt matter
  );

  // ***** 6 - DRAW LABELS *****

  const parentIsfocusedNode = d => d.parent && d.parent.data.name === focusedNode.data.name;
  const visibleNodes = nodes.filter(parentIsfocusedNode);

  const labels = labelsG.selectAll("text.label")
    .data(visibleNodes, d => d.data.id);

  labels.join(
    enter => enter.append("text")
      .attr("class", "label")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .text(d => d.data.name)
      // on create, fade into view
      .style("fill-opacity", 0)
      .attr("transform", translateCoordsPrev)
      .call(enter => enter.transition().duration(transitionDuration)
        .style("fill-opacity", 1)
        .attr("transform", translateCoordsNew)
      ),

    update => update
      .call(enter => enter.transition().duration(transitionDuration)
        .style("fill-opacity", 1)
        .attr("transform", translateCoordsNew)
      ),

    exit => exit
      .call(exit => exit.transition().duration(transitionDuration)
        .style("fill-opacity", 0)
        .attr("transform", translateCoordsNew)
        .remove()
      )
  );

  // ***** 7 - HANDLE (CIRCLE) MOUSE EVENTS *****

  function handleMouseOver(event) {
    d3.select(event.target)
      .attr("stroke-width", 1)
      .style('filter', 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.83))')
    d3.select('#tooltip')
      .style('display', 'block')

  }

  function handleMouseMove(event, d) {
    requestAnimationFrame(() => {
      const tooltipHeight = 80;
      const padding = 15;
      const x = event.pageX + padding;
      let y = event.pageY + padding;

      // Clamp above if overflowing to the bottom
      if (y + tooltipHeight > window.innerHeight) {
        y = event.pageY - tooltipHeight + padding
      }
      d3.select('#tooltip')
        .style('left', x + 'px')
        .style('top', y + 'px')
        .html(`
          <div class="tooltip-title">${d.data.name}</div>
          <div><i>This makes up <b>${d3.format(".2~%")(d.value / 1000)}</b> of the total CPIH</i></div>
          <div>Change: <b>${d3.format("+.1%")(z(d)[1] - 1)}</b> (Annualised: <b>${d3.format("+.1%")(z(d)[0] - 1)}</b>)</div>
        `);
    });
  }

  function handleMouseOut(event) {
    d3.select(event.target)
      .attr("stroke-width", 0.1)
      .style('filter', 'none');
    d3.select('#tooltip').style('display', 'none');
  }

  function handleClick(_, d) {
    clickHandler(d)
  }
};
