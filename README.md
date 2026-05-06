## About Us

Team Name: BBY-06

Team Members:

- Julia Ziebart
- Mayvee Tan
- Quinn Callander
- Vicente Goncalves Set 2A
- Brihad Sidda Set 2A
- Ivan Somera

# About the Project

Team BBY-06 is working towards developing a web app directed to citizens of Vancouver to help find nearby parks, shaded areas, and cooling centres during extreme heat.

This is our readme file.
To run the website:

1. Download the files.
2. Open index.html in your browser.

# Set up instructions

- `npm install`
- copy `sample.env` and create own .env with API keys (get a key here https://www.maptiler.com/)
- `npm run dev` to start both servers (Express on port 3000, Vite on port 5173)

# Folder structure

/2800-202610-BBY6
├── client/  
│ ├── public/  
│ ├── src/  
│ │ ├── map.js
│ │ ├── main.js
│ │ └── style.css
│ └── index.html
├── db/
│ └── supabase.js
├── routes/  
├── public/ ← Vite build output (auto-generated, do not edit)
├── sample.env
├── .env
├── package.json
├── server.js
└── vite.config.js
