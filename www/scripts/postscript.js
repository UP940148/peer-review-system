/* global idToken */

// Constant document values
const topSection = document.getElementById('topSection');
const htmlTitle = document.getElementById('pageTitle');
const pageContent = document.getElementById('pageContent');
const mainPost = document.getElementById('mainPost');

const queryString = window.location.search;
const postId = queryString.substring(1);

async function fillPage() {
  // Attempt to retrieve post from database
  const postResponse = await fetch('/post/' + postId, {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    credentials: 'same-origin',
    method: 'GET',
  });
  if (!postResponse.ok) {
    htmlTitle.textContent = '404 - Post not found!';
    document.title = '404: Group not found';
    return;
  }
  const resData = await postResponse.json();
  htmlTitle.textContent = resData.data.title;
  document.title = resData.data.title;
  displayPost(resData.data);
}

/*
Load post content
  (Maybe load rendered content)
Load review ability

If own post
  View reviews
  Delete post
*/

function displayPost(post) {
  const fileList = post.files.split(',');
  displayFiles(fileList);
  displayPostContent(post);
}

function displayFiles(fileList) {
  for (let i = 0; i < fileList.length; i++) {
    if (fileList[i].length !== 0) {
      // If the post has file/s
      document.getElementById('downloadAll').classList.remove('hidden');
      document.getElementById('downloadAll').addEventListener('click', downloadAllFiles);

      // Create container for file and button
      const container = document.createElement('div');
      document.getElementById('fileContainer').appendChild(container);

      const display = document.createElement('object');
      display.data = '/file/' + fileList[i];
      display.classList.add('file-display');
      const downloadBtn = document.createElement('button');
      downloadBtn.classList.add('download-button', 'individual-download', 'selectable');
      downloadBtn.textContent = 'Download';
      downloadBtn.addEventListener('click', () => {
        downloadFile(fileList[i]);
      });
      container.appendChild(display);
      container.appendChild(downloadBtn);
    } else {
      return;
    }
  }
  document.getElementById('fileWindow').classList.remove('hidden');
}

function downloadFile(file) {
/*
  const response = await fetch('/download/' + file, {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    credentials: 'same-origin',
    method: 'GET',
  });
  if (!response.ok) {
    console.log(response);
  }
  console.log(response);
*/

  // For some reason, res.download stopped working as expected
  // The browser refuses to download the files unless the request is sent through a link
  // So I decided that using window.open() was the best alternate option to use which had sufficient cross-browser compatability
  window.open('/download/' + file);
}

function downloadAllFiles() {
/*
  const response = await fetch('/downloadAll/' + postId, {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    credentials: 'same-origin',
    method: 'GET',
  });
  if (!response.ok) {
    console.log(response);
  }
  console.log(response);
*/
  window.open('/downloadAll/' + postId);
}

function displayPostContent(post) {
  // Author details
  const profileContainer = document.createElement('div');
  profileContainer.classList.add('post-profile', 'user');
  mainPost.appendChild(profileContainer);

  const profileImg = document.createElement('img');
  profileImg.classList.add('post-profile-pic');
  profileImg.src = post.picture;
  profileContainer.appendChild(profileImg);

  const username = document.createElement('p');
  username.classList.add('post-username');
  username.textContent = post.username;
  profileContainer.appendChild(username);

  // Date
  const postTime = document.createElement('p');
  postTime.classList.add('date');
  postTime.textContent = getDateStringFromUnix(post.timeCreated);
  mainPost.appendChild(postTime);

  // Post content
  const description = document.createElement('p');
  description.innerText = post.description;
  description.classList.add('desc');
  mainPost.appendChild(description);

  if (post.userId === userProfile.userId) {
    displayAsAuthor(post);
  } else {
    displayFeedbackForm(post.criteriaId);
  }
}

