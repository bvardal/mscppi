var cy = cytoscape({
  container: document.getElementById('cy'),
  elements: elements,
  layout:{
                name:'cose-bilkent',
                fit: true,
                padding: 250,
                nodeDimensionsIncludeLabels: true,
            },
    style: [
    {
        selector: 'node',
        style: {
            shape: 'circle',
            'background-color': 'blue',
            'text-wrap': 'wrap',
            label: 'data(name)',
            'font-size': '13px'
    }},
        {
        selector: 'edge',
        style: {
            'width': 4
            
        }}
        
    ]      
});
    cy.nodes()[0].addClass("query")
    cy.nodes('.query').style({shape: 'pentagon', 'background-color': 'orange'})
    cy.center(cy.nodes('.query'))
    

    document.getElementById('settings').style.display = 'block';
    
    
    
    
    for (x=1; x < cy.nodes().length; x++){
            intersectionMF = cy.nodes()[x].data("molfunclist").filter(value => -1 !== cy.nodes('.query').data("molfunclist").indexOf(value));
            intersectionBP = cy.nodes()[x].data("bioproclist").filter(value => -1 !== cy.nodes('.query').data("bioproclist").indexOf(value));
            intersectionCC = cy.nodes()[x].data("cellcomplist").filter(value => -1 !== cy.nodes('.query').data("cellcomplist").indexOf(value));
            
            if (intersectionMF.length == 0){
            cy.nodes()[x].addClass('rejectMF');} 
            
            else if (intersectionMF.length != 0){
            cy.nodes()[x].data("commonMF", intersectionMF.toString());}
            
            if (intersectionBP.length == 0){
            cy.nodes()[x].addClass('rejectBP');} 
            
            else if (intersectionBP.length != 0){
            cy.nodes()[x].data("commonBP", intersectionBP.toString());}
            
            if (intersectionCC.length == 0){
            cy.nodes()[x].addClass('rejectCC');} 
            
            else if (intersectionCC.length != 0){
            cy.nodes()[x].data("commonCC", intersectionCC.toString());}
            }; 

     
      var checkevents = [];
      
      
      function Optionfilter(checkboxid, optionclass) {
         if (checkboxid.checked){
             
             checkevents.push(optionclass)
             cy.$(optionclass).style({display: 'none'});
             
             var sparenodes = cy.collection();
             for (y=0; y < cy.nodes(optionclass).successors().nodes(':visible').length; y++){
                    if (cy.nodes(optionclass).successors().nodes(':visible')[y].connectedEdges(':visible').connectedNodes('.query').length == 0) {
                    sparenodes = sparenodes.union(cy.nodes(optionclass).successors().nodes(':visible')[y])}}
                    sparenodes.style({display:'none'})}
        else {
            
            checkevents.splice(checkevents.indexOf(optionclass), 1);
            cy.nodes().style({display:'element'});
         
            if (checkevents.length != 0){
                
                for (z=0; z < checkevents.length; z++) {
                    
                    cy.$(checkevents[z]).style({display: 'none'});
                     var sparenodes = cy.collection();
                     for (y=0; y < cy.nodes(checkevents[z]).successors().nodes(':visible').length; y++){
                            if (cy.nodes(checkevents[z]).successors().nodes(':visible')[y].connectedEdges(':visible').connectedNodes('.query').length == 0) {
                            sparenodes = sparenodes.union(cy.nodes(checkevents[z]).successors().nodes(':visible')[y])}}
                            sparenodes.style({display:'none'})}
            }
        }
      }
      
      
      var checkeventsV2 = [];
      
      function OptionfilterV2(checkboxid, optionclass) {
         if (checkboxid.checked){
             
             checkeventsV2.push(optionclass)
             cy.$(optionclass).style({'opacity': '0.1'});
             cy.$(optionclass).connectedEdges().style({'line-style': 'dashed', 'width': '2'});}
             
        else {
            
            checkeventsV2.splice(checkeventsV2.indexOf(optionclass), 1);
            cy.nodes().style({'opacity': '1'});
            cy.edges().style({'line-style': 'solid', 'width': '4'});
         
            if (checkeventsV2.length != 0){
                
                for (z=0; z < checkeventsV2.length; z++) {
                    
                    cy.$(checkeventsV2[z]).style({'opacity': '0.1'});
                    cy.$(checkeventsV2[z]).connectedEdges().style({'line-style': 'dashed', 'width': '2'});  
            }
        }
      }
      }
          
      
        
      cy.on("mouseover", "node", function(){
        var description = this.data("fullName")+" (<i>"+this.data("organism")+"</i>)";
        document.getElementById("name").innerHTML = description;
      });

      cy.on("mouseout", "node", function(){
        document.getElementById("name").innerHTML="";
      });
        
    var contextMenu = cy.contextMenus({
                                    menuItems: [
                                        {
                                            id: 'link',
                                            content: 'Link to PhyreRisk page',
                                            selector: 'node',
                                            onClickFunction: function (event) {
                                              var target = event.target || event.cyTarget;
                                              if (target.data("id").length < 7){
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
                                              alert('\n\nShared cellular component:  ' + target.data("commonCC") + '\n\n\n' + 
                                             'Shared biological process:  ' + target.data("commonBP") + '\n\n\n' + 'Shared molecular function:  ' + target.data("commonMF"))
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
