"""
Mock SAP SuccessFactors Employee Central data generator.
Produces 150 employees across 3 departments with intentional data quality issues:
- ~15% missing skills
- ~10% stale performance ratings
- ~5 duplicate role names
"""
import json
import csv
import random
import os
from datetime import datetime, timedelta

random.seed(42)

DEPARTMENTS = ["Technology", "Operations", "Finance"]
DEPT_COST_CENTERS = {"Technology": "CC-TECH-001", "Operations": "CC-OPS-002", "Finance": "CC-FIN-003"}

ROLES_BY_DEPT = {
    "Technology": [
        "Software Engineer", "Senior Software Engineer", "Data Engineer",
        "ML Engineer", "DevOps Engineer", "Tech Lead", "Engineering Manager",
        "QA Engineer", "Platform Engineer", "Security Engineer"
    ],
    "Operations": [
        "Operations Analyst", "Process Manager", "Supply Chain Coordinator",
        "Operations Manager", "Business Analyst", "Project Coordinator",
        "Logistics Specialist", "Procurement Specialist", "Operations Director",
        "Administrative Assistant"
    ],
    "Finance": [
        "Financial Analyst", "Senior Accountant", "Finance Manager",
        "Controller", "FP&A Analyst", "Tax Specialist",
        "Accounts Payable Clerk", "Treasury Analyst", "Audit Manager",
        "Payroll Specialist"
    ]
}

SKILLS_POOL = {
    "Technology": ["Python", "Java", "JavaScript", "TypeScript", "React", "Node.js",
                   "AWS", "Azure", "Kubernetes", "Docker", "SQL", "NoSQL",
                   "Machine Learning", "Deep Learning", "NLP", "Data Pipelines",
                   "CI/CD", "Terraform", "GraphQL", "REST APIs", "Microservices",
                   "SAP ABAP", "SAP Fiori", "SAP HANA", "Cloud Architecture"],
    "Operations": ["Process Optimization", "Lean Six Sigma", "Supply Chain Management",
                   "ERP Systems", "SAP MM", "SAP SD", "Project Management",
                   "Data Analysis", "Excel Advanced", "Tableau", "Power BI",
                   "Vendor Management", "Logistics", "Procurement", "Inventory Management"],
    "Finance": ["Financial Modeling", "FP&A", "GAAP", "IFRS", "SAP FICO",
                "Tax Compliance", "Audit", "Treasury Management", "Excel Advanced",
                "Power BI", "SQL", "Risk Analysis", "Budgeting", "Cost Accounting",
                "Accounts Payable", "Accounts Receivable"]
}

LOCATIONS = ["New York", "San Francisco", "London", "Berlin", "Singapore", "Bangalore"]
GRADES = ["IC1", "IC2", "IC3", "IC4", "IC5", "M1", "M2", "M3"]
SALARY_BANDS = {"IC1": (55000, 75000), "IC2": (70000, 95000), "IC3": (90000, 125000),
                "IC4": (120000, 160000), "IC5": (150000, 200000),
                "M1": (130000, 170000), "M2": (160000, 210000), "M3": (200000, 280000)}

FIRST_NAMES = ["James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda",
               "David", "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
               "Thomas", "Sarah", "Christopher", "Karen", "Daniel", "Lisa", "Matthew", "Nancy",
               "Anthony", "Betty", "Mark", "Margaret", "Donald", "Sandra", "Steven", "Ashley",
               "Andrew", "Dorothy", "Paul", "Kimberly", "Joshua", "Emily", "Kenneth", "Donna",
               "Raj", "Priya", "Wei", "Yuki", "Olga", "Hans", "Fatima", "Carlos", "Aisha", "Kenji"]
LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
              "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
              "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
              "White", "Harris", "Sanchez", "Clark", "Patel", "Kumar", "Chen", "Wang",
              "Yamamoto", "Mueller", "Schmidt", "Fischer", "Weber", "Khan", "Ali", "Singh", "Park"]


