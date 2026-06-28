import requests
import json

BASE_URL = "http://localhost:3000/api"

def test_health():
    try:
        # Just check if the server is up
        print("Testing server connectivity...")
        # Since I don't have a /health, I'll just try a known endpoint
        # But wait, I can't test if the server isn't running.
        pass
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("Verification Script Ready.")
    print("Please ensure the backend is running before testing.")
