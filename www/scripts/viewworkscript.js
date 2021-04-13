/* global getElementForFile */

async function populateDocumentFromURL() {
  const queryString = window.location.search;
  const docId = queryString.substring(1);

  const documentContainer = await getElementForFile(`/post/${docId}/0/`);
  document.getElementById('pageContent').appendChild(documentContainer);
}

function initPage() {
  populateDocumentFromURL();
}
