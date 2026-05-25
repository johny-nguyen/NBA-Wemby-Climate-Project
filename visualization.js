
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

async function loadData(){
    const [data1, data2] = await Promise.all([
      d3.csv('team_summaries.csv', row => ({
        team: row.team,
        wins: +row.wins,
        season: Number(row.season),
        pace: Number(row.pace),
        playoffs: row.playoffs === 'True' 
    })),
    d3.csv('team_stats_per_game.csv', row => ({
        team: row.team,
        fga_per_game: Number(row.fga_per_game),
        x3pa_per_game: Number(row.x3pa_per_game),
        season: Number(row.season)
    }))
    ]);


    const lookup = new Map(data2.map(r => [`${r.team}-${r.season}`, r]));

    const merged = data1.map(d => ({
        ...d,
        ...lookup.get(`${d.team}-${d.season}` ?? {})
    }));
  
    return merged;
}

let data = await loadData();
console.log(data);

//Loading Team Dropdowns
// populate team dropdown dynamically
const teams = [...new Set(data.map(d => d.team))].sort();
const select = d3.select('#team-select');
teams.forEach(t => select.append('option').text(t).attr('value', t));

// selected state
let selectedTeams = ['LAL', 'BOS'];  // default selection
let selectedMetric = 'pace';

const color = d3.scaleOrdinal(d3.schemeTableau10).domain(teams);

function renderChart(data){
    const width = 1000;
    const height = 800;
    const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)

    .style('overflow', 'visible');
    const margin = { top: 10, right: 10, bottom: 30, left: 20 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;




    const g = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);



    const filtered = data.filter(d => selectedTeams.includes(d.team));
    const grouped = d3.group(filtered, d => d.team);

    const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.season))
        .range([0, innerWidth]);

    const y = d3.scaleLinear()
        .domain(d3.extent(filtered, d => d[selectedMetric]))
        .range([innerHeight, 0]);

    const line = d3.line()
        .x(d => x(d.season))
        .y(d => y(d[selectedMetric]));

    // x axis
    g.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, ${innerHeight})`)
        .call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(8));

    // y axis
    g.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(y));

    // bind one path per team
    g.selectAll('.team-line')
        .data(grouped, ([team]) => team)
        .join('path')
        .attr('class', 'team-line')
        .attr('d', ([, values]) => line(values.sort((a, b) => a.season - b.season)))
        .attr('stroke', ([team]) => color(team))
        .attr('fill', 'none')
        .attr('stroke-width', 2);

    grouped.forEach(([team, values]) => {
    g.selectAll(`.dot-${team}`)
        .data(values)
        .join('circle')
        .attr('class', `dot-${team}`)
        .attr('cx', d => x(d.season))
        .attr('cy', d => y(d[selectedMetric]))
        .attr('r', 4)
        .attr('fill', color(team))
        .attr('stroke', 'white')
        .attr('stroke-width', 1.5);
    });
    
}
// team select listener
d3.select('#team-select').on('change', function() {
  selectedTeams = Array.from(this.selectedOptions).map(o => o.value);
  d3.select('#chart svg').remove();  // clear old chart
  renderChart(data);
});

// metric radio listeners
d3.selectAll('input[name="metric"]').on('change', function() {
  selectedMetric = this.value;
  d3.select('#chart svg').remove();  // clear old chart
  renderChart(data);
});

renderChart(data);