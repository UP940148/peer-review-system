/* global userProfile */

const profileBanner = document.getElementById('profileBanner');
const profileContent = document.getElementById('profileContent');

const queryString = window.location.search;
const profileId = queryString.substring(1);

function redirect() {
  // Redirect if selected profile is own
  if (userProfile) {
    if (profileId === userProfile.googleId) {
      window.history.pushState('', '', '/profile');
    }
  }
}

function initPage() {
  redirect();
  if (window.location.search === '') {
    loadOwnProfile();
  } else {
    loadUserProfile();
  }
}

function loadOwnProfile() {
  // Fetch profile information
  // Already covered in globalscripts.js

  // Display profile information
  const profilePicContainer = document.createElement('div');
  profilePicContainer.id = 'profilePicContainer';
  // Add invisible file input
  const fileInputHTML = "<input id='fileInput' type='file' accept='image/*' hidden>";
  profilePicContainer.insertAdjacentHTML('afterbegin', fileInputHTML);
  // Add profile picture to page
  const profilePic = document.createElement('img');
  profilePic.id = 'mainProfilePic';
  profilePic.src = '/profile-pic/u/' + userProfile.googleId;
  // Add button to update profile picture
  const updatePicButton = document.createElement('div');
  updatePicButton.id = 'updatePicButton';
  updatePicButton.classList.add('button', 'profile-button');
  updatePicButton.innerHTML = '<h2>Update Picture</h2>';
  // Add button to delete profile picture
  const deletePicButton = document.createElement('div');
  deletePicButton.id = 'deletePicButton';
  deletePicButton.classList.add('button', 'profile-button');
  deletePicButton.innerHTML = '<h2>Delete Picture</h2>';
  // Add picture and buttons to container
  profilePicContainer.appendChild(profilePic);
  profilePicContainer.appendChild(updatePicButton);
  profilePicContainer.appendChild(deletePicButton);

  // Create vertical border
  const borderElement = document.createElement('div');
  borderElement.classList.add('vertical-border');

  // Create profile information container
  const profileDetailsContainer = document.createElement('div');
  profileDetailsContainer.id = 'profileDetailsContainer';
  // Add profile details
  // Should be content editable
  // Add username
  const profileUsernameContainer = document.createElement('div');
  profileUsernameContainer.id = 'profileUsernameContainer';
  profileUsernameContainer.classList.add('profile-details-container');
  profileUsernameContainer.innerHTML = '<p>Username:</p>';
  const profileUsername = document.createElement('input');
  profileUsername.id = 'profileUsername';
  profileUsername.classList.add('profile-details');
  profileUsername.placeholder = 'Username... (Max 25 characters)';
  profileUsername.setAttribute('maxlength', 25);
  profileUsername.value = userProfile.displayName;
  profileUsernameContainer.appendChild(profileUsername);
  // Add name
  const profileNameContainer = document.createElement('div');
  profileNameContainer.id = 'profileNameContainer';
  profileNameContainer.classList.add('profile-details-container');
  profileNameContainer.innerHTML = '<p>Name:</p>';
  const profileName = document.createElement('input');
  profileName.id = 'profileName';
  profileName.classList.add('profile-details');
  profileName.placeholder = 'Name...';
  profileName.value = userProfile.name;
  profileNameContainer.appendChild(profileName);
  // Add email
  const profileEmailContainer = document.createElement('div');
  profileEmailContainer.id = 'profileEmailContainer';
  profileEmailContainer.classList.add('profile-details-container');
  profileEmailContainer.innerHTML = '<p>Email:</p>';
  const profileEmail = document.createElement('input');
  profileEmail.id = 'profileEmail';
  profileEmail.classList.add('profile-details');
  profileEmail.disabled = true;
  profileEmail.value = userProfile.email;
  profileEmailContainer.appendChild(profileEmail);
  // Display details
  profileDetailsContainer.appendChild(profileUsernameContainer);
  profileDetailsContainer.appendChild(profileNameContainer);
  profileDetailsContainer.appendChild(profileEmailContainer);

  // Save Changes Button
  const saveChangesButton = document.createElement('div');
  saveChangesButton.id = 'saveChangesButton';
  saveChangesButton.classList.add('button', 'profile-button');
  saveChangesButton.innerHTML = '<h2>Save Changes</h2>';
  profileDetailsContainer.appendChild(saveChangesButton);

  // Display content on page
  profileBanner.appendChild(profilePicContainer);
  profileBanner.appendChild(borderElement);
  profileBanner.appendChild(profileDetailsContainer);

  // Add event listeners
  const fileInput = document.getElementById('fileInput');
  updatePicButton.addEventListener('click', () => {
    fileInput.click();
  });
  deletePicButton.addEventListener('click', deleteProfilePic);
  saveChangesButton.addEventListener('click', updateProfile);
  fileInput.addEventListener('change', uploadProfilePic);

  // Log out link
  const bannerContainer = document.getElementById('profileBanner').parentElement;
  const signOutHTML = '<h4><a onclick="signOut();">Sign out</a></h4>';
  bannerContainer.insertAdjacentHTML('beforebegin', signOutHTML);

  // Fetch own posts

  // Display posts
}

async function loadUserProfile() {
  // Get profile information
  const response = await fetch('/user/' + profileId);
  if (!response.ok) {
    // 404 Not Found
    console.log(404);
    const errorMessage = document.createElement('h1');
    errorMessage.textContent = 'Profile not found';
    profileBanner.appendChild(errorMessage);
    return;
  }
  const resData = await response.json();
  const profileInfo = resData.data;
  //window.history.pushState('', '', '/profile?' + profileInfo.displayName);

  // Display profile information
  const profilePicContainer = document.createElement('div');
  profilePicContainer.id = 'profilePicContainer';
  // Add profile picture to page
  const profilePic = document.createElement('img');
  profilePic.id = 'mainProfilePic';
  profilePic.classList.add('other-profile');
  profilePic.src = '/profile-pic/u/' + profileId;
  profilePicContainer.appendChild(profilePic);

  profileBanner.appendChild(profilePicContainer);
}

async function uploadProfilePic(e) {
  const file = e.target.files[0];
  const fileSizeInMB = file.size / (1024 * 1024);
  if (fileSizeInMB >= 30) {
    alert('Max file size is 30MB!');
    return;
  }
  // Upload file
  const idToken = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
  const data = new FormData();
  data.append('picture', file);
  // Send Request
  const response = await fetch('/profile-pic/', {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    method: 'POST',
    credentials: 'same-origin',
    body: data,
  });
  const resData = await response.json();
  console.log(resData);
  location.reload();
}

async function deleteProfilePic() {
  if (!confirm('Delete profile picture?')) {
    return;
  }
  const idToken = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
  // Send Request
  await fetch('/profile-pic/', {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    method: 'DELETE',
    credentials: 'same-origin',
  });
  location.reload();
}

async function updateProfile() {
  const nameField = document.getElementById('profileName');
  const usernameField = document.getElementById('profileUsername');
  const name = nameField.value;
  const displayName = usernameField.value;
  // Check data valid
  if (displayName.length > 25) {
    nameField.value = userProfile.name;
    usernameField.value = userProfile.displayName;
    alert('Username must be less than 25 characters!');
    return;
  }
  // Send request
  const idToken = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
  const data = {
    name: name,
    displayName: displayName,
  };
  const response = await fetch('/user/', {
    headers: {
      'Authorization': 'Bearer ' + idToken,
      'Content-Type': 'application/json',
    },
    method: 'PATCH',
    credentials: 'same-origin',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const resData = await response.json();
    console.log(resData);
  }
  location.reload();
}
