/* global gapi userProfile getElementForFile */

// Get document ID
const queryString = window.location.search;
const docId = queryString.substring(1);
const upperContent = document.getElementById('upperContent');
const lowerContent = document.getElementById('lowerContent');
let postData, currentDoc;

async function displayFile(docNum) {
  const documentContainer = await getElementForFile(docId, docNum);
  // If document is object, then add class
  // CSS has no selector to check if an element contains another,
  // therefore this is my workaround
  const docChild = documentContainer.firstChild;
  if (docChild.nodeName === 'OBJECT') {
    documentContainer.classList.add('contains-object');
    // PDFs hate literally everything so I'm making a manual resizeing function
    // Come back to this later. CSS needs .document-viewer.contains-object to have resize: vertical;
    /*
    const resizeObserver = new ResizeObserver((entries) => {
      // Get new dimensions
      const rect = entries[0].contentRect;
      const height = rect.height;
      console.log(entries[0].target.firstChild);
      entries[0].target.firstChild.style.height = height + 'px';
      console.log(entries[0].target.firstChild.style.height);
    });
    resizeObserver.observe(documentContainer);
    */
  }
  currentDoc = 0;
  if (docNum > 0) {
    documentContainer.classList.add('hidden');
  }
  documentContainer.classList.add('document-viewer');
  document.getElementById('documentContent').appendChild(documentContainer);
}

function initPage() {
  // If no document ID, cancel
  if (docId === '') {
    upperContent.innerHTML = '<h1>Post not found!</h1>';
    return;
  }
  addPost();
}

async function addPost() {
  // Get document info
  const idToken = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;

  const response = await fetch('/post/' + docId, {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    credentials: 'same-origin',
  });

  if (!response.ok) {
    upperContent.innerHTML = '<h1>Post not found!</h1>';
    return;
  }

  const resData = await response.json();
  postData = resData.data;

  // Create a container for the post
  const postContent = document.createElement('div');
  postContent.id = 'postContent';
  postContent.classList.add('feature-element');
  upperContent.appendChild(postContent);
  // Create header container
  const headerContainer = document.createElement('div');
  headerContainer.id = 'postHeaderContainer';
  postContent.appendChild(headerContainer);
  // Add post title
  const postTitleHeader = document.createElement('h1');
  postTitleHeader.id = 'postTitleHeader';
  postTitleHeader.textContent = postData.title;
  headerContainer.appendChild(postTitleHeader);
  // Add author information
  const authorContainer = document.createElement('div');
  authorContainer.id = 'postAuthorContainer';
  headerContainer.appendChild(authorContainer);
  // Add author name with link
  const authorLink = document.createElement('a');
  authorLink.classList.add('author-link');
  authorLink.href = '/profile?' + postData.author;
  const authorName = document.createElement('h3');
  authorName.textContent = postData.displayName;
  authorLink.appendChild(authorName);
  authorContainer.appendChild(authorLink);
  // Create a container for the files and their navigational arrows
  const documentContent = document.createElement('div');
  documentContent.id = 'documentContent';
  postContent.appendChild(documentContent);
  if (postData.files > 0) {
    // Add left arrow
    if (postData.files > 1) {
      const leftArrow = document.createElement('div');
      leftArrow.id = 'leftArrow';
      leftArrow.classList.add('button', 'scroll-arrow', 'hidden');
      leftArrow.innerHTML = '<h1>❮</h1>';
      documentContent.appendChild(leftArrow);
    }
    // Add files
    for (let i = 0; i < postData.files; i++) {
      await displayFile(i);
    }
    // Add right arrow
    if (postData.files > 1) {
      const rightArrow = document.createElement('div');
      rightArrow.id = 'rightArrow';
      rightArrow.classList.add('button', 'scroll-arrow');
      rightArrow.innerHTML = '<h1>❯</h1>';
      documentContent.appendChild(rightArrow);
    }
    try {
      // Add arrow event listeners
      leftArrow.addEventListener('click', documentScrolled);
      rightArrow.addEventListener('click', documentScrolled);
    } catch (e) {
      console.log(e);
    }
  }
  // Add post caption
  const postCaption = document.createElement('p');
  postCaption.id = 'postCaption';
  postCaption.innerText = postData.caption;
  postContent.appendChild(postCaption);
  // If the current user made the post
  if (userProfile && userProfile.googleId === postData.author) {
    // Add delete post button
    const postDeleteButton = document.createElement('div');
    postDeleteButton.id = 'postDeleteButton';
    postDeleteButton.classList.add('button');
    postDeleteButton.textContent = 'Delete Post';
    postContent.appendChild(postDeleteButton);
    postDeleteButton.addEventListener('click', deletePost);
  }
  // Add comments
  addComments();
}

