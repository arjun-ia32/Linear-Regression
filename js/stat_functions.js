"use strict";

Array.prototype.sum = function(op_func) {
    op_func = op_func || ((x) => x);
    return this.reduce((acc, x) => acc + op_func(x), 0);
}

Array.prototype.mean = function(op_func) {    
    return this.sum(op_func) / this.length;
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

// Convert seconds to hh:mm string
function seconds_to_string(secs) {
    let hrs = Math.trunc(secs / 3600);
    let mins = Math.trunc(secs / 60) - hrs * 60;
    if (hrs < 10)
        hrs = `0${hrs}`;
    if (mins < 10)
        mins = `0${mins}`;
    return `${hrs}:${mins}`;
}

function create_interval_data_table(step) {
    if (step % 900 != 0) {
        throw "Step must in 15 minute intervals";
    }

    let intervals = [];
    for (let i = 0; i < 86400; i += step) {
        let blank_row = { interval: seconds_to_string(i), mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 };
        intervals.push(blank_row);
    }

    return intervals;
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
    return covariance_p(X, Y) / (stddev_p(X) * stddev_p(Y));
}

// Correlation coefficient of sample
function correlation_coeff_s(X, Y) {
    return covariance_s(X, Y) / (stddev_s(X) * stddev_s(Y));
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

class LinearRegression {
    constructor(X, Y, transform_y, detransform_y, transform_x) {
        this.orig_x = X;
        this.orig_y = Y;

        this.x = X;
        this.y = Y;
        this.detransform_y = detransform_y;
        if (transform_y) {
            this.y.map(y => transform_y(y));
        }

        if (transform_x) {
            this.x.map(x => transform_x(x));
        }
    }

    calculate_slope() {
        this.mean_x = mean(this.x);
        this.mean_y = mean(this.y);
        this.slope = sum(this.x, this.y, (x, y) => (x - this.mean_x) * (y - this.mean_y)) / this.x.sum(x => (x - this.mean_x) ** 2);    
    }

    calculate_y_intercept() {
        if (!this.slope)
            this.calculate_slope();
        this.y_intercept = mean(this.y) - this.slope * mean(this.x);
    }

    calculate_error() {
        this.r = ppmcc(this.x, this.y);
        this.r2 = this.r * this.r;
        this.e = this.y.map((y, i) => y - this.y_hat[i]);
        this.ee = this.e.map(e => e * e);
    }

    calculate() {
        this.calculate_slope();
        this.calculate_y_intercept();
        this.y_hat = this.apply_regression(this.x);
        this.calculate_error();
    }

    predict_single(new_x) {
        return this.y_intercept + this.slope * new_x;
    }

    apply_regression(list_x) {
        return list_x.map(x => this.y_intercept + this.slope * x);
    }
}

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

function standard_error_slope(X, E) {
    check_cardinality(X, E);
    let mx = mean(X);
    return Math.sqrt(E.sum(e => e ** 2) / (E.length - 2)) / Math.sqrt(X.sum(x => (x - mx) ** 2));
}

function normal_distribution(X) {
    let s = stddev_p(X);
    let mul = Math.sqrt(2 * Math.PI) / s;
    let mx = mean(X);
    let var2 = 2 * (s ** 2);

   return X.map((x) => mul * Math.pow(Math.E, -((x - mx) ** 2) / var2));
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
