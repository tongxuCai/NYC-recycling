import * as d3 from 'd3'

const margin = { top: 20, left: 75, right: 75, bottom: 20 }
const height = 200 - margin.top - margin.bottom
const width = 600 - margin.left - margin.right

const svg = d3
  .select('#chart-trash')
  .append('svg')
  .attr('height', height + margin.top + margin.bottom)
  .attr('width', width + margin.left + margin.right)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

const xPositionScale = d3.scalePoint().range([0, width])
const radiusScale = d3.scaleSqrt()
const colorScale = d3.scaleOrdinal(d3.schemePastel1)

d3.csv(require('/data/joined_and_tonnage.csv'))
  .then(ready)
  .catch(err => {
    console.log(err)
  })

function ready(datapoints) {
  const filtered = datapoints.filter(function(d) {
    if (+d.year === 2019) {
      return d
    }
  })

  console.log(filtered)

  const nested = d3
    .nest()
    .key(d => d.BOROUGH)
    .rollup(function(d) {
      return {
        totalWaste: d3.sum(d, f => +f.REFUSETONSCOLLECTED),
        meanWaste: d3.mean(d, f => +f.REFUSETONSCOLLECTED),
        totalRecycled: d3.median(d, f => +f.REFUSETONSCOLLECTED / +f.acres),
        pctRecycled: d3.mean(
          d,
          f => +f.total_recycled / +f.REFUSETONSCOLLECTED / +f.acres
        ),
        povertyRate: d3.median(d, f => +f.poverty_rate),
        recyclePerCapita: d3.sum(d, f => +f.pop_acs / +f.total_recycled)
      }
    })
    .entries(filtered)

  const keys = nested.map(d => d.key)
  colorScale.domain(keys)
  xPositionScale.domain(keys)

  console.log(nested)

  svg
    .selectAll('.boroughs')
    .data(nested)
    .enter()
    .append('circle')
    .attr('class', 'boroughs')
    .attr('cy', height / 2)
    .attr('cx', d => xPositionScale(d.key))
    .attr('r', 20)
    .attr('fill', d => colorScale(d.key))

  svg
    .selectAll('.labels')
    .data(nested)
    .enter()
    .append('text')
    .text(d => d.key)
    .attr('class', 'labels')
    .attr('alignment-baseline', 'middle')
    .attr('text-anchor', 'middle')
    .attr('x', d => xPositionScale(d.key))

  function step(stepNum, column) {
    d3.select('#step-' + stepNum).on('stepin', function() {
      nested.sort(function(a, b) {
        return a.value[column] - b.value[column]
      })
      const keys = nested.map(d => d.key)
      xPositionScale.domain(keys)
      console.log(keys[0])

      const radiusExtent = nested.map(d => d.value[column])
      radiusScale.domain(d3.extent(radiusExtent))

      svg
        .selectAll('.boroughs')
        .transition()
        .duration(700)
        .attr('r', function(d) {
          return radiusScale(d.value[column])
        })
        .attr('cy', height / 2)
        .attr('cx', d => xPositionScale(d.key))
        .attr('fill', d => colorScale(d.key))
      svg
        .selectAll('.labels')
        .transition()
        .duration(700)
        .attr('y', height / 2)
        .attr('x', d => xPositionScale(d.key))
    })
  }

  step(1, 'totalWaste')
  step(2, 'meanWaste')
  step(3, 'totalRecycled')
  step(4, 'pctRecycled')
  step(5, 'povertyRate')
  step(6, 'recyclePerCapita')

  for (let key = 0; key < keys.length; key++) {
    d3.selectAll('#label-' + keys[key].toLowerCase().replace(/[^a-z]*/g, ''))
      .style('background', colorScale(keys[key]))
      .style('padding', '0px 2px')
      .style('border-radius', '3px')
  }

  function render() {
    const svgContainer = svg.node().closest('div')
    const svgWidth = svgContainer.offsetWidth
    // Do you want it to be full height? Pick one of the two below
    const svgHeight = height + margin.top + margin.bottom
    // const svgHeight = window.innerHeight

    const actualSvg = d3.select(svg.node().closest('svg'))
    actualSvg.attr('width', svgWidth).attr('height', svgHeight)

    const newWidth = svgWidth - margin.left - margin.right
    const newHeight = svgHeight - margin.top - margin.bottom

    // Update our scale
    xPositionScale.range([0, newWidth])
    radiusScale.range([3, newWidth * 0.11])

    // Update things you draw
    svg
      .selectAll('.boroughs')
      .attr('cy', newHeight / 2)
      .attr('cx', d => xPositionScale(d.key))

    svg
      .selectAll('.labels')
      .attr('y', newHeight / 2)
      .attr('dy', 75)
      .attr('x', d => xPositionScale(d.key))
  }

  // When the window resizes, run the function
  // that redraws everything
  window.addEventListener('resize', render)

  // And now that the page has loaded, let's just try
  // to do it once before the page has resized
  render()
}
