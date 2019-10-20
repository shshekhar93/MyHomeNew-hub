'use strict';

export const getViewPortWidth = () => {
  const d = document;
  const documentElement = d.documentElement;
  const body = d.getElementsByTagName('body')[0];
  return (window.innerWidth || documentElement.clientWidth || body.clientWidth);
};

export const noop = () => {};

export const findParent = (parentClassName, thisElem, maxLevels = 10) => {
  if(!thisElem) {
    return thisElem;
  }

  let theParent = thisElem
  while(theParent && !theParent.className.includes(parentClassName)) {
    theParent = theParent.parentElement;
  };
  return theParent;
};

export function serializeForm(form) {
  const formData = new FormData(form);
  const jsonData = {};
  for(var entry of formData.entries()) {
    jsonData[entry[0]] = entry[1];
  }
  return jsonData;
}
