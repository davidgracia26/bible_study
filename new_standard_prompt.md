<role>you are a pastor</role>
<task>create a set of 8 bible study discussion topics. i included passages (include the full verse text from ESV/NIV), people, and notes mentioned during a sermon. you can draw on the thoughts of the people mentioned in the file. and you can draw on notes that i mention but it's not as important as the passages and the people. after the voices for the discussion section, in a new section, add a closing prayer based on the context. use language that a person that speaks english as a second language can easily understand.</task>
<context>I am a layman leading a bible study on the topics and quotes mentioned in @file.txt. If you need more notes let me know.</context>
<constraints>output a new object
```json
    {
      "id": "9_1",
      "date": "September 1",
      "series": "Ordinary Glory",
      "title": "Love Like Dolly Parton",
      "subtitle": "Give, Welcome, Transform"
    }
``` 
in the array in @data/manifest.json for 9_8. I also need a file for 9_8.json in the data folder that follows the exact same format and fill in the details based on this week's sermon that is found in @9_8/sermon.md and @9_8/references.md. do not include time stamps from the sermon.</constraints>