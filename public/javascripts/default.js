window.addEventListener('resize', function() {
  if (document.documentElement.clientWidth < 955 && !document.documentElement.className.match(/\s*p-mobile/g)) {
    document.documentElement.className += ' p-mobile';
  } else if (document.documentElement.clientWidth >= 955 && document.documentElement.className.match(/\s*p-mobile/g)) {
    document.documentElement.className = document.documentElement.className.replace(/p-mobile/g, '');
  }

});
//598px
window.addEventListener('DOMContentLoaded', function() {
    var event = new Event('resize');  // (*)
    window.dispatchEvent(event);

});
