# ChronoGraph – Temporal GraphRAG for Enterprise Forensics

> **AI-powered enterprise history investigation platform that connects people, decisions, technologies, and events across time using GraphRAG and Google Gemini AI.**

## 📌 Overview

**ChronoGraph** is an AI-powered enterprise history investigation system designed to help teams understand **why decisions were made, who was involved, and how events evolved over time**.

It analyzes historical data from sources such as **Slack, GitHub, and Jira**, extracts entities and relationships using **Google Gemini AI**, stores the information in a structured knowledge graph/database, and uses temporal retrieval to generate **evidence-backed answers, interactive graphs, chronological timelines, and source citations**.

Instead of simply searching documents, ChronoGraph connects historical events and relationships to reconstruct the evolution of engineering decisions.

---

## 🎯 Problem Statement

In large software teams, important decisions are spread across:

* Slack conversations
* GitHub commits
* Jira issues
* Engineers and teams
* Technologies
* Architecture discussions
* Project events

Finding the reasoning behind an old decision can therefore be difficult.

For example:

> **"Why did the team migrate from AWS to GCP?"**

ChronoGraph retrieves the relevant historical evidence and reconstructs the sequence:

```text
AWS Cost Problem
       ↓
GCP Proposed
       ↓
Jira Investigation
       ↓
Migration Approved
       ↓
GCP Deployment
```

The system then provides an AI-generated explanation supported by historical sources.

---

## ✨ Features

### 🤖 AI Investigation

Ask natural-language questions about project history and receive AI-generated answers using Google Gemini.

Example:

```text
Why did we migrate from AWS to GCP?
```

### 🕸️ Knowledge Graph

Visualize relationships between:

* People
* Technologies
* Projects
* Jira issues
* GitHub commits
* Historical events

using **React Flow**.

### ⏳ Temporal Timeline

View events chronologically and understand how decisions evolved over time.

### 🔎 Source-Based Evidence

Answers include references to the underlying:

* Slack messages
* GitHub commits
* Jira issues

to reduce unsupported AI responses.

### 💬 Chat History

Previous investigations are stored and can be viewed later.

### 🔍 Entity Search

Search entities by:

* Name
* Entity type

### 📤 Investigation Export

Export investigation results as JSON for further analysis or documentation.

### 🛡️ Rate Limit Handling

Gemini API rate limits are handled using retry logic and exponential backoff.

### 🔄 Fallback Responses

The system provides fallback responses when the Gemini API is temporarily unavailable.

### 📱 Responsive UI

The application supports desktop and mobile layouts with a professional dark theme.

---

## 🏗️ System Architecture

```text
                    ┌──────────────────────┐
                    │      React UI        │
                    │  Investigation Chat  │
                    │ Graph + Timeline     │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │      FastAPI         │
                    │      Backend         │
                    └──────────┬───────────┘
                               │
                  ┌────────────┴────────────┐
                  │                         │
                  ▼                         ▼
        ┌──────────────────┐       ┌──────────────────┐
        │  Google Gemini   │       │      MySQL       │
        │       AI         │       │   Knowledge DB   │
        └────────┬─────────┘       └────────┬─────────┘
                 │                          │
                 └────────────┬─────────────┘
                              ▼
                    ┌──────────────────────┐
                    │ Temporal GraphRAG    │
                    │ Retrieval Pipeline   │
                    └──────────────────────┘
                              │
                              ▼
                    Answer + Timeline
                    + Graph + Sources
```

---

## 🔄 How It Works

### 1. Data Ingestion

Historical enterprise data is collected from:

```text
Slack
GitHub
Jira
```

Example:

```json
{
  "user": "Priya",
  "timestamp": "2023-03-15",
  "message": "We should evaluate GCP as an alternative to AWS."
}
```

### 2. AI Entity & Relationship Extraction

Google Gemini analyzes the raw information and extracts structured entities and relationships.

Example:

```text
Priya → PROPOSED → GCP
GCP → REPLACEMENT_FOR → AWS
```

with temporal information:

```text
timestamp: 2023-03-15
source: Slack
```

### 3. Knowledge Storage

Entities and relationships are stored in MySQL.

Example:

```text
Person
   │
   │ PROPOSED
   ▼
GCP
   │
   │ REPLACEMENT_FOR
   ▼
AWS
```

### 4. Temporal Retrieval

When a user asks a question, the backend retrieves relevant entities, relationships, dates, and sources.

The retrieved events are ordered chronologically.

```text
March 10 → AWS cost issue
March 15 → GCP proposed
March 18 → Jira issue created
April 20 → GCP deployment
```

### 5. AI Answer Generation

The retrieved historical context is sent to Gemini.

Gemini generates an evidence-based response.

### 6. Frontend Visualization

The response is displayed through:

* AI explanation
* Timeline
* Knowledge graph
* Source citations

---

## 🧰 Technology Stack

### Frontend

* React.js
* Vite
* React Router
* React Flow
* Custom CSS

### Backend

* Python
* FastAPI
* REST APIs

### AI

* Google Gemini API
* AI-powered entity extraction
* AI-powered investigation
* AI summarization

### Database

* MySQL

### Data Sources

* Slack
* GitHub
* Jira

### Development

* Git
* GitHub
* VS Code

---

## 📁 Project Structure

