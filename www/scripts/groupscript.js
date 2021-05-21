/* global idToken */

// Constant document values
const htmlTitle = document.getElementById('pageTitle');
const groupDesc = document.getElementById('groupDesc');


const queryString = window.location.search;
const groupId = queryString.substring(1);
console.log(groupId);

function fillPage() {
  loadGroupInfo();
}

async function loadGroupInfo() {
  // Attempt to retrieve group from database
  const response = await fetch('/cohort/' + groupId, {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    credentials: 'same-origin',
    method: 'GET',
  });
  // If group not found, display 404 and return
  if (!response.ok) {
    console.log(404);
    document.title = '404: Group not found';
    htmlTitle.textContent = '404: Group not found';
    return;
  }
  const resData = await response.json();
  const groupInfo = resData.data;
  // Set up page titles
  document.title = groupInfo.name;
  htmlTitle.textContent = groupInfo.name;
  groupDesc.textContent = groupInfo.description;

  // Populate page
}
