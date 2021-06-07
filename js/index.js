const width = 1000;
const barWidth = 500;
const height = 500;
const margin = 30;

const yearLable = d3.select('#year');
const countryName = d3.select('#country-name');

const barChart = d3.select('#bar-chart')
            .attr('width', barWidth)
            .attr('height', height);

const scatterPlot  = d3.select('#scatter-plot')
            .attr('width', width)
            .attr('height', height);

const lineChart = d3.select('#line-chart')
            .attr('width', width)
            .attr('height', height);

let xParam = 'fertility-rate';
let yParam = 'child-mortality';
let rParam = 'gdp';
let year = '2000';
let param = 'child-mortality';
let lineParam = 'gdp';
let highlighted = '';
let selected;

const x = d3.scaleLinear().range([margin*2, width-margin]);
const y = d3.scaleLinear().range([height-margin, margin]);

const xBar = d3.scaleBand().range([margin*2, barWidth-margin]).padding(0.1);
const yBar = d3.scaleLinear().range([height-margin, margin])

const xAxis = scatterPlot.append('g').attr('transform', `translate(0, ${height-margin})`);
const yAxis = scatterPlot.append('g').attr('transform', `translate(${margin*2}, 0)`);

const xLineAxis = lineChart.append('g').attr('transform', `translate(0, ${height-margin})`);
const yLineAxis = lineChart.append('g').attr('transform', `translate(${margin*2}, 0)`);

const xBarAxis = barChart.append('g').attr('transform', `translate(0, ${height-margin})`);
const yBarAxis = barChart.append('g').attr('transform', `translate(${margin*2}, 0)`);

const colorScale = d3.scaleOrdinal().range(['#DD4949', '#39CDA1', '#FD710C', '#A14BE5']);
const radiusScale = d3.scaleSqrt().range([10, 30]);

const xLineplot = d3.scaleTime().range([margin * 2, width - margin]);
const yLineplot = d3.scaleLinear().range([height - margin, margin]);


