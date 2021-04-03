// Element1, Element2, Element3, Surface1, Surface2, Surface3, Primary, Secondary, Tertiary
// https://colorhunt.co/palettes/dark
// Background, Highlight, Primary, Font
// const colourPalette = [['#A8A8A8', '#E0E0E0', '#BC6FF1', '#000000'], ['#101010', '#505050', '#52057B', '#FFFFFF']];
// Background, Feature, Hover, Primary, Secondary, Highlight

const colourPalette = [['#F0F2F5', '#FFFFFF', '#E4E6EB', '#212121', '#7b7b7b', '#6200EE'], ['#18191A', '#242526', '#3A3B3C', '#E4E6EB', '#B0B3B8', '#985EFF']];
const root = document.documentElement;

let currentColourMode = localStorage.getItem('LPRS_colourMode') || 'light';
const darkModeButton = document.getElementById('darkModeToggle');

initPage();

function initPage() {
  root.setAttribute('colour-mode', currentColourMode);
}
darkModeButton.addEventListener('click', () => {
  switch (currentColourMode) {
    case 'light':
      currentColourMode = 'dark';
      break;
    case 'dark':
      currentColourMode = 'light';
      break;
  }
  localStorage.setItem('LPRS_colourMode', currentColourMode);
  root.setAttribute('colour-mode', currentColourMode);
})
