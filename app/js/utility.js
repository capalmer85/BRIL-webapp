// some global variables, tsk tsk...

var views = []; // an array of view-handlers, each view registers here when it's loaded

var timers = [], // global array of timers, so I can cancel them all on page-switch
    baseUrl = document.location.protocol + "//" + document.location.hostname;
if ( document.location.port ) { baseUrl += ":" + document.location.port; }

function getFormattedDate(date) {
// helper function, formats the date for human readability
  if ( !date ) { date = new Date(); }
  var str = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
            date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
  return str;
};

var setFadeMessage = function(el,message,bgclass,button,timeout=2000) {
// helper function: set a message banner with a background colour.
// Leave it visible for a while, then fade it out over a longer time.
// Re-enable an associated button, if required
  $(el).stop()              // stop any previous animation
       .css('opacity',1.0)  // make the status window visible in case it wasn't
       .text(message)
       .removeClass( 'bg-success bg-info bg-warning bg-danger' )       // remove any colour classes
       .addClass(bgclass);  // mark it accordingly
  setTimeout( function() {
    if ( button ) { $(button).prop('disabled', false); }
    $(el).animate(
                    { opacity:0 }, 5000,
                    function() { $(el).removeAttr('disabled'); }
                  )
    }, timeout);
};

var saveJSON = function(filename,data){
// extend the Highcharts export menu with a 'download json' option
  var a = document.createElement('a');
  a.setAttribute('download', filename);
  a.href = 'data:;,' + JSON.stringify(data);
  a.innerHTML = 'ignore...';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

ajaxFail = function(el,jqXHR,textStatus) {
  setFadeMessage(el,"Ajax call failed: status="+jqXHR.status+" ("+textStatus+")",
               "bg-danger",null,10000);
};

var activeView; // record which view is active
var setView = function(view) {
// toggle between views
  console.log("switch to view",view);
  var buttons = [ 'bcm1f', 'basic_area', 'zoomable_time_series' ],
      i, b;

// clear all timers running in the current view
  for (var i = 0; i < timers.length; i++) { clearTimeout(timers[i]); }

  for ( i in buttons ) {
    b = buttons[i];
    console.log("#view-"+b,' disabled = ', ( b == view ? true : false ) );
    $("#view-"+b).button().prop('disabled', ( b == view ? true : false ) );
    if ( (b == view) || (b == activeView) ) { $('.'+b).toggle(); }
  }

  if ( view == 'bcm1f' ) {
    bcm1f.start();
    bcm1f_mask.get();
  }
  if ( view == 'basic_area' ) {
    basic_area.start();
  }
  if ( view == 'zoomable_time_series' ) {
    zoomable_time_series.start();
  }
  activeView = view;
  console.log("done switch to view",view);
};

function now(date) {
  if ( !date ) { date = new Date(); }
  var str = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
            date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + ":";
  return str;
};
