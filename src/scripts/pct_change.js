import * as d3 from 'd3'
import * as topojson from 'topojson'
import d3Tip from 'd3-tip'
import d3Annotation from 'd3-svg-annotation'
d3.tip = d3Tip

const margin = { top: 10, left: 0, right: 0, bottom: 10 }
const height = 550 - margin.top - margin.bottom
const width = 800 - margin.left - margin.right

const svg = d3
  .select('#chart-change')
  .append('svg')
  .attr('height', height + margin.top + margin.bottom)
  .attr('width', width + margin.left + margin.right)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

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
  const districts = topojson.feature(datapoints, datapoints.objects.joined_data)
  const center = d3.geoCentroid(districts)
  projection.center(center)
  projection.fitSize([width, height], districts)

  const percentRecycledExtent = districts.features.map(
    d => +d.properties.pct_change
  )
  colorScalePositive.domain([0, d3.max(percentRecycledExtent)])
  colorScaleNegative.domain([0, d3.min(percentRecycledExtent)])
  radiusScale.domain(d3.extent(percentRecycledExtent))

  const povertyExtent = d3.extent(
    districts.features.map(d => d.properties.poverty_rate)
  )

  // this will be for another graph
  const bronxFiltered = districts.features.filter(
    d => String(d.properties.borocd)[0] === '3'
  )
  // console.log(bronxFiltered)

  svg
    .selectAll('.districts')
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
    .on('mouseover', tip.show)
    .on('mouseout', tip.hide)
    .on('mouseenter', function() {
      d3.select(this)
        .raise()
        .transition()
        .style('transform', 'scale(1.15,1.15)')
        .attr('stroke', '#444')
    })
    .on('mouseleave', function() {
      d3.select(this)
        .lower()
        .transition()
        .style('transform', 'scale(1,1)')
        .attr('stroke', 'none')
    })

  svg
    .append('text')
    .style('font-weight', 600)
    .style('font-size', 42)
    .attr('class', 'poverty-level-percent')
  svg
    .append('text')
    .style('font-weight', 400)
    .style('font-size', 32)
    .attr('class', 'poverty-level-poverty')
    .text('poverty')
  svg
    .append('text')
    .style('font-weight', 400)
    .style('font-size', 32)
    .attr('class', 'poverty-level-rate')
    .text('rate')

  svg.call(tip)

  const slider = d3
    .select('#myRange')
    .attr('type', 'range')
    .attr('min', 4)
    .attr('max', 37)
    .attr('step', 4)
    .style('visibility', 'hidden')

  let counter = 5
  function f() {
    counter = counter + 5
    if (counter > 41) {
      counter = 5
    }

    // console.log(counter)
    slider.attr('value', counter)
    d3.select('.poverty-level-percent').text(counter + '%')

    d3.selectAll('.districts').attr('fill', function(d) {
      if (d.properties.poverty_rate < counter) {
        return 'lightgray'
      } else {
        if (+d.properties.pct_change > 0) {
          return colorScalePositive(+d.properties.pct_change)
        } else if (+d.properties.pct_change < 0) {
          return colorScaleNegative(+d.properties.pct_change)
        } else {
          return 'lightgray'
        }
      }
    })
    // updatePoverty(counter)

    return true
  }

  setInterval(f, 1000)

  function render() {
    const svgContainer = svg.node().closest('div')
    const svgWidth = svgContainer.offsetWidth
    const svgHeight = height + margin.top + margin.bottom

    const actualSvg = d3.select(svg.node().closest('svg'))
    actualSvg.attr('width', svgWidth).attr('height', svgHeight)

    const newWidth = svgWidth - margin.left - margin.right
    const newHeight = svgHeight - margin.top - margin.bottom

    // Update our scale
    projection.center(center)
    projection.fitSize([newWidth, newHeight], districts)

    // Update things you draw
    svg.selectAll('.districts').attr('d', path)

    if (svgContainer.offsetWidth < 450) {
      svg
        .select('.poverty-level-percent')
        .attr('x', newWidth / 25)
        .attr('y', newHeight * 0.45)
      svg
        .select('.poverty-level-poverty')
        .attr('x', newWidth / 25)
        .attr('y', newHeight * 0.5)
      svg
        .select('.poverty-level-rate')
        .attr('x', newWidth / 25)
        .attr('y', newHeight * 0.555)
    } else {
      svg
        .select('.poverty-level-percent')
        .attr('x', newWidth / 7)
        .attr('y', newHeight * 0.45)
      svg
        .select('.poverty-level-poverty')
        .attr('x', newWidth / 7)
        .attr('y', newHeight * 0.5)
      svg
        .select('.poverty-level-rate')
        .attr('x', newWidth / 7)
        .attr('y', newHeight * 0.555)
    }
  }

  window.addEventListener('resize', render)
  render()
}
