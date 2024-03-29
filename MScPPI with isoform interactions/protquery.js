// Declare global variables that need to be reused
var cy, elements, ids, ignore, iquery, queryNode, flagged;
const categories = ["F", "P", "C"];
var checkEvents = [];
var checkEvents2 = [];
var isoforms = [];

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
  iquery = document.getElementById("query").value.replace(/-1$/, "");
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
    
  var isoformstatus = 0

  for (var i=0; i<isoforms.length; i++) {           // Loop over encountered isoforms and grab one of them to be the new query
      if (isoforms[i].includes(id)) {
          var isoform = isoforms[i].split(":")
          id = isoform[1]
          var intactisoform = isoform[0]
          var isoformnumber = /-(\d+$)/.exec(isoform[1])[1]
          isoformstatus = 1
          isoforms.splice(i, 1)
          break
      }
  }

  ids.push(id);
  
  if (data.interactor.length == 0) {
    throw new Error("No interactors found for query.");
  }

  // Retrieve gene name, protein name, organism
  var name = data.entryName.replace("_HUMAN", "");
  if (isoformstatus == 1) {
      name = data.entryName.replace("_HUMAN", "-" + isoformnumber)
  }
  var fullName = data.recommendedName;
  if (isoformstatus == 1) {
      fullName = "Isoform " + isoformnumber + " of "+ data.recommendedName
  }

  var GO = {"F":[], "P":[], "C":[]};  
  
  var structures = [];
  var phyreModels = [];
  var ignoreGwidd = [];
  var gwidd = {};
  
  
  // Populate structures, phyreModels, and gwidd
  for (let i=0; i<data.experimentalStructures.length; i++) {
      var structure = data.experimentalStructures[i].pdbCode;
      structures.push(structure);
    }
   
  for (let i=0; i<data.phyreModels.length; i++){
      var phyreModel = data.phyreModels[i].model_path;
      phyreModels.push(phyreModel);
  }
  
  for (let i=0; i<data.gwiddComplex.length; i++){
    var complexIds = data.gwiddComplex[i].otherDetails.interactionIds
    var match = /(^.*?)_(.*)/g.exec(complexIds)
    var correctId;
    if (match[1] == match[2] || match[1] != id){
      correctId = match[1];
    }
    else {
      correctId = match[2];
    }

    if (!ignoreGwidd.includes(correctId)) {
      gwidd[correctId] = data.gwiddComplex[i].otherDetails.model_path
      ignoreGwidd.push(correctId)
    }
  }


  // Push node to elements with relevant information
  elements.push({data: {
    id: id, 
    name: name,
    fullName: fullName,
    GO: GO,
    commonGO: {},
    OMIM: [],
    Reactome: [],
    gwidd: gwidd,
    structures: structures,
    phyreModels: phyreModels,
  }});

  // Retrieve interactors
  var interactors = data.interactor;

  function interactionfetcher(isopush){
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
                GO: {"F":[], "P":[], "C":[]},
                OMIM: [],
                Reactome: [],
                structures: [],
                phyreModels: [],
                commonGO: {},
              }});
              elements.push(edge);

            } else {  // If organism is human
              saved.push(edge); // Save edge to interactor (has no node yet)

              // Ignore previously encountered binary interactions
              if(Object.keys(ignore).includes(interactor)) {
                ignore[interactor].push(id);
              } 
              else {
                if (isopush == 1) {
                     isoforms.push(interactors[i].intactId2 + ':' + interactor)         // Tracks isoforms encountered, since they don't have a page
                     offspring.push(interactor.replace(/-\d+$/, ""))                      // Prepare to query canonical page, but will only use intactid of the appropriate isoform if encountered
                }
                else {
                    offspring.push(interactor); // Prepare to query interactor
                }
                ignore[interactor] = [id];
              }
            }
          } else { // If protein has already been queried and node exists
            elements.push(edge); // interactor already has a node so add edge
            ignore[interactor].push(id);
          }
        }
    }
  

  for (var i=0; i<interactors.length; i++) {
    
   
    if (isoformstatus == 0) {       // Check if id being queried is canonical
    
    if (!/-\d+$/.test(intactdatabase[interactors[i].intactId1]) || /-1$/.test(intactdatabase[interactors[i].intactId1])) {         // Iterate over interactions of canonical protein query
        
    if (!interactors[i].accession) {
      if (interactors[i].intactId1 == interactors[i].intactId2) {
        elements.push({data: {source: id, target: id}});
      }
      continue
    }
    
    var interactor = interactors[i].accession
    
    if (!/-\d+$/.test(interactor) || /-1$/.test(interactor)) {          // 
        interactor = interactors[i].accession.replace(/-\d+$/, "");
        interactionfetcher(isopush=0);  
   }
    
    else {
        interactionfetcher(isopush=1);     
    }
  }
 }
 
 else {         // Block activated only when id being queried is isoform
    
     if (interactors[i].intactId1 == intactisoform) {       // Iterate only over isoform-specific interactions
         
         if (!interactors[i].accession) {
              if (interactors[i].intactId1 == interactors[i].intactId2) {
                elements.push({data: {source: id, target: id}});
              }
              continue
        }
         
        var interactor = interactors[i].accession
        
        if (!/-\d+$/.test(interactor) || /-1$/.test(interactor)) {
        
           interactor = interactors[i].accession.replace(/-\d+$/, "");
           interactionfetcher(isopush=0);  
       }
        
        else {
            interactionfetcher(isopush=1);   
        } 
  } 
 }
} 
})
.catch(function(err) {
  // If error is encountered for initial query, submitted ID is likely invalid
  if (id == iquery) {
    console.timeEnd("fetch");
    if (err == "Error: No interactors found for query.") {
      throw new Error("No interactors found for query.")
    }
    else {
      throw new Error("Invalid accession ID.");
    }
  }


  // If a new node being queried is invalid, remove all associated edges
  else {
    flagged.push(id);
    for (let i=elements.length-1; i>=0; i--) {
      if (elements[i].data.target == id) {
        elements.splice(i, 1);
      }
    }
  }
})))
.then(function(){
// End recursion if the next iteration needs to query >= 200 interactors
if (offspring.length < 150) {
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
      width: 40, height: 40,
      "font-size": 18, "font-family": "Helvetica",
      "min-zoomed-font-size": 8,
      "border-color": "orange",
      "border-width": 0,
      }
    },
    {
      selector: "edge",
      style: {"width": 4}
    }
  ],
  minZoom: 0.2,
  maxZoom: 5  
});
console.timeEnd("layout");


