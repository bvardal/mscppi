OMIMfile = open("OMIMdatabase.js", "w")
OMIMfile.write("var OMIMdatabase = {")
sameOMIM = []
counter = 0

with open("homo_sapiens_variation.txt", "r") as file:
	for number, line in enumerate(file):
		if "MIM:" in line:
			line_list = line.split("\t")
			
			if "MIM:" not in line_list[6]:
				MIMterms = line_list[7].split(", ")
				MIMid = MIMterms[0]
				MIMid = MIMid[4:]
				
			else:
				MIMindisease = line_list[6].split(" ")
				MIMbracketid = MIMindisease[-1]
				MIMid = MIMbracketid[1:-1]
				MIMid = MIMid[4:]
				line_list[6] = line_list[6].replace(MIMbracketid, "")
				
			if MIMid not in sameOMIM:
				
				if counter != 0:
					OMIMfile.write(',')
					
				OMIMfile.write('"'+MIMid+'":' + '"'+line_list[6]+'"')
				sameOMIM.append(MIMid)
				counter += 1
				
OMIMfile.write("}")				
OMIMfile.close()
print("complete")
