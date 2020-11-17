# Peer Review System

## Proposed features

- Create your own profile with a display name and profile picture
- Create groups with a name, group image, and a member ranking system
- Upload work to groups with a title, a description, categories, and a link to a document that's either a .pdf or a URL to a public document
- Search for groups and join them
- Leave groups you have joined
- Browse work that's been shared with you
- Reply to a piece of work. Either as a standard reply to the work, or a reply to another reply
- Report a user's work or a reply they've made
- Group admins should be able to review user reports and mark them as seen (archive them)
- Group admins should be able to de-rank and/or remove users from groups


---

## File Structure

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
├── sqlite.db
├── readme.md
└── server.js
```

---

## API Paths

```
GET:
/work/d/:documentId/                  -- Get the work associated with the provided document id
/user/u/:userId/                      -- Get the user information associated with the user id
/replies/u/:userId/                   -- Get all replies a user has written
/replies/d/:documentId/               -- Get all replies for a piece of work
/registrations/u/:userId/             -- Get all groups a user is registered in
/group/gp/:groupId/                   -- Get group by id

POST:
/user/
/work/
/reply/
/registration/
/grievance/
/share/
/group/

PATCH:
/work/d/:documentId/                  -- Update a document
/replies/r/:reviewId/                 -- Update a reply

DELETE:
/work/d/:documentId/                  -- Delete document
/replies/r/:reviewId/                 -- Delete reply
/users/u/:userId/                     -- Delete user account
```

---

## Proposed Categories

### Education Levels

- GCSE
- A-Level
- Higher Education

### Subject Areas

- English
- Maths
- Science
- History
- Geography
- Languages
- Design and Technology
- Art and Design
- Music
- Physical Education
- Computing
- Religious Education

I also think I could implement a system where users can tag their work with custom tags for more specific areas of study

---

## Progress Tracker

- [ ] 1) Have a welcome page with Google login button
- [ ] 2) Have an account page that shows you your profile information
- [ ] 3) Have a page where users can view their current groups and search for public groups to join
- [ ] 4) Have a 'News Feed' where users can view work that has been made available to them through their groups
- [ ] 5) Have a page that opens your selected work and shows replies on it
- [ ]
