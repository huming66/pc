var parcoords = [];
var keyHide = ["name"];
var colors = d3.scale.category10();
var runList = []; //["Slow40%+RR", "Slow40%_Prt"];
var runHide = [];
var valFilter =[];
//   // var csv_file = './csv/dspsm_2018may04.csv';
//   var colors = d3.scale.linear()
//     .domain([2030, 2018])
//     // .range(["steelblue", "brown"])
//     .range(["green", "blue"])
//     .interpolate(d3.interpolateLab);

//   var config_hm 
// //   d3.json("./config.json", function(error, caseData) {
//   d3.json(json, function(error, caseData) {
//     config_hm = caseData.config_hm
//   });    

function refresh_cht(filtered = 0) {
  d3.select("#chart_dspsm").html("")
  doc.body.innerText = reFMLR(doc.body.innerText)
  fmlr = doc.body.innerText.replace(/\n/g, '').split(';');
  d3.csv(csv_file, function (data) {      // to set "" to undifined for showing invalid value
    if (dataCSV.length > 0) {
      data = dataCSV;
    }
    var keysPct = []                      // find the column with "%" sign at end
    d3.keys(data[0]).forEach(k => {
      if (data[0][k][data[0][k].length - 1] == "%") {
        keysPct.push(k)
      }
    })
    var treeData_filter = [  // 2021 treegrid data
      {id: 'string_', type:'group',text:'Column in string',children:[]},
      {id: 'number_', type:'group',text:'Column in number',children:[]}
    ]
    Object.keys(data[0]).forEach((col,i) => {  
      var dType = (parseFloat(data[0][col]) == data[0][col] && (data[0][col] != null)) ? 'num' : 'str'
      if (dType == 'str') {
        var uniqueV = [ ...new Set(data.map(d => d[col]))]
        treeData_filter[0].children.push(
          {
            id: col,
            type: 'column',
            text: col,
            children : uniqueV.map(v=> {return {id: col+ '||' + v, type:'value', text: v}})                                        
          }
        )
      } else {
        if(col=="#") col="_#"
        treeData_filter[1].children.push({id: col, type:'column', text: col})
      }
    })                      // 2021 treegrid data
    valFilter.forEach(f => {
      data = data.filter(d => f[1].includes(d[f[0]]))
    })
    if (runHide.length > 0) {          // excluded data of excluded "run" for dispatch simulation work with "dt3.json"
      data = data.filter(data => !runHide.includes(data.run));
    }
    key0 = d3.keys(data[0]);
    if (key0[0] != '#') {key00 = ["#", ... key0]} else {key00 = key0}
    data.forEach(function (d) {          // for each row of data
      keysPct.forEach(k9 => {            // remove %-sign
        d[k9] = d[k9].replace("%","")
      })                                 // remove %-sign
      d['QC'] = '0';                     // QC
      for (k in d) {
        if (d[k] == '' || d[k] == 'NULL') {
          d[k] = undefined;
          d['QC'] = +d['QC'] + 1;
        }
      }
      fmlr.forEach(function (f) {        // user-formula 
        if (f != "") {
          var f1 = f.split('=');
          // eval("d['" +f1[0] +"'] = " + reFMLR(f1[1]));
          var fT = f1[0];
          if (fT[0] != '#') {
            f1 = f1.slice(1, 10);
            fF = f1.join('=');
            fF = "d['" + fT + "'] = " + fF;
            eval(fF);
          }
        }
      });
      // var i;
      // for (i = 0; i < fmlr.length; i++) { 
      // f1 = fmlr[i].split(':');
      // eval("d['" +f1[0] +"'] = " + reFMLR(f1[1]));
      // }		

    });
    d3.select("#chtBY").html('')  // clear html
    d3.select("#chtBY")           // hmhm: add a dropdown list for chart var1
      .selectAll("option")
      .data(key0)
      .enter().append("option")
      .text(function (d) { return d; })
    // .attr("value", function (d, i) {return i;})
    d3.select("#chtBY2").html('')
    d3.select("#chtBY2")          // hmhm: add a dropdown list for chart  var2
      .selectAll("option")
      .data(key00)
      .enter().append("option")
      .text(function (d) { return d; })
    d3.select("#chtBYColor").html('')
    d3.select("#chtBYColor")          // hmhm: add a dropdown list for chart  var2
      .selectAll("option")
      .data(key00)
      .enter().append("option")
      .text(function (d) { return d; })

    d3.select("#clrBy").html('')  // color_by drop-down
    d3.select("#clrBy")
      .selectAll("option")
      .data(key0)
      .enter().append("option")
      .text(function (d) { return d; })
      .attr("value", function (d, i) { return d; });
// ========= to create a jstree to replace "#_side_1" & "#_side_2" =====
    $('#tree_filter').jstree({
      'core': {
        'data': treeData_filter
      },
      "themes": {
        "theme": "default",
        "dots": true,
        "icons": true
      },
      "types": {
        "default": {
        },
        "column": {
          "icon": "glyphicon glyphicon-th-large"
        },
        "value": {
          "icon": "glyphicon glyphicon-th-list"
        }
      },
      "plugins": ["search", "state", "types", "_sort", "checkbox"],
      "search": {
        "case_insensitive": true,
        "show_only_matches": true
      }
    });

    $('#tree_filter').on('changed.jstree', function (e, data) {
      var keySelect = data.selected.filter(k => data.instance.get_node(k).type == 'column')
      keySelect = keySelect.map(v => v=='_#'? '#' : v)
      var valFilter0 = data.selected.filter(k => data.instance.get_node(k).type == 'value')
      keySelect = [...keySelect, ...valFilter0.map(v => v.split('||')[0])]
      keyHide = key0.filter(k => !keySelect.includes(k))
      var valFilter1 = {}
      valFilter0.forEach(f => {
        [k,v] = f.split('||')
        if (valFilter1[k]) {
          valFilter1[k].push(v)
        } else {
          valFilter1[k] = [v]
        }
      })
      valFilter = Object.keys(valFilter1).map(k => [k, valFilter1[k]])
    })

// ===END=== to create a jstree to replace "#_side_1" & "#_side_2" =====
if (0 == 1) {
  d3.select("#_side_1").html('')  // coordimation key list to include / exclude
  d3.select("#_side_1")
    .selectAll("div")
    .data(key0)
    .enter().append("div")
    .attr("class", function (d) {
      return keyHide.includes(d) ? "dimOff" : "dimOn";
    })
    .on("click", function (d) {
      if (keyHide.includes(d)) {
        keyHide = keyHide.filter(e => e !== d);
        this.setAttribute("class", "dimOn")
      } else {
        keyHide.push(d)
        this.setAttribute("class", "dimOff")
      }
    })
    .on("mouseover", function (d) { updateLabel1(d) }) // itm.setAttribute('onmouseover', "titleDetails(this.__data__)");
    .text(function (d, i) { return d.substr(0, 18) })

  if (json.includes("dt3.json")) {                     // "dt3.json" only for dispatch tolerance rule ***DUE to performance issue*** 
    if (runList === undefined || runList.length == 0) {
      runList = data.map(item => item.run).filter((value, index, self) => self.indexOf(value) === index);  // special column only in dispatch tolerance rule
    }
    d3.select("#_side_2")
      .selectAll("div")                                // add a list for every run to set runHide - used to include or exclude 
      .data(runList)             
      .enter().append("div")
      .attr("class", function (d) {
        return runHide.includes(d) ? "dimOff" : "dimOn";
      })
      .on("click", function (d) {
        if (runHide.includes(d)) {
          runHide = runHide.filter(e => e !== d);
          this.setAttribute("class", "dimOn")
        } else {
          runHide.push(d)
          this.setAttribute("class", "dimOff")
        }
      })
      // .on("mouseover", function(d) {updateLabel1(d)}) // itm.setAttribute('onmouseover', "titleDetails(this.__data__)");
      .text(function (d, i) {
        if (d == undefined) {
          return 'missing ...'
        } else {
          return d.substr(0, 18)
        }
      })
  }
}

    
    // var colorgen = d3.scale.ordinal()
    //   .range(["#a6cee3","#1f78b4","#b2df8a","#33a02c",
    //           "#fb9a99","#e31a1c","#fdbf6f","#ff7f00",
    //           "#cab2d6","#6a3d9a","#ffff99","#b15928"]);
    // //var color = function(d) { return colors(d.year); };
    // var color = function(d) { return colors(d.Scenario_ID); };

    // updColor(0,0);
    // clrBy = "year";
    // d3.select("#clrBy")[0][0].value=clrBy;
    // if (!isNaN(+data[0].year)) {
    //    colors = d3.scale.linear()
    //     .domain(dRG(data,clrBy)) //([2013, 2030])
    //     .range([clrB,clrT])   //.range(["steelblue", "brown"])
    //     .interpolate(d3.interpolateLab);}
    //     else {
    //       // colors = d3.scale.ordinal()  //d3.scale.category10()
    //       // .domain(dRG(data,clrBy)) //([2013, 2030])
    //       // .range([clrB,clrT])   //.range(["steelblue", "brown"])
    //       // .interpolate(d3.interpolateLab);
    //       colors = d3.scale.category10();
    //     }

    // var color = function(d) { return colors(d[clrBy]); };

    // colors = d3.scale.category10();
    var color = function (d) { return colors(d.Scenario_ID); };

    function updateLabel1(dimension) {
      // brushUpdated(selected0()) //for testing HMHM
      d3.select("#labelDetail").text(dimension);
    }

    if (filtered != 0) {              // filtered data only, 20200327
      data = data.filter(d => {
        var in0 = true
        Object.keys(filtered).forEach(k1 => {
          if (parcoords.dimensions()[k1].type == "string") {
            in0 = in0 && filtered[k1].includes(d[k1])
          } else if (parcoords.dimensions()[k1].type == "number") {
            in0 = in0 && (filtered[k1][0] <= d[k1]) && (filtered[k1][1] >= d[k1])
          }
        })
        return in0
      });
    }

    parcoords = d3.parcoords(config_hm)("#chart_dspsm")  //hmhm: pass the config_hm
      .data(data)
      .hideAxis(keyHide)
      .color(color)
      .alpha(0.90)
      .composite("darken")
      .margin({ top: 35, left: 50, bottom: 70, right: 20 })
      .mode("queue")
      .render()
      .brushMode("1D-axes");  // enable brushing 1D-axes 1D-axes-multi 2D-strums

    parcoords.svg.selectAll("text")
      .style("font", "10px sans-serif");
    parcoords.svg.selectAll("text.label")
      .style("font-weight", "bold");
    parcoords.svg.selectAll("text.label")
      .style("font-size", "10px");
  })
};

