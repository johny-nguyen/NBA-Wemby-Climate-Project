import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

async function loadData(){
    const [data1, data2] = await Promise.all([
    d3.csv('team_summaries.csv', row => ({
        team: row.team,
        wins: +row.w,
        season: Number(row.season),
        pace: Number(row.pace),
        playoffs: row.playoffs === 'True',
        age: Number(row.age)
    })),
    d3.csv('team_stats_per_game.csv', row => ({
        team: row.team,
        fga_per_game: Number(row.fga_per_game),
        x3pa_per_game: Number(row.x3pa_per_game),
        x2pa_per_game: Number(row.x2pa_per_game), // ADD THIS
        fta_per_game: Number(row.fta_per_game),
        season: Number(row.season)
    })),
    
    ]);

    const lookup = new Map(data2.map(r => [`${r.team}-${r.season}`, r]));

    const merged = data1.map(d => ({
        ...d,
        ...(lookup.get(`${d.team}-${d.season}`) ?? {})
    }));

    return merged;
}

let data = await loadData();

// populate team dropdown dynamically
const teams = [...new Set(data.map(d => d.team))].sort();
const select = d3.select('#team-select');
teams.forEach(t => select.append('option').text(t).attr('value', t));

// selected state
let selectedTeams = ['Los Angeles Lakers', 'Boston Celtics'];  // default selection
let selectedMetric = 'pace';

const teamLogos = {
    'Atlanta Hawks': 'https://a.espncdn.com/i/teamlogos/nba/500/atl.png',
    'Boston Celtics': 'https://a.espncdn.com/i/teamlogos/nba/500/bos.png',
    'Brooklyn Nets': 'https://a.espncdn.com/i/teamlogos/nba/500/bkn.png',
    'Charlotte Hornets': 'https://a.espncdn.com/i/teamlogos/nba/500/cha.png',
    'Chicago Bulls': 'https://a.espncdn.com/i/teamlogos/nba/500/chi.png',
    'Cleveland Cavaliers': 'https://a.espncdn.com/i/teamlogos/nba/500/cle.png',
    'Dallas Mavericks': 'https://a.espncdn.com/i/teamlogos/nba/500/dal.png',
    'Denver Nuggets': 'https://a.espncdn.com/i/teamlogos/nba/500/den.png',
    'Detroit Pistons': 'https://a.espncdn.com/i/teamlogos/nba/500/det.png',
    'Golden State Warriors': 'https://a.espncdn.com/i/teamlogos/nba/500/gs.png',
    'Houston Rockets': 'https://a.espncdn.com/i/teamlogos/nba/500/hou.png',
    'Indiana Pacers': 'https://a.espncdn.com/i/teamlogos/nba/500/ind.png',
    'Los Angeles Clippers': 'https://a.espncdn.com/i/teamlogos/nba/500/lac.png',
    'Los Angeles Lakers': 'https://a.espncdn.com/i/teamlogos/nba/500/lal.png',
    'Memphis Grizzlies': 'https://a.espncdn.com/i/teamlogos/nba/500/mem.png',
    'Miami Heat': 'https://a.espncdn.com/i/teamlogos/nba/500/mia.png',
    'Milwaukee Bucks': 'https://a.espncdn.com/i/teamlogos/nba/500/mil.png',
    'Minnesota Timberwolves': 'https://a.espncdn.com/i/teamlogos/nba/500/min.png',
    'New Orleans Pelicans': 'https://a.espncdn.com/i/teamlogos/nba/500/no.png',
    'New York Knicks': 'https://a.espncdn.com/i/teamlogos/nba/500/ny.png',
    'Oklahoma City Thunder': 'https://a.espncdn.com/i/teamlogos/nba/500/okc.png',
    'Orlando Magic': 'https://a.espncdn.com/i/teamlogos/nba/500/orl.png',
    'Philadelphia 76ers': 'https://a.espncdn.com/i/teamlogos/nba/500/phi.png',
    'Phoenix Suns': 'https://a.espncdn.com/i/teamlogos/nba/500/phx.png',
    'Portland Trail Blazers': 'https://a.espncdn.com/i/teamlogos/nba/500/por.png',
    'Sacramento Kings': 'https://a.espncdn.com/i/teamlogos/nba/500/sac.png',
    'San Antonio Spurs': 'https://a.espncdn.com/i/teamlogos/nba/500/sa.png',
    'Toronto Raptors': 'https://a.espncdn.com/i/teamlogos/nba/500/tor.png',
    'Utah Jazz': 'https://a.espncdn.com/i/teamlogos/nba/500/utah.png',
    'Washington Wizards': 'https://a.espncdn.com/i/teamlogos/nba/500/wsh.png',
};

