/* global userProfile, idToken */

if (!localStorage.getItem('LPRS_loggedIn')) {
  window.location.href = '/';
}

const groupsView = document.getElementById('groupsView');
const postsView = document.getElementById('postsView');

function addEventListeners() {
  // Add event listeners to tab selectors
  const tabMarkers = document.getElementsByClassName('tab-marker');
  for (let i = 0; i < tabMarkers.length; i++) {
    tabMarkers[i].addEventListener('click', tabClicked);
  }
  document.getElementById('createNewGroup').addEventListener('click', newGroupButtonClicked);
  document.getElementById('createNewGroupContent').addEventListener('submit', createNewGroup);
  document.getElementById('groupInvitesButton').addEventListener('click', invitesButtonClicked);
  document.getElementById('joinedGroupSearch').addEventListener('keyup', searchJoinedGroups);
  document.getElementById('newGroupSearch').addEventListener('keyup', searchNewGroups);
}

function tabClicked(e) {
  // Make sure target is the div element rather than a child of
  let target = e.target;
  if (target.nodeName !== 'DIV') {
    target = e.target.parentElement;
  }
  // Don't do anything if current tab is clicked
  if (target.classList.contains('selectable')) {
    // Deselect current tab
    const selectedTab = document.getElementsByClassName('selected-tab')[0];
    selectedTab.classList.remove('selected-tab');
    selectedTab.classList.add('selectable');
    const selectedView = selectedTab.getAttribute('linksTo');
    document.getElementById(selectedView).classList.add('hidden');

    // Select new tab
    target.classList.remove('selectable');
    target.classList.add('selected-tab');
    const targetView = target.getAttribute('linksTo');
    document.getElementById(targetView).classList.remove('hidden');
  }
}

function newGroupButtonClicked() {
  document.getElementById('createNewGroup').classList.add('hidden');
  document.getElementById('createNewGroupContent').classList.remove('hidden');
}

async function createNewGroup(e) {
  e.preventDefault();
  const formData = new FormData(document.getElementById('createNewGroupContent'));
  const response = await fetch('/cohort', {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    credentials: 'same-origin',
    method: 'POST',
    body: formData,
  });
  if (response.ok) location.reload();
}

