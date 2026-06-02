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
        season: Number(row.season)
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
console.log([...new Set(data.map(d => d.team))].sort());

// populate team dropdown dynamically (if you still have a hidden one)
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
    'Washington Wizards': 'https://a.espncdn.com/i/teamlogos/nba/500/wsh.png'
};

function teamAbbrev(teamName) {
    return teamName.split(' ').map(part => part[0]).join('').slice(0, 3).toUpperCase();
}

function updateTeamLogos() {
    const logoStrip = d3.select('#team-logos');
    const logoData = selectedTeams.slice(0, 8);

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
            chip.append('span').attr('class', 'fallback-text').text(teamAbbrev(teamName));
        }
    });
}

select.selectAll('option')
    .property('selected', function() { return selectedTeams.includes(this.value); });

const color = d3.scaleOrdinal(d3.schemeTableau10).domain(teams);

function renderChart(data){
    const width = 1200;
    const height = 600;
    const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('width', '100%')
    .style('overflow', 'visible')
    .attr('height', '100%');
    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
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
        .domain(d3.extent(data, d => d[selectedMetric]))
        .range([innerHeight, 0]);

    const line = d3.line()
        .x(d => x(d.season))
        .y(d => y(d[selectedMetric]));

    // y gridlines
    g.append('g')
        .attr('class', 'grid')
        .call(
        d3.axisLeft(y)
            .ticks(5)
            .tickSize(-innerWidth)
            .tickFormat('')
        );

    // x gridlines
    g.append('g')
        .attr('class', 'grid')
        .attr('transform', `translate(0, ${innerHeight})`)
        .call(
        d3.axisBottom(x)
            .ticks(8)
            .tickSize(-innerHeight)
            .tickFormat('')
        );

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

    // Compute league average per season
    const leagueAvg = Array.from(
    d3.group(data, d => d.season),
    ([season, rows]) => ({
        season,
        [selectedMetric]: d3.mean(rows, d => d[selectedMetric])
    })
    ).sort((a, b) => a.season - b.season);

    // Dashed average line
    g.append('path')
    .datum(leagueAvg)
    .attr('class', 'avg-line')
    .attr('d', d3.line()
        .x(d => x(d.season))
        .y(d => y(d[selectedMetric]))
    )
    .attr('stroke', '#aaa')
    .attr('stroke-width', 1.5)
    .attr('stroke-dasharray', '6 3')
    .attr('fill', 'none');

    // Points on the average line
    g.selectAll('.avg-point')
    .data(leagueAvg)
    .join('circle')
    .attr('class', 'avg-point')
    .attr('cx', d => x(d.season))
    .attr('cy', d => y(d[selectedMetric]))
    .attr('r', 3)
    .attr('fill', '#aaa')
    .on('mouseover', (event, d) => {
        const svgRect = svg.node().getBoundingClientRect();
        const scaleX = svgRect.width  / width;
        const scaleY = svgRect.height / height;
        tooltip
        .style('opacity', 1)
        .style('left', `${svgRect.left + (margin.left + x(d.season)) * scaleX + 12}px`)
        .style('top',  `${svgRect.top  + (margin.top  + y(d[selectedMetric])) * scaleY - 28}px`)
        .html(`
            <strong>League Avg</strong><br/>
            Season: ${d.season}<br/>
            ${selectedMetric}: ${d[selectedMetric]?.toFixed(1)}
        `);
    })
    .on('mouseout', () => tooltip.style('opacity', 0));

    // tooltip
    const tooltip = d3.select('body')
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
    .style('opacity', 0);

    g.selectAll('.team-points')
    .data([...grouped])                          
    .join('g')
    .attr('class', 'team-points')
    .each(function([team, values]) {
    d3.select(this)
    .selectAll('circle')
    .data(values)
    .join('circle')
    .attr('cx', d => x(d.season))
    .attr('cy', d => y(d[selectedMetric]))
    .attr('r', 7)
    .attr('fill', color(team))
    .attr('stroke', '#fff')
    .attr('stroke-width', 1)
    .on('mouseover', (event, d) => {
    const [px, py] = [x(d.season), y(d[selectedMetric])];
    const svgNode = svg.node();
    const svgRect = svgNode.getBoundingClientRect();

    const scaleX = svgRect.width  / width;   
    const scaleY = svgRect.height / height;
    
    tooltip
        .style('opacity', 1)
        .style('left', `${svgRect.left + (margin.left + px) * scaleX + 12}px`)
        .style('top',  `${svgRect.top  + (margin.top  + py) * scaleY - 28}px`)
        .html(`
        <strong>${d.team}</strong><br/>
        Season: ${d.season}<br/>
        ${selectedMetric}: ${d[selectedMetric]?.toFixed(1)}<br/>
        `);
    })
    });
    
    const legendData = [...selectedTeams.map(t => ({ label: t, color: color(t), dashed: false })),
                        { label: 'League Avg', color: '#aaa', dashed: true }];

    const legend = g.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${innerWidth - 120}, 10)`);

    const legendRows = legend.selectAll('.legend-row')
    .data(legendData)
    .join('g')
    .attr('class', 'legend-row')
    .attr('transform', (d, i) => `translate(0, ${i * 24})`);

    legendRows.append('line')
    .attr('x1', 0).attr('x2', 20)
    .attr('y1', 7).attr('y2', 7)
    .attr('stroke', d => d.color)
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', d => d.dashed ? '6 3' : null);

    legendRows.append('circle')
    .attr('cx', 10).attr('cy', 7)
    .attr('r', 4)
    .attr('fill', d => d.color)
    .attr('stroke', d => d.dashed ? 'none' : '#fff')
    .attr('stroke-width', 1);

    legendRows.append('text')
    .attr('x', 28).attr('y', 11)
    .text(d => d.label)
    .attr('fill', '#333')
    .style('font-size', '13px');
}

// team select listener
d3.select('#team-select').on('change', function() {
    selectedTeams = Array.from(this.selectedOptions).map(o => o.value);
    updateTeamLogos();
    d3.select('#chart svg').remove();  
    renderChart(data);
});

// metric radio listeners
d3.selectAll('input[name="metric"]').on('change', function() {
    selectedMetric = this.value;
    d3.select('#chart svg').remove();  
    renderChart(data);
});

// Map
function renderMap(mapData){
    const width = 1200, height = 800;
    const svg = d3.select('#map')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('width', '100%')
    .attr('height', '100%');

    // 1. ADD ZOOM BEHAVIOR
    const zoom = d3.zoom()
        .scaleExtent([1, 8]) // Zoom limits
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

        // This invisible/ocean rect catches the zoom events perfectly
        svg.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', width)
            .attr('height', height)
            .attr('fill', '#d6e9f7');

        // 2. CREATE A GROUP FOR MAP LAYER (so it can be zoomed)
        const mapGroup = svg.append('g').attr('class', 'map-layer');

        // Append paths to mapGroup instead of svg
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
            .style('opacity', 0);

        // Append circles to mapGroup instead of svg
        const circles = mapGroup.append('g')
            .selectAll('circle')
            .data(nbaTeams)
            .join('circle')
            .attr('cx', d => projection(d.coords)[0])
            .attr('cy', d => projection(d.coords)[1])
            .attr('r', 8)
            .attr('fill', d => color(d.conf))
            .attr('stroke', '#fff')
            .attr('stroke-width', 1.5)
            .attr('opacity', 0.85)
            .on('mouseover', (event, d) => {
            tooltip
                .style('opacity', 1)
                .html(`
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
                    selectedTeams.push(d.id);       // add team
                } else {
                    selectedTeams.splice(idx, 1);   // remove if already selected
                }

                select.selectAll('option')
                    .property('selected', function() { return selectedTeams.includes(this.value); });
                updateTeamLogos();

            // update circle opacity to reflect selection
                circles.attr('opacity', t =>
                    selectedTeams.includes(t.id) ? 1 : 0.3
                ).attr('r', t =>
                    selectedTeams.includes(t.id) ? 11 : 8
                );

                // redraw chart
                d3.select('#chart svg').remove();
                renderChart(mapData);
        });

        circles.attr('opacity', d => selectedTeams.includes(d.id) ? 1 : 0.3)
                .attr('r', d => selectedTeams.includes(d.id) ? 11 : 8);

        // 3. RESET BUTTON LOGIC
        d3.select('#reset-map-btn').on('click', () => {
            // Empty selection
            selectedTeams = []; 
            updateTeamLogos();
            select.selectAll('option').property('selected', false);

            // Reset circles visually
            circles.transition().duration(300)
                .attr('opacity', 0.3)
                .attr('r', 8);

            // Clear the chart (it will just be an empty chart since selectedTeams is empty)
            d3.select('#chart svg').remove();
            renderChart(mapData); 

            // Smoothly animate the map back to default zoom/pan
            svg.transition()
               .duration(750) 
               .call(zoom.transform, d3.zoomIdentity);
        });
    });
}

renderMap(data);
renderChart(data);
updateTeamLogos();