function teamAbbrev(teamName) {
    return teamName.split(' ').map(part => part[0]).join('').slice(0, 3).toUpperCase();
}

function updateTeamLogos() {
    const logoStrip = d3.select('#team-logos');
    const logoData = selectedTeams.slice(0, 6); 

    const chips = logoStrip.selectAll('.logo-chip')
        .data(logoData, d => d)
        .join('div')
        .attr('class', 'logo-chip')
        .attr('title', d => d);

    chips.each(function(teamName) {
        const chip = d3.select(this);
        chip.selectAll('*').remove();
        
        const logoSrc = teamLogos[teamName];
        
        if (logoSrc) {
            chip.append('img').attr('src', logoSrc).attr('alt', `${teamName} logo`);
        } else {
            chip.append('div').attr('class', 'fallback-logo').text(teamAbbrev(teamName));
        }

        chip.append('span')
            .attr('class', 'team-name-label')
            .text(teamName);
    });
}

select.selectAll('option')
    .property('selected', function() { return selectedTeams.includes(this.value); });

const color = d3.scaleOrdinal(d3.schemeTableau10).domain(teams);

// --- NEW REFACTORED CHART ARCHITECTURE ---
let chartSvg, chartG, x, y, innerWidth, innerHeight;
const width = 1200;
const height = 600;
const margin = { top: 20, right: 30, bottom: 50, left: 60 };

let tooltip;

