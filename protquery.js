// Declare global variables that need to be reused
var cy, elements, ids, ignore, iquery;
const categories = ["F", "P", "C"];
var checkEvents = [];

// On new ID submission, reset elements etc.
function BuildNetwork() {
  elements = [], ids = [];
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

Promise.all(query.map(id => fetch("https://www.ebi.ac.uk/proteins/api/proteins/"+id)
.then(res => res.json())
.then(function(data) {
  // Retrieve gene name, protein name, organism
  var name = data.id.replace("_HUMAN", "");
  try {
    var fullName = data.protein.recommendedName.fullName.value;
  }
  catch {
    var fullName = data.protein.submittedName[0].fullName.value;
  }

  var organism = data.organism.names[0].value;
  organism = organism.split(" ").slice(0, 2).join(" ");

  // Retrieve GO terms and method of structure determination (if given)
  var GO = {"F":[], "P":[], "C":[]};

  for (var i=0; i<data.dbReferences.length; i++) {
      if (data.dbReferences[i].type == "GO") {
          var term = data.dbReferences[i].properties.term
          GO[term.charAt(0)].push(term.slice(2));
      }
    else if (data.dbReferences[i].type == "PDB") {
      var structure = data.dbReferences[i].properties.method;
    }
  }

  if (structure === undefined) {
    structure = "none";
  }

  // Push node to elements with relevant information
  elements.push({data: {
    id: data.accession, 
    name: name,
    fullName: fullName,
    organism: organism,
    GO: GO,
    structure: structure,
    commonGO: {}
  }});

  ids.push(data.accession);

  // Retrieve interactors
  for(var i=0; i<data.comments.length; i++) {
    if (data.comments[i].type == "INTERACTION") {
      var interactors = data.comments[i].interactions;

      for (var j=0; j<interactors.length; j++) {
        var interactor = interactors[j].id;
        if(!ignore[data.accession].includes(interactor)
           && interactor !== undefined) {

          // Push edge to array for later use
          edges.push({data: {
            source: data.accession, 
            target: interactor, 
            // experiments: interactors[j].experiments 
          }});

          if (!ids.includes(interactor)) {
            offspring.push(interactor);   
            ids.push(interactor);
            // Ignore previously encountered binary interactions
            ignore[interactor] = [data.accession]; 
          }
          else {
            ignore[interactor].push(data.accession);
          }
        }
      }
    } 
  }
})
.catch(function() {
  // If error is encountered for initial query, submitted ID is likely invalid
  if (id == iquery) {
    alert("Please enter a valid accession ID.");
    return 0;
  }

  // If a new node being queried is invalid, remove all associated edges
  else {
    for(var i=elements.length-1; i>=0; i--) {
      if (elements[i].data.target == id) { 
        elements.splice(i, 1);
      }
    }
  }
})))
.then(function(){
// End recursion if the next iteration needs to query >= 500 interactors
if (offspring.length < 500) {
  elements = elements.concat(edges);
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

// Work out shared GO terms between all nodes and query (root) node
console.time("intersection");
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
console.timeEnd("intersection");

// Define on-click, on-mouseover etc. events
cy.on("tap", "node", function(){
  if (!this.hasClass("collapsed")) {collapse(this, query);}
  else {expand(this, query);}
});

cy.on("mouseover", "node", function(){
  var description = this.data("fullName")+" (<i>"+this.data("organism")+"</i>)";
  document.getElementById("name").innerHTML = description;
});


cy.on("mouseout", "node", function(){
  document.getElementById("name").innerHTML="";
});

cy.on("layoutstop", function(){
  console.time("autocollapse")
  var targets = queryNode.outgoers().nodes();
  for(var i=0; i<targets.length; i++) {
    collapse(targets[i]);
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

function collapse(node, label){
  var targets = node.outgoers().nodes();
  if (targets.length == 0) {return 0;}

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