function filtered_list() {               // find the filtered values range 20200327
  var fList = 0
  if (parcoords.brushed()) {
    fList = {}
    parcoords.brushed().forEach(v => {
      Object.keys(parcoords.brushExtents()).forEach(k => {
        if (parcoords.dimensions()[k].type == "number") {
          if (fList[k] == undefined) {
            fList[k] = [v[k], v[k]]
          } else {
            fList[k][0] = Math.min(fList[k][0], v[k])
            fList[k][1] = Math.max(fList[k][1], v[k])
          }
        } else if (parcoords.dimensions()[k].type == "string") {
          if (fList[k] == undefined) {
            fList[k] = [v[k]]
          } else {
            if (!fList[k].includes(v[k])) {
              fList[k].push(v[k])
            }
          }
        }
      })
    })
  }
  return fList
}

function hide10() {
  var len = document.getElementById("_side_1").children.length
  for (var i = 0; i < len; i++) {
    if (i >= 6) {
      d = document.getElementById("_side_1").children[i].textContent
      if (!keyHide.includes(d)) {
        document.getElementById("_side_1").children[i].setAttribute("class", "dimOff")
        keyHide.push(d)
      }
    }
  }
}
function unhideAll() {
  var len = document.getElementById("_side_1").children.length
  for (var i = 0; i < len; i++) {
    if (i >= 0) {
      if (keyHide.includes(d)) {
        document.getElementById("_side_1").children[i].setAttribute("class", "dimOn")
        keyHide = keyHide.filter(e => e != d);
      }
    }
  }  
}

