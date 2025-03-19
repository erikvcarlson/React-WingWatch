# Installation Instructions

## Linux Installation
First clone the repository to a local directory:

```shell
git clone https://github.com/erikvcarlson/React-WingWatch.git
```

Next Install and start the frontent:

```shell
sudo apt install npm nodejs
```

change directory into the frontend directory

```shell
cd frontend
npm install 
```

start the frontend development server

```shell
npm start 
```

you should get a command that the frontend was compiled successfully and you can view the applet in the browser. Locally this will be at:

http://localhost:3000

For the applet to work, you also need to run the backend. In a new terminal, you will need to move into the backend directory and install the required packages using the python requirements file. 

```shell
cd backend
pip3 install -r requirements.txt
```

You can then start the backend using: 

```shell
python3 main.py
```

You should get a line that says: 

```shell
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```
## Reporting an Issue
To report an issue, use the Issues tab in Github. Please provide the most robust information as possible. Helpful information and attachments includes: 

1) Output of the web console from the Chrome DevTools page (or equivalent in other browsers)

2) Screenshots of your indexeddb entires in the StationInformation, PatternInformation and AntennaInformation databases.

3) Any relevant antenna pattern files