// Colour query node 
queryNode = cy.nodes()[0];
queryNode.style({"background-color": "red"});

// Style loop edges for self-interactions
cy.edges(":loop").style("loop-direction", -90);


// Once network is rendered, display settings
document.getElementById("settings").style.display = "block";
document.getElementById("extraOMIM").disabled = true;
document.getElementById("Reactomecheck").disabled = true;
OMIMcheckboxes = document.getElementsByClassName("OMIMcheck")
for (let x=0; x<OMIMcheckboxes.length; x++){
    OMIMcheckboxes[x].disabled = true;
}
Reactomecheckboxes = document.getElementsByClassName("Reactomecheck")
for (let x=0; x<Reactomecheckboxes.length; x++){
    Reactomecheckboxes[x].disabled = true;
}
GOcheckboxes = document.getElementsByClassName("GOcheck")
for (let x=0; x<GOcheckboxes.length; x++){
    GOcheckboxes[x].disabled = true;
}


// Add classes for non-human nodes and nodes without 3D structures
for (let i=1; i<cy.nodes().length; i++) {
    if (cy.nodes()[i].data("organismDiffers") == true) {
    cy.nodes()[i].addClass("nonHuman");
  }
    if (cy.nodes()[i].data("structures").length != 0 || cy.nodes()[i].data("phyreModels").length != 0) {
    cy.nodes()[i].style({"background-color": "green"})
  }
}


