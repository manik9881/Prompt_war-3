import os
import re
from dotenv import load_dotenv

# Load env variables from .env file
load_dotenv()

def migrate():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("Error: DATABASE_URL not found in environment variables.")
        return

    # Read SCHEMA.md
    schema_path = os.path.join(os.path.dirname(__file__), "..", "SCHEMA.md")
    if not os.path.exists(schema_path):
        print(f"Error: SCHEMA.md not found at {schema_path}")
        return

    with open(schema_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Extract SQL block from markdown
    sql_blocks = re.findall(r"```sql\n(.*?)```", content, re.DOTALL)
    if not sql_blocks:
        print("Error: No SQL blocks found in SCHEMA.md")
        return

    sql_script = "\n".join(sql_blocks)

    import urllib.parse
    if database_url.startswith("postgresql://"):
        parsed = urllib.parse.urlsplit(database_url)
        username = parsed.username
        password = parsed.password
        if password:
            encoded_password = urllib.parse.quote_plus(password)
            netloc = f"{username}:{encoded_password}@{parsed.hostname}"
            if parsed.port:
                netloc += f":{parsed.port}"
            database_url = urllib.parse.urlunsplit((
                parsed.scheme,
                netloc,
                parsed.path,
                parsed.query,
                parsed.fragment
            ))

    try:
        import psycopg2
    except ImportError:
        print("psycopg2 is not installed. Installing psycopg2-binary...")
        import subprocess
        subprocess.check_call(["pip", "install", "psycopg2-binary"])
        import psycopg2

    print("Connecting to Supabase Database...")
    try:
        conn = psycopg2.connect(database_url)
        conn.autocommit = True
        with conn.cursor() as cursor:
            print("Applying schema migrations...")
            cursor.execute(sql_script)
            print("Schema migration successfully completed!")
        conn.close()
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
