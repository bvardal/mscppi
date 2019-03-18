// Declare global variables that need to be reused
var cy, elements, ids, ignore, iquery, queryNode, flagged, saved;
var unqueried, extrafetch, extrafetcher, nodecounter, postprocessing;
var prevOffspring, offspring;
const categories = ["F", "P", "C"];
var checkEvents = [];
var checkEvents2 = [];
const fetch_link = "http://phyreriskdev.bc.ic.ac.uk:9090/rest"

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


function fetchAll(query, extrafetch) {
// Offspring and new edges need to be reset with each iteration
offspring = [];  // New nodes that will be queried in next iteration
saved = [];  // Elements saved in memory in case they need to be added
Promise.all(query.map(id => fetch(`${fetch_link}/interaction-min/${id}.json`)
.then(res => res.json())
.then(function(data) {
  ids.push(id);

  if (data.interactor.length == 0) {
    throw new Error("No interactors found for query.");
  }

  // Retrieve gene name, protein name, organism
  var name = data.entryName.replace("_HUMAN", "");
  var fullName = data.recommendedName;
  var structures = [], phyreModels = [], ignoreGwidd = [], targets = [];
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
  
 var newnode = false;
  if (extrafetch == true && nodecounter != 0) {
      newnode = true; 
  }
  
  // Push node to elements with relevant information
  elements.push({data: {
    id: id, 
    name: name,
    fullName: fullName,
    GO: {"F":[], "P":[], "C":[]},
    commonGO: {},
    OMIM: [],
    Reactome: [],
    gwidd: gwidd,
    structures: structures,
    phyreModels: phyreModels,
    targets: targets,
    newnode: newnode
  }});

  // Retrieve interactors
  var interactors = data.interactor;

  for (let i=0; i<interactors.length; i++) {
   if (!extrafetch || nodecounter != 0) {
    if (interactors[i].intactId1 == interactors[i].intactId2) {
      elements.push({data: {source: id, target: id}});
      continue
    }
   }

    var interactor = interactors[i].accession.replace(/-\d+$/, "");
    
    if (extrafetch == true && nodecounter != 0) {continue}
    
    if(!ignore[id].includes(interactor)
       && !flagged.includes(interactor)) {

      // Generate edge
      var edge = {data: {source: id, target: interactor}};

      if (!ids.includes(interactor)) {
        if (interactors[i].organismDiffers) {
          // Non-human protein won't have a database page
          // Therefore node and edge immediately pushed with available info

          saved.push({data: {
            id: interactor,
            name: altName(interactors[i].label, interactor).toLowerCase(),
            fullName: altName(interactors[i].recommededName, "(Non-human)"),
            organismDiffers: true,
            OMIM: [], Reactome: [], structures: [], phyreModels: [],
            GO: {"F":[], "P":[], "C":[]},
            commonGO: {}
          }});
          saved.push(edge);

        } else {  // If organism is human
          saved.push(edge); // Save edge to interactor (has no node yet)

          // Ignore previously encountered binary interactions
          if(Object.keys(ignore).includes(interactor)) {
            ignore[interactor].push(id);
          } else {
            offspring.push(interactor); // Prepare to query interactor
            ignore[interactor] = [id];
          }
        }
      } else { // If protein has already been queried and node exists
        elements.push(edge); // interactor already has a node so add edge
        ignore[interactor].push(id);
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
    
if (extrafetch == true) {
    extrafetcher();
}

else {
// End recursion if the next iteration needs to query >= 200 interactors
  if (ids.length + offspring.length < 200 && offspring.length) {
    elements = elements.concat(saved);
    prevOffspring = offspring;
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
      "border-style": "double"
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


function disablecheckboxes() {
    
// Style loop edges for self-interactions
cy.edges(":loop").style("loop-direction", -90);

// Once network is rendered, display settings
document.getElementById("settings").style.display = "block";
$("input:checkbox").prop('disabled', true);
$(".showhide").prop('disabled', true)
}
disablecheckboxes();


postprocessing = function() {
    
// Add classes for non-human nodes and nodes without 3D structures
for (let i=1; i<cy.nodes().length; i++) {
    if (cy.nodes()[i].data("organismDiffers") == true) {
    cy.nodes()[i].addClass("nonHuman");
  }
    if (cy.nodes()[i].data("structures").length != 0 || cy.nodes()[i].data("phyreModels").length != 0) {
    cy.nodes()[i].style({"background-color": "green"})
  }
}
document.getElementById("organismcheck").disabled = false;


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
}
postprocessing();

// Add collection for nodes removed via OptionfilterV2
cy.scratch("removed", cy.collection());


// Define function that fetches extra protein information from phyrerisk
async function fetchAfter(datatype, sitejson, extranodes) {
    
console.time(datatype)
document.getElementById("loading" + datatype).innerHTML = "Loading...";

var cancel;

var nodeselector = ""
if (extranodes == true) {nodeselector = "[?newnode]"}

var siteid = datatype
if (datatype == "OMIM") {siteid = "MIM"}

var controller = new AbortController(); // Promise.all runs the fetches for all nodes immediately and simultaneously (fastest method), but cannot be cancelled, so if query has no terms, the sent fetch requests are cancelled
var signal = controller.signal;

await Promise.all(cy.nodes('[^organismDiffers][^isoform]' + nodeselector).map(node =>                                                          // Iterate only over human and non-isoform proteins, for which a phyrerisk page exists
     fetch(`${fetch_link}/dbref/${node.id()}/${siteid}.json`, {signal})       // Fetch terms
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
         var querytermlength = node.data(datatype).length  // Get query OMIM/Reactome id list length
         if (datatype == "GO") {  // Calculate query GO dictionary length
             var allGOterms;
             for (let i=0; i<Object.values(node.data(datatype)).length; i++) {
                 allGOterms += Object.values(node.data(datatype))[i].length
             }
              querytermlength = allGOterms
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
 
var categoryloop = 1
var categoryindex = ""
if (datatype == "GO") {
    categoryloop = 3        // Force post-fetch functions to loop over all 3 lists of the GO dictionary
}



for (let h=0; h<categoryloop; h++) {       // Loop through GO categories or just once if not fetching GO                                        
    for (let i=0; i<cy.nodes().length; i++){
        var querydata = queryNode.data(datatype)
        var targetdata = cy.nodes()[i].data(datatype)
        if (datatype == "GO") {
            categoryindex = categories[h]  // Define GO category iterable to be used in intersection analysis, class names and selectors
            querydata = queryNode.data(datatype)[categoryindex]
            targetdata = cy.nodes()[i].data(datatype)[categoryindex]
        }
        var intersect = targetdata.filter(value => -1 !== querydata.indexOf(value))  // Basic "IDs-in-a-bag" comparison between query and all other nodes
        if (intersect.length == 0){
            cy.nodes()[i].addClass("reject"+ datatype + categoryindex)
            cy.nodes()[i].data("common"+ datatype + categoryindex, ["none"])
        }
        
        else {
            cy.nodes()[i].data("common"+ datatype + categoryindex, intersect)
        }   
    }
}

for (let h=0; h<categoryloop; h++) {
    if (datatype == "GO") {categoryindex = categories[h]}
    var div = document.getElementById('extracheckboxes' + datatype + categoryindex)	 // Adding extra individual term checkbox filters
    var tablehtml = '<table border=1>'
    for (let z=0; z<queryNode.data("common" + datatype + categoryindex).length; z++) {                 // Loop for adding checkboxes to HTML to filter for each query term 
        var term = queryNode.data("common" + datatype + categoryindex)[z]
		var string = term
		if (datatype == "OMIM") {
			var name = OMIMdatabase[term]									// Fetch query OMIM ID names from portable database to use on the buttons
			if (!OMIMdatabase[term]) {name = ""}
			string = "(OMIM: " + term + ")  " + name 
		}
		
		tablehtml += `
		<tr>
		<td>` + string + `</td>
		<td class="button_cell"><input class="` + datatype + `check" id="` + datatype + `check" type="CHECKBOX" value="1" onchange="Optionfilterchoice(this, '.reject` + datatype + categoryindex + z + `');"/></td>
		</tr>
		`    
		
		for (let i=1; i<cy.nodes().length; i++){                                            
			var targetdata = cy.nodes()[i].data("common" + datatype + categoryindex)                       // Loop within previous loop for adding individual query term reject classes to each node
			if (targetdata.indexOf(term) == -1) {
				cy.nodes()[i].addClass("reject" + datatype + categoryindex + z)			
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
					node.data("commonOMIM")[x] = "(OMIM: " + node.data("commonOMIM")[x] +")  "  // Leave nameless OMIM IDs in but without name
				}
			}
		}
	}
}

for (let h=0; h<categoryloop; h++) {  // Make tippy popups for tables with extra individual query term checkboxes
    if (datatype == "GO") {categoryindex = categories[h]}
    const button = document.getElementById("extra" + datatype + categoryindex)
    const template = document.getElementById("extracheckboxes" + datatype + categoryindex)
    const container = document.createElement('div')
    container.id = "morecheck" + datatype + categoryindex
    container.style.cssText = "overflow: auto; max-height:50vw;"
    container.appendChild(document.importNode(template.content, true))
    tippy(button, {
          content: container,
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
          onHide() {var categoryindex = "";     // Redeclare and store looped GO category locally in function that will be called later, otherwise will only use the final for-loop index value
          if (datatype == "GO") {categoryindex = categories[h]}
          document.getElementById("extra" + datatype + categoryindex).innerHTML = "Show"},  
          
          onShow() {var categoryindex = "";
          if (datatype == "GO") {categoryindex = categories[h];} 
          document.getElementById("extra" + datatype + categoryindex).innerHTML = "Hide"}
    })
}

document.getElementById("loading" + datatype).innerHTML = "Loading... complete.";
$("." + datatype + "check").prop('disabled', false)
console.timeEnd(datatype)
}



fetchAfter("OMIM", "IDs", false)
fetchAfter("Reactome", "IDs", false)
fetchAfter("GO", "terms", false)



// Define on-click, on-mouseover etc. events
cy.on("tap", "node", function(){
  if (this.hasClass("tempExpand") || this.hasClass("forceExpand")) {
    this.removeClass("tempExpand");
    this.removeClass("forceExpand");
    this.removeClass("collapsed");
  }
  else {
    if (!this.hasClass("collapsed")) {
      collapse(this);
    }
    else {
      expand(this);
    }
  }
});

cy.on("taphold", "node", function(){
  expand(this, true);
});


cy.on("mouseover", "node", function(){
  if(this.hasClass("collapsed")) {
    expand(this);
    this.addClass("tempExpand");
  }

  let link = "http://phyrerisk.bc.ic.ac.uk:8080/isoform/"+this.id();

  if (this.tip === undefined) {
    this.tip = tippy(this.popperRef(), {
      content: `
        <a class="pin" width="20" height="20" onclick="togglePin(this);">&#x1f4cc</a>
        <a href =${link} target="_blank">${this.id()}</a><br>
        ${this.data("fullName")}
      `,
      theme: "light",
      placement: "bottom",
      distance: 2,
      duration: [100, 0],
      allowHTML: true,
      interactive: true,
      hideOnClick: "toggle",
      sticky: true,
      arrow: true,
      maxWidth: "100%"
    });
  }
  this.tip.show();
});


cy.on("mouseout", "node", function(){
  if (this.hasClass("tempExpand")) {
    collapse(this);
  }

  if (!this.tip.pinned) {
    this.tip.hide(200);
  }
});

cy.on("cxttap", "node", function(){
  this.tip.hide();
});

cy.on("layoutstop", function(){
  console.time("autocollapse")
  var targets = queryNode.outgoers(":simple").targets();
  for (let i=0; i<targets.length; i++) {
    collapse(targets[i]);
  }
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
            window.open("http://phyrerisk.bc.ic.ac.uk:8080/isoform/"+target.id());
       }
       else {alert("This protein is non-human and thus not in the PhyreRisk database.")}
    },
      hasTrailingDivider: true
    },
    {
      id: "Expand",
      content: "Expand network around node",
      selector: "node",
      onClickFunction: function (event) {
      var target = event.target || event.cyTarget;
      var queryid = target.id()
      target.style({'background-image': "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Maya_3.svg/480px-Maya_3.svg.png", 'background-fit': 'contain' })
      cy.removeListener('layoutstop')
      var ignorekeys = Object.keys(ignore).slice();
      for (let i=0; i<ignorekeys.length; i++) {
          if (!ids.includes(ignorekeys[i])) {
              delete ignore[ignorekeys[i]];
          }
      }
      elements = [];
      nodecounter = 0;
      extrafetcher = function(){
          nodecounter += 1
           if (nodecounter < 2) { 
              elements = elements.concat(saved);
              fetchAll(offspring, true);
            }
            
            else {
                cy.nodes().lock()
                cy.add(elements)
                var layout = cy.layout({
                    name: 'cose',
                    fit: false,
                    padding: 25,
                    nodeDimensionsIncludeLabels: true,
                    nodeRepulsion: 200000
                })
                layout.run()
                cy.nodes().unlock()
                cy.$("#" + queryid).style({'background-image': null})
                elements = [];
                nodecounter = 0;
                disablecheckboxes();
                postprocessing();
                fetchAfter("OMIM", "IDs", true)
                fetchAfter("Reactome", "IDs", true)
                fetchAfter("GO", "terms", true)
                // !!! reset newnode status at some point !!!
                }
      }
      fetchAll([target.id()], true)
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
                target.tipOMIM =  tippy(target.popperRef(), {
                  content: '<div style="overflow: auto; max-height:50vw;">' + 
                                ["<b><font size='3em'>Shared cellular component:</font></b>" +"<br>" + target.data("commonGOC").join("<br>"), // Use <br> because tippy content can't parse \n characters as newline
                                 "<b><font size='3em'>Shared biological process:</font></b>" +"<br>" + target.data("commonGOP").join("<br>"),
                                 "<b><font size='3em'>Shared molecular function:</font></b>" + "<br>" + target.data("commonGOF").join("<br>")]
                                 .join("<br><br>")
                                 + '</div>',
                  theme: "light",
                  placement: "right",
                  distance: 2,
                  duration: [100, 0],
                  allowHTML: true,
                  interactive: true,
                  hideOnClick: true,
                  sticky: true,
                  arrow: true,
                  maxWidth: "100%"
                });
                target.tipOMIM.show()
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
                target.tipOMIM =  tippy(target.popperRef(), {
                  content: '<div style="overflow: auto; max-height:50vw;">' +
                  "<b><font size='3em'>Shared reactome pathways:</font></b>" + '<br>' + target.data("commonReactome").join('<br>')
                  + '</div>',
                  theme: "light",
                  placement: "right",
                  distance: 2,
                  duration: [100, 0],
                  allowHTML: true,
                  interactive: true,
                  hideOnClick: true,
                  sticky: true,
                  arrow: true,
                  maxWidth: "100%"
                });
                target.tipOMIM.show()
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
                target.tipOMIM =  tippy(target.popperRef(), {
                  content: '<div style="overflow: auto; max-height:50vw;">' +
                  "<b><font size='3em'>Shared OMIM disease involvement:</font></b>" + "<br>" + target.data("commonOMIM").join('<br>')
                  + '</div>',
                  theme: "light",
                  placement: "right",
                  distance: 2,
                  duration: [100, 0],
                  allowHTML: true,
                  interactive: true,
                  hideOnClick: true,
                  sticky: true,
                  arrow: true,
                  maxWidth: "100%"
                });
                target.tipOMIM.show()
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
    }
  ]
});
}}})}


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

function Optionfilter(checkBoxID, optionClass, multiFilter=false) {
  if (checkBoxID.checked || multiFilter){
      if (checkBoxID.checked) {
          checkEvents.push(optionClass)
      }
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
        Optionfilter({}, checkEvents[i], true)
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
        collapsees[i].style("border-width", 0);
        collapsees[i].addClass("uncollapsed");
        collapsees[i].removeClass("collapsed");
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
      uncollapsees[i].addClass("collapsed");
    }
    if (checkEvents2.length != 0) {
      for (let i=0; i<checkEvents2.length; i++) {
        OptionfilterV2({}, checkEvents2[i], true)
      }
    }
  }
}


// Define node collapse and expansion functions
controlDict = {};

function collapse(node){
  // Only consider non-loop edges and targets
  if (node.outdegree(false) == 0) {return 0;}
  var targets = node.outgoers(":simple").targets(); 

  node.addClass("collapsed");
  node.style("border-width", 10);

  for (let i=0; i<targets.length; i++) {
    if (targets[i].degree(false) == 1) {
      targets[i].style("display", "none");
      toggleNodeTip(targets[i], false);
    }

    else {
      var incomers = targets[i].incomers(":simple").sources();
      // Check if every source node is collapsed
      var collapsable = incomers.every(incomer => incomer.hasClass("collapsed"));

      // If all source nodes are collapsed, then collapse target
      if (collapsable) {
        targets[i].style("display", "none");
        toggleNodeTip(targets[i], false);
        collapse(targets[i]);
      }
    }
  }

  if (controlDict[node.id()]){
    for (let i=0; i<controlDict[node.id()].length; i++){
      collapse(controlDict[node.id()][i])
    }
    controlDict[node.id()] = [];
  }
}

function expand(node, force=false, click=true){
  // Currently expands target node and all its successors recursively
  if (node.outdegree(false) == 0) {return 0;}
  if (force && click) {node.addClass("forceExpand");}

  var targets = node.outgoers(":simple").targets();

  node.removeClass("collapsed");
  node.style("border-width", 0);

  for (let i=0; i<targets.length; i++) {
    targets[i].style("display", "element");
    toggleNodeTip(targets[i], true);

    if (!targets[i].hasClass("collapsed") || force) {
      expand(targets[i], force, false);
    }
  }

  controlDict[node.id()] = [];
  toExpand = cy.collection();
  collapsedSources = targets.incomers(":simple").sources(".collapsed");

  for (let i=0; i<collapsedSources.length; i++){
    if (collapsedSources[i].outgoers().edges(':simple:hidden').length == 0){
      controlDict[node.id()].push(collapsedSources[i])
      toExpand.merge((collapsedSources[i]));
    }
  }
  toExpand.removeClass("collapsed");
  toExpand.style("border-width", 0);
}

function togglePin(tip) {
  let tipInstance = $(tip).closest('.tippy-popper')[0]._tippy;
  tipInstance.pinned = !tipInstance.pinned;
  if (!tipInstance.pinned) {
    tipInstance.hide(200);
  }
}

function toggleNodeTip(node, show) {
  if (node.tip) {
    if (show && node.tip.pinned) {
      node.tip.show(0)
    }
    else {
      node.tip.hide(0)
    }
  }
}

function networkPNG(simple) {
        if (simple) {
            var styles = []
            for (let i=0; i<cy.elements().length; i++){
                var style = cy.elements()[i].style()
                styles.push(style)
            }
            cy.nodes(".collapsed").style("border-width", 0);        
            cy.nodes().difference(queryNode).style({"background-color": "blue", "opacity": 1}); // Image can't show nodes with less than 1 opacity for some reason
            cy.edges().style({
                "width": "4",
                "line-color": "grey",
                "opacity": 1
            })
        }
        var image = cy.png(scale = 5, maxWidth=1000, maxHeight=1000, full=true);
        var a = document.createElement('a');
        a.href = image;
        a.setAttribute("download",  "network.png");
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        if (simple) {
            for (let i=0; i<cy.elements().length; i++) {
                cy.elements()[i].style(styles[i])
            }
        }
      }
