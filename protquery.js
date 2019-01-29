var elements, ids, ignore, iquery;

function BuildNetwork() {
  elements = [], ids = [];
  ignore = {}
  iquery = document.getElementById("query").value;
  ignore[iquery] = [];
  console.time("fetch");
  fetchAll([iquery]);
}

function fetchAll(query) {
var offspring = [];
var edges = [];

Promise.all(query.map(id => fetch("https://www.ebi.ac.uk/proteins/api/proteins/"+id)
.then(res => res.json())
.then(function(data) {

  var name = data.id.replace("_HUMAN", "");
  try {
    var fullName = data.protein.recommendedName.fullName.value;
  }
  catch {
    var fullName = data.protein.submittedName[0].fullName.value;
  }
  var organism = data.organism.names[0].value;
  organism = organism.split(" ").slice(0, 2).join(" ");

  elements.push({data: {id: data.accession, name: name, fullName:fullName, organism:organism}});
  ids.push(data.accession);

  for(var i=0; i<data.comments.length; i++) {
    if (data.comments[i].type == "INTERACTION") {
      var interactors = data.comments[i].interactions;

      for (var j=0; j<interactors.length; j++) {
        var interactor = interactors[j].id;
        if(!ignore[data.accession].includes(interactor)
           && interactor !== undefined) {

          edges.push({data: {
                      source: data.accession, 
                      target: interactor, 
                      // experiments: interactors[j].experiments 
                    }});

          if (!ids.includes(interactor)) {
            offspring.push(interactor);
            ids.push(interactor);
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
  if (id == iquery) {
    alert("Please enter a valid accession ID.");
    return 0;
  }

  else {
    for(var i=elements.length-1; i>=0; i--) {
      if (elements[i].data.target == id) { 
        elements.splice(i, 1);
      }
    }
  }
})
))

.then(function(){

if (offspring.length < 200) {
  elements = elements.concat(edges);
  fetchAll(offspring);
}

else {
  console.timeEnd("fetch");

  console.time("render");
  var cy = cytoscape({
    container: document.getElementById("cy"),
    elements: elements,
    layout:{
             name:'cose',
             fit: true,
             padding: 100,
             nodeDimensionsIncludeLabels: true,
            },
    style: [{selector: "node", style: {label: "data(name)"}}]
  });
  console.timeEnd("render");

  // Define network events for click, right-click, mouseover and initial rendering
  cy.on('tap', 'node', function(){
    if (!this.hasClass("collapsed")) {collapse(this, query);}
    else {expand(this, query);}
  });

  cy.on("cxttap", "node", function(){
    window.open("http://ld-mjeste20.bc.ic.ac.uk:8080/isoform/"+this.data("id"));
  });

  cy.on("mouseover", "node", function(){
    var description = this.data("fullName")+" (<i>"+this.data("organism")+"</i>)";
    document.getElementById("name").innerHTML = description;
  });

  cy.on("mouseout", "node", function(){
    document.getElementById("name").innerHTML="";
  });

  cy.on('layoutstop', function(){
    var i;
    cy.$id(iquery).style("background-color", "red");

    console.time("autocollapse")
    var targets = cy.$id(iquery).outgoers().nodes();
    for(i=0; i<targets.length; i++) {
      collapse(targets[i]);
    }
    console.timeEnd("autocollapse")
  });

}

});}

function collapse(node){
  var targets = node.outgoers().nodes();
  var changed = false;
  if (targets.length == 0) {return 0;}

  if (node.style("background-color") != "rgb(255,0,0)") {
    node.style("background-color", "#666");
  }
  node.addClass("collapsed");
  // place collapsed node on top for ease of access
  node.style("z-index", 10);

  for(var i=0; i<targets.length; i++) {
    if (targets[i].degree() ==1) {
      targets[i].style("display", "none");
      changed = true;
    }

    else {
      var collapsable = true;
      var incomers = targets[i].incomers().nodes();
      for(var j=0; j<incomers.length; j++) {
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
  var targets = node.outgoers().nodes();

  if (node.style("background-color") != "rgb(255,0,0)") {
    node.style("background-color", "#888");
  }
  node.removeClass("collapsed");

  for(var i=0; i<targets.length; i++) {
    targets[i].style("display", "element");
    if (!targets[i].hasClass("collapsed")) {
      expand(targets[i]);
    }
  }
}