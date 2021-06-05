/* global idToken, userProfile, getDateStringFromUnix, profileButtonClicked, Chart, */

// Constant document values
const htmlTitle = document.getElementById('pageTitle');
const pageContent = document.getElementById('pageContent');
const mainPost = document.getElementById('mainPost');

const queryString = window.location.search;
const postId = queryString.substring(1);
let post;
/* eslint-disable no-unused-vars */
async function fillPage() {
  /* eslint-enable no-unused-vars */
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

function displayPost(data) {
  post = data;
  const fileList = post.files.split(',');
  displayFiles(fileList);
  displayPostContent();
}

async function displayFiles(fileList) {
  for (let i = 0; i < fileList.length; i++) {
    if (fileList[i].length !== 0) {
      // If the post has file/s
      document.getElementById('downloadAll').classList.remove('hidden');
      document.getElementById('downloadAll').addEventListener('click', downloadAllFiles);

      // Create container for file and button
      const container = document.createElement('div');
      document.getElementById('fileContainer').appendChild(container);

      const display = document.createElement('object');
      display.data = await getFilePreview(fileList[i]);
      display.classList.add('file-display', 'selectable');

      display.addEventListener('click', () => {
        window.open('/file/' + fileList[i]);
      });
      const fileExtList = fileList[i].split('.');
      const fileExt = fileExtList[fileExtList.length - 1];

      const downloadBtn = document.createElement('button');
      downloadBtn.classList.add('download-button', 'individual-download', 'selectable');
      downloadBtn.innerText = 'Download\n( .' + fileExt + ' file )';
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

async function getFilePreview(fileId) {
  const response = await fetch('/file/' + fileId, {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    method: 'HEAD',
    credentials: 'same-origin',
  });
  if (!response.ok) {
    console.log(response);
    return null;
  }
  const fileTypeList = response.headers.get('content-type').split('/');
  const fileExtList = fileId.split('.');
  const fileExt = fileExtList[fileExtList.length - 1];
  // If image, then preview as itself
  if (fileTypeList[0] === 'image') {
    return '/file/' + fileId;
  }
  // If image, then preview audio image
  if (fileTypeList[0] === 'audio') {
    return '/img/audio-icon.png';
  }
  // If pdf, then preview pdf image
  if (fileExt === 'pdf') {
    return '/img/pdf-icon.png';
  }
  // Currently the system only supports the three types listed above, however this catch will future-proof somewhat
  // Else return preview not available image
  return '/img/preview-unavailable.png';
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

function displayPostContent() {
  // Author details
  const profileContainer = document.createElement('div');
  profileContainer.classList.add('post-profile', 'user');
  mainPost.appendChild(profileContainer);

  const profileImg = document.createElement('img');
  profileImg.classList.add('post-profile-pic');
  profileImg.src = '/profile-pic/' + post.userId;
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
  const descriptionContainer = document.createElement('div');
  descriptionContainer.classList.add('desc');
  mainPost.appendChild(descriptionContainer);
  const description = document.createElement('p');
  description.classList.add('desc-text');
  description.innerText = post.description;
  descriptionContainer.appendChild(description);

  if (userProfile && post.userId === userProfile.userId) {
    displayAsAuthor();
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
  const guide = document.createElement('h2');
  guide.textContent = '🢃 Give Feedback 🢃';
  guide.classList.add('guide');
  mainPost.appendChild(guide);

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
    questionText.classList.add('feedback-question');
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

async function displayAsAuthor() {
  const response = await fetch('/response-stats/' + postId, {
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
  displayAuthorControls();
  displayFeedbackStats(resData.data);
}

function displayFeedbackStats(stats) {
  if (stats[0].length === 0) {
    return;
  }

  const guide = document.createElement('h2');
  guide.textContent = '🢃 View Feedback 🢃';
  guide.classList.add('guide');
  mainPost.appendChild(guide);

  // Create feedback form
  const feedbackForm = document.createElement('form');
  feedbackForm.classList.add('feedback');
  feedbackForm.id = 'feedbackForm';
  const formHeader = document.createElement('fieldset');
  feedbackForm.appendChild(formHeader);

  const legend = document.createElement('legend');
  legend.textContent = 'Responses:';
  formHeader.appendChild(legend);
  pageContent.appendChild(feedbackForm);

  // Loop through questions
  for (let i = 0; i < stats.length; i++) {
    const question = stats[i];
    const mainContainer = document.createElement('div');
    mainContainer.classList.add('question-container');
    formHeader.appendChild(mainContainer);

    // Create hideable view
    const heading = document.createElement('p');
    heading.classList.add('selectable', 'criteria-label');
    heading.textContent = 'Question ' + (i + 1);
    mainContainer.appendChild(heading);

    const container = document.createElement('div');
    container.classList.toggle('hidden');
    mainContainer.appendChild(container);

    // Add question text
    const questionText = document.createElement('label');
    questionText.classList.add('feedback-question');
    questionText.textContent = question.question;
    container.appendChild(questionText);
    container.appendChild(document.createElement('br'));

    // Add event listener to toggle visibility
    heading.addEventListener('click', () => {
      container.classList.toggle('hidden');
      heading.classList.toggle('expanded');
    });

    if (question.type === 'text') {
      // If no responses, then skip iteration
      if (question.responses.length === 0) {
        const noResponseMessage = document.createElement('p');
        noResponseMessage.classList.add('indented-text');
        noResponseMessage.textContent = 'No feedback available for this question';
        container.appendChild(noResponseMessage);
        continue;
      }
      const mainResponseContainer = document.createElement('div');
      mainResponseContainer.classList.add('text-response-container');
      container.appendChild(mainResponseContainer);
      // Create divs to contain response content
      for (let j = 0; j < question.responses.length; j++) {
        const responseContainer = document.createElement('div');
        responseContainer.classList.add('text-response');

        const responseText = document.createElement('p');
        responseText.classList.add('no-wrapping');
        responseText.innerText = question.responses[j];

        // Append elements
        responseContainer.appendChild(responseText);
        mainResponseContainer.appendChild(responseContainer);

        // Add event listener to show/hide expanded view
        responseContainer.addEventListener('click', () => {
          responseText.classList.toggle('no-wrapping');
        });
      }
    } else {
      // Check if question has any responses
      let checkSum = 0;
      for (let j = 0; j < question.totals.length; j++) {
        checkSum += question.totals[j];
      }
      // If no responses, then skip iteration
      if (checkSum === 0) {
        const noResponseMessage = document.createElement('p');
        noResponseMessage.classList.add('indented-text');
        noResponseMessage.textContent = 'No feedback available for this question';
        container.appendChild(noResponseMessage);
        continue;
      }

      const chartContainer = document.createElement('div');
      chartContainer.classList.add('text-response', 'chart-container');
      container.appendChild(chartContainer);
      // Create bar chart
      const barCanvas = document.createElement('canvas');
      barCanvas.classList.add('bar-chart');
      const barLabels = question.answers;
      const barData = {
        labels: barLabels,
        datasets: [{
          backgroundColor: 'rgba(0, 0, 0, .2)',
          borderColor: 'rgb(0, 0, 0)',
          data: question.totals,
          borderWidth: 1,
        }],
      };
      const barConfig = {
        type: 'bar',
        data: barData,
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              display: false,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      };
      /* eslint-disable no-unused-vars */
      const barChart = new Chart(
        barCanvas,
        barConfig,
      );
      /* eslint-enable no-unused-vars */
      chartContainer.appendChild(barCanvas);
    }
  }
}

function displayAuthorControls() {
  // Create container
  const adminPanel = document.createElement('div');
  adminPanel.classList.add('owner');
  pageContent.appendChild(adminPanel);

  // Create delete post button
  const deletePostBtn = document.createElement('button');
  deletePostBtn.id = 'deletePost';
  deletePostBtn.classList.add('delete-btn');
  deletePostBtn.textContent = 'Delete Post';
  adminPanel.appendChild(deletePostBtn);
  deletePostBtn.addEventListener('click', () => {
    deletePost();
  });
}

function deletePost() {
  if (!window.confirm('Do you really want to delete this post?')) {
    return;
  }
  fetch('/post/' + postId, {
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
    credentials: 'same-origin',
    method: 'DELETE',
  });
  location.href = '/group?' + post.cohortId;
}
