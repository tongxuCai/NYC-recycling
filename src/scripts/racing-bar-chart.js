import * as d3 from 'd3'
import * as topojson from 'topojson'
import d3Annotation from 'd3-svg-annotation'

const margin = { top: 20, left: 20, right: 20, bottom: 20 }
const height = 500 - margin.top - margin.bottom
const width = 550 - margin.left - margin.right

const svg = d3
  .select('#racing-bar-chart')
  .append('svg')
  .attr('height', height + margin.top + margin.bottom)
  .attr('width', width + margin.left + margin.right)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

const parseTime = d3.timeParse('%Y-%m-%d')

const colorScale = d3
  .scaleOrdinal()
  .domain(['1', '2', '3', '4', '5'])
  .range(['#DECBE4', '#B3CDE3', '#FBB4AE', '#CCEBC5', '#FED9A6'])

const widthScale = d3
  .scaleLinear()
  .domain([0, 55])
  .range([0, width])
const pointScale = d3.scalePoint().range([height, 0])
const bandScale = d3
  .scaleBand()
  .range([height, 0])
  .paddingInner(0.4)

d3.csv(require('/data/racing_bar_chart.csv'))
  .then(ready)
  .catch(err => console.log('Failed with', err))

function ready(datapoints) {
  const filtered = datapoints.filter(d => d.year === '2019-01-01')
  const sorted = filtered.sort(function(a, b) {
    return +a.pct_recycled_annum - +b.pct_recycled_annum
  })

  const districts = [...new Set(sorted.map(d => d.boro_cd))]
  pointScale.domain(districts)
  bandScale.domain(districts)

  svg
    .selectAll('.districts-line')
    .data(sorted)
    .enter()
    .append('rect')
    .attr('class', 'districts-line')
    .attr('x', function(d) {
      if (+d.pct_recycled_2009 > +d.pct_recycled_annum) {
        return widthScale(+d.pct_recycled_annum)
      } else {
        return widthScale(+d.pct_recycled_2009)
      }
    })
    .attr('y', d => bandScale(d.boro_cd) + 2)
    .attr('height', bandScale.bandwidth())
    .attr('width', function(d) {
      if (+d.pct_recycled_2009 > +d.pct_recycled_annum) {
        return widthScale(+d.pct_recycled_2009 - +d.pct_recycled_annum)
      } else {
        return widthScale(+d.pct_recycled_annum - +d.pct_recycled_2009)
      }
    })
    .attr('fill', d => colorScale(String(d.boro_cd)[0]))

  // svg
  //   .selectAll('.districts-2009')
  //   .data(sorted)
  //   .enter()
  //   .append('rect')
  //   .attr('class', 'districts-2009')
  //   .attr('x', d => widthScale(+d.pct_recycled_2009))
  //   .attr('y', d => bandScale(d.boro_cd))
  //   .attr('height', 5)
  //   .attr('width', 5)
  //   .attr('fill', 'lightgray')

  // svg
  //   .selectAll('.districts-2018')
  //   .data(sorted)
  //   .enter()
  //   .append('circle')
  //   .attr('class', 'districts-2018')
  //   .attr('cx', d => widthScale(+d.pct_recycled_annum))
  //   .attr('cy', d => pointScale(d.boro_cd))
  //   .attr('r', 2.5)
  //   .attr('fill', 'lightgray')

  function render() {
    const svgContainer = svg.node().closest('div')
    const svgWidth = svgContainer.offsetWidth
    const svgHeight = height + margin.top + margin.bottom

    const actualSvg = d3.select(svg.node().closest('svg'))
    actualSvg.attr('width', svgWidth).attr('height', svgHeight)

    const newWidth = svgWidth - margin.left - margin.right
    const newHeight = svgHeight - margin.top - margin.bottom

    // Update our scale
    widthScale.range([0, newWidth])
    bandScale.range([0, newWidth])
    pointScale.range([0, newWidth])

    // Update things you draw
    svg
      .selectAll('.districts-line')
      .attr('x', function(d) {
        if (+d.pct_recycled_2009 > +d.pct_recycled_annum) {
          return widthScale(+d.pct_recycled_annum)
        } else {
          return widthScale(+d.pct_recycled_2009)
        }
      })
      .attr('y', d => bandScale(d.boro_cd) + 2)
      .attr('height', bandScale.bandwidth())
      .attr('width', function(d) {
        if (+d.pct_recycled_2009 > +d.pct_recycled_annum) {
          return widthScale(+d.pct_recycled_2009 - +d.pct_recycled_annum)
        } else {
          return widthScale(+d.pct_recycled_annum - +d.pct_recycled_2009)
        }
      })
  }

  window.addEventListener('resize', render)
  render()
}
