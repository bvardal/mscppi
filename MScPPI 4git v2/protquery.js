var elements, ids, ignore, iquery;
const categories = ["F", "P", "C"];

// On new ID submission, reset elements etc.
function BuildNetwork() {
  elements = [], ids = [];
  ignore = {};
  iquery = document.getElementById("query").value;
  ignore[iquery] = [];
  console.time("fetch");
  fetchAll([iquery]);
}


function fetchAll(query) {
// Offspring and edges need to be reset with each iteration
var offspring = [];
var edges = [];

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

  // Retrieve GO terms
  var GO = {"F":[], "P":[], "C":[]};

  for (var i=0; i<data.dbReferences.length; i++) {
      if (data.dbReferences[i].type == "GO") {
          var term = data.dbReferences[i].properties.term
          GO[term.charAt(0)].push(term.slice(2));
      }
  }

  // Push node to elements with relevant information
  elements.push({data: {
                 id: data.accession, 
                 name: name,
                 fullName: fullName,
                 organism: organism,
                 GO: GO,
                 commonGO: {}
                }});

  ids.push(data.accession);

  for(var i=0; i<data.comments.length; i++) {
    if (data.comments[i].type == "INTERACTION") {
      var interactors = data.comments[i].interactions;

      for (var j=0; j<interactors.length; j++) {
        var interactor = interactors[j].id;
        if(!ignore[data.accession].includes(interactor)
           && interactor !== undefined) {

          // Push edge to data
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

  // If new node is invalid, remove all associated edges
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
  var script = document.createElement("script");
  script.src = ("cydata.js")
  document.head.appendChild(script);
}
});
} 
   