// Add Gwidd complex model paths to relevant edges
for (let i=0; i<cy.nodes().length; i++) {
	let node = cy.nodes()[i]
	
	if (node.data("gwidd")) {
		for (let x=0; x<Object.keys(node.data("gwidd")).length; x++) {
			var gwiddid = Object.keys(node.data("gwidd"))[x]
			var complexedges = node.outgoers().edges('[target = "' + gwiddid + '"]')
			complexedges.style({"line-color": "green", "width": 8 })
			complexedges.data("gwiddcomplex", node.data("gwidd")[gwiddid])
		}
	}
}



// Add collection for nodes removed via OptionfilterV2
cy.scratch("removed", cy.collection());

// Define function that fetches extra protein information from phyrerisk
async function fetchAfter(datatype, sitejson) {

var cancel;
console.time(datatype)
document.getElementById("loading" + datatype).innerHTML = "Loading...";
var siteid = datatype
if (datatype == "OMIM") {siteid = "MIM"}

var controller = new AbortController(); // Promise.all runs the fetches for all nodes immediately and simultaneously (fastest method), but cannot be cancelled, so if query has no terms, the sent fetch requests are cancelled
var signal = controller.signal;

await Promise.all(cy.nodes('[^organismDiffers]').map(node =>                                                          // Iterate only over human and non-isoform proteins, for which a phyrerisk page exists
     fetch("http://phyrerisk.bc.ic.ac.uk:9090/rest/dbref/" + node.data("id") +"/" + siteid + ".json", {signal})       // Fetch terms
    .then(response => response.json())
    .then(function (sitejson) { 
    if (sitejson && sitejson.length != 0){
        for (let i=0; i<sitejson.length; i++) {
            
            if (datatype == "OMIM") {
               if (sitejson[i].properties.type == "phenotype"){
               var id = sitejson[i].id
               node.data(datatype).push(id);
                }  
            }
             
            if (datatype == "Reactome"){
                var id = sitejson[i].properties["pathway name"]
                node.data(datatype).push(id)
            }
             
            if (datatype == "GO"){
                var term = sitejson[i].properties.term
                node.data(datatype)[term.charAt(0)].push(term.slice(2));
            }
        }
    }
    
     if (node == queryNode){
         var querytermlength = node.data(datatype).length
         if (datatype == "GO") {
              querytermlength = Object.values(queryNode.data("GO")).length 
         }
         if (querytermlength == 0) {
                 cancel = 1                                                    
                 controller.abort();                                  // Stop fetching from database if query has no terms, causes an error that is caught by catch, promise.all resolves soon after. 
             }
     }                                                                        
   })
))
.catch(function(){})

if (cancel == 1) {
    document.getElementById("loading" + datatype).innerHTML = "No " + datatype + " "+ sitejson + " found for query."
    console.timeEnd(datatype)
    return;                                
}
 
if (datatype == "OMIM" || datatype == "Reactome"){                                          // Basic "IDs-in-a-bag" comparison used in OMIM and Reactome fetches
    for (let i=0; i<cy.nodes().length; i++){
        var querydata = queryNode.data(datatype)
        var targetdata = cy.nodes()[i].data(datatype)
        var intersect = targetdata.filter(value => -1 !== querydata.indexOf(value))
        if (intersect.length == 0){
            cy.nodes()[i].addClass("reject"+ datatype)
            cy.nodes()[i].data("common"+ datatype, ["none"])
        }
        
        else {
            cy.nodes()[i].data("common"+ datatype, intersect)
        }   
    }
}

if (datatype == "GO"){                                                                                              // Alternative GO dictionary-specific "IDs-in-a-bag" comparison used in GO fetching
    for (let i=0; i<3; i++) {       // Loop through categories
        for (let j=0; j<cy.nodes().length; j++) {        // Loop through nodes excluding query
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
}


if (datatype == "OMIM" || datatype == "Reactome"){														// Adding extra OMIM & Reactome buttons
    var div = document.getElementById('extracheckboxes' + datatype)
    var tablehtml = '<table border=1>'
    for (let z=0; z<queryNode.data("common" + datatype).length; z++) {                 // Loop for adding checkboxes to HTML to filter for each query OMIM.Reactome ID 
        var term = queryNode.data("common" + datatype)[z]
		var string = term
		if (datatype == "OMIM") {
			var name = OMIMdatabase[term]									// Fetch query OMIM ID names from portable database to use on the buttons
			if (!OMIMdatabase[term]) {name = ""}
			string = "(OMIM: " + term + ")  " + name 
		}
		
		tablehtml += `
		<tr>
		<td>` + string + `</td>
		<td class="button_cell"><input class="` + datatype + `check" id="` + datatype + `check" type="CHECKBOX" value="1" onchange="Optionfilterchoice(this, '.reject` + datatype + z + `');"/></td>
		</tr>
		`    
		
		for (let i=1; i<cy.nodes().length; i++){                                            
			var targetdata = cy.nodes()[i].data("common" + datatype)                       // Loop within previous loop for adding individual OMIM term reject classes to each node
			if (targetdata.indexOf(term) == -1) {
				cy.nodes()[i].addClass("reject" + datatype + z)			// Replace removes whitespace from string so that the selector is valid
			}
		}
    }
    tablehtml += '</table>'
    div.innerHTML += tablehtml
}

if (datatype == "OMIM") {
	for (let i=0; i<cy.nodes().length; i++) {										// Fetch OMIM ID disease names from loaded portable database
		let node = cy.nodes()[i]
		if (!node.data("commonOMIM").includes("none")) {
			for (let x=0; x<node.data("commonOMIM").length; x++) {
				if (OMIMdatabase[node.data("commonOMIM")[x]]){								// Not all OMIM IDs seem to be included in the 2GB file e.g. 604308
					node.data("commonOMIM")[x] = "(OMIM: " + node.data("commonOMIM")[x] +")  " + OMIMdatabase[node.data("commonOMIM")[x]]
				}
				else {
					node.data("commonOMIM")[x] = "(OMIM: " + node.data("commonOMIM")[x] +")  "	 	// Leave nameless OMIM IDs in but without name
				}
			}
		}
	}
}

if (datatype == "OMIM" || datatype =="Reactome") {
    const button = document.getElementById("extra" + datatype)
    const template = document.getElementById("extracheckboxes" + datatype)
    const container = document.createElement('div' + datatype)
    container.appendChild(document.importNode(template.content, true))

    tippy(button, {
          content: container.innerHTML,
          trigger: "click",
          theme: "light",
          placement: "right-end",
          distance: 10,
          duration: [100, 0],
          allowHTML: true,
          interactive: "true",
          sticky: true,
          arrow: true,
          size: "regular",
          onHide() {document.getElementById("extra" + datatype).innerHTML = "Show"},
          onShow() {document.getElementById("extra" + datatype).innerHTML = "Hide"}
    })
}

document.getElementById("loading" + datatype).innerHTML = "Loading... complete.";
checkboxes = document.getElementsByClassName(datatype + "check")
for (let x=0; x<checkboxes.length; x++){
    checkboxes[x].disabled = false;
}
console.timeEnd(datatype)
}

fetchAfter("OMIM", "IDs")
fetchAfter("Reactome", "IDs")
fetchAfter("GO", "terms")

// Define on-click, on-mouseover etc. events
cy.on("tap", "node", function(){
  if (this.hasClass("forceExpand")) {
    this.removeClass("forceExpand");
    return 0;
  }
  if (!this.hasClass("collapsed")) {
    collapse(this); 
    collapsecontrol(this);
  }
  else {
    expand(this);
    expandcontrol(this)
  }
});

cy.on("taphold", "node", function(){
  expand(this, true);
});


cy.on("mouseover", "node", function(){
  let link = "http://phyrerisk.bc.ic.ac.uk:8080/isoform/"+this.data("id");

  if (this.tip === undefined) {
    this.tip = tippy(this.popperRef(), {
      content: `
        <a class="cross" onClick="closeTip(this);")>&#x274C;</a>
        <a href =${link} target="_blank">${this.data("id")}</a><br>
        ${this.data("fullName")}
        
      `,
      theme: "light",
      placement: "bottom",
      distance: 5,
      duration: [100, 0],
      animateFill: false,
      allowHTML: true,
      interactive: "true",
      sticky: true,
      size: "large",
      maxWidth: "100%"
    });
  }
  this.tip.show();
});


cy.on("cxttap", "node", function(){
  this.tip.hide();
});

cy.on("layoutstop", function(){
  console.time("autocollapse")
  var targets = queryNode.outgoers().edges(":simple").targets();
  for (let i=0; i<targets.length; i++) {
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
  cy.panBy({x:$(window).width()*-0.1});
});

cy.on("resize", function() {
  cy.center(queryNode);
  cy.panBy({x:$(window).width()*-0.1});
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
            if (document.getElementById("loadingGO").innerHTML == "Loading... complete." ) {
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
      id: "Reactomeshared",
      content: "Show reactome pathways shared with query",
      selector: "node",
      onClickFunction: function (event) {
        if (queryNode.data("Reactome").length != 0) {
            var target = event.target || event.cyTarget;
            if (document.getElementById("loadingReactome").innerHTML == "Loading... complete." ) {
                alert("Shared reactome pathways:\n" + target.data("commonReactome").join('\n'))
                }
             else {alert("Reactome IDs still loading...")}
        }
        else {alert("No Reactome IDs found for query")}
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
            if (document.getElementById("loadingOMIM").innerHTML == "Loading... complete." ) {
                alert("Shared OMIM disease involvement:\n" + target.data("commonOMIM").join('\n'));
                }
            else {alert("OMIM IDs still loading...")}    
        }
        else {alert("No OMIM IDs found for query")}
    },
      hasTrailingDivider: true
    },
    {
      id: "gwidd",
      content: "View complex 3D structure for this interaction",
      selector: "edge",
      onClickFunction: function (event) {
        var target = event.target || event.cyTarget;
		if (target.data("gwiddcomplex")) {
			alert(target.data("gwiddcomplex"))
		}
		else {
			alert("No 3D complex structure is available for this interaction")
		}
      },
      hasTrailingDivider: true
    },
    {
      id: "jpg",
      content: "Export network as JPG image",
	  selector: "*",
      coreAsWell: true,
      onClickFunction: function () {
        image = cy.jpg()
        var a = document.createElement('a');
        a.href = image
        a.setAttribute("download",  "network.jpg")
        document.body.appendChild(a);
        a.clicfk();
        document.body.removeChild(a);
      },
      hasTrailingDivider: true
    },
    {
      id: "png",
      content: "Export network as PNG image",
	  selector: "*",
      coreAsWell: true,
      onClickFunction: function () {
        var image = cy.png(scale = 5, maxWidth=1000, maxHeight=1000, full=true);
        var a = document.createElement('a');
        a.href = image;
        a.setAttribute("download",  "network.png");
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      },
      hasTrailingDivider: true
    }
  ]
});
}})}


