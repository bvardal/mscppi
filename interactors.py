from urllib import request as urequest
from sys import argv
import re

try:
    query = argv[1]
    page = urequest.urlopen("http://phyrerisk.bc.ic.ac.uk:8080/rest/interaction/{}.json".format(query))
    json = page.read().decode("utf-8")
except:
    print("Please enter a valid accession ID.")
    exit()


pattern = r'(?<=interactsWith":")[^"]+'
prog = re.compile(pattern)
result = prog.findall(json)

head = 'var elements = [\n  {data: {id: "%s"}, selected: true},\n' % query
tail = '\n];'

interactions = {query: []}


def interactors(generation):
    global interactions
    offspring = []

    for protein in generation:
        try:
            page = urequest.urlopen("http://phyrerisk.bc.ic.ac.uk:8080/rest/interaction/{}.json".format(protein))
            json = page.read().decode("utf-8")
        except:
            continue

        results = prog.findall(json)
 
        for id in results:
            id = id[0:6]

            if id in interactions:
                if protein not in interactions[id]:
                    interactions[protein].append(id)
            else:
                interactions[protein].append(id)
                interactions[id] = []
                offspring.append(id)

    return offspring


query = interactors([query])

for i in range(int(argv[2])):
    query = interactors(query)

nodes = []
edges = []

for source in interactions.keys():
    nodes.append('  {data: {id: "%s"}}' % source)
    for target in interactions[source]:
        edges.append('  {data: {"source": "%s", "target": "%s"}}' %(source, target))

with open("elements.js", "w") as output:
    print(head+',\n'.join(nodes+edges)+tail, file=output)
