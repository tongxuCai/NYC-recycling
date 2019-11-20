import * as d3 from 'd3'
import * as topojson from 'topojson'

const margin = { top: 0, left: 0, right: 0, bottom: 0 }
const height = 600 - margin.top - margin.bottom
const width = 750 - margin.left - margin.right

const svg = d3
  .select('#chart-1')
  .append('svg')
  .attr('height', height + margin.top + margin.bottom)
  .attr('width', width + margin.left + margin.right)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

const projection = d3
  .geoMercator()
  .scale(57000)
  .translate([width / 2, height / 2])
const graticule = d3.geoGraticule()
const path = d3.geoPath().projection(projection)

const boroughColorScale = d3.scaleOrdinal(d3.schemePastel1)
const colorScalePositive = d3.scaleSequential(d3.interpolateBlues)
const colorScaleNegative = d3.scaleSequential(d3.interpolateReds)

const radiusScale = d3.scaleSqrt().range([1, 20])

d3.json(require('/data/joined_data.json'))
  .then(ready)
  .catch(err => console.log('Failed with', err))

function ready(datapoints) {
  const districts = topojson.feature(datapoints, datapoints.objects.joined_data)
  const center = d3.geoCentroid(districts)
  projection.center(center)

  const percentRecycledExtent = districts.features.map(
    d => +d.properties.pct_change
  )
  colorScalePositive.domain([0, d3.max(percentRecycledExtent)])
  colorScaleNegative.domain([0, d3.min(percentRecycledExtent)])
  radiusScale.domain(d3.extent(percentRecycledExtent))

  const simulation = d3
    .forceSimulation()
    .force('x', d3.forceX(d => path.centroid(d)[0]).strength(1))
    .force('y', d3.forceY(d => path.centroid(d)[1]).strength(1))
    .force(
      'collide',
      d3
        .forceCollide()
        .radius(d => radiusScale(+d.properties.pct_change))
        .strength(1)
    )
    .force('charge', d3.forceManyBody().strength(-1.5))

  svg
    .selectAll('path')
    .data(districts.features)
    .enter()
    .append('path')
    .attr('class', 'districts')
    .attr('d', path)
    .attr('stroke', function(d) {
      return 'none'
    })
    .attr('fill', function(d) {
      if (+d.properties.pct_change > 0) {
        return colorScalePositive(+d.properties.pct_change)
      } else if (+d.properties.pct_change < 0) {
        return colorScaleNegative(+d.properties.pct_change)
      } else {
        return 'lightgray'
      }
    })
    .attr('opacity', 1)

  svg.append('rect')

  // dumb d3-force stuff
  // const graph = svg
  //   .selectAll('circle')
  //   .data(districts.features)
  //   .enter()
  //   .append('circle')
  //   .attr('class', 'districts')
  //   .attr('r', d => radiusScale(+d.properties.pct_change))
  //   .attr('fill', function(d) {
  //     if (+d.properties.pct_change > 0) {
  //       return colorScalePositive(+d.properties.pct_change)
  //     } else if (+d.properties.pct_change < 0) {
  //       return colorScaleNegative(+d.properties.pct_change)
  //     } else {
  //       return 'lightgray'
  //     }
  //   })
  //   .attr('cx', d => path.centroid(d)[0])
  //   .attr('cy', d => path.centroid(d)[1])

  // function ticked() {
  //   graph.attr('cx', d => d.x).attr('cy', d => d.y)
  // }
  // simulation.nodes(districts.features).on('tick', ticked)

  //  dumb legend stuff
  // const w = 250

  // const legend = svg
  //   .append('defs')
  //   .append('svg:linearGradient')
  //   .attr('id', 'gradient')
  //   .attr('x1', '0%')
  //   .attr('y1', '0%')
  //   .attr('x2', '0%')
  //   .attr('y2', '100%')

  // legend
  //   .append('stop')
  //   .attr('offset', '0%')
  //   .attr('stop-color', '#67000D')
  //   .attr('stop-opacity', 0.7)

  // legend
  //   .append('stop')
  //   .attr('offset', '50%')
  //   .attr('stop-color', 'white')
  //   .attr('stop-opacity', 0.7)

  // legend
  //   .append('stop')
  //   .attr('offset', '100%')
  //   .attr('stop-color', '#08306B')
  //   .attr('stop-opacity', 0.7)

  // svg
  //   .append('rect')
  //   .attr('width', w)
  //   .attr('height', height)
  //   .style('fill', 'url(#gradient)')
  //   .attr('transform', 'translate(0,10)')

  // const x = d3
  //   .scaleLinear()
  //   .domain(d3.extent(percentRecycledExtent))
  //   .range([0, height])
  // const xAxis = d3
  //   .axisRight()
  //   .scale(x)
  //   .tickValues([
  //     d3.min(percentRecycledExtent),
  //     0,
  //     d3.max(percentRecycledExtent)
  //   ])
  // svg
  //   .append('g')
  //   .attr('class', 'x axis')
  //   .call(xAxis)
  //   .append('text')
  //   // .attr('transform', 'rotate(-90)')
  //   .attr('x', 300)
  //   // .attr('dx', '.71em')
  //   .style('text-anchor', 'end')
  //   .text('axis title')
}
