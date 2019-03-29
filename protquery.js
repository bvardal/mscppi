// Declare global variables that need to be reused
var iquery, ids, nonHumans, proteins, collection, initLength;
var flagged = [];
const categories = ["F", "P", "C"];
var classmaker, settings;
var checkEvents = [];
var checkEvents2 = [];
const fetch_link = "http://phyreriskdev.bc.ic.ac.uk:9090/rest"


async function fetchAll(query, saved=[], source=null) {
// Offspring and new edges need to be reset with each iteration

collection = collection.concat(saved);
saved = [];
var offspring = [];  // New nodes that will be queried in next iteration

await Promise.all(query.map(id => fetch(`${fetch_link}/interaction-min/${id}.json`)
.then(res => res.json())
.then(function(data) {
  ids.push(id);
  proteins[id] = [];
  let nonHumanTargets = [];

  if (data.interactor.length == 0) {
    throw new Error("No interactors found for query.");
  }

  // Retrieve gene name, protein name, organism
  var name = data.entryName.replace("_HUMAN", "");
  var fullName = data.recommendedName;
  var structures = [], phyreModels = [], ignoreGwidd = [], targets = [];
  var gwidd = {};
  var newnode = false
  
  // Populate structures, phyreModels, and gwidd
  for (let i=0; i<data.experimentalStructures.length; i++) {
    var structure = data.experimentalStructures[i].pdbCode;
    structures.push(structure);
  }

  for (let i=0; i<data.phyreModels.length; i++) {
    var phyreModel = data.phyreModels[i].model_path;
    phyreModels.push(phyreModel);
  }
  
  for (let i=0; i<data.gwiddComplex.length; i++){
    var complexIds = data.gwiddComplex[i].otherDetails.interactionIds
    var match = /(^.*?)_(.*)/g.exec(complexIds)
    var correctId;
    if (match[1] == match[2] || match[1] != id){
      correctId = match[1];
    } else {
      correctId = match[2];
    }

    if (!ignoreGwidd.includes(correctId)) {
      gwidd[correctId] = data.gwiddComplex[i].otherDetails.model_path
      ignoreGwidd.push(correctId)
    }
  }
  
  if (source) {
    newnode = true
  }
        
  // Generate and push node data
  collection.push({data: {
    id: id, 
    name: name,
    fullName: fullName,
    GO: {"F":[], "P":[], "C":[]},
    OMIM: [], Reactome: [],
    gwidd: gwidd,
    structures: structures,
    phyreModels: phyreModels,
    newnode: newnode
  }});

  // Retrieve interactors
  var interactors = data.interactor;

  for (let i=0; i<interactors.length; i++) {
    if (interactors[i].intactId1 == interactors[i].intactId2
        && !proteins[id].includes(id)) {
      proteins[id].push(id);
      continue
    }

    var interactor = interactors[i].accession.replace(/-\d+$/, "");
    if(!interactors[i].organismDiffers) {
      if (!proteins[interactor]) {
        proteins[id].push(interactor);
        if (!query.concat(offspring).concat(flagged).includes(interactor)) {
          offspring.push(interactor);
        }
      }
    }
    else {
      saved.push({data: {source: id, target: interactor}});
      if (!nonHumans.includes(interactor)) {
        var label = interactors[i].label || interactor
        nonHumans.push(interactor);
        saved.push({data: {
          id: interactor,
          name: label.toLowerCase(),
          fullName: label.toLowerCase() + " (Non-human)",
          organismDiffers: true,
          OMIM: [], Reactome: [], structures: [], phyreModels: [],
          GO: {"F":[], "P":[], "C":[]}
        }});
      }
    }
  }
})
.catch(function(err) {
  // If error is encountered for initial query, submitted ID is likely invalid
  if (id == iquery) {
    document.getElementById("cy").innerHTML = err+ "\nFailed on first query.";
    console.timeEnd("fetch");
    throw(err+ "\nFailed on first query.");
  }
  else {
    flagged.push(id);
  }
})));

if ((ids.length + offspring.length >= 100 || !offspring.length || source)
    && iquery != query[0]) {
  for (let i=initLength; i<ids.length; i++) {
    let targets = proteins[ids[i]];

    if (source) {
      collection.push({data: {source: source, target: ids[i]}});
    }

    for (let j=0; j<targets.length; j++) {
      if (proteins[targets[j]]) {
        if (source) {
          collection.push({data: {source: targets[j], target: ids[i]}});
        }
        else {
          collection.push({data: {source: ids[i], target: targets[j]}});
        }
      }
    }
  }
  initLength = ids.length;
  return collection;
}
else {
  return await fetchAll(offspring, saved);
}
}


