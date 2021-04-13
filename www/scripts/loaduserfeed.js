/* global getElementForFile gapi */

const newsFeedContainer = document.getElementById('newsFeed');

const documentList = [
  {
    id: 0,
    group: 'Public',
    groupId: '0',
    title: 'Picture 1',
    description: 'This is a test post',
    author: 'Lennie',
    authorId: '104861837073323726468',
    file: '89024931_302218764085505_5568612806514704384_n.jpg',
  },
  {
    id: 1,
    group: 'Public',
    groupId: '0',
    title: 'Picture 2',
    description: 'This is another test post',
    author: 'Daniel',
    authorId: '12345',
    file: '123634642_1657565107759887_2531456001333406319_n.jpg',
  },
  {
    id: 2,
    group: 'Public',
    groupId: '0',
    title: 'Picture 3',
    description: 'This is yet another test post',
    author: 'up940148',
    authorId: '987654321',
    file: '420.png',
  },
  {
    id: 3,
    group: 'Public',
    groupId: '0',
    title: 'DBPRIN Submission 4',
    description: "It's awful",
    author: 'UP940148',
    authorId: '987654321',
    file: '6969.pdf',
  },
];
let newPostFiles = [];

function getNextPosts(offset) {
  return documentList;
}

async function appendPosts(listOfPosts) {
  // Was using forEach(...), but it had issues with async await
  for (let i = 0; i < listOfPosts.length; i++) {
    const post = listOfPosts[i];
    const newContainer = document.createElement('div');
    newContainer.className = 'news-item feature-element';
    newContainer.setAttribute('post', post.id);

    // Add title
    const newTitle = document.createElement('h1');
    const newTitleLink = document.createElement('a');
    newTitleLink.href = `/post?${post.file}`;
    newTitleLink.textContent = post.title;
    newTitle.appendChild(newTitleLink);

    // Container for group and author
    const postedContainer = document.createElement('h4');
    // Add group link
    const groupLink = document.createElement('a');
    groupLink.classList.add('post-link');
    groupLink.href = '/group?' + post.groupId;
    // Have group picture contained in link
    const groupImage = document.createElement('img');
    groupImage.classList.add('group-pic');
    groupImage.src = '/profile-pic/g/' + post.image;
    groupLink.appendChild(groupImage);
    // Add group name to link
    const groupName = document.createElement('span');
    groupName.textContent = post.group;
    groupLink.appendChild(groupName);
    postedContainer.appendChild(groupLink);
    // Non-link text to connect group and author
    const authorConnector = document.createElement('span');
    authorConnector.textContent = ' | By ';
    postedContainer.appendChild(authorConnector);
    // Add author name with link
    const authorLink = document.createElement('a');
    authorLink.classList.add('post-link');
    authorLink.href = '/profile?' + post.authorId;
    authorLink.textContent = post.author;
    postedContainer.appendChild(authorLink);

    // Add description
    const newDesc = document.createElement('p');
    newDesc.classList.add('post-description');
    newDesc.textContent = post.description;

    const innerDoc = await getElementForFile(`/doc/${post.file}`);

    newContainer.appendChild(postedContainer);
    newContainer.appendChild(newTitle);
    newContainer.appendChild(newDesc);
    newContainer.appendChild(innerDoc);
    newsFeedContainer.appendChild(newContainer);
  }
}

function initPage() {
  appendPosts(getNextPosts(0));
  // Remove link but make it scroll user to top of page
  document.getElementById('feedButton').parentElement.removeAttribute('href');
  document.getElementById('feedButton').addEventListener('click', () => {
    window.scrollTo(0, 0);
  });
  resetFileInput();
}
/* exported initPage */

function handleFileSelect(e) {
  // Get the file and read it so it can be displayed
  const file = e.target.files[0];
  const fileSizeInMB = file.size / (1024 * 1024);
  if (fileSizeInMB >= 30) {
    alert('Max file size is 30MB!');
    return;
  }
  const reader = new FileReader();
  reader.readAsDataURL(file);

  reader.onload = function () {
    /*
      When the reader has loaded the file,
      attempt to append the file to the list and display it on screen
    */
    try {
      createNewFileHolder(reader);
      newPostFiles.push(file);
      checkReadyFileCount();
    } catch (e) {
      console.log(e);
    }
    resetFileInput();
  };
}

function createNewFileHolder(file) {
  const mainContainer = document.getElementById('filesToUpload');
  const itemContainer = document.createElement('div');
  itemContainer.classList.add('preview-container');
  // Display document
  const item = document.createElement('embed');
  item.classList.add('file-container', 'preview-file');
  item.src = file.result;
  itemContainer.appendChild(item);
  // Create delete button for file
  const deleteButton = document.createElement('div');
  deleteButton.classList.add('button', 'file-delete-button');
  deleteButton.textContent = 'Delete';
  itemContainer.appendChild(deleteButton);
  mainContainer.appendChild(itemContainer);

  const currentFileNum = newPostFiles.length;
  deleteButton.addEventListener('click', (e) => {
    removeFileFromPost(e.target, currentFileNum);
  });
}

document.getElementById('newPostSubmit').addEventListener('click', submitPost);

async function submitPost() {
  // Submit the post
  const idToken = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
  // Add all files to the FormData
  const fileData = new FormData();
  newPostFiles.forEach(file => {
    if (file) {
      fileData.append('document', file);
    }
  });

  let fileListString = '';
  // If any files were included, post them
  if (fileData.get('document')) {
    // Send Request
    const response = await fetch('/docs/', {
      headers: {
        Authorization: 'Bearer ' + idToken,
      },
      method: 'POST',
      credentials: 'same-origin',
      body: fileData,
    });

    const resData = await response.json();

    fileListString = resData.data.toString();
  }

  // Create new post here
  const data = {
    title: document.getElementById('newPostTitle').textContent,
    caption: document.getElementById('newPostDesc').textContent,
    groupId: document.getElementById('newPostGroup').value,
    files: fileListString,
  };

  const response = await fetch('/post/', {
    headers: {
      'Authorization': 'Bearer ' + idToken,
      'Content-Type': 'application/json',
    },
    method: 'POST',
    credentials: 'same-origin',
    body: JSON.stringify(data),
  });

  console.log(response);
  const resData = await response.json();
  console.log(resData);

  // Reset the new post container
  document.getElementById('newPostTitle').textContent = '';
  document.getElementById('newPostDesc').textContent = '';

  const container = document.getElementById('filesToUpload');
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
  newPostFiles = [];
  checkReadyFileCount();
}

// Check how many files are prepped to be posted so a limit can be enforced
function checkReadyFileCount() {
  const container = document.getElementById('filesToUpload');
  // Show or hide new file upload button
  if (container.childNodes.length >= 5) {
    document.getElementById('addNewFile').hidden = true;
  } else {
    document.getElementById('addNewFile').hidden = false;
  }
}

function removeFileFromPost(target, fileNum) {
  target.parentElement.remove();
  newPostFiles[fileNum] = undefined;
  checkReadyFileCount();
}

function resetFileInput() {
  // Delete file input if it exists
  let fileUploader = document.getElementById('fileInput');
  if (fileUploader) {
    fileUploader.remove();
  }

  // Create new file input
  const html = "<input id='fileInput' type='file' accept='image/*, audio/*, .pdf' hidden>";
  document.getElementById('newPostFileContainer').insertAdjacentHTML('afterbegin', html);

  // Add event listener again
  fileUploader = document.getElementById('fileInput');
  fileUploader.addEventListener('change', handleFileSelect);
}
