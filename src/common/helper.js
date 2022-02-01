'use strict';

export function serializeForm(form) {
  const formData = new FormData(form);
  const jsonData = {};
  for(var entry of formData.entries()) {
    jsonData[entry[0]] = entry[1];
  }
  return jsonData;
}
