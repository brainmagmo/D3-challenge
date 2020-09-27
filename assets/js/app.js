var svgWidth = window.innerWidth;
var svgHeight = window.innerHeight;

var margin = {
  top: 20,
  right: 200,
  bottom: 80,
  left: 120
};

var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;

// Create an SVG wrapper, append an SVG group that will hold our chart,
// and shift the latter by left and top margins.
var svg = d3
  .select("#scatter")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

var chartGroup = svg.append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Initial Params
var chosenXAxis = "income";
var chosenYAxis = "obesity";
// function used for updating x-scale var upon click on axis label
function xScale(data, chosenXAxis) {
  // create scales
  var xLinearScale = d3.scaleLinear()
    .domain([d3.min(data, d => d[chosenXAxis]) * 0.8,
      d3.max(data, d => d[chosenXAxis]) * 1.2
    ])
    .range([0, width]);

  return xLinearScale;

}

// function used for updating xAxis var upon click on axis label
function renderAxes(newXScale, xAxis) {
  var bottomAxis = d3.axisBottom(newXScale);

  xAxis.transition()
    .duration(1000)
    .call(bottomAxis);

  return xAxis;
}

// function used for updating circles group with a transition to
// new circles
function renderCircles(circlesGroup, newXScale, chosenXAxis) {
    //console.log(circlesGroup);
  circlesGroup//.selectAll("g").selectAll("circles")
    .transition()
    .duration(1000)
    .attr("cx", function(d) {

        return newXScale(d[chosenXAxis]);
    });

  return circlesGroup;
}

function renderTexts(circlesText, newXScale, chosenXAxis) {
    //console.log(circlesGroup);
    circlesText//.selectAll("g").selectAll("circles")
    .transition()
    .duration(1000)
    .attr("dx", function(d) {

        return newXScale(d[chosenXAxis]) -15;
    });

  return circlesText;
}

// function used for updating circles group with new tooltip
function updateToolTip(chosenXAxis, circlesGs) {

  var labelOfX;

  if (chosenXAxis === "income") {
    labelOfX = "Income:";
  }
  else {
    labelOfX = "Age:";
  }

  var labelOfY = "Obesity Rate:";

  if (chosenYAxis === "obesity") {
      labelOfY = "Obesity Rate:";
  }
  else {      
    labelOfY = "Smokers:";
  }

  var toolTip = d3.tip()
    .attr("class", "d3-tip")
    .offset([80, -60])
    .html(function(d) {
      return (`${d.state}<br>${labelOfX} ${d[chosenXAxis]}<br>${labelOfY} ${d[chosenYAxis]}`);
    });

  circlesGs.call(toolTip);

  circlesGs.on("mouseover", function(data) {
    toolTip.show(data);
  })
    // onmouseout event
    .on("mouseout", function(data, index) {
      toolTip.hide(data);
    });

  return circlesGs;
}
 
// Retrieve data from the CSV file and execute everything below
d3.csv("assets/data/data.csv").then(function(data, err) {
  if (err) throw err;

  //console.log(data.columns.join(", "));
  // parse data
  var cols = data.columns;//[id, state, abbr, poverty, povertyMoe, age, ageMoe, income, incomeMoe, healthcare, healthcareLow, healthcareHigh, obesity, obesityLow, obesityHigh, smokes, smokesLow, smokesHigh]
  var numCols = cols.splice(3,cols.length);
  data.forEach(function(data) {
     numCols.forEach(function(key) {
        data[key] = +data[key];
     });
  });

  // xLinearScale function above csv import
  var xLinearScale = xScale(data, chosenXAxis);

  // Create y scale function
  var yLinearScale = d3.scaleLinear()
    .domain([
        Math.round(.9*d3.min(data, d => d[chosenYAxis])),
        Math.round(1.1*d3.max(data, d => d[chosenYAxis]))
    ])
    .range([height, 0]);

  // Create initial axis functions
  var bottomAxis = d3.axisBottom(xLinearScale);
  var leftAxis = d3.axisLeft(yLinearScale);

  // append x axis
  var xAxis = chartGroup.append("g")
    .classed("x-axis", true)
    .attr("transform", `translate(0, ${height})`)
    .call(bottomAxis);

  // append y axis
  chartGroup.append("g")
    .call(leftAxis);

  // append initial circles
    
    var circlesGs = chartGroup.selectAll("g")
        .data(data)
        .enter()
        .append("g");
    var circlesGroup =  circlesGs.append("circle")
        .attr("cx", d => xLinearScale(d[chosenXAxis]))
        .attr("cy", d => yLinearScale(d[chosenYAxis]))
        .attr("r", 20)
        .attr("fill", "blue")
        .attr("opacity", ".7");
    var circlesText = circlesGs.append("text")
        .attr("dx", d => xLinearScale(d[chosenXAxis])-15)
        .attr("dy", d => yLinearScale(d[chosenYAxis])+10)
        .text(function(d){return d.abbr});
    

  // Create group for two x-axis labels
  var labelsGroup = chartGroup.append("g")
    .attr("transform", `translate(${width / 2}, ${height + 20})`);

  var incomeLabel = labelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 20)
    .attr("value", "income") // value to grab for event listener
    .classed("active", true)
    .text("Income Per Capita");

  var ageLabel = labelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 40)
    .attr("value", "age") // value to grab for event listener
    .classed("inactive", true)
    .text("Mean Age");

  // append y axis
  var obesityLabel = chartGroup.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left/2)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .classed("active", true)
    .text("Obesity Rate");
  
  var smokerLabel = chartGroup.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left/2 -20)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .classed("inactive", true)
    .text("Smoking Rate");

  // updateToolTip function above csv import
  var circlesGroup = updateToolTip(chosenXAxis, circlesGroup);

  // x axis labels event listener
  labelsGroup.selectAll("text")
    .on("click", function() {
      // get value of selection
      var value = d3.select(this).attr("value");
      if (value !== chosenXAxis) {

        // replaces chosenXAxis with value
        chosenXAxis = value;

        //console.log(circlesText)

        // functions here found above csv import
        // updates x scale for new data
        xLinearScale = xScale(data, chosenXAxis);

        // updates x axis with transition
        xAxis = renderAxes(xLinearScale, xAxis);

        // updates circles with new x values
        circlesGroup = renderCircles(circlesGroup, xLinearScale, chosenXAxis);

        circlesText = renderTexts(circlesText, xLinearScale, chosenXAxis);

        // updates tooltips with new info
        circlesGroup = updateToolTip(chosenXAxis, circlesGs);

        // changes classes to change bold text
        if (chosenXAxis === "age") {
          ageLabel
            .classed("active", true)
            .classed("inactive", false);
          incomeLabel
            .classed("active", false)
            .classed("inactive", true);
        }
        else {
          ageLabel
            .classed("active", false)
            .classed("inactive", true);
          incomeLabel
            .classed("active", true)
            .classed("inactive", false);
        }
      }
    });
}).catch(function(error) {
  console.log(error);
});

// function extract(data, key) {
//     return data.map((datum)=>datum[key]);
// }
