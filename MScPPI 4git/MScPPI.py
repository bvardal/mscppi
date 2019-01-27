import re
import urllib.request
import webbrowser

query = input('Please enter protein accession ID: ')


url = ('http://phyrerisk.bc.ic.ac.uk:9090/rest/interaction/' + query)
response = urllib.request.urlopen(url)
data = response.readlines()
url2 = ('https://www.uniprot.org/uniprot/' + query +'.xml')
response2 = urllib.request.urlopen(url2)
data2 = response2.readlines()

list1=[]
list2=[]
list3=[]
dic= {"interactome{0}".format(x): [] for x in range(10)}


def MoreInteractomes(iterations):
    for n in range(iterations):
        nextinteractome = dic["interactome{0}".format(n+1)]
        if n == 0:
            currentinteractome = list1
        else:
            currentinteractome = dic["interactome{0}".format(n)]
            
        for interactor in currentinteractome:
            try:
                url = ('http://phyrerisk.bc.ic.ac.uk:9090/rest/interaction/'+ interactor)
                response = urllib.request.urlopen(url)
                data = response.readlines()
                list3 = re.findall('(?:<interactsWith>)(.+?)(?:</interactsWith>)', str(data))
                for y in list3:
                    if y != query:
                        nextinteractome.append(y)
                        interactorurl = urllib.request.urlopen('https://www.uniprot.org/uniprot/' + y +'.xml')
                        dataset = interactorurl.readlines()
                        name = re.findall('(?:<fullName>|<fullName.+?>)(.+?)(?:</fullName>)', str(dataset))
                        name = name[0]
                        GOMF = re.findall('(?:value="F:)(.+?)(?:"/>)', str(dataset))
                        GOBP = re.findall('(?:value="P:)(.+?)(?:"/>)', str(dataset))
                        GOCC = re.findall('(?:value="C:)(.+?)(?:"/>)', str(dataset))
                        file.write('{"data": {"id": "' + y + '", "name": "' + name +'", "molfunclist": ' + str(GOMF) + ', "bioproclist": ' + str(GOBP) + ', "cellcomplist": ' + str(GOCC) + '}},\n')
                        file.write('{"data": {"source": "' + interactor + '", "target": "' + y + '"}},\n')
            except:
                continue
        if len(nextinteractome) == 0:
            break
    file.write('];')
    
    
    
with open('test.js', 'w') as file:
    querymolfunclist = re.findall('(?:value="F:)(.+?)(?:"/>)', str(data2))
    querybioproclist = re.findall('(?:value="P:)(.+?)(?:"/>)', str(data2))
    querycellcomplist = re.findall('(?:value="C:)(.+?)(?:"/>)', str(data2))
    file.write('var querymolfunclist = ' + str(querymolfunclist) +';\n')
    file.write('var querybioproclist = ' + str(querybioproclist) +';\n')
    file.write('var querycellcomplist = ' + str(querycellcomplist) +';\n')
    name = re.findall('(?:<name>)(.+?)(?:</name>)', str(data2))
    name = name[0]
    file.write('var PPI = [\n' + '{"data": {"id": "' + query + '", "name": "' + name + '"}},\n')      
    list2 = re.findall('(?:<interactsWith>)(.+?)(?:</interactsWith>)', str(data))
    for x in list2:
                list1.append(x)
                interactorurl = urllib.request.urlopen('https://www.uniprot.org/uniprot/' + x +'.xml')
                dataset = interactorurl.readlines()
                name = re.findall('(?:<name>)(.+?)(?:</name>)', str(dataset))
                name = name[0]
                GOMF = re.findall('(?:value="F:)(.+?)(?:"/>)', str(dataset))
                GOBP = re.findall('(?:value="P:)(.+?)(?:"/>)', str(dataset))
                GOCC = re.findall('(?:value="C:)(.+?)(?:"/>)', str(dataset))
                file.write('{"data": {"id": "' + x + '", "name": "' + name +'", "molfunclist": ' + str(GOMF) + ', "bioproclist": ' + str(GOBP) + ', "cellcomplist": ' + str(GOCC) + '}},\n')
                file.write('{"data": {"source": "' + query + '", "target": "' + x + '"}},\n')



    if len(list1) >= 15:
        MoreInteractomes(0)
    elif len(list1) >= 3:
        MoreInteractomes(1)
    else:
        MoreInteractomes(2)
    
webbrowser.open("IndexDynamic.html");
