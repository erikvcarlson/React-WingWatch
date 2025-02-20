// useIndexedDB.js
import { useState, useEffect } from "react";
import { initDB } from "./db";

export const useIndexedDB = (storeName) => {
  const [db, setDb] = useState(null);

  useEffect(() => {
    const openDB = async () => {
      try {
        const dbInstance = await initDB();
        setDb(dbInstance);
      } catch (error) {
        console.error("Error initializing database:", error);
      }
    };

    openDB();
  }, []);

  // Use put() instead of add() to avoid "Key already exists" error
  const putData = (data) => {
    if (!db) return Promise.reject("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.put(data); // put() will insert or update data

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  };

  return { db, putData };
};

export const getAllData = (storeName) => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await initDB();
      const transaction = db.transaction([storeName], "readonly");
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
