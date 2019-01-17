from urllib import request as urequest
from sys import argv
import re
import webbrowser
import os

# Ensure that initial query exists
try:
    query = argv[1]
    url = "http://phyrerisk.bc.ic.ac.uk:8080/rest/interaction/{}.json".format(query)
    page = urequest.urlopen(url)
except:
    print("Please enter a valid accession ID.")
    exit()

# Build regex compiler
pattern = r'(?<=interactsWith":")[^"]+'
prog = re.compile(pattern)

# Add file head/tail
head = 'var elements = [\n  {data: {id: "%s"}, selected: true},\n' % query
tail = '\n];'

interactions = {query: []}


# Function to generate nodes, edges, and a set of "offspring" nodes for each iteration
def interactors(generation):
    global interactions
    offspring = []

    for protein in generation:
        # If protein does not exist in database, then skip it
        try:
            url = "http://phyrerisk.bc.ic.ac.uk:8080/rest/interaction/{}.json".format(protein)
            page = urequest.urlopen(url)
            json = page.read().decode("utf-8")
        except:
            continue

        results = prog.findall(json)  # Find all interactors for given protein
 
        for id in results:  # Loop through all interactor IDs
            id = id[0:6]  # Restrict ID to first 6 chars to cut variants

            if id not in interactions:
                # If node is new, add it to nodes, offspring, and add edge
                interactions[protein].append(id)
                interactions[id] = []
                offspring.append(id)

            else:
                # If protein doesn't already have an edge with the same node
                if protein not in interactions[id]:
                    interactions[protein].append(id)

    return offspring


query = [query]  # Turn initial query into list to satisfy function

for i in range(int(argv[2])):
    query = interactors(query)  # Iteratively build network

nodes, edges = [], []

# For each node in completed dictionary, generate node/edge output lines
for source in interactions.keys():
    nodes.append('  {data: {id: "%s"}}' % source)
    for target in interactions[source]:
        edges.append('  {data: {source: "%s", target: "%s"}}' %(source, target))

with open("elements.js", "w") as output:  # Generate output .js file
    print(head+',\n'.join(nodes+edges)+tail, file=output)

print(os.getcwd()+"/network.html")
webbrowser.open_new("file://"+os.getcwd()+"/network.html")  # Load network in browser