def generate_employees(n=150):
    employees = []
    emp_id_counter = 1000

    for i in range(n):
        emp_id = f"EMP{emp_id_counter + i:05d}"
        dept = random.choice(DEPARTMENTS)
        role = random.choice(ROLES_BY_DEPT[dept])
        grade = random.choice(GRADES[:6]) if "Manager" not in role and "Director" not in role and "Lead" not in role else random.choice(GRADES[5:])
        salary_range = SALARY_BANDS[grade]
        salary = random.randint(salary_range[0], salary_range[1])
        tenure = round(random.uniform(0.5, 18), 1)
        perf_rating = random.choice([1, 2, 3, 3, 3, 4, 4, 4, 5, 5]) if random.random() > 0.1 else None  # ~10% null
        location = random.choice(LOCATIONS)

        # Skills — ~15% have empty/missing skills
        if random.random() < 0.15:
            skills = []
        else:
            dept_skills = SKILLS_POOL[dept]
            num_skills = random.randint(2, 6)
            skills = random.sample(dept_skills, min(num_skills, len(dept_skills)))
            # Some cross-dept skills
            if random.random() > 0.7:
                other_dept = random.choice([d for d in DEPARTMENTS if d != dept])
                skills.append(random.choice(SKILLS_POOL[other_dept]))

        # Last skill update date — some stale
        if random.random() < 0.10:
            last_skill_update = (datetime.now() - timedelta(days=random.randint(600, 900))).strftime("%Y-%m-%d")
        else:
            last_skill_update = (datetime.now() - timedelta(days=random.randint(30, 400))).strftime("%Y-%m-%d")

        manager_id = f"EMP{random.randint(1000, 1000 + n - 1):05d}" if grade not in ["M2", "M3"] else None

        employees.append({
            "employee_id": emp_id,
            "first_name": random.choice(FIRST_NAMES),
            "last_name": random.choice(LAST_NAMES),
            "department": dept,
            "role": role,
            "grade": grade,
            "location": location,
            "tenure_years": tenure,
            "performance_rating": perf_rating,
            "salary": salary,
            "skills": skills,
            "last_skill_update": last_skill_update,
            "manager_id": manager_id
        })

    return employees


def generate_skills_taxonomy():
    """Skills taxonomy with AI-adjacency scores and reskilling costs."""
    all_skills = set()
    for skills in SKILLS_POOL.values():
        all_skills.update(skills)

    taxonomy = []
    ai_adjacent = {"Python", "Machine Learning", "Deep Learning", "NLP", "Data Pipelines",
                   "SQL", "Data Analysis", "Cloud Architecture", "AWS", "Azure",
                   "Kubernetes", "Docker", "Terraform", "Financial Modeling", "Power BI", "Tableau"}

    for skill in sorted(all_skills):
        adjacency = 0.8 if skill in ai_adjacent else round(random.uniform(0.1, 0.5), 2)
        category = "AI/ML" if skill in {"Machine Learning", "Deep Learning", "NLP"} else \
                   "Cloud" if skill in {"AWS", "Azure", "Kubernetes", "Docker", "Terraform", "Cloud Architecture"} else \
                   "Data" if skill in {"SQL", "NoSQL", "Data Pipelines", "Data Analysis", "Power BI", "Tableau"} else \
                   "Programming" if skill in {"Python", "Java", "JavaScript", "TypeScript", "React", "Node.js", "GraphQL", "REST APIs"} else \
                   "SAP" if "SAP" in skill else \
                   "Business" if skill in {"Process Optimization", "Lean Six Sigma", "Project Management", "Vendor Management"} else \
                   "Finance" if skill in {"Financial Modeling", "FP&A", "GAAP", "IFRS", "Tax Compliance", "Audit", "Treasury Management", "Budgeting", "Cost Accounting"} else \
                   "General"

        reskill_weeks = random.randint(4, 24) if adjacency < 0.6 else random.randint(2, 12)
        reskill_cost = reskill_weeks * random.randint(500, 1500)

        taxonomy.append({
            "skill": skill,
            "category": category,
            "ai_adjacency_score": adjacency,
            "reskill_weeks": reskill_weeks,
            "reskill_cost_usd": reskill_cost,
            "market_scarcity": round(random.uniform(0.3, 0.95), 2)
        })

    return taxonomy


