from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import DB_models
from database import get_db, engine, Base

DB_models.Base.metadata.create_all(bind=engine)
app = FastAPI()

@app.get("/all_transaction", response=models.api_response)
def get_all_transactions(data: List[models.transaction], db: Session = Depends(get_db)):
    pass

@app.get("/all_category", response=models.api_response)
def get_all_transactions(data: List[models.category], db: Session = Depends(get_db)):
    pass

@app.get("/all_merchant", response=models.api_response)
def get_all_transactions(data: List[models.merchant], db: Session = Depends(get_db)):
    pass

@app.get("/all_label", response=models.api_response)
def get_all_transactions(data: List[models.label], db: Session = Depends(get_db)):
    pass

@app.post("/add_transaction", response=models.api_response)
def add_raw_transactions(data: List[models.raw_transaction], db: Session = Depends(get_db)):
    pass

@app.post("/label_merchant", response=models.api_response)
def label_merchant(data: models.label_merchant, db: Session = Depends(get_db)):
    pass

@app.put("/ignore_transaction", response=models.api_response)
def ignore_transaction(data: models.ignore_transaction, db: Session = Depends(get_db)):
    pass

@app.post("/add_category", reponse=models.api_response)
def attach_category(data: models.category, db: Session = Depends(get_db)):
    pass

@app.put("/edit_category", reponse=models.api_response)
def attach_category(data: models.category, db: Session = Depends(get_db)):
    pass

@app.post("/add_merchant", reponse=models.api_response)
def attach_category(data: models.merchant, db: Session = Depends(get_db)):
    pass

@app.put("/edit_merchant", reponse=models.api_response)
def attach_category(data: models.merchant, db: Session = Depends(get_db)):
    pass

@app.put("/attach_category", reponse=models.api_response)
def attach_category(data: models.attach_category, db: Session = Depends(get_db)):
    pass