import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

async function loadData(){
    const [data1, data2] = await Promise.all([
      d3.csv('team_summaries.csv', row => ({
        team: row.team,
        wins: +row.w,
        season: Number(row.season),
        pace: Number(row.pace),
        playoffs: row.playoffs === 'True' 
    })),
    d3.csv('team_stats_per_game.csv', row => ({
        team: row.team,
        fga_per_game: Number(row.fga_per_game),
        x3pa_per_game: Number(row.x3pa_per_game),
        season: Number(row.season),
        x2pa_per_game: Number(row.x2pa_per_game),
        fta_pg: Number(row.fta_per_game)
    }))
    ]);


    const lookup = new Map(data2.map(r => [`${r.team}-${r.season}`, r]));

    const merged = data1.map(d => ({
        ...d,
        ...(lookup.get(`${d.team}-${d.season}`) ?? {})
    }));
    

    return merged;
}

let data = await loadData();

let playoffFilter = 'all';
document.getElementById('btn-all').addEventListener('click', () => { playoffFilter = 'all'; redraw(); });
document.getElementById('btn-playoffs').addEventListener('click', () => { playoffFilter = 'playoffs'; redraw(); });
document.getElementById('btn-non-playoffs').addEventListener('click', () => { playoffFilter = 'non-playoffs'; redraw(); });
function getFilteredData() {
  if (playoffFilter === 'playoffs')     return data.filter(d => d.playoffs === true);
  if (playoffFilter === 'non-playoffs') return data.filter(d => d.playoffs === false);
  return data;
}

function renderAvg() {
    d3.select('#chart').selectAll('*').remove();

    const filtered = getFilteredData();

    const seasonData = d3.rollups(
        filtered,
        v => ({
        avg2pa: d3.mean(v, d => d.x2pa_per_game),
        avg3pa: d3.mean(v, d => d.x3pa_per_game),
        avgFta: d3.mean(v, d => d.fta_pg),
        }),
        d => d.season
    )
    .map(([season, vals]) => ({ season, ...vals }))
    .sort((a, b) => a.season - b.season);



    const margin = { top: 20, right: 120, bottom: 40, left: 50 };
    const width  = 800 - margin.left - margin.right;
    const height = 400 - margin.top  - margin.bottom;

    const svg = d3.select('#chart')   // make sure you have <svg id="chart"> in your HTML
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

    // 3. Scales
    const x = d3.scaleLinear()
    .domain(d3.extent(seasonData, d => d.season))
    .range([0, width]);

    const y = d3.scaleLinear()
    .domain([0, d3.max(seasonData, d => Math.max(d.avg2pa, d.avg3pa, d.avgFta)) * 1.1])
    .range([height, 0]);

    // 4. Line generator
    const line = d3.line().x(d => x(d.season));

    // 5. Define the three series
    const series = [
    { key: 'avg2pa', label: '2PA',  color: '#4e79a7' },
    { key: 'avg3pa', label: '3PA',  color: '#f28e2b' },
    { key: 'avgFta', label: 'FTA',  color: '#e15759' },
    ];

    // 6. Draw lines
    series.forEach(({ key, label, color }) => {
        const seriesLine = d3.line().x(d => x(d.season)).y(d => y(d[key]));

        svg.append('path')
            .datum(seasonData)
            .attr('fill', 'none')
            .attr('stroke', color)
            .attr('stroke-width', 2)
            .attr('d', seriesLine);
    });

    // 7. Axes
    svg.append('g').attr('transform', `translate(0,${height})`).call(
    d3.axisBottom(x).tickFormat(d3.format('d'))  // whole-number years
    );

    svg.append('g').call(d3.axisLeft(y));

    svg.append('text')
    .attr('x', width / 2)
    .attr('y', height + margin.bottom - 5)
    .attr('text-anchor', 'middle')
    .style('font-size', '13px')
    .text('Season')
    .style('font-weight', 'bold')
    .style('font-family', 'Georgia')
    // Y axis label
    svg.append('text')
    .attr('x', -(height / 2))
    .attr('y', -margin.left + 15)
    .attr('text-anchor', 'middle')
    .attr('transform', 'rotate(-90)')
    .style('font-size', '13px')
    .text('Attempts per game')
    .style('font-weight', 'bold')
    .style('font-family', 'Georgia');



    // 8. Legend (right side)
    series.forEach(({ label, color }, i) => {
    const lg = svg.append('g').attr('transform', `translate(${width + 10}, ${i * 22})`);
    lg.append('line').attr('x2', 18).attr('stroke', color).attr('stroke-width', 2);
    lg.append('text').attr('x', 22).attr('dy', '0.35em')
        .style('font-size', '12px').text(label);
    });

}


document.getElementById('btn-all').addEventListener('click', () => { playoffFilter = 'all'; renderAvg(); });
document.getElementById('btn-playoffs').addEventListener('click', () => { playoffFilter = 'playoffs'; renderAvg(); });
document.getElementById('btn-non-playoffs').addEventListener('click', () => { playoffFilter = 'non-playoffs'; renderAvg(); });
renderAvg();