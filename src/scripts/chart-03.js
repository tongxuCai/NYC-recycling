import * as d3 from 'd3'

const margin = { top: 0, left: 0, right: 0, bottom: 0 }
const height = 600 - margin.top - margin.bottom
const width = 750 - margin.left - margin.right

const svg = d3
  .select('#chart-3')
  .append('svg')
  .attr('height', height + margin.top + margin.bottom)
  .attr('width', width + margin.left + margin.right)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

const xPositionScale = d3
  .scaleLinear()
  .domain([0, 70])
  .range([0, 700])

const yPositionScale = d3
  .scaleLinear()
  .domain([0, 1])
  .range([500, 0])

const colorScale = d3.scaleOrdinal(d3.schemePastel1)

d3.csv(require('/data/bin-and-pct.csv'))
  .then(ready)
  .catch(function(err) {
    console.log('Failed with', err)
  })

function ready(datapoints) {
  // console.log(datapoints)
  svg
    .selectAll('circle')
    .data(datapoints)
    .enter()
    .append('circle')
    .attr('r', 5)
    .attr('fill', 'lightgrey')
    .attr('cx', d => xPositionScale(d.CountBoroCD))
    .attr('cy', d => yPositionScale(d.pct_recyc_2018))
    .attr('fill', d => colorScale(d.BoroCD[0]))

  const yAxis = d3.axisLeft(yPositionScale)
  svg
    .append('g')
    .attr('class', 'axis y-axis')
    .call(yAxis)

  const xAxis = d3.axisBottom(xPositionScale)
  svg
    .append('g')
    .attr('class', 'axis x-axis')
    .attr('transform', 'translate(0,' + height + ')')
    .call(xAxis)

}