async function fillPage() {
  // Clear records
  const recordList = document.getElementsByClassName('group-record');
  for (let i = 0; i < recordList.length; i++) {
    recordList[i].remove();
  }

  // Populate user cohorts tab
  const userCohorts = await getCohorts();
  for (let i = 0; i < userCohorts.length; i++) {
    const group = userCohorts[i];
    // Create container element
    const groupContainer = document.createElement('div');
    groupContainer.classList.add('group-record', 'content-item', 'content-grid-container');
    const groupName = document.createElement('p');
    groupName.classList.add('title');
    const groupLink = document.createElement('a');
    groupLink.classList.add('link');
    groupLink.href = '/group?' + group.cohortId;
    groupLink.textContent = group.name;
    groupName.appendChild(groupLink);
    groupContainer.appendChild(groupName);

    const groupDesc = document.createElement('p');
    groupDesc.textContent = group.description;
    groupDesc.classList.add('group-desc');
    groupContainer.appendChild(groupDesc);

    groupsView.appendChild(groupContainer);
    // Add event listener to expand group details
    groupContainer.addEventListener('click', groupItemClicked);
  }

  // Populate group invites
  const userInvites = await getGroupInvites();
  if (userInvites) {
    document.getElementById('groupInvitesButton').classList.remove('hidden');
    const inviteListContainer = document.getElementById('groupInvites');
    for (let i = 0; i < userInvites.length; i++) {
      const currentInvite = userInvites[i];
      console.log(currentInvite);
      // Add invite to page
      const inviteContainer = document.createElement('div');
      inviteContainer.classList.add('invite-grid-container', 'content-item');
      inviteListContainer.appendChild(inviteContainer);

      const inviteTitle = document.createElement('p');
      inviteTitle.classList.add('title');
      inviteTitle.textContent = currentInvite.name;
      inviteContainer.appendChild(inviteTitle);

      const inviteDesc = document.createElement('p');
      inviteDesc.classList.add('group-desc');
      inviteDesc.textContent = currentInvite.description;
      inviteContainer.appendChild(inviteDesc);

      const acceptBtn = document.createElement('button');
      acceptBtn.classList.add('accept-btn', 'selectable', 'invite-button');
      acceptBtn.textContent = 'Accept';
      inviteContainer.appendChild(acceptBtn);

      const declineBtn = document.createElement('button');
      declineBtn.classList.add('decline-btn', 'selectable', 'invite-button');
      declineBtn.textContent = 'Decline';
      inviteContainer.appendChild(declineBtn);

      // Add button event listeners

      acceptBtn.addEventListener('click', () => {
        inviteContainer.remove();
        acceptInvite(currentInvite.inviteId);
      });

      declineBtn.addEventListener('click', () => {
        inviteContainer.remove();
        declineInvite(currentInvite.inviteId);
      });
    }
  }

  // Populate user posts tab
  const userPosts = await getPosts();
  for (let i = 0; i < userPosts.length; i++) {
    const currentPost = userPosts[i];
    const postContainer = document.createElement('div');
    postContainer.classList.add('post-container', 'grid-container');
    postContainer.data = currentPost.postId;
    postsView.appendChild(postContainer);

    const profileContainer = document.createElement('div');
    profileContainer.classList.add('post-profile');
    postContainer.appendChild(profileContainer);

    const profileImg = document.createElement('img');
    profileImg.classList.add('post-profile-pic');
    profileImg.src = userProfile.picture;
    profileContainer.appendChild(profileImg);

    const username = document.createElement('p');
    username.classList.add('post-username');
    username.textContent = userProfile.username;
    profileContainer.appendChild(username);

    const postTitle = document.createElement('h2');
    postTitle.classList.add('post-title');
    postTitle.textContent = currentPost.title;
    postContainer.appendChild(postTitle);

    const postDesc = document.createElement('div');
    postDesc.classList.add('post-desc');
    postDesc.innerText = currentPost.description;
    postContainer.appendChild(postDesc);

    const postTime = document.createElement('p');
    postTime.classList.add('post-time');
    postTime.textContent = getDateStringFromUnix(currentPost.timeCreated);
    postContainer.appendChild(postTime);

    const linkButton = document.createElement('button');
    linkButton.classList.add('post-link');
    linkButton.textContent = 'Open Post';
    postContainer.appendChild(linkButton);

    // Add event listener to navigate to post page
    linkButton.addEventListener('click', () => {
      location.href = '/post?' + currentPost.postId;
    });
  }

  // Populate user assignments tab
}

async function getPosts() {
  if (!userProfile) return;
  // Fetch request to get user's posts
  const response = await fetch('/posts', {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    credentials: 'same-origin',
  });
  if (response.status !== 200) {
    return;
  }
  const resData = await response.json();
  return resData.data;
}

async function getCohorts() {
  if (!userProfile) return;
  // Fetch request to get user's cohorts
  const response = await fetch('/cohorts', {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    credentials: 'same-origin',
  });
  if (response.status !== 200) {
    return;
  }
  const resData = await response.json();
  return resData.data;
}

function groupItemClicked(e) {
  let target = e.target;
  if (target.nodeName !== 'DIV') target = target.parentElement;

  // Set all other items back to intended size
  const gridContainers = document.getElementsByClassName('content-grid-container');
  for (let i = 0; i < gridContainers.length; i++) {
    const container = gridContainers[i];
    for (let j = 0; j < container.childNodes.length; j++) {
      const node = container.childNodes[j];
      node.style.whiteSpace = 'nowrap';
    }
  }

  // Allow wrapping target content
  for (let i = 0; i < target.childNodes.length; i++) {
    const item = target.childNodes[i];
    item.style.whiteSpace = 'normal';
  }
}

function invitesButtonClicked() {
  document.getElementById('groupInvites').classList.toggle('hidden');
}

