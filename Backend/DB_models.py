from datetime import date
from decimal import Decimal
from typing import Optional

from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from database import Base  # Make sure 'Base' in this file is DeclarativeBase!


class raw_transaction(Base):
    __tablename__ = "raw_transaction"

    id: Mapped[int] = mapped_column(primary_key=True)
    tx_date: Mapped[date] = mapped_column(index=True)
    particulars: Mapped[str] = mapped_column(String(100), index=True)
    balance: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    
    withdrawal: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2))
    deposit: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2))

    tx_id: Mapped[Optional[int]] = mapped_column(ForeignKey("transaction.id"))

class category(Base):
    __tablename__ = "category"

    id: Mapped[int] = mapped_column(primary_key=True)
    string_id: Mapped[Optional[str]] = mapped_column(String(3), unique=True)
    name: Mapped[str] = mapped_column(unique=True)
    description: Mapped[Optional[str]] = mapped_column(String(100))
    color: Mapped[Optional[str]] = mapped_column(String(10))

class merchant(Base):
    __tablename__ = "merchant"

    id: Mapped[int] = mapped_column(primary_key=True)
    string_id: Mapped[Optional[str]] = mapped_column(String(3), unique=True)
    name: Mapped[str] = mapped_column(unique=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("category.id"), index=True, nullable = False)
    ignore: Mapped[bool] = mapped_column(default=False)
    description: Mapped[Optional[str]] = mapped_column(String(100))
    color: Mapped[Optional[str]] = mapped_column(String(10))

class label(Base):
    __tablename__ = "label"

    id: Mapped[int] = mapped_column(primary_key=True)
    particulars: Mapped[str] = mapped_column(String(50), unique=True)
    merchant_id: Mapped[int] = mapped_column(ForeignKey("merchant.id"), index=True)    

class transaction(Base):
    __tablename__ = "transaction"    
    current_balance: float = 0.0

    id: Mapped[int] = mapped_column(primary_key=True)
    particulars: Mapped[str] = mapped_column(String(50))
    tx_date: Mapped[date] = mapped_column(index=True)
    merchant_id: Mapped[Optional[int]] = mapped_column(ForeignKey("merchant.id"), index=True)
    category_id: Mapped[Optional[int]] = mapped_column(ForeignKey("category.id"), index=True)
    tx_type: Mapped[bool] = mapped_column() # DR = 0/CR = 1
    ignore: Mapped[bool] = mapped_column(default=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    openingBalance: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    closingBalance: Mapped[Decimal] = mapped_column(Numeric(10, 2))