var oaRange = require('oa-range')
  , OaScrollbar = require('oa-scrollbar');

function Annotator(ids, opts){
  var that = this;

  this.containerId = ids.container || 'main';
  this.scrollbar = new OaScrollbar(this.containerId);

  this.$cont = document.getElementById(this.containerId);

  this.oas = {}; //hash of all the annotation (key = oa.id)
  this.highlightedOa; //currently highlighted OA
  this.pendingOa;

  this.$cont.addEventListener('dragenter', _handleDragEnter.bind(this), false);
  this.$cont.addEventListener('dragleave', _handleDragLeave.bind(this), false);
  this.$cont.addEventListener('dragover', _handleDragOver.bind(this), false);
  this.$cont.addEventListener('drop', _handleDrop.bind(this), false);

  //TODO add on new resource / remove on resource deletion
  var $draggables = document.getElementsByClassName('draggable');
  Array.prototype.forEach.call($draggables, function($el){
    $el.addEventListener('dragstart', _handleDragStart.bind(this), false);
    $el.addEventListener('dragend', _handleDragEnd.bind(this), false);

    $el.addEventListener('click', _handleClick.bind(this), false);
  }, this);

  this.$cont.addEventListener('mouseup', _handleMouseup.bind(this), false);

  //refresh highlighiting on resize
  window.addEventListener("resize", function(e){
    for(var key in that.oas){
      var moa = that.oas[key];
      oaRange.unhighlight(moa);

      var $markers = oaRange.highlight(moa, that.$cont);
      moa.markers = $markers;
    }
  }, false);

  //create delete button
  this.$del = document.createElement('div');
  this.$del.style.position = 'absolute';
  this.$del.style.display = 'none';
  this.$del.style.zIndex =  10;
  this.$del.innerHTML =  '&times;';
  this.$cont.appendChild(this.$del);

  this.timerDel;

  this.$del.addEventListener('click', function(e){
    that.removeOa(that.highlightedOa);
  }, false);

};


Annotator.prototype.toJSON = function(){
  return this.oas;
};


Annotator.prototype.removeOa = function(oa){
  oaRange.unhighlight(oa);
  this.scrollbar.removeMarker(oa.scrollbarMarkerId);

  for(var type in oa.listeners){
    oa.$parentEl.removeEventListener(type, oa.listeners[type], false);
  }

  this.$del.style.display = 'none';
  clearTimeout(this.timerDel);

  delete this.oas[oa.id];
};

