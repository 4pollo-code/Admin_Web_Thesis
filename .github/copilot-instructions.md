# Copilot Instructions for Admin_Web_Thesis

## Big Picture Architecture
- **Monorepo structure**: Contains `fullstack/backend` (Flask API) and `fullstack/frontend` (React UI).
- **Backend**: Python Flask app, modularized in `app/` (with `routes/`, `models.py`, `config.py`).
- **Frontend**: React app in `src/`, with pages, components, and CSS modules.
- **Data flow**: Frontend communicates with backend via RESTful API endpoints (see `app/routes/`).

## Developer Workflows
- **Backend**:
  - Install dependencies: `pip install -r requirements.txt` (run in `fullstack/backend`)
  - Run server: `python run.py` or `flask run` (ensure `FLASK_APP=app`)
  - Main entry: `run.py` (may wrap Flask app)
- **Frontend**:
  - Install dependencies: `npm install` (run in `fullstack/frontend`)
  - Start dev server: `npm start`

## Project-Specific Conventions
- **Backend**:
  - API routes are split by domain: `routes/auth.py`, `routes/dataManagement.py`, etc.
  - Services (business logic) live in `services/` (e.g., `email_automation.py`, `hashing.py`).
  - Configuration in `config.py`.
- **Frontend**:
  - Pages in `src/pages/`, components in `src/components/`.
  - CSS modules per feature (e.g., `src/pages/css/dashboard.css`).
  - Use `.jsx` for React components, `.js` for utility files.

## Integration Points & External Dependencies
- **Backend**:
  - Flask, plus any packages in `requirements.txt`.
  - May use email, Excel, and hashing services (see `services/`).
- **Frontend**:
  - React, plus npm packages in `package.json`.
  - Communicates with backend via fetch/axios (see API calls in `src/pages/` and `src/components/`).

## Examples & Patterns
- **Adding a new API route**: Create a new file in `app/routes/`, import and register blueprint in `app/__init__.py`.
- **Adding a new page**: Create a `.jsx` file in `src/pages/`, add route in `src/App.jsx`.
- **Styling**: Add CSS file in appropriate `css/` folder and import in component/page.

## Key Files & Directories
- `fullstack/backend/app/routes/` — API endpoints
- `fullstack/backend/app/services/` — business logic
- `fullstack/backend/app/models.py` — data models
- `fullstack/frontend/src/pages/` — React pages
- `fullstack/frontend/src/components/` — shared UI components

---
For more details, see the individual `README.md` files in `fullstack/`, `backend/`, and `frontend/`.
