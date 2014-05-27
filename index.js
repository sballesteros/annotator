var oaRange = require('oa-range')
  , OaScrollbar = require('oa-scrollbar');

function Annotator(ids, opts){
  this.containerId = ids.container || 'main';
  this.scrollbar = new OaScrollbar(this.containerId);

  this.cont = document.getElementById(this.containerId);

  this.oas = {}; //hash of all the annotation (key = oa.id)

  /* draggable resources */

  this.cont.addEventListener('dragenter', _handleDragEnter.bind(this), false);
  this.cont.addEventListener('dragleave', _handleDragLeave.bind(this), false);
  this.cont.addEventListener('dragover', _handleDragOver.bind(this), false);
  this.cont.addEventListener('drop', _handleDrop.bind(this), false);

  //TODO add on new resource / remove on resource deletion
  var $draggables = document.getElementsByClassName('draggable');
  Array.prototype.forEach.call($draggables, function($el){
    $el.addEventListener('dragstart', _handleDragStart.bind(this), false);
    $el.addEventListener('dragend', _handleDragEnd.bind(this), false);
  }, this);

};


//this is Annotator
function _handleDragEnd(e) {
  // this/e.target is the source node.
  e.target.style.opacity = 1;
  Array.prototype.forEach.call(document.getElementsByClassName('articleComponent'), function (el) {
    el.classList.remove('over');
  });
};

//this is Annotator
function _handleDragEnter(e) {
  if(e.target.id !== this.containerId){
    e.target.classList.add('over');
  }
};

//this is Annotator
function _handleDragLeave(e) {
  e.target.classList.remove('over');
};

//this is Annotator
function _handleDragOver(e) {
  e.preventDefault(); // Necessary. Allows us to drop.
  e.dataTransfer.dropEffect = 'move';  // See the section on the DataTransfer object.
  return false;
};

//this is Annotator
function _handleDragStart(e) {
  e.target.classList.add('over');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', e.target.id);
};

//this is Annotator
function _handleDragEnd(e) {
  e.target.classList.remove('over');

  var $overed = this.cont.getElementsByClassName('over')[0];
  if($overed){
    $overed.classList.remove('over');
  }
};

//this is Annotator
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
  if(! (oa.id in this.oas)){
    this.oas[oa.id] = oa;
    oaRange.highlight(oa, this.cont);
    this.scrollbar.addMarker(oa.range);
  }

  return false;
};


module.exports = Annotator;
