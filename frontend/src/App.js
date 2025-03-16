import 'leaflet/dist/leaflet.css';
import "./styles.css";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import InputStationData from './StationInfo/input-data';
import BasicMap from './Map/map'
import Grid from '@mui/material/Grid';
import { useState, useEffect } from 'react';
import { getAllData,useIndexedDB } from './indexeddb/useIndexedDB'; // Import function to fetch data
import Switch from '@mui/material/Switch';  // Import Switch component
import FormControlLabel from '@mui/material/FormControlLabel';
import StationSelectionCard from './DetectionGenerator/Detection';


export default function Dashboard() {
  const { stationDB } = useIndexedDB();
  const [markers, setMarkers] = useState([]);
  const [showMarkers, setShowMarkers] = useState(true);
  const [detectionArea, setDetectionArea] = useState([]); 

  const fetchMarkers = async () => {
    try {
      const data = await getAllData("stations", stationDB);
      setMarkers(data);
    } catch (error) {
      console.error("Error loading markers:", error);
    }
  };

  useEffect(() => {
    if (stationDB) fetchMarkers();
  }, [stationDB]);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6">Station Creation Terminal</Typography>
            <InputStationData refreshMarkers={fetchMarkers} />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6">Map</Typography>
            <BasicMap markers={showMarkers ? markers : []} detectionArea={detectionArea} />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6">Detection Generator</Typography>
            <StationSelectionCard setDetectionArea={setDetectionArea} />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6">Map Properties and Layer Control</Typography>
            <FormControlLabel
              control={<Switch checked={showMarkers} onChange={() => setShowMarkers(!showMarkers)} />}
              label={showMarkers ? "Hide Stations" : "Show Stations"}
            />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}



