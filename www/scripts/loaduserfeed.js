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
}
/* exported initPage */


// Handle file input
const fileUploader = document.getElementById('fileInput');

fileUploader.addEventListener('change', handleFileSelect);

function handleFileSelect(e) {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = function () {
    createNewFileHolder(reader);
  };
  const data = new FormData();
  console.log(data);
  // data.append('document', file);

  // const idToken = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;

  // const response = await fetch('/doc/', {
  //   headers: {
  //     Authorization: 'Bearer ' + idToken,
  //   },
  //   credentials: 'same-origin',
  //   method: 'POST',
  //   body: data,
  // });
  // const resData = await response.json();
  // console.log(resData);
}

function createNewFileHolder(file) {
  const container = document.getElementById('newPostFileContainer');
  const item = document.createElement('object');
  item.classList.add('file-container');
  item.data = file.result;
  container.appendChild(item);
}