dRG = function (d,i) { 
	return d3.extent(d, function(f) {return +f[i];});
}

rstColor = function(dim,clr) {

  if (parcoords.dimensions()[dim].type == 'number') {
    colors = d3.scale.linear()
    colors.domain(dRG(parcoords.data(),dim))
    if (clr != undefined) {
      colors.range(clr);
    }
    colors.interpolate(d3.interpolateLab);
  } else {
    // colors = d3.scale.ordinal()  //d3.scale.category10()
    // colors.domain(dRG(parcoords.data(),dim))
    // if (clr != undefined) {
    //   colors.range(clr);
    // }
    colors = d3.scale.category10();
  }

	// colors.domain(dRG(parcoords.data(),dim));
	// if (clr != undefined) {
	// 	colors.range(clr);
  // }
	var color = function(d) { return colors(d[dim]); }
	parcoords.color(color)
	parcoords.render()
}

function updColor(clr,p) {
	// if p == 1 {
	// 	clrT = clr;
	// } else {
	// 	clrB = clr;
	// }
	clrT = d3.select("#colorT").style("background-color");
	clrB = d3.select("#colorB").style("background-color");
	if (p!=0) {
		rstColor(clrBy,[clrB,clrT]);
	}
}

function clrBY(obj) {
	clrBy = obj.value;
	clrT = d3.select("#colorT").style("background-color");
	clrB = d3.select("#colorB").style("background-color");
  rstColor(clrBy,[clrB,clrT]);
  if (parcoords.dimensions()[clrBy].type == 'number') {
    d3.select('#colorT')[0][0].hidden = false;
    d3.select('#colorB')[0][0].hidden = false;
  } else {
    d3.select('#colorT')[0][0].hidden = true;
    d3.select('#colorB')[0][0].hidden = true;
  }

}