async function getGroupInvites() {
  if (!userProfile) return;
  const response = await fetch('/invites', {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    credentials: 'same-origin',
    method: 'GET',
  });
  if (response.status !== 200) {
    return;
  }
  const resData = await response.json();
  return resData.data;
}

async function acceptInvite(inviteId) {
  console.log('Accepting:', inviteId);
  const response = await fetch('/accept-invite/' + inviteId, {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    credentials: 'same-origin',
    method: 'POST',
  });
  if (!response.ok) {
    window.alert('Something went wrong');
    return;
  }
  // Hide invite list if empty
  const inviteContainer = document.getElementById('groupInvites');
  if (inviteContainer.childNodes.length === 0) {
    inviteContainer.classList.add('hidden');
    document.getElementById('groupInvitesButton').classList.add('hidden');
  }
  // Reload invite list
  // Reload group list
  fillPage();
}
async function declineInvite(inviteId) {
  console.log('Declining:', inviteId);
  const response = await fetch('/decline-invite/' + inviteId, {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    credentials: 'same-origin',
    method: 'DELETE',
  });
  if (!response.ok) {
    window.alert('Something went wrong');
    return;
  }
  // Hide invite list if empty
  const inviteContainer = document.getElementById('groupInvites');
  if (inviteContainer.childNodes.length === 0) {
    inviteContainer.classList.add('hidden');
    document.getElementById('groupInvitesButton').classList.add('hidden');
  }
}

function searchJoinedGroups(e) {
  const searchString = e.target.value.toUpperCase();
  // Get all group-record elements
  const groupRecords = document.getElementsByClassName('group-record');
  for (let i = 0; i < groupRecords.length; i++) {
    const record = groupRecords[i];
    // Compare search string to
    //  el > p1 > a.textContent
    //  el > p2.textContent
    const recordName = record.childNodes[0].childNodes[0].textContent.toUpperCase();
    const recordDesc = record.childNodes[1].textContent.toUpperCase();
    // If these are both equal to -1 then string not found
    const nameIndex = recordName.indexOf(searchString);
    const descIndex = recordDesc.indexOf(searchString);

    // If not found in either, hide record
    // Otherwise, show record
    const totalIndex = nameIndex + descIndex;
    if (totalIndex > -2) {
      record.classList.remove('hidden');
    } else {
      record.classList.add('hidden');
    }
  }
}

async function searchNewGroups(e) {
  const groupList = document.getElementById('findGroupsList');

  // Clear existing entries
  while (groupList.childNodes.length > 0) {
    groupList.firstChild.remove();
  }
  // If search string blank, show no results
  if (e.target.value === '') {
    groupList.classList.add('hidden');
    return;
  }

  // Encode string to allow it in query parameter
  const searchString = encodeURIComponent(e.target.value);

  const responses = await fetch('/cohorts/' + searchString, {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    credentials: 'same-origin',
    method: 'GET',
  });
  let results;
  if (responses.status === 204) {
    // Display no results
    results = 'No results';
    groupList.classList.add('hidden');
    return;
  } else {
    const resData = await responses.json();
    if (resData.results.length === 0) {
      results = 'No Results';
      groupList.classList.add('hidden');
      return;
    } else {
      results = resData.results;
    }
  }
  // Create new list entry for each result
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    // Create container
    const container = document.createElement('div');
    container.classList.add('group-record', 'content-item', 'content-grid-container');
    // Create title
    const title = document.createElement('p');
    title.classList.add('title');
    const anchor = document.createElement('a');
    anchor.classList.add('link');
    anchor.href = '/group?' + result.cohortId;
    anchor.textContent = result.name;
    title.appendChild(anchor);

    // Create description
    const desc = document.createElement('p');
    desc.classList.add('group-desc');
    desc.textContent = result.description;

    // Append all to main container
    container.appendChild(title);
    container.appendChild(desc);
    groupList.appendChild(container);
  }
  groupList.classList.remove('hidden');
}

addEventListeners();
