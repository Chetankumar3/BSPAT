from decimal import Decimal
from typing import Union

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import delete, exists, select, update
from sqlalchemy.orm import Session

import DB_models
import models
from database import engine, get_db

DB_models.Base.metadata.create_all(bind=engine)
app = FastAPI()

origins = [
    "http://localhost:5173/",
    "http://localhost:3000/"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/get_all_transaction", response_model=list[models.transaction])
def get_all_transaction(db: Session = Depends(get_db)):
    return db.execute(select(DB_models.transaction)).scalars().all()


@app.get("/get_all_category", response_model=list[models.category])
def get_all_category(db: Session = Depends(get_db)):
    return db.execute(select(DB_models.category)).scalars().all()


@app.get("/get_all_merchant", response_model=list[models.merchant])
def get_all_merchant(db: Session = Depends(get_db)):
    return db.execute(select(DB_models.merchant)).scalars().all()


@app.get("/get_all_label", response_model=list[models.label])
def get_all_label(db: Session = Depends(get_db)):
    return db.execute(select(DB_models.label)).scalars().all()


@app.post("/add_raw_transaction", response_model=models.api_response)
def add_raw_transactions(data: list[models.raw_transaction], db: Session = Depends(get_db)):
    try:
        # Get current balance from the DB once
        last_tx = (
            db.execute(select(DB_models.transaction).order_by(DB_models.transaction.id.desc()))
            .scalars()
            .first()
        )
        current_balance = last_tx.closing_balance if last_tx else Decimal("0.00")

        for raw_tx in data:
            parts = raw_tx.particulars.split("/")
            merchant_particulars = parts[3].strip() if len(parts) > 3 else ""

            # corresponding merchant_id from "label"
            merchant_id = None
            merchant_ignore = False
            category_id = None
            if merchant_particulars:
                label_entry = (
                    db.execute(
                        select(DB_models.label).where(
                            DB_models.label.particulars == merchant_particulars
                        )
                    )
                    .scalars()
                    .first()
                )
                if label_entry:
                    merchant = (
                        db.execute(
                            select(DB_models.merchant).where(
                                DB_models.merchant.id == label_entry.merchant_id
                            )
                        )
                        .scalars()
                        .first()
                    )
                    merchant_id = merchant.id
                    merchant_ignore = merchant.ignore
                    category_id = merchant.category_id

            opening_balance = current_balance
            is_deposit = raw_tx.deposit is not None and raw_tx.deposit > 0

            if is_deposit:
                amount = raw_tx.deposit
                tx_type = True
                closing_balance = opening_balance + amount
            else:
                amount = raw_tx.withdrawal if raw_tx.withdrawal else Decimal("0.00")
                tx_type = False
                closing_balance = opening_balance - amount

            # Create the tx object
            new_tx = DB_models.transaction(
                particulars=merchant_particulars,
                tx_date=raw_tx.tx_date,
                merchant_id=merchant_id,
                category_id=category_id,
                tx_type=tx_type,
                ignore=merchant_ignore,
                amount=amount,
                opening_balance=opening_balance,
                closing_balance=closing_balance,
            )

            # Insert tx object and get its id
            db.add(new_tx)
            db.flush()  # Flushes to DB to generate an ID without fully committing

            current_balance = closing_balance

            # Insert into raw_tx with the new tx_id
            new_raw_tx = DB_models.raw_transaction(
                **raw_tx.model_dump(exclude_unset=True), tx_id=new_tx.id
            )
            db.add(new_raw_tx)

        # Commit everything as a single batch
        db.commit()
        return models.api_response(
            success=True,
            message=f"{len(data)} transactions processed and added successfully.",
        )

    except Exception as e:
        db.rollback()  # Revert all changes
        return models.api_response(success=False, message=f"Failed to processs: {str(e)}")


@app.post("/label_merchant", response_model=Union[models.label, models.api_response])
def label_merchant(data: models.label, db: Session = Depends(get_db)):
    try:
        if (
            not (db.execute(select(exists().where(DB_models.merchant.id == data.merchant_id))))
            .scalars()
            .first()
        ):
            raise HTTPException(404, "Merchant Does not Exist")
        else:
            get_label = (
                db.execute(
                    select(DB_models.label).where(DB_models.label.particulars == data.particulars)
                )
                .scalars()
                .first()
            )

            if not get_label:
                new_label = DB_models.label(**data.model_dump(exclude_unset=True))
                db.add(new_label)
                db.commit()

                return new_label
            else:
                db.execute(
                    update(DB_models.label)
                    .where(DB_models.label.id == get_label.id)
                    .values(**get_label.model_dump(exclude="id"))
                )

                db.commit()
                return get_label

    except Exception as e:
        db.rollback()  # Revert all changes
        return models.api_response(success=False, message=f"Failed to process: {str(e)}")


@app.put("/ignore_transaction", response_model=models.api_response)
def ignore_transaction(data: models.ignore_transaction, db: Session = Depends(get_db)):
    try:
        result = db.execute(
            update(DB_models.transaction)
            .where(DB_models.transaction.id.in_(data.tx_ids))
            .values(ignore=data.ignore)
        )

        db.commit()
        msg = ""
        if len(data.tx_ids) == result.rowcount:
            msg = "All Transactions updated successfully."
        elif result.rowcount > 0:
            msg = "Partial transactions updated successfully. Transactions updated: {result.rowcount}"
        else:
            msg = "No Transactions updated."

        return models.api_response(success=True, message=msg)

    except Exception as e:
        db.rollback()
        return models.api_response(success=False, message=f"Failed to processs: {str(e)}")


@app.post("/add_category", response_model=models.api_response)
def add_category(data: models.category, db: Session = Depends(get_db)):
    try:
        new_category = DB_models.category(**data.model_dump(exclude_unset=True))
        db.add(new_category)
        db.commit()
        return models.api_response(success=True, message="Category added successfully.")

    except Exception as e:
        db.rollback()  # Revert all changes
        return models.api_response(success=False, message=f"Failed to processs: {str(e)}")


@app.put("/edit_category", response_model=models.api_response)
def edit_category(data: models.category, db: Session = Depends(get_db)):
    try:
        if not data.id:
            return models.api_response(success=False, message="Category id not Found")

        result = db.execute(
            update(DB_models.category)
            .where(DB_models.category.id == data.id)
            .values(**data.model_dump(exclude_unset=True, exclude={"id"}))
        )

        db.commit()
        if result.rowcount == 0:
            raise HTTPException(404, "Category id not found")
        else:
            return models.api_response(success=True, message="Category details updated successfully.")

    except Exception as e:
        db.rollback()  # Revert all changes
        return models.api_response(success=False, message=f"Failed to processs: {str(e)}")


@app.delete("/delete_category", response_model=models.api_response)
def delete_category(data: models.category, db: Session = Depends(get_db)):
    try:
        if not data.id:
            raise HTTPException(404, "Category Not Found")

        db.execute(delete(DB_models.category).where(DB_models.category.id == data.id))

        db.commit()
        return models.api_response(success=True, message="Category deleted Successfully")

    except Exception as e:
        db.rollback()  # Revert all changes
        return models.api_response(success=False, message=f"Failed to process: {str(e)}")


@app.post("/add_merchant", response_model=models.api_response)
def add_merchant(data: models.merchant, db: Session = Depends(get_db)):
    try:
        new_merchant = DB_models.merchant(**data.model_dump(exclude_unset=True))
        db.add(new_merchant)
        db.commit()

        return models.api_response(success=True, message="Merchant added successfully.")
    except Exception as e:
        db.rollback()  # Revert all changes
        return models.api_response(success=False, message=f"Failed to processs: {str(e)}")


@app.put("/edit_merchant", response_model=models.api_response)
def edit_merchant(data: models.merchant, db: Session = Depends(get_db)):
    try:
        if not data.id:
            return models.api_response(success=False, message="Merchant id not Found")

        result = db.execute(
            update(DB_models.merchant)
            .where(DB_models.merchant.id == data.id)
            .values(**data.model_dump(exclude_unset=True, exclude={"id"}))
        )

        db.commit()
        if result.rowcount == 0:
            raise HTTPException(404, "Merchant id not found")
        else:
            return models.api_response(success=True, message="Merchant details updated successfully.")

    except Exception as e:
        db.rollback()  # Revert all changes
        return models.api_response(success=False, message=f"Failed to processs: {str(e)}")


@app.delete("/delete_merchant", response_model=models.api_response)
def delete_merchant(data: models.merchant, db: Session = Depends(get_db)):
    try:
        if not data.id:
            raise HTTPException(404, "Merchant Not Found")

        db.execute(delete(DB_models.merchant).where(DB_models.merchant.id == data.id))

        db.commit()
        return models.api_response(success=True, message="Merchant deleted Successfully")

    except Exception as e:
        db.rollback()  # Revert all changes
        return models.api_response(success=False, message=f"Failed to process: {str(e)}")


@app.put("/attach_category", response_model=models.api_response)
def attach_category(data: models.attach_category, db: Session = Depends(get_db)):
    try:
        category_exists = (
            db.execute(select(exists().where(DB_models.category.id == data.category_id)))
            .scalars()
            .first()
        )

        if not category_exists:
            raise HTTPException(404, "Category not found")

        result = db.execute(
            update(DB_models.transaction)
            .where(DB_models.transaction.id.in_(data.tx_ids))
            .values(category_id=data.category_id)
        )

        db.commit()
        msg = ""
        if len(data.tx_ids) == result.rowcount:
            msg = f"All {len(data.tx_ids)} Transactions updated successfully."
        elif result.rowcount > 0:
            msg = "Partial transactions updated successfully. Transactions updated: {result.rowcount}"
        else:
            msg = "No Transactions updated."

        return models.api_response(success=True, message=msg)

    except Exception as e:
        db.rollback()  # Revert all changes
        return models.api_response(success=False, message=f"Failed to process: {str(e)}")