function chartBy() {
	var kCht1 = d3.select("#chtBY")[0][0].options[d3.select("#chtBY")[0][0].selectedIndex].text;
	iCht1 = d3.select("#chtType")[0][0].selectedIndex;
	typeCht1 = d3.select("#chtType")[0][0].options[iCht1].text;
	// var dy1 = getCol(parcoords.brushed(), kCht1);
	//tCht1 = getTime(parcoords.brushed());
  var traces = []		
  var kCht2 = d3.select("#chtBY2")[0][0].options[d3.select("#chtBY2")[0][0].selectedIndex].text;
  // if (kCht2 !== "#") {var	dy2 = getCol(parcoords.brushed(), kCht2);}
  var kCht3 = d3.select("#chtBYColor")[0][0].options[d3.select("#chtBYColor")[0][0].selectedIndex].text //$("#chtBYColor")[0].value;
  if (kCht3 !== "#") { var partition = [...new Set(parcoords.brushed().map(v => v[kCht3]))] } else {partition = ['']}
  	
	if (iCht1 == 0) {
		d3.select("#chartSmry").style('display','none')
	} else {
		d3.select("#chartSmry").style('display','block')
	}
	
  if (iCht1 == 1) {var cumBool = false} 
  else if (iCht1 == 2) {var cumBool = true} 
  else if (iCht1 == 3) {var dt0 = getTime(parcoords.brushed())} 
  else if (iCht1 == 4) { // var dy2 = getCol(parcoords.brushed(), kCht2);
	}
	var pl_layout = {
	  autosize: true,
	  margin: {l: 40,r: 30,b: 30,t: 20,pad: 1},
	  paper_bgcolor: '#ffffee',
	  plot_bgcolor: '#ffffdd'
	}
  partition.forEach(pt => {
    if (pt =='') {
      var dy1 = parcoords.brushed().map(v1 => +v1[kCht1])
      var dy2 = parcoords.brushed().map(v1 => +v1[kCht2])
      if (iCht1 == 3) {var dt = dt0}
    } else {
      var dy1 = parcoords.brushed().filter(v => { return v[kCht3] == pt }).map(v1 => +v1[kCht1])
      var dy2 = parcoords.brushed().filter(v => { return v[kCht3] == pt }).map(v1 => +v1[kCht2])
      if (iCht1 == 3) {var dt =  dt0.filter((t,i) => {return parcoords.brushed()[i][kCht3] == pt })}
    }
    if (iCht1 == 1) {
      var trace = {
        name: kCht1+'_'+pt,
        x: dy1,
        type: 'histogram',
        histnorm: 'percent',
        cumulative: { enabled: cumBool },
        xbins: { size: (d3.max(dy1) - d3.min(dy1)) / 200 },
      };
      traces.push(trace)
      if (kCht2 !== "#") {  // 2nd 
        var trace1 = {
          name: kCht2+'_'+pt,
          x: dy2,
          type: 'histogram',
          histnorm: 'percent',
          cumulative: { enabled: cumBool },
          xbins: { size: (d3.max(dy2) - d3.min(dy2)) / 200 },
        };
        traces.push(trace1)
      }
    } else if (iCht1 == 2) {
      var [dx3, dy3] = hisgram0(dy1, 1000, true)
      var trace = {
          name: kCht1+'_'+pt,
          y: dy3,
          x: dx3,
          mode: 'lines',
          line: { width: 1 },
          showlegend: true,
      };
        // var trace = {
        //   name: kCht1+'_'+pt,
        //   x: dy1,
        //   type: 'histogram',
        //   histnorm: 'percent',
        //   cumulative: { enabled: cumBool },
        //   xbins: { size: (d3.max(dy1) - d3.min(dy1)) / 200 },
        // };
        traces.push(trace)
        if (kCht2 !== "#") {  // 2nd 
          var [dx3, dy3] = hisgram0(dy2, 1000, true)
          var trace1 = {
              name: kCht1+'_'+pt,
              y: dy3,
              x: dx3,
              mode: 'lines',
              line: { width: 1 },
              showlegend: true,
          };
          // var trace1 = {
          //   name: kCht2+'_'+pt,
          //   x: dy2,
          //   type: 'histogram',
          //   histnorm: 'percent',
          //   cumulative: { enabled: cumBool },
          //   xbins: { size: (d3.max(dy2) - d3.min(dy2)) / 200 },
          // };
          traces.push(trace1)
        }     
    } else if (iCht1 == 3) {
      var trace = {
        name: kCht1+'_'+pt,
        x: dt,
        y: dy1,
        // marker: {size: 2},
        // mode: 'markers',
        // type: 'scatter', 
        mode: 'lines',
        line: { width: 1 },
      };
      traces.push(trace)
      if (kCht2 !== "#") {
        var trace1 = {
          name: kCht2+'_'+pt,
          x: dt,
          y: dy2,
          // marker: {size: 2},
          // mode: 'markers',
          // type: 'scatter', 
          mode: 'lines',
          line: { width: 1 },
        };
        traces.push(trace1)
      }
    } else if (iCht1 == 4) {
      var trace = {
        name: kCht1 + " / " + kCht2 +'['+pt+']',
        x: dy2,
        y: dy1,
        mode: 'markers',
        type: 'scattergl',
      };
      traces.push(trace)
    }
  })    
	Plotly.newPlot('chartSmry', traces, pl_layout);
}

