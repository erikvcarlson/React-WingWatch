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
import { getAllData } from "../indexeddb/useIndexedDB"; // Import IndexedDB helper function

export default function StationSelectionCard() {
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

    // Fetch stations from IndexedDB on mount
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

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleGo = () => {
        console.log("Form Data Submitted:", formData);
        // Add processing logic here
    };

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
                                        {station.id}
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
