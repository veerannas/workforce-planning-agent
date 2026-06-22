# Workforce Planning Agent

A workforce planning decision engine deployed on SAP BTP that converts strategic scenarios into costed BBRA (Build, Buy, Redeploy, Automate) action plans.

## Quick Start

```bash
# Backend
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

## Architecture
See `WPA-Architecture.drawio` for full platform diagram.

## Deployment (SAP BTP Cloud Foundry)

**Live URL:** https://workforce-planning-agent.cfapps.us10-001.hana.ondemand.com/

```bash
cd backend
cf push
```
