self.onmessage = function (e) {
  const photos = e.data;

  postMessage(photos);
};
