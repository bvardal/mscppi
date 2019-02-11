// Declare global variables that need to be reused
var cy, elements, ids, ignore, iquery, queryNode;
const categories = ["F", "P", "C"];
var checkEvents = [];

// On new ID submission, reset elements etc.
function BuildNetwork() {
  elements = [], ids = [], flagged = [];
  ignore = {};
  iquery = document.getElementById("query").value.replace("-1", "");
  ignore[iquery] = [];
  console.time("fetch");
  fetchAll([iquery]);  // Begin to fetch interaction data
}

function fetchAll(query) {
// Offspring and new edges need to be reset with each iteration
var offspring = [];  // New nodes that will be queried in next iteration
var edges = [];  // Edges that are saved in memory in case they need to be added

Promise.all(query.map(id => fetch("http://phyrerisk.bc.ic.ac.uk:9090/rest/interaction-min/"+id+".json")
.then(res => res.json())
.then(function(data) {
  // Push node to elements with relevant information
  var self = false;
  ids.push(id);

  // Retrieve interactors
  var interactors = data.interactor;
  for(var i=0; i<interactors.length; i++) {
    try {
      var interactor = interactors[i].accession.replace(/-1$/, "");
    }
    catch {
      console.log(JSON.stringify(interactors[i]));
      continue;
    }
    if(interactor != null
       && !ignore[id].includes(interactor)
       && !flagged.includes(interactor)
       && !interactors[i].organismDiffers) {


      // Push edge to array for later use
      edges.push({data: {
        source: id, 
        target: interactor, 
      }});

      if (!ids.includes(interactor)) {
        offspring.push(interactor);
        ids.push(interactor);
        // Ignore previously encountered binary interactions
        ignore[interactor] = [id]; 
      }
      else {
        ignore[interactor].push(id);
      }
    } 
  }

  elements.push({data: {
    id: id,
    name: data.entryName.replace("_HUMAN", ""),
    fullName: data.recommendedName,
    self: self
  }});

})
.catch(function() {
  // If error is encountered for initial query, submitted ID is likely invalid
  if (id == iquery) {
    alert("Please enter a valid accession ID.");
    return 0;
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
// End recursion if the next iteration needs to query >= 500 interactors
if (offspring.length < 200) {
  elements = elements.concat(edges);
  fetchAll(offspring);
}

else {
console.timeEnd("fetch");
console.log(elements.length, "total elements");

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
      label: "data(id)",
      "font-size": "13px",
      "border-color": "gold",
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
var queryNode = cy.nodes()[0];
queryNode.style({"background-color": "red"});

// Add coloured border to nodes with known structure
// (Replace later with checkbox to highlight nodes with known structure)
for (var i=0; i<cy.nodes().length; i++) {
  if (cy.nodes()[i].data("structure") != "none") {
    cy.nodes()[i].style("border-width", "5");
  }
}

// Once network is rendered, display settings
document.getElementById("settings").style.display = "block";


// Define on-click, on-mouseover etc. events
cy.on("tap", "node", function(){
  if (!this.hasClass("collapsed")) {collapse(this, query);}
  else {expand(this, query);}
});

cy.on("mouseover", "node", function(){
  var description = this.data("fullName");
  document.getElementById("name").innerHTML = description;
});


cy.on("mouseout", "node", function(){
  document.getElementById("name").innerHTML="";
});

cy.on("layoutstop", function(){
  console.time("autocollapse")
  var targets = queryNode.outgoers().nodes();
  for(var i=0; i<targets.length; i++) {
    // collapse(targets[i]);
  }
  console.timeEnd("autocollapse")
  cy.center(queryNode);
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

      // Add "-1" to end of link if isoform isn"t specified
      // This is because pages without a specified isoform lack some information
      if (target.data("id").length == 6){
          var id = target.data("id") + "-1";
      }
      else { 
        var id = target.data("id")}
        window.open("http://phyrerisk.bc.ic.ac.uk:8080/isoform/"+id);
      },
      hasTrailingDivider: true
    },
    {
      id: "GOshared",
      content: "Show Gene Ontology features shared with query",
      selector: "node",
      onClickFunction: function (event) {
        var target = event.target || event.cyTarget;
        alert(["Shared cellular component:\n" + target.data("commonGO").C,
               "Shared biological process:\n" + target.data("commonGO").P,
               "Shared molecular function:\n" + target.data("commonGO").F]
               .join("\n\n"));
        },
      hasTrailingDivider: true
    },
    // The next two buttons are currently unused
    {
      id: "Diseaseinvolement",
      content: "Show disease involvement shared with query",
      selector: "node",
      onClickFunction: function (event) {
        var target = event.target || event.cyTarget;
      },
      hasTrailingDivider: true
    },
    {
      id: "Structure",
      content: "Show protein 3D structure",
      selector: "node",
      onClickFunction: function (event) {
        var target = event.target || event.cyTarget;
      },
      hasTrailingDivider: true
    }
  ]
});}});}

function Optionfilter(checkBoxID, optionClass) {
  if (checkBoxID.checked){
    checkEvents.push(optionClass)
    cy.$(optionClass).style("opacity", 0.1);
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
        cy.$(checkEvents[i]).style("opacity", 0.1);
        cy.$(checkEvents[i]).connectedEdges().style({
          "line-style": "dashed", 
          "width": "2"
        });
      }
    }
  }
}

// Define node collapse and expansion functions

function collapse(node){
  var targets = node.outgoers().nodes();
  if (targets.length == 0) {
    return 0;
  }

  node.addClass("collapsed");
  node.style("shape", "rectangle")

  for(var i=0; i<targets.length; i++) {
    if (targets[i].degree() ==1) {
      targets[i].style("display", "none");
    }

    else {
      var incomers = targets[i].incomers().nodes();
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
  var targets = node.outgoers().nodes();
  node.removeClass("collapsed");
  node.style("shape", "ellipse");
  for(var i=0; i<targets.length; i++) {
    targets[i].style("display", "element");
    if (!targets[i].hasClass("collapsed")) {
      expand(targets[i]);
    }
  }
}