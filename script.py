import os
path= 'C:\\Users\\Josiah\\Desktop\\test'
os.chdir(path)
for i in range (1,500):
    Newfolder=str(i)
    os.makedirs(Newfolder)