# HPC Report Card — Backend API

FastAPI backend with Turso Cloud SQLite integration and Node.js Puppeteer PDF generator.

## Prerequisites
- Python 3.10+
- Node.js (for Puppeteer PDF rendering)

## Setup
1. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # Linux/macOS:
   source .venv/bin/activate
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Install Node dependencies (for PDF generation):
   ```bash
   npm install
   ```
4. Configure environment variables in `.env`:
   ```env
   TURSO_DATABASE_URL=https://hpc-db-harinarayananlk-ai.aws-ap-south-1.turso.io
   TURSO_AUTH_TOKEN=your_turso_token_here
   ```

## Running the Server
```bash
python main.py
```
Or with auto-reload:
```bash
uvicorn main:app --host 0.0.0.0 --port 3000 --reload
```
API endpoints are served at `http://localhost:3000/api`.
Interactive OpenAPI docs are available at `http://localhost:3000/docs`.
