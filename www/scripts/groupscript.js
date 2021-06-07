/* global userProfile, idToken, getDateStringFromUnix */

// Prevent implicit form submission
document.addEventListener('keydown', (e) => {
  if (e.keyCode === 13 && e.target.tagName !== 'TEXTAREA') {
    e.preventDefault();
  }
});

const presetSelector = document.getElementById('presetSelect');
document.getElementById('createNewPost').addEventListener('click', openNewPostForm);
document.getElementById('newResponse').addEventListener('keyup', checkIfAddingNewResponse);
document.getElementById('createResponse').addEventListener('click', addCriteriaResponse);
document.getElementById('newQuestionType').addEventListener('change', responseTypeChanged);
presetSelector.addEventListener('change', fillPreset);
document.getElementById('createCriteriaForm').addEventListener('submit', submitQuestion);
document.getElementById('createCriteriaForm').addEventListener('change', (e) => {
  if (e.target === presetSelector) return;
  presetSelector.value = '';
});
document.getElementById('createPostButton').addEventListener('click', submitPost);

// Constant document values
const topSection = document.getElementById('topSection');
const htmlTitle = document.getElementById('pageTitle');
const groupDesc = document.getElementById('groupDesc');
let groupInfo;
let questionCount = 0;
const fileList = [];
const savedQuestions = [];


const queryString = window.location.search;
const groupId = queryString.substring(1);
/* eslint-disable no-unused-vars */
async function fillPage() {
  /* eslint-enable no-unused-vars */
  await getGroupInfo();

  if (groupInfo.rank !== 'guest') {
    // Create file upload utilities, to avoid new lines in html file counting as elements
    resetFileInput();
    const html = "<img id='newFileBtn' class='file-holder selectable' src='/img/upload-file-dark.png'>";
    document.getElementById('filePreviewContainer').insertAdjacentHTML('beforeend', html);
    // Add file event listeners
    document.getElementById('newFileBtn').addEventListener('click', () => {
      document.getElementById('newPostFiles').click();
    });
    document.getElementById('newPostFiles').addEventListener('change', handleFiles);
  }

  // If user doesn't have access to group, return
  if (!groupInfo) return;
  if (groupInfo.rank === 'owner' || groupInfo.rank === 'admin') {
    // Set up admin tools
    loadAdminTools();
  }
  await getPosts();
  // Add posts and stuffs
}

async function getGroupInfo() {
  // Attempt to retrieve group from database
  const groupResponse = await fetch('/cohort/' + groupId, {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    credentials: 'same-origin',
    method: 'GET',
  });
  // If group not found, display 404 and return
  if (!groupResponse.ok) {
    document.title = '404: Group not found';
    htmlTitle.textContent = '404: Group not found';
    return;
  }
  let resData = await groupResponse.json();
  groupInfo = resData.data;
  // Set up page titles
  document.title = groupInfo.name;
  htmlTitle.textContent = groupInfo.name;
  groupDesc.textContent = groupInfo.description;
  document.querySelector('#createPostForm > p').textContent = 'Creating post in group: ' + groupInfo.name;

  if (!userProfile) return;

  // Get user rank
  const rankResponse = await fetch('/registration/' + groupId, {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    credentials: 'same-origin',
    method: 'GET',
  });
  resData = await rankResponse.json();
  groupInfo.rank = resData.rank;

  if (groupInfo.rank === 'guest') {
    const joinBtn = document.createElement('button');
    joinBtn.id = 'joinGroup';
    joinBtn.textContent = 'Join Group!';
    joinBtn.addEventListener('click', joinGroup);
    topSection.appendChild(joinBtn);
    document.getElementById('createNewPost').remove();
    document.getElementById('createNewPostContent').remove();
    return;
  }
  document.getElementById('createNewPost').classList.remove('hidden');
  // Populate question presets
  // Get saved questions
  const saved = await fetch('/questions', {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    credentials: 'same-origin',
    method: 'GET',
  });
  if (!saved.ok) {
    console.log(saved);
    return;
  }
  const questionData = await saved.json();
  const questions = questionData.data;
  const presetContainer = document.getElementById('presetSelect');
  // If no saved questions, return
  if (questions.length === 0) {
    return;
  }
  // Option elements have very little by way of styling options, so to stop long questions overflowing, I've set this maximum display length
  // Ideally I need to come back to this and create my own select box, so that I can style it properly
  const maxDisplayLength = 60;
  // Loop through saved questions
  for (let i = 0; i < questions.length; i++) {
    const currentQuestion = questions[i];
    savedQuestions.push(currentQuestion);
    const option = document.createElement('option');
    option.value = i;
    option.textContent = currentQuestion.questionContent.slice(0, maxDisplayLength);
    if (currentQuestion.questionContent.length > maxDisplayLength) {
      option.textContent += '…';
    }
    option.title = currentQuestion.questionContent;
    presetContainer.appendChild(option);
  }
}

