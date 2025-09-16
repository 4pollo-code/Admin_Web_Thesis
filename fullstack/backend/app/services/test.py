from argon2 import PasswordHasher
ph = PasswordHasher()

def test_password_hashing():
    password = "raphael1234"
    hashed = ph.hash(password)
    print("Hashed password:", hashed)

test_password_hashing()