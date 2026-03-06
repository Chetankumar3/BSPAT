from datetime import date
from decimal import Decimal
from typing import Annotated, Optional

from pydantic import BaseModel, Field


class api_response(BaseModel):
    success: bool
    message: str
    Warning: Optional[bool] = False


class ignore_transaction(BaseModel):
    tx_ids: list[int]
    ignore: bool


class attach_category(BaseModel):
    tx_ids: list[int]
    category_id: int


class raw_transaction(BaseModel):
    tx_date: date
    particulars: str
    withdrawal: Optional[Annotated[Decimal, Field(max_digits=10, decimal_places=2)]] = None
    deposit: Optional[Annotated[Decimal, Field(max_digits=10, decimal_places=2)]] = None
    balance: Annotated[Decimal, Field(max_digits=10, decimal_places=2)]


class transaction(BaseModel):
    id: Optional[int] = None

    merchant_id: Optional[int] = None
    category_id: Optional[int] = None
    tx_type: bool  # DR: 0/CR: 1
    ignore: Optional[bool] = False
    amount: Annotated[Decimal, Field(max_digits=10, decimal_places=2)]
    tx_date: date
    opening_balance: Annotated[Decimal, Field(max_digits=10, decimal_places=2)]
    closing_balance: Annotated[Decimal, Field(max_digits=10, decimal_places=2)]


class category(BaseModel):
    id: Optional[int] = None
    string_id: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None


class merchant(BaseModel):
    id: Optional[int] = None
    string_id: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    ignore: Optional[bool] = False
    color: Optional[str] = None


class label(BaseModel):
    id: Optional[int] = None
    particulars: Optional[str] = None
    merchant_id: Optional[int] = None
