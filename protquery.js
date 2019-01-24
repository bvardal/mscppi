function BuildNetwork() {
console.time("database query")
var query = document.getElementById("query").value;

fetch("https://www.ebi.ac.uk/proteins/api/proteins/interaction/"+query).then(res => res.json()).then(function(data) {
  var elements = [];
  var ids = [];
  var ignore = {}
  ignore[query] = [];

  var i, j;
  var text = "";

  for (i=0; i<data.length; i++) {
    accession = data[i].accession;
    elements.push({data: {id: accession}});
    ids.push(accession)

    if (!data[i].interactions) {
      continue;
    }

    for (j=0; j<data[i].interactions.length; j++) {
      var interactor = data[i].interactions[j].id;

      if(interactor === undefined) {
        continue
      }

     //interactor = interactor.slice(0, 6);

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

  //var text = JSON.stringify(elements);
  //$(".mypanel").html(text);
  //alert(text)

  var cy = cytoscape({
    container: document.getElementById('cy'),
    elements: elements,
    layout: {name: 'cose'},

    style: [{selector: "node", style: {label: 'data(id)'}}]

  });


  cy.on("cxttap", "node", function(){window.open("https://www.uniprot.org/uniprot/"+this.data("id"));});

  //cy.on('grab', 'node', function(){this.successors().targets().grabbed();});

  cy.on('ready', function(){
    var i;
    for(i=0; i<cy.nodes().length; i++) {
      compress(cy.nodes()[i]);
    }
    var root = cy.nodes().roots();
    root.style("background-color", "red");
    cy.nodes().unselectify()
  });

  cy.on('tap', 'node', function(){compress(this);});

  function compress(node){
    var i;
    var targets = node.connectedEdges().targets();
    var changed = false;

    if (targets.length == 1 || node.data("id")==query) {
      return 0;
      }

    if (node.style("background-color") == "rgb(153,153,153)") {
      var colorChoice = "#666";
      var displayChoice = "none"
    }

    else {
      var colorChoice = "rgb(153,153,153)";
      var displayChoice = "element";
    }

    for(i=1; i<targets.length; i++) {
      if (targets[i].degree() ==1) {
        targets[i].style("display", displayChoice);
        node.style("background-color", colorChoice);
      }
    }
  }


}).catch(function(){alert("Please enter a valid protein accession.")});

console.timeEnd("database query")}