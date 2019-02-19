// Declare global variables that need to be reused
var cy, elements, ids, ignore, iquery, queryNode, flagged;
const categories = ["F", "P", "C"];
var checkEvents = [];
var checkEvents2 = [];

function altName(target, alternative) {
  if (!target) {
    return alternative;
  }
  else {
    return target;
  }
}


// On new ID submission, reset elements etc.
function BuildNetwork() {
  elements = [], ids = [], flagged=[];
  ignore = {};
  iquery = document.getElementById("query").value.replace("-1", "");
  ignore[iquery] = [];
  console.time("fetch");
  fetchAll([iquery]);  // Begin to fetch interaction data
}


function fetchAll(query) {
// Offspring and new edges need to be reset with each iteration
var offspring = [];  // New nodes that will be queried in next iteration
var saved = [];  // Elements saved in memory in case they need to be added
Promise.all(query.map(id => fetch("http://phyrerisk.bc.ic.ac.uk:9090/rest/interaction-min/"+id+".json")
.then(res => res.json())
.then(function(data) {
  ids.push(id);

  // Retrieve gene name, protein name, organism
  var name = data.entryName.replace("_HUMAN", "");
  var fullName = data.recommendedName;

  var GO = {"F":[], "P":[], "C":[]};  
  
  var structures = [];
  var phyremodels = [];
  
  // Maybe make the above into dictionaries with each key being the pdb code and the value being a list of the experimentalStructures information
  
  for (var x=0; x<data.experimentalStructures.length; x++) {
      var structure = data.experimentalStructures[x].pdbCode;
      structures.push(structure);
    }
   
  for (var y=0; y<data.phyreModels.length; y++){
      var phyremodel = data.phyreModels[y].model_path;
      phyremodels.push(phyremodel);
  }

  // Push node to elements with relevant information
  elements.push({data: {
    id: id, 
    name: name,
    fullName: fullName,
    GO: GO,
    OMIM: [],
    structures: structures,
    phyremodels: phyremodels,
    commonGO: {},
  }});

  // Retrieve interactors
  var interactors = data.interactor;

  for(var i=0; i<interactors.length; i++) {
    if (!interactors[i].accession) {
      if (interactors[i].intactId2 == data.intactId1) {
        elements.push({data: {source: id, target: id}});
      }
      continue
    }

    var interactor = interactors[i].accession.replace(/-\d$/, "");

    if(!ignore[id].includes(interactor)
       && !flagged.includes(interactor)) {

      // Generate edge
      var edge = {data: {source: id, target: interactor}};

      if (!ids.includes(interactor)) {
        if (interactors[i].organismDiffers) {
          // Non-human protein won't have a database page
          // Therefore node and edge immediately pushed with available info

          elements.push({data: {
            id: interactor,
            name: altName(interactors[i].label, interactor).toLowerCase(),
            fullName: altName(interactors[i].recommededName, "(Non-human)"),
            organismDiffers: true,
            GO: GO,
            OMIM: [],
            structures: [],
            phyremodels: [],
            commonGO: {},
          }});
          elements.push(edge);

        } else {  // If organism is human
          saved.push(edge); // Save edge to interactor (has no node yet)

          // Ignore previously encountered binary interactions
          if(Object.keys(ignore).includes(interactor)) {
            ignore[interactor].push(id);
          } else {
            offspring.push(interactor); // Prepare to query interactor
            ignore[interactor] = [id];
          }
        }
      } else { // If protein has already been queried and node exists
        elements.push(edge); // interactor already has a node so add edge
        ignore[interactor].push(id);
      }
    }
  }
})
.catch(function() {
  // If error is encountered for initial query, submitted ID is likely invalid
  if (id == iquery) {
    console.timeEnd("fetch");
    throw new Error("Invalid accession ID.");
  }

  // If a new node being queried is invalid, remove all associated edges
  else {
    flagged.push(id);
    for (var i=elements.length-1; i>=0; i--) {
      if (elements[i].data.target == id) {
        elements.splice(i, 1);
      }
    }
  }
})))
.then(function(){
// End recursion if the next iteration needs to query >= 200 interactors
if (offspring.length < 200) {
  elements = elements.concat(saved);
  fetchAll(offspring);
}

else {
console.timeEnd("fetch");

// Once recursion has ended, generate and layout network
console.time("layout");
cy = cytoscape({
  container: document.getElementById("cy"),
  elements: elements,
  layout:{
    name:"cose",
    fit: true,
    padding: 25,
    nodeDimensionsIncludeLabels: true,
    nodeRepulsion: 200000
  },
  style: [
    {
      selector: "node",
      style: {
      "background-color": "blue",
      "text-wrap": "wrap",
      label: "data(name)",
      "font-size": "13px",
      "border-color": "orange",
      "border-width": 0
      }
    },
    {
      selector: "edge",
      style: {"width": 4}
    }
  ]      
});
console.timeEnd("layout");


// Colour query node 
queryNode = cy.nodes()[0];
queryNode.style({"background-color": "red"});


// Style loop edges for self-interactions
cy.edges(":loop").style("loop-direction", -90);


// Once network is rendered, display settings
document.getElementById("dropdown").style.display = "block";
document.getElementById("settings").style.display = "block";
document.getElementById("extraOMIM").disabled = true;
document.getElementById("extracheckboxes").style.display = "none";
OMIMcheckboxes = document.getElementsByClassName("OMIMcheck")
for (var x=0; x<OMIMcheckboxes.length; x++){
    OMIMcheckboxes[x].disabled = true;
}
GOcheckboxes = document.getElementsByClassName("GOcheck")
for (var x=0; x<GOcheckboxes.length; x++){
    GOcheckboxes[x].disabled = true;
}


// Add classes for non-human nodes and nodes without 3D structures
for (var i=1; i<cy.nodes().length; i++) {
    if (cy.nodes()[i].data("organismDiffers") == true) {
    cy.nodes()[i].addClass("nonHuman");
  }
    if (cy.nodes()[i].data("structures").length == 0 && cy.nodes()[i].data("phyremodels").length == 0) {
    cy.nodes()[i].addClass("noStruc");
  }
}


// Get OMIM IDs and work out shared IDs between all nodes and query (root) node
console.time("OMIM")
document.getElementById("loadingOMIM").innerHTML = "Loading OMIM IDs..." 
Promise.all(cy.nodes().map(node => fetch("http://phyrerisk.bc.ic.ac.uk:9090/rest/dbref/"+node.data("id").substring(0, 6)+"/MIM.json") // GO API has no page on isoform GO terms, therefore use canonical GOs. Uniprot is the same
.then(response => response.json())
.then(function (OMIMids) { 
    if (OMIMids && OMIMids.length != 0){
    for (var i=0; i<OMIMids.length; i++) {
      
      if (OMIMids[i].properties.type == "phenotype"){
      var id = OMIMids[i].id
      node.data("OMIM").push(id);
      }
     }
    }
    else {
        node.data({
            OMIM: []
        })
    }
})))
.then(function(){
if (queryNode.data("OMIM").length != 0) {
    for (var i=0; i<cy.nodes().length; i++){
        var queryOMIM = queryNode.data("OMIM")
        var targetOMIM = cy.nodes()[i].data("OMIM")
        var intersect = targetOMIM.filter(value => -1 !== queryOMIM.indexOf(value))
        if (intersect.length == 0){
            cy.nodes()[i].addClass("rejectOMIM")
            cy.nodes()[i].data("commonOMIM", "none")
        }
        
        else {
            cy.nodes()[i].data("commonOMIM", intersect)
        
    }
}
var div = document.getElementById('extracheckboxes')
    for (var z=0; z<queryNode.data("commonOMIM").length; z++) {                 // Loop for adding checkboxes to HTML to filter for each query OMIM ID 
        var term = queryNode.data("commonOMIM")[z]
        if (term != "none") {
            div.innerHTML += `
            <tr>
            <td>Query ID: ` + term  + `</td>
            <td><input class="OMIMcheck" id="OMIMcheck" type="CHECKBOX" value="1" onchange="Optionfilterchoice(this, '.reject`+ term + `');"/></td>
            </tr>
            `    
            
            for (var i=1; i<cy.nodes().length; i++){                                            
                var targetOMIM = cy.nodes()[i].data("commonOMIM")                       // Loop within previous loop for adding individual OMIM term reject classes to each node
                if (targetOMIM.indexOf(term) == -1) {
                    cy.nodes()[i].addClass("reject" + term)
                }
            }
        }
    }
   document.getElementById("loadingOMIM").innerHTML = "Loading OMIM IDs... COMPLETE" 
}
else {
   document.getElementById("loadingOMIM").innerHTML = "No OMIM IDs found for query"
}

document.getElementById("extraOMIM").disabled = false;
for (var x=0; x<OMIMcheckboxes.length; x++){
    OMIMcheckboxes[x].disabled = false;
}



console.timeEnd("OMIM")
})


 // OMIM permabans IPs that use bots to mine information from their htmls such as OMIM id values ( https://omim.org/robots.txt ), so need to request API key to access its information
 
 // Follow-up script that scrapes search engine results for the value of each node's shared OMIM id. Used bing because it allows bots to scrape its results, unlike google. Discarded because engines truncate full OMIM entry titles.
 
 /*       .then(function(){
        for (var x=0; x<cy.nodes().length; x++){
            if (cy.nodes()[x].data("commonOMIM").length > 0 && cy.nodes()[x].data("commonOMIM").indexOf("none") == -1) {
                console.log(cy.nodes()[x].data("commonOMIM"))
                for (var i=0; i<cy.nodes()[x].data("commonOMIM").length; i++){
                OMIMid = cy.nodes()[x].data("commonOMIM")[i]
                fetch("https://cors-anywhere.herokuapp.com/https://www.bing.com/search?q=omim+" + OMIMid)
          .then(response => response.text())
          .then(text => {
            const parser = new DOMParser();
            const htmlDocument = parser.parseFromString(text, "text/html");
            const result1 = htmlDocument.documentElement.querySelector("h2 a").innerText;
            cy.nodes()[x].data("commonOMIM")[i] = result1
          })
                   
                }
            }
        }
    })
 */


// Get GO terms and work out shared GO terms between all nodes and query (root) node
console.time("intersection");

document.getElementById("loadingGO").innerHTML = "Loading GO terms..." 
Promise.all(cy.nodes().map(node => fetch("http://phyrerisk.bc.ic.ac.uk:9090/rest/dbref/"+node.data("id").substring(0, 6)+"/GO.json") // GO API has no page on isoform GO terms, therefore use canonical GOs. Uniprot is the same
.then(response => response.json())
.then(function (GOterms) { 
    if (GOterms && GOterms.length != 0){
    for (var i=0; i<GOterms.length; i++) {
      var term = GOterms[i].properties.term
      node.data("GO")[term.charAt(0)].push(term.slice(2));
      }
    }
    else {
        node.data({
            GO: {"F":[], "P":[], "C":[]}
        })
    }
})))
.then(function(){
if (Object.values(queryNode.data("GO")).length != 0) {
    for (var i=0; i<3; i++) {  // Loop through categories
        for (var j=1; j<cy.nodes().length; j++) {  // Loop through nodes excluding query
        var queryGO = queryNode.data("GO")[categories[i]];
        var targetGO = cy.nodes()[j].data("GO")[categories[i]];
        var intersect = targetGO.filter(value => -1 !== queryGO.indexOf(value))
        
        if (intersect.length == 0) {
          cy.nodes()[j].addClass("reject" + categories[i]);
          cy.nodes()[j].data("commonGO")[categories[i]] = "none";
        }

        else {
          cy.nodes()[j].data("commonGO")[categories[i]] = intersect.join(", ");
        }
     }
   }     
document.getElementById("loadingGO").innerHTML = "Loading GO terms... COMPLETE" 
}
else {document.getElementById("loadingGO").innerHTML = "No GO terms found for query"}
console.timeEnd("intersection");
for (var x=0; x<GOcheckboxes.length; x++){
    GOcheckboxes[x].disabled = false;
}

})



// Define on-click, on-mouseover etc. events
cy.on("tap", "node", function(){
  if (!this.hasClass("collapsed")) {collapse(this, query); collapsecontrol(this);}
  else {expand(this, query); expandcontrol(this)}
});

cy.on("mouseover", "node", function(){
  var description = this.data("fullName")+" ("+this.data("id")+")";
  document.getElementById("name").innerHTML = description;
});


cy.on("mouseout", "node", function(){
  document.getElementById("name").innerHTML="";
});

cy.on("layoutstop", function(){
  console.time("autocollapse")
  var targets = queryNode.outgoers().edges(":simple").targets();
  for(var i=0; i<targets.length; i++) {
    collapse(targets[i]);
  }
  tobeexpanded = cy.collection();
    for (z=0; z<cy.nodes('.collapsed').length; z++){
        if (cy.nodes('.collapsed')[z].connectedEdges(':simple:hidden').length == 0){
            tobeexpanded = tobeexpanded.union(cy.nodes('.collapsed')[z]);
        }
    }
  expand(tobeexpanded)
  console.timeEnd("autocollapse")
  cy.center(queryNode);
  cy.panBy({x:-240, y:-35});
});


// Define right-click context menu
var contextMenu = cy.contextMenus({
  menuItems: [
    {
      id: "link",
      content: "Link to PhyreRisk page",
      selector: "node",
      onClickFunction: function (event) {
      var target = event.target || event.cyTarget;
      if (!target.data("organismDiffers")) {
          // Add "-1" to end of link if isoform isn"t specified
          // This is because pages without a specified isoform lack some information
          if (target.data("id").length == 6){
              var id = target.data("id") + "-1";
          }
          else { 
            var id = target.data("id")}
            window.open("http://phyrerisk.bc.ic.ac.uk:8080/isoform/"+id);
       }
       else {alert("This protein is non-human and thus not in the PhyreRisk database.")}
    },
      hasTrailingDivider: true
    },
    {
      id: "GOshared",
      content: "Show Gene Ontology features shared with query",
      selector: "node",
      onClickFunction: function (event) {
        if (Object.values(queryNode.data("GO")).length != 0) {
            var target = event.target || event.cyTarget;
            if (document.getElementById("loadingGO").innerHTML == "" ) {
                alert(["Shared cellular component:\n" + target.data("commonGO").C,
                       "Shared biological process:\n" + target.data("commonGO").P,
                       "Shared molecular function:\n" + target.data("commonGO").F]
                       .join("\n\n"));
                }
             else {alert("GO terms still loading...")}
        }
        else {alert("No GO terms found for query")}
    },
      hasTrailingDivider: true
    },
    {
      id: "Diseaseinvolement",
      content: "Show disease involvement shared with query",
      selector: "node",
      onClickFunction: function (event) {
        if (queryNode.data("OMIM").length != 0) {
            var target = event.target || event.cyTarget;
            if (document.getElementById("loadingOMIM").innerHTML == "" ) {
                alert("Shared OMIM disease involvement:\n" + target.data("commonOMIM"));
                }
            else {alert("OMIM IDs still loading...")}    
        }
        else {alert("No OMIM IDs found for query")}
    },
      hasTrailingDivider: true
    },
    {
      id: "excel",
      content: "Export network as Excel table",
      coreAsWell: true,
      onClickFunction: function () {
        json = cy.json()
        text = JSON.stringify(json)                                     // Need to add steps here to process file into csv format
        var a = document.createElement('a');
        a.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));    
        a.setAttribute("download",  "HELP! I'm trapped inside this json")
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      },
      hasTrailingDivider: true
    },
    {
      id: "jpg",
      content: "Export network as JPG image",
      coreAsWell: true,
      onClickFunction: function () {
        image = cy.jpg()
        var a = document.createElement('a');
        a.href = image
        a.setAttribute("download",  "HELP! I'm trapped inside this jpg")
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      },
      hasTrailingDivider: true
    },
    {
      id: "png",
      content: "Export network as PNG image",
      coreAsWell: true,
      onClickFunction: function () {
        image = cy.png()
        var a = document.createElement('a');
        a.href = image
        a.setAttribute("download",  "HELP! I'm trapped inside this png")
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      },
      hasTrailingDivider: true
    }
  ]
});
}})}