function getCol(matrix, col) {                    //hm_hm9: add new function 
  var column = [];
  if (parcoords.dimensions()[col]['type'] == 'string') {
    for (var i = 0; i < matrix.length; i++) {
      column.push(matrix[i][col]);
    }
  } else {
    for (var i = 0; i < matrix.length; i++) {
      column.push(+matrix[i][col]);
    }
  }
  return column;
}
function getTime(matrix) {                    //hm_hm9: add new function 
  var column = [];
  // if (matrix[0]['hour'] == undefined) {
  //   if (matrix[0]['hr'] == undefined) {
  //     hr = 'HE';
  //   } else {
  //     hr = 'hr';
  //   }
  // } else {
  //   hr = 'hour';
  // }

  if (matrix[0]['hour'] != undefined) {
    var hr = 'hour';
  } if (matrix[0]['HOUR'] != undefined) {
    hr = 'HOUR';
  } if (matrix[0]['Hour'] != undefined) {
    hr = 'Hour';
  } if (matrix[0]['HH'] != undefined) {
    hr = 'HH';
  } if (matrix[0]['hr'] != undefined) {
    hr = 'hr';
  } if (matrix[0]['HE'] != undefined) {
    hr = 'HE';
  }
  if (matrix[0]['year'] != undefined) {
    var year = 'year';
  } if (matrix[0]['Year'] != undefined) {
    year = 'Year';
  } if (matrix[0]['YEAR'] != undefined) {
    year = 'YEAR';
  } if (matrix[0]['YYYY'] != undefined) {
    year = 'YYYY';
  } if (matrix[0]['YR'] != undefined) {
    year = 'YR';
  }
  if (matrix[0]['month'] != undefined) {
    var month = 'month';
  } if (matrix[0]['Month'] != undefined) {
    month = 'Month';
  } if (matrix[0]['MONTH'] != undefined) {
    month = 'MONTH';
  } if (matrix[0]['MM'] != undefined) {
    month = 'MM';
  }
  if (matrix[0]['day'] != undefined) {
    var day = 'day';
  } if (matrix[0]['Day'] != undefined) {
    day = 'Day';
  } if (matrix[0]['DAY'] != undefined) {
    day = 'DAY';
  } if (matrix[0]['DD'] != undefined) {
    day = 'DD';
  }




  for (var i = 0; i < matrix.length; i++) {
    // var dt = matrix[i]['year'] + '-' + matrix[i]['month'] + '-' + matrix[i]['day'];
    // if (dt.includes(undefined)) {
    //   dt = matrix[i]['YYYY'] + '-' + matrix[i]['MM'] + '-' + matrix[i]['DD'];
    //   hr = 'HH';
    // }
    var dt = matrix[i][year] + '-' + matrix[i][month] + '-' + matrix[i][day];

    if (hr == 'HE') {
      hour = Math.floor(+matrix[i][hr]) - 1;
      if (+matrix[i][hr] % 1 == 0.5) {
        hour = hour + ':30'
      } else {
        hour = hour + ':00'
      }
    } else {
      hour = matrix[i][hr] + ':00';
    }
    dt = dt + ' ' + hour
    column.push(dt);
  }
  return column;
} 
function idx2name(idx) {
	return "d['" + d3.keys(parcoords.dimensions())[idx] + "']";
	//return 'd3.keys(parcoords.dimensions())'+idx;
} 

