/* global userProfile, idToken, getDateStringFromUnix */

document.getElementById('createNewPost').addEventListener('click', openNewPostForm);

// Constant document values
const topSection = document.getElementById('topSection');
const htmlTitle = document.getElementById('pageTitle');
const groupDesc = document.getElementById('groupDesc');
let groupInfo;
let questionCount = 0;


const queryString = window.location.search;
const groupId = queryString.substring(1);

async function fillPage() {
  await getGroupInfo();
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
    profileImg.src = currentPost.picture;
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
  document.getElementById('inviteUsers').addEventListener('submit', inviteUsers);
  // Invite users via their username
  // Toggle group public/private
}

function toggleUpdateMenu() {
  document.getElementById('updateGroup').classList.toggle('hidden');
}

async function updateGroupDetails(e) {
  e.preventDefault();
  const formData = new FormData(document.getElementById('updateGroup'));
  console.log(formData.get('cohortName'));
  console.log(formData.get('cohortDesc'));
  console.log(formData.get('isPrivate'));

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

async function inviteUsers(e) {
  e.preventDefault();
  const formData = new FormData(document.getElementById('inviteUsers'));
  const response = await fetch('/invite/' + groupId, {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    credentials: 'same-origin',
    method: 'POST',
    body: formData,
  });
  document.getElementById('inviteUsernames').value = '';
  if (!response.ok) {
    window.alert('Something went wrong');
  } else {
    location.reload();
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
    return;
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

    return;
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

    return;
  }

  console.log(type, ',', responses);
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

function addCriteriaResponse() {
  const container = document.createElement('div');
  const questionType = document.getElementById('newQuestionType').value;
  const responseValue = document.getElementById('newResponse').value;
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

  // Set up JSON object
  const object = {
    question: questionContent,
  };

  // Get question type
  const inputField = containerElement.childNodes[3];
  console.log(containerElement.childNodes);
  console.log(inputField);
  if (inputField.tagName === 'TEXTAREA') {
    object.type = 'text';
  } else {
    object.type = inputField.type;

    // Get possible answers
    const answers = [];
    for (let i = 3; i < containerElement.childNodes.length; i++) {
      const currentElement = containerElement.childNodes[i];
      if (currentElement.tagName === 'LABEL') {
        answers.push(currentElement.textContent);
      }
    }
    object.answers = answers;
  }

  return object;
}

document.getElementById('createResponse').addEventListener('click', addCriteriaResponse);
document.getElementById('newQuestionType').addEventListener('change', responseTypeChanged);
document.getElementById('createCriteriaForm').addEventListener('submit', submitQuestion);
document.getElementById('createPostButton').addEventListener('click', submitPost);
