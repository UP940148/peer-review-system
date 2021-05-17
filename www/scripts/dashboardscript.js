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
  // Get user
}

addEventListeners();
