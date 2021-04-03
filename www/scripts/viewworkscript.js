const documentContainer = document.getElementById('userFile');

function populateDocumentFromURL() {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const docId = urlParams.get('doc');

  documentContainer.src = `/work/d/${docId}`;
}

populateDocumentFromURL();
