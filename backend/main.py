from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import io
import ast
import logging
import base64
import pickle
from WingWatch.Equipment import station, antenna


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def object_to_base64_string(obj):
    """
    Converts a Python object to a Base64-encoded string via pickle serialization.
    
    Parameters:
        obj: The Python object to serialize.
    
    Returns:
        A Base64-encoded string representation of the object.
    """
    # Serialize the object to bytes using pickle
    pickle_bytes = pickle.dumps(obj)
    
    # Encode the bytes to a Base64 string
    base64_string = base64.b64encode(pickle_bytes).decode('utf-8')
    
    return base64_string


@app.post("/process-csv/")
async def process_csv(
    stationName: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    antennas: str = Form(...),  
    antennaNumber: str = Form(...),  
    csv_file: UploadFile = File(...)
):
    print(f"Received Data: stationName={stationName}, latitude={latitude}, longitude={longitude}, antennas={antennas}, antennaNumber={antennaNumber}")

    try:

        print(f"Converting Antennas to a list")

        # Convert antennas from JSON string to list
        antennas_list = ast.literal_eval(antennas) 

        print(f"Antennas converted")

        # Read CSV file into Pandas DataFrame
        contents = await csv_file.read()
        pattern = pd.read_csv(io.StringIO(contents.decode("utf-8")))

        # Create station
        Station_1 = station.Station(stationName, latitude, longitude)

        # Create and assign antenna
        a1 = antenna.Antenna(antennaNumber, 'test', 0, 0)
        a1.assign_pattern(pattern)

        Station_1.add_antenna(a1)

        for i in range(len(Station_1.antennas)): 
            if not isinstance(Station_1.antennas[i], str):
                Station_1.antennas[i] = object_to_base64_string(Station_1.antennas[i])

        # Return processed data along with station info
        return JSONResponse({
            "stationName": Station_1.name,
            "latitude": Station_1.lat,
            "longitude": Station_1.long,
            "antennas": Station_1.antennas  # Ensure antennas is a list
        })

    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
