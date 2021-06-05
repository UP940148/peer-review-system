/* global userProfile, idToken, signOut */

const profileForm = document.getElementById('profileForm');
profileForm.addEventListener('submit', updateDetails);
const submitButton = document.querySelector('#profileForm > .profile-submit');
document.getElementById('usernameField').addEventListener('focusout', checkValidUsername);
document.getElementById('signOutLink').addEventListener('click', signOut);

const queryString = window.location.search;
const profileId = queryString.substring(1);
/* eslint-disable no-unused-vars */
function fillPage() {
  /* eslint-enable no-unused-vars */
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
  document.getElementById('mainProfilePic').src = '/profile-pic/' + userProfile.userId;
}

async function updateDetails(e) {
  e.preventDefault();
  if (e.submitter !== submitButton) {
    return;
  }

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
}


document.getElementById('deletePictureBtn').addEventListener('click', deleteProfilePic);

async function deleteProfilePic() {
  await fetch('/profile-pic/', {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    credentials: 'same-origin',
    method: 'DELETE',
  });

  // Set pictures back to default
  document.getElementById('profilePic').src = '/profile-pic/';
  document.getElementById('mainProfilePic').src = '/profile-pic/';
}

const fileInput = document.getElementById('pictureFileInput');
document.getElementById('mainPicContainer').addEventListener('click', () => {
  fileInput.click();
});
fileInput.addEventListener('change', uploadPicture);

async function uploadPicture(e) {
  const file = e.target.files[0];
  const fileSizeInMB = file.size / (1024 * 1024);
  if (fileSizeInMB >= 25) {
    alert('Max file size is 25MB!');
    return;
  }

  const formData = new FormData();
  formData.append('picture', file);
  await fetch('/profile-pic/', {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    credentials: 'same-origin',
    body: formData,
    method: 'PATCH',
  });

  // Create new picture elements
  const newProfilePic = document.createElement('img');
  newProfilePic.id = 'profilePic';
  newProfilePic.classList.add('profile-picture');

  const newMainProfilePic = document.createElement('img');
  newMainProfilePic.id = 'mainProfilePic';
  newMainProfilePic.classList.add('profile-image');

  document.getElementById('profilePic').remove();
  document.getElementById('mainProfilePic').remove();

  // Insert new pictures
  const profileButton = document.getElementById('profileButton');
  const picContainer = document.getElementById('mainPicContainer');

  profileButton.insertBefore(newProfilePic, profileButton.childNodes[0]);
  picContainer.appendChild(newMainProfilePic);

  newProfilePic.src = '/profile-pic/' + userProfile.userId + '?' + new Date().getTime();
  newMainProfilePic.src = '/profile-pic/' + userProfile.userId + '?' + new Date().getTime();
}
