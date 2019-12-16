import * as d3 from 'd3'
import * as topojson from 'topojson'
import d3Tip from 'd3-tip'
import d3Annotation from 'd3-svg-annotation'
d3.tip = d3Tip

const margin = { top: 10, left: 10, right: 10, bottom: 10 }
const height = 100 - margin.top - margin.bottom
const width = 100 - margin.left - margin.right

const container = d3.select('#manhattan-chart')

const projection = d3.geoMercator().translate([width / 2, height / 2])
const path = d3.geoPath().projection(projection)

const colorScalePositive = d3.scaleSequential(d3.interpolateBlues)
const colorScaleNegative = d3.scaleSequential(d3.interpolateReds)

const radiusScale = d3.scaleSqrt().range([1, 20])

const tip = d3
  .tip()
  .attr('class', 'tooltip')
  .offset([-15, 0])
  .html(function(d) {
    return `<strong>${d.properties.cd_short_title}</strong>
    <p>2018: ${d3.format('.0%')(d.properties.pct_recyc_2018)}</p>
    <p>2009: ${d3.format('.0%')(d.properties.pct_recyc_2009)}</p>
    <hr>
    <p>Change: ${d3.format('.0%')(d.properties.pct_change)}`
  })

d3.json(require('/data/joined_data.json'))
  .then(ready)
  .catch(err => console.log('Failed with', err))

function ready(datapoints) {
  // console.log(datapoints)
  const districts = topojson.feature(datapoints, datapoints.objects.joined_data)

  const percentRecycledExtent = districts.features.map(
    d => +d.properties.pct_change
  )
  colorScalePositive.domain([0, d3.max(percentRecycledExtent)])
  colorScaleNegative.domain([0, d3.min(percentRecycledExtent)])
  radiusScale.domain(d3.extent(percentRecycledExtent))

  // this will be for another graph
  const manhattanFiltered = districts.features.filter(
    d => String(d.properties.borocd)[0] === '1'
  )

  manhattanFiltered.sort(function(a, b) {
    return a.properties.pct_change - b.properties.pct_change
  })
  // console.log(manhattanFiltered)

  container
    .selectAll('.manhattanDistricts')
    .data(manhattanFiltered)
    .enter()
    .append('svg')
    .style('display', 'flexbox')
    .attr('height', height + margin.top + margin.bottom)
    .attr('width', width + margin.left + margin.right)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
    .each(function(d) {
      const datapoints = d
      const svg = d3.select(this)
      const center = d3.geoCentroid(datapoints)
      projection.center(center)
      projection.fitSize([width, height], datapoints)

      svg
        .append('path')
        .attr('class', 'manhattan')
        .attr('d', path)
        .attr('stroke', 'lightgray')
        .attr('fill', function(d) {
          if (+d.properties.pct_change > 0) {
            return colorScalePositive(+d.properties.pct_change)
          } else if (+d.properties.pct_change < 0) {
            return colorScaleNegative(+d.properties.pct_change)
          } else {
            return 'lightgray'
          }
        })

      svg
        .append('text')
        .attr('y', height / 2)
        .attr('x', width / 2)
        .text(datapoints.properties.boro_cd)
        .style('font-weight', 400)
        .style(
          'text-shadow',
          '-1px -1px 0 whitesmoke, 1px -1px 0 whitesmoke, -1px 1px 0 whitesmoke, 1px 1px 0 whitesmoke'
        )
        .attr('text-anchor', 'middle')
        .attr('text-alignment', 'middle')
        .attr('align-baseline', 'middle')
    })
}
