# API for Peer Review Application

## GET routes

- `/work/d/:documentId`
  - This will get the requested work file ready for it to be placed into the page so users can view it.
  - Used when viewing peoples' work

- `/user/u/:userId`
  - Gets information associated with the user from their ID

- `/replies/u/:userId/`
  - This will get all replies a user has written
  - Will be useful for a 'view profile' page

- `/replies/d/:documentId/`
  - Gets all replies made on a document
  - Used when viewing peoples' work

- `/registrations/u/:userId/`
  - Returns all the groups a user is subscribed to

- `/group/gp/:groupId/`
  - Get a group via it's ID

## POST routes

All POST routes will return the ID of the created database entry in their response

- `/user/`

- `/work/`

- `/reply/`

- `/registration/`

- `/grievance/`

- `/share/`

- `/group/`

## PATCH routes

- `/work/d/:documentId/`

- `/replies/r/:reviewId/`

## DELETE routes

- `/work/d/:documentId/`

- `/replies/r/:reviewId/`

- `/users/u/:userId/`


## Web Sockets (WIP)

Currently looking into web sockets to maybe implement a live chat/commenting system
