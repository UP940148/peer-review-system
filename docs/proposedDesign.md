# Peer Review System

---

## **Specification**

You are required to design and build a tool where university students (of any discipline) can share their work for peer review and receive feedback from their peers.

Core capabilities:
- Users can submit work to a server for others to review:
  - as one PDF file,
  - or as a public web link.
- Users can get the work of others to review.
- Users can enter reviews and feedback.
- Users can read reviews of their work.

We do hope (and expect) you will go beyond the core capabilities. Additional features we can imagine are:


- Auto-removal of old/stale uploads & reviews.
- Review Groups (aka Cohorts)
 - Users can create a group, others can join.
 - Reviewers might be automatically assigned from within a group.
 - A user may not be granted access to their reviews until they have completed a threshold number of reviews.
 - A group owner dashboard might show:
   - overall performance, e.g. how many reviews have been completed so far.
   - aggregate results for each user and the group as a whole.
 - Download / archive / removal of all group work and reviews.
- Meta-review
 - Users may somehow feed back on the quality or accuracy of a review.
 - Users may gain reputation points by completing reviews that have been found useful by their peer.
- Structured-reviews
 - Reviews may be free text, or based on a series of specific questions with limited fixed responses.
 - Structured reviews might afford more analytical/graphical overview of responses.

These additional features are only suggestions – you are encouraged to invent and implement other capabilities.

Note that the core capabilities do not require any login capabilities: we can imagine a limited system that gives an uploader a unique URL that they can then share with reviewers.  

---

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
./ <-------------------- Root directory
├── www/ <-------------- Directory that holds all files for the browser to use
|   ├── css/ <---------- Stores stylesheets
|   |   └── *.css
|   ├── html/ <--------- Stores html files
|   |   └── *.html
|   ├── saved/ <-------- Stores all files that users upload
|   |   ├── docs/ <----- The work files that the users upload
|   |   |   └── *.pdf
|   |   ├── images/ <--- Any images uploaded
|   |   |   └── *.jpg
|   |   └── replies/ <-- All replies to posts will be stored here as text to be loaded onto the pages
|   |       └── *.txt
|   └── scripts/ <------ Stores all JavaScript files
|       └── *.js
├── config.js
├── database.js
├── sqlite.db
├── README.md
└── server.js
```

---

## API Paths (WIP)

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

The specification is to build a tool that university students can use. But I see no reason I can't try and open it up to students at any level.

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

I also think I could implement a system where users can tag their work with custom tags for more specific areas of study. I need to look into that a bit more.

---

## Progress Tracker

- [ ] 1) Have a welcome page with Google login button
- [ ] 2) Have an account page that shows you your profile information
- [ ] 3) Have a page where users can view their current groups and search for public groups to join
- [ ] 4) Have a 'News Feed' where users can view work that has been made available to them through their groups
- [ ] 5) Have a page that opens your selected work and shows replies on it
