/* global idToken */
function addEventListeners() {
  // Add event listeners to tab selectors
  const tabMarkers = document.getElementsByClassName('tab-marker');
  for (let i = 0; i < tabMarkers.length; i++) {
    tabMarkers[i].addEventListener('click', tabClicked);
  }
  document.getElementById('createNewGroup').addEventListener('click', newGroupButtonClicked);
  document.getElementById('createNewGroupContent').addEventListener('submit', createNewGroup);
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
  // Populate user cohorts tab
  const userCohorts = await getCohorts();
  console.log(userCohorts);
  for (let i = 0; i < userCohorts.length; i++) {
    const group = userCohorts[i];
    // Create container element
    const groupContainer = document.createElement('div');
    groupContainer.classList.add('content-item', 'content-grid-container');
    const groupName = document.createElement('p');
    groupName.classList.add('title');
    const groupLink = document.createElement('a');
    groupLink.href = '/group?' + group.cohortId;
    groupLink.textContent = group.name;
    groupName.appendChild(groupLink);
    groupContainer.appendChild(groupName);

    const groupDesc = document.createElement('p');
    groupDesc.textContent = group.description;
    groupDesc.classList.add('group-desc');
    groupContainer.appendChild(groupDesc);

    document.getElementById('groupsView').appendChild(groupContainer);
    // Add event listener to expand group details
    groupContainer.addEventListener('click', groupItemClicked);
  }
  // Populate user posts tab

  // Populate user assignments tab
}

async function getCohorts() {
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

addEventListeners();
