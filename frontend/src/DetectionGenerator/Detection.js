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

export default function StationSelectionCard() {
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

    useEffect(() => {
        const fetchStations = async () => {
            try {
                const data = await getAllData("stations", stationDB);
                setStations(data);
            } catch (error) {
                console.error("Error fetching stations:", error);
            }
        };
        fetchStations();
    }, [stationDB]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const fetchAntennaPattern = async (stationId, antennaNumber) => {
        console.log("Fetching pattern for station:", stationId, "antenna:", antennaNumber);
        try {
            const antennas = await getAllData("antennas", antennaDB);
            const antenna = antennas.find((a) => a.stationId === stationId && a.number === antennaNumber);
            
            if (antenna) {
                const patterns = await getAllData("patterns", patternDB);
                const pattern = patterns.find((p) => p.antennaId === antenna.id);
                console.log(antenna.id);
                return pattern ? pattern.csvBase64 : null;
            }
        } catch (error) {
            console.error("Error fetching antenna pattern:", error);
        }
        return null;
    };

    const handleGo = async () => {
        const payload = await Promise.all(
            [1, 2, 3].map(async (num) => {
                const station = stations.find((s) => s.id === formData[`station${num}`]);
                const patternCsv = await fetchAntennaPattern(formData[`station${num}`], formData[`antenna${num}`]);
                
                if (station) {
                    return {
                        stationName: station.stationName,
                        latitude: station.latitude,
                        longitude: station.longitude,
                        patternCsv: patternCsv,
                        strength: formData[`strength${num}`]
                    };
                }
                return null;
            })
        );

        console.log("Payload to send:", payload);
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
