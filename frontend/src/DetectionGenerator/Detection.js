import { useState, useEffect } from 'react';
import * as React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { useIndexedDB, getAllData } from "../indexeddb/useIndexedDB";
import BasicMap from '../Map/map'
import { radioGroupClasses } from '@mui/material';



export default function StationSelectionCard({ setDetectionArea }) {
    const { stationDB, antennaDB, patternDB } = useIndexedDB();

    const [stations, setStations] = useState([]);
    const [formData, setFormData] = useState({
        station1: '',
        antenna1: '',
        strength1: '',
        station2: '',
        antenna2: '',
        strength2: '',
        station3: '',
        antenna3: '',
        strength3: ''
    });

    const [detectionArea] = useState([]);


    const fetchStations = async () => {
        try {
            const data = await getAllData("stations", stationDB);
            setStations(data);
        } catch (error) {
            console.error("Error fetching stations:", error);
        }
    };

    useEffect(() => {
        if (stationDB) {
            fetchStations();
        }
    }, [stationDB]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const fetchAntennaPattern = async (stationId, antennaNumber) => {
        console.log("Fetching pattern for station:", stationId, "antenna:", antennaNumber);
        try {
            const antennas = await getAllData("antennas", antennaDB);
            
        
            const antenna = antennas.find((a) => a.stationId === stationId && a.antennaNumber === antennaNumber.toString());
            
            if (antenna) {
                const patterns = await getAllData("patterns", patternDB);
                const pattern = patterns.find((p) => p.antennaId === antenna.id);
                console.log(antenna.id);
                return pattern ? pattern.compressedCsv : null;
            }
        } catch (error) {
            console.error("Error fetching antenna pattern:", error);
        }
        return null;
    };


    const handleGo = async () => {
        console.log("Starting Payload Collection");
    
        const payload = await Promise.all(
            [1, 2, 3].map(async (num) => {
                const station = stations.find((s) => s.id === formData[`station${num}`]);
                const compressedCsv = await fetchAntennaPattern(formData[`station${num}`], formData[`antenna${num}`]);
    
                const base64Csv = compressedCsv ? arrayBufferToBase64(compressedCsv) : null;
    
                if (station) {
                    return {
                        stationName: station.stationName,
                        latitude: station.latitude,
                        longitude: station.longitude,
                        compressedCsv: base64Csv,
                        strength: formData[`strength${num}`]
                    };
                }
                return null;
            })
        );
    
        console.log("Payload to send:", payload);
    
        try {
            const response = await fetch('http://0.0.0.0:8000/generate-region', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ payload })
            });
    
            if (response.ok) {
                const result = await response.json();
                console.log("API Response:", result);
    
                const latLongCoords = result[0];
                const radius = result[1]; // Ensure 'radius' is declared with 'const'
    
                const areaCoords = {
                    latitude: latLongCoords[0],
                    longitude: latLongCoords[1],
                    elevation: latLongCoords[2],
                    radius: radius
                };
    
                console.log("Detection Area Generated:", areaCoords);
                setDetectionArea(areaCoords); // Correct state update
                console.log(detectionArea && detectionArea.length > 2);
            } else {
                console.error("Failed to send payload:", response.statusText);
            }
        } catch (error) {
            console.error("Error sending payload:", error);
        }
    };

    // Helper function for efficient Base64 encoding
    function arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    return (
        <Card>
            <CardContent>
                <Typography variant="h6">Station Selection</Typography>
                {[1, 2, 3].map((num) => (
                    <Box key={num} sx={{ mt: 2 }}>
                        <FormControl fullWidth>
                            <InputLabel>Station {num}</InputLabel>
                            <Select
                                value={formData[`station${num}`]}
                                name={`station${num}`}
                                onChange={handleChange}
                            >
                                {stations.map((station) => (
                                    <MenuItem key={station.id} value={station.id}>
                                        {station.stationName}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            label={`Antenna Number`}
                            name={`antenna${num}`}
                            value={formData[`antenna${num}`]}
                            onChange={handleChange}
                            fullWidth
                            sx={{ mt: 1 }}
                        />

                        <TextField
                            label={`Strength of Station ${num} Detection`}
                            name={`strength${num}`}
                            value={formData[`strength${num}`]}
                            onChange={handleChange}
                            fullWidth
                            sx={{ mt: 1 }}
                        />
                    </Box>
                ))}

                <Button variant="contained" onClick={handleGo} fullWidth sx={{ mt: 2 }}>
                    Go!
                </Button>
            </CardContent>
        </Card>
    );
}
