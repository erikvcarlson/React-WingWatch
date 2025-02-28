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
import { useIndexedDB, getAllData,putData } from "../indexeddb/useIndexedDB";
import {v4 as uuidv4} from 'uuid';


export default function InputStationData({ refreshMarkers }) {
    const { stationDB,antennaDB,patternDB } = useIndexedDB();

    const [stationData, setStationData] = useState({
        stationName: '',
        latitude: '',
        longitude: ''
    });


    const fetchStations = async () => {
        try {
            const data = await getAllData("stations", stationDB);
            console.log("Fetched stations:", data);
            setStations(data);
        } catch (error) {
            console.error("Error fetching stations:", error);
        }
    };



    const [stations, setStations] = useState([]);

    useEffect(() => {
        fetchStations();
    }, []);

    const handleChangeAddPattern = async (e) => {
        const selectedStationId = e.target.value;
    
        try {
                const data = await getAllData("stations",stationDB);
                const updatedStations = await getAllData("stations",stationDB);
            setStations(updatedStations);
    
            const selectedStation = updatedStations.find(station => station.id === selectedStationId);
    
            if (selectedStation) {
                setStationData(prevState => ({
                    ...prevState,
                    stationName: selectedStation.id,
                    latitude: selectedStation.latitude,
                    longitude: selectedStation.longitude,
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
        
        const ident = uuidv4();


        const dataToSave = {
            id: ident,  // Use UUID as ID
            stationName: stationData.stationName,
            latitude: parseFloat(stationData.latitude),
            longitude: parseFloat(stationData.longitude),
        };
    
        try {
            await putData(dataToSave,stationDB,"stations");
            console.log("Data saved:", dataToSave);
            refreshMarkers(); 
            const updatedStations = await getAllData("stations",stationDB);
            setStations(updatedStations);
    
        } catch (error) {
            console.error("Error saving data:", error);
        }
    };

    const handleSubmit = async () => {
        console.log("handleSubmit entered.");
        if (!stationData.csvBase64 || !stationData.antennaNumber) return;
    
        const stationUUID = stationData.ident;
        const antennaUUID = uuidv4();
        const patternUUID = uuidv4();
    
        // Save the antenna entry
        const antennaEntry = {
            id: antennaUUID,
            stationId: stationUUID,
            antennaNumber: stationData.antennaNumber,
        };
    
        try {
            await putData(antennaEntry, antennaDB, "antennas");
            console.log("Antenna entry saved:", antennaEntry);
    
            // Decode and parse the CSV
            const csvData = atob(stationData.csvBase64);
            const rows = csvData.split("\n").slice(1);
            
            for (const row of rows) {
                const [x, y, z, rssi] = row.split(",").map(val => val.trim());
                if (x && y && z && rssi) {
                    const patternEntry = {
                        id: patternUUID,
                        antennaId: antennaUUID,
                        x: parseFloat(x),
                        y: parseFloat(y),
                        z: parseFloat(z),
                        rssi: parseFloat(rssi)
                    };
                    await putData(patternEntry, patternDB, "patterns");
                    console.log("Pattern entry saved:", patternEntry);
                }
            }
    
            refreshMarkers();
        } catch (error) {
            console.error("Error saving data:", error);
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
                            {station.stationName}
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
