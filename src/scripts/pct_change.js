import * as d3 from 'd3'
import * as topojson from 'topojson'
import d3Tip from 'd3-tip'
import d3Annotation from 'd3-svg-annotation'
d3.tip = d3Tip

const margin = { top: 10, left: 0, right: 0, bottom: 10 }
const height = 450 - margin.top - margin.bottom
const width = 750 - margin.left - margin.right

const svg = d3
  .select('#chart-change')
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

// const boroughColorScale = d3.scaleOrdinal(d3.schemePastel1)
const colorScalePositive = d3.scaleSequential(d3.interpolateBlues)
const colorScaleNegative = d3.scaleSequential(d3.interpolateReds)

const radiusScale = d3.scaleSqrt().range([1, 20])

const tip = d3
  .tip()
  .attr('class', 'tooltip')
  .offset([0, 0])
  .html(function(d) {
    return `<strong>${d.properties.cd_short_title}</strong>
    <p>2018: ${d3.format('.0%')(d.properties.pct_recyc_2018)}</p>
    <p>2009: ${d3.format('.0%')(d.properties.pct_recyc_2009)}</p>
    <hr>
    <p>${d3.format('.0%')(d.properties.pct_change)}`
  })

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

  const povertyExtent = d3.extent(
    districts.features.map(d => d.properties.poverty_rate)
  )

  // console.log()

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

  svg.call(tip)

  const updatePoverty = level => {
    slider.attr('value', level)
    d3.select('p#value').text(level + '% poverty level')
  }

  const slider = d3
    .select('#myRange')
    .attr('type', 'range')
    .attr('min', 4)
    .attr('max', 36)
    .attr('step', 4)
    .on('input', function() {
      const value = this.value

      d3.selectAll('.districts').attr('fill', function(d) {
        if (d.properties.poverty_rate < value) {
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
      updatePoverty(value)
    })

  updatePoverty(4)

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
    svg.selectAll('.districts').attr('d', path)
  }

  window.addEventListener('resize', render)
  render()
}
