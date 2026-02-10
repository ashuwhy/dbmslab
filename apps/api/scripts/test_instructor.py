"""Quick test of all instructor endpoints"""
import requests, json, sys

API = "http://localhost:8000"

# Login
r = requests.post(f"{API}/auth/login", json={"email":"andrew.ng@stanford.edu","password":"instructor123"})
if r.status_code != 200:
    print(f"FAIL login: {r.status_code} {r.text}")
    sys.exit(1)
TOKEN = r.json()["access_token"]
H = {"Authorization": f"Bearer {TOKEN}"}
print(f"[OK] Login successful (role={r.json()['role']})")

# 1. GET /instructor/courses
r = requests.get(f"{API}/instructor/courses", headers=H)
courses = r.json()
print(f"[{'OK' if r.status_code==200 and len(courses)>0 else 'FAIL'}] GET /courses -> {len(courses)} courses")
if courses:
    cid = courses[0]["course_id"]
    print(f"     Using course_id={cid} ({courses[0]['course_name']}) for tests")

# 2. GET /instructor/courses/{id}/students
r = requests.get(f"{API}/instructor/courses/{cid}/students", headers=H)
students = r.json()
print(f"[{'OK' if r.status_code==200 else 'FAIL'}] GET /courses/{cid}/students -> {len(students)} students")

# 3. GET /instructor/courses/{id}/content-items
r = requests.get(f"{API}/instructor/courses/{cid}/content-items", headers=H)
print(f"[{'OK' if r.status_code==200 else 'FAIL'}] GET /courses/{cid}/content-items -> {len(r.json())} items")

# 4. GET /instructor/courses/{id}/analytics
r = requests.get(f"{API}/instructor/courses/{cid}/analytics", headers=H)
print(f"[{'OK' if r.status_code==200 else 'FAIL'}] GET /courses/{cid}/analytics -> {r.json() if r.status_code==200 else r.text}")

# 5. PUT /instructor/enrollments/{sid}/{cid} (grade)
if students:
    sid = students[0]["student_id"]
    r = requests.put(f"{API}/instructor/enrollments/{sid}/{cid}", headers=H, json={"evaluation_score": 85})
    print(f"[{'OK' if r.status_code==200 else 'FAIL'}] PUT /enrollments/{sid}/{cid} (grade=85) -> {r.json() if r.status_code==200 else r.text}")

# 6. GET /instructor/stats
r = requests.get(f"{API}/instructor/stats", headers=H)
print(f"[{'OK' if r.status_code==200 else 'FAIL'}] GET /stats -> {r.json() if r.status_code==200 else r.text}")

# === ADVANCED ENDPOINTS ===
print("\n--- ADVANCED DBMS FEATURES ---")

# 7. GET /instructor/courses/{id}/rankings (Window Functions)
r = requests.get(f"{API}/instructor/courses/{cid}/rankings", headers=H)
if r.status_code == 200:
    data = r.json()
    print(f"[OK] GET /courses/{cid}/rankings -> {len(data['students'])} students ranked")
    for s in data["students"][:3]:
        print(f"     #{s['rank']} {s['full_name']} score={s['evaluation_score']} percentile={s['percentile']}%")
else:
    print(f"[FAIL] GET /courses/{cid}/rankings -> {r.status_code} {r.text}")

# 8. GET /instructor/courses/{id}/audit-log (Triggers)
r = requests.get(f"{API}/instructor/courses/{cid}/audit-log", headers=H)
if r.status_code == 200:
    data = r.json()
    print(f"[OK] GET /courses/{cid}/audit-log -> {data['total_entries']} entries")
    for e in data["entries"][:2]:
        print(f"     {e['student_name']}: {e['old_score']} -> {e['new_score']} (delta={e['score_delta']})")
else:
    print(f"[FAIL] GET /courses/{cid}/audit-log -> {r.status_code} {r.text}")

# 9. POST /instructor/courses/{id}/safe-enroll (Pessimistic Lock)
# Find a student not enrolled in a different course
r2 = requests.get(f"{API}/instructor/courses", headers=H)
all_courses = r2.json()
if len(all_courses) >= 2:
    test_cid = all_courses[1]["course_id"]
    # Try enrolling student 15 (likely not in this course)
    r = requests.post(f"{API}/instructor/courses/{test_cid}/safe-enroll", headers=H, json={"student_id": 15})
    if r.status_code == 200:
        print(f"[OK] POST /courses/{test_cid}/safe-enroll -> {r.json()['message']}")
    elif r.status_code == 409:
        print(f"[OK] POST /courses/{test_cid}/safe-enroll -> {r.json()['detail']} (expected conflict)")
    else:
        print(f"[FAIL] POST /courses/{test_cid}/safe-enroll -> {r.status_code} {r.text}")

print("\n=== ALL TESTS DONE ===")
