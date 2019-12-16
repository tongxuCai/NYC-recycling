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

d3.json(require('/data/joined_data.json'))
  .then(ready)
  .catch(err => console.log('Failed with', err))

function ready(datapoints) {
  const districts = topojson.feature(datapoints, datapoints.objects.joined_data)

  projection.fitSize([width, height], districts)

  const pctPtChange = districts.features.map(d => +d.properties.pct_change)
  colorScalePositive.domain([0, d3.max(pctPtChange)])
  colorScaleNegative.domain([0, d3.min(pctPtChange)])

  svg
    .selectAll('path')
    .data(districts.features)
    .enter()
    .append('path')
    .attr('class', function(d) {
      if (String(d.properties.boro_cd) === '101') {
        return 'district-101'
      } else {
        return 'notDistrict-101'
      }
    })
    .attr('id', function(d) {
      if (String(d.properties.boro_cd)[0] === '1') {
        return 'manhattan'
      } else {
        return 'notmanhattan'
      }
    })
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
        return '#d3d3d3'
      }
    })
    .attr('opacity', 1)
  // .on('mouseenter', function() {
  //   d3.select(this)
  //     .raise()
  //     .transition()
  //     .style('transform', 'scale(1.15,1.15)')
  //     .attr('stroke', '#444')
  // })
  // .on('mouseleave', function() {
  //   d3.select(this)
  //     .lower()
  //     .transition()
  //     .style('transform', 'scale(1,1)')
  //     .attr('stroke', 'none')
  // })

  svg
    .append('text')
    .style('font-weight', 600)
    .style('font-size', 42)
    .attr('class', 'poverty-level-percent')
    .text('>15%')
    .attr('id', 'text')
    .attr('text-anchor', 'end')
  svg
    .append('text')
    .style('font-weight', 400)
    .style('font-size', 32)
    .attr('class', 'poverty-level-poverty')
    .text('poverty')
    .attr('id', 'text')
    .attr('text-anchor', 'end')

  svg
    .append('text')
    .text('Graphic by Sawyer Click')
    .style('font-size', 10)
    .attr('text-anchor', 'end')
    .attr('alignment-baseline', 'middle')
    .attr('class', 'credit')

  svg
    .append('circle')
    .attr('class', 'pos-circle')
    .attr('r', 7)
    .attr('fill', '#7DB7D9')
  svg
    .append('circle')
    .attr('class', 'even-circle')
    .attr('r', 7)
    .attr('fill', 'whitesmoke')
    .attr('stroke', '#333')
  svg
    .append('circle')
    .attr('class', 'neg-circle')
    .attr('r', 7)
    .attr('fill', '#FB8060')

  svg
    .append('text')
    .text('+ percent')
    .style('font-size', 16)
    .attr('text-anchor', 'start')
    .attr('alignment-baseline', 'middle')
    .attr('class', 'pos-text')
  svg
    .append('text')
    .text('no change')
    .style('font-size', 16)
    .attr('text-anchor', 'start')
    .attr('alignment-baseline', 'middle')
    .attr('class', 'even-text')
  svg
    .append('text')
    .text('- percent')
    .style('font-size', 16)
    .attr('text-anchor', 'start')
    .attr('alignment-baseline', 'middle')
    .attr('class', 'neg-text')

  d3.selectAll('#text').attr('opacity', 0)

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
    svg.selectAll('path').attr('d', path)

    svg
      .selectAll('.pos-circle')
      .attr('cx', newWidth - 110)
      .attr('cy', newHeight - 80)
    svg
      .selectAll('.even-circle')
      .attr('cx', newWidth - 110)
      .attr('cy', newHeight - 55)
    svg
      .selectAll('.neg-circle')
      .attr('cx', newWidth - 110)
      .attr('cy', newHeight - 30)

    svg
      .selectAll('.pos-text')
      .attr('x', newWidth - 90)
      .attr('y', newHeight - 80)
    svg
      .selectAll('.even-text')
      .attr('x', newWidth - 90)
      .attr('y', newHeight - 55)
    svg
      .selectAll('.neg-text')
      .attr('x', newWidth - 90)
      .attr('y', newHeight - 30)

    svg
      .select('.credit')
      .attr('x', newWidth)
      .attr('y', newHeight)

    svg
      .select('.poverty-level-percent')
      .attr('x', newWidth / 2.4)
      .attr('y', newHeight * 0.4)
    svg
      .select('.poverty-level-poverty')
      .attr('x', newWidth / 2.5)
      .attr('y', newHeight * 0.46)

    // responsiveness
    d3.selectAll('#step1').on('stepin', function() {
      projection.fitSize([newWidth, newHeight], districts)

      const pctChange = districts.features.map(d => +d.properties.pct_change)
      colorScalePositive.domain([0, d3.max(pctChange)])
      colorScaleNegative.domain([0, d3.min(pctChange)])

      svg
        .selectAll('#text')
        .transition()
        .duration(500)
        .ease(d3.easeQuad)
        .attr('opacity', 0)

      svg
        .selectAll('path')
        .transition()
        .duration(500)
        .ease(d3.easeQuad)
        .attr('d', path)
        .attr('fill', function(d) {
          if (+d.properties.pct_change > 0) {
            return colorScalePositive(+d.properties.pct_change)
          } else if (+d.properties.pct_change < 0) {
            return colorScaleNegative(+d.properties.pct_change)
          } else {
            return '#d3d3d3'
          }
        })
    })

    d3.selectAll('#step2').on('stepin', function() {
      projection.fitSize([newWidth, newHeight], districts)
      svg
        .select('.poverty-level-percent')
        .text('High')
        .attr('fill', 'black')
      svg.select('.poverty-level-poverty').text('poverty')

      svg
        .selectAll('#text')
        .transition()
        .duration(500)
        .ease(d3.easeQuad)
        .attr('opacity', 1)

      svg
        .selectAll('path')
        .transition()
        .delay(200)
        .duration(500)
        .ease(d3.easeQuad)
        .attr('opacity', 1)
        .attr('d', path)
        .attr('fill', function(d) {
          if (d.properties.poverty_rate < 15) {
            return 'lightgray'
          } else {
            if (+d.properties.pct_change > 0) {
              return colorScalePositive(+d.properties.pct_change)
            } else if (+d.properties.pct_change < 0) {
              return colorScaleNegative(+d.properties.pct_change)
            } else {
              return '#d3d3d3'
            }
          }
        })
        .attr('stroke', 'none')
    })

    d3.selectAll('#step3').on('stepin', function() {
      projection.fitSize([newWidth, newHeight], districts)
      svg
        .select('.poverty-level-percent')
        .text('Less')
        .attr('fill', '#67000d')
      svg.select('.poverty-level-poverty').text('recycling')
      svg
        .selectAll('#text')
        .transition()
        .duration(500)
        .ease(d3.easeQuad)
        .attr('opacity', 1)

      svg
        .selectAll('path')
        .transition()
        .delay(200)
        .duration(500)
        .ease(d3.easeQuad)
        .attr('opacity', 1)
        .attr('d', path)
        .attr('fill', function(d) {
          if (+d.properties.pct_change < 0) {
            return colorScaleNegative(+d.properties.pct_change)
          } else {
            return '#d3d3d3'
          }
        })
        .attr('stroke', 'none')
    })
    d3.selectAll('#step-').on('stepin', function() {
      projection.fitSize([newWidth, newHeight], districts)
      svg
        .select('.poverty-level-percent')
        .text('High')
        .attr('fill', 'goldenrod')
      svg.select('.poverty-level-poverty').text('income')

      svg
        .selectAll('#text')
        .transition()
        .duration(500)
        .ease(d3.easeQuad)
        .attr('opacity', 1)

      svg
        .selectAll('path')
        .transition()
        .delay(200)
        .duration(500)
        .ease(d3.easeQuad)
        .attr('opacity', 1)
        .attr('d', path)
        .attr('fill', function(d) {
          if (+d.properties.pct_change < 0) {
            return colorScaleNegative(+d.properties.pct_change)
          } else {
            return '#d3d3d3'
          }
        })
        .attr('stroke', function(d) {
          return d.properties.fp_100_mhhi > 90000 ? 'goldenrod' : 'none'
        })
        .attr('stroke-width', 3)
    })
    d3.selectAll('#step4').on('stepin', function() {
      const manhattanFiltered = districts.features.filter(
        d => String(d.properties.boro_cd)[0] === '1'
      )
      manhattanFiltered.sort(function(a, b) {
        return a.properties.pct_change - b.properties.pct_change
      })
      manhattanFiltered.forEach(function(d, i) {
        d.properties.idx = i
      })
      const manhattanJSON = {
        features: manhattanFiltered,
        type: 'FeatureCollection'
      }
      projection.fitSize([newWidth, newHeight], manhattanJSON)

      svg
        .selectAll('#text')
        .transition()
        .duration(250)
        .ease(d3.easeQuad)
        .attr('opacity', 0)

      svg
        .selectAll('#notmanhattan')
        .transition()
        .duration(250)
        .attr('opacity', 0)

      svg
        .selectAll('#manhattan')
        .attr('visibility', 'visible')
        .transition()
        .duration(500)
        .ease(d3.easeQuad)
        .attr('d', path)
        .attr('opacity', 1)
        .attr('stroke', function(d) {
          return d.properties.fp_100_mhhi > 90000 ? 'goldenrod' : 'none'
        })
        .attr('stroke-width', 3)
    })

    d3.selectAll('#step5').on('stepin', function() {
      svg
        .selectAll('.notDistrict-101')
        .transition()
        .duration(500)
        .ease(d3.easeQuad)
        .attr('opacity', 0.2)
      svg
        .selectAll('#notmanhattan')
        .transition()
        .duration(500)
        .attr('opacity', 0)

      svg
        .select('.district-101')
        .transition()
        .duration(500)
        .ease(d3.easeQuad)
        .attr('opacity', 1)
    })
  }

  window.addEventListener('resize', render)
  render()
}
