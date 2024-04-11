const apiKey = "6cGLbRyoUnb5ibT7adQCgxd5GiEM6TEkPmmPSPfg";

async function fetchPhotos() {
  const rover = document.getElementById("rover").value;
  const camera = document.getElementById("camera").value;
  const sol = document.getElementById("sol").value;
  const apiUrl = `https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}/photos?sol=${sol}&camera=${camera}&api_key=${apiKey}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    displayPhotos(data.photos);
  } catch (error) {
    console.error("Error fetching data:", error);
    document.getElementById(
      "photos"
    ).innerHTML = `<p>Error fetching photos. Please try again later.</p>`;
  }
}

async function fetchPhotosBoth() {
  const rovers = ["Curiosity", "Perseverance", "Opportunity"];
  const sol = document.getElementById("sol").value;
  const cameraGroups = [
    ["FHAZ", "RHAZ"],
    ["MAST", "CHEMCAM"],
    ["NAVCAM", "MINITES"],
  ];

  const requests = rovers.map((rover, index) => {
    const cameras = cameraGroups[index];
    return Promise.any(
      cameras.map((camera) =>
        fetch(
          `https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}/photos?sol=${sol}&camera=${camera}&api_key=${apiKey}`
        ).then((response) => response.json())
      )
    );
  });

  try {
    const responses = await Promise.all(requests);
    const photos = responses.flatMap((response) => response.photos);
    displayPhotos(photos);
  } catch (error) {
    console.error("Error fetching data:", error);
    document.getElementById(
      "photos"
    ).innerHTML = `<p>Failed to fetch photos. Please try again later.</p>`;
  }
}

function displayPhotos(photos) {
  if (window.Worker) {
    const worker = new Worker("photoWorker.js");
    worker.postMessage(photos);

    worker.onmessage = function (e) {
      const processedPhotos = e.data;
      const photosContainer = document.getElementById("photos");
      photosContainer.innerHTML = "";
      if (processedPhotos.length > 0) {
        processedPhotos.forEach((photo) => {
          const photoElement = document.createElement("div");
          photoElement.className = "photo";

          const imgElement = document.createElement("img");
          imgElement.src = photo.img_src;
          imgElement.alt = `Mars Rover Photo taken by ${photo.camera.full_name}`;

          const infoElement = document.createElement("p");
          infoElement.innerHTML = `<strong>Rover:</strong> ${photo.rover.name}<br>
            <strong>Camera:</strong> ${photo.camera.full_name}<br>
            <strong>Earth Date:</strong> ${photo.earth_date}<br>
            <strong>Sol:</strong> ${photo.sol}`;

          photoElement.appendChild(imgElement);
          photoElement.appendChild(infoElement);
          photosContainer.appendChild(photoElement);
        });
      } else {
        photosContainer.innerHTML =
          "<p>No photos found for this selection.</p>";
      }
    };

    worker.onerror = function (error) {
      console.error("Error in worker:", error.message);
    };
  } else {
    console.log("Web Workers not supported in this browser.");
  }
}

document.getElementById("fetchPhotos").addEventListener("click", fetchPhotos);