// Display individual OMIM ID filters
function showextraOMIM(){
    var state = document.getElementById("extraOMIM").innerHTML
    var div = document.getElementById('extracheckboxes')
    if (state == "Show"){
        document.getElementById("extracheckboxes").style.display = "table-footer-group";
        document.getElementById("extraOMIM").innerHTML = "Hide"
    }
    else if (state == "Hide") {
        document.getElementById("extracheckboxes").style.display = "none";
        document.getElementById("extraOMIM").innerHTML = "Show"
    }
}


// Display filtering method based on drop-down menu choice

var dropdownchoice;                         
dropdownchoice = "method1"                  // Default setting
function DisplaySettings(method){
    dropdownchoice = method
}



// Tell html which filtering function to use based on dropdown choice

function Optionfilterchoice(checkBoxID, optionclass){
    if (dropdownchoice == "method1") {
        Optionfilter(checkBoxID, optionclass)
    }
    else  if (dropdownchoice == "method2") {
        OptionfilterV2(checkBoxID, optionclass)
    }
}



// Define filtering functions for each method

function Optionfilter(checkBoxID, optionClass) {
  if (checkBoxID.checked){
    checkEvents.push(optionClass)
    cy.$(optionClass).style("opacity", 0.15);
    cy.$(optionClass).connectedEdges().style({
      "line-style": "dashed", 
      "width": "2"
    });
  }
             
  else {
    checkEvents.splice(checkEvents.indexOf(optionClass), 1);
    cy.nodes().style("opacity", 1);
    cy.edges().style({
      "line-style": "solid", 
      "width": "4"
    });

    if (checkEvents.length != 0){
      for (var i =0; i < checkEvents.length; i++) {
        cy.$(checkEvents[i]).style("opacity", 0.15);
        cy.$(checkEvents[i]).connectedEdges().style({
          "line-style": "dashed", 
          "width": "2"
        });
      }
    }
  }
}  
     

