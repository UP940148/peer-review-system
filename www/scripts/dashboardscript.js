function addEventListeners() {
  // Add event listeners to tab selectors
  const tabMarkers = document.getElementsByClassName('tab-marker');
  for (let i = 0; i < tabMarkers.length; i++) {
    tabMarkers[i].addEventListener('click', tabClicked);
  }
}

function tabClicked(e) {
  // Make sure target is the div element rather than a child of
  let target = e.target;
  if (target.nodeName !== 'DIV') {
    target = e.target.parentElement;
  }
  // Don't do anything if current tab is clicked
  if (target.classList.contains('selectable')) {
    const selectedTab = document.getElementsByClassName('selected-tab')[0];
    // Deselect current tab
    selectedTab.classList.remove('selected-tab');
    selectedTab.classList.add('selectable');
    // Select new tab
    target.classList.remove('selectable');
    target.classList.add('selected-tab');
  }
}

addEventListeners();
