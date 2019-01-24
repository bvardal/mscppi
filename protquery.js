function BuildNetwork() {
console.time("database query")
var query = document.getElementById("query").value;

fetch("https://www.ebi.ac.uk/proteins/api/proteins/interaction/"+query).then(res => res.json()).then(function(data) {
  var elements = [], ids = [];
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

  console.time("rendering");

  var cy = cytoscape({
    container: document.getElementById("cy"),
    elements: elements,
    layout: {name: "cose"},

    style: [
            {selector: "node", style: {label: "data(id)"}},
           ]

  });

  console.timeEnd("rendering");

  cy.on("cxttap", "node", function(){window.open("https://www.uniprot.org/uniprot/"+this.data("id"));});

  console.time("autocollapse")
  cy.on('ready', function(){
    var i;
    cy.$id(query).style("background-color", "red");
    //cy.nodes().unselectify()

    for(i=1; i<cy.nodes().length; i++) {
      collapse(cy.nodes()[i]);
    }
  });
  console.timeEnd("autocollapse")

  cy.on('tap', 'node', function(){collapse(this);});

  function collapse(node){
    var i, j;
    var targets = node.connectedEdges().targets().nodes();
    var changed = false;

    //node.edgesWith(cy.$id(query)).style("display", "none");

    if (targets.length == 1 || node.data("id") == query) {
      return 0;
      }

    if (!node.hasClass("collapsed")) {
      var colorChoice = "#666";
      var displayChoice = "none"
      node.addClass("collapsed");
    }

    else {
      var colorChoice = "#999";
      var displayChoice = "element";
      node.removeClass("collapsed");
    }

    for(i=1; i<targets.length; i++) {
      if (targets[i].degree() ==1) {
        targets[i].style("display", displayChoice);
        changed = true;
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
          changed = true;
        }
        else {
          targets[i].style("display", "element");
        }
      }
    }

    node.style("background-color", colorChoice);

  }


}).catch(function(){alert("Please enter a valid protein accession.")});

console.timeEnd("database query");}