// db.js

export const initStationDB = () => {
  return new Promise((resolve, reject) => {
      const request = indexedDB.open("StationInformation", 1);

      request.onerror = (event) => {
          console.error("Error opening StationInformation database:", event.target.error);
          reject(event.target.error);
      };

      request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains("stations")) {
              db.createObjectStore("stations", { keyPath: "id", autoIncrement: true });
          }
      };

      request.onsuccess = (event) => {
          const db = event.target.result;
          resolve(db);
      };
  });
};

export const initAntennaDB = () => {
  return new Promise((resolve, reject) => {
      const request = indexedDB.open("AntennaInformation", 1);

      request.onerror = (event) => {
          console.error("Error opening AntennaInformation database:", event.target.error);
          reject(event.target.error);
      };

      request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains("antennas")) {
              db.createObjectStore("antennas", { keyPath: "id", autoIncrement: true });
          }
      };

      request.onsuccess = (event) => {
          const db = event.target.result;
          resolve(db);
      };
  });
};

export const initPatternDB = () => {
  return new Promise((resolve, reject) => {
      const request = indexedDB.open("PatternInformation", 1);

      request.onerror = (event) => {
          console.error("Error opening PatternInformation database:", event.target.error);
          reject(event.target.error);
      };

      request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains("patterns")) {
              db.createObjectStore("patterns", { keyPath: "id", autoIncrement: true });
          }
      };

      request.onsuccess = (event) => {
          const db = event.target.result;
          resolve(db);
      };
  });
};