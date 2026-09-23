from fastapi import FastAPI, APIRouter
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from pathlib import Path
from datetime import datetime, timezone
from io import BytesIO
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from typing import Optional
import os, uuid, logging

ROOT_DIR = Path(__file__).parent
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "sss_cattle_farm")
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*").split(",")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="SSS Cattle & Dairy Farm API")
api_router = APIRouter(prefix="/api")


class ProductionCreate(BaseModel):
    date: str
    morning_litres: float = 0
    night_litres: float = 0
    notes: str = ""


class FinanceCreate(BaseModel):
    date: str
    kind: str
    party: str
    purpose: str
    amount_pkr: float
    litres: float = 0
    rate_pkr: float = 0


class AnimalCreate(BaseModel):
    cows: int = 0
    buffaloes: int = 0
    calves: int = 0


class FeedCreate(BaseModel):
    item: str
    quantity: float
    unit: str = "kg"
    reorder_level: float = 50


class SettingCreate(BaseModel):
    milk_rate_pkr: float


async def seed_if_empty():
    if await db.production_records.count_documents({}) == 0:
        await db.production_records.insert_many([
            {"record_id": "prod_demo_1", "date": "2025-06-01", "morning_litres": 182, "night_litres": 158, "notes": "Strong morning yield"},
            {"record_id": "prod_demo_2", "date": "2025-06-02", "morning_litres": 188, "night_litres": 162, "notes": ""},
            {"record_id": "prod_demo_3", "date": "2025-06-03", "morning_litres": 191, "night_litres": 165, "notes": ""},
        ])

    if await db.financial_records.count_documents({}) == 0:
        await db.financial_records.insert_many([
            {"record_id": "fin_demo_1", "date": "2025-06-03", "kind": "sale", "party": "Green Valley Dairy", "purpose": "Milk delivery", "amount_pkr": 28400, "litres": 520, "rate_pkr": 110},
            {"record_id": "fin_demo_2", "date": "2025-06-02", "kind": "expense", "party": "Al-Noor Feed Mill", "purpose": "Cattle feed", "amount_pkr": 12600, "litres": 0, "rate_pkr": 0},
            {"record_id": "fin_demo_3", "date": "2025-06-01", "kind": "transfer", "party": "Abdul Rehman", "purpose": "Transport payment", "amount_pkr": 4200, "litres": 0, "rate_pkr": 0},
        ])

    if await db.farm_settings.count_documents({}) == 0:
        await db.farm_settings.insert_one({"setting_id": "main", "milk_rate_pkr": 110})

    if await db.animal_inventory.count_documents({}) == 0:
        await db.animal_inventory.insert_one({"inventory_id": "main", "cows": 34, "buffaloes": 21, "calves": 8})

    if await db.feed_stock.count_documents({}) == 0:
        await db.feed_stock.insert_many([
            {"stock_id": "feed_1", "item": "Wheat bran", "quantity": 320, "unit": "kg", "reorder_level": 100},
            {"stock_id": "feed_2", "item": "Green fodder", "quantity": 680, "unit": "kg", "reorder_level": 180},
            {"stock_id": "feed_3", "item": "Mineral mix", "quantity": 42, "unit": "kg", "reorder_level": 50},
        ])


@api_router.get("/")
async def root():
    return {"message": "SSS Cattle And Dairy Farm API"}


@api_router.get("/dashboard")
async def dashboard():
    await seed_if_empty()
    prod = await db.production_records.find({}, {"_id": 0}).sort("date", -1).to_list(1000)
    fin = await db.financial_records.find({}, {"_id": 0}).sort("date", -1).to_list(1000)
    animals = await db.animal_inventory.find_one({"inventory_id": "main"}, {"_id": 0})
    feed = await db.feed_stock.find({}, {"_id": 0}).to_list(100)
    setting = await db.farm_settings.find_one({"setting_id": "main"}, {"_id": 0})

    total_litres = sum(x.get("morning_litres", 0) + x.get("night_litres", 0) for x in prod)
    sales = sum(x.get("amount_pkr", 0) for x in fin if x.get("kind") == "sale")
    expenses = sum(x.get("amount_pkr", 0) for x in fin if x.get("kind") != "sale")

    return {
        "production": prod,
        "finance": fin,
        "animals": animals,
        "feed": feed,
        "milk_rate_pkr": setting["milk_rate_pkr"],
        "metrics": {
            "total_litres": total_litres,
            "sales": sales,
            "expenses": expenses,
            "profit": sales - expenses,
            "turnover": sales,
            "tonnes_sold": round(total_litres / 1000, 2),
        },
    }