function fillPreset(e) {
  const question = savedQuestions[e.target.value];
  // Update form elements
  document.getElementById('saveQuestion').checked = false;
  document.getElementById('newQuestionType').value = question.type;
  document.getElementById('questionText').value = question.questionContent;
  responseTypeChanged();

  // Clear current allowed responses
  const responseContainer = document.getElementById('responsesList');
  while (responseContainer.firstChild) {
    responseContainer.firstChild.remove();
  }
  // Add question responses
  const type = question.type;
  if (type === 'text') return;
  for (let i = 0; i < question.answers.length; i++) {
    const value = question.answers[i];
    addCriteriaResponse(undefined, type, value);
  }
}

async function getPosts() {
  // Attempt to retrieve group from database
  const postsResponse = await fetch('/posts/' + groupId, {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    credentials: 'same-origin',
    method: 'GET',
  });
  if (!postsResponse.ok) {
    return;
  }
  const resData = await postsResponse.json();
  const postsList = resData.data;
  if (postsList.length === 0) {
    // No posts found
    const message = document.createElement('p');
    message.classList.add('soft-alert');
    message.textContent = '-- Nobody has posted yet --';
    document.getElementById('postList').appendChild(message);
    return;
  }
  for (let i = 0; i < postsList.length; i++) {
    const currentPost = postsList[i];
    const postContainer = document.createElement('div');
    postContainer.classList.add('post-container', 'grid-container');
    postContainer.data = currentPost.postId;
    document.getElementById('postList').appendChild(postContainer);

    const profileContainer = document.createElement('div');
    profileContainer.classList.add('post-profile');
    postContainer.appendChild(profileContainer);

    const profileImg = document.createElement('img');
    profileImg.classList.add('post-profile-pic');
    profileImg.src = '/profile-pic/' + currentPost.userId;
    profileContainer.appendChild(profileImg);

    const username = document.createElement('p');
    username.classList.add('post-username');
    username.textContent = currentPost.username;
    profileContainer.appendChild(username);

    const postTitle = document.createElement('h2');
    postTitle.classList.add('post-title');
    postTitle.textContent = currentPost.title;
    postContainer.appendChild(postTitle);

    const postDesc = document.createElement('div');
    postDesc.classList.add('post-desc');
    postDesc.innerText = currentPost.description;
    postContainer.appendChild(postDesc);

    const postTime = document.createElement('p');
    postTime.classList.add('post-time');
    postTime.textContent = getDateStringFromUnix(currentPost.timeCreated);
    postContainer.appendChild(postTime);

    const linkButton = document.createElement('button');
    linkButton.classList.add('post-link');
    linkButton.textContent = 'Open Post';
    postContainer.appendChild(linkButton);

    // Add event listener to navigate to post page
    linkButton.addEventListener('click', () => {
      location.href = '/post?' + currentPost.postId;
    });
  }
}

async function joinGroup() {
  const response = await fetch('/register/' + groupId, {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    credentials: 'same-origin',
    method: 'POST',
  });
  if (!response.ok) {
    window.alert('Something went wrong');
    return;
  }
  window.location.reload();
}

