function BuildNetwork() {
var query = document.getElementById("query").value;

fetch("https://www.ebi.ac.uk/proteins/api/proteins/interaction/"+query).then(res => res.json()).then(function(data) {
  console.time("database query")
  var elements = [], ids = [];
  var ignore = {}
  ignore[query] = [];

  var i, j;
  var text = "";

  for (i=0; i<data.length; i++) {
    accession = data[i].accession;
    elements.push({data: {id:accession, name}});
    ids.push(accession)

    if (!data[i].interactions) {
      continue;
    }

    for (j=0; j<data[i].interactions.length; j++) {
      var interactor = data[i].interactions[j].id;

      if(interactor === undefined) {
        continue
      }

      if (!ignore[accession].includes(interactor)) {
        elements.push({data: {id: interactor}});
        elements.push({data: {
                               source: accession, 
                               target: interactor, 
                               experiments: data[i].interactions[j].experiments 
                             }});
      }

      if (!ids.includes(interactor)) {
        ids.push(interactor);
        ignore[interactor] = [accession];
      }
      else {
        ignore[interactor].push(accession);
      }
    }
  }
  console.timeEnd("database query")

  // Add elements to cytoscape container and render
  console.time("rendering");
  var cy = cytoscape({
    container: document.getElementById("cy"),
    elements: elements,
    layout: {name: "cose"},
    style: [{selector: "node", style: {label: "data(id)"}}]
  });
  console.timeEnd("rendering");

  // Define network events for click, right-click, and initial rendering
  cy.on('tap', 'node', function(){
    if (!this.hasClass("collapsed")) {collapse(this, query);}
    else {expand(this, query);}
  });

  cy.on("cxttap", "node", function(){window.open("https://www.uniprot.org/uniprot/"+this.data("id"));});

  cy.on("mouseover", "node", function(){displayInfo(this.data("id"));});
  cy.on("mouseout", "node", function(){document.getElementById("name").innerHTML="";});

  cy.on('ready', function(){
    var i;
    cy.$id(query).style("background-color", "red");

    console.time("autocollapse")
    var targets = cy.$id(query).outgoers().nodes();
    for(i=0; i<targets.length; i++) {
      collapse(targets[i]);
    }
    console.timeEnd("autocollapse")
  });

}).catch(function(){alert("Please enter a valid protein accession.")});

;}

function collapse(node){
  var i, j;
  var targets = node.outgoers().nodes();

  if (targets.length == 0) {return 0;}
  
  if (node.style("background-color") != "rgb(255,0,0)") {
    node.style("background-color", "#666");
  }
  node.addClass("collapsed");
  // place collapsed node on top for ease of access
  node.style("z-index", 10);

  for(i=0; i<targets.length; i++) {
    if (targets[i].degree() ==1) {
      targets[i].style("display", "none");
    }

    else {
      var collapsable = true;
      var incomers = targets[i].incomers().nodes();
      for(j=0; j<incomers.length; j++) {
        if(!incomers[j].hasClass("collapsed")) {
          collapsable = false;
        }
      }

      if (collapsable) {
        targets[i].style("display", "none");
        collapse(targets[i]);
      }
    }
  }
}

function expand(node){
  var i;
  var targets = node.outgoers().nodes();

  if (node.style("background-color") != "rgb(255,0,0)") {
    node.style("background-color", "#888");
  }
  node.removeClass("collapsed");

  for(i=0; i<targets.length; i++) {
    targets[i].style("display", "element");
    if (!targets[i].hasClass("collapsed")) {
      expand(targets[i]);
    }
  }
}

function displayInfo(query) {
  fetch("https://www.ebi.ac.uk/proteins/api/proteins/"+query).then(res => res.json()).then(function(data) {
    document.getElementById("name").innerHTML = data.id;
  });
}