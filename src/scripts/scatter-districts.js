import * as d3 from 'd3'
import * as topojson from 'topojson'
import d3Annotation from 'd3-svg-annotation'

const margin = { top: 20, left: 20, right: 20, bottom: 20 }
const height = 300 - margin.top - margin.bottom
const width = 550 - margin.left - margin.right

const svg = d3
  .select('#scatter-districts')
  .append('svg')
  .attr('height', height + margin.top + margin.bottom)
  .attr('width', width + margin.left + margin.right)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

const colorScale = d3.scaleOrdinal(d3.schemePastel1)
const xPositionScale = d3.scaleLinear().range([0, width])
const yPositionScale = d3.scaleLinear().range([height, 0])

d3.json(require('/data/joined_data.json'))
  .then(ready)
  .catch(err => console.log('Failed with', err))

function ready(datapoints) {
  const districts = topojson.feature(datapoints, datapoints.objects.joined_data)

  const percentRecycledExtent = districts.features.map(
    d => +d.properties.pct_change
  )
  yPositionScale.domain(d3.extent(percentRecycledExtent))

  const povertyExtent = districts.features.map(d => +d.properties.poverty_rate)
  xPositionScale.domain(d3.extent(povertyExtent))

  svg
    .selectAll('districts-scatter')
    .data(districts.features)
    .enter()
    .append('circle')
    .attr('class', 'districts-scatter')
    .attr('r', 5)
    .attr('fill', function(d) {
      // console.log(d)
      return colorScale(d.properties.boro_cd[0])
    })

  function render() {
    const svgContainer = svg.node().closest('div')
    const svgWidth = svgContainer.offsetWidth
    const svgHeight = height + margin.top + margin.bottom

    const actualSvg = d3.select(svg.node().closest('svg'))
    actualSvg.attr('width', svgWidth).attr('height', svgHeight)

    const newWidth = svgWidth - margin.left - margin.right
    const newHeight = svgHeight - margin.top - margin.bottom

    // Update our scale
    xPositionScale.range([0, newWidth])
    yPositionScale.range([newHeight, 0])

    // Update things you draw
    svg
      .selectAll('.districts-scatter')
      .attr('cx', d => xPositionScale(+d.properties.poverty_rate))
      .attr('cy', d => yPositionScale(+d.properties.pct_change))

    const yAxis = d3.axisLeft(yPositionScale)
    svg
      .append('g')
      .attr('class', 'axis y-axis')
      .call(yAxis)

    const xAxis = d3.axisBottom(xPositionScale)
    svg
      .append('g')
      .attr('class', 'axis x-axis')
      .attr('transform', `translate(0,${newHeight})`)
      .call(xAxis)
  }

  window.addEventListener('resize', render)
  render()
}
