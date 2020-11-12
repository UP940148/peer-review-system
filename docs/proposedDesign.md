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
/work/d/:document-id/                 -- Get the work associated with the provided document id
/users/u/:user-id/                    -- Get the user information associated with the user id
/replies/u/:user-id/                  -- Get all replies a user has written
/replies/d/:document-id/              -- Get all replies for a piece of work

POST:
/work/u/:user-id/                     -- Upload document and link to user account (document id will be created in database)
/users/u/:user-id/                    -- Create new user with their google unique id
/replies/u/:user-id/d/:document-id/   -- Create a new reply from the user on the document
/replies/u/:user-id/r/:review-id/     -- Create a new reply from the user on another reply

PATCH:
/work/d/:document-id/                 -- Update a document
/replies/r/:review-id/                -- Update a reply

DELETE:
/work/d/:document-id/                 -- Delete document
/replies/r/:review-id/                -- Delete reply
/users/u/:user-id/                    -- Delete user account
```
