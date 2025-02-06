// db.js
export const initDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("yourDatabaseName", 1);
  
      request.onerror = (event) => {
        console.error("Error opening database:", event.target.error);
        reject(event.target.error);
      };
  
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("yourStoreName")) {
          db.createObjectStore("yourStoreName", { keyPath: "id", autoIncrement: true });
        }
      };
  
      request.onsuccess = (event) => {
        const db = event.target.result;
        resolve(db);
      };
    });
  };