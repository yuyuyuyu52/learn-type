from __future__ import annotations
from flask import Flask, jsonify, request
from datetime import datetime
from .services import game_logic

app = Flask(__name__)
sessions_store = {}
setattr(game_logic, 'sessions_store', sessions_store)

DEFAULT_DURATION_MS = 5 * 60 * 1000

@app.get('/api/next-letter')
def api_next_letter():
    exclude = request.args.get('exclude')
    letter = game_logic.next_letter(exclude)
    return jsonify({"letter": letter})

@app.post('/api/submit')
def api_submit():
    data = request.get_json(force=True, silent=True) or {}
    session_id: str = data.get('session_id') or 'dev'
    letter: str = data.get('letter') or ''
    correct: bool = bool(data.get('correct'))
    ts_client: int = int(data.get('tsClient') or 0)
    duration_ms: int = int(data.get('durationMs') or DEFAULT_DURATION_MS)
    result = game_logic.record_event(session_id, letter, correct, ts_client, duration_ms)
    return jsonify(result)

@app.get('/api/stats')
def api_stats():
    session_id = request.args.get('session_id') or 'dev'
    stats = game_logic.get_stats(session_id)
    return jsonify(stats)

@app.get('/api/health')
def api_health():
    return jsonify({"ok": True, "time": datetime.utcnow().isoformat()})

if __name__ == '__main__':
    app.run(debug=True)
