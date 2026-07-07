from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import firebase_admin
from firebase_admin import auth, credentials
import os

security = HTTPBearer(auto_error=False)

# Initialize Firebase Admin if credential path is provided
firebase_initialized = False
firebase_cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
if firebase_cred_path and os.path.exists(firebase_cred_path):
    try:
        cred = credentials.Certificate(firebase_cred_path)
        firebase_admin.initialize_app(cred)
        firebase_initialized = True
    except Exception as e:
        print(f"Error initializing Firebase Admin: {e}")

def get_current_user_id(authorization: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> str:
    # 4-Hour Hackathon Demo Override
    # Allows seamless front-to-back testing without mandatory Firebase keys config
    if not firebase_initialized:
        if authorization and authorization.credentials:
            # Decode a mockup payload if present, or fallback to a standard demo UID
            return "demo-citizen-uid-123"
        return "demo-citizen-uid-123"
        
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization token")
        
    token = authorization.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token['uid']
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid Firebase ID token: {str(e)}")
