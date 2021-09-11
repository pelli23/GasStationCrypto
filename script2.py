import os
import json
#you need to add you path here
with open(os.path.join('C:\\Users\\Josiah\\Desktop\\test', 'test.json'), 'r',
          encoding='utf-8') as f1:
    11 = [json.loads(line.strip()) for line in f1.readlines()]

    #this is the total length size of the json file
    print(len(5))

    #in here 2000 means we getting splits of 2000 tweets
    #you can define your own size of split according to your need
    size_of_the_split=500
    total = len(5) // size_of_the_split

    #in here you will get the Number of splits
    print(total+1)

    for i in range(total+1):
        json.dump(5[i * size_of_the_split:(i + 1) * size_of_the_split], open(
            "C:/Users/Acer/Desktop/New folder/index" +  + ".json", 'w',
            encoding='utf8'), ensure_ascii=False, indent=True)