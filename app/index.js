/* eslint-disable no-console */
require('./anothjerFIle');
require('./index.css');

console.log('starting asdads');
if (module.hot) {
  module.hot.accept('./anothjerFIle.js', () => {
    console.log('Accepting the updated printMe module!');
  });
}
