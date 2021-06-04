/* global userProfile, idToken, signOut */

const profileForm = document.getElementById('profileForm');
profileForm.addEventListener('submit', updateDetails);
document.getElementById('usernameField').addEventListener('focusout', checkValidUsername);
document.getElementById('signOutLink').addEventListener('click', signOut);
document.getElementById('navSignOutLink').addEventListener('click', signOut);

const queryString = window.location.search;
const profileId = queryString.substring(1);

function fillPage() {
  profileForm.classList.remove('hidden');
  if (profileId === userProfile.userId) {
    window.history.pushState('', '', '/profile');
  }
  console.log(userProfile);
  // Populate page with user details
  document.getElementById('pageTitle').textContent = userProfile.username;
  document.getElementById('usernameField').value = userProfile.username;
  document.getElementById('nameField').value = userProfile.name;
  document.getElementById('emailField').value = userProfile.email;
}

async function updateDetails(e) {
  e.preventDefault();

  const formData = new FormData(profileForm);

  const usernameResponse = await fetch('/username/' + formData.get('newUsername'), {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    credentials: 'same-origin',
    method: 'GET',
  });
  if (!usernameResponse.ok) {
    console.log(usernameResponse);
    return;
  }

  const usernameData = await usernameResponse.json();
  if (!usernameData.unique) {
    return;
  }

  const response = await fetch('/user', {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    credentials: 'same-origin',
    body: formData,
    method: 'PATCH',
  });
  if (!response.ok) {
    console.log(response);
  } else {
    location.reload();
  }
}

async function checkValidUsername() {
  const username = document.getElementById('usernameField').value;
  const usernameResponse = await fetch('/username/' + username, {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    credentials: 'same-origin',
    method: 'GET',
  });
  if (!usernameResponse.ok) {
    console.log(usernameResponse);
    return;
  }

  const usernameData = await usernameResponse.json();
  if (!usernameData.unique) {
    document.getElementById('invalidUsernameAlert').classList.remove('hidden');
    document.querySelector('#profileForm > input').disabled = true;
  } else {
    document.getElementById('invalidUsernameAlert').classList.add('hidden');
    document.querySelector('#profileForm > input').disabled = false;
  }
};
