// Element1, Element2, Element3, Surface1, Surface2, Surface3, Primary, Secondary, Tertiary
// https://colorhunt.co/palettes/dark

/* global gapi initPage */

const root = document.documentElement;
let userProfile;
let currentColourMode = localStorage.getItem('LPRS_colourMode') || 'dark';

initialise();

function initialise() {
  root.setAttribute('colour-mode', currentColourMode);
  // Add NavBar to each page
  fillNavBar();
}

function fillNavBar() {
  const navBarContainer = document.getElementById('navBar');
  const logInOutContainer = document.createElement('div');
  logInOutContainer.id = 'logInOutContainer';
  const profileContainer = document.createElement('div');
  profileContainer.id = 'profileButton';
  profileContainer.classList.add('nav-button', 'selectable');
  const profilePic = document.createElement('img');
  profilePic.id = 'profilePic';
  profilePic.src = '/profile-pic/u/';
  const usernameContainer = document.createElement('div');
  usernameContainer.id = 'usernameContainer';
  usernameContainer.textContent = 'Login/Sign Up!';
  profileContainer.appendChild(profilePic);
  profileContainer.appendChild(usernameContainer);
  logInOutContainer.appendChild(profileContainer);

  const darkModeToggle = document.createElement('div');
  darkModeToggle.id = 'darkModeToggle';
  darkModeToggle.classList.add('nav-button', 'selectable');
  darkModeToggle.textContent = 'Toggle Dark Mode';

  const groupsLink = document.createElement('a');
  groupsLink.href = '/groups';
  const groupsButton = document.createElement('div');
  groupsButton.id = 'groupsButton';
  groupsButton.classList.add('nav-button', 'selectable');
  groupsButton.textContent = 'Groups';
  groupsLink.appendChild(groupsButton);

  const feedLink = document.createElement('a');
  feedLink.href = '/';
  const feedButton = document.createElement('div');
  feedButton.id = 'feedButton';
  feedButton.classList.add('nav-button', 'selectable');
  feedButton.textContent = 'Feed';
  feedLink.appendChild(feedButton);

  const settingsLink = document.createElement('a');
  settingsLink.href = '/settings';
  const settingsButton = document.createElement('div');
  settingsButton.id = 'settingsButton';
  settingsButton.classList.add('nav-button', 'selectable');
  settingsButton.textContent = 'Settings';
  settingsLink.appendChild(settingsButton);

  navBarContainer.appendChild(logInOutContainer);
  navBarContainer.appendChild(darkModeToggle);
  navBarContainer.appendChild(groupsLink);
  navBarContainer.appendChild(feedLink);
  navBarContainer.appendChild(settingsLink);

  darkModeToggle.addEventListener('click', colourModeToggle);
}

async function getElementForFile(fileRoute) {
  // Take in an API route for a file and return an element which will display the file
  const idToken = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;

  const response = await fetch(fileRoute, {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    //  method: 'HEAD',
    credentials: 'same-origin',
  });
  if (!response.ok) {
    return;
  }
  const resData = await response.blob();
  const fileTypeList = response.headers.get('content-type').split('/');
  const container = document.createElement('div');
  const fileRouteSplit = fileRoute.split('/');
  const filename = fileRouteSplit[fileRouteSplit.length - 1];
  let fileContainer = false;
  if (fileTypeList[0] === 'image') {
    // File is image, use <img> tag
    fileContainer = document.createElement('img');
  } else if (fileTypeList[0] === 'video') {
    // File is video, use <video> tag
    fileContainer = document.createElement('video');
    fileContainer.controls = true;
  } else if (fileTypeList[0] === 'audio') {
    // File is audio, use <audio> tag
    fileContainer = document.createElement('audio');
  } else {
    // File is other, use <object> tag
    fileContainer = document.createElement('object');
    fileContainer.data = URL.createObjectURL(resData);
    fileContainer.innerHTML = `<h5>This browser doesn't support this file type.<br><a class='download-link' href='/doc/download/${filename}' download>Click Here</a> to download the file</h5>`;
    fileContainer.classList.add('file-container');
    container.appendChild(fileContainer);
    return container;
  }
  fileContainer.src = URL.createObjectURL(resData);
  fileContainer.classList.add('file-container');

  // If there was an error, replace file with download link
  fileContainer.addEventListener('error', () => {
    fileContainer.remove();
    container.innerHTML = `<h5>File failed to load.<br><a class='download-link' href='/doc/download/${filename}' download>Click Here</a> to download the file</h5>`;
  });

  container.appendChild(fileContainer);
  return container;
}

document.getElementById('profileButton').addEventListener('click', profileClicked);

function profileClicked() {
  // If not logged in, open google login
  if (!localStorage.getItem('LPRS_loggedIn')) {
    // Dispatch a click event on the hidden google button to open the menu
    document.getElementById('googleSignInButton').firstChild.click();
  } else {
    // If logged in and not already on profile, go to user profile page
    if (window.location.pathname !== '/profile' || window.location.search) {
      window.location.href = '/profile';
    }
  }
}

async function onSignIn(googleUser) {
  userProfile = googleUser.getBasicProfile();
  if (!localStorage.getItem('LPRS_loggedIn')) {
    localStorage.setItem('LPRS_loggedIn', 'true');
    location.reload();
    return;
  }
  const logInOutContainer = document.getElementById('logInOutContainer');
  const signOutHTML = '<p id="signOutButton"><a class="normal-link" onclick="signOut();">Sign out</a></p>';
  logInOutContainer.insertAdjacentHTML('beforeend', signOutHTML);

  const idToken = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;

  // Check if user has profile in the database
  let response = await fetch('/user/', {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    credentials: 'same-origin',
  });

  // If user profile not found, create one
  if (response.status === 404) {
    response = await fetch('/user/', {
      headers: {
        Authorization: 'Bearer ' + idToken,
      },
      credentials: 'same-origin',
      method: 'POST',
    });
    // let resData = await response.json();
    // console.log(resData);
  }

  // Retrieve user profile
  response = await fetch('/user/', {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    credentials: 'same-origin',
  });
  const resData = await response.json();
  userProfile = resData.data;

  document.getElementById('profilePic').src = '/profile-pic/u/' + userProfile.googleId;
  document.getElementById('usernameContainer').textContent = userProfile.displayName;

  try {
    initPage();
  } catch {}
}

function colourModeToggle() {
  switch (currentColourMode) {
    case 'light':
      currentColourMode = 'dark';
      break;
    case 'dark':
      currentColourMode = 'light';
      break;
  }
  localStorage.setItem('LPRS_colourMode', currentColourMode);
  root.setAttribute('colour-mode', currentColourMode);
}
window.addEventListener('load', () => {
  if (localStorage.getItem('LPRS_loggedIn')) {
    return;
  }

  try {
    initPage();
  } catch (e) {
    console.log(e);
  }
});

async function signOut() {
  await gapi.auth2.getAuthInstance().signOut();
  localStorage.removeItem('LPRS_loggedIn');
  window.location.href = '/';
  // update your page to show the user's logged out, or redirect elsewhere
}
