const newsFeedContainer = document.getElementById('newsFeed');

const documentList = [
  {
    id: 0,
    title: 'Picture 1',
    description: 'This is a test post',
    author: 'Lennie',
    file: '89024931_302218764085505_5568612806514704384_n.jpg',
  },
  {
    id: 1,
    title: 'Picture 2',
    description: 'This is another test post',
    author: 'Daniel',
    file: '123634642_1657565107759887_2531456001333406319_n.jpg',
  },
  {
    id: 2,
    title: 'Picture 3',
    description: 'This is yet another test post',
    author: 'up940148',
    file: '420.png',
  },
  {
    id: 3,
    title: 'DBPRIN Submission 4',
    description: "It's awful",
    author: 'UP940148',
    file: '6969.pdf',
  },
]

function getNextPosts(offset) {
  return documentList;
}

function appendPosts(listOfPosts) {
  listOfPosts.forEach(post => {
    let newContainer = document.createElement('div');
    newContainer.className = 'news-item feature-element';
    newContainer.setAttribute('post', post.id);
    let newTitle = document.createElement('h1');
    newTitle.textContent = post.title;
    let newAuthor = document.createElement('h4');
    newAuthor.textContent = `by ${post.author}`;
    let newDesc = document.createElement('p');
    newDesc.textContent = post.description;
    let toggleButton = document.createElement('button');
    toggleButton.textContent = 'Show Content';
    toggleButton.className = 'selectable';
    let innerDoc = document.createElement('object');
    innerDoc.data = `/work/d/${post.file}#view=FitH`;
    let filenameSplit = post.file.split('.');
    innerDoc.style.display = 'none';
    let fileType = filenameSplit[filenameSplit.length - 1];
    innerDoc.className = fileType;
    innerDoc.innerHTML = `This browser doesn't support this file type.<br><a href='/download/${post.file}'>Click Here</a> to download the file`;
    let hzrule = document.createElement('hr');
    newContainer.appendChild(newTitle);
    newContainer.appendChild(newAuthor);
    newContainer.appendChild(newDesc);
    newContainer.appendChild(toggleButton);
    newContainer.appendChild(innerDoc);
    newContainer.appendChild(hzrule);
    newsFeedContainer.appendChild(newContainer);

    toggleButton.addEventListener('click', () => {
      switch (innerDoc.style.display) {
        case 'none':
          innerDoc.style.display = 'block';
          toggleButton.textContent = 'Hide Content';
          break;
        case 'block':
          innerDoc.style.display = 'none';
          toggleButton.textContent = 'Show Content';
          break;
      }
    })
  })

}

appendPosts(getNextPosts(0));
