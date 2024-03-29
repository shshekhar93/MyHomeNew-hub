'use strict';

export function serializeForm(form) {
  const formData = new FormData(form);
  const jsonData = {};
  for (const entry of formData.entries()) {
    jsonData[entry[0]] = entry[1];
  }
  return jsonData;
}

export function getReturnURI() {
  const { pathname, search, hash } = window.location;
  return encodeURIComponent(pathname + search + hash);
}
