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

  if(! (oa.id in this.oas)){
    oaRange.highlight(oa, this.cont);
    this.scrollbar.addMarker(oa.range);
  }
  this.oas[oa.id] = oa; //if change of body

  return false;
};

//this === Annotator
function _handleMouseup(e){

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
    this.oas[this.pendingOa.id] =  this.pendingOa;
    oaRange.highlight(this.pendingOa, this.cont);
    this.scrollbar.addMarker(this.pendingOa.range);
  }
};

module.exports = Annotator;