async function displayFeedbackForm(criteriaId) {
  const response = await fetch('/criteria/' + criteriaId, {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    credentials: 'same-origin',
    method: 'GET',
  });
  if (!response.ok) {
    console.log(response);
    return;
  }
  const resData = await response.json();
  const questions = resData.data;

  if (questions.length === 0) {
    return;
  }

  // Create feedback form
  const feedbackForm = document.createElement('form');
  feedbackForm.classList.add('feedback');
  feedbackForm.id = 'feedbackForm';
  const formHeader = document.createElement('fieldset');
  feedbackForm.appendChild(formHeader);

  // If user isn't logged in, don't allow them to leave feedback
  if (!userProfile) {
    formHeader.disabled = true;
    const formLockText = document.createElement('a');
    formLockText.classList.add('link');
    formLockText.textContent = 'Please Sign In to leave feedback.';
    formLockText.addEventListener('click', profileButtonClicked);
    formHeader.appendChild(formLockText);
  }

  const legend = document.createElement('legend');
  legend.textContent = 'Feedback:';
  formHeader.appendChild(legend);
  pageContent.appendChild(feedbackForm);

  // Fill feedback form
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];

    const mainContainer = document.createElement('div');
    mainContainer.classList.add('question-container');
    formHeader.appendChild(mainContainer);

    const heading = document.createElement('p');
    heading.classList.add('selectable', 'criteria-label', 'expanded');
    heading.textContent = 'Question ' + (i + 1);
    mainContainer.appendChild(heading);

    const container = document.createElement('div');
    mainContainer.appendChild(container);

    const questionText = document.createElement('label');
    questionText.textContent = question.questionContent;
    container.appendChild(questionText);
    container.appendChild(document.createElement('br'));

    // Add event listener to hide question content
    heading.addEventListener('click', () => {
      container.classList.toggle('hidden');
      heading.classList.toggle('expanded');
    });

    // Add in response fields

    if (question.type === 'text') {
      // Create text area answer field
      const textField = document.createElement('textarea');
      textField.name = 'question' + i;
      textField.classList.add('large', 'criteria-content');
      container.appendChild(textField);
    } else if (question.type === 'checkbox') {
      // Create checkbox answer field
      for (let j = 0; j < question.answers.length; j++) {
        const check = document.createElement('input');
        check.type = 'checkbox';
        check.name = 'question' + i + 'answer' + j;
        container.appendChild(check);

        const label = document.createElement('label');
        label.textContent = question.answers[j];
        container.appendChild(label);
        container.appendChild(document.createElement('br'));
      }
    } else if (question.type === 'radio') {
      // Create radio answer field
      for (let j = 0; j < question.answers.length; j++) {
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'question' + i;
        radio.value = question.answers[j];
        container.appendChild(radio);

        const label = document.createElement('label');
        label.textContent = question.answers[j];
        container.appendChild(label);
        container.appendChild(document.createElement('br'));
      }
    }
  }

  const submitButton = document.createElement('input');
  submitButton.type = 'submit';
  formHeader.appendChild(submitButton);

  submitButton.addEventListener('click', submitFeedback);
}

async function submitFeedback(e) {
  e.preventDefault();
  // Collect formdata

  const feedbackData = new FormData(document.getElementById('feedbackForm'));

  for (const entry of feedbackData.entries()) {
    console.log(entry);
  }
  // Post formdata
  const response = await fetch('/response/' + postId, {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    credentials: 'same-origin',
    method: 'POST',
    body: feedbackData,
  });
  if (!response.ok) {
    console.log(response);
    return;
  }
  location.reload();
}

async function displayAsAuthor(post) {
  console.log('Author');
  const criteriaResponse = await fetch('/criteria/' + post.criteriaId, {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    credentials: 'same-origin',
    method: 'GET',
  });
  if (!criteriaResponse.ok) {
    console.log(criteriaResponse);
    return;
  }
  const resData = await criteriaResponse.json();
  const questions = resData.data;

  if (questions.length === 0) {
    return;
  }
  console.log(questions);
  const responseStats = [];
  for (let i = 0; i < questions.length; i++) {
    const questionId = questions[i].questionId;
    const statsResponse = await fetch('/response-stats/' + questionId, {
      headers: {
        Authorization: 'Bearer ' + idToken,
      },
      credentials: 'same-origin',
      method: 'GET',
    });
  }
}
