"use strict";

/*
    Misc helper functions

    -Rama
*/

function create_data_table(X, Y, YY) {
    let E = Y.map((y, i) => y - YY[i]);
    let EE = E.map(e => e ** 2);
	let mx = mean(X);
	let my = mean(Y);
	let XMX = X.map(x => x - mx);
	let YMY = Y.map(y => y - my);
	let XY = XMX.map((x, i) => x * YMY[i]);
	let XMX2 = XMX.map(x => x ** 2);
    let table = {
        headers: { 	"x" : "\\(x\\)",
					"y": "\\(y\\)",
					"x-mx": "\\(x - \\bar{x}\\)",
					"y-my": "\\(y - \\bar{y}\\)",
					"xy": "\\((x - \\bar{x})(y - \\bar{y})\\)",
					"x-mx2": "\\((x - \\bar{x})^2\\)",
					"yy": "\\(\\hat{y}\\)",
					"e": "\\(e\\)",
					"ee": "\\(e^2\\)"
				},
        values: X.map((x, i) => ({ 	"x":  x,
									"y": Y[i],
									"x-mx": XMX[i],
									"y-my": YMY[i],
									"xy": XY[i],
									"x-mx2": XMX2[i],
									"yy": YY[i],
									"e": E[i],
									"ee": EE[i]
								})),
        //list: {X: X, Y: Y, E: E, EE: EE}
    }

    return table;
}

const get_circular_replacer = () => {
    const seen = new WeakSet();
    return (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return;
        }
        seen.add(value);
      }
      return value;
    };
};

/*
    Chart functions

    -Rama
*/

const scatter_join_points_plugin = {
    afterDatasetsDraw: function (chart, easing) {
        if (chart.config.options.scatter_join_points) {
            const set1 = chart.getDatasetMeta(0).data;
            const set2 = chart.getDatasetMeta(1).data;
            const ctx = chart.chart.ctx;

            for (let i = 0; i < set1.length; ++i) {
                ctx.beginPath();
                ctx.strokeStyle = 'black';
                ctx.moveTo(set1[i]._model.x, set1[i]._model.y);
                ctx.lineTo(set2[i]._model.x, set2[i]._model.y);
                ctx.stroke();
            }

            //chart.config.lineAtIndex.forEach(pointIndex => this.renderVerticalLine(chart, pointIndex));
        }
    }
};
  
Chart.plugins.register(scatter_join_points_plugin);

function create_scatter_chart_data(data_table) {
    let dataset1 = data_table.map(x => ({x: x.x, y: x.y}));
    let dataset2 = data_table.map(x => ({x: x.x, y: x.yy}));
    window.chartColors = {
        red: 'rgba(255, 99, 132, 0.65)',
        orange: 'rgba(255, 159, 64)',
        yellow: 'rgba(255, 205, 86)',
        green: 'rgba(75, 192, 192)',
        blue: 'rgba(54, 162, 235, 0.65)',
        purple: 'rgba(153, 102, 255)',
        grey: 'rgba(201, 203, 207)'
    };
    let colour1 = window.chartColors.blue;
    let colour2 = window.chartColors.red;

    colour1 = "rgba(255, 0, 0, 0.5)";
    colour2 = "rgba(0, 0, 255, 0.3)";
    return {
        datasets: [{
            label: 'X, Y  Points',
            borderColor: colour1,
            backgroundColor: colour1, //Chart.helpers.color(colour).alpha(0.2).rgbString(),
            pointStyle: 'rect',
            data: dataset1
        },
        {
            label: "Linear Regression",
            borderColor: colour2,
            backgroundColor: colour2, //Chart.helpers.color(colour).alpha(0.2).rgbString(),
            pointStyle: 'rect',
            showLine: true,
            fill: false,
            //borderDash: [5, 5],
            data: dataset2
        }]
    };
}

function create_residual_plot_data(data_table) {
    let dataset1 = data_table.map(x => ({x: x.x, y: x.e}));
    let colour1 = "rgba(0, 0, 255, 0.65)";
    return {
        datasets: [{
            label: 'Residual / Error',
            borderColor: colour1,
            backgroundColor: colour1, //Chart.helpers.color(colour).alpha(0.2).rgbString(),
            pointStyle: 'rect',
            data: dataset1
        }]
    };
}

function create_normal_distribution_data(data_table) {
    let dataset1 = data_table.map(x => x.y);
    //let dataset1 = data_table;
    console.log(dataset1);
    let colour1 = "rgba(0, 0, 255, 0.65)";
    return {
        labels: data_table.map(x => x.x),
        datasets: [{
            label: 'Normal Distribution',
            borderColor: colour1,
            backgroundColor: colour1, //Chart.helpers.color(colour).alpha(0.2).rgbString(),
            fill:false,
            //pointStyle: 'rect',
            data: dataset1
        }]
    };
}

function create_scatter_chart(data_table, canvas_id) {
    let chart_data_table = data_table.values;
    window.chart_data = create_scatter_chart_data(chart_data_table);

    let ctx = document.getElementById(canvas_id).getContext("2d");
    window.scatter_chart = Chart.Scatter(ctx, {
        data: window.chart_data,
        options: {
            title: {
                display: true,
                text: "Scatter Chart"
            },
            scatter_join_points: true,
        }
    });
}

function create_residual_plot(data_table, canvas_id) {
    let chart_data_table = data_table.values;
    window.residual_plot_data = create_residual_plot_data(chart_data_table);

    let ctx = document.getElementById(canvas_id).getContext("2d");
    window.residual_plot = Chart.Scatter(ctx, {
        data: window.residual_plot_data,
        options: {
            title: {
                display: true,
                text: "Residual Plot"
            }
        }
    });
}

function create_normal_distribution_chart(data_table, canvas_id) {
    window.normal_distribution_data = create_normal_distribution_data(data_table.values);

    let ctx = document.getElementById(canvas_id).getContext("2d");
    window.normal_distribution_chart = new Chart(ctx, {
        type: "line",
        data:  window.normal_distribution_data,
        options: {
            title: {
                display: false,
                text: "Normal Distribution"
            }
        }
    });
}
