/* global userProfile, idToken */

// Constant document values
const topSection = document.getElementById('topSection');
const htmlTitle = document.getElementById('pageTitle');
const groupDesc = document.getElementById('groupDesc');
let groupInfo;


const queryString = window.location.search;
const groupId = queryString.substring(1);

async function fillPage() {
  await getGroupInfo();
  // If user doesn't have access to group, return
  if (!groupInfo) return;
  if (groupInfo.rank === 'owner' || groupInfo.rank === 'admin') {
    // Set up admin tools
    loadAdminTools();
  }
  // Add posts and stuffs
}

async function getGroupInfo() {
  // Attempt to retrieve group from database
  const groupResponse = await fetch('/cohort/' + groupId, {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    credentials: 'same-origin',
    method: 'GET',
  });
  // If group not found, display 404 and return
  if (!groupResponse.ok) {
    document.title = '404: Group not found';
    htmlTitle.textContent = '404: Group not found';
    return;
  }
  let resData = await groupResponse.json();
  groupInfo = resData.data;
  // Set up page titles
  document.title = groupInfo.name;
  htmlTitle.textContent = groupInfo.name;
  groupDesc.textContent = groupInfo.description;

  if (!userProfile) return;

  // Get user rank
  const rankResponse = await fetch('/registration/' + groupId, {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    credentials: 'same-origin',
    method: 'GET',
  });
  resData = await rankResponse.json();
  groupInfo.rank = resData.rank;

  if (groupInfo.rank === 'guest') {
    const joinBtn = document.createElement('button');
    joinBtn.id = 'joinGroup';
    joinBtn.textContent = 'Join Group!';
    joinBtn.addEventListener('click', joinGroup);
    topSection.appendChild(joinBtn);
  }
}

async function joinGroup() {
  const response = await fetch('/register/' + groupId, {
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
  window.location.reload();
}

function loadAdminTools() {
  document.getElementById('groupAdminTools').classList.toggle('hidden');
  document.getElementById('updateGroupName').value = groupInfo.name;
  document.getElementById('updateGroupDesc').value = groupInfo.description;
  document.getElementById('groupPrivate').checked = groupInfo.isPrivate;

  document.getElementById('toggleUpdateGroupMenu').addEventListener('click', toggleUpdateMenu);
  document.getElementById('updateGroup').addEventListener('submit', updateGroupDetails);
  document.getElementById('inviteUsers').addEventListener('submit', inviteUsers);
  // Invite users via their username
  // Toggle group public/private
}

function toggleUpdateMenu() {
  document.getElementById('updateGroup').classList.toggle('hidden');
}

async function updateGroupDetails(e) {
  e.preventDefault();
  const formData = new FormData(document.getElementById('updateGroup'));
  console.log(formData.get('cohortName'));
  console.log(formData.get('cohortDesc'));
  console.log(formData.get('isPrivate'));

  const response = await fetch('/cohort/' + groupId, {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    credentials: 'same-origin',
    method: 'POST',
    body: formData,
  });
  if (response.ok) location.reload();
}

async function inviteUsers(e) {
  e.preventDefault();
  const formData = new FormData(document.getElementById('inviteUsers'));
  const response = await fetch('/invite/' + groupId, {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    credentials: 'same-origin',
    method: 'POST',
    body: formData,
  });
  document.getElementById('inviteUsernames').value = '';
  if (!response.ok) {
    window.alert('Something went wrong');
  } else {
    location.reload();
  }
}