loadData().then(data => {

    colorScale.domain(d3.set(data.map(d=>d.region)).values());

    d3.select('#range').on('change', function(){ 
        year = d3.select(this).property('value');
        yearLable.html(year);
        updateScatterPlot();
        updateBar();
    });

    d3.select('#radius').on('change', function(){ 
        rParam = d3.select(this).property('value');
        updateScatterPlot();
    });

    d3.select('#x').on('change', function(){ 
        xParam = d3.select(this).property('value');
        updateScatterPlot();
    });

    d3.select('#y').on('change', function(){ 
        yParam = d3.select(this).property('value');
        updateScatterPlot();
    });

    d3.select('#param').on('change', function(){ 
        param = d3.select(this).property('value');
        updateBar();
    });

    d3.select('#p').on('change', function () {
        lineParam = d3.select(this).property('value');
        updateLinePlot();
    });


    function updateBar() {
        let meanData = d3.nest()
            .key(data => data['region'])
            .rollup(v => d3.mean(v, data => parseFloat(data[param][year]) || 0))
            .entries(data);

        let x_point = xBar.domain(['asia', 'europe', 'africa', 'americas']);
        let y_point = yBar.domain([0, d3.max(meanData.map(data => data.value))]);

        xBarAxis.call(d3.axisBottom(x_point));
        yBarAxis.call(d3.axisLeft(y_point));

        selection = barChart.selectAll(".bar").data(meanData).enter().append("rect").on('click', bar_plot_click)

        selection.attr("class", "bar")
            .attr("x", data => x_point(data.key))
            .attr("y", data => y_point(data.value))
            .attr("width", x_point.bandwidth())
            .attr("height", data => height - margin - y_point(data.value))
            .attr('fill', data => colorScale(data.key));

        barChart.selectAll(".bar").data(meanData).transition().attr("class", "bar")
            .attr("x", data => x_point(data.key))
            .attr("y", data => y_point(data.value))
            .attr("width", x_point.bandwidth())
            .attr("height", data => height - margin - y_point(data.value))
            .attr('fill', data => colorScale(data.key));

   
    }

    function bar_plot_click(ClickedData, i) {

        if(typeof ClickedData !== "undefined" && highlighted !== ClickedData.key) {
            highlighted = ClickedData.key;
            barChart.selectAll('.bar')
                .transition()
                .style('opacity', data => data.key === highlighted ? 1.0 : 0.2);

            scatterPlot.selectAll('circle').transition()
                .style('opacity', data => data.region === highlighted ? 1 : 0);
        }
        else {
            barChart.selectAll('.bar')
                .transition()
                .style('opacity', 1.0);

            scatterPlot.selectAll('circle').transition()
                .style('opacity', 1);
             highlighted = '';
        }
        d3.event.stopPropagation();
    }

    function updateScatterPlot() {
        let radius = radiusScale.domain(d3.extent(data.map(data => parseFloat(data[rParam][year]) || 0)));
        let x_point = x.domain(d3.extent(data.map(data => parseFloat(data[xParam][year]) || 0)));
        let y_point = y.domain(d3.extent(data.map(data => parseFloat(data[yParam][year]) || 0)));
        xAxis.call(d3.axisBottom(x_point));
        yAxis.call(d3.axisLeft(y_point));

        sel = scatterPlot
            .selectAll('circle')
            .data(data)
            .transition()

        scatter_sel(scatterPlot
            .selectAll('circle')
            .data(data)
            .enter().append('circle').on('click', on_click_circle), x_point, y_point, radius);

        scatter_sel(scatterPlot
            .selectAll('circle')
            .data(data)
            .transition(), x_point, y_point, radius);
    }

    function scatter_sel(selection, x_point, y_point, radius) {
        selection.attr('r', data => radius(parseFloat(data[rParam][year]) || 0))
            .attr('cx', data => x_point(parseFloat(data[xParam][year]) || 0))
            .attr('cy', data => y_point(parseFloat(data[yParam][year]) || 0))
            .attr('fill', data => colorScale(data['region']));
    }

    function on_click_circle(ClickedData, i) {
        selected = ClickedData.country
        scatterPlot.selectAll('circle')
            .transition()
            .attr('stroke-width', data => data.country === selected ? 3 : 1);
        d3.select(this).raise();
        updateLinePlot();
    }

    function updateLinePlot() {
        const index = data.findIndex(item => item.country === selected);
        if(index === -1) return;
        const item = data[index][lineParam];
        let entries = Object.entries(item).slice(0, -5)
        let x_point = xLineplot.domain(d3.extent(entries.map(entry => new Date(entry[0]))));
        let y_point = yLineplot.domain(d3.extent(entries.map(entry => parseFloat(entry[1]) || 0)));
        lineChart.selectAll('path').remove();
        countryName.html(selected);
        xLineAxis.call(d3.axisBottom(x_point));
        yLineAxis.call(d3.axisLeft(y_point));
        lineChart.append('path')
            .datum(entries)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
                .x(data => x_point(new Date(data[0])))
                .y(data => y_point(parseFloat(data[1]) || 0)))
    }

    updateBar();
    updateScatterPlot();
});

async function loadData() {
    const data = { 
        'population': await d3.csv('data/population.csv'),
        'gdp': await d3.csv('data/gdp.csv'),
        'child-mortality': await d3.csv('data/cmu5.csv'),
        'life-expectancy': await d3.csv('data/life_expectancy.csv'),
        'fertility-rate': await d3.csv('data/fertility-rate.csv')
    };
    
    return data.population.map(d=>{
        const index = data.gdp.findIndex(item => item.geo == d.geo);
        return  {
            country: d.country,
            geo: d.geo,
            region: d.region,
            population: d,
            'gdp': data['gdp'][index],
            'child-mortality': data['child-mortality'][index],
            'life-expectancy': data['life-expectancy'][index],
            'fertility-rate': data['fertility-rate'][index]
        }
    })
}