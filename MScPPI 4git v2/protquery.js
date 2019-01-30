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
  
  
  var molfunclist = [];
  var bioproclist = [];
  var cellcomplist = [];
  
  for (x=0; x<data.dbReferences.length; x++) {
      if (data.dbReferences[x].type == "GO") {
          if (data.dbReferences[x].properties.term.startsWith("F")){
              molfunclist.push(data.dbReferences[x].properties.term.slice(2))
          }
          
          else if (data.dbReferences[x].properties.term.startsWith("P")){
              bioproclist.push(data.dbReferences[x].properties.term.slice(2))
          }
          
          else if (data.dbReferences[x].properties.term.startsWith("C")){
              cellcomplist.push(data.dbReferences[x].properties.term.slice(2))
          }
          
      }
  }

  elements.push({data: {id: data.accession, name: name, fullName:fullName, organism:organism, molfunclist:molfunclist, bioproclist:bioproclist, cellcomplist:cellcomplist}});
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
  var script2 = document.createElement("script");
  script2.src = ("cydata.js")
  document.head.appendChild(script2);
}
});
} 
  


   