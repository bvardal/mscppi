// Define node collapse and expansion functions

function collapse(node){
  var targets = node.outgoers().nodes();
  if (targets.length == 0) {return 0;}

  node.addClass("collapsed");
  node.style("shape", "rectangle")

  for(var i=0; i<targets.length; i++) {
    if (targets[i].degree() ==1) {
      targets[i].style("display", "none");
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
  node.removeClass("collapsed");
  node.style("shape", "ellipse");
  for(var i=0; i<targets.length; i++) {
    targets[i].style("display", "element");
    if (!targets[i].hasClass("collapsed")) {
      expand(targets[i]);
    }
  }
}

var cy = cytoscape({
  container: document.getElementById('cy'),
  elements: elements,
  layout:{
    name:'cose',
    fit: true,
    padding: 25,
    nodeDimensionsIncludeLabels: true,
    nodeRepulsion: 300000
  },
  style: [
    {
      selector: 'node',
      style: {
      'background-color': 'blue',
      'text-wrap': 'wrap',
      label: 'data(name)',
      'font-size': '13px',
      }
    },
    {
      selector: 'edge',
      style: {'width': 4}
    }
  ]      
});

var queryNode = cy.nodes()[0];
queryNode.style({'background-color': 'red'});

document.getElementById('settings').style.display = 'block';

// Work out shared GO terms between all nodes and query (root) node
console.time("intersection");
for (var i=0; i<3; i++) {
  for (var j=1; j<cy.nodes().length; j++) {
    var queryGO = queryNode.data("GO")[categories[i]];
    var targetGO = cy.nodes()[j].data("GO")[categories[i]];
    
    var intersect = targetGO.filter(value => -1 !== queryGO.indexOf(value))
    
    if (intersect.length == 0) {
      cy.nodes()[j].addClass("reject" + categories[i]);
      cy.nodes()[j].data("commonGO")[categories[i]] = "none";
    }

    else {
      cy.nodes()[j].data("commonGO")[categories[i]] = intersect.toString();
    }
  }
}
console.timeEnd("intersection");
      
var checkeventsV2 = [];

function OptionfilterV2(checkboxid, optionClass) {
  if (checkboxid.checked){
    checkeventsV2.push(optionClass)
    cy.$(optionClass).style({'opacity': '0.1'});
    cy.$(optionClass).connectedEdges().style({
      'line-style': 'dashed', 
      'width': '2'
    });
  }
             
  else {
    checkeventsV2.splice(checkeventsV2.indexOf(optionClass), 1);
    cy.nodes().style({'opacity': '1'});
    cy.edges().style({'line-style': 'solid', 'width': '4'});

    if (checkeventsV2.length != 0){
      for (var i =0; i < checkeventsV2.length; i++) {
        cy.$(checkeventsV2[i]).style({'opacity': '0.1'});
        cy.$(checkeventsV2[i]).connectedEdges().style({
          'line-style': 'dashed', 
          'width': '2'
        });
      }
    }
  }
}


var checkevents = [];   
      
function Optionfilter(checkboxid, optionclass) {
 if (checkboxid.checked){
     
     checkevents.push(optionclass)
     cy.$(optionclass).style({'text-opacity': '0', visibility: 'hidden'});
     cy.$(optionclass).connectedEdges().style({visibility: 'hidden'});
     var sparenodes = cy.collection();
     for (y=0; y < cy.nodes(optionclass).successors().nodes(':visible').length; y++){
            if (cy.nodes(optionclass).successors().nodes(':visible')[y].connectedEdges(':visible').connectedNodes(queryNode).length == 0) {
                sparenodes = sparenodes.union(cy.nodes(optionclass).successors().nodes(':visible')[y])}}
                sparenodes.style({'text-opacity': '0', visibility: 'hidden'});
                sparenodes.connectedEdges().style({visibility: 'hidden'})}
 else {
    
    checkevents.splice(checkevents.indexOf(optionclass), 1);
    cy.nodes().style({'text-opacity': '1', visibility: 'visible'});
    cy.nodes().connectedEdges().style({visibility:'visible'});
    if (checkevents.length != 0){
        
        for (z=0; z < checkevents.length; z++) {
            
            cy.$(checkevents[z]).style({'text-opacity': '0', visibility: 'hidden'});
            cy.$(checkevents[z]).connectedEdges().style({visibility: 'hidden'});
             var sparenodes = cy.collection();
             for (y=0; y < cy.nodes(checkevents[z]).successors().nodes(':visible').length; y++){
                if (cy.nodes(checkevents[z]).successors().nodes(':visible')[y].connectedEdges(':visible').connectedNodes(queryNode).length == 0) {
                sparenodes = sparenodes.union(cy.nodes(checkevents[z]).successors().nodes(':visible')[y])}}
                sparenodes.style({'text-opacity': '0', visibility: 'hidden'});
                sparenodes.connectedEdges().style({visibility: 'hidden'})}
    }
}
}




cy.on('tap', 'node', function(){
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

cy.on('layoutstop', function(){
  console.time("autocollapse")
  var targets = queryNode.outgoers().nodes();
  for(var i=0; i<targets.length; i++) {
    collapse(targets[i]);
  }
  console.timeEnd("autocollapse")
  cy.center(queryNode);
});

var contextMenu = cy.contextMenus({
  menuItems: [
    {
      id: 'link',
      content: 'Link to PhyreRisk page',
      selector: 'node',
      onClickFunction: function (event) {
      var target = event.target || event.cyTarget;
      if (target.data("id").length == 6){
          var id = target.data("id") + '-1'}
      else{ 
          var id = target.data("id")}
      window.open("http://phyrerisk.bc.ic.ac.uk:8080/isoform/"+id);
      },
      hasTrailingDivider: true
    },
    {
      id: 'GOshared',
      content: 'Show Gene Ontology features shared with query',
      selector: 'node',
      onClickFunction: function (event) {
        var target = event.target || event.cyTarget;
        alert('Shared cellular component:  ' + target.data("commonGO").C + '\n\n' + 
        'Shared biological process:  ' + target.data("commonGO").P + '\n\n' + 'Shared molecular function:  ' + target.data("commonGO").F)
        },
    hasTrailingDivider: true
    },
    {
      id: 'Diseaseinvolement',
      content: 'Show disease involvement shared with query',
      selector: 'node',
      onClickFunction: function (event) {
        var target = event.target || event.cyTarget;
      },
      hasTrailingDivider: true
    },
    {
      id: 'Structure',
      content: 'Show protein 3D structure',
      selector: 'node',
      onClickFunction: function (event) {
        var target = event.target || event.cyTarget;
      },
      hasTrailingDivider: true
   }
        
    
]});