import { pack }  from './js/pack.js';
import { drawLineChart } from './js/chart.js';
import { setupSelectors, getDateRange, getMonthsDiff, setEndDateFromString } from './js/selectors.js';


const packContainer = d3.select('#circlepack');

let margin = 0;
packContainer.attr("width", window.innerHeight - margin);
packContainer.attr("height", window.innerHeight - margin);


setupSelectors(updateDateRange)

// these store loaded data
let data;
let flattenedData = [];

// state variables
let focusedNode;  // stores circle node that has most recently been clicked
let startDate="2015 JAN";
let endDate="2025 APR";


function updateDateRange() {
  const { startStr, endStr } = getDateRange();
  console.log(startStr, endStr)
  startDate = startStr;
  endDate = endStr;
  console.log(startDate, endDate);
  updateVis();
}

const circleClickHandler = (node) => {
  const userClickedAlreadyFocusedNode = focusedNode && node.data.name == focusedNode.data.name;
  focusedNode = userClickedAlreadyFocusedNode ? null : node;
  // null simulates initial page load and will zoom all the way out
  console.log(node);
  updateVis();
}

// this gets us the % change for the group "d"
const z = accessor => d => {
  if (endDate === startDate) {
    return 1;
  }
  let absoluteChange = accessor(d)[endDate] / accessor(d)[startDate];
  // TODO - allow switch from absolute to annualised change
  return true ? Math.pow(absoluteChange, 12/getMonthsDiff()) : absoluteChange;
}

// diverging colour scale
// TODO - compute scale ends based off covering 9X% of data points

function color() {
  const pLow = 5;
  const pHigh = 95;
  // Step 1: Apply func to each object
  const values = flattenedData.map(z(d => d.indices)).sort((a, b) => a - b);
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
  return d3.scaleDiverging(t => d3.interpolateRdBu(1 - t))
                .domain([Math.min(0.95,percentile(pLow)), 1, Math.max(1.05,percentile(pHigh))]);
}

const updateVis = () => {
  packContainer.call(pack, {
    data: data,
    color: color(),
    z: z(d => d.data.indices), 
    startNode: focusedNode,
    clickHandler: circleClickHandler,
    value: d => d.children.length === 0 ? d.weight : 0, // the d3 hierarchy sum computes 
    // the sum of all descendants plus the actual node's value
    // this leads us to inaccurate results, so this conditional turns it into 
    // the layout it expects ("only leaves have non-zero value")
  });
  drawLineChart(focusedNode && focusedNode.data || data, "linechart");
};

function recurse(node) {
    flattenedData.push(node);
    for (const child of node.children) {
        recurse(child);
    }
  }

// Load data and visualise tree
d3.json('./data/cpih.json')
  .then(file => {
    data = file;
    recurse(data);
    setEndDateFromString(Object.keys(data.indices).at(-1))
    updateVis()
});