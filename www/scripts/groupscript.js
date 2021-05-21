/* global userProfile, idToken */

// Constant document values
const topSection = document.getElementById('topSection');
const htmlTitle = document.getElementById('pageTitle');
const groupDesc = document.getElementById('groupDesc');
let groupInfo;


const queryString = window.location.search;
const groupId = queryString.substring(1);

async function fillPage() {
  const isGroupFound = await getGroupInfo();
  // If user doesn't have access to group, return
  if (!isGroupFound) return;
  if (groupInfo.rank === 'owner') {
    // Load admin tools
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

async function loadAdminTools() {
  // Invite users via their email address
  // Toggle group public/private

}