function OptionfilterV2(checkBoxID, optionclass) {
 if (checkBoxID.checked){
     
     checkEvents2.push(optionclass)
     cy.$(optionclass).style("opacity", 0);
     cy.$(optionclass).connectedEdges().style("opacity", 0);
     var sparenodes = cy.collection();
     for (y=0; y < cy.nodes(optionclass).successors().nodes().length; y++){
            if (cy.nodes(optionclass).successors().nodes()[y].connectedEdges(':transparent').connectedNodes(queryNode).length == 
                cy.nodes(optionclass).successors().nodes()[y].connectedEdges().connectedNodes(queryNode).length) {
                sparenodes = sparenodes.union(cy.nodes(optionclass).successors().nodes()[y])}}
                sparenodes.style("opacity", 0);
                sparenodes.connectedEdges().style("opacity", 0)}
 else {
    
    checkEvents2.splice(checkEvents2.indexOf(optionclass), 1);
    cy.nodes().style("opacity", 1);
    cy.nodes().connectedEdges().style("opacity", 1);
    if (checkEvents2.length != 0){
        
        for (z=0; z < checkEvents2.length; z++) {
            
            cy.$(checkEvents2[z]).style("opacity", 0);
            cy.$(checkEvents2[z]).connectedEdges().style("opacity", 0);
             var sparenodes = cy.collection();
             for (y=0; y < cy.nodes(checkEvents2[z]).successors().nodes().length; y++){
                if (cy.nodes(checkEvents2[z]).successors().nodes()[y].connectedEdges(':transparent').connectedNodes(queryNode).length == 
                    cy.nodes(checkEvents2[z]).successors().nodes()[y].connectedEdges().connectedNodes(queryNode).length) {
                sparenodes = sparenodes.union(cy.nodes(checkEvents2[z]).successors().nodes(':transparent')[y])}}
                sparenodes.style("opacity", 0);
                sparenodes.connectedEdges().style("opacity", 0)}
    }
}
}

  

