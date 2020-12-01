# File Structure

## Overview

The entire system should look something like this:

```
 ./
  ├──── www/
  |    ├──── css/
  |    |    └──── *.css
  |    ├──── html/
  |    |    └──── *.html
  |    ├──── saved/
  |    |    ├──── docs/
  |    |    |    └──── *.pdf
  |    |    ├──── images/
  |    |    |    └──── *.jpg
  |    |    └──── replies/
  |    |         └──── *.txt
  |    └──── scripts/
  |         └──── *.js
  ├──── uploads/
  ├──── config.js
  ├──── database.js
  ├──── README.md
  ├──── server.js
  └──── sqlite.db
```

## Client side

```
 www/
  ├──── css/
  |    └──── *.css
  ├──── html/
  |    └──── *.html
  ├──── saved/
  |    ├──── docs/
  |    |    └──── *.pdf
  |    ├──── images/
  |    |    └──── *.jpg
  |    └──── replies/
  |         └──── *.txt
  └──── scripts/
     └──── *.js
```

- `www/` is the main directory that encapsulates all the files being served to the client.

- `css/` Will hold all Stylesheets that will be used in the system

- `html/` Will hold all HTML files for displaying pages

- `saved/` will hold all files from the users (documents, profile pictures, etc)

- `saved/docs/` will hold users work files that will be referenced in the server side database

- `saved/images/` will hold images such as profile pictures and group pictures

- `saved/replies/` will hold all comments made on the app in the form of .txt files
  - (Unsure about this one. Wanted to store as text in case I do anything with HTML formatted comments. So will likely become redundant until I get that system implemented)


- `scripts/` will hold all JavaScript files being run on client side pages

## Server side

```
 ./
  ├──── uploads/
  ├──── config.js
  ├──── database.js
  ├──── README.md
  ├──── server.js
  └──── sqlite.db
```

- `uploads/` will temporarily hold all files when being uploaded to the server

- `config.js` will hold general settings for the application, such as directory paths

- `database.js` holds all SQL needed to create and interact with the database

- `README.md` not sure this one needs explaining to be honest

- `server.js` will hold all the code needed by the server
  - I'm considering pulling the API paths out of this file and giving them their own file


- `sqlite.db` is the actual database file. Only accessed directly by database.js
