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
        antennas: [],
        csvFile: null,
        csvBase64: ''
    });

    const [stations, setStations] = useState([]);

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
            const updatedStations = await getAllData("yourStoreName");
            setStations(updatedStations);
    
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

        if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                setStationData(prevState => ({
                    ...prevState,
                    csvFile: file,
                    csvBase64: reader.result.split(',')[1]  // Extract base64 part
                }));
            };
        }
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
            antennas: []
        };
    
        try {
            await putData(dataToSave);
            console.log("Data saved:", dataToSave);
            refreshMarkers(); 
            const updatedStations = await getAllData("yourStoreName");
            setStations(updatedStations);
    
        } catch (error) {
            console.error("Error saving data:", error);
        }
    };

    const handleSubmit = async () => {
        if (!stationData.csvBase64) return;

        const requestBody = {
            stationName: stationData.stationName,
            latitude: parseFloat(stationData.latitude),
            longitude: parseFloat(stationData.longitude),
            antennaNumber: parseInt(stationData.antennaNumber, 10),
            antennas: stationData.antennas,
            csv_base64: stationData.csvBase64
        };

        console.log("Submitting JSON request body:", requestBody);
    
        try {          
            const response = await fetch("http://localhost:8000/process-csv/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestBody),
            });
    
            if (!response.ok) throw new Error("Failed to process CSV");
    
            const data = await response.json();
            console.log("Processed Data:", data);
    
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
                disabled={!stationData.csvBase64}
            >
                Submit
            </Button>
        </Box>
    );
}
