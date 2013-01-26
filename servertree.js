// Include http module,
var vm = require("vm");
var http = require("http"),
// And url module, which is very helpful in parsing request parameters.
   url = require("url"),
  fs = require("fs");
var includeInThisContext = function(path) {
    var code = fs.readFileSync(path);
    vm.runInThisContext(code, path);
}.bind(this);

includeInThisContext("../proctree.js/proctree.js");

var myTree = new window.Tree({
    "seed": Math.floor((Math.random()*200)+1),
    "segments": Math.floor((Math.random()*6)+1),
    "levels": Math.floor((Math.random()*6)+1),
    "vMultiplier": 2.36,
    "twigScale": 0.39,
    "initalBranchLength": 0.49,
    "lengthFalloffFactor": 0.85,
    "lengthFalloffPower": 0.99,
    "clumpMax": 0.454,
    "clumpMin": 0.404,
    "branchFactor": 2.45,
    "dropAmount": -0.1,
    "growAmount": 2.3,
    "sweepAmount": 0.01,
    "maxRadius": 0.139,
    "climbRate": 0.371,
    "trunkKink": 0.093,
    "treeSteps": 5,
    "taperRate": 0.947,
    "radiusFalloffRate": 0.73,
    "twistRate": 3.02,
    "trunkLength": 1.4
});

// Create the server.
http.createServer(function (request, response) {
   // Attach listener on end event.
   request.on('end', function () {
      // Parse the request for arguments and store them in _get variable.
      // This function parses the url from request and returns object representation.
      var _get = url.parse(request.url,true).query;
      // Write headers to the response.
      response.writeHead(200, {
         'Content-Type': 'text/plain'
      });
      // Send data and end response.
// fixing scienfitic notation
/*var r = myTree.verts.length;
for (var i =0 ; i <  r; i++) {
    for (var j=0 ; j < myTree.verts[i].length ; j++) {
        myTree.verts[i][j]=myTree.verts[i][j].toFixed(20);
    }
}
*/
// building three.js face
var fa=''
var r = myTree.faces.length;
for (var i =0 ; i <  r; i++) {
    if (i< r -1) {

    fa=fa+'42,'+myTree.faces[i].join(",")+',0,1,3,2,1,3,2,';

   }
};

fa = fa.substring(0, fa.length - 1);
var fT = fa.split(',');

// building three.js json model (v3.1)
var jsosTree = {
    "version" : 2,
    "materials": [  {
    "DbgColor" : 0,
    "DbgIndex" : 0,
    "DbgName" : "monster",
    "colorAmbient" : [0,0,0],
    "colorDiffuse" : [0,0,0],
    "colorSpecular" : [0,0,0],
    "mapDiffuse" : "monster.jpg",
    "mapDiffuseWrap" : ["repeat", "repeat"],
    "shading" : "Lambert",
    "specularCoef" : 0,
    "transparency" : 0,
    "vertexColors" : false
    }],
   "scale":0.001,
    "vertices":window.Tree.flattenArray(myTree.verts),
    "normals":window.Tree.flattenArray(myTree.normals),
    "uvs":new Array(window.Tree.flattenArray(myTree.UV)),
    "faces":fT
}

// var json = JSON.parse( JSON.stringify(jsosTree, undefined, 2) );
//document.getElementById("res").innerHTML= JSON.stringify(jsosTree, undefined, 2);
      response.end(JSON.stringify(jsosTree, undefined, 2));
   });
}).listen(8081);
