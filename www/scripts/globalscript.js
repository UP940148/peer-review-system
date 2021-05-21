/* global gapi, fillPage */

let userProfile, idToken;

function initialise() {
  const profileButton = document.getElementById('profileButton');
  profileButton.addEventListener('click', profileButtonClicked);
  try {
    fillPage();
  } catch {}
}


// Google Auth
async function onSignIn(googleUser) {
  idToken = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
  // Check if user has profile in the database
  let response = await fetch('/user', {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    credentials: 'same-origin',
  });


  // If user profile not found, create one
  if (response.status === 404) {
    response = await fetch('/user', {
      headers: {
        Authorization: 'Bearer ' + idToken,
      },
      credentials: 'same-origin',
      method: 'POST',
    });
  }

  // If user not logged in, reload page to grab their info
  if (!localStorage.getItem('LPRS_loggedIn')) {
    localStorage.setItem('LPRS_loggedIn', 'true');
    location.reload();
    return;
  }

  // Get user info from our database
  const resData = await response.json();
  userProfile = resData.data;

  // Update profile button
  document.getElementById('profilePic').src = userProfile.picture;
  document.getElementById('usernameContainer').classList.add('hidden');
  initialise();
}

async function signOut() {
  await gapi.auth2.getAuthInstance().signOut();
  localStorage.removeItem('LPRS_loggedIn');
  location.reload();
}

function profileButtonClicked() {
  // If not logged in, open google login
  if (!localStorage.getItem('LPRS_loggedIn')) {
    // Dispatch a click event on the hidden google button to open the menu
    document.getElementById('googleSignInButton').firstChild.click();
  } else {
    // Else load user profile page
    signOut();
  }
}

window.addEventListener('load', () => {
  if (localStorage.getItem('LPRS_loggedIn')) {
    return;
  }
  initialise();
});
