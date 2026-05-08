import firebase_admin
from firebase_admin import credentials, firestore, firestore_async, messaging
from config import settings

_app = None


def get_firebase_app():
    global _app
    if _app is None:
        cred = credentials.Certificate(settings.firebase_credentials_path)
        _app = firebase_admin.initialize_app(cred)
    return _app


def get_db():
    """Async Firestore client — use for all coroutine operations."""
    get_firebase_app()
    return firestore_async.client()


def get_sync_db():
    """Sync Firestore client — use only for on_snapshot listeners."""
    get_firebase_app()
    return firestore.client()


def send_push(token: str, title: str, body: str) -> None:
    get_firebase_app()
    message = messaging.Message(
        notification=messaging.Notification(title=title, body=body),
        token=token,
    )
    messaging.send(message)