// Display filtering method based on drop-down menu choice

var dropdownchoice;                         
dropdownchoice = "method1"                  // Default setting
function DisplaySettings(method){
	var allcheckboxes = $("input:checkbox")
	for (let x=0; x<allcheckboxes.length; x++) {
		if (allcheckboxes[x].checked == true) {
			allcheckboxes[x].click()
		}
	}
    dropdownchoice = method
}



// Tell html which filtering function to use based on dropdown choice

function Optionfilterchoice(checkBoxID, optionClass){
    if (dropdownchoice == "method1") {
        Optionfilter(checkBoxID, optionClass)
    }
    else  if (dropdownchoice == "method2") {
        OptionfilterV2(checkBoxID, optionClass)
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
	cy.$(optionClass).connectedEdges('[gwiddcomplex]').style({
      "width": "6",
	  "opacity": 0.5
    });
  }
             
  else {
    checkEvents.splice(checkEvents.indexOf(optionClass), 1);
    cy.nodes().style("opacity", 1);
    cy.edges().style({
      "line-style": "solid", 
      "width": "4"
    });
	cy.edges('[gwiddcomplex]').style({
      "width": "8",
	  "opacity": 1
    });

    if (checkEvents.length != 0){
      for (let i =0; i < checkEvents.length; i++) {
        cy.$(checkEvents[i]).style("opacity", 0.15);
        cy.$(checkEvents[i]).connectedEdges().style({
          "line-style": "dashed", 
          "width": "2"
        });
		cy.$(optionClass).connectedEdges('[gwiddcomplex]').style({
		  "width": "6",
		  "opacity": 0.5
		});
      }
    }
  }
}  


