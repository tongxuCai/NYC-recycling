import * as d3 from 'd3'
import * as topojson from 'topojson'

const margin = { top: 10, left: 0, right: 0, bottom: 10 }
const height = 550 - margin.top - margin.bottom
const width = 800 - margin.left - margin.right

const svg = d3
  .select('#chart-2')
  .append('svg')
  .attr('height', height + margin.top + margin.bottom)
  .attr('width', width + margin.left + margin.right)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

const projection = d3.geoMercator().translate([width / 2, height / 2])
const path = d3.geoPath().projection(projection)

Promise.all([
  d3.json(require('/data/joined_data.json')),
  d3.csv(require('/data/Public_Recycling_Bins.csv')),
  d3.csv(require('/data/joined_and_tonnage.csv')),
  d3.csv(require('/data/racing_bar_chart.csv'))
])
  .then(ready)
  .catch(err => console.log('Failed on', err))

function ready([json, datapoints]) {
  const districts = topojson.feature(json, json.objects.joined_data)
  const center = d3.geoCentroid(districts)
  projection.center(center)
  const colorScale = d3
    .scaleLinear()
    .domain([10, 65])
    .range(['white', 'navy'])

  svg
    .selectAll('.districts-2')
    .data(districts.features)
    .enter()
    .append('path')
    .attr('class', 'districts-2')
    .attr('d', path)
    .attr('stroke', function(d) {
      return 'none'
    })
    .attr('fill', function(d) {
      return colorScale(+d.properties.pct_foreign_born)
    })
    .attr('opacity', 1)

  svg
    .selectAll('.bins')
    .data(datapoints)
    .enter()
    .append('circle')
    .attr('r', 2)
    .attr('class', 'bins')
    .attr('stroke', 'none')
    .attr('opacity', 0.9)
    .attr('fill', 'green')
    .attr('transform', function(d) {
      const coords = [d.Longitude, d.Latitude]
      return `translate(${projection(coords)})`
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
    projection.fitSize([newWidth, newHeight], districts)

    // Update things you draw
    svg.selectAll('.districts-2').attr('d', path)
    svg.selectAll('.bins').attr('transform', function(d) {
      const coords = [d.Longitude, d.Latitude]
      return `translate(${projection(coords)})`
    })
  }

  window.addEventListener('resize', render)
  render()
}
