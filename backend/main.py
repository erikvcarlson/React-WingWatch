from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi import Body
import pandas as pd
import io
import ast
import logging
import base64
import pickle
from WingWatch.Equipment import station, antenna
import json
from pydantic import BaseModel
import zlib
from WingWatch.Intersections.detection import Detection
from WingWatch.Intersections import tri
import scipy.spatial as ss
from WingWatch.Tools import translation


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PayloadItem(BaseModel):
    stationName: str
    latitude: float
    longitude: float
    compressedCsv: str
    strength: str

class Payload(BaseModel):
    payload: list[PayloadItem]

def process_incoming_pattern_data(payload_compressedCSV):
    print('Entering the Region Generation API')
    base64decode1 = base64.b64decode(payload_compressedCSV) 
    print('Decode Successful')
    decompressed_data = zlib.decompress(base64decode1)
    print(f"Decompressed data (first 50 bytes): {decompressed_data[:50]}")
    print('Decompress Successful')
    csv_string = decompressed_data.decode('utf-8')
    print('Convert to String Successful')
    df = pd.read_csv(io.StringIO(csv_string))
    print("Complete") 
    return df


@app.post("/generate-region/")
async def process_csv(payload: Payload):
    try:
        pattern1 = process_incoming_pattern_data(payload.payload[0].compressedCsv)
        pattern2 = process_incoming_pattern_data(payload.payload[1].compressedCsv)
        pattern3 = process_incoming_pattern_data(payload.payload[2].compressedCsv)
        
        freq_of_antenna_MHz = 434
        antenna_number = 1
        antenna_type = 'test'
        bearing_of_antenna = 0 

        station1 = station.Station(payload.payload[0].stationName,float(payload.payload[0].latitude),float(payload.payload[0].longitude))
        
        a1 = antenna.Antenna(antenna_number,antenna_type,bearing_of_antenna,freq_of_antenna_MHz)
        a1.assign_pattern(pattern1)
        station1.add_antenna(a1,int(antenna_number))
        
        station2 = station.Station(payload.payload[1].stationName,float(payload.payload[1].latitude),float(payload.payload[1].longitude))
        
        a1 = antenna.Antenna(antenna_number,antenna_type,bearing_of_antenna,freq_of_antenna_MHz)
        a1.assign_pattern(pattern2)
        station2.add_antenna(a1,int(antenna_number))
        
        station3 = station.Station(payload.payload[2].stationName,float(payload.payload[2].latitude),float(payload.payload[2].longitude))

        a1 = antenna.Antenna(antenna_number,antenna_type,bearing_of_antenna,freq_of_antenna_MHz)
        a1.assign_pattern(pattern3)
        station3.add_antenna(a1,int(antenna_number))



        det1 = Detection(station1,int(payload.payload[0].strength),1)
        det2 = Detection(station2,int(payload.payload[1].strength),1)
        det3 = Detection(station3,int(payload.payload[2].strength),1)

        data_to_send_through = [det1,det2,det3]
        intersections,hull_of_intersections = tri.overlap_of_three_radiation_patterns(data_to_send_through)

        translation.convert_back_to_lla()
        print(intersections)
        return intersections


    except Exception as e:
        print(e)
        return JSONResponse({"error": str(e)}, status_code=500)



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000,limit_max_requests=500000000)