// 1. Build the empty structure ONCE
function initChart() {
    innerWidth = width - margin.left - margin.right;
    innerHeight = height - margin.top - margin.bottom;

    chartSvg = d3.select('#chart').append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('width', '100%')
        .attr('height', '100%')
        .style('overflow', 'visible');

    chartG = chartSvg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Create persistent groups for layering
    chartG.append('g').attr('class', 'y-grid-group');
    chartG.append('g').attr('class', 'x-grid-group').attr('transform', `translate(0, ${innerHeight})`);
    chartG.append('g').attr('class', 'x-axis-group').attr('transform', `translate(0, ${innerHeight})`);
    chartG.append('g').attr('class', 'y-axis-group');
    
    chartG.append('g').attr('class', 'lines-group');
    chartG.append('g').attr('class', 'points-group');
    chartG.append('g').attr('class', 'legend-group').attr('transform', `translate(${innerWidth - 120}, 10)`);

    x = d3.scaleLinear().range([0, innerWidth]);
    y = d3.scaleLinear().range([innerHeight, 0]);

    tooltip = d3.select('body')
        .selectAll('.tooltip')
        .data([null])
        .join('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('background', '#1a1a2e')
        .style('color', '#fff')
        .style('padding', '8px 12px')
        .style('border-radius', '6px')
        .style('font-size', '13px')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .style('z-index', 1000);
}

// 2. Update the data with smooth TRANSITIONS
function updateChart(chartData) {
    const t = d3.transition().duration(750).ease(d3.easeCubicOut); // Smooth morphing!

    const filtered = chartData.filter(d => selectedTeams.includes(d.team));
    const grouped = d3.group(filtered, d => d.team);

    // Update Scales
    x.domain(d3.extent(chartData, d => d.season));
    y.domain(d3.extent(chartData, d => d[selectedMetric]));

    const line = d3.line()
        .x(d => x(d.season))
        .y(d => y(d[selectedMetric]));

    // Animate Grids and Axes
    chartG.select('.y-grid-group').transition(t).call(
        d3.axisLeft(y).ticks(5).tickSize(-innerWidth).tickFormat('')
    );
    chartG.select('.x-grid-group').transition(t).call(
        d3.axisBottom(x).ticks(8).tickSize(-innerHeight).tickFormat('')
    );
    chartG.select('.x-axis-group').transition(t).call(
        d3.axisBottom(x).tickFormat(d3.format('d')).ticks(8)
    );
    chartG.select('.y-axis-group').transition(t).call(
        d3.axisLeft(y)
    );

    // Animate Team Lines
    chartG.select('.lines-group').selectAll('.team-line')
        .data(grouped, ([team]) => team)
        .join(
            enter => enter.append('path')
                .attr('class', 'team-line')
                .attr('stroke', ([team]) => color(team))
                .attr('fill', 'none')
                .attr('stroke-width', 2)
                .attr('opacity', 0)
                .attr('d', ([, values]) => line(values.sort((a, b) => a.season - b.season)))
                .call(enter => enter.transition(t).attr('opacity', 1)),
            update => update.call(update => update.transition(t)
                .attr('d', ([, values]) => line(values.sort((a, b) => a.season - b.season)))
            ),
            exit => exit.call(exit => exit.transition(t).attr('opacity', 0).remove())
        );

    // Calculate League Average
    const leagueAvg = Array.from(
        d3.group(chartData, d => d.season),
        ([season, rows]) => ({
            season,
            [selectedMetric]: d3.mean(rows, d => d[selectedMetric])
        })
    ).sort((a, b) => a.season - b.season);

    // Animate Average Line
    chartG.select('.lines-group').selectAll('.avg-line')
        .data([leagueAvg])
        .join(
            enter => enter.append('path')
                .attr('class', 'avg-line')
                .attr('stroke', '#aaa')
                .attr('stroke-width', 1.5)
                .attr('stroke-dasharray', '6 3')
                .attr('fill', 'none')
                .attr('opacity', 0)
                .attr('d', line)
                .call(enter => enter.transition(t).attr('opacity', 1)),
            update => update.call(update => update.transition(t).attr('d', line))
        );

    // Tooltip Mouseover Function
    const handleMouseover = function(event, d) {
        // const px = x(d.season);
        // const py = y(d[selectedMetric]);
        // const svgRect = chartSvg.node().getBoundingClientRect();
        // const scaleX = svgRect.width  / width;   
        // const scaleY = svgRect.height / height;
        
        tooltip
        .style('opacity', 1)
        .style('left', `${event.pageX + 12}px`)
        .style('top', `${event.pageY - 28}px`)
        .html(`
        <strong>${d.team || 'League Avg'}</strong><br/>
        Season: ${d.season}<br/>
        ${selectedMetric}: ${d[selectedMetric]?.toFixed(1)}<br/>
        ${selectedMetric === 'wins' && d.age != null ? `Avg Age: ${d.age.toFixed(1)}` : ''}
        ${d.playoffs !== undefined ? (d.playoffs ? '🏆 Playoff team' : '❌ Missed playoffs') : ''}
        `);
    };

    // Animate Average Points
    chartG.select('.points-group').selectAll('.avg-point')
        .data(leagueAvg, d => d.season)
        .join(
            enter => enter.append('circle')
                .attr('class', 'avg-point')
                .attr('cx', d => x(d.season))
                .attr('cy', d => y(d[selectedMetric]))
                .attr('r', 3)
                .attr('fill', '#aaa')
                .attr('opacity', 0)
                .on('mouseover', handleMouseover)
                .on('mouseout', () => tooltip.style('opacity', 0))
                .call(enter => enter.transition(t).attr('opacity', 1)),
            update => update.call(update => update.transition(t)
                .attr('cx', d => x(d.season))
                .attr('cy', d => y(d[selectedMetric]))
            )
        );

    // Animate Team Points
    chartG.select('.points-group').selectAll('.team-point-group')
        .data(grouped, ([team]) => team)
        .join(
            enter => enter.append('g').attr('class', 'team-point-group'),
            update => update,
            exit => exit.remove()
        )
        .selectAll('.team-point')
        .data(([, values]) => values, d => d.season)
        .join(
            enter => enter.append('circle')
                .attr('class', 'team-point')
                .attr('cx', d => x(d.season))
                .attr('cy', d => y(d[selectedMetric]))
                .attr('r', 7)
                .attr('fill', d => d.playoffs ? color(d.team) : '#444')
                .attr('stroke', '#fff')
                .attr('stroke-width', 1)
                .attr('opacity', 0)
                .on('mouseover', handleMouseover)
                .on('mouseout', () => tooltip.style('opacity', 0))
                .call(enter => enter.transition(t).attr('opacity', 1)),
            update => update.call(update => update.transition(t)
                .attr('cx', d => x(d.season))
                .attr('cy', d => y(d[selectedMetric]))
            ),
            exit => exit.remove()
        );

    // Animate Legend
    const legendData = [...selectedTeams.map(team => ({ label: team, color: color(team), dashed: false })),
                        { label: 'League Avg', color: '#aaa', dashed: true }];

    chartG.select('.legend-group').selectAll('.legend-row')
        .data(legendData, d => d.label)
        .join(
            enter => {
                const g = enter.append('g')
                    .attr('class', 'legend-row')
                    .attr('transform', (d, i) => `translate(0, ${i * 24})`)
                    .attr('opacity', 0);
                    
                g.append('line')
                    .attr('x1', 0).attr('x2', 20)
                    .attr('y1', 7).attr('y2', 7)
                    .attr('stroke', d => d.color)
                    .attr('stroke-width', 2)
                    .attr('stroke-dasharray', d => d.dashed ? '6 3' : null);

                g.append('circle')
                    .attr('cx', 10).attr('cy', 7)
                    .attr('r', 4)
                    .attr('fill', d => d.color)
                    .attr('stroke', d => d.dashed ? 'none' : '#fff')
                    .attr('stroke-width', 1);

                g.append('text')
                    .attr('x', 28).attr('y', 11)
                    .text(d => d.label)
                    .attr('fill', '#f3f4f6') 
                    .style('font-size', '13px');
                    
                g.transition(t).attr('opacity', 1);
                return g;
            },
            update => update.call(update => update.transition(t)
                .attr('transform', (d, i) => `translate(0, ${i * 24})`)
            ),
            exit => exit.call(exit => exit.transition(t).attr('opacity', 0).remove())
        );
}

// Map Metric Titles
const metricTitles = {
    'pace': 'The Pace of the Game',
    'fga_per_game': 'Field Goal Attempts (FGA/G)',
    'x3pa_per_game': 'The 3-Point Surge (3PA/G)',
    'wins': 'Translating to Wins'
};

// metric radio listeners
d3.selectAll('input[name="metric"]').on('change', function() {
    selectedMetric = this.value;
    d3.select('#chart-title').text(metricTitles[selectedMetric]);
    
    // Smoothly update instead of removing the SVG!
    updateChart(data);
});

// Map
function renderMap(mapData){
    const width = 1200, height = 800;
    const svg = d3.select('#map')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('width', '100%')
    .attr('height', '100%');

    const mapGroup = svg.append('g').attr('class', 'map-layer');

    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on('zoom', (event) => {
            mapGroup.attr('transform', event.transform);
        });
    svg.call(zoom);

    const projection = d3.geoMercator()
    .center([-96, 40])
    .scale(1200)
    .translate([width / 2, height / 2]);

    const color = d3.scaleOrdinal()
    .domain(['East', 'West'])
    .range(['#3266ad', '#c0392b']);

    const nbaTeams = [
        { id:'Boston Celtics',          name:'Boston Celtics',          city:'Boston',        coords:[-71.062,42.356],  conf:'East', div:'Atlantic',  validFrom:2000 },
        { id:'New Jersey Nets',         name:'New Jersey Nets',         city:'Newark',        coords:[-74.171,40.733],  conf:'East', div:'Atlantic',  validFrom:2000 },
        { id:'Brooklyn Nets',           name:'Brooklyn Nets',           city:'Brooklyn',      coords:[-73.975,40.682],  conf:'East', div:'Atlantic',  validFrom:2012 },
        { id:'New York Knicks',         name:'New York Knicks',         city:'New York',      coords:[-73.993,40.75],   conf:'East', div:'Atlantic',  validFrom:2000 },
        { id:'Philadelphia 76ers',      name:'Philadelphia 76ers',      city:'Philadelphia',  coords:[-75.172,39.901],  conf:'East', div:'Atlantic',  validFrom:2000 },
        { id:'Toronto Raptors',         name:'Toronto Raptors',         city:'Toronto',       coords:[-79.38,43.643],   conf:'East', div:'Atlantic',  validFrom:2000, canada:true },
        { id:'Chicago Bulls',           name:'Chicago Bulls',           city:'Chicago',       coords:[-87.674,41.881],  conf:'East', div:'Central',   validFrom:2000 },
        { id:'Cleveland Cavaliers',     name:'Cleveland Cavaliers',     city:'Cleveland',     coords:[-81.688,41.496],  conf:'East', div:'Central',   validFrom:2000 },
        { id:'Detroit Pistons',         name:'Detroit Pistons',         city:'Detroit',       coords:[-83.055,42.341],  conf:'East', div:'Central',   validFrom:2000 },
        { id:'Indiana Pacers',          name:'Indiana Pacers',          city:'Indianapolis',  coords:[-86.155,39.764],  conf:'East', div:'Central',   validFrom:2000 },
        { id:'Milwaukee Bucks',         name:'Milwaukee Bucks',         city:'Milwaukee',     coords:[-87.917,43.045],  conf:'East', div:'Central',   validFrom:2000 },
        { id:'Atlanta Hawks',           name:'Atlanta Hawks',           city:'Atlanta',       coords:[-84.396,33.757],  conf:'East', div:'Southeast', validFrom:2000 },
        { id:'Charlotte Hornets',       name:'Charlotte Hornets',       city:'Charlotte',     coords:[-80.839,35.225],  conf:'East', div:'Southeast', validFrom:2000 },
        { id:'Charlotte Bobcats',       name:'Charlotte Bobcats',       city:'Charlotte',     coords:[-80.839,35.225],  conf:'East', div:'Southeast', validFrom:2004 },
        { id:'Miami Heat',              name:'Miami Heat',              city:'Miami',         coords:[-80.187,25.781],  conf:'East', div:'Southeast', validFrom:2000 },
        { id:'Orlando Magic',           name:'Orlando Magic',           city:'Orlando',       coords:[-81.383,28.539],  conf:'East', div:'Southeast', validFrom:2000 },
        { id:'Washington Wizards',      name:'Washington Wizards',      city:'Washington',    coords:[-77.021,38.898],  conf:'East', div:'Southeast', validFrom:2000 },
        { id:'Denver Nuggets',          name:'Denver Nuggets',          city:'Denver',        coords:[-104.99,39.748],  conf:'West', div:'Northwest', validFrom:2000 },
        { id:'Minnesota Timberwolves',  name:'Minnesota Timberwolves',  city:'Minneapolis',   coords:[-93.276,44.979],  conf:'West', div:'Northwest', validFrom:2000 },
        { id:'Seattle SuperSonics',     name:'Seattle SuperSonics',     city:'Seattle',       coords:[-122.333,47.622], conf:'West', div:'Northwest', validFrom:2000 },
        { id:'Oklahoma City Thunder',   name:'Oklahoma City Thunder',   city:'Oklahoma City', coords:[-97.516,35.463],  conf:'West', div:'Northwest', validFrom:2008 },
        { id:'Portland Trail Blazers',  name:'Portland Trail Blazers',  city:'Portland',      coords:[-122.767,45.531], conf:'West', div:'Northwest', validFrom:2000 },
        { id:'Utah Jazz',               name:'Utah Jazz',               city:'Salt Lake City',coords:[-111.901,40.768], conf:'West', div:'Northwest', validFrom:2000 },
        { id:'Golden State Warriors',   name:'Golden State Warriors',   city:'San Francisco', coords:[-122.387,37.768], conf:'West', div:'Pacific',   validFrom:2000 },
        { id:'Los Angeles Clippers',    name:'Los Angeles Clippers',    city:'Los Angeles',   coords:[-118.338,34.043], conf:'West', div:'Pacific',   validFrom:2000 },
        { id:'Los Angeles Lakers',      name:'Los Angeles Lakers',      city:'Los Angeles',   coords:[-118.268,34.01],  conf:'West', div:'Pacific',   validFrom:2000 },
        { id:'Phoenix Suns',            name:'Phoenix Suns',            city:'Phoenix',       coords:[-112.071,33.446], conf:'West', div:'Pacific',   validFrom:2000 },
        { id:'Sacramento Kings',        name:'Sacramento Kings',        city:'Sacramento',    coords:[-121.499,38.58],  conf:'West', div:'Pacific',   validFrom:2000 },
        { id:'Dallas Mavericks',        name:'Dallas Mavericks',        city:'Dallas',        coords:[-96.81,32.79],    conf:'West', div:'Southwest', validFrom:2000 },
        { id:'Houston Rockets',         name:'Houston Rockets',         city:'Houston',       coords:[-95.362,29.751],  conf:'West', div:'Southwest', validFrom:2000 },
        { id:'Memphis Grizzlies',       name:'Memphis Grizzlies',       city:'Memphis',       coords:[-90.05,35.138],   conf:'West', div:'Southwest', validFrom:2000 },
        { id:'Vancouver Grizzlies',     name:'Vancouver Grizzlies',     city:'Vancouver',     coords:[-123.116,49.246], conf:'West', div:'Southwest', validFrom:2000, canada:true },
        { id:'New Orleans Pelicans',    name:'New Orleans Pelicans',    city:'New Orleans',   coords:[-90.082,29.949],  conf:'West', div:'Southwest', validFrom:2013 },
        { id:'New Orleans Hornets',     name:'New Orleans Hornets',     city:'New Orleans',   coords:[-90.082,29.949],  conf:'West', div:'Southwest', validFrom:2002 },
        { id:'New Orleans/Oklahoma City Hornets', name:'New Orleans/Oklahoma City Hornets', city:'New Orleans', coords:[-90.082,29.949], conf:'West', div:'Southwest', validFrom:2005 },
        { id:'San Antonio Spurs',       name:'San Antonio Spurs',       city:'San Antonio',   coords:[-98.438,29.427],  conf:'West', div:'Southwest', validFrom:2000 },
    ];

    const path = d3.geoPath().projection(projection);

    d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json').then(us => {
        const states = topojson.feature(us, us.objects.states).features;
        const stateColor = d3.scaleSequential()
            .domain([-125, -66])
            .interpolator(d3.interpolateRgbBasis(['#2f5d8a', '#4f9cb8', '#7ecf9a', '#f4c061', '#d9784d']));

        mapGroup.append('g')
            .selectAll('path')
            .data(states)
            .join('path')
            .attr('d', path)
            .attr('fill', d => {
                const c = d3.geoCentroid(d);
                return stateColor(c[0]);
            })
            .attr('stroke', '#eef4fa')
            .attr('stroke-width', 0.9);

        const tooltip = d3.select('body')
            .selectAll('.map-tooltip')
            .data([null])
            .join('div')
            .attr('class', 'map-tooltip')
            .style('position', 'absolute')
            .style('background', '#1a1a2e')
            .style('color', '#fff')
            .style('padding', '8px 12px')
            .style('border-radius', '6px')
            .style('font-size', '13px')
            .style('pointer-events', 'none')
            .style('opacity', 0)
            .style('z-index', 1000);

        const circles = mapGroup.append('g')
            .selectAll('circle')
            .data(nbaTeams)
            .join('circle')
            .attr('cx', d => projection(d.coords)[0])
            .attr('cy', d => projection(d.coords)[1])
            .attr('r', 20)
            .attr('fill', d => color(d.conf))
            .attr('stroke', '#fff')
            .attr('stroke-width', 1.5)
            .attr('opacity', 0.85)
            .on('mouseover', (event, d) => {
                const logo = teamLogos[d.id];
                tooltip
                    .style('opacity', 1)
                    .html(`
                        ${logo ? `<img src="${logo}" style="width:40px;height:40px;object-fit:contain;display:block;margin:0 auto 4px;">` : ''}
                        <strong>${d.name}</strong><br/>
                        ${d.city} · ${d.conf}ern Conference
                    `);
            })
            .on('mousemove', (event) => {
                tooltip
                    .style('left', `${event.pageX + 12}px`)
                    .style('top',  `${event.pageY - 28}px`);
            })
            .on('mouseout', () => tooltip.style('opacity', 0))
            .on('click', (event, d) => {
                const idx = selectedTeams.indexOf(d.id);
                if (idx === -1) {
                    selectedTeams.push(d.id);
                } else {
                    selectedTeams.splice(idx, 1);
                }

                select.selectAll('option')
                    .property('selected', function() { return selectedTeams.includes(this.value); });
                updateTeamLogos();

                circles.attr('opacity', t =>
                    selectedTeams.includes(t.id) ? 1 : 0.3
                ).attr('r', t =>
                    selectedTeams.includes(t.id) ? 11 : 8
                );

                // Smoothly update when teams are selected
                updateChart(mapData);
            });

        circles.attr('opacity', d => selectedTeams.includes(d.id) ? 1 : 0.5)
                .attr('r', d => selectedTeams.includes(d.id) ? 11 : 8);

        d3.select('#reset-map-btn').on('click', () => {
            selectedTeams = []; 
            updateTeamLogos();
            select.selectAll('option').property('selected', false);

            circles.transition().duration(300)
                .attr('opacity', 0.3)
                .attr('r', 8);

            // Smoothly update when reset
            updateChart(mapData); 

            svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
        });
    });
}