async function addComments() {
  const commentsContainer = document.createElement('div');
  lowerContent.appendChild(commentsContainer);
  commentsContainer.appendChild(document.createElement('hr'));
  // Create container for flex purposes
  const createCommentFlexContainer = document.createElement('div');
  createCommentFlexContainer.classList.add('flex-container', 'comment-box');
  commentsContainer.appendChild(createCommentFlexContainer);
  // Create new comment field
  const createCommentContainer = document.createElement('div');
  createCommentContainer.id = 'userCommentContainer';
  createCommentContainer.classList.add('comment-container', 'feature-element');
  createCommentFlexContainer.appendChild(createCommentContainer);
  // Create div for flex purposes
  const createCommentTop = document.createElement('div');
  createCommentTop.id = 'userCommentTop';
  createCommentTop.classList.add('flex-container');
  createCommentContainer.appendChild(createCommentTop);
  // Insert profile picture
  const createCommentProfile = document.createElement('img');
  createCommentProfile.id = 'userCommentProfile';
  createCommentProfile.classList.add('profile-picture');
  createCommentProfile.src = '/profile-pic/u/';
  createCommentTop.appendChild(createCommentProfile);
  // Editable content
  const createCommentContent = document.createElement('div');
  createCommentContent.id = 'userCommentContent';
  createCommentContent.classList.add('comment-content-box');
  createCommentTop.appendChild(createCommentContent);
  // Post Comment Button
  const submitCommentButton = document.createElement('div');
  submitCommentButton.id = 'submitCommentButton';
  submitCommentButton.classList.add('button', 'highlight-element');
  submitCommentButton.textContent = 'Send';
  createCommentTop.appendChild(submitCommentButton);

  if (userProfile) {
    // Add profile picture
    createCommentProfile.src = '/profile-pic/u/' + userProfile.googleId;
    // If signed in, clicking your profile should take you to your profile
    createCommentProfile.classList.add('button');
    createCommentProfile.addEventListener('click', () => {
      window.location.href = '/profile';
    });
    // If signed in, then you can type a comment
    createCommentContent.setAttribute('contenteditable', true);
    // Add submit button event listener
    submitCommentButton.addEventListener('click', commentCreated);
  } else {
    // If not signed in, trying to make a comment should prompt sign in
    createCommentContent.classList.add('button');
    createCommentContent.addEventListener('click', () => {
      if (!localStorage.getItem('LPRS_loggedIn')) {
        // Dispatch a click event on the hidden google button to open the menu
        document.getElementById('googleSignInButton').firstChild.click();
      }
    });
  }

  // Get comments
  const idToken = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
  const response = await fetch('/comments/' + docId, {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    credentials: 'same-origin',
  });
  if (!response.ok || response.status === 204) {
    return;
  }
  const resData = await response.json();
  const comments = resData.data;
  comments.forEach(comment => {
    // Display comment
    // Create container for flex purposes
    const commentFlexContainer = document.createElement('div');
    commentFlexContainer.classList.add('comment-box');
    commentsContainer.appendChild(commentFlexContainer);
    // Create new comment field
    const commentContainer = document.createElement('div');
    commentContainer.classList.add('comment-container', 'feature-element');
    commentFlexContainer.appendChild(commentContainer);
    // Create div for flex purposes
    const commentTop = document.createElement('div');
    commentContainer.appendChild(commentTop);
    // Insert profile picture
    const commentProfile = document.createElement('div');
    commentProfile.classList.add('button', 'flex-container', 'user-profile');
    const commentProfilePic = document.createElement('img');
    commentProfilePic.classList.add('profile-picture');
    commentProfilePic.src = '/profile-pic/u/' + comment.author;
    commentProfile.appendChild(commentProfilePic);
    const commentUsername = document.createElement('a');
    commentUsername.textContent = comment.displayName;
    commentProfile.appendChild(commentUsername);
    commentTop.appendChild(commentProfile);
    // Comment content
    const commentContent = document.createElement('div');
    commentContent.classList.add('comment-content-box');
    commentContent.innerText = comment.content;
    commentTop.appendChild(commentContent);

    // Add profile link
    commentUsername.href = '/profile?' + comment.author;
    commentProfile.addEventListener('click', () => {
      window.location.href = '/profile?' + comment.author;
    });
  });
}

function documentScrolled(e) {
  // If left arrow
  if (e.target.id === 'leftArrow' || e.target.parentElement.id === 'leftArrow') {
    if (currentDoc <= 0) {
      // If at the end of the list, return
      return;
    } else {
      // Hide current document
      const documentList = document.getElementsByClassName('document-viewer');
      documentList[currentDoc].classList.add('hidden');
      // Unhide next document
      currentDoc -= 1;
      documentList[currentDoc].classList.remove('hidden');
      // Make sure right arrow is visible
      document.getElementById('rightArrow').classList.remove('hidden');
    }
    if (currentDoc <= 0) {
      // If now at start of list, hide left arrow
      document.getElementById('leftArrow').classList.add('hidden');
    }
  }
  // If right arrow
  if (e.target.id === 'rightArrow' || e.target.parentElement.id === 'rightArrow') {
    if (currentDoc >= postData.files - 1) {
      // If at the end of the list, return
      return;
    } else {
      // Hide current document
      const documentList = document.getElementsByClassName('document-viewer');
      documentList[currentDoc].classList.add('hidden');
      // Unhide next document
      currentDoc += 1;
      documentList[currentDoc].classList.remove('hidden');
      // Make sure left arrow is visible
      document.getElementById('leftArrow').classList.remove('hidden');
    }
    if (currentDoc >= postData.files - 1) {
      // If now at end of list, hide right arrow
      document.getElementById('rightArrow').classList.add('hidden');
    }
  }
}

async function commentCreated() {
  if (!userProfile) {
    return;
  }
  const replyContent = document.getElementById('userCommentContent').innerText;

  const data = {
    content: replyContent,
  };

  // Submit the comment
  const idToken = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
  const response = await fetch('/comment/' + docId, {
    headers: {
      'Authorization': 'Bearer ' + idToken,
      'Content-Type': 'application/json',
    },
    method: 'POST',
    credentials: 'same-origin',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const resData = await response.json();
    console.log(resData);
  }
  location.reload();
}

async function deletePost() {
  if (!userProfile) {
    return;
  }
  if (!window.confirm('Are you sure you want to delete this post?')) {
    return;
  }
  // Delete the post
  const idToken = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
  const response = await fetch('/post/' + docId, {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    method: 'DELETE',
    credentials: 'same-origin',
  });
  if (response.ok) {
    window.location.href = '/';
  }
}
