# Lead Management CRM

A Flask and MySQL CRM for managing customers, sales opportunities, and project delivery status.

## Features

- Customer records with contact details, industry, status, and notes
- Sales opportunities with value, stage, expected close date, requirements, and next action
- Projects with client requirements, delivery timeline, delivery status, owner, and latest update
- Dashboard for pipeline value, open opportunities, active projects, and upcoming deliveries
- Filtering for customers, opportunities, and projects

## Setup

1. Create a virtual environment and install dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. Create your environment file:

```bash
cp .env.example .env
```

Edit `.env` with your MySQL username and password.

3. Initialize the database:

```bash
flask init-db
```

You can also import `schema.sql` directly in MySQL if you prefer.

4. Run the application:

```bash
flask run
```

Open `http://127.0.0.1:5000`.

## MySQL Notes

The app reads these environment variables:

- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`
- `FLASK_SECRET_KEY`

The default database name is `lms_crm`.

## Existing Database Updates

If you already initialized the database before projects required opportunities, run:

```bash
mysql -u your_user -p < migrations/001_require_project_opportunity.sql
```

If the migration shows projects with `opportunity_id` as `NULL`, edit those projects in MySQL and assign an opportunity before rerunning the migration. New projects in the app now require both customer and opportunity.