// 3. Initialize everything on page load
initChart(); 
renderMap(data);
updateChart(data);
updateTeamLogos();

// This is the vis2 logic 
// ==========================================
// LEAGUE EVOLUTION CHART (Macro View)
// ==========================================
function initEvolutionChart(fullData) {
    const width = 1200, height = 500;
    const margin = { top: 30, right: 150, bottom: 50, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select('#evolution-chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('width', '100%')
        .attr('height', '100%');

    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    const x = d3.scaleLinear().range([0, innerWidth]);
    const y = d3.scaleLinear().range([innerHeight, 0]);

    // Persistent axes groups
    const xAxisG = g.append('g').attr('transform', `translate(0, ${innerHeight})`).attr('class', 'x-axis');
    const yAxisG = g.append('g').attr('class', 'y-axis');
    const gridG = g.append('g').attr('class', 'grid');
    const linesG = g.append('g');

    // Axes Labels
    svg.append('text')
        .attr('x', width / 2).attr('y', height - 10)
        .attr('text-anchor', 'middle').attr('fill', '#9ca3af')
        .text('Season');

    svg.append('text')
        .attr('x', -(height / 2)).attr('y', 20)
        .attr('text-anchor', 'middle').attr('transform', 'rotate(-90)')
        .attr('fill', '#9ca3af')
        .text('Attempts Per Game');

    function draw(filterType) {
        const t = d3.transition().duration(750);

        // Filter Data
        let filtered = fullData;
        if (filterType === 'playoffs') filtered = fullData.filter(d => d.playoffs);
        if (filterType === 'non-playoffs') filtered = fullData.filter(d => !d.playoffs);

        // Group by season and average the metrics
        const seasonData = Array.from(
            d3.group(filtered, d => d.season),
            ([season, rows]) => ({
                season,
                x2pa: d3.mean(rows, d => d.x2pa_per_game),
                x3pa: d3.mean(rows, d => d.x3pa_per_game),
                fta: d3.mean(rows, d => d.fta_per_game)
            })
        ).sort((a, b) => a.season - b.season);

       const normalized = seasonData.map(d => {
    const total = d.x2pa + d.x3pa + d.fta;
    return {
        season: d.season,
        x2pa: (d.x2pa / total) * 100,
        x3pa: (d.x3pa / total) * 100,
        fta:  (d.fta  / total) * 100
    };
});

// Update scales — x is now a band scale, y is always 0–100
const x = d3.scaleBand()
    .domain(normalized.map(d => d.season))
    .range([0, innerWidth])
    .padding(0.15);

y.domain([0, 100]);

xAxisG.transition(t).call(d3.axisBottom(x).tickFormat(d3.format('d')));
yAxisG.transition(t).call(d3.axisLeft(y).ticks(5).tickFormat(d => d + '%'));
gridG.transition(t).call(d3.axisLeft(y).ticks(5).tickSize(-innerWidth).tickFormat(''));

const series = [
    { key: 'x3pa', label: '3-Point Attempts', color: '#FF4500' },
    { key: 'x2pa', label: '2-Point Attempts', color: '#4f9cb8' },
    { key: 'fta',  label: 'Free Throw Attempts', color: '#7ecf9a' }
];

// Stack the data
const stack = d3.stack().keys(['x3pa', 'x2pa', 'fta']);
const stacked = stack(normalized);

// Draw stacked bar segments
linesG.selectAll('.bar-group')
    .data(stacked, d => d.key)
    .join(
        enter => enter.append('g')
            .attr('class', 'bar-group')
            .attr('fill', d => series.find(s => s.key === d.key).color),
        update => update,
        exit => exit.remove()
    )
    .each(function(segmentData) {
        const key = segmentData.key;
        const label = series.find(s => s.key === key)?.label ?? key;

        d3.select(this).selectAll('rect')
            .data(segmentData, d => d.data.season)
            .join(
                enter => enter.append('rect')
                    .attr('x', d => x(d.data.season))
                    .attr('width', x.bandwidth())
                    .attr('y', innerHeight)
                    .attr('height', 0)
                    .on('mouseover', (event, d) => {
                        tooltip
                            .style('opacity', 1)
                            .html(`<strong>${label}</strong><br/>Season: ${d.data.season}<br/>Share: ${(d[1] - d[0]).toFixed(1)}%`);
                    })
                    .on('mousemove', event => {
                        tooltip
                            .style('left', `${event.pageX + 12}px`)
                            .style('top', `${event.pageY - 28}px`);
                    })
                    .on('mouseout', () => tooltip.style('opacity', 0))
                    .call(enter => enter.transition(t)
                        .attr('y', d => y(d[1]))
                        .attr('height', d => y(d[0]) - y(d[1]))
                    ),
                update => update.call(update => update.transition(t)
                    .attr('x', d => x(d.data.season))
                    .attr('width', x.bandwidth())
                    .attr('y', d => y(d[1]))
                    .attr('height', d => y(d[0]) - y(d[1]))
                ),
                exit => exit.transition(t).attr('height', 0).attr('y', innerHeight).remove()
            );
    });
    
    }

    // Initialize chart with 'all'
    draw('all');

    // Button Listeners
    d3.select('#btn-all').on('click', function() {
        d3.selectAll('#evolution-controls .glass-button').classed('active-toggle', false);
        d3.select(this).classed('active-toggle', true);
        draw('all');
    });
    d3.select('#btn-playoffs').on('click', function() {
        d3.selectAll('#evolution-controls .glass-button').classed('active-toggle', false);
        d3.select(this).classed('active-toggle', true);
        draw('playoffs');
    });
    d3.select('#btn-non-playoffs').on('click', function() {
        d3.selectAll('#evolution-controls .glass-button').classed('active-toggle', false);
        d3.select(this).classed('active-toggle', true);
        draw('non-playoffs');
    });
}

// Call it!
initEvolutionChart(data);