async function BuildNetwork() {
ids = [], nonHumans = [], collection= [];
proteins = {};
initLength = 0;
iquery = document.getElementById("query").value.replace(/-1$/, "");
console.time("fetch");
let elements = await fetchAll([iquery]);
console.timeEnd("fetch");

console.time("layout");
document.getElementById("cy").innerHTML = "";
cy = cytoscape({
  container: document.getElementById("cy"),
  elements: elements,
  layout:{
    name:"cose",
    fit: true,
    padding: 25,
    nodeDimensionsIncludeLabels: true,
    nodeRepulsion: 1e6,
    nodeOverlap: 10,
    gravity: 0
  },
  style: [
    {
      selector: "node",
      style: {
      "background-color": "blue",
      label: "data(name)", 
      width: 40, height: 40,
      "font-size": 18, "font-family": "Helvetica",
      "border-color": "orange",
      "border-style": "double",
      "border-width": 0
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


// Define and indicate query node 
queryNode = cy.nodes("#"+iquery);
document.getElementById("queryIndicator").innerHTML = "Query: " + queryNode.data("name");

// Once network is rendered, display settings
document.getElementById("settings").style.display = "block"
document.getElementById("showsettings").style.display = "block"
settings = tippy(document.getElementById("showsettings"), {
    content: document.getElementById("settings"),
    theme: "light",
    trigger: "manual",
    interactive: true,
    size: "large",
    animateFill: false,
    allowHTML: true,
    hideOnClick: false
})
settings.show()


function disableCheckBoxes() {
  $("input:checkbox").prop('disabled', true);
  $(".showhide").prop('disabled', true)
}
disableCheckBoxes();

function postProcessing() {
   // Style loop edges for self-interactions
  cy.edges(":loop").style("loop-direction", -90);

  // Add classes for non-human nodes and nodes without 3D structures
  for (let i=0; i<cy.nodes().length; i++) {
    if (cy.nodes()[i].data("organismDiffers") == true) {
      cy.nodes()[i].addClass("nonHuman");
    }
    if (cy.nodes()[i].data("structures").length || 
        cy.nodes()[i].data("phyreModels").length) {
      cy.nodes()[i].style({"background-color": "green"})
    }
  }
  $("#organismcheck").prop('disabled', false)
  queryNode.style({"background-color": "red"});
  
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
postProcessing();

// Add collection for nodes removed via OptionfilterV2
cy.scratch("removed", cy.collection());

// Define function that fetches extra protein information from phyrerisk
async function fetchAfter(datatype, sitejson, extranodes) {
console.time(datatype)
document.getElementById("loading" + datatype).innerHTML = "Loading...";

var nodeselector = ""
if (extranodes == true) {nodeselector = "[?newnode]"}

var siteid = datatype
if (datatype == "OMIM") {siteid = "MIM"}

await Promise.all(cy.nodes('[^organismDiffers]' + nodeselector).map(node =>                                                          // Iterate only over human and non-isoform proteins, for which a phyrerisk page exists
     fetch(`${fetch_link}/dbref/${node.id()}/${siteid}.json`)       // Fetch terms
    .then(response => response.json())
    .then(function (sitejson) { 
    if (sitejson && sitejson.length != 0){
        for (let i=0; i<sitejson.length; i++) {
            
            if (datatype == "OMIM") {
               if (sitejson[i].properties.type.includes("phenotype")){
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
   })
))
.catch(function(){})

 
 if (typeof classmaker !== "function") {
    classmaker = function(datatype, queryreset, nodeselector){
        var categoryloop = 1
        var categoryindex = ""
        if (datatype == "GO") {
            categoryloop = 3        // Force post-fetch functions to loop over all 3 lists of the GO dictionary
        }
        
        if (!queryreset) {
            if (datatype == "OMIM") {
                for (let i=0; i<cy.nodes(nodeselector).length; i++) {										// Fetch OMIM ID disease names from loaded portable database
                    let node = cy.nodes(nodeselector)[i]
                    if (node.data("OMIM").length) {
                        for (let x=0; x<node.data("OMIM").length; x++) {
                            if (OMIMdatabase[node.data("OMIM")[x]]){								// Not all OMIM IDs seem to be included in the 2GB file e.g. 604308
                                node.data("OMIM")[x] = "(OMIM: " + node.data("OMIM")[x] +")  " + OMIMdatabase[node.data("OMIM")[x]]
                            }
                            else {
                                node.data("OMIM")[x] = "(OMIM: " + node.data("OMIM")[x] +")  "  // Leave nameless OMIM IDs in but without name
                            }
                        }
                    }
                }
            }    
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
            div.innerHTML = ""
            var tablehtml = '<table border=1>'
            for (let z=0; z<queryNode.data("common" + datatype + categoryindex).length; z++) {                 // Loop for adding checkboxes to HTML to filter for each query term 
                var term = queryNode.data("common" + datatype + categoryindex)[z]
                var string = term
                
                tablehtml += `
                <tr>
                <td>` + string + `</td>
                <td class="button_cell"><input class="` + datatype + `check" id="` + datatype + `check" type="CHECKBOX" value="1" onchange="Optionfilterchoice(this, '.reject` + datatype + categoryindex + z + `');"/></td>
                </tr>
                `    
                
                for (let i=0; i<cy.nodes().length; i++){                                            
                    var targetdata = cy.nodes()[i].data("common" + datatype + categoryindex)                       // Loop within previous loop for adding individual query term reject classes to each node
                    if (targetdata.indexOf(term) == -1) {
                        cy.nodes()[i].addClass("reject" + datatype + categoryindex + z)			
                    }
                }
            }
            tablehtml += '</table>'
            div.innerHTML += tablehtml
        }


        for (let h=0; h<categoryloop; h++) {  // Make tippy popups for tables with extra individual query term checkboxes
            if (datatype == "GO") {categoryindex = categories[h]}
            const button = document.getElementById("extra" + datatype + categoryindex)
            const template = document.getElementById("extracheckboxes" + datatype + categoryindex)
            const container = document.createElement('div')
            container.id = "morecheck" + datatype + categoryindex
            container.style.cssText = "overflow: auto; max-height:50vw;"
            container.appendChild(document.importNode(template.content, true))
            if (queryreset) {
                button._tippy.destroy()
                }
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

        var querytermlength = queryNode.data(datatype).length  // Get query OMIM/Reactome id list length
        if (datatype == "GO") {  // Calculate query GO dictionary length
            var allGOterms = 0
            for (let i=0; i<Object.values(queryNode.data(datatype)).length; i++) {
                allGOterms += Object.values(queryNode.data(datatype))[i].length
            }
            querytermlength = allGOterms
        }
             if (querytermlength == 0) {
                  document.getElementById("loading" + datatype).innerHTML += "<br>" +"<b>No " + datatype + " data" + " found for query.</b>"
             } 
        else {
            $("." + datatype + "check").prop('disabled', false)
        }
    }
}
classmaker(datatype, queryreset=false, nodeselector);
console.timeEnd(datatype)
}


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
      distance: 4,
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
  
 this.successors().connectedNodes().unselect()
});

cy.on("cxttap", "node", function(){
  this.tip.hide();
});

cy.on("tapdragover", "node", function(){
    this.successors().connectedNodes().select()
});

cy.on("grabon", "node", function(event){
    if (!event.originalEvent.altKey) {
        this.successors().connectedNodes().lock()
        this.unlock()
    }  
});

cy.on("freeon", "node", function(){
    this.successors().connectedNodes().unlock()
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
  cy.panBy({x:document.getElementById("settings").offsetWidth})
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
    selector: "node[^organismDiffers]",
      onClickFunction: function (event) {
        var target = event.target || event.cyTarget;
        if (!target.data("organismDiffers")) {
          window.open("http://phyrerisk.bc.ic.ac.uk:8080/isoform/"+target.id());
        }
        else {
          alert("This protein is non-human and thus not in the PhyreRisk database.")
        }
      },
      hasTrailingDivider: true
    },
    {
      id: "Expand",
      content: "Expand network around node",
      selector: "node[^organismDiffers]",
      onClickFunction: async function (event) {
        var target = event.target || event.cyTarget;
        let offspring = proteins[target.id()].filter(id => !(proteins[id] || flagged.includes(id)));
        if (offspring.length) {
          if (offspring.length > 10) {
            let warning = `Warning: This expansion will add ${offspring.length} new nodes to the network. Proceed?`
            if (!confirm(warning)) {
              return 0;
            }
          }
          contextMenu.disableMenuItem("Expand")
          contextMenu.disableMenuItem("SetQuery")
          target.style({
            "background-image": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Maya_3.svg/480px-Maya_3.svg.png", 
            "background-fit": "contain"
          });
          cy.removeListener('layoutstop');
          console.time("network expansion");
          let elements = await fetchAll(offspring, [], target.id());
          console.timeEnd("network expansion");
          cy.nodes().lock()
          cy.add(elements)
          cy.$("[?newnode]").union(cy.$("[?newnode]").connectedEdges()).style("display", "none")
          cy.layout({
            name: 'cose',
            fit: false,
            padding: 25,
            nodeDimensionsIncludeLabels: true,
            nodeRepulsion: 1e6,
            nodeOverlap: 10,
            gravity: 0
          }).run()
          cy.$("[?newnode]").union(cy.$("[?newnode]").connectedEdges()).style("display", "element")
          cy.nodes().unlock();         
          disableCheckBoxes();
          postProcessing();
          target.style({'background-image': null});
          fetchAfter("OMIM", "IDs", extranodes=true);
          fetchAfter("Reactome", "IDs", extranodes=true);
          await fetchAfter("GO", "terms", extranodes=true);
          cy.$("[?newnode]").data("newnode", false);
          $("input:checkbox").each(function() {
            if(this.checked) {
                this.click()
                this.click()
            }
          });
          contextMenu.enableMenuItem("Expand")
          contextMenu.enableMenuItem("SetQuery")
        }
        else {
            alert("This protein is already fully expanded!")
        }
      }, 
      hasTrailingDivider: true
    },
    {
      id: "SetQuery",
      content: "Set protein as query and update filters",
      selector: "node[^organismDiffers]",
      onClickFunction: function (event) {
      var target = event.target || event.cyTarget;
      queryNode.style({"background-color": "blue"})
      queryNode = cy.nodes("#"+target.id())
      $("input:checkbox").each(function() {
        if(this.checked) {
            this.click()
        }
      });
      disableCheckBoxes();
      postProcessing();
      for (let i=0; i<cy.nodes().length; i++) {
          cy.nodes()[i].classes().forEach(function(nodeclass){
              if (nodeclass.includes("reject")){
                  cy.nodes()[i].removeClass(nodeclass)
              }
          })
      }
      classmaker("OMIM", queryreset=true)
      classmaker("Reactome", queryreset=true)
      classmaker("GO", queryreset=true)
      document.getElementById("queryIndicator").innerHTML = "Query: "+target.data("name");
    },
      hasTrailingDivider: true
    },
    {
      id: "GOshared",
      content: "Show Gene Ontology terms and highlight those shared with query",
      selector: "node[^organismDiffers]",
      onClickFunction: function (event) {
            var target = event.target || event.cyTarget;
            if (document.getElementById("loadingGO").innerHTML == "Loading... complete." ) {
                var markedGO = {"F":[], "P":[], "C":[]}
                for (let h=0; h<categories.length; h++) {
                    markedGO[categories[h]] = [].concat(target.data("GO")[categories[h]])
                    if (!markedGO[categories[h]].length) {
                        markedGO[categories[h]].push("none")
                    }
                    else {
                        if (target.id() != queryNode.id()) {
                            for (let i=0; i<markedGO[categories[h]].length; i++) {
                                if (target.data("commonGO" + categories[h]).includes(markedGO[categories[h]][i])) {
                                    markedGO[categories[h]][i] = "<mark>" + markedGO[categories[h]][i] + "</mark>"
                                }
                            }
                        }
                    }
                }
                target.tipGO =  tippy(target.popperRef(), {
                  content: '<div style="overflow: auto; max-height:"50%";">' + 
                ["<b><font size='3em'>Cellular component:</font></b>" +"<br>" + markedGO["C"].join("<br>"), // Use <br> because tippy content can't parse \n characters as newline
                                 "<b><font size='3em'>Biological process:</font></b>" +"<br>" + markedGO["P"].join("<br>"),
                                 "<b><font size='3em'>Molecular function:</font></b>" + "<br>" + markedGO["F"].join("<br>")]
                                 .join("<br><br>")
                                 + '</div>',
                  theme: "light",
                  placement: "right",
                  distance: 2,
                  duration: [100, 0],
                  allowHTML: true,
                  interactive: true,
                  sticky: true,
                  arrow: true,
                  maxWidth: "100%"
                });
                target.tipGO.show()
                }
             else {alert("GO terms still loading...")}
    },
      hasTrailingDivider: true
    },
    {
      id: "Reactomeshared",
      content: "Show reactome pathways and highlight those shared with query",
      selector: "node[^organismDiffers]",
      onClickFunction: function (event) {
            var target = event.target || event.cyTarget;
            if (document.getElementById("loadingReactome").innerHTML == "Loading... complete." ) {
                var markedReactome = [].concat(target.data("Reactome"))
                if (!markedReactome.length) {
                    markedReactome.push("none")
                }
                else {
                     if (target.id() != queryNode.id()) {
                         for (let i=0; i<markedReactome.length; i++) {
                            if (target.data("commonReactome").includes(markedReactome[i])) {
                                markedReactome[i] = "<mark>" + markedReactome[i] + "</mark>"
                            }
                        }   
                     }    
                }
                target.tipReactome =  tippy(target.popperRef(), {
                  content: '<div style="overflow: auto; max-height:50vw;">' +
                  "<b><font size='3em'>Reactome pathways:</font></b>" + '<br>' + markedReactome.join('<br>')
                  + '</div>',
                  theme: "light",
                  placement: "right",
                  distance: 2,
                  duration: [100, 0],
                  allowHTML: true,
                  interactive: true,
                  sticky: true,
                  arrow: true,
                  maxWidth: "100%"
                });
                target.tipReactome.show()
                }
             else {alert("Reactome IDs still loading...")}
    },
      hasTrailingDivider: true
    },
    {
      id: "Diseaseinvolement",
      content: "Show OMIM diseases and highlight those shared with query",
      selector: "node[^organismDiffers]",
      onClickFunction: function (event) {
            var target = event.target || event.cyTarget;
            if (document.getElementById("loadingOMIM").innerHTML == "Loading... complete." ) {
                var markedOMIM = [].concat(target.data("OMIM"))
                if (!markedOMIM.length) {
                    markedOMIM.push("none")
                }
                else {
                    if (target.id() != queryNode.id()) {
                        for (let i=0; i<markedOMIM.length; i++) {
                            if (target.data("commonOMIM").includes(markedOMIM[i])) {
                                markedOMIM[i] = "<mark>" + markedOMIM[i] + "</mark>"
                            }
                        }
                    }
                }
                target.tipOMIM =  tippy(target.popperRef(), {
                  content: '<div style="overflow: auto; max-height:50vw;">' +
                  "<b><font size='3em'>OMIM disease involvement:</font></b>" + "<br>" + markedOMIM.join('<br>')
                  + '</div>',
                  theme: "light",
                  placement: "right",
                  distance: 2,
                  duration: [100, 0],
                  allowHTML: true,
                  interactive: true,
                  sticky: true,
                  arrow: true,
                  maxWidth: "100%"
                });
                target.tipOMIM.show()
                }
            else {alert("OMIM IDs still loading...")}    
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

contextMenu.disableMenuItem("Expand")
contextMenu.disableMenuItem("SetQuery")

fetchAfter("OMIM", "IDs", false)
fetchAfter("Reactome", "IDs", false)
await fetchAfter("GO", "terms", false)

contextMenu.enableMenuItem("Expand")
contextMenu.enableMenuItem("SetQuery")
}

// Show or Hide filtering options table on click
function minimiseSettings() {
    if (settings.state.isShown) {
        settings.hide()
        $(".settingsimg").replaceWith('<img src="icons/angle_double_up.png" class="settingsimg">')
    }
    else {
       settings.show()
       $(".settingsimg").replaceWith('<img src="icons/angle_double_down.png" class="settingsimg">')
    }
}


// Display filtering method based on drop-down menu choice

var dropdownchoice;                         
dropdownchoice = "method1"                  // Default setting
function DisplaySettings(method){
    $(".showhide").each(function() {  // Template tags that include individual filters are only accessible when tippy is rendered
        this.click()
    });
	$("input:checkbox").each(function() {
            if(this.checked) {
                this.click()
            }
          });
    $(".showhide").each(function() {
        this.click()
    })
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
    cy.scratch("removed").merge(o)
    cy.scratch("removed").merge(o.connectedEdges())
    for (let i=0; i<o.length; i++) {
        if (o[i].tip && o[i].tip.state.isShown) {
            o[i].tip.hide()
            o[i].addClass("hiddentip" + optionClass.substr(1))
        }
    }
    o.remove()
    var filtered = cy.collection();
    for (let i=0; i<cy.nodes().difference(queryNode).length; i++) {
        var path = cy.elements().aStar({
            root: cy.nodes().difference(queryNode)[i],
            goal: queryNode,
            directed: false
        })
        if (!path.found) {
            filtered.merge(cy.nodes().difference(queryNode)[i])
            filtered.merge(cy.nodes().difference(queryNode)[i].connectedEdges())
            if (cy.nodes().difference(queryNode)[i].tip && cy.nodes().difference(queryNode)[i].tip.state.isShown) {
                cy.nodes().difference(queryNode)[i].tip.hide()
                cy.nodes().difference(queryNode)[i].addClass("hiddentip" + optionClass.substr(1))
            }
        }
    }
    cy.scratch("removed").merge(filtered)
    filtered.remove()
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
    for (let i=0; i<cy.nodes(".hiddentip" + optionClass.substr(1)).length; i++) {
        cy.nodes(".hiddentip" + optionClass.substr(1))[i].tip.show()
    }
    cy.nodes(".hiddentip" + optionClass.substr(1)).removeClass("hiddentip" + optionClass.substr(1))
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
  if (node.outdegree(false) == 0) {
    return 0;
  }
  
  node.addClass("collapsed");
  node.style("border-width", 10);
  let targets = node.outgoers(":simple").targets(); 

  for (let i=0; i<targets.length; i++) {
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

  if (node.connectedEdges(":hidden").length == 0) {
    node.removeClass("collapsed");
    node.style("border-width", 0);
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
  let collapsedSources = cy.nodes(".collapsed");

  for (let i=collapsedSources.length-1; i>-1; i--){
    if (collapsedSources[i].connectedEdges(':simple:hidden').length == 0) {
      controlDict[node.id()].push(collapsedSources[i]);
      collapsedSources[i].removeClass("collapsed");
      collapsedSources[i].style("border-width", 0);
    }
  }
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

var styleTypes = ["background-color", "line-color", "border-width", "width", "opacity"];

function networkPNG(button, simple) {
  if (simple) {
    var styles = [];
    for (let i=0; i<cy.elements().length; i++){
      let element = cy.elements()[i];
      let style = {};
      for (let j=0; j<5; j++) {
        style[styleTypes[j]] = element.style(styleTypes[j]);
      }
      styles.push(style);
    }
    cy.nodes(".collapsed").style("border-width", 0);        
    // Image requires that all nodes have an opacity of 1
    cy.nodes().difference(queryNode).style({"background-color": "blue", "opacity": 1});
    cy.edges().style({
      "width": "4",
      "line-color": "grey",
      "opacity": 1
    });
  }

  let image = cy.png(scale = 5, maxWidth=1000, maxHeight=1000, full=true);
  button.href = image;
  button.setAttribute("download",  "network.png");

  if (simple) {
    for (let i=0; i<cy.elements().length; i++) {
      cy.elements()[i].style(styles[i])
    }
  }
}
