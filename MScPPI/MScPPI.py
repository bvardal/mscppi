
# coding: utf-8

# In[ ]:


import re
import urllib.request

query = 'P20340'
url = ('http://phyrerisk.bc.ic.ac.uk:8080/rest/interaction/' + query)
response = urllib.request.urlopen(url)
data = response.readlines()
list=[]
dic= {"interactome{0}".format(x): [] for x in range(20)}

with open('C:\\Users\\mkvardas\\Desktop\\test.js', 'w') as file:
    file.write('var PPI = [\n' + '{"data": {"id": "' + query + '"}},\n')
    for line in data:
            id = re.search('<interactsWith>(.+?)</interactsWith>', str(line))
            if id is not None:
                list.append(id.group(1))
                file.write('{"data": {"id": "' + id.group(1) + '"}},\n')
                file.write('{"data": {"source": "' + query + '", "target": "' + id.group(1) + '"}},\n')
    print(list)
    for n in range(2):
        nextinteractome = dic["interactome{0}".format(n+1)]
        if n == 0:
            currentinteractome = list
        else:
            currentinteractome = dic["interactome{0}".format(n)]
            
        for interactor in currentinteractome:
            try:
                url = ('http://phyrerisk.bc.ic.ac.uk:8080/rest/interaction/'+ interactor)
                response = urllib.request.urlopen(url)
                data = response.readlines()
                for line in data:
                    id = re.search('<interactsWith>(.+?)</interactsWith>', str(line))
                    if id is not None and id.group(1) != query:
                        nextinteractome.append(id.group(1))
                        file.write('{"data": {"id": "' + id.group(1) + '"}},\n')
                        file.write('{"data": {"source": "' + interactor + '", "target": "' + id.group(1) + '"}},\n')
            except:
                continue
        if len(nextinteractome) == 0:
            break
    file.write('];')








