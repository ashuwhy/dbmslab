.PHONY: install dev dev-api dev-web setup-api setup-web

install: setup-api setup-web

setup-api:
	cd apps/api && python3 -m venv venv && . venv/bin/activate && pip install -r requirements.txt

setup-web:
	cd apps/web && npm install

dev:
	make -j 2 dev-api dev-web

dev-api:
	cd apps/api && . venv/bin/activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000

dev-web:
	cd apps/web && npm run dev

clean:
	rm -rf apps/api/venv apps/web/node_modules
