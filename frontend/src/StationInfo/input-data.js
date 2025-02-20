'use client';

import { useState, useEffect } from 'react';
import * as React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import { useIndexedDB, getAllData } from "../indexeddb/useIndexedDB";

export default function InputStationData({ refreshMarkers }) {
    const { putData } = useIndexedDB("yourStoreName");

    const [stationData, setStationData] = useState({
        stationName: '',
        latitude: '',
        longitude: '',
        antennaNumber: '',
        antennas: '',
        csvFile: null
    });

    const [stations, setStations] = useState([]);

    // Fetch existing stations from IndexedDB
    useEffect(() => {
        const fetchStations = async () => {
            try {
                const data = await getAllData("yourStoreName");
                setStations(data);
            } catch (error) {
                console.error("Error fetching stations:", error);
            }
        };

        fetchStations();
    }, []);

    const handleChangeAddPattern = async (e) => {
        const selectedStationId = e.target.value;
    
        try {
            // Fetch the latest stations from IndexedDB
            const updatedStations = await getAllData("yourStoreName");
            setStations(updatedStations);
    
            // Find the selected station
            const selectedStation = updatedStations.find(station => station.id === selectedStationId);
    
            if (selectedStation) {
                setStationData(prevState => ({
                    ...prevState,
                    stationName: selectedStation.id,
                    latitude: selectedStation.latitude,
                    longitude: selectedStation.longitude,
                    antennas: selectedStation.antennas 
                }));
            }
        } catch (error) {
            console.error("Error fetching updated stations:", error);
        }
    };
    
    

    const handleChangeStationInit = (e) => {
        setStationData({ ...stationData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setStationData({ ...stationData, csvFile: file });
    };

    const handleSave = async () => {
        if (!stationData.stationName || !stationData.latitude || !stationData.longitude) {
            console.error("Error: Name, Latitude, and Longitude are required.");
            return;
        }
    
        const dataToSave = {
            id: stationData.stationName,
            latitude: parseFloat(stationData.latitude),
            longitude: parseFloat(stationData.longitude),
            antennaNumber: stationData.antennaNumber,
            antennas: '[]' // Ensure empty list on initialization
        };
    
        try {
            await putData(dataToSave);
            console.log("Data saved:", dataToSave);
            refreshMarkers(); // Refresh map after saving
            
            // Re-fetch updated stations from IndexedDB
            const updatedStations = await getAllData("yourStoreName");
            setStations(updatedStations);
    
        } catch (error) {
            console.error("Error saving data:", error);
        }
    };

    const handleSubmit = async () => {
        if (!stationData.csvFile) return;
    
        const formData = new FormData();
        formData.append("stationName", stationData.stationName);
        formData.append("latitude", parseFloat(stationData.latitude));  
        formData.append("longitude", parseFloat(stationData.longitude)); 
        formData.append("antennaNumber", parseInt(stationData.antennaNumber, 10));
        formData.append("antennas", JSON.stringify(stationData.antennas));


        formData.append("csv_file", stationData.csvFile);



        console.log("Selected File:", stationData.csvFile);
        if (stationData.csvFile) {
            console.log("File Name:", stationData.csvFile.name);
            console.log("File Type:", stationData.csvFile.type);
            console.log("File Size:", stationData.csvFile.size);
}
    
        console.log("Submitting FormData...");
    
        for (let pair of formData.entries()) {
            console.log(pair[0] + ': ' + pair[1]);
        }
    
        try {          
            const response = await fetch("http://localhost:8000/process-csv/", {
                method: "POST",
                body: formData,
            });
    
            if (!response.ok) throw new Error("Failed to process CSV");
    
            const data = await response.json();
            console.log("Processed Data:", data);
    
            // Save processed data
            await putData({
                id: data.stationName,
                latitude: data.latitude,
                longitude: data.longitude,
                antennas: data.antennas,
            });
    
            refreshMarkers();
        } catch (error) {
            console.error("Error submitting CSV:", error);
        }
    };

    return (
        <Box component="form" sx={{ '& > :not(style)': { m: 1, width: '100%' } }} noValidate autoComplete="off">
            <TextField 
                label="Name of Station" 
                name="stationName" 
                value={stationData.stationName} 
                onChange={handleChangeStationInit} 
                fullWidth 
            />
            <TextField 
                label="Latitude" 
                name="latitude" 
                value={stationData.latitude} 
                onChange={handleChangeStationInit} 
                fullWidth 
            />
            <TextField 
                label="Longitude" 
                name="longitude" 
                value={stationData.longitude} 
                onChange={handleChangeStationInit} 
                fullWidth 
            />
            <Button variant="contained" onClick={handleSave} fullWidth>Generate</Button>

            <FormControl fullWidth>
                <InputLabel>Select a Station</InputLabel>
                <Select
                    value={stationData.stationName}
                    name="stationName"
                    onChange={handleChangeAddPattern}
                >
                    {stations.map((station) => (
                        <MenuItem key={station.id} value={station.id}>
                            {station.id}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <TextField 
                label="Antenna Number" 
                name="antennaNumber" 
                value={stationData.antennaNumber} 
                onChange={handleChangeStationInit} 
                fullWidth 
            />

            <Button variant="contained" component="label" fullWidth>
                CSV for Pattern
                <input type="file" hidden accept=".csv" onChange={handleFileChange} />
            </Button>

            <Button 
                variant="contained" 
                onClick={handleSubmit} 
                fullWidth 
                disabled={!stationData.csvFile}
            >
                Submit
            </Button>
        </Box>
    );
}
