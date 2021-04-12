/* global getElementForFile */

async function populateDocumentFromURL() {
  const queryString = window.location.search;
  const docId = queryString.substring(1);

  const documentContainer = await getElementForFile(`/doc/${docId}`);
  document.getElementById('pageContent').appendChild(documentContainer);
}

function initPage() {
  populateDocumentFromURL();
}
