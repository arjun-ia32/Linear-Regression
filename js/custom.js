"use strict";

Array.prototype.sum = function(op_func) {
    op_func = op_func || ((x) => x);
    return this.reduce((acc, x) => acc + op_func(x), 0);
}

/*
    For summing up multiple arrays. Callback
    function must be the last argument passed,
    preceded by arrays to sum.

    Cardinality of all arrays must be equal.

    -Rama
*/
function sum(...args) {
    let i, j;
    let s = 0;

    let op_func = args[args.length - 1];
    for (i = 0; i < args[0].length; ++i) {
        let op_args = [];
        for (j = 0; j < args.length - 1; ++j) {
            op_args.push(args[j][i]);
        }
        s += op_func(...op_args);
    }

    return s;
}

// Arithmatic mean
function mean(X) {
    return X.sum() / X.length;
}

// Variance of population
function variance_p(X) {
    let m = mean(X);
    return X.sum(x => (x - m) ** 2) / X.length;
}

// Variance of sample
function variance_s(X) {
    let m = mean(X);
    return X.sum(x => (x - m) ** 2) / (X.length - 1);
}

// Standard deviation of population
function stddev_p(X) {
    return Math.sqrt(variance_p(X));
}

// Standard deviation of sample
function stddev_s(X) {
    return Math.sqrt(variance_s(X));
}

function check_cardinality(X, Y) {
    if (X.length != Y.length) {
        throw "Both Xs must have the same cardinality!";
    }
}

// Covariance of population
function covariance_p(X, Y) {
    check_cardinality(X, Y);
    let mx = mean(X);
    let my = mean(Y);
    return sum(X, Y, (x, y) => (x - mx) * (y - my)) / X.length;
}

// Covariance of sample
function covariance_s(X, Y) {
    check_cardinality(X, X);
    let mx = mean(X);
    let my = mean(Y);
    return sum(X, Y, (x, y) => (x - mx) * (y - my)) / (X.length - 1);
}

// Correlation coefficient of population
function correlation_coeff_p(X, Y) {
    check_cardinality(X, Y);
    return covariance_p(X, Y) / (stddev_p(X) * stddev_p(Y));
}

// Correlation coefficient of sample
function correlation_coeff_s(X, Y) {
    check_cardinality(X, Y);
    return covariance_s(X, Y) / (stddev_p(X) * stddev_p(Y));
}

// Coefficient of determination of population
function coeff_of_determination_p(X, Y) {
    return correlation_coeff_p(X, Y) ** 2;
}

// Coefficient of determination of sample
function coeff_of_determination_s(X, Y) {
    return correlation_coeff_s(X, Y) ** 2;
}

// Pearson product moment correlation coefficient
function ppmcc(X, Y) {
    check_cardinality(X, Y);

    let mx = mean(X), my = mean(Y);
    let sum_xy = 0, sum_x2 = 0, sum_y2 = 0;
    let x, y;
    for (let i = 0; i < X.length; ++i) {
        x = X[i] - mx;
        y = Y[i] - my;
        sum_xy += x * y;
        sum_x2 += x * x;
        sum_y2 += y * y;
    }

    return sum_xy / Math.sqrt(sum_x2 * sum_y2);
}

/*
    Simple linear regression by least squares method
    https://stattrek.com/regression/regression-example.aspx?tutorial=reg

    -Rama
*/
function linear_regression_b1(X, Y) {
    check_cardinality(X, Y);
    let meanx = mean(X), meany = mean(Y);
    return sum(X, Y, (x, y) => (x - meanx) * (y - meany)) / X.sum(x => (x - meanx) ** 2);
}

function linear_regression_b0(X, Y) {
    return mean(Y) - linear_regression_b1(X, Y) * mean(X);
}

function linear_regression_predict(X, Y, new_x) {
    return linear_regression_b0(X, Y) + linear_regression_b1(X, Y) * new_x;
}

function linear_regression_apply(X, Y) {
    let b0 = linear_regression_b0(X, Y);
    let b1 = linear_regression_b1(X, Y);

    return X.map(x => b0 + b1 * x);
}

/*
    Misc helper functions

    -Rama
*/

function create_data_table(X, Y, YY) {
    let D = Y.map((y, i) => y - YY[i]);
    return {
        headers: { "x" : "\\(x\\)", "y": "\\(y\\)", "yy": "\\(\\hat{y}\\)", "d": "\\(y - \\hat{y}\\)" },
        values: X.map((x, i) => ({ "x":  x, "y": Y[i], "yy": YY[i], d: D[i] }))
    }
}

/*
    Chart functions

    -Rama
*/