//function reFMLR(str) {
var reFMLR = function(str) {
	myRe = /\[\d*\]/;
	a = myRe.exec(str);
	if ( a == null) {
		return str;
	} else {
		b = "d['" + eval('d3.keys(parcoords.dimensions())' + a[0]) + "']";
		str = str.replace(a,b);
		return reFMLR(str);     //recursive to replace all [#] with column key
	}
	return "d['" + eval('d3.keys(parcoords.dimensions())' + a[0]) + "']";
} 

var inRGs = function(data,rg) {
	if ( rg[0][0] == undefined ) {
		inRG = (data >= Math.min( ...rg )) & (data <= Math.max( ...rg ))
	} else {
		var i; var inRG = false;
		for (i = 0; i < rg.length; i++) { 
           inRG = inRG | (data >= Math.min( ...rg[i])) & (data <= Math.max( ...rg[i]))
		}		
	}
	return inRG
} 

doc = document.getElementsByName("iframe_note")[0].contentDocument;
doc.body.contentEditable = true;
refresh_cht();

// function pcRefresh() {  
  // d3.select("#chart_dspsm").html("");
  // var parcoords =[];
  // d3.csv(csv_file, function(data) {      // to set "" to undefined for showing invalid value
    // key0 = d3.keys(data[0]);
    // data.forEach( function(d) {
      // for (k in d) {
        // if ( d[k] == '' ) {
          // d[k] = undefined;
        // }
    // }
  // });


  // var color = function(d) { return colors(d.Scenario_ID); };

  // function updateLabel1(dimension) {
    // d3.select("#labelDetail").text(dimension);
  // }

  // parcoords = d3.parcoords(config_hm)("#chart_dspsm")  //hmhm: pass the config_hm
    // .data(data)
    // .hideAxis(keyHide)
    // .color(color)
    // .alpha(0.90)
    // .composite("darken")
    // .margin({ top: 35, left: 50, bottom: 70, right: 20 })
    // .mode("queue")
    // .render()
    // .brushMode("1D-axes");  // enable brushing 1D-axes 1D-axes-multi 2D-strums

  // parcoords.svg.selectAll("text")
    // .style("font", "10px sans-serif");
    // parcoords.svg.selectAll("text.label")
    // .style("font-weight", "bold");
    // parcoords.svg.selectAll("text.label")
    // .style("font-size", "10px");
    // })
// };



if ( detectIE() ) {
     alert("please use Goggle Chrome for better compatibility");
};

function detectIE() {
  var ua = window.navigator.userAgent;

  // Test values; Uncomment to check result …

  // IE 10
  // ua = 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)';
  
  // IE 11
  // ua = 'Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko';
  
  // Edge 12 (Spartan)
  // ua = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36 Edge/12.0';
  
  // Edge 13
  // ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2486.0 Safari/537.36 Edge/13.10586';

  var msie = ua.indexOf('MSIE ');
  if (msie > 0) {
    // IE 10 or older => return version number
    return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
  }

  var trident = ua.indexOf('Trident/');
  if (trident > 0) {
    // IE 11 => return version number
    var rv = ua.indexOf('rv:');
    return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
  }

  var edge = ua.indexOf('Edge/');
  if (edge > 0) {
    // Edge (IE 12+) => return version number
    return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
  }

  // other browser
  return false;
}