function loadAdminTools() {
  document.getElementById('groupAdminTools').classList.toggle('hidden');
  document.getElementById('updateGroupName').value = groupInfo.name;
  document.getElementById('updateGroupDesc').value = groupInfo.description;
  document.getElementById('groupPrivate').checked = groupInfo.isPrivate;

  document.getElementById('toggleUpdateGroupMenu').addEventListener('click', toggleUpdateMenu);
  document.getElementById('updateGroup').addEventListener('submit', updateGroupDetails);
  document.getElementById('inviteUsers').addEventListener('keyup', getInviteableUsers);
  // Invite users via their username
  // Toggle group public/private
}

function toggleUpdateMenu() {
  document.getElementById('updateGroup').classList.toggle('hidden');
}

async function updateGroupDetails(e) {
  e.preventDefault();
  const formData = new FormData(document.getElementById('updateGroup'));

  const response = await fetch('/cohort/' + groupId, {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    credentials: 'same-origin',
    method: 'POST',
    body: formData,
  });
  if (response.ok) location.reload();
}

async function inviteUser(userId) {
  const formData = new FormData();
  formData.append('userIds', userId);
  const response = await fetch('/invite/' + groupId, {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    credentials: 'same-origin',
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    console.log(response);
    return false;
  } else {
    return true;
  }
}

function openNewPostForm() {
  document.getElementById('createNewPostContent').classList.remove('hidden');
  document.getElementById('createNewPost').classList.add('hidden');
}

function createNewQuestion(type, question, responses = null) {
  if (!question || question.length === 0) {
    return;
  }
  // If multiple choice type has no possible answers, return
  if (type !== 'text') {
    if (!responses || responses.length === 0) {
      return;
    }
  }
  // Increment question counter
  questionCount++;
  // Set important values
  const questionName = 'question' + questionCount;

  // Create question container structure
  const criteriaForm = document.getElementById('criteriaForm');
  const mainContainer = document.createElement('div');
  mainContainer.classList.add('criteria-container');
  criteriaForm.appendChild(mainContainer);

  const heading = document.createElement('p');
  heading.classList.add('selectable', 'criteria-label', 'expanded');
  heading.textContent = 'Question ' + questionCount;
  mainContainer.appendChild(heading);

  const delButton = document.createElement('button');
  delButton.classList.add('delete-criteria-button');
  delButton.textContent = 'Delete';
  mainContainer.appendChild(delButton);

  const container = document.createElement('div');
  mainContainer.appendChild(container);
  container.appendChild(document.createElement('br'));

  const questionText = document.createElement('label');
  questionText.textContent = question;
  container.appendChild(questionText);
  container.appendChild(document.createElement('br'));

  // Add event listener to hide question content
  heading.addEventListener('click', () => {
    container.classList.toggle('hidden');
    heading.classList.toggle('expanded');
  });

  // Add event listener to delete question
  delButton.addEventListener('click', () => {
    mainContainer.remove();
    questionDeleted();
  });


  if (type === 'text') {
    // Create text area answer field
    const textField = document.createElement('textarea');
    textField.name = questionName;
    textField.classList.add('large', 'criteria-content');
    textField.disabled = true;
    container.appendChild(textField);
  } else if (type === 'checkbox' && responses) {
    // Create checkbox answer field
    for (let i = 0; i < responses.length; i++) {
      const check = document.createElement('input');
      check.type = 'checkbox';
      check.name = questionName + 'answer' + i;
      check.disabled = true;
      container.appendChild(check);

      const label = document.createElement('label');
      label.textContent = responses[i];
      container.appendChild(label);
      container.appendChild(document.createElement('br'));
    }
  } else if (type === 'radio' && responses) {
    // Create radio answer field
    for (let i = 0; i < responses.length; i++) {
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = questionName;
      radio.value = responses[i];
      radio.disabled = true;
      container.appendChild(radio);

      const label = document.createElement('label');
      label.textContent = responses[i];
      container.appendChild(label);
      container.appendChild(document.createElement('br'));
    }
  } else {
    console.log(type, ',', responses);
    return;
  }

  // Add save question box
  container.appendChild(document.createElement('hr'));
  const saveQuestion = document.createElement('input');
  saveQuestion.type = 'checkbox';
  saveQuestion.name = questionName + 'save';
  saveQuestion.checked = document.getElementById('saveQuestion').checked;
  container.appendChild(saveQuestion);
  const saveLabel = document.createElement('label');
  saveLabel.textContent = 'Save this question for use in future posts';
  container.appendChild(saveLabel);
}

function updateQuestionNumber(mainContainer, number) {
  // Replace text in criteria label
  const newPText = mainContainer.childNodes[0].textContent.replace(/[0-9]+/, number);
  mainContainer.childNodes[0].textContent = newPText;

  // Get list of response choices
  const responseContainer = mainContainer.childNodes[2];
  const responseElements = responseContainer.childNodes;

  // First three elements are the question and line breaks, so start at 3
  for (let i = 3; i < responseElements.length; i++) {
    const currentElement = responseElements[i];
    // Only change names of input and textarea elements
    if (currentElement.tagName === 'INPUT' || currentElement.tagName === 'TEXTAREA') {
      const newName = currentElement.name.replace(/[0-9]+/, number);
      currentElement.name = newName;
    }
  }
}

function questionDeleted() {
  // Get whole list of questions and decrement the current total
  const questions = document.getElementsByClassName('criteria-container');
  questionCount--;
  // Running through every question isn't the most efficient way of doing it,
  // as it means that if the last quesiton is deleted, it will 'update' every question
  // when it doesn't necessarily need to, however for the scale of the task, I think it's fine as it is
  for (let i = 0; i < questions.length; i++) {
    updateQuestionNumber(questions[i], i);
  }
}

// e is declared to allow calling with custom parameters from fillPreset() as well as calling from event
// Without having e declared, the event would go into 'type' and would just break things
function addCriteriaResponse(e, type = undefined, value = undefined) { // eslint-disable-line no-unused-vars
  const container = document.createElement('div');
  const questionType = type || document.getElementById('newQuestionType').value;
  const responseValue = value || document.getElementById('newResponse').value;
  document.getElementById('newResponse').value = '';
  const box = document.createElement('input');
  box.disabled = true;
  const response = document.createElement('label');

  // If question has free text response, hide response list
  if (questionType !== 'checkbox' && questionType !== 'radio') {
    window.alert('Stop messing with the HTML 😠');
    return;
  }

  // Fill in response details
  box.type = questionType;
  response.textContent = responseValue;

  // Create delete button
  const delButton = document.createElement('button');
  delButton.type = 'button';
  delButton.textContent = 'Delete';
  delButton.classList.add('delete-criteria-button');

  delButton.addEventListener('click', () => {
    container.remove();
  });

  // Append everything to document
  container.appendChild(delButton);
  container.appendChild(box);
  container.appendChild(response);
  container.appendChild(document.createElement('br'));
  document.getElementById('responsesList').appendChild(container);
}

function checkIfAddingNewResponse(e) {
  console.log(e);
  e.preventDefault();
  if (e.keyCode === 13) { // If enter key pressed
    addCriteriaResponse();
  }
}

function responseTypeChanged() {
  const responseType = document.getElementById('newQuestionType').value;
  if (responseType === 'text') {
    document.getElementById('allowedResponses').classList.add('hidden');
    return;
  }
  document.getElementById('allowedResponses').classList.remove('hidden');
  const responseList = document.getElementById('responsesList');
  for (let i = 0; i < responseList.childNodes.length; i++) {
    const currentItem = responseList.childNodes[i];
    currentItem.childNodes[1].type = responseType;
  }
}

function submitQuestion(e) {
  e.preventDefault();
  const type = document.getElementById('newQuestionType').value;
  if (type !== 'text' && type !== 'checkbox' && type !== 'radio') {
    return;
  }
  const text = document.getElementById('questionText').value;
  const responseList = document.getElementById('responsesList').childNodes;
  const responses = [];
  for (let i = 0; i < responseList.length; i++) {
    responses.push(responseList[i].childNodes[2].textContent);
  }
  if (type === 'text') {
    createNewQuestion(type, text);
  } else {
    createNewQuestion(type, text, responses);
  }
  clearNewQuestion();
}

function clearNewQuestion() {
  document.getElementById('createCriteriaForm').reset();
  document.getElementById('allowedResponses').classList.add('hidden');
  // Clear all set responses
  const responseItems = document.getElementById('responsesList').childNodes;
  while (responseItems.length > 0) {
    responseItems[0].remove();
  }
}

async function submitPost() {
  const formData = new FormData(document.getElementById('createPostForm'));
  // Validate data
  if (formData.get('postTitle').length === 0 || formData.get('postDesc').length === 0) {
    window.alert('Please fill in all fields');
    return;
  }
  // Append files to form data
  fileList.forEach(file => {
    if (file) {
      formData.append('file', file);
    }
  });

  const criteriaJSON = getCriteriaData();
  formData.append('questions', JSON.stringify(criteriaJSON));

  const response = await fetch('/post/' + groupId, {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    credentials: 'same-origin',
    method: 'POST',
    body: formData,
  });
  if (response.ok) {
    location.reload();
  } else {
    console.log(response);
  }
}

function getCriteriaData() {
  // Get all the criteria boxes
  const criteriaContainers = document.getElementsByClassName('criteria-container');
  const criteriaJSON = { questions: [] };
  // Extract information from each question field
  for (let i = 0; i < criteriaContainers.length; i++) {
    const container = criteriaContainers[i].childNodes[2];
    criteriaJSON.questions.push(getSingleCriteria(container));
  }
  return criteriaJSON;
}

function getSingleCriteria(containerElement) {
  const questionContent = containerElement.childNodes[1].textContent;
  const nodesLength = containerElement.childNodes.length;

  // Set up JSON object
  const object = {
    question: questionContent,
  };

  // Get question type
  const inputField = containerElement.childNodes[3];
  if (inputField.tagName === 'TEXTAREA') {
    object.type = 'text';
  } else {
    object.type = inputField.type;

    // Get possible answers
    const answers = [];
    // First 3 and last 2 elements aren't questions
    for (let i = 3; i < nodesLength - 2; i++) {
      const currentElement = containerElement.childNodes[i];
      if (currentElement.tagName === 'LABEL') {
        answers.push(currentElement.textContent);
      }
    }
    object.answers = answers;
  }

  // Check if being saved
  const saving = containerElement.childNodes[nodesLength - 2].checked;
  if (saving) {
    object.save = saving;
  }

  return object;
}

async function getInviteableUsers() {
  const userList = document.getElementById('searchUsersList');
  const searchBar = document.getElementById('inviteUsers');

  // Clear existing entries
  while (userList.childNodes.length > 0) {
    userList.firstChild.remove();
  }
  // If search search blank, show no results
  if (searchBar.value === '') {
    userList.classList.add('hidden');
    return;
  }

  // Encode string to allow it in query parameter
  const searchString = encodeURIComponent(searchBar.value);

  const responses = await fetch('/inviteable-users/' + groupId + '/' + searchString, {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    credentials: 'same-origin',
    method: 'GET',
  });
  let results;
  if (responses.status === 204) {
    // Display no results
    results = 'No results';
    userList.classList.add('hidden');
    return;
  } else {
    const resData = await responses.json();
    if (resData.results.length === 0) {
      results = 'No Results';
      userList.classList.add('hidden');
      return;
    } else {
      results = resData.results;
    }
  }
  // Create new list entry for each result
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    // Create container
    const container = document.createElement('div');
    container.classList.add('user-record', 'content-item', 'content-grid-container');
    userList.appendChild(container);
    // Add profile picture
    const pic = document.createElement('img');
    pic.classList.add('post-profile-pic');
    pic.src = '/profile-pic/' + result.userId;
    container.appendChild(pic);
    // Add username
    const name = document.createElement('p');
    name.classList.add('post-username');
    name.textContent = result.username;
    container.appendChild(name);

    const inviteBtn = document.createElement('button');
    inviteBtn.classList.add('accept-btn');
    inviteBtn.textContent = 'Invite';
    container.appendChild(inviteBtn);

    // Add invite event listener
    inviteBtn.addEventListener('click', async () => {
      const success = await inviteUser(result.userId);
      if (!success) {
        window.alert('Something went wrong');
      }
      getInviteableUsers();
    });
  }

  userList.classList.remove('hidden');
}