const verticalLinePlugin = {
    getLinePosition: function (chart, pointIndex) {
        const meta = chart.getDatasetMeta(0); // first dataset is used to discover X coordinate of a point
        const data = meta.data;
        return data[pointIndex]._model.x;
    },
    renderVerticalLine: function (chartInstance, pointIndex) {
        const lineLeftOffset = this.getLinePosition(chartInstance, pointIndex);
        const scale = chartInstance.scales['y-axis-0'];
        const context = chartInstance.chart.ctx;
  
        // render vertical line
        context.beginPath();
        context.strokeStyle = '#ff0000';
        context.moveTo(lineLeftOffset, scale.top);
        context.lineTo(lineLeftOffset, scale.bottom);
        context.stroke();
  
        // write label
        context.fillStyle = "#ff0000";
        context.textAlign = 'center';
        context.fillText('MY TEXT', lineLeftOffset, (scale.bottom - scale.top) / 2 + scale.top);
    },
  
    afterDatasetsDraw: function (chart, easing) {
        if (chart.config.lineAtIndex) {
            chart.config.lineAtIndex.forEach(pointIndex => this.renderVerticalLine(chart, pointIndex));
        }
    }
};
  
Chart.plugins.register(verticalLinePlugin);

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
            annotation: {
                annotations: [{
                    drawTime: "afterDatasetsDraw",
                    id: "cline",
                    type: "line",
                    xScaleID: "x-axis-1",
                    yScaleID: "y-axis-1",
                    xMin: 1,
                    xMax: 1,
                    yMin: 9,
                    yMax: 9,
                    borderColor: "black",
                    borderWidth: 1
                }]
            }
        }
    });
}

/*
    Some functions for HTML tables

    -Rama
*/