function OptionfilterV2(checkBoxID, optionClass, multiFilter=false) {
  if (checkBoxID.checked || multiFilter){
    if(checkBoxID.checked) {
    checkEvents2.push(optionClass);
    }
    var o = cy.$(optionClass);
    var filtered = o.merge(o.successors()).merge(o.incomers().edges());
    cy.scratch("removed").merge(filtered);
    filtered.remove();
    var collapsees = cy.nodes(".collapsed");
    for (let i=0; i<collapsees.length; i++) {
      if (collapsees[i].outdegree(false) == 0) {
        collapsees[i].style("shape", "ellipse");
        collapsees[i].addClass("uncollapsed");
      }
    }
  }
  else {
    checkEvents2.splice(checkEvents2.indexOf(optionClass), 1);
    var removed = cy.scratch("removed");
    cy.scratch("removed").restore();
    cy.scratch("removed", cy.collection());
    var uncollapsees = cy.nodes(".uncollapsed");
    for (let i=0; i<uncollapsees.length; i++) {
      collapse(uncollapsees[i]);
      uncollapsees[i].removeClass("uncollapsed");
    }
    if (checkEvents2.length != 0) {
      for (let i=0; i<checkEvents2.length; i++) {
        OptionfilterV2({}, checkEvents2[i], true)
      }
    }
  }
}


