from decimal import Decimal

from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy import exists, select, update
from sqlalchemy.orm import Session

import DB_models
import models
from database import engine, get_db

DB_models.Base.metadata.create_all(bind=engine)
app = FastAPI()


@app.get("/get_all_transaction", response_model=list[models.transaction])
def get_all_transaction(db: Session = Depends(get_db)):
    return db.execute(select(DB_models.transaction)).scalars().all()


@app.get("/get_all_category", response_model=list[models.category])
def get_all_category(db: Session = Depends(get_db)):
    return db.execute(select(DB_models.category)).scalars().all()


@app.get("/get_all_merchant", response_model=list[models.merchant])
def get_all_merchant(db: Session = Depends(get_db)):
    return db.execute(select(DB_models.merchant)).scalars().all()


@app.get("/get_all_label", response_model=models.api_response)
def get_all_label(data: list[models.label], db: Session = Depends(get_db)):
    return db.execute(select(DB_models.label)).scalars().all()


@app.post("/add_raw_transaction", response_model=models.api_response)
def add_raw_transactions(data: list[models.raw_transaction], db: Session = Depends(get_db)):
    try:
        # Get current balance from the DB once
        last_tx = db.execute(
            select(DB_models.transaction).order_by(DB_models.transaction.id.desc())
        ).first()
        current_balance = last_tx.closingBalance if last_tx else Decimal("0.00")

        for raw_tx in data:
            parts = raw_tx.particulars.split("/")
            merchant_particulars = parts[3].strip() if len(parts) > 3 else ""

            # corresponding merchant_id from "label"
            merchant_id = None
            category_id = None
            if merchant_particulars:
                label_entry = db.execute(
                    select(DB_models.label).where(DB_models.label.particulars == merchant_particulars)
                ).first()
                if label_entry:
                    merchant_id = label_entry.merchant_id
                    merchant = db.execute(
                        select(DB_models.merchant).where(DB_models.merchant.id == merchant_id)
                    ).first()
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
                tx_date=raw_tx.tx_date,
                merchant_id=merchant_id,
                category_id=category_id,
                tx_type=tx_type,
                amount=amount,
                openingBalance=opening_balance,
                closingBalance=closing_balance,
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
        return models.api_response(success=False, message=f"Failed to process transactions: {str(e)}")


@app.post("/label_merchant", response_model=models.label)
def label_merchant(data: models.label, db: Session = Depends(get_db)):
    try:
        get_label = db.execute(
            select(DB_models.label).where(DB_models.label.particulars == data.particulars)
        ).first()

        if get_label.merchant_id != data.merchant_id:
            merchant = db.execute(
                select(DB_models.merchant).where(DB_models.merchant.id == get_label.merchant_id)
            ).first()
            return models.api_reponse(
                success=False,
                message=f"Particular is already labelled to {merchant.name}",
            )
        elif (
            db.execute(select(DB_models.merchant).where(DB_models.id == data.merchant_id))
        ).row_count == 0:
            return models.api_reponse(success=False, message="Merchant Does not Exist")
        else:
            new_label = DB_models.label(**data.model_dump(exclude_unset=True))
            db.add(new_label)
            db.commit()
            return models.api_response(success=True, message="Merchant Labelled succesfully.")

    except Exception as e:
        db.rollback()  # Revert all changes
        return models.api_response(success=False, message=f"Failed to process transactions: {str(e)}")


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
        if data.tx_ids.len() == result.row_count:
            msg = "All Transactions updated successfully."
        elif result.row_count > 0:
            msg = "Partial transactions updated successfully. Transactions updated: {result.row_count}"
        else:
            msg = "No Transactions updated."

        return models.api_response(success=True, message=msg)

    except Exception as e:
        db.rollback()
        return models.api_response(success=False, message=f"Failed to process transactions: {str(e)}")


@app.post("/add_category", response_model=models.api_response)
def add_category(data: models.category, db: Session = Depends(get_db)):
    try:
        new_category = DB_models.category(**data.model_dump(exclude_unset=True))
        db.add(new_category)
        db.commit()

    except Exception as e:
        db.rollback()  # Revert all changes
        return models.api_response(success=False, message=f"Failed to process transactions: {str(e)}")


@app.put("/edit_category", response_model=models.api_response)
def edit_category(data: models.category, db: Session = Depends(get_db)):
    try:
        result = db.execute(
            update(DB_models.category)
            .where(DB_models.category.id == data.id)
            .values(**data.model_dump(exclude_unset=True, exclude={"id"}))
        )

        db.commit()
        if result.rowcount == 0:
            raise HTTPException(404, "Category id not found")

    except Exception as e:
        db.rollback()  # Revert all changes
        return models.api_response(success=False, message=f"Failed to process transactions: {str(e)}")


@app.post("/add_merchant", response_model=models.api_response)
def add_merchant(data: models.merchant, db: Session = Depends(get_db)):
    try:
        new_merchant = DB_models.merchant(**data.model_dump(exclude_unset=True))
        db.add(new_merchant)
        db.commit()

    except Exception as e:
        db.rollback()  # Revert all changes
        return models.api_response(success=False, message=f"Failed to process transactions: {str(e)}")


@app.put("/edit_merchant", response_model=models.api_response)
def edit_merchant(data: models.merchant, db: Session = Depends(get_db)):
    try:
        result = db.execute(
            update(DB_models.merchant)
            .where(DB_models.merchant.id == data.id)
            .values(**data.model_dump(exclude_unset=True, exclude={"id"}))
        )

        db.commit()
        if result.rowcount == 0:
            raise HTTPException(404, "Merchant id not found")

    except Exception as e:
        db.rollback()  # Revert all changes
        return models.api_response(success=False, message=f"Failed to process transactions: {str(e)}")


@app.put("/attach_category", response_model=models.api_response)
def attach_category(data: models.attach_category, db: Session = Depends(get_db)):
    try:
        category_exists = db.execute(
            select(exists().where(DB_models.category.id == data.category_id))
        ).scalar()

        if not category_exists:
            raise HTTPException(404, "Category not found")

        result = db.execute(
            update(DB_models.transaction)
            .where(DB_models.transaction.id.in_(data.tx_ids))
            .values(category_id=data.category_id)
        )

        db.commit()
        msg = ""
        if data.tx_ids.len() == result.row_count:
            msg = "All Transactions updated successfully."
        elif result.row_count > 0:
            msg = "Partial transactions updated successfully. Transactions updated: {result.row_count}"
        else:
            msg = "No Transactions updated."

        return models.api_response(success=True, message=msg)

    except Exception as e:
        db.rollback()  # Revert all changes
        return models.api_response(success=False, message=f"Failed to process transactions: {str(e)}")
    pass
