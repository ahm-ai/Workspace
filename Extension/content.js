




//  On document loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('\u001b[32m%s\u001b[0m', 'content.js loaded');
});
  

(async function() {
  const src = chrome.runtime.getURL('modules/module_one.js');
  const module = await import(src);
  console.log( module.module1Function() );
})();

