$(document).ready(function() {
  var $window = $(window);
  var $document = $(document);
  var $body = $("body");

  $(".js--mobile-menu-trigger").on("click", function() {
    $body.addClass("show-sidebar");
  });

  $(".js--mobile-close-trigger").on("click", function() {
    $body.removeClass("show-sidebar");
  });

  $(".js--search-trigger").on("click", function() {
    $body.toggleClass("show-search");
    if ($body.hasClass("show-search")) {
      $("#nav-search-box").focus();
    }
  });

  $("pre").html(function(index, html) {
    return html
      .split(/\r?\n/)
      .map(function(line) {
        return [
          '<div class="line">',
          '<div class="line-number"><!-- placeholder --></div>',
          '<span class="line-content">' + line + "</span></span>",
          "</div>"
        ].join("");
      })
      .join("");
  });

  $window.on("hashchange", correctHashScroll);
  correctHashScroll();

  function correctHashScroll() {
    var currentScroll = $document.scrollTop();
    var mastheadHeight = $("#masthead").outerHeight() + 15; // extra padding
    if (window.location.hash && currentScroll > mastheadHeight) {
      console.log("reducing scroll from " + currentScroll);
      $document.scrollTop(currentScroll - mastheadHeight);
    }
  }
});
