var querymolfunclist = ['GTP binding', 'GTPase activity', 'myosin V binding', 'protein domain specific binding'];
var querybioproclist = ['antigen processing and presentation', 'early endosome to Golgi transport', 'intra-Golgi vesicle-mediated transport', 'intracellular protein transport', 'minus-end-directed organelle transport along microtubule', 'neutrophil degranulation', 'peptidyl-cysteine methylation', 'protein localization to Golgi apparatus', 'Rab protein signal transduction', 'retrograde transport, endosome to Golgi', 'retrograde vesicle-mediated transport, Golgi to endoplasmic reticulum', 'viral process'];
var querycellcomplist = ['cytoplasmic vesicle', 'cytosol', 'endoplasmic reticulum membrane', 'endosome to plasma membrane transport vesicle', 'extracellular exosome', 'Golgi apparatus', 'Golgi membrane', 'membrane', 'plasma membrane', 'secretory granule membrane', 'trans-Golgi network', 'trans-Golgi network membrane'];
var PPI = [
{"data": {"id": "P20340", "name": "RAB6A_HUMAN"}},
{"data": {"id": "Q02410-2", "name": "APBA1_HUMAN", "molfunclist": ['amyloid-beta binding'], "bioproclist": ['axo-dendritic transport', 'cell adhesion', 'chemical synaptic transmission', 'gamma-aminobutyric acid secretion', 'glutamate secretion', 'in utero embryonic development', 'intracellular protein transport', 'locomotory behavior', 'multicellular organism growth', 'nervous system development', 'neurotransmitter secretion', 'protein-containing complex assembly', 'regulation of gene expression', 'regulation of synaptic vesicle exocytosis'], "cellcomplist": ['cytoplasm', 'cytosol', 'dendritic spine', 'glutamatergic synapse', 'Golgi apparatus', 'nucleus', 'perinuclear region of cytoplasm', 'plasma membrane', 'presynaptic active zone membrane', 'Schaffer collateral - CA1 synapse', 'synapse', 'synaptic vesicle']}},
{"data": {"source": "P20340", "target": "Q02410-2"}},
{"data": {"id": "Q6PAL8", "name": "DEN5A_MOUSE", "molfunclist": ['Rab GTPase binding', 'Rab guanyl-nucleotide exchange factor activity'], "bioproclist": ['negative regulation of neuron projection development', 'retrograde transport, endosome to Golgi'], "cellcomplist": ['cytosol', 'Golgi apparatus', 'Golgi membrane', 'retromer complex', 'trans-Golgi network']}},
{"data": {"source": "P20340", "target": "Q6PAL8"}},
{"data": {"id": "Q8IWJ2", "name": "GCC2_HUMAN", "molfunclist": ['identical protein binding'], "bioproclist": ['Golgi ribbon formation', 'late endosome to Golgi transport', 'microtubule anchoring', 'microtubule organizing center organization', 'protein localization to Golgi apparatus', 'protein targeting to lysosome', 'recycling endosome to Golgi transport', 'regulation of protein exit from endoplasmic reticulum', 'retrograde transport, endosome to Golgi'], "cellcomplist": ['cytoplasm', 'cytosol', 'Golgi apparatus', 'membrane', 'nucleoplasm', 'trans-Golgi network']}},
{"data": {"source": "P20340", "target": "Q8IWJ2"}},
{"data": {"id": "Q5ZWZ3", "name": "Q5ZWZ3_LEGPH", "molfunclist": [], "bioproclist": [], "cellcomplist": []}},
{"data": {"source": "P20340", "target": "Q5ZWZ3"}},
{"data": {"id": "Q01968", "name": "OCRL_HUMAN", "molfunclist": ['GTPase activator activity', 'inositol phosphate phosphatase activity', 'inositol-1,3,4,5-tetrakisphosphate 5-phosphatase activity', 'inositol-1,4,5-trisphosphate 5-phosphatase activity', 'phosphatidylinositol phosphate 4-phosphatase activity', 'phosphatidylinositol-3,5-bisphosphate 5-phosphatase activity', 'phosphatidylinositol-4,5-bisphosphate 5-phosphatase activity', 'Rac GTPase binding'], "bioproclist": ['cilium assembly', 'in utero embryonic development', 'inositol phosphate dephosphorylation', 'inositol phosphate metabolic process', 'lipid metabolic process', 'membrane organization', 'phosphatidylinositol biosynthetic process', 'phosphatidylinositol dephosphorylation', 'regulation of GTPase activity', 'regulation of small GTPase mediated signal transduction', 'signal transduction'], "cellcomplist": ['clathrin-coated pit', 'clathrin-coated vesicle', 'cytoplasm', 'cytosol', 'early endosome', 'early endosome membrane', 'Golgi stack', 'Golgi-associated vesicle', 'membrane', 'nucleus', 'phagocytic vesicle membrane', 'photoreceptor outer segment', 'plasma membrane', 'trans-Golgi network']}},
{"data": {"source": "P20340", "target": "Q01968"}},
{"data": {"id": "Q92871", "name": "PMM1_HUMAN", "molfunclist": ['metal ion binding', 'phosphomannomutase activity'], "bioproclist": ['cellular response to leukemia inhibitory factor', 'GDP-mannose biosynthetic process', 'mannose metabolic process', 'protein N-linked glycosylation', 'protein targeting to ER'], "cellcomplist": ['cytosol', 'neuronal cell body']}},
{"data": {"source": "P20340", "target": "Q92871"}},
{"data": {"id": "P11442", "name": "Clathrin heavy chain 1", "molfunclist": ['ankyrin binding', 'clathrin light chain binding', 'heat shock protein binding', 'peptide binding', 'protein C-terminus binding', 'structural molecule activity'], "bioproclist": ['autophagy', 'clathrin coat assembly', 'Golgi organization', 'intracellular protein transport', 'mitotic cell cycle', 'negative regulation of hyaluronan biosynthetic process', 'receptor-mediated endocytosis', 'synaptic vesicle endocytosis'], "cellcomplist": ['clathrin coat', 'clathrin coat of coated pit', 'clathrin coat of trans-Golgi network vesicle', 'clathrin complex', 'clathrin-coated endocytic vesicle', 'clathrin-coated endocytic vesicle membrane', 'extrinsic component of synaptic vesicle membrane', 'melanosome', 'sarcolemma', 'spindle', 'T-tubule', 'terminal bouton']}},
{"data": {"source": "Q01968", "target": "P11442"}},
{"data": {"id": "Q6ICB4", "name": "Sesquipedalian-2", "molfunclist": ['protein homodimerization activity'], "bioproclist": ['endosome organization', 'receptor recycling', 'retrograde transport, endosome to Golgi'], "cellcomplist": ['clathrin-coated vesicle', 'cytosol', 'early endosome', 'recycling endosome', 'trans-Golgi network']}},
{"data": {"source": "Q01968", "target": "Q6ICB4"}},
{"data": {"id": "P62820", "name": "Ras-related protein Rab-1A", "molfunclist": ['cadherin binding', 'GTP binding', 'GTPase activity'], "bioproclist": ['autophagosome assembly', 'autophagy', 'cargo loading into COPII-coated vesicle', 'cell migration', 'COPII vesicle coating', 'defense response to bacterium', 'endocytosis', 'endoplasmic reticulum to Golgi vesicle-mediated transport', 'Golgi organization', 'growth hormone secretion', 'interleukin-8 secretion', 'intracellular protein transport', 'melanosome transport', 'positive regulation of glycoprotein metabolic process', 'positive regulation of ubiquitin protein ligase activity', 'post-translational protein modification', 'Rab protein signal transduction', 'retrograde vesicle-mediated transport, Golgi to endoplasmic reticulum', 'substrate adhesion-dependent cell spreading', 'vesicle transport along microtubule', 'vesicle-mediated transport', 'virion assembly'], "cellcomplist": ['cytosol', 'early endosome', 'endoplasmic reticulum membrane', 'extracellular exosome', 'Golgi apparatus', 'Golgi membrane', 'melanosome', 'transport vesicle membrane']}},
{"data": {"source": "Q01968", "target": "P62820"}},
{"data": {"id": "P20339", "name": "Ras-related protein Rab-5A", "molfunclist": ['GDP binding', 'GTP binding', 'GTPase activity'], "bioproclist": ['amyloid-beta clearance by transcytosis', 'blood coagulation', 'early endosome to late endosome transport', 'endocytosis', 'intracellular protein transport', 'membrane organization', 'phagocytosis', 'phosphatidylinositol biosynthetic process', 'positive regulation of exocytosis', 'post-translational protein modification', 'Rab protein signal transduction', 'receptor internalization involved in canonical Wnt signaling pathway', 'regulation of autophagosome assembly', 'regulation of endocytosis', 'regulation of endosome size', 'regulation of filopodium assembly', 'regulation of long-term neuronal synaptic plasticity', 'regulation of synaptic vesicle exocytosis', 'synaptic vesicle recycling', 'viral RNA genome replication'], "cellcomplist": ['actin cytoskeleton', 'anchored component of synaptic vesicle membrane', 'axon', 'axon terminus', 'clathrin-coated vesicle membrane', 'cytoplasm', 'cytoplasmic side of early endosome membrane', 'cytosol', 'dendrite', 'early endosome', 'early endosome membrane', 'endocytic vesicle', 'endosome', 'endosome membrane', 'extracellular exosome', 'melanosome', 'membrane raft', 'neuronal cell body', 'phagocytic vesicle membrane', 'plasma membrane', 'postsynaptic early endosome', 'ruffle', 'somatodendritic compartment', 'synaptic vesicle', 'terminal bouton']}},
{"data": {"source": "Q01968", "target": "P20339"}},
{"data": {"id": "P61006", "name": "Ras-related protein Rab-8A", "molfunclist": ['GDP binding', 'GTP binding', 'GTPase activity', 'myosin V binding', 'protein kinase binding', 'Rab GTPase binding'], "bioproclist": ['autophagy', 'axonogenesis', 'cellular response to insulin stimulus', 'cilium assembly', 'Golgi vesicle fusion to target membrane', 'intracellular protein transport', 'neurotransmitter receptor transport to postsynaptic membrane', 'neurotransmitter receptor transport, endosome to postsynaptic membrane', 'post-translational protein modification', 'protein localization to plasma membrane', 'protein secretion', 'Rab protein signal transduction', 'regulation of autophagy', 'regulation of exocytosis', 'regulation of long-term neuronal synaptic plasticity', 'regulation of protein transport', 'vesicle docking involved in exocytosis', 'vesicle-mediated transport in synapse'], "cellcomplist": ['centriole', 'centrosome', 'ciliary basal body', 'ciliary base', 'cilium', 'cytosol', 'dendritic spine', 'endosome', 'extracellular exosome', 'glutamatergic synapse', 'Golgi membrane', 'midbody', 'neuronal cell body', 'non-motile cilium', 'phagocytic vesicle', 'phagocytic vesicle membrane', 'plasma membrane', 'postsynaptic density', 'recycling endosome membrane', 'synaptic vesicle', 'trans-Golgi network membrane', 'trans-Golgi network transport vesicle']}},
{"data": {"source": "Q01968", "target": "P61006"}},
{"data": {"id": "Q9Y5X1", "name": "Sorting nexin-9", "molfunclist": ['1-phosphatidylinositol binding', 'Arp2/3 complex binding', 'cadherin binding', 'identical protein binding', 'phosphatidylinositol binding', 'protein homodimerization activity', 'ubiquitin protein ligase binding'], "bioproclist": ['cleavage furrow formation', 'endocytosis', 'endosomal transport', 'intracellular protein transport', 'lipid tube assembly', 'membrane organization', 'mitotic cytokinesis', 'plasma membrane tubulation', 'positive regulation of GTPase activity', 'positive regulation of membrane protein ectodomain proteolysis', 'positive regulation of protein kinase activity', 'positive regulation of protein oligomerization', 'receptor-mediated endocytosis'], "cellcomplist": ['clathrin-coated vesicle', 'cytoplasm', 'cytoplasmic vesicle', 'cytoplasmic vesicle membrane', 'cytosol', 'extracellular exosome', 'extrinsic component of cytoplasmic side of plasma membrane', 'plasma membrane', 'ruffle', 'trans-Golgi network']}},
{"data": {"source": "Q01968", "target": "Q9Y5X1"}},
{"data": {"id": "Q00610", "name": "Clathrin heavy chain 1", "molfunclist": ['clathrin light chain binding', 'disordered domain specific binding', 'double-stranded RNA binding', 'low-density lipoprotein particle receptor binding', 'protein kinase binding', 'RNA binding', 'structural molecule activity', 'ubiquitin-specific protease binding'], "bioproclist": ['amyloid-beta clearance by transcytosis', 'antigen processing and presentation of exogenous peptide antigen via MHC class II', 'autophagy', 'cell division', 'clathrin coat assembly', 'clathrin-dependent endocytosis', 'intracellular protein transport', 'low-density lipoprotein particle clearance', 'low-density lipoprotein particle receptor catabolic process', 'membrane organization', 'mitotic cell cycle', 'negative regulation of hyaluronan biosynthetic process', 'negative regulation of protein localization to plasma membrane', 'osteoblast differentiation', 'receptor internalization', 'receptor-mediated endocytosis', 'regulation of mitotic spindle organization', 'retrograde transport, endosome to Golgi', 'transferrin transport', 'Wnt signaling pathway, planar cell polarity pathway'], "cellcomplist": ['clathrin coat', 'clathrin coat of coated pit', 'clathrin coat of trans-Golgi network vesicle', 'clathrin complex', 'clathrin-coated endocytic vesicle', 'clathrin-coated endocytic vesicle membrane', 'clathrin-coated vesicle', 'cytosol', 'endolysosome membrane', 'endosome', 'extracellular exosome', 'extracellular vesicle', 'focal adhesion', 'intracellular membrane-bounded organelle', 'lysosome', 'melanosome', 'membrane', 'mitotic spindle', 'mitotic spindle microtubule', 'plasma membrane', 'protein-containing complex', 'spindle', 'trans-Golgi network membrane']}},
{"data": {"source": "Q01968", "target": "Q00610"}},
{"data": {"id": "Q68FD5", "name": "Clathrin heavy chain 1", "molfunclist": ['ankyrin binding', 'clathrin light chain binding', 'disordered domain specific binding', 'double-stranded RNA binding', 'heat shock protein binding', 'low-density lipoprotein particle receptor binding', 'peptide binding', 'protein C-terminus binding', 'protein kinase binding', 'structural molecule activity', 'ubiquitin-specific protease binding'], "bioproclist": ['autophagy', 'cell division', 'clathrin coat assembly', 'clathrin-dependent endocytosis', 'Golgi organization', 'intracellular protein transport', 'mitotic cell cycle', 'mitotic spindle assembly', 'negative regulation of hyaluronan biosynthetic process', 'negative regulation of protein localization to plasma membrane', 'receptor internalization', 'receptor-mediated endocytosis', 'regulation of mitotic spindle organization', 'retrograde transport, endosome to Golgi', 'synaptic vesicle endocytosis', 'transcytosis', 'transferrin transport'], "cellcomplist": ['clathrin coat', 'clathrin coat of coated pit', 'clathrin coat of trans-Golgi network vesicle', 'clathrin complex', 'clathrin-coated endocytic vesicle', 'clathrin-coated vesicle', 'cytosol', 'endosome', 'extrinsic component of synaptic vesicle membrane', 'intracellular membrane-bounded organelle', 'lysosome', 'melanosome', 'membrane', 'membrane coat', 'mitochondrion', 'mitotic spindle', 'mitotic spindle microtubule', 'Myb complex', 'myelin sheath', 'photoreceptor ribbon synapse', 'presynaptic endocytic zone membrane', 'protein-containing complex', 'sarcolemma', 'spindle', 'T-tubule']}},
{"data": {"source": "Q01968", "target": "Q68FD5"}},
{"data": {"id": "P61106", "name": "Ras-related protein Rab-14", "molfunclist": ['GDP binding', 'GTP binding', 'GTPase activity', 'myosin V binding'], "bioproclist": ['defense response to bacterium', 'endocytic recycling', 'fibroblast growth factor receptor signaling pathway', 'Golgi to endosome transport', 'intracellular protein transport', 'intracellular transport', 'neutrophil degranulation', 'phagolysosome assembly involved in apoptotic cell clearance', 'phosphatidylinositol biosynthetic process', 'Rab protein signal transduction', 'regulation of embryonic development', 'regulation of protein localization', 'vesicle-mediated transport'], "cellcomplist": ['cytosol', 'early endosome', 'early endosome membrane', 'extracellular exosome', 'Golgi membrane', 'Golgi stack', 'intracellular', 'intracellular membrane-bounded organelle', 'late endosome', 'lysosomal membrane', 'lysosome', 'nuclear outer membrane-endoplasmic reticulum membrane network', 'perinuclear region of cytoplasm', 'phagocytic vesicle', 'plasma membrane', 'recycling endosome', 'recycling endosome membrane', 'rough endoplasmic reticulum', 'tertiary granule membrane', 'trans-Golgi network', 'trans-Golgi network transport vesicle']}},
{"data": {"source": "Q01968", "target": "P61106"}},
{"data": {"id": "Q9H0U4", "name": "Ras-related protein Rab-1B", "molfunclist": ['GTP binding', 'GTPase activity'], "bioproclist": ['autophagy', 'COPII vesicle coating', 'endoplasmic reticulum to Golgi vesicle-mediated transport', 'intracellular protein transport', 'positive regulation of glycoprotein metabolic process', 'post-translational protein modification', 'Rab protein signal transduction', 'regulation of autophagosome assembly', 'retrograde vesicle-mediated transport, Golgi to endoplasmic reticulum', 'virion assembly'], "cellcomplist": ['cytosol', 'endoplasmic reticulum membrane', 'endoplasmic reticulum-Golgi intermediate compartment membrane', 'extracellular exosome', 'Golgi apparatus', 'Golgi membrane', 'phagophore assembly site membrane', 'transport vesicle']}},
{"data": {"source": "Q01968", "target": "Q9H0U4"}},
{"data": {"id": "P63000", "name": "Ras-related C3 botulinum toxin substrate 1", "molfunclist": ['ATPase binding', 'enzyme binding', 'GTP binding', 'GTPase activity', 'histone deacetylase binding', 'phosphatidylinositol-4,5-bisphosphate 3-kinase activity', 'protein kinase binding', 'protein serine/threonine kinase activity', 'protein-containing complex binding', 'Rab GTPase binding', 'Rho GDP-dissociation inhibitor binding', 'thioesterase binding'], "bioproclist": ['actin cytoskeleton organization', 'actin filament polymerization', 'anatomical structure morphogenesis', 'blood coagulation', 'bone resorption', 'cell adhesion', 'cell motility', 'cell projection assembly', 'cell proliferation', 'cell-matrix adhesion', 'cellular response to mechanical stimulus', 'ephrin receptor signaling pathway', 'Fc-epsilon receptor signaling pathway', 'Fc-gamma receptor signaling pathway involved in phagocytosis', 'hepatocyte growth factor receptor signaling pathway', 'inflammatory response', 'intracellular signal transduction', 'lamellipodium assembly', 'localization within membrane', 'mast cell chemotaxis', 'negative regulation of interleukin-23 production', 'negative regulation of receptor-mediated endocytosis', 'neuron migration', 'neuron projection morphogenesis', 'neutrophil degranulation', 'positive regulation of cell-substrate adhesion', 'positive regulation of DNA replication', 'positive regulation of focal adhesion assembly', 'positive regulation of lamellipodium assembly', 'positive regulation of microtubule polymerization', 'positive regulation of neutrophil chemotaxis', 'positive regulation of protein kinase B signaling', 'positive regulation of protein phosphorylation', 'positive regulation of Rho protein signal transduction', 'positive regulation of stress fiber assembly', 'positive regulation of substrate adhesion-dependent cell spreading', 'Rac protein signal transduction', 'regulation of cell migration', 'regulation of cell size', 'regulation of defense response to virus by virus', 'regulation of hydrogen peroxide metabolic process', 'regulation of lamellipodium assembly', 'regulation of nitric oxide biosynthetic process', 'regulation of respiratory burst', 'regulation of small GTPase mediated signal transduction', 'regulation of stress fiber assembly', 'response to wounding', 'Rho protein signal transduction', 'ruffle assembly', 'ruffle organization', 'semaphorin-plexin signaling pathway', 'substrate adhesion-dependent cell spreading', 'T cell costimulation', 'vascular endothelial growth factor receptor signaling pathway', 'Wnt signaling pathway, planar cell polarity pathway'], "cellcomplist": ['cytoplasm', 'cytoplasmic ribonucleoprotein granule', 'cytosol', 'dendritic spine', 'endoplasmic reticulum membrane', 'extracellular exosome', 'ficolin-1-rich granule membrane', 'focal adhesion', 'glutamatergic synapse', 'Golgi membrane', 'lamellipodium', 'melanosome', 'membrane', 'plasma membrane', 'postsynapse', 'recycling endosome membrane', 'ruffle membrane', 'secretory granule membrane', 'trans-Golgi network']}},
{"data": {"source": "Q01968", "target": "P63000"}},
{"data": {"id": "Q91VH2", "name": "Sorting nexin-9", "molfunclist": ['1-phosphatidylinositol binding', 'Arp2/3 complex binding', 'identical protein binding', 'phosphatidylinositol binding', 'protein homodimerization activity', 'ubiquitin protein ligase binding'], "bioproclist": ['cleavage furrow formation', 'endocytosis', 'endosomal transport', 'intracellular protein transport', 'lipid tube assembly', 'mitotic cytokinesis', 'plasma membrane tubulation', 'positive regulation of GTPase activity', 'positive regulation of membrane protein ectodomain proteolysis', 'positive regulation of protein kinase activity', 'positive regulation of protein oligomerization', 'receptor-mediated endocytosis'], "cellcomplist": ['clathrin-coated vesicle', 'cytoplasm', 'cytoplasmic vesicle', 'cytoplasmic vesicle membrane', 'cytosol', 'extrinsic component of cytoplasmic side of plasma membrane', 'plasma membrane', 'ruffle', 'trans-Golgi network']}},
{"data": {"source": "Q01968", "target": "Q91VH2"}},
];