import * as d3 from 'd3'

const margin = { top: 20, left: 50, right: 50, bottom: 20 }
const height = 200 - margin.top - margin.bottom
const width = 600 - margin.left - margin.right

const svg = d3
  .select('#chart-trash')
  .append('svg')
  .attr('height', height + margin.top + margin.bottom)
  .attr('width', width + margin.left + margin.right)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

const xPositionScale = d3.scalePoint().range([0, width])
const radiusScale = d3.scaleSqrt()
const colorScale = d3.scaleOrdinal(d3.schemePastel1)

d3.csv(require('/data/joined_and_tonnage.csv'))
  .then(ready)
  .catch(err => {
    console.log(err)
  })

function ready(datapoints) {
  const filtered = datapoints.filter(function(d) {
    if (+d.year === 2018) {
      return d
    }
  })
  const districtsNested = d3
    .nest()
    .key(d => d.boro_cd)
    .rollup(function(d) {
      return {
        poverty_rate: d3.mean(d, f => f.poverty_rate),
        pct_change: d3.mean(d, f => f.pct_change),
        BOROUGH: d[0].BOROUGH
      }
    })
    .entries(filtered)

  const nested = d3
    .nest()
    .key(d => d.BOROUGH)
    .rollup(function(d) {
      return {
        totalWaste: d3.sum(d, f => +f.REFUSETONSCOLLECTED + f.total_recycled),
        meanWaste: d3.median(d, f => +f.REFUSETONSCOLLECTED),
        totalRecycled: d3.sum(d, f => +f.total_recycled),
        povertyRate: d3.median(d, f => +f.poverty_rate),
        pct2009: d3.mean(d, f => +f.pct_recyc_2009) * 100,
        pct2018: d3.mean(d, f => +f.pct_recyc_2018) * 100,
        pctChange: d3.mean(d, f => +f.pct_change) * 100
      }
    })
    .entries(filtered)

  nested.forEach(function(d) {
    d.value.pctRecycled = (d.value.totalRecycled / d.value.totalWaste) * 100
  })

  const keys = nested.map(d => d.key)
  colorScale.domain(keys)
  xPositionScale.domain(keys)

  svg
    .selectAll('.boroughs')
    .data(nested)
    .enter()
    .append('circle')
    .attr('class', 'boroughs')
    .attr('cy', height / 2)
    .attr('cx', d => xPositionScale(d.key))
    .attr('r', 20)
    .attr('fill', d => colorScale(d.key))

  svg
    .selectAll('.labels')
    .data(nested)
    .enter()
    .append('text')
    .text(d => d.key)
    .attr('class', 'labels')
    .attr('alignment-baseline', 'middle')
    .attr('text-anchor', 'middle')
    .style('font-size', '12px')
    .attr('x', d => xPositionScale(d.key))

  svg
    .selectAll('.bands')
    .data(nested)
    .enter()
    .append('text')
    .attr('class', 'bands')
    .attr('x', d => xPositionScale(d.key))
    .attr('text-anchor', 'middle')
    .attr('alignment-baseline', 'middle')
    .attr('fill', 'black')
    .style('font-weight', '600')

  svg
    .append('text')
    .attr('class', 'min')
    .attr('alignment-baseline', 'middle')
    .attr('text-anchor', 'middle')

  svg
    .append('text')
    .text('Graphic by Sawyer Click')
    .style('font-size', '10px')
    .attr('text-anchor', 'end')
    .attr('alignment-baseline', 'middle')
    .attr('class', 'credit')

  svg
    .selectAll('.districts')
    .data(districtsNested)
    .enter()
    .append('circle')
    .attr('class', 'districts')

  // recolor the text in the steps
  for (let key = 0; key < keys.length; key++) {
    d3.selectAll('#label-' + keys[key].toLowerCase().replace(/[^a-z]*/g, ''))
      .style('background', colorScale(keys[key]))
      .style('padding', '0px 2px')
      .style('border-radius', '3px')
  }

  function render() {
    const svgContainer = svg.node().closest('div')
    const svgWidth = svgContainer.offsetWidth
    // Do you want it to be full height? Pick one of the two below
    const svgHeight = height + margin.top + margin.bottom
    // const svgHeight = window.innerHeight

    const actualSvg = d3.select(svg.node().closest('svg'))
    actualSvg.attr('width', svgWidth).attr('height', svgHeight)

    const newWidth = svgWidth - margin.left - margin.right
    const newHeight = svgHeight - margin.top - margin.bottom

    // Update our scale
    xPositionScale.range([0, newWidth])
    radiusScale.range([5, newWidth * 0.09])

    // Update things you draw
    svg
      .select('.credit')
      .attr('x', newWidth + margin.right)
      .attr('y', newHeight + margin.bottom / 2)

    svg
      .selectAll('.boroughs')
      .attr('cy', newHeight / 3)
      .attr('cx', d => xPositionScale(d.key))
    svg
      .selectAll('.districts')
      .attr('cy', newHeight / 3)
      .attr('cx', d => xPositionScale(d.value.BOROUGH))

    svg
      .selectAll('.labels')
      .attr('y', newHeight / 3)
      .attr('dy', 90)
      .attr('x', d => xPositionScale(d.key))

    svg
      .selectAll('.bands')
      .attr('x', d => xPositionScale(d.key))
      .attr('y', newHeight / 3)
      .raise()

    svg
      .selectAll('.max')
      .attr('x', xPositionScale(nested[nested.length - 1].key))

    svg.selectAll('.min').attr('x', xPositionScale(nested[0].key))

    function step(stepNum, column) {
      d3.select('#step-' + stepNum).on('stepin', function() {
        nested.sort(function(a, b) {
          return a.value[column] - b.value[column]
        })
        const keys = nested.map(d => d.key)
        xPositionScale.domain(keys)
        // console.log(keys[0])

        const radiusExtent = d3.extent(nested.map(d => d.value[column]))

        if (column === 'pct2009') {
          radiusScale.domain([0, 35])
        } else if (column === 'pct2018') {
          radiusScale.domain([0, 35])
        } else {
          radiusScale.domain(radiusExtent)
        }

        svg
          .selectAll('.districts')
          .transition()
          .duration(200)
          .ease(d3.easeQuadInOut)
          .attr('cx', d => xPositionScale(d.value.BOROUGH))
          .attr('cy', newHeight / 3)
          .attr('opacity', 0)

        svg
          .selectAll('.boroughs')
          .transition()
          .duration(700)
          .attr('opacity', 1)
          .attr('r', function(d) {
            return radiusScale(d.value[column])
          })
          .attr('cy', newHeight / 3)
          .attr('cx', d => xPositionScale(d.key))
          .attr('fill', d => colorScale(d.key))

        svg.selectAll('text').attr('opacity', 1)

        svg
          .selectAll('.labels')
          .transition()
          .duration(700)
          .attr('y', newHeight / 3)
          .attr('dy', 90)
          .attr('x', d => xPositionScale(d.key))

        svg
          .selectAll('.bands')
          .transition()
          .duration(700)
          .text(function(d) {
            if (d.value[column] > 100) {
              return d3.format('.3s')(d.value[column])
            } else {
              return d3.format('.0%')(d.value[column])
            }
          })
          .attr('x', d => xPositionScale(d.key))
          .attr('y', newHeight / 3)
          .attr('fill', '#444')
          .attr('opacity', 1)
          .attr('dy', 70)
      })
    }
    console.log(nested)
    step(1, 'totalWaste')
    step(2, 'totalRecycled')
    step(3, 'pctRecycled')

    d3.selectAll('#step-4').on('stepin', function() {
      const povertyXScale = d3.scaleLinear().range([0, newWidth])
      const povertyExtent = filtered.map(d => +d.poverty_rate)
      povertyXScale.domain(d3.extent(povertyExtent))

      const povertyYScale = d3.scaleLinear().range([newHeight, 0])
      const percentRecycledExtent = filtered.map(d => +d.pct_change)
      povertyYScale.domain(d3.extent(percentRecycledExtent))

      svg
        .selectAll('.boroughs')
        .transition()
        .duration(250)
        .attr('opacity', 0)

      svg
        .selectAll('.districts')
        .attr('cx', d => xPositionScale(d.value.BOROUGH))
        .attr('cy', newHeight / 3)
        .attr('r', 7)
        .attr('fill', d => colorScale(d.value.BOROUGH))
        .transition()
        .duration(700)
        .ease(d3.easeQuadInOut)
        .attr('opacity', 1)
        .attr('cx', d => povertyXScale(+d.value.poverty_rate))
        .attr('cy', d => povertyYScale(+d.value.pct_change))

      svg.selectAll('text').attr('opacity', 0)
    })
  }

  window.addEventListener('resize', render)

  render()
}
