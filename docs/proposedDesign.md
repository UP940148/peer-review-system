# Peer Review System

## File Structure:

```
./ <------------------------------------ Root directory
├── www/ <------------------------------ Directory that holds all files for the browser to use
|   ├── css/ <-------------------------- Stores stylesheets
|   |   └── *.css
|   ├── html/ <------------------------- Stores html files
|   |   └── *.html
|   ├── saved/ <------------------------ Stores all files that users upload
|   |   ├── documents/ <---------------- The work files that the users upload
|   |   |   └── *.pdf
|   |   ├── images/ <------------------- Any images uploaded (I had an idea, I lost it, but I'm keeping this in case it comes back to me)
|   |   |   └── *.jpg
|   |   └── replies/ <------------------ All replies to posts will be stored here as text to be loaded onto the pages
|   |       └── *.txt
|   └── scripts/ <---------------------- Stores all JavaScript files
|       └── *.js
├── config.js
├── database.js
├── readme.md
└── server.js
```

## API Paths:
```
GET:
/work/d/:documentId/                 -- Get the work associated with the provided document id
/users/u/:userId/                    -- Get the user information associated with the user id
/replies/u/:userId/                  -- Get all replies a user has written
/replies/d/:documentId/              -- Get all replies for a piece of work

POST:
/work/u/:userId/                     -- Upload document and link to user account (document id will be created in database)
/users/u/:userId/                    -- Create new user with their google unique id
/replies/u/:userId/d/:documentId/   -- Create a new reply from the user on the document
/replies/u/:userId/r/:reviewId/     -- Create a new reply from the user on another reply

PATCH:
/work/d/:documentId/                 -- Update a document
/replies/r/:reviewId/                -- Update a reply

DELETE:
/work/d/:documentId/                 -- Delete document
/replies/r/:reviewId/                -- Delete reply
/users/u/:userId/                    -- Delete user account
```

## Proposed Categories:

-
