.PHONY: dev-frontend dev-backend install-frontend install-backend fmt

install-frontend:
	cd frontend && npm install

install-backend:
	python -m venv backend/.venv && . backend/.venv/bin/activate && pip install -r backend/requirements.txt

dev-frontend:
	cd frontend && npm run dev

dev-backend:
	cd backend && . .venv/bin/activate && FLASK_APP=app/api.py flask run --reload --port 5001

fmt:
	@echo "(placeholder for formatting hooks)"
