import os
import json
import sqlite3
import urllib.request
import urllib.error
from typing import Any, List, Optional, Sequence, Dict

# Attempt to load .env file
try:
    from dotenv import load_dotenv
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        load_dotenv(env_path)
    else:
        load_dotenv()
except Exception:
    # Manual .env reader fallback
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())

TURSO_URL = os.environ.get("TURSO_DATABASE_URL", "").strip()
TURSO_TOKEN = os.environ.get("TURSO_AUTH_TOKEN", "").strip()
LOCAL_DB_PATH = os.path.join(os.path.dirname(__file__), "database.sqlite")

# Normalize URL to HTTPS endpoint for HTTP execute
if TURSO_URL.startswith("libsql://"):
    TURSO_URL = "https://" + TURSO_URL[len("libsql://"):]
if TURSO_URL and not TURSO_URL.endswith("/v1/execute"):
    TURSO_HTTP_ENDPOINT = TURSO_URL.rstrip("/") + "/v1/execute"
else:
    TURSO_HTTP_ENDPOINT = TURSO_URL

IntegrityError = sqlite3.IntegrityError


class TursoRow:
    """Drop-in replacement for sqlite3.Row supporting dict(row), indexing, and iteration."""
    __slots__ = ("_keys", "_values", "_dict")

    def __init__(self, cols: Sequence[str], values: Sequence[Any]):
        self._keys = list(cols)
        self._values = list(values)
        self._dict = dict(zip(cols, values))

    def __getitem__(self, key: Any) -> Any:
        if isinstance(key, int):
            return self._values[key]
        return self._dict[key]

    def __iter__(self):
        # Yield (key, value) pairs so dict(row) works identically to sqlite3.Row
        return iter(self._dict.items())

    def __contains__(self, key: str) -> bool:
        return key in self._dict

    def __len__(self) -> int:
        return len(self._values)

    def get(self, key: str, default: Any = None) -> Any:
        return self._dict.get(key, default)

    def keys(self) -> Sequence[str]:
        return self._keys

    def values(self) -> Sequence[Any]:
        return self._values

    def items(self):
        return self._dict.items()

    def __repr__(self) -> str:
        return f"TursoRow({self._dict})"


class TursoCursor:
    def __init__(self, conn: "TursoConnection"):
        self.conn = conn
        self._rows: List[TursoRow] = []
        self._idx = 0
        self.lastrowid: Optional[int] = None
        self.rowcount: int = -1
        self.description = None

    def execute(self, sql: str, params: Optional[Sequence[Any]] = None) -> "TursoCursor":
        self._rows = []
        self._idx = 0
        self.lastrowid = None
        self.rowcount = -1

        # Format parameters for Turso Hrana API
        args: List[Dict[str, Any]] = []
        if params is not None:
            if isinstance(params, (tuple, list)):
                param_list = params
            else:
                param_list = [params]

            for p in param_list:
                if p is None:
                    args.append({"type": "null"})
                elif isinstance(p, bool):
                    args.append({"type": "integer", "value": "1" if p else "0"})
                elif isinstance(p, int):
                    args.append({"type": "integer", "value": str(p)})
                elif isinstance(p, float):
                    args.append({"type": "float", "value": p})
                elif isinstance(p, (dict, list)):
                    args.append({"type": "text", "value": json.dumps(p)})
                else:
                    args.append({"type": "text", "value": str(p)})

        payload = json.dumps({"stmt": {"sql": sql, "args": args}}).encode("utf-8")
        req = urllib.request.Request(
            TURSO_HTTP_ENDPOINT,
            data=payload,
            headers={
                "Authorization": f"Bearer {TURSO_TOKEN}",
                "Content-Type": "application/json",
            },
        )

        try:
            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8")
            raise sqlite3.DatabaseError(f"Turso HTTP {e.code}: {err_body}")

        # Check for error payload in response
        if "message" in data and "code" in data:
            msg = data.get("message", "")
            code = data.get("code", "")
            if code == "SQLITE_CONSTRAINT" or "constraint failed" in msg.lower():
                raise sqlite3.IntegrityError(msg)
            raise sqlite3.DatabaseError(f"Turso [{code}]: {msg}")

        result = data.get("result", {})
        raw_cols = [c.get("name", "") for c in result.get("cols", [])]
        self.description = [(c, None, None, None, None, None, None) for c in raw_cols]
        self.lastrowid = result.get("last_insert_rowid")
        self.rowcount = result.get("affected_row_count", -1)

        raw_rows = result.get("rows", [])
        parsed_rows: List[TursoRow] = []
        for r in raw_rows:
            parsed_vals = []
            for cell in r:
                ctype = cell.get("type", "null")
                cval = cell.get("value")
                if ctype == "null" or cval is None:
                    parsed_vals.append(None)
                elif ctype == "integer":
                    parsed_vals.append(int(cval))
                elif ctype == "float":
                    parsed_vals.append(float(cval))
                elif ctype == "blob":
                    parsed_vals.append(cval)
                else:
                    parsed_vals.append(str(cval))
            parsed_rows.append(TursoRow(raw_cols, parsed_vals))

        self._rows = parsed_rows
        return self

    def fetchone(self) -> Optional[TursoRow]:
        if self._idx < len(self._rows):
            row = self._rows[self._idx]
            self._idx += 1
            return row
        return None

    def fetchall(self) -> List[TursoRow]:
        remaining = self._rows[self._idx:]
        self._idx = len(self._rows)
        return remaining

    def close(self):
        self._rows = []


class TursoConnection:
    def __init__(self):
        pass

    def cursor(self) -> TursoCursor:
        return TursoCursor(self)

    def commit(self):
        pass  # Auto-committed per HTTP statement

    def rollback(self):
        pass

    def close(self):
        pass


def get_db():
    """FastAPI database dependency yields TursoConnection or local sqlite3.Connection."""
    if TURSO_URL and TURSO_TOKEN:
        conn = TursoConnection()
        try:
            yield conn
        finally:
            conn.close()
    else:
        conn = sqlite3.connect(LOCAL_DB_PATH, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()


def test_connection():
    """Quick check to verify whether database is reachable."""
    if TURSO_URL and TURSO_TOKEN:
        cur = TursoConnection().cursor()
        cur.execute("SELECT 1 as test")
        row = cur.fetchone()
        return row and row["test"] == 1
    return os.path.exists(LOCAL_DB_PATH)