// Define node collapse and expansion functions

function collapse(node){
  var targets = node.outgoers().edges(":simple").targets(); // Grabs only non-loop edges and targets
  if (targets.length == 0) {return 0;}

  node.addClass("collapsed");
  node.style("shape", "rectangle")

  for(var i=0; i<targets.length; i++) {
    if (targets[i].degree(false) ==1) {
      targets[i].style("display", "none");
    }

    else {
      var incomers = targets[i].incomers().edges(":simple").sources();
      // Check if every source node is collapsed
      var collapsable = incomers.every(incomer => incomer.hasClass("collapsed"));

      // If all source nodes are collapsed, then collapse target
      if (collapsable) {
        targets[i].style("display", "none");
        collapse(targets[i]);
      }
    }
  }
}

function expand(node){
  // Currently expands target node and all its successors recursively
  var targets = node.outgoers().edges(":simple").targets();
  node.removeClass("collapsed");
  node.style("shape", "ellipse");
  for(var i=0; i<targets.length; i++) {
    targets[i].style("display", "element");
    if (!targets[i].hasClass("collapsed")) {
      expand(targets[i]);
    }
  }
}

controldic = {};

function expandcontrol(node){
  controldic[node.id()] = [];
  tobeexpanded = cy.collection();
  for (i=0; i<cy.nodes('.collapsed').length; i++){
    if (cy.nodes('.collapsed')[i].connectedEdges(':simple:hidden').length == 0){
      controldic[node.id()].push(cy.nodes('.collapsed')[i])
      tobeexpanded = tobeexpanded.union(cy.nodes('.collapsed')[i]);
    }
  }
  expand(tobeexpanded)
}

function collapsecontrol(node){
  if (controldic[node.id()]){
    for (i=0; i<controldic[node.id()].length; i++){
      collapse(controldic[node.id()][i])
    }
        controldic[node.id()] = [];
  }
}