function chartBy_old() {
	var kCht1 = d3.select("#chtBY")[0][0].options[d3.select("#chtBY")[0][0].selectedIndex].text;
	iCht1 = d3.select("#chtType")[0][0].selectedIndex;
	typeCht1 = d3.select("#chtType")[0][0].options[iCht1].text;
	var dy1 = getCol(parcoords.brushed(), kCht1);
	//tCht1 = getTime(parcoords.brushed());
  var trace1 = {}		
  var kCht2 = d3.select("#chtBY2")[0][0].options[d3.select("#chtBY2")[0][0].selectedIndex].text;
  if (kCht2 !== "#") {var	dy2 = getCol(parcoords.brushed(), kCht2);}
  var kCht3 = d3.select("#chtBYColor")[0][0].options[d3.select("#chtBYColor")[0][0].selectedIndex].text;
  if (kCht3 !== "#") {
    var	dy3 = getCol(parcoords.brushed(), kCht3)
    var idx = [...new Set(dy3)]
    dy3 = dy3.map(v => idx.indexOf(v))
  } 
  else {var dy3 = 1}

	
	if (iCht1 == 0) {
		d3.select("#chartSmry").style('display','none')
	} else {
		d3.select("#chartSmry").style('display','block')
	}
	
	if (iCht1 == 1) {
		var cumBool = false;
	} else if (iCht1 == 2) {
		var cumBool = true;	
	} else if (iCht1 == 3) {
		var dt = getTime(parcoords.brushed());
	} else if (iCht1 == 4) {
		// var dy2 = getCol(parcoords.brushed(), kCht2);
	}
	
	// switch (iCht1) {
		// case 0:
	// }
	var pl_layout = {
	  autosize: true,
	  margin: {l: 40,r: 30,b: 30,t: 20,pad: 1},
	  paper_bgcolor: '#ffffee',
	  plot_bgcolor: '#ffffdd'
	}
	if (iCht1 == 0) {
		
	} else if (iCht1 <= 2) {
		  var trace = {
      name: kCht1,
      x: dy1,
      color: dy3,
			type: 'histogram', 
			histnorm: 'percent',
			cumulative: {enabled: cumBool},
			xbins: {size:(d3.max(dy1) - d3.min(dy1))/200},
      };
      if (kCht2 !== "#") {		
      var trace1 = {
        name: kCht2,
        x: dy2,
        color: dy3,
        type: 'histogram', 
        histnorm: 'percent',
        cumulative: {enabled: cumBool},
        xbins: {size:(d3.max(dy2) - d3.min(dy2))/200},
        };		
      }      
    } else if (iCht1 == 3) {
      var trace = {
        name: kCht1,
        x: dt,
        y: dy1,
        marker: {color: dy3},
        mode: 'markers',
        type: 'scatter', 
        // mode: 'lines',
        // line: { width: 1 },
        };
      if (kCht2 !== "#") {		
      var trace1 = {
        name: kCht2,
        x: dt,
        y: dy2,
        marker: {color: dy3},
        // mode: 'markers',
        // type: 'scatter', 
        mode: 'lines',
        line: { width: 1 },
        };		
      }
    } else {
		var trace = {
      name: kCht1 + " / "  + kCht2,
			x: dy2,
			y: dy1,
			mode: 'markers',
			type: 'scatter', 
      };
	}
	var traces = [trace, trace1];
	Plotly.newPlot('chartSmry', traces, pl_layout);
}

function hisgram0(y, n, cum=ture) { 
  var len = y.length
  var bins = d3.layout.histogram().bins(n)(y)
  var xy = [[0,bins[0].x]]
  for (var i = 0; i < n; i++) {
      xy.push([
          xy[i][0] + bins[i].length / len ,
          bins[i].x +bins[i].dx
      ])
  }
  return [xy.map(v => v[0]*100), xy.map(v => v[1])]
}

