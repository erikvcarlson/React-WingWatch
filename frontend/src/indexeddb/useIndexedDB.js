// useIndexedDB.js
import { useState, useEffect } from "react";
import { initStationDB, initAntennaDB, initPatternDB } from "./db";

export const getAllData = (storeName, dbInstance) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!dbInstance) {
        return reject("Database not initialized");
      }
      const transaction = dbInstance.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    } catch (error) {
      console.error("Error fetching data from IndexedDB:", error);
      reject(error);
    }
  });
};

export const putData = (data, dbInstance, storeName) => {
  if (!dbInstance) return Promise.reject("Database not initialized");

  return new Promise((resolve, reject) => {
    const transaction = dbInstance.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });

  return { dbInstance, putData };
};


export const useIndexedDB = () => {
  const [stationDB, setStationDB] = useState(null);
  const [antennaDB, setAntennaDB] = useState(null);
  const [patternDB, setPatternDB] = useState(null);

  useEffect(() => {
    const openDB = async () => {
      try {
        const station = await initStationDB();
        console.log("StationInformation database opened successfully:", station);
        setStationDB(station);

        const antenna = await initAntennaDB();
        console.log("AntennaInformation database opened successfully:", antenna);
        setAntennaDB(antenna);

        const pattern = await initPatternDB();
        console.log("PatternInformation database opened successfully:", pattern);
        setPatternDB(pattern);
      } catch (error) {
        console.error("Error initializing database:", error);
      }
    };

    openDB();
  }, []);

  return {
    stationDB,
    antennaDB,
    patternDB,
  };
};