function handleFiles(e) {
  const files = e.target.files;

  const fileCount = document.getElementById('filePreviewContainer').childNodes.length - 2;

  // Make sure restrictions are honoured
  if (fileCount + files.length > 20) {
    alert(`Maximum 20 files allowed!\nOnly ${20 - fileList.length} more files allowed`);
    return;
  }
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB >= 50) {
      alert('Max file size is 50MB!');
      return;
    }
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = function () {
      /*
        When the reader has loaded the file,
        attempt to append the file to the list and display it on screen
        */
      try {
        createNewFileHolder(reader, file.name, file.type);
        fileList.push(file);
        checkReadyFileCount();
      } catch (e) {
        console.log(e);
      }
      resetFileInput();
    };
  }
}

function createNewFileHolder(file, name, type) {
  const container = document.createElement('div');
  container.classList.add('file-holder');
  const image = document.createElement('img');
  image.classList.add('file-preview');
  image.title = name;
  container.appendChild(image);
  document.getElementById('filePreviewContainer').appendChild(container);
  // Check file type to see how to preview
  if (type.match(/^image\//)) {
    // Then file is image
    image.src = file.result;
  } else if (type.match(/^audio\//)) {
    // Then file is audio
    image.src = '/img/audio-icon-dark.png';
  } else if (type.match(/\/pdf$/)) {
    // Then file is pdf
    image.src = '/img/pdf-icon-dark.png';
  } else {
    // Any other type
    image.src = '/img/preview-unavailable-dark.png';
  }
  // Create remove button
  const delButton = document.createElement('div');
  delButton.classList.add('selectable', 'remove-button');
  delButton.textContent = 'Remove';
  container.appendChild(delButton);

  // Add delete event listener
  const currentFileNum = fileList.length;
  delButton.addEventListener('click', (e) => {
    removeFileFromPost(e.target, currentFileNum);
  });
}

// Check how many files are prepped to be posted so a limit can be enforced
function checkReadyFileCount() {
  const fileCount = document.getElementById('filePreviewContainer').childNodes.length - 2;
  // Show or hide new file upload button
  if (fileCount >= 20) {
    document.getElementById('newFileBtn').classList.add('hidden');
  } else {
    document.getElementById('newFileBtn').classList.remove('hidden');
  }
  document.getElementById('restrictionsText').textContent = `(${20 - fileCount} files left, maximum 50MB each)`;
}

function resetFileInput() {
  // Delete file input if it exists
  let fileUploader = document.getElementById('newPostFiles');
  if (fileUploader) {
    fileUploader.remove();
  }

  // Create new file input
  const html = "<input type='file' id='newPostFiles' class='hidden' name='files' accept='.zip, .pdf, image/*, audio/*' multiple>";

  document.getElementById('filePreviewContainer').insertAdjacentHTML('afterbegin', html);

  // Add event listener again
  fileUploader = document.getElementById('newPostFiles');
  fileUploader.addEventListener('change', handleFiles);
}

function removeFileFromPost(target, fileNum) {
  target.parentElement.remove();
  fileList[fileNum] = undefined;
  checkReadyFileCount();
}