Annotator.prototype.addOa = function(oa){
  var that = this;

  if(! (oa.id in this.oas)){
    var $markers = oaRange.highlight(oa, this.$cont);
    oa.scrollbarMarkerId = this.scrollbar.addMarker(oa.range);
    oa.markers = $markers;

    oa.listeners = {
      mousemove: function(e){
        if (timer !== undefined) {
          clearTimeout(timer);
        }
        timer = setTimeout(function(){

          that.highlightedOa = _getHighlightedOa(e, that.oas, oa.markers);
          if(that.highlightedOa && (that.highlightedOa.id === oa.id)){
            e.target.style.cursor = 'pointer';
            oa.markers.forEach(function($marker){
              $marker.classList.add('over');
            });

            //reveal delete button
            clearTimeout(that.timerDel);

            var firstRect = $first.getBoundingClientRect();
            var rootRect = that.$cont.getBoundingClientRect();
            that.$del.style.display = 'block';
            that.$del.style.top = (firstRect.top + that.$cont.scrollTop - rootRect.top) + 'px';
            that.$del.style.left = (firstRect.left + that.$cont.scrollLeft - rootRect.left) + 'px';

          } else {
            e.target.style.cursor = 'auto';
            oa.markers.forEach(function($marker){
              $marker.classList.remove('over');
            });
            clearTimeout(that.timerDel);
            that.timerDel = setTimeout(function(){
              that.$del.style.display = 'none';
            }, 500);
          }

        }, 10);
      },
      mouseleave: function(e){
        if (timer !== undefined) {
          clearTimeout(timer);
        }

        e.target.style.cursor = 'auto';
        oa.markers.forEach(function($marker){
          $marker.classList.remove('over');
        });

        clearTimeout(that.timerDel);
        that.timerDel = setTimeout(function(){
          that.$del.style.display = 'none';
        }, 1000);
      },
      click: function(e){
        var sel =  window.getSelection();
        if(!sel.isCollapsed){
          return;
        }

        //handle overlapping markers:
        that.highlightedOa = _getHighlightedOa(e, that.oas, oa.markers);
        if(that.highlightedOa && (that.highlightedOa.id === oa.id)){

          //TODO handle click
          console.log('in', that.highlightedOa.id);

        } else {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };


    //add event listeners to closest element
    oa.$parentEl = oa.range.commonAncestorContainer;
    if(oa.$parentEl.nodeType !== 1){
      oa.$parentEl = oa.$parentEl.parentNode;
    }

    oa.$parentEl.classList.add('oa-parent');

    //find first rectangle
    var $first = oa.markers.sort(function(a,b){
      a = a.getBoundingClientRect();
      b = b.getBoundingClientRect();
      return ( (a.left <= b.left) || (a.top <= b.top) ) ? -1: 1;
    })[0];

    var timer; //Fire mousemove events less often (TODO calibrate)

    oa.$parentEl.addEventListener('mousemove', oa.listeners.mousemove, false);
    oa.$parentEl.addEventListener('mouseleave', oa.listeners.mouseleave, false);
    oa.$parentEl.addEventListener('click', oa.listeners.click, false);
  }

  this.oas[oa.id] = oa;
};


function _getHighlightedOa (e, oas, $markers){
  //find all range with same commonAncestor and pick up the innerMost oa target of the click
  var potentials = [];
  for (var key in oas){
    var moa = oas[key];
    var rect = _getRect(e, moa.markers);
    if(rect){
      potentials.push({oa:moa, rect: rect});
    }
  }

  var theone = potentials.sort(function(a, b){return a.rect.width - b.rect.width;})[0];

  return (theone) ? theone.oa: undefined;
};

function _getRect (e, $markers){

  for(var i=0; i<$markers.length; i++){
    var rect = $markers[i].getBoundingClientRect();
    if( (e.clientX <= rect.right) && (e.clientX >= rect.left) && (e.clientY >= rect.top) && (e.clientY <= rect.bottom) ){
      return rect;
    }
  }

  return undefined;
};


//this === Annotator
function _handleDragEnd(e) {
  // this/e.target is the source node.
  e.target.style.opacity = 1;
  Array.prototype.forEach.call(document.getElementsByClassName('articleComponent'), function (el) {
    el.classList.remove('over');
  });
};

//this === Annotator
function _handleDragEnter(e) {
  if(e.target.id !== this.containerId){
    e.target.classList.add('over');
  }
};

//this === Annotator
function _handleDragLeave(e) {
  e.target.classList.remove('over');
};

//this === Annotator
function _handleDragOver(e) {
  e.preventDefault(); // Necessary. Allows us to drop.
  e.dataTransfer.dropEffect = 'move';  // See the section on the DataTransfer object.
  return false;
};

//this === Annotator
function _handleDragStart(e) {
  e.target.classList.add('over');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', e.target.id);
};

//this === Annotator
function _handleDragEnd(e) {
  e.target.classList.remove('over');

  var $overed = this.$cont.getElementsByClassName('over')[0];
  if($overed){
    $overed.classList.remove('over');
  }
};

//this === Annotator
function _handleDrop(e,linker) {

  e.preventDefault();
  e.target.classList.remove('over');
  if (e.stopPropagation) {
    e.stopPropagation(); // stops the browser from redirecting.
  }

  var data = e.dataTransfer.getData('text/plain');
  var $el = e.target;

  //create an annotation
  var oa = oaRange.getOa($el);
  oa.body = data;
  this.addOa(oa); //if change of body

  return false;
};

//this === Annotator
function _handleMouseup(e){
  e.preventDefault();
  e.stopPropagation();

  var oa = oaRange.getOa();
  if(oa){
    this.pendingOa = oa;
  }

};


//this === Annotator
function _handleClick(e){

  var sel =  window.getSelection();

  if(!sel.isCollapsed && this.pendingOa){

    var data = e.target.id;
    this.pendingOa.body = e.target.id;
    this.addOa(this.pendingOa);


    if (sel.removeAllRanges) {
      sel.removeAllRanges();
    } else if (sel.empty) {
      sel.empty();
    }

  }
};

module.exports = Annotator;
