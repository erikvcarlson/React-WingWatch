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


def safe_literal_eval(value):
    try:
        result = ast.literal_eval(value)
        if isinstance(result, list):
            return result 
        else:
            print("!! WARNING !! \n safe_literal_eval is returning an empty list")
            return([])
    except (SyntaxError, ValueError):
        return []



@app.post("/process-csv/")
async def process_csv(
    stationName: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    antennaNumber: int = Form(...),
    antennas: str = Form(...),  
    csv_file: UploadFile = File(...)
):
    print(f"Received Data: stationName={stationName}, latitude={latitude}, longitude={longitude}, antennas={antennas}, antennaNumber={antennaNumber}")

    try:

        print(f"Converting Antennas to a list")

        print(antennas)
        # Convert antennas from JSON string to list

        antennas_list = safe_literal_eval(antennas) 

        print(type(antennas_list))
        print(f"Antennas converted")

        try:
            print(f"Checking file: {csv_file.filename}")
            
            if not csv_file:
                return JSONResponse({"error": "No file uploaded"}, status_code=400)

            print(f"Reading CSV file")
            contents = await csv_file.read()
            print(f"Read {len(contents)} bytes")

            df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
            print(f"CSV successfully loaded into DataFrame with {df.shape[0]} rows and {df.shape[1]} columns")
        except Exception as e:
            print(f"Error reading CSV file: {str(e)}")

        pattern = pd.read_csv(io.StringIO(contents.decode("utf-8")))

        print(f"Pattern read")

        # Create station
        Station_1 = station.Station(stationName, latitude, longitude,antennas=antennas_list)
        
        print(f"Station created")

        # Create and assign antenna
        a1 = antenna.Antenna(antennaNumber, 'test', 0, 0)
        a1.assign_pattern(pattern)


        print(f"Antenna created and pattern assigned")

        print(f"Adding antenna {int(antennaNumber)} to station")
        Station_1.add_antenna(a1,antenna_number=int(antennaNumber))
        print(f"Antenna added to station")

        for i in range(len(Station_1.antennas)): 
            if not isinstance(Station_1.antennas[i], str):
                Station_1.antennas[i] = object_to_base64_string(Station_1.antennas[i])
        print(f"Antennas Patterns processed to Base64")


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
    uvicorn.run(app, host="0.0.0.0", port=8000,limit_max_requests=500000000)
