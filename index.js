var oaRange = require('oa-range')
  , OaScrollbar = require('oa-scrollbar');

function Annotator(ids, opts){
  this.containerId = ids.container || 'main';
  this.scrollbar = new OaScrollbar(this.containerId);

  this.cont = document.getElementById(this.containerId);

  this.oas = {}; //hash of all the annotation (key = oa.id)
  this.pendingOa;

  this.cont.addEventListener('dragenter', _handleDragEnter.bind(this), false);
  this.cont.addEventListener('dragleave', _handleDragLeave.bind(this), false);
  this.cont.addEventListener('dragover', _handleDragOver.bind(this), false);
  this.cont.addEventListener('drop', _handleDrop.bind(this), false);

  //TODO add on new resource / remove on resource deletion
  var $draggables = document.getElementsByClassName('draggable');
  Array.prototype.forEach.call($draggables, function($el){
    $el.addEventListener('dragstart', _handleDragStart.bind(this), false);
    $el.addEventListener('dragend', _handleDragEnd.bind(this), false);

    $el.addEventListener('click', _handleClick.bind(this), false);
  }, this);

  this.cont.addEventListener('mouseup', _handleMouseup.bind(this), false);

  //create delete button
  this.$del = document.createElement('div');
  this.$del.style.position = 'absolute';
  this.$del.style.display = 'none';
  this.$del.innerHTML =  '&times;';
  this.cont.appendChild(this.$del);

};

Annotator.prototype.addOa = function(oa){
  var that = this;

  if(! (oa.id in this.oas)){
    var $divs = oaRange.highlight(oa, this.cont);
    this.scrollbar.addMarker(oa.range);
    oa.markers = $divs;

    //add event listeners to closest element
    var $el = oa.range.commonAncestorContainer;
    if($el.nodeType !== 1){
      $el = $el.parentNode;
    }

    $el.classList.add('oa-parent');

    $el.addEventListener('mouseenter', function(e){
      e.target.style.cursor = 'pointer';
      $divs.forEach(function($div){
        $div.classList.add('over');
      });
    }, false);


    $el.addEventListener('mouseleave', function(e){
      e.target.style.cursor = 'auto';
      $divs.forEach(function($div){
        $div.classList.remove('over');
      });
    }, false);

    $el.addEventListener('click', function(e){
      var sel =  window.getSelection();
      if(!sel.isCollapsed){
        return;
      }

      //handle overlapping markers:
      //find all range with same commonAncestor and pick up the innerMost oa target of the click
      var potentials = [];
      for (var key in that.oas){
        var moa = that.oas[key];
        var rect = _eventInHighlights(e, moa.markers);
        if(rect){
          potentials.push({oa:moa, rect: rect});
        }
      }

      var theone = potentials.sort(function(a, b){return a.rect.width - b.rect.width;})[0];
      if(theone && (theone.oa.id === oa.id)){

        //TODO handle click
        console.log('in', theone.oa.id);

      } else {
        e.preventDefault();
        e.stopPropagation();
      }

    }, false);
  }

  this.oas[oa.id] = oa;
};


function _eventInHighlights (e, $divs){

  for(var i=0; i<$divs.length; i++){
    var rect = $divs[i].getBoundingClientRect();
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

  var $overed = this.cont.getElementsByClassName('over')[0];
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
