/* global userProfile, profileButtonClicked */

function fillPage() {
  if (userProfile) {
    window.location.href = '/dashboard';
  }
}

document.getElementById('loginLink').addEventListener('click', profileButtonClicked);