function savePlotlyHTml(cht="chartSmry", saveBtton = true) {
  var cdn = {}
  cdn.jQuery = '<script src="https://code.jquery.com/jquery-3.5.1.min.js" integrity="sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0=" crossorigin="anonymous"></script>' 
  cdn.plotly = ' <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>'
  cdn.FileSaver = ' <script src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.0/FileSaver.min.js"></script>'

  var html = '<html><head> ]cdn[ </head>\
  <body><div id="chart_2" style="height: 90%; width: 100%;" class="plotly-graph-div"></div> \
  <button onclick="saveCSV2()" title="export data to CSV">export data to a csv file</button> \
  <span style = "color:green; font-family: Courier New; font-size:24px"> Created by the Interactive Data Dashboard at: <b>http://prodhpcts01/pc</b> ( use <b>Chrome</b> to open ) </span> \
  <script> Number.prototype.between = function (v1, v2) {return (this >= (typeof (v1) == "string" ? new Date(v1 + "") : v1) && this <= (typeof (v2) == "string" ? new Date(v2 + "") : v2))}; \
  ]data[ </script> <script> ]viz[ </script> <script> ]saveFun[ </script></body> </html>' 
  html = html.replace("]cdn[", cdn.jQuery + cdn.plotly + cdn.FileSaver)
  html = html.replace("]data[", "]ttttrace[; ]llllayout[;")
  html = html.replace("]ttttrace[","traces = JSON.parse('" +JSON.stringify(a2a(document.getElementById(cht).data)) +"')")
  html = html.replace("]llllayout[","layout = JSON.parse('" +JSON.stringify(document.getElementById(cht).layout) +"')")  
  html = html.replace("]viz[", 'window.PLOTLYENV=window.PLOTLYENV || {};window.PLOTLYENV.BASE_URL="https://plot.ly";Plotly.newPlot("chart_2", traces, layout, {"showLink": false, "linkText": "", scrollZoom: true}) ')      
  if (saveBtton) {
      html = html.replace("]saveFun[",saveCSV2.toString())  
  } else {
      html = html.replace("button onclick=", "button disabled onclick=")
  }
  // save var html as a html file
  var blob = new Blob([html], {type: "text/csv;charset=utf-8"});
  saveAs(blob, 'cht_'+ d3.time.format("%Y%m%d%H%M%S")(new Date()) +'.html');	
}
function a2a(data) {
  data.forEach(d => {
      if (d.x) d.x = [...d.x]
      if (d.y) d.y = [...d.y]
      if (d.marker) {
          if (d.marker.size) {
              if (typeof(d.marker.size) =='object') d.marker.size = [ ...d.marker.size]
          }
      }
  })
  return data
}

function saveCSV2(cht="chart_2", fmt = "%Y-%m-%d %H:%M") {
  if (cht=="chart_2" && $('#chtType_2 option:selected').text().includes('table') ) {
      $("#chart_2").jqxTreeGrid('exportData', 'csv','')
  } else {                         // courve
      var data_csv = [];        
      if ($('#chtType_2 option:selected').text() == 'pc') {          // for pc data
          data0 = getBrushedData("chart_2")
          var keys = data0.map((v,i) => {return {i: i, k: v.name}})
          data0[0].v.forEach((v1,i) => {
              var row = {}
              keys.forEach(k => {
                  row[k.k] = data0[k.i].v[i]
              })
              data_csv.push(row)
          })
      } else if ($('#chtType_2 option:selected').text() == 'duration'){    // for duration curve's data
          var data0 = document.getElementById(cht).data
          for (var i = 0; i < data0.length; i++) {
              data0[i].y.forEach((v, i1) => { 
                  if (i == 0) {                                      // init 
                      data_csv[i1]={} 
                  }
                  data_csv[i1][data0[i].name+'_x'] = data0[i].x[i1]; 
                  data_csv[i1][data0[i].name+'_y'] = v; 
              })
          }
      } else {                                                       // for other, with direct data
          var data0 = document.getElementById(cht).data
          data0[0].x.forEach((v, i) => {                             // fo rthe 1st: init & time column, val column 
              data_csv[i] = {}; 
              if ($('#chtType_2 option:selected').text() == 'diversify') {
                  data_csv[i].x = data0[0].x[i];
              } else {
                  data_csv[i].time = d3.time.format(fmt)(new Date(data0[0].x[i])); 
              }
              // data_csv[i].time = (new Date(data0[0].x[i])).toLocaleDateString + ' ' + (new Date(data0[0].x[i])).toLocaleTimeString; 
              data_csv[i][data0[0].name] = data0[0].y[i]; 
          })
          var len0 = data_csv.length
          for (var i = 1; i < data0.length; i++) {                   // for the rest: val column
              data0[i].y.forEach((v, i1) => { if (i1 < len0) data_csv[i1][data0[i].name] = v; })
          }
      }
      var blob = new Blob([d3.csv.format(data_csv)], {type: "text/csv;charset=utf-8"});
      saveAs(blob, 'data_'+ d3.time.format("%Y%m%d%H%M%S")(new Date()) +'.csv');
  }
}