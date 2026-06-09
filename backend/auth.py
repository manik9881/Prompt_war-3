import os
import requests
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://your-project.supabase.co")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "your-anon-key")

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    """
    Validates token using Supabase Auth.
    """
    token = credentials.credentials
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {token}"
    }
    response = requests.get(f"{SUPABASE_URL}/auth/v1/user", headers=headers)
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid token or user not authenticated")
    return response.json()

def call_supabase_edge_function(function_name: str, payload: dict, auth_token: str) -> dict:
    """
    Triggers a secure Deno-based Supabase Edge Function.
    """
    headers = {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }
    # Invoke Edge Function
    url = f"{SUPABASE_URL}/functions/v1/{function_name}"
    try:
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to invoke Edge Function: {str(e)}")