function create_html_table(table_data, table_id, table_on_change_callback) {
    let table = document.createElement("table");
    let thead = document.createElement("thead");
    let tr = document.createElement("tr");

    // Bootstrap classes
    table.classList.add("table-striped");
    table.classList.add("table-bordered");
    table.id = table_id;
    table.internal_data = table_data;

    for (var i in table_data.values[0]) {
        if (table_data.values[0].hasOwnProperty(i)) {
            let th = document.createElement("th");
            th.classList.add("px-5");
            th.classList.add("py-1");
            th.style.textAlign = "center";
            th.style.verticalAlign = "center";
            th.innerHTML = table_data.headers[i];
            tr.appendChild(th);
        }
    }

    // Add extra column for row insertion/removal control buttons
    let th = document.createElement("th");
    th.classList.add("px-1");
    th.style.textAlign = "center";
    th.style.verticalAlign = "center";
    th.innerText = "+-";
    tr.appendChild(th);

    thead.appendChild(tr);
    table.appendChild(thead);

    let tbody = document.createElement("tbody");
    for (let i = 0; i < table_data.values.length; ++i) {
        tr = document.createElement("tr");
        for (var j in table_data.values[0]) {
            if (table_data.values[0].hasOwnProperty(j)) {
                let td = document.createElement("td");
                td.style.textAlign = "center";
                td.contentEditable = true;
                td.innerText = table_data.values[i][j];
                td.internal_i = i;
                td.internal_j = j;
                td.addEventListener("input", table_on_change_callback(table, td));
                tr.appendChild(td);
            }
        }

        // Add button for row insertion/removal control
        let td = document.createElement("td");
        td.style.textAlign = "center";
        let pair = create_table_insert_remove_buttons();

        pair.insert.addEventListener("click", table_handle_insert_row(table, tr, table_on_change_callback));
        pair.remove.addEventListener("click", table_handle_remove_row(table, tr, table_on_change_callback));

        td.appendChild(pair.insert);
        td.appendChild(pair.remove);
        tr.appendChild(td);
        tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    return table;
}

function create_table_insert_remove_buttons() {
    let button_insert = document.createElement("button");
    let button_remove = document.createElement("button");
    button_insert.style.width = button_remove.style.width = "30px";
    button_insert.innerText = "+";
    button_remove.innerText = "-";
    button_insert.classList.add("btn");
    button_insert.classList.add("btn-primary");
    button_insert.classList.add("btn-sm");
    //button_insert.classList.add("px-1");
    //button_insert.classList.add("py-1");
    button_insert.classList.add("ml-1");
    button_remove.classList.add("btn");
    button_remove.classList.add("btn-danger");
    button_remove.classList.add("btn-sm");
    //button_remove.classList.add("px-0");
    //button_remove.classList.add("py-1");
    button_remove.classList.add("mx-1");
    //button_remove.classList.add("my-1");

    return { insert: button_insert, remove: button_remove };
}

function table_handle_insert_row(table, tr, table_on_change_callback) {
    return function() {
        let new_tr = table.insertRow(tr.rowIndex+1);
        let empty_content = {};
        for (var i in table.internal_data.values[0]) {
            if (table.internal_data.values[0].hasOwnProperty(i)) {
                empty_content[i] = 0;
                let td = document.createElement("td");
                td.style.textAlign = "center";
                td.contentEditable = true;
                td.innerText = 0;
                td.internal_i = new_tr.rowIndex;
                td.internal_j = i;
                td.addEventListener("input", table_on_change_callback(table, td));
                new_tr.appendChild(td);
            }
        }
        table.internal_data.values.splice(tr.rowIndex, 0, empty_content);

        // Add button for row insertion/removal control
        let td = document.createElement("td");
        td.style.textAlign = "center";
        let pair = create_table_insert_remove_buttons();
        pair.insert.addEventListener("click", table_handle_insert_row(table, new_tr, table_on_change_callback));
        pair.remove.addEventListener("click", table_handle_remove_row(table, new_tr, table_on_change_callback));
        td.appendChild(pair.insert);
        td.appendChild(pair.remove);
        new_tr.appendChild(td);

        console.log("inserting over");
        console.log(table);
    };
}

function table_update_values(table) {
    let X = table.internal_data.values.map(x => x.x);
    let Y = table.internal_data.values.map(y => y.y);
    let YY = linear_regression_apply(X, Y);
    table.internal_data = create_data_table(X, Y, YY);

    let r = ppmcc(X, Y);
    document.getElementById("r").innerText = r;
    document.getElementById("d").innerText = table.internal_data.values.sum(x => x.d).toFixed(4);

    for (let i = 1; i < table.rows.length; ++i) {
        //console.log(i + " and YY is " + YY[i - 1]);
        table.rows[i].cells.item(2).innerText = YY[i - 1].toFixed(4);
        table.rows[i].cells.item(3).innerText = table.internal_data.values[i - 1].d.toFixed(4);
    }

    window.chart_data.datasets[0].data = table.internal_data.values.map(x => ({x: x.x, y: x.y}));
    window.chart_data.datasets[1].data = table.internal_data.values.map((x, i) => ({x: x.x, y: x.yy}));
    window.scatter_chart.update();
}

function table_handle_remove_row(table, tr) {
    return function() {
        table.internal_data.values.splice(tr.rowIndex - 1, 1);
        //console.log("deleting " + tr.rowIndex - 1);
        //console.log(table.internal_data.values);
        table.deleteRow(tr.rowIndex);
        table_update_values(table);
    };
}

function get_data_from_html_table(html_table) {
    let thead = html_table.getElementsByTagName("thead")[0];
    let tbody = html_table.getElementsByTagName("tbody")[0];
    let data_table = [];

    let tr = thead.getElementsByTagName("tr")[0];

    let headers = [];
    for (let i = 0; i < tr.children.length; ++i) {
        headers.push(tr.children[i].innerText);
    }

    for (let i = 0; i < tbody.children.length; ++i) {
        let tr = tbody.children[i];
        data_table[i] = {};
        for (let j = 0; j < tr.children.length; ++j) {
            data_table[i][headers[j]] = tr.children[j].innerText;
        }
    }

    return data_table;
}

/*
    Test functions ahead - just for internal testing and/or benchmarking

    -Rama
*/

// Pearson product moment correlation coefficient
// Uses reduce instead of our custom sum - slightly faster than ppmcc3
function ppmcc2(X, Y) {
    check_cardinality(X, Y);
    let meanx = mean(X);
    let meany = mean(Y);
    let x = X.map(x => x - meanx);
    let y = Y.map(y => y - meany);

    let sum_xy = x.reduce((acc, x, i) => acc + x * y[i], 0);
    let sum_x2 = x.sum(x => x * x);
    let sum_y2 = y.sum(y => y * y);
    return sum_xy / Math.sqrt(sum_x2 * sum_y2);
}

// Loop version of Pearson peroduct moment correlation coefficient
// Uses our custom version of sum - is slowest in benchmarks
function ppmcc3(X, Y) {
    check_cardinality(X, Y);
    let meanx = mean(X);
    let meany = mean(Y);
    let x = X.map(x => x - meanx);
    let y = Y.map(y => y - meany);

    let sum_xy = sum(x, y, (x, y) => x * y);
    let sum_x2 = x.sum(x => x * x);
    let sum_y2 = y.sum(y => y * y);
    return sum_xy / Math.sqrt(sum_x2 * sum_y2);
}

function test_ppmcc_speed(X, Y) {
    let i, times = 100000;
    console.time("ppmcc1");
    for (i = 0; i < times; ++i)
        ppmcc(X, Y);
    console.timeEnd("ppmcc1");

    console.time("ppmcc2");
    for (i = 0; i < times; ++i)
        ppmcc2(X, Y);
    console.timeEnd("ppmcc2");

    console.time("ppmcc3");
    for (i = 0; i < times; ++i)
        ppmcc3(X, Y);
    console.timeEnd("ppmcc3");

    let p1 = ppmcc(X, Y);
    let p2 = ppmcc2(X, Y);
    let p3 = ppmcc3(X, Y);

    console.log("ppmcc1 is " + p1 + "; ppmcc2 is " + p2 + "; ppmcc3 is " + p3);
}