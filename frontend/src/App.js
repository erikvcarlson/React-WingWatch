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
import { getAllData } from './indexeddb/useIndexedDB'; // Import function to fetch data
import Switch from '@mui/material/Switch';  // Import Switch component
import FormControlLabel from '@mui/material/FormControlLabel';
import StationSelectionCard from './DetectionGenerator/Detection';


export default function Dashboard() {

  const [markers, setMarkers] = useState([]);
  const [showMarkers, setShowMarkers] = useState(true); // State to control marker visibility

  // Function to fetch markers from IndexedDB
  const fetchMarkers = async () => {
    try {
      const data = await getAllData("yourStoreName");
      setMarkers(data);
    } catch (error) {
      console.error("Error loading markers:", error);
    }
  };

  // Fetch markers on mount
  useEffect(() => {
    fetchMarkers();
  }, []);


  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} md={4}> {/* Column 1, Row 1 */}
        <Card>
          <CardContent>
            <Typography variant="h6">Station Creation Terminal  </Typography>
            <InputStationData refreshMarkers={fetchMarkers} />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={4}> {/* Column 2, Row 1 */}
        <Card>
          <CardContent>
            <Typography variant="h6">Map</Typography>
            <BasicMap markers={showMarkers ? markers : []} /> {/* Pass empty array if hidden */}
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={4}> {/* Column 3, Row 1 */}
        <Card> {/* Added a Card for consistency */}
          <CardContent>
            {/* <Typography variant="h6">Placeholder 1</Typography> Added a title */}
            <StationSelectionCard />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={4}> {/* Column 1, Row 2 */}
        <Card> {/* Added a Card for consistency */}
          <CardContent>
            <Typography variant="h6">Placeholder 2</Typography> {/* Added a title */}
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6">Map Properties and Layer Control</Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={showMarkers}
                  onChange={() => setShowMarkers(!showMarkers)}
                />
              }
              label={showMarkers ? "Hide Stations" : "Show Stations"}
            />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={4}> {/* Column 3, Row 2 (Empty) */}
        <Card>
          <CardContent>
            <Typography variant="h6">Placeholder 4</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
  }



