import * as d3 from 'd3'
import * as topojson from 'topojson'

const margin = { top: 0, left: 0, right: 0, bottom: 0 }
const height = 600 - margin.top - margin.bottom
const width = 750 - margin.left - margin.right

const svg = d3
  .select('#chart-2')
  .append('svg')
  .attr('height', height + margin.top + margin.bottom)
  .attr('width', width + margin.left + margin.right)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

const projection = d3
  .geoMercator()
  .scale(57000)
  .translate([width / 2, height / 2])
const path = d3.geoPath().projection(projection)

Promise.all([
  d3.json(require('/data/joined_data.json')),
  d3.csv(require('/data/Public_Recycling_Bins.csv'))
])
  .then(ready)
  .catch(err => console.log('Failed on', err))

function ready([json, datapoints]) {
  const districts = topojson.feature(json, json.objects.joined_data)
  const center = d3.geoCentroid(districts)
  projection.center(center)

  svg
    .selectAll('path')
    .data(districts.features)
    .enter()
    .append('path')
    .attr('class', 'districts-2')
    .attr('d', path)
    .attr('stroke', function(d) {
      return 'none'
    })
    .attr('fill', 'lightgray')
    .attr('opacity', 1)

  svg
    .selectAll('circle')
    .data(datapoints)
    .enter()
    .append('circle')
    .attr('r', 2)
    .attr('class', 'bins')
    .attr('stroke', 'none')
    .attr('opacity', 0.55)
    .attr('fill', 'green')
    .attr('transform', function(d) {
      const coords = [d.Longitude, d.Latitude]
      return `translate(${projection(coords)})`
    })
}
