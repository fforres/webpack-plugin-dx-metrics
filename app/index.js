/* eslint-disable no-console */
require('./anothjerFIle');

console.log('starting asdads');
if (module.hot) {
  module.hot.accept('./print.js', () => {
    console.log('Accepting the updated printMe module!');
  });
}
