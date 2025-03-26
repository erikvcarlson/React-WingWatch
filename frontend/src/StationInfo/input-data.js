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
import { useIndexedDB, getAllData, putData } from "../indexeddb/useIndexedDB";
import { v4 as uuidv4 } from 'uuid';
import pako from 'pako';

export default function InputStationData({ refreshMarkers }) {
    const { stationDB, antennaDB, patternDB } = useIndexedDB();

    const [stationData, setStationData] = useState({
        id: '',
        latitude: '',
        longitude: '',
        stationName: ''
    });

    const [antennaData, setAntennaData] = useState({
        antennaNumber: '',
        stationId: '' // Initialize stationId
    });

    const [patternData, setPatternData] = useState({
        csvBase64: '',
        antennaId: ''
    });

    const [stations, setStations] = useState([]);

    

    function isFloat(n){
        return Number(n) === n && n % 1 !== 0;
    }

    const fetchStations = async () => {
        if (!stationDB) {
            console.warn("Station database not ready yet.");
            return;
        }
        try {
            const data = await getAllData("stations", stationDB);
            setStations(data);
        } catch (error) {
            console.error("Error fetching stations:", error);
        } finally {
            return;
        }
    };
    
    useEffect(() => {
        if (stationDB) {
            fetchStations();
        }
    }, [stationDB]);
    

    const handleChangeStation = (e) => {
        setStationData({ ...stationData, [e.target.name]: e.target.value });
    };

    const handleChangeAntenna = (e) => {
        const selectedStationId = e.target.value;
        setAntennaData({ ...antennaData, stationId: selectedStationId });
    
        // Find the selected station from the stations array
        const selectedStation = stations.find(station => station.id === selectedStationId);
        if (selectedStation) {
            setStationData({
                id: selectedStation.id,
                stationName: selectedStation.stationName,
                latitude: selectedStation.latitude,
                longitude: selectedStation.longitude
            });
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                setPatternData({ ...patternData, csvBase64: reader.result.split(',')[1] });
            };
        }
    };

    const handleSaveStation = async () => {
        if (!stationData.stationName || !stationData.latitude || !stationData.longitude) {
            alert('Error: Station Name, Latitude, and Longitude are required.');
            console.error("Error: Station Name, Latitude, and Longitude are required.");
            return;
        }
    
        if (stationData.latitude > 90 || stationData.latitude < -90 || !isFloat(parseFloat(stationData.latitude))) {
            alert('Invalid value for Latitude was entered.');
            console.error("Invalid value for Latitude entered.");
            return;
        }
    
        if (stationData.longitude > 180 || stationData.longitude < -180 || !isFloat(parseFloat(stationData.longitude))) {
            alert('Invalid value for Longitude was entered.');
            console.error("Invalid value for Longitude entered.");
            return;
        }
    
        try {
            const existingStations = await getAllData("stations", stationDB);
            const existingStation = existingStations.find(station => station.stationName === stationData.stationName);
    
            if (existingStation) {
                // Update the existing station's location
                const updatedStation = { ...existingStation, latitude: stationData.latitude, longitude: stationData.longitude };
                await putData(updatedStation, stationDB, "stations");
                console.log("Station location updated:", updatedStation);
            } else {
                // Create a new station
                const stationUUID = uuidv4();
                const newStation = { ...stationData, id: stationUUID };
                await putData(newStation, stationDB, "stations");
                console.log("New station saved:", newStation);
            }
    
            refreshMarkers();
            fetchStations();
        } catch (error) {
            console.error("Error saving/updating station:", error);
        }
    };

    const handleSubmit = async () => {
        //Validate the inputs


        if (!antennaData.antennaNumber || !patternData.csvBase64 || !antennaData.stationId) {
            console.error("Error: Antenna number, CSV file, and Station selection are required.");
            return;
        }
    
        if (!Number.isInteger(parseInt(antennaData.antennaNumber))) {
            alert('The Antenna Number needs to be an Integer');
            console.error("The Antenna Number needs to be an Integer");
            return;
        }


        //Check if an antenna on that station exists, if it does we will update the existing station as opposed to creating a new instance. 
    
        try {
            const existingAntennas = await getAllData("antennas", antennaDB);
            let antennaEntry = existingAntennas.find(a => a.antennaNumber === parseInt(antennaData.antennaNumber) && a.stationId === antennaData.stationId);
    
            if (!antennaEntry) {
                // Create a new antenna entry if it doesn't exist
                const antennaUUID = uuidv4();
                antennaEntry = {
                    id: antennaUUID,
                    stationId: antennaData.stationId,
                    antennaNumber: parseInt(antennaData.antennaNumber)
                };
                await putData(antennaEntry, antennaDB, "antennas");
                console.log("New antenna saved:", antennaEntry);
            }
    
            // Check if a pattern already exists for this antenna
            const existingPatterns = await getAllData("patterns", patternDB);
            const existingPattern = existingPatterns.find(pattern => pattern.antennaId === antennaEntry.id);
    
            const csvData = atob(patternData.csvBase64);
            const compressedCsv = pako.deflate(csvData, { to: 'string' });
    
            if (existingPattern) {
                // Update existing pattern
                const updatedPattern = { ...existingPattern, compressedCsv: compressedCsv };
                await putData(updatedPattern, patternDB, "patterns");
                console.log("Pattern updated:", updatedPattern);
            } else {
                // Save new pattern
                const patternUUID = uuidv4();
                const newPattern = {
                    id: patternUUID,
                    antennaId: antennaEntry.id,
                    compressedCsv: compressedCsv
                };
                await putData(newPattern, patternDB, "patterns");
                console.log("New pattern saved:", newPattern);
            }
    
            refreshMarkers();
        } catch (error) {
            console.error("Error saving/updating data:", error);
        }
    };
    

    return (
        <Box component="form" sx={{ '& > :not(style)': { m: 1, width: '100%' } }} noValidate autoComplete="off">
            <TextField label="Name of Station" name="stationName" value={stationData.stationName} onChange={handleChangeStation} fullWidth />
            <TextField label="Latitude" name="latitude" value={stationData.latitude} onChange={handleChangeStation} fullWidth />
            <TextField label="Longitude" name="longitude" value={stationData.longitude} onChange={handleChangeStation} fullWidth />
            <Button variant="contained" onClick={handleSaveStation} fullWidth>Save Station</Button>

            <FormControl fullWidth>
                <InputLabel id="station-select-label">Select a Station</InputLabel>
                <Select
                    labelId="station-select-label"
                    name="stationId"
                    value={antennaData.stationId}
                    onChange={handleChangeAntenna}
                >
                    {stations.map((station) => (
                        <MenuItem key={station.id} value={station.id}>
                            {station.stationName}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <TextField label="Antenna Number" name="antennaNumber" value={antennaData.antennaNumber} onChange={handleChangeAntenna} fullWidth />
            <Button variant="contained" component="label" fullWidth>
                Upload CSV for Pattern
                <input type="file" hidden accept=".csv" onChange={handleFileChange} />
            </Button>

            <Button variant="contained" onClick={handleSubmit} fullWidth>Submit Pattern</Button>
        </Box>
    );
}