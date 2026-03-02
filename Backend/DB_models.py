from sqlalchemy import Numeric, Date, Column, Integer, String, Boolean, DateTime, ForeignKey
from datetime import datetime
from database import Base

class RawTransactions(Base):
    __tablename__ = "raw_transactions"

    id = Column(Integer, primary_key = True)
    date = Column(Date, nullable = False, index = True)
    particulars = Column(String(100), nullable = False, index = True)
    withdrawal = Column(Numeric(10,2), nullable = True)
    deposit = Column(Numeric(10,2), nullable = True)
    balance = Column(Numeric(10,2), nullable = False)

class category(Base):
    __tablename__ = "category"

    id = Column(Integer, primary_key = True)
    name = Column(String, unique = True, nullable = False)
    ignore = Column(Boolean, nullable = False)
    color = Column(String(10))

class merchant(Base):
    __tablename__ = "merchant"

    id = Column(Integer, primary_key = True)
    name = Column(String, unique = True, nullable = False)
    category_id = Column(Integer, ForeignKey("category.id"), index = True)
    ignore = Column(Boolean, nullable = False)

class Labels(Base):
    __tablename__ = "labels"

    id = Column(Integer, primary_key = True)
    particular = Column(String(50), unique = True, nullable = False)
    merchant_Id = Column(Integer, ForeignKey("merchant.id"), index = True)    

class ProcessedTransactions(Base):
    __tablename__ = "processed_transactions"
    current_balance = 0

    id = Column(Integer, primary_key = True)
    merchant_id = Column(Integer, ForeignKey("merchant.id"), index = True)
    category_id = Column(Integer, ForeignKey("category.id"), index = True)
    transaction_type = Column(String(2), nullable = False) # CR/DR
    remark = Column(String(80))
    ignore = Column(Boolean, nullable = False)
    amount = Column(Numeric(10,2), nullable = False)
    date = Column(Date, index = True, nullable = False)
    openingBalance = Column(Numeric(10,2), nullable = False)
    closingBalance = Column(Numeric(10,2), nullable = False)