// Define node collapse and expansion functions

function collapse(node){
  // Only consider non-loop edges and targets
  if (node.outdegree(false) == 0) {return 0;}
  var targets = node.outgoers(":simple").targets(); 

  node.addClass("collapsed");
  node.style("shape", "rectangle")

  for (let i=0; i<targets.length; i++) {
    if (targets[i].outdegree(false) == 0) {
      targets[i].style("display", "none");
    }

    else {
      var incomers = targets[i].incomers(":simple").sources();
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

function expand(node, force=false, click=true){
  // Currently expands target node and all its successors recursively
  if (node.outdegree(false) == 0) {return 0;}
  if (force && click) {node.addClass("forceExpand");}

  var targets = node.outgoers().edges(":simple").targets();

  node.removeClass("collapsed");
  node.style("shape", "ellipse");

  for (let i=0; i<targets.length; i++) {
    targets[i].style("display", "element");

    if (!targets[i].hasClass("collapsed") || force) {
      expand(targets[i], force, false);
    }
  }
}

controlDict = {};

function expandcontrol(node){
  controlDict[node.id()] = [];
  tobeexpanded = cy.collection();
  for (let i=0; i<cy.nodes('.collapsed').length; i++){
    if (cy.nodes('.collapsed')[i].connectedEdges(':simple:hidden').length == 0){
      controlDict[node.id()].push(cy.nodes('.collapsed')[i])
      tobeexpanded = tobeexpanded.union(cy.nodes('.collapsed')[i]);
    }
  }
  expand(tobeexpanded)
}

function collapsecontrol(node){
  if (controlDict[node.id()]){
    for (let i=0; i<controlDict[node.id()].length; i++){
      collapse(controlDict[node.id()][i])
    }
        controlDict[node.id()] = [];
  }
}


function closeTip(tip) {
  let tipInstance = $(tip).closest('.tippy-popper')[0]._tippy;
  tipInstance.hide();
}
