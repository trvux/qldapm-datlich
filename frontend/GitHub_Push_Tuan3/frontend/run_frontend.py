"""Chạy Frontend server tại http://localhost:3000 (khớp CORS_ORIGINS của Backend FastAPI :8000)."""
import http.server
import os
import socketserver
import webbrowser

PORT = int(os.environ.get("PORT", "3000"))
DIRECTORY = os.path.dirname(os.path.abspath(__file__))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)


if __name__ == "__main__":
    url = f"http://localhost:{PORT}"
    print(f"XYZ Frontend dang chay tai: {url}")
    print("Ket noi Backend API mac dinh: http://localhost:8000")
    try:
        webbrowser.open(url)
    except Exception:
        pass
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        httpd.serve_forever()
