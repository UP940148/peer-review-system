/* global gapi getElementForFile */

// Get document ID
const queryString = window.location.search;
const docId = queryString.substring(1);
const pageContent = document.getElementById('pageContent');
let postData, currentDoc;

async function displayFile(docNum) {
  const documentContainer = await getElementForFile(docId, docNum);
  currentDoc = 0;
  if (docNum > 0) {
    documentContainer.classList.add('hidden');
  }
  documentContainer.classList.add('document-viewer');
  document.getElementById('postContent').appendChild(documentContainer);
}

async function initPage() {
  // If no document ID, cancel
  if (docId === '') {
    pageContent.innerHTML = '<h1>Post not found!</h1>';
  }
  // Get document info
  const idToken = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;

  const response = await fetch('/post/' + docId, {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    credentials: 'same-origin',
  });

  const resData = await response.json();
  postData = resData.data;

  const postContent = document.createElement('div');
  postContent.id = 'postContent';
  postContent.classList.add('feature-element');
  pageContent.appendChild(postContent);
  if (postData.files > 0) {
    // Add left arrow
    if (postData.files > 1) {
      const leftArrow = document.createElement('div');
      leftArrow.id = 'leftArrow';
      leftArrow.classList.add('button', 'scroll-arrow', 'background-element', 'hidden');
      leftArrow.innerHTML = '<h1>❮</h1>';
      postContent.appendChild(leftArrow);
    }
    // Add files
    for (let i = 0; i < postData.files; i++) {
      await displayFile(i);
    }
    // Add right arrow
    if (postData.files > 1) {
      const rightArrow = document.createElement('div');
      rightArrow.id = 'rightArrow';
      rightArrow.classList.add('button', 'scroll-arrow', 'background-element');
      rightArrow.innerHTML = '<h1>❯</h1>';
      postContent.appendChild(rightArrow);
    }
    try {
      // Add arrow event listeners
      leftArrow.addEventListener('click', documentScrolled);
      rightArrow.addEventListener('click', documentScrolled);
    } catch (e) {
      console.log(e);
    }
  }
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