```text
ChronoGraph/
│
├── backend/
│   ├── routes/
│   │   ├── chat.py
│   │   └── __init__.py
│   │
│   ├── services/
│   │   ├── gemini_service.py
│   │   ├── mysql_service.py
│   │   └── __init__.py
│   │
│   ├── models/
│   ├── utils/
│   ├── config.py
│   └── main.py
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── KnowledgeGraph.jsx
│   │   │   ├── Timeline.jsx
│   │   │   └── ChatHistory.jsx
│   │   │
│   │   ├── pages/
│   │   ├── services/
│   │   ├── styles/
│   │   │   ├── App.css
│   │   │   ├── global.css
│   │   │   └── ChatHistory.css
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── data/
│   ├── slack/
│   ├── github/
│   └── jira/
│
├── scripts/
│   ├── ingest_mysql.py
│   └── seed_manual_data.py
│
├── docs/
├── screenshots/
├── .env
├── .gitignore
├── requirements.txt
└── README.md
```

---

## 🗄️ Database Structure

ChronoGraph currently uses three main tables.

### `entities`

Stores people, technologies, projects, and other entities.

```text
id
name
type
description
```

### `relationships`

Stores connections between entities.

```text
id
source_entity
target_entity
relationship_type
timestamp
source
source_id
```

### `chat_history`

Stores previous investigations.

```text
id
question
answer
created_at
```

---

## 📊 Sample Data

ChronoGraph currently works with seeded enterprise-style data.

| Source    | Records |
| --------- | ------: |
| Slack     |       6 |
| GitHub    |       5 |
| Jira      |       4 |
| **Total** |  **15** |

The dataset can be expanded with additional historical events for larger investigations.

---

## 💬 Example Questions

Try asking:

```text
Why did we migrate from AWS to GCP?

Who proposed the GCP migration?

What happened in March 2023?

When was CLOUD-102 created?

Who worked on the GCP deployment?

What caused the migration?

What happened after the migration proposal?
```

---

## 🔌 API Endpoints

| Method | Endpoint        | Description                   |
| ------ | --------------- | ----------------------------- |
| POST   | `/api/chat`     | Ask an investigation question |
| GET    | `/api/history`  | Retrieve chat history         |
| GET    | `/api/search`   | Search entities               |
| GET    | `/api/graph`    | Retrieve graph data           |
| GET    | `/api/timeline` | Retrieve chronological events |
| GET    | `/api/sources`  | Retrieve source information   |
| GET    | `/api/export`   | Export investigation data     |
| POST   | `/api/ingest`   | Process data ingestion        |

---

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/Auro993/ChronoGraph.git
cd ChronoGraph
```

### 2. Create Python environment

```bash
python -m venv venv
```

Activate it on Windows:

```powershell
venv\Scripts\activate
```

### 3. Install backend dependencies

```bash
pip install -r requirements.txt
```

### 4. Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

### 5. Configure environment variables

Create a `.env` file:

```env
GEMINI_API_KEY=your_gemini_api_key

MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=your_mysql_user
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=chronograph
```

> Never commit your `.env` file or API keys to GitHub.

---

## ▶️ Running the Application

### Start Backend

From the project root:

```powershell
uvicorn backend.main:app --reload --port 8000
```

Backend:

```text
http://localhost:8000
```

### Start Frontend

Open another terminal:

```powershell
cd frontend
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

## 🌱 Seed Database

To load the prepared dataset:

```powershell
python scripts/seed_manual_data.py
```

For complete ingestion:

```powershell
python scripts/ingest_mysql.py
```

---

## 🔐 Security

The project follows basic security practices:

* API keys stored in environment variables
* `.env` excluded from Git
* Backend API separation
* Input validation
* Gemini rate-limit handling
* Retry with exponential backoff
* Fallback responses

---

## 🚀 Future Improvements

Potential future enhancements include:

* Real Slack API integration
* Real GitHub API integration
* Real Jira API integration
* Neo4j-based graph storage
* Apache Airflow ingestion pipelines
* Advanced temporal reasoning
* Graph community detection
* Confidence scoring for AI extraction
* Authentication and role-based access
* Cloud deployment
* Larger enterprise datasets
* Advanced semantic search
* Investigation report generation

---

## 🎓 Project Objective

The primary objective of ChronoGraph is to demonstrate how **Generative AI + temporal relationships + graph-based retrieval** can be used to reconstruct organizational knowledge and explain historical engineering decisions.

The system goes beyond traditional document search by connecting:

```text
People
  ↓
Decisions
  ↓
Technologies
  ↓
Events
  ↓
Dates
  ↓
Sources
```

This enables teams to understand not only **what happened**, but also:

> **Who was involved, what changed, why it happened, and how the decision evolved over time.**

---

## 👩‍💻 Author

**Auroshikha Sahoo**

**GitHub:** https://github.com/Auro993

---

## ⭐ Project Highlights

* 🤖 Google Gemini powered AI investigation
* 🕸️ Interactive knowledge graph
* ⏳ Temporal event visualization
* 🔎 Evidence-based retrieval
* 💬 Conversational investigation
* 📚 Historical source citations
* 📤 JSON investigation export
* 🛡️ Gemini rate-limit handling
* 📱 Responsive React interface

---

## 📜 License

This project is developed for educational, portfolio, and demonstration purposes.
