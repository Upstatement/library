$(document).ready(function() {
  var $window = $(window)
  var $document = $(document)

  $("pre").html(function (index, html) {
    return html.split(/\r?\n/).map(function(line) {
      return [
        '<div class="line">',
          '<div class="line-number"><!-- placeholder --></div>',
          '<span class="line-content">'+line+'</span></span>',
        '</div>'
      ].join('');
    }).join('');
  });

  // make TOC sticky
  var $toc = $(".g-left-panel");
  if ($toc.length) {
    var stickyTop = $toc.offset().top - 100;
    $window.on('scroll', function(){
      ($window.scrollTop() >= stickyTop) ? $toc.addClass('d-fixed') : $toc.removeClass('d-fixed');
    });
  }

  $window.on('hashchange', correctHashScroll)
  correctHashScroll()

  function correctHashScroll() {
    var currentScroll = $document.scrollTop();
    var mastheadHeight = $('#masthead').outerHeight() + 15; // extra padding
    if (window.location.hash && currentScroll > mastheadHeight) {
      console.log('reducing scroll from ' + currentScroll)
      $document.scrollTop(currentScroll - mastheadHeight)
    }
  }
})

function fetchHistory(type, userId, cb) {
  var key = "libraryHistory:" + userId + ':' + type
  var data

  if(data = localStorage.getItem(key)) {
    data = JSON.parse(data)

    // refresh localStorage data in the background if it's older than an hour
    if(!data.ts || new Date(data.ts) < (new Date() - 60 * 60 * 1000)) {
      refreshHistory(key, type)
    }

    return cb(data.history)
  } else {
    return refreshHistory(key, type, cb)
  }
}

function refreshHistory(localStorageKey, type, cb) {
  $.ajax('/reading-history/' + type + '.json?limit=5', {
    success: function(data) {
      localStorage.setItem(localStorageKey, JSON.stringify({ ts: new Date(), history: data }))
      if(cb) { return cb(data) }
    }
  })
}

// Adds a See More button for category containers with content
// that overflows a max height set in the css
function seeMoreButton() {
  $('.children-view').each(function (_, el) {
    var $el = $(el)
    var $content = $el.find('.children')
    if ($el.height() >= $content.height()) return

    $el.parent().append('<button class="seeMore-button">See more</button>')
  })

  $('#category-page').on('click', '.seeMore-button', function (el) {
    var $button = $(el.currentTarget)
    var text = $button.hasClass('show') ? 'See more' : 'See less'

    $button.toggleClass('show')
    $button.parent().find('.children-view').toggleClass('hide')
    $button.html(text)
  })
}