def generate_future_roles():
    """3-year future workforce targets."""
    return [
        {"role": "ML Engineer", "department": "Technology", "current_headcount": 8, "target_y1": 14, "target_y2": 22, "target_y3": 30, "required_skills": ["Python", "Machine Learning", "Deep Learning", "Cloud Architecture"], "priority": "critical"},
        {"role": "Data Engineer", "department": "Technology", "current_headcount": 10, "target_y1": 15, "target_y2": 20, "target_y3": 25, "required_skills": ["Python", "SQL", "Data Pipelines", "AWS", "Kubernetes"], "priority": "high"},
        {"role": "Platform Engineer", "department": "Technology", "current_headcount": 6, "target_y1": 10, "target_y2": 12, "target_y3": 14, "required_skills": ["Kubernetes", "Docker", "Terraform", "CI/CD", "Cloud Architecture"], "priority": "high"},
        {"role": "AI Product Manager", "department": "Technology", "current_headcount": 0, "target_y1": 3, "target_y2": 5, "target_y3": 8, "required_skills": ["Machine Learning", "Product Management", "Data Analysis"], "priority": "critical"},
        {"role": "Operations Analyst", "department": "Operations", "current_headcount": 15, "target_y1": 12, "target_y2": 10, "target_y3": 8, "required_skills": ["Data Analysis", "Excel Advanced", "Process Optimization"], "priority": "reduce"},
        {"role": "Administrative Assistant", "department": "Operations", "current_headcount": 12, "target_y1": 8, "target_y2": 5, "target_y3": 3, "required_skills": ["Excel Advanced", "Project Management"], "priority": "reduce"},
        {"role": "Procurement Specialist", "department": "Operations", "current_headcount": 8, "target_y1": 7, "target_y2": 6, "target_y3": 5, "required_skills": ["Procurement", "Vendor Management", "SAP MM"], "priority": "reduce"},
        {"role": "FP&A Analyst", "department": "Finance", "current_headcount": 6, "target_y1": 8, "target_y2": 10, "target_y3": 12, "required_skills": ["Financial Modeling", "FP&A", "Power BI", "SQL"], "priority": "high"},
        {"role": "Accounts Payable Clerk", "department": "Finance", "current_headcount": 10, "target_y1": 7, "target_y2": 5, "target_y3": 3, "required_skills": ["Accounts Payable", "SAP FICO"], "priority": "reduce"},
        {"role": "Data Analyst", "department": "Finance", "current_headcount": 3, "target_y1": 6, "target_y2": 8, "target_y3": 10, "required_skills": ["SQL", "Python", "Power BI", "Financial Modeling"], "priority": "high"},
    ]


def generate_org_structure():
    """Organizational structure with cost centers and budgets."""
    return [
        {"department": "Technology", "cost_center": "CC-TECH-001", "headcount_budget": 80, "annual_hr_budget_usd": 12000000, "vp": "Sarah Chen", "vp_id": "EMP01050"},
        {"department": "Operations", "cost_center": "CC-OPS-002", "headcount_budget": 50, "annual_hr_budget_usd": 5500000, "vp": "Michael Brown", "vp_id": "EMP01100"},
        {"department": "Finance", "cost_center": "CC-FIN-003", "headcount_budget": 35, "annual_hr_budget_usd": 4200000, "vp": "David Patel", "vp_id": "EMP01130"},
    ]


if __name__ == "__main__":
    data_dir = os.path.dirname(os.path.abspath(__file__))

    # Generate all data
    employees = generate_employees(150)
    taxonomy = generate_skills_taxonomy()
    future_roles = generate_future_roles()
    org_structure = generate_org_structure()

    # Write employees as CSV
    with open(os.path.join(data_dir, "employees.csv"), "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=employees[0].keys())
        writer.writeheader()
        for emp in employees:
            row = emp.copy()
            row["skills"] = "|".join(row["skills"])  # pipe-delimited
            writer.writerow(row)

    # Write others as JSON
    with open(os.path.join(data_dir, "skills_taxonomy.json"), "w") as f:
        json.dump(taxonomy, f, indent=2)

    with open(os.path.join(data_dir, "future_roles.json"), "w") as f:
        json.dump(future_roles, f, indent=2)

    with open(os.path.join(data_dir, "org_structure.json"), "w") as f:
        json.dump(org_structure, f, indent=2)

    print(f"Generated: {len(employees)} employees, {len(taxonomy)} skills, {len(future_roles)} future roles, {len(org_structure)} orgs")
    # Data quality report
    missing_skills = sum(1 for e in employees if not e["skills"])
    null_perf = sum(1 for e in employees if e["performance_rating"] is None)
    print(f"Data quality: {missing_skills} missing skills ({missing_skills/len(employees)*100:.0f}%), {null_perf} null perf ratings ({null_perf/len(employees)*100:.0f}%)")
