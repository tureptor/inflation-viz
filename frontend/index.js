import { pack }  from './js/pack.js';

const packContainer = d3.select('#circlepack');

let margin = 0;
packContainer.attr("width", window.innerHeight - margin);
packContainer.attr("height", window.innerHeight - margin);

// these store loaded data
let data; // weights

// state variables
let focusedNode;  // stores circle node that has most recently been clicked

const circleClickHandler = (node) => {
  const userClickedAlreadyFocusedNode = focusedNode && node.data.name == focusedNode.data.name;
  focusedNode = userClickedAlreadyFocusedNode ? null : node;
  // null simulates initial page load and will zoom all the way out

  updateVis();
}

// this gets us the % change for the group "d"
// TODO - compute based off inputted months
const z = (months) => d => {
  let absoluteChange = d.data.indices["2025 MAR"] / d.data.indices["2020 MAR"];
  // TODO - allow switch from absolute to annualised change
  return true ? Math.pow(absoluteChange, 12/months) : absoluteChange;
}

// diverging colour scale
// TODO - compute scale ends based off covering 9X% of data points
let color = d3.scaleDiverging(t => d3.interpolateRdBu(1 - t))
              .domain([0.5, 1, 1.8]);

const updateVis = () => {
  packContainer.call(pack, {
    data: data,
    color,
    z: z(24), 
    startNode: focusedNode,
    clickHandler: circleClickHandler,
    value: d => d.children.length === 0 ? d.weight : 0, // the d3 hierarchy sum computes 
    // the sum of all descendants plus the actual node's value
    // this leads us to inaccurate results, so this conditional turns it into 
    // the layout it expects ("only leaves have non-zero value")
  });
};


// Load data and visualise tree
d3.json('./data/sample.json')
  .then(file => {
    data = file;
    updateVis()
});