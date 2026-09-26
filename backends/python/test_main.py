from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def get_token(username="demo1"):
    r = client.post("/api/auth/login", json={"username": username, "password": "password123"})
    assert r.status_code == 200
    return r.json()["token"]

def test_successful_todo_operation():
    token = get_token("demo1")
    headers = {"Authorization": f"Bearer {token}"}
    r = client.post("/api/todos", json={"title": "Python test todo"}, headers=headers)
    assert r.status_code == 201
    assert r.json()["title"] == "Python test todo"
    todo_id = r.json()["id"]

    r2 = client.get("/api/todos", headers=headers)
    assert r2.status_code == 200
    assert any(t["id"] == todo_id for t in r2.json())

def test_cannot_access_other_user_todo():
    token1 = get_token("demo1")
    token2 = get_token("demo2")
    h1 = {"Authorization": f"Bearer {token1}"}
    h2 = {"Authorization": f"Bearer {token2}"}

    r = client.post("/api/todos", json={"title": "Private from demo1"}, headers=h1)
    assert r.status_code == 201
    todo_id = r.json()["id"]

    # demo2 list should not contain it
    r2 = client.get("/api/todos", headers=h2)
    assert all(t["id"] != todo_id for t in r2.json())

    # demo2 cannot patch
    r3 = client.patch(f"/api/todos/{todo_id}", json={"completed": True}, headers=h2)
    assert r3.status_code == 403

    # demo2 cannot delete
    r4 = client.delete(f"/api/todos/{todo_id}", headers=h2)
    assert r4.status_code == 403