@api_router.post("/production")
async def add_production(item: ProductionCreate):
    doc = item.model_dump()
    doc["record_id"] = f"prod_{uuid.uuid4().hex[:10]}"
    await db.production_records.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.post("/finance")
async def add_finance(item: FinanceCreate):
    doc = item.model_dump()
    doc["record_id"] = f"fin_{uuid.uuid4().hex[:10]}"
    await db.financial_records.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.post("/animals")
async def save_animals(item: AnimalCreate):
    doc = item.model_dump()
    doc["inventory_id"] = "main"
    await db.animal_inventory.update_one({"inventory_id": "main"}, {"$set": doc}, upsert=True)
    return doc


@api_router.post("/feed")
async def add_feed(item: FeedCreate):
    doc = item.model_dump()
    doc["stock_id"] = f"feed_{uuid.uuid4().hex[:8]}"
    await db.feed_stock.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.post("/settings")
async def save_settings(item: SettingCreate):
    await db.farm_settings.update_one(
        {"setting_id": "main"}, {"$set": item.model_dump()}, upsert=True
    )
    return item.model_dump()


@api_router.get("/reports/excel")
async def excel_report():
    await seed_if_empty()
    wb = Workbook()
    wb.remove(wb.active)

    sheets = [
        ("Summary", [
            ("Metric", "Value"),
            ("Yearly turnover (PKR)", "See finance sheet"),
            ("Milk sold (tonnes)", "See production sheet"),
        ]),
        ("Milk Production", [
            ("Date", "Morning (L)", "Night (L)", "Total (L)", "Notes")
        ]),
        ("Financial Records", [
            ("Date", "Type", "Party", "Purpose", "Amount (PKR)", "Litres", "Rate (PKR)")
        ]),
        ("Inventory", [
            ("Item", "Quantity", "Unit", "Reorder level")
        ]),
    ]

    prod = await db.production_records.find({}, {"_id": 0}).to_list(1000)
    fin = await db.financial_records.find({}, {"_id": 0}).to_list(1000)
    feed = await db.feed_stock.find({}, {"_id": 0}).to_list(100)

    for name, rows in sheets:
        ws = wb.create_sheet(name)
        ws.append(rows[0])
        for cell in ws[1]:
            cell.font = Font(bold=True, color="FFFFFF")
            cell.fill = PatternFill("solid", fgColor="2D5A27")
            cell.alignment = Alignment(horizontal="center")

        if name == "Milk Production":
            for x in prod:
                ws.append([
                    x["date"], x.get("morning_litres", 0), x.get("night_litres", 0),
                    x.get("morning_litres", 0) + x.get("night_litres", 0), x.get("notes", "")
                ])
        elif name == "Financial Records":
            for x in fin:
                ws.append([
                    x["date"], x["kind"], x["party"], x["purpose"],
                    x["amount_pkr"], x.get("litres", 0), x.get("rate_pkr", 0)
                ])
        elif name == "Inventory":
            for x in feed:
                ws.append([x["item"], x["quantity"], x["unit"], x["reorder_level"]])
        else:
            for row in rows[1:]:
                ws.append(row)

        for col in ws.columns:
            width = max(len(str(c.value or "")) for c in col) + 2
            ws.column_dimensions[col[0].column_letter].width = min(max(width, 12), 28)

    stream = BytesIO()
    wb.save(stream)
    stream.seek(0)

    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=sss-cattle-farm-report.xlsx"},
    )


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
