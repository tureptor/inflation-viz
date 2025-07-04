import { drawLineChart } from "./js/chart.js";
import { pack } from "./js/pack.js";
import {
	getDateRange,
	getMonthsDiff,
	getSelectedItem,
	setEndDateFromString,
	setupSelectors,
} from "./js/selectors.js";

const packContainer = d3.select("#circlepack");

const margin = 0;
packContainer.attr("width", window.innerHeight - margin);
packContainer.attr("height", window.innerHeight - margin);

// these store loaded data
let data;
const flattenedData = {};

// state variables
let focusedNodeName = "Overall Index"; // stores circle node that has most recently been clicked
let startDate = "2015 JAN";
let endDate = "2025 APR";

function updateDateRange() {
	const { startStr, endStr } = getDateRange();
	startDate = startStr;
	endDate = endStr;
	updateVis();
}

function updateSelectedNode() {
	const selection = getSelectedItem();
	if (selection in flattenedData) {
		focusedNodeName = selection;
		updateVis();
	}
}

const circleClickHandler = (node) => {
	const userClickedAlreadyfocusedNodeName = focusedNodeName === node.data.name;
	focusedNodeName = userClickedAlreadyfocusedNodeName
		? "Overall Index"
		: node.data.name;
	// null simulates initial page load and will zoom all the way out
	updateVis();
};

// this gets us the % change for the group "d"
const z = (accessor) => (d) => {
	if (endDate === startDate) {
		return 1;
	}
	const absoluteChange = accessor(d)[endDate] / accessor(d)[startDate];
	return [absoluteChange ** (12 / getMonthsDiff()), absoluteChange];
};

// diverging colour scale
function color() {
	const pLow = 5; // 5th percentile
	const pHigh = 95;

	// compute change for each node. we will set colour range based off pLow and pHigh of changes
	const values = Object.values(flattenedData)
		.map((x) => z((d) => d.indices)(x)[0])
		.sort((a, b) => a - b);
	const n = values.length;

	// Helper to get percentile value by linear interpolation
	function percentile(p) {
		const rank = (p / 100) * (n - 1);
		const lower = Math.floor(rank);
		const upper = Math.ceil(rank);
		if (lower === upper) return values[lower];
		// interpolate between the two closest ranks
		return values[lower] + (values[upper] - values[lower]) * (rank - lower);
	}
	return d3
		.scaleDiverging((t) => d3.interpolateRdBu(1 - t))
		.domain([
			Math.min(0.95, percentile(pLow)),
			1,
			Math.max(1.05, percentile(pHigh)),
		]);
}

const updateVis = () => {
	packContainer.call(pack, {
		data: data,
		color: color(),
		z: z((d) => d.data.indices),
		startNodeName: focusedNodeName,
		clickHandler: circleClickHandler,
		value: (d) => (d.children.length === 0 ? d.weight : 0), // the d3 hierarchy sum computes
		// the sum of all descendants plus the actual node's value
		// this leads us to inaccurate results, so this conditional turns it into
		// the layout it expects ("only leaves have non-zero value")
	});
	drawLineChart(flattenedData[focusedNodeName], "linechart");
};

function recurse(node) {
	flattenedData[node.name] = node;
	for (const child of node.children) {
		recurse(child);
	}
}

// Load data and visualise tree
d3.json("./data/cpih.json").then((file) => {
	data = file;
	recurse(data);

	const latestDate = Object.keys(data.indices).at(-1);
	setupSelectors(
		updateDateRange,
		updateSelectedNode,
		2015,
		+latestDate.split(" ")[0],
		Object.keys(flattenedData),
	);
	setEndDateFromString(latestDate);

	updateVis();
});
