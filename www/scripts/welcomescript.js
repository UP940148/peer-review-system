/* global userProfile, profileButtonClicked */

/* eslint-disable no-unused-vars */
function fillPage() {
  /* eslint-enable no-unused-vars */
  if (userProfile) {
    window.location.href = '/dashboard';
  }
}

document.getElementById('loginLink').addEventListener('click', profileButtonClicked);
