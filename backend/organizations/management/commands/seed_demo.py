"""
Seed the database with a demo organization, admin user, and analyst user.
Usage: python manage.py seed_demo
"""
from django.core.management.base import BaseCommand
from organizations.models import Organization, User


class Command(BaseCommand):
    help = "Seed the database with demo organization and users"

    def handle(self, *args, **options):
        # Create demo organization
        org, created = Organization.objects.get_or_create(
            slug="acme-corp",
            defaults={
                "name": "Acme Corporation",
                "industry": "Manufacturing",
            },
        )
        status = "Created" if created else "Already exists"
        self.stdout.write(f"  Organization: {org.name} — {status}")

        # Create admin user
        if not User.objects.filter(username="admin").exists():
            admin = User.objects.create_user(
                username="admin",
                email="admin@acmecorp.com",
                password="admin123!",
                first_name="Sarah",
                last_name="Chen",
                organization=org,
                role=User.Role.ADMIN,
            )
            self.stdout.write(f"  Admin user created: {admin.username} / admin123!")
        else:
            self.stdout.write("  Admin user already exists")

        # Create analyst user
        if not User.objects.filter(username="analyst").exists():
            analyst = User.objects.create_user(
                username="analyst",
                email="analyst@acmecorp.com",
                password="analyst123!",
                first_name="Marcus",
                last_name="Rivera",
                organization=org,
                role=User.Role.ANALYST,
            )
            self.stdout.write(f"  Analyst user created: {analyst.username} / analyst123!")
        else:
            self.stdout.write("  Analyst user already exists")

        self.stdout.write(self.style.SUCCESS("\nDemo data seeded successfully!"))
        self.stdout.write("  Login credentials:")
        self.stdout.write("    Admin:   admin / admin123!")
        self.stdout.write("    Analyst: analyst / analyst123!")

        # Seed default validation rules
        from validation.models import ValidationRule
        DEFAULT_RULES = [
            {
                "rule_name": "duplicate_detection",
                "display_name": "Duplicate Detection",
                "description": "Flag records that appear to be duplicates based on source, date, and value.",
                "severity": "warning",
                "threshold": {},
                "source_types": ["sap", "utility", "travel"],
            },
            {
                "rule_name": "extreme_value",
                "display_name": "Extreme Value Check",
                "description": "Flag values that exceed expected thresholds for the source type.",
                "severity": "warning",
                "threshold": {"sap_max_liters": 50000, "utility_max_kwh": 500000, "travel_max_km": 20000},
                "source_types": ["sap", "utility", "travel"],
            },
            {
                "rule_name": "missing_date",
                "display_name": "Missing Date",
                "description": "Flag records missing a valid reporting/posting date.",
                "severity": "error",
                "threshold": {},
                "source_types": ["sap", "utility", "travel"],
            },
            {
                "rule_name": "invalid_unit",
                "display_name": "Invalid or Unknown Unit",
                "description": "Flag records where the unit of measure could not be normalized.",
                "severity": "error",
                "threshold": {},
                "source_types": ["sap", "utility"],
            },
            {
                "rule_name": "negative_value",
                "display_name": "Negative Value",
                "description": "Flag records with negative activity values.",
                "severity": "error",
                "threshold": {},
                "source_types": ["sap", "utility", "travel"],
            },
            {
                "rule_name": "missing_airport",
                "display_name": "Missing/Invalid Airport Code",
                "description": "Flag travel records with invalid or missing IATA airport codes.",
                "severity": "warning",
                "threshold": {},
                "source_types": ["travel"],
            },
        ]

        rules_created = 0
        for rule_data in DEFAULT_RULES:
            _, created = ValidationRule.objects.get_or_create(
                organization=org,
                rule_name=rule_data["rule_name"],
                defaults=rule_data,
            )
            if created:
                rules_created += 1
        self.stdout.write(f"  Validation rules: {rules_created} created, {len(DEFAULT_RULES) - rules_created} already exist")

