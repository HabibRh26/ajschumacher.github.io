var perceptron = new ss.perceptron();
// Initialize explicitly, since we know this is a 2d space.
perceptron.weights = [0, 0];
perceptron.bias = 0;

var width = 400;
var height = 400;
var r = 5;

var toXpx = d3.scale.linear()
        .domain([-3, 3])
        .range([-width/2, width/2]);
var xAxis = d3.svg.axis()
        .scale(toXpx)
        .orient("bottom")
        .tickValues([-2, -1, 1, 2])
        .tickFormat(d3.format("d"));

var toYpx = d3.scale.linear()
        .domain([-3, 3])
        .range([height/2, -height/2]);
var yAxis = d3.svg.axis()
        .scale(toYpx)
        .orient("right")
        .tickValues([-2, -1, 1, 2])
        .tickFormat(d3.format("d"));

var svg = d3.select("#space").append("svg")
        .attr("width", width)
        .attr("height", height);

var statusBox = d3.select("#status");

function log(message) {
    statusBox.insert("p", ":first-child")
        .text(message);
}

var origin = svg.append("g")
        .attr("transform", "translate(" + width/2 + ", " + height/2 + ")");

origin.append("g")
    .attr("class", "axis")
    .call(xAxis);

origin.append("g")
    .attr("class", "axis")
    .call(yAxis);

var boundg = origin.append("g");

boundg.append("rect")
    .attr("x", -40 * width)
    .attr("width", 80 * width)
    .attr("y", -40 * height)
    .attr("height", 40 * height)
    .attr("fill", "blue")
    .attr("opacity", 0.2);
boundg.append("rect")
    .attr("x", -40 * width)
    .attr("width", 80 * width)
    .attr("y", 0)
    .attr("height", 40 * height)
    .attr("fill", "red")
    .attr("opacity", 0.2);

function updateColoring() {
    // There is probably a way of making this much shorter and nicer,
    // if somebody wants to think about geometry/trigonometry...
    var a = perceptron.weights[0];
    var b = perceptron.weights[1];
    var c = perceptron.bias;
    function sign(x) {
        if (x < 0) { return('nega'); }
        if (0 === x) { return('zero'); }
        if (0 < x) { return('plus'); }
        return(null); // shouldn't happen
    }
    switch(sign(a) + sign(b) + sign(c)) {
    case "zerozeroplus":
        // always positive
        boundg.attr("transform", "translate(0, " + height/2 + ")");
        break;
    case "zerozerozero":
    case "zerozeronega":
        // always negative
        boundg.attr("transform", "translate(0, " + -height/2 + ")");
        break;
    case "zeroplusplus":
    case "zeropluszero":
    case "zeroplusnega":
        // horizontal boundary; positive above
        var y = -c / b;
        boundg.attr("transform", "translate(0, " + toYpx(y) + ")");
        break;
    case "zeronegaplus":
    case "zeronegazero":
    case "zeroneganega":
        // horizontal boundary; positive below
        var y = -c / b;
        boundg.attr("transform", "translate(0, " + toYpx(y) + "), rotate(180)");
        break;
    case "pluszeroplus":
    case "pluszerozero":
    case "pluszeronega":
        // vertical boundary; positive to right
        var x = -c / a;
        boundg.attr("transform", "translate(" + toXpx(x) + ", 0), rotate(90)");
        break;
    case "negazeroplus":
    case "negazerozero":
    case "negazeronega":
        // vertical boundary; positive to left
        var x = -c / a;
        boundg.attr("transform", "translate(" + toXpx(x) + ", 0), rotate(-90)");
        break;
    case "plusnegaplus":
    case "plusnegazero":
    case "plusneganega":
        // nice diagonal boundary
        var x = -c / a;
        var angle = -180 * Math.atan(a/Math.abs(b)) / Math.PI - 180;
        boundg.attr("transform", "translate(" + toXpx(x) + "), rotate(" + angle + ")");
        break;
    case "negaplusplus":
    case "negapluszero":
    case "negaplusnega":
        // nice diagonal boundary
        var x = -c / a;
        var angle = -180 * Math.atan(Math.abs(a)/b) / Math.PI;
        boundg.attr("transform", "translate(" + toXpx(x) + "), rotate(" + angle + ")");
        break;
    case "neganegaplus":
    case "neganegazero":
    case "neganeganega":
        // nice diagonal boundary
        var x = -c / a;
        var angle = 180 + 180 * Math.atan(a/b) / Math.PI;
        boundg.attr("transform", "translate(" + toXpx(x) + "), rotate(" + angle + ")");
        break;
    case "plusplusplus":
    case "pluspluszero":
    case "plusplusnega":
        // nice diagonal boundary
        var x = -c / a;
        var angle = 180 * Math.atan(a/b) / Math.PI;
        boundg.attr("transform", "translate(" + toXpx(x) + "), rotate(" + angle + ")");
        break;
    }
}

updateColoring();

var canvas = origin.append("rect")
    .attr("x", -width/2)
    .attr("width", width)
    .attr("y", -height/2)
    .attr("height", height)
    .attr("opacity", 0);

function round(x) {
    return(Math.round(100 * x) / 100);
}

var updateCount = 1;

function addPoint() {
    var x = d3.event.offsetX - width/2;
    var y = d3.event.offsetY - height/2;
    var point = origin.append("circle")
            .attr("cx", x)
            .attr("cy", y)
            .attr("r", r)
            .attr("class", "pos");
    point.on("click", function() {
        d3.event.preventDefault();
        if (point.classed("pos")) {
            point.attr("class", "neg");
        } else {
            point.remove();
        }
    });
    point.on("contextmenu", function() {
        // If activated by real click, don't show context menu.
        if (d3.event) {
            d3.event.preventDefault();
        }
        // Determine label from class.
        var label;
        if (point.classed("pos")) {
            label = 1;
        } else {
            label = 0;
        }
        var coords = [toXpx.invert(x), toYpx.invert(y)];
        var prediction = perceptron.predict(coords);
        var weights = perceptron.weights;
        var answer = weights[0] * coords[0] +
                weights[1] * coords[1] + perceptron.bias;
        var output = updateCount + ". The point [" +
                round(coords[0]) + ", " +
                round(coords[1]) + "] " +
                "with weights [" + round(weights[0]) + ", " +
                round(weights[1]) + "] and bias " +
                round(perceptron.bias) + " gives " +
                round(answer) + ". ";
        if (prediction === label) {
            output += "This was a correct classification, " +
                "so no update was necessary.";
        } else {
            perceptron.train(coords, label);
            updateColoring();
            weights = perceptron.weights;
            output += "This was an incorrect classification, " +
                "so the weights and bias were updated to [" +
                round(weights[0]) + ", " +
                round(weights[1]) + "] and " +
                round(perceptron.bias) + ".";
        }
        log(output);
        updateCount += 1;
    });
}

canvas.on("click", function() {
    d3.event.preventDefault();
    addPoint("pos");
});
