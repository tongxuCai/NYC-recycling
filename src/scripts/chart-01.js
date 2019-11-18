import * as d3 from 'd3'
import * as topojson from 'topojson'

const margin = { top: 50, left: 50, right: 50, bottom: 50 }
const height = 600 - margin.top - margin.bottom
const width = 700 - margin.left - margin.right

const svg = d3
  .select('#chart-1')
  .append('svg')
  .attr('height', height + margin.top + margin.bottom)
  .attr('width', width + margin.left + margin.right)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

const projection = d3
  .geoMercator()
  .scale(50000)
  .translate([width / 2, height / 2])
const graticule = d3.geoGraticule()
const path = d3.geoPath().projection(projection)

const boroughColorScale = d3.scaleOrdinal(d3.schemeSet2)

Promise.all([
  d3.json(require('/data/community-districts.json')),
  d3.csv(require('/data/monthly-tonnage-clean.csv'))
])
  .then(ready)
  .catch(err => console.log('Failed on', err))

function ready([json, datapoints]) {
  const districts = topojson.feature(json, json.objects['community-districts'])
  const center = d3.geoCentroid(districts)
  projection.center(center)

  console.log(datapoints)
  console.log(districts)

  svg
    .selectAll('path')
    .data(districts.features)
    .enter()
    .append('path')
    .attr('class', 'districts')
    .attr('d', path)
    .attr('stroke', function(d) {
      return boroughColorScale(d.properties.boro_cd[0])
    })
}
